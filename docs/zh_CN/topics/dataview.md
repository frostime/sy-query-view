# DataView 视图

## DataView 的基础使用

以上的操作虽然使用了 javascript，但是在本质上似乎和原生的嵌入块没什么不同——最后查询到的结果依然是交给思源去渲染。但是如果使用 DataView 功能，则可以将查询到的块渲染为各种不同的视图。

在这一小节中，我们首先介绍三个最基础的视图组件：

1. 列表
2. 表格
3. markdown 文本

🔔 这些组件的高级用法，以及更多更复杂的组件，在后面的「进阶用法」中介绍。

### DataView.list

首先给出一个基本的案例，相较于上面的 JS 查询，这里做了三个变动：1）在开头声明一个 DataView 对象；2）在查询到 `blocks`​ 后，使用 `dv.addlist`​ API；3）在最后去掉 `return`​，改为 `dv.render()`​

```js
//!js
let dv = Query.DataView(protyle, item, top); //1. 在开头加上这么一行，注意 protyle, item, top 三个参数是永远固定不动的
let blocks = await Query.random(5);
dv.addlist(blocks); //2. 调用 dv.addlist 添加一个列表视图
dv.render(); //3. 去掉 return, 以 dv.render() 结尾
```

通过以上的代码，我们就可以将 SQL 语句查询到几个块，以列表的形式在嵌入块中展示，效果如下：

![image](../../assets/image-20241204001321-csglpyu.png)

默认情况下，每个列表项都是一个块链接，同样可以悬浮查看以及点击跳转。

![image](../../assets/image-20241204001504-jz4gbh1.png)

在 list 函数的第二个参数中，可以传入一些可选项

```ts
{
    type?: 'u' | 'o'; //u 代表无序列表，o 代表有序列表；默认 u
    columns?: number; //传输一个整数后，会分栏显示
    renderer?: (b: T) => string | number | undefined | null; //渲染函数, 返回的值会被视为 markdown 文本
}
```

比如下面我们把列表以双列、有序列表的形式重新展示一遍；并且我们提供一个 renderer 函数，只展示这个块的 `hpath`​ 属性

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

除了列表之外，另一个最常用的视图应该就是表格了。我们把上面的代码重复一遍，不过这次换成 `addtable`​

```js
//!js
let dv = Query.DataView(protyle, item, top); //永远是这个开头不动
const blocks = await Query.random(5);
dv.addtable(blocks);
dv.render(); //永远是这个结尾不动
```

效果如下：

![image](../../assets/image-20241204002444-9j30l5k.png)

table 组件会自动以合适的方式渲染不同的列：比如 type 被渲染为实际的类型名称、hpath 被渲染为文档的超链接、box 被渲染为实际的笔记本的名称等。

表格默认显示的列，可以在设置中配置。

![image](../../assets/image-20241204002830-35q4qjh.png)

同样，表格也有一些可以配置的字段。

```ts
{
    center?: boolean; //居中
    fullwidth?: boolean; //全宽
    index?: boolean;  //显示行号
    cols?: (string | Record<string, string>)[] | Record<string, string>;
    renderer?: (b: Block, attr: keyof Block) => string | undefined | null;
}
```

前面三个属性的用法比较直观，主要是制定了表格的显示方式。

![image](../../assets/image-20241204003312-d3040o5.png)

更重要的是 `cols`​ 这个属性——他可以绕过默认的配置，自行指定需要展示的列，不考虑复杂的用法，可以只用记住两种最简单的用法：

* 为 `null`​，则显示所有的列
* 为块属性名称的列表，则显示对应的列

```js
//!js
let dv = Query.DataView(protyle, item, top);
const blocks = await Query.backlink(dv.root_id);  //dv.root_id 等价于 protyle.block.rootID，算是能少写一点字
dv.addtable(blocks, { fullwidth: false, cols: null}); //全部显示
dv.addtable(blocks, { fullwidth: true, cols: ['root_id', 'box', 'updated']});
dv.render();
```

![image](../../assets/image-20241204003849-8l19z7b.png)

> 上面第一个表格，由于太宽了，所以把 `fullwidth`​ 关掉，这样就可以横向滚动查看了。

💡 （略高级的用法，如果没有 JS 基础可以跳过）renderer 函数用于指定渲染各个列（key）的方案，如果不指定则使用默认的单元格渲染方案。而如果返回值为 null ，同样会会退到默认方案。

对比以下的案例，很明显就能看出区别，一个全部使用默认方案，另一个自定义了 id 和 box 两列的渲染方案。

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
      if (key == 'id') return block[key]; // key 列直接显示原始文本
      if (key == 'box') return 'Hahaha';
  }
});
dv.render();
```

![image](../../assets/image-20241208234136-s06cygn.png)

### DataView.md

不知道你有没有注意，在上面展示表格的几个参数的时候，在截图中有一些标注文字。这些文字，实际上是 markdown 组件。我们可以通过 `dv.md`​ 的形式，构造一个 markdown 视图。

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addmd('## 这是一个二级标题')
dv.addmd(`当前文档的 id 是: ${protyle.block.rootID}`)
dv.addmd(`
1. 第一个
2. 第二个

{{{col
支持思源自己的多栏布局语法

这是第二列
}}}

> 截图中双栏的外边框是我思源的代码片段，但是这个块的样式则是思源自带的 ial 语法
{: style="background-color: var(--b3-theme-primary-light); font-size: 20px;"}

`)
dv.render();
```

![image](../../assets/image-20241204004702-va0yg1n.png)

> 🙁  不过遗憾的是，markdown 组件并不支持数据公式等这些需要额外渲染的内容。

尽管有一些限制，markdown 组件配合 javascript 的[模板字符串](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Template_literals)还是能有相当大的作用的，也能有效地充实 DataView 的内容。下面给一个小例子，通过 `fetch`​ 获取网络上的资源，然后在嵌入块中显示每日一句。

🙄 注意，由于使用了（网上随便找到）网络接口，所以你在本地测试的时候不一定能获取到数据。

```js
//!js
let dv = Query.DataView(protyle, item, top);
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    dv.addmd('今天的每日一句')
    dv.addmd(`> ${data.data.content} —— ${data.data.origin}`)
 }
})
dv.render();
```

![image](../../assets/image-20241204005817-mpdtp85.png)

## 视图组件的用法

在前面的小节当中，我们介绍了 `addlist`​, `addtable`​ 和 `addmd`​三种用法。这里面的 list, table, md 都是视图组件。

Dataview 中定义了若干的视图组件，例如如下是 markdown 组件的创建声明。

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

每当一个新的 Dataview 创建的时候， markdown 组件就会注册到创建的 dataview 实例中、添加 `add`​ 方法：

1. 调用`dv.markdown`​ ：创建 Markdown 组件并**直接返回 HTML 元素，而不添加到视图中**
2. 调用 `dv.addmarkdown`​ ：创建 Markdown 组件并**自动加入到 DataView 的视图当中**

每个 `dv.xxx/dv.addxxx`​ 函数，都会返回对应视图元素的 container Element，这些 container 元素会：

* 有类似 `data-view-component`​ 的类名（由于 moudule css 的原因，可能实际不完全是这个名称）
* 有一个 `data-id`​ 属性唯一标识一个视图

  ```js
  const ele = dv.addmd('## hi')
  const mdId = ele.dataset.id;
  ```

![image](../../assets/image-20241209210930-k9vnume.png)

一些组件还会定义一些别名（Alias），例如 markdown 组件有一个 md 的别名。这意味着：

* ​`dv.md`​ 等价于 `dv.markdown`​
* ​`dv.addmd`​ 等价于 `dv.addmarkdown`​

> 🔔 注：`DataView`​ 会给所有的组件**自动添加他小写版本的别名。**

以下介绍 Dataview 中内置的一些其他的组件。

## 嵌套 list

在前面我们介绍过 list 的基本用法。不过有些复杂一些的用法还没有涉及到：list 组件可以显示嵌套列表。

如果传入 list 组件的某个元素中，如果含有 `children`​ 元素，那么将会以嵌套列表的形式渲染整个列表。

```ts
list(data: (IBlockWithChilds | ScalarValue)[], options?: IListOptions<Block>): HTMLElement;

interface IBlockWithChilds extends Block, IHasChildren<Block>, ITreeNode {
    id: string;
    name: string;
    content: string;
    children?: IBlockWithChilds[];
}
```

🖋️ 以下这个案例，会使用 list 组件来展示当前文档的二级子目录。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    //获取子文档的子文档
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
dv.addlist(childs);
dv.render();
```

![image](../../assets/image-20241206184455-4in6gct.png)

## cards

```ts
cards(blocks: Block[], options?: {
    cardWidth?: string;
    cardHeight?: string;
    fontSize?: string;
})
```

Card 组件以卡片的形式显示块的内容。参数如下:

* ​`cardWidth`​: Width of each card; default is '175px'
* ​`cardHeight `​: Height of each card; default is '175px'
* ​`fontSize `​:  Base font size for the cards; default is '14px'

🖋️ 以下这个案例将随机查询到的结果显示为卡片：

```js
//!js
let dv = Query.Dataview(protyle, item, top);
let blocks = await Query.random(8);
dv.addCard(blocks);
dv.render();
```

![image](../../assets/image-20250316162044-1l2i63f.png)

点击卡片标题可以跳转到对应的块。

## embed

```ts
 embed(blocks: Block[] | Block, options: {
      breadcrumb?: boolean;
      limit?: number;
      columns?: number;
      zoom?: number;
  }): HTMLElement;
```

Embed 组件用于显示块的内容（相当于在嵌入块里面塞入一个简版的嵌入块），传入的参数为块或者块的列表。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.random(2);
dv.addembed(blocks)
dv.render();
```

![image](../../assets/image-20241206182941-yzctkxu.png)

每个嵌入组件右上角有一个小图标，点击后可以跳转到对应的块中。此外嵌入组件还有几个额外的参数：

* breadcrumb：是否显示文档面包屑
* limit：限制显示的块的数量
* zoom：缩放因子, 0 ~ 1 之间，1 代表不缩放
* columns：多行显示

在希望嵌入块显示的内容比较紧凑的时候，这几个参数可能有用。如下展示了一个案例：限制只显示 3 个块，缩放到 0.75 比例，并且以双栏展示。

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

## mermaid 系列

mermaid 组件可以传入一个 mermaid 的代码，然后在 DataView 中渲染展示。

```js
mermaid(code: string): HTMLElement;
```

例如一个最简单的案例如下。

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

除了原始的 mermaid，DataView 还提供一些在 mermad 基础上的构建的视图。

### mermaidRelation

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

mermaidRelation 主要用于可视化块之间的关联关系。他传入的参数和嵌套 list 传入的参数类型——都是可以有 `children`​ 列表属性的块列表 `Block[]`​。

可以将 options.type 参数指定为 "flowchart" 或者 "mindmap" 两种类型，分别对应了两种不同的 mermaid 图表。

下面的案例展示了通过 flowchart 绘制当前块的两层文档树关系。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    //获取子文档的子文档
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
thisdoc.children = childs; //构建 tree 结构的根结点
dv.addmermaidRelation(thisdoc, { type: 'flowchart', flowchart: 'LR' } );
dv.render();
```

![image](../../assets/image-20241206190453-o0u8eb8.png)

把 `type: 'flowchart'`​ 换成 `mindmap`​ 也可以用思维导图的形式显示：

![image](../../assets/image-20241206190618-bb58ls6.png)

> 😃 Relation 图中的节点，只要对应了一个思源的内容块，就可以**悬浮显示内容**以及**点击跳转**到对应文档。

![image](../../assets/image-20241206190600-fu09ywo.png)

![image](../../assets/image-20241206190646-84tfh64.png)

​`mermaidRelation`​ 通过 `type`​ 参数指定对应的视图，为了方便使用，`dv`​ 提供了两个等价的组件：

* ​`dv.mflowchart`​：等价于 flowchart 的 Relation 图
* ​`dv.mmindmap`​：等价于 mindmap 的 Relation 图

### mermaidKanban

```ts
mermaidKanban(groupedBlocks: Record<string, Block[]>, options: {
      priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low',
      clip?: number,
      width?: string
  });
```

mermaidKanban 主要用于用于将块以 kanban 的形式展示出来，它有一个 `mKanban`​ 的别名。

* ​`groupedBlocks`​：一个 `分组名称: Block 数组`​ 的结构，每个分组会被单独显示为 Kanban 中的一栏
* ​`options`​

  * ​`priority`​：用于指定块的 priority 参数，详情见 [https://mermaid.js.org/syntax/kanban.html#supported-metadata-keys](https://mermaid.js.org/syntax/kanban.html#supported-metadata-keys)
  * ​`clip`​：看板中每个块的文本的最大长度，默认 50，超过这个长度的文本会被截断
  * ​`width`​：看板的宽度；💡 建议可以传入一个 `<分组数量> x <每组宽度>`​ 的值进去

可以将 options.type 参数指定为 "flowchart" 或者 "mindmap" 两种类型，分别对应了两种不同的 mermaid 图表。

下面的案例会检索每个月未完成的 Todo，并在 Kanban 中展示。

```js
//!js
let dv = Query.Dataview(protyle, item, top);
// 不传 after：查询全部未完成任务；limit：最多返回 128 条
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

大致效果如下：

![image](../../assets/image-20241213214406-rfj8yqh.png)

> 😃 Kanban 图中每个块同样可以**悬浮显示内容**以及**点击跳转**到对应文档。

## echarts 系列

```ts
echarts(echartOption: IEchartsOption, options?: {
    height?: string;
    width?: string;
    events?: {
        [eventName: string]: (params: any) => void;
    };
}): HTMLElement;
```

可以通过 `dv.echarts`​ 的方式，生成一个 echarts 图表，其中第一个参数为 echarts 的 `option`​ 参数。参考 [https://echarts.apache.org/zh/option.html](https://echarts.apache.org/zh/option.html)。

> ⭐ 关于 echarts，请参考：[https://echarts.apache.org/handbook/zh/get-started/](https://echarts.apache.org/handbook/zh/get-started/)
>
> 🖋️ 默认情况下，echarts 以 svg 的方式渲染，如果你想要换成 canvas，可以在插件的设置中更改。

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

height 和 width 两个参数决定了 echart 图容器的高度和宽度，默认高度为 300px，宽度为 100%。

### echartsLine

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

echarts line 主要用于绘制折线图。他有一个 `eLine`​ 的别名。你可以参考 [https://echarts.apache.org/examples/zh/editor.html?c=line-simple](https://echarts.apache.org/examples/zh/editor.html?c=line-simple) 来了解他的基本效果。

传入的数据参数：

* ​`x`​：曲线的 x 轴数据
* ​`y`​：曲线的 y 轴数据，可以传入多个，这样会显示多条曲线

​`options`​ 参数如下：

* ​`height`​/`width`​：同 echart 组件的参数
* ​`title`​：折线图的标题
* ​`xlabel`​, `ylabel`​：x 轴和 y 轴的标签
* ​`legends`​：曲线的名称
* ​`seriesOption`​：可传入自定义的 series option 覆盖内部默认值

  * 见：[https://echarts.apache.org/zh/option.html#series-line](https://echarts.apache.org/zh/option.html#series-line)
* ​`echartsOption`​：可传入自定义的 echart option 覆盖内部默认的值

  * 见：[https://echarts.apache.org/zh/option.html#title](https://echarts.apache.org/zh/option.html#title)

🖋️ **案例**：统计各个月份中创建文档数量的变化情况，并绘制为曲线

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
    title: '每月创建的文档数量',
    xlabel: '月份',
    ylabel: '创建文档数'
});

dv.render();
```

![image](../../assets/image-20241207010811-8lh25x5.png)

### echatsBar

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

echarts line 主要用于绘制柱状图。他有一个 `eBar`​ 的别名。可参考：[https://echarts.apache.org/examples/zh/editor.html?c=bar-simple](https://echarts.apache.org/examples/zh/editor.html?c=bar-simple) 查看他的基本效果。

传入的数据参数：

* ​`x`​：柱状图的 x 轴数据
* ​`y`​：柱状图的 y 轴数据，可以传入多个，根据 `options.stack`​ 来决定是分开显示还是堆叠显示

​`options`​ 参数如下：

* ​`height`​/`width`​：同 echart 组件的参数
* ​`title`​：折线图的标题
* ​`stack`​：如果为 true，则若有多个 y 轴数据会堆叠在一起显示
* ​`seriesOption`​：见 [https://echarts.apache.org/zh/option.html#series-bar](https://echarts.apache.org/zh/option.html#series-bar)
* ​`echartsOption`​

🖋️ **案例**：我们将上一个案例中的 `eline`​ 换成 `ebar`​，就可以绘制出柱状图出来。大部分参数的用法基本一致。

![image](../../assets/image-20241207010958-u6g07gl.png)

‍

### echartsTree

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

echarts tree 主要用于绘制树形关系图，他有一个 `eTree`​ 的别名。你可以参考[https://echarts.apache.org/examples/zh/editor.html?c=tree-basic](https://echarts.apache.org/examples/zh/editor.html?c=tree-basic)查看他的基本效果。

传入的数据参数：

* ​`data: ITreeNode`​

  * 你可以直接传入一个有 `children`​ 对象的块（就像在 `list`​ 和 `mermaidRelation`​ 中使用的参数一样），插件会自动将其转换为 echart tree 图的参数

​`options`​ 参数如下：

* ​`height`​/`width`​：同 echart 组件的参数
* ​`title`​：折线图的标题
* ​`orient`​：树的朝向
* ​`layout`​：树的布局，有两种布局一种是水平垂直布局，一种是径向环形布局
* ​`roam`​：设定为 true 之后可以鼠标平移缩放 tree 图；默认关闭
* ​`symbolSize`​/`labelFontSize`​：节点的大小和文本的字体大小，默认为 14 和 16
* ​`nodeRenderer`​：

  * 将输入的 Node （思源的 `Block`​）转换为 echarts 接受的 `{name: string, value: string}`​ 类型的数据
  * 返回值可以只有 `name`​ 属性或者只有 `value`​ 属性，哪个属性存在就覆盖对应的默认配置方案
  * **一般情况下不需要提供**
* ​`tooltipFormatter`​：悬浮在节点上的时候，弹出的提示框内部的内容，可以为 html 文本

  * **一般情况下不需要提供**
* ​`seriesOption`​：见[https://echarts.apache.org/zh/option.html#series-tree](https://echarts.apache.org/zh/option.html#series-tree)
* ​`echartsOption`​

🖋️ **案例**：etree 组件输入的 data 数据结构基本上和前面在 `mermaidRelation`​ 差别不大。我们改动之前的在 mermaid relation 中展示的代码，把树结构用 tree 组件来展示。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
for (let child of childs) {
    //获取子文档的子文档
    const subchilds = await Query.childdoc(child.root_id);
    child.children = subchilds;
}
thisdoc.children = childs; //构建 tree 结构的根结点
dv.addetree(thisdoc, {
    orient: 'LR', height: '600px',
});
dv.render();
```

😃 只要绑定了思源的内容块，节点都是可交互的：

* **Ctrl + 点击**可以**跳转**到对应的块
* **悬浮**，会弹出一个提示框，其中第一行的块 ID 可以**悬浮查看**完整的块内容，也可以直接**点击跳转**

  ![image](../../assets/image-20241207171409-l4z5ffo.png)​

### echartsGraph

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
    source: string;  //SrcNode 的 ID
    target: string | string[];  //TargetNode 的 ID
    [key: string]: any;
}
```

echarts graph 主要用于绘制网络关系图，他有一个 `eGraph`​ 的别名。你可以参考[https://echarts.apache.org/examples/zh/editor.html?c=graph-simple](https://echarts.apache.org/examples/zh/editor.html?c=graph-simple)查看他的基本效果。

传入的数据参数：

* ​`nodes`​：echarts graph 图的 nodes 参数，参考[https://echarts.apache.org/zh/option.html#series-graph.data](https://echarts.apache.org/zh/option.html#series-graph.data)

  * ​`id`​: 节点的 ID
  * ​`name`​：节点显示的名称
  * ​`value`​：节点的取值
  * 🔔 一般情况下，你不需要自己特别构建 Node 结构，你可以**直接传入查询得到的** **​`Block[]`​** ​ **列表**
* ​`links`​：echarts graph 图的 links 参数，参考[https://echarts.apache.org/zh/option.html#series-graph.links](https://echarts.apache.org/zh/option.html#series-graph.links)

  * ​`source`​：源节点的 ID
  * ​`target`​：指向节点的 ID
  * 🔔 一般情况下，**需要**你在代码中**自行构建关联关系**

    出于简化代码考虑，组件允许 `target`​ 为一个 ID 的列表（原版的 echart graph 的参数，target 只能是单个 ID，但是在 DataView 里你可以一次性传入多个 target ID）

options 参数如下：

* ​`height`​/`width`​：同 echart 组件的参数
* ​`title`​：折线图的标题
* ​`layout`​：图的布局，有两种布局一种是引力布局，一种是圆周布局
* ​`roam`​：设定为 true 之后可以鼠标平移缩放 tree 图；默认关闭
* ​`symbolSize`​/`labelFontSize`​：节点的大小和文本的字体大小，默认为 14 和 16
* ​`nodeRenderer`​：

  * 将输入的 Node （思源的 `Block`​）转换为 echarts 接受的 `{name: string, value: string}`​ 类型的数据
  * 返回值可以只有 `name`​ 属性或者只有 `value`​ 属性，哪个属性存在就覆盖对应的默认配置方案
  * **一般情况下不需要提供**
* ​`tooltipFormatter`​：悬浮在节点上的时候，弹出的提示框内部的内容，可以为 html 文本

  * **一般情况下不需要提供**
* ​`seriesOption`​：见[https://echarts.apache.org/zh/option.html#series-graph](https://echarts.apache.org/zh/option.html#series-graph)
* ​`echartsOption`​

🖋️ **案例**：这里我们展示了一个文档的子文裆和反链图，配置如下：

* 所有子文裆的节点都显示为蓝色
* 所有反链节点显示为黄色
* 为了避免过于单调，还随机在子文裆和反链块之间建立了一个联系。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let thisdoc = await Query.thisdoc(protyle);
let childs = await Query.childdoc(dv.root_id);
let backlinks = await Query.backlink(dv.root_id);
childs = childs.addcols({category: 0});  //添加类别编号，指定为类别 0
backlinks = backlinks.addcols({category: 1});  //指定为类别 1
let nodes = [thisdoc, ...childs, ...backlinks];  //合并为节点列表
let links = [
  { source: thisdoc.id, target: childs.pick('id') },  // 子文档的关联关系
  { source: thisdoc.id, target: backlinks.pick('id') },  //反链的关联关系
];
if (childs.length > 0 && backlinks.length > 0) {
  //随便选两个节点，建立关联关系
  links.push({ source: childs[0].id, target: backlinks[0].id })
}

dv.addegraph(nodes, links, {
    height: '500px',
    roam: true,
    seriesOption: {
        categories: [
            {
                name: '子文裆',
          symbolSize: 14,
                itemStyle: {
                    color: 'var(--b3-theme-primary)'
                },
                label: {
                    fontSize: 14, // 设置标签字体大小
                    color: 'var(--b3-theme-primary)' // 设置标签颜色
                }
            },
            {
                name: '反向链接',
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

效果如下，同 tree 图一样，graph 图中每个节点也可以通过 **Ctrl + 点击**的方式跳转，以及**悬浮**显示节点细节等。

![image](../../assets/image-20241207193310-9gpfbtk.png)

## columns 和 rows

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

可以通过 columns 和 rows 添加多列或者多行布局（基于 flex）。这两个组件需要传入 html 元素的列表， `options`​ 参数：

* ​`gap`​：多行或者多列之间的间距，默认 5px
* ​`flex`​：多行或者多列容器的比例，默认不指定表示等距
* columns

  * `minWidth`​：多列布局的时候，每列最窄的宽度；默认 350px；这个参数主要在列数较多，超出容器范围需要横向滚动的情况下发挥作用

以下是一个多列布局的案例：

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addcolumns([
  dv.md('## 第一列'),
  dv.md('## 第二列'),
  dv.rows([
      dv.md('## 第三列'),
      dv.md('第三列下方的内容\n{: style="background-color: pink"}'),
    ], { gap: '20px' }
  )
], { flex: [1, 1, 2]}); // flex 指定三列为 1:1:2 的比例
dv.render();
```

![image](../../assets/image-20241206192654-ycr25wv.png)

## details

```ts
details(summary: string, content: string | HTMLElement)
```

details 用于创建一个折叠列表，第一个参数为列表的标题，后面的内容为列表内部的内容。

以下展示一个案例，随机查询若干块，并按照所在的笔记本进行分组，每一组的内容分别放入一个折叠列表中。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let blocks = await Query.random(10);
//使用 groupby 函数分组
blocks.groupby('box', (boxid, group) => {
    const boxname = Query.utils.boxname(boxid);
    const ele = dv.list(group);
    dv.adddetails(boxname, ele);
});
dv.render();
```

![image](../../assets/image-20241206193640-g5h5jp9.png)

## addElement

```js
addElement(ele: HTMLElement | string, disposer?: () => void)
```

addElement 可以将一个外部创建的 element 元素作为自定义的视图加入 DataView 中。这个方法还有一个 `addele`​ 的别名。

> 🔔 如果你有大量添加自定义 element 的需求，推荐使用后面会讲到的「自定义视图组件」功能。

​`addele`​ 元素会自动将传入的元素封装为一个 View Container 元素。你可以通过 `returnedEle.dataset.id`​ 获取 container 的 ID。

## addDisposer

```js
addDisposer(dispose: () => void, id?: string)
```

addDisposer 接受一个回调函数作为参数，该函数将自动在 DataView 被销毁的时候运行。

> **被销毁**最直接的理解就是【点击刷新按钮重新查询嵌入块，并造成 DataView 的重绘】，具体细节请参考【理解 DataView 的生命周期】小节。

以下是一个案例：创建一个计时器，并且在刷新的时候销毁计时器。

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

## removeView

```js
removeView(id: string)
```

给定一个视图组件的 id (`container.dataset.id`​)，可以调用 `removeView`​ 方法将其删除。

> 🔔 `removeView`​ 和你直接在 js 中删除 element 的区别是：如果组件绑定了 `dispose`​ 操作，则在删除之前会自动执行以用于必要的清理。

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 0;

//等价于上面的 addele + addDisposer 两步合在一起
const eleId = (dv.addele(span, () => {
    console.log('dispose timer!');
    clearInterval(timer);
})).dataset.id; //addElement 的别名

let timer = setInterval(() => {
    console.log(span.innerText);
    span.innerText = parseInt(span.innerText) + 1;
}, 1000);

//删除组件的按钮
const button = document.createElement('button');
button.innerText = 'Remove';
button.onclick = () => { dv.removeView(eleId); }
dv.addele(button);

dv.render();
```

![image](../../assets/image-20241209212929-dlfxtip.png)

## replaceView

```js
replaceView(id: string, viewContainer: HTMLElement, disposer?: () => void)
```

* 给定一个视图组件的 id (`container.dataset.id`​)，可以调用 `replaceView`​ 方法将替换为另一个新的组件

* 如果被替换的旧组件自带 `dispose`​ 操作，则在被替换（实际上就是删除）之前会自动执行==
* 可以传入一个 `disposer`​ 函数，作为组件附加的 `dispose`​ 函数（不过<u>一般来说没有必要</u>）

* 注意

  1. 传入的 viewContainer 必须同样是一个视图组件的 container 元素
  2. 传入的 viewContainer 在替换原来的组件的位置之后，其 `data-id`​ 将字段被修正为原本的 ID，而非传入前生成的新 ID

我们更改上面的案例，点击按钮后，在原本 counter 的地方显示删除的提示信息。

```js
//!js
let dv = Query.DataView(protyle, item, top);
const span = document.createElement('span');
span.innerText = 0;
const eleId = (dv.addele(span)).dataset.id; //addElement 的别名

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
