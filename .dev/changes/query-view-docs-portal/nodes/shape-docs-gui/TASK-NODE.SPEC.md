# 定义文档站 GUI 代码结构

**状态：** 执行中
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

等待执行。
