/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站静态导航树（页面目录的唯一所有者）。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/define-doc-structure/DOC-STRUCTURE.md §1.2。
 *                 新增页面需同步修改 DOC-STRUCTURE 与本文件。
 */

export type Lang = "zh_CN" | "en_US";

export type PageId =
    | "index"
    | "quickstart-concepts"
    | "quickstart-template"
    | "examples"
    | "topic-query"
    | "topic-dataview"
    | "topic-dataview-advanced"
    | "topic-editor-tips"
    | "breakchange"
    | "agent-ref-query-api"
    | "agent-ref-dataview"
    | "agent-ref-wrapped"
    | "agent-ref-types"
    | "skill";

/**
 * 侧边栏标签键，必须与 i18n 中 src_docsite_indexts 的对应键一致
 * （编译期通过索引访问校验）。
 */
export type NavLabelKey =
    | "nav_index"
    | "nav_group_tutorials"
    | "nav_group_reference"
    | "nav_quickstart_concepts"
    | "nav_quickstart_template"
    | "nav_topic_query"
    | "nav_topic_dataview"
    | "nav_topic_dataview_advanced"
    | "nav_topic_editor_tips"
    | "nav_examples"
    | "nav_breakchange"
    | "nav_agent_ref_query_api"
    | "nav_agent_ref_dataview"
    | "nav_agent_ref_wrapped"
    | "nav_agent_ref_types"
    | "nav_skill";

/** 判别联合：分组无 id/path（无页面），条目有页面。 */
export type NavNode = NavGroup | NavItem;

export interface NavGroup {
    kind: "group";
    labelKey: NavLabelKey;
    children: NavItem[];
}

export interface NavItem {
    kind: "item";
    id: PageId;
    /** 常规页：相对 docs/{lang}/ 的路径（如 "topics/query.md"）；standalone 存在时可省略 */
    path?: string;
    labelKey: NavLabelKey;
    /** 独立页：插件根相对的文件路径模板，{lang} 会替换为语言代码（如 "BREAKCHANGE/{lang}.md"） */
    standalone?: string;
}

/** 顶层可为 NavItem（首页等）或 NavGroup；顺序严格对应 DOC-STRUCTURE §1.2 侧边栏。 */
export const PAGE_TREE: NavNode[] = [
    { kind: "item", id: "index", path: "index.md", labelKey: "nav_index" },
    { kind: "item", id: "breakchange", labelKey: "nav_breakchange", standalone: "BREAKCHANGE/{lang}.md" },
    {
        kind: "group",
        labelKey: "nav_group_tutorials",
        children: [
            { kind: "item", id: "quickstart-concepts", path: "quickstart/concepts.md", labelKey: "nav_quickstart_concepts" },
            { kind: "item", id: "quickstart-template", path: "quickstart/template.md", labelKey: "nav_quickstart_template" },
            { kind: "item", id: "topic-query", path: "topics/query.md", labelKey: "nav_topic_query" },
            { kind: "item", id: "topic-dataview", path: "topics/dataview.md", labelKey: "nav_topic_dataview" },
            { kind: "item", id: "topic-dataview-advanced", path: "topics/dataview-advanced.md", labelKey: "nav_topic_dataview_advanced" },
            { kind: "item", id: "topic-editor-tips", path: "topics/editor-tips.md", labelKey: "nav_topic_editor_tips" },
            { kind: "item", id: "examples", path: "examples/index.md", labelKey: "nav_examples" },
        ],
    },
    {
        kind: "group",
        labelKey: "nav_group_reference",
        children: [
            { kind: "item", id: "agent-ref-query-api", path: "agent-ref/query-api.md", labelKey: "nav_agent_ref_query_api" },
            { kind: "item", id: "agent-ref-dataview", path: "agent-ref/dataview.md", labelKey: "nav_agent_ref_dataview" },
            { kind: "item", id: "agent-ref-wrapped", path: "agent-ref/wrapped.md", labelKey: "nav_agent_ref_wrapped" },
            { kind: "item", id: "agent-ref-types", path: "agent-ref/types.md", labelKey: "nav_agent_ref_types" },
            { kind: "item", id: "skill", path: "skill/index.md", labelKey: "nav_skill" },
        ],
    },
];

/** 在 PAGE_TREE 中查找指定页面条目。 */
const findItem = (id: PageId): NavItem | undefined => {
    const find = (nodes: NavNode[]): NavItem | undefined => {
        for (const node of nodes) {
            if (node.kind === "item") {
                if (node.id === id) return node;
            } else {
                const hit = find(node.children);
                if (hit) return hit;
            }
        }
        return undefined;
    };
    return find(PAGE_TREE);
};

/** 页面的插件根相对文件路径：常规页 docs/{lang}/<path>；独立页按 standalone 模板替换 {lang}。 */
export const pageFile = (id: PageId, lang: Lang): string => {
    const item = findItem(id);
    if (!item) {
        throw new Error(`[docs-site] unknown page id: ${id}`);
    }
    if (item.standalone) {
        return item.standalone.replace("{lang}", lang);
    }
    if (!item.path) {
        throw new Error(`[docs-site] page has neither path nor standalone: ${id}`);
    }
    return `docs/${lang}/${item.path}`;
};
