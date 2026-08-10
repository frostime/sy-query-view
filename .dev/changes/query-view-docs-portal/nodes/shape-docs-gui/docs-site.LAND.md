# 文档站 GUI 代码结构 / Docs Site GUI Code Shape (LAND)

**节点：** `nodes/shape-docs-gui`
**状态：** 待主 Agent 验收
**依据：** `../define-doc-structure/DOC-STRUCTURE.md`（已验收内容契约，§1.2 页面地图、§6 占位符、§10 GUI 内容读取契约）、`../write-human-docs/TASK-NODE.SPEC.md`（已验收 docs 产物）、`TARGET.SPEC.md`、`TERM.md`
**约束：** 原生 TypeScript/DOM + Lute + SiYuan CSS class/变量；无框架、无路由库、无 Markdown 库、无新运行时依赖；桌面第一版；不读远程 URL；不写用户笔记；不提前删除旧帮助逻辑。

---

## 1. 代码拆分方式比较与推荐

| 维度 | 方案 A：按职责分模块（推荐） | 方案 B：控制器 + 单一辅助文件 |
|---|---|---|
| 文件 | `src/docs-site/`：`index.ts`、`nav.ts`、`content.ts`、`render.ts` + `index.module.scss` | `src/docs-site.ts` + `docs-site-helpers.ts` + `scss` |
| 所有者 | 导航数据 / 内容读取 / 渲染增强 / 生命周期各自单一归属，与“页面目录、翻译标签、Markdown 内容、DOM 交互各有明确所有者”的验收条件直接对应 | 数据、fetch、渲染、事件混合在两个文件，页面动作和语言切换扩展时迅速膨胀为巨型 Tab 文件 |
| 依赖方向 | 单向：`index → {nav, content, render}`，无环 | 不明显，helpers 与 controller 互相渗透 |
| 变更成本 | 加页面动作、改故障策略只动一个模块 | 任何改动都牵动 controller |
| 风险 | 文件数略多（4 TS + 1 SCSS），但每个 <150 行 | 违反验收条件“不造成一份巨型 Tab 文件” |

**推荐：方案 A。** 与现有 `src/user-help/`（index/examples/sy-doc 多文件）的组织风格一致，且为后续退役任务保留清晰的“删除面”。

## 2. 目标文件树

```
src/docs-site/                       # 新增（本 GUI 任务）
├── index.ts                         # 入口：addTab 注册、open()、页面动作注册（api 按钮）、dispose
├── nav.ts                           # 静态导航树数据（页面 ID/路径/分组/顺序/i18n labelKey），纯数据无依赖
├── content.ts                       # 语言解析、fetch 页面、缓存、docs-only 标记剥离、{{example:}} 文本级展开
├── render.ts                        # Lute 渲染 + DOM 增强（复制按钮、相对 URL 解析、标题提取）
└── index.module.scss                # 最小自定义样式（CSS Modules）

src/user-help/dts-actions.ts         # 新增（本 GUI 任务）：依赖叶模块，d.ts 打开/下载动作（window.require 可选获取 child_process），被既有菜单与 docs-site 共用
src/user-help/index.ts               # 修改（本 GUI 任务，最小）：load() 中注册 docs-site；help_doc 菜单 click 改为 docsSite.open()；两个 d.ts 菜单处理器改为调用 dts-actions（行为不变）
public/i18n/zh_CN.yaml, en_US.yaml   # 修改（本 GUI 任务）：新增 src_docsite_indexts 标签组
src/types/i18n.d.ts                  # 修改（本 GUI 任务）：新增对应类型组
（无需修改）src/utils/lute.ts             # 渲染复用既有 getLute()/ILute；Md2BlockDOM 已在 SDK 类型面（siyuan/types/protyle.d.ts L531）
```

**候选删除文件（全部属后续退役任务，本任务一律不动）：** `src/user-help/sy-doc.ts`、`examples.ts`、`index.module.scss`、`src/setting/index.ts` 的 `onlyImportDtsInUserDoc`、`src/user-help/index.ts` 的 Examples/d.ts 菜单与 `BASIC_TEMPLATE` 内嵌模板（改读 `public/example/basic-template.js`）。

## 3. 核心模块公开契约与依赖方向

依赖方向（单向、无环）：`nav.ts`（零依赖）← `content.ts`（引用 nav 的路径）← `render.ts`（零模块依赖，Lute 来自既有 `src/core/lute.ts` 的 `getLute()`）← `index.ts`（组合全部 + siyuan SDK `openTab`/`plugin.addTab`）。

### 3.1 nav.ts — 页面目录（判别联合：分组无页面）
```ts
export type Lang = "zh_CN" | "en_US";
export type PageId = "index" | "quickstart-concepts" | "quickstart-template" | "examples"
    | "topic-query" | "topic-dataview" | "topic-dataview-advanced" | "topic-editor-tips"
    | "api-reference" | "skill";
export type NavNode = NavGroup | NavItem;
export interface NavGroup { kind: "group"; labelKey: string; children: NavItem[] }  // 分组：无 id/path，无页面
export interface NavItem  { kind: "item"; id: PageId; path: string; labelKey: string }
export const PAGE_TREE: NavNode[];            // 顶层可为 NavItem（首页 index）或 NavGroup（快速开始/案例/主题）；顺序严格对应 DOC-STRUCTURE §1.2
export function pagePath(id: PageId): string; // 相对 docs/{lang}/ 的路径，如 "topics/query.md"
```
- 数据来源：DOC-STRUCTURE §1.2（10 页、路径、分组与顺序）；**分组与条目各自持有 i18n labelKey**（分组键 4 个 + 条目键 10 个，见 §3.5；GUI 侧边栏不解析 docs 页面，见 DOC-STRUCTURE §10-4）。
- 本文件是“页面目录”的唯一所有者；新增页面先改 DOC-STRUCTURE 再改这里。

### 3.2 content.ts — 内容读取与故障（工厂，插件名透传，状态化加载结果）
```ts
export type PageLoadResult =
    | { status: "ok";       lang: Lang; pageId: PageId; markdown: string; baseUrl: string }
    | { status: "fallback"; lang: Lang; pageId: PageId; markdown: string; baseUrl: string; requestedLang: Lang }
    | { status: "error";    lang: Lang; pageId: PageId; reason: "not-found" | "network" };

export interface ContentApi {
    resolveLang(): Lang;                              // window.siyuan.config.lang 以 zh 开头 → zh_CN，否则 en_US
    otherLang(l: Lang): Lang;
    pageUrl(lang: Lang, id: PageId): string;          // "/plugins/{pluginName}/docs/{lang}/{path}"
    loadPage(lang: Lang, id: PageId): Promise<PageLoadResult>; // 状态化加载（见下），成功内容入 Map 缓存 (lang,id)
    stripDocsOnlyMarkers(md: string): string;         // 仅删标记行，保留 docs-only 内容（与生成器相反）
    expandExamples(md: string): Promise<string>;      // {{example:<file>}} → ```js 围栏，文件从 /plugins/{pluginName}/example/<file> 读取并缓存
    clearCache(): void;
}
export function createContent(pluginName: string): ContentApi;
```
- **插件名透传**：`createContent(plugin.name)` 由 `index.ts` 在 `load(plugin)` 时调用；content 内部所有 URL 一律用 `\`/plugins/${pluginName}/\`` 拼接，**禁止硬编码 `sy-query-view`**。`pluginName` 只进工厂闭包，不进任何模块级状态。
- **状态化加载规则**：`loadPage` 内部 `fetch` 后必须检查 `response.ok`；**仅 `response.status === 404` 触发另一语言回退**（`requestedLang` 记录原请求语言），5xx/网络异常直接返回 `error`（不回退）；**缓存只写成功（ok/fallback）内容**，失败不缓存。
- **结果携带真实渲染语言与 baseUrl**：`ok` 与 `fallback` 均携带实际渲染的 `lang` 与对应 `baseUrl`（回退时是另一语言的 baseUrl），index.ts 据此构造 RenderCtx，保证图片/链接解析与真实渲染语言一致。
- 全部使用 `fetch`（先例 `src/user-help/sy-doc.ts` L39、`src/core/custom-view.ts` L107）；**不**使用内核 API 列目录（DOC-STRUCTURE §10-2）。
- 缓存规则：静态内容随插件版本固定，`Map<(lang|file), string>` 常驻 Tab 生命周期即可，无失效逻辑；`clearCache()` 供 dispose 调用。

### 3.3 render.ts — Markdown 渲染与 DOM 增强（UI 注入，零根依赖）
```ts
export interface RenderUi {
    copyClass: string;        // 来自 index.ts 引入的 CSS Modules（styles['copy']），非字面类名
    copyLabel: string;        // 本地化文案，由 index.ts 从 plugin.i18n 注入
    copiedLabel: string;      // 复制成功后的临时文案
}
export interface RenderCtx {
    baseUrl: string;          // 绝对 base：window.location.origin + pageUrl(lang, id)（用 PageLoadResult 携带的 lang/baseUrl）
    ui: RenderUi;
}
export function renderPage(md: string, ctx: RenderCtx): HTMLElement;
// 步骤：getLute().Md2BlockDOM(md) → 只读化（见下）→ 容器加 b3-typography/b3-typography--default（先例 examples.ts L104-106）
//       → enhance(container, ctx)
export function enhance(container: HTMLElement, ctx: RenderCtx): void;
export function extractTitle(container: HTMLElement): string | null; // 首个 H1 文本（备用，不用于导航）
```
- **UI 注入，避免根循环**：render.ts **不 import `@/index`、不 import scss**；CSS 类名（经 CSS Modules 生成）与 `copy`/`copied` 本地化文案全部由 index.ts 构造 `RenderUi` 注入（i18n 来源见 §3.5）。
- `enhance` 职责：(a) 相对 `img[src]`/`a[href]` 用 `new URL(attr, baseUrl)` 解析；**baseUrl 必须是绝对 URL**，由 `index.ts` 按 `PageLoadResult` 携带的 lang/baseUrl 构造为 `window.location.origin + pageUrl(lang, id)`（如 `http://127.0.0.1:6806/plugins/{pluginName}/docs/zh_CN/topics/query.md`），不能把根相对路径直接当 base（`new URL` 会抛错）。解析结果形如 `window.location.origin + "/plugins/{pluginName}/docs/assets/…"`，即浏览器同源绝对路径；绝对/外部 URL 不动。(b) 每个 `pre` 追加“复制”按钮（`navigator.clipboard.writeText`，失败回退 `execCommand('copy')` + 临时 textarea）；按钮类名用 `ctx.ui.copyClass`，点击后短暂显示 `ctx.ui.copiedLabel`，不写入任何笔记。
- **复制文本捕获顺序**：在插入按钮**之前**先读取 `code.textContent` 存入闭包，click 处理器只写入该捕获文本；按钮追加到 `pre`（与 `code` 同级，而非 code 内部），双重保证按钮标签（如“复制”）不会进入剪贴板。
- **复制归一化语义**：对捕获文本按 `\r\n?` → `\n` 做行尾归一化后再写入剪贴板；验收比较允许至多一个末尾换行差异（两端各去掉一个末尾 `\n` 后相等即可），**不**要求经 Lute 输出后与源文件逐字节一致。
- 复制按钮作用于所有代码块（含 `{{example:}}` 展开块与文档内教程片段）——一致且实现最简。
- **渲染方法（已验证）**：复用既有配置实例 `getLute()`，调用 `getLute().Md2BlockDOM(md)`（SDK 类型面：`node_modules/siyuan/types/protyle.d.ts` L531 `Md2BlockDOM(html): string`；仓库先例：`src/core/components.ts` L218、L1352）。**只读化（必做）**：渲染后执行与 `MarkdownComponent` 相同的只读处理——`container.querySelectorAll('[contenteditable="true"]')` 逐个 `setAttribute('contenteditable', 'false')`（先例 `src/core/components.ts` L1359-1376）；v1 不做 KaTeX 钩子，数学元素按 Lute 默认输出展示。**不**引入 `Md2HTML`、**不**改 `ILute` 声明、**不**另建 Lute 实例。

### 3.4 index.ts — Tab 注册/打开、页面状态、页面动作
```ts
export interface DocsSite {
    open: (initialPageId?: PageId) => void;
    dispose: () => void;
}
export async function load(plugin: QueryViewPlugin): Promise<DocsSite>;
```
- **Tab 注册**：`plugin.addTab({ type: "docs-site", init, destroy })`，在 `UserHelp.load(plugin)` 时执行一次（非点击时）。open 用 `openTab({ app, custom: { id: `${plugin.name}docs-site`, icon: "iconHelp", title: i18n.src_docsite_indexts.tab_title, data?: { pageId } } })`（id 拼接遵循 SDK 注释 plugin.name + tab.type，先例 `examples.ts` 的 `${plugin.name}js-example`）。
- **页面状态**：`{ lang, pageId }` 存于 Tab 实例闭包（init 创建），非模块全局；重复 open 激活既有 Tab 且保留状态（SiYuan 按 id 复用，实现时验证；若实测会重复建 Tab，用 `plugin.getOpenedTab()` 检查既有实例并激活，见 siyuan.d.ts L363-365）。`open(initialPageId?)` 通过 openTab 的 `data.pageId` 传给 init（init 内读 pending 值）。
- **页面动作注册**（API 页按钮，解耦于 markdown 结构）：`const PAGE_ACTIONS: Partial<Record<PageId, Action[]>> = { "api-reference": [downloadDts, openLocalDts] }`；动作渲染在内容区顶部工具条，文案复用既有 i18n 键 `src_userhelp_indexts.download` / `open_locally`。**动作实现不内联**：统一调用依赖叶模块 `src/user-help/dts-actions.ts`（见 §2/§7），与既有菜单代码共享，避免重复实现与循环依赖；`downloadDts`/`openLocalDts`/版本号获取全部经该模块，URL 用 `plugin.name`（不复刻既有硬编码）。
- **异步竞态令牌（必做）**：index 在 Tab 闭包内持有单调递增 `requestSeq`；每次加载页面（翻页、语言切换、重试）先 `const seq = ++requestSeq`，任何 `await`（`loadPage`/`expandExamples`）之后先检查 `seq === requestSeq && !disposed` 才允许更新 DOM、状态、提示条或滚动；旧请求的结果一律丢弃。可选用 `AbortController` 取消旧 fetch（非必须，令牌已保证正确性）。
- **dispose**：`addTab` 返回的是 `() => Custom`（Tab 实例访问器，**不是注销函数**，见 siyuan.d.ts L367-374），不可用于反注册；`dispose()` 只做 `content.clearCache()`、`requestSeq++`（使在途请求失效）与模块级守卫（opened/pending）复位，Tab 的 DOM/事件清理由 SiYuan 关闭 Tab 时调用的 `destroy()` 承担。dispose 由 `user-help/index.ts` 在 `plugin.disposeCb` 注册（先例 `src/index.ts` L123-129）。

### 3.5 i18n（无独立文件，经 plugin.i18n 注入，docs-site 不 import "@/index"）
- **注入路径**：`load(plugin)` 从 `plugin.i18n` 取得 I18n 对象（先例 `src/index.ts` L97 `i18n = this.i18n`）；**docs-site 全部模块不 import `@/index`**，标签由 index.ts 解析 labelKey 后注入各模块（nav 渲染、`RenderUi`、错误视图、Tab 标题），避免根循环。
- 标签仍走既有 `public/i18n/*.yaml` + `src/types/i18n.d.ts` 机制；本 GUI 任务新增键组 `src_docsite_indexts`（两种语言同步添加，缺失键视为实现缺陷）：`tab_title`、侧边栏分组键 4 个（快速开始/案例/主题/无分组首页）+ 条目键 10 个（对应 nav labelKey）、`copy`、`copied`、`retry`、`page_not_found`、`fallback_notice`（“该页面暂无{语言}版本，已显示{另一语言}”）、`load_error`。API 页按钮复用既有键，不重复添加。
- 侧边栏标签 = i18n 键（DOC-STRUCTURE §10-4）；页面 H1 是内容的一部分，随内容渲染，不参与导航。

## 4. Tab 生命周期

1. **注册**：插件 `onload` → `UserHelp.load(plugin)` → `DocsSite.load(plugin)` → `plugin.addTab({ type: "docs-site", ... })`；此时不创建任何 DOM。
2. **首次打开**：Help 菜单 click → `docsSite.open()` → `openTab` → SiYuan 调 `init` → 创建根容器 `.docs-site`（侧边栏 + 内容区 + 语言切换），解析默认语言（`resolveLang()`），加载 `index` 页。
3. **事件绑定与释放**：侧边栏点击用容器级事件委托（一个监听器）；语言切换按钮同；`destroy()` 移除监听（或整树 innerHTML 清空）并置 `disposed` 标记；所有异步回调（fetch 完成）先查 `disposed` 与请求令牌（§3.4 `requestSeq`）再触碰 DOM——**任何旧页面/旧语言请求不得更新 DOM、状态、提示条或滚动**。
4. **重复打开**：固定 id + openTab；激活既有 Tab，状态（lang/pageId/滚动）保留，不重置。同一时刻至多一个文档站 Tab。
5. **卸载**：插件 `onunload` → `disposeCb` → `docsSite.dispose()` → 仅清共享缓存（`content.clearCache()`）与模块级守卫；Tab 的 DOM/事件清理由 SiYuan 关闭 Tab 时调用的 `destroy()` 负责（`addTab` 的返回 `() => Custom` 是实例访问器而非注销函数，见 §3.4）。
6. 不需要 `beforeDestroy`/`resize`/`update`（桌面固定布局，第一版不响应窗口 resize 重排）。

## 5. 内容读取与故障规则

- **读取路径**：`GET /plugins/{pluginName}/docs/{lang}/{path}`；`{{example:<file>}}` → `GET /plugins/{pluginName}/example/<file>`；`pluginName` 由 `createContent(plugin.name)` 透传，任何路径不得硬编码插件名（§3.2）。全部同源静态文件，无远程 URL（DOC-STRUCTURE §9-2）。
- **状态化加载**：`loadPage` 必须检查 `response.ok`；**仅 404 触发另一语言回退**，5xx/网络异常直接 `error`；**缓存只写成功内容**；结果携带实际渲染 `lang`/`baseUrl`，回退时用另一语言的 baseUrl（§3.2）。
- **语言**：Tab 初始化用 `resolveLang()`；工具条提供手动切换（zh_CN / en_US），切换后按当前 pageId 重取并保留页面（顶部提示“正在切换语言”不需要——内容就绪即替换）；切换与翻页共用请求令牌（§3.4）。
- **404 回退**：`loadPage` 内部先自动尝试另一语言同页，命中时返回 `status: "fallback"` 并携带 `requestedLang`，UI 显示提示条（`fallback_notice`，DOC-STRUCTURE §10-5）；另一语言也 404 → `error` 视图。
- **网络失败/其他错误**：错误视图（`load_error` + 重试按钮，重试 = 重新 `loadPage` 当前页）；不导航、不显示远程内容、不崩溃。
- **缺案例文件**：`expandExamples` 找不到文件时输出 ```` ```js\n// [docs] example not found: <file>\n```` 并 `console.warn`，页面其余部分照常渲染（不缓存失败内容）。
- **相对链接/图片**：render 的 enhance 阶段用 `new URL(attr, baseUrl)` 解析；baseUrl 为绝对地址 `window.location.origin + pageUrl(lang, id)`，**取自 `PageLoadResult` 携带的实际渲染 lang 与 baseUrl**（§3.2/§3.3），解析结果 `../../assets/…` → `{origin}/plugins/{pluginName}/docs/assets/…`；绝对 URL 原样保留。
- **受信任 Markdown 边界**：渲染内容只可能来自插件包内 `docs/` 与 `example/`（第一方、随版本发布），Lute 输出直接 innerHTML，**不做**运行时 HTML 消毒；不渲染任何用户输入或知识库内容。docs-only 标记：仅剥离标记行、保留内容（与 README 生成器相反的行为，两侧共用 DOC-STRUCTURE §6 约定）。

## 6. CSS 方案

- **复用**：内容区 `b3-typography` + `b3-typography--default`（先例 `src/user-help/examples.ts`）；变量 `--b3-theme-background`、`--b3-theme-on-background`、`--b3-theme-primary`、`--b3-border-color`、`--b3-list-hover`、`--b3-theme-background-light`；布局辅助 `fn__flex`/`fn__flex-1`（若可用则用，否则自定义 flex 规则）。
- **新文件**：`src/docs-site/index.module.scss`（CSS Modules，类名经构建加前缀，先例 `index.module.scss` 的 `styles['to-top']`）。内容约 100-150 行：`.docs-site`（flex 根）、侧边栏（固定宽度、`--b3-border-color` 分隔、条目 hover/active 态用 `--b3-list-hover`/`--b3-theme-primary`）、内容区（滚动）、`.docs-site__copy`（代码块右上角，`position: absolute`）、语言切换、错误/提示条。
- **避免全局污染**：所有选择器以 `.docs-site` 或 CSS Modules 作用域类开头；不写全局元素选择器；如需覆盖 SiYuan class（如代码块内边距为按钮留位），一律限定在 `.docs-site` 作用域内。**不动** `src/user-help/index.module.scss`（退役任务随 examples 一并删除）。

## 7. Help 菜单、d.ts 动作与基础模板的最小改造位置（GUI 任务边界）

- **Help 菜单（本任务做）**：`src/user-help/index.ts` L79-84 的 `help_doc` 菜单 click 由 `useUserReadme(plugin)` 改为 `docsSite.open()`（一行）；`load()` 顶部新增 `DocsSite.load(plugin)`。`sy-doc.ts` 原样保留（退役任务删除）。
- **d.ts 动作共享模块（本任务做）**：新建 `src/user-help/dts-actions.ts` 依赖叶，公开签名（**每个动作自带全部必需输入，不隐式依赖模块状态**）：
  - `canOpenLocally(): boolean`——仅探测 `window.require` 是否存在，无需输入；
  - `openDtsLocally(pluginName: string, codeEditor: string): void`——`pluginName` 用于拼 `/plugins/{pluginName}/types.d.ts` 的本地文件路径，`codeEditor` 用于 `{{filepath}}` 命令替换；经 `window.require?.("child_process")` **可选获取** child_process，先例 `src/user-help/index.ts` L49-65 的行为 + L52 的 `window?.require` 模式，**不做顶层 `require("child_process")`**；
  - `downloadDts(pluginName: string, version: string): void`——`<a download>` 先例 L67-77，下载名 `{pluginName}@{version}.types.d.ts`；
  - `getPluginInfo(pluginName: string): Promise<{ name: string; version: string }>`——**显式入参 `pluginName`**，fetch `/plugins/{pluginName}/plugin.json`（模块无法自推断插件名，禁止隐式读取）。
  `src/user-help/index.ts` 的两个 d.ts 菜单处理器改为调用该模块（行为不变），docs-site 的 api-reference 动作同样调用——**避免循环依赖与重复临时实现**。
- **基础模板（本任务不做，仅标位置）**：`src/user-help/index.ts` L19-31 `BASIC_TEMPLATE` 与 L71-90 `qv-basic` 斜杠回调——退役任务改为运行时 fetch `public/example/basic-template.js`（缓存一次）；文档站 `quickstart-template` 页已通过 `{{example:basic-template.js}}` 与该文件同源，无需本任务处理。
- Examples 菜单、`onlyImportDtsInUserDoc` 设置：本任务全部不动（d.ts 两菜单仅换实现不改行为）。

## 8. 验收前可测试的关键行为

1. 点 Help 菜单 → 出现文档站 Tab，侧边栏 10 项分组顺序正确，默认语言随界面语言（zh 界面 → 中文页）。
2. 侧边栏点击切换页面：内容区替换、active 态更新、滚动回到顶部；语言切换保留当前页。
3. `quickstart-template` 页复制出的代码与 `public/example/basic-template.js` 在**行尾归一化（`\r\n?`→`\n`）且允许至多一个末尾换行差异**后一致；复制按钮把归一化后的代码写入剪贴板（粘贴验证），按钮标签不进剪贴板。
4. 页面内 `../../assets/…` 图片以 `{origin}/plugins/{pluginName}/docs/assets/…` 加载成功（断网/离线可验证——无任何远程请求，DevTools Network 仅 127.0.0.1 同源）；代码中无硬编码插件名的路径。
5. 删除/改名一个 docs 文件（临时）→ 显示另一语言同页 + 提示条；两个语言都缺 → 错误视图 + 重试；**回退时图片/链接按另一语言 baseUrl 解析成功**。
6. API 参考页工具条：下载得到 `{pluginName}@{version}.types.d.ts`；本地打开（桌面端）调用 `setting.codeEditor` 命令；两个动作与既有 d.ts 菜单共用 `dts-actions.ts` 实现。
7. **快速连续切换页面/语言：仅最后一次请求的结果生效**（旧响应不覆盖 DOM、状态、提示条或滚动；可在 Network 面板制造慢请求验证）。
8. 全程不产生任何知识库写入：docs-site 代码中无 `createDocWithMd`/`updateBlock`/`setBlockAttrs` 调用（grep 证据）。
9. `npm run build` 通过；`git diff --check` 干净。

**刻意不做（第一版）：** 站内搜索；路由/历史/hash；mermaid/echarts 运行时渲染（`concepts` 页 mermaid 图以代码块展示，属已知限制）；移动端专用布局；远程内容更新；多版本文档；完整 d.ts 在站内渲染；案例代码下载按钮；iframe；技能正文与 `references/`；任何旧模块删除/菜单退役（全部留给退役任务）。

## 9. 局部选择与残余说明

- 无影响用户行为、范围、内容来源或关键架构的冲突，本方案不需要主 Agent 追加决策。
- 实现期验证点（非阻塞，验证后按本文件既定方向落地）：① `Md2BlockDOM` 产物为 protyle 块 DOM，页面渲染保真度与只读化以 `src/core/components.ts` `MarkdownComponent` 先例为准（内联数学等元素按 Lute 默认输出展示，v1 不做 KaTeX 钩子）；② `openTab` 对固定 id 是否激活既有 Tab，必要时用 `plugin.getOpenedTab()` 守卫（见 §3.4）；③ Lute 对 `<!-- docs-only -->` 注释行的处理方式（若输出文本残留，用 §3.2 的标记行剥离兜底，已内建）；④ 复制归一化比较函数（行尾归一化 + 单末尾换行容忍）实现时以 §3.3 语义为准。
- 已知 v1 限制：`concepts` 页的 mermaid 图显示为代码块（不引入 mermaid 运行时）；文档站不实现滚动记忆之外的任何“浏览历史”。
