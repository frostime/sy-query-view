# 文档结构与内容来源规则 / Documentation Structure & Content Source Rules

**节点：** `nodes/define-doc-structure`
**状态：** 待主 Agent 验收
**依据：** `TARGET.SPEC.md`（已确定决策与验收标准）、`TERM.md`、`graph.md`
**仓库证据基线：** 当前分支 `docs/query-view-docs-site`，插件版本 `1.3.0`（`plugin.json`）

本文把 `TARGET.SPEC.md` 的产品边界落成可直接执行的页面地图与内容规则，供“整理人类文档”与“开发文档站 GUI”两个执行任务共用同一套页面 ID、内容来源和打包边界。

---

## 1. `docs/` 目录与页面地图

### 1.1 目录结构

```
docs/
├── TERM.md                        # 产品文档中英文术语表（语言中立，单文件）
├── assets/                        # 文档站图片（从仓库根 assets/ 迁移而来，见 §12-1）
│   └── image-*.png                # 现有 76 张，中英文共用
├── zh_CN/
│   ├── index.md
│   ├── quickstart/
│   │   ├── concepts.md
│   │   └── template.md
│   ├── examples/
│   │   └── index.md
│   ├── topics/
│   │   ├── query.md
│   │   ├── dataview.md
│   │   ├── dataview-advanced.md
│   │   └── editor-tips.md
│   ├── api/
│   │   └── reference.md
│   └── skill/
│       └── index.md
└── en_US/                         # 与 zh_CN/ 结构一一对应
    └── （同上 10 个页面）
```

- 两种语言必须保持同构：同一页面 ID、同一路径、同一侧边栏顺序。允许各自翻译，不允许只在一侧存在的页面。
- 现有 `docs/siyuan-3.7.0-embed-editing-qv.md` 是开发分析笔记，不属于产品文档站，将在“整理人类文档”任务中移入 `.dev/notes/`（已确认且无入站链接，见 §12-3）；文档站工具链只处理 `docs/zh_CN/`、`docs/en_US/`、`docs/assets/`。

### 1.2 页面地图（两种语言各 10 页）

页面 ID 即稳定契约：GUI 路由、README 拼装、链接、验收都使用它。文件路径 = `docs/{lang}/` + 下表路径。

| # | 页面 ID | 文件路径 | 侧边栏位置 | 页面目的 |
|---|---|---|---|---|
| 1 | `index` | `index.md` | 第 1 项（首页） | 功能速览 + 两条任务路径（见 §2）；说明文档站是什么、旧帮助笔记不再更新 |
| 2 | `quickstart-concepts` | `quickstart/concepts.md` | 快速开始 ① | 基本概念：JS 嵌入块、执行环境、`protyle/item/top` 变量 |
| 3 | `quickstart-template` | `quickstart/template.md` | 快速开始 ② | “从模板开始”完整路径：复制模板 → 插入嵌入块 → 运行 → 改造 |
| 4 | `examples` | `examples/index.md` | 案例 | 案例总览：机器可读元数据表（§7）+ 19 个案例小节（锚点 `#exp-<文件名>`） |
| 5 | `topic-query` | `topics/query.md` | 主题 ① | Query API：SQL 查询、WrappedList/WrappedBlock、Query.Utils、fb2p、pruneBlocks |
| 6 | `topic-dataview` | `topics/dataview.md` | 主题 ② | DataView 基础（list/Table/md）与全部视图组件（cards/embed/mermaid/echarts/columns/details/addElement/addDisposer/removeView/replaceView） |
| 7 | `topic-dataview-advanced` | `topics/dataview-advanced.md` | 主题 ③ | 自定义视图组件、useState、生命周期、只读建议 |
| 8 | `topic-editor-tips` | `topics/editor-tips.md` | 主题 ④ | 外部编辑器编辑、调试、配合思源模板、常见问题 |
| 9 | `api-reference` | `api/reference.md` | API 参考 | API 可读导览 + 打开/下载 `types.d.ts` 的按钮（docs-only）；精确签名以类型声明为准 |
| 10 | `skill` | `skill/index.md` | 智能体技能 | 占位页：说明技能是什么、何时可用；未来内容 = 核心 SKILL.md 的同一份内容（本节点不写） |

侧边栏组结构（GUI 内置导航树，见 §10-2）：

```
首页 (index)
快速开始
  基本概念 (quickstart-concepts)
  从模板开始 (quickstart-template)
案例
  案例总览 (examples)
Query / DataView 主题
  Query 查询 (topic-query)
  DataView 视图 (topic-dataview)
  DataView 高级特性 (topic-dataview-advanced)
  外部编辑器与调试 (topic-editor-tips)
API 参考 (api-reference)
智能体技能 (skill)
```

## 2. 首页两条任务路径

`index.md` 是文档站唯一的交互入口页，包含两段显式引导（用 `<!-- docs-only:start/end -->` 包裹，README 生成时剔除，见 §6）：

1. **从模板开始** → 指向 `quickstart-template`：复制基础模板代码、在文档中通过斜杠菜单 `qv-basic` 或手动粘贴 `//!js` 嵌入块、运行第一条 Query View。
2. **按需求找案例** → 指向 `examples`：按元数据表的用途/标签过滤，找到最接近需求的案例，复制并改造。

两段引导都必须有“复制代码”操作（模板/案例的复制按钮由 GUI 渲染，见 §10-3），复制不写入任何用户笔记。

## 3. 每页内容来源

现有 README 行号（`README.md`，中文版 `README_zh_CN.md` 行号略有偏移，如 zh 多一节“其他各类查询函数”）只作定位证据，整理时按主题对应，不按行号机械搬运。

| 页面 ID | 内容来源（仓库证据） | 需要新增的内容 |
|---|---|---|
| `index` | README 简介段（L1-19，需重写旧帮助说明）、§0 功能速览（L20-67） | 两条任务路径卡片（docs-only）、文档站与旧笔记的说明 |
| `quickstart-concepts` | README §1 基本概念（L68-152） | 无 |
| `quickstart-template` | 模板代码权威 = 新建 `public/example/basic-template.js`（内容取自 `src/user-help/index.ts` L19-31 `BASIC_TEMPLATE()`）；README §2 开头（L153-155 附近） | 分步操作说明（docs-only 复制按钮） |
| `examples` | 19 个案例的描述迁移自 `public/i18n/zh_CN.yaml` / `en_US.yaml` 的 `src_userhelp_examplests.*`（与 `src/user-help/examples.ts` L29-48 `Description` 映射一一对应）；README 案例演示（L2273-2340）作为文字骨架；代码一律用 `{{example:exp-*.js}}` 占位符（§7） | 元数据表（固定表头）、每案例一小节描述 |
| `topic-query` | README §2 的 “Using Query for SQL Queries”（L155-269）+ §3 进阶 Query（L474-1019） | 无 |
| `topic-dataview` | README §2 的 DataView 基础（L270-473）+ §4 视图组件（L1020-1914） | 无 |
| `topic-dataview-advanced` | README §5（L1915-2166） | 无 |
| `topic-editor-tips` | README §6（L2167-2195）+ §7（L2196-2238） | 无 |
| `api-reference` | README Reference 导览（L2239-2272）；符号导览映射自 `public/types.d.ts`（`Query` L43、`DataView` L606、`IWrappedBlock` L1002、`IWrappedList` L1045、`Block` L1185 等） | “打开/下载 types.d.ts”按钮（docs-only）；**不复制 d.ts 内容进页面** |
| `skill` | 无（占位） | 占位说明；整合节点后与核心 SKILL.md 共用同一份内容 |

## 4. `docs/TERM.md` 的职责与首批词汇范围

- **职责**：产品文档与 README 的中英文术语权威表；写作和审查必须使用表中译名，不得自行创造新译名；新增反复使用的术语先加表再使用。本文件（`TERM.md`）只约束产品文档语言，不约束代码标识符、GUI 界面文案（界面文案归 `public/i18n/*.yaml`）。
- **首批最小范围**（约 12-15 条，整理文档节点开写前补齐）：JS 嵌入块 / JS Embedded Block；嵌入块 / Embedded Block；模板 / Template；案例 / Example；文档站 / Documentation Site；帮助文档 / Help Document；类型声明 / Type Declaration；API 参考 / API Reference；智能体技能 / Agent Skill；侧边栏 / Sidebar；复制 / Copy；只读 / Read-only；随插件版本发布 / Shipped with the plugin version；知识库笔记 / Knowledge-base Note。
- **规则条目（首批必须含）**：API 名（`Query`、`DataView`、`IWrappedBlock`、`IWrappedList`、`protyle` 等）一律不翻译，直接使用原标识符。

## 5. README 拼装、生成文件与同步检查契约

### 5.1 拼装顺序（每种语言各自生成）

生成器按固定顺序拼接 `docs/{lang}/` 下页面（标题层级整体降一级），每章之间插入固定分隔：

1. 固定头部（模板文字，不进 docs）：项目简介、JS 前提说明、Changelog 链接；**删除**现有 README 头部“点击帮助文档按钮自动创建笔记”段落（README L13-19）与“由 LLM 翻译”声明（L1-3），改述为“README 由 docs 生成、文档站为随版本发布的帮助”。
2. `index.md` 全文（剔除 `<!-- docs-only:start/end -->` 区间）→ 功能速览。
3. `quickstart-concepts` → 4. `quickstart-template` → 5. `topic-query` → 6. `topic-dataview` → 7. `topic-dataview-advanced` → 8. `topic-editor-tips` → 9. `examples` → 10. `api-reference` → 11. `skill`。
12. `api-reference` 之后追加 **d.ts 附录**（生成器行为，非 docs 页面内容）：复用现有 `{{Query}}` / `{{DataView}}` / `{{Proxy}}` 占位符，构建时由 `replaceMDVars` 用 `types/types.d.ts.json` 解析（机制不变，见 `vite.config.ts` `replaceMDVars` 与 `scripts/export-types.js` 尾部 cache 写入）。
13. 固定尾部（LICENSE 等，可选）。

### 5.2 生成文件与提交

- 生成并提交：仓库根 `README.md`、`README_zh_CN.md`（提交态含未解析的 `{{Query}}` 等占位符、图片相对路径，与现状一致）。
- 图片路径规范：docs 页面内相对引用（`../assets/…` / `../../assets/…`）在生成时规范化为 `docs/assets/<file>`（提交态，GitHub 可直接渲染）。图片文件由“整理人类文档”任务从根 `assets/` 以 `git mv` 迁入 `docs/assets/`（见 §12-1）。
- 删除 `<!-- REFERENCE-START -->` / `<!-- REFERENCE-END -->` 标记（README L2241/L2271）：它们唯一消费者是旧帮助笔记功能（`src/user-help/sy-doc.ts` L44-55），该功能随本变更退役。
- `plugin.json` 的 `readme` 映射（`README.md` / `README_zh_CN.md`）保持不变。

### 5.3 同步检查行为契约

- 新增脚本 `scripts/check-docs-sync.js`（最小实现建议：重新生成两份 README 到临时目录，与仓库根已提交文件逐字节比对，不一致则打印 diff 摘要并以非零码退出）。
- 接入点：`package.json` 的 `build` 链改为 `export-types → docs 生成+检查 → vite:build`（顺序依赖：d.ts 附录需要 `types/types.d.ts.json`，必须先跑 `export-types`）。CI 现有 `pnpm run build`（`.github/workflows/release.yml`）自动继承该检查。
- 契约：**构建时发现 README 未同步即构建失败**（对应 TARGET 验收标准 10）。`dev` 模式（`vite:dev`）不强制检查，只做生成（本地开发提示即可）。
- `vite.config.ts` 既有 `replaceMDVars` / `replaceMDImgUrl` 对 dist 副本的处理保留，仅把图片前缀从 `assets/` 更新为 `docs/assets/`。

## 6. 占位符与排除标记约定（docs ↔ GUI ↔ README 三方的唯一接口）

| 标记 | 含义 | GUI 行为 | README 生成器行为 |
|---|---|---|---|
| `{{example:<file>.js}}` | 引用 `public/example/` 下案例代码 | fetch 插件目录内该文件，渲染为带“复制”按钮的代码块 | 替换为 fenced code block（内嵌完整代码） |
| `<!-- docs-only:start -->` … `<!-- docs-only:end -->` | 只在文档站显示（按钮、任务路径卡片等） | 正常渲染 | 整段剔除 |

- 页面内禁止出现代码仓库地址（`raw.githubusercontent` / `jsdelivr`）形式的资源引用。
- 该约定是 README 与文档站“同一内容来源、无双重维护”的机制保证。

## 7. 案例元数据与案例代码的职责边界

- **代码**：`public/example/exp-*.js`（19 个）是案例代码唯一权威，随插件发布（现打包已含，见 `dist/example/`）。docs 页面**永远不复制代码**，只写 `{{example:exp-*.js}}` 占位符。
- **元数据**（标题、说明、标签、对应主题）：写在 `examples/index.md` 的固定表头表格里（每语言一份，翻译是正常维护，非双重维护）：

  | 文件 | 标题 | 说明 | 标签 |
  |---|---|---|---|

  “按需求找案例”的过滤基于该表（GUI 渲染后按文本过滤，见 §10-3）。
- **迁移**：案例描述文字从 `public/i18n/*.yaml` 的 `src_userhelp_examplests.*`（19 条）迁入 `examples/index.md` 与各小节；原 yaml 键在“停用旧帮助笔记机制”节点删除。
- **基础模板**：新建 `public/example/basic-template.js`（内容 = 现 `src/user-help/index.ts` L19-31 `BASIC_TEMPLATE()`），成为模板唯一权威；`qv-basic` 斜杠菜单改为运行时读取该文件（fetch + 缓存），文档站 `quickstart-template` 页同样用 `{{example:basic-template.js}}` 引用。消除“TS 源码内嵌模板 + docs 引用”的双维护。

## 8. 单一帮助入口变更表

| 现入口 | 位置（证据） | 处理 |
|---|---|---|
| “帮助文档”菜单（旧帮助笔记） | `src/user-help/index.ts` L79-84 → `sy-doc.ts` `useUserReadme` | 改为同名列打开文档站 Tab；`sy-doc.ts` 删除；已有帮助笔记保留原状、停止更新、无迁移提示；不再创建/更新任何笔记 |
| “Examples”菜单 + `js-example` Tab | `index.ts` L86-88 → `examples.ts` | 菜单与 Tab 删除（案例内容由文档站 `examples` 页承担）；`examples.ts`、`index.module.scss` 随删 |
| “在本地打开 d.ts”菜单 | `index.ts` L49-65 | 菜单删除；动作移入 `api-reference` 页按钮（复用 `setting.codeEditor`） |
| “下载 d.ts”菜单 | `index.ts` L67-77 | 菜单删除；动作移入 `api-reference` 页按钮（`sy-query-view@{version}.types.d.ts` 命名不变） |
| `qv-basic` 基础模板斜杠菜单 | `index.ts` L71-90 | **保留**；模板代码权威移入 `public/example/basic-template.js` |
| 设置项 `onlyImportDtsInUserDoc` | `src/setting/index.ts` L17/L57-63 | 删除该设置项 |
| 设置项 `codeEditor` | `src/setting/index.ts` L16 | **保留**（`src/core/editor.ts`、`src/core/index.ts` 的外部编辑器功能依赖） |
| i18n 文案 `src_userhelp_sydocts.*`、`user_help.ahead_hint`、`src_userhelp_examplests.*` | `public/i18n/*.yaml` | 退役删除；新增文档站菜单/界面文案键（如文档站标题、复制按钮） |
| README 中旧帮助笔记说明段落 | README L13-19 | 随文档整理重写（见 §5.1-1） |

最终顶栏帮助菜单只保留一项“帮助（文档站）”。菜单的注册沿用现有 `registerMenuItem` 机制（`src/index.ts` L92-94）。

## 9. 离线静态材料规则

1. **打包**：`dist/` 必须包含 `docs/`（含 `docs/assets/` 全部图片）、`example/`、`types.d.ts`。实现：`vite.config.ts` 的 `viteStaticCopy` 增加 `{ src: "./docs/**", dest: "./docs" }`（`example/`、`types.d.ts`、`i18n/` 已随 vite 的 `public/` 目录复制进 dist，证据：现有 `dist/example/`）；dev 模式 `watch-external` 的 fg 列表增加 `'docs/**'`。
2. **文档站内容消费全部来自插件目录**：`/plugins/sy-query-view/docs/...`、`/plugins/sy-query-view/example/...`、`/plugins/sy-query-view/types.d.ts`。GUI 不 fetch 任何外部 URL。
3. **版本一致性**：文档站一切内容随插件版本一起打包发布，无远程动态更新；内容更新必须走版本发布。GUI 用 `plugin.json` 的 `version`（先例 `src/user-help/index.ts` L68-69）显示/命名下载文件。
4. **README 图片 `@main` 改写问题**（现状与边界）：`replaceMDImgUrl` 只改写 dist 内 README 副本为 `@main` 远程 URL（`vite.config.ts`），这是**在线展示通道**（GitHub/集市）的既有行为，**保留**；文档站 GUI 不消费 dist README，而是直接渲染 docs 页面，因此离线与版本一致不受影响。规则：远程改写只允许发生在 README 打包环节，任何文档站消费的内容禁止远程 URL。
5. **移动端**：第一版桌面验收；文档站 Tab 在移动端不承诺布局，但不得破坏移动端已有 Query View 块的正常渲染（沿用现有只读渲染体系，不触碰 `.data-query-embed` 渲染路径）。

## 10. GUI 最小内容读取契约（不展开 DOM 组件）

1. **语言选择**：默认 `window.siyuan.config.lang` 以 `zh` 开头 → `zh_CN`，否则 `en_US`（先例 `src/user-help/sy-doc.ts` L37-38）；GUI 提供手动切换，切换后按同页面 ID 重取另一语言。
2. **导航**：GUI 内置静态导航树（§1.2 的 10 个页面 ID 与侧边栏结构硬编码于 GUI，随版本演进）；**不做 manifest 文件、不用内核 API 列目录**。页面内容一律 `fetch('/plugins/sy-query-view/docs/{lang}/{page-id}.md')`（先例 `sy-doc.ts` L39、`src/core/custom-view.ts` L107）。
3. **渲染**：Markdown 用 `window.Lute` 渲染为只读 HTML（先例 `src/user-help/index.ts` L75）；相对链接/图片按当前页面 URL 解析到插件目录（即 §6 的相对路径约定天然生效）；`{{example:…}}` 占位符展开为代码块 + “复制”按钮（`navigator.clipboard`，复制不写笔记）；`examples` 页的元数据表渲染后可按文本过滤。
4. **页面标题**：取页面首个 H1；侧边栏标签来自 GUI 内置 i18n（新增 yaml 键），不解析 docs 页面。
5. **缺失页面**：404 时显示另一语言同页并附提示，不阻断浏览。
6. **d.ts 打开/下载**：下载沿用 `<a href="/plugins/sy-query-view/types.d.ts" download>` 模式；本地打开沿用 `child_process` + `setting.codeEditor` 模式（迁移自 `src/user-help/index.ts` L49-65）。
7. **Tab 载体**：沿用 `plugin.addTab` + `openTab` 自定义 Tab 机制（先例 `src/user-help/examples.ts`）。

## 11. YAGNI —— 第一版明确不做

- 站内全文搜索（过滤仅限案例元数据表）。
- 前端框架/路由框架/独立文档站框架（原生 TS + DOM + Lute + SiYuan CSS）。
- 远程内容更新、多版本文档并存（文档只跟随当前发布版本）。
- 移动端专用布局与交互。
- 文档站内渲染完整 d.ts（只有导览 + 打开/下载入口）。
- 智能体技能正文与 `references/`（`skill` 页仅占位）。
- 案例代码“下载”按钮（只做复制）。
- 旧帮助笔记的迁移提示、清理或再导入。
- 图片压缩/CDN/资源优化。

## 12. 已确认的决定（主 Agent 2026-08-11 确认）

以下问题已由主 Agent 确认并关闭，不再属于残余问题；执行要求由“整理人类文档”等后续节点落实。

1. **图片迁移到 `docs/assets/`**：76 张图片从根 `assets/` 迁至 `docs/assets/`，由“整理人类文档”任务用 `git mv` 执行；生成 README 的图片路径按 §5.2 规范化为 `docs/assets/<file>`。
2. **README 保留完整 d.ts 附录**：保留 `{{Query}}`/`{{DataView}}`/`{{Proxy}}` 占位符与 `replaceMDVars` 机制，中英文 README 均包含生成后的 d.ts 附录。
3. **开发笔记移入 `.dev/notes/`**：`docs/siyuan-3.7.0-embed-editing-qv.md` 在“整理人类文档”任务中移入 `.dev/notes/`。已执行作用域内仓库检查（排除 `.git`/`node_modules`/`dist`/`dev`/`tmp`），未发现任何需要更新的入站链接，迁移无需改任何引用。
4. **README 图片改写保留 `@main`**：第一版继续由 `replaceMDImgUrl` 将 dist 内 README 图片改写为 `@main` 远程 URL；插件文档站绝不消费这些远程 URL；版本 tag 固定延期（需先确认 tag 命名约定，不阻塞第一版）。
5. **案例页单页结构**：确认采用单页 `examples/index.md`（19 小节 + 锚点 + 元数据表），此前已按局部决策执行。

**无残余待决问题。** 后续“整理人类文档”与“开发文档站 GUI”节点可依据本文直接开工。

## 附：本方案已采用的局部决策清单（未改变用户行为/内容来源/范围/架构）

- 案例页单页化 + 锚点 ID（§1.2）；占位符语法 `{{example:…}}` 与 `<!-- docs-only -->`（§6）；元数据表固定表头（§7）；基础模板权威文件 `public/example/basic-template.js`（§7）；README 拼装剔除首页交互段、追加 d.ts 附录（§5）；同步检查为独立脚本 + 构建失败契约（§5.3）；GUI 静态导航树 + fetch 读取（§10）。
