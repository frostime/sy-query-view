---
title: optimize-qv-agent-infra — Supervisor Handover（S074 → 继任 supervisor）
created: 2026-08-25T09:10:00+08:00
from: Session S074 — 用户决定更换 supervisor agent
status: consumed
consumed_at: 2026-08-25（继任 supervisor 已接手，见 graph.yaml supervisor 字段）
---

# Supervisor Handover

> 本文件是继任 supervisor 的**定向文件**：说明目标与路线、进行中的工作、待决判断。
> 权威控制状态在 `../graph.yaml`（accepted_state / current_route / risks / pending_decisions）；
> 证据与记录指向各材料文件，不在此复制。

## 1. 目标与路线（大背景）

**为什么做这个任务**：Query&View 插件 v1.3 已有一套面向 AI Agent 的 SKILL + 手工编写的参考文档（`query-api.md`/`dataview.md`），但用户发现这套"SKILL 参考文档框架"不好用——手工文档与源码运行时存在多处不一致（上一 session 的 Worker-B 校验证实）。更早的 `public/types.d.ts`（1247 行合并类型文件）是"无 Agent 时代"的产物，当时为方便人类用户查看而合并成单文件。

用户正把 QV 升级到 **2.0，插件将更面向 Agent**（更多设计服务于让 Agent 正确使用），因此发起本探索：为 Agent 的 API 参考找到一套**能自洽、不漂移**的机制。用户的直觉是"代码注释本身就是最好的参考文档"——即从源码自动生成，而非手写平行文档。

**本任务（第 1 层）**：达成「语义对齐」——运行时行为 / 类型声明 / 文档说明三者一致，并建立可持续的检查机制。实现路径（用户拍板）：从 tsc 声明提取签名 + 从源码 JSDoc 提取说明 + 从 `register()`/`addAlias()` 调用点展开动态别名，生成四份参考文档；同时修补源码中声明与行为不符的"坑"（兼容性优先）。

**范围内/外**：2.0 全新 API 骨架设计**不在本任务**（独立 backlog，I-03）；本任务只填坑不造新 API。第 2 层（长期协作规范 AGENTS.md/SKILL）初版已随本任务落地，内容随实践迭代。

## 2. 进行中的工作

- **用户审查阶段**：工作区有未提交的修复批次（见 §4），用户明确"不提交，我要审查"。**继任者首要动作：配合审查，用户放行前不提交**。
- 无进行中的委托节点（S689 的 N4 委托已交付完毕）。

## 3. 等待的回报 / 待决判断

| 事项 | 状态 | 归属 |
|---|---|---|
| 用户审查工作区批次（放行提交 or 修改；可选回退 S689 的 4 笔） | 进行中 | 用户 |
| 运行时复测（I-50：keywordDoc 新 SQL、DataView 注册、render 副作用在思源真机） | 用户此前延后，"后面再说" | 用户定时机 |
| C-3：deprecated 参数处置（`optionDeprecatedAsValMatch` 等保留/清理） | 用户单独决策 | 用户 |
| N5：SKILL 引用修正（I-73 minAppVersion 表述）+ 发布集成 | 未开始（前置已满足） | 继任者提议，用户拍板 |
| 生成器边界 O-07~11（见 alignment-report） | 记录在案 | 继任者评估 |

## 4. 近期决策与理由（勿重开）

- **类型定位规则**（已写入 AGENTS.md §3）：QV 脚本运行于纯浏览器/Electron JS 环境，类型定义只服务于 Agent 参考与开发提示；不造成误导就不用追求理论精确度。理由：类型检查对最终脚本用户无运行时意义（用户定义）。
- **BREAKCHANGE-v2.0.md 定位**（仓库根）：只记录**对写脚本的人**有行为变化的内容；fix error（修复从未生效的行为）不算 breaking。理由：breaking change 是对使用者的契约（用户定义）。
- **API 行为/用户边界决策归用户**：发现行为问题时保留证据并报告，不自行改实现/签名/行为。纯注释措辞与实现不符可修正。
- **委托默认只交付不提交**：本次委托曾在授权内让代理 commit，用户不满（流程教训，已入 graph accepted_state）。
- **AGENTS.md 写作原则**（用户两次批评后定型）：按 Scope 分节（面向谁→规范→检查/遵循），不把单一要求写成全局宪法；只引用持久符号（不引用 issue 编号、任务目录路径、开发态位置）。
- **keywordDoc 行为**（用户拍板）：`join`→`relation`（`any`/`all`，默认 `all`）；SQL 文档级聚合（`GROUP BY root_id + HAVING`，修复 limit 截断漏查，limit 语义从块数→文档数）；旧 `join` 与字符串形态兼容映射并 warn。**不要重新设计**（已入 AGENTS.md）。
- **sorton 默认方向**（用户拍板）：以实现为准 `desc`，注释已同步。
- **SKILL 位置**：`.agents/skills/`（与项目绑定；位置可能随维护调整，AGENTS.md 已注明）。

## 5. 当前有效性担忧

- **AGENTS.md 两版**：HEAD 是 S689 提交的 51 行版；工作区是重写后的分 Scope 版（58 行）。**提交时以工作区版为准**（若用户审查另有结论则从其决定）。
- **S689 的提交**（`29adb19`/`139302a`/`df39ed4`/`601dc61`）：内容有效（A1/A2 检查管线、SKILL、清单、报告），但提交行为本身未被用户预先授权；用户知情，可选 `git reset --soft 76a3f2c` 回退重排。
- **运行时行为验证缺口**：keywordDoc 文档级聚合 SQL、A2 断言之外的 DOM/Kernel 路径**未经真机验证**（用户延后）。
- **环境噪音**：`npx tsc --noEmit` 报 TS5107（tsconfig `moduleResolution=node10` 弃用提示）；不影响 export-types 管线；曾考虑 `ignoreDeprecations`，未落地。

## 6. 重大风险

- 用户尚未验收的批次如果被误提交/误丢弃，需从 `git diff` 恢复——保持工作区原样直到审查结论。
- 生成器（`scripts/gen-agent-ref.mjs`）的 `KNOWN_NOTES` 是人工维护的注入口：修复代码后忘记同步删除过时条目，会反向误导（S689 曾抓到，已清理并写入维护规则）。
- n1 遗留（I-12/13/14：Query 匿名类型、UseStateMixin 导出 hack、export-types 字符串替换）未决，涉及 `public/types.d.ts` 生成管线的脆弱性，改它们需谨慎（与 export-types.js 拼接流程耦合）。

## 7. 下一步判断（继任者接手后）

1. 读 `../graph.yaml` 确认控制状态 → 在 graph.yaml 记录自己为 supervisor、标记本 handover consumed
2. 配合用户完成工作区批次审查与提交（或按用户指示回退/重排）
3. 视用户意愿推进：运行时复测时机、C-3 决策、N5（SKILL 引用修正 I-73 是最小可做项）
4. 评估生成器边界 O-07~11（低优先）

## 8. 关键文件地图

| 文件 | 用途 |
|---|---|
| `../graph.yaml` | 控制状态（accepted_state 含全部决策与教训；nodes 状态） |
| `../issues.yaml` | 候选池 21 条（gen-issues.py 生成，勿手改） |
| `../../../../AGENTS.md`（仓库根） | 第 2 层规范（分 Scope；工作区版为准） |
| `../../../../BREAKCHANGE-v2.0.md`（仓库根） | SDK 变更记录（发布用；对脚本作者可见变化才记） |
| `../../../../scripts/gen-agent-ref.mjs` | 参考文档生成器（三来源；KNOWN_NOTES；--check） |
| `../../../../scripts/check-agent-alignment.mjs` | A2 行为断言（node 直跑） |
| `../nodes/S689-alignment-check/alignment-report.md` | 对齐问题清单与处置记录（R-01~13 已处置、O-01~11 边界；**审查入口**） |
| `../nodes/S689-alignment-check/I-40-final-review-checklist.md` | 复核边界清单（自动断言 / 运行时复测 / 人工判断） |
| `../nodes/S689-alignment-check/`（其余：delegation/process-notes/NAVIGATION） | 委托过程材料，仅供追溯，**无需阅读** |
| `../../../../.agents/skills/qv-reference-alignment/SKILL.md` | 维护 SKILL（第 2 层） |
| `../../../../docs/en_US/agent-ref/*.md` | 生成产物（禁手改） |
| `../entry-handoff/` | 更早 session 入口材料（Worker-B 校验等） |
| `../TERM.md` | 术语册（语义对齐/生成器/注册调用点等） |

## 9. 基线

仓库分支 `feat/query-view-docs-site`，HEAD `601dc61`；工作区含未提交修复批次（src/core 三文件、scripts/gen-agent-ref.mjs、public/types.d.ts、AGENTS.md 新版、BREAKCHANGE 移位、control/ 本文件与委托包、graph/issues 更新）。验证命令：`pnpm gen-ref` / `pnpm gen-ref:check` / `node scripts/check-agent-alignment.mjs`（均须退出 0）。