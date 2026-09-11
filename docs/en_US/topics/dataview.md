# DataView Views

## Basic Usage of DataView

Although the above operations use JavaScript, they seem to be no different from native embedded blocks in essence—the results are still rendered by SiYuan. However, if you use the DataView feature, you can render the queried blocks into various different views.

In this section, we will first introduce three basic view components:

1. List
2. Table
3. Markdown text

🔔 For advanced usage of these components and more complex components, please refer to the "Advanced Usage" section later.

### DataView.list

First, here is a basic example. Compared to the JS query above, three changes have been made here: 1) Declare a DataView object at the beginning; 2) After querying `blocks`​, use the `dv.addlist`​ API; 3) Remove `return`​ and replace it with `dv.render()`​.

```js
//!js
let dv = Query.DataView(protyle, item, top); // 1. Add this line at the beginning, note that protyle, item, top are fixed parameters
let blocks = await Query.random(5);
dv.addlist(blocks); // 2. Call dv.addlist to add a list view
dv.render(); // 3. Remove return, end with dv.render()
```

With the above code, we can display the blocks obtained from the SQL query as a list in the embedded block, as shown below:

![image](../../assets/image-20241204001321-csglpyu.png)

By default, each list item is a block link, which can be hovered over to view and clicked to jump.

![image](../../assets/image-20241204001504-jz4gbh1.png)

In the second parameter of the list function, you can pass some options:

```ts
{
    type?: 'u' | 'o'; // u for unordered list, o for ordered list; default is u
    columns?: number; // After passing an integer, it will be displayed in columns
    renderer?: (b: T) => string | number | undefined | null; // Renderer function, the returned value will be treated as markdown text
}
```

For example, let's display the list as a double-column, ordered list; and we provide a renderer function to only display the `hpath`​ attribute of the block.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const blocks = await Query.random(5);
dv.addlist(blocks, {
  type: 'o',
  columns: 2,
  renderer: (b) => b.hpath
});
dv.render();
```

![image](../../assets/image-20241207210617-i5tmd5l.png)

### DataView.Table

In addition to lists, another commonly used view is the table. We repeat the above code, but this time we switch to `addtable`​.

```js
//!js
let dv = Query.DataView(protyle, item, top); // Always start with this
const blocks = await Query.random(5);
dv.addtable(blocks);
dv.render(); // Always end with this
```

The effect is as follows:

![image](../../assets/image-20241204002444-9j30l5k.png)

The table component automatically renders different columns appropriately: for example, type is rendered as the actual type name, hpath as a document hyperlink, and box as the actual notebook name.

The columns displayed by default can be configured in the settings.

![image](../../assets/image-20241204002830-35q4qjh.png)

Similarly, the table also has some configurable fields:

```ts
{
    center?: boolean; // Center
    fullwidth?: boolean; // Full width
    index?: boolean;  // Show row number
    cols?: (string | Record<string, string>)[] | Record<string, string>;
    renderer?: (b: Block, attr: keyof Block) => string | undefined | null;
}
```

The first three attributes are straightforward and mainly determine the display style of the table.

![image](../../assets/image-20241204003312-d3040o5.png)

The more important attribute is `cols`​—it allows you to bypass the default configuration and specify the columns to display. Ignoring complex usage, you can remember two simple ways:

* ​`null`​: Display all columns.
* A list of block attribute names: Display the corresponding columns.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const blocks = await Query.backlink(dv.root_id);  // dv.root_id is equivalent to protyle.block.rootID, just less typing
dv.addtable(blocks, { fullwidth: false, cols: null}); // Display all
dv.addtable(blocks, { fullwidth: true, cols: ['root_id', 'box', 'updated']});
dv.render();
```

![image](../../assets/image-20241204003849-8l19z7b.png)

> In the first table above, since it's too wide, we turn off `fullwidth`​ so that you can scroll horizontally to view.

💡 (For advanced usage, can be omitted if you do not know much about js code) The renderer function is used to specify the rendering scheme for each column (key). If not specified, the default cell rendering scheme is used. If the return value is null, the default scheme will be used.

Comparing the following examples, it's clear that one uses the default scheme for all columns, while the other customizes the rendering scheme for the id and box columns.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const blocks = await Query.random(3);
dv.addtable(blocks, {
  cols: ['id', 'hpath', 'root_id', 'box']
});
dv.addtable(blocks, {
  cols: ['id', 'hpath', 'root_id', 'box'],
  renderer: (block, key) => {
      if (key == 'id') return block[key]; // Directly display the original text for the id column
      if (key == 'box') return 'Hahaha';
  }
});
dv.render();
```

![image](../../assets/image-20241208234136-s06cygn.png)

### DataView.md

Did you notice that in the screenshots showing the table parameters, there are some annotation texts? These texts are actually markdown components. We can construct a markdown view via `dv.md`​.

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addmd('## This is a secondary title')
dv.addmd(`The id of the current document is: ${protyle.block.rootID}`)
dv.addmd(`
1. First
2. Second

{{{col
Supports SiYuan's own multi-column layout syntax

This is the second column
}}}

> The background color style is specified by SiYuan's built-in ial syntax
{: style="background-color: var(--b3-theme-primary-light); font-size: 20px;"}

`)
dv.render();
```

![image](../../assets/image-20241204004702-va0yg1n.png)

> 🙁 Unfortunately, the markdown component does not support content that requires additional rendering, such as mathematical formulas.

Despite some limitations, the markdown component, combined with JavaScript's [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), can still be quite powerful and effectively enrich the content of DataView. Here's a small example: fetching resources from the web and displaying a daily quote in the embedded block.

🙄 Note that due to the use of a web API (randomly found, just for exampling), you may not be able to retrieve data when testing locally.

```js
//!js
let dv = Query.DataView(protyle, item, top);
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    dv.addmd('Today\'s daily quote')
    dv.addmd(`> ${data.data.content} —— ${data.data.origin}`)
 }
})
dv.render();
```

![image](../../assets/image-20241204005817-mpdtp85.png)

## Usage of View Components

In the previous section, we introduced the usage of `addlist`​, `addtable`​, and `addmd`​. Here, list, table, and md are view components.

DataView defines several view components, such as the following creation declaration for the markdown component:

```ts
/**
 * Adds markdown content to the DataView
 * @param md - Markdown text to be rendered
 * @returns HTMLElement containing the rendered markdown
 * @example
 * dv.addmd(`# Hello`);
 */
markdown(md: string): HTMLElement;
```

Whenever a new DataView is created, the markdown component is registered in the created DataView instance, adding the `add`​ method:

1. Calling `dv.markdown`​: Creates the Markdown component and **directly returns the HTML element without adding it to the view**.
2. Calling `dv.addmarkdown`​: Creates the Markdown component and **automatically adds it to the DataView**.

Each `dv.xxx/dv.addxxx`​ function returns the container Element of the corresponding view component. These container elements:

* Have class names like `data-view-component`​ (due to module CSS, the actual name may not be exactly this).
* Have a `data-id`​ attribute to uniquely identify a view.

  ```js
  const ele = dv.addmd('## hi')
  const mdId = ele.dataset.id;
  ```

![image](../../assets/image-20241209210930-k9vnume.png)

Some components also define aliases, such as the markdown component having an alias `md`​. This means:

* ​`dv.md`​ is equivalent to `dv.markdown`​.
* ​`dv.addmd`​ is equivalent to `dv.addmarkdown`​.

> 🔔 Note: `DataView`​ automatically adds **the lowercase version of the component name as an alias**.

The following introduces some other built-in components in DataView.

## Nested List

In the previous section, we introduced the basic usage of the list. However, some more complex usages have not been covered: the list component can display nested lists.

If an element passed to the list component contains a `children`​ element, the entire list will be rendered as a nested list.

```ts
list(data: (IBlockWithChilds | ScalarValue)[], options?: IListOptions<Block>): HTMLElement;

interface IBlockWithChilds extends Block, IHasChildren<Block>, ITreeNode {
    id: string;
    name: string;
    content: string;
    children?: IBlockWithChilds[];
}
```

🖋️ The following example uses the list component to display the secondary subdirectories of the current document.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    // Get the sub-documents of the sub-document
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
dv.addlist(childs);
dv.render();
```

![image](../../assets/image-20241206184455-4in6gct.png)

## Cards

```ts
cards(blocks: Block[], options?: {
    cardWidth?: string;
    cardHeight?: string;
    fontSize?: string;
})
```

The Card component displays the content of blocks in a card format. Parameters are as follows:

* ​`cardWidth`​: Width of each card; default is '175px'
* ​`cardHeight`​: Height of each card; default is '175px'
* ​`fontSize`​: Base font size for the cards; default is '14px'

🖋️ The following example shows randomly queried results as cards:

```js
//!js
let dv = Query.Dataview(protyle, item, top);
let blocks = await Query.random(8);
dv.addCard(blocks);
dv.render();
```

![image](../../assets/image-20250316162044-1l2i63f.png)

Clicking on the card title will navigate to the corresponding block.

## Embed

```ts
 embed(blocks: Block[] | Block, options: {
      breadcrumb?: boolean;
      limit?: number;
      columns?: number;
      zoom?: number;
  }): HTMLElement;
```

The Embed component is used to display the content of blocks (equivalent to embedding a simplified embedded block inside an embedded block). The input parameters are blocks or a list of blocks.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.random(2);
dv.addembed(blocks)
dv.render();
```

![image](../../assets/image-20241206182941-yzctkxu.png)

Each embedded component has a small icon in the top-right corner. Clicking it will jump to the corresponding block. In addition, the embedded component has several additional parameters:

* ​`breadcrumb`​: Whether to display the document breadcrumb.
* ​`limit`​: Limits the number of blocks displayed.
* ​`zoom`​: Zoom factor, between 0 and 1, 1 means no zoom.
* ​`columns`​: Multi-row display.

When the content displayed in the embedded block is relatively compact, these parameters may be useful. The following example shows a case: limit to displaying only 3 blocks, zoom to 0.75, and display in double columns.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.random(5, 'd');
dv.addembed(blocks, {
  limit: 3, zoom: 0.75, columns: 2
});
dv.render();
```

![image](../../assets/image-20241206183442-ra4h7xl.png)

## Mermaid Series

The mermaid component can take a mermaid code and render it in DataView.

```js
mermaid(code: string): HTMLElement;
```

For example, the simplest case is as follows.

```js
//!js
const dv = Query.DataView(protyle, item, top);
dv.addmermaid(`
graph LR
  A --> B
`);
dv.render();
```

![image](../../assets/image-20241206185311-ajowi8u.png)

In addition to the original mermaid, DataView also provides some views built on top of mermaid.

### MermaidRelation

```ts
mermaidRelation(tree: IBlockWithChilds | Record<string, Block[]>, options?: {
    type?: "flowchart" | "mindmap";
    flowchart?: 'TD' | 'LR';
    renderer?: (b: Block) => string;
}): HTMLElement;

interface IBlockWithChilds extends Block, IHasChildren<Block>, ITreeNode {
    id: string;
    name: string;
    content: string;
    children?: IBlockWithChilds[];
}
```

MermaidRelation is mainly used for visualizing the relationship between blocks. The input parameters are similar to those of the nested list—a list of blocks with a `children`​ list property `Block[]`​.

You can specify the `options.type`​ parameter as "flowchart" or "mindmap" to correspond to two different mermaid charts.

The following example shows the two-layer document tree relationship of the current block through flowchart.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    // Get the sub-documents of the sub-document
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
thisdoc.children = childs; // Build the root node of the tree structure
dv.addmermaidRelation(thisdoc, { type: 'flowchart', flowchart: 'LR' } );
dv.render();
```

![image](../../assets/image-20241206190453-o0u8eb8.png)

Changing `type: 'flowchart'`​ to `mindmap`​ can also display it in the form of a mind map:

![image](../../assets/image-20241206190618-bb58ls6.png)

> 😃 If the node in the relation diagram corresponds to a SiYuan content block, it can be **hovered to display content** and **clicked to jump** to the corresponding document.

![image](../../assets/image-20241206190600-fu09ywo.png)

![image](../../assets/image-20241206190646-84tfh64.png)

​`MermaidRelation`​ specifies the corresponding view through the `type`​ parameter. For convenience, `dv`​ provides two equivalent components:

* ​`dv.mflowchart`​: Equivalent to the flowchart Relation diagram.
* ​`dv.mmindmap`​: Equivalent to the mindmap Relation diagram..

### MermaidKanban

```ts
mermaidKanban(groupedBlocks: Record<string, Block[]>, options: {
    priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low',
    clip?: number,
    width?: string
});
```

mermaidKanban is mainly used to display blocks in the form of kanban, and it has an alias of `mKanban`​.

* ​`groupedBlocks`​: A structure of `group name: array of Blocks`​, and each group will be displayed separately as a column in the Kanban.
* ​`options`​

  * ​`priority`​: Used to specify the priority parameter of the block. For details, see [https://mermaid.js.org/syntax/kanban.html#supported-metadata-keys](https://mermaid.js.org/syntax/kanban.html#supported-metadata-keys).
  * ​`clip`​: The maximum length of the text of each block in the kanban. The default is 50, and the text exceeding this length will be truncated.
  * ​`width`​: The width of the kanban; 💡 It is recommended to pass in a value of `<number of groups> x <width of each group>`​.

The options.type parameter can be specified as two types, "flowchart" or "mindmap", which respectively correspond to two different mermaid diagrams.

The following case will retrieve the unfinished Todos of each month and display them in the Kanban.

```js
//!js
let dv = Query.Dataview(protyle, item, top);
// Omit `after` to query all unfinished tasks, capped at 128 results.
let blocks = await Query.task({ limit: 128 });
let grouped = blocks.groupby((b) => {
    return b.createdDate.slice(0, -3)
});
let N = Object.keys(grouped).length;
// each group with a fixed witdh 200px
dv.addmkanban(grouped, {
    width: `${N * 200}px`
});
dv.render();
```

![image](../../assets/image-20241213214406-rfj8yqh.png)

> 😃 Each block in the Kanban diagram can also **hover** to display content and **click to jump** to the corresponding document.

## ECharts Series

```ts
echarts(echartOption: IEchartsOption, options?: {
    height?: string;
    width?: string;
    events?: {
        [eventName: string]: (params: any) => void;
    };
}): HTMLElement;
```

You can generate an echarts chart via `dv.echarts`​, where the first parameter is the echarts `option`​ parameter. Refer to [https://echarts.apache.org/en/option.html](https://echarts.apache.org/en/option.html).

> ⭐ For echarts, please refer to: [https://echarts.apache.org/handbook/en/get-started/](https://echarts.apache.org/handbook/en/get-started/)
>
> 🖋️ By default, echarts renders in svg mode. If you want to switch to canvas, you can change it in the plugin settings.

```js
//!js
const option = {
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      areaStyle: {}
    }
  ]
};
let dv = Query.DataView(protyle, item, top);
dv.addecharts(option);
dv.render();
```

![image](../../assets/image-20241206191639-v6yiw7f.png)

The `height`​ and `width`​ parameters determine the height and width of the echart container. The default height is 300px, and the width is 100%.

### EChartsLine

```ts
echartsLine(x: number[], y: number[] | number[][], options?: {
    height?: string;
    width?: string;
    title?: string;
    xlabel?: string;
    ylabel?: string;
    legends?: string[];
    seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[];
    echartsOption?: IEchartsOption;
}): HTMLElement;
```

EChartsLine is mainly used for drawing line charts. It has an alias `eLine`​. You can refer to [https://echarts.apache.org/examples/en/editor.html?c=line-simple](https://echarts.apache.org/examples/en/editor.html?c=line-simple) to understand its basic effect.

Input data parameters:

* ​`x`​: The x-axis data of the curve.
* ​`y`​: The y-axis data of the curve, which can be passed in multiple times to display multiple curves.

​`options`​ parameters:

* ​`height`​/`width`​: Same as the echart component parameters.
* ​`title`​: The title of the line chart.
* ​`xlabel`​, `ylabel`​: The labels of the x-axis and y-axis.
* ​`legends`​: The names of the curves.
* ​`seriesOption`​: You can pass in custom series options to override the internal default values.

  * See: [https://echarts.apache.org/en/option.html#series-line](https://echarts.apache.org/en/option.html#series-line)
* ​`echartsOption`​: You can pass in custom echart options to override the internal default values.

  * See: [https://echarts.apache.org/en/option.html#title](https://echarts.apache.org/en/option.html#title)

🖋️ **Example**: Count the number of documents created each month and plot it as a curve.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const SQL = `
SELECT
    SUBSTR(created, 1, 6) AS month,
    COUNT(*) AS count
FROM
    blocks
WHERE
    type = 'd'
GROUP BY
    SUBSTR(created, 1, 6)
ORDER BY
    month;
`;

let blocks = await Query.sql(SQL);

dv.addeline(blocks.pick('month'), blocks.pick('count'), {
    title: 'Number of documents created each month',
    xlabel: 'Month',
    ylabel: 'Number of documents created'
});

dv.render();
```

![image](../../assets/image-20241207010811-8lh25x5.png)

### EChartsBar

```ts
echartsBar(x: string[], y: number[] | number[][], options?: {
    height?: string;
    width?: string;
    title?: string;
    xlabel?: string;
    ylabel?: string;
    legends?: string[];
    stack?: boolean;
    seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[];
    echartsOption?: IEchartsOption;
}): HTMLElement;
```

EChartsLine is mainly used for drawing bar charts. It has an alias `eBar`​. You can refer to [https://echarts.apache.org/examples/en/editor.html?c=bar-simple](https://echarts.apache.org/examples/en/editor.html?c=bar-simple) to see its basic effect.

Input data parameters:

* ​`x`​: The x-axis data of the bar chart.
* ​`y`​: The y-axis data of the bar chart, which can be passed in multiple times. Whether they are displayed separately or stacked depends on `options.stack`​.

​`options`​ parameters:

* ​`height`​/`width`​: Same as the echart component parameters.
* ​`title`​: The title of the line chart.
* ​`stack`​: If true, multiple y-axis data will be stacked together.
* ​`seriesOption`​: See [https://echarts.apache.org/en/option.html#series-bar](https://echarts.apache.org/en/option.html#series-bar)
* ​`echartsOption`​

🖋️ **Example**: We replace `eline`​ with `ebar`​ in the previous example to draw a bar chart. Most parameters are used similarly.

![image](../../assets/image-20241207010958-u6g07gl.png)

### EChartsTree

```ts
echartsTree(data: ITreeNode, options: {
    height?: string,
    width?: string,
    title?: string,
    orient?: 'LR' | 'TB',
    layout?: 'orthogonal' | 'radial',
    roam?: boolean | 'scale' | 'move',
    symbolSize?: number,
    labelFontSize?: number,
    nodeRenderer?: (node: IGraphNode) => {
        name?: string;
        value?: any;
        [key: string]: any;
    },
    tooltipFormatter?: (node: ITreeNode) => string,
    seriesOption?: IEchartsSeriesOption,
    echartsOption?: IEchartsOption,
}

interface ITreeNode {
    name: string;
    children?: ITreeNode[];
    [key: string]: any;
}
```

EChartsTree is mainly used for drawing tree diagrams. It has an alias `eTree`​. You can refer to [https://echarts.apache.org/examples/en/editor.html?c=tree-basic](https://echarts.apache.org/examples/en/editor.html?c=tree-basic) to see its basic effect.

Input data parameters:

* ​`data: ITreeNode`​

  * You can directly pass in a block with a `children`​ object (just like the parameters used in `list`​ and `mermaidRelation`​), and the plugin will automatically convert it to the echart tree diagram parameters.

​`options`​ parameters:

* ​`height`​/`width`​: Same as the echart component parameters.
* ​`title`​: The title of the line chart.
* ​`orient`​: The orientation of the tree.
* ​`layout`​: The layout of the tree, with two options: horizontal-vertical layout and radial layout.
* ​`roam`​: Set to true to allow mouse panning and zooming of the tree diagram; default is off.
* ​`symbolSize`​/`labelFontSize`​: The size of the nodes and the font size of the text, default is 14 and 16.
* ​`nodeRenderer`​:

  * Converts the input Node (SiYuan's `Block`​) to the `{name: string, value: string}`​ type data accepted by echarts.
  * The return value can only have the `name`​ property or the `value`​ property; whichever property exists will override the corresponding default configuration.
  * **Generally not needed**.
* ​`tooltipFormatter`​: The content of the tooltip that pops up when hovering over the node, which can be HTML text.

  * **Generally not needed**.
* ​`seriesOption`​: See [https://echarts.apache.org/en/option.html#series-tree](https://echarts.apache.org/en/option.html#series-tree)
* ​`echartsOption`​

🖋️ **Example**: The data structure input to the etree component is basically the same as that in the `mermaidRelation`​ example. We modify the previous code displayed in mermaid relation and display the tree structure using the tree component.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    // Get the sub-documents of the sub-document
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
thisdoc.children = childs; // Build the root node of the tree structure
dv.addetree(thisdoc, {
    orient: 'LR', height: '600px',
});
dv.render();
```

😃 As long as the content block of SiYuan is bound, the nodes are interactive:

* **Ctrl + Click** can **jump** to the corresponding block.
* **Hovering** will pop up a tooltip, where the first line of the block ID can **hover to view** the full block content or **click to jump**.

  ![image](../../assets/image-20241207171409-l4z5ffo.png)

### EChartsGraph

```ts
echartsGraph(nodes: (IGraphNode | Block)[], links: IGraphLink[], options: {
    height?: string,
    width?: string,
    title?: string,
    layout?: 'force' | 'circular',
    roam?: boolean,
    symbolSize?: number,
    labelFontSize?: number,
    nodeRenderer?: (node: IGraphNode) => {
        name?: string;
        value?: any;
        category?: number;
        [key: string]: any;
    },
    tooltipFormatter?: (node: IGraphNode) => string,
    seriesOption?: IEchartsSeriesOption,
    echartsOption?: IEchartsOption,
}

interface IGraphNode {
    id: string;
    name?: string;
    value?: string;
    category?: number;
    [key: string]: any;
}

//SrcNode --> TargetNode
interface IGraphLink {
    source: string;  //SrcNode's ID
    target: string | string[];  //TargetNode's ID
    [key: string]: any;
}
```

EChartsGraph is mainly used for drawing network relationship diagrams. It has an alias `eGraph`​. You can refer to [https://echarts.apache.org/examples/en/editor.html?c=graph-simple](https://echarts.apache.org/examples/en/editor.html?c=graph-simple) to see its basic effect.

Input data parameters:

* ​`nodes`​: The nodes parameter of the echarts graph diagram, refer to [https://echarts.apache.org/en/option.html#series-graph.data](https://echarts.apache.org/en/option.html#series-graph.data)

  * ​`id`​: The ID of the node.
  * ​`name`​: The name displayed by the node.
  * ​`value`​: The value of the node.
  * 🔔 Generally, you don't need to specially construct the Node structure; you can **directly pass in the queried** **​`Block[]`​** ​ **list**.
* ​`links`​: The links parameter of the echarts graph diagram, refer to [https://echarts.apache.org/en/option.html#series-graph.links](https://echarts.apache.org/en/option.html#series-graph.links)

  * ​`source`​: The ID of the source node.
  * ​`target`​: The ID of the target node.
  * 🔔 Generally, you **need to build the association relationship yourself in the code**.

    For simplicity, the component allows `target`​ to be a list of IDs (in the original echart graph parameters, target can only be a single ID, but in DataView, you can pass in multiple target IDs at once).

Options parameters:

* ​`height`​/`width`​: Same as the echart component parameters.
* ​`title`​: The title of the line chart.
* ​`layout`​: The layout of the graph, with two options: force layout and circular layout.
* ​`roam`​: Set to true to allow mouse panning and zooming of the tree diagram; default is off.
* ​`symbolSize`​/`labelFontSize`​: The size of the nodes and the font size of the text, default is 14 and 16.
* ​`nodeRenderer`​:

  * Converts the input Node (SiYuan's `Block`​) to the `{name: string, value: string}`​ type data accepted by echarts.
  * The return value can only have the `name`​ property or the `value`​ property; whichever property exists will override the corresponding default configuration.
  * **Generally not needed**.
* ​`tooltipFormatter`​: The content of the tooltip that pops up when hovering over the node, which can be HTML text.

  * **Generally not needed**.
* ​`seriesOption`​: See [https://echarts.apache.org/en/option.html#series-graph](https://echarts.apache.org/en/option.html#series-graph)
* ​`echartsOption`​

🖋️ **Example**: Here we show a document's sub-documents and backlink graph, with the following configuration:

* All sub-document nodes are displayed in blue.
* All backlink nodes are displayed in yellow.
* To avoid monotony, a random connection is established between sub-documents and backlink blocks.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
let backlinks = await Query.backlink(dv.root_id);
childs = childs.addcols({category: 0});  // Add category number, specify as category 0
backlinks = backlinks.addcols({category: 1});  // Specify as category 1
let nodes = [thisdoc, ...childs, ...backlinks];  // Merge into the node list
let links = [
  { source: thisdoc.id, target: childs.pick('id') },  // Sub-document association relationship
  { source: thisdoc.id, target: backlinks.pick('id') },  // Backlink association relationship
];
if (childs.length > 0 && backlinks.length > 0) {
  // Randomly select two nodes to establish an association relationship
  links.push({ source: childs[0].id, target: backlinks[0].id })
}

dv.addegraph(nodes, links, {
    height: '500px',
    roam: true,
    seriesOption: {
        categories: [
            {
                name: 'Sub-documents',
          symbolSize: 14,
                itemStyle: {
                    color: 'var(--b3-theme-primary)'
                },
                label: {
                    fontSize: 14, // Set label font size
                    color: 'var(--b3-theme-primary)' // Set label color
                }
            },
            {
                name: 'Backlinks',
          symbolSize: 20,
                itemStyle: {
                    color: 'var(--b3-theme-secondary)'
                },
                label: {
                    fontSize: 20
                }
            },
        ],
    }
});

dv.render();
```

The effect is as follows. Like the tree diagram, each node in the graph can be **Ctrl + Clicked to jump**, and **hovering** will display node details.

![image](../../assets/image-20241207193310-9gpfbtk.png)

## Columns and Rows

```js
columns(elements: HTMLElement[], options: {
    gap?: string;
    flex?: number[];
    minWidth?: string | number
}): HTMLDivElement;

rows(elements: HTMLElement[], options?: {
    gap?: string;
    flex?: number[];
}): HTMLDivElement;
```

You can add multi-column or multi-row layouts (based on flex) via columns and rows. These components require a list of HTML elements. `options`​ parameters:

* ​`gap`​: The spacing between multiple rows or columns, default is 5px.
* ​`flex`​: The ratio of multiple rows or columns, default is unspecified, meaning equal spacing.
* columns

  * `minWidth`​: In a multi-column layout, the minimum width of each column; default is 350px. This parameter primarily comes into play when there are many columns, exceeding the container's range and requiring horizontal scrolling.

Here is an example of a multi-column layout:

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addcolumns([
  dv.md('## First Column'),
  dv.md('## Second Column'),
  dv.rows([
      dv.md('## Third Column'),
      dv.md('Content below the third column\n{: style="background-color: pink"}'),
    ], { gap: '20px' }
  )
], { flex: [1, 1, 2]}); // flex specifies the ratio of three columns as 1:1:2
dv.render();
```

![image](../../assets/image-20241206192654-ycr25wv.png)

## Details

```ts
details(summary: string, content: string | HTMLElement)
```

Details are used to create a collapsible list. The first parameter is the title of the list, and the content is the content inside the list.

The following example shows a case where several blocks are randomly queried and grouped by notebook, with each group's content placed in a collapsible list.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.random(10);
// Use the groupby function to group
blocks.groupby('box', (boxid, group) => {
    const boxname = Query.utils.boxname(boxid);
    const ele = dv.list(group);
    dv.adddetails(boxname, ele);
});
dv.render();
```

![image](../../assets/image-20241206193640-g5h5jp9.png)

## AddElement

```js
addElement(ele: HTMLElement | string, disposer?: () => void)
```

AddElement can add an externally created element as a custom view to DataView. This method also has an alias `addele`​.

> 🔔 If you have a large number of custom element requirements, it is recommended to use the "Custom View Component" feature mentioned later.

The `addele`​ element automatically wraps the passed element into a View Container element. You can get the container's ID via `returnedEle.dataset.id`​.

## AddDisposer

```js
addDisposer(dispose: () => void, id?: string)
```

AddDisposer accepts a callback function as a parameter, which will automatically run when DataView is destroyed.

> **Destroyed** can be directly understood as **clicking the refresh button to re-query the embedded block, causing DataView to repaint**. For specific details, please refer to the "Understanding DataView's Lifecycle" section.

The following is an example: create a timer and destroy the timer when refreshing.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 0;

dv.addele(span);

let timer = setInterval(() => {
    console.log(span.innerText);
    span.innerText = parseInt(span.innerText) + 1;
}, 1000);

dv.addDisposer(() => {
    console.log('dispose timer!');
    clearInterval(timer);
});

dv.render();
```

![image](../../assets/image-20241206194739-md7he6w.png)

## RemoveView

```js
removeView(id: string)
```

Given a view component's id (`container.dataset.id`​), you can call the `removeView`​ method to delete it.

> 🔔 The advantage of `reviewView`​ over directly using `ele.remove()`​ in your js code is: if the component has bound with a `dispose`​ function, it will be automatically executed before deletion.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 0;

// Equivalent to the above addele + addDisposer steps combined
const eleId = (dv.addele(span, () => {
    console.log('dispose timer!');
    clearInterval(timer);
})).dataset.id; // Alias of addElement

let timer = setInterval(() => {
    console.log(span.innerText);
    span.innerText = parseInt(span.innerText) + 1;
}, 1000);

// Delete component button
const button = document.createElement('button');
button.innerText = 'Remove';
button.onclick = () => { dv.removeView(eleId); }
dv.addele(button);

dv.render();
```

![image](../../assets/image-20241209212929-dlfxtip.png)

## ReplaceView

```js
replaceView(id: string, viewContainer: HTMLElement, disposer?: () => void)
```

* Given a view component's id (`container.dataset.id`​), you can call the `replaceView`​ method to replace it with a new component.
* If the old component has a `dispose`​ function, it will automatically be executed before replacement (essentially deletion).
* You can pass a `disposer`​ function as an additional `dispose`​ function for the component (<u>generally not necessary</u>).
* Note:

  1. The passed `viewContainer`​ must also be a View Container element.
  2. After replacing the original component's position, the `data-id`​ field of the passed `viewContainer`​ will be modified to the original ID (not the new ID generated before passing).

We modify the above example: after clicking the button, display the deletion prompt message in the original counter position.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 0;
const eleId = (dv.addele(span)).dataset.id; // Alias of addElement

let timer = setInterval(() => {
    console.log(span.innerText);
    span.innerText = parseInt(span.innerText) + 1;
}, 1000);

dv.addDisposer(() => {
    console.log('dispose timer!');
    clearInterval(timer);
}, eleId);

const button = document.createElement('button');
button.innerText = 'Replace';
button.onclick = () => {
  let time = Query.utils.now();
  dv.replaceView(
    eleId,
    dv.md(`> ${time}: Old View Replaced`),
    () => {
      console.log('Dispose:', time);
    }
  );
}
dv.addele(button);

dv.render();
```

![image](../../assets/image-20241209220101-oypr89p.png)
