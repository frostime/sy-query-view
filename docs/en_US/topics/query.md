# Query API

## Using Query for SQL Queries

The simplest query using this plugin is as follows. Here:

* ​`Query`​ object is the API object exposed by the plugin.
* ​`Query.backlink`​ represents querying the backlinks of a specific document.
* ​`protyle.block.rootID`​ is the ID of the document where the embedded block is located.
* ​`blocks`​ is the list of blocks (`Block[]`​) obtained from the query.
* ​`block.pick('id')`​ represents extracting the `id`​ attribute of each block to form a new list, which is then returned to SiYuan.

So this code's function is: <u>Query all backlinks of the current document.</u>

```js
//!js
let blocks = await Query.backlink(protyle.block.rootID);
return blocks.pick('id'); // Special utility function, will be introduced later; equivalent to blocks.map(b => b.id);
```

> Note: The example uses top-level await, which requires SiYuan 3.8.0 or newer. On earlier versions, the await-related code must be wrapped in an async function, invoked at the end with `return query();`.

It's easy to see that since the code can automatically obtain the ID of the document where it is located via `protyle.block.rootID`​, it eliminates the need to manually modify the `root_id`​ field every time you write an embedded block. This allows you to write the code once and run it anywhere—a small advantage of JS queries.

​`Query.backlink`​ essentially wraps SiYuan's SQL queries (if you are not familiar with SiYuan's SQL queries, please read [https://ld246.com/article/1683355095671](https://ld246.com/article/1683355095671)). Similar functions include the following:

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

These functions can be accessed directly via `Query`​. The most general one is `Query.sql`​, which simply takes the SQL query statement as input.

> 🔔 **Note**: The above functions may not include all query APIs. To view the complete interface, please visit [https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts).

> 💡 **Note**: Unlike the basic usage primarily aimed at ordinary users, the following advanced usage assumes that users have basic JavaScript/TypeScript reading and coding skills.

The following introduces some advanced usage of Query queries.

🔔 Before diving into advanced usage, two points need to be clarified:

1. The methods in Query are stateless functions (of course, the objects returned by Query methods are not necessarily stateless, such as DataView, which is stateful).
2. The methods under Query have some aliases, including at least the full lowercase format of the original method.

    For example, you can call `Query.utils.asmap`​, which is equivalent to `Query.Utils.asMap`​.

## WrappedList & WrappedBlock

Although we briefly introduced the convenience of using `Query`​ for SQL queries in the basic usage section, the biggest advantage was not mentioned—all results obtained using the Query API **come with additional convenient tool methods or properties**.

The results obtained using Query queries are conceptually treated as a table structure, with each element representing a SiYuan Block.

```ts
[
  {'id': 'ID-111', 'type': 'd', created: '20230401001000'},
  {'id': 'ID-hhh', 'type': 'd', created: '...'},
  {'id': 'ID-kkk', 'type': 'b', created: '...'},
]
```

![image](../../assets/image-20230506013450-g2mkp8l.png)

To facilitate operations on this table data:

* Each element in the table query list is wrapped into an `IWrappedBlock`​ object, providing common operations related to the block element.
* The table query list itself is wrapped into an `IWrappedList`​ object, allowing for quick completion of some operations on the "table data structure."

### IWrappedBlock

All objects in the list returned by `Query`​ API queries are wrapped into an `IWrappedBlock`​. You can think of it as a regular `Block`​ object but with additional properties and methods:

```ts
// Not necessarily complete, for the complete API documentation, refer to repo/public/types.d.ts
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

All properties can be grouped into several categories:

1. Rendering as links or references, i.e., `aslink`​, `asref`​ (however, since rendering as a reference does not actually create a relationship in the ref table, most of the time using link is sufficient, and ref is not very meaningful).
2. ​`asial`​: The ial list of the block itself is a string field. Using this method, the ial can be parsed into an object of type `{ [key: string]: string}`​
3. Timestamp-related: Additional properties are extended for updated, created, etc., to facilitate direct display of block timestamps.
4. ​`attr`​ function:

    * Takes a block and block attribute and the return will be rendered as suitable markdown text (as mentioned in the table section earlier).
    * You can also pass a custom renderer and return a markdown text. If no return or return null, the default rendering scheme is used.
5. ​`custom-xxx`​ properties: Directly access the block's custom attributes, e.g., `block['custom-b']`​, which accesses the `custom-b`​ attribute of the corresponding block.

You can try the following code, and get to know there differences.

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

> 🔔 The above introduction may not be complete; for the complete API documentation, refer to `repo/public/types.d.ts`​.

### IWrappedList

All result lists returned by `Query`​ API queries are `IWrappedList`​ objects. You can think of it as a regular `Array<T>`​ but with additional methods.

🔔 IWrappedList is stateless; all APIs return a modified copy rather than performing in-place modifications.

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

The additional methods in IWrappedList can be grouped into these categories:

* ​`unwrapped`​/`unwrap()`​: Used to return the original list object.
* Overrides some common Array methods for "returning new lists," ensuring the return value is still an `IWrappedList`​.

  * ​`filter`​
  * ​`slice`​
  * ​`map`​
* Some commonly used function methods in query code:

  * ​`pick`​: Retains specific fields in each block of the list. For example, `blocks.pick('id')`​ returns a list of block IDs, and `blocks.pick('id', 'content')`​ returns a list of `{id: string, content: string}[]`​; equivalent to retaining specific data columns in the table structure.
  * ​`omit`​: Similar to `pick`​, but the keys passed in are discarded rather than retained; equivalent to discarding specific data columns in the table structure.
  * ​`sorton`​: Specifies the key to sort by and returns the sorted list.
  * ​`groupby`​: Groups the list, with two parameters:

    * The first parameter `predicate`​:

      * Can be a Block key name, e.g., `blocks.groupby('box')`​ groups by notebook ID (`box`​).
      * Can also be a function returning scalar data, e.g., `blocks.groupby(b => b.created.slice(0, 4))`​.
    * The second parameter `forEach`​ can be used to iterate over the grouped results, with parameters `groupName`​ and `groupedBlocks`​.
  * ​`unique`​: Performs deduplication on the list. The parameter can be:

    * A Block key name, e.g., `blocks.unique('root_id')`​ means only one block per document (`root_id`​).
    * A function returning scalar data, used as the comparison value for deduplication.
  * ​`addrow`​: Essentially the `Array.concat`​ function, passing in an external list to merge into a new `WrappedList`​.
  * ​`addcol`​: Passes in external data to add specific columns to the external structure, e.g.:

    * ​`list.addcol({ col1: 1, col2: 2 })`​
    * ​`list.addcol({ col1: [1, 2], col2: [4, 5] })`​
    * ​`list.addcol([{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }])`​
    * ​`list.addcol((b, i) => ({ col1: i, col2: i * i }))`​
  * ​`asmap`​: Essentially calls reduce to convert the list into a `Record<keyof Block, Block>`​.

    * For example, `list.asmap()`​ defaults to returning a `Record<Block['id'], Block>`​ structure.

> 🔔 The above introduction may not be complete; for the complete API documentation, refer to repo/public/types.d.ts.

## Query.Utils

Query.Utils contains some potentially useful utility functions.

> 🙂 Every function inside `Query.Utils`​ is sync function, no need to await
>
> ​`Query.Utils`​ has an lowercase alias `Query.utils`​

### Time-related Utility Functions

The most useful utility functions in utils are probably those related to time, with the most important being this API:

```ts
Query.Utils.Date: (value?: any) => SiYuanDate;
```

Calling Date returns a SiYuanDate object, which is essentially a JavaScript Date class but specifically designed for SiYuan:

```ts
declare class SiYuanDate extends Date {
    // Returns the time at the beginning of the day
    beginOfDay(): SiYuanDate;
    // Formats to yyyyMMddHHmmss
    toString(hms?: boolean): string;
    [Symbol.toPrimitive](hint: string): any;
    static fromString(timestr: string): SiYuanDate;
    // Calculates days, days can be a number (indicating days) or a string
    // e.g., '1d' means 1 day, '2w' means 2 weeks, '3m' means 3 months, '4y' means 4 years
    add(days: number | string): SiYuanDate;
}
```

When formatting to a string, SiYuanDate converts to the same format as `created`​ and `updated`​; and you can use the `add`​ method to calculate dates.

You can format to a string in two ways: one is direct string interpolation `${date}`​, and the other is calling the `toString()`​ method. The latter has an `hms`​ parameter; if set to false, it will only output the date part and omit the hours, minutes, and seconds.

```js
//!js
let dv = Query.DataView(protyle, item, top);
let date = Query.Utils.Date(); // now
dv.addmd(`
Now ${date}
Start of this day: ${date.beginOfDay()}
10 days later: ${date.beginOfDay().add(10)}
1 week later: ${date.beginOfDay().add('1w')}
1 month ago: ${date.add('-1m')}

\`\`\`sql
select * from blocks where created like '${date.add(-7).toString(false)}%'
\`\`\`

`);
dv.render();
```

![image](../../assets/image-20241204112906-ih3lqzu.png)

Of course, if you're too lazy to instantiate a Date object every time, there are also some shortcut functions in utils.

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

Using these functions, you can quickly insert the time components you want into SQL statements.

```js
//!js
const sql = `select * from blocks
where updated >= '${Query.Utils.thisWeek()}'
limit 5
`;
const blocks = await Query.sql(sql);
return blocks.map(b => b.id);
```

### Other Utility Functions

Other utility functions are not as practical, and their usefulness may be limited.

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

* ​`notebook`​ and `boxName`​ are mainly used to get the name of the notebook, as the box field obtained via SQL is just the notebook's ID, and `notebook`​ can get the complete notebook object, while `boxname`​ returns the notebook's name.

  * 🤔 I don't know why SiYuan has both "notebook" and "box" terms; adapt as needed.
* ​`typeName`​ inputs a `type`​ field from SiYuan SQL query results and returns its readable name.
* ​`renderAttr`​ is essentially the default rendering function used by the table component.
* ​`openBlock`​ is a special method; passing a block's ID opens the corresponding block in SiYuan.
* ​`asMap`​ is equivalent to the `asmap`​ function of `IWrappedList`​.
* ​`asLink`​ and `asRef`​ are essentially equivalent to calling these properties of `IWrappedBlock`​.

## fb2p (Container Block Redirection)

> 🖋️ This function has an alias `redirect`​.

The purpose of fb2p (or reference relationship redirection) is to **handle nested container blocks and paragraph blocks**. It **redirects the first paragraph block ID of a container block to the container block's ID**.

📣 First, let's explain the background of this API. Suppose there is a list block that references another block:

![image](../../assets/image-20241208222807-mvc3opc.png)

We use the following SQL to query all backlinks of the referenced block:

```sql
select * from blocks where id in (
  select block_id from refs where def_block_id = '20241025224026-r416ywi'
) order by updated desc;
```

The result is as follows:

![image](../../assets/image-20241204123442-lceozz3.png)

Surprisingly, the result only includes the paragraph where the reference is located, and does not display the entire list item block as the backlink panel does.

![image](../../assets/image-20241204123606-44328dv.png "Backlink panel display result")

The reason for this is that the list item block is a container type (as shown by the yellow range in the figure), and it does not have its own content. So, in the underlying SiYuan, the actual block that references the target is the first paragraph block of the list block (as shown by the red range in the figure)—the reason the backlink panel displays the entire list item is that SiYuan does special processing in the backlink panel.

![image](../../assets/image-20241204123811-vla1xke.png)

This is where `fb2p`​ comes into play: its concept is that **if the first child block of a container block is a paragraph block, then this paragraph block should represent the entire container block**.

Therefore, we can pass a Block list to `fb2p`​, and it will complete the redirection, changing the block's ID to its parent container block's ID (first block to its parent).

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

The comparison of the two effects is as follows:

![image](../../assets/image-20241204130225-vpgesgp.png)

fb2p supports redirection for list items and blockquotes. It also supports redirection to heading and document blocks.

* **Heading**: If the paragraph block is the first child block under a heading block, it will redirect to the heading.
* **Document**: If the paragraph block is the first child block under a document, it will redirect to the document block.

Especially the latter can help achieve basic document references. The following is an example:

![image](../../assets/image-20241204130826-j6rwpyx.png)

✨ **Special Usage**: Force redirection to the document. `fb2p`​ has a built-in rule: when the paragraph contains a tag named `#DOCREF#`​ or `#文档引用#`​, the block will be forcibly redirected to the document block.

## pruneBlocks (Handling Containers and Child Blocks)

​`pruneBlocks`​ is used to filter blocks in SQL search scenarios to eliminate redundant blocks.

> 🖋️ Aliases: `prune`​, `mergeBlocks`​, `merge`​

```js
pruneBlocks(blocks: Block[], keep: 'leaf' | 'root' = 'leaf', advanced: boolean = false)
```

Blocks in SiYuan Notes have nested structures (e.g., a list, list item, and internal paragraph are three distinct blocks). When searching for keywords within nested text, this may return multiple redundant blocks. This function addresses this issue by merging parent-child related blocks according to specified strategies.

**Parameters:**

* ​`blocks`​: Input block list
* ​`keep`​: Cleanup and merge strategy:

  * ​`leaf`​: Merge parent-child blocks into the deepest leaf node. For example, when multiple list items are found, keeps the deepest paragraph block while removing upper list item blocks.
  * ​`root`​: Merge parent-child blocks into the topmost root node. For example, when multiple list items are found, keeps the topmost list block while removing deeper paragraph blocks.
* ​`advanced`​: Whether to enable advanced cleanup:

  * ​`false`​: Default strategy - only uses the `parent_id`​ attributes of input blocks for merging.
  * ​`true`​: Additionally queries block breadcrumbs to obtain complete hierarchy. This more aggressive merging requires additional query overhead.

**Example:**

Given a list block:

```js
1. 重要内容 A
2. 重要内容 B
```

A keyword search for "重要内容" may return duplicates: paragraph block (leaf) → list item block → list block (root).

Without pruning:

```js
//!js
let blocks = await Query.keyword('重要内容')
return blocks.pick('id');
```

![image](../../assets/image-20250308171816-crrru54.png)

Using `pruneBlocks`​ (default leaf strategy):

```js
//!js
let blocks = await Query.keyword('重要内容');
blocks = await Query.pruneBlocks(blocks);
return blocks.pick('id');
```

Result: Only leaf paragraph blocks remain.
​![image](../../assets/image-20250308172648-l0q3u5r.png)

Using root strategy:

```js
pruneBlocks(blocks, 'root')
```

Result: Only root list blocks remain.
​![image](../../assets/image-20250308172720-se43ute.png)
