# DataView Reference (agent reference)

`DataView` renders query results as custom views inside the embedded block.
This file is the authoritative quick reference: every component, its exact
signature, behavior-relevant details, and a minimal example. Tutorials with
screenshots live in `docs/en_US/topics/dataview.md`.

**Deeper dive**: the tutorials `docs/en_US/topics/dataview.md` and
`docs/en_US/topics/dataview-advanced.md` explain the same components with
screenshots and more context — but they are user-oriented and verbose.
Load them **only when you do not understand the usage details of a
specific component at all** despite this reference.

## Lifecycle — the mandatory skeleton

```js
//!js
let dv = Query.DataView(protyle, item, top);   // 1. create (sync)
dv.addlist(blocks);                            // 2. add views (any number)
dv.render();                                   // 3. MUST be the last call
```

- `protyle`, `item`, `top` are injected always; never redefine them.
- DataView mode and return mode are exclusive: in DataView mode do **not**
  `return` anything.
- The embedded block **re-executes** the whole code on open/refresh — keep
  side effects in `addDisposer`, not at top level.
- `dv.root_id` / `dv.embed_id` — ids of the enclosing doc / embed block.
- `dv.repaint()` — re-run the entire block (same as clicking reload).

## Component registration rules (affect every component below)

- Every component has a canonical method (`dv.markdown`, `dv.list`, ...) and
  an `add`-prefixed variant (`dv.addmarkdown`, `dv.addlist`, ...).
- `dv.xxx(...)` **creates the element and returns it WITHOUT adding**;
  `dv.addxxx(...)` **creates, adds to the view, and returns the container**
  (prefer `addxxx`).
- Each component also gets aliases and lowercase aliases: `dv.md` =
  `dv.markdown`; `dv.addmd` = `dv.addmarkdown`. The full alias table is in
  the tutorial; exact registration lives in `src/core/data-view.ts`
  (`register()` calls) — when in doubt, grep there.
- Returned containers carry `data-id` (needed by `removeView`/`replaceView`):
  `const id = dv.addmd('# hi').dataset.id;`

## Basic components

**`dv.addmd(markdown: string) → HTMLElement`** — render markdown text. Aliases `dv.md`, `dv.addmarkdown`.

- Accepts SiYuan-flavored markdown (block quotes, `{{{col}}}` multi-column
  syntax, IAL `{: style=...}`), including template literals.
- ⚠️ Does **not** support content needing extra rendering (math formulas).

**`dv.addlist(data, { type?: 'u'|'o', columns?: number, renderer?: (b) => string|number|null|undefined })`** — list of blocks. Defaults: `type: 'u'`, no columns.

- `data` accepts `IWrappedList<IWrappedBlock>`, plain `Block[]`, `ScalarValue`
  items, or blocks carrying a `children` array (`IBlockWithChilds`) — the
  presence of `children` renders a **nested list**.
- `renderer` return value is treated as **markdown** for the item; return
  `null`/`undefined` to fall back to the default block-link rendering.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let docs = await Query.sql(`select * from blocks where type='d' limit 5`);
dv.addlist(docs, { type: 'o', columns: 2, renderer: (b) => b.hpath });
dv.render();
```

**`dv.addtable(blocks, { center?, fullwidth?, index?, cols?, renderer? })`** — table of blocks. Aliases `dv.addtable`, `dv.addBlockTable`.

- `cols: null` → all columns; an array of attribute names (`['content','hpath','updated']`); or `{type: 'Type', content: 'Content'}` renames headers.
- Default columns come from the plugin settings.
- Cells auto-render: `type` → type name, `hpath` → doc hyperlink, `box` →
  notebook name. `renderer: (b, key) => markdown|null` overrides per column
  (return `null` for default).
- `center`/`fullwidth`/`index` are pure styling (row numbers, width).

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.backlink(protyle.block.rootID);
dv.addtable(blocks, { cols: ['content', 'hpath'], fullwidth: true });
dv.render();
```

## Encapsulated components (pass data/config — safe)

**`dv.addcards(blocks, { cardWidth?, cardHeight?, fontSize? })`** — card wall. Defaults `175px` / `175px` / `14px`. Each card: bold title (block-type icon + `block.content`, or "(No content)" when empty) — **clicking the title jumps to the block**; below it metadata rows: notebook name + `hpath` path, and created/updated timestamps.

**`dv.addembed(blocks, { breadcrumb?, limit?, columns?, zoom? })`** — embed blocks like a mini embedded block. Params: `limit` (max blocks), `zoom` (0–1, 1 = none), `columns` (multi-column), `breadcrumb`. Each card has a jump icon.

**`dv.adddetails(summary: string, content: string | HTMLElement)`** — collapsible `<details>` block.

- ⚠️ **Default open** (`details.open = true`) — if you expect a collapsed
  panel, this is counter-intuitive.
- ⚠️ A **string** `content` is inserted into the element as raw `innerHTML`
  (not parsed as markdown, no escaping) — HTML tags work, but escape
  user-provided text yourself; pass an `HTMLElement` (e.g. `dv.list(...)`
  result) for safe content.

**`dv.addmermaid(code: string)`** — render mermaid from a code string.

**`dv.addmermaidRelation(tree, { type?: 'flowchart'|'mindmap', flowchart?: 'TD'|'LR', renderer? })`** — relation diagram from a block tree (`IBlockWithChilds`, same shape as nested list). Node blocks are hoverable/clickable. Convenience twins: `dv.addmflowchart`, `dv.addmmindmap`.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let root = await Query.thisDoc(protyle);
let kids = await Query.childDoc(protyle.block.rootID);
for (let k of kids) k.children = await Query.childDoc(k.id);
root.children = kids;
dv.addmermaidRelation(root, { type: 'flowchart', flowchart: 'LR' });
dv.render();
```

**`dv.addmermaidKanban(grouped: Record<string, Block[]>, { priority?, clip?, width? })`** — kanban board. `grouped` = `{groupName: blocks}` → one column per group. `clip` truncates item text (default 50); `width` recommended as `<#groups> x <colWidth>` (e.g. `N * 200 + 'px'`). Alias `mkanban`.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.task(null, 128);
let grouped = blocks.groupby((b) => b.createdDate.slice(0, -3));
dv.addmkanban(grouped, { width: `${Object.keys(grouped).length * 200}px` });
dv.render();
```

**`dv.addecharts(echartOption, { height?='300px', width?='100%', events? })`** — any echarts chart from a raw option object (https://echarts.apache.org/option.html). Default renderer: svg (canvas via plugin settings).

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addecharts({
  xAxis: { type: 'category', data: ['Mon','Tue','Wed'] },
  yAxis: { type: 'value' },
  series: [{ data: [820, 932, 901], type: 'line' }]
});
dv.render();
```

**`dv.addechartsLine(x: (number|string)[], y: number[] | number[][], { title?, xlabel?, ylabel?, legends?, height?, width?, seriesOption?, echartsOption? })`** — line chart (`y` arrays = multiple series, use `legends` to name them). Alias `eline`.

Common x/y source: `blocks.pick('month')` / `blocks.pick('count')` after a
GROUP BY SQL — values stay strings, which echarts accepts.

**`dv.addechartsBar(...same + { stack?: boolean })`** — bar chart (`stack: true` piles the series). Alias `ebar`.

**`dv.addechartsTree(data: ITreeNode | IBlockWithChilds, { orient?: 'LR'|'TB', layout?: 'orthogonal'|'radial', roam?, symbolSize?=14, labelFontSize?=16, title?, tooltipFormatter?, seriesOption?, echartsOption? })`** — tree chart. You may pass a block tree with `children` directly (like mermaidRelation). Nodes interactive (Ctrl+click jumps, hover previews). Alias `etree`.

**`dv.addechartsGraph(nodes: (IGraphNode | Block)[], links: {source: id, target: id | id[]}[], { layout?: 'force'|'circular', roam?, symbolSize?=14, labelFontSize?=16, nodeRenderer?, tooltipFormatter?, seriesOption?, echartsOption? })`** — network graph. Alias `egraph`.

- **Nodes**: pass queried `Block[]` directly (ids auto-extracted); assign
  categories with `blocks.addcols({category: 0})` and style per category via
  `seriesOption.categories`.
- **Links**: you build them — `{ source: thisdoc.id, target: childs.pick('id') }`.
  ⚠️ `target` may be an **array** of ids (extension over raw echarts).
- Interactive like the tree; `roam: true` enables pan/zoom.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisDoc(protyle);
let childs = await Query.childDoc(dv.root_id);
let backlinks = await Query.backlink(dv.root_id);
childs = childs.addcols({ category: 0 });
backlinks = backlinks.addcols({ category: 1 });
let nodes = [thisdoc, ...childs, ...backlinks];
let links = [
  { source: thisdoc.id, target: childs.pick('id') },
  { source: thisdoc.id, target: backlinks.pick('id') },
];
dv.addegraph(nodes, links, { height: '500px', roam: true });
dv.render();
```

## Layout & advanced (mention — do not write by default)

Advanced machinery requires understanding DataView's destroy/refresh
lifecycle; read `docs/en_US/topics/dataview-advanced.md` before using.
Interactivity is discouraged: DataView is a *theoretically read-only*
dashboard — write a lot of user interaction only with explicit user consent.

**`dv.addcolumns(elements: HTMLElement[], { gap?='5px', flex?: number[], minWidth?='350px' })`** / **`dv.addrows(elements, { gap?='5px', flex?, maxHeight? })`** — flex layouts of **existing elements** (`dv.md(...)` results work). `flex: [1,1,2]` sets ratios; `minWidth` matters with many columns (horizontal scroll).

**`dv.addElement(ele: HTMLElement | string, disposer?) → HTMLElement`** (aliases `addView`, `addelement`, `addele`) — add an externally created element as a custom view.

- What happens under the hood: the element is **wrapped into a view container** (a div with the component class and a `data-id` attribute). `dv.addxxx` and `dv.addele` do this wrapping for you; `dv.addElement` with an already-valid view container appends it directly, otherwise wraps it.
- The return value is the **container** — take its id via `container.dataset.id`; it is what `dv.removeView` / `dv.replaceView` address.
- `disposer` (optional): a function run when this view is destroyed by `removeView` / `replaceView`, or when the DataView itself is destroyed. "Destroyed" = the embedded block is refreshed / re-queried / the document is closed.
- ⚠️ The element must be a real DOM node; if you pass a string it is interpreted as an HTML string and wrapped. For many custom elements prefer the tutorial's "Custom View Component" mechanism instead of raw `addElement`.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 'hello';
const id = dv.addele(span, () => console.log('disposed')).dataset.id;
dv.render();
```

**`dv.addDisposer(dispose: () => void, id?)`** — register a cleanup callback that runs when the DataView is destroyed (embedded block refresh / re-query / document close / plugin disable).

- Typical use: clear timers, abort fetches, remove event listeners created at top level — the block **re-executes** on every refresh, so anything not cleaned up leaks.
- With `id`: the disposer is bound to that specific view and also runs when the view is removed/replaced.
- Ordering: disposers registered via `addElement(ele, disposer)` run before the view is removed; `addDisposer` without id runs on DataView teardown.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let n = 0;
const span = document.createElement('span');
span.innerText = '0';
dv.addele(span);
const timer = setInterval(() => { n += 1; span.innerText = String(n); }, 1000);
dv.addDisposer(() => clearInterval(timer));  // no leak on refresh
dv.render();
```

If the exact destroy/replace timing still feels unclear, and you are stuck,
read the tutorial section
`docs/en_US/topics/dataview-advanced.md` ("Understanding DataView's
Lifecycle") — richer, but user-oriented and verbose.

**`dv.removeView(id)`** — remove a view by its container `data-id`; runs the view's disposer first (prefer over `ele.remove()`).

**`dv.replaceView(id, viewContainer, disposer?)`** — replace a view; old disposer runs first. ⚠️ `viewContainer` must be a view container (use `dv.addxxx(...)` result), and its `data-id` is **rewritten to the old id**.

## State — do not write by default

**`dv.useState(key, initialValue?) → state`** — persists values across
repaints via block attributes (+ session cache). `state()` / `state.value`
read; `state(v)` / `state.value = v` write.

- ⚠️ **Experimental.** Write it only if the user explicitly insists:
  multi-device synchronization can still produce data conflicts, and the
  eventual-write mechanism (cache → block attrs on close) is subtle.
- Typical safe pattern uses the date as key: `dv.useState(Query.Utils.today())`.
- If used, follow the advanced topic's "State Update Write Mechanism" section
  exactly and recommend enabling SiYuan's "Generate Conflict Documents".