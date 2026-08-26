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

Start from this skeleton and adapt it:

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
- Top-level `await` is valid on SiYuan 3.8.0+. Do not use the legacy wrapper unless explicitly targeting an older version.
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
- Write `dv.useState` only on explicit request; it persists state in block attributes and has side effects that are difficult to verify. Follow `references/dataview.md` and the advanced topic exactly.

`references/dataview.md` also contains `dv.cards` options, the `dv.useState` reference, and component option tables.

## 4. Workflow

1. Clarify the data and display goal (plain blocks, list/table/markdown, or chart).
2. Choose a nearby example from `/data/plugins/sy-query-view/docs/en_US/examples/index.md`, then read its code from `/data/plugins/sy-query-view/example/exp-*.js` (`public/example/` in the repository); use `file.list` when available.
3. Verify the exact API details before writing. For a specific target, grep the matching member in the narrowest reference file and read its section; if the signature remains ambiguous, grep `/data/plugins/sy-query-view/types.d.ts` (`public/types.d.ts` in the repository) instead of reading the whole file.
4. Return one copy-pasteable block in the form required by §2.2, with comments in the user's language if useful.
5. Hand it over for the user to run and ask them to check the SiYuan console; embedded-block errors may not surface as ordinary exceptions. Iterate with minimal changes.

## 5. Safety boundaries

- Never modify the user's notes or blocks without an explicit request. Case B is allowed only for that request.
- Ask first before external HTTP requests (`Query.gpt` is the only such API), destructive operations such as mass deletion, or undocumented APIs. `Query.request` calls SiYuan kernel APIs; it is not arbitrary HTTP.
- Do not fabricate API names or behavior. If the needed member is absent from `references/query-api.md` and the type declaration is unreadable, say so instead of guessing.
- This skill does not install, enable, or invoke the plugin, and does not promise how SiYuan loads skill files.

## 6. Reference file map (read on demand)

The bundled references are installed next to this `SKILL.md`. Read the narrowest matching file first:

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

For a specific question, grep the exact member and read the nearby section. Read a whole reference only when the task is genuinely open-ended, such as choosing among many components.

If the bundled references are insufficient, use these fallbacks in order:

1. **Installed plugin docs and files:** `/data/plugins/sy-query-view/docs/en_US/examples/index.md` to choose an example, then `/data/plugins/sy-query-view/example/exp-*.js` for its code; `/data/plugins/sy-query-view/docs/en_US/topics/query.md` and `/data/plugins/sy-query-view/docs/en_US/topics/dataview.md` for richer explanations; `/data/plugins/sy-query-view/docs/en_US/topics/dataview-advanced.md` for `useState`, custom views, raw DOM, or lifecycle; grep `/data/plugins/sy-query-view/types.d.ts` for an exact symbol type (`public/types.d.ts` in the repository).
2. **Local source bundled with this skill:** `references/source/query.ts` for Query implementations and aliases, and `references/source/proxy.ts` for wrapped list/block behavior. These are authoritative for those members only.

If no authoritative source is readable, say so instead of guessing.
