import { formatDateTime, sy2Date } from "@/utils/time";
import { BlockTypeShort } from "@/utils/const";
import { getNotebook } from "@/utils";
import { getLute } from "./lute";
import { request } from "@/api";

import { Constants, Lute, showMessage } from "siyuan";
import { addScript, matchIDFormat } from "./utils";
import './index.css';

import { i18n } from "@/index";
import { deprecate } from "util";


/**
 * Renders the value of a block attribute as markdown format
 * @param b - Block object
 * @param attr - Attribute name
 * @returns Rendered attribute value
 */
const renderAttr = (b: Block, attr: keyof Block, options?: {
    onlyDate?: boolean;
    onlyTime?: boolean;
}): string => {
    let v: string | number = '';

    const link = (title: string, id: BlockId) => `[${title}](siyuan://blocks/${id})`;
    const parseTime = (dt: string) => {
        let date = sy2Date(dt);
        if (options?.onlyDate) {
            return formatDateTime('yyyy-MM-dd', date);
        } else if (options?.onlyTime) {
            return formatDateTime('HH:mm:ss', date);
        } else {
            return formatDateTime('yyyy-MM-dd HH:mm:ss', date);
        }
    }

    const docName = () => {
        let hpath = b.hpath;
        let idx = hpath.lastIndexOf('/');
        let docname = hpath.substring(idx + 1);
        return docname;
    }

    switch (attr) {
        case 'type':
            const type = BlockTypeShort[b.type].slice(0, -1);
            v = link(type, b.id);
            break;

        case 'id':
            v = link(b.id, b.id);
            break;

        case 'root_id':
            v = link(docName(), b.root_id);
            break;

        case 'hpath':
            v = link(b.hpath, b.root_id);
            break;

        case 'content':
            v = b.fcontent || b.content
            break;

        case 'box':
            let notebook = getNotebook(b.box);
            v = notebook.name;
            break;

        case 'updated':
        case 'created':
            v = parseTime(b[attr]);
            break;

        default:
            v = b[attr];
            break;
    }
    return v.toString();
}


/**************************************** 重构几个默认显示组件 ****************************************/

const errorMessage = (element: HTMLElement, message: string) => {
    element.innerHTML = `<span style="color: var(--b3-card-error-color);background-color: var(--b3-card-error-background);">${message}</span>`;
}


type ListItem = string | number | {
    name: string | number;
    children?: ListItem[];
}

/**
 * Markdown 列表组件
 */
class BlockList {
    element: HTMLElement;
    dataList: ListItem[];
    type: 'u' | 'o' = 'u';

    constructor(options: { target: HTMLElement, dataList: ListItem[], type?: 'u' | 'o' }) {
        this.element = options.target;
        this.dataList = options.dataList;
        this.type = options.type ?? 'u';
        this.render();
    }

    private itemToString(item: ListItem, depth: number = 0, index: number = 1): string[] {
        const indent = "    ".repeat(depth); // 4 spaces per level
        const prefix = this.type === 'u' ? "*" : `${index}.`;

        if (typeof item === 'string' || typeof item === 'number' || !item.name) {
            return [`${indent}${prefix} ${item.toString()}`];
        }

        const lines: string[] = [`${indent}${prefix} ${item.name.toString()}`];

        if (item.children?.length) {
            item.children.forEach((child, idx) => {
                lines.push(...this.itemToString(child, depth + 1, idx + 1));
            });
        }

        return lines;
    }

    render() {
        const lute = getLute();
        let lines: string[] = [];

        this.dataList.forEach((item, idx) => {
            lines.push(...this.itemToString(item, 0, idx + 1));
        });

        const mdStr = lines.join("\n");
        const html = lute.Md2BlockDOM(mdStr);

        this.element.innerHTML = `<div>${html}</div>`;
    }
}


const DEFAULT_COLS = ['type', 'content', 'hpath', 'box'];

class BlockTable {
    element: HTMLElement;
    tableData: ScalarValue[][];
    private center: boolean;
    private indices: boolean;

    private adaptColumnInput(options: { cols?: any, blocks: Block[] }) {
        const { cols, blocks } = options;
        let colKey: any[] = [];
        let colName: string[] = [];
        if (cols === undefined) {
            /**未指定 columns 时, 使用默认的 columns */
            colKey = this.fallbckColumns(blocks);
            colName = colKey;
            return { key: colKey, name: colName };
        } else if (cols === null && blocks.length > 0) {
            // 如果 col 为 null，则使用 blocks 里面的所有 key
            const firstBlock = blocks[0];
            colKey = Object.keys(firstBlock);
            colName = colKey;
            return { key: colKey, name: colName };
        }
        else if (Array.isArray(options.cols)) {
            colKey = [];
            options.cols.forEach((c, index) => {
                if (typeof c === 'string') {
                    colKey.push(c);
                    colName.push(c);
                } else {
                    // 只有一个的情况 { colkey: colname}
                    if (Object.keys(c).length === 1) {
                        colKey.push(Object.keys(c)[0]);
                        //@ts-ignore
                        colName.push(Object.values(c)[0]);
                    } else {
                        errorMessage(this.element, 'Invalid column definition');
                        return;
                    }
                }
            });
        } else if (typeof options.cols === 'object') {
            colKey = Object.keys(options.cols);
            colName = Object.values(options.cols);
        } else {
            errorMessage(this.element, 'Invalid column definition');
            return;
        }
        return { key: colKey, name: colName };
    }

    /**
     * 输入的不一定是完整的 Block，甚至可能都不是 block
     * @param columns 
     * @param blocks 
     * @returns 
     */
    private fallbckColumns(blocks: Block[]) {
        if (blocks.length === 0) return DEFAULT_COLS; //反正空表格，返回什么都无所谓
        const firstRow: Record<string | number, ScalarValue> = blocks[0];
        const keys = Object.keys(firstRow);
        // 计算交集
        const intersect = DEFAULT_COLS.filter(c => keys.includes(c));
        // 如果包含了所有的默认列，则返回默认列
        if (intersect.length === DEFAULT_COLS.length) return intersect;
        // 否则返回所有 keys
        return keys;
    }

    constructor(options: {
        target: HTMLElement, blocks: Block[], center?: boolean,
        cols?: (string | Record<string, string>)[] | Record<string, string>, indices?: boolean,
        renderer?: (b: Block, attr: keyof Block) => string | number | undefined | null,
    }) {
        const columns = this.adaptColumnInput(options);
        if (!columns) return;

        const render = (b: Block, c: keyof Block) => {
            if (options?.renderer) {
                return options.renderer(b, c) ?? renderAttr(b, c);
            } else {
                return renderAttr(b, c);
            }
        }

        let tables: ScalarValue[][] = [columns.name];
        options.blocks.forEach((b: Block) => {
            let rows = columns.key.map(c => render(b, c) ?? '');
            tables.push(rows);
        });

        this.element = options.target;

        this.center = options?.center ?? false;
        this.indices = options?.indices ?? false;
        // 如果需要, 在头部加上行号
        if (this.indices) {
            this.tableData = tables.map((row, idx) => [idx, ...row]);
            if (this.tableData[0]?.length > 1) {
                this.tableData[0][0] = '#';
            }
        } else {
            this.tableData = tables;
        }
        this.render();
    }

    render() {
        const lute = getLute();
        const tableData = this.tableData;
        const headerRow = tableData[0].map(header => `<th>${lute.InlineMd2BlockDOM(`${header}`)}</th>`).join('');
        const bodyRows = tableData.slice(1).map(row => {
            const rowItems = row.map(rowItem => `<td>${lute.InlineMd2BlockDOM(`${rowItem}`)}</td>`).join('');
            return `<tr>${rowItems}</tr>`;
        }).join('');

        // max-width: 100%;

        const tableHtml = `
            <table class="query-table" style="${this.center ? 'margin: 0 auto;' : ''}">
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;

        this.element.innerHTML = tableHtml;
    }
}

const oneline = (text: string) => {
    return text.split('\n').map(line => line.trim()).join(' ');
}

class Mermaid {
    element: HTMLElement;
    type: 'flowchart' | 'mindmap';
    code: string;
    map: Record<BlockId, BlockId | BlockId[]>;
    blocks?: Record<BlockId, Block>;

    private blockSet: Set<BlockId>; //在 mermaid 中定义的节点
    private renderer: (b: Block) => string | null;
    private direction: 'TD' | 'LR';
    // private lute: Lute = getLute();

    private disposeCb: (() => void)[] = [];

    private DEFAULT_RENDERER = (b: Block | string) => {
        if (typeof b === 'string') {
            return oneline(b);
        }
        if ((b as Block)?.type === 'query_embed') {
            return 'Query Embed';
        }
        if ((b as Block)?.type === 'c') {
            return 'Code Block';
        }

        const text = ((b?.fcontent || b?.content) || b?.id) || 'empty';
        let str = oneline(text);
        str = window.Lute.EscapeHTMLStr(str);
        return str;
    }
    constructor(options: {
        target: HTMLElement,
        type: 'flowchart' | 'mindmap',
        map: Record<BlockId, BlockId | BlockId[]>,
        blocks?: Block[],
        renderer?: (b: Block) => string | null,
        flowchart?: 'TD' | 'LR',
    }) {
        // this.lute = getLute();
        this.element = options.target;
        this.type = options.type;
        this.code = '';
        this.map = options.map;  // 关联图关联关系
        const blocks = options.blocks ?? [];
        this.blocks = blocks.reduce((acc, b) => {
            acc[b.id] = b;
            return acc;
        }, {} as Record<BlockId, Block>);

        this.renderer = options.renderer;
        this.direction = options.flowchart ?? 'LR';
        this.checkRelationMap().then(() => {
            this.render();
        });
    }

    private async render() {
        let success = false;
        if (this.type === 'flowchart') {
            success = this.buildFlowchartCode();
        } else if (this.type === 'mindmap') {
            success = this.buildMindmapCode();
        }

        if (!success) return;
        await this.checkMermaid();
        console.groupCollapsed('JS Query DataView Mermaid Code:');
        console.debug(this.code);
        console.groupEnd();
        const id = "mermaid" + window.Lute.NewNodeID();
        try {
            const mermaidData = await window.mermaid.render(id, this.code);
            this.element.innerHTML = mermaidData.svg;

        } catch (e) {
            // 如果渲染失败，会在 body 中生成一个 div#dmermaid{id} 的元素，需要手动删掉
            showMessage(i18n.src_dataquery_componentsts.mermaid_render_failed, 3000, 'error');
            console.error(e);
            console.groupCollapsed('Mermaid failed to render code:');
            console.debug(this.code);
            console.groupEnd();
            const ele: HTMLElement = document.querySelector(`body>div#d${id}`);
            if (ele) {
                ele.style.position = 'absolute';
                ele.style.bottom = '0';
                ele.classList.add('remove-mermaid');
                ele.style.opacity = '0';
                ele.style.transform = 'translateY(50px)';
                setTimeout(() => {
                    ele.remove();
                }, 1000);
            }
            errorMessage(this.element, 'Failed to render mermaid, something wrong with mermaid code');
        }

        this.postProcess();
    }


    private async checkRelationMap() {
        // 1. 遍历 this.map，检查所有出现的 blockId
        const set = new Set<BlockId>();
        const addID = (id: BlockId) => {
            if (matchIDFormat(id)) {
                set.add(id);
            }
        }
        Object.entries(this.map).forEach(([k, v]) => {
            addID(k);
            if (!v) return;
            if (Array.isArray(v)) {
                v.forEach(id => addID(id));
            } else {
                addID(v);
            }
        });

        //2. 检查 self.blocks 是否包含所有 set 中的 blockId
        const notfound = new Set<BlockId>();
        set.forEach(id => {
            if (!this.blocks?.[id]) {
                notfound.add(id);
            }
        });
        const notfoundList = Array.from(notfound);
        const blocks = await globalThis.Query.getBlocksByIds(...notfoundList);

        //3. 更新 self.blocks
        if (blocks.length > 0) {
            blocks.forEach(b => this.blocks[b.id] = b);
        }
        this.blockSet = set;
    }

    /**
     * 根据 this.map 和 this.blocks 构建 mermaid 代码
     */
    private buildFlowchartCode() {
        this.code = `flowchart ${this.direction}\n`;
        const lines = [];
        //1. 定义各个节点
        this.blockSet.forEach(id => {
            const b = this.blocks[id];
            let content = this.renderer?.(b) || this.DEFAULT_RENDERER(b);
            lines.push(`${id}["${content ?? id}"]`);
            // 定义 click 事件
            lines.push(`click ${id} "siyuan://blocks/${b.id}"`);
        });
        //2. 定义各个边
        Object.entries(this.map).forEach(([k, v]) => {
            // lines.push(`${k} --> ${v}`);
            if (Array.isArray(v)) {
                v.forEach(id => lines.push(`${k} --> ${id}`));
            } else {
                lines.push(`${k} --> ${v}`);
            }
        });
        this.code += lines.map(l => `    ${l}`).join('\n');
        return true;
    }

    private buildMindmapCode() {
        this.code = 'mindmap\n';
        const lines: string[] = [];

        // Find root nodes (nodes that are not targets in the map)
        const targetIds = new Set(
            Object.values(this.map)
                .flatMap(v => Array.isArray(v) ? v : [v])
        );
        const rootIds = Array.from(this.blockSet)
            .filter(id => !targetIds.has(id));

        if (rootIds.length === 0) {
            errorMessage(this.element, 'No root nodes found, can not build mindmap');
            return false;
        }

        // Recursive function to build mindmap branches
        const buildBranch = (id: BlockId, depth: number = 1) => {
            const b = this.blocks[id];
            const content = this.renderer?.(b) || this.DEFAULT_RENDERER(b);
            // Add current node
            lines.push(`${'    '.repeat(depth)}${content}`);
            lines.push(`${'    '.repeat(depth)}:::data-id-${id}`); // 添加 id 作为标注

            // Process children
            const children = this.map[id];
            if (children) {
                const childIds = Array.isArray(children) ? children : [children];
                childIds.forEach(childId => buildBranch(childId, depth + 1));
            }
        };

        // Build from each root node
        rootIds.forEach(rootId => buildBranch(rootId));

        this.code += lines.join('\n');
        return true;
    }

    private postProcess() {
        if (this.type === 'mindmap') {
            const nodeId = (element: HTMLElement) => {
                const node = element.closest('.mindmap-node') as HTMLElement;
                if (!node) return;
                let id = null;
                node.classList.forEach(cls => {
                    cls = cls.trim();
                    if (cls.startsWith('data-id-')) {
                        id = cls.split('data-id-')[1];
                    }
                });
                node.classList.add('popover__block');
                node.dataset.id = id;

                if (!id || !matchIDFormat(id)) return;
                return id;
            }
            // const overHandler = (event: MouseEvent) => {
            //     let { x, y } = { x: event.pageX, y: event.pageY };

            //     const element = event.target as HTMLElement;
            //     const syNode = element.closest('.mindmap-node-siyuan') as HTMLElement;
            //     if (!syNode) return;
            //     const id = syNode.dataset.id;
            //     const plugin = inject<FMiscPlugin>('plugin');
            //     plugin.addFloatLayer({
            //         ids: [id],
            //         x,
            //         y,
            //     });
            // }
            const clickHandler = (event: MouseEvent) => {
                const element = event.target as HTMLElement;
                const syNode = element.closest('.mindmap-node-siyuan') as HTMLElement;
                if (!syNode) return;
                const id = syNode.dataset.id;
                if (!id) return;
                window.open(`siyuan://blocks/${id}`, '_blank');
            }
            // const debouncedHandler = debounce(overHandler, 750);
            // this.element.addEventListener('mouseover', debouncedHandler);
            this.element.addEventListener('click', clickHandler);

            this.element.querySelectorAll('.mindmap-node').forEach((node: HTMLElement) => {
                const id = nodeId(node);
                if (!id) return;
                node.dataset.id = id;
                node.classList.add('mindmap-node-siyuan');  //绑定了某个思源块的节点
            });

            this.disposeCb.push(() => {
                // this.element.removeEventListener('mouseover', debouncedHandler);
                this.element.removeEventListener('click', clickHandler);
            });

        } else if (this.type === 'flowchart') {
            this.element.querySelectorAll('a[data-id]').forEach(anchor => {
                anchor.classList.add('popover__block');
                // anchor.dataset.id = anchor.dataset.id;
            });
            // 添加悬浮事件
            // const handler = (event: MouseEvent) => {
            //     let { x, y } = { x: event.pageX, y: event.pageY };

            //     const element = event.target as HTMLElement;
            //     const anchor = element.closest('a[data-id]') as HTMLAnchorElement;
            //     if (!anchor) return;
            //     const id = anchor.dataset.id;
            //     if (!id || !matchIDFormat(id)) return;
            //     const plugin = inject<FMiscPlugin>('plugin');
            //     plugin.addFloatLayer({
            //         ids: [id],
            //         x,
            //         y,
            //     });
            // }
            // const debouncedHandler = debounce(handler, 750);
            // this.element.addEventListener('mouseover', debouncedHandler);
            // this.disposeCb.push(() => {
            //     this.element.removeEventListener('mouseover', debouncedHandler);
            // });
        }
    }

    private async checkMermaid() {
        if (window.mermaid) return;
        const CDN = Constants.PROTYLE_CDN;
        console.debug('Initializing mermaid...');
        //https://github.com/siyuan-note/siyuan/blob/master/app/src/protyle/render/mermaidRender.ts
        const flag = await addScript(`${CDN}/js/mermaid/mermaid.min.js`, "protyleMermaidScript");
        if (!flag) return;
        const config: any = {
            securityLevel: "loose", // 升级后无 https://github.com/siyuan-note/siyuan/issues/3587，可使用该选项
            altFontFamily: "sans-serif",
            fontFamily: "sans-serif",
            startOnLoad: false,
            flowchart: {
                htmlLabels: true,
                useMaxWidth: !0
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 8,
                diagramMarginY: 8,
                boxMargin: 8,
                showSequenceNumbers: true // Mermaid 时序图增加序号 https://github.com/siyuan-note/siyuan/pull/6992 https://mermaid.js.org/syntax/sequenceDiagram.html#sequencenumbers
            },
            gantt: {
                leftPadding: 75,
                rightPadding: 20
            }
        };
        if (window.siyuan.config.appearance.mode === 1) {
            config.theme = "dark";
        }
        window.mermaid.initialize(config);
    }

    dispose() {
        this.disposeCb.forEach(cb => cb());
        this.disposeCb = [];
    }
}

class EmbedNodes {
    element: HTMLElement;
    blocks: Block[];
    limit: number;
    breadcrumb: boolean;
    embedBlockID: BlockId;
    columns: number;
    zoom: number;

    constructor(options: {
        target: HTMLElement, blocks: Block[],
        embedBlockID: BlockId, limit?: number,
        breadcrumb?: boolean,
        columns?: number,
        zoom?: number,
    }) {
        this.element = options.target;
        this.blocks = options.blocks;
        this.limit = options.limit;
        this.breadcrumb = options.breadcrumb ?? true;
        this.embedBlockID = options.embedBlockID;
        this.columns = options.columns ?? 1;
        this.zoom = options.zoom ?? 1;
        this.render();
    }

    private async render() {
        const frag = document.createDocumentFragment();

        const embeds = await request("/api/search/getEmbedBlock", {
            embedBlockID: this.embedBlockID,
            includeIDs: this.blocks.map(b => b.id),
            headingMode: 0,
            breadcrumb: this.breadcrumb
        });
        // console.info(embeds);

        if (!embeds.blocks || embeds.blocks.length === 0) {
            errorMessage(this.element, 'Failed to get embed blocks, check console for details');
            return;
        }

        embeds.blocks.forEach(embed => {
            // Create temporary container to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = embed.block.content;

            // Apply limit if needed
            if (this.limit && tempDiv.childNodes.length > this.limit) {
                Array.from(tempDiv.children).forEach(child => {
                    //@ts-ignore
                    const nodeIndex = parseInt(child.dataset.nodeIndex);
                    if (nodeIndex > this.limit) {
                        child.remove();
                    }
                });
                const moreSvgSymbol = 'iconMore';
                const svg = `<svg class="popover__block" data-id="${embed.block.id}"><use xlink:href="#${moreSvgSymbol}"></use></svg>`;
                const more = document.createElement('div');
                more.innerHTML = svg;
                more.className = 'embed-more-svg';
                tempDiv.appendChild(more);
            }

            // Create final container and append processed content
            const container = document.createElement('div');
            container.className = 'embed-container';
            container.dataset.nodeId = embed.block.id;
            container.append(...tempDiv.childNodes);

            // Add jump icon
            const jumpSvgSymbol = 'iconFocus';
            const jumpIcon = document.createElement('a');
            jumpIcon.className = 'embed-jump-icon';
            jumpIcon.innerHTML = `<svg class="popover__block" data-id="${embed.block.id}"><use xlink:href="#${jumpSvgSymbol}"></use></svg>`;
            jumpIcon.href = `siyuan://blocks/${embed.block.id}`;
            container.appendChild(jumpIcon);

            if (this.breadcrumb && embed.blockPaths?.length > 0) {
                const breadcrumb = this.newBreadcrumb(embed.blockPaths[0].id, embed.blockPaths[0].name);
                container.insertBefore(breadcrumb, container.firstChild);
            }

            frag.appendChild(container);
        });
        frag.querySelectorAll('[contenteditable]').forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });

        this.element.appendChild(frag);
        if (this.columns > 1) {
            //grid 布局, 双列
            // this.element.style.display = 'grid';
            // this.element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
            // this.element.style.gap = '0px';
            //多列瀑布流
            this.element.style.columnCount = this.columns.toString();
            this.element.style.columnGap = '0px';
        }
        //@ts-ignore
        this.element.style.zoom = `${this.zoom}`;
    }

    private newBreadcrumb(id: BlockId, path: string) {
        const template = `
        <div contenteditable="false" class="protyle-breadcrumb__bar protyle-breadcrumb__bar--nowrap"><span class="protyle-breadcrumb__item protyle-breadcrumb__item--active" data-id="${id}">
    <svg class="popover__block" data-id="${id}"><use xlink:href="#iconFile"></use></svg>
            <span class="protyle-breadcrumb__text" title="${path}">${path}</span>
        </span></div>
        `
        const div = document.createElement('div');
        Object.assign(div.style, {
            'font-size': '0.85rem',
        });
        div.innerHTML = template;
        return div;
    }
}

class Echarts {
    element: HTMLElement;
    width: string;
    height: string;
    option: any;
    chart: any;
    private eventHandlers: Map<string, (params: any) => void> = new Map();

    constructor(options: {
        target: HTMLElement,
        option: any,
        width?: string,
        height?: string,
        events?: {
            [eventName: string]: (params: any) => void;
        }
    }) {
        this.element = options.target;
        this.width = options.width;
        this.height = options.height;
        this.option = options.option;

        // 保存事件处理器
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                this.eventHandlers.set(event, handler);
            });
        }

        this.checkEcharts().then((flag) => {
            if (flag) {
                this.render();
            } else {
                errorMessage(this.element, 'Failed to initialize echarts.');
            }
        });
    }

    private async render() {
        try {
            // 确��容器有足够的高度和宽度
            if (!this.element.style.height) {
                this.element.style.height = this.height ?? '300px';  // 设置默认高度
            }
            if (!this.element.style.width) {
                this.element.style.width = this.width ?? '100%';    // 设置默认宽度
            }
            this.element.style.padding = '0px';
            this.element.style.overflow = 'hidden';

            // 初始化图表
            this.chart = window.echarts.init(
                this.element,
                window.siyuan.config.appearance.mode === 1 ? "dark" : undefined
            );

            // 设置默认grid配置，确保图表有适当的边距
            if (!this.option.grid) {
                this.option.grid = {
                    containLabel: true // 确保刻度标签在容器内
                };
            }

            this.chart.setOption(this.option);

            // 绑定事件
            this.eventHandlers.forEach((handler, event) => {
                this.chart.on(event, handler);
            });

            // Handle window resize
            const resizeHandler = () => this.chart?.resize();
            window.addEventListener('resize', resizeHandler);

            this.dispose = () => {
                console.debug('Echarts dispose');
                // 解绑所有事件
                this.eventHandlers.forEach((handler, event) => {
                    this.chart?.off(event, handler);
                });
                this.eventHandlers.clear();

                window.removeEventListener('resize', resizeHandler);
                this.chart?.dispose();
            }

        } catch (e) {
            console.error('Echarts render error:', e);
            errorMessage(this.element, 'Failed to render echarts, check console for details');
        }
    }

    private async checkEcharts() {
        if (window.echarts) return true;

        const CDN = Constants.PROTYLE_CDN;
        console.debug('Initializing echarts...');

        // Load main echarts library
        const flag = await addScript(
            `${CDN}/js/echarts/echarts.min.js`,
            "protyleEchartsScript"
        );
        if (!flag) return false;

        // Optionally load GL extension
        await addScript(
            `${CDN}/js/echarts/echarts-gl.min.js`,
            "protyleEchartsGLScript"
        );
        return true;
    }

    // Public method to update chart options
    updateOption(newOption: any, notMerge: boolean = false) {
        if (this.chart) {
            this.chart.setOption(newOption, notMerge);
        }
    }

    // Public method to resize chart
    resize() {
        this.chart?.resize();
    }

    // 添加事件
    on(eventName: string, handler: (params: any) => void) {
        this.eventHandlers.set(eventName, handler);
        this.chart?.on(eventName, handler);
    }

    // 移除事件
    off(eventName: string) {
        const handler = this.eventHandlers.get(eventName);
        if (handler) {
            this.chart?.off(eventName, handler);
            this.eventHandlers.delete(eventName);
        }
    }

    // Public method to dispose chart
    dispose = () => { }
}

export {
    BlockList,
    // Table,
    BlockTable,
    Mermaid,
    EmbedNodes,
    renderAttr,
    Echarts
}
