/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站 Markdown 渲染与 DOM 增强（UI 注入，零根依赖）。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.3。
 *
 * 渲染管线采用 Lute.Md2HTML（而非 Md2BlockDOM）：产物为纯净标准 HTML
 * （<p>/<ul><li>/<pre><code>/<a href>/<img src>/<h1>），不含 protyle 编辑控件，
 * 因此不会出现列表项圆点、代码块动作条、图片拖拽柄等原生编辑器图标。
 * 容器沿用 b3-typography——思源为这类纯 HTML markdown 内容提供的样式类。
 *
 * 代码高亮：Md2HTML 输出的 <pre><code class="language-xxx"> 为纯文本，高亮由前端 hljs 完成。
 * 复用思源运行时已加载的 window.hljs（protyle 代码块高亮所用）；未加载则降级为纯文本代码块，
 * 不引入 CDN 懒加载以守住文档站离线原则。
 *
 * 本模块不 import "@/index"，不 import scss。
 */

import { getLute } from "@/core/lute";

export interface RenderUi {
    /** 来自 index.ts 引入的 CSS Modules（styles['copy']），非字面类名 */
    copyClass: string;
    /** 本地化文案，由 index.ts 从 plugin.i18n 注入 */
    copyLabel: string;
    /** 复制成功后的临时文案 */
    copiedLabel: string;
}

export interface RenderCtx {
    /** 绝对 base：window.location.origin + pageUrl(lang, id)（用 PageLoadResult 携带的 lang/baseUrl 构造） */
    baseUrl: string;
    ui: RenderUi;
}

export interface OutlineEntry {
    id: string;
    text: string;
    level: number;
    heading: HTMLHeadingElement;
}

/**仅归一化行尾（\r\n 与 \r → \n） */
const normalizeNewlines = (s: string): string => s.replace(/\r\n?/g, "\n");

/**
 * 渲染 markdown 为只读内容容器。
 * 步骤：getLute().Md2HTML(md) → b3-typography 容器 → enhance（高亮、URL 解析、链接、复制按钮）。
 * Md2HTML 产物无 protyle 控件，无需清理原生编辑控件或只读化。
 */
export const renderPage = (md: string, ctx: RenderCtx): HTMLElement => {
    const container = document.createElement("div");
    container.classList.add("b3-typography", "b3-typography--default");

    const html = getLute().Md2HTML(md);
    container.innerHTML = html;

    enhance(container, ctx);
    return container;
};

export const enhance = (container: HTMLElement, ctx: RenderCtx): void => {
    highlightCodeBlocks(container);
    resolveRelativeUrls(container, ctx.baseUrl);
    handleLinks(container, ctx.baseUrl);
    attachCopyButtons(container, ctx.ui);
};

/**
 * 对 <pre><code class="language-xxx"> 调用 window.hljs 高亮（若可用）。
 * 思源运行时通常已加载 hljs（protyle 代码块高亮）；未加载时降级为纯文本，不阻塞渲染。
 */
const highlightCodeBlocks = (container: HTMLElement): void => {
    const hljs = (window as unknown as { hljs?: { highlightElement?: (el: HTMLElement) => void } }).hljs;
    if (!hljs?.highlightElement) return;
    container.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
        try {
            hljs.highlightElement(code);
        } catch (e) {
            // 高亮失败不影响代码文本可读性
            console.warn("[docs-site] hljs highlight failed", e);
        }
    });
};

/**相对 img src 用绝对 base 解析为同源绝对路径；绝对/外部 URL 不动。 */
const resolveRelativeUrls = (container: HTMLElement, baseUrl: string): void => {
    let absBase: URL;
    try {
        absBase = new URL(baseUrl);
    } catch (e) {
        console.warn(`[docs-site] invalid baseUrl: ${baseUrl}`, e);
        return;
    }
    container.querySelectorAll<HTMLImageElement>("img[src]").forEach((img) => {
        const value = img.getAttribute("src");
        if (!value) return;
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || value.startsWith("//")) {
            return; // 绝对/外部 URL 原样保留
        }
        try {
            img.setAttribute("src", new URL(value, absBase).href);
        } catch (e) {
            console.warn(`[docs-site] resolve url failed: ${value}`, e);
        }
    });
};

/**
 * Md2HTML 产出标准 <a href>：
 * - http(s) 外链：补 target=_blank + rel=noopener，新窗口打开；
 * - 锚点（#xxx）：原生，不拦截；
 * - mailto/tel 等带协议的非 http(s)：原生；
 * - 相对链接：文档站无页内路由，默认导航会在插件 Tab 内跳转到不存在的页面，故拦截。
 */
const handleLinks = (container: HTMLElement, baseUrl: string): void => {
    let absBase: URL;
    try {
        absBase = new URL(baseUrl);
    } catch (e) {
        console.warn(`[docs-site] invalid baseUrl: ${baseUrl}`, e);
        return;
    }
    container.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        if (!href || href.startsWith("#")) return;
        let resolved: URL;
        try {
            resolved = new URL(href, absBase);
        } catch (e) {
            return;
        }
        if (resolved.protocol === "http:" || resolved.protocol === "https:") {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            return;
        }
        // 非 http(s) 且为相对路径（无协议头）→ 拦截，避免 Tab 内无效导航
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
            a.addEventListener("click", (ev) => ev.preventDefault());
        }
        // 带 protocol 的非 http(s)（mailto:/tel: 等）保持原生行为
    });
};

const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch (e2) {
            return false;
        }
    }
};

/**
 * 为每个代码块（<pre><code>）追加复制按钮：
 * - 按钮插入前先捕获 code 的文本，按钮标签不会进入剪贴板；
 * - 按钮追加到 pre 元素（与 code 同级），由 CSS 定位到代码块右上角；
 * - 复制文本做行尾归一化。
 */
const attachCopyButtons = (container: HTMLElement, ui: RenderUi): void => {
    container.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
        const pre = code.parentElement as HTMLElement | null;
        if (!pre) return;
        // 捕获必须先于按钮插入
        const text = normalizeNewlines(code.textContent ?? "");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = ui.copyClass;
        btn.textContent = ui.copyLabel;
        btn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const ok = await copyText(text);
            if (ok) {
                btn.textContent = ui.copiedLabel;
                setTimeout(() => {
                    btn.textContent = ui.copyLabel;
                }, 1500);
            }
        });
        pre.appendChild(btn);
    });
};

/**
 * 提取页面标题并为没有 id 的标题补充稳定的页面内 id。
 * Lute 当前关闭了自动标题 id，因此 Outline 需要在渲染后建立自己的定位点。
 */
export const extractOutline = (container: HTMLElement): OutlineEntry[] => {
    const usedIds = new Set<string>();
    const headings = container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6");
    const entries: OutlineEntry[] = [];

    headings.forEach((heading, index) => {
        const text = normalizeNewlines(heading.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!text) return;

        const baseId = heading.id.trim() || `qv-doc-heading-${index + 1}`;
        let id = baseId;
        let suffix = 2;
        while (usedIds.has(id)) {
            id = `${baseId}-${suffix++}`;
        }
        heading.id = id;
        usedIds.add(id);
        entries.push({
            id,
            text,
            level: Number(heading.tagName.slice(1)),
            heading,
        });
    });

    return entries;
};

/**首个 H1 文本（Md2HTML 产物 <h1>，备用，不用于导航） */
export const extractTitle = (container: HTMLElement): string | null => {
    const h1 = container.querySelector("h1");
    return h1 ? (h1.textContent ?? "").trim() || null : null;
};
