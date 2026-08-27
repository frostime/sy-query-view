---
name: sy-query-view
description: Write, adapt embedded blocks for the Query&View (sy-query-view, qv) SiYuan plugin, it offers Query API for queries and DataView for rendering. Use when the user asks for help writing Query and View code, and JS embedded blocks for querying and visualizing.
---

# Query&View Code Assistant

## 0. Prerequisites — check before writing code

Before writing or adapting Query&View code, require all of the following. If any is missing, tell the user what to enable or install and stop:

1. **The sy-query-view plugin is enabled.** Otherwise `Query` and `DataView` do not exist in embedded blocks.
2. **The agent can read files** (`file.read`, and `file.list` if available). The bundled references live in `references/` next to this `SKILL.md`; without file tools, ask the user to use the plugin's docs site instead.
3. **SiYuan 3.8.0 or newer.** The examples use top-level `await`. Ask the user to upgrade if necessary, or use the legacy wrapper only with explicit consent: `const query = async () => { ... }; return query();`.

## 1. What Query&View is

The plugin extends SiYuan JS embedded blocks. A block starting with `//!js` runs as JavaScript and receives `protyle`, `item`, and `top`. It injects a global `Query` API for SQL, keyword, backlink, task, and related queries, plus a `DataView` renderer. Choose exactly one output mode:

- **Return mode:** return `BlockID[]`; SiYuan renders those blocks in place.
- **DataView mode:** create `Query.DataView(protyle, item, top)`, build a view, and finish with `dv.render()`; do not return IDs.

## 2. How to write a Query&View block

### 2.1 Readable draft form

Mimimal Example is given here.

Dataview mode:

```js
//!js
let dv = Query.DataView(protyle, item, top);  // delete this line in return mode
let blocks = await Query.sql(`select * from blocks order by random() limit 5`);
dv.addlist(blocks);  // or addtable / addmd — see §3.2
dv.render();         // delete this line in return mode
```

Return mode:

```js
//!js
let blocks = await Query.sql(`select * from blocks order by random() limit 5`);
return blocks.pick('id');
```

Rules:

- `//!js` must be the first line.
- `protyle`, `item`, and `top` are already available; never invent or redefine them.
- Top-level `await` is valid on SiYuan 3.8.0+.
- Use `=>`, not the HTML entity `=&gt;`.

### 2.2 Delivery form

**Case A — the user pastes the code:** return readable multi-line code.

**Case B — the agent writes into the user's SiYuan notes:** use one `{{...}}` line. Replace each newline with `_esc_newline_`; multi-line `{{...}}` does not parse. Explain this mapping when the user will maintain the block by hand.

Example:

````
{{//!js_esc_newline_let dv = Query.DataView(protyle, item, top);_esc_newline_let blocks = await Query.sql(`_esc_newline_    select * from blocks order by random() limit 5;_esc_newline_`);_esc_newline_dv.addlist(blocks);_esc_newline_dv.render();}}
````

## 3. What to put inside the block

### 3.1 Queries

Match the user's intent to an API and verify its exact signature in `references/query-api.md` before writing:

| Intent (example) | API |
|---|---|
| arbitrary SQL | `Query.sql(sql)` |
| document backlinks | `Query.backlink(protyle.block.rootID)` |
| keyword search | `Query.keyword(words)` + `Query.pruneBlocks` |
| tasks / TODO | `Query.task(options)` |
| random blocks | `Query.random(limit)` |
| today's updated docs | `Query.sql` with `Query.Utils.today()` |

These are calibration examples, not an exhaustive map. For other intents, scan `query-api.md`, which groups Query members by signature, return shape, and aliases. Prefer wrapped Query APIs over raw kernel calls.

For the SQL side itself (table schemas, query patterns, path/daily-note semantics), read the vendored SiYuan platform notes under `references/siyuan/` (see §6).

`Query.sql(sql)` defaults to a wrapped list in the source shipped with this skill. If the running installation returns a plain array, call `Query.wrapBlocks(rows)` before using `.pick`, `.sorton`, or other wrapped-list methods; treat that as a runtime bundle/version mismatch. Passing `false` explicitly returns a plain array.

### 3.2 Rendering

- Use `dv.addlist`, `dv.addtable`, or `dv.addmd` for ordinary block lists, tables, and markdown; see `references/dataview.md` for options.
- Bare component methods such as `dv.cards`, `dv.details`, `dv.embed`, `dv.mermaid(code)`, and the `dv.echarts...` family return an element but do **not** mount it. Use the matching `add...` alias (for example, `dv.addcards`, `dv.adddetails`, `dv.addembed`, `dv.addechartsBar`, or `dv.addeline`) or call `dv.addElement(...)` yourself.
- `dv.details(summary, content)` inserts `summary` and string `content` as **raw HTML, not markdown**; do not pass untrusted text.
- `dv.render()` is not pure rendering: it persists the embed block. Build a static view first and call it once at the end, not in loops or hot paths.
- Do not write advanced machinery by default: `dv.addElement`, `dv.columns`/`dv.rows`, `dv.removeView`/`dv.replaceView`, and custom view registration. If the user insists, read `/data/plugins/sy-query-view/docs/en_US/topics/dataview-advanced.md`.
- Write `dv.useState` only on explicit request. Follow `references/dataview.md`, the advanced topic, and the cautions in §7 exactly.

`references/dataview.md` also contains `dv.cards` options, the `dv.useState` reference, and component option tables.


## 4. Cautious

Query and View can execute arbitrary JavaScript in the user's active SiYuan environment, call the kernel API, and modify user data. Therefore, the highest level of safety awareness must be maintained.

- NEVER use `document` to bypass the guardrails of query view to access the external DOM space that belongs to SiYuan Note.
- `Query.request` calls SiYuan kernel API, SHOULD NOT call non-readonly API without user permission.
- Do not fabricate API names or behavior. If the needed member is absent from `references/query-api.md` and the type declaration is unreadable, say so instead of guessing.
- Treat DataView primarily as a read-only dashboard. Avoid input-heavy or highly interactive controls: SiYuan also handles user-input events, and DataView suppresses only a limited set of event propagation.
- Avoid timers, observers, subscriptions, and event listeners attached outside the DataView-owned DOM unless they are required. Register the matching cleanup with `dv.addDisposer(...)` or the disposer accepted by `dv.addElement(...)`; for example, call `clearTimeout`, `clearInterval`, `disconnect`, or `removeEventListener`. A custom registered view that creates side effects must return its own `dispose` function.
- Use `dv.useState` only when the user explicitly requests persistent state. It is experimental: updates are cached in `sessionStorage` and flushed to custom block attributes later, not persisted on every change. Store only JSON-serializable values, do not treat it as durable real-time storage, and do not mutate it unconditionally during rendering. Multi-device synchronization may still cause conflicts or state loss; warn the user and read the advanced topic before writing such code.
- `dv.repaint()` performs a full teardown and rerun, not a local component update. For a simple content change, update the existing element directly.
- When one rendered component must be rebuilt, prefer `dv.replaceView(id, newView)` with an unmounted component such as `dv.md(...)`, not an `add...` call; this keeps the rest of the DataView intact and runs the replaced component's disposer. Use `dv.repaint()` only when the entire embedded block must be re-executed.

## 5. Reference file map (read on demand)

**Bundled References**

Current SKILL is at `data/storage/ai/agent/skills/sy-query-view/SKILL.md`. The bundled references are installed next to this `SKILL.md`. Read the narrowest matching file first. Use `file.list / file.read` to load reference file.

| Need | Read |
|---|---|
| `Query.*` signature or alias | `references/query-api.md` |
| DataView component or options | `references/dataview.md` |
| wrapped result processing (`pick`, `sorton`, `filter`, `slice`, `groupby`, ...) | `references/wrapped.md` |
| shared option or data type | `references/types.md` |
| SQL tables (`blocks`, `refs`, `attributes`, `assets`, `spans`) and query patterns | `references/siyuan/sql-query-guide.md` |
| block types, fields, attributes, Markdown extensions | `references/siyuan/siyuan-block.md` |
| id / path / hpath resolution | `references/siyuan/document-tree-and-paths.md` |
| daily notes | `references/siyuan/dailynote-model.md` |

For a specific question, `grep` the exact member and read the nearby section. Read a whole reference only when the task is genuinely open-ended, such as choosing among many components.

If the bundled references are insufficient, use these fallbacks in order:

**Local source bundled with this skill:** `references/source/query.ts` for Query implementations and aliases, and `references/source/proxy.ts` for wrapped list/block behavior. These are authoritative for those members only.

**Installed plugin docs and files:**
`/data/plugins/sy-query-view/docs/en_US/examples/index.md` to choose an example, then `/data/plugins/sy-query-view/example/exp-*.js` for its code;
`/data/plugins/sy-query-view/docs/en_US/topics/query.md` and `/data/plugins/sy-query-view/docs/en_US/topics/dataview.md` for richer explanations;
`/data/plugins/sy-query-view/docs/en_US/topics/dataview-advanced.md` for `useState`, custom views, raw DOM, or lifecycle

If no authoritative source is readable, say so instead of guessing.
