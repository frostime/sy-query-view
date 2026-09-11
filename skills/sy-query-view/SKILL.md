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

If the host exposes the plugin's `debug-qv.view` tool, use it to verify a block you wrote into the user's notes: given the block ID, it returns the rendered DataView output and the host output separately (the latter usually carries the script error). The containing document must be open. Without it, you cannot confirm a block actually rendered — say so instead of assuming success.

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
dv.addlist(blocks);  // or addtable / addmd — see §3.3
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

### 3.1 Choosing and bounding the query

Pick the API from `references/query-api.md` and verify its exact signature there before writing; it groups Query members by signature, return shape, and aliases. Prefer wrapped Query APIs (`Query.sql`, `Query.keyword`, `Query.task`, `Query.backlink`, `Query.random`, ...) over raw `Query.request` kernel calls.

For the SQL side itself (table schemas, query patterns, path/daily-note semantics), read the vendored SiYuan platform notes under `references/siyuan/` (see §5).

**Always bound a query with an explicit `LIMIT`.** SiYuan caps SQL results by a user setting (64 when untouched), so relying on the default means results are truncated by configuration rather than by intent.

These needs map to an API you would not guess from the intent alone:

| Need / symptom | Reach for |
|---|---|
| results contain redundant containers and their child blocks | `Query.pruneBlocks(blocks)`, `keep: 'leaf'` (default) or `'root'` |
| links resolve to a container's first child instead of the container | `Query.fb2p(blocks)` (alias `redirect`) |
| date-bounded query (today, this week, offset like 7 days ago) | `Query.sql` + `Query.Utils.today()` / `thisWeek()` / `now('-7d')` |
| document backlinks | `Query.backlink(protyle.block.rootID)` |
| the markdown body of a block | `Query.markdown(block)` — document and heading blocks include their child blocks |

### 3.2 Shaping results and supporting helpers

Query APIs return a **wrapped list**, not a plain array. It carries post-processing methods — use them instead of hand-written `map`/`reduce`:

- list level: `pick`, `omit`, `sorton`, `toSorted`, `groupby`, `filter`, `slice`, `unique`, `asMap`, `addrow`/`addcol`/`stack`, `unwrap`
- block level (each block inside): `aslink`, `asref`, `asurl`, `attr`, `asial`, `updatedDate`, `createdDate`, `updatedDatetime`, ...

Pass `false` as the second argument to `Query.sql` when a plain array is genuinely wanted; `Query.wrapBlocks(rows)` wraps one after the fact. Full member list in `references/wrapped.md`.

`Query.Utils` covers the conversions worth not hand-rolling: SiYuan formats (`asLink`, `asRef`, `asMap`), raw field to readable value (`notebook`, `boxName`, `typeName`, `docIcon`, `emoji`), and time (`now`, `today`, `thisWeek`, `thisMonth`, `asDate`). Every `Utils` function is synchronous. `Query.docStat(docId)` returns per-document counts (words, blocks, refs, links, images) for dashboard-style views.

### 3.3 Rendering

- `dv.addmd` is the workhorse: anything you can assemble into a markdown string renders through it. `dv.addlist` and `dv.addtable` cover block lists and tables; options are in `references/dataview.md`.
- **Every component method `X` has a generated `dv.addX` that mounts it; the bare `dv.X` returns an unmounted element.** Calling the bare form and forgetting to mount renders nothing and raises no error. Name variants are case-insensitive (`dv.addlist` = `dv.addList`), and each alias gets its own `add` form (`dv.addeline` for `echartsLine`).
- `dv.addElement(ele, disposer?)` (alias `dv.addele`) is the normal way to mount a raw or hand-built element. A **static, display-only** element is safe. Once it carries events, timers, or observers, pass the cleanup as the second argument (or register `dv.addDisposer`) — see §4.
- Read `references/dataview.md` before using `dv.columns`/`dv.rows` or custom view registration.
- **To update a view after it is built, replace one component — do not re-run the block.** `add...` returns the mounted container, so keep its `dataset.id` and later call `dv.replaceView(id, dv.md(...))` with an **unmounted** component (`dv.md`, `dv.table`, ... — not `dv.addmd`); the id stays stable, so the same id can be replaced repeatedly. `dv.removeView(id)` drops one. Both run the replaced view's disposer for you.

  ```js
  const view = dv.addmd('Loading...');
  const id = view.dataset.id;
  button.onclick = () => dv.replaceView(id, dv.md(`Picked: ${value}`));
  ```

- `dv.repaint()` is the opposite trade: it disposes the DataView and re-runs the entire block, so every query runs again and the `dv` instance is gone. Use it only when the whole block must re-execute, and keep anything that must survive in `dv.useState`. See §4.
- `dv.details` renders raw HTML, and `dv.useState` needs explicit user request; §4 covers both.
- `dv.render()` finishes the view and persists the embed block. Call it exactly once, never inside a loop or hot path.

`references/dataview.md` also contains `dv.cards` options, the `dv.useState` reference, and component option tables.


## 4. Cautious

Query and View can execute arbitrary JavaScript in the user's active SiYuan environment, call the kernel API, and modify user data. Therefore, the highest level of safety awareness must be maintained.

- NEVER use `document` to bypass the guardrails of query view to access the external DOM space that belongs to SiYuan Note.
- `Query.request` calls SiYuan kernel API, SHOULD NOT call non-readonly API without user permission.
- `dv.details(summary, content)` inserts `summary` and string `content` into `innerHTML` as **raw HTML, not markdown** (and defaults to `open=true`). Do not pass untrusted or user-supplied text through it; wrap such text with `dv.md(...)` and pass the element instead.
- Do not fabricate API names or behavior. If the needed member is absent from `references/query-api.md` and the type declaration is unreadable, say so instead of guessing.
- Treat DataView primarily as a read-only dashboard. Avoid input-heavy or highly interactive controls: SiYuan also handles user-input events, and DataView suppresses only a limited set of event propagation.
- Avoid timers, observers, subscriptions, and event listeners attached outside the DataView-owned DOM unless they are required. Register the matching cleanup with `dv.addDisposer(...)` or the disposer accepted by `dv.addElement(...)`; for example, call `clearTimeout`, `clearInterval`, `disconnect`, or `removeEventListener`. A custom registered view that creates side effects must return its own `dispose` function.
- Use `dv.useState` only when the user explicitly requests persistent state. It is experimental: updates are cached in `sessionStorage` and flushed to custom block attributes later, not persisted on every change. Store only JSON-serializable values, do not treat it as durable real-time storage, and do not mutate it unconditionally during rendering. Multi-device synchronization may still cause conflicts or state loss; warn the user and read the advanced topic before writing such code.
- `dv.repaint()` disposes the DataView and re-runs the whole embedded block (it clicks the reload button). Every disposer fires, internal references are cleared, and the `dv` instance must not be touched afterward — do not schedule work that uses `dv` after calling it. Prefer the local update path in §3.3.
- When replacing a view, do not attach the same disposer twice: `dv.replaceView(id, view, disposer)` merges with any disposer already registered for that container, so passing it in both places runs it twice.

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
