/**
 * List Options
 * @interface IListOptions
 * @property {string} type - List type: 'u' for unordered, 'o' for ordered
 * @property {number} columns - Number of columns to display
 * @property {(b: T, defaultRenderer?: (b: T) => string) => string | number | undefined | null} renderer - Custom function to render each list item; if not provided or return null, the default renderer will be used; The second parameter is the default renderer, you can call it to get the default rendering result
 */
interface IListOptions<T> {
    type?: 'u' | 'o';
    columns?: number;
    renderer?: (b: T, defaultRenderer?: (b: T) => string) => string | number | undefined | null;
}

/**
 * Table Options
 * @interface ITableOptions
 * @property {boolean} center - Center align table contents
 * @property {boolean} fullwidth - Make table full width
 * @property {boolean} index - Show row indices
 * @property {(b: Block, attr: keyof Block) => string | number | undefined | null} renderer - Custom function to render each table cell; it is only effective when the table is a BlockTable; if not provided or return null, the default renderer will be used
 */
interface ITableOptions {
    center?: boolean;
    fullwidth?: boolean;
    index?: boolean;
    cols?: (string | Record<string, string>)[] | Record<string, string>;
    renderer?: (b: Block, attr: keyof Block) => string | undefined | null;
}

interface IHasChildren<T> {
    children?: IHasChildren<T>[];
}

interface ITreeNode extends IHasChildren<ITreeNode> {
    name: string;
    children?: ITreeNode[];
    [key: string]: any;
}

/**
 * Extends the block, enable children property
 * Block has id, name and content properties, so it is also a tree node
 * @interface IBlockWithChilds
 * @extends Block
 * @extends IHasChildren
 * @extends ITreeNode
 */
interface IBlockWithChilds extends Block, IHasChildren<Block>, ITreeNode {
    id: string;
    name: string;
    content: string;
    children?: IBlockWithChilds[];
}

/**
 * Is actually the nodes type of Echart { type: 'graph' }
 * @link https://echarts.apache.org/zh/option.html#series-graph.data
 */
interface IGraphNode {
    id: string;
    name?: string;
    value?: string;
    category?: number;
    [key: string]: any;
}

/**
 * Minimum link data structure for Echarts
 * @link https://echarts.apache.org/zh/option.html#series-graph.links
 * @property {string} source - Source node ID
 * @property {string | string[]} target - Target node ID
 *  NOT THAT, you can pass an array, which is more flexible than the original Echarts option
 * @property {[key: string]: any} [key: string] - Allow other custom properties in link
 */
interface IGraphLink {
    source: string;
    target: string | string[];
    [key: string]: any;
}

interface IEchartsSeriesOption {
    [key: string]: any;
}

interface IEchartsOption {
    [key: string]: any;
    series?: IEchartsSeriesOption[];
}

/**
 * Implemented by class DataView
 */
interface IDataView {
    render: () => void;
}

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


/**
 * State object
 * @interface IState
 * @template T
 * @property {() => T} - Get the state value
 * @property {(value: T) => T} - Set the state value
 * @property {T} - The state value, can be set or get
 * @property {(effect: (newValue: T, oldValue: T) => void) => void} - Register an effect to the state
 * @property {(derive: (value: T) => T) => () => T} - Create a derived state
 */
interface IState<T> {
    (): T;
    (value: T): T;

    value: T;

    /**
     * @warn
     * The effect function is not supposed to return anything!
     * It is merely a callback function when setter is called, don't treat it powerful as in React or etc.
     */
    effect: (effect: (newValue: T, oldValue: T) => void) => void;
    derived: (derive: (value: T) => T) => () => T;
}
