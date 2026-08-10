# 术语 / Terms

## 插件内文档站 / In-Plugin Documentation Site

Query&View 在 SiYuan 独立 Tab 中打开的多页面文档界面。它只显示随插件发布的材料，不是用户知识库中的笔记，也不应写入用户数据。

## 文档内容源 / Documentation Source

某类文档内容唯一需要维护或生成的来源。中英文 README 负责长篇人类说明；案例代码负责可运行案例；类型声明负责精确 API 签名；智能体技能负责 Agent 使用规则。插件内文档站只组织和显示这些材料。

## 核心智能体技能 / Core Agent Skill

第一版的自包含 `SKILL.md`。它给 Agent 提供 Query&View 的工作流程、规则和查证方式，但不要求 Agent 读取额外的技能参考文件，也不依赖插件内文档站是否已经实现。

## 技能参考材料 / Skill References

与 `SKILL.md` 放在一起的补充材料，例如 `references/` 目录。它们是否能被某个 Agent 加载，取决于该 Agent 的技能机制；在未完成验证前，不属于核心智能体技能的必需部分。

## 计划任务 / Planned Task

任务图中有明确交付物和依赖、但尚未开始的工作。计划任务不是执行许可；只有依赖满足且主 Agent 建立任务规格后，才能开始。

## 执行任务 / Execution Task

已建立 `TASK-NODE.SPEC.md`、可以独立实施和验收的工作。执行任务的结果会更新任务图和目标规格。
