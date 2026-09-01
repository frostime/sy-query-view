/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站内容读取与故障处理（工厂，插件名透传，状态化加载结果）。
 *                 取页时替换站点变量（${{PLUGIN_VERSION}} → 运行时读取的 plugin.json 版本）。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.2/§5。
 */

import { pageFile, type Lang, type PageId } from "./nav";

export type PageLoadResult =
    | { status: "ok"; lang: Lang; pageId: PageId; markdown: string; baseUrl: string }
    | { status: "fallback"; lang: Lang; pageId: PageId; markdown: string; baseUrl: string; requestedLang: Lang }
    | { status: "error"; lang: Lang; pageId: PageId; reason: "not-found" | "network" };

export interface ContentApi {
    /** window.siyuan.config.lang 以 zh 开头 → zh_CN，否则 en_US */
    resolveLang(): Lang;
    otherLang(l: Lang): Lang;
    /** "/plugins/{pluginName}/<pageFile>，如 docs/zh_CN/topics/query.md 或 BREAKCHANGE/zh_CN.md */
    pageUrl(lang: Lang, id: PageId): string;
    /** 状态化加载；成功（ok/fallback）内容入 Map 缓存 (lang,id)，失败不缓存；内容含站点变量替换 */
    loadPage(lang: Lang, id: PageId): Promise<PageLoadResult>;
    /** 仅删除 docs-only 标记行、保留内容，供文档站只读渲染 */
    stripDocsOnlyMarkers(md: string): string;
    /** {{example:<file>}} → ```js 围栏；文件从 /plugins/{pluginName}/example/<file> 读取并缓存 */
    expandExamples(md: string): Promise<string>;
    clearCache(): void;
}

/** 仅归一化行尾（\r\n 与 \r → \n），用于展示与复制的一致性 */
const normalizeNewlines = (s: string): string => s.replace(/\r\n?/g, "\n");

/** 页面内容变量：当前插件版本，如 BREAKCHANGE 开头的「当前版本」行 */
const PLUGIN_VERSION_VAR = "${{PLUGIN_VERSION}}";

export const createContent = (
    pluginName: string,
    getPluginVersion: () => Promise<string>,
): ContentApi => {
    const pageCache = new Map<string, string>();   // key: `${lang}/${pageId}`
    const exampleCache = new Map<string, string>(); // key: file

    const base = `/plugins/${pluginName}`;

    const resolveLang = (): Lang =>
        window.siyuan.config.lang.startsWith("zh") ? "zh_CN" : "en_US";

    const otherLang = (l: Lang): Lang => (l === "zh_CN" ? "en_US" : "zh_CN");

    const pageUrl = (lang: Lang, id: PageId): string =>
        `${base}/${pageFile(id, lang)}`;

    /** 仅在页面含占位符时读取版本，避免普通页面增加一次 plugin.json 请求 */
    const expandVersionVar = async (md: string): Promise<string> => {
        if (!md.includes(PLUGIN_VERSION_VAR)) return md;
        const version = await getPluginVersion();
        return md.split(PLUGIN_VERSION_VAR).join(version);
    };

    const loadPage = async (lang: Lang, id: PageId): Promise<PageLoadResult> => {
        const cacheKey = `${lang}/${id}`;
        const cached = pageCache.get(cacheKey);
        if (cached !== undefined) {
            return { status: "ok", lang, pageId: id, markdown: cached, baseUrl: pageUrl(lang, id) };
        }

        const fetchOne = async (l: Lang): Promise<{ ok: boolean; status: number; text: string }> => {
            try {
                const res = await fetch(pageUrl(l, id));
                if (res.ok) {
                    return { ok: true, status: res.status, text: await expandVersionVar(await res.text()) };
                }
                return { ok: false, status: res.status, text: "" };
            } catch (e) {
                console.warn(`[docs-site] fetch failed: ${pageUrl(l, id)}`, e);
                return { ok: false, status: 0, text: "" };
            }
        };

        const first = await fetchOne(lang);
        if (first.ok) {
            pageCache.set(cacheKey, first.text);
            return { status: "ok", lang, pageId: id, markdown: first.text, baseUrl: pageUrl(lang, id) };
        }
        // 仅 404 触发另一语言回退；5xx/网络异常直接 error（不回退）
        if (first.status === 404) {
            const alt = otherLang(lang);
            const altKey = `${alt}/${id}`;
            const altCached = pageCache.get(altKey);
            if (altCached !== undefined) {
                return { status: "fallback", lang: alt, pageId: id, markdown: altCached, baseUrl: pageUrl(alt, id), requestedLang: lang };
            }
            const second = await fetchOne(alt);
            if (second.ok) {
                pageCache.set(altKey, second.text);
                return { status: "fallback", lang: alt, pageId: id, markdown: second.text, baseUrl: pageUrl(alt, id), requestedLang: lang };
            }
            // 仅“两种语言都 404”才是 not-found；另一语言 5xx/网络异常归类为 network
            return {
                status: "error",
                lang,
                pageId: id,
                reason: second.status === 404 ? "not-found" : "network",
            };
        }
        return { status: "error", lang, pageId: id, reason: "network" };
    };

    const stripDocsOnlyMarkers = (md: string): string =>
        md
            .replace(/^[ \t]*<!-- docs-only:start -->[ \t]*\r?\n?/gm, "")
            .replace(/^[ \t]*<!-- docs-only:end -->[ \t]*\r?\n?/gm, "");

    const loadExample = async (file: string): Promise<string> => {
        const cached = exampleCache.get(file);
        if (cached !== undefined) {
            return cached;
        }
        const url = `${base}/example/${file}`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const text = normalizeNewlines(await res.text()).replace(/\s+$/, "");
            exampleCache.set(file, text);
            return text;
        } catch (e) {
            console.warn(`[docs-site] example not found: ${file}`, e);
            return `// [docs] example not found: ${file}`;
        }
    };

    const expandExamples = async (md: string): Promise<string> => {
        const placeholders = md.match(/\{\{example:([\w.-]+)\}\}/g) ?? [];
        let out = md;
        for (const ph of placeholders) {
            const file = ph.slice("{{example:".length, -"}}".length);
            const code = await loadExample(file);
            out = out.split(ph).join("```js\n" + code + "\n```");
        }
        return out;
    };

    const clearCache = (): void => {
        pageCache.clear();
        exampleCache.clear();
    };

    return { resolveLang, otherLang, pageUrl, loadPage, stripDocsOnlyMarkers, expandExamples, clearCache };
};
