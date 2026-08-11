# 修复阶段验收反馈

**状态：** 已验收
**负责人：** worker `docs-site-worker`

## 任务目的

修复用户在真实 SiYuan 中第一轮阶段验收发现的文档站问题：无效的站内语言切换、繁体中文界面回退英文、Lute `Md2BlockDOM` 图片与代码块原生编辑控件残留，以及基本概念 Mermaid 仅显示代码。保持文档站离线、只读、单一内容来源和现有 Tab 生命周期不变。

## 已确认行为

1. 文档语言只跟随 SiYuan 界面，不提供站内切换按钮。
2. `zh_CN` 与 `zh_CHT` 都读取 `docs/zh_CN/`；其他界面语言读取 `docs/en_US/`。
3. `zh_CHT` 的插件菜单与文档站侧栏不得回退英文；本轮复用中文文案，不建立第三套人类文档。
4. 文档站代码块只显示文档站自己的文字复制按钮；Lute 原生复制/菜单控件全部移除。
5. 图片只显示图片本身；Lute 的更多、拖拽、网络来源和标题等编辑器控件全部移除。
6. `quickstart/concepts` 的 Mermaid 围栏由一个中英文共用、语言中立的本地 SVG 关系图替换；SVG 遵循 `svg-whiteboard` 的清晰白板原则，离线打包。

## 输入与证据

开始前阅读：

- `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../DECISIONS.md`、`../../HANDOVER-Round2.md`；
- `../shape-docs-gui/docs-site.LAND.md`、`../build-docs-gui/TASK-NODE.SPEC.md`、`../verify-docs-gui/RUNTIME-CHECKLIST.md`；
- `src/docs-site/{index,content,render}.ts`、`index.module.scss`；
- `docs/{zh_CN,en_US}/quickstart/concepts.md`；
- `public/i18n/{zh_CN,en_US}.yaml`、`src/types/i18n.d.ts`、`yaml-plugin.js`；
- 用户截图证据：
  - `C:/Users/EEG/AppData/Local/Temp/agent-temp/images/web-20260811-155634-7999ad1d/images/001-image-1-img_046b97aff82c4361b4f6d25e0c2552d3.png`
  - `C:/Users/EEG/AppData/Local/Temp/agent-temp/images/web-20260811-155634-7999ad1d/images/002-image-2-img_e57b9cf2e51048d4a4922da2c7f8b95c.png`
- Lute 图片 fixture 的原生控件：`.protyle-action`、`.protyle-action__drag`、`.img__net`、`.protyle-action__title`；代码块原生复制/菜单位于 `.protyle-action`。

worker 使用的模型无视觉能力：可以依据 DOM 证据实现和生成 SVG，但不得声称截图或 SVG 视觉验收通过；主 Agent 负责最终视觉检查。

## 允许修改

- `src/docs-site/index.ts`、`src/docs-site/content.ts`、`src/docs-site/render.ts`、`src/docs-site/index.module.scss`；
- `docs/zh_CN/quickstart/concepts.md`、`docs/en_US/quickstart/concepts.md`、新增 `docs/assets/query-dataview-overview.svg`；
- 由 `npm run docs:gen` 重建的 `README.md`、`README_zh_CN.md`；
- `public/i18n/zh_CHT.yaml`（新增）；仅在确有引用变化时修改 `public/i18n/{zh_CN,en_US}.yaml` 与 `src/types/i18n.d.ts`；
- `../verify-docs-gui/RUNTIME-CHECKLIST.md`（只更新本轮已改变的语言、控件和概念图预期）；
- 本节点目录。

不得修改：

- Skill、examples、旧帮助退役文件、设置、API、Vite/package/plugin 配置、其他 docs 页面、全局 change 文件、`.gitignore`、`.pi/` 和 git 历史；
- 不连接或修改用户 SiYuan 数据；不运行安装脚本；不把用户测试结果扩张为移动端已验收。

## 实现要求

1. 删除 `index.ts` 的语言栏、按钮、事件分支和对应 SCSS；导航与重试始终使用初始化时由 `resolveLang()` 得到的语言。
2. 保留 404 时另一语言回退和提示；语言名称键可继续仅服务回退提示。
3. `renderPage` 在注入文档站复制按钮前，从 Lute 产物中删除全部原生编辑控件 DOM。不得只依赖 CSS `display:none`；清理必须覆盖截图与 fixture 中图片/代码块的独立控件类，且不能删除图片、代码文本或文档站自建按钮。
4. SVG 使用稳定 `viewBox`、简单 `g/rect/text/path/marker`，不使用 `foreignObject`、脚本、外链、滤镜、渐变或动画；API 标识符保持可读，缩放后不重叠。
5. 两种语言概念页引用同一个相对 SVG；删除该位置 Mermaid 围栏。运行 docs 生成器同步 README。
6. `zh_CHT.yaml` 必须能被 `js-yaml` 解析，键结构与 `zh_CN.yaml` 完全相同；构建包中必须生成 `i18n/zh_CHT.json`。

## 验证与交付

在本节点中提供可复现验证，至少证明：

- `zh_CN`、`zh_CHT` → `zh_CN` docs，其他已知语言 → `en_US`；代码无 `[data-lang]`、语言栏与切换事件；
- 使用 vendored Lute 图片/代码 fixture 清理后，原生控件计数为 0，图片、`.hljs` 文本和恰好一个文档站复制按钮仍在；
- Mermaid 围栏从两页消失、同一个 SVG 引用存在；SVG XML 可解析且无外部资源/脚本/foreignObject；
- `zh_CHT` i18n 键集与中文一致，build 产物存在且不回退英文；
- docs 同步、TypeScript、完整 build、`git diff --check` 通过；构建产生的 `public/types.d.ts` 副作用必须恢复，不能提交该文件变化。

完成后把本规格状态改为“等待验收”，列出改动、命令结果及仍需用户在真实 SiYuan 复测的项目。不得自行提交。

## 验收条件

- 用户报告的四类问题均有直接实现修复和自动化回归证据。
- 主 Agent 能独立读取 SVG 渲染结果，确认布局清楚且无文字重叠。
- 文档站仍只读、离线，不新增用户数据操作或第三方依赖。
- 真实 SiYuan 复测项明确保留，不伪装成自动验收。

## 结果与影响

**改动（全部在允许路径内）：**

1. **语言只跟随 SiYuan**（`src/docs-site/index.ts` + `index.module.scss`）：删除侧边栏语言栏、`[data-lang]` 按钮、`setActiveLang` 及对应事件分支与 SCSS 样式；导航/重试始终使用初始化时 `resolveLang()` 得到的语言。`content.ts` 的映射保持不变：`window.siyuan.config.lang.startsWith("zh")` → `zh_CN` docs（覆盖 `zh_CN`/`zh_CHT`），否则 `en_US`；404 时另一语言回退与提示保留（`langName`/`lang_zh`/`lang_en` 继续服务回退提示）。
2. **原生编辑控件 DOM 删除**（`src/docs-site/render.ts`）：新增 `removeNativeEditorControls`，在注入文档站复制按钮前从 Lute 产物中 DOM 删除 `.protyle-action`（代码动作条含原生复制/菜单图标、图片图标条）、`.protyle-action__drag`、`.img__net`、`.protyle-action__title`、`.protyle-attr`；不触碰 `<img>`、`.hljs` 代码文本或文档站自建按钮；删除 scss 中的 CSS-only `display:none` 隐藏（不再依赖）。
3. **Mermaid → 本地 SVG**：新建 `docs/assets/query-dataview-overview.svg`（viewBox 760×480，白板式 g/rect/text/line/path/marker；无 foreignObject/脚本/外链/滤镜/渐变/动画；仅代码标识符 + 原图的 Queries/DataViews/Register 标签，语言中立）；`docs/{zh_CN,en_US}/quickstart/concepts.md` 删除 `mermaid` 围栏、改引用同一个相对路径 `../../assets/query-dataview-overview.svg`；`npm run docs:gen` 重建 README（两 README 均含该 SVG 引用、concepts 区无 mermaid；dataview 主题页的 mermaid 教学代码块按设计保留）。
4. **zh_CHT 文案**：新增 `public/i18n/zh_CHT.yaml`（复用 zh_CN 中文文案；js-yaml 解析通过、键结构与值与 zh_CN 完全一致）；构建自动产出 `dist/i18n/zh_CHT.json` 并进入 `package.zip`，插件菜单与文档站侧栏在 zh_CHT 界面不再回退英文。`zh_CN/en_US.yaml` 与 `src/types/i18n.d.ts` 无引用变化、未改动。
5. `../verify-docs-gui/RUNTIME-CHECKLIST.md` 仅更新本轮涉及项：B1/B1a（语言跟随 + zh_CHT 不回退）、C1（SVG 概念图 + 主 Agent 目视）、C3（DOM 级控件删除、DevTools 计数 0）。

**可复现验证**（`nodes/fix-runtime-feedback/verify-runtime-fixes.mjs`，30 断言 ALL PASS）：语言映射表达式从 content.ts 源码提取并对 7 种语言求值（zh_CN/zh_CHT/zh_Hans→zh_CN；en_US/fr_FR/ja_JP/es_ES→en_US）；index.ts/scss 无 `data-lang`/langBar/langBtn/setActiveLang；render.ts 五类选择器齐全且删除先于 enhance/复制按钮注入；vendored m2p 图片/代码 fixture 干跑后原生控件计数 0、`<img>` 与 `.hljs` 代码文本保留；两概念页无 mermaid 围栏且引用同一 SVG；SVG viewBox/无禁项/marker/python XML 良构/同列文本行 y 间距≥24；zh_CHT 键结构=zh_CN 且 dist 产物存在；package.zip 含 `i18n/zh_CHT.json` 与 `docs/assets/query-dataview-overview.svg`。

**命令结果：** `npm run docs:gen` ✓；`npm run docs:check` OK/OK；`npx tsc --noEmit` 0 错误；`npm run build` exit 0（vite:build + zipPack）；`git diff --check` exit 0；`public/types.d.ts` 构建副作用已还原（与 HEAD 字节一致，`git diff --quiet` exit 0）。

**视觉边界（诚实声明）：** 本 worker 模型无视觉能力，**未**对截图或 SVG 渲染做视觉验收；SVG 已按白板约束实现并通过结构/间距粗查，最终视觉效果由主 Agent 目视确认（`RUNTIME-CHECKLIST.md` C1）。

**真实 SiYuan 复测项（保留给用户/主 Agent 在隔离工作区执行）：** ① zh_CHT 界面下插件菜单与文档站侧栏显示中文、文档为简体中文、无英文回退；② 语言切换按钮已消失（B1）；③ 代码块仅剩文档站复制按钮、图片旁无任何 Lute 控件图标（DevTools 计数 0，C3）；④ SVG 在文档站与 GitHub README 中渲染正常、无文字重叠（C1）；⑤ 翻页/404 回退/复制/API 动作/qv-basic 回归（既有清单 A/D/E/F/G/H 项）。

**残余问题：** 无阻塞。dataview 主题页的 mermaid 教学代码块仍以代码形式展示（v1 已知限制，非本轮范围）；`rm -rf dist` 两次被用户安全机制拒绝，本轮在未清理 dist 前提下构建验证（输出文件均被覆盖，无新增删除文件）；未提交、未触碰禁止路径（Skill/examples/设置/API/构建配置/全局文件/`.gitignore`/`.pi/`）。

**（图形修正轮，重试后执行）** 按评审意见重画 SVG 并补充语义断言：

1. **SVG 重画**（`docs/assets/query-dataview-overview.svg`）：显式边齐全——`Query ─► Query.Utils`；`Query ─► sql / backlink / childdoc / random / …`（每条一项，肘形 path 进入 Queries 盒对应行）；`DataView ─► List / Table / Markdown / Mermaid/ECharts / …`（同理进入 DataViews 盒对应行）；`CustomView ─(Register)─► DataViews`；`Query ─► DataView` 边带显式标签 **`Query.DataView()`**。全部节点/盒/边带稳定语义 id（`node-*`/`box-*`/`edge-*`/`label-*`）。仍为白板风格：g/rect/text/line/path/marker，viewBox 800×540，无 foreignObject/脚本/外链/滤镜/渐变/动画。
2. **语义断言**（`verify-runtime-fixes.mjs` 扩展至 60 项，ALL PASS）：14 个节点/盒 id 与 13 个边 id 存在；10 条行级边的终点 y 与对应行文本 y 逐一相等（`edgeY==nodeY`，如 edge-query-sql→292、edge-dataview-mermaid-echarts→294）；`edge-query-dataview` 为水平边且标签文本恰为 `Query.DataView()`；`edge-customview-dataviews` 终点为 DataViews 盒底（y=390）且标签为 `Register`；XML 良构与同列间距 ≥24px 保持。
3. **注释修正**（`src/docs-site/index.ts`）：过时注释 `// ---- 侧边栏：静态导航 + 语言切换 ----` 改为 `// ---- 侧边栏：静态导航 ----`。

**重跑结果：** `verify-runtime-fixes.mjs` 60/60 ALL PASS（exit 0）；`npm run docs:check` OK/OK；`npx tsc --noEmit` 0 错误；`npm run build` exit 0（vite:build + zipPack，package.zip 已含新 SVG）；`git diff --check` exit 0；`public/types.d.ts` 构建副作用已还原（字节一致）。

**视觉边界（不变）：** 本 worker 无视觉能力，未做任何视觉验收；SVG 布局清楚/无重叠的最终确认由主 Agent 目视完成（RUNTIME-CHECKLIST C1）。真实 SiYuan 复测项同前（zh_CHT 文案、语言栏消失、控件 DOM 计数 0、SVG 渲染、其余回归项）。

**（控件清理收窄修正轮）** 按终审意见修复全局 `.protyle-action` 误删任务复选框的回归：

1. **收窄清理范围**（`src/docs-site/render.ts`）：`NATIVE_CONTROL_SELECTORS` 不再包含裸 `.protyle-action`，改为代码块/图片上下文限定——`[data-type="NodeCodeBlock"] .protyle-action` 与 `[data-type="img"] .protyle-action`；图片专用控件 `.protyle-action__drag`/`.img__net`/`.protyle-action__title` 与空占位 `.protyle-attr` 继续移除；任务列表复选框（`.protyle-action--task`，vendored 用例 32）不在代码块/图片上下文中、且被显式排除，完整保留。注释同步修正：不再声称所有 `.protyle-action` 都是编辑器控件，明确任务复选框是内容。
2. **回归断言**（`verify-runtime-fixes.mjs` 扩展，全部 ALL PASS）：源码断言——选择器清单为收窄后的 6 项、无裸 `".protyle-action"` 条目、注释含 `protyle-action--task`、删除仍先于 enhance/复制按钮注入；fixture 干跑改为祖先感知规则（与 render.ts 语义一致）——任务用例 32：`.protyle-action--task` 复选框、`iconUncheck` 图标、`data-task=" "` 状态与标题内容全部保留；图片用例 44：图标条与拖拽/网络/标题控件归零、`<img>` 保留；代码用例 88：动作条归零、`.hljs` 代码文本与 `NodeCodeBlock` 容器保留。
3. **重跑结果**：`verify-runtime-fixes.mjs` ALL PASS（exit 0，断言数增至 66）；`npx tsc --noEmit` 0 错误；`npm run docs:check` OK/OK；`npm run build` exit 0（dist/index.js 确认含收窄后的作用域选择器）；`git diff --check` exit 0；`public/types.d.ts` 已还原（字节一致）。
4. 真实 SiYuan 复测新增一项：含任务列表（勾选/未勾选）的文档在文档站中复选框仍显示且状态正确（C3 项一并核对）。未提交；未触碰全局 change 文件、`.gitignore`、`.pi/` 与 git 历史。
5. **验收文档修正**（本轮）：`nodes/verify-docs-gui/RUNTIME-CHECKLIST.md` C3 已从“`.protyle-action` 全局计数为 0”改为按上下文收窄的验收口径——仅要求代码块/图片内的原生动作条、图片拖拽/网络/标题控件与 `.protyle-attr` 计数为 0，并明确要求任务列表复选框（`.protyle-action--task`）与勾选状态保留可见；不再要求全局 `.protyle-action` 计数 0（与收窄后的 render.ts 行为一致）。`git diff --check` exit 0；未修改生产代码或全局文件。
6. **主 Agent 视觉与最终审查**：使用 Edge headless 将 SVG 渲染为 `1000×700` PNG 后亲自目视确认阅读路径清楚、箭头与标签可辨识、无文字重叠或截断；最终独立 reviewer 结论为 `ACCEPT`。
