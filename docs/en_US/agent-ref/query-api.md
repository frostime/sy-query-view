# Query API 参考（自动生成，来源：src/core/query.ts）

> 本文件由 `scripts/gen-agent-ref.mjs` 生成——签名取 tsc 声明、注释取源码 JSDoc、别名取 addAlias 调用点。请勿手改；修改请改源码注释。

## Query.DataView(protyle, item, top)

```ts
DataView: (protyle: IProtyle, item: HTMLElement, top: number | null) => DataView
```

Creates a new DataView instance for rendering data visualizations

**参数**

- `protyle` — Protyle instance
- `item` — HTML element to render into
- `top` — Top position for rendering

**返回**：DataView instance

**全部可用名**（2，register/别名规则展开）：`DataView` · `Dataview`

**来源** `src/core/query.ts:275`

---

## Query.wrapBlocks(blocks, useWrapBlock)

```ts
wrapBlocks: (blocks: Block[] | Block, useWrapBlock?: boolean) => Block[] | IWrappedBlock
```

Wraps blocks with additional functionality

**参数**

- `blocks` — Blocks to wrap
- `useWrapBlock` — Whether to wrap blocks inside the WrappedList

**返回**：Wrapped block(s)

**全部可用名**（2，register/别名规则展开）：`wrapBlocks` · `wrapit`

**来源** `src/core/query.ts:460`

---

## Query.request()

```ts
request: typeof request
```

SiYuan Kernel Request API

**示例**

```ts
await Query.request('/api/outline/getDocOutline', {
    id: docId
});
```

**来源** `src/core/query.ts:474`

---

## Query.getBlocksByIds(ids)

```ts
getBlocksByIds: (...ids: (BlockId | BlockId[])[]) => Promise<IWrappedList<IWrappedBlock>>
```

Gets blocks by their IDs

**参数**

- `ids` — Block IDs to retrieve

**返回**：Array of wrapped blocks

**全部可用名**（3，register/别名规则展开）：`getBlocksByIds` · `getBlockById` · `getBlocksById`

**来源** `src/core/query.ts:483`

---

## Query.id2block(id)

```ts
id2block: (id: BlockId | BlockId[]) => Promise<IWrappedBlock | IWrappedList<IWrappedBlock>>
```

Similar to `getBlocksByIds`, but :
 - The input can be a single ID or an array of IDs
 - The output is a single block or an array of blocks

**参数**

- `id` — Block ID or array of block IDs

**返回**：Single block or array of blocks

**来源** `src/core/query.ts:496`

---

## Query.root_id(protyle)

```ts
root_id: (protyle: IProtyle) => string
```

Gets the current document's ID

**参数**

- `protyle` — Protyle instance

**返回**：Document ID

**全部可用名**（2，register/别名规则展开）：`root_id` · `docId`

**来源** `src/core/query.ts:509`

---

## Query.thisDoc(protyle)

```ts
thisDoc: (protyle: IProtyle) => Promise<IWrappedBlock>
```

Gets the current document as a block

**参数**

- `protyle` — Protyle instance

**返回**：Wrapped document block

**来源** `src/core/query.ts:516`

---

## Query.sql(fmt, wrap)

```ts
sql: (fmt: string, wrap?: boolean) => Promise<IWrappedList<IWrappedBlock>>
```

Executes SQL query and optionally wraps results

**参数**

- `fmt` — SQL query string
- `wrap` — Whether to wrap results

**返回**：Query results

**来源** `src/core/query.ts:528`

---

## Query.backlink(id, limit?)

```ts
backlink: (id: BlockId, limit?: number) => Promise<IWrappedList<IWrappedBlock>>
```

Finds backlinks to a specific block

**参数**

- `id` — Block ID to find backlinks for
- `limit` — Maximum number of results

**返回**：Array of blocks linking to the specified block

**全部可用名**（2，register/别名规则展开）：`backlink` · `backlinks`

**来源** `src/core/query.ts:543`

---

## Query.attr(name, val?, optionDeprecatedAsValMatch?, limit?)

```ts
attr: (name: string, val?: string, optionDeprecatedAsValMatch?: { valMatch?: "=" | "like"; limit?: number; } | DeprecatedParam<"=" | "like">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>
```

Finds blocks with specific attributes

**参数**

- `name` — Attribute name
- `val` — Attribute value
- `options` — Options
- `options.valMatch` — Match type ('=' or 'like')
- `options.limit` — Maximum number of results
- `limit` — (Deprecated) Maximum number of results

**返回**：Array of matching blocks

**来源** `src/core/query.ts:561`

---

## Query.tag(tags, optionDeprecatedAsJoin?, limit?)

```ts
tag: (tags: string | string[], optionDeprecatedAsJoin?: { join?: "or" | "and"; limit?: number; match?: "=" | "like"; } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>
```

Search blocks by tags

**参数**

- `tags` — Tags to search for; can provide multiple tags
- `options` — Additional options
- `options.join` — Join type ('or' or 'and')
- `options.limit` — Maximum number of results
- `options.match` — Match type ('=' or 'like'), if `like` the tags will be automatically add % as prefix and suffix
- `limit` — (Deprecated) Maximum number of results

**返回**：Array of blocks matching the tags

**示例**

```ts
Query.tag('tag1') // Search for blocks with 'tag1'
Query.tag(['tag1', 'tag2'], { join: 'or' }) // Search for blocks with 'tag1' or 'tag2'
Query.tag(['tag1', 'tag2'], { join: 'and' }) // Search for blocks with 'tag1' and 'tag2'
```

**来源** `src/core/query.ts:604`

---

## Query.task(optionDeprecatedAsAfter?, limit?)

```ts
task: (optionDeprecatedAsAfter?: { limit?: number; after?: string; } | DeprecatedParam<string>, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>
```

Find unsolved task blocks

**参数**

- `options` — Options
- `options.after` — After which the blocks were updated
- `options.limit` — Maximum number of results
- `limit` — (Deprecated) Maximum number of results

**返回**：Array of unsolved task blocks

**示例**

```ts
Query.task()
Query.task({ after: '2024101000' })
Query.task({ limit: 32 })
```

**来源** `src/core/query.ts:658`

---

## Query.dailynote(optionsDeprecatedAsNotebook?, limitDeprecated?)

```ts
dailynote: (optionsDeprecatedAsNotebook?: { notebook?: NotebookId; limit?: number; } | DeprecatedParam<NotebookId>, limitDeprecated?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>
```

Gets the daily notes document

**参数**

- `options` — Options
- `options.notebook` — Notebook ID, if not specified, all daily notes documents will be returned
- `options.limit` — Maximum number of results

**返回**：Array of daily notes document blocks

**示例**

```ts
Query.dailynote()
Query.dailynote({ notebook: '20231224140619-bpyuay4' })
Query.dailynote({ limit: 32 })
```

**来源** `src/core/query.ts:693`

---

## Query.childDoc(b)

```ts
childDoc: (b: BlockId | Block) => Promise<Block[]>
```

Gets child documents of a block

**参数**

- `b` — Parent block or block ID

**返回**：Array of child document blocks

> ⚠ 实际返回 **wrapped 列表**（可用 .pick()/.groupby()/.addcols()），tsc 声明写作 Block[]，与实现不符

**来源** `src/core/query.ts:729`

---

## Query.nearby(id, options?)

```ts
nearby: (id: BlockId, options?: { direction?: "previous" | "next" | "both"; number?: number; }) => Promise<{ previous?: { id: Block; markdown: string; }[]; next?: { id: Block; markdown: string; }[]; }>
```

Get nearby blocks relative to the specified block within the same container.

The search is limited to blocks within the same hierarchy level() container or heading section ).
Example: For the following structure, para 2's nearby blocks would be:
previous: [para 1], next: [para 3, para 4]; because `### Title` is outof the same hierarchy level.

```
### Title

para 1

para 2

para 3

para 4
```

**参数**

- `id` — Target block ID to find neighbors for
- `options` — Search options
- `options.direction` — Which direction to search ('previous', 'next' or 'both'), defaults to 'both'
- `options.number` — Maximum number of blocks to return in each direction, defaults to 3

**返回**：Object containing arrays of neighboring blocks

**示例**

```ts
// Get both previous and next blocks
await query.nearby('block123');

// Get 3 previous blocks only
await query.nearby('block123', { direction: 'previous', number: 3 });
```

**来源** `src/core/query.ts:778`

---

## Query.keyword(keywords, options?, limit?)

```ts
keyword: (keywords: string | string[], options?: { join?: "or" | "and"; limit?: number; } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>
```

Search blocks that contain the given keywords

**参数**

- `keywords` — Keywords to search for; can provide multiple keywords
- `options` — Options
- `options.join` — Join type ('or' or 'and')
- `options.limit` — Maximum number of results to return, default is 999
- `limit` — (Deprecated) Maximum number of results to return, default is 999

**返回**：Array of blocks that contain the given keywords

**来源** `src/core/query.ts:816`

---

## Query.keywordDoc(keywords, options?, limit?)

```ts
keywordDoc: (keywords: string | string[], options?: { join?: "or" | "and"; limit?: number; } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<Block[]>
```

Search the document that contains all the keywords.

**参数**

- `keywords` — keywords to search for; can provide multiple keywords
- `options` — Options
- `options.join` — Join type ('or' or 'and')
- `options.limit` — Maximum number of results to return, default is 999

**返回**：The document blocks that contains all the given keywords; the blocks will attached a 'keywords' property, which is the matched keyword blocks

**示例**

```ts
let docs = await Query.keywordDoc(['Keywords A', 'Keywords B']);
//each block in docs is a document block that contains all the keywords
docs[0].keywords['Keywords A'] // get the matched keyword block by using `keywords` property
```

> ⚠ `join:'or'` 并不真正 OR：SQL 阶段是 OR，但后续过滤仍要求每个关键词都命中，实际接近 AND

**来源** `src/core/query.ts:843`

---

## Query.random(limit, type?)

```ts
random: (limit?: number, type?: BlockType) => Promise<IWrappedList<IWrappedBlock>>
```

Randomly roam blocks

**参数**

- `limit` — Maximum number of results
- `type` — Block type

**返回**：Array of randomly roamed blocks

**来源** `src/core/query.ts:895`

---

## Query.markdown(input)

```ts
markdown: (input: BlockId | Block) => Promise<any>
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

**来源** `src/core/query.ts:903`

---

## Query.docStat(docId)

```ts
docStat: (docId: DocumentId) => Promise<{ "runeCount": number; "wordCount": number; "linkCount": number; "imageCount": number; "refCount": number; "blockCount": number; }>
```

Return the statistics of the document with given document ID

**参数**

- `docId` — The ID of document

**返回**：The statistics of the document；.runeCount - The number of characters in the document；.wordCount - The number of words (Chinese characters are counted as one word) in the document；.linkCount - The number of links in the document；.imageCount - The number of images in the document；.refCount - The number of references in the document；.blockCount - The number of blocks in the document

**来源** `src/core/query.ts:933`

---

## Query.fb2p(inputs, enable?)

```ts
fb2p: (inputs: Block[], enable?: { heading?: boolean; doc?: boolean; }) => Promise<Block[]>
```

Redirects first block IDs to their parent containers

**参数**

- `inputs` — Array of blocks or block IDs
- `enable` — Configuration for heading and doc processing
- `enable.heading` — Whether to process heading blocks
- `enable.doc` — Whether to process document blocks

**返回**：Processed blocks or block IDs

**全部可用名**（2，register/别名规则展开）：`fb2p` · `redirect`

**来源** `src/core/query.ts:956`

---

## Query.pruneBlocks(blocks, keep, advanced)

```ts
pruneBlocks: (blocks: Block[], keep?: "leaf" | "root", advanced?: boolean) => Promise<Block[]>
```

Prune/Merge blocks from SQL search results to eliminate duplicates.

SiYuan's block structure is hierarchical, leading to multiple results for nested content (e.g., lists, list items, and their paragraphs).
For example, searching "Hi" in the following list might return three blocks:
 1. The parent list block
 2. The list item block
 3. The paragraph block

```md
- Hi
- Hello
```

This function resolves this duplication issue by merging related blocks based on a chosen strategy.

**参数**

- `blocks` — An array of blocks returned from a SQL search, potentially containing nested structures.
- `keep` — The merging mode:
- `'leaf'`:  Merges results to the deepest (leaf) block. (e.g., the paragraph block in a list item).
- `'root'`: Merges results to the highest (root) block. (e.g., the parent list block).
- `advanced` — Enables advanced filtering using block breadcrumbs for more accurate results (can be resource-intensive).

**返回**：A new array containing only the unique (pruned) blocks.

**全部可用名**（4，register/别名规则展开）：`pruneBlocks` · `prune` · `mergeBlocks` · `merge`

**来源** `src/core/query.ts:1077`

---

## Query.gpt(input, options?)

```ts
gpt: (input: string | { role: "user" | "assistant"; content: string; }[], options?: { url?: string; model?: string; apiKey?: string; history?: { role: "user" | "assistant"; content: string; }[]; returnRaw?: boolean; stream?: boolean; streamMsg?: (msg: string) => void; streamInterval?: number; }) => Promise<any>
```

Send GPT request, use AI configuration in `siyuan.config.ai.openAI` by default

**参数**

- `prompt` — Prompt
- `options` — Options
- `options.url` — Custom API URL
- `options.model` — Custom API model
- `options.apiKey` — Custom API key
- `options.returnRaw` — Whether to return raw response (default: false)
- `options.history` — Chat history
- `options.stream` — Whether to use streaming mode, default: false
- `options.streamMsg` — Callback function for streaming messages, only works when options.stream is true
- `options.streamInterval` — Interval for calling options.streamMsg on each chunk, default: 1

**返回**：GPT response

**来源** `src/core/query.ts:1098`

---

## Query.Utils

> 工具函数集合，全部为同步函数，无需 await。注册于对象 `Query.Utils`。

---

## Query.Utils.Date(args)

```ts
Date: (value: string | number | Date) => SiYuanDate
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

**来源** `src/core/query.ts:285`

---

## Query.Utils.now(days?, hms)

```ts
now: (days?: number | string, hms?: boolean) => any
```

Gets timestamp for current time with optional day offset

**参数**

- `days` — Number of days to offset (positive or negative)
- {number} 直接用数字
- {string} 使用字符串，如 '1d' 表示 1 天，'2w' 表示 2 周，'3m' 表示 3 个月，'4y' 表示 4 年
- 可以为负数

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:294`

---

## Query.Utils.today(hms)

```ts
today: (hms?: boolean) => any
```

Gets the timestamp for the start of today

**参数**

- `hms` — Whether to include time, e.g today(false) returns 20241201, today(true) returns 20241201000000

**返回**：Timestamp string in yyyyMMddHHmmss format

> ⚠ 默认 `hms=true` 返回 14 位完整戳 yyyyMMddHHmmss；false 才返回 8 位；thisWeek 从周日开始

**来源** `src/core/query.ts:305`

---

## Query.Utils.thisWeek(hms)

```ts
thisWeek: (hms?: boolean) => any
```

Gets the timestamp for the start of current week

**参数**

- `hms` — Whether to include time, e.g thisWeek(false) returns 20241201, thisWeek(true) returns 20241201000000

**返回**：Timestamp string in yyyyMMddHHmmss format

> ⚠ 默认 `hms=true` 返回 14 位完整戳 yyyyMMddHHmmss；false 才返回 8 位；本周从周日开始计算

**来源** `src/core/query.ts:312`

---

## Query.Utils.lastWeek(hms)

```ts
lastWeek: (hms?: boolean) => any
```

Gets the timestamp for the start of next week

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:322`

---

## Query.Utils.thisMonth(hms)

```ts
thisMonth: (hms?: boolean) => any
```

Gets the timestamp for the start of current month

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:332`

---

## Query.Utils.lastMonth(hms)

```ts
lastMonth: (hms?: boolean) => string
```

Gets the timestamp for the start of last month

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:343`

---

## Query.Utils.thisYear(hms)

```ts
thisYear: (hms?: boolean) => string
```

Gets the timestamp for the start of current year

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:354`

---

## Query.Utils.asDate(timestr)

```ts
asDate: (timestr: string) => SiYuanDate
```

/**
  Converts SiYuan timestamp string to Date object

**参数**

- `timestr` — SiYuan timestamp (yyyyMMddHHmmss)

**返回**：Date object

**来源** `src/core/query.ts:367`

---

## Query.Utils.asTimestr(date)

```ts
asTimestr: (date: Date) => any
```

Converts Date object to SiYuan timestamp format

**参数**

- `date` — Date to convert

**返回**：Timestamp string in yyyyMMddHHmmss format

**来源** `src/core/query.ts:376`

---

## Query.Utils.asLink(b)

```ts
asLink: (b: Block) => string
```

Converts a block to a SiYuan link format

**参数**

- `b` — Block to convert

**返回**：String in markdown link format

**来源** `src/core/query.ts:383`

---

## Query.Utils.asRef(b)

```ts
asRef: (b: Block) => string
```

Converts a block to a SiYuan reference format

**参数**

- `b` — Block to convert

**返回**：String in reference format ((id 'content'))

**来源** `src/core/query.ts:390`

---

## Query.Utils.asMap(blocks, key)

```ts
asMap: (blocks: Block[], key?: string) => { [key: string]: Block; [key: number]: Block; }
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

**来源** `src/core/query.ts:392`

---

## Query.Utils.notebook(input)

```ts
notebook: (input: Block | NotebookId) => Notebook
```

Gets notebook information from block or notebook ID

**参数**

- `input` — Block object or notebook ID

**返回**：Notebook information

**来源** `src/core/query.ts:402`

---

## Query.Utils.boxName(boxid)

```ts
boxName: (boxid: NotebookId) => string
```

Gets the name of a notebook by its ID; equivalent to `notebook(boxid).name`

**参数**

- `boxid` — Notebook ID

**返回**：Notebook name

**示例**

```ts
Query.Utils.boxName(block['box']) // 'Notebook 123'
```

**来源** `src/core/query.ts:413`

---

## Query.Utils.typeName(type)

```ts
typeName: (type: BlockType) => any
```

Gets the readable name of the type of a block

**参数**

- `type` — Block type

**返回**：Readable block type name

**示例**

```ts
Query.Utils.typename(block['type']) // 'Heading'
```

**来源** `src/core/query.ts:423`

---

## Query.Utils.docIcon(document)

```ts
docIcon: (document: Block) => string
```

Given a document block (type='d'), return its emoji icon

**参数**

- `document` — 

**返回**：emoji icon; if block is not with type='d', return null

**来源** `src/core/query.ts:430`

---

## Query.Utils.emoji(code)

```ts
emoji: (code: string) => string
```

Given emoji code, returl emoji icon

**参数**

- `code` — 

**返回**：

**来源** `src/core/query.ts:441`

---

## Query.Utils.renderAttr()

```ts
renderAttr: (b: Block & { [key: string | number]: string | number; }, attr: (keyof Block & string) | number, options?: { onlyDate?: boolean; onlyTime?: boolean; }) => string
```

Renders the value of a block attribute as markdown format

**来源** `src/core/query.ts:450`

---

## Query.Utils.openBlock()

```ts
openBlock: (id: BlockId, options?: { zoomIn?: boolean; action?: import("siyuan").TProtyleAction[]; position?: Parameters<typeof import("siyuan").openTab>[0]["position"]; keepCursor?: boolean; }) => void
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

**来源** `src/core/query.ts:451`

---

