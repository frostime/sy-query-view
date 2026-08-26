/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站 Tab 注册/打开、页面状态、页面动作与异步竞态控制。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.4/§4/§5。
 *                 本模块不 import "@/index"（i18n 经 plugin.i18n 注入）。
 */

import { Custom, openTab } from "siyuan";
import type QueryViewPlugin from "@/index";
import { setting } from "@/setting";
import { canOpenLocally, downloadDts, getPluginInfo, openDtsLocally } from "@/user-help/dts-actions";
import { PAGE_TREE, type Lang, type NavItem, type NavLabelKey, type PageId } from "./nav";
import { createContent, type ContentApi, type PageLoadResult } from "./content";
import { extractOutline, renderPage, type OutlineEntry, type RenderCtx, type RenderUi } from "./render";
import styles from "./index.module.scss";

export interface DocsSite {
    open: (initialPageId?: PageId) => void;
    dispose: () => void;
}

interface PageAction {
    label: string;
    run: () => void;
}

export const load = async (plugin: QueryViewPlugin): Promise<DocsSite> => {
    const i18n = plugin.i18n as unknown as I18n;
    const content: ContentApi = createContent(plugin.name);
    // 站点生命周期代数：dispose 时自增，使所有在途 Tab 请求失效（即使 SiYuan 未先调 destroy）
    let siteGeneration = 0;
    let outlinePanelSequence = 0;
    // 每个 Tab 实例的清理函数按实例存储（destroy 只清理自己的实例）
    const tabCleanups = new WeakMap<Custom, () => void>();

    const label = (key: NavLabelKey): string => i18n.src_docsite_indexts[key];
    const langName = (l: Lang): string =>
        l === "zh_CN" ? i18n.src_docsite_indexts.lang_zh : i18n.src_docsite_indexts.lang_en;

    const ui: RenderUi = {
        copyClass: styles["copy"],
        copyLabel: i18n.src_docsite_indexts.copy,
        copiedLabel: i18n.src_docsite_indexts.copied,
    };

    // 版本信息缓存（plugin.json 一次获取）
    let pluginInfoCache: { name: string; version: string } | null = null;
    const ensurePluginInfo = async (): Promise<{ name: string; version: string }> => {
        if (!pluginInfoCache) {
            pluginInfoCache = await getPluginInfo(plugin.name);
        }
        return pluginInfoCache;
    };

    // API 页动作：依赖叶 dts-actions，与既有菜单共用实现
    const pageActions: Partial<Record<PageId, PageAction[]>> = {};

    plugin.addTab({
        type: "docs-site",
        init() {
            const root = document.createElement("div");
            root.className = styles["root"];
            this.element.appendChild(root);

            // 初始页：openTab custom.data.pageId（无则首页）
            const initialPageId = (this.data?.pageId as PageId | undefined) ?? "index";
            const state: { lang: Lang; pageId: PageId } = {
                lang: content.resolveLang(),
                pageId: initialPageId,
            };
            let requestSeq = 0;
            let disposed = false;

            const navItems = new Map<PageId, HTMLElement>();

            const main = document.createElement("main");
            main.className = styles["main"];
            root.appendChild(main);

            const noticeBar = document.createElement("div");
            noticeBar.className = styles["notice"];
            noticeBar.hidden = true;
            main.appendChild(noticeBar);

            const contentHost = document.createElement("div");
            main.appendChild(contentHost);

            // ---- 页面大纲：右下角按钮 + 向上展开的悬浮标题树 ----
            let outlineEntries: OutlineEntry[] = [];
            const outlineButtons = new Map<string, HTMLButtonElement>();
            const outlinePanelId = `docs-site-outline-panel-${++outlinePanelSequence}`;

            const outlineToggle = document.createElement("button");
            outlineToggle.type = "button";
            outlineToggle.className = styles["outlineToggle"];
            outlineToggle.dataset["outlineToggle"] = "";
            outlineToggle.hidden = true;
            outlineToggle.setAttribute("aria-expanded", "false");
            outlineToggle.setAttribute("aria-controls", outlinePanelId);
            outlineToggle.title = i18n.src_docsite_indexts.outline;

            const outlineIcon = document.createElement("span");
            outlineIcon.className = styles["outlineIcon"];
            outlineIcon.textContent = "☷";
            outlineIcon.setAttribute("aria-hidden", "true");
            outlineToggle.appendChild(outlineIcon);

            const outlineToggleLabel = document.createElement("span");
            outlineToggleLabel.textContent = i18n.src_docsite_indexts.outline;
            outlineToggle.appendChild(outlineToggleLabel);

            const outlinePanel = document.createElement("section");
            outlinePanel.id = outlinePanelId;
            outlinePanel.className = styles["outlinePanel"];
            outlinePanel.hidden = true;
            outlinePanel.setAttribute("aria-label", i18n.src_docsite_indexts.outline_title);

            const outlineHeader = document.createElement("div");
            outlineHeader.className = styles["outlineHeader"];
            const outlineTitle = document.createElement("span");
            outlineTitle.textContent = i18n.src_docsite_indexts.outline_title;
            outlineHeader.appendChild(outlineTitle);

            const outlineClose = document.createElement("button");
            outlineClose.type = "button";
            outlineClose.className = styles["outlineClose"];
            outlineClose.dataset["outlineClose"] = "";
            outlineClose.setAttribute("aria-label", i18n.src_docsite_indexts.outline_close);
            outlineClose.textContent = "×";
            outlineHeader.appendChild(outlineClose);
            outlinePanel.appendChild(outlineHeader);

            const outlineList = document.createElement("nav");
            outlineList.className = styles["outlineList"];
            outlineList.setAttribute("aria-label", i18n.src_docsite_indexts.outline_title);
            outlinePanel.appendChild(outlineList);
            root.append(outlineToggle, outlinePanel);

            const setOutlineOpen = (open: boolean): void => {
                outlinePanel.hidden = !open;
                outlineToggle.setAttribute("aria-expanded", String(open));
            };

            const updateOutlineActive = (): void => {
                if (outlineEntries.length === 0) return;
                const threshold = main.getBoundingClientRect().top + 24;
                let active = outlineEntries[0];
                for (const entry of outlineEntries) {
                    if (entry.heading.getBoundingClientRect().top <= threshold) {
                        active = entry;
                    } else {
                        break;
                    }
                }
                outlineButtons.forEach((button, id) => {
                    button.classList.toggle(styles["outlineItemActive"], id === active.id);
                });
            };

            const setOutline = (entries: OutlineEntry[]): void => {
                outlineEntries = entries;
                outlineButtons.clear();
                outlineList.textContent = "";
                entries.forEach((entry) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = styles["outlineItem"];
                    button.dataset["outlineId"] = entry.id;
                    button.dataset["level"] = String(entry.level);
                    button.title = entry.text;
                    button.textContent = entry.text;
                    outlineButtons.set(entry.id, button);
                    outlineList.appendChild(button);
                });

                const hasOutline = entries.length > 0;
                outlineToggle.hidden = !hasOutline;
                if (!hasOutline) setOutlineOpen(false);
                updateOutlineActive();
            };

            const scrollToOutline = (id: string): void => {
                const entry = outlineEntries.find((item) => item.id === id);
                entry?.heading.scrollIntoView({ behavior: "smooth", block: "start" });
            };
            main.addEventListener("scroll", updateOutlineActive, { passive: true });

            // ---- 侧边栏：静态导航 ----
            const sidebar = document.createElement("aside");
            sidebar.className = styles["sidebar"];
            root.insertBefore(sidebar, main);

            const nav = document.createElement("nav");
            nav.className = styles["nav"];
            sidebar.appendChild(nav);

            const makeNavItem = (item: NavItem): HTMLElement => {
                const el = document.createElement("button");
                el.type = "button";
                el.className = styles["navItem"];
                el.dataset["pageId"] = item.id;
                el.textContent = label(item.labelKey);
                navItems.set(item.id, el);
                return el;
            };

            for (const node of PAGE_TREE) {
                if (node.kind === "group") {
                    const g = document.createElement("div");
                    g.className = styles["navGroup"];
                    g.textContent = label(node.labelKey);
                    nav.appendChild(g);
                    for (const item of node.children) {
                        nav.appendChild(makeNavItem(item));
                    }
                } else {
                    nav.appendChild(makeNavItem(node));
                }
            }

            const setActiveNav = (pageId: PageId): void => {
                navItems.forEach((el, id) => {
                    el.classList.toggle(styles["navItemActive"], id === pageId);
                });
            };

            // ---- 事件委托（单一监听器）----
            const onClick = (ev: MouseEvent): void => {
                const target = ev.target as HTMLElement;
                if (target.closest<HTMLElement>("[data-outline-toggle]")) {
                    setOutlineOpen(Boolean(outlinePanel.hidden));
                    return;
                }
                if (target.closest<HTMLElement>("[data-outline-close]")) {
                    setOutlineOpen(false);
                    return;
                }
                const outlineEl = target.closest<HTMLElement>("[data-outline-id]");
                if (outlineEl?.dataset["outlineId"]) {
                    scrollToOutline(outlineEl.dataset["outlineId"]);
                    return;
                }
                const navEl = target.closest<HTMLElement>("[data-page-id]");
                if (navEl?.dataset["pageId"]) {
                    navigate(state.lang, navEl.dataset["pageId"] as PageId);
                    return;
                }
                const retryEl = target.closest<HTMLElement>("[data-retry]");
                if (retryEl) {
                    navigate(state.lang, state.pageId);
                }
            };
            root.addEventListener("click", onClick);

            // ---- 内容渲染 ----
            const renderContent = (result: Extract<PageLoadResult, { status: "ok" | "fallback" }>, md: string): void => {
                noticeBar.hidden = true;
                if (result.status === "fallback") {
                    noticeBar.hidden = false;
                    noticeBar.textContent = i18n.src_docsite_indexts.fallback_notice
                        .replace("{0}", langName(result.requestedLang))
                        .replace("{1}", langName(result.lang));
                }

                contentHost.textContent = "";
                const actions = pageActions[result.pageId];
                if (actions && actions.length > 0) {
                    const toolbar = document.createElement("div");
                    toolbar.className = styles["toolbar"];
                    for (const action of actions) {
                        const btn = document.createElement("button");
                        btn.type = "button";
                        btn.className = styles["action"];
                        btn.textContent = action.label;
                        btn.addEventListener("click", () => action.run());
                        toolbar.appendChild(btn);
                    }
                    contentHost.appendChild(toolbar);
                }

                const ctx: RenderCtx = {
                    baseUrl: window.location.origin + result.baseUrl,
                    ui,
                };
                const renderedPage = renderPage(md, ctx);
                contentHost.appendChild(renderedPage);
                main.scrollTop = 0;
                setOutline(extractOutline(renderedPage));
            };

            const showError = (result: PageLoadResult): void => {
                if (result.status !== "error") return;
                noticeBar.hidden = true;
                contentHost.textContent = "";
                setOutline([]);
                const err = document.createElement("div");
                err.className = styles["error"];
                const msg = document.createElement("div");
                msg.textContent = result.reason === "not-found"
                    ? i18n.src_docsite_indexts.page_not_found
                    : i18n.src_docsite_indexts.load_error;
                err.appendChild(msg);
                const retry = document.createElement("button");
                retry.type = "button";
                retry.className = styles["retry"];
                retry.dataset["retry"] = "";
                retry.textContent = i18n.src_docsite_indexts.retry;
                err.appendChild(retry);
                contentHost.appendChild(err);
            };

            // ---- 导航：单调请求令牌 + 站点代数，旧请求不得更新 DOM/状态/提示/滚动 ----
            const navigate = async (lang: Lang, pageId: PageId): Promise<void> => {
                const seq = ++requestSeq;
                const gen = siteGeneration;
                state.lang = lang;
                state.pageId = pageId;
                setActiveNav(pageId);

                const result = await content.loadPage(lang, pageId);
                if (seq !== requestSeq || gen !== siteGeneration || disposed) return;
                if (result.status === "error") {
                    showError(result);
                    return;
                }

                let md = content.stripDocsOnlyMarkers(result.markdown);
                md = await content.expandExamples(md);
                if (seq !== requestSeq || gen !== siteGeneration || disposed) return;

                // 首页动作（d.ts 打开/下载）初始化与渲染串行化：动作未就绪时先等待（含请求令牌检查），
                // 避免首页作为首屏时工具条永久缺失；初始化失败保持未定义，下次渲染重试
                if (result.pageId === "index" && !pageActions["index"]) {
                    await ensurePageActions();
                    if (seq !== requestSeq || gen !== siteGeneration || disposed) return;
                }

                renderContent(result, md);
            };

            const disposeTab = (): void => {
                if (disposed) return;
                disposed = true;
                requestSeq++;
                root.removeEventListener("click", onClick);
                main.removeEventListener("scroll", updateOutlineActive);
                this.element.textContent = "";
            };

            tabCleanups.set(this, disposeTab);
            setActiveNav(state.pageId);
            void navigate(state.lang, state.pageId);
        },
        destroy() {
            tabCleanups.get(this)?.();
            tabCleanups.delete(this);
        },
    });

    // 首页动作（懒初始化 + 失败重试；版本信息缓存）
    const ensurePageActions = async (): Promise<void> => {
        if (pageActions["index"]) return;
        try {
            const info = await ensurePluginInfo();
            const actions: PageAction[] = [
                {
                    label: i18n.src_userhelp_indexts.download,
                    run: () => downloadDts(info.name, info.version),
                },
            ];
            if (canOpenLocally()) {
                actions.push({
                    label: i18n.src_userhelp_indexts.open_locally,
                    run: () => openDtsLocally(plugin.name, setting.codeEditor),
                });
            }
            pageActions["index"] = actions;
        } catch (e) {
            console.warn("[docs-site] build page actions failed", e);
        }
    };

    return {
        open(initialPageId?: PageId) {
            void openTab({
                app: plugin.app,
                custom: {
                    id: `${plugin.name}docs-site`,
                    icon: "iconHelp",
                    title: i18n.src_docsite_indexts.tab_title,
                    data: { pageId: initialPageId },
                },
            });
        },
        dispose() {
            // 只清共享缓存并使站点代数自增（在途 Tab 请求全部失效）；
            // 各 Tab 实例的 DOM/事件清理由其 destroy() 负责（WeakMap 按实例注册），不声称注销 Tab
            siteGeneration++;
            content.clearCache();
        },
    };
};
