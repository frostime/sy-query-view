# 整理人类文档

**状态：** 执行中
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
7. 保留 README 完整 d.ts 附录及现有占位符机制，移除只供旧帮助笔记使用的 Reference 标记。
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

等待执行。
