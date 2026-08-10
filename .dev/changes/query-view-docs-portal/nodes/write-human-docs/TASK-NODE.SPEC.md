# 整理人类文档

**状态：** 已验收
**负责人：** worker `docs-site-worker`

## 任务目的

将现有中英文 README 教程迁移为 `docs/zh_CN/` 与 `docs/en_US/` 的对应页面，使 docs 成为唯一手工维护的人类文档来源；自动生成并同步检查根 README，同时保留案例代码和类型声明的单一来源。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`
2. `../../THIS.RULE.md`
3. `../../TERM.md`
4. `../../DECISIONS.md`
5. `../define-doc-structure/DOC-STRUCTURE.md`
6. 当前 `README.md`、`README_zh_CN.md`、`assets/`、`public/example/`、`public/types.d.ts`、`public/i18n/*.yaml`、`scripts/export-types.js`、`vite.config.ts`、`package.json`、`plugin.json`

允许修改或创建：

- `docs/**`，包括 `docs/zh_CN/`、`docs/en_US/`、`docs/TERM.md`、`docs/assets/`；
- 根 `assets/` 中的文档图片仅可通过 `git mv` 迁至 `docs/assets/`；
- `README.md`、`README_zh_CN.md`；
- `scripts/` 下仅为 docs 生成和同步检查新增的脚本；
- `package.json` 中 docs 生成/检查所需 script；
- `vite.config.ts` 中 docs 打包、watch 和 README 图片前缀所需的最小变更；
- `public/example/basic-template.js`；
- `docs/siyuan-3.7.0-embed-editing-qv.md` 仅可通过 `git mv` 迁至 `.dev/notes/`。

不得修改：

- `src/**`、`public/i18n/**`、`public/example/exp-*.js`、`public/types.d.ts`、`plugin.json`、依赖清单、`.gitignore`、全局 change 文件和 git 历史；
- 不实现 GUI、帮助菜单改造、旧帮助逻辑删除或 Skill 内容；
- 不引入外部文档框架、远程内容或新的运行时依赖。

## 预期输出

1. 建立 `docs/zh_CN/` 与 `docs/en_US/` 中 `DOC-STRUCTURE.md` 规定的 10 个对应页面，保留 README 中与用户使用相关的内容和 API 说明，不得擅自删减技术语义。
2. 建立 `docs/TERM.md`，至少覆盖结构任务规定的首批术语；两种语言文档统一使用它。
3. 将 76 张根 `assets/` 图片迁至 `docs/assets/`，并令 docs 页面和生成 README 的图片路径正确。
4. 建立一个无第三方依赖的 docs 生成器和同步检查：docs 是唯一手工来源，根中英文 README 可重建；构建发现 README 未同步时失败。
5. 按 `DOC-STRUCTURE.md` 实现 `{{example:<file>.js}}` 与 `<!-- docs-only:start/end -->` 约定；README 生成时内嵌案例代码并剔除 docs-only 内容。
6. 新建 `public/example/basic-template.js`，其代码语义与当前 `src/user-help/index.ts` 的基础模板一致。
7. 保留 README 完整 d.ts 附录及现有占位符机制；`REFERENCE-START/END` 兼容标记由生成器在附录外围合成（docs 源文件不含标记），待后续“停用旧帮助笔记机制”任务原子性删除 `sy-doc.ts` 与 `onlyImportDtsInUserDoc` 后移除（评审确认的兼容约束，覆盖本条原“移除标记”表述）。
8. 将现有开发笔记移至 `.dev/notes/`；保留 README dist 图片 `@main` 改写，但将其前缀调整为新 docs 图片路径。
9. 执行 docs 生成/同步检查和项目 build；报告命令和结果。

## 验收条件

- 每个页面 ID 在两种语言目录中都有对应 Markdown 文件；`docs/TERM.md` 存在且术语统一。
- 根 README 只能由 docs 重新生成；对 README 的手工改动会被同步检查发现。
- README、docs 页面和 GUI 将要读取的案例不含第二份案例代码；案例页面只引用 `public/example/`。
- 插件包会包含 docs、docs/assets、example 和 types.d.ts；插件内文档页面不需要远程资源。
- 现有 `pnpm run build` 成功，且同步检查作为构建链的一部分运行。
- 不修改本任务禁止的文件；不将 GUI、旧机制退役或 Skill 提前纳入。

## 结果与影响

**交付物：**

1. `docs/zh_CN/` 与 `docs/en_US/` 各 10 页（页面 ID/路径与 DOC-STRUCTURE.md §1.2 完全一致）：index、quickstart/concepts、quickstart/template、examples/index、topics/query、topics/dataview、topics/dataview-advanced、topics/editor-tips、api/reference、skill/index。内容迁移自原 README 全部技术章节（保留 WrappedList/Query.Utils/fb2p/pruneBlocks、全部视图组件、外部编辑器、模板、调试等语义），删除旧帮助笔记说明与 Examples 菜单描述；新增首页任务路径、模板分步指南、API 导览、技能占位页。
2. `docs/TERM.md`：16 条首批术语 + 2 条规则（API 名不译、首现附英文原文）。
3. 76 张图片 `git mv` 至 `docs/assets/`；docs 页面图片路径全部为相对路径（`../assets/` / `../../assets/`），逐文件验证无缺失引用；4 张旧菜单截图（image-20241211194155/194348/194447/14152215）不再被引用但按决定随迁。
4. 无第三方依赖的生成器与同步检查：`scripts/build-docs.js`（拼装顺序、标题降一级、剔除 docs-only、展开 `{{example:}}`、图片路径规范化为 `docs/assets/`、api 页后追加 d.ts 附录含 `{{Query}}`/`{{Proxy}}`/`{{DataView}}` 占位符）+ `scripts/check-docs-sync.js`（行尾归一化后比对，其他内容不一致退出码 1）。
5. `public/example/basic-template.js` 新建（模板唯一权威，注释用中性英文；`/qv` 菜单改读该文件留给后续停用节点）。
6. `package.json`：新增 `docs:gen`/`docs:check`；`build` = export-types → docs:check → vite:build（`docs:gen` 不在构建链中，仅作为作者/开发操作，`dev` 脚本包含 docs:gen）；`vite.config.ts`：viteStaticCopy 增加 `./docs/**` → dist/docs（顶层 `structured: true`）、dev watch 增加 `'docs/**'`、`replaceMDImgUrl` 前缀 `assets/` → `docs/assets/`（保留 `@main` 改写）。
7. 开发笔记 `docs/siyuan-3.7.0-embed-editing-qv.md` 经 `git mv` 移至 `.dev/notes/`。
8. （评审修正轮）生成器 `shiftHeadings` 改为栅栏（fence）感知，展开的 JS 代码块内标题行不再被降级；d.ts 附录外围由生成器合成 `` `<!-- REFERENCE-START -->` `` / `` `<!-- REFERENCE-END -->` `` 兼容标记（格式与 `src/user-help/sy-doc.ts` L44-45 查找串完全一致，docs 源文件不含标记）；`package.json` 的 `build` 链改为 `export-types → docs:check → vite:build`（不再先跑 `docs:gen`，`docs:gen` 仅为作者/开发操作）；`vite.config.ts` 的 docs 复制改为 `structured: true` 顶层选项 + `dest: "./"`，保留 docs 语言目录结构；修复 en pruneBlocks 案例查询关键字（`'Important Content'` → `'重要内容'`，与数据及截图一致）。

**验证命令与结果：**

- `npm run docs:gen` ✓（README.md 119,672B / README_zh_CN.md 84,762B）；`npm run docs:check` ✓ 两次 OK。
- 手工改动 README 后 `node scripts/check-docs-sync.js` 退出码 1 并报告首个差异行 ✓；重新生成后恢复 0 ✓。
- `npm run build` ✓ 全链通过（export-types → docs:check → vite:build → zipPack）。dist 包含 `docs/`（zh_CN/en_US/assets 76 图/TERM.md）、`example/`、`types.d.ts`；dist README 的 d.ts 附录已解析、图片已改写为 `@main` 远程 URL（github raw / jsdelivr，前缀 `docs/assets/`）；`package.zip` 24.4MB 生成。
- 20 个页面结构对称性、H1、图片引用完整性均脚本验证通过；占位符全部展开（`grep {{example:` 无结果）、docs-only 标记已剔除、`_esc_newline_` 模板块与 `{{filepath}}` 未被误展开。
- （评审修正轮验证，全部通过）
  - `npm run docs:gen` ✓ 重新生成；`grep '^## Original Text' README.md` 确认 `exp-gpt-translate.js` 内嵌代码中的标题行保持 `##` 未被降级（修复前为 `###`）；`` grep 'REFERENCE-START' README.md `` 确认附录标记存在且格式为 `` `<!-- REFERENCE-START -->` ``，与 `src/user-help/sy-doc.ts` 查找串一致；en `topics/query.md` 两处 `Query.keyword` 均为 `'重要内容'`，与数据列表和截图一致。
  - 负向检查：向 `README.md` 追加手工行后 `npm run docs:check` 退出码 1，`npm run build`（新链 export-types → docs:check → vite:build）退出码 1 并输出 `[docs:check] FAIL README.md: not in sync with docs/` 与首个差异行；`docs:gen` 恢复后 `docs:check` 退出码 0。
  - 干净构建：`rm -rf dist && npm run build` ✓（`vite-plugin-static-copy` 顶层 `structured: true` + `dest: "./"`）；`find dist/docs -type f` 确认 `zh_CN/`、`en_US/` 各 10 页、`TERM.md`、`assets/` 76 图全部位于 `dist/docs/` 正确层级，无拍平冗余文件；`unzip -l package.zip` 确认 `docs/zh_CN/index.md`、`docs/en_US/quickstart/template.md`、`docs/assets/image-20241210183914-5nm5w4r.png`、`docs/TERM.md`、`types.d.ts` 均在包内；dist README 含 REFERENCE 标记、d.ts 附录已解析、图片 URL 为 `@main` + `docs/assets/` 前缀。
  - `public/types.d.ts` 再次被 `export-types` 改写，已 `git checkout -- public/types.d.ts` 还原。

**局部决定（未改用户行为/来源/范围/架构）：** ① 案例锚点标题用 `exp-<名>`（不带 `.js`，避免锚点生成歧义）；② 修复原 README 遗留的两处坏图片引用（en dataview 的 localhost URL → 本地相对路径；en query 的 `/assets/` 绝对路径 → `../../assets/`）；③ en 主题页标题用英文（Query API / DataView Views / DataView Advanced Features）；④ 基础模板文件内注释采用中性英文（文件为双语共用，注释非代码语义）；⑤ README 头部生成声明 + 更新日志链接为生成器固定模板，首页任务路径卡片为 docs-only。

**残余问题/注意事项：**

- `npm run build` 的 `export-types` 会把 `public/types.d.ts` 头部 `@version`/`@updated` 改写（1.2.3 → 1.3.0 + 新时间戳，属既有行为），本次已用 `git checkout -- public/types.d.ts` 还原；后续提交时需注意该文件是否被无意带上。
- 4 张旧菜单截图仍随包发布但无页面引用（按已确认决定迁移全部 76 张），如需清理可后续删除。
- README 体积因内嵌全部 19 个案例代码而增大（en 约 120KB），符合 DOC-STRUCTURE §6 生成契约。
- 兼容性约束（评审确认）：生成的 README 中 `` `<!-- REFERENCE-START -->` `` / `` `<!-- REFERENCE-END -->` `` 标记是旧帮助笔记功能（`src/user-help/sy-doc.ts` 的 `onlyImportDtsInUserDoc` 提取逻辑）的存活依赖，须保留到“停用旧帮助笔记机制”任务原子性删除 `sy-doc.ts` 与设置项；届时同步移除生成器中的标记。标记由生成器合成，docs 源文件不含标记。
- 生成器和 docs 源页面已清理行尾空白，`git diff --check` 通过。
- README 同步检查只忽略 CRLF/LF 差异；内嵌案例代码和 README 输出统一为 LF。已验证：CRLF README 仍通过检查，任意内容改动仍以非零码失败。
- 无阻塞性残余问题；本节点已由主 Agent 验收，GUI 代码结构任务正在执行。

**影响：** 根 README 现可由 docs 完全重建；docs 为人类文档唯一手工来源，案例代码与类型声明保持单一权威；构建链已包含 README 同步检查；未修改任何 `src/**`、`public/i18n/**`、`public/example/exp-*.js`、`public/types.d.ts`、`plugin.json`、`.gitignore` 或全局 change 文件，未做任何提交。
