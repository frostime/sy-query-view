# 编写核心智能体技能

**状态：** 已验收
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

**最终验收：** 主 Agent 核对关键类型与别名实现，最终独立 reviewer 结论为 `ACCEPT`；`verify-skill.mjs` 72/72 ALL PASS，`git diff --check` 通过。

**（API 分类修正轮，覆盖上文的旧“avoid-note”描述）** 按终审意见修正 API 分类，全部主张以当前源码为证据（`public/types.d.ts`、`src/core/query.ts` L1213-1235 `addAlias` 注册、`src/core/data-view.ts` `register` 与 `removeview = this.removeView` 等属性别名）：

1. **不再称规范名为 legacy**：`dv.cards`（dts L738）、`dv.replaceView`（dts L671）、`dv.repaint`（dts L619）是类型声明中的规范公开方法，已收入核心 DataView 事实；核心列表改用规范名 `dv.removeView(id, beforeRemove?)` / `dv.replaceView(id, viewContainer, disposer?)`（dts L661/L671），小写 `removeview`/`replaceview` 仅作为运行时别名说明。
2. **别名事实化**：`Query.Dataview`、`Query.utils`、`Query.prune`、`Query.redirect` 均由 `src/core/query.ts` 的 `addAlias` 显式注册（L1222-1228）；`dv.removeview`/`dv.replaceview` 为 `data-view.ts` 的属性别名；`add*` 视图便捷名（`dv.addlist`/`dv.addtable`/`dv.addmd`）由 `register` 的 add 前缀约定运行时注册，而 dts 声明底层方法为 `dv.list`/`dv.table`/`dv.markdown`（`dv.md` 为别名）。技能说明新代码应优先使用规范拼写，旧案例可用别名。
3. **`Query.fb` 明确为不支持**：未在任何 `addAlias` 注册中、也不是 dts 成员（本节点验证脚本对两者逐一断言）；技能明确写“not registered or documented: it does not work”，并指引用规范 `Query.fb2p`（运行时别名 `Query.redirect`）。技能不再声称任何案例使用 `Query.fb`（事实核查：`grep Query.fb` 在 `public/example/*.js` 中为 0）。
4. **验证模型重写**：`verify-skill.mjs` 删除旧的“legacy 白名单”模型（不再允许任意 token 仅因散文称其 legacy 而豁免），改为三分类断言——**canonical**（dts 成员，含泛型方法 `useState<T>`）、**alias/registered**（必须出现在 `query.ts` 的 addAlias 注册或 `data-view.ts` 的 register/属性别名展开中，含 add 前缀约定）、**unsupported**（仅 `Query.fb`，需同时断言其不在注册与 dts 中）；并断言技能文本中 `Query.fb` 带“not registered or documented”标记、规范名不与 avoid/legacy 配对、“Legacy spellings to avoid”标题已消失。
5. **验证结果**：`verify-skill.mjs` 38 项断言 ALL PASS（exit 0）；`git diff --check` exit 0；未修改任何禁止路径（仅 `skills/sy-query-view/SKILL.md` 与本节点文件）；未提交。

**（接收者作用域验证修正轮）** 按终审意见修正六项并保持 `等待验收`：

1. **Query 返回类型声明收窄**（SKILL.md）：删除“results are `IWrappedList<IWrappedBlock>`”的过宽总述，改为逐方法事实——`Query.sql` 与 backlink/tag/task/random/dailynote/keyword 返回 `Promise<IWrappedList<IWrappedBlock>>`；`childDoc`→`Block[]`、`keywordDoc`→`any[]`、`markdown`→markdown 字符串、`thisDoc`→单个 `IWrappedBlock`；其余建议查类型声明精确签名。
2. **验证器改为接收者专用**（verify-skill.mjs）：以花括号平衡作用域解析 `declare const Query`、`export declare class DataView`、`export interface IWrappedBlock`、`export interface IWrappedList` 四个作用域，提取 4 空格缩进成员名（含 get/set/static/readonly 前缀与泛型）；`Query.*` 只查 Query 作用域、`dv.*` 只查 DataView 作用域、`list.*`→IWrappedList、`b.*`/`IWrappedBlock.*`→IWrappedBlock；运行时别名/注册（query.ts addAlias、data-view.ts 属性别名与 register 展开）作为第二层事实。**负向对照**：`Query.render` 与 `dv.sql` 断言无法分类（均不在作用域/注册中）。
3. **Query.fb 精确检查**：全部改用 `\bQuery\.fb\b` 词边界（`Query.fb2p` 不误匹配）；断言其不在 Query 注册别名中、不在 Query 类型声明作用域中、不在任何 shipped 案例与英文 docs 中；同时断言 `Query.fb2p` 在 Query 作用域中存在（边界检查无假阴性）。技能中“not registered or documented”与 `Query.fb` 的绑定改为同一条 bullet（跨行合并 3 行后断言），且同 bullet 指向 `Query.fb2p` 与 `Query.redirect`。
4. **removeview/replaceview 重叠分类**：断言二者同时是 dts 声明成员（DataView 作用域）与运行时属性别名（`x = this.y` 注册）——分类允许重叠，技能中规范名 `dv.removeView`/`dv.replaceView` 的优先主张保持明确。
5. **清理未用数据**：移除旧的 `all`/`tpl`/拼接 `examples` 变量；案例校验从“仅存在”升级为“存在 + 描述中的真实源码 token”——7 个案例各自断言其技能描述对应的实际 token（如 exp-doc-backlinks-table.js 含 `Query.backlink` 与 `addtable`、exp-list-tags.js 含 `Query.tag` 与 `dv.cards`、exp-created-docs.js 含 `addeline`、exp-gpt-chat.js 含 `Query.gpt`）。
6. **结果**：`verify-skill.mjs` 53 项断言 ALL PASS（exit 0）；`git diff --check` exit 0；仅 `skills/sy-query-view/SKILL.md` 与本节点文件改动；未提交。

**（返回契约精确性修正轮）** 按主 Agent 源码检查修正 SKILL.md 第 5 节并加返回契约断言，保持 `等待验收`：

1. **Query 对象不再称“all async”**：改为限定表述——async 方法返回 Promise，`Query.DataView` 与 `Query.Utils` 是同步的（decl 证据：`DataView: (...) => DataView`、`Utils: {` 对象字面量）。
2. **逐方法返回类型修正**（全部与 `public/types.d.ts` 声明逐字一致）：`keywordDoc` → `Promise<Block[]>`（原误写 `any[]`）；`markdown` → `Promise<any>`（只描述用途“block's markdown content”，不再声称比声明更精确的 string 返回）；`thisDoc` → 保留 `Promise<IWrappedBlock>`（原漏掉 Promise）；`pruneBlocks`/`fb2p` 补充为 `Promise<Block[]>`（与声明兼容）。
3. **返回契约断言**（verify-skill.mjs 新增 4b 节）：从 Query 声明作用域逐方法提取 `=> 返回类型`——sql/backlink/tag/task/random/dailynote/keyword 必须均为 `Promise<IWrappedList<IWrappedBlock>>`；keywordDoc=`Promise<Block[]>`；markdown=`Promise<any>`；thisDoc=`Promise<IWrappedBlock>`；pruneBlocks 与 fb2p=`Promise<Block[]>`；DataView=`DataView`（同步非 Promise）；Utils 为同步对象字面量。技能散文侧断言：不含“all async”；`Query.DataView` 与 `Query.Utils` 与“are sync”同句；keywordDoc 句含 `Promise<Block[]>` 且不含 `any[]`；markdown 句含 `Promise<any>` 且不含“markdown string”；thisDoc 句保留 `Promise<IWrappedBlock>`；pruneBlocks/fb2p 句与 `Promise<Block[]>` 兼容；DataView bullet 注明 sync。上述任一回归（如再次写 all async/any[]/漏 Promise）都会使断言失败。
4. **结果**：`verify-skill.mjs` 69 项断言 ALL PASS（exit 0）；`git diff --check` exit 0；仅 `skills/sy-query-view/SKILL.md` 与本节点文件改动；未提交；未触碰全局/公共/src/docs 文件。

**（验证器 token 提取修正轮）** 按终审意见只改验证器（SKILL.md 内容无需变更），保持 `等待验收`：

1. **token 提取/分类支持数字与下划线**：成员名正则由 `[a-zA-Z]+` 改为 `[a-zA-Z_][a-zA-Z0-9_]*`（提取与 classify 两处），`Query.fb2p` 现整体捕获并归类 canonical，不再被截断为 `Query.fb`。
2. **Query 作用域精确检查替换**：删除对 Query 作用域文本的 `\bQuery\.fb\b` 正则（该正则对含 `fb2p` 的作用域文本不成立），改为直接的成员检查 `!queryMembers.has("fb")`；词边界检查仅保留在存在完整 `Query.fb` 文本的上下文中（注册别名集、shipped 案例、英文 docs、技能散文）。
3. **截断防护断言**：token 集必须含整体 `Query.fb2p`；`classify("Query.fb2p")==="canonical"` 且 `classify("Query.fb")==="unsupported"`；散文中的精确 `\bQuery\.fb\b` 出现次数恰为 1（唯一的有意 unsupported bullet，`Query.fb2p` 因词边界不误匹配）。
4. **结果**：`verify-skill.mjs` 72 项断言 ALL PASS（exit 0）；`git diff --check` exit 0；仅验证器与节点规格改动（SKILL.md 的 M 为本轮之前未提交的返回契约修正，本轮未改动）；未提交。
