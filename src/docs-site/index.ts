/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 文档站 Tab 注册/打开、页面状态、页面动作与异步竞态控制。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §3.4/§4/§5。
 *                 本模块不 import "@/index"（i18n 经 plugin.i18n 注入）。
 */

import { Custom, openTab } from "siyuan";
import type QueryViewPlugin from "@/index";
import { getPluginInfo } from "@/user-help/dts-actions";
import { PAGE_TREE, pageFile, type Lang, type NavItem, type NavLabelKey, type PageId } from "./nav";
import { createContent, type ContentApi, type PageLoadResult } from "./content";
import { copyText, extractOutline, renderPage, type OutlineEntry, type RenderCtx, type RenderUi } from "./render";
import styles from "./index.module.scss";

export interface DocsSite {
    open: (initialPageId?: PageId) => void;
    dispose: () => void;
}

export const load = async (plugin: QueryViewPlugin): Promise<DocsSite> => {
    const i18n = plugin.i18n as unknown as I18n;
    // 站点生命周期代数：dispose 时自增，使所有在途 Tab 请求失效（即使 SiYuan 未先调 destroy）
    let siteGeneration = 0;
    let actionPanelSequence = 0;
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

    const loadPluginVersion = async (): Promise<string> => (await ensurePluginInfo()).version;
    const content: ContentApi = createContent(plugin.name, loadPluginVersion);

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

            // ---- 文档操作：复制动作与页面大纲共用右下角浮层 ----
            let currentMarkdown = "";
            let currentPageFile = "";
            let outlineEntries: OutlineEntry[] = [];
            const outlineButtons = new Map<string, HTMLButtonElement>();
            const actionPanelId = `docs-site-action-panel-${++actionPanelSequence}`;

            const actionToggle = document.createElement("button");
            actionToggle.type = "button";
            actionToggle.className = styles["actionToggle"];
            actionToggle.dataset["actionToggle"] = "";
            actionToggle.hidden = true;
            actionToggle.setAttribute("aria-expanded", "false");
            actionToggle.setAttribute("aria-controls", actionPanelId);
            actionToggle.title = i18n.src_docsite_indexts.document_actions;

            const actionIcon = document.createElement("span");
            actionIcon.className = styles["actionIcon"];
            actionIcon.textContent = "☷";
            actionIcon.setAttribute("aria-hidden", "true");
            actionToggle.appendChild(actionIcon);

            const actionToggleLabel = document.createElement("span");
            actionToggleLabel.textContent = i18n.src_docsite_indexts.document_actions;
            actionToggle.appendChild(actionToggleLabel);

            const actionPanel = document.createElement("section");
            actionPanel.id = actionPanelId;
            actionPanel.className = styles["actionPanel"];
            actionPanel.dataset["actionPanel"] = "";
            actionPanel.hidden = true;
            actionPanel.setAttribute("aria-label", i18n.src_docsite_indexts.document_actions);

            const actionHeader = document.createElement("div");
            actionHeader.className = styles["actionHeader"];
            const actionTitle = document.createElement("span");
            actionTitle.textContent = i18n.src_docsite_indexts.document_actions;
            actionHeader.appendChild(actionTitle);

            const actionClose = document.createElement("button");
            actionClose.type = "button";
            actionClose.className = styles["actionClose"];
            actionClose.dataset["actionClose"] = "";
            actionClose.setAttribute("aria-label", i18n.src_docsite_indexts.outline_close);
            actionClose.textContent = "×";
            actionHeader.appendChild(actionClose);
            actionPanel.appendChild(actionHeader);

            const quickActions = document.createElement("div");
            quickActions.className = styles["quickActions"];
            const addCopyAction = (label: string, getText: () => string): void => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = styles["quickAction"];
                button.textContent = label;
                button.addEventListener("click", async () => {
                    const copied = await copyText(getText());
                    if (!copied) return;
                    button.textContent = i18n.src_docsite_indexts.copied;
                    setTimeout(() => {
                        button.textContent = label;
                    }, 1500);
                });
                quickActions.appendChild(button);
            };
            addCopyAction(
                i18n.src_docsite_indexts.copy_document,
                () => currentMarkdown,
            );
            addCopyAction(
                i18n.src_docsite_indexts.copy_agent_prompt,
                () => i18n.src_docsite_indexts.agent_read_prompt.replace("{0}", currentPageFile),
            );
            actionPanel.appendChild(quickActions);

            const outlineSectionTitle = document.createElement("div");
            outlineSectionTitle.className = styles["outlineSectionTitle"];
            outlineSectionTitle.textContent = i18n.src_docsite_indexts.outline_title;
            actionPanel.appendChild(outlineSectionTitle);

            const outlineList = document.createElement("nav");
            outlineList.className = styles["outlineList"];
            outlineList.setAttribute("aria-label", i18n.src_docsite_indexts.outline_title);
            actionPanel.appendChild(outlineList);
            root.append(actionToggle, actionPanel);

            const setActionPanelOpen = (open: boolean): void => {
                actionPanel.hidden = !open;
                actionToggle.setAttribute("aria-expanded", String(open));
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
                outlineSectionTitle.hidden = !hasOutline;
                outlineList.hidden = !hasOutline;
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
                if (target.closest<HTMLElement>("[data-action-toggle]")) {
                    setActionPanelOpen(Boolean(actionPanel.hidden));
                    return;
                }
                if (target.closest<HTMLElement>("[data-action-close]")) {
                    setActionPanelOpen(false);
                    return;
                }
                const outlineEl = target.closest<HTMLElement>("[data-outline-id]");
                if (outlineEl?.dataset["outlineId"]) {
                    scrollToOutline(outlineEl.dataset["outlineId"]);
                    setActionPanelOpen(false);
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
                    return;
                }
                if (!target.closest<HTMLElement>("[data-action-panel]")) {
                    setActionPanelOpen(false);
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

                currentMarkdown = md.replace(/\r\n?/g, "\n");
                currentPageFile = pageFile(result.pageId, result.lang);
                actionToggle.hidden = false;

                contentHost.textContent = "";
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
                actionToggle.hidden = true;
                setActionPanelOpen(false);
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
                actionToggle.hidden = true;
                setActionPanelOpen(false);
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
