/**
 * @name sy-query-view
 * @author frostime
 * @version 1.2.3
 * @updated 2025-05-21T01:53:38.404Z
 */

declare module 'siyuan' {
    interface IProtyle {
        [key: string]: any;
    }

}

/**
 * Send siyuan kernel request
 */
declare function request(url: string, data: any): Promise<any | null>;

///@query.d.ts
import { IProtyle } from "siyuan";


type DeprecatedParam<T> = T;
/**
 * Data class for SiYuan timestamp
 * In SiYuan, the timestamp is in the format of yyyyMMddHHmmss
 */
declare class SiYuanDate extends Date {
    beginOfDay(): SiYuanDate;
    toString(hms?: boolean): string;
    [Symbol.toPrimitive](hint: string): any;
    static fromString(timestr: string): SiYuanDate;
    /**
     * Format date
     * @param fmt default as 'yyyy-MM-dd HH:mm:ss'
     * @returns
     */
    format(fmt?: string): string;
    add(days: number | string): SiYuanDate;
}

declare const Query: {
    /**
     * Creates a new DataView instance for rendering data visualizations
     * @param protyle - Protyle instance
     * @param item - HTML element to render into
     * @param top - Top position for rendering
     * @returns DataView instance
     */
    DataView: (protyle: IProtyle, item: HTMLElement, top: number | null) => DataView;
    /**
     * Utility for query
     * Every function here is sync function, no need to await
     */
    Utils: {
        Date: (value: string | number | Date) => SiYuanDate;
        /**
         * Gets timestamp for current time with optional day offset
         * @param days - Number of days to offset (positive or negative)
         * - {number} 直接用数字
         * - {string} 使用字符串，如 '1d' 表示 1 天，'2w' 表示 2 周，'3m' 表示 3 个月，'4y' 表示 4 年
         * - 可以为负数
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        now: (days?: number | string, hms?: boolean) => any;
        /**
         * Gets the timestamp for the start of today
         * @param {boolean} hms - Whether to include time, e.g today(false) returns 20241201, today(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        today: (hms?: boolean) => any;
        /**
         * Gets the timestamp for the start of current week
         * @param {boolean} hms - Whether to include time, e.g thisWeek(false) returns 20241201, thisWeek(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisWeek: (hms?: boolean) => any;
        /**
         * Gets the timestamp for the start of next week
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        lastWeek: (hms?: boolean) => any;
        /**
         * Gets the timestamp for the start of current month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisMonth: (hms?: boolean) => any;
        /**
         * Gets the timestamp for the start of last month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        lastMonth: (hms?: boolean) => string;
        /**
         * Gets the timestamp for the start of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisYear: (hms?: boolean) => string;
        /**
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
        asTimestr: (date: Date) => any;
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
        asMap: (blocks: Block[], key?: string) => {
            [key: string]: Block;
            [key: number]: Block;
        };
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
         * @example
         * Query.Utils.boxName(block['box']) // 'Notebook 123'
         */
        boxName: (boxid: NotebookId) => string;
        /**
         * Gets the readable name of the type of a block
         * @param type - Block type
         * @returns Readable block type name
         * @example
         * Query.Utils.typename(block['type']) // 'Heading'
         */
        typeName: (type: BlockType) => any;
        /**
         * Given a document block (type='d'), return its emoji icon
         * @param document
         * @returns emoji icon; if block is not with type='d', return null
         */
        docIcon: (document: Block) => string;
        /**
         * Given emoji code, returl emoji icon
         * @param code
         * @returns
         */
        emoji: (code: string) => string;
        /**
         * Renders the value of a block attribute as markdown format
         */
        renderAttr: (b: Block & {
            [key: string | number]: string | number;
        }, attr: (keyof Block & string) | number, options?: {
            onlyDate?: boolean;
            onlyTime?: boolean;
        }) => string;
        openBlock: (id: BlockId, options?: {
            zoomIn?: boolean;
            action?: import("siyuan").TProtyleAction[];
            position?: Parameters<typeof import("siyuan").openTab>[0]["position"];
            keepCursor?: boolean;
        }) => void;
    };
    /**
     * Wraps blocks with additional functionality
     * @param blocks - Blocks to wrap
     * @param useWrapBlock - Whether to wrap blocks inside the WrappedList
     * @returns Wrapped block(s)
     */
    wrapBlocks: (blocks: Block[] | Block, useWrapBlock?: boolean) => Block[] | IWrappedBlock;
    /**
     * SiYuan Kernel Request API
     * @example
     * await Query.request('/api/outline/getDocOutline', {
     *     id: docId
     * });
     */
    request: typeof request;
    /**
     * Gets blocks by their IDs
     * @note This API recieve sequence of block IDs, and always return an array of Block.
     * @param ids - Block IDs to retrieve
     * @returns Array of wrapped blocks
     * @alias `getBlocksById`
     */
    getBlocksByIds: (...ids: (BlockId | BlockId[])[]) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Similar to `getBlocksByIds`, but :
     *  - The input can be a single ID or an array of IDs
     *  - The output is a single block or an array of blocks
     * @param id Block ID or array of block IDs
     * @returns Single block or array of blocks
     */
    id2block: (id: BlockId | BlockId[]) => Promise<IWrappedBlock | IWrappedList<IWrappedBlock>>;
    /**
     * Gets the current document's ID
     * @param protyle - Protyle instance
     * @returns Document ID
     */
    root_id: (protyle: IProtyle) => string;
    /**
     * Gets the current document as a block
     * @param protyle - Protyle instance
     * @returns Wrapped document block
     */
    thisDoc: (protyle: IProtyle) => Promise<IWrappedBlock>;
    /**
     * Executes SQL query and optionally wraps results
     * @param fmt - SQL query string
     * @param wrap - Whether to wrap results
     * @returns Query results
     */
    sql: (fmt: string, wrap?: boolean) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Finds backlinks to a specific block
     * @param id - Block ID to find backlinks for
     * @param limit - Maximum number of results
     * @returns Array of blocks linking to the specified block
     */
    backlink: (id: BlockId, limit?: number) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Finds blocks with specific attributes
     * @param name - Attribute name
     * @param val - Attribute value
     * @param options - Options
     * @param options.valMatch - Match type ('=' or 'like')
     * @param options.limit - Maximum number of results
     * @param limit - (Deprecated) Maximum number of results
     * @returns Array of matching blocks
     */
    attr: (name: string, val?: string, optionDeprecatedAsValMatch?: {
        valMatch?: "=" | "like";
        limit?: number;
    } | DeprecatedParam<"=" | "like">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Search blocks by tags
     * @param tags - Tags to search for; can provide multiple tags
     * @param options - Additional options
     * @param options.join - Join type ('or' or 'and')
     * @param options.limit - Maximum number of results
     * @param options.match - Match type ('=' or 'like'), if `like` the tags will be automatically add % as prefix and suffix
     * @param limit - (Deprecated) Maximum number of results
     * @returns Array of blocks matching the tags
     * @example
     * Query.tag('tag1') // Search for blocks with 'tag1'
     * Query.tag(['tag1', 'tag2'], { join: 'or' }) // Search for blocks with 'tag1' or 'tag2'
     * Query.tag(['tag1', 'tag2'], { join: 'and' }) // Search for blocks with 'tag1' and 'tag2'
     */
    tag: (tags: string | string[], optionDeprecatedAsJoin?: {
        join?: "or" | "and";
        limit?: number;
        match?: "=" | "like";
    } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Find unsolved task blocks
     * @param options - Options
     * @param options.after - After which the blocks were updated
     * @param options.limit - Maximum number of results
     * @param limit - (Deprecated) Maximum number of results
     * @returns Array of unsolved task blocks
     * @example
     * Query.task()
     * Query.task({ after: '2024101000' })
     * Query.task({ limit: 32 })
     */
    task: (optionDeprecatedAsAfter?: {
        limit?: number;
        after?: string;
    } | DeprecatedParam<string>, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>;
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
    dailynote: (optionsDeprecatedAsNotebook?: {
        notebook?: NotebookId;
        limit?: number;
    } | DeprecatedParam<NotebookId>, limitDeprecated?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Gets child documents of a block
     * @param b - Parent block or block ID
     * @returns Array of child document blocks
     */
    childDoc: (b: BlockId | Block) => Promise<Block[]>;
    /**
     * Get nearby blocks relative to the specified block within the same container.
     *
     * The search is limited to blocks within the same hierarchy level() container or heading section ).
     * Example: For the following structure, para 2's nearby blocks would be:
     * previous: [para 1], next: [para 3, para 4]; because `### Title` is outof the same hierarchy level.
     *
     * ```
     * ### Title
     *
     * para 1
     *
     * para 2
     *
     * para 3
     *
     * para 4
     * ```
     *
     * @param id - Target block ID to find neighbors for
     * @param options - Search options
     * @param options.direction - Which direction to search ('previous', 'next' or 'both'), defaults to 'both'
     * @param options.number - Maximum number of blocks to return in each direction, defaults to 3
     * @returns Object containing arrays of neighboring blocks
     * @example
     * // Get both previous and next blocks
     * await query.nearby('block123');
     *
     * // Get 3 previous blocks only
     * await query.nearby('block123', { direction: 'previous', number: 3 });
     */
    nearby: (id: BlockId, options?: {
        direction?: "previous" | "next" | "both";
        number?: number;
    }) => Promise<{
        previous?: {
            id: Block;
            markdown: string;
        }[];
        next?: {
            id: Block;
            markdown: string;
        }[];
    }>;
    /**
     * Search blocks that contain the given keywords
     * @param keywords {string | string[]} - Keywords to search for; can provide multiple keywords
     * @param options - Options
     * @param options.join - Join type ('or' or 'and')
     * @param options.limit - Maximum number of results to return, default is 999
     * @param limit - (Deprecated) Maximum number of results to return, default is 999
     * @returns Array of blocks that contain the given keywords
     */
    keyword: (keywords: string | string[], options?: {
        join?: "or" | "and";
        limit?: number;
    } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<IWrappedList<IWrappedBlock>>;
    /**
     * Search the document that contains all the keywords.
     * @param keywords {string | string[]} keywords to search for; can provide multiple keywords
     * @param options - Options
     * @param options.join - Join type ('or' or 'and')
     * @param options.limit - Maximum number of results to return, default is 999
     * @returns The document blocks that contains all the given keywords; the blocks will attached a 'keywords' property, which is the matched keyword blocks
     * @example
     * let docs = await Query.keywordDoc(['Keywords A', 'Keywords B']);
     * //each block in docs is a document block that contains all the keywords
     * docs[0].keywords['Keywords A'] // get the matched keyword block by using `keywords` property
     */
    keywordDoc: (keywords: string | string[], options?: {
        join?: "or" | "and";
        limit?: number;
    } | DeprecatedParam<"or" | "and">, limit?: DeprecatedParam<number>) => Promise<Block[]>;
    /**
     * Randomly roam blocks
     * @param limit - Maximum number of results
     * @param type - Block type
     * @returns Array of randomly roamed blocks
     */
    random: (limit?: number, type?: BlockType) => Promise<IWrappedList<IWrappedBlock>>;
    markdown: (input: BlockId | Block) => Promise<any>;
    /**
     * Return the statistics of the document with given document ID
     * @param docId The ID of document
     * @returns The statistics of the document
     * @returns.runeCount - The number of characters in the document
     * @returns.wordCount - The number of words (Chinese characters are counted as one word) in the document
     * @returns.linkCount - The number of links in the document
     * @returns.imageCount - The number of images in the document
     * @returns.refCount - The number of references in the document
     * @returns.blockCount - The number of blocks in the document
     */
    docStat: (docId: DocumentId) => Promise<{
        "runeCount": number;
        "wordCount": number;
        "linkCount": number;
        "imageCount": number;
        "refCount": number;
        "blockCount": number;
    }>;
    /**
     * Redirects first block IDs to their parent containers
     * @param inputs - Array of blocks or block IDs
     * @param enable - Configuration for heading and doc processing
     * @param enable.heading - Whether to process heading blocks
     * @param enable.doc - Whether to process document blocks
     * @returns Processed blocks or block IDs
     * @alias `redirect`
     */
    fb2p: (inputs: Block[], enable?: {
        heading?: boolean;
        doc?: boolean;
    }) => Promise<Block[]>;
    /**
     * Prune/Merge blocks from SQL search results to eliminate duplicates.
     *
     * SiYuan's block structure is hierarchical, leading to multiple results for nested content (e.g., lists, list items, and their paragraphs).
     * For example, searching "Hi" in the following list might return three blocks:
     *  1. The parent list block
     *  2. The list item block
     *  3. The paragraph block
     *
     * ```md
     * - Hi
     * - Hello
     * ```
     *
     * This function resolves this duplication issue by merging related blocks based on a chosen strategy.
     *
     * @param {Block[]} blocks - An array of blocks returned from a SQL search, potentially containing nested structures.
     * @param {('leaf' | 'root')} [keep='leaf'] - The merging mode:
     *    - `'leaf'`:  Merges results to the deepest (leaf) block. (e.g., the paragraph block in a list item).
     *    - `'root'`: Merges results to the highest (root) block. (e.g., the parent list block).
     * @param {boolean} [advanced=false] - Enables advanced filtering using block breadcrumbs for more accurate results (can be resource-intensive).
     * @returns {Block[]} - A new array containing only the unique (pruned) blocks.
     * @alias `prune`
     */
    pruneBlocks: (blocks: Block[], keep?: "leaf" | "root", advanced?: boolean) => Promise<Block[]>;
    /**
     * Send GPT request, use AI configuration in `siyuan.config.ai.openAI` by default
     * @param prompt - Prompt
     * @param options - Options
     * @param options.url - Custom API URL
     * @param options.model - Custom API model
     * @param options.apiKey - Custom API key
     * @param options.returnRaw - Whether to return raw response (default: false)
     * @param options.history - Chat history
     * @param options.stream - Whether to use streaming mode, default: false
     * @param options.streamMsg - Callback function for streaming messages, only works when options.stream is true
     * @param options.streamInterval - Interval for calling options.streamMsg on each chunk, default: 1
     * @returns GPT response
     */
    gpt: (input: string | {
        role: "user" | "assistant";
        content: string;
    }[], options?: {
        url?: string;
        model?: string;
        apiKey?: string;
        history?: {
            role: "user" | "assistant";
            content: string;
        }[];
        returnRaw?: boolean;
        stream?: boolean;
        streamMsg?: (msg: string) => void;
        streamInterval?: number;
    }) => Promise<any>;
};

///@data-view-types.d.ts
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

///@data-view.d.ts
/**
 * DataView class for creating and managing dynamic data visualizations
 * Provides various methods for visualizing data.
 */
export declare class DataView implements IDataView {
    /**
     * The id of the root document
     */
    get root_id(): string;
    /**
     * The id of the embed block
     */
    get embed_id(): string;
    constructor(protyle: IProtyle, embedNode: HTMLElement, top: number | null);
    /**
     * Repaint the embed block, essentially merely click the reload button
     */
    repaint(): void;
    /**
     * Persist state across renders; it will store the state in the block attributes when disposing, and restore it when creating.
     * @param key - The key of the state
     * @param initialValue - The initial value of the state
     * @returns An IState object -- see {@link IState}
     * @example
     * const count = dv.useState('count', 0);
     * count(); // Access the value
     * count.value; // Access the value, same as count()
     * count(1); // Set the value
     * count.value = 1; // Set the value, same as count(1)
     */
    useState<T>(key: string, initialValue?: T): IState<T>;
    /**
     * Register a disposer function to be called when the DataView is disposed.
     * Only when you need to add some extra cleanup logic, you should use this method.
     * @param dispose The dispose function
     */
    addDisposer(dispose: () => void, id?: string): void;
    /**
     * Wrap an element into a view container
     * @param ele
     */
    view(ele: HTMLElement | string): HTMLElement;
    /**
     * Add a custom element to the DataView.
     * If the passing is a view container, it will be directly appended.
     * Otherwise, it will be wrapped by a new container
     * @param ele
     * @param disposer -- dispose function, optional
     * @returns View Conainer, with a special class name, and a `data-id` attribute
     * @alias addele
     */
    addElement(ele: HTMLElement | string, disposer?: () => void): HTMLElement;
    isValidViewContainer(container: HTMLElement): boolean;
    /**
     * Remove the view element (by given the id of the container) from dataview
     * @param id Existed view's data-id
     * @param beforeRemove, an optional callback funcgtion
     * @returns Whether the removal succeeded
     */
    removeView(id: string, beforeRemove?: (viewContainer: HTMLElement) => void): boolean;
    removeview: (id: string, beforeRemove?: (viewContainer: HTMLElement) => void) => boolean;
    /**
     * Replace the view element (by given the id of the container) with another given element
     * @param id
     * @param viewContainer: must be a conatiner element
     * @param disposer: dispose functioin, if already specified for viewContainer, this one will be omit!.
     * @warn Don not duplicately specify dispose function for new view!
     * @returns
     */
    replaceView(id: string, viewContainer: HTMLElement, disposer?: () => void): HTMLElement;
    replaceview: (id: string, viewContainer: HTMLElement, disposer?: () => void) => HTMLElement;
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
     * @param data - Array of blocks to display in the list
     *              Can also be scalar values, or block with children property
     * @param options - Configuration options
     * @param {string} options.type - List type, 'u' for unordered, 'o' for ordered
     * @param {number} options.columns - Number of columns to display
     * @param {(b: T, defaultRenderer?: (b: T) => string) => string | number | undefined | null} options.renderer - Custom function to render list items, the return will be used as markdown code
     * @returns HTMLElement containing the list
     * @example
     * const children = await Query.childdoc(block);
     * dv.addlist(children, { type: 'o' });
     */
    list(data: (IBlockWithChilds | ScalarValue)[], options?: IListOptions<Block>): HTMLElement;
    /**
     * Creates a markdown table view for displaying blocks
     * @param blocks - Array of Block objects to display
     * @param options - Configuration options
     * @param {boolean} options.center - Center align table contents
     * @param {boolean} options.fullwidth - Make table full width
     * @param {boolean} options.index - Show row indices
     * @param {Array} options.cols - Array of Block properties to show as columns;
     *     - if `undefined`, the default columns `['type', 'content', 'hpath', 'box']` will be used;
     *       but if the blocks don't have these properties, all properties of the first block will be used;
     *     - Can also be:
     *       - Record<string, string> to specify the column name, like `{type: 'Type', content: 'Content', 'root_id': 'Document'}`
     *       - Mixed array, like `['type', {content: 'Content'}, 'hpath']`
     *       - `null`, in this case, all columns will be shown
     * @param options.renderer - Custom function to render table cells
     *       - The return will be used as markdown code, and insert into each td cell
     *       - If returns `null`, the default renderer will be used
     *       - SPECIAL USAGE: if the returned string is wrapped with {@html ...}, it will be treated as HTML code
     * @returns HTMLElement containing the block table
     * @example
     * const children = await Query.childdoc(block);
     * dv.addtable(children, { cols: ['type', 'content'] , fullwidth: true });
     */
    table(blocks: Block[], options?: {
        center?: boolean;
        fullwidth?: boolean;
        index?: boolean;
        cols?: (string | Record<string, string>)[] | Record<string, string>;
        renderer?: (b: Block, attr: keyof Block) => string | undefined | null;
    }): HTMLElement;
    /**
     * Creates a card view for displaying blocks
     * @param blocks - Array of Block objects to display
     * @param options - Configuration options
     * @param options.cardWidth - Width of each card; default is '175px'
     * @param options.cardHeight - Height of each card; default is '175px'
     * @param options.fontSize - Base font size for the cards; default is '14px'
     * @returns HTMLElement containing the card layout
     * @example
     * const children = await Query.childdoc(block);
     * dv.cards(children, { cardWidth: '250px', fontSize: '16px' });
     */
    cards(blocks: Block[], options?: {
        cardWidth?: string;
        cardHeight?: string;
        fontSize?: string;
    }): HTMLElement;
    /**
     * Arranges elements in columns
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between columns; default is '5px'
     * @param options.flex - Flex ratio of each column; default is [1, 1, 1, ...]
     * @param options.minWidth - The minimum width of **each column**; default is '350px'; This is useful when the columns number is quite large
     * @returns HTMLElement containing the column layout
     * @example
     * dv.addcolumns([dv.md('# Hello'), dv.md('# World')], { gap: '10px', flex: [1, 2] });
     */
    columns(elements: HTMLElement[], options?: {
        gap?: string;
        flex?: number[];
        minWidth?: string | number;
    }): HTMLElement;
    /**
     * Arranges elements in rows
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between rows; default is '5px'
     * @param options.maxHeight - Maximum height of the container; default not set
     * @param options.flex - Flex ratio of each row; default not set
     * @returns HTMLElement containing the row layout
     */
    rows(elements: HTMLElement[], options?: {
        gap?: string;
        maxHeight?: string;
        flex?: number[];
    }): HTMLElement;
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
     * @alias mFlowchart
     */
    mermaidFlowchart(tree: IBlockWithChilds, options?: {
        renderer?: (b: Block) => string;
    }): HTMLElement;
    /**
     * Creates a Mermaid mindmap from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'mindmap' })`
     * @alias mMindmap
     */
    mermaidMindmap(tree: IBlockWithChilds, options?: {
        renderer?: (b: Block) => string;
    }): HTMLElement;
    /**
     * Creates a Mermaid gantt chart from block relationships
     * @param groupedBlocks { [Group Name]: Blocks Array }
     * @param options
     * @param options.priority - Function to determine priority of each block, see {@link https://mermaid.js.org/syntax/kanban.html#supported-metadata-keys}
     * @param options.clip - Maximum length of text to display in each item, default as 50
     * @param options.width - The width of kanban
     * @returns
     * @alias mKanban
     */
    mermaidKanban(groupedBlocks: Record<string, Block[]>, options: {
        priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low';
        clip?: number;
        width?: string;
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
     * @param echartOption - ECharts configuration object, see {@link https://echarts.apache.org/zh/option.html#title} for more details
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
     * @param options.seriesOption - Additional series configuration. See {@link https://echarts.apache.org/zh/option.html#series-line} for more details
     * @param options.echartsOption - Additional ECharts configuration. See {@link https://echarts.apache.org/zh/option.html#title} for more details
     * @returns HTMLElement containing the line chart
     * @alias eline
     */
    echartsLine(x: number[], y: number[] | number[][], options?: {
        height?: string;
        width?: string;
        title?: string;
        xlabel?: string;
        ylabel?: string;
        legends?: string[];
        seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[];
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
     * @param options.seriesOption - Additional series configuration. See {@link https://echarts.apache.org/zh/option.html#series-bar} for more details
     * @param options.echartsOption - Additional ECharts configuration
     * @returns HTMLElement containing the bar chart
     * @alias ebar
     */
    echartsBar(x: string[], y: number[] | number[][], options?: {
        height?: string;
        width?: string;
        title?: string;
        xlabel?: string;
        ylabel?: string;
        legends?: string[];
        stack?: boolean;
        seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[];
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Creates a tree visualization
     * @param data - Tree structure data, see {@link ITreeNode} and {@link https://echarts.apache.org/zh/option.html#series-tree.data} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.orient - Tree orientation ('LR' for left-to-right, 'TB' for top-to-bottom)
     * @param options.layout - Tree layout ('orthogonal' for orthogonal layout, 'radial' for radial layout)
     * @param options.roam - Whether to enable roam, default as false
     * @param options.symbolSize - Size of node symbols, default as 14
     * @param options.labelFontSize - Font size of node labels, default as 16
     * @param options.nodeRenderer - Custom function to render nodes. Mostly you don't need to provide this.
     * @param options.tooltipFormatter - Custom function to render tooltip content. Mostly you don't need to provide this.
     * @param options.seriesOption - Additional series configuration; this will be merged within each series option. See {@link https://echarts.apache.org/zh/option.html#series-tree} for more details
     * @param options.echartsOption - Additional ECharts configuration, see {@link https://echarts.apache.org/zh/option.html#title} for more details
     * @returns HTMLElement containing the tree visualization
     * @alias etree
     */
    echartsTree(data: ITreeNode, options?: {
        height?: string;
        width?: string;
        title?: string;
        orient?: 'LR' | 'TB';
        layout?: 'orthogonal' | 'radial';
        roam?: boolean | 'scale' | 'move';
        symbolSize?: number;
        labelFontSize?: number;
        nodeRenderer?: (node: IGraphNode) => {
            name?: string;
            value?: any;
            [key: string]: any;
        };
        tooltipFormatter?: (node: ITreeNode) => string;
        seriesOption?: IEchartsSeriesOption;
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Creates a graph/network visualization
     * @param nodes - Array of graph nodes, see {@link IGraphNode} and {@link https://echarts.apache.org/zh/option.html#series-graph.data} for more details
     * @param links - Array of connections between nodes, see {@link IGraphLink} and {@link https://echarts.apache.org/zh/option.html#series-graph.links} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.title - Chart title
     * @param options.layout - Layout type, default as 'force'
     * @param options.roam - Whether to enable roam, default as true
     * @param options.symbolSize - Size of node symbols
     * @param options.labelFontSize - Font size of node labels
     * @param options.nodeRenderer - Custom function to render nodes, return Echarts node type. Mostly you don't need to provide this.
     * @param options.tooltipFormatter - Custom function to render tooltip content. Mostly you don't need to provide this.
     * @param options.seriesOption - Additional series configuration, see {@link https://echarts.apache.org/zh/option.html#series-graph} for more details
     * @param options.echartsOption - Additional ECharts configuration, see {@link https://echarts.apache.org/zh/option.html#title} for more details
     * @returns HTMLElement containing the graph visualization
     * @alias egraph
     */
    echartsGraph(nodes: (IGraphNode | Block)[], links: IGraphLink[], options?: {
        height?: string;
        width?: string;
        title?: string;
        layout?: 'force' | 'circular';
        roam?: boolean;
        symbolSize?: number;
        labelFontSize?: number;
        nodeRenderer?: (node: IGraphNode) => {
            name?: string;
            value?: any;
            category?: number;
            [key: string]: any;
        };
        tooltipFormatter?: (node: IGraphNode) => string;
        seriesOption?: IEchartsSeriesOption;
        echartsOption?: IEchartsOption;
    }): HTMLElement;
    /**
     * Renders the DataView and sets up event handlers and cleanup
     */
    render(): void;
}

export declare const PROHIBIT_METHOD_NAMES: string[];

///@proxy.d.ts
/** Wrapped Block interface with extended convenient properties and methods */
export interface IWrappedBlock extends Block {
    /** Method to return the original Block object */
    unwrap(): Block;
    /** Original Block object */
    unwrapped: Block;
    /** Block's URI link in format: siyuan://blocks/xxx */
    asurl: string;
    /** Block's Markdown format link [content](siyuan://blocks/xxx) */
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
     * @returns {string} Rendered attribute value
     * @example
     * block.attr('box') // Returns the name of the notebook
     * block.attr('root_id') // Returns the block link of the document
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
    groupby(predicate: keyof T | ((item: T) => any), fnEach?: (groupName: any, list: T[]) => unknown): Record<string, IWrappedList<T>>;
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
    unique(key?: keyof Block | ((b: Block) => string | number)): IWrappedList<IWrappedBlock>;
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
    addcol(newItems: Record<string, ScalarValue | ScalarValue[]> | Record<string, ScalarValue>[] | ((b: T, index: number) => Record<string, ScalarValue> | Record<string, ScalarValue[]>)): IWrappedList<T>;
}

///@index.d.ts
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
    katex: any;
}

// globalThis
declare interface GlobalThis {
    Query: typeof Query
}

