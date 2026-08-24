# DataView 组件参考（自动生成，来源：src/core/data-view.ts）

> 本文件由 `scripts/gen-agent-ref.mjs` 生成——签名取 tsc 声明、注释取源码 JSDoc、别名取 register 调用点。组件经 `register()` 运行时注册，衍生出完整别名集合（含大小写与 `add` 前缀）。请勿手改。

## dv.repaint()

```ts
repaint(): void;
```

Repaint the embed block, essentially merely click the reload button

**来源** `src/core/data-view.ts:320`

---

## dv.useState(key, initialValue?)

```ts
useState<T>(key: string, initialValue?: T): IState<T>;
```

Persist state across renders; it will store the state in the block attributes when disposing, and restore it when creating.

**参数**

- `key` — The key of the state
- `initialValue` — The initial value of the state

**返回**：An IState object -- see

**示例**

```ts
const count = dv.useState('count', 0);
count(); // Access the value
count.value; // Access the value, same as count()
count(1); // Set the value
count.value = 1; // Set the value, same as count(1)
```

**来源** `src/core/data-view.ts:340`

---

## dv.addDisposer(dispose, id?)

```ts
addDisposer(dispose: () => void, id?: string): void;
```

Register a disposer function to be called when the DataView is disposed.
Only when you need to add some extra cleanup logic, you should use this method.

**参数**

- `dispose` — The dispose function

**来源** `src/core/data-view.ts:359`

---

## dv.view(ele)

```ts
view(ele: HTMLElement | string): HTMLElement;
```

Wrap an element into a view container

**参数**

- `ele` — 

**来源** `src/core/data-view.ts:376`

---

## dv.addElement(ele, disposer?)

```ts
addElement(ele: HTMLElement | string, disposer?: () => void): HTMLElement;
```

Add a custom element to the DataView.
If the passing is a view container, it will be directly appended.
Otherwise, it will be wrapped by a new container

**参数**

- `ele` — 
- `disposer` — - dispose function, optional

**返回**：View Conainer, with a special class name, and a `data-id` attribute

**来源** `src/core/data-view.ts:404`

---

## dv.isValidViewContainer(container)

```ts
isValidViewContainer(container: HTMLElement): boolean;
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

**来源** `src/core/data-view.ts:420`

---

## dv.removeView(id, beforeRemove?)

```ts
removeView(id: string, beforeRemove?: (viewContainer: HTMLElement) => void): boolean;
```

Remove the view element (by given the id of the container) from dataview

**参数**

- `id` — Existed view's data-id
- `beforeRemove` — , an optional callback funcgtion

**返回**：Whether the removal succeeded

**来源** `src/core/data-view.ts:437`

---

## dv.replaceView(id, viewContainer, disposer?)

```ts
replaceView(id: string, viewContainer: HTMLElement, disposer?: () => void): HTMLElement;
```

Replace the view element (by given the id of the container) with another given element

**参数**

- `id` — 
- `viewContainer` — : must be a conatiner element
- `disposer` — : dispose functioin, if already specified for viewContainer, this one will be omit!.

**返回**：

**来源** `src/core/data-view.ts:464`

---

## dv.markdown(md)

```ts
markdown(md: string): HTMLElement;
```

Adds markdown content to the DataView

**参数**

- `md` — Markdown text to be rendered

**返回**：HTMLElement containing the rendered markdown

**示例**

```ts
dv.addmd(`# Hello`);
```

**全部可用名**（8，register/别名规则展开）：`Markdown` · `Md` · `addMarkdown` · `addMd` · `addmarkdown` · `addmd` · `markdown` · `md`

**来源** `src/core/data-view.ts:509`

---

## dv.details(summary, content)

```ts
details(summary: string, content: string | HTMLElement): HTMLDetailsElement;
```

> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程

> ⚠ content 为字符串时**直拼 innerHTML**——原始 HTML，不是 markdown；默认 `open=true`（默认展开）

**全部可用名**（8，register/别名规则展开）：`Detail` · `Details` · `addDetail` · `addDetails` · `adddetail` · `adddetails` · `detail` · `details`

**来源** `src/core/data-view.ts:515`

---

## dv.list(data, options)

```ts
list(data: (IBlockWithChilds | ScalarValue)[], options?: IListOptions<Block>): HTMLElement;
```

Creates a markdown list view for displaying blocks

**参数**

- `data` — Array of blocks to display in the list
 Can also be scalar values, or block with children property
- `options` — Configuration options
- `options.type` — List type, 'u' for unordered, 'o' for ordered
- `options.columns` — Number of columns to display
- `options.renderer` — Custom function to render list items, the return will be used as markdown code

**返回**：HTMLElement containing the list

**示例**

```ts
const children = await Query.childdoc(block);
dv.addlist(children, { type: 'o' });
```

**全部可用名**（9，register/别名规则展开）：`BlockList` · `List` · `addBlockList` · `addBlocklist` · `addList` · `addblocklist` · `addlist` · `blocklist` · `list`

**来源** `src/core/data-view.ts:538`

---

## dv.table(blocks, options?)

```ts
table(blocks: Block[], options?: { center?: boolean; fullwidth?: boolean; index?: boolean; cols?: (string | Record<string, string>)[] | Record<string, string>; renderer?: (b: Block, attr: keyof Block) => string | undefined | null; }): HTMLElement;
```

Creates a markdown table view for displaying blocks

**参数**

- `blocks` — Array of Block objects to display
- `options` — Configuration options
- `options.center` — Center align table contents
- `options.fullwidth` — Make table full width
- `options.index` — Show row indices
- `options.cols` — Array of Block properties to show as columns;
- if `undefined`, the default columns `['type', 'content', 'hpath', 'box']` will be used;
but if the blocks don't have these properties, all properties of the first block will be used;
- Can also be:
- Record<string, string> to specify the column name, like `{type: 'Type', content: 'Content', 'root_id': 'Document'}`
- Mixed array, like `['type', {content: 'Content'}, 'hpath']`
- `null`, in this case, all columns will be shown
- `options.renderer` — Custom function to render table cells
- The return will be used as markdown code, and insert into each td cell
- If returns `null`, the default renderer will be used
- SPECIAL USAGE: if the returned string is wrapped with {@html ...}, it will be treated as HTML code

**返回**：HTMLElement containing the block table

**示例**

```ts
const children = await Query.childdoc(block);
dv.addtable(children, { cols: ['type', 'content'] , fullwidth: true });
```

**全部可用名**（9，register/别名规则展开）：`BlockTable` · `Table` · `addBlockTable` · `addBlocktable` · `addTable` · `addblocktable` · `addtable` · `blocktable` · `table`

**来源** `src/core/data-view.ts:606`

---

## dv.cards(blocks, options?)

```ts
cards(blocks: Block[], options?: { cardWidth?: string; cardHeight?: string; fontSize?: string; }): HTMLElement;
```

Creates a card view for displaying blocks

**参数**

- `blocks` — Array of Block objects to display
- `options` — Configuration options
- `options.cardWidth` — Width of each card; default is '175px'
- `options.cardHeight` — Height of each card; default is '175px'
- `options.fontSize` — Base font size for the cards; default is '14px'

**返回**：HTMLElement containing the card layout

**示例**

```ts
const children = await Query.childdoc(block);
dv.cards(children, { cardWidth: '250px', fontSize: '16px' });
```

**全部可用名**（8，register/别名规则展开）：`Card` · `Cards` · `addCard` · `addCards` · `addcard` · `addcards` · `card` · `cards`

**来源** `src/core/data-view.ts:642`

---

## dv.columns(elements, options)

```ts
columns(elements: HTMLElement[], options?: { gap?: string; flex?: number[]; minWidth?: string | number; }): HTMLElement;
```

Arranges elements in columns

**参数**

- `elements` — Array of HTMLElements to arrange
- `options` — Configuration options
- `options.gap` — Style of gap between columns; default is '5px'
- `options.flex` — Flex ratio of each column; default is [1, 1, 1, ...]
- `options.minWidth` — The minimum width of **each column**; default is '350px'; This is useful when the columns number is quite large

**返回**：HTMLElement containing the column layout

**示例**

```ts
dv.addcolumns([dv.md('# Hello'), dv.md('# World')], { gap: '10px', flex: [1, 2] });
```

> ⚠ `flex:[1,1,2]` 实际未按列生效：实现把 --flex-grow 写为父容器单一变量反复覆盖（已知限制，勿依赖）

**全部可用名**（8，register/别名规则展开）：`Cols` · `Columns` · `addCols` · `addColumns` · `addcols` · `addcolumns` · `cols` · `columns`

**来源** `src/core/data-view.ts:668`

---

## dv.rows(elements, options)

```ts
rows(elements: HTMLElement[], options?: { gap?: string; maxHeight?: string; flex?: number[]; }): HTMLElement;
```

Arranges elements in rows

**参数**

- `elements` — Array of HTMLElements to arrange
- `options` — Configuration options
- `options.gap` — Style of gap between rows; default is '5px'
- `options.maxHeight` — Maximum height of the container; default not set
- `options.flex` — Flex ratio of each row; default not set

**返回**：HTMLElement containing the row layout

**全部可用名**（4，register/别名规则展开）：`Rows` · `addRows` · `addrows` · `rows`

**来源** `src/core/data-view.ts:709`

---

## dv.mermaid(code)

```ts
mermaid(code: string): HTMLElement;
```

Creates a Mermaid diagram from Mermaid code

**参数**

- `code` — Mermaid code

**返回**：HTMLElement containing the Mermaid diagram

**全部可用名**（4，register/别名规则展开）：`Mermaid` · `addMermaid` · `addmermaid` · `mermaid`

**来源** `src/core/data-view.ts:747`

---

## dv.mermaidRelation(tree, options)

```ts
mermaidRelation(tree: IBlockWithChilds | Record<string, Block[]>, options?: { type?: "flowchart" | "mindmap"; flowchart?: 'TD' | 'LR'; renderer?: (b: Block) => string; }): HTMLElement;
```

Creates a Mermaid diagram from block relationships

**参数**

- `tree` — Object mapping block IDs to their connected blocks
- `options` — Configuration options
- `options.blocks` — Array of Block objects
- `options.type` — Diagram type: "flowchart" or "mindmap"
- `options.flowchart` — Flow direction: 'TD' or 'LR'
- `options.renderer` — Custom function to render node content

**返回**：HTMLElement containing the Mermaid diagram

**示例**

```ts
const children = await Query.childdoc(block);
dv.addMermaidRelation({...block, children }, { type: 'flowchart' });
dv.addMermaidRelation({ 'Child': children, 'Backlink': backlinks }, { type: 'flowchart' });
```

**全部可用名**（7，register/别名规则展开）：`MermaidRelation` · `addMermaidRelation` · `addMermaidrelation` · `addmermaidRelation` · `addmermaidrelation` · `mermaidRelation` · `mermaidrelation`

**来源** `src/core/data-view.ts:772`

---

## dv.mermaidFlowchart(tree, options)

```ts
mermaidFlowchart(tree: IBlockWithChilds, options?: { renderer?: (b: Block) => string; }): HTMLElement;
```

Creates a Mermaid flowchart from block relationships

**全部可用名**（14，register/别名规则展开）：`MFlowchart` · `MermaidFlowchart` · `addMFlowchart` · `addMermaidFlowchart` · `addMermaidflowchart` · `addMflowchart` · `addmFlowchart` · `addmermaidFlowchart` · `addmermaidflowchart` · `addmflowchart` · `mFlowchart` · `mermaidFlowchart` · `mermaidflowchart` · `mflowchart`

**来源** `src/core/data-view.ts:806`

---

## dv.mermaidMindmap(tree, options)

```ts
mermaidMindmap(tree: IBlockWithChilds, options?: { renderer?: (b: Block) => string; }): HTMLElement;
```

Creates a Mermaid mindmap from block relationships

**全部可用名**（14，register/别名规则展开）：`MMindmap` · `MermaidMindmap` · `addMMindmap` · `addMermaidMindmap` · `addMermaidmindmap` · `addMmindmap` · `addmMindmap` · `addmermaidMindmap` · `addmermaidmindmap` · `addmmindmap` · `mMindmap` · `mermaidMindmap` · `mermaidmindmap` · `mmindmap`

**来源** `src/core/data-view.ts:817`

---

## dv.mermaidKanban(groupedBlocks, options)

```ts
mermaidKanban(groupedBlocks: Record<string, Block[]>, options: { priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low'; clip?: number; width?: string; }): HTMLElement;
```

Creates a Mermaid gantt chart from block relationships

**参数**

- `groupedBlocks` — : Blocks Array }
- `options` — 
- `options.priority` — Function to determine priority of each block, see ://mermaid.js.org/syntax/kanban.html#supported-metadata-keys
- `options.clip` — Maximum length of text to display in each item, default as 50
- `options.width` — The width of kanban

**返回**：

**全部可用名**（14，register/别名规则展开）：`MKanban` · `MermaidKanban` · `addMKanban` · `addMermaidKanban` · `addMermaidkanban` · `addMkanban` · `addmKanban` · `addmermaidKanban` · `addmermaidkanban` · `addmkanban` · `mKanban` · `mermaidKanban` · `mermaidkanban` · `mkanban`

**来源** `src/core/data-view.ts:833`

---

## dv.embed(blocks, options)

```ts
embed(blocks: Block[] | Block, options: { breadcrumb?: boolean; limit?: number; columns?: number; zoom?: number; }): HTMLElement;
```

Embeds blocks into the DataView

**参数**

- `blocks` — Single Block or array of Blocks to embed
- `options` — Configuration options
- `options.breadcrumb` — Whether to show breadcrumb navigation
- `options.limit` — Maximum number of blocks to embed, if provided, only limited blocks will be embedded
- `options.columns` — Number of columns to display
- `options.zoom` — Zoom factor, from 0 to 1

**返回**：HTMLElement containing the embedded blocks

**示例**

```ts
const children = await Query.childdoc(block);
dv.addembed(children, { limit: 5 });
```

**全部可用名**（4，register/别名规则展开）：`Embed` · `addEmbed` · `addembed` · `embed`

**来源** `src/core/data-view.ts:865`

---

## dv.echarts(echartOption, options)

```ts
echarts(echartOption: IEchartsOption, options?: { height?: string; width?: string; events?: { [eventName: string]: (params: any) => void; }; }): HTMLElement;
```

Creates a custom ECharts visualization

**参数**

- `echartOption` — ECharts configuration object, see ://echarts.apache.org/zh/option.html#title for more details
- `options` — Configuration options
- `options.height` — The height of the container, default as 300px
- `options.width` — The width of the container, default as 100%
- `options.events` — Event handlers for chart interactions; see ://echarts.apache.org/handbook/en/concepts/event/ for more details

**返回**：HTMLElement containing the chart

**全部可用名**（4，register/别名规则展开）：`Echarts` · `addEcharts` · `addecharts` · `echarts`

**来源** `src/core/data-view.ts:894`

---

## dv.echartsLine(x, y, options)

```ts
echartsLine(x: number[], y: number[] | number[][], options?: { height?: string; width?: string; title?: string; xlabel?: string; ylabel?: string; legends?: string[]; seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[]; echartsOption?: IEchartsOption; }): HTMLElement;
```

Creates a line chart

**参数**

- `x` — Array of x-axis values
- `y` — Array of y-axis values, or array of arrays for multiple lines
- `options` — Configuration options
- `options.height` — The height of the container, default as 300px
- `options.width` — The width of the container, default as 100%
- `options.title` — Chart title
- `options.xlabel` — X-axis label
- `options.ylabel` — Y-axis label
- `options.legends` — Array of legend labels for multiple lines
- `options.seriesOption` — Additional series configuration. See ://echarts.apache.org/zh/option.html#series-line for more details
- `options.echartsOption` — Additional ECharts configuration. See ://echarts.apache.org/zh/option.html#title for more details

**返回**：HTMLElement containing the line chart

**全部可用名**（14，register/别名规则展开）：`ELine` · `EchartsLine` · `addELine` · `addEchartsLine` · `addEchartsline` · `addEline` · `addeLine` · `addechartsLine` · `addechartsline` · `addeline` · `eLine` · `echartsLine` · `echartsline` · `eline`

**来源** `src/core/data-view.ts:932`

---

## dv.echartsBar(x, y, options)

```ts
echartsBar(x: string[], y: number[] | number[][], options?: { height?: string; width?: string; title?: string; xlabel?: string; ylabel?: string; legends?: string[]; stack?: boolean; seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[]; echartsOption?: IEchartsOption; }): HTMLElement;
```

Creates a bar chart

**参数**

- `x` — Array of x-axis values
- `y` — Array of y-axis values, or array of arrays for multiple bars
- `options` — Configuration options
- `options.height` — The height of the container, default as 300px
- `options.width` — The width of the container, default as 100%
- `options.title` — Chart title
- `options.xlabel` — X-axis label
- `options.ylabel` — Y-axis label
- `options.legends` — Array of legend labels for multiple bars
- `options.stack` — Whether to stack bars
- `options.seriesOption` — Additional series configuration. See ://echarts.apache.org/zh/option.html#series-bar for more details
- `options.echartsOption` — Additional ECharts configuration

**返回**：HTMLElement containing the bar chart

**全部可用名**（14，register/别名规则展开）：`EBar` · `EchartsBar` · `addEBar` · `addEbar` · `addEchartsBar` · `addEchartsbar` · `addeBar` · `addebar` · `addechartsBar` · `addechartsbar` · `eBar` · `ebar` · `echartsBar` · `echartsbar`

**来源** `src/core/data-view.ts:1007`

---

## dv.echartsTree(data, options)

```ts
echartsTree(data: ITreeNode, options?: { height?: string; width?: string; title?: string; orient?: 'LR' | 'TB'; layout?: 'orthogonal' | 'radial'; roam?: boolean | 'scale' | 'move'; symbolSize?: number; labelFontSize?: number; nodeRenderer?: (node: IGraphNode) => { name?: string; value?: any; [key: string]: any; }; tooltipFormatter?: (node: ITreeNode) => string; seriesOption?: IEchartsSeriesOption; echartsOption?: IEchartsOption; }): HTMLElement;
```

Creates a tree visualization

**参数**

- `data` — Tree structure data, see  and ://echarts.apache.org/zh/option.html#series-tree.data for more details
- `options` — Configuration options
- `options.height` — The height of the container, default as 300px
- `options.width` — The width of the container, default as 100%
- `options.title` — Chart title
- `options.orient` — Tree orientation ('LR' for left-to-right, 'TB' for top-to-bottom)
- `options.layout` — Tree layout ('orthogonal' for orthogonal layout, 'radial' for radial layout)
- `options.roam` — Whether to enable roam, default as false
- `options.symbolSize` — Size of node symbols, default as 14
- `options.labelFontSize` — Font size of node labels, default as 16
- `options.nodeRenderer` — Custom function to render nodes. Mostly you don't need to provide this.
- `options.tooltipFormatter` — Custom function to render tooltip content. Mostly you don't need to provide this.
- `options.seriesOption` — Additional series configuration; this will be merged within each series option. See ://echarts.apache.org/zh/option.html#series-tree for more details
- `options.echartsOption` — Additional ECharts configuration, see ://echarts.apache.org/zh/option.html#title for more details

**返回**：HTMLElement containing the tree visualization

> ⚠ 顶层 `layout:'radial'` 参数实际被忽略，实现硬编码为 'orthogonal'

**全部可用名**（14，register/别名规则展开）：`ETree` · `EchartsTree` · `addETree` · `addEchartsTree` · `addEchartstree` · `addEtree` · `addeTree` · `addechartsTree` · `addechartstree` · `addetree` · `eTree` · `echartsTree` · `echartstree` · `etree`

**来源** `src/core/data-view.ts:1085`

---

## dv.echartsGraph(nodes, links, options)

```ts
echartsGraph(nodes: (IGraphNode | Block)[], links: IGraphLink[], options?: { height?: string; width?: string; title?: string; layout?: 'force' | 'circular'; roam?: boolean; symbolSize?: number; labelFontSize?: number; nodeRenderer?: (node: IGraphNode) => { name?: string; value?: any; category?: number; [key: string]: any; }; tooltipFormatter?: (node: IGraphNode) => string; seriesOption?: IEchartsSeriesOption; echartsOption?: IEchartsOption; }): HTMLElement;
```

Creates a graph/network visualization

**参数**

- `nodes` — Array of graph nodes, see  and ://echarts.apache.org/zh/option.html#series-graph.data for more details
- `links` — Array of connections between nodes, see  and ://echarts.apache.org/zh/option.html#series-graph.links for more details
- `options` — Configuration options
- `options.height` — The height of the container, default as 300px
- `options.width` — The width of the container, default as 100%
- `options.title` — Chart title
- `options.layout` — Layout type, default as 'force'
- `options.roam` — Whether to enable roam, default as true
- `options.symbolSize` — Size of node symbols
- `options.labelFontSize` — Font size of node labels
- `options.nodeRenderer` — Custom function to render nodes, return Echarts node type. Mostly you don't need to provide this.
- `options.tooltipFormatter` — Custom function to render tooltip content. Mostly you don't need to provide this.
- `options.seriesOption` — Additional series configuration, see ://echarts.apache.org/zh/option.html#series-graph for more details
- `options.echartsOption` — Additional ECharts configuration, see ://echarts.apache.org/zh/option.html#title for more details

**返回**：HTMLElement containing the graph visualization

**全部可用名**（14，register/别名规则展开）：`EGraph` · `EchartsGraph` · `addEGraph` · `addEchartsGraph` · `addEchartsgraph` · `addEgraph` · `addeGraph` · `addechartsGraph` · `addechartsgraph` · `addegraph` · `eGraph` · `echartsGraph` · `echartsgraph` · `egraph`

**来源** `src/core/data-view.ts:1238`

---

## dv.render()

```ts
render(): void;
```

Renders the DataView and sets up event handlers and cleanup

> ⚠ **非纯渲染**：执行时持久化嵌入块（POST /api/search/updateEmbedBlock，内容取该块 innerText）。静态视图末尾调一次；勿在循环/高频路径调用

**来源** `src/core/data-view.ts:1406`

---

