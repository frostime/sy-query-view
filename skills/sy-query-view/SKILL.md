---
name: sy-query-view
description: >-
  Help write, understand, and verify Query&View (sy-query-view) JavaScript
  embedded blocks for SiYuan: SQL and wrapped queries through the Query API,
  DataView rendering, and adapting the plugin's shipped examples. Use when the
  user asks for help with Query&View code, Query View, JS embedded blocks, or
  the qv-basic template.
---

# Query&View Code Assistant

## 1. Purpose and scope

This skill helps the user write, understand, and verify **Query&View** JavaScript
embedded blocks in SiYuan. Query&View is a SiYuan plugin that extends JS
embedded blocks with a `Query` API and a `DataView` renderer.

In scope:

- Writing and adapting `//!js` embedded block code (queries and DataView views).
- Explaining the Query API, DataView, and the wrapped block/list types.
- Adapting the plugin's shipped examples instead of inventing code.

Out of scope — do not claim or attempt:

- Installing, enabling, or invoking this skill or the plugin.
- Writing into the user's notes (creating/updating help notes or any other
  blocks) on your own initiative.
- Using files under a `references/` directory: **no `references/` material is
  assumed to be readable** in this version. Everything needed is inline here.

## 2. How a Query&View embedded block works

Grounded facts (sources: `public/example/basic-template.js`, `public/types.d.ts`):

- An embedded block whose content starts with `//!js` is executed as JavaScript
  by SiYuan.
- The code receives three variables: `protyle` (the document's Protyle object),
  `item` (the embedded block's HTML element), and `top` (an opaque marker;
  usually ignore it).
- Async code must be wrapped in an `async` function and invoked, e.g.
  `return query();`.
- Two output modes:
  1. **Return block IDs**: return a `BlockID[]` (e.g. `blocks.pick('id')`);
     SiYuan renders those blocks into the embedded block.
  2. **Render with DataView**: create `Query.DataView(protyle, item, top)`,
     add views with `dv.addlist(...)` / `dv.addtable(...)` / `dv.addmd(...)`,
     and finish with `dv.render()` — do **not** return IDs in this mode.

## 3. Working workflow

1. **Clarify the goal**: what data does the user want (SQL query, backlinks,
   tags, tasks, documents...), and how should it be displayed (plain block
   list, DataView list/table/markdown, chart)?
2. **Start from the minimal template or a close example**: never write from
   scratch when a shipped example already matches. The minimal template is
   inline in section 4; shipped examples are listed in section 6.
3. **Verify API details before writing**: if you can read the plugin's shipped
   `public/types.d.ts` (or the docs site's API reference), use it for exact
   signatures and exact names. Prefer `Query.sql`, `Query.backlink`,
   `Query.tag`, `Query.task`... over raw `request()` calls.
4. **Produce a single copy-pasteable `//!js` block**, matching the user's
   language of choice only in comments — identifiers and API names stay exact.
5. **Explain how to verify and iterate** (section 7), and let the user paste
   and run the block themselves.

## 4. Minimal skeleton

Based on `public/example/basic-template.js` (the authoritative template also
inserted by the `/qv` slash menu):

```js
//!js
const query = async () => {
    //To use DataView, uncomment the following line
    //let dv = Query.DataView(protyle, item, top);

    const SQL = `
        select * from blocks
        order by random()
        limit 5;
    `;
    let blocks = await Query.sql(SQL);

    return blocks.pick('id');
    //To use DataView, comment out the above return and uncomment the following two lines
    //dv.addlist(blocks);
    //dv.render();
}

return query();
```

To render a DataView instead: comment out `return blocks.pick('id');`,
uncomment the DataView lines, and end with `dv.render();`.

## 5. Core API facts (exact names from `public/types.d.ts`)

**Query object** (async methods return Promises; `Query.DataView` and
`Query.Utils` are sync — return types vary per method, check the type
declaration for exact signatures):

- `Query.sql(sqlString, wrap?)` — run a SiYuan SQL query; returns
  `Promise<IWrappedList<IWrappedBlock>>` (the common wrapped-list result).
- Wrapped queries that also return `Promise<IWrappedList<IWrappedBlock>>`:
  `Query.backlink(id, limit?)`, `Query.tag(tags, options?)`,
  `Query.task(options?)`, `Query.random(limit?, type?)`,
  `Query.dailynote(options?)`, `Query.keyword(words, options?)`.
- Other return shapes: `Query.childDoc(b)` → `Promise<Block[]>`;
  `Query.keywordDoc(words, options?)` → `Promise<Block[]>` (documents that
  contain all the given keywords, with a `keywords` property per document);
  `Query.markdown(input)` → `Promise<any>` (the block's markdown content; the
  declaration does not pin a more specific type); `Query.thisDoc(protyle)` →
  `Promise<IWrappedBlock>` (the current document).
- Utilities: `Query.Utils.today()`, `Query.Utils.thisMonth()`, `Query.Utils.now()`
  (all sync; more under `Utils`). `Query.request(url, data)` is the raw kernel
  API — prefer the wrapped functions.
- `Query.DataView(protyle, item, top)` — create a renderer (see below); this
  call is sync and returns a `DataView`.
- `Query.pruneBlocks(blocks, keep?, advanced?)` — merge parent/child block
  duplicates from keyword search results; returns `Promise<Block[]>`.
- `Query.fb2p(inputs, enable?)` — redirect container-block references; returns
  `Promise<Block[]>` (runtime alias `Query.redirect`).

**DataView instance** (`dv`):

- `dv.addlist(children, options?)` / `dv.addtable(children, { cols, ... })` /
  `dv.addmd(markdown)` — basic views.
- `dv.cards(blocks, options?)` — card view.
- `dv.useState(key, initialValue?)` — persist state across renders.
- `dv.addElement(el, disposer?)`, `dv.removeView(id, beforeRemove?)`,
  `dv.replaceView(id, viewContainer, disposer?)`, `dv.addDisposer(fn, id?)`,
  `dv.repaint()`, `dv.render()`.

**Wrapped blocks/lists**:

- `IWrappedBlock` adds conveniences over a `Block`, e.g. `b.aslink`
  (SiYuan link), `b.asurl`, `b.asref`.
- `IWrappedList` is an array of wrapped blocks with `list.pick('id')` (extract
  attributes into a new list) and `list.asMap(key)`.

**Names: canonical, aliases, unsupported** (grounded in the plugin source
`src/core/query.ts` alias registration and `src/core/data-view.ts`):

- Prefer the canonical names from the type declaration: `Query.DataView`,
  `Query.Utils`, `Query.pruneBlocks`, `Query.fb2p`, `dv.removeView`,
  `dv.replaceView`, `dv.cards`, `dv.repaint`.
- The runtime registers these as **supported aliases** (some older shipped
  examples use them; new code should prefer the canonical spellings):
  `Query.Dataview` (= `Query.DataView`), `Query.utils` (= `Query.Utils`),
  `Query.prune` (= `Query.pruneBlocks`), `Query.redirect` (= `Query.fb2p`),
  and the lowercase `dv.removeview` / `dv.replaceview` (most Query members also
  get lowercase aliases at runtime).
- The `add*` view conveniences (`dv.addlist`, `dv.addtable`, `dv.addmd`) are
  runtime-registered; the type declaration declares the underlying methods as
  `dv.list`, `dv.table`, `dv.markdown` (`dv.md` is an alias).
- `Query.fb` is **not registered or documented**: it does not work. If you see
  it in old code, use the canonical `Query.fb2p` (runtime alias
  `Query.redirect`).

## 6. Adapting shipped examples

The plugin ships runnable examples in `public/example/exp-*.js`. Prefer the
closest one and adapt it. Useful starting points (grounded in the shipped
files):

- `exp-doc-backlinks-table.js` — backlinks of the current document in a table
  (`Query.backlink` + `dv.addtable`).
- `exp-sql-executor.js` — interactive SQL input executed with `Query.sql`.
- `exp-list-tags.js` — tags in a card view.
- `exp-month-todo.js` — unfinished TODOs with `Query.task`.
- `exp-today-updated.js` — documents updated today, with `dv.useState`.
- `exp-created-docs.js` — a line chart of documents created per month.
- `exp-gpt-chat.js` — a simple GPT chat (uses `Query.gpt`).

When adapting: keep the query/rendering structure, change only what the goal
requires, and keep exact API names from section 5.

## 7. Verification and iteration

- The user pastes the `//!js` block into an embedded block and runs it; the
  block renders the result or shows nothing if it fails.
- Check the SiYuan console for errors (note: errors inside the `Function`
  wrapper may not surface as normal exceptions — ask the user to look at the
  console).
- Suggest a minimal change per iteration; never silently rewrite a whole block.
- For exact signatures, point the user to the docs site's "API Reference" page
  or the shipped `public/types.d.ts`.

## 8. Safety boundaries

- **Never modify existing user blocks or notes without explicit permission.**
  The user pastes and runs code themselves; this skill only produces code and
  explanations.
- **Ask first** when the request involves: writing/updating/deleting note
  content, external network calls (e.g. GPT or arbitrary HTTP APIs), unknown
  or undocumented SiYuan APIs, or anything destructive (e.g. batch updates).
- Do not fabricate API names or behaviors: every API mentioned above is
  grounded in the shipped type declaration, template, or examples. If a needed
  API is not in section 5 and you cannot read the type declaration, say so
  instead of guessing.
- This skill is guidance only: it does not install itself, does not load the
  documentation site, and makes no promise about how SiYuan loads skill files.
