# 定义文档站 GUI 代码结构

**状态：** 已验收
**负责人：** worker `docs-site-worker`

## 任务目的

在不写生产代码的前提下，为桌面端插件内文档站确定最小、可维护的 TypeScript/DOM 文件边界和跨模块契约。后续实现者应能据此改造现有 Help/Examples Tab，而不用重新决定状态、导航、内容读取或样式归属。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../TERM.md`、`../../DECISIONS.md`
2. `../define-doc-structure/DOC-STRUCTURE.md`
3. `../write-human-docs/TASK-NODE.SPEC.md`
4. `../../query-view-docs-portal.MAP.md`
5. 当前 `src/user-help/index.ts`、`examples.ts`、`sy-doc.ts`、`index.module.scss`、`src/setting/index.ts`、`src/index.ts`、`public/i18n/*.yaml`、`src/types/i18n.d.ts`、`docs/`

必须遵守：

- 本任务只写入本节点目录；不修改生产代码、全局 change 文件、`.gitignore` 或 git 历史。
- GUI 沿用 SiYuan 的自定义 Tab 机制，使用原生 TypeScript/DOM、Lute、原生 CSS class 和 CSS 变量；不引入框架、路由库、Markdown 库或运行时依赖。
- 以已验收的 docs 页面 ID、静态导航、`{{example:…}}`、`docs-only` 约定为输入，不重新设计内容结构。
- 第一版只保证桌面端体验；移动端不做专用 UI。
- GUI 不读远程 URL、不写入用户笔记；复制只调用剪贴板。
- 不提前删除旧帮助逻辑、Examples 或设置；这些属于后续退役任务。

## 预期输出

创建 `docs-site.LAND.md`，至少包含：

1. 两种可信代码拆分方式的简短比较，以及推荐方案和原因。
2. 推荐方案的目标文件树，列出新增、修改和删除候选文件及大致职责；区分当前 GUI 任务和后续退役任务。
3. 每个核心模块的公开契约与依赖方向：Tab 注册/打开、静态导航、页面状态、语言选择、内容读取、Markdown 渲染、案例占位符、API 页面动作、复制操作和 i18n。
4. Tab 生命周期：何时注册、何时创建 DOM、事件监听如何释放、同一 Tab 多次打开的状态规则。
5. 内容读取与故障规则：本地 fetch 路径、当前语言与回退、缺页/网络失败显示、相对链接和图片、受信任 Markdown 的边界。
6. CSS 方案：哪些 SiYuan class/变量复用，哪些最小自定义样式需要新文件，如何避免全局样式污染。
7. Help 菜单和基础模板的最小改造位置，但不规划旧模块删除细节。
8. 实现验收前可测试的关键行为，以及刻意不做的内容。
9. 除非存在影响用户行为、范围、内容来源或关键架构的冲突，不要把局部选择列为问题；直接给推荐。

完成后将本文件状态改为“等待验收”，在“结果与影响”中说明交付物、仓库证据和残余问题。

## 验收条件

- 后续 GUI 实现任务可以仅凭此文件和已验收文档结构直接开始，不必重新选择模块边界或关键数据流。
- 文件边界让页面目录、翻译标签、Markdown 内容和 DOM 交互各有明确所有者，不造成一份“巨型 Tab 文件”。
- 不引入未被需求支持的通用组件系统、路由、搜索、移动布局或远程内容机制。
- 方案能在当前 SiYuan 插件 API、现有 help 菜单和样式体系中落地。

## 结果与影响

**交付物：** 本目录新增 `docs-site.LAND.md`，含：① 两种拆分方案比较（按职责分模块 vs 控制器+单辅助文件）并推荐方案 A；② 目标文件树（GUI 任务新增 `src/docs-site/{index,nav,content,render}.ts` + `index.module.scss`，最小修改 `src/user-help/index.ts`、`public/i18n/*.yaml`、`src/types/i18n.d.ts`；删除面全部标注为退役任务）；③ 各模块公开契约与单向依赖方向（nav 零依赖 → content → render ← index 组合，i18n 复用既有 yaml 机制、无独立文件）；④ Tab 生命周期（load 时注册、首开建 DOM、委托监听 + disposed 标记、固定 id 重复打开激活保留状态；dispose 经 disposeCb 注册，仅清缓存/请求令牌/守卫，Tab 的 DOM 与事件清理归 SiYuan 关闭 Tab 时调用的 destroy）；⑤ 内容读取与故障规则（同源 fetch 路径、语言回退、404 自动换语言 + 提示条、错误视图 + 重试、缺案例文件降级输出、相对 URL 解析、受信任 Markdown 边界声明）；⑥ CSS 方案（复用 b3-typography/CSS 变量，新 CSS Modules 文件限 `.docs-site` 作用域）；⑦ Help 菜单一行改造位置与基础模板改造位置（留给退役任务）；⑧ 可测试行为清单与刻意不做清单；⑨ 明确无原则性问题，附 3 个实现期验证点。

**仓库证据（已核实）：** `src/user-help/index.ts`（help_doc 菜单 L79-84、d.ts 动作 L49-77、BASIC_TEMPLATE L19-31、qv-basic L71-90）、`examples.ts`（addTab/openTab 先例、b3-typography 先例）、`sy-doc.ts` L39 fetch 先例、`src/core/lute.ts` + `src/utils/lute.ts`（既有 getLute/ILute）、`node_modules/siyuan/siyuan.d.ts`（addTab L367、openTab custom.id=plugin.name+tab.type L249）、`src/index.ts`（disposeCb L123-129）、`src/types/i18n.d.ts`（键组结构）、`docs/zh_CN` 10 页与 docs-only 标记实况、`public/example/basic-template.js`。

**残余说明：** 无阻塞问题。实现期验证点 ① 渲染方法已确认为 `getLute().Md2BlockDOM(md)`（SDK 类型面 siyuan/types/protyle.d.ts L531；仓库先例 src/core/components.ts L218/L1352），产物为 protyle 块 DOM，保真度以 MarkdownComponent 先例为准，v1 不做 KaTeX 钩子；② `openTab` 固定 id 是否激活既有 Tab（必要时用 `plugin.getOpenedTab()` 守卫）；③ Lute 对 docs-only 注释行的处理（内容.ts 已内建标记行剥离兜底）。已知 v1 限制：concepts 页 mermaid 以代码块展示；文档站无浏览历史。

**（API 评审修正轮）** 按评审意见修正四处契约并保持 `等待验收`：① 生命周期：`addTab` 返回 `() => Custom`（Tab 实例访问器，非注销函数，证据 `node_modules/siyuan/siyuan.d.ts` L367-374），dispose 不再声称注销 Tab，只清共享缓存与模块级守卫，DOM/事件清理归 `destroy()`；重复打开守卫改用 SDK 的 `plugin.getOpenedTab()`（L363-365）。② 相对 URL 解析：`new URL(attr, baseUrl)` 的 base 必须为绝对地址，明确由 `index.ts` 构造 `window.location.origin + pageUrl(lang, id)`。③ 复制操作：按钮插入前先捕获 `code.textContent` 入闭包，按钮挂到 `pre`（与 `code` 同级），标签文本不进入剪贴板。④ 插件名透传：`content.ts` 改为 `createContent(plugin.name)` 工厂，所有路径 `/plugins/{pluginName}/...`，禁止硬编码 `sy-query-view`；API 页 d.ts 下载/plugin.json 路径同样用 `plugin.name`。

**（渲染方法修正轮）** 按评审意见将渲染契约从 `Md2HTML` 改为已验证的 `getLute().Md2BlockDOM(md)`：删除 LAND 中 ILute 增补 `Md2HTML` 声明与另建精简 Lute 实例的推测性方案；明确复用既有 `getLute()` 实例，证据为 SDK 类型面 `node_modules/siyuan/types/protyle.d.ts` L531 与仓库先例 `src/core/components.ts` L218/L1352（`MarkdownComponent`）；验证点 ① 同步改为以 MarkdownComponent 先例为保真度基准。无新增阻塞。

**（架构评审修正轮）** 按评审意见修正七处契约并保持 `等待验收`：① 导航：`NavNode` 改为判别联合 `NavGroup | NavItem`，分组无 id/path，分组与条目各有 i18n labelKey（4 分组 + 10 条目键）。② 状态化加载：新增 `PageLoadResult`（ok/fallback/error），`fetch` 必须检查 `response.ok`，仅 404 触发另一语言回退（5xx/网络直接 error），缓存只写成功内容，结果携带实际渲染 lang/baseUrl（回退用另一语言 baseUrl）。③ 异步竞态：index 持有单调 `requestSeq` 令牌（可配 AbortController），任何 await 后校验令牌与 disposed，旧请求不得更新 DOM/状态/提示条/滚动。④ CSS/i18n 注入：render 不 import `@/index`/scss，`RenderUi`（CSS Modules 类名 + copy/copied 本地化文案）由 index 注入；docs-site 全部模块经 `plugin.i18n` 取标签（先例 src/index.ts L97），避免根循环。⑤ 只读化：渲染后按 MarkdownComponent 先例将 `[contenteditable="true"]` 置 false（src/core/components.ts L1359-1376）。⑥ d.ts 动作：新增依赖叶 `src/user-help/dts-actions.ts`（canOpenLocally/openDtsLocally/downloadDts/getPluginInfo），既有菜单与 docs-site 共用；child_process 经 `window.require?.("child_process")` 可选获取，不做顶层 require。⑦ 复制语义：行尾归一化（`\r\n?`→`\n`）+ 允许一个末尾换行差异，验收第 3 条由“逐字节一致”改为归一化一致。无新增阻塞。

**影响：** 后续“开发文档站 GUI”实现任务可仅凭本文件与已验收 DOC-STRUCTURE 直接开工；本任务未修改任何生产文件、全局 change 文件、`.gitignore` 或 git 历史。
