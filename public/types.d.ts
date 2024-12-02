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
        aslink: (b: Block) => string;
        /**
         * Converts a block to a SiYuan reference format
         * @param b - Block to convert
         * @returns String in reference format ((id 'content'))
         */
        asref: (b: Block) => string;
        /**
         * Converts SiYuan timestamp string to Date object
         * @param timestr - SiYuan timestamp (yyyyMMddHHmmss)
         * @returns Date object
         */
        asdate: (timestr: string) => Date;
        /**
         * Converts Date object to SiYuan timestamp format
         * @param date - Date to convert
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        astimestr: (date: Date) => string;
        /**
         * Gets notebook information from block or notebook ID
         * @param input - Block object or notebook ID
         * @returns Notebook information
         */
        notebook: (input: Block | NotebookId) => Notebook;
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
    backlink: (id: BlockId, limit?: number) => Promise<any>;
    /**
     * Finds blocks with specific attributes
     * @param name - Attribute name
     * @param val - Attribute value
     * @param valMatch - Match type ('=' or 'like')
     * @param limit - Maximum number of results
     * @returns Array of matching blocks
     */
    attr: (name: string, val?: string, valMatch?: "=" | "like", limit?: number) => Promise<any>;
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
export interface IListOptions<T> {
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
export interface ITableOptions {
    center?: boolean;
    fullwidth?: boolean;
    index?: boolean;
    renderer?: (b: Block, attr: keyof Block) => string | number | undefined | null;
}

export interface ITreeNode {
    id?: string;
    name?: string;
    content?: string;
    children?: ITreeNode[];
    [key: string]: any;
}

export interface IGraphNode {
    id: string;
    name?: string;
    content?: string;
    value?: number;
    category?: number;
    [key: string]: any;
}

export interface IGraphLink {
    source: string;
    target: string;
    value?: number;
    label?: {
        show?: boolean;
        formatter?: string;
    };
    lineStyle?: {
        color?: string;
        width?: number;
    };
    [key: string]: any;
}

export interface IEchartsSeriesOption {
    [key: string]: any;
}

export interface IEchartsOption {
    [key: string]: any;
    series?: IEchartsSeriesOption[];
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
export declare class DataView {
    private protyle;
    private thisEmbedNode;
    private top;
    private lute;
    private disposers;
    private ROOT_ID;
    private EMBED_BLOCK_ID;
    _element: HTMLElement;
    private PROHIBIT_METHOD_NAMES;
    private observer;
    private disposed;
    /**
     * 注册组件 View
     * @param method: `(...args: any[]) => HTMLElement`, 一个返回 HTMLElement 的方法
     * @param options: 其他配置
     *  - aliases: 组件的别名
     *  - bindDataview: 是否绑定 DataView 实例，默认为 true，外部的 method 将会自动执行 `method.bind(this)`
     */
    register(method: (...args: any[]) => HTMLElement, options?: {
        aliases?: string[];
        bindDataview?: boolean;
    }): void;
    constructor(protyle: IProtyle, embedNode: HTMLElement, top: number | null);
    get element(): HTMLElement;
    dispose(): void;
    private cleanup;
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
     */
    markdown(md: string): HTMLElement;
    details(summary: string, content: string | HTMLElement): HTMLDetailsElement;
    /**
     * Creates a list view from an array of data
     * @param data - Array of items to display in the list
     * @param options - Configuration options, see {@link IListOptions}
     * @returns HTMLElement containing the list
     */
    list(data: Block[], options?: IListOptions<Block>): HTMLElement;
    /**
     * Creates a table view from an array of data
     * @param data - Array of objects or arrays to display in table format
     * @param options - Configuration options, see {@link ITableOptions}
     * @returns HTMLElement containing the table
     */
    table(data: (Object | any[])[], options?: ITableOptions): HTMLElement;
    /**
     * Creates a table view specifically for Block objects
     * @param blocks - Array of Block objects to display
     * @param cols - Array of Block properties to show as columns, can be null
     * @param options - Configuration options, see {@link ITableOptions}
     * @returns HTMLElement containing the block table
     */
    blockTable(blocks: Block[], cols: (keyof Block)[] | null, options?: ITableOptions): HTMLElement;
    /**
     * Arranges elements in columns
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between columns; default is '5px'
     * @returns HTMLElement containing the column layout
     */
    columns(elements: HTMLElement[], options?: {
        gap?: string;
    }): HTMLDivElement;
    /**
     * Arranges elements in rows
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between rows; default is '5px'
     * @returns HTMLElement containing the row layout
     */
    rows(elements: HTMLElement[], options?: {
        gap?: string;
    }): HTMLDivElement;
    /**
     * Creates a Mermaid diagram from block relationships
     * @param map - Object mapping block IDs to their connected blocks
     * @param options - Configuration options
     * @param options.blocks - Array of Block objects
     * @param options.type - Diagram type: "flowchart" or "mindmap"
     * @param options.flowchart - Flow direction: 'TD' or 'LR'
     * @param options.renderer - Custom function to render node content
     * @returns HTMLElement containing the Mermaid diagram
     */
    mermaid(map: Record<BlockId, BlockId | BlockId[]>, options?: {
        blocks?: Block[];
        type?: "flowchart" | "mindmap";
        flowchart?: 'TD' | 'LR';
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
    echartsLine(x: any[], y: any[] | any[][], options?: {
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
    echartsBar(x: any[], y: any[] | any[][], options?: {
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
    /**
     * 注册内部的垃圾回收, 在嵌入块刷新的时候触发
     */
    private registerInternalGC;
}

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

/**
 * Add some helper properties to the Block for direct use
 * @param block
 * @returns
 */
export declare const wrapBlock: (block: Block) => IWrappedBlock;
/**
 * Add a Proxy layer to the list of SQL query results to attach some convenient methods
 * @param list
 * @returns
 */
export declare const wrapList: (list: Block[], useWrapBlock?: boolean) => IWrappedList<IWrappedBlock>;

/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-08-15 10:28:10
 * @FilePath     : /src/types/index.d.ts
 * @LastEditTime : 2024-12-01 22:54:38
 * @Description  : Frequently used data structures in SiYuan
 */


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

