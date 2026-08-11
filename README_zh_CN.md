> 🔀 **[更新日志](CHANGELOG.md)**

> 🔔 本文档由仓库 `docs/zh_CN/` 下的页面自动生成（英文版由 `docs/en_US/` 生成）。插件内文档站随插件版本发布：点击顶栏菜单中的「帮助」即可打开，内容与已安装版本一致、可离线浏览，并且不会在知识库中创建或更新任何笔记。


## Query & View 文档站

思源的嵌入块功能支持使用 JavaScript 语法进行查询。此前由 Zxhd 开发的[基础数据查询](https://github.com/zxhd863943427/siyuan-plugin-data-query)插件提升了 JS 查询的能力；本插件在其基础上调整了 API 结构、增加了若干功能，让在思源中使用 JS 查询更加简单方便，并优化了 DataView 接口，支持更丰富、自定义化更强的数据展示功能。

⚠️ 本帮助文档假设你已经了解基础的 JavaScript 语法概念（至少需要理解基础的变量、流程、函数调用、async/await）。

> 🔔 插件随版本发布一个插件内文档站：点击顶栏菜单中的「帮助」即可打开。文档站内容与当前安装的插件版本一致、可离线浏览，并且**不会在你的知识库中创建或更新任何笔记**；旧版本遗留的帮助笔记会保留原状，不再由插件更新。
>
> 本仓库的中英文 README 由同一份文档页面生成并提交，可在 GitHub 或集市中浏览同一份内容。


### 功能速览

💡 本插件大致可以提供以下功能（这里提供一个概览印象，详细用法见后面的说明）。

1️⃣ 使用 Query API 进行嵌入块/SQL 查询。

案例：查询指定 ID 的文档的子文档，并只展示前三个文档：

![image](docs/assets/image-20241025221225-4ml02nc.png "查询指定 ID 的文档的子文档")

2️⃣ 使用 DataView 对象，自定义地渲染嵌入块内容。

案例：查询当前文档的反向链接，并在嵌入块中渲染为块链接的列表。

![image](docs/assets/image-20241025221628-8bslxks.png "展示反向链接")

案例：使用 JS 创建的动态文档内容

![image](docs/assets/image-20241025222516-lvb94rl.png "随机漫步")

以及更多丰富的可渲染组件。

![image](docs/assets/image-20241213214945-r6p1je6.png "Kanban")

![image](docs/assets/image-20241130151900-0n7ku7o.png)

3️⃣ 简化对查询结果的处理、访问。

使用 Query API 查询到的结果，在普通的块属性的基础上有一些别的方便的属性。比如在下面这个例子中，我们可以直接使用 `aslink` 获取一个块的思源链接等。

![image](docs/assets/image-20241025223457-hi94ial.png)

4️⃣ 在外部代码编辑器中编辑嵌入块的代码，并随着外部的编辑自动更新源代码。

![image](docs/assets/image-20241130145358-bqvwgmb.png)

> 🖋️ **从案例开始学习**
>
> 学习本插件最好的方式是从一些案例出发，快速了解插件的基本用法。
>
> 打开文档站「案例总览」页，将案例代码复制并粘贴到一个嵌入块中，即可快速查看效果。案例代码随插件发布，与当前安装的插件版本一致。

## 基本概念：什么是 JS 嵌入块

思源默认的嵌入块使用 SQL 语法，查询到 block 之后，会自动放入嵌入块渲染成为内容。

```sql
select * from blocks order by random() limit 1;
```

JS 嵌入块则是另一种特殊的用法，当嵌入块里面的内容以 `//!js`​ 为开头的时候，思源会将后面的代码内容视为 javascript 代码，并自动执行。

一个 JS 嵌入块的代码，会传入以下的变量：

* Protyle：嵌入块所在的文档的 protyle 对象
* item：嵌入块自身的 HTML 元素对象
* top：一个特殊的标识符，一般可以无视

而一个 JS 嵌入块的代码，理论上需要 **return 一个 Block ID 的列表**（`BlockID[]`​），这些 ID 对应的块就会被渲染到嵌入块中。

你可以尝试将如下的代码复制到嵌入块中，它会渲染当前嵌入块所在的文档。

```js
//!js
return [protyle.block.rootID]
```

💡 本插件提供了一系列功能，来增强 JS 嵌入块的功能。插件的核心是在嵌入块当中透传一个 `Query`​ API，大致关系如下。

```mermaid
flowchart TD
  Query
  DataView
  Query --> Query.Utils
  Query --> DataViews

  subgraph Queries
    Query --> sql
    Query --> backlink
    Query --> childdoc
    Query --> random
    Query --> A[...]
  end

  subgraph DataViews
    DataView --> List
    DataView --> Table
    DataView --> Markdown
    DataView --> Mermaid/Echarts
    DataView --> B[...]
  end

  CustomView -->|Register| DataViews
```

完整的接口文件请查看：[https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)

> 🖋️ **使用骨架模板**
>
> 使用 Query View 需要在嵌入块中编写 js 代码，你可以在编辑器中输入 `/qv`​ 快速插入一个骨架模板，无需每次都从头编写 `//!js...`​ 这些常规的程序结构，而专注与编写核心逻辑。
>
> ![image](docs/assets/image-20241214183258-vdarhfx.png)
>
> 默认的基础模板的功能是随机查询五个块，你可以自行修改成你想要的查询逻辑。
>
> 模板的完整代码与分步操作见「从模板开始」页面。

## 从模板开始

本页带你用最小成本跑起第一个 Query View。基础模板的代码权威位于 `public/example/basic-template.js`，文档站与插件的 `/qv` 斜杠菜单共用这一份代码，不会在别处重复维护。

### 复制模板


```js
//!js
// Query View basic template.
// Authoritative source of the template code: the docs site and the plugin's
// /qv slash menu both use this file (public/example/basic-template.js).
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

模板默认随机查询五个块，并把查询到的块 ID 返回给思源渲染。

### 插入嵌入块

两种方式任选其一：

1. **斜杠菜单**：在文档中键入 `/qv`（或 `/queryview`），选择「Query View 基本模板」，插件会把模板作为嵌入块插入当前文档。
2. **手动插入**：新建一个嵌入块（嵌入块类型的块），把上面复制的代码完整粘贴进去。嵌入块内容以 `//!js` 开头时，思源会将其作为 JavaScript 执行。

### 运行

嵌入块插入后会自动执行。看到随机展示的五个块即为成功。如果没有反应，先检查代码是否以 `//!js` 开头，再查看控制台报错（排查建议见「外部编辑器与调试」）。

### 改造模板

模板中有两段被注释的代码：`Query.DataView(protyle, item, top)` 与 `dv.addlist(blocks)` / `dv.render()`。

- **使用 DataView 渲染视图**：注释掉 `return blocks.pick('id');`，取消注释 DataView 两行，模板就会把查询结果渲染为一个列表视图。注意 `protyle`、`item`、`top` 三个参数永远固定不动。
- **查询其他内容**：修改 `Query.sql` 中的 SQL 语句，或改用 `Query.backlink`、`Query.tag` 等封装查询（见「Query 查询」主题）。

想直接看各种效果，可以打开「案例总览」，找到最接近你需求的案例，复制并改造。

## Query 查询

### 使用 Query 进行 SQL 查询

使用本插件一个最简单的查询如下。其中：

* ​`Query`​ 对象是插件对外透传的一个 API 对象
* ​`Query.backlink`​ 表示查询某个文档的反向链接
* ​`protyle.block.rootID`​ 是当前嵌入块所在文档的 ID
* ​`blocks`​ 是查询到的块组成的列表（`Block[]`​)
* ​`block.pick('id')`​ 代表提取（pick）每个块的 `id`​ 属性，组成一个新的列表，再返回给思源

所以这段代码的功能就是：<u>查询当前所在文档的所有反链</u>。

```js
//!js
const query = async () => {
  let blocks = await Query.backlink(protyle.block.rootID);
  return blocks.pick('id'); //特殊工具函数，后面会介绍; 等价于blocks.map(b => b.id);
}
return query();
```

> 注：由于这个代码中用到了 async/await 语句，所以必须要把 await 相关的代码包裹在一个 async 函数里面，而不能直接放到外面。

不难看出，由于在代码中可以通过 `protyle.block.rootID`​ 自动获取到所在文档的 ID，也就免去了每次编写嵌入块的时候需要手动修改 `root_id`​ 字段的麻烦了，所以完全可以做到编写一次，到处运行——这也是 JS 查询的一个小优点。

​`Query.backlink`​ 本质上只是对思源的 SQL 查询进行了一些封装（如果你对思源的 SQL 查询不了解，请阅读[https://ld246.com/article/1683355095671](https://ld246.com/article/1683355095671)）。类似的函数有以下这些。

```ts
/**
 * Search blocks by tags
 * @param tags - Tags to search for; can provide multiple tags
 * @param options - Options
 * @param options.join - Join type ('or' or 'and')
 * @param options.limit - Maximum number of results
 * @returns Array of blocks matching the tags
 * @example
 * Query.tag('tag1') // Search for blocks with 'tag1'
 * Query.tag(['tag1', 'tag2'], { join: 'or' }) // Search for blocks with 'tag1' or 'tag2'
 * Query.tag(['tag1', 'tag2'], { join: 'and' }) // Search for blocks with 'tag1' and 'tag2'
 */
tag: (tags: string | string[], options?: { join?: "or" | "and", limit?: number }) => Promise<IWrappedList<IWrappedBlock>>;
/**
 * Find unsolved task blocks
 * @param options - Options
 * @param options.after - After which the blocks were updated
 * @param options.limit - Maximum number of results
 * @returns Array of unsolved task blocks
 * @example
 * Query.task()
 * Query.task({ after: '2024101000' })
 * Query.task({ after: Query.utils.thisMonth(), limit: 32 })
 */
task: (options?: { after?: string, limit?: number }) => Promise<IWrappedList<IWrappedBlock>>;
/**
 * Randomly roam blocks
 * @param limit - Maximum number of results
 * @param type - Block type
 * @returns Array of randomly roamed blocks
 */
random: (limit?: number, type?: BlockType) => Promise<IWrappedList<IWrappedBlock>>;
/**
 * Gets the daily notes document
 * @param options - Options
 * @param options.notebook - Notebook ID, if not specified, all daily notes documents will be returned
 * @param options.limit - Maximum number of results
 * @returns Array of daily notes document blocks
 * @example
 * Query.dailynote()
 * Query.dailynote({ notebook: '20231224140619-bpyuay4' })
 * Query.dailynote({ limit: 32 })
 */
dailynote: (options?: { notebook?: NotebookId, limit?: number }) => Promise<IWrappedList<IWrappedBlock>>;
/**
 * Gets child documents of a block
 * @param b - Parent block or block ID
 * @returns Array of child document blocks
 */
childDoc: (b: BlockId | Block) => Promise<Block[]>;
/**
 * Search blocks that contain the given keywords
 * @param keywords - Keywords to search for; can provide multiple keywords
 * @param options - Options
 * @param options.join - Join type ('or' or 'and')
 * @param options.limit - Maximum number of results to return, default is 999
 * @returns Array of blocks that contain the given keywords
 */
keyword: (keywords: string | string[], options?: { join?: 'or' | 'and', limit?: number }) => Promise<IWrappedList<IWrappedBlock>>;
/**
 * Search the document that contains all the keywords
 * @param keywords - Keywords to search for; can provide multiple keywords
 * @param options - Options
 * @param options.join - Join type ('or' or 'and')
 * @param options.limit - Maximum number of results to return, default is 999
 * @returns The document blocks that contains all the given keywords; the blocks will attached a 'keywords' property, which is the matched keyword blocks
 * @example
 * let docs = await Query.keywordDoc(['Keywords A', 'Keywords B']);
 * //each block in docs is a document block that contains all the keywords
 * docs[0].keywords['Keywords A'] // get the matched keyword block by using `keywords` property
 */
keywordDoc: (keywords: string | string[], options?: { join?: 'or' | 'and', limit?: number }) => Promise<any[]>;
/**
 * Return the markdown content of the given block
 * * For normal block, return the markdown attribute of the block
 * * For document block, return the markdown content of the document
 * * For heading block, return the children blocks' markdown content
 * @param input - Block or Block ID
 * @returns Markdown content of the document
 */
markdown: async (input: BlockId | Block)  => Promise<string>
```

这些函数都可通过 `Query`​ 直接访问，最通用的自然是 `Query.sql`​，只要直接将 SQL 查询语句传入进去即可。

> 🔔 **注意**：以上的几个函数不一定包含全部的查询 API，想要查看完整的接口，请访问 [https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)。

> 💡 **注意**：不同于主要面向普通的用户的基础用法，后续的进阶用法将默认用户拥有基本的 javascript/typescript 阅读和编码能力

以下介绍一些 Query 查询的高级用法。

🔔 在进阶介绍前，首先需要说明两点：

1. Query 中的方法为无状态的函数（当然，Query 方法返回的对象就不一定了，例如 DataView 就是有状态的）
2. Query 下的方法都有一些别名，其中至少包括原方法的全小写格式。

    例如你可以调用 `Query.utils.asmap`​ ，等价于 `Query.Utils.asMap`​。

### WrappedList & WrappedBlock

尽管在基础用法章节里，我们简单介绍了使用 `Query`​ 进行 SQL 查询的便利性，但是最大的优点却没有提到——所有使用 Query API 查询得到的结果都**额外附加了一些便利的工具方法或者属性**。

使用 Query 查询得到的结果在理念上被视为一个表结构，每一个元素代表了个思源的 Block。

```ts
[
  {'id': 'ID-111', 'type': 'd', created: '20230401001000'},
  {'id': 'ID-hhh', 'type': 'd', created: '...'},
  {'id': 'ID-kkk', 'type': 'b', created: '...'},
]
```

![image](docs/assets/image-20230506013450-g2mkp8l.png)​

为了方便对这个表数据进行操作：

* 表查询列表中的每个元素，会被封装成一个 `IWrappedBlock`​ 对象，提供关于块元素的常用操作
* 表查询列表自身，会被封装成一个 `IWrappedList`​ 对象，以便于快速完成一些对「表数据结构」的操作

#### IWrappedBlock

所有 `Query`​ API 查询返回的列表里面的对象，都会被封装成一个 `IWrappedBlock`​，你可以把他理解为一个普通的 `Block`​ 对象，但是又额外多了一些属性和方法：

```ts
// 不一定完整，完整 API 文档以 repo/public/types.d.ts 为准
interface IWrappedBlock extends Block {
    /** Method to return the original Block object */
    unwrap(): Block;
    /** Original Block object */
    unwrapped: Block;
    /** Block's URI link in format: siyuan://blocks/xxx */
    asurl: string;

    /** Block's Markdown format link */
    aslink: string;

    /** Block's SiYuan reference format text */
    asref: string;

    /** Blocks's ial list, as object
     * @example
     * let icon = block.asial['icon'];
    */
    asial: Record<string, string>;

    /**
     * Returns a rendered SiYuan attribute
     * @param attr - Attribute name
     * @param renderer - Custom render function, uses default rendering when returns null
     */
    attr(attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string | null): string;

    /** Update date in YYYY-MM-DD format */
    updatedDate: string;
    /** Creation date in YYYY-MM-DD format */
    createdDate: string;
    /** Update time in HH:mm:ss format */
    updatedTime: string;
    /** Creation time in HH:mm:ss format */
    createdTime: string;
    /** Update datetime in YYYY-MM-DD HH:mm:ss format */
    updatedDatetime: string;
    /** Creation datetime in YYYY-MM-DD HH:mm:ss format */
    createdDatetime: string;
    /** Get custom attribute value */
    [key: `custom-${string}`]: string;
}
```

以上所有的属性可以分为几组来理解：

1. 渲染为链接或者引用，也就是 `aslink`​, `asref`​ 这些（不过实际上由于渲染成为引用并不会真的在 ref 表中创建关联关系，所以大部分时候使用 link 就可以了，ref 的意义不大）
2. ​`asial`​：块的 ial 列表本身为一个字符串字段，使用这个方法，可以把 ial 解析为一个 `{ [key: string]: string}`​ 的对象
3. 时间戳相关：额外为 updated，created 这些拓展了一些属性，方便直接用来展示块的时间戳
4. ​`attr`​ 函数：

    * 传入块和块的属性，会讲块的属性渲染为合适的 markdown 文本（就像我们前面在 table 小节提到的那样）
    * 你也可以自己传入一个自定义的 renderer，然后返回一段 markdown 文本，如果没有返回或者返回 null，则回退到默认的渲染方案
5. ​`custom-xxx`​ 属性，可以直接访问块的自定义属性，例如 `block['custom-b']`​，会访问对应块的 `custom-b`​ 属性。

你可以尝试一下下面的代码，会有直观的区别:

```js
//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);

    let blocks = await Query.random(1);
    let b = blocks[0];

    dv.addmd(`
- aslink: ${b.aslink}
- created: ${b.created}
- createdDate: ${b.createdDate}
- createdTime: ${b.createdTime}
- createdDatetime: ${b.createdDatetime}
- attr:
    - ${b.box} vs ${b.attr('box')}
    - ${b.type} vs ${b.attr('type')}
    `)

    dv.render();

}

return query();
```

![image](docs/assets/image-20241213184747-0ma9dj4.png)

> 🔔 以上介绍不一定完整，完整 API 文档以 `repo/public/types.d.ts`​ 为准

#### IWrappedList

所有 `Query`​ API 查询返回的结果列表，都是一个 `IWrappedList`​ 对象，你可以把他理解为一个普通的 `Array<T>`​，但是又额外多了一些方法。

🔔 IWrappedList 也是无状态的，所有的 API 均会返回一个更改后的副本，而非做原地修改。

```ts
// 不一定完整，完整 API 文档以 repo/public/types.d.ts 为准
export interface IWrappedList<T> extends Array<T> {
    /** Method to return the original array */
    unwrap(): T[];

    /** Original array */
    unwrapped: T[];
    /**
     * Converts the array to a map object, where the key is specified by the key parameter.
     * Equivalent to calling `array.reduce((acc, cur) => ({...acc, [cur[key]]: cur }), {})`
     * @param key
     * @returns
     */
    asMap: (key: string) => Record<string, Block>;
    /**
     * Returns a new array containing only specified properties
     * @param attrs - Property names to keep
     */
    pick(...attrs: (keyof T)[]): IWrappedList<Partial<T>>;

    /**
     * Returns a new array excluding specified properties
     * @param attrs - Property names to exclude
     */
    omit(...attrs: (keyof T)[]): IWrappedList<T>;

    /**
     * Returns a new array sorted by specified property
     * @param attr - Property to sort by
     * @param order - Sort direction, defaults to 'asc'
     */
    sorton(attr: keyof T, order?: 'asc' | 'desc'): IWrappedList<T>;

    /**
     * Returns an object grouped by specified condition
     * @param predicate - Grouping criteria, can be property name or function
     * @param fnEach - Optional callback function for each group
     */
    groupby(
        predicate: keyof T | ((item: T) => any),
        fnEach?: (groupName: any, list: T[]) => unknown
    ): Record<string, IWrappedList<T>>;

    /**
     * Returns a filtered new array, ensuring it's also an IWrappedList
     * @param predicate - Filter condition function
     */
    filter(predicate: (value: T, index: number, array: T[]) => boolean): IWrappedList<T>;
    /**
     * Returns a new array containing elements in the specified range
     * @param start - Start index
     * @param end - End index
     */
    slice(start: number, end: number): IWrappedList<T>;
    /**
     * Returns a new array with unique elements
     * @param {keyof Block | Function} key - Unique criteria, can be property name or function
     * @example
     * list.unique('id')
     * list.unique(b => b.updated.slice(0, 4))
     */
    unique(key?: keyof T | ((b: T) => string | number)): IWrappedList<T>;
    /**
     * Returns a new array with added rows
     * @alias addrows
     * @alias concat: modify the default method of Array
     */
    addrow(newItems: T[]): IWrappedList<T>;

    /**
     * Returns a new array with added columns
     * @param {Record<string, ScalarValue | ScalarValue[]> | Record<string, ScalarValue>[] | Function} newItems - New columns to add
     * @alias addcols
     * @alias stack
     * @example
     * list.addcol({ col1: 1, col2: 2 }) // Add two columns, each with repeated elements
     * list.addcol({ col1: [1, 2], col2: [4, 5] }) // Add two columns
     * list.addcol([{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }]) // Add two columns, each item in list corresponds to a row
     * list.addcol((b, i) => ({ col1: i, col2: i * i })) // Add two columns, each with elements generated based on index
     */
    addcol(newItems: Record<string, ScalarValue | ScalarValue[]> |
        Record<string, ScalarValue>[] |
        ((b: T, index: number) => Record<string, ScalarValue> | Record<string, ScalarValue[]>)): IWrappedList<T>;

}
```

IWrappedList 中多出来的方法，可以分这几个大类理解：

* ​`unwrapped`​/`unwrap()`​：用于返回原始的列表对象
* 重写 Array 的一些常用的用于“返回的新的列表”的方法，保证返回值依然是一个 `IWrappedList`​

  * ​`filter`​
  * ​`slice`​
  * ​`map`​
* 在查询代码中常见的一些功能函数

  * ​`pick`​：对保留列表中每个块特定的字段，例如 `blocks.pick('id')`​ 会返回一个块 ID 的列表，`blocks.pick('id', 'content')`​ 会返回一个 `{id: string, content: strint}[]`​ 类型的列表；对应到表结构操作上，等于是只保留特定的数据列
  * ​`omit`​：同上，但是传入的 key 名称会被抛弃而非保留；对应到表结构操作上，等于是丢弃特定的数据列
  * ​`sorton`​：指定用于排序的 key 名称，返回排序之后的列表
  * ​`groupby`​：对列表进行分组操作，有两个参数：

    * 第一个参数 `predicate`​

      * 可以是 Block 的键名称，例如 `blocks.groupby('box')`​ 就是按照笔记本 ID（`box`​）分组
      * 也可以是一个返回标量数据的函数，例如 `blocks.groupby(b => b.created.slice(0, 4))`​
    * 第二个参数 `forEach`​ 可以用来迭代分组之后的结果，参数为 `groupName`​ 和 `groupedBlocks`​
  * ​`unique`​：对列表进行去重操作，传入的参数可以是

    * Block 的键名称，例如 `blocks.unique('root_id')`​ 意味着每个文档（`root_id`​）只保留一个块
    * 一个返回标量数据的函数，用作去重的比较值
  * ​`addrow`​：实际上就是 `Arrray.concat`​ 函数，传入一个外部的列表，合并成一个新的 `WrappedList`​
  * ​`addcol`​：传入外部的数据，外表结构添加特定的列，例如：

    * ​`list.addcol({ col1: 1, col2: 2 })`​
    * ​`list.addcol({ col1: [1, 2], col2: [4, 5] })`​
    * ​`list.addcol([{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }])`​
    * ​`list.addcol((b, i) => ({ col1: i, col2: i * i }))`​
  * ​`asmap`​：本质上就是调用 reduce，将列表转换成 `Record<keyof Block, Block>`​

    * 例如 `list.asmap()`​，默认会返回 `Record<Block['id'], Block>`​ 的结构

> 🔔 以上介绍不一定完整，完整 API 文档以 repo/public/types.d.ts 为准

### Query.Utils

Query.Utils 内包含了一些可能会比较有用的工具函数。

> 🙂 `Query.Utils`​ 下所有的函数都是同步的，不需要 `await`​。
>
> ​`Query.Utils`​ 有一个小写版的别名 `Query.utils`​。

#### 时间相关工具函数

utils 下最有用的可能就是时间相关的函数了，其中的重中之重是这个 API

```ts
Query.Utils.Date: (value?: any) => SiYuanDate;
```

调用 Date 将返回一个 SiYuanDate 对象，他本质上是一个 javascript 的 Date 类，但是针对思源做了专门的设计：

```ts
declare class SiYuanDate extends Date {
    //返回当天零点时刻的时间
    beginOfDay(): SiYuanDate;
    //格式化为 yyyyMMddHHmmss
    toString(hms?: boolean): string;
    [Symbol.toPrimitive](hint: string): any;
    static fromString(timestr: string): SiYuanDate;
    //计算天数, days 可以是number （表示天数）, 也可以是字符串
    //如 '1d' 表示 1 天，'2w' 表示 2 周，'3m' 表示 3 个月，'4y' 表示 4 年
    add(days: number | string): SiYuanDate;
}
```

SiYuanDate 在格式化为字符串的时候，会转换成和 `created`​ `updated`​ 同样格式的字符串；并且还可以使用 `add`​ 方法进行日期的计算。

你可以使用两种方式格式化为字符串，一种是直接字符串插值 `${date}`​，另一种是调用 `toString()`​ 方法。其中后者有一个 `hms`​ 参数，如果设置为 false 将只输出日期部分而去掉时分秒部分。

```js
//!js
let dv = Query.DataView(protyle, item, top);
let date = Query.Utils.Date(); //now
dv.addmd(`
Now ${date}
Start of this day: ${date.beginOfDay()}
10 days later: ${date.beginOfDay().add(10)}
1 weeks later: ${date.beginOfDay().add('1w')}
1 month ago: ${date.add('-1m')}

\`\`\`sql
select * from blocks where created like '${date.add(-7).toString(false)}%'
\`\`\`

`);
dv.render();
```

![image](docs/assets/image-20241204112906-ih3lqzu.png)

当然如果你懒得每次都要实例化一个 Date 对象，那么 utils 下还有一些快捷函数。

```ts
declare interface Partial<Query['Utils']> {
    /**
     * Gets timestamp for current time with optional day offset
     * @param days - Number or string of days to offset (positive or negative)
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    now: (days?: number | string, hms?: boolean) => string;
    /**
     * Gets the timestamp for the start of today
     * @param {boolean} hms - Whether to include time, e.g today(false) returns 20241201, today(true) returns 20241201000000
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    today: (hms?: boolean) => string;
    /**
     * Gets the timestamp for the start of current week
     * @param {boolean} hms - Whether to include time, e.g thisWeek(false) returns 20241201, thisWeek(true) returns 20241201000000
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    thisWeek: (hms?: boolean) => string;
    /**
     * Gets the timestamp for the start of current month
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    thisMonth: (hms?: boolean) => string;
    /**
     * Gets the timestamp for the start of current year
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    thisYear: (hms?: boolean) => string;
    /**
     * Converts SiYuan timestamp string to Date object
     * @param timestr - SiYuan timestamp (yyyyMMddHHmmss)
     * @returns Date object
     */
    asDate: (timestr: string) => SiYuanDate;
    /**
     * Converts Date object to SiYuan timestamp format
     * @param date - Date to convert
     * @returns Timestamp string in yyyyMMddHHmmss format
     */
    asTimestr: (date: Date) => string;
}
```

使用这些函数，可以快速地在 sql 语句中插入你想要的时间成分。

```js
//!js
const query = async () => {
  const sql = `select * from blocks
  where updated >= '${Query.Utils.thisWeek()}'
  limit 5
  `;
  const blocks = await Query.sql(sql);
  return blocks.map(b => b.id);
}
return query();
```

#### 其他工具函数

其他可以说的工具函数不多，实用性可能也没那么大了。

```ts
declare interface Partial<Query['Utils'] > {
    asMap: (blocks: Block[], key?: string) => {
        [key: string]: Block;
        [key: number]: Block;
    };

    notebook: (input: Block | NotebookId) => Notebook;
    boxName: (boxid: NotebookId) => string;
    typeName: (type: BlockType) => any;
    renderAttr: (b: Block, attr: keyof Block, options?: {
        onlyDate?: boolean;
        onlyTime?: boolean;
    }) => string;

    asLink: (b: Block) => string;
    asRef: (b: Block) => string;

    openBlock: (id: BlockId) => void;
}
```

* ​`notebook`​ 和 `boxName`​ 主要用于获取笔记本的名称，因为通过 sql 获取的 box 字段只是 notebook 的 id，而通过 `notebook`​ 可以获取完整的笔记本对象，而 `boxname`​ 则会返回笔记本的名称。

  * 🤔 我也不知道为啥思源里面笔记本会有“notebook”和“box”两种叫法，各位自适应吧
* ​`typeName`​ 输入一个思源 SQL 查询结果的 `type`​ 字段，会返回其可读的名称
* ​`renderAttr`​ 实际上就是 table 组件用的默认渲染函数
* ​`openBlock`​ 是个特别方法，传入块的 ID 可以在思源中打开对应的块
* ​`asMap`​ 等价于  `IWrappedList`​ 的 `asmap`​ 函数
* ​`asLink`​ 和 `asRef`​ 本质上等价于调用 `IWrappedBlock`​ 的这两个属性

### fb2p （容器块传递）

> 🖋️ 本函数有一个 `redirect`​ 的别名。

fb2p （或者说引用关系转移）的目的是**处理容器块和段落块嵌套情况**，他会将**将容器块的第一个段落块 ID 重定向到容器块的 ID**。

📣 首先我们解释一下这个 API 的使用背景。现在假定有一个列表块，引用了另外的一个块

![image](docs/assets/image-20241208222807-mvc3opc.png)

我们使用下面的 SQL 来查询被引用块的所有反链信息

```sql
select * from blocks where id in (
  select block_id from refs where def_block_id = '20241025224026-r416ywi'
) order by updated desc;
```

效果如下：

![image](docs/assets/image-20241204123442-lceozz3.png)

令人意外的是，查询的结果只包含了引用的所在的段落，而不会像反链面板那样展示整个列表项块。

![image](docs/assets/image-20241204123606-44328dv.png "反链面板展示的结果")

这里的原因在于，列表项块是一个容器类型（如图中标号 2 的黄色范围），他本身是不自带内容的。所以实际在思源底层，真正引用了目标的块是列表块的第一个段落块（如图中标号 1 的红色范围）—— 而之所以在反链面板当中会显示完整的列表项，是因为思源在反链面板里会做特殊的处理。

![image](docs/assets/image-20241204123811-vla1xke.png)

而这也就是 `fb2p`​ 起作用的时候了：它的理念是「**一个容器块的第一个子块如果是段落块，那么这个段落块应该能代表整个容器块**」。

所以，我们可以将一个 Block 列表传递给 `fb2p`​ ，他会完成重定向的功能，将 block 的 ID 修改为他的父容器块的 ID（first block to it's parent）。

```ts
fb2p(inputs: Block[], enable?: { heading?: boolean, doc?: boolean }) => Promise<Block[]>
```

```js
//!js
return (async () => {
  let blocks = await Query.backlink('20241025224026-r416ywi');
  blocks = await Query.fb2p(blocks);
  return blocks.map(b => b.id);
})()
```

二者效果对比如下：

![image](docs/assets/image-20241204130225-vpgesgp.png)

fb2p 支持传递列表项、引述块两种容器。同时也支持传递到标题和文档块中。

* **标题**：如果段落块为某个标题块下方第一个子块，则会传递到上方的标题中
* **文档**：如果段落块为文档下方第一个子块，则会传递到文档块中

特别是后者，能帮助实现文档基本的引用，下图是一个案例。![image](docs/assets/image-20241204130826-j6rwpyx.png)

✨ **特殊用法**：强制传递到文档。在 `fb2p`​ 中内置了一个特殊规则：当所在的段落中存在一个名为 `#DOCREF#`​ 或者 `#文档引用#`​ 的 tag 的时候，该块会被强制重定向到文档块。

### pruneBlocks（处理容器和子块）

​`pruneBlocks`​ 用于 在 SQL 搜索场景中过滤块，以消除重复的块。

> 🖋️ 本函数别名有：`prune`​, `mergeBlocks`​, `merge`​

```js
pruneBlocks(blocks: Block[], keep: 'leaf' | 'root' = 'leaf', advanced: boolean = false)
```

思源笔记中的块存在嵌套结构（例如列表、列表项、内部的段落是三个不同的块）。因此，如果一个关键字搜索列表内的文字，可能会一次性搜索出三个嵌套的块，导致搜索结果冗余。此函数用于解决上述问题，根据指定的模式合并具有父子关系的块。

**参数如下:**

* ​`blocks`​: 传入的块列表
* ​`keep`​：清理与合并策略

  * ​`leaf`​：将具有父子关系的块合并到最底层的叶子节点。例如，搜索到多个列表项，则保留最底层的段落块而去掉上面的列表项块
  * ​`root`​：将具有父子关系的块合并到最顶层的根节点。例如，搜索到多个列表项，则保留最上层的列表项块而去掉底层的段落块
* ​`advanced`​: 是否开启高级清理方案

  * ​`false`​：默认的方案，仅通过传入的 `blocks`​ 参数中各个 blockd 的 parent_id 属性进行判断和合并
  * ​`true`​：在以上基础上，查询块的面包屑来获取完整的块层级关系，本方案在合并上更加激进，同时需要额外而查询开销

**案例:**

现在假定有一个列表块：

```js
1. 重要内容 A
2. 重要内容 B
```

使用如下代码查询的结果，会存在重复： 底层的段落块 - 中间的列表项块 - 顶层的列表块

```js
//!js
const query = async () => {
    let blocks = await Query.keyword('重要内容')
    return blocks.pick('id');
}

return query();
```

![image](docs/assets/image-20250308171816-crrru54.png)​

使用 pruneBlocks 处理之后:

```js
//!js
const query = async () => {
    let blocks = await Query.keyword('重要内容');
    blocks = await Query.pruneBlocks(blocks);
    return blocks.pick('id');
}

return query();
```

效果如下，由于默认的策略是 leaf，所以仅仅保留了底层的段落块。

![image](docs/assets/image-20250308172648-l0q3u5r.png)

而如果把策略改成 root，就只会保留顶部的列表块。

![image](docs/assets/image-20250308172720-se43ute.png)

### 其他各类查询函数

## DataView 视图

### DataView 的基础使用

以上的操作虽然使用了 javascript，但是在本质上似乎和原生的嵌入块没什么不同——最后查询到的结果依然是交给思源去渲染。但是如果使用 DataView 功能，则可以将查询到的块渲染为各种不同的视图。

在这一小节中，我们首先介绍三个最基础的视图组件：

1. 列表
2. 表格
3. markdown 文本

🔔 这些组件的高级用法，以及更多更复杂的组件，在后面的「进阶用法」中介绍。

#### DataView.list

首先给出一个基本的案例，相较于上面的 JS 查询，这里做了三个变动：1）在开头声明一个 DataView 对象；2）在查询到 `blocks`​ 后，使用 `dv.addlist`​ API；3）在最后去掉 `return`​，改为 `dv.render()`​

```js
//!js
const query = async () => {
  let dv = Query.DataView(protyle, item, top); //1. 在开头加上这么一行，注意 protyle, item, top 三个参数是永远固定不动的
  let blocks = await Query.random(5);
  dv.addlist(blocks); //2. 调用 dv.addlist 添加一个列表视图
  dv.render(); //3. 去掉 return, 以 dv.render() 结尾
}
return query();
```

通过以上的代码，我们就可以将 SQL 语句查询到几个块，以列表的形式在嵌入块中展示，效果如下：

![image](docs/assets/image-20241204001321-csglpyu.png)

默认情况下，每个列表项都是一个块链接，同样可以悬浮查看以及点击跳转。

![image](docs/assets/image-20241204001504-jz4gbh1.png)

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
const query = async () => {
  let dv = Query.DataView(protyle, item, top);
  const blocks = await Query.random(5);
  dv.addlist(blocks, {
    type: 'o',
    columns: 2,
    renderer: (b) => b.hpath
  });
  dv.render();
}
return query();
```

![image](docs/assets/image-20241207210617-i5tmd5l.png)

#### DataView.Table

除了列表之外，另一个最常用的视图应该就是表格了。我们把上面的代码重复一遍，不过这次换成 `addtable`​

```js
//!js
const query = async () => {
  let dv = Query.DataView(protyle, item, top); //永远是这个开头不动
  const blocks = await Query.random(5);
  dv.addtable(blocks);
  dv.render(); //永远是这个结尾不动
}
return query();
```

效果如下：

![image](docs/assets/image-20241204002444-9j30l5k.png)

table 组件会自动以合适的方式渲染不同的列：比如 type 被渲染为实际的类型名称、hpath 被渲染为文档的超链接、box 被渲染为实际的笔记本的名称等。

表格默认显示的列，可以在设置中配置。

![image](docs/assets/image-20241204002830-35q4qjh.png)

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

![image](docs/assets/image-20241204003312-d3040o5.png)

更重要的是 `cols`​ 这个属性——他可以绕过默认的配置，自行指定需要展示的列，不考虑复杂的用法，可以只用记住两种最简单的用法：

* 为 `null`​，则显示所有的列
* 为块属性名称的列表，则显示对应的列

```js
//!js
const query = async () => {
  let dv = Query.DataView(protyle, item, top);
  const blocks = await Query.backlink(dv.root_id);  //dv.root_id 等价于 protyle.block.rootID，算是能少写一点字
  dv.addtable(blocks, { fullwidth: false, cols: null}); //全部显示
  dv.addtable(blocks, { fullwidth: true, cols: ['root_id', 'box', 'updated']});
  dv.render();
}
return query();
```

![image](docs/assets/image-20241204003849-8l19z7b.png)

> 上面第一个表格，由于太宽了，所以把 `fullwidth`​ 关掉，这样就可以横向滚动查看了。

💡 （略高级的用法，如果没有 JS 基础可以跳过）renderer 函数用于指定渲染各个列（key）的方案，如果不指定则使用默认的单元格渲染方案。而如果返回值为 null ，同样会会退到默认方案。

对比以下的案例，很明显就能看出区别，一个全部使用默认方案，另一个自定义了 id 和 box 两列的渲染方案。

```js
//!js
const query = async () => {
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
}
return query();
```

![image](docs/assets/image-20241208234136-s06cygn.png)

#### DataView.md

不知道你有没有注意，在上面展示表格的几个参数的时候，在截图中有一些标注文字。这些文字，实际上是 markdown 组件。我们可以通过 `dv.md`​ 的形式，构造一个 markdown 视图。

```js
//!js
//这里由于没有 await 的需要，所以可以把外层的 async 函数去掉
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

![image](docs/assets/image-20241204004702-va0yg1n.png)

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

![image](docs/assets/image-20241204005817-mpdtp85.png)

### 视图组件的用法

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

![image](docs/assets/image-20241209210930-k9vnume.png)

一些组件还会定义一些别名（Alias），例如 markdown 组件有一个 md 的别名。这意味着：

* ​`dv.md`​ 等价于 `dv.markdown`​
* ​`dv.addmd`​ 等价于 `dv.addmarkdown`​

> 🔔 注：`DataView`​ 会给所有的组件**自动添加他小写版本的别名。**

以下介绍 Dataview 中内置的一些其他的组件。

### 嵌套 list

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
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let childs = await Query.childdoc(dv.root_id);
    for (let child of childs) {
        //获取子文档的子文档
        const subchilds = await Query.childdoc(child.root_id);
        child.children = subchilds;
    }
    dv.addlist(childs);
    dv.render();
}
return query();
```

![image](docs/assets/image-20241206184455-4in6gct.png)

### cards

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
const query = async () => {
  let dv = Query.Dataview(protyle, item, top);
  let blocks = await Query.random(8);
  dv.addCard(blocks);
  dv.render();
}
return query();
```

![image](docs/assets/image-20250316162044-1l2i63f.png)

点击卡片标题可以跳转到对应的块。

### embed

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
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let blocks = await Query.random(2);
    dv.addembed(blocks)
    dv.render();
}

return query();
```

![image](docs/assets/image-20241206182941-yzctkxu.png)

每个嵌入组件右上角有一个小图标，点击后可以跳转到对应的块中。此外嵌入组件还有几个额外的参数：

* breadcrumb：是否显示文档面包屑
* limit：限制显示的块的数量
* zoom：缩放因子, 0 ~ 1 之间，1 代表不缩放
* columns：多行显示

在希望嵌入块显示的内容比较紧凑的时候，这几个参数可能有用。如下展示了一个案例：限制只显示 3 个块，缩放到 0.75 比例，并且以双栏展示。

```js
//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let blocks = await Query.random(5, 'd');
    dv.addembed(blocks, {
      limit: 3, zoom: 0.75, columns: 2
    });
    dv.render();
}

return query();
```

![image](docs/assets/image-20241206183442-ra4h7xl.png)

### mermaid 系列

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

![image](docs/assets/image-20241206185311-ajowi8u.png)

除了原始的 mermaid，DataView 还提供一些在 mermad 基础上的构建的视图。

#### mermaidRelation

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
const query = async () => {
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
}

return query();
```

![image](docs/assets/image-20241206190453-o0u8eb8.png)

把 `type: 'flowchart'`​ 换成 `mindmap`​ 也可以用思维导图的形式显示：

![image](docs/assets/image-20241206190618-bb58ls6.png)

> 😃 Relation 图中的节点，只要对应了一个思源的内容块，就可以**悬浮显示内容**以及**点击跳转**到对应文档。

![image](docs/assets/image-20241206190600-fu09ywo.png)

![image](docs/assets/image-20241206190646-84tfh64.png)

​`mermaidRelation`​ 通过 `type`​ 参数指定对应的视图，为了方便使用，`dv`​ 提供了两个等价的组件：

* ​`dv.mflowchart`​：等价于 flowchart 的 Relation 图
* ​`dv.mmindmap`​：等价于 mindmap 的 Relation 图

#### mermaidKanban

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
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    // null: no `after` filter, query all task block
    // 128: max number of result
    let blocks = await Query.task(null, 128);
    let grouped = blocks.groupby((b) => {
        return b.createdDate.slice(0, -3)
    });
    let N = Object.keys(grouped).length;
    // each group with a fixed witdh 200px
    dv.addmkanban(grouped, {
        width: `${N * 200}px`
    });
    dv.render();
}
return query();
```

大致效果如下：

![image](docs/assets/image-20241213214406-rfj8yqh.png)

> 😃 Kanban 图中每个块同样可以**悬浮显示内容**以及**点击跳转**到对应文档。

### echarts 系列

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

![image](docs/assets/image-20241206191639-v6yiw7f.png)

height 和 width 两个参数决定了 echart 图容器的高度和宽度，默认高度为 300px，宽度为 100%。

#### echartsLine

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
const query = async () => {
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
}

return query();
```

![image](docs/assets/image-20241207010811-8lh25x5.png)

#### echatsBar

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

![image](docs/assets/image-20241207010958-u6g07gl.png)

‍

#### echartsTree

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
const query = async () => {
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
}

return query();
```

😃 只要绑定了思源的内容块，节点都是可交互的：

* **Ctrl + 点击**可以**跳转**到对应的块
* **悬浮**，会弹出一个提示框，其中第一行的块 ID 可以**悬浮查看**完整的块内容，也可以直接**点击跳转**

  ![image](docs/assets/image-20241207171409-l4z5ffo.png)​

#### echartsGraph

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
const query = async () => {
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
}

return query();

```

效果如下，同 tree 图一样，graph 图中每个节点也可以通过 **Ctrl + 点击**的方式跳转，以及**悬浮**显示节点细节等。

![image](docs/assets/image-20241207193310-9gpfbtk.png)

### columns 和 rows

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

![image](docs/assets/image-20241206192654-ycr25wv.png)

### details

```ts
details(summary: string, content: string | HTMLElement)
```

details 用于创建一个折叠列表，第一个参数为列表的标题，后面的内容为列表内部的内容。

以下展示一个案例，随机查询若干块，并按照所在的笔记本进行分组，每一组的内容分别放入一个折叠列表中。

```js
//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let blocks = await Query.random(10);
    //使用 groupby 函数分组
    blocks.groupby('box', (boxid, group) => {
        const boxname = Query.utils.boxname(boxid);
        const ele = dv.list(group);
        dv.adddetails(boxname, ele);
    });
    dv.render();
}

return query();
```

![image](docs/assets/image-20241206193640-g5h5jp9.png)

### addElement

```js
addElement(ele: HTMLElement | string, disposer?: () => void)
```

addElement 可以将一个外部创建的 element 元素作为自定义的视图加入 DataView 中。这个方法还有一个 `addele`​ 的别名。

> 🔔 如果你有大量添加自定义 element 的需求，推荐使用后面会讲到的「自定义视图组件」功能。

​`addele`​ 元素会自动将传入的元素封装为一个 View Container 元素。你可以通过 `returnedEle.dataset.id`​ 获取 container 的 ID。

### addDisposer

```js
addDisposer(dispose: () => void, id?: string)
```

addDisposer 接受一个回调函数作为参数，该函数将自动在 DataView 被销毁的时候运行。

> **被销毁**最直接的理解就是【点击刷新按钮重新查询嵌入块，并造成 DataView 的重绘】，具体细节请参考【理解 DataView 的生命周期】小节。

以下是一个案例：创建一个计时器，并且在刷新的时候销毁计时器。

```js
//!js
const query = async () => {
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
}

return query();
```

![image](docs/assets/image-20241206194739-md7he6w.png)

### removeView

```js
removeView(id: string)
```

给定一个视图组件的 id (`container.dataset.id`​)，可以调用 `removeView`​ 方法将其删除。

> 🔔 `removeView`​ 和你直接在 js 中删除 element 的区别是：如果组件绑定了 `dispose`​ 操作，则在删除之前会自动执行以用于必要的清理。

```js
//!js
const query = async () => {
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
}

return query();
```

![image](docs/assets/image-20241209212929-dlfxtip.png)

### replaceView

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
const query = async () => {
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
}

return query();
```

![image](docs/assets/image-20241209220101-oypr89p.png)

## DataView 高级特性

### 自定义视图组件

插件会在 `/data/public`​ 目录下自动创建一个 `query-view.custom.js`​ 的脚本。利用这个脚本，你可以创建自己的自定义组件。

```ts
/**
 * User customized view. If registered, you can use it inside DataView by `dv.xxx()` or `dv.addxxx()`
 */
interface ICustomView {
    /**
     * Use the custom view
     * @param dv - DataView instance, might be empty while validating process
     */
    use: (dv?: IDataView) => {
        render: (container: HTMLElement, ...args: any[]) => void | string | HTMLElement; //Create the user custom view.
        dispose?: () => void;  // Unmount hook for the user custom view.
    },
    alias?: string[]; // Alias name for the custom view
}

interface IUserCustom {
    [key: string]: ICustomView;
}
```

每个组件结构如下：

* ​`alias`​：可选，定义组件的别名
* ​`use`​：用来实现自定义组件的函数

  * **参数**：`dv`​，一个 `DataView`​ 的实例

    * 注意：`dv`​ 参数**可能传入一个 null**
    * 原因是插件在导入脚本的时候需要检查组件函数的结构是否正确，会传入一个 `null`​ 用于检查 `use`​ 的返回值
  * **返回**：

    * ​`render`​：必要返回值，该方法的第一个 `container`​ 参数为组件的容器元素，后面的参数则为组件调用的参数；你可以

      1. 在 render 中创建自己的元素并调用 `container.append`​ 将元素加入容器中
      2. 也可以返回自定义的元素（或者单纯的字符串），返回值会被默认加入到 container 中
    * ​`dispose`​：可选，如果你的组件有一些副作用需要清理，则必须返回这个参数，`dispose`​ 方法将在 DataView 被销毁的时候调用

以默认的 example 组件为例：

```js
const custom = {
    example: {
        use: () => {
            let state;
            return {
                render: (element, id) => {
                    console.log('init example custom view with id:', id);
                    state = id;
                    element.innerHTML = 'This is a example custom view ' + id;
                },
                dispose: () => {
                    console.log('dispose example custom view ' + state);
                }
            };
        },
        alias: ['Example', 'ExampleView']
    }
}

export default custom;
```

成功注册自定义组件之后，可以直接调用 `dv.example`​, `dv.addExampleView`​ 等。

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addexample(`ID = ${Query.utils.date()}`);
dv.render();
```

![image](docs/assets/image-20241206200537-udf4v6b.png)

> 🔔 **注意**：`DataView`​ 会给所有的组件**自动添加他小写版本的别名**，所以两个名为 `Add`​ 和 `add`​ 的组件可能会一方覆盖另一方！

自定义的组件会在插件启动的时候自动导入，如果你在插件运行的过程当中更改了 js 文件，可以在设置面板或者顶栏菜单中点击「**重载自定义组件**」的按钮更新组件的状态。

### DataView.useState

> 🔔 **注意**：`useState`​ 为一个实验性的功能，目前的测试样例还不足以完全保证在多端同步的情况下不会出现任何问题。<u>不推荐</u>没有编程经验背景的新人（大量）使用！

嵌入块在每次打开文档、点击刷新按钮的时候，都会自动重绘（repaint），意味着每次 DataView 都会从头开始，是一个**无状态**的视图。

​`dv.useState`​ 方法为 DataView 提供了一些**持久化**的功能，该方法会返回一个 `State`​ 对象。他有两种使用的风格：类似 `signal`​ 的 `getter/setter`​ 风格和类似 `vue`​ 的 `.value`​ 风格。

```js
const state = dv.useState('keyname', 1); //key, default value
//获取当前状态
state();
state.value;
//更新状态
state(2)
state.value = 2;
```

每个 state 都会在嵌入块刷新的时候，会将当前的状态写入**缓存**并**最终**保存到**块的自定义属性**当中，从而实现状态的持久化。

以下是一个案例，你可以不断的点击按钮，左侧的数目会一直增长。

```js
//!js
let dv = Query.DataView(protyle, item, top);
const state = dv.useState('counter', 1);
const button = document.createElement('button');
button.textContent = '+1';
button.onclick = (e) => {
    state.value += 1; //更新状态, 等价于 state(state() + 1)
    dv.repaint(); // repaint 用于主动触发嵌入块的重绘
}
dv.addcols([button, dv.md(`State = ${state()}`)]); //等价于使用 state.value

dv.render();
```

现在：<u>关闭当前的文档，然后重新打开</u>，你会发现嵌入块的内容依然是这个数值。再打开嵌入块的属性面板，会发现名为 `counter`​ 的 state 已经保存到自定义属性中。

![image](docs/assets/image-20241206201729-1bfn3md.png)

以下给出一个「每日一句」的案例：

* 通过网络 API 每天获取一个句子
* 通过 state 保存这个句子，并保证这一天一直显示这一句话

```js
//!js
let dv = Query.DataView(protyle, item, top);
const today = Query.Utils.today();
const state = dv.useState(today);
//如果 state 存在，就用之前的缓存
if (state()) {
  dv.addmd('今天的每日一句')
  dv.addmd(`> ${state()}`)
} else {
//注：受到网络环境的影响，你在本地测试的时候可能不一定能访问这个 API
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    //更新 state
    state.value = `${data.data.content} —— ${data.data.origin}`;
    dv.addmd('今天的每日一句')
    dv.addmd(`> ${state.value}`)
 }
});
}
dv.render();
```

由于我们使用了时间戳作为 state key，所以如果你多运行几天再打开属性面板，会发现每天的一句话都保存在这里。

![image](docs/assets/image-20241206202124-3pu0qdw.png)

#### state 的更新写入机制（技术细节，可跳过）

> 🔔 state 是一个实验性的功能，我也不知道是否会引发奇怪的问题。如果你在使用的过程中遇到了问题，可以参考这一小节。

DataView 的 state 采用了缓存 + 块属性存储的方式进行持久化。

1. **缓存**：当停留在文档页面中的时候，state 会写入到 Session Storage 的缓存中；每次调用 `state()`​ 更新状态或者触发嵌入块重绘，也只会更改 Session 缓存中的 state 数据
2. **文档级写入**：当一个文档被关闭的时候，文档内所有嵌入块用到的 state 会写入到块属性中，并从 Session Storage 缓存中删除对应文档中的缓存
3. **全部写入**：当插件被禁用或者桌面端的窗口被关闭（准确来说是监听了右上角 X 按钮的点击事件）的时候，所有缓存中的 State 会被写入块属性中，并清空全部 Session Storage 中缓存的 state

🤔 **为什么要这么做，而不是每次在代码中更新 state 的时候，直接保存到块属性中？**

* 次要的原因是：为了防止过于频繁的块更新操作（当然这个可以通过 debounce 来解决）。
* **首要原因**是：防止在多端同步的情况下出现**数据冲突**乃至地狱的“**循环冲突**”的情况

以下是一个案例来解释什么是“**循环冲突**”。

案例：考虑这种 DataView

```js
//!js
const dv = Query.DataView(protyle, item, top);
const cnt = dv.useState('counter', 1);
dv.addmd(`${cnt()} --> ${cnt() + 1}`);
cnt.value += 1;
dv.render();
```

假如有两个设备 A，B，同时打开了这个文档的嵌入块，**假如**实时更新块属性的话就会触发窒息般的“**循环冲突**”。

1. 设备 A 更新了状态后，数据同步到云端
2. 假设设备 B 开启了同步感知，则会自动更新数据；并且由于所在的文档状态发生变化，会触发文档级别的重绘——进而导致 B 中嵌入块的重绘
3. 但是一旦 B 的嵌入块重绘，就会自动更新 counter 状态，于是 B 中嵌入块的状态就和云端更新下来的数据产生冲突——具体表现为生成一个冲突文档
4. 由于 B 的状态发生了变化，所以同样会同步到云端
5. 此时如果 A 开启同步感知，也会触发文档重绘，同样会出现更新的嵌入块状态和云端数据状态发生冲突的情况
6. 以上过程如果不进行人为干预阻止，<u>可以无限重复下去，双方依次不断地生成一个又一个冲突文档</u>……

可以看到，引发冲突的最直接的问题是：思源在同步文档后会触发重绘，而重绘会引发块状态的自动更新。

🙁 所以为了避免这种循环冲突的发生，state 在文档内更新的时候只会写入缓存，不会更改块的状态；只有文档被关闭了、确认不会引发冲突性的重绘的时候，才会写入到块属性中。

### 理解 DataView 的生命周期（技术细节，可跳过）

1. **创建实例**：当打开文档，或者文档动态加载到嵌入块的时候，嵌入块的代码会自动运行；此时就会触发 DataView 的构造函数，并创建 dv 实例

    * **恢复组件状态**：首先尝试从 `SessionStorage`​ 中查找组件缓存的状态，如果不存在则解析嵌入块的块属性并从 Element 属性中恢复组件状态
    * **注册组件**：在 DataView 创建的过程中，会注册内置的组件和外部导入的组件，注册完毕之后，将可以通过 `dv.addxxx`​ 来构造视图组件
2. ​**​`dv.addxxx`​**​：在嵌入块代码中，逐行调用 `dv.addxxx()`​ 函数，依次调用各个组件

    * 对于副作用的组件，会在 `dv`​ 实例中注册 `dispose`​ 回调函数用于在销毁的时候清理副作用
3. **状态更新**：在嵌入块运行过程中，如果调用了 `dv.useState`​ 并更新了状态，将会把最新的状态缓存到 SessionStorage 当中
4. ​**​`dv.render`​**​：

    * 绑定当前嵌入块的元素，截断部分事件冒泡
    * 注册 render 函数中相关副作用的 `dispose`​ 回调函数
    * 监控当前嵌入块的状态
5. **重绘嵌入块**：

    * **触发条件**：当嵌入块代码更新、用户点击刷新的时候，思源将销毁 DataView 所在的嵌入块内容
    * **Dispose**：检测到嵌入块被销毁，当前 DataView 已经失效，调用所有 `dispose`​ 回调函数清理 DataView 的副作用
    * **接下来回到状态 1**，重新创建新的实例
6. **生命周期结束**

    * **触发条件**：嵌入块所在的文档被关闭、思源桌面端窗口被关闭、window 被重载或者插件被禁用
    * **Finalize**：1）调用 DataView 的 dispose 操作；2）读取 SessionStorage 内相关的 DataView 的状态写入到嵌入块属性中；3）清理 SessionStorage 缓存

### ⚠️ 一些建议

1. **不建议**在 DataView 里写**大量的交互**！

    * 尽管在提供的 API 等方面并没有禁止用户编写交互性的视图组件（例如输入框，按钮等）；但请注意：DataView 被设计为一个 **「理论上只读」** 的元素、一个嵌入在文档中的 DashBoard
    * **核心矛盾**在于：思源编辑器本身就会监听各种用户输入事件，而 DataView 中用户输入事件如果错误地传递到思源的监听器中，可能造成风险
    * DataView 内部会阻止一些常见事件的冒泡，但是也不能排除一些特殊的意外情况

      ```js
      const EVENTS_TO_STOP = [
          'compositionstart', 'compositionend',
          'mousedown', 'mouseup', 'keydown', 'keyup', 'input',
          'copy', 'cut', 'paste'
      ];
      ```
    * 如果你在编写自定义的 dv 的过程中，发现了和用户输入相关的异常情况，你最好停下来，不要再继续尝试，以免对重要数据造成不良影响
2. <u>多端设备同步情况下</u>，使用 useState 要小心，建议开启「**设置-云端-生成冲突文件**」![image](docs/assets/image-20241210133627-mnp2zup.png)

    ![image](docs/assets/image-20241211194757-74vrp7m.png)

    目前 state 功能虽然规避了「循环冲突」的问题，但是在一些特殊的多端同步情况下**仍然可能出现数据冲突的情况**。

    为了避免出现数据状态丢失，建议在思源的同步设置中开启「生成冲突文档」的设置，这样则遇到问题的时候还可以手动处理。

## 外部编辑器与调试

### 在外部编辑器中编辑代码

思源内置的嵌入块悬浮窗在编辑略微复杂的代码的时候体验非常差劲。因此插件提供了在外部编辑器中打开 js 代码的功能。

 **⚠️ 注意！本功能仅在桌面端可用。**

用户需要在插件设置中配置外部编辑器打开的命令参数：

![image](docs/assets/image-20241202164246-vla7mo8.png)

默认为 `code -w {{filepath}}`​，代表会使用 VsCode （请将 `code`​ 添加到环境变量中）来打开。其中 `{{filepath}}`​ 会在运行时被替换为实际的临时代码文件的路径。

使用的时候，需要在块的插件菜单中点击“Edit Code”按钮。

![image](docs/assets/image-20241202164442-588f7d7.png)

插件会自动在本地创建一个临时的代码文件，然后在使用上述命令打开代码文件。插件会**跟踪代码文件的编辑更新**并将文件中最新的内容更新到嵌入块中，并刷新渲染嵌入块的内容。

![image](docs/assets/image-20241206211503-q3b2uk5.png)

常见代码编辑器的命令行参考：

* vscode

  [https://code.visualstudio.com/docs/editor/command-line](https://code.visualstudio.com/docs/editor/command-line)
* sublime

  [https://www.sublimetext.com/docs/command_line.html](https://www.sublimetext.com/docs/command_line.html)

### 我在嵌入块中的代码没有什么反应，我该怎么办？

1. 检查有没有加 `//!js`​，思源只有在读入以这个为前缀的代码，才会当作 JS 程序来执行。
2. 查看控制台报错

    不过由于嵌入块的代码是在一个 `Function`​ 对象中执行，所以当执行出现错误的时候不一定会在控制台有报错。
3. Debug 你的 Js 代码，然后详细查看是不是哪里写错了。（见下一小节）

如果有条件，更加推荐在外部编辑器中编辑你的代码，有语法高亮等提示后可以规避很多低级错误（例如不慎输入了中文符号等）。

### 如何 Debug DataView 的代码？

你可以在在代码中添加 `debugger`​，然后打开开发者模式。当运行到这一行的时候，就会自动进入断点模式，然后就可以调试程序了。

![image](docs/assets/image-20241207204410-a231unc.png)

### 配合思源模板使用

你可以将调试好的嵌入块代码放入 `template/`​ 下的模板文件中，这样对于常用的查询模板都可以快速调用：

![image](docs/assets/image-20241209002057-jarcxsu.png)

使用模板还有一个好处是，可以使用一些模板提供的变量，例如下面这个模板中，使用了 `$datestr_sy`​ 变量，用来查询今天创建的文档。

```markdown
.action{$datestr := now | date "2006-01-02"}
.action{$datestr_sy := now | date "20060102"}

{{//!js_esc_newline_const today = '.action{$datestr_sy}';_esc_newline_const query = async () => {_esc_newline_  let dv = Query.Dataview(protyle, item, top);_esc_newline_  let blocks = await Query.sql(`_esc_newline_    select * from blocks where type='d' and created like '${today}%'_esc_newline_  `);_esc_newline_  dv.addList(blocks, { type: 'o', columns: 2 });_esc_newline_  dv.render();_esc_newline_}_esc_newline_return query();}}
```

同样的功能虽然也能用 `Query.Utils.today()`​ 来实现，但是由于嵌入块每天都会刷新，如果想要固定显示某一天创建的文档，要么手动填写 `today`​ 变量，要么使用 `state`​ 功能在第一次的时候直接保存日期信息。

不过模板 markdown 文件中的嵌入块代码必须以单行模式编写，每个换行符都需要替换为 `_esc_newline_`​，非常不方便转换。

插件在块菜单中提供了一个按钮，可以直接进行上述转换。你可以直接复制弹出窗口中的代码，粘贴到 template 文件中使用。

![image](docs/assets/image-20241209001549-kcurxon.png)

![image](docs/assets/image-20241209001506-1j38x18.png)

## 案例总览

本页汇总随插件发布的全部可运行案例。案例代码的唯一来源是仓库 `public/example/`（安装后位于插件目录的 `example/` 下），随插件版本一起发布；本页不复制代码，代码块由文档站和 README 从该目录自动读取/生成。

使用方式：把案例代码复制到一个嵌入块（内容以 `//!js` 开头）并运行即可看到效果。部分案例在上面的文档中其实已经出现过了。

> 💡 所有案例代码都随插件发布在插件目录 `example/` 中；下方每个案例都提供了完整的代码。

### 案例列表

| 文件 | 标题 | 说明 | 标签 |
|---|---|---|---|
| exp-month-todo.js | 本月待办列表 | 查询本月所有未完成的 TODO 列表 | task, todo, list |
| exp-child-docs.js | 子文档列表 | 列出当前文档的所有子文档，效果类似 Notion 等软件 | doc, list |
| exp-avs-under-root-doc.js | 属性视图汇总 | 查询所在文档下所有的属性视图（Attribute View），然后汇总显示在嵌入块中 | attribute-view, embed |
| exp-doc-backlinks-table.js | 当前文档反向链接表格 | 以表格的形式显示当前文档的回链 | backlink, table |
| exp-doc-backlinks-grouped.js | 反向链接分组展示 | 按照引用块的类型，分组查看当前文档的反向链接，并放入折叠列表中展示 | backlink, list |
| exp-outline.js | 文档大纲 | 查询当前文档的大纲，并以树状结构展示 | outline, tree |
| exp-list-tags.js | 标签卡片视图 | 查询并以卡片视图的形式展示所有的标签（tags） | tag, card |
| exp-latest-update-doc.js | 最近更新的文档 | 展示最近更新的 32 篇文档 | doc, list, superblock |
| exp-today-updated.js | 今天更新的文档 | 查询今天更新的所有文档，并以列表的形式展示 | doc, date, state |
| exp-created-docs.js | 每月创建文档数曲线 | 查询每个月创建的文档的数量，并使用 echarts 折线图展示出来 | doc, echarts, chart |
| exp-sql-executor.js | SQL 查询器 | 在输入框中输入 SQL 语句，点击执行按钮，将执行结果以表格的形式展示 | sql, table |
| exp-gpt-chat.js | ChatGPT 对话 | 一个非常简单的 ChatGPT 对话框，使用思源内部设置的 GPT API | gpt, chat |
| exp-doc-backlinks-graph.js | 反链关系图 | 使用 Echarts Graph 展示当前文档的反链引用块 | backlink, echarts, graph |
| exp-show-asset-images.js | 资源目录图片查看 | 分页查看 assets 目录下所有的图片 | asset, image, paging |
| exp-daily-sentence.js | 每日一句 | 每日一句，这个案例中用到了 state，所以每天只会显示一条句子 | quote, state |
| exp-gpt-translate.js | GPT 翻译 | 随机从思源中选取一段文字，然后使用 GPT 翻译成英文，使用思源内部设置的 GPT API | gpt, translate |
| exp-doc-tree.js | 文档树 | 查询当前文档下属的文档树结构，并使用嵌套列表展示；最大深度由 MAX_DEPTH 变量控制 | doc, tree, list |
| exp-month-todo-kanban.js | 每月任务看板 | 查询每个月尚未完成的 Task，汇总显示在看板上 | task, kanban |
| exp-month-todo-timeline.js | 未完成任务时间线 | 查询所有未完成的任务块，以月份时间线分组横向排列 | task, timeline |

### exp-month-todo

查询本月所有未完成的 TODO 列表。

```js
//!js
async function getIds() {
    let blocks = await Query.task(Query.utils.thisMonth(), 32);
    return blocks.pick('id');
}

return getIds();
```

### exp-child-docs

列出当前文档的所有子文档，效果类似 Notion 等软件。

```js
//!js
const row = (block) => `
{{{col

${block.icon} **${block.aslink}**

**${block.createdDate} ~ ${block.updatedDate}**
{: style="flex: none;" }

}}}
{: style="border-bottom: 1px dashed var(--b3-theme-on-surface-light); border-radius: 0px;" }
`.trim();

const query = async () => {
    let dv = Query.DataView(protyle, item, top);

    let blocks = await Query.childDoc(dv.root_id);
    let icons = blocks.map(block => Query.Utils.docIcon(block));
    blocks = blocks.addcols({ 'icon': icons });

    dv.addmd(blocks.map(row).join('\n\n'));
    dv.render();
}

return query();
```

### exp-avs-under-root-doc

查询所在文档下所有的属性视图（Attribute View），然后汇总显示在嵌入块中。

```js
//!js
const query = async () => {
    const root_id = Query.root_id
    const sql = `select * from blocks where type='av' and path like '%${dv.root_id}%'`;
    const blocks = await Query.sql(sql);
    return blocks.pick('id')
}

return query();
```

### exp-doc-backlinks-table

以表格的形式显示当前文档的回链。

![image](docs/assets/image-20241210183914-5nm5w4r.png)

```js
//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    let blocks = await Query.backlink(protyle.block.rootID);
    blocks = await Query.fb2p(blocks);
    dv.addtable(blocks, {
        fullwidth: true,
    });
    dv.render();
}
return query();
```

### exp-doc-backlinks-grouped

按照引用块的类型，分组查看当前文档的反向链接，并放入折叠列表中展示。

![image](docs/assets/image-20241213161247-f6qm95q.png)

```js
//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    let blocks = await Query.backlink(protyle.block.rootID);
    blocks = await Query.fb2p(blocks);
    blocks.groupby('type', (type, groups) => {
        dv.adddetails(
            Query.Utils.typename(type),
            dv.table(groups, {
                fullwidth: true,
            })
        );
    })
    dv.render();
}
return query();
```

### exp-outline

查询当前文档的大纲，并以树状结构展示。

![image](docs/assets/image-20241210172133-ivjwzpc.png)

```js
//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let ans = await Query.request('/api/outline/getDocOutline', {
        id: Query.root_id(protyle)
    });
    ans = Query.wrapit(ans);
    const iterate = (data) => {
        for (let item of data) {
            if (item.count > 0) {
                let subtocs = iterate(item.blocks ?? item.children);
                item.children = Query.wrapBlocks(subtocs);
            }
        }
        return data;
    }
    let tocs = iterate(ans);
    dv.addlist(tocs, {
	    renderer: b => `[${b.name || b.content}](${b.asurl})`,
    });
    dv.render();
}

return query();
```

### exp-list-tags

查询并以卡片视图的形式展示所有的标签（tags）。

```js
//!js

const useButton = (title, onclick) => {
    let button = document.createElement('button');
    button.className = 'b3-button b3-button--text';
    button.innerText = title;
    button.onclick = onclick;
    return button;
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    dv.render();
    let tags = await Query.request('/api/tag/getTag', {
        sort: 4
    });

    tags = tags.sort((a, b) => - a.count + b.count);

    const onclick = (tag) => {
        Query.tag(tag.label).then(async (blocks) => {
            if (blocks.length == 0) return;
            blocks = blocks.sorton('created');
            blocks = await Query.prune(blocks, 'leaf');
            blocks = await Query.fb2p(blocks);
            //const table = dv.table(blocks, {fullwidth: true} );
            const table = dv.cards(blocks, {
                width: '275px',
                height: '150px'
            });
            dv.replaceView(main.dataset.id, table);
        });
    }

    const createTagButtons = (tags) => {
        const buttons = [];
        tags.forEach(tag => {
            const button = useButton(`#${tag.label} (${tag.count})`, () => {
                onclick(tag);
            });
            button.style.margin = '5px';
            buttons.push(button);

            // Recursively process children tags
            if (tag.children && tag.children.length > 0) {
                const childButtons = createTagButtons(tag.children);
                buttons.push(...childButtons);
            }
        });
        return buttons;
    }

    const tagButtons = createTagButtons(tags);

    const allTagsList = document.createElement('div');
    allTagsList.style.display = 'flex';
    allTagsList.style.flexWrap = 'wrap';
    tagButtons.forEach(tagElement => {
        allTagsList.appendChild(tagElement);
    });
    dv.addele(allTagsList);
    dv.addmd('---');

    let main = dv.addele('')
}

return query();
```

### exp-latest-update-doc

展示最近更新的 32 篇文档。

💡 本代码中用到了特殊的 `{{{col }}}` 语法，这种语法为思源特有的超级块 Markdown 标记语法，用于创建多行、多列的块结构。

![image](docs/assets/image-20241213160419-62pwf7s.png)

```js
//!js

// SiYuan's super block syntax (md syntax extension)
const columns = (block) => `
{{{col

${block.attr('hpath')}

${block.attr('box')} - ${block.attr('updated')}
{: style="text-align: right; flex: none;" }

}}}
`.trim();
const query = async () => {
    let dv = Query.DataView(protyle, item, top);

    let blocks = await Query.sql(`
      select * from blocks where type='d'
      order by updated desc limit 32;
    `)
    dv.addlist(blocks, {
        renderer: columns
    });

    dv.render();
}

return query();
```

### exp-today-updated

查询今天更新的所有文档，并以列表的形式展示。

这个案例中，使用 `state` 来存储日期信息，过了今天之后，表格的内容将一直保持不变，而非获取未来某天更新的文档。实际使用过程中，其实更加建议配合模板使用，在创建的时候直接配置 `now` 为当天的日期，而非通过 `state` 来维护日期状态。

![image](docs/assets/image-20241210172746-kbxtfhr.png)

```js
//!js
const now = Query.Utils.today(false);
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const todayState = dv.useState('today', now); //Only update the state once.

    let updatedState = dv.useState('updated-docs', []);
    if (now === todayState.value) {
        dv.addmd('#### Today\'s Updated Documents');
        let updatedDoc = await Query.sql(`
            select * from blocks where type='d' and updated like '${todayState.value}%'
            order by updated desc
        `);
        dv.addtable(updatedDoc, {
            fullwidth: true,
            cols: ['box', 'hpath', 'updated'],
        });
        let state = updatedDoc.omit('ial', 'path', 'hash', 'fcontent');
        updatedState(state);
    } else {
        dv.addmd(`#### Updated Documents on ${todayState.value}`)
        dv.addtable(updatedState(), {
            fullwidth: true,
            cols: ['box', 'hpath', 'updated'],
        });
    }

    dv.render();
}

return query();
```

### exp-created-docs

查询每个月创建的文档的数量，并使用 echarts 折线图展示出来。

![image](docs/assets/image-20241207010811-8lh25x5.png)

```js
//!js
const query = async () => {
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
        title: 'Monthly Created Documents',
        xlabel: 'Month',
        ylabel: 'Count'
    });

    dv.render();
}

return query();
```

### exp-sql-executor

在输入框中输入 SQL 语句，点击执行按钮，将执行结果以表格的形式展示。

![image](docs/assets/image-20241209005221-qtytbib.png)

```js
//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const sql = dv.useState('sql', '');
    const searchResult = dv.useState('search-result', []);

    dv.addmd(`#### SQL Executor`);
    const textarea = document.createElement('textarea');
    textarea.className = "fn__block b3-text-field";
    textarea.rows = 5;
    textarea.style.fontSize = '20px';
    textarea.value = sql.value;
    dv.addele(textarea);

    const button = document.createElement('button');
    button.className = "fn__block b3-button";
    button.textContent = "Execute";
    dv.addele(button);

    dv.addtable(searchResult(), {
        fullwidth: false,
        cols: null,
        renderer: (b, a) => b[a]
    });

    button.onclick = async () => {
        const ans = await Query.sql(textarea.value);
        sql.value = textarea.value;
        searchResult(ans);
        dv.repaint();
    }

    dv.render();
}

return query();
```

### exp-gpt-chat

一个非常简单的 ChatGPT 对话框，使用思源内部设置的 GPT API。

> 这个代码用到了一个上面没有提到的 `Query.gpt` API，具体用法请参考 d.ts 文件。

![image](docs/assets/image-20241210171119-o72dyyd.png)

```js
//!js

const ui = () => {
    const textarea = document.createElement('textarea');
    textarea.className = "fn__block b3-text-field";
    textarea.rows = 3;
    textarea.placeholder = "Input Your Message...";

    // 创建按钮容器，使用 flex 布局
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.marginTop = '8px';

    const removeLastButton = document.createElement('button');
    removeLastButton.className = "b3-button";
    removeLastButton.textContent = "Remove Last";
    buttonContainer.appendChild(removeLastButton);

    // Send 按钮
    const sendButton = document.createElement('button');
    sendButton.className = "b3-button";
    sendButton.textContent = "Send Input";

    // 将按钮添加到容器
    buttonContainer.appendChild(removeLastButton);
    buttonContainer.appendChild(sendButton);

    return { textarea, buttonContainer, sendButton, removeLastButton };

}


const chat = async () => {
    let dv = Query.DataView(protyle, item, top);
    const messages = dv.useState('messages', []);

    dv.addmd(`#### GPT Chat`);
    const msgIds = [];
    messages().forEach(msg => {
        let el = dv.addmd(`**${msg.role === 'user' ? 'You' : 'GPT'}**: ${msg.content}`);
        msgIds.push(el.dataset.id);
    });

    dv.addmd('---');

    const { textarea, buttonContainer, sendButton, removeLastButton } = ui();

    dv.addele(textarea);

    dv.addele(buttonContainer);

    sendButton.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        messages([...messages(), { role: 'user', content: prompt }]);
        textarea.value = '';
        sendButton.disabled = true;
        removeLastButton.disabled = true;
        let respond = dv.addmd(`**GPT**: `);
        let id = respond.dataset.id;

        try {
            const response = await Query.gpt(prompt, {
                stream: true,
                streamInterval: 3,
                streamMsg: (content) => {
                    dv.replaceView(id, dv.md(`**GPT**: ${content}`));
                }
            });
            messages([...messages(), { role: 'assistant', content: response }]);
        } catch (error) {
            dv.addmd(`Error: ${error.message}`);
        }

        sendButton.disabled = false;
        removeLastButton.disabled = false;
        dv.repaint();
    };

    removeLastButton.onclick = () => {
        if (msgIds.length < 2) return;

        // 删除最后两条消息
        messages(messages().slice(0, -2));

        // 删除最后两个消息的 DOM 元素
        dv.removeView(msgIds.pop());
        dv.removeView(msgIds.pop());
    };

    dv.render();
}

return chat();
```

### exp-doc-backlinks-graph

使用 Echarts Graph 展示当前文档的反链引用块。

![image](docs/assets/image-20241211213426-38ws4kk.png)

```js
//!js

const clipStr = (text, cnt) => {
    if (text.length > cnt - 3) {
        return text.slice(0, cnt - 3) + '...';
    } else {
        return text;
    }
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let thisdoc = await Query.thisdoc(protyle);

    let backlinks = await Query.backlink(dv.root_id);
    let nodes = [thisdoc, ...backlinks];  //Merge to nodes
    let links = [
      { source: thisdoc.id, target: backlinks.pick('id') },  //Create links
    ];

    dv.addegraph(nodes, links, {
        height: '500px',
        roam: true,
        nodeRenderer: (block) => {
            //Only return name of the node is ok, other parts will use the default renderer.
            return {
                name: clipStr(block.name || block.content, 15),
            }
        }
    });

    dv.render();
}

return query();
```

### exp-show-asset-images

分页查看 assets 目录下所有的图片。

![image](docs/assets/image-20241211225413-fc962d4.png)

```js
//!js
const assetFile = async () => {
    let response = await Query.request('/api/file/readDir', {
        path: '/data/assets'
    });
    return response.map(file => file.name);
}

const ITEMS_PER_PAGE = 10;

const useControl = (files) => {
    let page = 1;
    let leftBtn = document.createElement('button');
    leftBtn.classList.add('b3-button');
    let span = document.createElement('span');
    let rightBtn = document.createElement('button');
    rightBtn.classList.add('b3-button');

    let slice = [];
    let total = files.length;
    let pages = Math.ceil(total / ITEMS_PER_PAGE);

    leftBtn.textContent = 'Previous';
    span.textContent = `Page ${page} of ${pages}`;
    rightBtn.textContent = 'Next';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px'
    });
    panel.appendChild(leftBtn);
    panel.appendChild(span);
    panel.appendChild(rightBtn);

    const updateSlice = () => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        slice = files.slice(start, end);
    };

    const left = () => {
        if (page > 1) {
            page--;
            span.textContent = `Page ${page} of ${pages}`;
            updateSlice();
        }
    };

    const right = () => {
        if (page < pages) {
            page++;
            span.textContent = `Page ${page} of ${pages}`;
            updateSlice();
        }
    };

    updateSlice();

    return {
        panel,
        leftBtn,
        rightBtn,
        left,
        right,
        slice: () => slice
    };
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let files = await assetFile();
    files = files.filter(file => {
        return file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg');
    });

    let control = useControl(files);

    dv.addele(control.panel);

    let ele = dv.addele('Placeholder');
    let id = ele.dataset.id;

    const createView = (slice) => {
        const data = slice.map(item => {
            return {
                name: item,
                img: `![](/assets/${item})`
            }
        });
        return dv.table(data, {
            fullwidth: true,
            cols: null,
        });
    }

    control.leftBtn.onclick = () => {
        control.left();
        const slice = control.slice();
        dv.replaceView(id, createView(slice))
    };
    control.rightBtn.onclick = () => {
        control.right();
        const slice = control.slice();
        dv.replaceView(id, createView(slice))
    };

    dv.replaceView(id, createView(control.slice()))

    dv.render();
};

return query();
```

### exp-daily-sentence

每日一句，这个案例中用到了 `state`，所以每天只会显示一条句子。

> 注意：这个例子中用到了随便从网上找到的 API，不一定稳定，当个案例看看就行。

```js
//!js
let dv = Query.DataView(protyle, item, top);
const today = Query.Utils.today();
const state = dv.useState(today);
if (state()) {
  dv.addmd('今天的每日一句')
  dv.addmd(`> ${state()}`)
} else {
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    state.value = `${data.data.content} —— ${data.data.origin}`;
    dv.addmd('今天的每日一句')
    dv.addmd(`> ${state.value}`)
 }
});
}
dv.render();
```

### exp-gpt-translate

随机从思源中选取一段文字，然后使用 GPT 翻译成英文，使用思源内部设置的 GPT API。

```js
//!js
const prompt = (text) => `
Please translate the text after --- to English.
Then output the translated text, no other text or comments.
Maintain the markdown format of the original text.
---

${text}
`;
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    dv.render();
    //任意选择一个不为空的段落
    let block = (await Query.random(10, 'p')).find(b => b.markdown !== '');

    let md = block.markdown;
    dv.addmd(`
## Original Text

${md}

----
`);
    const div = document.createElement('div');
    let tempid = (dv.addele(div)).dataset.id;
    const translated = await Query.gpt(prompt(md), {
        stream: true,
        streamMsg: (content) => {
            div.innerText = content;
        }
    });
    dv.removeView(tempid);

    dv.addmd(`
## Translated Text

${translated}
`.trim());
}

return query();
```

### exp-doc-tree

查询当前文档下属的文档树结构，并使用嵌套列表展示；最大深度由 `MAX_DEPTH` 变量控制。

```js
//!js
const MAX_DEPTH = 3;  // Control the max depth of the tree, not recommend to set too large

const buildTree = async (docId, depth = 1) => {
    if (depth > MAX_DEPTH) return [];
    const children = await Query.childdoc(docId);

    for (const child of children) {
        let docs = await buildTree(child.id, depth + 1);
        if (docs.length > 0) {
            child.children = Query.wrapBlocks(docs);
        }
    }

    return children;
};

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    dv.render();
    const tree = await buildTree(dv.root_id, 1);
    dv.addlist(tree, { type: 'o' });
};

return query();
```

### exp-month-todo-kanban

查询每个月尚未完成的 Task，汇总显示在看板上。

```js
//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    // null: no `after` filter, query all task block
    // 128: max number of result
    let blocks = await Query.task(null, 128);
    let grouped = blocks.groupby((b) => {
        return b.createdDate.slice(0, -3)
    });
    let N = Object.keys(grouped).length;
    // each group with a fixed witdh 200px
    dv.addmkanban(grouped, {
        width: `${N * 200}px`
    });
    dv.render();
}
return query();
```

### exp-month-todo-timeline

查询所有未完成的任务块，以月份时间线分组横向排列。

```js
//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);

    let blocks = await Query.task(null, 128);
    blocks = blocks.sorton('created', 'desc');
    const blockKey = (b) => b.createdDate.slice(0, 7);

    let columns = [];
    blocks.groupby(blockKey, (groupname, group) => {
        let ele = dv.rows([
            dv.md(`#### ${groupname}`),
            dv.list(group)
        ])
        columns.push(ele);
    });
    let ele = dv.addcols(columns, {
        minWidth: '400px'
    });
    ele.style.border = '2px dashed var(--b3-theme-primary)';
    ele.style.borderRadius = '10px';
    ele.style.margin = '10px 20px';

    dv.render();
}
return query();
```

## API 参考

插件对外 API 的精确签名以随插件发布的类型声明 `public/types.d.ts` 为准；本页只提供可读导览，不复制类型声明的内容。

完整类型声明文件也可在 GitHub 查看：[frostime/sy-query-view/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)。


### Query

`Query` 是插件在嵌入块中透传的 API 对象，主要分为四类能力：

- **SQL 与封装查询**：最通用的是 `Query.sql(sql)`，直接把 SQL 语句传入即可；另有 `Query.backlink`、`Query.tag`、`Query.task`、`Query.random`、`Query.dailynote`、`Query.childDoc`、`Query.keyword`、`Query.keywordDoc`、`Query.markdown` 等封装查询。
- **结果包装**：查询结果返回 `IWrappedList<IWrappedBlock>`，除了块的基本属性外还带 `pick`、`aslink` 等便捷成员。
- **工具函数**：`Query.Utils` 提供时间、文本等常用工具。
- **DataView 构造**：`Query.DataView(protyle, item, top)` 创建 DataView 实例。

详细说明见「Query 查询」主题。

### DataView

`DataView` 把查询结果渲染为自定义视图，使用流程是：创建实例 → 添加视图 → `dv.render()`。

- **基础组件**：`dv.addlist`、`dv.addtable`、`dv.addmd`；
- **高级组件**：cards、embed、mermaid 系列、echarts 系列、columns/rows、details、addElement、addDisposer、removeView、replaceView 等；
- **高级特性**：自定义视图组件（`dv.xxx()` / `dv.addxxx()`）、`DataView.useState` 状态持久化、视图生命周期。

详细说明见「DataView 视图」与「DataView 高级特性」主题。

### IWrappedBlock & IWrappedList

查询结果的两个核心包装类型：

- `IWrappedBlock`：在 `Block` 基础上增加便捷属性与转换能力，例如 `aslink`（思源链接）、`asurl` 等；
- `IWrappedList<T>`：`IWrappedBlock` 的数组类型，带 `pick(...)` 等方法，可从列表中提取指定属性组成新列表。

精确成员与签名以类型声明为准。

### 其他基础类型

`Block`、`BlockType`、`Notebook`、`DocumentId`、`BlockId`、`SiYuanDate` 等基础类型同样定义在类型声明中。

> 注：接口文件会随着开发而变动，以下接口代码为构建时自动生成。最新完整的接口文件以随插件发布的 `public/types.d.ts` 为准，也可以在插件内文档站的「API 参考」页打开或下载当前版本的类型声明文件。

### Query

```ts
{{Query}}
```

### IWrapBlock & IWrapList

```ts
{{Proxy}}
```

### DataView

```ts
{{DataView}}
```


## 智能体技能

Query&View 将随后续版本提供一个**自包含的核心智能体技能（Agent Skill）**：一份 `SKILL.md`，指导 AI 代理（Agent）如何编写和查证 Query&View 代码，包括工作流程、规则与查证方式。

- 本页面在技能编写并验收完成前仅为占位。技能完成后，插件内文档站与仓库中的核心 `SKILL.md` 展示的是同一份内容，不会另行维护一份技能说明。
- 在文档站中查看技能内容不代表技能已安装、已启用或已接入 SiYuan Agent；实际状态以安装情况为准。
