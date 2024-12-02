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
    Query: typeof import("@/core/query").default;
    mermaid: any;
    echarts: any;
}

// globalThis
declare interface GlobalThis {
    Query: typeof import("@/core/query").default;
}
