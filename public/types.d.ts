declare module 'siyuan' {
    interface IProtyle {
        [key: string]: any;
    }

}

import { IProtyle } from "siyuan";
declare const Query: {
    /**
     * Creates a new DataView instance for rendering data visualizations
     * @param protyle - Protyle instance
     * @param item - HTML element to render into
     * @param top - Top position for rendering
     * @returns DataView instance
     */
    DataView: (protyle: IProtyle, item: HTMLElement, top: number | null) => DataView;
    Utils: {
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
         * Gets the timestamp for the start of next week
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextWeek: (hms?: boolean) => string;
        /**
         * Gets the timestamp for the start of current month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisMonth: (hms?: boolean) => string;
        /**
         * Gets the timestamp for the start of next month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextMonth: (hms?: boolean) => string;
        /**
         * Gets the timestamp for the start of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisYear: (hms?: boolean) => string;
        /**
         * Gets the timestamp for the end of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextYear: (hms?: boolean) => string;
        /**
         * Gets timestamp for current time with optional day offset
         * @param days - Number of days to offset (positive or negative)
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        now: (days?: number, hms?: boolean) => string;
        /**
         * Converts a block to a SiYuan link format
         * @param b - Block to convert
         * @returns String in markdown link format
         */
        asLink: (b: Block) => string;
        /**
         * Converts a block to a SiYuan reference format
         * @param b - Block to convert
         * @returns String in reference format ((id 'content'))
         */
        asRef: (b: Block) => string;
        /**
         * Converts SiYuan timestamp string to Date object
         * @param timestr - SiYuan timestamp (yyyyMMddHHmmss)
         * @returns Date object
         */
        asDate: (timestr: string) => Date;
        /**
         * Converts Date object to SiYuan timestamp format
         * @param date - Date to convert
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        asTimestr: (date: Date) => string;
        /**
         * Gets notebook information from block or notebook ID
         * @param input - Block object or notebook ID
         * @returns Notebook information
         */
        notebook: (input: Block | NotebookId) => Notebook;
        /**
         * Gets the name of a notebook by its ID; equivalent to `notebook(boxid).name`
         * @param boxid - Notebook ID
         * @returns Notebook name
         */
        boxname: (boxid: NotebookId) => string;
        /**
         * Renders the value of a block attribute as markdown format
         */
        renderAttr: (b: Block, attr: keyof Block, options?: {
            onlyDate?: boolean;
            onlyTime?: boolean;
        }) => string;
        openBlock: (id: BlockId) => void;
    };
    /**
     * Wraps blocks with additional functionality
     * @param blocks - Blocks to wrap
     * @returns Wrapped block(s)
     */
    wrapBlocks: (blocks: Block[] | Block) => IWrappedBlock | IWrappedList<IWrappedBlock>;
    /**
     * Gets blocks by their IDs
     * @param ids - Block IDs to retrieve
     * @returns Array of wrapped blocks
     */
    getBlocksByIds: (...ids: BlockId[]) => Promise<IWrappedBlock[]>;
    /**
     * Gets the current document's ID
     * @param protyle - Protyle instance
     * @returns Document ID
     */
    docid: (protyle: IProtyle) => string;
    /**
     * Gets the current document as a block
     * @param protyle - Protyle instance
     * @returns Wrapped document block
     */
    thisdoc: (protyle: IProtyle) => Promise<IWrappedBlock>;
    /**
     * Executes SQL query and optionally wraps results
     * @param fmt - SQL query string
     * @param wrap - Whether to wrap results
     * @returns Query results
     */
    sql: (fmt: string, wrap?: boolean) => Promise<any[]>;
    /**
     * Finds backlinks to a specific block
     * @param id - Block ID to find backlinks for
     * @param limit - Maximum number of results
     * @returns Array of blocks linking to the specified block
     */
    backlink: (id: BlockId, limit?: number) => Promise<any[]>;
    /**
     * Finds blocks with specific attributes
     * @param name - Attribute name
     * @param val - Attribute value
     * @param valMatch - Match type ('=' or 'like')
     * @param limit - Maximum number of results
     * @returns Array of matching blocks
     */
    attr: (name: string, val?: string, valMatch?: "=" | "like", limit?: number) => Promise<any[]>;
    /**
     * Gets child documents of a block
     * @param b - Parent block or block ID
     * @returns Array of child document blocks
     */
    childdoc: (b: BlockId | Block) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Redirects first block IDs to their parent containers
     * @param inputs - Array of blocks or block IDs
     * @param enable - Configuration for heading and doc processing
     * @param enable.heading - Whether to process heading blocks
     * @param enable.doc - Whether to process document blocks
     * @returns Processed blocks or block IDs
     */
    fb2p: (inputs: Block[], enable?: {
        heading?: boolean;
        doc?: boolean;
    }) => Promise<IWrappedList<IWrappedBlock>>;
};

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
 * DataView class for creating and managing dynamic data visualizations
 * Provides various methods for rendering data in different formats including:
 * - Lists
 * - Tables
 * - Charts (Line, Bar, Tree, Graph)
 * - Markdown content
 * - Block embeddings
 * - Mermaid diagrams
 */
export declare class DataView implements IDataView {
    /**
     * 注册组件 View
     * @param method: `(...args: any[]) => HTMLElement`, 一个返回 HTMLElement 的方法
     * @param options: 其他配置
     *  - aliases: 组件的别名
     */
    register(method: (...args: any[]) => HTMLElement, options?: {
        name?: string;
        aliases?: string[];
    }): void;
    constructor(protyle: IProtyle, embedNode: HTMLElement, top: number | null);
    get element(): HTMLElement;
    dispose(): void;
    /**
     * Register a disposer function to be called when the DataView is disposed.
     * Only when you need to add some extra cleanup logic, you should use this method.
     * @param dispose The dispose function
     */
    addDisposer(dispose: () => void): void;
    adddisposer: (dispose: () => void) => void;
    /**
     * Add a custom element to the DataView.
     * @param customEle
     * @returns
     */
    addElement(customEle: HTMLElement | string): HTMLElement;
    addelement: (customEle: HTMLElement | string) => HTMLElement;
    addele: (customEle: HTMLElement | string) => HTMLElement;
    /**
     * Adds markdown content to the DataView
     * @param md - Markdown text to be rendered
     * @returns HTMLElement containing the rendered markdown
     * @example
     * dv.addmd(`# Hello`);
     */
    markdown(md: string): HTMLElement;
    details(summary: string, content: string | HTMLElement): HTMLDetailsElement;
    /**
     * Creates a markdown list view for displaying blocks
     * @param data - Array of blocks to display in the list, see {@link IBlockWithChilds}
     *              Can also be scalar values, or block with children property
     * @param options - Configuration options, see {@link IListOptions}
     * @param options.renderer - Custom function to render list items, the return will be used as markdown code
     * @returns HTMLElement containing the list
     * @example
     * const children = await Query.childdoc(block);
     * dv.addlist(children, { type: 'o' });
     */
    list(data: (IBlockWithChilds | ScalarValue)[], options?: IListOptions<Block>): HTMLElement;
    /**
     * Creates a markdown table view for displaying blocks
     * @param blocks - Array of Block objects to display
     * @param options - Configuration options, see {@link ITableOptions}
     * @param options.cols - Array of Block properties to show as columns;
     *     - if `undefined`, the default columns `['type', 'content', 'hpath', 'box']` will be used;
     *       but if the blocks don't have these properties, all properties of the first block will be used;
     *     - Can also be:
     *       - Record<string, string> to specify the column name, like `{type: 'Type', content: 'Content', 'root_id': 'Document'}`
     *       - Mixed array, like `['type', {content: 'Content'}, 'hpath']`
     *       - `null`, in this case, all columns will be shown
     * @param options.renderer - Custom function to render table cells, the return will be used as markdown code
     * @returns HTMLElement containing the block table
     * @example
     * const children = await Query.childdoc(block);
     * dv.addtable(children, { cols: ['type', 'content'] , fullwidth: true });
     */
    table(blocks: Block[], options?: ITableOptions & {
        cols?: (string | Record<string, string>)[] | Record<string, string>;
    }): HTMLElement;
    /**
     * Arranges elements in columns
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between columns; default is '5px'
     * @param options.flex - Flex ratio of each column; default is [1, 1, 1, ...]
     * @returns HTMLElement containing the column layout
     * @example
     * dv.addcolumns([dv.md('# Hello'), dv.md('# World')], { gap: '10px', flex: [1, 2] });
     */
    columns(elements: HTMLElement[], options?: {
        gap?: string;
        flex?: number[];
    }): HTMLDivElement;
    /**
     * Arranges elements in rows
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between rows; default is '5px'
     * @param options.flex - Flex ratio of each row; default is [1, 1, 1, ...]
     * @returns HTMLElement containing the row layout
     */
    rows(elements: HTMLElement[], options?: {
        gap?: string;
        flex?: number[];
    }): HTMLDivElement;
    /**
     * Creates a Mermaid diagram from Mermaid code
     * @param code - Mermaid code
     * @returns HTMLElement containing the Mermaid diagram
     */
    mermaid(code: string): HTMLElement;
    /**
     * Creates a Mermaid diagram from block relationships
     * @param tree - Object mapping block IDs to their connected blocks
     * @param options - Configuration options
     * @param options.blocks - Array of Block objects
     * @param options.type - Diagram type: "flowchart" or "mindmap"
     * @param options.flowchart - Flow direction: 'TD' or 'LR'
     * @param options.renderer - Custom function to render node content
     * @returns HTMLElement containing the Mermaid diagram
     * @example
     * const children = await Query.childdoc(block);
     * dv.addMermaidRelation({...block, children }, { type: 'flowchart' });
     * dv.addMermaidRelation({ 'Child': children, 'Backlink': backlinks }, { type: 'flowchart' });
     */
    mermaidRelation(tree: IBlockWithChilds | Record<string, Block[]>, options?: {
        type?: "flowchart" | "mindmap";
        flowchart?: 'TD' | 'LR';
        renderer?: (b: Block) => string;
    }): HTMLElement;
    /**
     * Creates a Mermaid flowchart from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'flowchart' })`
     */
    flowchart(tree: IBlockWithChilds, options?: {
        renderer?: (b: Block) => string;
    }): HTMLElement;
    /**
     * Creates a Mermaid mindmap from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'mindmap' })`
     */
    mindmap(tree: IBlockWithChilds, options?: {
        renderer?: (b: Block) => string;
    }): HTMLElement;
    /**
     * Embeds blocks into the DataView
     * @param blocks - Single Block or array of Blocks to embed
     * @param options - Configuration options
     * @param {boolean} options.breadcrumb - Whether to show breadcrumb navigation
     * @param {number} options.limit - Maximum number of blocks to embed, if provided, only limited blocks will be embedded
     * @param {number} options.columns - Number of columns to display
     * @param {number} options.zoom - Zoom factor, from 0 to 1
     * @returns HTMLElement containing the embedded blocks
     * @example
     * const children = await Query.childdoc(block);
     * dv.addembed(children, { limit: 5 });
     */
    embed(blocks: Block[] | Block, options: {
        breadcrumb?: boolean;
        limit?: number;
        columns?: number;
        zoom?: number;
    }): HTMLElement;
    /**
     * Creates a custom ECharts visualization
     * @param echartOption - ECharts configuration object, see {@link https://echarts.apache.org/handbook/en/get-started/} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.events - Event handlers for chart interactions; see {@link https://echarts.apache.org/handbook/en/concepts/event/} for more details
     * @returns HTMLElement containing the chart
     */
    echarts(echartOption: IEchartsOption, options?: {
        height?: string;
        width?: string;
        events?: {
            [eventName: string]: (params: any) => void;
        };
    }): HTMLElement;
    /**
     * Creates a line chart
     * @param x - Array of x-axis values
     * @param y - Array of y-axis values, or array of arrays for multiple lines
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.xlabel - X-axis label
     * @param options.ylabel - Y-axis label
     * @param options.legends - Array of legend labels for multiple lines
     * @param options.echartsOption - Additional ECharts configuration
     * @returns HTMLElement containing the line chart
     */
    echartsLine(x: number[], y: number[] | number[][], options?: {
        height?: string;
        width?: string;
        title?: string;
        xlabel?: string;
        ylabel?: string;
        legends?: string[];
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Creates a bar chart
     * @param x - Array of x-axis values
     * @param y - Array of y-axis values, or array of arrays for multiple bars
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.xlabel - X-axis label
     * @param options.ylabel - Y-axis label
     * @param options.legends - Array of legend labels for multiple bars
     * @param options.stack - Whether to stack bars
     * @param options.echartsOption - Additional ECharts configuration
     * @returns HTMLElement containing the bar chart
     */
    echartsBar(x: string[], y: number[] | number[][], options?: {
        height?: string;
        width?: string;
        title?: string;
        xlabel?: string;
        ylabel?: string;
        legends?: string[];
        stack?: boolean;
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Creates a tree visualization
     * @param data - Tree structure data, see {@link ITreeNode} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.orient - Tree orientation ('LR' for left-to-right, 'TB' for top-to-bottom)
     * @param options.nameRenderer - Custom function to render node names
     * @param options.valueRenderer - Custom function to render node values
     * @param options.symbolSize - Size of node symbols
     * @param options.seriesOption - Additional series configuration; this will be merged within each series option
     * @param options.echartsOption - Additional ECharts configuration, see {@link https://echarts.apache.org/handbook/en/get-started/} for more details
     * @returns HTMLElement containing the tree visualization
     */
    echartsTree(data: ITreeNode, options?: {
        height?: string;
        width?: string;
        title?: string;
        orient?: 'LR' | 'TB';
        nameRenderer?: (node: ITreeNode) => string;
        valueRenderer?: (node: ITreeNode) => string;
        symbolSize?: number;
        seriesOption?: IEchartsSeriesOption;
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Creates a graph/network visualization
     * @param nodes - Array of graph nodes, see {@link IGraphNode} for more details
     * @param links - Array of connections between nodes, see {@link IGraphLink} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.symbolSize - Size of node symbols
     * @param options.renderer - Custom function to render nodes
     * @param options.nameRenderer - Custom function to render node names
     * @param options.valueRenderer - Custom function to render node values
     * @param options.seriesOption - Additional series configuration
     * @param options.echartsOption - Additional ECharts configuration, see {@link https://echarts.apache.org/handbook/en/get-started/} for more details
     * @returns HTMLElement containing the graph visualization
     */
    echartsGraph(nodes: IGraphNode[], links: IGraphLink[], options?: {
        height?: string;
        width?: string;
        title?: string;
        symbolSize?: number;
        renderer?: (node: IGraphNode) => string;
        nameRenderer?: (node: IGraphNode) => string;
        valueRenderer?: (node: IGraphNode) => string;
        seriesOption?: IEchartsSeriesOption;
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Renders the DataView and sets up event handlers and cleanup
     */
    render(): void;
}

export declare const PROHIBIT_METHOD_NAMES: string[];

/** Wrapped Block interface with extended convenient properties and methods */
export interface IWrappedBlock extends Block {
    /** Method to return the original Block object */
    unwrap(): Block;
    /** Original Block object */
    unwrapped: Block;
    /** Block's URI link in format: siyuan://blocks/xxx */
    asuri: string;
    /** Block's URI link in format: siyuan://blocks/xxx */
    touri: string;
    /** Block's Markdown format link */
    aslink: string;
    /** Block's Markdown format link */
    tolink: string;
    /** Block's SiYuan reference format text */
    asref: string;
    /** Block's SiYuan reference format text */
    toref: string;
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

/** Wrapped array interface with extended convenient methods */
export interface IWrappedList<T> extends Array<T> {
    /** Method to return the original array */
    unwrap(): T[];
    /** Original array */
    unwrapped: T[];
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
    groupby(predicate: keyof T | ((item: T) => any), fnEach?: (groupName: any, list: T[]) => unknown): Record<string, IWrappedList<T>>;
    /**
     * Returns a filtered new array, ensuring it's also an IWrappedList
     * @param predicate - Filter condition function
     */
    filter(predicate: (value: T, index: number, array: T[]) => boolean): IWrappedList<T>;
}

/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-08-15 10:28:10
 * @FilePath     : /src/types/index.d.ts
 * @LastEditTime : 2024-12-01 22:54:38
 * @Description  : Frequently used data structures in SiYuan
 */

type ScalarValue = string | number | boolean;

type DocumentId = string;
type BlockId = string;
type NotebookId = string;
type PreviousID = BlockId;
type ParentID = BlockId | DocumentId;

type Notebook = {
    id: NotebookId;
    name: string;
    icon: string;
    sort: number;
    closed: boolean;
}

type NotebookConf = {
    name: string;
    closed: boolean;
    refCreateSavePath: string;
    createDocNameTemplate: string;
    dailyNoteSavePath: string;
    dailyNoteTemplatePath: string;
}

type BlockType = 
    | 'd'
    | 'p'
    | 'query_embed'
    | 'l'
    | 'i'
    | 'h'
    | 'iframe'
    | 'tb'
    | 'b'
    | 's'
    | 'c'
    | 'widget'
    | 't'
    | 'html'
    | 'm'
    | 'av'
    | 'audio';


type BlockSubType = 
    | 'h1' 
    | 'h2' 
    | 'h3' 
    | 'h4' 
    | 'h5' 
    | 'h6' 
    | 'o'
    | 'u'
    | 't';


type Block = {
    id: BlockId;  // ID of the block
    parent_id?: BlockId;  // ID of the parent block
    root_id: DocumentId;  // ID of the document
    hash: string;
    box: string;  // ID of the notebook
    path: string;  // Path of the .sy file, like /20241201224713-q858585/20241201224713-1234567.sy
    hpath: string;  // Human-readable path of the document, like /Test/Document
    name: string;
    alias: string;
    memo: string;
    tag: string;
    content: string;  // Content of the block, no md modifier
    fcontent?: string;  // Content of the first block, when the block is a container block like list item
    markdown: string;  // Markdown content of the block
    length: number;
    type: BlockType;
    subtype: BlockSubType;
    /** string of { [key: string]: string } 
     * For instance: "{: custom-type=\"query-code\" id=\"20230613234017-zkw3pr0\" updated=\"20230613234509\"}" 
     */
    ial?: string;
    sort: number;
    created: string;  // Time of creation, with format like 20241201224713
    updated: string;  // Time of last update, with format like 20241201224713
}

type PartialBlock = Partial<Block>;

type doOperation = {
    action: string;
    data: string;
    id: BlockId;
    parentID: BlockId | DocumentId;
    previousID: BlockId;
    retData: null;
}

declare interface Window {
    siyuan: {
        config: any;
        notebooks: any;
        menus: any;
        dialogs: any;
        blockPanels: any;
        storage: any;
        user: any;
        ws: any;
        languages: any;
        emojis: any;
    };
    Lute: any;
    Query: typeof Query
    mermaid: any;
    echarts: any;
}

// globalThis
declare interface GlobalThis {
    Query: typeof Query
}

