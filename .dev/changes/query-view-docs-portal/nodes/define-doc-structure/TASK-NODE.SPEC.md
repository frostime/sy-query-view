# 定义文档结构与内容来源规则

**状态：** 已验收
**负责人：** worker `docs-site-worker`

## 任务目的

把 `TARGET.SPEC.md` 已确认的产品边界转化为可直接指导后续文档整理和 GUI 开发的页面地图与内容规则，避免两个执行任务自行发明不兼容的目录、页面 ID、内容来源或打包方式。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`
2. `../../THIS.RULE.md`
3. `../../graph.md`
4. `../../TERM.md`
5. `../../query-view-docs-portal.MAP.md`
6. 仓库现有 `README.md`、`README_zh_CN.md`、`public/example/`、`public/types.d.ts`、`src/user-help/`、`scripts/export-types.js`、`vite.config.ts`、`package.json`、`plugin.json`

必须遵守：

- 本任务只形成方案材料，不修改生产代码、README、案例、构建脚本或项目配置。
- 只可写入本节点目录；不得修改全局 SPEC、任务图、术语或交接文件。
- `docs/zh_CN/` 与 `docs/en_US/` 将成为手工维护的人类文档来源，两种语言页面结构对应。
- README 由 docs 生成、提交，并在构建时检查同步。
- 案例代码仍以 `public/example/` 为唯一来源。
- GUI 将使用原生 TypeScript/DOM、Lute 和 SiYuan CSS 体系；本任务不设计详细组件实现。
- 第一版只验收桌面文档站；移动端专用体验延期。
- Skill 在人类文档与 GUI 验收后执行，本任务只为未来 Skill 页面保留清楚的位置，不编写 Skill。

## 预期输出

创建 `DOC-STRUCTURE.md`，至少包含：

1. `docs/` 目录和中英文页面地图：稳定页面 ID、文件路径、侧边栏顺序、页面目的。
2. 首页两条任务路径：“从模板开始”“按需求找案例”。
3. 每页内容来源：现有 README 章节、案例目录、类型声明或需要新增的内容。
4. `docs/TERM.md` 的职责和最低首批词汇范围；不必在本任务写完整产品术语表。
5. README 拼装顺序、生成文件、同步检查的行为契约；内部脚本细节只需给出最小推荐。
6. 案例元数据与案例代码的职责边界，避免把代码复制到 docs。
7. 单一帮助入口变更表：Help、Examples、d.ts 菜单、基础模板和旧帮助设置分别如何处理。
8. 离线静态材料规则，特别处理当前 README 图片可能被改写到 GitHub `@main` 的问题。
9. 为后续 GUI 定义最小内容读取契约，但不展开 DOM 组件结构。
10. 明确 YAGNI 范围：第一版不做哪些功能。
11. 指出仍需主 Agent 决定的原则性问题；局部选择直接给推荐，不要把所有细节变成问题。

完成后将本文件状态改为“等待验收”，并在“结果与影响”中简述交付物和残余问题。

## 验收条件

- 后续“整理人类文档”和“开发文档站 GUI”可仅凭目标规格与 `DOC-STRUCTURE.md` 使用相同页面 ID、内容来源和打包边界。
- 中英文内容、README、案例、类型声明和未来 Skill 之间没有双重手工维护。
- 单一帮助入口与旧机制退役范围无歧义。
- 离线和版本一致性有可验证规则。
- 未把移动端、搜索、路由框架、远程更新或 Skill 集成扩入第一版。
- 方案与当前仓库实际构建和帮助代码相容，引用关键文件作为证据。

## 结果与影响

**交付物：** 本目录新增 `DOC-STRUCTURE.md`，包含：`docs/zh_CN/` 与 `docs/en_US/` 的 10 页页面地图（稳定页面 ID、路径、侧边栏顺序）；首页两条任务路径；每页内容来源表（映射到现有 README 章节与仓库文件行号）；`docs/TERM.md` 职责与首批词汇范围；README 拼装顺序、生成文件与构建期同步检查契约；案例元数据与代码职责边界（`{{example:…}}` 占位符 + `<!-- docs-only -->` 标记约定）；单一帮助入口变更表（含旧设置、模板、d.ts 菜单的处置）；离线静态材料规则（含 README 图片 `@main` 改写问题的边界划定）；GUI 最小内容读取契约；YAGNI 范围。

**关键证据（已核实）：** README.md/README_zh_CN.md 章节结构及行号、`assets/` 76 张图片与 `@main` 改写机制（`vite.config.ts` `replaceMDImgUrl`）、`{{Query}}` 占位符与 `REFERENCE-START/END` 标记（`scripts/export-types.js` + `types/types.d.ts.json`）、旧帮助入口链（`src/user-help/index.ts` → `sy-doc.ts`/`examples.ts`）、`src/setting/index.ts` 设置项、`public/i18n/*.yaml` 案例描述键、dist 打包现状（含 `example/`、无 `docs/`）。

**已确认决定（主 Agent 2026-08-11 确认，详见 DOC-STRUCTURE.md §12）：** ① 图片由根 `assets/` 迁至 `docs/assets/`（整理任务用 `git mv` 执行）；② README 保留完整 d.ts 附录（含占位符机制）；③ 案例页单页结构（已按局部决策执行）；④ `docs/siyuan-3.7.0-embed-editing-qv.md` 移入 `.dev/notes/`（作用域内检查未发现入站链接需更新）；⑤ README 图片改写保留 `@main`，tag 固定延期，插件文档站不消费远程 URL。

**残余问题：** 无残余待决问题。本节点交付物待主 Agent 验收；验收后可建立“整理人类文档”与“开发文档站 GUI”执行任务。

**影响：** 后续“整理人类文档”与“开发文档站 GUI”节点可直接使用本文页面 ID、占位符约定与打包边界；本文不修改任何生产代码、README、全局 change 文件。
