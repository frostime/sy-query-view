/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站 Markdown 渲染与 DOM 增强（UI 注入，零根依赖）。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.3。
 *                 选择器基于 Lute Md2BlockDOM 实际产物（证据：88250/lute test/m2p_test.go）：
 *                 代码块 [data-type="NodeCodeBlock"]/.code-block 内含 .hljs；链接为 [data-type~="a"] + data-href；
 *                 标题 [data-type="NodeHeading"][data-subtype="h1"]；图片 <img src data-src>。
 *                 本模块不 import "@/index"，不 import scss。
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

/** 仅归一化行尾（\r\n 与 \r → \n） */
const normalizeNewlines = (s: string): string => s.replace(/\r\n?/g, "\n");

/**
 * Lute Md2BlockDOM 产物中需要清理的原生编辑控件（证据：88250/lute test/m2p_test.go 用例）：
 * - 代码块动作条：[data-type="NodeCodeBlock"] 内的 .protyle-action（语言标签 + 原生复制/菜单图标）；
 * - 图片图标条：[data-type="img"] 内的 .protyle-action，及图片专用控件
 *   .protyle-action__drag（拖拽柄）、.img__net（网络来源标记）、.protyle-action__title（标题）；
 * - 块属性占位 .protyle-attr（空内容）。
 * 注意：并非所有 .protyle-action 都是编辑器控件——任务列表复选框
 * （.protyle-action--task，用例 32）是内容的一部分，必须保留，因此按代码块/图片上下文收窄清理。
 */
const NATIVE_CONTROL_SELECTORS = [
    '[data-type="NodeCodeBlock"] .protyle-action',
    '[data-type="img"] .protyle-action',
    ".protyle-action__drag",
    ".img__net",
    ".protyle-action__title",
    ".protyle-attr",
];

/**
 * 删除代码块/图片上下文中的 Lute 原生编辑控件 DOM；
 * 保留任务列表复选框等有意义内容；不触碰图片、.hljs 代码文本或文档站自建按钮。
 */
const removeNativeEditorControls = (container: HTMLElement): void => {
    container.querySelectorAll<HTMLElement>(NATIVE_CONTROL_SELECTORS.join(",")).forEach((el) => {
        el.remove();
    });
};

/**
 * 渲染 markdown 为只读内容容器。
 * 步骤：getLute().Md2BlockDOM(md) → 删除原生编辑控件 → 只读化 → b3-typography 容器 → enhance（注入文档站复制按钮）。
 */
export const renderPage = (md: string, ctx: RenderCtx): HTMLElement => {
    const container = document.createElement("div");
    container.classList.add("b3-typography", "b3-typography--default");

    const html = getLute().Md2BlockDOM(md);
    container.innerHTML = html;

    // 原生编辑控件 DOM 删除（必须先于文档站复制按钮注入）
    removeNativeEditorControls(container);

    // 只读化（先例 src/core/components.ts MarkdownComponent）：Md2BlockDOM 产物中的可编辑元素一律禁用
    container.querySelectorAll('[contenteditable="true"]').forEach((node) => {
        node.setAttribute("contenteditable", "false");
    });

    enhance(container, ctx);
    return container;
};

export const enhance = (container: HTMLElement, ctx: RenderCtx): void => {
    resolveRelativeUrls(container, ctx.baseUrl);
    handleLinks(container, ctx.baseUrl);
    attachCopyButtons(container, ctx.ui);
};

/** 相对 img src/data-src 用绝对 base 解析为同源绝对路径；绝对/外部 URL 不动。 */
const resolveRelativeUrls = (container: HTMLElement, baseUrl: string): void => {
    let absBase: URL;
    try {
        absBase = new URL(baseUrl);
    } catch (e) {
        console.warn(`[docs-site] invalid baseUrl: ${baseUrl}`, e);
        return;
    }
    container.querySelectorAll<HTMLElement>("img[src], img[data-src]").forEach((img) => {
        for (const attr of ["src", "data-src"]) {
            const value = img.getAttribute(attr);
            if (!value) continue;
            if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || value.startsWith("//")) {
                continue; // 绝对/外部 URL 原样保留
            }
            try {
                img.setAttribute(attr, new URL(value, absBase).href);
            } catch (e) {
                console.warn(`[docs-site] resolve url failed: ${value}`, e);
            }
        }
    });
};

/**
 * Lute 把链接渲染为 [data-type~="a"]（空格分隔类型，如 "a"、"u a"、"strong a"、"sup a"、"a code"）+ data-href，
 * 而非 <a href>。本地 data-href 按实际页面 base 解析；http(s) 结果可点击（window.open），其余保持纯文本。
 * javascript: 等危险协议 Lute 已渲染为空 data-href（m2p_test.go case 117），此处跳过。
 */
const handleLinks = (container: HTMLElement, baseUrl: string): void => {
    let absBase: URL;
    try {
        absBase = new URL(baseUrl);
    } catch (e) {
        console.warn(`[docs-site] invalid baseUrl: ${baseUrl}`, e);
        return;
    }
    container.querySelectorAll<HTMLElement>("[data-type]").forEach((el) => {
        const types = (el.getAttribute("data-type") ?? "").split(/\s+/);
        if (!types.includes("a")) return;
        const href = el.getAttribute("data-href");
        if (!href) return; // 空 href（javascript: 等被 Lute 清空）→ 纯文本
        let resolved: URL;
        try {
            resolved = new URL(href, absBase);
        } catch (e) {
            return;
        }
        if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
            return; // 非 http(s)（mailto:/#片段 等）→ 保持纯文本
        }
        el.style.cursor = "pointer";
        el.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            window.open(resolved.href, "_blank");
        });
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
 * 为每个代码块（[data-type="NodeCodeBlock"]）追加复制按钮：
 * - 按钮插入前先捕获 .hljs 的文本（m2p_test.go 产物中代码文本位于 .hljs 内），按钮标签不会进入剪贴板；
 * - 按钮追加到代码块元素（与 .protyle-action/.hljs 同级）；
 * - 复制文本做行尾归一化。
 */
const attachCopyButtons = (container: HTMLElement, ui: RenderUi): void => {
    container.querySelectorAll<HTMLElement>('[data-type="NodeCodeBlock"]').forEach((block) => {
        const hljs = block.querySelector<HTMLElement>(".hljs");
        if (!hljs) return;
        // 捕获必须先于按钮插入
        const text = normalizeNewlines(hljs.textContent ?? "");

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
        block.appendChild(btn);
    });
};

/** 首个 H1 文本（Lute 标题 DOM：[data-type="NodeHeading"][data-subtype="h1"]，备用，不用于导航） */
export const extractTitle = (container: HTMLElement): string | null => {
    const h1 = container.querySelector('[data-type="NodeHeading"][data-subtype="h1"]');
    return h1 ? (h1.textContent ?? "").trim() || null : null;
};
