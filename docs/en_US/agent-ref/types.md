# Types Reference (auto-generated from src/types/data-view.d.ts)

> Interface definitions needed when constructing DataView component options. Do not edit by hand.

## IListOptions

List Options

```ts
interface IListOptions<T> { type?: 'u' | 'o'; columns?: number; renderer?: (b: T, defaultRenderer?: (b: T) => string) => string | number | undefined | null; }
```

---

## IHasChildren

```ts
interface IHasChildren<T> { children?: IHasChildren<T>[]; }
```

---

## ITreeNode

```ts
interface ITreeNode extends IHasChildren<ITreeNode> { name: string; children?: ITreeNode[]; [key: string]: any; }
```

---

## IBlockWithChilds

Extends the block, enable children property
Block has id, name and content properties, so it is also a tree node

```ts
interface IBlockWithChilds extends Block, IHasChildren<Block>, ITreeNode { id: string; name: string; content: string; children?: IBlockWithChilds[]; }
```

---

## IGraphNode

Is actually the nodes type of Echart { type: 'graph' }

```ts
interface IGraphNode { id: string; name?: string; value?: string; category?: number; [key: string]: any; }
```

---

## IGraphLink

Minimum link data structure for Echarts

```ts
interface IGraphLink { source: string; target: string | string[]; [key: string]: any; }
```

---

## IEchartsSeriesOption

```ts
interface IEchartsSeriesOption { [key: string]: any; }
```

---

## IEchartsOption

```ts
interface IEchartsOption { [key: string]: any; series?: IEchartsSeriesOption[]; }
```

---

## ICustomView

User customized view. If registered, you can use it inside DataView by `dv.xxx()` or `dv.addxxx()`

```ts
interface ICustomView { /** * Use the custom view * @param dv - DataView instance (declared as `any` for declaration simplicity; at runtime it is a DataView instance), might be empty while validating process */ use: (dv?: any) => { render: (container: HTMLElement, ...args: any[]) => void | string | HTMLElement; //Create the user custom view. dispose?: () => void; // Unmount hook for the user custom view. }, alias?: string[]; // Alias name for the custom view }
```

---

## IUserCustom

```ts
interface IUserCustom { [key: string]: ICustomView; }
```

---

## IState

State object

```ts
interface IState<T> { (): T; (value: T): T; value: T; /** * @warn * The effect function is not supposed to return anything! * It is merely a callback function when setter is called, don't treat it powerful as in React or etc. */ effect: (effect: (newValue: T, oldValue: T) => void) => void; derived: (derive: (value: T) => T) => () => T; }
```

---

