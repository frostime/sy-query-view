import { formatDateTime, sy2Date } from "@/utils/time";
import { BlockTypeShort } from "@/utils/const";
import { getNotebook, openBlock } from "@/utils";
import { getLute } from "./lute";
import { request } from "@/api";

import { Constants, Lute, showMessage } from "siyuan";
import { addScript, matchIDFormat } from "./utils";
// import './index.css';
import styles from './index.module.scss';

import { i18n } from "@/index";
import { setting } from "@/setting";


const escape = window.Lute.EscapeHTMLStr;
const oneline = (text: string, method: 'join' | 'first' = 'join') => {
    let lineCnt = text.split('\n').length;
    if (lineCnt <= 1) {
        return text;
    }
    if (method === 'join') {
        return text.split('\n').map(line => line.trim()).join(' ');
    } else {
        let lines = text.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length > 0) {
            return lines[0];
        } else {
            return '';
        }
    }
}

/**
 * Renders the value of a block attribute as markdown format
 * @param b - Block object
 * @param attr - Attribute name
 * @returns Rendered attribute value
 */
const renderAttr = (b: Block & { [key: string | number]: string | number }, attr: keyof Block & string | number, options?: {
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
            const type = (BlockTypeShort[b.type] ?? b.type);
            v = link(type, b.id);
            break;

        case 'id':
            v = link(b.id, b.id);
            break;

        case 'root_id':
            if (b.hpath) {
                v = link(docName(), b.root_id);
            } else {
                v = b.root_id;
            }
            break;

        case 'hpath':
            if (b.root_id) {
                v = link(b.hpath, b.root_id);
            } else {
                v = b.hpath;
            }
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

        case 'ial':
            // {: updated=\"20240511224835\" custom-reservation=\"20240512\" id=\"20240511224824-zj8q1jp\" memo=\"预约此块 20240512\ }"
            let ial = b.ial;
            ial = ial.replace('{:', '').replace('}', '').trim();
            let ialObj: Record<string, string> = {};
            ial.split(' ').forEach(item => {
                let [key, value] = item.split('=');
                // 如果 value 前后有 " 符号，就去掉
                if (value?.startsWith('"') && value?.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                ialObj[key] = value;
            });
            v = JSON.stringify(ialObj);
            break;

        /**
         * 兼容 refs 表中的字段
         */
        //@ts-ignore
        case 'block_id':
        //@ts-ignore
        case 'def_block_id':
        //@ts-ignore
        case 'def_block_parent_id':
        //@ts-ignore
        case 'def_block_root_id':
            if (b[attr]) {
                //@ts-ignore
                v = link(b[attr], b[attr]);
            } else {
                v = b[attr]
            }
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

        const ahead = `${indent}${prefix} `;
        const spaces = " ".repeat(ahead.length);
        /**
         * 允许为多行的文本，这时就需要处理缩进问题
         * @param text 
         * @returns 
         */
        const headingSpaced = (text: string) => {
            let lines = text.split("\n");
            if (lines.length <= 1) return text;
            // 将除了第一行之外都进行缩进
            return lines.map((line, idx) => idx === 0 ? line : `${spaces}${line}`).join("\n");
        }

        if (typeof item === 'string' || typeof item === 'number' || !item.name) {
            return [`${ahead}${headingSpaced(item.toString())}`];
        }

        const lines: string[] = [`${ahead}${headingSpaced(item.name.toString())}`];

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


// const DEFAULT_COLS = ['type', 'content', 'hpath', 'box'];
const DEFAULT_COLS = () => setting.defaultTableColumns.split(',').map(c => c.trim());

class BlockTable {
    element: HTMLElement;
    tableData: ScalarValue[][];
    private center: boolean;
    private indices: boolean;

    private tdRenderer: (input: string) => string;

    private adaptColumnInput(options: { cols?: any, blocks: Block[] }) {
        const { cols, blocks } = options;
        let colKey: any[] = [];
        let colName: string[] = [];
        if (cols === undefined) {
            /**未指定 columns 时, 使用默认的 columns */
            colKey = this.fallbckColumns(blocks);
            colName = colKey;
            return { key: colKey, name: colName };
        } else if (cols === null) {
            if (blocks.length == 0) {
                colKey = this.fallbckColumns(blocks);
                colName = colKey;
                return { key: colKey, name: colName };
            }
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
        if (blocks.length === 0) return DEFAULT_COLS(); //反正空表格，返回什么都无所谓
        const firstRow: Record<string | number, ScalarValue> = blocks[0];
        const keys = Object.keys(firstRow);
        // 计算交集
        const intersect = DEFAULT_COLS().filter(c => keys.includes(c));
        // 如果包含了所有的默认列，则返回默认列
        if (intersect.length === DEFAULT_COLS().length) return intersect;
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

        const lute = getLute();
        this.tdRenderer = (input: string) => {
            /**
             * 彩蛋语法, 如果包裹在 `{@html }` 内就视为纯 html 代码
             * 否则视为 markdown 语法
             */
            if (input.toLowerCase().startsWith('{@html') && input.endsWith('}')) {
                input = input.slice(7, -1);
                return input;
            } else {
                return lute.InlineMd2BlockDOM(`${input}`);
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
            const rowItems = row.map(rowItem => `<td>${this.tdRenderer(`${rowItem}`)}</td>`).join('');
            return `<tr>${rowItems}</tr>`;
        }).join('');

        // max-width: 100%;

        const tableHtml = `
            <table class="query-table" style="${this.center ? 'margin: 0 auto;' : ''}">
                <thead>
                    <tr style="text-align: left;">${headerRow}</tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;

        this.element.innerHTML = tableHtml;
    }
}

class BlockCards {
    element: HTMLElement;
    blocks: Block[];
    private cardWidth: string;
    private cardHeight: string;
    private fontSize: string;

    constructor(options: {
        target: HTMLElement,
        blocks: Block[],
        cardWidth?: string,
        cardHeight?: string,
        fontSize?: string,
    }) {
        this.element = options.target;
        this.blocks = options.blocks;
        if (!options.cardWidth && options['width']) {
            options.cardWidth = options['width'];
        }
        this.cardWidth = options.cardWidth ?? '200px';
        this.cardHeight = options.cardHeight ?? this.cardWidth;
        this.fontSize = options.fontSize ?? '14px';
        this.render();
    }

    // Helper method to format SiYuan timestamps (yyyyMMddHHmmss) to readable date
    private formatTimestamp(timestamp: string): string {
        if (!timestamp || timestamp.length < 14) return '';

        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(8, 10);
        const minute = timestamp.substring(10, 12);

        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    render() {
        if (!this.blocks || this.blocks.length === 0) {
            errorMessage(this.element, 'No blocks to display');
            return;
        }

        const cardContainer = document.createElement('div');
        Object.assign(cardContainer.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'flex-start',
            padding: '8px'
        });

        this.blocks.forEach(block => {
            const card = document.createElement('div');
            Object.assign(card.style, {
                width: this.cardWidth,
                height: this.cardHeight,
                fontSize: this.fontSize,
                border: '1px solid var(--b3-border-color)',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                padding: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'var(--b3-theme-background)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            });
            card.dataset.blockId = block.id;

            // Content container
            const contentContainer = document.createElement('div');
            Object.assign(contentContainer.style, {
                flexGrow: '1',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflow: 'hidden'
            });

            // Title/Content - with fixed height and proper overflow handling
            const title = document.createElement('div');
            Object.assign(title.style, {
                flex: '1',
                fontWeight: 'bold',
                fontSize: '1.15em',
                marginBottom: '4px',
                borderBottom: '1px solid var(--b3-border-color)',
                paddingBottom: '8px',
                color: 'var(--b3-theme-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                // maxHeight: '3.6em',
                cursor: 'pointer'
            });
            title.title = block.content || '(No content)';
            title.innerText = block.content || '(No content)';
            title.classList.add('popover__block');
            title.dataset.id = block.id;

            // Make title clickable to navigate to the block
            title.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(`siyuan://blocks/${block.id}`, '_blank');
            });

            contentContainer.appendChild(title);

            // Metadata container
            const metaContainer = document.createElement('div');
            Object.assign(metaContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.95em',
                color: 'var(--b3-theme-on-surface)',
                flex: 'none'
            });

            const metaRow = (icon: string, body: string | HTMLElement) => {
                const div = document.createElement('div');
                Object.assign(div.style, {
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    fontWeight: '500'
                });
                const ico = document.createElement('span');
                ico.innerHTML = icon;
                div.appendChild(ico);
                if (typeof body === 'string') {
                    const desc = document.createElement('span');
                    desc.style.flex = '1';
                    desc.innerHTML = body;
                    div.appendChild(desc);
                } else {
                    div.appendChild(body);
                }
                return div;
            }

            metaContainer.appendChild(metaRow(
                this.getTypeIcon(block.type),
                BlockTypeShort[block.type] ?? block.type
            ));

            // Only create path container if we have path info
            if (block.box || block.hpath) {
                // First show notebook name if available, then path
                const notebook = block.box ? getNotebook(block.box)?.name : '';
                const displayPath = notebook ?
                    (block.hpath ? `[${notebook}]${block.hpath}` : notebook) :
                    (block.hpath || '');

                const contaienr = metaRow(
                    '📁', displayPath
                );
                contaienr.style.alignItems = 'flex-start';
                (contaienr.lastElementChild as HTMLElement).style.textWrap = 'initial';
                metaContainer.appendChild(contaienr);
            }

            const times = document.createElement('div');
            Object.assign(times.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
            });
            times.innerHTML = `<span>${this.formatTimestamp(block.created)}</span>
                <span>${this.formatTimestamp(block.updated)}</span>`;
            metaContainer.appendChild(metaRow(
                '🕒', times
            ));

            contentContainer.appendChild(metaContainer);
            card.appendChild(contentContainer);
            cardContainer.appendChild(card);
        });

        this.element.innerHTML = '';
        this.element.appendChild(cardContainer);
    }

    // Helper method to get icons based on block type
    private getTypeIcon(blockType: string): string {
        switch (blockType) {
            case 'd': return '📄'; // Document
            case 'h': return '📌'; // Heading
            case 'p': return '📝'; // Paragraph
            case 'l': return '📋'; // List
            case 'i': return '✅'; // List item
            case 'c': return '💻'; // Code block
            case 'm': return '📊'; // Math block
            case 't': return '📊'; // Table
            case 'b': return '🔳'; // Block quote
            case 's': return '📏'; // Super block
            case 'html': return '🌐'; // HTML block
            case 'query_embed': return '🔍'; // Query embed block
            default: return '📄'; // Default
        }
    }
}

class MermaidBase {
    element: HTMLElement;
    protected disposeCb: (() => void)[] = [];
    protected code: string;

    constructor(element: HTMLElement, code: string = "") {
        this.element = element;
        this.code = code;
    }

    protected async checkMermaid() {
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

    async render() {
        await this.checkMermaid();
        // console.groupCollapsed('JS Query DataView Mermaid Code:');
        // console.debug(this.code);
        // console.groupEnd();
        const id = "mermaid" + window.Lute.NewNodeID();
        try {
            const mermaidData = await window.mermaid.render(id, this.code);
            this.element.innerHTML = mermaidData.svg;

        } catch (e) {
            // 如果渲染失败，会在 body 中生成一个 div#dmermaid{id} 的元素，需要手动删掉
            showMessage(i18n.src_dataquery_componentsts.mermaid_render_failed, 3000, 'error');
            console.groupCollapsed('Mermaid failed to render code:');
            console.warn(e);
            console.warn(this.code);
            console.groupEnd();
            const ele: HTMLElement = document.querySelector(`body>div#d${id}`);
            if (ele) {
                ele.style.position = 'absolute';
                ele.style.bottom = '0';
                ele.classList.add(styles['remove-mermaid']);
                ele.style.opacity = '0';
                ele.style.transform = 'translateY(50px)';
                setTimeout(() => {
                    ele.remove();
                }, 1000);
            }
            errorMessage(this.element, 'Failed to render mermaid, something wrong with mermaid code');
        }
    }

    dispose() {
        this.disposeCb.forEach(cb => cb());
        this.disposeCb = [];
    }
}

class MermaidRelation extends MermaidBase {
    private type: 'flowchart' | 'mindmap';

    private rootNode: ITreeNode;
    private blocks?: Record<string, ITreeNode>;

    private blockSet: Set<BlockId>; //在 mermaid 中定义的节点
    private renderer: (b: Block) => string | null;
    private direction: 'TD' | 'LR';


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

        const text = b.name || ((b?.fcontent || b?.content) || b?.id) || 'empty';
        let str = oneline(text);
        str = window.Lute.EscapeHTMLStr(str);
        return str;
    }
    constructor(options: {
        target: HTMLElement,
        type: 'flowchart' | 'mindmap',
        rootNode: ITreeNode | IBlockWithChilds,
        // blocks?: Block[],
        renderer?: (b: Block) => string | null,
        flowchart?: 'TD' | 'LR',
    }) {
        super(options.target, "");

        this.type = options.type;
        this.rootNode = options.rootNode;

        this.renderer = options.renderer;
        this.direction = options.flowchart ?? 'LR';
        this.checkRelationTree().then(() => {
            this.render();
        });
    }

    async render() {
        let success = false;
        if (this.type === 'flowchart') {
            success = this.buildFlowchartCode();
        } else if (this.type === 'mindmap') {
            success = this.buildMindmapCode();
        }

        if (!success) return;
        await super.render();

        this.postProcess();
    }


    private async checkRelationTree() {
        //根据 this.rootNode 建立 this.blocks 的映射关系
        this.blocks = {};
        const traverseTree = (node: ITreeNode) => {
            // 保存了绑定块的节点
            if (node.id && matchIDFormat(node.id)) {
                this.blocks[node.id] = node;
            }
            node.children?.forEach(traverseTree);
        };
        traverseTree(this.rootNode);
    }

    private buildFlowchartCode() {
        this.code = `flowchart ${this.direction}\n`;
        const lines = [];

        const traverseTree = (node: ITreeNode) => {
            if (node.id) {
                // 对比绑定块的 TreeNode，使用块信息
                const b = this.blocks[node.id] as Block;
                let content = this.renderer?.(b) || this.DEFAULT_RENDERER(b);
                lines.push(`${node.id}["${content ?? node.id}"]`);
                lines.push(`click ${node.id} "siyuan://blocks/${b.id}"`);
            } else if (node.name) {
                // 否则，就只能当作一个普通的 tree node
                let content = node.content || node.name;
                lines.push(`${node.name}["${content}"]`);
            }
            node.children?.forEach(child => {
                const p = node.id || node.name;
                const c = child.id || child.name;
                if (p && c) {
                    lines.push(`${p} --> ${c}`);
                }
                traverseTree(child);
            });
        };

        traverseTree(this.rootNode);

        this.code += lines.map(l => `    ${l}`).join('\n');
        return true;
    }

    private buildMindmapCode() {
        this.code = 'mindmap\n';
        const lines: string[] = [];

        const buildBranch = (node: ITreeNode, depth: number = 1) => {
            if (node.id) {
                const b = this.blocks[node.id] as Block;
                const content = this.renderer?.(b) || this.DEFAULT_RENDERER(b);
                lines.push(`${'    '.repeat(depth)}${content}`);
                lines.push(`${'    '.repeat(depth)}:::data-id-${node.id}`);
            } else if (node.name) {
                let content = node.content || node.name;
                lines.push(`${'    '.repeat(depth)}${content}`);
            }
            node.children?.forEach(child => buildBranch(child, depth + 1));
        };

        buildBranch(this.rootNode);

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

                if (!id || !matchIDFormat(id)) return;
                node.classList.add('popover__block');
                node.dataset.id = id;
                return id;
            }

            const clickHandler = (event: MouseEvent) => {
                const element = event.target as HTMLElement;
                const syNode = element.closest(`.${styles['mindmap-node-siyuan']}`) as HTMLElement;
                if (!syNode) return;
                const id = syNode.dataset.id;
                if (!id || !matchIDFormat(id)) return;
                openBlock(id);
            }

            this.element.addEventListener('click', clickHandler);

            this.element.querySelectorAll('.mindmap-node').forEach((node: HTMLElement) => {
                const id = nodeId(node);
                if (!id) return;
                node.dataset.id = id;
                node.classList.add(styles['mindmap-node-siyuan']);  //绑定了某个思源块的节点
            });

            this.disposeCb.push(() => {
                // this.element.removeEventListener('mouseover', debouncedHandler);
                this.element.removeEventListener('click', clickHandler);
            });

        } else if (this.type === 'flowchart') {
            this.element.querySelectorAll('svg g.nodes g.node.clickable').forEach(g => {
                // anchor.classList.add('popover__block');
                const anchor = g.parentElement as HTMLAnchorElement;
                if (anchor?.tagName?.toLocaleUpperCase() !== 'A') {
                    return;
                }
                anchor.classList.add('popover__block');
                let id = g.id;
                id = id.replace('flowchart-', '');
                id = id.split('-').slice(0, 2).join('-');
                anchor.dataset.id = id;
            });
        }
    }

}



class MermaidKanban extends MermaidBase {

    static readonly PREFIX = `
---
config:
    kanban:
        ticketBaseUrl: 'siyuan://blocks/#TICKET#'
---
`.trim();

    private groupedBlocks: Record<string, Block[]>;
    private clipStr: number;
    private priorityMapper: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low';
    private width: string;
    private center: boolean;


    private DEFAULT_RENDERER = (b: Block | string) => {
        let text = ''
        if (typeof b === 'string') {
            return oneline(b);
        }
        if ((b as Block)?.type === 'query_embed') {
            return 'Query Embed';
        }
        if ((b as Block)?.type === 'c') {
            return 'Code Block';
        }
        if (b.type === 'h') {
            let text = b.markdown;
            text.replace(/^(#+)/, (match, p1) => `H${p1.length} Text`);
        } else {
            text = b.name || b.fcontent || b?.markdown || b?.id || 'empty';
        }

        const imageRegex = /!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)/g;

        text = text.replace(
            imageRegex,
            (match, alt, url, title) => {
                if (title) {
                    return `Image: [${title}]`;
                }
                return `Image`;
            }
        );

        let str = oneline(text, 'first');
        str = str.replace(/siyuan:\/\/blocks\/\d{14}-[a-z0-9]{7}/g, '');
        str = str.replaceAll(/[{(\[]/g, '').replaceAll(/[})\]]/g, '');

        if (str === '') {
            str = 'Empty';
        }
        // str = window.Lute.EscapeHTMLStr(str);
        return str;
    }

    constructor(options: {
        target: HTMLElement,
        groupedBlocks: Record<string, Block[]>,
        priority?: (b: Block) => 'Very High' | 'High' | 'Low' | 'Very Low',
        clip?: number,
        width?: string,
        center?: boolean,

    }) {
        super(options.target, "");
        this.groupedBlocks = options.groupedBlocks;
        this.clipStr = options.clip ?? 50;
        this.priorityMapper = options.priority;
        this.width = options.width;
        this.render();
        this.center = options.center ?? true;
    }

    async render() {
        this.buildKanbanCode();

        await super.render();
        this.postProcess();
    }

    private clip(str: string, len: number) {
        if (len <= 0) return str;
        if (str.length > len - 2) {
            return str.slice(0, len) + '...';
        } else {
            return str;
        }
    }

    private assignPriority(b: Block) {
        if (this.priorityMapper) {
            return this.priorityMapper(b);
        } else {
            return null;
        }
    }

    buildKanbanCode() {
        let kanbanCode = `${MermaidKanban.PREFIX}\nkanban\n`;

        for (const columnName in this.groupedBlocks) {
            const blocks = this.groupedBlocks[columnName];
            // Add column definition
            kanbanCode += `    ${columnName}\n`;
            // Add cards to the column
            blocks.forEach(block => {
                let escapedContent = this.DEFAULT_RENDERER(block);
                escapedContent = this.clip(escapedContent, this.clipStr);
                let priority = this.assignPriority(block);
                let meta = '';
                if (priority) {
                    meta = `@{ priority: '${priority}' }`;
                }
                kanbanCode += `        ${block.id}[${escapedContent}]${meta}\n`;
            });
        }
        // console.log(kanbanCode);
        this.code = kanbanCode;
    }

    private postProcess() {

        const onClickHandler = (event: MouseEvent) => {
            const element = event.target as HTMLElement;
            const syNode = element.closest(`g.node`) as HTMLElement;
            if (!syNode) return;
            const id = syNode.dataset.id;
            if (!id || !matchIDFormat(id)) return;
            openBlock(id);
        }

        this.element.querySelectorAll('g.items>g.node').forEach(node => {
            let id = node.id;
            if (!id || !matchIDFormat(id)) return;
            node.setAttribute('data-id', id);
            node.classList.add('popover__block');
        });

        this.element.addEventListener('click', onClickHandler);
        this.disposeCb.push(() => {
            this.element.removeEventListener('click', onClickHandler);
        });

        const svg = this.element.querySelector('svg');
        if (svg) {
            svg.style.maxWidth = 'unset';
            svg.classList.add('query-view__mkanban');
        }
        if (this.width) {
            if (typeof this.width === 'string') {
                svg.setAttribute('width', this.width);
            } else if (typeof this.width === 'number') {
                svg.setAttribute('width', `${this.width}px`);
            }

        }
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
                more.className = styles['embed-more-svg'];
                tempDiv.appendChild(more);
            }

            // Create final container and append processed content
            const container = document.createElement('div');
            container.className = styles['embed-container'];
            container.dataset.nodeId = embed.block.id;
            container.append(...tempDiv.childNodes);

            // Add jump icon
            const jumpSvgSymbol = 'iconFocus';
            const jumpIcon = document.createElement('a');
            jumpIcon.className = styles['embed-jump-icon'];
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
            Object.assign(this.element.style, {
                columnCount: this.columns.toString(),
                columnGap: '0px'
            });
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
            'fontSize': '0.85rem'
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
            // 确认容器有足够的高度和宽度
            if (!this.element.style.height) {
                this.element.style.height = this.height ?? '300px';  // 设置默认高度
            }
            if (!this.element.style.width) {
                this.element.style.width = this.width ?? '100%';    // 设置默认宽度
            }
            this.element.style.padding = '0px';

            // 初始化图表
            this.chart = window.echarts.init(
                this.element,
                window.siyuan.config.appearance.mode === 1 ? "dark" : undefined,
                { renderer: setting.echartsRenderer }
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
    MermaidBase,
    MermaidRelation,
    MermaidKanban,
    EmbedNodes,
    renderAttr,
    Echarts,
    errorMessage,
    BlockCards
}
