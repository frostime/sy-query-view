# 开发文档站 GUI

**状态：** 执行中
**负责人：** worker `docs-site-worker`

## 任务目的

按已验收的 `docs-site.LAND.md` 实现桌面端插件内文档站，使 Help 菜单在 SiYuan 自定义 Tab 中打开本地打包的中英文文档，并提供导航、语言切换、代码复制和 API 类型声明动作。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../TERM.md`、`../../DECISIONS.md`
2. `../define-doc-structure/DOC-STRUCTURE.md`
3. `../write-human-docs/TASK-NODE.SPEC.md`
4. `../shape-docs-gui/docs-site.LAND.md`（本任务代码结构的权威契约）
5. 当前 `src/user-help/index.ts`、`src/user-help/examples.ts`、`src/user-help/sy-doc.ts`、`src/core/lute.ts`、`src/utils/lute.ts`、`src/index.ts`、`public/i18n/*.yaml`、`src/types/i18n.d.ts`、`docs/`

允许修改或创建：

- `src/docs-site/**`；
- `src/user-help/index.ts`；
- `src/user-help/dts-actions.ts`；
- `public/i18n/zh_CN.yaml`、`public/i18n/en_US.yaml`；
- `src/types/i18n.d.ts`；
- 本节点目录。

不得修改：

- `docs/**`、README、构建脚本、Vite 配置、`package.json`；
- `src/user-help/sy-doc.ts`、`src/user-help/examples.ts`、`src/user-help/index.module.scss`、`src/setting/**`；
- `public/example/**`、`public/types.d.ts`、`plugin.json`、`.gitignore`、全局 change 文件和 git 历史；
- 不删除任何旧菜单或旧逻辑，不实现 Skill，不引入依赖、框架、路由、搜索或移动端专用布局。

## 预期输出

1. 依照 LAND 创建 `src/docs-site/{index,nav,content,render}.ts` 和 CSS Modules 样式文件，且各模块职责、依赖方向和 API 符合 LAND。
2. Help 菜单改为打开固定的文档站 Tab；不调用 `useUserReadme`，但旧模块保留不删。
3. 文档站显示 static nav 的 10 个页面、按 SiYuan 语言选择 docs、可手动切换语言、仅 404 回退至另一语言，并处理加载错误和重试。
4. 只从 `/plugins/${plugin.name}/docs/`、`example/`、`types.d.ts`、`plugin.json` 读取本地内容；无远程内容请求、无用户笔记 API 调用。
5. 使用 `getLute().Md2BlockDOM` 并将可编辑产物变为只读；解析相对图片/链接时使用实际页面语言的绝对 base URL。
6. 对所有代码块提供本地化复制按钮；复制文本按 LAND 的行尾和单末尾换行规则处理。
7. 新建共享 `dts-actions.ts`，使既有 d.ts 菜单行为不变，同时 API 页工具条使用相同实现；动态使用 `plugin.name`，不硬编码插件名。
8. 使用 SiYuan CSS class/变量与 CSS Modules，不污染全局样式。
9. 运行 TypeScript/build 与可行的静态验证；记录无法在当前环境实际验证的 SiYuan Tab 行为。

## 验收条件

- `npm run build` 成功，且 docs 同步检查继续通过。
- 所有 GUI 代码满足 LAND 的模块边界和无环依赖；不引入未批准依赖。
- Help 菜单不再触发旧帮助笔记创建/更新链路，文档站代码中无任何用户笔记写入 API。
- 静态检查确认路径均使用 `plugin.name`，所有页面内容走插件本地目录。
- 双语言、404 回退、异步竞态、只读 Lute 输出、复制语义和 API actions 都有可追溯的实现/验证证据。
- 任务没有修改禁止路径；旧 Examples、d.ts 菜单、设置和帮助模块仍存在，等待后续退役任务。

## 结果与影响

等待执行。
