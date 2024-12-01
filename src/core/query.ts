import { IProtyle } from "siyuan";

import { request, sql, listDocsByPath } from "@/api";
import { initLute } from "./lute";
import { wrapBlock, wrapList } from "./proxy";
import { formatDateTime } from "@/utils/time";
import { DataView } from "./data-view";
import { getNotebook } from "@/utils";


/**
 * Filter blocks in sql search scenario to eliminate duplicate blocks
 * @param blocks Block[]
 * @param mode uni 模式;
 *  - 'leaf' 只返回叶子节点
 *  - 'root' 只返回根节点
 * @param ret 返回类型, 'block' 返回 Block[], 'id' 返回 BlockId[]
 * @returns BlockId[]
 */
function UniBlocks(blocks: Block[], mode: 'leaf' | 'root' = 'leaf', ret: "block" | "id" = "block") {
    console.log('UniBlocks', blocks);
    let p2c = new Map();
    let blocksMap = new Map();
    blocks.forEach(block => {
        p2c.set(block.parent_id, block.id);
        blocksMap.set(block.id, block);
    });
    let blockIdsResult: BlockId[] = [];
    const pushResult = (block: Block) => {
        if (!blockIdsResult.includes(block.id)) {
            blockIdsResult.push(block.id);
        }
    };
    if (mode === 'root') {
        for (let block of blocks) {
            // 找到 block 最顶层的 parent 节点
            while (blocksMap.has(block.parent_id)) {
                block = blocksMap.get(block.parent_id);
            }
            pushResult(block);
        }
    }
    else if (mode === 'leaf') {
        for (let block of blocks) {
            //如果 block 不在 parent 集合中，则 block 为叶子节点
            if (!p2c.has(block.id)) {
                pushResult(block);
            }
        }
    }
    let retBlocks = blockIdsResult.map(id => blocksMap.get(id));
    return ret === "block" ? retBlocks : retBlocks.map(block => block.id);
}

async function getBlocksByIds(...ids: BlockId[]) {
    let idList = ids.map((id) => `"${id}"`);
    let sqlCode = `select * from blocks where id in (${idList.join(",")})`;
    let data = await sql(sqlCode);
    return data;
}

const blocks2Maps = (blocks: Block[]): { [key: BlockId]: Block } => {
    return blocks.reduce((map, block) => {
        map[block.id] = block;
        return map;
    }, {} as { [key: BlockId]: Block });
}



const cond = async (cond: string) => {
    return globalThis.Query.sql(`select * from blocks where ${cond}`);
}

const beginOfDay = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    return date;
}

const Query = {
    /**
     * Creates a new DataView instance for rendering data visualizations
     * @param protyle - Protyle instance
     * @param item - HTML element to render into
     * @param top - Top position for rendering
     * @returns DataView instance
     */
    DataView: (protyle: IProtyle, item: HTMLElement, top: number | null) => {
        initLute();
        return new DataView(protyle, item, top);
    },
    Utils: {
        /**
         * Gets the timestamp for the start of today
         * @param {boolean} hms - Whether to include time, e.g today(false) returns 20241201, today(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        today: (hms: boolean = true) => formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), beginOfDay(new Date())),

        /**
         * Gets the timestamp for the start of current week
         * @param {boolean} hms - Whether to include time, e.g thisWeek(false) returns 20241201, thisWeek(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisWeek: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setDate(date.getDate() - date.getDay());
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the start of next week
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextWeek: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setDate(date.getDate() + 7 - date.getDay());
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the start of current month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisMonth: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setDate(1);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the start of next month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextMonth: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setMonth(date.getMonth() + 1);
            date.setDate(1);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the start of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisYear: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setMonth(0);
            date.setDate(1);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the end of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        nextYear: (hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setMonth(11);
            date.setDate(31);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets timestamp for current time with optional day offset
         * @param days - Number of days to offset (positive or negative)
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        now: (days?: number, hms: boolean = true) => {
            let date = beginOfDay(new Date());
            date.setDate(date.getDate() + (days ?? 0));
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Converts a block to a SiYuan link format
         * @param b - Block to convert
         * @returns String in markdown link format
         */
        aslink: (b: Block) => `[${b.fcontent || b.content}](siyuan://blocks/${b.id})`,

        /**
         * Converts a block to a SiYuan reference format
         * @param b - Block to convert
         * @returns String in reference format ((id 'content'))
         */
        asref: (b: Block) => `((${b.id} '${b.fcontent || b.content}'))`,

        /**
         * Converts SiYuan timestamp string to Date object
         * @param timestr - SiYuan timestamp (yyyyMMddHHmmss)
         * @returns Date object
         */
        asdate: (timestr: string) => {
            const year = parseInt(timestr.slice(0, 4), 10);
            const month = parseInt(timestr.slice(4, 6), 10) - 1;
            const day = parseInt(timestr.slice(6, 8), 10);
            const hour = parseInt(timestr.slice(8, 10), 10);
            const minute = parseInt(timestr.slice(10, 12), 10);
            const second = parseInt(timestr.slice(12, 14), 10);

            return new Date(year, month, day, hour, minute, second);
        },

        /**
         * Converts Date object to SiYuan timestamp format
         * @param date - Date to convert
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        astimestr: (date: Date) => formatDateTime('yyyyMMddHHmmss', date),

        /**
         * Gets notebook information from block or notebook ID
         * @param input - Block object or notebook ID
         * @returns Notebook information
         */
        notebook: (input: Block | NotebookId) => {
            const boxid = typeof input === 'string' ? input : input.box;
            return getNotebook(boxid);
        }
    },

    /**
     * Wraps blocks with additional functionality
     * @param blocks - Blocks to wrap
     * @returns Wrapped block(s)
     */
    wrapBlocks: (blocks: Block[] | Block) => {
        if (Array.isArray(blocks)) {
            return wrapList(blocks);
        }
        return wrapBlock(blocks);
    },

    /**
     * Gets blocks by their IDs
     * @param ids - Block IDs to retrieve
     * @returns Array of wrapped blocks
     */
    getBlocksByIds: async (...ids: BlockId[]) => {
        let blocks = await getBlocksByIds(...ids);
        return blocks.map(wrapBlock);
    },

    /**
     * Gets the current document's ID
     * @param protyle - Protyle instance
     * @returns Document ID
     */
    docid: (protyle: IProtyle) => protyle.block.rootID,

    /**
     * Gets the current document as a block
     * @param protyle - Protyle instance
     * @returns Wrapped document block
     */
    thisdoc: async (protyle: IProtyle) => {
        let docId = protyle.block.rootID;
        let doc = await sql(`select * from blocks where id = '${docId}'`);
        return wrapBlock(doc[0]);
    },

    /**
     * Executes SQL query and optionally wraps results
     * @param fmt - SQL query string
     * @param wrap - Whether to wrap results
     * @returns Query results
     */
    sql: async (fmt: string, wrap: boolean = true) => {
        fmt = fmt.trim();
        let data = await sql(fmt);
        // return wrap ? data.map(wrapBlock) : data;
        return wrap ? wrapList(data) : data;
    },

    /**
     * Finds backlinks to a specific block
     * @param id - Block ID to find backlinks for
     * @param limit - Maximum number of results
     * @returns Array of blocks linking to the specified block
     */
    backlink: async (id: BlockId, limit?: number) => {
        return globalThis.Query.sql(`
        select * from blocks where id in (
            select block_id from refs where def_block_id = '${id}'
        ) order by updated desc ${limit ? `limit ${limit}` : ''};
        `);
    },

    /**
     * Finds blocks with specific attributes
     * @param name - Attribute name
     * @param val - Attribute value
     * @param valMatch - Match type ('=' or 'like')
     * @param limit - Maximum number of results
     * @returns Array of matching blocks
     */
    attr: async (name: string, val?: string, valMatch: '=' | 'like' = '=', limit?: number) => {
        return globalThis.Query.sql(`
        SELECT B.*
        FROM blocks AS B
        WHERE B.id IN (
            SELECT A.block_id
            FROM attributes AS A
            WHERE A.name like '${name}'
            ${val ? `AND A.value ${valMatch} '${val}'` : ''}
            ${limit ? `limit ${limit}` : ''}
        );
        `);
    },

    /**
     * Gets child documents of a block
     * @param b - Parent block or block ID
     * @returns Array of child document blocks
     */
    childdoc: async (b: BlockId | Block) => {
        let block = null;
        if (typeof b === 'string') {
            const _ = await getBlocksByIds(b);
            block = _[0];
        } else {
            block = b;
        }
        let data = await listDocsByPath(block.box, block.path);
        let files: any[] = data?.files || [];
        let ids: string[] = files.map(f => f.id);
        let docs = await getBlocksByIds(...ids);
        let docsMap = blocks2Maps(docs);
        docs = ids.map(id => docsMap[id]);
        // return docs.map(wrapBlock);
        return wrapList(docs);
    },

    /**
     * Redirects first block IDs to their parent containers
     * @param inputs - Array of blocks or block IDs
     * @param enable - Configuration for heading and doc processing
     * @param enable.heading - Whether to process heading blocks
     * @param enable.doc - Whether to process document blocks
     * @returns Processed blocks or block IDs
     */
    fb2p: async (inputs: BlockId[] | Block[], enable?: { heading?: boolean, doc?: boolean }) => {
        /**
         * 处理输入参数
         */
        let types = typeof inputs[0] === 'string' ? 'id' : 'block';
        let ids = types === 'id' ? inputs as BlockId[] : (inputs as Block[]).map(b => b.id);
        let blocks: Block[] = inputs as Block[];
        enable = { heading: true, doc: true, ...(enable ?? {}) };

        if (types == 'id') {
            //@ts-ignore
            blocks = blocks.map(id => ({ id: id }));
        }

        /**
         * 获取块的上下文关系
         */
        let data: { [key: BlockId]: any } = await request('/api/block/getBlockTreeInfos', {
            ids: ids
        });
        let result: Block[] = [];

        /**
         * 处理标题、文档块这种特殊情况；在执行 fb2p 后需要使用新的 ID 块的 content 替换旧的 ID 块的 content
         */
        let ReplaceContentTask = {
            blocks: {} as Record<BlockId, Block>,
            addTask: (block: Block) => {
                ReplaceContentTask.blocks[block.id] = block;
            },
            run: async () => {
                let blocks = await getBlocksByIds(...Object.keys(ReplaceContentTask.blocks));
                for (let block of blocks) {
                    if (ReplaceContentTask.blocks[block.id]) {
                        // replaceContentTask.blocks[block.id].content = block.content;
                        Object.assign(ReplaceContentTask.blocks[block.id], block);
                    }
                }
            }
        };

        /**
         * 执行 fb2p
         */
        for (let block of blocks) {
            result.push(block);
            let info = data[block.id];
            if (info.type !== 'NodeParagraph') continue;

            /**
             * 特殊处理：文档引用标识
             * 由于「文献引用」插件的文档第一行被强行占用不能改；再考虑到确实存在在文档中进行引用的情况
             * 所以规定：如果段落中含有标签 '文档引用' 或者 'DOCREF'，则认定为文档级引用
             */
            const content = block.content.trim();
            const refPattern = /#(文档引用|DOCREF)#/;
            if (refPattern.test(content)) {
                console.debug('发现文档引用', block.id);
                let resultp = result[result.length - 1];
                resultp.id = block.root_id;
                resultp.type = 'd';
                ReplaceContentTask.addTask(resultp);
                continue;
            }

            // ---------- 以下为常规的 fb2p 处理逻辑 ----------

            if (
                info.previousID === '' &&
                ['NodeBlockquote', 'NodeListItem'].includes(info.parentType) // 容器块的第一个段落块
            ) {
                let resultp = result[result.length - 1];
                resultp.id = info.parentID;
                resultp.type = { 'NodeBlockquote': 'b', 'NodeListItem': 'i' }[info.parentType];
            } else if (enable.heading && info.previousType === "NodeHeading") { // 标题块下方第一个段落
                let resultp = result[result.length - 1];
                resultp.id = info.previousID;
                resultp.type = 'h';
                ReplaceContentTask.addTask(resultp); // 对标题下方的段落块，执行替换 content 的任务
            } else if (
                enable.doc &&
                info.previousID === '' &&
                info.parentType === "NodeDocument"
            ) { // 文档下第一个段落
                let resultp = result[result.length - 1];
                resultp.id = info.parentID;
                resultp.type = 'd';
                ReplaceContentTask.addTask(resultp); // 对文档下面的段落块，执行替换 content 的任务
            }
        }
        await ReplaceContentTask.run();
        return types === 'block' ? wrapList(result) : result.map(b => b.id);
    },
}

const addAlias = (obj: any, attr: string, alias: string[]) => {
    if (!(attr in obj)) return;
    alias.forEach(alias => {
        if (alias in obj) return;
        obj[alias] = obj[attr];
    });
}

addAlias(Query, 'Utils', ['utils']);
addAlias(Query, 'getBlocksByIds', ['getBlocksByIDs']);
addAlias(Query, 'docid', ['docId']);
addAlias(Query, 'thisdoc', ['thisDoc']);
addAlias(Query, 'backlink', ['backlinks']);
addAlias(Query, 'childdoc', ['childDoc', 'childDocs', 'childdocs']);
addAlias(Query, 'wrapBlocks', ['wrapblocks']);
const utils = Object.keys(Query.Utils);
utils.forEach(key => {
    addAlias(Query.Utils, key, [key.toLocaleLowerCase()]);
});

export default Query;
