# Query API Reference (agent reference)

The `Query` object is injected as a global inside `//!js` embedded blocks.
Every async method returns a Promise — `await` it. Use this file section by
section; if a signature ever disagrees with reality, grep the symbol in
`public/types.d.ts` (the authoritative declaration).

**Deeper dive**: the tutorial `docs/en_US/topics/query.md` explains the same
APIs with more context, examples and rationale — but it is written for
human learners, so it is much longer. Load it **only when you do not
understand the usage details of a specific API at all** despite this
reference.

## Query result shapes — read this first

- Most query methods return `IWrappedList<IWrappedBlock>`: an array whose
  **elements carry extra helpers** (`aslink`, `attr()`, date fields) and
  which **itself has extra methods** (`pick`, `groupby`, `unique`, ...). See
  §Wrapped below. You can pass it directly to any DataView component.
- `Query.childDoc` and `Query.markdown` return **plain** `Block[]` / string —
  no wrapped helpers, no `pick`/`groupby`.
- `Query.sql(..., wrap: false)` also returns raw blocks.

## Queries

**`Query.sql(fmt: string, wrap?: boolean) → IWrappedList<IWrappedBlock>`** — run a SiYuan SQL query (the general-purpose entry).

- `wrap` defaults `true` (results get the convenient members); pass `false`
  only if you want raw blocks.
- ⚠️ The SQL is **SiYuan kernel dialect** (tables like `blocks`, `refs`,
  `attributes`), not standard SQL. Column values are strings, e.g. `created`
  is `yyyyMMddHHmmss`. Patterns like
  `where type = 'd' and updated >= '${Query.Utils.thisWeek()}'` are typical.
- To render results in an embedded block: `return blocks.pick('id')`.

**`Query.backlink(id: BlockId, limit?: number) → IWrappedList<IWrappedBlock>`** — blocks that reference `id`. Aliases: `backlinks`.

- Use `protyle.block.rootID` (or `dv.root_id`) for the current document.
- The result contains the *referencing* blocks; container details are handled
  by `Query.fb2p` when needed (see below).

**`Query.childDoc(b: BlockId | Block) → Promise<Block[]>`** — direct child documents of a document.

- ⚠️ Returns **plain** `Block[]` (no `pick`/`groupby`). If you need nested
  trees for `dv.addlist` / `dv.addmermaidRelation` / `dv.addetree`, attach
  grandchildren manually: `child.children = await Query.childDoc(child.id)`.

**`Query.thisDoc(protyle) → Promise<IWrappedBlock>`** — the document that contains the embedded block.

- Capital `D` in `thisDoc` (`thisdoc` alias exists, prefer the canonical).

**`Query.root_id(protyle) → string`** — root document id. Alias `docId`.
Equals `dv.root_id` on a DataView instance.

**`Query.getBlocksByIds(...ids: (BlockId | BlockId[])[]) → IWrappedList<IWrappedBlock>`** — fetch blocks by id. Aliases `getBlockById`, `getBlocksById`.

**`Query.nearby(id: BlockId, { direction?: 'previous'|'next'|'both', number?: number })`** — blocks adjacent to `id`. Default `direction: 'both'`, `number: 3`. Returns `{ previous?: {id, markdown}[], next?: {id, markdown}[] }`.

**`Query.docStat(docId) → Promise<{runeCount, wordCount, linkCount, imageCount, refCount, blockCount}>`** — statistics of a document.

**`Query.markdown(input: BlockId | Block) → Promise<string>`** — markdown content of a block; for a document returns the doc content, for a heading its children.

## Content search

**`Query.keyword(keywords: string | string[], { join?: 'or'|'and', limit?: number }) → IWrappedList<IWrappedBlock>`** — blocks containing the keywords (`limit` default 999).

- ⚠️ **A match inside a nested structure returns parent AND child blocks as
  duplicates.** The standard workflow is:
  `let blocks = await Query.pruneBlocks(await Query.keyword(words))`.

**`Query.keywordDoc(keywords, { join?, limit? }) → Promise<Block[]>`** — documents containing the keywords. Each doc block carries a `keywords` map
(`doc.keywords['word']` → matched blocks). Result is plain `Block[]`.

**`Query.tag(tags: string | string[], { join?: 'or'|'and', limit?: number, match?: '='|'like' })`** — tag search. `match: 'like'` auto-wraps the tag with `%...%`.

**`Query.random(limit?: number, type?: BlockType) → IWrappedList<IWrappedBlock>`** — random blocks ("roam"). `type` e.g. `'d'` for documents only.

**`Query.task({ limit?: number, after?: string }) → IWrappedList<IWrappedBlock>`** — **unsolved** task blocks, optionally only those updated after `after` (prefix of `yyyyMMddHHmmss` works, e.g. `'2024101000'`).

**`Query.dailynote({ notebook?: NotebookId, limit?: number }) → IWrappedList<IWrappedBlock>`** — daily-note documents; omit `notebook` for all.

## Result processing

**`Query.wrapBlocks(blocks: Block[] | Block, useWrapBlock?) → Block[] | IWrappedBlock`** — wrap raw blocks with convenient members. Alias `wrapit`.

**`Query.fb2p(inputs: Block[], { heading?: boolean, doc?: boolean }) → Promise<Block[]>`** — "first-block-to-parent": if the first child of a container block (list item, blockquote) is a paragraph, redirect that paragraph to the container id. Alias `redirect`.

- Fixes the classic "backlink search returns the inner paragraph instead of
  the list item" problem: `let blocks = await Query.fb2p(await Query.backlink(id))`.
- `heading` / `doc` extend redirection to heading / document blocks.
- Special rule: a paragraph tagged `#DOCREF#` (or `#文档引用#`) is *always*
  forcibly redirected to the document.
- ⚠️ `Query.fb` does **not** exist — old snippets using it are wrong.

**`Query.pruneBlocks(blocks, keep?: 'leaf'|'root', advanced?: boolean) → Promise<Block[]>`** — merge parent/child duplicates (keyword search). Default `keep: 'leaf'`; `'root'` keeps the top container. `advanced: true` additionally walks breadcrumbs (extra queries, more aggressive merging). Aliases `prune`, `mergeBlocks`, `merge`.

## Query.Utils — all sync, no await

**`Query.Utils.today / thisWeek / thisMonth / thisYear (hms?: boolean) → string`** — `yyyyMMdd` (or `yyyyMMddHHmmss` with `hms`). Use inside SQL: `created >= '${Query.Utils.thisMonth()}'`.

**`Query.Utils.now(days?: number | string, hms?: boolean) → string`** — current (or offset) timestamp. `days` may be a number or `'1d' | '2w' | '3m' | '4y'`.

**`Query.Utils.Date(value?) → SiYuanDate`** — a `Date` for SiYuan: `beginOfDay()`, `add('1d'|'2w'|'3m'|'4y'| number)`, `toString(hms?)` (string-interpolation `\`${d}\`` gives `yyyyMMddHHmmss`).

**`Query.Utils.asDate(timestr) → SiYuanDate`** / **`asTimestr(date) → string`** — conversions between `yyyyMMddHHmmss` strings and `SiYuanDate`.

**`Query.Utils.notebook(input: Block | NotebookId) → Notebook`** / **`boxName(boxid) → string`** — notebook object / readable name (plain SQL gives only the box id).

**`Query.Utils.typeName(type: BlockType) → string`** — readable block-type name.

**`Query.Utils.renderAttr(b, attr, { onlyDate?, onlyTime? }) → string`** — the default table-cell rendering (renders hpath/box/type nicely).

**`Query.Utils.asLink(b) / asRef(b) → string`** — siyuan link / ref text (same as `IWrappedBlock.aslink/asref`).

**`Query.Utils.openBlock(id) → void`** — open a block in SiYuan (desktop).

**`Query.Utils.asMap(blocks, key?) → Record<string, Block>`** — index a list by attribute (same as `list.asMap`).

## Wrapped results

**`IWrappedBlock` — a `Block` plus:**

- `b.aslink` — `[content](siyuan://blocks/<id>)` (use this for links);
  `b.asurl` — raw `siyuan://` uri; `b.asref` — reference text (⚠️ does not
  create a real ref).
- `b.attr(name)` — attribute rendered as markdown (e.g. `b.attr('box')` →
  notebook name, `b.attr('type')` → type label); custom renderer optional,
  return `null` to fall back to the default.
- `b.asial` — IAL object (`b.asial['custom-x']`); `b['custom-x']` also works.
- Time fields without calling anything:
  `b.createdDate` (`yyyy-MM-dd`), `b.createdTime` (`HH:mm:ss`),
  `b.createdDatetime`, and the `updated*` twins.

**`IWrappedList<T>` — an `Array` plus (all return a *new* list, no in-place mutation):**

- `list.pick('id', ...attrs)` — keep only attrs (=> `Partial<T>[]`); the
  canonical `return blocks.pick('id')`.
- `list.omit(...attrs)` — drop attrs. `list.unique(keyOrFn)` — dedupe.
- `list.sorton(attr, 'asc'|'desc')` — sort by attribute.
- `list.groupby('box' | (b => ...), (groupName, group) => {})` — group into
  `Record<string, IWrappedList>`, or iterate inline (used with
  `dv.adddetails`).
- `list.asMap(key)` — index by attribute into a dict.
- `list.addrow(newItems)` (alias `addrows`, like concat) / `list.addcol(obj |
  obj[] | fn)` (alias `addcols`, `stack`) — e.g. `blocks.addcols({category: 0})`
  used to tag nodes for `dv.addegraph`.
- `filter`/`slice`/`map` are overridden to keep the result wrapped;
  `list.unwrap()` / `list.unwrapped` gives the plain array.

## Example: typical Query idioms (copy and adapt)

```js
//!js
// keyword search, de-duplicated, rendered as a table
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.keyword('重要内容');
blocks = await Query.pruneBlocks(blocks);
dv.addtable(blocks, { cols: ['content', 'hpath'] });
dv.render();
```

```js
//!js
// backlinks of the current document, refs redirected to container blocks
let blocks = await Query.backlink(protyle.block.rootID);
blocks = await Query.fb2p(blocks);
return blocks.pick('id');
```

## Alias rules (exact, from `src/core/query.ts`)

`DataView → Dataview` · `Utils → utils` · `getBlocksByIds → getBlockById,
getBlocksById` · `root_id → docId` · `backlink → backlinks` · `wrapBlocks →
wrapit` · `fb2p → redirect` · `pruneBlocks → prune, mergeBlocks, merge`

Every `Query` member and every `Query.Utils` member also gets an automatic
lowercase alias (e.g. `Query.utils.asmap`, `Query.thisdoc`). Prefer canonical
names in new code.