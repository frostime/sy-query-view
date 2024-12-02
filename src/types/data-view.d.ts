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
    renderer?: (b: Block, attr: keyof Block) => string | number | undefined | null; //仅对BlockTable有效
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