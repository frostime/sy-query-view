# 本变更的运行规则

## 推进方法

本变更采用 **long-task-orchestration** 方法推进。目标规格、演进说明、术语、任务图和任务规格共同构成跨会话的权威状态；任务图会随证据和用户反馈演进，不是一次性固定计划。

## 权威文件与职责

- `TARGET.SPEC.md`：用户目标、范围、行为契约、已确定决策和验收标准。
- `EVOLVE-STORY.md`：面向用户说明方向如何演进及当前所处阶段。
- `TERM.md`：本变更反复使用的中英文术语。
- `graph.md`：以可交付工作为单位的计划任务、依赖和当前前沿。
- `query-view-docs-portal.MAP.md`：任务相关代码和资料的导航索引，不记录决策或进度。
- `query-view-docs-portal.HANDOVER.md`：压缩上下文或新会话时的最小继续说明。
- `DECISIONS.md`：执行过程中不改变原则、范围或用户行为的小型实现决定。
- `nodes/<task-slug>/TASK-NODE.SPEC.md`：仅为已经进入实施的执行任务创建。

## 任务图规则

- 图中每项必须是有独立交付物的工作，例如整理文档、开发页面或研究集成方案；不得使用仅表示思考阶段的缩写节点。
- 每项计划任务都要写清交付物、依赖和状态。
- 本变更先完成并验收人类文档和文档站 GUI，再编写核心智能体技能；技能参考材料必须在实际文件读取能力验证后再加入。
- 依赖满足、任务边界明确且确认仍需执行时，主 Agent 才能建立对应的 `TASK-NODE.SPEC.md` 并转为执行任务。
- 执行结果由主 Agent 验收后，更新 `graph.md`、`TARGET.SPEC.md`，必要时更新 `EVOLVE-STORY.md`。

## 当前阶段

“定义文档结构与内容来源规则”“整理人类文档”“定义文档站 GUI 代码结构”“开发文档站 GUI”“停用旧帮助笔记机制”和自动验证均已验收。“编写核心智能体技能”是当前执行任务；真实 SiYuan Tab 运行时体验留给最终验证，禁止在未获用户明确同意时操作用户数据库。

Skill 的安装、调用、启用状态展示及 SiYuan Agent/MCP 完整集成是延后工作。`references/` 是否纳入本次 Skill 取决于文件读取实测；不得只凭安装目录结构假定 Agent 可访问。

具体执行可委托给长期复用的 worker，优先运行时为 `opencode-go/deepseek-v4-flash:max`。主 Agent 负责与用户确认需求、建立任务规格、限定 worker 写入范围、审查结果及验收；worker 不修改本目录中的全局目标、术语或任务图。

worker 和主 Agent 可自主决定不会改变用户行为、内容来源、任务范围或关键架构的局部细节，并将决定与理由简记到 `DECISIONS.md`。遇到上述原则性变化、安全风险、不可逆操作或多个高成本方向难以取舍时，必须暂停并询问用户。

## 更新纪律

1. 用户确认、修正或撤回会影响目标的内容时，先更新 `TARGET.SPEC.md`，再更新 `graph.md`。
2. 每次任务依赖、状态或交付物发生变化时，更新 `graph.md`。
3. 只把反复使用且会影响判断的中英文术语放入 `TERM.md`。
4. 只在重要方向变化或阶段收敛时更新 `EVOLVE-STORY.md`。
5. 执行者只写入任务规格允许的生产文件和自己的任务目录；主 Agent 负责修改全局目标、术语和任务图。
6. 小型实现决定追加到 `DECISIONS.md`；不要把普通编码过程写成流水账。

## 交接

新会话或执行者按以下顺序恢复状态：`TARGET.SPEC.md` → `THIS.RULE.md` → `graph.md` → `TERM.md` → `query-view-docs-portal.MAP.md` → `query-view-docs-portal.HANDOVER.md` → `DECISIONS.md` → 对应 `TASK-NODE.SPEC.md`（如存在）。
