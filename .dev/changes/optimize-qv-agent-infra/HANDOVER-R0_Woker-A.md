---
title: Optimize Query&View Agent Infrastructure — Handover
created: 2026-08-24T22:40:11+08:00
from: Session "26-08-24T15:01_插件文档关系梳理与新旧对比"
---

# Handover: optimize-qv-agent-infra

## Assume Reader

接手 `.dev/changes/optimize-qv-agent-infra` 任务的 Pi Coding Agent。可恢复上下文：仓库 git 历史（`feat/query-view-docs-site` 分支）、`docs/`、`skills/`、`src/` 全部文件。本会话讨论细节不可见，以下仅记录无法从仓库直接恢复的决策与待办。

## Background Context

目标：让 AI Agent 能有效使用 Query&View（sy-query-view）插件编写 `//!js` 嵌入块。原有 SKILL（旧 204 行占位符，已整体重写）自包含但过时（async-wrapper 写法、不引用外部文档）；docs 教程（1032 行 dataview.md 等）是面向人类的教程，Agent 全读浪费 token；`api/reference.md` 过薄、`types.d.ts`（1247 行）过密；思源 SKILL 导入工具只能导 SKILL.md 单文件；开发工作区用符号链接挂载插件，`file.read` 读不到插件目录。

关键外部事实（用户实测）：思源 Agent 工具 `file.read`/`file.list` 可读工作空间路径；SKILL 导入工具只能导入 SKILL.md（资源文件进不去）。

## Current Status

主体已全部完成并提交（`feat/query-view-docs-site`，工作区干净）：

```
ae7c437 🚧 wip                                ← 反馈迭代（details/cards 细节、§6 明确化）
a23d7e2 📝 chore: refresh generated types.d.ts timestamp
f7c6948 ✨ feat(skill): force skill re-sync in dev mode
34afd5d ✨ feat(skill): self-contained Query&View agent skill (checkpoint)
273230f 📝 chore: refresh generated types.d.ts timestamp
4407271 Merge branch 'wip/revise-readme' ...    ← README 手写化 + 顶层 await 迁移
```

另注意：`.dev/changes/` 下旧任务目录（query-view-docs-portal、query-view-docs-site-continuation）的已经归档。

## Trajectory

**1. README 手写化与示例迁移（前序，已完成）**：退役 docs 生成子系统（build-docs.js / check-docs-sync.js），README 改为手写薄门面（中英镜像，用户主导中文），example 代码与 docs 内嵌代码全部迁移到顶层 await 写法（思源 3.8.0+）。通过 worktree（wip/revise-readme）并行完成，已合并，worktree 已清理。

**2. SKILL 设计讨论（本任务起点）**：用户明确旧 SKILL"连草稿标准都算不上"，从零设计。结论：SKILL 顶层只放"不读就会写错"的核心须知（执行模型/模板/组件分层/安全边界），API 真相放参考文档按需读（progressive disclosure）。组件分三档：封装可正常用（含 echarts 全系列，用户确认"已封装好"）、高级动态（addElement/columns/removeView/replaceView/自定义组件——提及+按需读教程）、**useState 默认不写**（实验性、多设备同步冲突风险，除非用户自信且明确要求）。

**3. 参考文档写作**：`docs/en_US/agent-ref/query-api.md`（Query 签名表）+ `dataview.md`（DataView 组件表）。写作前完整阅读教程三篇（query.md 643 行/dataview.md 1032 行/dataview-advanced.md 251 行）+ 源码（query.ts 别名注册、data-view.ts register 机制、components.ts 渲染实现、proxy.ts）。用户批评过第一版"太简略"（Agent 看了不会写 addchart），重写后每节格式为「**API Signature** — 功能」+ 只写影响使用正确性的要点 + 最小示例。教训：曾自编"neaby"伪 API（d.ts 里只有 nearby），已删——**文档里出现的 API 名必须能在 d.ts/源码中核实**。

**4. 自包含打包（关键转折）**：用户实测 dev 符号链接工作区读不到插件目录 → 决策：构建时把 agent-ref 复制进技能包 `skills/sy-query-view/references/`（SDK 整目录同步到 `/data/storage/ai/agent/skills/`），SKILL 完全自包含。曾试 viteStaticCopy target（structured 模式产生嵌套 `references/docs/en_US/agent-ref/` 路径，弃用），最终用自写 rollup 插件 `copySkillReferences`（vite.config.ts，dev/prod 双分支，writeBundle 后精确 copy 两个 md）——已验证产物平铺正确、与源 filecmp 一致。

**5. dev 模式强制同步**：SDK 同步判据原来只看 plugin.version（版本不变就 `action: "current"` 跳过），开发期 SKILL 改动永不推送。改为读取 vite define 注入的 `process.env.DEV_MODE`（编译期字面量替换）：dev 构建下 version 判据整块被常量折叠删除（每次注册全量同步），prod 行为不变。产物实证：dev/index.js 中 `action: "current"` 出现 0 次。注意：`typeof process` 运行时检查不可用（浏览器无 process），必须依赖 define 字面量替换。

**6. 实战反馈迭代（最近）**：真实 Agent 运行后反馈 3 条，已全部落地（ae7c437）：adddetails 补"默认展开 open=true、字符串 content 直拼 innerHTML 非 markdown"；addcards 补内容构成（类型图标+content 标题可点击、笔记本名+hpath、created/updated 时间）；SKILL §6 fallback 细化（GitHub 优先读未压缩源码 `src/core/data-view.ts` / `components.ts` / `query.ts`，符号链接场景直接走 GitHub）。§6 开头明确 references 与 SKILL.md 同目录、按写入目标选文件。

## Key Information for the Successor

**已完成（勿重做）**：SKILL 全新重写（227 行）、agent-ref 两份（真相源在 docs/en_US/agent-ref/）、导航重构（侧栏「教程」+「参考」两组，含 i18n/DOC-STRUCTURE §1.2 契约同步）、SDK 注册（src/index.ts onload）、dev 强制同步、构建 copy 管线。

**待办/未决（按优先级）**：

1. **agent-ref 双语镜像**：DOC-STRUCTURE §1.2 契约要求"两种语言必须同构"（content.ts 单语言 404 时自动回退另一语言）。当前只有 en_US 版；zh_CN 用户会看到英文+回退提示。做法：`docs/zh_CN/agent-ref/` 镜像两份（或改契约）。用户之前对"单语 vs 双语"未拍板，倾向待确认。
2. **agent-ref 是否进文档站导航**：nav.ts 重构后「参考」组只有 api-reference + skill 两项，agent-ref 页未挂导航（文件在 docs/ 下但 PAGE_TREE 无条目）。若进导航需加 PageId/NavItem/i18n 键 + 契约同步。
3. **运行时复测（用户待办，未做）**：安装包后验证技能注册（console 无 warn）、Agent 从技能存储读取 `references/` 成功、dev 下改 SKILL 内容重载插件立即同步。构建验证已做（产物级），真机未测。
4. **README 是否提及 Agent/SKILL 入口**：用户未要求，README 是纯用户门面，勿擅自加。
5. **SKILL 触发面**：frontmatter description 已写（触发 QV 代码写作任务），若未来要接入思源 Agent 自动触发需另行验证。

**用户偏好（约束后续决策）**：Agent 文档分层「参考（签名+要点，grep 定位小节）→ 教程（仅细节完全不解时）→ 源码/GitHub（后备）」；useState 默认不写；`references/` 随技能自包含，不依赖插件目录；编译产物验证优先于推测（两次踩坑：strict:false 窄化、typeof process 检查）。

**环境陷阱（影响复测/开发）**：`NODE_ENV=development vite build`（非 watch）会被 livereload 插件挂起——验证 dev 产物用 `vite build --watch` + timeout 杀掉，或直接看 dev/index.js；项目 tsconfig 为 **strict:false**，判别联合的 `ok` 字面量窄化失效（TS 5.7 已确认）——新代码用 `in` 操作符窄化（skd.ts、index.ts 均有注释说明）；`types.d.ts` 是导出产物，每次构建刷新 `@updated` 时间戳，提交时单独 chore commit。

## File Reference Map

| 文件 | 用途 |
|---|---|
| `skills/sy-query-view/SKILL.md` | 技能本体（227 行，唯一导入文件） |
| `docs/en_US/agent-ref/query-api.md` / `dataview.md` | 参考文档真相源（构建时复制进技能包 references/） |
| `src/libs/siyuan-skill.skd.ts` | SKILL SDK（registerPluginSkill 判据含 devMode 跳过） |
| `src/index.ts`（onload 118-125 行） | 启动注册技能 |
| `vite.config.ts` | `copySkillReferences` 插件 + `DEV_MODE` define |
| `src/docs-site/nav.ts` + `public/i18n/*.yaml` + `src/types/i18n.d.ts` | 导航「教程/参考」分组（四联同步） |
| `.dev/changes/query-view-docs-portal/nodes/define-doc-structure/DOC-STRUCTURE.md` | 文档站契约（§1.2 已同步新分组；归档操作后路径可能变化，以最新为准） |
| `dist/skills/sy-query-view/references/` | 构建产物（自包含验证点） |