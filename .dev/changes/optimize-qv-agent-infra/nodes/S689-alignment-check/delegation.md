---
title: S689 委托 — N4 对齐验证（基础设施检查）
created: 2026-08-24
from: S074（supervisor，pi mail 联系）
to: S689（执行代理）
status: delegated
---

# Delegation: N4 对齐验证（基础设施检查）

## 1. 节点责任与意义

你是 Query&View（sy-query-view）仓库中「第 1 层对齐验证」的执行代理。本仓库已建立一套**从源码自动生成 Agent 参考文档**的管线，并完成了一批源码诚实化修补（N6）。你的责任是：

1. **建立对齐检查机制**（可长期复用）：生成物一致性检查 + 行为断言脚本
2. **建立第 2 层长期规范**：`AGENTS.md`（仓库根）+ `.agents/skills/` 下的维护 SKILL
3. **亲自阅读源码/注释/声明，对照函数实现，梳理整个机制**，产出结项复核对象清单（I-40 定稿）与对齐性问题报告

你拥有本任务内的自主判断权（技术细节自行决定）；涉及 **API 行为/用户可见边界/产品语义** 的问题**不得自行修改**，只报告。

## 2. 已接受输入与假设（不要重新调研、不要重新决策）

以下结论均已由用户（target authority）拍板或经 supervisor 验收，**直接采信**：

- **语义对齐三来源**：签名取 tsc 声明（`types/core/*.d.ts`）、注释是唯一人写通道（生成器纯搬运）、动态别名来自 `register()/addAlias()` 调用点。生成器不编造知识。
- **参考文档是生成产物**：`docs/en_US/agent-ref/*.md` 由 `pnpm gen-ref` 生成，任何人不得手改；改内容必须改源码注释。
- **类型定义定位规则（I-83）**：QV 脚本运行时是纯浏览器/Electron JS 环境；类型定义仅用于 agent 参考与开发便利；只要不造成使用者（agent）认知误导或负担，不过分纠结类型精确度。
- **N1-N6 已完成**（详见 graph.yaml accepted_state）：生成器落地（`scripts/gen-agent-ref.mjs`，四模块：query-api/dataview/wrapped/types.md）；坑清单 23 条全部处置（wrapList 标注、pick 双 overload、map 保 wrapper、columns flex、echartsTree layout、graph 非 inplace、IDataView 删除、keywordDoc 文档级聚合重写等）；`BREAKCHANGE-v2.0.md` 已建。
- **keywordDoc 审查已处置**：SQL `GROUP BY root_id + HAVING` 文档级判定、limit 语义（块数→文档数）、旧 `join` 兼容映射+warn、空输入返回 []、签名联合保留旧形态。**不必重审**。
- **SKILL 位置**：第 2 层 SKILL 放仓库内 `.agents/skills/`（与项目绑定）；`AGENTS.md` 放仓库根。
- **环境陷阱**：`NODE_ENV=development vite build` 会被 livereload 挂起（验证 dev 产物用 `vite build --watch` + timeout 或直接看产物）；tsconfig `strict:false` 下判别联合窄化失效（用 `in` 操作符）；`public/types.d.ts` 是构建产物（提交时单独 chore commit）。
- 仓库基线：分支 `feat/query-view-docs-site`，head `1ade513`，工作区干净。

## 3. 允许写入 / 非目标 / 风险限制

**允许写入**：
- `scripts/gen-agent-ref.mjs` —— 仅新增 `--check` 模式（dry-run 比对产物，不一致退出码非 0），不得改动现有生成逻辑
- `scripts/check-agent-alignment.mjs` —— 新建行为断言脚本
- `package.json` —— 仅新增 script 条目（如 `gen-ref:check`）
- `AGENTS.md`（仓库根，新建）
- `.agents/skills/`（新建目录 + SKILL 文件）
- `.dev/changes/optimize-qv-agent-infra/nodes/S689-alignment-check/` —— 你的过程材料、报告
- git commit：允许，遵守仓库提交规范（Conventional Commits + emoji；`public/types.d.ts` 有变化时单独 chore commit）

**非目标（不得触碰）**：
- `src/core/*`、`src/types/*` 的实现/签名/行为改动（API 行为归用户决策）
- **例外：纯注释/文档措辞与行为不一致（如 JSDoc 描述与实现不符）→ 允许直接修正注释文本**（不改实现/签名/行为）；行为语义问题（实现与函数名/文档/预期不符）仍只报告
- `docs/en_US/agent-ref/*.md` 的手工修改（只能通过生成器重新生成；如需改内容，向 supervisor 提议改源码注释）
- 不引入新 npm 依赖。若确需（如 jsdom），先在 mail 中向 supervisor 提议并说明理由，获批后才可添加
- 不做 API 设计、不做行为变更决策、不重开已决问题

**风险限制**：你的断言脚本不得依赖运行中的思源实例（无环境）；只验证 node 环境可跑的纯逻辑。

## 4. 预期结果 / 验收标准 / 证据

交付 7 项：

1. **A1**：`scripts/gen-agent-ref.mjs --check` 模式 + `package.json` script。验收：在干净产物上跑退出码 0；人为改一个产物字后跑退出码非 0 且提示差异文件。
2. **A2**：`scripts/check-agent-alignment.mjs`。验收：node 直跑全绿；断言至少覆盖 proxy 的 `wrapList` 行为——`pick('id')` 返回标量数组、`pick('id','content')` 返回对象数组、`filter/slice/map` 保留 wrapper、`groupby`/`unwrap` 可用、`map` 后链式可用。
3. **AGENTS.md**：含类型定位规则（I-83）、生成产物纪律（改注释+`pnpm gen-ref`+`--check`）、语义对齐三来源、提交规范、兼容性优先与 BREAKCHANGE 引用、环境陷阱。中文为主。
4. **`.agents/skills/` SKILL**：一个面向"QV 参考体系维护/对齐检查"的技能（名称自定），内容基于你梳理的真实流程（何时跑什么命令、改注释的约定、断言范围、上报规则），不是空泛清单。
5. **结项复核对象清单（I-40 定稿）**：分类列出——node 可自动断言（进 A2）/ 需要思源运行时（归运行时复测 I-50）/ 需要人工判断；每条注明文件与行号。
6. **对齐性问题报告**：你亲自对照源码/声明/文档时发现的任何不一致点（行为 vs 声明 vs 文档），含证据；**这是你的核心增值产出，宁多勿漏**。
7. **过程梳理**：你在 `nodes/S689-alignment-check/` 下留下可追溯的梳理材料（可选文件），最终以 mail 汇报要点。

**证据**：mail 回报中给出——各项命令与退出码、产物路径、commit hash（你提交的）、问题清单（含行号）。

## 5. 停止条件（遇到立即停止并 mail 上报，不要自行决定）

- 发现 **API 行为缺陷**（如某函数运行时行为与声明不符，且不是已知处置项）→ 报告，等 supervisor/用户决定
- brief 中的假设与仓库现状矛盾（如生成器文件位置不对、产物结构不同）→ 报告，不自行重构
- 需要触碰非目标范围才能完成某子项 → 报告
- 工作会影响到其他节点、目标或产生不可逆动作 → 报告

## 6. 回报内容（mail 到 S074）

结论先行，按重要性降序：
1. 接受/拒绝结论与总体状态
2. 7 项交付物的完成情况与路径、关键命令与退出码
3. 对齐性问题清单（行号+证据+你的建议放置处：修源码/改注释/只是记录）
4. 偏离与例外（如有）
5. 对路线/目标/下一节点的建议（如有）

## 7. 冷启动说明

- 本 brief 提供的决策与上下文**是正确的**，不要重新调研或重新决策（N1-N6 结论、审查结论、规则均视为给定）
- 聚焦执行，不扩大范围、不质疑任务分配
- 允许向 supervisor（S074）mail 提问：任何不清楚的、缺上下文的、需要授权的点；技术琐碎问题自行解决
- 你的过程日志/实验/临时文件放 `nodes/S689-alignment-check/`，不要污染仓库其他位置

## 8. 通信

- mail 到 **S074**（supervisor，0fbd6a571d12）；提问、中间状态、最终回报都用 mail
- 收到 brief 后先读 `NAVIGATION.MAP.md`（同目录）与 `graph.yaml`、`TERM.md`、`BREAKCHANGE-v2.0.md` 定位背景