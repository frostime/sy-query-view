---
title: Query&View 文档站变更交接 Round 2
created: 2026-08-11T13:10:02+08:00
---

## Assume Reader

接收者是上下文已压缩或新开启的 Pi Agent。它可以读取本仓库（分支 `feat/query-view-docs-site`，HEAD `a70ca52`）和 `.dev/changes/query-view-docs-portal/`，但不能依赖此前对话。本文件是压缩后的首要入口。

## Background Context

本变更用插件内文档站（In-Plugin Documentation Site）替代由插件创建和更新的用户帮助笔记。用户已确认方向：`docs/zh_CN/` 与 `docs/en_US/` 为人类文档唯一手工来源、README 自动生成、GUI 原生 TypeScript/DOM + Lute + SiYuan 样式、单一帮助入口、移动端文档站体验延期。完整权威目标见 `TARGET.SPEC.md`。

## Current Status

代码主体已全部完成并提交：

- `677d3d2` — 文档站 GUI + 旧帮助退役
- `a70ca52` — 核心 Agent Skill

工作区仅剩两项**不应提交**的内容：`.gitignore` 的 `.pi-input.md`（用户任务前既有修改）和 `.pi/`（pi 工具自身会话目录）。

**当前执行节点**：`nodes/write-core-skill/`（状态：等待验收，但**存在已知内容错误，尚未验收**，见下）。

## Trajectory

1. **澄清阶段**：确认语言跟随 SiYuan 界面、信息架构（首页任务引导 + 侧边栏 10 页）、旧帮助笔记保留不更新、README 从 docs 生成。
2. **文档结构与内容规则**（已验收）：`nodes/define-doc-structure/DOC-STRUCTURE.md` — 10 页页面 ID、`{{example:}}` / `<!-- docs-only -->` 占位符契约、README 拼装与同步检查、单一帮助入口变更表、离线规则。
3. **人类文档**（已验收）：`docs/zh_CN/` + `docs/en_US/` 各 10 页、`docs/TERM.md`、76 张图迁至 `docs/assets/`、`scripts/build-docs.js` + `check-docs-sync.js`、`public/example/basic-template.js` 成为模板唯一权威。
4. **GUI 结构设计**（已验收）：`nodes/shape-docs-gui/docs-site.LAND.md` — 模块边界、Tab 生命周期、状态化加载、竞态令牌、i18n 注入、只读渲染契约。
5. **GUI 实现**（已验收，两轮审查修正）：`src/docs-site/{index,nav,content,render}.ts` + SCSS、`src/user-help/dts-actions.ts` 依赖叶、Help 菜单改开文档站、Lute `Md2BlockDOM` 实际 DOM 适配（`NodeCodeBlock`/`.hljs`/`data-href` 链接）。
6. **旧帮助退役**（已验收）：删除 `sy-doc.ts`/`examples.ts`/旧样式/独立 Examples 与 d.ts 菜单/`onlyImportDtsInUserDoc` 设置/README `REFERENCE-START/END` 标记；`qv-basic` 改运行时读取 `basic-template.js`；未触碰任何用户笔记数据。
7. **自动验证**（已验收）：`nodes/verify-docs-gui/AUTOMATED-VALIDATION.md` 全过；`RUNTIME-CHECKLIST.md` 22 项人工清单待用户在隔离工作区执行。
8. **核心 Skill**（未验收，有已知错误）：`skills/sy-query-view/SKILL.md` 177 行英文自包含，`verify-skill.mjs` 31 项断言通过，但主 Agent 审查发现 API 归类错误。

## Key Information for the Successor

### 首要任务：修正 Skill 的 legacy 标注错误

`skills/sy-query-view/SKILL.md` 第 5 节 "Legacy spellings to avoid" 与 `verify-skill.mjs` 的 legacy 断言列表**归类错误**：

- `dv.cards`、`dv.replaceView`、`dv.repaint` 是 `public/types.d.ts` 中的**规范 API**（证据：`cards` L738、`replaceView` L671、`repaint` L619），**不应**列为 legacy；
- `Query.utils` 是 `docs/en_US/topics/query.md` 明确承认的**合法小写别名**（"`Query.Utils` has an lowercase alias `Query.utils`"），不应列入 avoid；
- 真正需要标注旧拼写的是案例中仍使用的 `Query.Dataview`（规范为 `Query.DataView`）、`Query.prune`（规范为 `Query.pruneBlocks`）等。

修正范围：SKILL.md 的 avoid-note + verify-skill.mjs 的 `legacy` 数组 + 相关断言；修正后重跑验证并验收 `write-core-skill` 节点（更新 `graph.md`/`EVOLVE-STORY.md`）。

### 剩余任务（按序）

1. 修正并验收 `write-core-skill`（见上）。
2. **接入 Skill 并做整体发布验证**（graph 最后一个执行任务）：`docs/zh_CN/skill/index.md` 与 `docs/en_US/skill/index.md` 目前是占位页，需显示同一份 SKILL.md 内容（可考虑 `{{skill:...}}` 类占位符扩展生成器，或由 GUI 特判渲染）；验证打包结果符合 `TARGET.SPEC.md` 验收标准。
3. **`references/` 验证**：延后任务。用户提议用 `SKILL.md` 指示 Agent 用文件读取工具访问 `references/`；主 Agent 已核查 SiYuan v3.7.0 的 `file.read` 仅限 workspace 相对路径、`skill.load` 只返回 SKILL.md 正文，路径边界需实测，不得假定成立。
4. **真实 SiYuan 运行时人工验收**：`nodes/verify-docs-gui/RUNTIME-CHECKLIST.md` 22 项，需用户在隔离测试工作区执行（本环境从未连接真实 SiYuan 用户数据）。

### 重要约束与工作区事实

- **禁止操作用户 SiYuan 数据**：无用户明确同意不得运行安装脚本、调用用户笔记 API 或连接真实工作区。
- **构建链**：`npm run build` = `export-types → docs:check → vite:build → zipPack`；`docs:gen` 不在 build 链中（作者操作）。README 只能通过改 docs 后 `docs:gen` 生成，`docs:check` 检测未同步即构建失败。
- **`public/types.d.ts` 副作用**：`export-types` 会改写其头部版本/时间戳；构建后必须 `git checkout -- public/types.d.ts` 还原（本次已多次还原）。当前 `git status` 中它显示 ` M` 仅是 autocrlf 统计伪影，内容与 HEAD 字节一致。
- **提交纪律**：`.gitignore`（`.pi-input.md`）与 `.pi/` 是任务外内容，永不提交；生产提交遵循 Conventional Commits + emoji（见仓库 `git-commit-msg` SKILL）。
- **自动化验证脚本**（可复现）：`nodes/build-docs-gui/verify-content.cjs`（14 断言）、`verify-render-selectors.mjs`（33 断言）、`nodes/retire-legacy-help/verify-i18n.mjs`（11 断言）、`nodes/write-core-skill/verify-skill.mjs`（31 断言，需随 Skill 修正同步更新）。

## 主 Agent ↔ worker 协同方式（必须遵守）

本变更的所有具体执行都通过长期复用的 worker subagent 完成。压缩后新 session 必须按此机制继续，否则会破坏已建立的审查闭环。

### 派发参数（每次派发原样使用）

```text
slug:        docs-site-worker
presetAgent: worker
reuse:       true（首次与每次延续都必须；延续只发增量描述，并要求 worker 先重读可能变化的状态）
cwd:         H:/SrcCode/SiYuanDevelopment/sy-query-view（固定）
setModel:    opencode-go/deepseek-v4-flash
setThinking: max
piArgs:      禁止使用（用户明确要求，避免触发额外用户审查阻塞会话）
```

### 每个任务的闭环流程

1. **建任务**：主 Agent 在 `nodes/<task-slug>/` 建立 `TASK-NODE.SPEC.md`（目的/输入边界/预期输出/验收条件/状态/结果六要素）+ `code-start.prompt.md`（最小启动提示：预设给定决策正确、不过度调研、遇冲突立即停下报告）。
2. **派发**：按上方参数调用 subagent，任务描述包含“重读节点规格与全局文件后再动手、只写允许路径、不提交、完成后把状态改为等待验收并填写结果”。
3. **执行边界**：worker 只写节点目录和任务规格允许的生产文件；不修改全局 change 文件、`.gitignore`、git 历史；不 commit。
4. **独立审查（必做）**：worker 报告后，主 Agent 派 `code-reviewer` preset（模型 `rrver-codex/gpt-5.6-luna:max`，仅 read/bash 权限）做独立审查，同时主 Agent 亲自抽查关键文件。**绝不只信 worker 报告**。
5. **打回或验收**：有实质缺陷 → 同一 slug 打回修正（已发生多轮：GUI 两轮、退役两轮）；通过 → 主 Agent 验收：节点状态改“已验收”，更新 `graph.md`/`EVOLVE-STORY.md`/`THIS.RULE.md`/交接文件，必要时记 `DECISIONS.md`。提交由主 Agent 执行。
6. **worker 生命周期**：每轮报告会带 context 用量（当前约 56% / 1M）；接近上限前先让 worker 产出交接摘要再退休并另开新 slug；耗尽后不可复用。

### 已踩过的坑（教训，新 session 必须规避）

- **worker 报告可能与实际不符**：曾声称 `check-docs-sync.js` 已做 CRLF 归一化但实际文件仍是原始比较；曾声称“逐字节比对”而实现是普通比较。→ 关键声明必须亲自读文件核实，或以可复现脚本断言为准。
- **按行删除 YAML 键会残留多行值残片**：i18n 退役清理曾把旧文案残片吸入保留键值（YAML 语法吞掉），构建仍能通过。→ 结构化内容必须用解析器（js-yaml）断言键集与值，不能只靠 grep。
- **推测的 API 不可信**：曾按推测使用 Lute `Md2HTML`，实际仓库只有 `Md2BlockDOM`。→ 契约必须对照真实 SDK 类型/仓库先例，并由验证脚本固定证据。
- **验证脚本必须自包含可复现**：曾遗留 `verify-emit/` 编译产物，已改为临时目录 + finally 清理；不得把生成物留在仓库。
- **自动 safe guard 可能返回无效审查结果**：曾因此阻止 commit；主 Agent 不绕过，重试或请用户决定。

## File Reference Map

- `TARGET.SPEC.md` — 目标、行为契约、验收标准（状态：实施阶段）。
- `THIS.RULE.md` — long-task-orchestration 运行规则（权威文件职责、任务图规则、更新纪律、交接顺序）。
- `graph.md` — 任务图；当前前沿：`write-core-skill`（待修正验收）→ 接入 Skill。
- `EVOLVE-STORY.md` — 面向用户的演进叙事。
- `TERM.md`、`DECISIONS.md` — 开发术语与已记录的小型决定。
- `query-view-docs-portal.MAP.md` — 代码导航索引。
- `nodes/define-doc-structure/DOC-STRUCTURE.md` — 页面地图与内容契约（被 GUI/文档/生成器共同遵守）。
- `nodes/shape-docs-gui/docs-site.LAND.md` — GUI 结构契约。
- `nodes/verify-docs-gui/AUTOMATED-VALIDATION.md` + `RUNTIME-CHECKLIST.md` — 验证证据与人工清单。
- 生产代码：`src/docs-site/*`、`src/user-help/{index,dts-actions}.ts`、`scripts/build-docs.js`、`skills/sy-query-view/SKILL.md`。
