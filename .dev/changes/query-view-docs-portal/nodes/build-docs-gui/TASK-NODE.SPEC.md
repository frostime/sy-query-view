# 开发文档站 GUI

**状态：** 已验收
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

**交付物（全部按 LAND 契约实现）：**

1. `src/docs-site/nav.ts` — 判别联合 `NavNode = NavGroup | NavItem`（分组无 id/path），`PageId` 10 页、`PAGE_TREE`、`pagePath`，分组/条目 labelKey 类型 `NavLabelKey`（13 键，与 i18n 键编译期校验）。
2. `src/docs-site/content.ts` — `createContent(pluginName)` 工厂；`PageLoadResult`（ok/fallback/error）状态化加载：`response.ok` 检查、仅 404 回退另一语言（5xx/网络 → error 不回退）、缓存只写成功、结果携带实际渲染 lang/baseUrl（回退时另一语言 baseUrl）；`stripDocsOnlyMarkers`（仅删标记行）；`expandExamples`（`{{example:}}` → ```js 围栏，行尾归一化，缺文件降级输出 + warn，失败不缓存）；`clearCache`。
3. `src/docs-site/render.ts` — `RenderUi`（copyClass/copyLabel/copiedLabel 注入）与 `RenderCtx`（绝对 baseUrl）；`renderPage` = `getLute().Md2BlockDOM(md)` → 只读化（`[contenteditable="true"]` → false，先例 MarkdownComponent）→ b3-typography 容器 → enhance；相对 img/a 用 `new URL(attr, 绝对base)` 解析，外部 URL 不动；复制按钮先捕获 `code.textContent`、挂到 `pre` 同级、行尾归一化后写入剪贴板（clipboard API + execCommand 回退）、成功短暂显示 copied 文案。不 import `@/index`/scss。
4. `src/docs-site/index.ts` — `load(plugin)`：`plugin.i18n` 取标签（无 @/index 运行时导入，仅 `import type`）；`addTab({ type: "docs-site" })`；单调 `requestSeq` 令牌（翻页/语言切换/重试共用，await 后校验 seq+disposed 才更新 DOM/状态/提示/滚动）；固定 Tab id `${plugin.name}docs-site`；单一事件委托（导航/语言/重试）；404 回退提示条（fallback_notice，{0}/{1} 语言名）、错误视图 + 重试；API 页工具条动作经 `dts-actions`；dispose 清缓存 + 令牌失效，DOM/事件清理归 destroy。
5. `src/docs-site/index.module.scss` — CSS Modules 作用域类（root/sidebar/nav/langBar/main/notice/toolbar/error/retry/copy 等），复用 `--b3-theme-*`/`--b3-list-hover` 变量，pre 定位与复制按钮样式限定 `.root` 内，无全局选择器。
6. `src/user-help/dts-actions.ts` — 依赖叶：`canOpenLocally()`、`openDtsLocally(pluginName, codeEditor)`（`window.require?.("child_process")` 可选获取，无顶层 require）、`downloadDts(pluginName, version)`、`getPluginInfo(pluginName)`（显式入参）；无内部依赖。
7. `src/user-help/index.ts`（最小改造）— `getPluginInfo(plugin.name)` 取代硬编码 plugin.json fetch；`DocsSite.load(plugin)` + `plugin.disposeCb` 注册 dispose；两个 d.ts 菜单处理器改为 `canOpenLocally/openDtsLocally/downloadDts`（行为不变）；`help_doc` 菜单 click 改为 `docsSite.open()`。`sy-doc.ts`、`examples.ts`、`index.module.scss`、`src/setting/**` 全部未动。
8. `public/i18n/{zh_CN,en_US}.yaml` + `src/types/i18n.d.ts` — 新增 `src_docsite_indexts` 22 键（tab_title、13 导航键、copy/copied/retry/page_not_found/fallback_notice/load_error/lang_zh/lang_en），双语键集一致。

**验证（命令与结果）：**

- `npx tsc --noEmit -p tsconfig.json` → 0 错误。
- `npm run build` ✓（export-types → docs:check OK/OK → vite:build → zipPack）；dist/index.js 含 docs-site 代码；dist/i18n/zh_CN.json 含全部 22 个新键；dist/docs、dist/example/basic-template.js 在位。无 circular 依赖警告。
- 静态检查：`grep createDocWithMd/updateBlock/setBlockAttrs/insertBlock`（docs-site + dts-actions）→ 无；`grep sy-query-view`（docs-site + dts-actions）→ 无（路径全部 pluginName 透传）；`grep https?://` → 无；`grep from "@/index"` → 仅 `import type`。
- 逻辑冒烟测试 `nodes/build-docs-gui/content-smoke.test.ts`（esbuild 打包后 node 运行，16 断言全 PASS）：404→fallback（requestedLang/另一语言 baseUrl/内容保留）；缓存命中→ok；500→error network 不回退；双语均 404→not-found；占位符展开为围栏 + CRLF 归一化 + 重复占位符；缺文件降级；docs-only 标记剥离保留内容；clearCache 后重取；pageUrl 用 pluginName。
- `git diff --check` ✓ 干净；`public/types.d.ts` 被 export-types 改写后已 `git checkout` 还原。

**残余问题/无法在本环境验证的行为：**

- SiYuan Tab 运行时行为未实测（本环境无 SiYuan 实例）：① `openTab` 对固定 id 是激活既有 Tab 还是新建（实现按“激活/复用”假设，`open(initialPageId)` 始终走 openTab；若实测重复建 Tab，按 LAND §3.4 用 `plugin.getOpenedTab()` 守卫）；② Lute `Md2BlockDOM` 对 docs 页的实际渲染保真度与 docs-only 注释行的表现（`stripDocsOnlyMarkers` 已内建兜底）；③ 复制按钮在真实桌面剪贴板环境的行为（clipboard API + execCommand 双路径）。
- 局部选择（未偏离 LAND）：`docs-site/index.ts` 经 `@/setting` 读取 `setting.codeEditor`（与既有 `user-help/index.ts` 相同依赖模式，构建无 circular 警告；LAND §3.5 禁止的是 @/index 运行时导入与渲染器注入循环）；复制按钮样式类 `copyClass` 由 index 注入，pre 的定位/留位样式放在 scss `.root` 作用域内（render 仍不 import scss）；`fallback_notice` 用 `{0}/{1}` 语言显示名替换。
- 无阻塞性残余问题。待主 Agent 验收后，可进入“整合人类文档”验收与“停用旧帮助笔记机制”任务。

**（评审修正轮）** 按评审意见修正七项并保持 `等待验收`：

1. **render.ts 适配 Lute 实际产物**（证据：`88250/lute` `test/m2p_test.go` 用例 88/34/81/26/46/96/9/32/44/117）：复制按钮改挂到 `[data-type="NodeCodeBlock"]`（`.code-block`），文本取自 `.hljs`（插入按钮前捕获）；原生编辑器控件 `.protyle-action`/`.protyle-attr` 由 scss 在 `.root` 作用域内 `display:none`（不影响自建按钮）；链接改为 `[data-type~="a"]` + `data-href` 处理（相对 data-href 按页面绝对 base 解析，http(s) 结果 window.open，空 href/非 http(s) 保持纯文本）；`extractTitle` 改用 `[data-type="NodeHeading"][data-subtype="h1"]`；图片同时解析 `src` 与 `data-src`。
2. **content.ts 回退分类**：首语言 404 后，另一语言 404 → `not-found`，另一语言 5xx/网络异常 → `network`（仅“双 404”为 not-found）。
3. **API 工具条竞态消除**：移除 load 时的预初始化；navigate 在 `expandExamples` 后、渲染前若 `api-reference` 动作未就绪则 `await ensurePageActions()`，每次 await 后都有请求令牌 + disposed 校验；初始化失败保持未定义、下次渲染重试，不再永久缺失。
4. **per-Custom 生命周期**：`this.data?.pageId` 取代共享 `pendingPageId`；清理函数按实例存入 `WeakMap<Custom, () => void>`，`destroy()` 只清理自身实例；`DocsSite.dispose()` 仅 `content.clearCache()`，不依赖任何特定 Tab（`Custom.data` 为 SDK 类型面，siyuan/types/index.d.ts）。
5. **可复现验证**：删除原不可复现的 TS 冒烟测试（无项目命令）；新增两个纯 node 验证：`verify-render-selectors.mjs`（33 断言全 PASS：render.ts 选择器在 vendored m2p 用例中成立 + 源码交叉核对 + 生产代码无硬编码插件名）与 `verify-content.cjs`（14 断言全 PASS：404 回退/缓存/500→network/双 404→not-found/另一语言 500 与网络异常→network/占位符/降级/docs-only/clearCache/假插件名透传）；后者经 `npx tsc src/docs-site/content.ts --outDir .../verify-emit --module commonjs --target es2020 --moduleResolution node --skipLibCheck --rootDir src/docs-site` + `verify-emit/ambient.d.ts`（测试专用 Window 声明）+ `.js→.cjs` 重命名后运行（命令已记录于 verify-content.cjs 头注释）。测试使用显式假插件名 `test-plugin`。
6. 全部重跑：`npx tsc --noEmit` 0 错误；`npm run build` ✓（docs:check OK/OK → vite:build → zipPack；dist/index.js 含 NodeCodeBlock/data-href/NodeHeading 处理代码）；`git diff --check` 干净；`public/types.d.ts` 已还原；`.gitignore` 未触碰（其 `.pi-input.md` 条目为本任务前既有）。
7. 残余：SiYuan Tab 运行时行为（openTab 激活/复制按钮真实剪贴板）仍无法在本环境实测，如实记录；无阻塞。

**（终审修正轮）** 三项修正并保持 `等待验收`：

1. **卸载失效**：`DocsSite.dispose()` 现在自增站点生命周期代数 `siteGeneration`（`load()` 作用域内），使所有在途 Tab 请求失效——即使 SiYuan 未先调用 `destroy()`；`navigate` 每次 `await`（`loadPage`/`expandExamples`/`ensurePageActions`）后同时校验 `seq !== requestSeq || gen !== siteGeneration || disposed` 才允许更新 DOM/状态/提示/滚动。未声称 addTab 注销。
2. **链接样式**：scss 选择器由 `[data-type~="a"]` 收紧为 `[data-type~="a"][data-href]:not([data-href=""])`——仅可渲染链接（data-href 非空；javascript: 等危险协议被 Lute 清空为 `data-href=""`，m2p 用例 117）获得指针/链接色，空/危险链接保持视觉普通，与 render.ts 点击注入条件一致。
3. **验证自包含化**：删除任务目录内持久化的 `verify-emit/` 生成物（已确认删除成功，目录不再存在）；`verify-content.cjs` 重写为单命令自包含脚本：用仓库现有 TypeScript（`require.resolve("typescript/bin/tsc")` + `process.execPath`）把 `src/docs-site/content.ts` 发射到 `os.tmpdir()` 临时目录（commonjs + 测试专用 ambient Window 声明），`.js→.cjs` 重命名并修正内部 `require("./nav")` 后运行 14 项内容断言，`finally` 中删除临时目录（运行输出证实 `exists=false`，且 Temp 目录无 `docs-gui-verify-*` 残留）。

**终审重跑结果：** `node verify-content.cjs` 14/14 PASS + 临时目录清理证明；`node verify-render-selectors.mjs` 33/33 PASS；`npx tsc --noEmit` 0 错误；`npm run build` ✓（docs:check OK/OK → vite:build → zipPack）；`git diff --check` 干净；`public/types.d.ts` 已还原；`.gitignore` 未触碰（`.pi-input.md` 条目为任务前既有）；仓库内无任何测试生成物。残余同前：SiYuan Tab 运行时行为无法在本环境实测。

**影响：** Help 菜单现打开文档站 Tab，不再触发旧帮助笔记创建/更新链路（旧模块保留）；d.ts 菜单行为不变但实现与文档站共用依赖叶；docs 构建产物、README、构建链均未改动；无提交。
