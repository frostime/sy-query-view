# 编写核心智能体技能

**状态：** 等待验收
**负责人：** worker `docs-site-worker`

## 任务目的

创建一份自包含的英文 Query&View `SKILL.md`，让 Agent 能在不依赖尚未验证的 `references/` 读取能力、不依赖插件内文档站实现细节的情况下，安全地协助用户编写、理解和查证 Query&View JavaScript 嵌入块。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../TERM.md`、`../../DECISIONS.md`
2. `../define-doc-structure/DOC-STRUCTURE.md`
3. `../write-human-docs/TASK-NODE.SPEC.md`
4. `../verify-docs-gui/AUTOMATED-VALIDATION.md`
5. `docs/TERM.md`、`docs/en_US/`、`public/example/basic-template.js`、`public/example/exp-*.js`、`public/types.d.ts`

允许修改或创建：

- `skills/sy-query-view/SKILL.md`；
- 本节点目录。

不得修改：

- `docs/**`、`src/**`、`public/**`、README、构建配置、全局 change 文件、`.gitignore` 和 git 历史；
- 不创建 `references/`、安装脚本、Agent/MCP 集成代码或中文 Skill 副本；
- 不把 Skill 写成 README 的冗余长文，不承诺未验证的 SiYuan 原生加载或文件访问行为。

## 预期输出

1. 一份有效的 `skills/sy-query-view/SKILL.md`：YAML frontmatter 包含稳定 `name` 和英文 `description`，正文为英文。
2. 技能明确其范围：协助 Query&View 的嵌入块、Query API、DataView 和案例改造；不替代用户判断、不安装/调用自身、不写入用户笔记作为帮助。
3. 自包含的工作流程：先澄清目标，再从最小模板或接近案例出发，使用精确类型定义查证 API，生成可复制的 `//!js` 代码，说明如何验证与迭代。
4. 足够短的最小代码骨架和关键规则：异步 Query、DataView 渲染、文档上下文变量、API 名不臆造、示例改造而非凭空发明。
5. 清楚的安全边界：不自动修改用户现有嵌入块/笔记；涉及数据写入、外部网络、未知 SiYuan API 或破坏性操作时先询问；不要声称 `references/` 已可用。
6. 一个简单的技能内容验证材料，检查 frontmatter、必需章节、无 `references/` 依赖和与现有 types/examples 的基本术语一致性。

完成后更新任务规格为“等待验收”，写明内容来源、验证结果和任何残余问题。

## 验收条件

- Skill 可脱离文档站和 `references/` 独立阅读，且不需要访问未验证的安装路径。
- Skill 的任何 API 或代码示例可追溯到 `public/types.d.ts`、基础模板或案例；不编造 API。
- Skill 不与 docs/README 形成第二份人类教程，不包含不实的 Agent 安装/调用承诺。
- 文件格式可被 SiYuan Skill 安装器识别，英文描述可用于 Agent 发现。
- 不修改禁止路径，不引入任何生产集成行为。

## 结果与影响

**交付物：**

1. `skills/sy-query-view/SKILL.md`（177 行，英文，自包含）— YAML frontmatter 仅 `name: sy-query-view` + 英文 `description`（发现用，含 Query&View/Query View/JS embedded block/qv-basic 等关键词）；正文 8 节：Purpose and scope（含明确的 out-of-scope：不安装/自调用、不主动写用户笔记、不假设 `references/` 可读）、How an embedded block works（`//!js`、`protyle/item/top`、async 包裹、两种输出模式）、Working workflow（澄清目标→模板/案例→按 types.d.ts 查证→产出可复制代码→说明验证迭代）、Minimal skeleton（取自 `basic-template.js` 原文）、Core API facts（全部精确名，来源 `public/types.d.ts`；含旧拼写 avoid-note：`Query.Dataview`/`Query.utils`/`Query.fb`/`Query.prune`/`dv.cards`/`dv.replaceView`/`dv.repaint`）、Adapting shipped examples（7 个案例逐一对应实际文件及其 API 使用）、Verification and iteration、Safety boundaries（不改用户块/笔记、写操作/外部网络/未知 API/破坏性操作先询问、不臆造 API、不承诺加载行为）。
2. `verify-skill.mjs`（31 项断言 ALL PASS）— frontmatter 经 js-yaml 解析（name 稳定、description 英文且 >20 字符、无多余必需键）；7 个必需章节存在；自包含（`references/` 仅以“不可假设可读”的否定形式出现、无读取指引、无未验证安装/加载承诺、明确“does not install itself”）；**逐 token 溯源**：正文所有 `Query.`/`dv.`/`IWrapped*.`/`list.`/`b.aslink` 等 token 均在 `public/types.d.ts`（成员/方法声明）或模板/案例中找到，legacy 拼写仅出现在 avoid-note；骨架与 `basic-template.js` 语义一致并标注来源；7 个被引用案例文件均存在；术语与 `docs/TERM.md` 一致（JS Embedded Block、Basic Template）。

**内容来源（可追溯性证据）：** `public/types.d.ts`（Query.sql/backlink/tag/task/random/dailynote/childDoc/keyword/keywordDoc/markdown/pruneBlocks/gpt/thisDoc/Utils/DataView；DataView addlist/addtable/addmd/useState/addElement/addDisposer/removeview/replaceview/repaint/render；IWrappedBlock.aslink/asurl/asref；IWrappedList.pick/asMap）、`public/example/basic-template.js`（骨架原文）、`public/example/exp-*.js` 7 个文件（案例段落逐一对应，含其真实 API 用法如 `exp-doc-backlinks-table.js` 的 backlink+addtable、`exp-sql-executor.js` 的 useState+addtable 等）。

**重要修正（验证中发现的未落地声明）：** 初稿曾列 `dv.dispose()`，经查 `public/types.d.ts` 与 `docs/en_US/` 均无该成员（`dispose` 仅存在于自定义视图卸载钩子与 `addDisposer` 参数语义中），已从技能删除——技能自身“不臆造 API”规则即时生效。

**验证命令：** `node .dev/changes/query-view-docs-portal/nodes/write-core-skill/verify-skill.mjs` → ALL PASS（31/31）；`git diff --check` exit 0。

**残余问题：** 无阻塞。技能加载/安装行为（SiYuan skill.load 返回、安装器对 frontmatter 的识别）属于本任务明确不承诺的范围，留给后续“接入 Skill 并做整体发布验证”任务；`references/` 未创建。未修改任何禁止路径（docs/src/public/README/构建/全局文件/`.gitignore` 均未动）；未提交。
