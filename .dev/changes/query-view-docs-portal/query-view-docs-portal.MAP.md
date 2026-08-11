---
title: Query&View Documentation Site Context Map
created: 2026-08-11T01:27:29+08:00
updated: 2026-08-11T18:45:00+08:00
---

# Query&View 文档站 Context Map

## Product Entry And Lifecycle

- `src/index.ts` — 插件生命周期；加载 `UserHelp`。
- `src/user-help/index.ts` — 只保留“帮助文档”菜单与 `qv-basic` 斜杠菜单；帮助打开文档站，基础模板读取 `public/example/basic-template.js`。
- `src/user-help/dts-actions.ts` — API 页面打开/下载 `types.d.ts` 的共享依赖叶。
- 已删除的 `src/user-help/sy-doc.ts`、`examples.ts` 与旧样式 — 不得恢复；既有用户帮助笔记保留但插件不再读写。

## Documentation Site

- `src/docs-site/index.ts` — 自定义 Tab、侧栏、页面状态、竞态令牌、API 工具条；文档语言只跟随 SiYuan。
- `src/docs-site/nav.ts` — 10 个稳定页面 ID 与导航树。
- `src/docs-site/content.ts` — 本地 docs/案例/Skill 加载、缓存、404 语言回退、`{{example:}}` 与 `{{skill:}}` 一次展开。
- `src/docs-site/render.ts` — Lute `Md2BlockDOM` 只读渲染、链接/图片解析、原生控件清理和文档站复制按钮。
- `src/docs-site/index.module.scss` — 文档站布局与 SiYuan 变量样式。
- `public/i18n/{zh_CN,zh_CHT,en_US}.yaml`、`src/types/i18n.d.ts` — 文档站与插件界面文案；`zh_CHT` 当前复用中文文案。

## Content Sources

- `docs/zh_CN/`、`docs/en_US/` — 人类文档唯一手工来源；两侧各 10 个同构页面。
- `docs/assets/` — 离线文档图片与 `query-dataview-overview.svg`。
- `docs/TERM.md` — 产品文档中英文术语表。
- `public/example/` — 案例代码与基础模板唯一来源。
- `public/types.d.ts` — 发布类型声明；`npm run build` 会改写，验证后需恢复非任务差异。
- `skills/sy-query-view/SKILL.md` — 英文、自包含的核心 Agent Skill 唯一来源；无 `references/`。

## Generation And Packaging

- `scripts/build-docs.js` — 从 docs 生成 README；展开案例与 Skill，占位符缺源时作者侧失败。
- `scripts/check-docs-sync.js` — 检查提交态 README 与 docs 生成结果同步。
- `scripts/export-types.js` — 生成类型声明与 README 类型占位符数据。
- `vite.config.ts` — 复制 docs 与原始 skills 到发布包，处理 README 类型占位符/图片路径并生成 `package.zip`。
- `README.md`、`README_zh_CN.md` — 生成并提交的外部说明，不得手工维护正文。

## Verification

- `nodes/build-docs-gui/verify-content.cjs`、`verify-render-selectors.mjs` — 内容加载与 Lute DOM 契约。
- `nodes/retire-legacy-help/verify-i18n.mjs` — i18n 结构和旧键退役。
- `nodes/fix-runtime-feedback/verify-runtime-fixes.mjs` — 语言、原生控件、任务复选框与 SVG。
- `nodes/write-core-skill/verify-skill.mjs` — Skill frontmatter、API receiver/别名/返回契约与案例溯源。
- `nodes/integrate-skill-release/verify-skill-integration.mjs` — Skill 单一源展开、竞态/顺序、README、dist/zip 字节一致性。
- `nodes/verify-docs-gui/RUNTIME-CHECKLIST.md` — 用户在隔离 SiYuan 工作区执行的运行时清单。

## Navigation

- 帮助入口或 Tab 生命周期问题 → `src/user-help/index.ts` → `src/docs-site/index.ts`。
- 页面加载、语言回退、案例或 Skill 展开问题 → `src/docs-site/content.ts`。
- 图片、代码块、复制、链接或只读 DOM 问题 → `src/docs-site/render.ts` → `index.module.scss`。
- 文档内容问题 → 对应 `docs/{lang}/` 页面；案例代码改 `public/example/`；Skill 规则改 `skills/sy-query-view/SKILL.md`。
- README 不同步 → `scripts/build-docs.js` → `npm run docs:gen` → `npm run docs:check`。
- 发布包缺 docs/Skill → `vite.config.ts` → `dist/` → `package.zip`。

## Current Boundary

代码与自动发布验证已完成，当前等待用户最终运行时复测。`references/`、Skill 安装/启用状态、SiYuan Agent/MCP 集成和移动端文档站专用体验均明确延后。
