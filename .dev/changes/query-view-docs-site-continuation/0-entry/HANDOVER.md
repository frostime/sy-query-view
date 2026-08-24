---
title: sy-query-view 文档站变更（query-view-docs-portal）状态梳理与交接
created: 2026-08-23T22:50:00+08:00
moved: 2026-08-23 — 迁入新 change `query-view-docs-site-continuation/0-entry/`，随附原始对话导出
---

# sy-query-view 文档站变更 — Handover

> 本文件从零梳理「帮助文档丢失排查 → 插件内文档站 + Agent Skill」这一完整任务：它为什么发生、最终决定了什么、代码与验证做到哪一步、还差什么。用于用户本人决策，以及新开启的 Pi 会话直接接手。
> 本文件与原始对话导出（`chat-export@26-08-11T00-24_….xml`）同目录；对话的语义分段导航见文末「Chat Export 导航」一节。

## Assume Reader

读者是**新开启的 Pi Agent 会话**（无此前对话记忆）和**用户本人**。读者可以读取本仓库的 git 历史/工作区、`.dev/changes/`（旧 change `query-view-docs-portal/` 与本 change 的 `0-entry/`）、`docs/` 与 `src/docs-site/`，但不掌握任何会话内口头信息。本文件自包含；文中「QReview」按 [Assumption] 有指 Query&View（sy-query-view）插件处理——对话材料、change 目录与工作目录均唯一指向该仓库，仓库内无其他同名项目。

## Background Context

- **项目**：`sy-query-view`（插件名 Query & View），思源笔记插件。v1.3.0 于 2026-08-07 发布（`tag v1.3.0` == `main` HEAD `1feb724`），该版本适配思源 3.7.0 嵌入块原地编辑。
- **起点问题**（2026-08-10 对话）：用户升级 v1.3.0 后，插件内「帮助文档更新」得到的笔记只剩类型标注，中间的 README 说明消失。
- **根因（已查实）**：不是打包/导出问题（`dist/` 与 `package.zip` 中 README 完整），而是插件运行时逻辑：`src/user-help/sy-doc.ts` 的 `createReadmeText` 在设置 `onlyImportDtsInUserDoc=true`（且是默认值）时只保留 `REFERENCE-START/END` 标记之间的类型定义；`updateDoc` 用 `updateBlock('markdown', ...)` 整篇替换旧帮助笔记。即「帮助内容受版本、设置和更新状态影响」这一机制本身有缺陷。
- **方向转变（用户拍板）**：放弃把帮助做成用户笔记的方案，改为**插件内文档站（In-Plugin Documentation Site）**——独立 Tab、侧边栏多页面、内容随插件版本发布；另写一份面向 Agent 的**核心智能体技能（Core Agent Skill）**。完整权威目标见旧 change 的 [TARGET.SPEC.md](../../query-view-docs-portal/TARGET.SPEC.md)。

## Current Status

**一句话：代码、自动验证、构建与打包全部完成（提交至 `cec58f4`）；唯一遗留前沿是用户在隔离 SiYuan 工作区的最终运行时复测；之后才是发布决策。**

| 维度 | 状态 |
|---|---|
| 目标规格 | 旧 change `TARGET.SPEC.md` 状态「等待用户最终运行时验收」 |
| 代码实现 | 完成：文档站 GUI、人类文档、旧帮助退役、核心 Skill、Skill 接入 |
| 自动验证 | 全部通过（Skill 72 项、Skill 接入 52 项、文档/GUI/i18n/退役各套脚本） |
| 构建 | `npm run build` 成功；`package.zip`（12.3M）+ `dist/` 为 2026-08-11 19:15 产物，对应 `cec58f4` |
| 运行时复测 | **未执行** — 22 项人工清单 [RUNTIME-CHECKLIST.md](../../query-view-docs-portal/nodes/verify-docs-gui/RUNTIME-CHECKLIST.md) 待用户在隔离测试工作区勾选 |
| 发布 | **未进行** — `feat/query-view-docs-site` 领先 `main` 14 个提交，未合并、无新 tag |
| 明确延后 | `references/` 技能参考材料实测、Skill 安装/启用状态、SiYuan Agent/MCP 集成、移动端文档站体验 |

### Git 与工作区精确状态（2026-08-23 实测）

- 当前分支 `feat/query-view-docs-site`，HEAD = `cec58f4`（2026-08-11 19:17）。
- `main` = `1feb724`（2026-08-07 22:21，v1.3.0 发布态）；`feat` 仅领先 14 个提交、无分叉（`feat..main` 为空）。
- staging 区有 3 项**不应提交**的内容（旧 HANDOVER 已明确纪律，属于会话/工具杂项）：
  - `.gitignore` +`.pi-input.md`（用户既有修改）；
  - `.pi/.gitignore` +`session-prune/`（pi 工具目录）；
  - `public/types.d.ts` 头部版本/时间戳被改写为 1.3.0 / 2026-08-17（**`npm run export-types` 的已知副作用**，HEAD 中是 1.2.3；说明 8 月 17 日有人单独跑过 export-types，未影响 `package.zip`）。
- 对话导出 XML 已移入本 change 的 `0-entry/`（见文末地图）。
- 其余历史分支均为旧工作：`dummy-container`（1 个 2025-02 的 `🚧 workon` 未合并）、`perf/update-qv-for-new-siyuan`（1 个 AV 只读 spec 文档未合并）、`fix-state`/`prune-search-results`/`refactor-query-api`/`try-fix-state-sync@decrepate` 已被 main 包含或废弃。**与本次变更无关，勿并入。**

## Trajectory（脉络）

**1. 问题调查（2026-08-10 上午）**
排查确认发布包 README 完整 → 根因是运行时 `onlyImportDtsInUserDoc` 裁剪 + 整篇替换机制（见 Background Context）。同时核验了思源 3.7.0 原生支持 Agent/MCP/Skill（存储目录 `data/storage/ai/agent/skills`）。

**2. 方向转变与需求澄清（2026-08-10，多轮 questionnaire 确认）**
用户提出「不再嵌入用户笔记，改独立文档站 Tab + 面向 Agent 的 Skill」。关键澄清结论（均为用户选定）：
- 内容跟随插件版本发布（离线、与版本一致），不做远程更新；
- 语言只跟随 SiYuan 界面（`zh_CN`/`zh_CHT` → 中文，其他 → 英文），站内不做切换；
- 导航：首页按任务引导，侧边栏按主题/参考组织（10 页）；
- 人类文档唯一手工来源改为 `docs/zh_CN/` 与 `docs/en_US/`（同构页面 ID），中英文 README 由 docs **生成并提交**、构建时检查同步；案例代码唯一来源 `public/example/`；案例/模板只提供复制按钮，不写用户笔记；
- API 页：可读导览 + 打开/下载完整 `types.d.ts`；
- 旧帮助笔记：保留、停止更新、不额外提示；
- 入口收口为单一「帮助文档」菜单；移除独立 Examples、d.ts 快捷菜单、旧设置；
- GUI 用原生 TS/DOM + Lute + SiYuan CSS 变量，不引框架；第一版只验收桌面端（移动端不回归即可）；
- 核心 Skill 自包含，`references/` 先不纳入（实测 Agent 能读文件后再定）；
- 顺序：先人类文档 + GUI 并验收，再写 Skill。

**3. 变更体系与规划（2026-08-10）**
按 long-task-orchestration 建立旧 change `.dev/changes/query-view-docs-portal/`（TARGET.SPEC / THIS.RULE / graph / TERM / EVOLVE-STORY / DECISIONS / MAP / 两代 HANDOVER + `nodes/`）。graph 拆为 9 个可交付任务，全部按序执行并验收。

**4. 自主执行阶段（用户睡觉期间，2026-08-11 凌晨~傍晚）**
按用户授权由长期复用 worker（`docs-site-worker`，模型先 `opencode-go/deepseek-v4-flash:max`，后按用户要求改为 `deepseek/deepseek-v4-flash:max`）逐个完成任务，主 Agent 用 `code-reviewer` 独立审查 + 亲查，验收闭环已写入文档：
- 文档结构与内容契约（10 页页面 ID、`{{example:}}`/`{{skill:}}` 占位符、README 拼装与同步、离线规则）→ [DOC-STRUCTURE.md](../../query-view-docs-portal/nodes/define-doc-structure/DOC-STRUCTURE.md)；
- 人类文档 20 页（中英各 10）+ [docs/TERM.md](../../../../docs/TERM.md) + 76 张图迁至 `docs/assets/` + 生成/检查脚本；
- GUI 结构设计 → [docs-site.LAND.md](../../query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md)；
- GUI 实现（`src/docs-site/`）、旧帮助退役（删 `sy-doc.ts`/`examples.ts`/旧设置/REFERENCE 标记）、自动验证；
- 期间用户并行开启另一对话分支完成大块提交与交接文档（`677d3d2`/`a70ca52`/`8d9b83e`/`4826972`，见 Chat Export 导航 S6）；
- 用户 8 月 11 日醒来做阶段验收 → 反馈第一轮运行时问题并修复（见下）。

**5. 第一轮运行时反馈修复（2026-08-11 下午，已验收）**
用户实测发现并确认修复：站内语言切换按钮无用 → 移除（只跟随思源语言，`zh_CHT` 显示中文）；图片/代码块出现 Lute 原生操作图标 → 按上下文 DOM 级移除；Mermaid 图 → 换本地 SVG（`docs/assets/query-dataview-overview.svg`）；任务复选框保留。

**6. Skill 与最终收尾（2026-08-11 傍晚，已验收）**
- 核心 Skill：英文、自包含 [skills/sy-query-view/SKILL.md](../../../../skills/sy-query-view/SKILL.md)（204 行）；API 名称按「规范名 / 合法别名 / 未支持名」分类，72 项验证通过；
- 接入：文档站双语页经 `{{skill:sy-query-view}}` 从同一份 SKILL.md 一次展开，原始文件随包发布且包内字节一致（52 项验证通过）；`npm run build` 全绿；
- 最终提交 `cec58f4`；工作区按要求只剩不应提交的杂项。

## Chat Export 导航（原始对话分段）

随附的 `chat-export@26-08-11T00-24_….xml` 共 1015 条消息（chunk 0–450）。按语义分为 10 段（chunk 为导出内消息编号，各段起止含端点）。需要核对某主题的原始讨论时按表定位：**用户消息与问卷答复是决策锚点**（chunk 0/36/75/124/130/136/158/162/173/186/190/324/327/329/331/341 与 questionnaire 79–119/139/176–179/339），assistant 消息给出实施要点与审查结论，`compactionSummary`（35/157/323）与 `branchSummary`（322）是里程碑转储。

| 段 | chunk 范围 | 主题 | 要点与关键产物 |
|---|---|---|---|
| S1 | 0–35 | 问题调查 | 根因确认：`onlyImportDtsInUserDoc` 裁剪、非打包问题（34 结论）；compaction 35 |
| S2 | 36–78 | 方向转变 | 36 用户弃旧逻辑/agent-skill 思路；74 核验思源 3.7 原生 Skill；75 用户定新版想法（独立 Tab、去内置文档） |
| S3 | 79–123 | 需求澄清 | 12 轮问卷定稿行为契约（内容随版本、语言跟随、复制不写笔记、Skill 只展示等）；94 用户引入 long-task-orchestration；96–100 初始化旧 change；103 SPEC 须符合 code change spec；119 用户暂停待反馈 |
| S4 | 124–156 | 变更体系重构 | 124 用户反馈（术语/图/MAP/RULE）；129 重构完成；130 用户要求独立分支+确认压缩可续；135/148 两次冷启动审查；156 分支 `docs/query-view-docs-site`、提交 `262188a` |
| S5 | 157–190 | 范围定稿与授权 | 158 用户要求 commit 与 `feat/` 前缀；162 用户汇报 read-file 方案、定序 docs+GUI→Skill、提议 worker（模型 `opencode-go/deepseek-v4-flash:max`）；173 用户定稿（README 拆分+example+拓展、中英文、原生 TS+思源 CSS、worker 自主小细节）；176–179 问卷（docs 为主来源、单一帮助入口、README 生成提交+同步检查、移动端延期）；185 提交 `3429e45`；186–189 睡觉授权、禁自定义 piArgs；190 用户睡觉 |
| S6 | 191–322 | 自主执行 | 201–212 任务1 结构与内容规则→验收（`2c5cbfa`/`54ad179`）；213–240 任务2 人类文档（首审 4 问题、CRLF 同步修复）→验收（`ff7c177`）；240–269 任务3 GUI 结构 LAND（两轮审查+Lute `Md2BlockDOM` 校正）→验收（`f7f55ac`）；270–300 任务4 GUI 实现（两轮打回→通过；300 safe guard 无效暂缓提交）；301–309 任务5 旧帮助退役（YAML 残片问题→修复）；312–321 任务6 自动验证通过、任务7 Skill 建立；322 branchSummary：用户并行分支会话已提交 `677d3d2`（文档站+退役）、`a70ca52`（Skill 草稿）、`8d9b83e`（HANDOVER-Round2）、`4826972`（主↔worker 协同机制），并指出 Skill 含 legacy 分类错误待修 |
| S7 | 323–341 | 醒来阶段验收 | 323 compaction；324 用户问状态；326 汇报；327 用户问可否验收；329 用户反馈 GUI 毛病（站内语言切换、zh_CHT 回退英文、图片/代码块原生图标截图 A/B）；331 用户要求 worker 换 `deepseek/deepseek-v4-flash:max` 且无视觉；338 根因分析（i18n 启动时固定、缺 zh_CHT 翻译、Lute 控件）；339 问卷：语言只跟随思源 |
| S8 | 342–391 | 反馈修复 | 342–360 建修复节点（DOM 删除而非 CSS、SVG 须主 Agent 视觉复核）；361–370 worker 实现与自动审查重试；366 SVG 连接关系打回；374–382 任务复选框回归→收窄删除范围、C3 验收口径修正→最终验收；391 提交 `f0f519c` |
| S9 | 392–414 | Skill 修正验收 | 396 按实现证据归类（`Dataview`/`utils`/`prune` 为合法别名）；402 receiver 分区校验、`fb2p` 误命中修复；406 类型细节（async 分类、`keywordDoc` 返回类型）；414 最终独立审查通过，72 项验证全过 |
| S10 | 415–450 | 接入与收尾 | 417 接入方案（单一占位符 `{{skill:sy-query-view}}`）；421 提交 `13df6af`；427 一次展开替换契约（split/join→match 位置重建）；432–433 reviewer 明确 ACCEPT（52 项）；435–440 清理交接陈旧状态、MAP 同步；447 最终完整构建成功、types.d.ts 恢复；450 总结提交 `cec58f4`，等待用户按 RUNTIME-CHECKLIST 复测 |

## Key Information for the Successor

### 已定架构与规则（勿再推翻）

- **内容唯一来源**：人类文档 `docs/{zh_CN,en_US}/`（各 10 页，同构）；案例 `public/example/`（`basic-template.js` 是模板唯一权威，`qv-basic` 斜杠菜单运行时读取同一份）；类型签名 `public/types.d.ts`（生成物）；Skill `skills/sy-query-view/SKILL.md`。插件内文档站只组织展示，不写用户笔记。
- **README 是生成物**：由 `scripts/build-docs.js` 从 docs 生成（`npm run docs:gen`，作者操作），已提交且构建时 `scripts/check-docs-sync.js` 检查同步；**禁止手工编辑 README 正文**。
- **构建链**：`npm run build` = `export-types → docs:check → vite:build → zipPack`。
- **`public/types.d.ts` 副作用**：`export-types` 会改写其头部版本/时间戳；构建/开发后若出现差异，用 `git checkout -- public/types.d.ts` 还原（当前 staged 的 1.3.0 头就是该副作用）。
- **提交纪律**：`.gitignore`（`.pi-input.md`）与 `.pi/` 永不提交；生产提交遵循 Conventional Commits + emoji（仓库 `git-commit-msg` SKILL）。
- **禁止操作用户数据**：无用户明确同意不得连接真实 SiYuan 工作区/调用笔记 API；复测必须在隔离测试工作区。
- **移动端整治**：本变更不实现移动端文档站布局，但不得破坏移动端已有 Query View 块渲染。

### 剩余工作

1. **用户执行运行时复测**：在隔离测试工作区按 [RUNTIME-CHECKLIST.md](../../query-view-docs-portal/nodes/verify-docs-gui/RUNTIME-CHECKLIST.md)（22 项，A~H）逐项勾选回填；重点：帮助入口只开 Tab 不建笔记（A1）、语言跟随与 `zh_CHT`（B1/B1a）、代码块/图片控件与任务复选框（C3）、Skill 页面（C 组 + 离线原始 Skill）、复制与 qv-basic（D/F）。
2. **延后项保持延后**：`references/` 实测、Skill 安装/启用/Agent/MCP 集成、移动端文档站体验。


### 遗留可查疑点（不阻塞，供决策参考）

- `dummy-container` 分支有 1 个 2025-02 的未合并 `🚧 workon`（`src/dummy-container/index.ts`，69 行）；`perf/update-qv-for-new-siyuan` 有 1 个 AV 只读 spec 文档（2026-07-04）。均与本次变更无关。
- `.dev/notes/siyuan-3.7.0-embed-editing-qv.md`：v1.3.0 适配的开发分析笔记，`state: pending`，与文档站变更无依赖。
- 8 月 17 日 `public/types.d.ts` 被重新生成过一次（staged），但 `package.zip` 仍是 8 月 11 日产物——无代码活动痕迹，推测是用户侧跑过 export-types；不影响结论。

## 用户待决策点

1. **分支去留**：`feat/query-view-docs-site` 上 14 个提交是完整、已验收的实现（含全部历史与验证脚本）。「放弃分支重新开始」= 丢弃这些工作；「重新开始」若指放弃旧对话/旧组织方式而保留代码，则直接在该分支继续复测即可。
2. **复测与发布节奏**：先复测再谈发布；发布流程（CHANGELOG、tag、合并）未定。
3. **旧 change 目录的存废**：`.dev/changes/query-view-docs-portal/` 仍是最完整的目标与决策存档；新会话可读它恢复上下文，也可仅凭本文件行动。若决定彻底重来，建议保留该目录只读作参考，不删除。

## File Reference Map

**本 change（新起点）**

| 用途 | 路径 |
|---|---|
| 本交接文档 | `0-entry/HANDOVER.md`（本文件） |
| 原始对话导出（含 chunk 导航，见上表） | `0-entry/chat-export@26-08-11T00-24_思源笔记插件帮助文档更新后 Readme 丢失问题排查.xml` |

**旧 change（权威存档，只读参考）**

| 用途 | 路径 |
|---|---|
| 权威目标/行为契约/验收标准 | `../../query-view-docs-portal/TARGET.SPEC.md` |
| 运行规则/交接顺序（旧体系） | `../../query-view-docs-portal/THIS.RULE.md` |
| 旧交接（最新一代，压缩后入口） | `../../query-view-docs-portal/HANDOVER-Round2.md` |
| 任务图与节点状态 | `../../query-view-docs-portal/graph.md` |
| 代码导航索引 | `../../query-view-docs-portal/query-view-docs-portal.MAP.md` |
| 小型实现决定 | `../../query-view-docs-portal/DECISIONS.md` |
| 页面地图与内容契约 | `../../query-view-docs-portal/nodes/define-doc-structure/DOC-STRUCTURE.md` |
| GUI 结构契约 | `../../query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md` |
| 人工复测清单（22 项） | `../../query-view-docs-portal/nodes/verify-docs-gui/RUNTIME-CHECKLIST.md` |

**生产代码与内容（仓库根相对）**

| 用途 | 路径 |
|---|---|
| 人类文档源（中/英，各 10 页） | `docs/zh_CN/`、`docs/en_US/`、`docs/TERM.md` |
| 文档站实现 | `src/docs-site/{index,nav,content,render}.ts`、`index.module.scss` |
| 帮助入口/模板斜杠菜单 | `src/user-help/index.ts`、`src/user-help/dts-actions.ts` |
| 案例与模板唯一来源 | `public/example/` |
| Agent Skill（英文自包含） | `skills/sy-query-view/SKILL.md` |
| README 生成/同步检查 | `scripts/build-docs.js`、`scripts/check-docs-sync.js` |
| 类型声明生成（有工作区副作用） | `scripts/export-types.js` |
| 发布产物 | `dist/`、`package.zip`（2026-08-11，对应 `cec58f4`） |

## 注意

工作依赖的 Long term graph 工作流，还有 subagent 工作流，在此期间均发生了重大更新，故不能机械沿用旧工作的模式
