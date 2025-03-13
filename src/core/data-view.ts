/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-02 10:15:04
 * @FilePath     : /src/core/data-view.ts
 * @LastEditTime : 2025-03-13 19:30:50
 * @Description  : 
 */
import {
    IProtyle,
    fetchSyncPost,
    Lute
} from "siyuan";
import { getLute } from "./lute";
import { BlockList, BlockTable, BlockCards, MermaidRelation, MermaidKanban, EmbedNodes, Echarts, MarkdownComponent, errorMessage, MermaidBase } from './components';
import { registerProtyleGC } from "./finalize";
import { openBlock } from "@/utils";
import { getCustomView } from "./custom-view";
import UseStateMixin from "./use-state";

import styles from './index.module.scss';
import { matchIDFormat } from "./utils";
import { BlockTypeShort } from "@/utils/const";
import { deepMerge } from "./utils";
import { i18n } from "..";

const getCSSVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

const newViewWrapper = (tag: string = 'div') => {
    let div = document.createElement(tag);
    // 怀疑同步异常是 Lute 解析错误导致的，加一个 protyle-custom 不知道有没有用
    // https://github.com/88250/lute/issues/206
    div.classList.add(styles["data-view-component"], 'protyle-custom');
    const id = window.Lute.NewNodeID();
    div.dataset.id = id;
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
    // private disposers: (() => void)[] = [];
    private disposers: Record<string, () => void> = {};

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
            // this._element.append(result);
            // return result;
            let container = this.addElement(result);
            return container;
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
                    this.addDisposer(() => dispose(), container.dataset.id);
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
            // console.debug(`Custom view ${name} registered`);
        });
    }

    /**
     * The id of the root document
     */
    get root_id() {
        return this.ROOT_ID;
    }

    /**
     * The id of the embed block
     */
    get embed_id() {
        return this.EMBED_BLOCK_ID;
    }

    constructor(protyle: IProtyle, embedNode: HTMLElement, top: number | null) {
        super(embedNode);
        // 在 DataView 销毁时，将 state 缓存到 sessionStorage 中
        // 不知道为啥这个会导致写入旧的状态，搞不懂..先去掉吧
        /**@example
         * //!js
            const dv = Query.DataView(protyle, item, top);
            const cnt = dv.useState('counter', 1);
            dv.addmd(`${cnt()} --> ${cnt() + 1}`);
            cnt.value += 1;
            dv.render();
         */
        //#NOTE 可能是 MutationObserver 引用了旧的闭包，使用了旧版的 this，所以就不再 dispose 里面保存状态了
        // this.disposers.push(() => this.saveToSessionStorage());

        this.protyle = protyle;
        this.thisEmbedNode = embedNode;
        this.top = top;
        this._element = document.createElement("div");
        this.lute = getLute();

        this._element.classList.add(styles["data-query-embed"], 'protyle-custom');
        /** 
         * 加了这一行有时候会出现 getBlockInfo 的问题, 样例:
            //!js
            let dv = Query.DataView(protyle, item, top);
            const state = dv.useState('counter', 1);
            const button = document.createElement('button');
            button.textContent = '+1';
            button.onclick = (e) => {
                state.value += 1;
                dv.repaint();
            }
            dv.addcols([button, dv.md(`State = ${state()}`)]);

            dv.render();
         */
        // this._element.classList.add('protyle-wysiwyg__embed');
        this._element.dataset.id = window.Lute.NewNodeID();

        this.thisEmbedNode.lastElementChild.insertAdjacentElement("beforebegin", this._element);

        this.ROOT_ID = this.protyle.block.rootID;
        this.EMBED_BLOCK_ID = embedNode.dataset.nodeId;

        this.register(this.markdown, { aliases: ['md'] });
        this.register(this.details, { aliases: ['Details', 'Detail'] });
        this.register(this.list, { aliases: ['BlockList'] });
        this.register(this.table, { aliases: ['BlockTable'] });
        this.register(this.cards, { aliases: ['card'] });
        // this.register(this.blockTable);
        this.register(this.columns, { aliases: ['Cols'] });
        this.register(this.rows);
        this.register(this.mermaid, { aliases: ['Mermaid'] });
        this.register(this.mermaidRelation);
        this.register(this.mermaidFlowchart, { aliases: ['mFlowchart'] });
        this.register(this.mermaidMindmap, { aliases: ['mMindmap'] });
        this.register(this.mermaidKanban, { aliases: ['mKanban'] });
        this.register(this.embed);
        this.register(this.echarts);
        this.register(this.echartsLine, { aliases: ['eLine'] });
        this.register(this.echartsBar, { aliases: ['eBar'] });
        this.register(this.echartsTree, { aliases: ['eTree'] });
        this.register(this.echartsGraph, { aliases: ['eGraph'] });
        this.register(this.details, { aliases: ['Detail'] });

        this.registerCustomViews();
    }

    /** @internal */
    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        try {
            for (let key in this.disposers) {
                const disposer = this.disposers[key];
                disposer();
            }
        } catch (error) {
            console.error('Error during dispose:', error);
        } finally {
            // this.disposers = [];
            this.disposers = {};
            this.cleanup();
        }
    }

    /**
     * @internal
     * 将 sessionStorage 中临时缓存的状态同步到块属性中
     * 仅仅在 Protyle 销毁等完全关闭的情况先调用
     */
    async flushStateIntoBlockAttr() {
        if (!this.hasState) {
            return;
        }
        console.debug(`Flushing state into block attrs for ${this.root_id}::${this.embed_id}`);
        // this.saveToBlockDebounced();
        //必须 await，否则在 reload, 关闭窗口的时候可能还没写入 kernel 就直接退出了
        await this.saveToBlockAttrs();
    }

    /**
     * Repaint the embed block, essentially merely click the reload button
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
    addDisposer(dispose: () => void, id?: string) {
        // this.disposers.push(dispose, key);
        id = id ?? window.Lute.NewNodeID();
        if (this.disposers[id]) {
            const oldDiposer = this.disposers[id];
            oldDiposer();
            console.warn(`WARNING! Disposer with key@${id} has already registered!`)
        }
        this.disposers[id] = dispose;
    }
    /** @internal */
    adddisposer = this.addDisposer;

    /**
     * Wrap an element into a view container
     * @param ele 
     */
    view(ele: HTMLElement | string) {
        let view: HTMLElement;
        if (typeof ele === 'string') {
            view = newViewWrapper();
            const html = `<div class="data-view-element" style="display: contents;">${ele}</div>`;
            view.innerHTML = html;
        }
        else if (ele instanceof Element) {
            // 如果本身就是一个 view-container, 就直接加入
            if (this.isValidViewContainer(ele)) {
                view = ele;
            } else {
                view = newViewWrapper();
                view.appendChild(ele);
            }
        }
        return view;
    }

    /**
     * Add a custom element to the DataView.
     * If the passing is a view container, it will be directly appended.
     * Otherwise, it will be wrapped by a new container
     * @param ele
     * @param disposer -- dispose function, optional
     * @returns View Conainer, with a special class name, and a `data-id` attribute
     * @alias addele
     */
    addElement(ele: HTMLElement | string, disposer?: () => void) {
        let customView = this.view(ele);
        this._element.append(customView);
        if (disposer) {
            const id = customView.dataset.id;
            this.addDisposer(disposer, id);
        }
        return customView;
    }
    /** @internal */
    addView = this.addElement;
    /** @internal */
    addelement = this.addElement;
    /** @internal */
    addele = this.addElement;

    isValidViewContainer(container: HTMLElement) {
        if (!container.classList.contains(styles["data-view-component"])) {
            return false;
        }
        const id = container.dataset.id;
        if (!id || !matchIDFormat(id)) {
            return false;
        }
        return true;
    }

    /**
     * Remove the view element (by given the id of the container) from dataview
     * @param id Existed view's data-id
     * @param beforeRemove, an optional callback funcgtion
     * @returns Whether the removal succeeded
     */
    removeView(id: string, beforeRemove?: (viewContainer: HTMLElement) => void) {
        if (!id) return false;
        const selector = `.${styles["data-view-component"]}[data-id="${id}"]`;
        const container: HTMLElement = this._element.querySelector(selector);
        if (container && this.isValidViewContainer(container)) {
            const disposer = this.disposers[id];
            if (disposer) {
                disposer();
                delete this.disposers[id];
            }
            beforeRemove?.(container);
            container.remove();
            return true;
        }
        return false;
    }

    removeview = this.removeView;

    /**
     * Replace the view element (by given the id of the container) with another given element
     * @param id
     * @param viewContainer: must be a conatiner element
     * @param disposer: dispose functioin, if already specified for viewContainer, this one will be omit!.
     * @warn Don not duplicately specify dispose function for new view!
     * @returns
     */
    replaceView(id: string, viewContainer: HTMLElement, disposer?: () => void) {
        if (!id) return null;
        viewContainer = this.view(viewContainer);

        let flag = this.removeView(id, (oldView: HTMLElement) => {
            oldView.insertAdjacentElement('beforebegin', viewContainer);
        });
        if (!flag) {
            errorMessage(viewContainer, `Failed to replace view with ID=${id}, please check if anything wrong.`)
            this._element.append(viewContainer);
            return;
        }
        delete this.disposers[id];
        /**
         * 替换为旧的 ID
         */
        let oldId = viewContainer.dataset.id;
        // if old disposer already exists, update the id of it.
        if (this.disposers[oldId]) {
            this.disposers[id] = this.disposers[oldId];
            delete this.disposers[oldId];
        }
        if (disposer) {
            const oldDisposer = this.disposers[id];
            if (oldDisposer) {
                this.disposers[id] = () => {
                    oldDisposer();
                    disposer();
                }
            } else {
                this.disposers[id] = disposer;
            }
        }
        viewContainer.dataset.id = id;
        return viewContainer;
    }
    replaceview = this.replaceView;

    /**
     * Adds markdown content to the DataView
     * @param md - Markdown text to be rendered
     * @returns HTMLElement containing the rendered markdown
     * @example
     * dv.addmd(`# Hello`);
     */
    markdown(md: string) {
        let elem = newViewWrapper();
        new MarkdownComponent({ target: elem, markdown: md });
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
                if (x.id && matchIDFormat(x.id)) {
                    if (x.type === 'c' || x.type === 'query_embed') {
                        return `[${BlockTypeShort[x.type]}](siyuan://blocks/${x.id})`;
                    }
                    let text = x?.fcontent || x.content || "";
                    if (text !== "") {
                        return `[${text}](siyuan://blocks/${x.id})`;
                    } else {
                        return `[${i18n.src_core_dataviewts.blank}${BlockTypeShort[x.type]}](siyuan://blocks/${x.id})`;
                    }
                } else {
                    return JSON.stringify(x);
                }
            }
            return x.toString();
        };

        const renderer = (val: any) => {
            return options?.renderer?.(val, defaultRenderer) ?? defaultRenderer(val);
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
     * @param options.renderer - Custom function to render table cells
     *       - The return will be used as markdown code, and insert into each td cell
     *       - If returns `null`, the default renderer will be used
     *       - SPECIAL USAGE: if the returned string is wrapped with {@html ...}, it will be treated as HTML code
     * @returns HTMLElement containing the block table
     * @example
     * const children = await Query.childdoc(block);
     * dv.addtable(children, { cols: ['type', 'content'] , fullwidth: true });
     */
    table(blocks: Block[], options?: ITableOptions) {
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
        tableContainer.style.overflowX = 'auto';
        return tableContainer;
    }

    /**
     * Creates a card view for displaying blocks
     * @param blocks - Array of Block objects to display
     * @param options - Configuration options
     * @param options.cardWidth - Width of each card; default is '300px'
     * @param options.fontSize - Base font size for the cards; default is '14px'
     * @returns HTMLElement containing the card layout
     * @example
     * const children = await Query.childdoc(block);
     * dv.cards(children, { cardWidth: '250px', fontSize: '16px' });
     */
    cards(blocks: Block[], options?: ICardsOptions) {
        const cardsContainer = newViewWrapper();
        const cards = new BlockCards({
            target: cardsContainer,
            blocks,
            ...options
        });
        cardsContainer.style.overflowX = 'auto';
        return cardsContainer;
    }

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
    columns(elements: HTMLElement[], options: {
        gap?: string;
        flex?: number[];
        minWidth?: string | number
    } = {}) {
        const container = newViewWrapper();

        const asWidth = (width: string | number) => {
            if (typeof width === 'number') {
                return `${width}px`;
            }
            return width;
        }
        const columns = document.createElement('div');
        columns.classList.add(styles['columns']);
        options?.gap && columns.style.setProperty('--col-gap', options.gap);
        options?.minWidth && columns.style.setProperty('--col-min-width', asWidth(options.minWidth));

        const flex = options.flex ?? Array(elements.length).fill(1);
        const column = (ele: HTMLElement, i: number) => {
            ele.classList.add(styles['column']);
            flex[i] !== 1 && columns.style.setProperty('--flex-grow', flex[i]);
            return ele;
        }

        elements.forEach((e, i) => columns.append(column(e, i)));

        container.append(columns)
        container.style.overflowX = 'auto';
        return container;
    }

    /**
     * Arranges elements in rows
     * @param elements - Array of HTMLElements to arrange
     * @param options - Configuration options
     * @param options.gap - Style of gap between rows; default is '5px'
     * @param options.maxHeight - Maximum height of the container; default not set
     * @param options.flex - Flex ratio of each row; default not set
     * @returns HTMLElement containing the row layout
     */
    rows(elements: HTMLElement[], options: {
        gap?: string;
        maxHeight?: string;
        flex?: number[];
    } = {}) {
        const container = newViewWrapper();

        const rows = document.createElement('div');
        rows.classList.add(styles['rows']);
        options?.gap && rows.style.setProperty('--row-gap', options.gap);

        const asHeight = (height: string | number) => {
            if (typeof height === 'number') {
                return `${height}px`;
            }
            return height;
        }

        options?.maxHeight && rows.style.setProperty('max-height', asHeight(options.maxHeight));


        const row = (ele: HTMLElement, i: number) => {
            ele.classList.add(styles['row']);
            //@ts-ignore
            options?.flex?.[i] && ele.style.setProperty('--flex-grow', options.flex[i]);
            return ele;
        }

        elements.forEach((e, i) => rows.append(row(e, i)));
        container.appendChild(rows);
        return container;
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
        this.addDisposer(() => mermaid.dispose(), mermaidContainer.dataset.id);
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
        this.addDisposer(() => mermaid.dispose(), mermaidContainer.dataset.id);
        return mermaidContainer;
    }

    /**
     * Creates a Mermaid flowchart from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'flowchart' })`
     * @alias mFlowchart
     */
    mermaidFlowchart(tree: IBlockWithChilds, options: {
        renderer?: (b: Block) => string;
    } = {}) {
        return this.mermaidRelation(tree, { ...options, type: 'flowchart' });
    }

    /**
     * Creates a Mermaid mindmap from block relationships
     * @description Equivalent to `dv.mermaidRelation(tree, { type: 'mindmap' })`
     * @alias mMindmap
     */
    mermaidMindmap(tree: IBlockWithChilds, options: {
        renderer?: (b: Block) => string;
    } = {}) {
        return this.mermaidRelation(tree, { ...options, type: 'mindmap' });
    }

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
        priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low',
        clip?: number,
        width?: string
    }) {
        let mermaidContainer = newViewWrapper();
        Object.assign(mermaidContainer.style, {
            'overflow-x': 'auto'
        });

        const mermaid = new MermaidKanban({
            target: mermaidContainer,
            groupedBlocks,
            ...options
        });
        this.addDisposer(() => mermaid.dispose(), mermaidContainer.dataset.id);
        return mermaidContainer;
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
     * @param echartOption - ECharts configuration object, see {@link https://echarts.apache.org/zh/option.html#title} for more details
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
        this.addDisposer(() => echarts.dispose(), container.dataset.id);

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
     * @param options.seriesOption - Additional series configuration. See {@link https://echarts.apache.org/zh/option.html#series-line} for more details
     * @param options.echartsOption - Additional ECharts configuration. See {@link https://echarts.apache.org/zh/option.html#title} for more details
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
        seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[],
        echartsOption?: IEchartsOption,
    } = {}) {

        const getSeriesOption = (i?: number) => {
            if (options.seriesOption === undefined) {
                return {};
            }
            if (Array.isArray(options.seriesOption)) {
                return options.seriesOption[i ?? 0];
            }
            return options.seriesOption;
        }

        const series = Array.isArray(y[0])
            ? y.map((line, i) => ({
                name: options.legends?.[i] ?? `Series ${i + 1}`,
                type: 'line',
                data: line,
                ...getSeriesOption(i),
            }))
            : [{
                type: 'line',
                data: y,
                ...getSeriesOption(),
            }];

        let echartOption = {
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
        };

        // Deep merge with user options
        echartOption = deepMerge(echartOption, options.echartsOption);

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
     * @param options.seriesOption - Additional series configuration. See {@link https://echarts.apache.org/zh/option.html#series-bar} for more details
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
        seriesOption?: IEchartsSeriesOption | IEchartsSeriesOption[],
        echartsOption?: IEchartsOption,
    } = {}) {

        const getSeriesOption = (i?: number) => {
            if (options.seriesOption === undefined) {
                return {};
            }
            if (Array.isArray(options.seriesOption)) {
                return options.seriesOption[i ?? 0];
            }
            return options.seriesOption;
        }

        const series = Array.isArray(y[0])
            ? y.map((bars, i) => ({
                name: options.legends?.[i] ?? '',
                type: 'bar',
                data: bars,
                stack: options.stack ? 'total' : undefined,
                ...getSeriesOption(i),
            }))
            : [{
                type: 'bar',
                data: y,
                ...getSeriesOption(),
            }];

        let echartOption = {
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
        };
        // Deep merge with user options
        echartOption = deepMerge(echartOption, options.echartsOption);

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
        });
    }

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
    echartsTree(data: ITreeNode, options: {
        height?: string,
        width?: string,
        title?: string,
        orient?: 'LR' | 'TB',
        layout?: 'orthogonal' | 'radial',
        roam?: boolean | 'scale' | 'move',
        symbolSize?: number,
        labelFontSize?: number,
        // nameRenderer?: (node: ITreeNode) => string,
        nodeRenderer?: (node: IGraphNode) => {
            name?: string;
            value?: any;
            [key: string]: any;
        },
        tooltipFormatter?: (node: ITreeNode) => string,
        seriesOption?: IEchartsSeriesOption,
        echartsOption?: IEchartsOption,
    } = {}) {
        const defaultNameRenderer = (node: any) => {
            if (typeof node === 'string') return node;
            return node.name || node.fcontent || node.content || node.id;
        }


        const defaultValueRenderer = (node: any) => {
            if (typeof node === 'string') return node;
            const value = { ...node };
            if (value.children) {
                value.children = value.children.length;
            }
            return value;
        }

        const valueFormatter = (node: any | Block) => {
            if (node.id && node.type && node.hpath) {
                const boxName = node.box ? globalThis.Query.Utils.boxname(node.box) : '';
                return `<ul style="list-style-type: none; margin: 0; padding: 0;">
                <li class="block-id popover__block" data-id="${node.id}">
                    <a href="siyuan://blocks/${node.id}">${node.id}</a>
                </li>
                <li class="block-type">${BlockTypeShort[node.type] ?? node.type}</li>
                <li class="block-hpath">${boxName ? `[${boxName}] ` : ''}${node.hpath}</li>
                </ul>`;
            } else if (node.value) {
                return node.value;
            }
            return JSON.stringify(node);
        }

        const processData = (node: any) => {
            let processedNode = {
                id: node.id,
                name: defaultNameRenderer(node),
                value: defaultValueRenderer(node),
                children: (node.children || []).map(processData)
            };
            if (options.nodeRenderer) {
                let rendered = options.nodeRenderer(processedNode);
                processedNode = { ...processedNode, ...rendered };
            }
            return processedNode;
        };

        const getSeries = (root: ITreeNode, index?: number) => {
            const data = processData(root);
            let series = {
                type: 'tree',
                name: `Series ${index ?? 0}`,
                roam: options.roam ?? false,
                data: [data],
                orient: options.orient || 'TB',
                layout: 'orthogonal',
                symbolSize: options.symbolSize ?? 14,
                initialTreeDepth: -1,
                lineStyle: {
                    curveness: 0.5,
                    width: 2.5,
                    color: getCSSVar('--b3-theme-primary-light')
                },
                label: {
                    position: options.orient === 'LR' ? 'right' : 'top',
                    rotate: options.orient === 'LR' ? 0 : undefined,
                    verticalAlign: 'middle',
                    fontSize: options.labelFontSize ?? 16
                }
            };
            return deepMerge(series, options.seriesOption);
        }

        const series = [getSeries(data)];

        let echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: {
                trigger: 'item',
                // show: true,
                enterable: true,
                alwaysShowContent: true,
                formatter: (params: any) => {
                    if (options.tooltipFormatter) {
                        return options.tooltipFormatter(params.value);
                    }
                    return valueFormatter(params.value) ?? params.name;
                }
            },
            series: series,
        };
        // Deep merge with user options
        echartOption = deepMerge(echartOption, options.echartsOption);

        const events = {
            'click': (params: any) => {
                const value = params.value;
                const event = params.event?.event;
                const isCtrl = event.ctrlKey || event.metaKey;
                // Ctrl + 点击 打开块
                if (value.id && matchIDFormat(value.id) && isCtrl) {
                    // 阻止事件冒泡和默认行为
                    // params.event.cancelBubble = true;
                    // params.event.stop();
                    // params.event.event.preventDefault?.();
                    openBlock(value.id);
                }
            }
        }

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
            events
        });
    }

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
    echartsGraph(nodes: (IGraphNode | Block)[], links: IGraphLink[], options: {
        height?: string,
        width?: string,
        title?: string,
        layout?: 'force' | 'circular',
        roam?: boolean,
        symbolSize?: number,
        labelFontSize?: number,
        nodeRenderer?: (node: IGraphNode) => {
            name?: string;
            value?: any;
            category?: number;
            [key: string]: any;
        },
        tooltipFormatter?: (node: IGraphNode) => string,
        seriesOption?: IEchartsSeriesOption,
        echartsOption?: IEchartsOption,
    } = {}) {
        const defaultNameRenderer = (node: any) => {
            if (typeof node === 'string') return node;
            return node.name || node.fcontent || node.content || node.id;
        }

        const valueFormatter = (value: string) => {
            let node = JSON.parse(value);
            if (node.id && node.type && node.hpath) {
                const boxName = node.box ? globalThis.Query.Utils.boxname(node.box) : '';
                return `<ul style="list-style-type: none; margin: 0; padding: 0;">
                <li class="block-id popover__block" data-id="${node.id}">
                    <a href="siyuan://blocks/${node.id}">${node.id}</a>
                </li>
                <li class="block-type">${BlockTypeShort[node.type] ?? node.type}</li>
                <li class="block-hpath">${boxName ? `[${boxName}] ` : ''}${node.hpath}</li>
                </ul>`;
            } else if (node.value) {
                return node.value;
            }
            return value;
        }

        const graphNodes = nodes.map(node => {
            let config = {
                name: defaultNameRenderer(node),
                //@ts-ignore
                value: node?.value ?? JSON.stringify({
                    id: node.id,
                    name: node.name,
                    type: node.type,
                    hpath: node.hpath,
                    box: node.box
                }),
            }
            node = { ...node, ...config };
            if (options.nodeRenderer) {
                let rendered = options.nodeRenderer(node);
                node = { ...node, ...rendered };
            }
            return node;
        });

        // 有向图
        const graphLinks = [];
        const lineStyle = {
            type: 'solid',
            // 添加箭头配置
            symbol: ['none', 'arrow'],
            symbolSize: [10, 15],
            color: getCSSVar('--b3-theme-primary-light'),
            width: 2.5
        };
        for (const link of links) {
            const source = link.source;
            const targets = link.target;
            delete link.source;
            delete link.target;
            if (Array.isArray(targets)) {
                for (const target of targets) {
                    graphLinks.push({ source, target, lineStyle, ...link });
                }
            } else {
                graphLinks.push({ source, target: targets, lineStyle, ...link });
            }
        }

        let series = {
            type: 'graph',
            layout: options.layout ?? 'force',
            data: graphNodes,
            links: graphLinks,
            roam: options.roam ?? false,
            symbolSize: options.symbolSize ?? 14,
            label: {
                show: true,
                position: 'bottom',
                fontSize: options.labelFontSize ?? 16
            },
            emphasis: {
                focus: 'adjacency', // 高亮相邻节点
                itemStyle: {
                    borderWidth: 2,
                    borderColor: getCSSVar('--b3-theme-primary'),
                    shadowBlur: 10,
                    shadowColor: getCSSVar('--b3-theme-primary-lighter')
                },
                lineStyle: {
                    width: 4
                },
                label: {
                    fontSize: (options.labelFontSize ?? 16) + 2 // 字体稍微大一点
                }
            },
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [4, 10],
            force: {
                repulsion: 200,
                gravity: 0.1,
                edgeLength: 100,
                layoutAnimation: false
            },
        };
        // Deep merge with user options
        series = deepMerge(series, options.seriesOption);

        let echartOption = {
            title: options.title ? { text: options.title } : undefined,
            tooltip: {
                trigger: 'item',
                enterable: true,
                alwaysShowContent: true,
                formatter: (params: any) => {
                    if (options.tooltipFormatter) {
                        return options.tooltipFormatter(params.value);
                    }
                    return valueFormatter(params.value) ?? params.name;
                }
            },
            animationDurationUpdate: 300,
            animationEasingUpdate: 'linear',
            series: [series],
        };
        // Deep merge with user options
        echartOption = deepMerge(echartOption, options.echartsOption);

        const events = {
            'click': (params: any) => {
                const value = params.value;
                const event = params.event?.event;
                const isCtrl = event.ctrlKey || event.metaKey;
                // Ctrl + 点击 打开块
                if (isCtrl) {
                    let block = JSON.parse(value);
                    if (block.id && matchIDFormat(block.id)) {
                        openBlock(block.id);
                    }
                }
            }
        }

        return this.echarts(echartOption, {
            height: options.height,
            width: options.width,
            events
        });
    }

    /**
     * Renders the DataView and sets up event handlers and cleanup
     */
    render() {
        const rotateElement = this.thisEmbedNode.querySelector(".fn__rotate");

        if (rotateElement) {
            rotateElement.classList.remove("fn__rotate");
        }

        this._element.setAttribute("contenteditable", "false");

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

        let content = this.lute.BlockDOM2Content(this._element.innerText).replaceAll('\n', ' ');
        fetchSyncPost('/api/search/updateEmbedBlock', {
            id: this.thisEmbedNode.getAttribute("data-node-id"),
            content: content
        });

        const stopPropagation = (e: Event) => {
            e.stopImmediatePropagation();
        }

        const oncapture = undefined;

        const EVENTS_TO_STOP = [
            'compositionstart',  //如果不加这两个会无法正常输入中文
            'compositionend',
            'mousedown',
            'mouseup',
            'keydown',
            'keyup',
            'input',
            'copy',
            'cut',
            'paste'
        ];

        EVENTS_TO_STOP.forEach(event => {
            this._element.addEventListener(event, stopPropagation, oncapture);
        });


        this._element.onclick = (el) => {
            // el.preventDefault(); //去掉, 否则 siyuan 链接 a 无法点击跳转
            const target = el.target as HTMLElement;
            if (target.tagName === 'SPAN') {
                if (target.dataset.type === 'a' || target.dataset.type.split(' ').includes('a')) {
                    // 点击了链接、引用的时候跳转
                    const href = target.dataset.href;
                    if (href) {
                        return;
                    }
                } else if (target.dataset.type === 'block-ref') {
                    const id = target.dataset.id;
                    if (id) {
                        return;
                    }
                }
            }
            el.stopImmediatePropagation();
            const selection = window.getSelection();
            const length = selection.toString().length;
            if (length === 0 && (el.target as HTMLElement).tagName === "SPAN") {
                return;
            }
            // el.stopPropagation();
        };
        this.protyle.element.addEventListener("keydown", cancelKeyEvent, true);

        /**
         * Garbage Collection Callbacks
         */
        this.addDisposer(() => {
            this.protyle.element.removeEventListener("keydown", cancelKeyEvent, true);
            EVENTS_TO_STOP.forEach(event => {
                this._element.removeEventListener(event, stopPropagation, oncapture);
            });
            this._element.onclick = null;
            this.thisEmbedNode = null;
            this._element = null;
            this.protyle = null;
            this.observer = null;
        });

        // Garbage Collection on Document Closed
        registerProtyleGC(this.ROOT_ID, this);
        this.registerInternalGC();

        // setTimeout(() => {
        //     //不知道为啥嵌入块有时候在渲染完成后会被缩减高度
        //     //通过 setTimeout 在宏任务中恢复度
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
        this.addDisposer(() => {
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
                        if (node instanceof Element &&
                            node.classList.contains(styles["data-query-embed"])) {
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

/**************************************** ZX写的 DataView 类 ****************************************/
const selector = `.${styles["data-query-embed"]}`;
function cancelKeyEvent(event: KeyboardEvent) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let nodeElement: HTMLElement = selection.getRangeAt(0).startContainer.parentElement;
    let closest = nodeElement.closest(selector);
    if (closest) {
        // console.log('Stop');
        event.stopPropagation();
    }
    // if (nodeElement.closest(selector)) {
    // const stop = hasParentWithClass(nodeElement, selector)
    // if (stop) {
    //     el.stopImmediatePropagation();
    // }
}

function hasParentWithClass(element: Element, className: string) {
    if (!element) return false;
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

export const PROHIBIT_METHOD_NAMES = DataView.PROHIBIT_METHOD_NAMES;
