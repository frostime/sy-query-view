---
title: Query&View 文档站变更交接 Round 2
created: 2026-08-11T13:10:02+08:00
---

## Assume Reader

接收者是上下文已压缩或新开启的 Pi Agent。它可以读取本仓库当前分支 `feat/query-view-docs-site`（以 `git log --oneline` 获取最新 HEAD）和 `.dev/changes/query-view-docs-portal/`，但不能依赖此前对话。本文件是压缩后的首要入口。

## Background Context

本变更用插件内文档站（In-Plugin Documentation Site）替代由插件创建和更新的用户帮助笔记。用户已确认方向：`docs/zh_CN/` 与 `docs/en_US/` 为人类文档唯一手工来源、README 自动生成、GUI 原生 TypeScript/DOM + Lute + SiYuan 样式、单一帮助入口、移动端文档站体验延期。完整权威目标见 `TARGET.SPEC.md`。

## Current Status

代码主体与自动发布验证已经完成。主要 checkpoint 可通过 `git log --oneline` 查看，其中包括文档站与旧帮助退役、核心 Skill、阶段运行时反馈修复、Skill API 校正和最终 Skill 接入。

工作区正常情况下只剩两项**不应提交**的内容：`.gitignore` 的 `.pi-input.md`（用户任务前既有修改）和 `.pi/`（pi 工具自身会话目录）。

**当前状态**：无代码执行节点。`nodes/integrate-skill-release/` 已通过自动、构建与独立审查；等待用户在隔离 SiYuan 工作区复测阶段反馈修复和 Skill 页面。`references/` 研究由用户明确延后。

## Trajectory

1. **澄清阶段**：确认语言跟随 SiYuan 界面、信息架构（首页任务引导 + 侧边栏 10 页）、旧帮助笔记保留不更新、README 从 docs 生成。
2. **文档结构与内容规则**（已验收）：`nodes/define-doc-structure/DOC-STRUCTURE.md` — 10 页页面 ID、`{{example:}}` / `<!-- docs-only -->` 占位符契约、README 拼装与同步检查、单一帮助入口变更表、离线规则。
3. **人类文档**（已验收）：`docs/zh_CN/` + `docs/en_US/` 各 10 页、`docs/TERM.md`、76 张图迁至 `docs/assets/`、`scripts/build-docs.js` + `check-docs-sync.js`、`public/example/basic-template.js` 成为模板唯一权威。
4. **GUI 结构设计**（已验收）：`nodes/shape-docs-gui/docs-site.LAND.md` — 模块边界、Tab 生命周期、状态化加载、竞态令牌、i18n 注入、只读渲染契约。
5. **GUI 实现**（已验收，两轮审查修正）：`src/docs-site/{index,nav,content,render}.ts` + SCSS、`src/user-help/dts-actions.ts` 依赖叶、Help 菜单改开文档站、Lute `Md2BlockDOM` 实际 DOM 适配（`NodeCodeBlock`/`.hljs`/`data-href` 链接）。
6. **旧帮助退役**（已验收）：删除 `sy-doc.ts`/`examples.ts`/旧样式/独立 Examples 与 d.ts 菜单/`onlyImportDtsInUserDoc` 设置/README `REFERENCE-START/END` 标记；`qv-basic` 改运行时读取 `basic-template.js`；未触碰任何用户笔记数据。
7. **自动验证**（已验收）：`nodes/verify-docs-gui/AUTOMATED-VALIDATION.md` 全过；`RUNTIME-CHECKLIST.md` 22 项人工清单待用户在隔离工作区执行。
8. **阶段运行时反馈修复**（已验收）：移除站内语言切换；`zh_CHT` 使用中文；按上下文删除代码块/图片 Lute 控件并保留任务复选框；基本概念使用本地 SVG。
9. **核心 Skill**（已验收）：英文、自包含；规范 API、合法别名和未支持名称分开；receiver-specific 验证、精确返回契约和案例源码核对共 72 项通过。
10. **Skill 接入与发布验证**（已验收自动部分）：双语页面用 `{{skill:sy-query-view}}` 从同一 Skill 展开；运行时与生成器一次替换一致；原始 Skill 随包发布且包内字节一致；52 项接入验证及全部前序验证通过。

## Key Information for the Successor

### 当前结论

代码与自动发布验证已完成；没有待执行的生产代码任务。后续 Agent 不应重新修正已解决的 Skill legacy 分类问题，也不应创建 `references/`。

当前唯一验收前沿是用户在隔离 SiYuan 工作区进行运行时复测：语言跟随与 `zh_CHT`、图片/代码块控件、任务复选框、SVG、Skill 页面展开、复制/只读/导航和离线原始 Skill 路径。

### 剩余任务

1. 用户按 `nodes/verify-docs-gui/RUNTIME-CHECKLIST.md` 复测，重点检查 B1/B1a、C1/C3 和 Skill 页面。
2. 若复测失败，建立针对具体失败项的新节点，禁止在验证节点中直接扩大修复范围。
3. `references/` 文件读取实测、Skill 安装/启用状态和 SiYuan Agent/MCP 集成均明确延后。

### 重要约束与工作区事实

- **禁止操作用户 SiYuan 数据**：无用户明确同意不得运行安装脚本、调用用户笔记 API 或连接真实工作区。
- **构建链**：`npm run build` = `export-types → docs:check → vite:build → zipPack`；`docs:gen` 不在 build 链中（作者操作）。README 只能通过改 docs 后 `docs:gen` 生成，`docs:check` 检测未同步即构建失败。
- **`public/types.d.ts` 副作用**：`export-types` 会改写其头部版本/时间戳；构建后必须 `git checkout -- public/types.d.ts` 还原（本次已多次还原）。当前 `git status` 中它显示 ` M` 仅是 autocrlf 统计伪影，内容与 HEAD 字节一致。
- **提交纪律**：`.gitignore`（`.pi-input.md`）与 `.pi/` 是任务外内容，永不提交；生产提交遵循 Conventional Commits + emoji（见仓库 `git-commit-msg` SKILL）。
- **自动化验证脚本**（可复现）：`nodes/build-docs-gui/verify-content.cjs`、`verify-render-selectors.mjs`、`nodes/retire-legacy-help/verify-i18n.mjs`、`nodes/fix-runtime-feedback/verify-runtime-fixes.mjs`、`nodes/write-core-skill/verify-skill.mjs`（72 项）、`nodes/integrate-skill-release/verify-skill-integration.mjs`（52 项）。

## 主 Agent ↔ worker 协同方式（必须遵守）

本变更的所有具体执行都通过长期复用的 worker subagent 完成。压缩后新 session 必须按此机制继续，否则会破坏已建立的审查闭环。

### 派发参数（每次派发原样使用）

```text
slug:        docs-site-worker
presetAgent: worker
reuse:       true（首次与每次延续都必须；延续只发增量描述，并要求 worker 先重读可能变化的状态）
cwd:         H:/SrcCode/SiYuanDevelopment/sy-query-view（固定）
setModel:    deepseek/deepseek-v4-flash:max
setThinking: max
piArgs:      禁止使用（用户明确要求，避免触发额外用户审查阻塞会话）
视觉边界:    该模型无视觉能力；截图与 SVG/GUI 最终视觉检查由主 Agent 或视觉模型完成
```

### 每个任务的闭环流程

1. **建任务**：主 Agent 在 `nodes/<task-slug>/` 建立 `TASK-NODE.SPEC.md`（目的/输入边界/预期输出/验收条件/状态/结果六要素）+ `code-start.prompt.md`（最小启动提示：预设给定决策正确、不过度调研、遇冲突立即停下报告）。
2. **派发**：按上方参数调用 subagent，任务描述包含“重读节点规格与全局文件后再动手、只写允许路径、不提交、完成后把状态改为等待验收并填写结果”。
3. **执行边界**：worker 只写节点目录和任务规格允许的生产文件；不修改全局 change 文件、`.gitignore`、git 历史；不 commit。
4. **独立审查（必做）**：worker 报告后，主 Agent 派 `code-reviewer` preset（模型 `rrver-codex/gpt-5.6-luna:max`，仅 read/bash 权限）做独立审查，同时主 Agent 亲自抽查关键文件。**绝不只信 worker 报告**。
5. **打回或验收**：有实质缺陷 → 同一 slug 打回修正（已发生多轮：GUI 两轮、退役两轮）；通过 → 主 Agent 验收：节点状态改“已验收”，更新 `graph.md`/`EVOLVE-STORY.md`/`THIS.RULE.md`/交接文件，必要时记 `DECISIONS.md`。提交由主 Agent 执行。
6. **worker 生命周期**：每轮报告会带 context 用量（当前约 75% / 1M）；接近上限前先让 worker 产出交接摘要再退休并另开新 slug；耗尽后不可复用。

### 已踩过的坑（教训，新 session 必须规避）

- **worker 报告可能与实际不符**：曾声称 `check-docs-sync.js` 已做 CRLF 归一化但实际文件仍是原始比较；曾声称“逐字节比对”而实现是普通比较。→ 关键声明必须亲自读文件核实，或以可复现脚本断言为准。
- **按行删除 YAML 键会残留多行值残片**：i18n 退役清理曾把旧文案残片吸入保留键值（YAML 语法吞掉），构建仍能通过。→ 结构化内容必须用解析器（js-yaml）断言键集与值，不能只靠 grep。
- **推测的 API 不可信**：曾按推测使用 Lute `Md2HTML`，实际仓库只有 `Md2BlockDOM`。→ 契约必须对照真实 SDK 类型/仓库先例，并由验证脚本固定证据。
- **验证脚本必须自包含可复现**：曾遗留 `verify-emit/` 编译产物，已改为临时目录 + finally 清理；不得把生成物留在仓库。
- **自动 safe guard 可能返回无效审查结果**：曾因此阻止 commit；主 Agent 不绕过，重试或请用户决定。

## File Reference Map

- `TARGET.SPEC.md` — 目标、行为契约、验收标准（状态：等待用户最终运行时验收）。
- `THIS.RULE.md` — long-task-orchestration 运行规则（权威文件职责、任务图规则、更新纪律、交接顺序）。
- `graph.md` — 任务图；当前无代码执行任务，等待用户最终运行时复测；`references/` 明确延后。
- `EVOLVE-STORY.md` — 面向用户的演进叙事。
- `TERM.md`、`DECISIONS.md` — 开发术语与已记录的小型决定。
- `query-view-docs-portal.MAP.md` — 代码导航索引。
- `nodes/define-doc-structure/DOC-STRUCTURE.md` — 页面地图与内容契约（被 GUI/文档/生成器共同遵守）。
- `nodes/shape-docs-gui/docs-site.LAND.md` — GUI 结构契约。
- `nodes/verify-docs-gui/AUTOMATED-VALIDATION.md` + `RUNTIME-CHECKLIST.md` — 验证证据与人工清单。
- 生产代码：`src/docs-site/*`、`src/user-help/{index,dts-actions}.ts`、`scripts/build-docs.js`、`skills/sy-query-view/SKILL.md`。
