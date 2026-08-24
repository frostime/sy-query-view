# Wrapped Reference (auto-generated from src/core/proxy.ts)

> Wrapped lists and wrapped blocks returned by the query/component APIs, plus their data-processing methods. Do not edit by hand.

## IWrappedList<T = Block> (extends extends Array<T>)

```ts
export interface IWrappedList<T = Block> extends Array<T> { /** Method to return the original array */ unwrap(): T[]; /** Original array */ unwrapped: T[]; /** * Converts the array to a map object, where the key is specified by the key parameter. * Equivalent to calling `array.reduce((acc, cur) => ({...acc, [cur[key]]: cur }), {})` * @param key * @returns */ asMap: (key: string) => Record<string, Block>; /** * Returns a new array containing only specified properties * @param attrs - Property names to keep */ pick(...attrs: (keyof T)[]): IWrappedList<Partial<T>>; /** * Returns a new array excluding specified properties * @param attrs - Property names to exclude */ omit(...attrs: (keyof T)[]): IWrappedList<T>; /** * Returns a new array sorted by specified property * @param attr - Property to sort by * @param order - Sort direction, defaults to 'asc' */ sorton(attr: keyof T, order?: 'asc' | 'desc'): IWrappedList<T>; /** * Returns an object grouped by specified condition * @param predicate - Grouping criteria, can be property name or function * @param fnEach - Optional callback function for each group */ groupby( predicate: keyof T | ((item: T) => any), fnEach?: (groupName: any, list: T[]) => unknown ): Record<string, IWrappedList<T>>; /** * Returns a filtered new array, ensuring it's also an IWrappedList * @param predicate - Filter condition function */ filter(predicate: (value: T, index: number, array: T[]) => boolean): IWrappedList<T>; /** * Returns a new array containing elements in the specified range * @param start - Start index * @param end - End index */ slice(start: number, end: number): IWrappedList<T>; /** * Returns a new array with unique elements * @param {keyof Block | Function} key - Unique criteria, can be property name or function * @example * list.unique('id') * list.unique(b => b.updated.slice(0, 4)) */ unique(key?: keyof Block | ((b: Block) => string | number)): IWrappedList<IWrappedBlock>; /** * Returns a new array with added rows * @alias addrows * @alias concat: modify the default method of Array */ addrow(newItems: T[]): IWrappedList<T>; /** * Returns a new array with added columns * @param {Record<string, ScalarValue | ScalarValue[]> | Record<string, ScalarValue>[] | Function} newItems - New columns to add * @alias addcols * @alias stack * @example * list.addcol({ col1: 1, col2: 2 }) // Add two columns, each with repeated elements * list.addcol({ col1: [1, 2], col2: [4, 5] }) // Add two columns * list.addcol([{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }]) // Add two columns, each item in list corresponds to a row * list.addcol((b, i) => ({ col1: i, col2: i * i })) // Add two columns, each with elements generated based on index */ addcol(newItems: Record<string, ScalarValue | ScalarValue[]> | Record<string, ScalarValue>[] | ((b: T, index: number) => Record<string, ScalarValue> | Record<string, ScalarValue[]>)): IWrappedList<T>; }
```

---

### list.unwrap()

```ts
unwrap(): T[];
```

Method to return the original array

**Source** `src/core/proxy.ts:57`

---

### list.pick(attrs)

```ts
pick(...attrs: (keyof T)[]): IWrappedList<Partial<T>>;
```

Returns a new array containing only specified properties

**Params**

- `attrs` — Property names to keep

> ⚠ **Return type differs for single vs multiple attrs** (not reflected in the declaration): `pick('id')` returns a scalar array; `pick('id','content')` returns an object array

**Source** `src/core/proxy.ts:74`

---

### list.omit(attrs)

```ts
omit(...attrs: (keyof T)[]): IWrappedList<T>;
```

Returns a new array excluding specified properties

**Params**

- `attrs` — Property names to exclude

**Source** `src/core/proxy.ts:80`

---

### list.sorton(attr, order?)

```ts
sorton(attr: keyof T, order?: 'asc' | 'desc'): IWrappedList<T>;
```

Returns a new array sorted by specified property

**Params**

- `attr` — Property to sort by
- `order` — Sort direction, defaults to 'asc'

**Source** `src/core/proxy.ts:87`

---

### list.groupby(predicate, fnEach?)

```ts
groupby( predicate: keyof T | ((item: T) => any), fnEach?: (groupName: any, list: T[]) => unknown ): Record<string, IWrappedList<T>>;
```

Returns an object grouped by specified condition

**Params**

- `predicate` — Grouping criteria, can be property name or function
- `fnEach` — Optional callback function for each group

**Source** `src/core/proxy.ts:94`

---

### list.filter(predicate)

```ts
filter(predicate: (value: T, index: number, array: T[]) => boolean): IWrappedList<T>;
```

Returns a filtered new array, ensuring it's also an IWrappedList

**Params**

- `predicate` — Filter condition function

**Source** `src/core/proxy.ts:103`

---

### list.slice(start, end)

```ts
slice(start: number, end: number): IWrappedList<T>;
```

Returns a new array containing elements in the specified range

**Params**

- `start` — Start index
- `end` — End index

**Source** `src/core/proxy.ts:109`

---

### list.unique(key?)

```ts
unique(key?: keyof Block | ((b: Block) => string | number)): IWrappedList<IWrappedBlock>;
```

Returns a new array with unique elements

**Params**

- `key` — Unique criteria, can be property name or function

**Example**

```ts
list.unique('id')
list.unique(b => b.updated.slice(0, 4))
```

**Source** `src/core/proxy.ts:117`

---

### list.addrow(newItems)

```ts
addrow(newItems: T[]): IWrappedList<T>;
```

Returns a new array with added rows

**Available names** (3, expanded from register()/addAlias() call sites): `addrow` · `addrows` · `concat: modify the default method of Array`

**Source** `src/core/proxy.ts:123`

---

### list.addcol(newItems)

```ts
addcol(newItems: Record<string, ScalarValue | ScalarValue[]> | Record<string, ScalarValue>[] | ((b: T, index: number) => Record<string, ScalarValue> | Record<string, ScalarValue[]>)): IWrappedList<T>;
```

Returns a new array with added columns

**Params**

- `newItems` — New columns to add

**Example**

```ts
list.addcol({ col1: 1, col2: 2 }) // Add two columns, each with repeated elements
list.addcol({ col1: [1, 2], col2: [4, 5] }) // Add two columns
list.addcol([{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }]) // Add two columns, each item in list corresponds to a row
list.addcol((b, i) => ({ col1: i, col2: i * i })) // Add two columns, each with elements generated based on index
```

**Available names** (3, expanded from register()/addAlias() call sites): `addcol` · `addcols` · `stack`

**Source** `src/core/proxy.ts:136`

---

### list.unwrapped()

```ts
unwrapped: T[];
```

Original array

**Source** `src/core/proxy.ts:60`

---

### list.asMap()

```ts
asMap: (key: string) => Record<string, Block>;
```

Converts the array to a map object, where the key is specified by the key parameter.
Equivalent to calling `array.reduce((acc, cur) => ({...acc, [cur[key]]: cur }), {})`

**Params**

- `key` — 

**Returns**: 

**Source** `src/core/proxy.ts:68`

---

## IWrappedBlock (extends extends Block)

```ts
export interface IWrappedBlock extends Block { /** Method to return the original Block object */ unwrap(): Block; /** Original Block object */ unwrapped: Block; /** Block's URI link in format: siyuan://blocks/xxx */ asurl: string; /** Block's Markdown format link [content](siyuan://blocks/xxx) */ aslink: string; /** Block's SiYuan reference format text */ asref: string; /** Blocks's ial list, as object * @example * let icon = block.asial['icon']; */ asial: Record<string, string>; /** * Returns a rendered SiYuan attribute * @param attr - Attribute name * @param renderer - Custom render function, uses default rendering when returns null * @returns {string} Rendered attribute value * @example * block.attr('box') // Returns the name of the notebook * block.attr('root_id') // Returns the block link of the document */ attr(attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string | null): string; /** Update date in YYYY-MM-DD format */ updatedDate: string; /** Creation date in YYYY-MM-DD format */ createdDate: string; /** Update time in HH:mm:ss format */ updatedTime: string; /** Creation time in HH:mm:ss format */ createdTime: string; /** Update datetime in YYYY-MM-DD HH:mm:ss format */ updatedDatetime: string; /** Creation datetime in YYYY-MM-DD HH:mm:ss format */ createdDatetime: string; /** Get custom attribute value */ [key: `custom-${string}`]: string; }
```

---

### list.unwrap()

```ts
unwrap(): Block;
```

Method to return the original Block object

**Source** `src/core/proxy.ts:6`

---

### list.attr(attr, renderer?)

```ts
attr(attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string | null): string;
```

Returns a rendered SiYuan attribute

**Params**

- `attr` — Attribute name
- `renderer` — Custom render function, uses default rendering when returns null

**Returns**: Rendered attribute value

**Example**

```ts
block.attr('box') // Returns the name of the notebook
block.attr('root_id') // Returns the block link of the document
```

**Source** `src/core/proxy.ts:35`

---

### list.unwrapped()

```ts
unwrapped: Block;
```

Original Block object

**Source** `src/core/proxy.ts:9`

---

### list.asurl()

```ts
asurl: string;
```

Block's URI link in format: siyuan://blocks/xxx

**Source** `src/core/proxy.ts:12`

---

### list.aslink()

```ts
aslink: string;
```

Block's Markdown format link [content](siyuan://blocks/xxx)

**Source** `src/core/proxy.ts:15`

---

### list.asref()

```ts
asref: string;
```

Block's SiYuan reference format text

**Source** `src/core/proxy.ts:18`

---

### list.asial()

```ts
asial: Record<string, string>;
```

Blocks's ial list, as object

**Example**

```ts
let icon = block.asial['icon'];
```

**Source** `src/core/proxy.ts:24`

---

### list.updatedDate()

```ts
updatedDate: string;
```

Update date in YYYY-MM-DD format

**Source** `src/core/proxy.ts:38`

---

### list.createdDate()

```ts
createdDate: string;
```

Creation date in YYYY-MM-DD format

**Source** `src/core/proxy.ts:40`

---

### list.updatedTime()

```ts
updatedTime: string;
```

Update time in HH:mm:ss format

**Source** `src/core/proxy.ts:42`

---

### list.createdTime()

```ts
createdTime: string;
```

Creation time in HH:mm:ss format

**Source** `src/core/proxy.ts:44`

---

### list.updatedDatetime()

```ts
updatedDatetime: string;
```

Update datetime in YYYY-MM-DD HH:mm:ss format

**Source** `src/core/proxy.ts:46`

---

### list.createdDatetime()

```ts
createdDatetime: string;
```

Creation datetime in YYYY-MM-DD HH:mm:ss format

**Source** `src/core/proxy.ts:48`

---

