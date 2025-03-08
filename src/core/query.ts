/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 22:34:55
 * @FilePath     : /src/core/query.ts
 * @LastEditTime : 2025-03-08 17:41:46
 * @Description  : 
 */
import { IProtyle } from "siyuan";

import { request, sql, listDocsByPath } from "@/api";
import { getLute, initLute } from "./lute";
import { IWrappedBlock, IWrappedList, wrapBlock, wrapList } from "./proxy";
import { formatDateTime } from "@/utils/time";
import { DataView } from "./data-view";
import { getNotebook, openBlock } from "@/utils";

import { renderAttr } from "./components";
import { BlockTypeShort } from "@/utils/const";
import PromiseLimitPool from "@/libs/promise-pool";
// import { getSessionStorageSize } from "./gc";


/**
 * 在 SQL 搜索场景中过滤块，以消除重复的块。
 * 思源笔记中的块存在嵌套结构（例如列表、列表项、内部的段落是三个不同的块）。
 * 因此，如果一个关键字搜索列表内的文字，可能会一次性搜索出三个嵌套的块，导致搜索结果冗余。
 * 此函数用于解决上述问题，根据指定的模式合并具有父子关系的块。
 * @param {Block[]} blocks - 待处理的块数组，可能存在潜在的嵌套关系。
 * @param {('leaf' | 'root')} [keep='leaf'] - 合并模式。
 *   - 'leaf'：将具有父子关系的块合并到最底层的叶子节点。例如，搜索到多个列表项，则将结果合并为最底层的段落块。
 *   - 'root'：将具有父子关系的块合并到最顶层的根节点。例如，搜索到多个列表项，则将结果合并为顶部的列表块。
 * @param {boolean} [advanced=false] - 是否启用高级模式。
 *   - true：启用高级模式，通过查询块的面包屑来获取完整的块层级关系，从而更精准地识别和合并嵌套块。高级模式下会使用 /api/block/getBlockBreadcrumb 接口进行查询，比非高级模式消耗更多资源。
 *   - false：禁用高级模式，仅通过 parent_id 属性进行判断和合并，性能更好但是准确率不如高级模式。
 * @returns {Block[]} - 合并后的块数组。
 */
async function pruneBlocks(
    blocks: Block[], keep: 'leaf' | 'root' = 'leaf', advanced: boolean = false
) {

    let parents = new Set<string>(); // 存储所有作为父块的 blockId
    let blocksMap = new Map<string, Block>(); // blockId 到 block 的映射
    blocks.forEach(block => {
        parents.add(block.parent_id);
        blocksMap.set(block.id, block);
    });
    let blockIdsResult: Set<string> = new Set(); // 用于存储最终结果的 blockId 集合
    const pushResult = (block: Block) => {
        if (!blockIdsResult.has(block.id)) {
            blockIdsResult.add(block.id);
        }
    };

    // 非高级模式下的初步筛选
    if (keep === 'root') {
        for (let block of blocks) {
            // 找到 block 最顶层的 parent 节点
            while (blocksMap.has(block.parent_id)) {
                block = blocksMap.get(block.parent_id)!;
            }
            pushResult(block);
        }
    } else if (keep === 'leaf') {
        for (let block of blocks) {
            // 如果 block.id 不是任何块的 parent_id，则 block 为叶子节点
            if (!parents.has(block.id)) {
                pushResult(block);
            }
        }
    }

    if (advanced) {
        const searchBreakcrumb = async (blockId: BlockId) => {
            const data: { id: string }[] = await request('/api/block/getBlockBreadcrumb', {
                id: blockId,
                excludeTypes: []
            });
            const path = data.map(b => b.id).join('/');
            return path;
        }

        const pool = new PromiseLimitPool(16);
        const breadcrumb = new Map<BlockId, string>(); // breadcrumb 应存储 BlockId 到路径的映射
        // 查询每个块的面包屑
        for (const blockId of blockIdsResult) {
            pool.add(async () => {
                const path = await searchBreakcrumb(blockId);
                breadcrumb.set(blockId, path);
            });
        }
        await pool.awaitAll();

        const hierarchy = new Map<BlockId, BlockId[]>();
        // 检查面包屑，查看前缀关系
        for (const [blockId, path] of breadcrumb.entries()) {
            for (const [otherBlockId, otherPath] of breadcrumb.entries()) {
                if (blockId !== otherBlockId && otherPath.startsWith(path)) {
                    if (!hierarchy.has(blockId)) {
                        hierarchy.set(blockId, []);
                    }
                    hierarchy.get(blockId)?.push(otherBlockId);
                }
            }
        }

        // if root, 则删除所有存在前缀关系的子块
        if (keep === 'root') {
            for (const [_, children] of hierarchy.entries()) {
                if (children.length > 0) {
                    // 如果当前块是根块，删除所有子块
                    for (const childId of children) {
                        blockIdsResult.delete(childId);
                    }
                }
            }
        } else if (keep === 'leaf') {
            // if leaf, 则删除所有存在前缀关系的父块
            for (const [parentId, children] of hierarchy.entries()) {
                if (children.length > 0) {
                    blockIdsResult.delete(parentId);
                }
            }
        }

    }

    let retBlocks = Array.from(blockIdsResult).map(id => blocksMap.get(id)!);
    return retBlocks;
}

async function getBlocksByIds(...ids: BlockId[]) {
    let idList = ids.map((id) => `"${id}"`);
    let N = ids.length;
    let sqlCode = `select * from blocks where id in (${idList.join(",")}) limit ${N + 1}`;
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


/**
 * Data class for SiYuan timestamp
 * In SiYuan, the timestamp is in the format of yyyyMMddHHmmss
 */
class SiYuanDate extends Date {

    beginOfDay() {
        const date = new SiYuanDate(this.getTime());
        date.setHours(0, 0, 0, 0);
        return date;
    }

    toString(hms: boolean = true) {
        return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), this) as string;
    }

    // primitimive of string
    //@ts-ignore
    [Symbol.toPrimitive](hint: string) {
        switch (hint) {
            case 'string': return this.toString();
            default: return super[Symbol.toPrimitive](hint);
        }
    }

    static fromString(timestr: string) {
        return new SiYuanDate(timestr.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6'));
    }

    /**
     * Format date
     * @param fmt default as 'yyyy-MM-dd HH:mm:ss'
     * @returns 
     */
    format(fmt: string = 'yyyy-MM-dd HH:mm:ss') {
        return formatDateTime(fmt, this);
    }


    add(days: number | string) {
        const parseDelta = (): { unit: 'd' | 'w' | 'm' | 'y', delta: number } => {
            if (typeof days === 'string') {
                const match = days.match(/^(-?\d+)(d|w|m|y)$/);
                if (match) {
                    return { unit: match[2] as 'd' | 'w' | 'm' | 'y', delta: parseInt(match[1]) };
                }
            }
            return { unit: 'd', delta: days as number ?? 0 };
        }
        const { unit, delta } = parseDelta();
        const newDate = new SiYuanDate(this.getTime());
        switch (unit) {
            case 'd': newDate.setDate(newDate.getDate() + delta); break;
            case 'w': newDate.setDate(newDate.getDate() + delta * 7); break;
            case 'm': newDate.setMonth(newDate.getMonth() + delta); break;
            case 'y': newDate.setFullYear(newDate.getFullYear() + delta); break;
        }
        return newDate;
    }
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

    /**
     * Utility for query
     * Every function here is sync function, no need to await
     */
    Utils: {
        Date: (...args: ConstructorParameters<typeof SiYuanDate>) => new SiYuanDate(...args),
        /**
         * Gets timestamp for current time with optional day offset
         * @param days - Number of days to offset (positive or negative)
         * - {number} 直接用数字
         * - {string} 使用字符串，如 '1d' 表示 1 天，'2w' 表示 2 周，'3m' 表示 3 个月，'4y' 表示 4 年
         * - 可以为负数
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        now: (days?: number | string, hms: boolean = true) => {
            let date = new SiYuanDate();
            date = date.add(days);
            return date.toString(hms);
        },

        /**
         * Gets the timestamp for the start of today
         * @param {boolean} hms - Whether to include time, e.g today(false) returns 20241201, today(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        today: (hms: boolean = true) => new SiYuanDate().beginOfDay().toString(hms),

        /**
         * Gets the timestamp for the start of current week
         * @param {boolean} hms - Whether to include time, e.g thisWeek(false) returns 20241201, thisWeek(true) returns 20241201000000
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisWeek: (hms: boolean = true) => {
            let date = new SiYuanDate().beginOfDay();
            date.setDate(date.getDate() - date.getDay());
            return date.toString(hms);
        },

        /**
         * Gets the timestamp for the start of next week
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        lastWeek: (hms: boolean = true) => {
            let date = new SiYuanDate().beginOfDay();
            date.setDate(date.getDate() - 7 - date.getDay());
            return date.toString(hms);
        },

        /**
         * Gets the timestamp for the start of current month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisMonth: (hms: boolean = true) => {
            let date = new SiYuanDate();
            date.setDate(1);
            date = date.beginOfDay();
            return date.toString(hms);
        },

        /**
         * Gets the timestamp for the start of last month
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        lastMonth: (hms: boolean = true) => {
            let date = new SiYuanDate().beginOfDay();
            date.setMonth(date.getMonth() - 1);
            date.setDate(1);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
         * Gets the timestamp for the start of current year
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        thisYear: (hms: boolean = true) => {
            let date = new SiYuanDate().beginOfDay();
            date.setMonth(0);
            date.setDate(1);
            return formatDateTime('yyyyMMdd' + (hms ? 'HHmmss' : ''), date);
        },

        /**
        /**
         * Converts SiYuan timestamp string to Date object
         * @param timestr - SiYuan timestamp (yyyyMMddHHmmss)
         * @returns Date object
         */
        asDate: (timestr: string) => {
            return SiYuanDate.fromString(timestr);
        },

        /**
         * Converts Date object to SiYuan timestamp format
         * @param date - Date to convert
         * @returns Timestamp string in yyyyMMddHHmmss format
         */
        asTimestr: (date: Date) => new SiYuanDate(date).toString(),

        /**
         * Converts a block to a SiYuan link format
         * @param b - Block to convert
         * @returns String in markdown link format
         */
        asLink: (b: Block) => `[${b.fcontent || b.content}](siyuan://blocks/${b.id})`,

        /**
         * Converts a block to a SiYuan reference format
         * @param b - Block to convert
         * @returns String in reference format ((id 'content'))
         */
        asRef: (b: Block) => `((${b.id} '${b.fcontent || b.content}'))`,

        asMap: (blocks: Block[], key: string = 'id') => blocks.reduce((map, block) => {
            map[block[key]] = block;
            return map;
        }, {} as { [key: Block[keyof Block]]: Block }),

        /**
         * Gets notebook information from block or notebook ID
         * @param input - Block object or notebook ID
         * @returns Notebook information
         */
        notebook: (input: Block | NotebookId) => {
            const boxid = typeof input === 'string' ? input : input.box;
            return getNotebook(boxid);
        },
        /**
         * Gets the name of a notebook by its ID; equivalent to `notebook(boxid).name`
         * @param boxid - Notebook ID
         * @returns Notebook name
         * @example
         * Query.Utils.boxName(block['box']) // 'Notebook 123'
         */
        boxName: (boxid: NotebookId) => {
            return getNotebook(boxid).name;
        },
        /**
         * Gets the readable name of the type of a block
         * @param type - Block type
         * @returns Readable block type name
         * @example
         * Query.Utils.typename(block['type']) // 'Heading'
         */
        typeName: (type: BlockType) => BlockTypeShort[type] ?? type,

        /**
         * Given a document block (type='d'), return its emoji icon
         * @param document 
         * @returns emoji icon; if block is not with type='d', return null
         */
        docIcon: (document: Block) => {
            if (document.type !== 'd') return null;
            let icon = wrapBlock(document).asial['icon'];
            return icon ? Query.Utils.emoji(icon) : '📄';
        },

        /**
         * Given emoji code, returl emoji icon
         * @param code 
         * @returns 
         */
        emoji: (code: string) => {
            let codePoint = parseInt(code, 16);
            if (Number.isNaN(codePoint)) return null;
            return String.fromCodePoint(codePoint);
        },

        /**
         * Renders the value of a block attribute as markdown format
         */
        renderAttr: renderAttr,
        openBlock: openBlock
    },

    /**
     * Wraps blocks with additional functionality
     * @param blocks - Blocks to wrap
     * @param useWrapBlock - Whether to wrap blocks inside the WrappedList
     * @returns Wrapped block(s)
     */
    wrapBlocks: (blocks: Block[] | Block, useWrapBlock: boolean = true) => {
        if (Array.isArray(blocks)) {
            return wrapList(blocks, useWrapBlock);
        }
        return wrapBlock(blocks);
    },

    /**
     * SiYuan Kernel Request API
     * @example
     * await Query.request('/api/outline/getDocOutline', {
     *     id: docId
     * });
     */
    request: request,

    /**
     * Gets blocks by their IDs
     * @param ids - Block IDs to retrieve
     * @returns Array of wrapped blocks
     * @alias `id2block`
     */
    getBlocksByIds: async (...ids: (BlockId | BlockId[])[]): Promise<IWrappedList<IWrappedBlock>> => {
        let flattenedIds: BlockId[] = ids.flat() as BlockId[];
        let blocks = await getBlocksByIds(...flattenedIds);
        return Query.wrapBlocks(blocks) as IWrappedList<IWrappedBlock>;
    },

    /**
     * Gets the current document's ID
     * @param protyle - Protyle instance
     * @returns Document ID
     */
    root_id: (protyle: IProtyle) => protyle.block.rootID,

    /**
     * Gets the current document as a block
     * @param protyle - Protyle instance
     * @returns Wrapped document block
     */
    thisDoc: async (protyle: IProtyle) => {
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
    sql: async (fmt: string, wrap: boolean = true): Promise<IWrappedList<IWrappedBlock>> => {
        fmt = fmt.trim();
        let data = await sql(fmt);
        if (data === null || data === undefined) return [] as IWrappedList<IWrappedBlock>;
        // return wrap ? data.map(wrapBlock) : data;
        //@ts-ignore
        return wrap ? wrapList(data) : data;
    },

    /**
     * Finds backlinks to a specific block
     * @param id - Block ID to find backlinks for
     * @param limit - Maximum number of results
     * @returns Array of blocks linking to the specified block
     */
    backlink: async (id: BlockId, limit?: number) => {
        return Query.sql(`
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
        return Query.sql(`
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
     * Search blocks by tags
     * @param tags - Tags to search for; can provide multiple tags
     * @returns Array of blocks matching the tags
     * @example
     * Query.tag('tag1') // Search for blocks with 'tag1'
     * Query.tag(['tag1', 'tag2'], 'or') // Search for blocks with 'tag1' or 'tag2'
     * Query.tag(['tag1', 'tag2'], 'and') // Search for blocks with 'tag1' and 'tag2'
     */
    tag: async (tags: string | string[], join: 'or' | 'and' = 'or', limit?: number) => {
        const ensureTag = (tag: string) => {
            if (!tag.startsWith('#')) {
                tag = `#${tag}`;
            }
            if (!tag.endsWith('#')) {
                tag = `${tag}#`;
            }
            return tag;
        }
        tags = Array.isArray(tags) ? tags : [tags];
        return Query.sql(`select * from blocks where
            ${tags.map(ensureTag).map(tag => `tag like '%${tag}%'`).join(` ${join} `)}
            ${limit ? `limit ${limit}` : ''}
        `);
    },

    /**
     * Find unsolved task blocks
     * @param after - After which the blocks were udpated
     * @param limit - Maximum number of results
     * @returns Array of unsolved task blocks
     * @example
     * Query.task()
     * Query.task('2024101000')
     * Query.task(Query.utils.thisMonth(), 32)
     */
    task: async (after?: string, limit?: number) => {
        const sql = `select * from blocks
        where type = 'i' and subtype = 't'
        and markdown like '* [ ] %'
        ${after ? ` and updated >= ${after}` : ''}
        order by updated desc
        ${limit ? `limit ${limit}` : ''};`
        return Query.sql(sql);
    },

    /**
     * Randomly roam blocks
     * @param limit - Maximum number of results
     * @param type - Block type
     * @returns Array of randomly roamed blocks
     */
    random: async (limit: number = 64, type?: BlockType) => {
        const sql = `select * from blocks
        ${type ? `where type = '${type}'` : ''}
        order by random()
        limit ${limit};`
        return Query.sql(sql);
    },

    /**
     * Gets the daily notes document
     * @param notebook - Notebook ID, if not specified, all daily notes documents will be returned
     * @param limit - Maximum number of results
     * @returns Array of daily notes document blocks
     */
    dailynote: async (notebook?: NotebookId, limit: number = 64) => {
        const sql = `
        SELECT B.*
        FROM blocks AS B
        WHERE B.id IN (
            SELECT A.block_id
            FROM attributes AS A
            WHERE A.name like 'custom-dailynote-%'
        ) AND B.type = 'd' ${notebook ? `AND B.box = '${notebook}'` : ''}
        limit ${limit};
        `
        return Query.sql(sql);
    },

    /**
     * Gets child documents of a block
     * @param b - Parent block or block ID
     * @returns Array of child document blocks
     */
    childDoc: async (b: BlockId | Block) => {
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

    keyword: async (keywords: string | string[], join: 'or' | 'and' = 'or', limit: number = 999) => {
        keywords = Array.isArray(keywords) ? keywords : [keywords];
        const sql = `select * from blocks where ${keywords.map(keyword => `content like '%${keyword}%'`).join(` ${join} `)} limit ${limit}`;
        let results = await Query.sql(sql);
        return results;
    },

    /**
     * Search the document that contains all the keywords.
     * @param keywords 
     * @param join The join operator between keywords, default is 'or'
     * @param limit Maximum number of results to return, default is 999
     * @returns The document blocks that contains all the given keywords; the blocks will attached a 'keywords' property, which is the matched keyword blocks
     * @example
     * let docs = await Query.keywordDoc(['Keywords A', 'Keywords B']);
     * //each block in docs is a document block that contains all the keywords
     * docs[0].keywords['Keywords A'] // get the matched keyword block by using `keywords` property
     */
    keywordDoc: async (keywords: string | string[], join: 'or' | 'and' = 'or', limit: number = 999) => {
        keywords = Array.isArray(keywords) ? keywords : [keywords];
        const sql = `select * from blocks where ${keywords.map(keyword => `content like '%${keyword}%'`).join(` ${join} `)} limit ${limit}`;
        let results = await Query.sql(sql);

        let matchedDocs = {};
        results.groupby(b => b.root_id, (root_id: string, blocks: Block[]) => {
            // root_id 中检索到的含有关键字的块
            // 检查一下是不是所有的关键字都有匹配到
            let contains = Object.fromEntries(keywords.map(keyword => [keyword, null]));
            blocks.forEach(block => {
                keywords.forEach(keyword => {
                    if (block.content.includes(keyword)) {
                        contains[keyword] = block;
                    }
                });
            });
            let matched = true;
            for (let keyword of keywords) {
                if (!contains[keyword]) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                // matchedDocs.push(root_id);
                matchedDocs[root_id] = contains;
            }
        });
        let matchedDocsRootIds = Object.keys(matchedDocs);
        let documents: Block[] = await Query.getBlocksByIds(...matchedDocsRootIds);
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            doc['keywords'] = matchedDocs[doc.root_id];
        }
        return documents;
    },

    /**
     * Return the markdown content of the given block
     * * For normal block, return the markdown attribute of the block
     * * For document block, return the markdown content of the document
     * * For heading block, return the children blocks' markdown content
     * @param block - Block
     * @returns Markdown content of the document
     */
    markdown: async (input: BlockId | Block) => {
        let block: Block = null;
        if (typeof input === 'string') {
            const _ = await getBlocksByIds(input);
            block = _[0];
        } else {
            block = input;
        }
        const id = block.id;
        if (block.type === 'd') {
            const { content } = await request('/api/export/exportMdContent', {
                id: id,
                yfm: false
            });
            return content;
        } else if (block.type === 'h') {
            let dom = await request('/api/block/getHeadingChildrenDOM', {
                id
            });
            const lute = getLute();
            return lute.BlockDOM2StdMd(dom);
        } else {
            return block.markdown;
        }
    },

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
    docStat: async (docId: DocumentId): Promise<{
        "runeCount": number,
        "wordCount": number,
        "linkCount": number,
        "imageCount": number,
        "refCount": number,
        "blockCount": number
    }> => {
        const stat = await request('/api/block/getTreeStat', {
            id: docId
        });
        return stat;
    },

    /**
     * Redirects first block IDs to their parent containers
     * @param inputs - Array of blocks or block IDs
     * @param enable - Configuration for heading and doc processing
     * @param enable.heading - Whether to process heading blocks
     * @param enable.doc - Whether to process document blocks
     * @returns Processed blocks or block IDs
     * @alias `redirect`
     */
    fb2p: async (inputs: Block[], enable?: { heading?: boolean, doc?: boolean }) => {
        // 深度拷贝，防止修改原始输入
        // inputs = structuredClone(inputs);
        inputs = [...inputs];
        /**
         * 处理输入参数
         */
        let types = typeof inputs[0] === 'string' ? 'id' : 'block';
        let ids = types === 'id' ? inputs : (inputs as Block[]).map(b => b.id);
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
                ['NodeBlockquote', 'NodeListItem', 'NodeSuperBlock'].includes(info.parentType) // 容器块的第一个段落块
            ) {
                let resultp = result[result.length - 1];
                resultp.id = info.parentID;
                resultp.type = { 'NodeBlockquote': 'b', 'NodeListItem': 'i', 'NodeSuperBlock': 'sb' }[info.parentType];
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
        return wrapList(result);
    },

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
     */
    pruneBlocks: async (blocks: Block[], keep: 'leaf' | 'root' = 'leaf', advanced: boolean = false) => {
        let results = await pruneBlocks(blocks, keep, advanced);
        return wrapList(results, true);
    },



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
    gpt: async (input: string | { role: 'user' | 'assistant', content: string }[], options?: {
        url?: string,
        model?: string,
        apiKey?: string,
        history?: { role: 'user' | 'assistant', content: string }[],
        returnRaw?: boolean,
        stream?: boolean,
        streamMsg?: (msg: string) => void,
        streamInterval?: number
    }) => {
        let { apiBaseURL, apiModel, apiKey } = window.siyuan.config.ai.openAI;
        apiModel = options?.model ?? apiModel;
        apiKey = options?.apiKey ?? apiKey;
        let url;
        if (options?.url) {
            url = options.url;
        } else {
            url = `${apiBaseURL.endsWith('/') ? apiBaseURL : apiBaseURL + '/'}chat/completions`;
        }

        let messages: { role: 'user' | 'assistant', content: string }[] = [];
        if (typeof input === 'string') {
            messages = [{
                "role": "user",
                "content": input
            }];
        } else {
            messages = [...input];
        }

        if (options?.history) {
            messages = [...options.history, ...messages];
        }

        const payload = {
            "model": apiModel,
            "messages": messages,
            "stream": options?.stream ?? false
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(payload),
                // signal: AbortSignal.timeout(options?.timeout ?? 1000 * 12)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (options?.stream) {
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Failed to get response reader');
                }

                options.streamInterval = options.streamInterval ?? 1;

                const decoder = new TextDecoder();
                let fullText = '';

                try {
                    let chunkIndex = 0;
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            if (line.includes('[DONE]')) {
                                continue;
                            }
                            if (!line.startsWith('data: ')) continue;

                            try {
                                const data = JSON.parse(line.slice(6));
                                if (!data.choices[0].delta?.content) continue;

                                const content = data.choices[0].delta.content;
                                fullText += content;
                                // options.streamMsg?.(fullText);
                            } catch (e) {
                                console.warn('Failed to parse stream data:', e);
                            }
                        }
                        if (chunkIndex % options.streamInterval === 0) {
                            options.streamMsg?.(fullText);
                        }
                        chunkIndex++;
                    }
                } catch (error) {
                    console.error('Stream reading error:', error);
                    throw error;
                } finally {
                    reader.releaseLock();
                }
                return fullText;
            }

            const data = await response.json();
            return options?.returnRaw ? data : data.choices[0].message.content;
        } catch (error) {
            return `[Error] Failed to request openai api, ${error}`;
        }
    }
}

const addAlias = (obj: any, attr: string, alias?: string[]) => {
    if (!(attr in obj)) return;
    alias = alias ?? [];
    alias.forEach(alias => {
        if (alias in obj) return;
        obj[alias] = obj[attr];
    });
}

addAlias(Query, 'DataView', ['Dataview']);
addAlias(Query, 'Utils', ['utils']);
addAlias(Query, 'getBlocksByIds', ['getBlocksByIDs', 'id2block']);
addAlias(Query, 'root_id', ['docId']);
addAlias(Query, 'backlink', ['backlinks']);
addAlias(Query, 'wrapBlocks', ['wrapit']);
addAlias(Query, 'fb2p', ['redirect']);
addAlias(Query, 'pruneBlocks', ['prune', 'mergeBlocks', 'merge']);
const utils = Object.keys(Query.Utils);
utils.forEach(key => {
    addAlias(Query.Utils, key, [key.toLocaleLowerCase()]);
});
Object.keys(Query).forEach(key => {
    addAlias(Query, key, [key.toLocaleLowerCase()]);
});

export default Query;
