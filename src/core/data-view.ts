/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-02 10:15:04
 * @FilePath     : /src/core/data-view.ts
 * @LastEditTime : 2024-12-06 15:32:42
 * @Description  : 
 */
import {
    IProtyle,
    fetchSyncPost,
    Lute
} from "siyuan";
import { getLute } from "./lute";
import { BlockList, BlockTable, MermaidRelation, EmbedNodes, Echarts, MermaidBase, errorMessage } from './components';
import { registerProtyleGC } from "./finalize";
import { openBlock } from "@/utils";
import { getCustomView } from "./custom-view";
import UseStateMixin from "./use-state";

import styles from './index.module.scss';

const getCSSVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

/**************************************** ZX写的 DataView 类 ****************************************/

function cancelKeyEvent(el: KeyboardEvent) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let nodeElement: HTMLElement = selection.getRangeAt(0).startContainer.parentElement;
    if (hasParentWithClass(nodeElement, styles["data-query-embed"])) {
        el.stopPropagation();
    }
}

function hasParentWithClass(element: HTMLElement, className: string) {
    // 获取父元素
    let parent = element.parentElement;
    // 通过while循环遍历父元素
    while (parent && !parent.classList.contains('protyle-wysiwyg--attr')) {
        // 检查父元素是否包含指定class
        if (parent.classList.contains(className)) {
            return true;
        }
        // 继续向上获取父元素
        parent = parent.parentElement;
    }
    return false;
}

const newViewWrapper = (tag: string = 'div') => {
    let div = document.createElement(tag);
    // 怀疑同步异常是 Lute 解析错误导致的，加一个 protyle-custom 不知道有没有用
    // https://github.com/88250/lute/issues/206
    div.classList.add(styles["data-view-component"], 'protyle-custom');
    return div;
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * DataView class for creating and managing dynamic data visualizations
 * Provides various methods for visualizing data.
 */
export class DataView extends UseStateMixin implements IDataView {
    /** @internal */
    private protyle: IProtyle;

    /** @internal */
    private thisEmbedNode: HTMLElement;

    /** @internal */
    private top: number | null;

    /** @internal */
    private lute: Lute;

    /** @internal */
    private disposers: (() => void)[] = [];

    /** @internal */
    private ROOT_ID: DocumentId;

    /** @internal */
    private EMBED_BLOCK_ID: BlockId;

    /** @internal */
    _element: HTMLElement;

    /** @internal */
    static PROHIBIT_METHOD_NAMES = ['register', 'element', 'ele', 'render'];

    /** @internal */
    private observer: MutationObserver;

    /** @internal */
    private disposed = false;

    /**
     * @internal
     * 注册组件 View
     * @param method: `(...args: any[]) => HTMLElement`, 一个返回 HTMLElement 的方法
     * @param options: 其他配置
     *  - aliases: 组件的别名
     */
    private register(
        method: (...args: any[]) => HTMLElement,
        options: {
            name?: string,
            aliases?: string[],
        } = {}
    ) {

        const methodName = options.name ?? method.name;
        const aliasSet = new Set(options.aliases ?? []);
        const newAliases = [];

        if (DataView.PROHIBIT_METHOD_NAMES.includes(methodName)) {
            console.warn(`Method name ${methodName} is prohibited, please use another name.`);
            return;
        }

        // 先收集所有需要添加的新别名
        aliasSet.add(methodName);
        for (const alias of aliasSet) {
            newAliases.push(capitalize(alias));
            newAliases.push(alias.toLowerCase());
        }

        // 然后一次性添加到 Set 中
        newAliases.forEach(alias => aliasSet.add(alias));

        const aliases = Array.from(aliasSet);

        // console.debug(`Alias for ${methodName}:`, aliases);

        // Register base method and its aliases
        aliases.forEach(alias => {
            this[alias] = method.bind(this);
            this[alias.toLowerCase()] = method.bind(this);
        });

        const addViewFn = ((...args: any[]) => {
            const result = method.apply(this, args);
            this._element.append(result);
            return result.firstElementChild || result;
        });

        // Register add method
        this['add' + methodName] = addViewFn;
        aliases.forEach(alias => {
            const fnName = 'add' + alias;
            this[fnName] = addViewFn;
            this[fnName.toLowerCase()] = addViewFn;
        });
    }

    /** @internal */
    private registerCustomViews() {
        const customView = getCustomView();
        if (!customView) return;

        const useCustomView = (name, use: ICustomView['use']) => {
            return (...args: any[]) => {
                const { render, dispose } = use(this);
                const container = newViewWrapper();

                if (!render) {
                    errorMessage(container, `Custom view ${name} should have an init method`);
                } else {
                    const ans = render(container, ...args);
                    if (ans) {
                        //原则上不支持 Promise 返回，但为了兼容性，还是做了处理
                        if (ans instanceof Promise) {
                            ans.then(ele => ele && container.append(ele)).catch(err => {
                                const span = document.createElement('span');
                                errorMessage(span, err.message);
                                container.append(span);
                            });
                        } else if (ans) {
                            container.append(ans);
                        }
                    }
                }
                if (dispose) {
                    this.addDisposer(() => dispose());
                }
                return container;
            }
        }

        Object.entries(customView).forEach(([key, value]) => {
            const name = key;
            const { use, alias } = value;

            this.register(useCustomView(name, use), {
                name,
                aliases: alias
            });
            console.debug(`Custom view ${name} registered`);
        });
    }

    get root_id() {
        return this.ROOT_ID;
    }

    get embed_id() {
        return this.EMBED_BLOCK_ID;
    }

    constructor(protyle: IProtyle, embedNode: HTMLElement, top: number | null) {
        super(embedNode);
        // 在 DataView 销毁时，将 state 缓存到 sessionStorage 中
        this.disposers.push(() => this.saveToSessionStorage());

        this.protyle = protyle;
        this.thisEmbedNode = embedNode;
        this.top = top;
        this._element = document.createElement("div");
        this.lute = getLute();

        this._element.classList.add(styles["data-query-embed"], 'protyle-wysiwyg__embed');
        this._element.dataset.id = window.Lute.NewNodeID();

        this.thisEmbedNode.lastElementChild.insertAdjacentElement("beforebegin", this._element);

        this.ROOT_ID = this.protyle.block.rootID;
        this.EMBED_BLOCK_ID = embedNode.dataset.nodeId;

        this.register(this.markdown, { aliases: ['md'] });
        this.register(this.details, { aliases: ['Details', 'Detail'] });
        this.register(this.list, { aliases: ['BlockList'] });
        this.register(this.table, { aliases: ['BlockTable'] });
        // this.register(this.blockTable);
        this.register(this.columns, { aliases: ['Cols'] });
        this.register(this.rows);
        this.register(this.mermaid, { aliases: ['Mermaid'] });
        this.register(this.mermaidRelation);
        this.register(this.mermaidFlowchart, { aliases: ['mFlowchart'] });
        this.register(this.mermaidMindmap, { aliases: ['mMindmap'] });
        this.register(this.embed);
        this.register(this.echarts);
        this.register(this.echartsLine, { aliases: ['eLine'] });
        this.register(this.echartsBar, { aliases: ['eBar'] });
        this.register(this.echartsTree, { aliases: ['eTree'] });
        this.register(this.echartsGraph, { aliases: ['eGraph'] });

        this.registerCustomViews();
    }

    /** @internal */
    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        try {
            this.disposers.forEach(dispose => dispose());
        } catch (error) {
            console.error('Error during dispose:', error);
        } finally {
            this.disposers = [];
            this.cleanup();
        }
    }

    /**
     * @internal
     * 将 sessionStorage 中临时缓存的状态同步到块属性中
     * 仅仅在 Protyle 销毁等完全关闭的情况先调用
     */
    flushStateIntoBlockAttr() {
        if (!this.hasState) {
            return;
        }
        console.debug(`Flushing state into block attrs for ${this.root_id}::${this.embed_id}`);
        // this.removeFromSessionStorage(); //后面还可能调用 dispose, 所以 remove 方法就不放在这里, 单独调用好了
        this.saveToBlockDebounced();
    }

    /**
     * Repaint the embed block, essentially merely click the refresh button
     */
    repaint() {
        const button = this.thisEmbedNode.querySelector('div.protyle-icons > span.protyle-action__reload');
        if (button) {
            this.dispose();
            (button as HTMLButtonElement).click();
        }
    }

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
    useState<T>(key: string, initialValue?: T): IState<T> {
        return super.useState(key, initialValue);
    }

    /** @internal */
    private cleanup() {
        // 清理所有引用
        this.protyle = null;
        this.thisEmbedNode = null;
        this._element = null;
        this.lute = null;
        this.observer = null;
    }

    /**
     * Register a disposer function to be called when the DataView is disposed.
     * Only when you need to add some extra cleanup logic, you should use this method.
     * @param dispose The dispose function
     */
    addDisposer(dispose: () => void) {
        this.disposers.push(dispose);
    }

    adddisposer = this.addDisposer;

    /**
     * Add a custom element to the DataView.
     * @param customEle 
     * @returns 
     */
    addElement(customEle: HTMLElement | string) {
        const customElem = newViewWrapper();

        if (typeof customEle === 'string') {
            const html = `<div class="data-view-element" style="display: contents;">${customEle}</div>`;
            customElem.innerHTML = html;
        }
        else if (customEle instanceof Element) {
            customElem.appendChild(customEle);
        }

        this._element.append(customElem);
        return customElem;
    }

    addelement = this.addElement;
    addele = this.addElement;

    /**
     * Adds markdown content to the DataView
     * @param md - Markdown text to be rendered
     * @returns HTMLElement containing the rendered markdown
     * @example
     * dv.addmd(`# Hello`);
     */
    markdown(md: string) {
        let elem = newViewWrapper();
        elem.innerHTML = this.lute.Md2BlockDOM(md);
        return elem;
    }

    details(summary: string, content: string | HTMLElement) {
        const details: HTMLDetailsElement = newViewWrapper('details') as HTMLDetailsElement;
        details.innerHTML = `<summary>${summary}</summary>${typeof content === 'string' ? content : ''}`;
        if (content instanceof HTMLElement) {
            details.appendChild(content);
        }
        details.open = true;
        return details;
    }

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
    list(data: (IBlockWithChilds | ScalarValue)[], options: IListOptions<Block> = {}) {
        let defaultRenderer = (x: any) => {
            if (typeof x === 'object') {
                if (x.id && x.content) {
                    return `[${x?.fcontent || x.content}](siyuan://blocks/${x.id})`;
                } else {
                    return JSON.stringify(x);
                }
            }
            return x.toString();
        };

        const renderer = (val: any) => {
            return options?.renderer?.(val) ?? defaultRenderer(val);
        }

        // Recursive function to convert blocks to ListItem format
        const convertToListItem = (block: IBlockWithChilds) => ({
            name: renderer(block),
            children: block?.children?.map(convertToListItem)
        });

        // Convert blocks to ListItem format
        const listData = data.map(convertToListItem);

        let listContainer = newViewWrapper();
        const list = new BlockList({
            target: listContainer,
            dataList: listData,
            type: options.type ?? 'u'
        });
        if (options.columns) {
            list.element.style.columnCount = options.columns.toString();
        }
        return listContainer;
    }

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
        cols?: (string | Record<string, string>)[] | Record<string, string>
    }) {
        let tableContainer = newViewWrapper();
        options = options ?? {};
        const table = new BlockTable({
            target: tableContainer,
            blocks,
            cols: options?.cols,
            center: options.center ?? false,
            indices: options.index ?? false,
            renderer: options.renderer
        });
        if (options.fullwidth) {
            table.element.querySelector('table').style.width = '100%';
        }
        return tableContainer;
    }

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
    columns(elements: HTMLElement[], options: {
        gap?: string;
        flex?: number[];
    } = {}) {
        let columns = document.createElement("div");
        Object.assign(columns.style, {
            display: "flex",
            flexDirection: "row",
            gap: options.gap ?? '5px'
        });
        const flex = options.flex ?? Array(elements.length).fill(1);
        const column = (ele: HTMLElement, i: number) => {
            const div = document.createElement("div");
            Object.assign(div.style, {
                flex: flex[i]?.toString(),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                flexDirection: "column"
            });
            div.append(ele);
            return div;
        }

        elements.forEach((e, i) => columns.append(column(e, i)));
        return columns;
    }

    /**
     * Arranges elements in rows
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between rows; default is '5px'
     * @param options.flex - Flex ratio of each row; default is [1, 1, 1, ...]
     * @returns HTMLElement containing the row layout
     */
    rows(elements: HTMLElement[], options: {
        gap?: string;
        flex?: number[];
    } = {}) {
        let rows = document.createElement("div");
        Object.assign(rows.style, {
            display: "flex",
            flexDirection: "column",
            gap: options.gap ?? '5px'
        });
        const flex = options.flex ?? Array(elements.length).fill(1);
        elements.forEach((e, i) => {
            e.style.flex = flex[i].toString();
            rows.append(e);
        });
        return rows;
    }

    /**
     * Creates a Mermaid diagram from Mermaid code
     * @param code - Mermaid code
     * @returns HTMLElement containing the Mermaid diagram
     */
    mermaid(code: string) {
        let mermaidContainer = newViewWrapper();
        const mermaid = new MermaidBase(
            mermaidContainer,
            code
        );
        mermaid.render();
        this.disposers.push(() => mermaid.dispose());
        return mermaidContainer;
    }

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
    mermaidRelation(tree: IBlockWithChilds | Record<string, Block[]>, options: {
        type?: "flowchart" | "mindmap",
        flowchart?: 'TD' | 'LR',
        renderer?: (b: Block) => string;
    } = {}) {
        let mermaidContainer = newViewWrapper();
        if (!tree.id) {
            // 如果没有 id, 将 tree 视为 { parentname: Block[] } 的格式
            const oldTree = tree;
            // 将 Record<string, Block[]> 转换为 [ { name: string, children: IBlockWithChilds[] } ]
            const flattened = Object.entries(oldTree).map(([name, blocks]) => ({ name, children: blocks }));
            if (flattened.length === 1) {
                tree = flattened[0] as ITreeNode;
            } else {
                tree = { name: 'Root', children: flattened } as ITreeNode;
            }
        }

        const mermaid = new MermaidRelation({
            target: mermaidContainer,
            type: options.type ?? "flowchart",
            rootNode: tree as ITreeNode,
            renderer: options.renderer,  // undefined 也不要紧, 组件里有默认渲染方式
            flowchart: options.flowchart ?? 'LR'
        });
        this.disposers.push(() => mermaid.dispose());
        return mermaidContainer;
    }

    /**
     * Creates a Mermaid flowchart from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'flowchart' })`
     * @alias mflowchart
     */
    mermaidFlowchart(tree: IBlockWithChilds, options: {
        renderer?: (b: Block) => string;
    } = {}) {
        return this.mermaidRelation(tree, { ...options, type: 'flowchart' });
    }

    /**
     * Creates a Mermaid mindmap from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'mindmap' })`
     * @alias mmindmap
     */
    mermaidMindmap(tree: IBlockWithChilds, options: {
        renderer?: (b: Block) => string;
    } = {}) {
        return this.mermaidRelation(tree, { ...options, type: 'mindmap' });
    }

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
    }) {
        const container = newViewWrapper();

        if (!Array.isArray(blocks)) {
            blocks = [blocks];
        }

        new EmbedNodes({
            target: container, blocks,
            embedBlockID: this.EMBED_BLOCK_ID,
            ...options
        });
        return container;
    }

    /**
     * Creates a custom ECharts visualization
     * @param echartOption - ECharts configuration object, see {@link https://echarts.apache.org/handbook/en/get-started/} for more details
     * @param options - Configuration options
     * @param options.height - The height of the container, default as 300px
     * @param options.width - The width of the container, default as 100%
     * @param options.events - Event handlers for chart interactions; see {@link https://echarts.apache.org/handbook/en/concepts/event/} for more details
     * @returns HTMLElement containing the chart
     */
    echarts(echartOption: IEchartsOption, options: {
        height?: string,
        width?: string,
        events?: {
            [eventName: string]: (params: any) => void;
        }
    } = {}) {
        const container = newViewWrapper();

        const DEFAULT_COLOR = [getCSSVar('--b3-theme-primary'), '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
        echartOption.color = echartOption.color ?? DEFAULT_COLOR;

        const echarts = new Echarts({
            target: container,
            option: echartOption,
            ...options
        });
        this.disposers.push(() => echarts.dispose());

        return container;
    }

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
     * @alias eline
     */
    echartsLine(x: number[], y: number[] | number[][], options: {
        height?: string,
        width?: string,
        title?: string,
        xlabel?: string,
        ylabel?: string,
        legends?: string[],
        echartsOption?: IEchartsOption,
    } = {}) {
        const series = Array.isArray(y[0])
            ? y.map((line, i) => ({
                name: options.legends?.[i] ?? `Series ${i + 1}`,
                type: 'line',
                data: line,
            }))
            : [{
                type: 'line',
                data: y,
            }];

        const echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: x,
                name: options.xlabel,
            },
            yAxis: {
                type: 'value',
                name: options.ylabel,
            },
            series,
            ...options.echartsOption,
        };

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
        });
    }

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
     * @alias ebar
     */
    echartsBar(x: string[], y: number[] | number[][], options: {
        height?: string,
        width?: string,
        title?: string,
        xlabel?: string,
        ylabel?: string,
        legends?: string[],
        stack?: boolean,
        echartsOption?: IEchartsOption,
    } = {}) {
        const series = Array.isArray(y[0])
            ? y.map((bars, i) => ({
                name: options.legends?.[i] ?? '',
                type: 'bar',
                data: bars,
                stack: options.stack ? 'total' : undefined,
            }))
            : [{
                type: 'bar',
                data: y,
            }];

        const echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: x,
                name: options.xlabel,
            },
            yAxis: {
                type: 'value',
                name: options.ylabel,
            },
            series,
            ...options.echartsOption,
        };

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
        });
    }

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
     * @alias etree
     */
    echartsTree(data: ITreeNode, options: {
        height?: string,
        width?: string,
        title?: string,
        orient?: 'LR' | 'TB',
        nameRenderer?: (node: ITreeNode) => string,
        valueRenderer?: (node: ITreeNode) => string,
        symbolSize?: number,
        seriesOption?: IEchartsSeriesOption,
        echartsOption?: IEchartsOption,
    } = {}) {
        const defaultRenderer = (node: any) => {
            if (typeof node === 'string') return node;
            return node.name || node.fcontent || node.content || node.id;
        };
        const defaultValueRenderer = (node: any | Block) => {
            if (node.id && node.type && node.hpath) {
                return `<ul><li>${node.id}</li><li>${node.type}</li><li>${node.hpath}</li></ul>`;
            }
            return defaultRenderer(node);
        }

        const processData = (node: any) => {
            const processedNode = {
                name: options.nameRenderer?.(node) ?? defaultRenderer(node),
                value: options.valueRenderer?.(node) ?? defaultValueRenderer(node),
                children: (node.children || []).map(processData)
            };
            return processedNode;
        };
        data = processData(data);

        const echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    return params.value ?? params.name;
                }
            },
            series: [{
                type: 'tree',
                data: [data],
                orient: options.orient || 'TB',
                layout: 'orthogonal',
                symbolSize: options.symbolSize ?? 12,
                initialTreeDepth: -1,
                lineStyle: {
                    curveness: 0.5,
                    width: 2.5,
                    color: getCSSVar('--b3-theme-primary-light')
                },
                label: {
                    position: options.orient === 'LR' ? 'right' : 'top',
                    rotate: options.orient === 'LR' ? 0 : undefined,
                    verticalAlign: 'middle'
                },
                ...options.seriesOption
            }],
            ...options.echartsOption
        };

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
        });
    }

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
     * @alias egraph
     */
    echartsGraph(nodes: IGraphNode[], links: IGraphLink[], options: {
        height?: string,
        width?: string,
        title?: string,
        symbolSize?: number,
        renderer?: (node: IGraphNode) => string,
        nameRenderer?: (node: IGraphNode) => string,
        valueRenderer?: (node: IGraphNode) => string,
        seriesOption?: IEchartsSeriesOption,
        echartsOption?: IEchartsOption,
    } = {}) {
        const defaultNameRenderer = (node: any) => {
            if (typeof node === 'string') return node;
            return node.name || node.fcontent || node.content || node.id;
        }
        // const defaultValueRenderer = (node: any) => node?.value ?? options.nameRenderer?.(node);
        const defaultValueRenderer = (node: any) => {
            if (node.id && node.type && node.hpath) {
                return `${node.hpath}: ${node.type}`;
            }
            return options.nameRenderer?.(node) ?? defaultNameRenderer(node);
        }

        options.nameRenderer = options.nameRenderer || options.renderer;
        options.valueRenderer = options.valueRenderer || options.renderer;

        const graphNodes = nodes.map(node => ({
            id: node.id,
            name: options.nameRenderer?.(node) ?? defaultNameRenderer(node),
            symbolSize: options.symbolSize ?? 10,
            value: options.valueRenderer?.(node) ?? defaultValueRenderer(node)
        }));

        // 有向图
        const graphLinks = links.map(link => ({
            source: link.source,
            target: link.target,
            value: link.value,
            lineStyle: {
                type: 'solid',
                // 添加箭头配置
                symbol: ['none', 'arrow'],
                symbolSize: [10, 15],
                color: getCSSVar('--b3-theme-primary-light'),
                width: 2.5,
                ...(link.lineStyle ?? {})
            }
        }));

        const echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: {},
            animationDurationUpdate: 300,
            animationEasingUpdate: 'linear',
            series: [{
                type: 'graph',
                layout: 'force',
                data: graphNodes,
                links: graphLinks,
                roam: true,
                label: {
                    show: true,
                    position: 'right'
                },
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [4, 10],
                force: {
                    repulsion: 300,
                    gravity: 0.1,
                    edgeLength: 100,
                    layoutAnimation: false,
                    friction: 0.6
                },
                ...options.seriesOption
            }],
            ...options.echartsOption
        };

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
        });
    }

    /**
     * Renders the DataView and sets up event handlers and cleanup
     */
    render() {
        this.protyle.element.addEventListener("keydown", cancelKeyEvent, true);
        const rotateElement = this.thisEmbedNode.querySelector(".fn__rotate");

        if (rotateElement) {
            rotateElement.classList.remove("fn__rotate");
        }

        this._element.setAttribute("contenteditable", "false");
        this._element.onmousedown = (el) => { el.stopImmediatePropagation(); };
        this._element.onmouseup = (el) => { el.stopImmediatePropagation(); };
        this._element.onkeydown = (el) => { el.stopImmediatePropagation(); };
        this._element.onkeyup = (el) => { el.stopImmediatePropagation(); };
        this._element.oninput = (el) => { el.stopImmediatePropagation(); };
        this._element.onclick = (el) => {
            el.stopImmediatePropagation();
            // el.preventDefault(); //去掉, 不然 siyuan 链接无法点击跳转
            const target = el.target as HTMLElement;
            if (target.tagName === 'SPAN') {
                if (target.dataset.type === 'a') {
                    // 点击了链接、引用的时候跳转
                    const href = target.dataset.href;
                    if (href) {
                        const id = href.split('/').pop();
                        openBlock(id);
                    }
                } else if (target.dataset.type === 'block-ref') {
                    const id = target.dataset.id;
                    if (id) {
                        openBlock(id);
                    }
                }
            }
            const selection = window.getSelection();
            const length = selection.toString().length;
            if (length === 0 && (el.target as HTMLElement).tagName === "SPAN") {
                return;
            }
            // el.stopPropagation();
        };

        if (this.top) {
            // 前进后退定位 https://ld246.com/article/1667652729995
            // https://github.com/siyuan-note/siyuan/commit/5d736483ec80e1071b2f3eab4fcd64aac5856271
            this.protyle.contentElement.scrollTop = this.top;
        }

        // 确保内部节点不可编辑
        let editableNodeList = this._element.querySelectorAll('[contenteditable="true"]');
        editableNodeList.forEach(node => {
            node.setAttribute('contenteditable', 'false');
        });

        this.thisEmbedNode.style.height = "";

        /**
         * 不确定这个到底会不会造成 BUG 问题，现暂时关闭 #TODO
         */
        // let content = this.lute.BlockDOM2Content(this._element.innerText).replaceAll('\n', ' ');
        // fetchSyncPost('/api/search/updateEmbedBlock', {
        //     id: this.thisEmbedNode.getAttribute("data-node-id"),
        //     content: content
        // });

        /**
         * Garbage Collection Callbacks
         */
        this.disposers.push(() => {
            this.protyle.element.removeEventListener("keydown", cancelKeyEvent, true);
        });
        this.disposers.push(() => {
            this.protyle = null;
            this.thisEmbedNode = null;
            this._element = null;
            this.lute = null;
            this.disposers = [];
            this.observer = null;
        });

        // Garbage Collection on Document Closed
        registerProtyleGC(this.ROOT_ID, this);
        this.registerInternalGC();

        // setTimeout(() => {
        //     //不知道为啥嵌入块有时候在渲染完成后会被缩减高度
        //     //通过 setTimeout 在宏任务中恢复高度
        //     this.thisEmbedNode.style.height = "";
        // }, 0);
        //弃用, 后面再观察一下
    }

    /**
     * @internal
     * 注册内部的垃圾回收, 在嵌入块刷新的时候触发
     */
    private registerInternalGC(): void {
        // 注销 MutationObserver
        this.disposers.push(() => {
            console.debug('DataView dispose:', this.EMBED_BLOCK_ID);
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        });
        // Triggered on rerendered
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node === this._element) {
                            this.dispose();
                        }
                    });
                } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // Handle style changes here
                    // 😠 不知道怎么回事，思源老是乱改嵌入块的 height 属性, 导致嵌入块经常内容溢出到容器外
                    if (this.thisEmbedNode?.style?.height) {
                        this.thisEmbedNode.style.height = "";
                    }
                }
            });
        });

        this.observer.observe(this.thisEmbedNode, {
            childList: true,
            subtree: false,
            attributes: true,
            attributeFilter: ['style']  // 只监听 style 属性的变化
        });
    }
}

export const PROHIBIT_METHOD_NAMES = DataView.PROHIBIT_METHOD_NAMES;
