/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站内容读取与故障处理（工厂，插件名透传，状态化加载结果）。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.2/§5。
 */

import { pagePath, type Lang, type PageId } from "./nav";

export type PageLoadResult =
    | { status: "ok"; lang: Lang; pageId: PageId; markdown: string; baseUrl: string }
    | { status: "fallback"; lang: Lang; pageId: PageId; markdown: string; baseUrl: string; requestedLang: Lang }
    | { status: "error"; lang: Lang; pageId: PageId; reason: "not-found" | "network" };

export interface ContentApi {
    /** window.siyuan.config.lang 以 zh 开头 → zh_CN，否则 en_US */
    resolveLang(): Lang;
    otherLang(l: Lang): Lang;
    /** "/plugins/{pluginName}/docs/{lang}/{path}" */
    pageUrl(lang: Lang, id: PageId): string;
    /** 状态化加载；成功（ok/fallback）内容入 Map 缓存 (lang,id)，失败不缓存 */
    loadPage(lang: Lang, id: PageId): Promise<PageLoadResult>;
    /** 仅删 docs-only 标记行、保留内容（与 README 生成器相反） */
    stripDocsOnlyMarkers(md: string): string;
    /** {{example:<file>}} → ```js 围栏；文件从 /plugins/{pluginName}/example/<file> 读取并缓存 */
    expandExamples(md: string): Promise<string>;
    /** {{skill:<name>}} → frontmatter 转 yaml 围栏 + 正文 Markdown；只接受安全技能名，固定映射本地 skills/{name}/SKILL.md */
    expandSkill(md: string): Promise<string>;
    clearCache(): void;
}

/** 占位符只接受安全技能名（字母/数字/下划线/连字符），固定映射到 skills/{name}/SKILL.md */
const SKILL_PLACEHOLDER = /\{\{skill:([a-zA-Z0-9_-]+)\}\}/g;

/**
 * Skill 展示转换（与 scripts/build-docs.js 的 skillToDisplay 逻辑必须逐字节一致）：
 * YAML frontmatter（开头的 --- 块）作为 yaml fenced code block 显示，frontmatter 后的正文继续按
 * Markdown 渲染；输入按 LF 归一化；无 frontmatter 时完整正文直接显示。不解析或改写 Skill 规则内容。
 */
export const skillToDisplay = (raw: string): string => {
    const text = raw.replace(/\r\n?/g, "\n");
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
    if (!m) return text;
    const yaml = m[1].replace(/\n+$/, "");
    const body = text.slice(m[0].length).replace(/^\n+/, "");
    return "```yaml\n" + yaml + "\n```\n\n" + body;
};

/** 仅归一化行尾（\r\n 与 \r → \n），用于展示与复制的一致性 */
const normalizeNewlines = (s: string): string => s.replace(/\r\n?/g, "\n");

export const createContent = (pluginName: string): ContentApi => {
    const pageCache = new Map<string, string>();   // key: `${lang}/${pageId}`
    const exampleCache = new Map<string, string>(); // key: file
    const skillCache = new Map<string, string>();  // key: skill name（独立成功缓存）

    const base = `/plugins/${pluginName}`;

    const resolveLang = (): Lang =>
        window.siyuan.config.lang.startsWith("zh") ? "zh_CN" : "en_US";

    const otherLang = (l: Lang): Lang => (l === "zh_CN" ? "en_US" : "zh_CN");

    const pageUrl = (lang: Lang, id: PageId): string =>
        `${base}/docs/${lang}/${pagePath(id)}`;

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
                    return { ok: true, status: res.status, text: await res.text() };
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

    const loadSkill = async (name: string): Promise<string> => {
        const cached = skillCache.get(name);
        if (cached !== undefined) {
            return cached;
        }
        const url = `${base}/skills/${name}/SKILL.md`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const raw = normalizeNewlines(await res.text());
            skillCache.set(name, raw);
            return raw;
        } catch (e) {
            console.warn(`[docs-site] skill not found: ${url}`, e);
            // 失败不缓存；页面其他说明仍可读，仅占位符位置显示缺失提示
            return `> ⚠️ Skill 内容缺失 / Skill content missing: skills/${name}/SKILL.md`;
        }
    };

    /**
     * 按原始页面占位符索引切片重建输出：插入的 Skill 文本永不重扫/二次展开。
     * 异步按占位符出现顺序依次 await（缓存与安全名行为不变）。
     */
    const expandSkill = async (md: string): Promise<string> => {
        const matches = [...md.matchAll(SKILL_PLACEHOLDER)];
        if (matches.length === 0) return md;
        const parts: string[] = [];
        let last = 0;
        for (const m of matches) {
            const raw = await loadSkill(m[1]);
            const idx = m.index ?? 0;
            parts.push(md.slice(last, idx), skillToDisplay(raw));
            last = idx + m[0].length;
        }
        parts.push(md.slice(last));
        return parts.join("");
    };

    const clearCache = (): void => {
        pageCache.clear();
        exampleCache.clear();
        skillCache.clear();
    };

    return { resolveLang, otherLang, pageUrl, loadPage, stripDocsOnlyMarkers, expandExamples, expandSkill, clearCache };
};
