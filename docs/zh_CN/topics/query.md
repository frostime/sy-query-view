# Query 查询

## 使用 Query 进行 SQL 查询

使用本插件一个最简单的查询如下。其中：

* ​`Query`​ 对象是插件对外透传的一个 API 对象
* ​`Query.backlink`​ 表示查询某个文档的反向链接
* ​`protyle.block.rootID`​ 是当前嵌入块所在文档的 ID
* ​`blocks`​ 是查询到的块组成的列表（`Block[]`​)
* ​`block.pick('id')`​ 代表提取（pick）每个块的 `id`​ 属性，组成一个新的列表，再返回给思源

所以这段代码的功能就是：<u>查询当前所在文档的所有反链</u>。

```js
//!js
let blocks = await Query.backlink(protyle.block.rootID);
return blocks.pick('id'); //特殊工具函数，后面会介绍; 等价于blocks.map(b => b.id);
```

> 注：示例中的代码直接使用了顶层 await，这需要思源 3.8.0 及以上版本；在更早的版本中，需要把 await 相关的代码包裹在一个 async 函数中，并以 `return query();` 结尾调用。

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

## WrappedList & WrappedBlock

尽管在基础用法章节里，我们简单介绍了使用 `Query`​ 进行 SQL 查询的便利性，但是最大的优点却没有提到——所有使用 Query API 查询得到的结果都**额外附加了一些便利的工具方法或者属性**。

使用 Query 查询得到的结果在理念上被视为一个表结构，每一个元素代表了个思源的 Block。

```ts
[
  {'id': 'ID-111', 'type': 'd', created: '20230401001000'},
  {'id': 'ID-hhh', 'type': 'd', created: '...'},
  {'id': 'ID-kkk', 'type': 'b', created: '...'},
]
```

![image](../../assets/image-20230506013450-g2mkp8l.png)​

为了方便对这个表数据进行操作：

* 表查询列表中的每个元素，会被封装成一个 `IWrappedBlock`​ 对象，提供关于块元素的常用操作
* 表查询列表自身，会被封装成一个 `IWrappedList`​ 对象，以便于快速完成一些对「表数据结构」的操作

### IWrappedBlock

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
```

![image](../../assets/image-20241213184747-0ma9dj4.png)

> 🔔 以上介绍不一定完整，完整 API 文档以 `repo/public/types.d.ts`​ 为准

### IWrappedList

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

## Query.Utils

Query.Utils 内包含了一些可能会比较有用的工具函数。

> 🙂 `Query.Utils`​ 下所有的函数都是同步的，不需要 `await`​。
>
> ​`Query.Utils`​ 有一个小写版的别名 `Query.utils`​。

### 时间相关工具函数

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

![image](../../assets/image-20241204112906-ih3lqzu.png)

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
const sql = `select * from blocks
where updated >= '${Query.Utils.thisWeek()}'
limit 5
`;
const blocks = await Query.sql(sql);
return blocks.map(b => b.id);
```

### 其他工具函数

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

## fb2p （容器块传递）

> 🖋️ 本函数有一个 `redirect`​ 的别名。

fb2p （或者说引用关系转移）的目的是**处理容器块和段落块嵌套情况**，他会将**将容器块的第一个段落块 ID 重定向到容器块的 ID**。

📣 首先我们解释一下这个 API 的使用背景。现在假定有一个列表块，引用了另外的一个块

![image](../../assets/image-20241208222807-mvc3opc.png)

我们使用下面的 SQL 来查询被引用块的所有反链信息

```sql
select * from blocks where id in (
  select block_id from refs where def_block_id = '20241025224026-r416ywi'
) order by updated desc;
```

效果如下：

![image](../../assets/image-20241204123442-lceozz3.png)

令人意外的是，查询的结果只包含了引用的所在的段落，而不会像反链面板那样展示整个列表项块。

![image](../../assets/image-20241204123606-44328dv.png "反链面板展示的结果")

这里的原因在于，列表项块是一个容器类型（如图中标号 2 的黄色范围），他本身是不自带内容的。所以实际在思源底层，真正引用了目标的块是列表块的第一个段落块（如图中标号 1 的红色范围）—— 而之所以在反链面板当中会显示完整的列表项，是因为思源在反链面板里会做特殊的处理。

![image](../../assets/image-20241204123811-vla1xke.png)

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

![image](../../assets/image-20241204130225-vpgesgp.png)

fb2p 支持传递列表项、引述块两种容器。同时也支持传递到标题和文档块中。

* **标题**：如果段落块为某个标题块下方第一个子块，则会传递到上方的标题中
* **文档**：如果段落块为文档下方第一个子块，则会传递到文档块中

特别是后者，能帮助实现文档基本的引用，下图是一个案例。![image](../../assets/image-20241204130826-j6rwpyx.png)

✨ **特殊用法**：强制传递到文档。在 `fb2p`​ 中内置了一个特殊规则：当所在的段落中存在一个名为 `#DOCREF#`​ 或者 `#文档引用#`​ 的 tag 的时候，该块会被强制重定向到文档块。

## pruneBlocks（处理容器和子块）

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
let blocks = await Query.keyword('重要内容')
return blocks.pick('id');
```

![image](../../assets/image-20250308171816-crrru54.png)​

使用 pruneBlocks 处理之后:

```js
//!js
let blocks = await Query.keyword('重要内容');
blocks = await Query.pruneBlocks(blocks);
return blocks.pick('id');
```

效果如下，由于默认的策略是 leaf，所以仅仅保留了底层的段落块。

![image](../../assets/image-20250308172648-l0q3u5r.png)

而如果把策略改成 root，就只会保留顶部的列表块。

![image](../../assets/image-20250308172720-se43ute.png)

## 其他各类查询函数
