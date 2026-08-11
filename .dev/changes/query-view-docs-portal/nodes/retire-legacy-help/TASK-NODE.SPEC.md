# 停用旧帮助笔记机制

**状态：** 已验收
**负责人：** worker `docs-site-worker`

## 任务目的

在新的插件内文档站已经通过构建和静态验证后，删除旧的用户帮助笔记、独立 Examples 和顶栏 d.ts 菜单生命周期。保留基础 Query View 模板、已有用户帮助笔记和 API 页中的类型声明动作，确保插件不再创建、更新或查询用户帮助笔记。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../TERM.md`、`../../DECISIONS.md`
2. `../define-doc-structure/DOC-STRUCTURE.md`
3. `../write-human-docs/TASK-NODE.SPEC.md`
4. `../shape-docs-gui/docs-site.LAND.md`
5. `../build-docs-gui/TASK-NODE.SPEC.md`
6. 当前 `src/user-help/index.ts`、`sy-doc.ts`、`examples.ts`、`index.module.scss`、`dts-actions.ts`、`src/setting/index.ts`、`scripts/build-docs.js`、README、`public/i18n/*.yaml`、`src/types/i18n.d.ts`、`src/api.ts`

允许修改或删除：

- `src/user-help/index.ts`、`src/user-help/sy-doc.ts`、`src/user-help/examples.ts`、`src/user-help/index.module.scss`；
- `src/setting/index.ts`；
- `scripts/build-docs.js`、`README.md`、`README_zh_CN.md`（README 必须经生成器重建）；
- `public/i18n/zh_CN.yaml`、`public/i18n/en_US.yaml`、`src/types/i18n.d.ts`；
- 本节点目录。

不得修改：

- `src/docs-site/**`、`src/user-help/dts-actions.ts`、`src/api.ts`、`docs/**`、`public/example/**`、`public/types.d.ts`、`vite.config.ts`、`package.json`、`plugin.json`、`.gitignore`、全局 change 文件和 git 历史；
- 不删除或改写用户知识库中已有帮助笔记，不调用任何用户笔记删除/迁移 API；
- 不实现 Skill、`references/`、移动端专用体验或真实 SiYuan 数据库测试。

## 预期输出

1. Help 菜单仍打开文档站；不再存在任何 `useUserReadme`、`createReadmeText`、`custom-query-view-user-readme` 或旧帮助笔记 API 调用路径。
2. 删除旧 `sy-doc.ts`、`examples.ts`、其专用样式和菜单注册；移除独立 Examples 顶栏入口。
3. 删除顶栏“打开/下载 d.ts”菜单，但保留 `dts-actions.ts` 供文档站 API 页面使用。
4. 删除 `onlyImportDtsInUserDoc` 默认设置和设置 UI；不主动清理用户设备存储中的历史未知键。
5. 基础 `qv-basic` 斜杠菜单继续可用，模板代码从 `public/example/basic-template.js` 读取并缓存，不再在 TypeScript 中维护第二份模板。
6. 在生成器中移除仅为旧帮助服务的 `REFERENCE-START/END` 合成标记，并重新生成 README。
7. 删除只被退役模块使用的翻译键和类型声明；保留文档站、基础模板、codeEditor 和其他功能所需的键。
8. 执行 docs 生成/同步检查、TypeScript 和完整 build；静态检查确认旧模块/设置/标记已消失、文档站未被删除、没有针对用户笔记的新写操作。

## 验收条件

- 新版本启动后，帮助入口只能够到文档站，不会触发用户笔记的创建、查询或更新。
- 用户已有旧帮助笔记不受本任务的任何 API 调用影响。
- 独立 Examples 与 d.ts 顶栏菜单不再注册；案例、API 类型动作仍可通过文档站实现。
- 基础模板的唯一代码来源是 `public/example/basic-template.js`。
- `REFERENCE-START/END`、`onlyImportDtsInUserDoc` 和旧帮助文件均不存在，且 README 仍通过 docs 同步检查。
- 构建通过，不修改禁止路径，不引入依赖。

## 结果与影响

**交付物（退役原子完成：Help 已指向文档站 → 旧消费者/设置/标记同步移除）：**

1. `src/user-help/index.ts` 重写：仅保留 Help 菜单（`docsSite.open()`）与 `qv-basic` 斜杠菜单；删除 `BASIC_TEMPLATE` 内嵌模板、`useExamples` 调用、两个 d.ts 顶栏菜单、`setting` 导入；基础模板改为运行时 `fetch(/plugins/{pluginName}/example/basic-template.js)` 并模块级缓存（失败 console.warn + 新 i18n 键 `basic_template_load_failed` 提示），TypeScript 中不再存在第二份模板；保留 `getPluginInfo`/`DocsSite.load`/`disposeCb`/`toEmbed`。
2. 删除 `src/user-help/sy-doc.ts`、`examples.ts`、`index.module.scss`（git rm，D 状态）；不再存在 `useUserReadme`/`createReadmeText`/`custom-query-view-user-readme`/旧帮助笔记 API 调用路径；`src/api.ts` 未动。
3. `src/setting/index.ts`：删除 `onlyImportDtsInUserDoc` 默认值与其设置项 UI；`codeEditor` 等其余设置保留；未清理用户设备存储历史键（按规格）。
4. `scripts/build-docs.js`：移除 `REFERENCE_START/REFERENCE_END` 常量与附录标记合成（保留 d.ts 附录正文）；README 经 `docs:gen` 重建，`REFERENCE-START/END` 在 README.md/README_zh_CN.md 与 dist 副本中均为 0 处。
5. i18n 清理：删除 `src_userhelp_examplests`（19 键）、`src_userhelp_sydocts`（3 键）、`user_help`（ahead_hint）、`src_userhelp_indexts` 的 `create_notebook/help_doc_2/useview/useview2/unable_open_d_ts`、`src_setting_indexts` 的 `user_doc_import_type_ref/plugin_import_help_doc`；新增 `basic_template_load_failed`；保留文档站/基础模板/codeEditor/自定义视图所需键（`help_doc/queryview/download/open_locally/edit_custom_view/open_custom_view_dir/unable_open_custom_view/unable_open_custom_view_dir` 及 `src_docsite_indexts` 全组）。中英 yaml 均经 `yaml.safe_load` 解析验证，组键一致。

**验证（命令与结果）：**

- `npm run docs:gen` ✓（README.md 118,988B / README_zh_CN.md 84,110B，无标记）；`npm run docs:check` ✓ OK/OK。
- `npx tsc --noEmit` 0 错误；`rm -rf dist && npm run build` ✓（export-types → docs:check OK/OK → vite:build → zipPack）。
- 静态检查：`grep useUserReadme/createReadmeText/custom-query-view-user-readme/onlyImportDtsInUserDoc/sy-doc/REFERENCE-START`（src/ + scripts/）→ 仅注释提及；dist/index.js 中旧符号计数 0；`grep createDocWithMd/updateBlock/setBlockAttrs/removeDoc/renameDoc`（src/user-help/）→ 无（`insertBlock` 仅用于 qv-basic 模板插入，属既有功能）；`ls src/user-help/` → 仅 `index.ts`、`dts-actions.ts`；`src/docs-site/**` 与 `dts-actions.ts` 未动；dist/i18n 无退役组，`src_userhelp_indexts` 9 键符合预期。
- `git diff --check` 干净。

**残余问题/注意事项：**

- `public/types.d.ts` 被既有 export-types 副作用改写后已还原为与 HEAD 逐字节一致（python 字节比对证明）；`git status` 仍显示 ` M` 是 core.autocrlf 统计缓存伪影（工作树为 LF），`git add` 时 git 会重新哈希、提交 diff 中不会出现该文件，无需处理。
- SiYuan Tab 运行时行为（Help 打开文档站、斜杠菜单插入模板）无法在本环境实测，如实记录。
- 未修改任何禁止路径（`src/docs-site/**`、`dts-actions.ts`、`src/api.ts`、`docs/**`、`public/example/**`、`public/types.d.ts`（已还原）、`vite.config.ts`、`package.json`、`plugin.json`、`.gitignore`、全局 change 文件）；未删除/改写任何用户知识库笔记；未调用任何用户笔记删除/迁移 API；未提交。

**（i18n 清理修正轮）** 按评审意见修正 yaml 键删除方式并保持 `等待验收`：

- 原删除方式只删了键的首行，多行值的续行残片被吸入保留键值（如 `open_local_editor`、`user_self_written_view`、`unable_open_custom_view_dir` 下的残片）。已从 `git show HEAD:` 恢复两个 yaml 的原始基线，改用按条目完整删除（`retire-i18n-keys.py`：键行 + 全部更深缩进续行；整组删除时含组内空行），保留字节逐行不变。
- 恢复基线时发现 GUI 任务的 `src_docsite_indexts` 组（22 键）是未提交工作树内容、不在 HEAD 中，曾被 HEAD 恢复一并冲掉；已从构建产物 `dist/i18n/*.json`（保留着 GUI 基线精确值）提取并重建该组到两个 yaml（`restore-docsite-i18n.py`），值与 GUI 基线完全一致。
- 新增 `verify-i18n.mjs`（js-yaml 工具链，11 项断言全 PASS）：① 顶层组与 `src/types/i18n.d.ts` 声明一致；② 组内键双向一致；③ 生产代码引用的全部 i18n 键（`i18n.<组>.<键>` 全量 rg）均存在于 yaml；④ **保留键的解析值与 HEAD 逐键相等**（证明无退役帮助/案例文案残片嵌入保留标签）；⑤ 退役组/键（`src_userhelp_examplests`/`src_userhelp_sydocts`/`user_help` 与 `create_notebook`/`help_doc_2`/`useview`/`useview2`/`unable_open_d_ts`/`user_doc_import_type_ref`/`plugin_import_help_doc`）整体消失；⑥ `basic_template_load_failed` 双语存在。
- 重跑：`npx tsc --noEmit` 0 错误；`rm -rf dist && npm run build` ✓（docs:check OK/OK → vite:build → zipPack）；重建后的 `dist/i18n/*.json`：`src_docsite_indexts` 22 键在位、无任何退役组、`src_userhelp_indexts` 9 键符合预期；`git diff --check` 干净；`public/types.d.ts` 已还原（字节一致）。
