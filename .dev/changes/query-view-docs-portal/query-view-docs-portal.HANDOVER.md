---
title: Query&View 文档站变更交接
created: 2026-08-11T02:07:23+08:00
---

## Assume Reader

接收者是上下文已压缩或新开启的 Pi Agent。它可以读取本仓库和 `.dev/changes/query-view-docs-portal/`，但不能依赖此前对话。

## Background Context

本变更用插件内文档站替代由插件创建和更新的帮助笔记。用户目标和行为契约的权威来源是 `TARGET.SPEC.md`；任务拆分和依赖以 `graph.md` 为准。

## Current Status

分支为 `docs/query-view-docs-site`。当前仅创建了变更记录，没有开始任何生产代码任务。等待用户确认进入方案阶段；生产代码仍须等方案结果确认。

## Key Information for the Successor

- 文档站是用户在 SiYuan Tab 中浏览的多页面帮助界面；不要称其为“门户”。
- README 是人类长篇说明的唯一维护来源；案例、类型声明和智能体技能各自保持权威来源。
- 旧帮助笔记保留但不再更新；文档站不会写入用户笔记。
- 首页按任务引导，侧边栏包含入门、案例、Query / DataView、API 参考和智能体技能。
- 模板与案例只复制代码，不直接写入笔记。
- 实施顺序是先完成并验收人类文档和文档站 GUI，再编写核心智能体技能；不要并行启动 Skill。
- 核心 Skill 必须自包含。用户提出可在 `SKILL.md` 中指示 Agent 用文件工具读取 `references/`；此方案需要对目标 Agent 的实际安装路径和文件读取边界做实测。
- SiYuan v3.7.0 已验证会安装完整技能目录，但 `skill.load` 只返回 `SKILL.md`。继续研究前参见官方源码：[skill.go](https://github.com/siyuan-note/siyuan/blob/v3.7.0/kernel/mcp/tools/skill.go) 与 [util/skill.go](https://github.com/siyuan-note/siyuan/blob/v3.7.0/kernel/util/skill.go)。
- Skill 安装/调用和 SiYuan Agent/MCP 完整集成均为延后任务。

## File Reference Map

- `TARGET.SPEC.md` — 目标、范围、行为和验收标准。
- `graph.md` — 计划任务和依赖；下一个可启动工作是“定义文档结构与内容来源规则”。
- `THIS.RULE.md` — long-task-orchestration 的本 change 运行规则。
- `TERM.md` — 中英文术语。
- `query-view-docs-portal.MAP.md` — 现有代码与资料入口。

## Worktree Note

`.gitignore` 有一处在本变更开始前就存在的未提交修改；不要把它混入本 change 的提交。

具体执行可使用长期复用的 worker，优先运行时为 `opencode-go/deepseek-v4-flash:max`。主 Agent 负责需求、任务规格、审查与验收。
