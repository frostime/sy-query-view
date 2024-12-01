// Auto-generated type definitions
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
    id: BlockId;
    parent_id?: BlockId;
    root_id: DocumentId;
    hash: string;
    box: string;
    path: string;
    hpath: string;
    name: string;
    alias: string;
    memo: string;
    tag: string;
    content: string;
    fcontent?: string;
    markdown: string;
    length: number;
    type: BlockType;
    subtype: BlockSubType;
    /** string of { [key: string]: string } 
     * For instance: "{: custom-type=\"query-code\" id=\"20230613234017-zkw3pr0\" updated=\"20230613234509\"}" 
     */
    ial?: string;
    sort: number;
    created: string;
    updated: string;
}

/** 
 * IProtyle interface from Siyuan
 */
declare interface IProtyle {
    [key: string]: any;
}

interface Query {
    DataView(protyle: IProtyle, item: HTMLElement, top: number): DataView;
    Utils: QueryUtils;
    wrapBlocks(blocks: Block | Block[]): WrappedBlock | WrappedList;
    getBlocksByIds(ids: string[]): Promise<Array<WrappedBlock>>;
    docid(protyle: IProtyle): string;
    thisdoc(protyle: IProtyle): Promise<WrappedBlock>;
    sql(fmt: string, wrap: boolean): Promise<Array<any>>;
    backlink(id: string, limit: number): Promise<any>;
    attr(name: string, val: string, valMatch: "=" | "like", limit: number): Promise<any>;
    childdoc(b: string | Block): Promise<WrappedList>;
    fb2p(inputs: string[] | Block[], enable: { heading?: boolean; doc?: boolean; }): Promise<WrappedList | Array<string>>;
}

interface QueryUtils {
    today(hms: boolean): string;
    thisWeek(hms: boolean): string;
    nextWeek(hms: boolean): string;
    thisMonth(hms: boolean): string;
    nextMonth(hms: boolean): string;
    thisYear(hms: boolean): string;
    nextYear(hms: boolean): string;
    now(days: number, hms: boolean): string;
    aslink(b: Block): string;
    asref(b: Block): string;
    asdate(timestr: string): Date;
    astimestr(date: Date): string;
    notebook(input: string | Block): Notebook;
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
interface DataView {
    /**
     * 注册组件 View
     */
    register(method: (...args: any[]) => HTMLElement, options: { aliases?: string[]; outsideMethod?: boolean; }): void;
    dispose(): void;
    /**
     * Register a disposer function to be called when the DataView is disposed.
     * Only when you need to add some extra cleanup logic, you should use this method.
     */
    addDisposer(dispose: () => void): void;
    /**
     * Add a custom element to the DataView.
     */
    addElement(customEle: string | HTMLElement): HTMLElement;
    /**
     * Adds markdown content to the DataView
     */
    markdown(md: string): HTMLElement;
    details(summary: string, content: string | HTMLElement): HTMLDetailsElement;
    /**
     * Creates a list view from an array of data
     */
    list(data: any[], options: IListOptions): HTMLElement;
    /**
     * Creates a table view from an array of data
     */
    table(data: (Object | any[])[], options: ITableOptions): HTMLElement;
    /**
     * Creates a table view specifically for Block objects
     */
    blockTable(blocks: Block[], cols: (keyof Block)[], options: ITableOptions): HTMLElement;
    /**
     * Arranges elements in columns
     */
    columns(elements: HTMLElement[], options: { gap?: string; }): HTMLDivElement;
    /**
     * Arranges elements in rows
     */
    rows(elements: HTMLElement[], options: { gap?: string; }): HTMLDivElement;
    /**
     * Creates a Mermaid diagram
     */
    mermaid(map: Record<string, string | string[]>, options: { blocks?: Block[]; type?: "flowchart" | "mindmap"; flowchart?: "TD" | "LR"; renderer?: (b: Block) => string; }): HTMLElement;
    /**
     * Embeds blocks into the DataView
     */
    embed(blocks: Block | Block[], options: { breadcrumb?: boolean; limit?: number; columns?: number; zoom?: number; }): HTMLElement;
    /**
     * Creates a custom ECharts visualization
     */
    echarts(echartOption: IEchartsOption, options: { height?: string; width?: string; events?: { [eventName: string]: (params: any) => void; }; }): HTMLElement;
    /**
     * Creates a line chart
     */
    echartsLine(x: any[], y: any[] | any[][], options: { height?: string; width?: string; title?: string; xlabel?: string; ylabel?: string; legends?: string[]; echartsOption?: IEchartsOption; }): HTMLElement;
    /**
     * Creates a bar chart
     */
    echartsBar(x: any[], y: any[] | any[][], options: { height?: string; width?: string; title?: string; xlabel?: string; ylabel?: string; legends?: string[]; stack?: boolean; echartsOption?: IEchartsOption; }): HTMLElement;
    /**
     * Creates a tree visualization
     */
    echartsTree(data: ITreeNode, options: { height?: string; width?: string; title?: string; orient?: "LR" | "TB"; nameRenderer?: (node: ITreeNode) => string; valueRenderer?: (node: ITreeNode) => string; symbolSize?: number; seriesOption?: IEchartsSeriesOption; echartsOption?: IEchartsOption; }): HTMLElement;
    /**
     * Creates a graph/network visualization
     */
    echartsGraph(nodes: IGraphNode[], links: IGraphLink[], options: { height?: string; width?: string; title?: string; symbolSize?: number; renderer?: (node: IGraphNode) => string; nameRenderer?: (node: IGraphNode) => string; valueRenderer?: (node: IGraphNode) => string; seriesOption?: IEchartsSeriesOption; echartsOption?: IEchartsOption; }): HTMLElement;
    /**
     * Renders the DataView and sets up event handlers and cleanup
     */
    render(): void;
}
interface IListOptions {
    type?: 'u' | 'o';
    columns?: number;
    renderer?: (b: Block) => string | number | undefined | null;
}
interface ITableOptions {
    center?: boolean;
    fullwidth?: boolean;
    index?: boolean;
    renderer?: (b: Block, attr: keyof Block) => string | number | undefined | null; //仅对BlockTable有效
}
interface ITreeNode {
    id?: string;
    name?: string;
    content?: string;
    children?: ITreeNode[];
    [key: string]: any;  // 允许其他自定义属性
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
 * 封装的 Block 类，提供额外的辅助属性和方法
 */
interface WrappedBlock {
    get(prop: keyof Block): any;
    /** 返回原始 Block 对象 */
    unwrap(): Block;
    /**
     * 以渲染后的形式返回思源的某个属性；
     * 例如 `attr(box)` 会返回笔记本的名称而非 id; `attr(root_id)` 会返回文档的块链接等
     * 可以传入一个 renderer 函数来自定义渲染方式，当返回为 null 时，会使用默认渲染方式
     */
    attr(attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string): string;
}

/**
 * 封装的 Block 数组类，提供额外的辅助方法
 */
interface WrappedList {
    /** 返回原始 Block 数组 */
    unwrap(): Block[];
    /**
     * 返回只包含指定属性的新数组
     */
    pick(attrs: (keyof Block)[]): WrappedList;
    /**
     * 返回排除指定属性的新数组
     */
    omit(attrs: (keyof Block)[]): WrappedList;
    /**
     * 返回按指定属性排序的新数组
     */
    sorton(attr: keyof Block, order: "asc" | "desc"): WrappedList;
    /**
     * 返回按指定条件分组的对象
     */
    groupby(predicate: keyof Block | ((b: Block) => any), fnEach?: (key: any, list: Block[]) => any): Record<string, WrappedList>;
}
