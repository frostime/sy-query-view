/**
 * List Options
 * @interface IListOptions
 * @property {string} type - List type: 'u' for unordered, 'o' for ordered
 * @property {number} columns - Number of columns to display
 * @property {(b: T) => string | number | undefined | null} renderer - Custom function to render each list item; if not provided or return null, the default renderer will be used
 */
interface IListOptions<T> {
    type?: 'u' | 'o';
    columns?: number;
    renderer?: (b: T) => string | number | undefined | null;
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
    renderer?: (b: Block, attr: keyof Block) => string | number | undefined | null;
}

interface IHasChildren<T> {
    children?: IHasChildren<T>[];
}

interface ITreeNode extends IHasChildren<ITreeNode> {
    id?: string;
    name: string;
    content?: string;
    children?: ITreeNode[];
    [key: string]: any;  // 允许其他自定义属性
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

interface IGraphNode {
    id: string;
    name?: string;
    content?: string;
    value?: number;      // 可用于控制节点大小或其他属性
    category?: number;   // 可用于节点分组
    [key: string]: any;  // 允许其他自定义属性
}

interface IGraphLink {
    source: string;      // 源节点ID
    target: string;      // 目标节点ID
    value?: number;      // 用于控制连线粗细或其他属性
    label?: {            // 连线标签
        show?: boolean;
        formatter?: string;
    };
    lineStyle?: {
        color?: string;
        width?: number;
    };
    [key: string]: any;  // 允许其他自定义属性
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

    effect: (effect: (newValue: T, oldValue: T) => void) => void;
    derived: (derive: (value: T) => T) => () => T;
}
