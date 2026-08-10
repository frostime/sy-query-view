---
title: Query&View Documentation Site Context Map
created: 2026-08-11T01:27:29+08:00
updated: 2026-08-11T01:27:29+08:00
---

# Query&View 文档站 Context Map

## Core Files

- `src/index.ts` — 插件生命周期和顶栏菜单初始化；加载 `UserHelp` 模块。
- `src/user-help/index.ts` — 帮助相关菜单、基础 Query View 模板、类型声明打开/下载入口；当前调用帮助笔记和 Examples 功能。
  - `load()` — 注册上述用户可见入口。
- `src/user-help/sy-doc.ts` — 旧帮助笔记的创建、版本检查、README 读取和更新逻辑。
  - `useUserReadme()` — 旧帮助入口的主流程。
  - `createReadmeText()` — 读取 README 并按设置裁剪内容。
- `src/user-help/examples.ts` — 当前 Examples 独立 Tab 的实现和案例读取逻辑。
  - `useExamples()` — 注册自定义 Tab，并通过 `openTab()` 打开它。
- `src/user-help/index.module.scss` — 现有帮助 / Examples 视图的局部样式。
- `src/setting/index.ts` — 旧帮助笔记的“只导入类型参考”设置项。
- `src/api.ts` — 旧帮助笔记流程使用的文档创建、更新、删除和属性 API 封装。
- `README.md`、`README_zh_CN.md` — 英文和中文长篇人类说明的当前来源。
- `public/example/` — 随插件发布、由 Examples 页面读取的可运行案例代码。
- `public/types.d.ts` — 随插件发布的完整类型声明。
- `public/i18n/zh_CN.yaml`、`public/i18n/en_US.yaml` — 帮助菜单、Examples 和设置相关的界面文案。
- `src/types/i18n.d.ts` — 上述翻译键的 TypeScript 声明。
- `scripts/export-types.js` — 生成 `public/types.d.ts`，并生成 README 类型占位符替换所需的数据。
- `vite.config.ts` — 复制 README / 静态资源至发布包；现有 Markdown 类型占位符和图片 URL 处理也位于此处。
- `plugin.json` — 插件版本与 README 语言映射。

## Navigation

- 理解现有帮助入口 → `src/index.ts` → `src/user-help/index.ts` → `src/user-help/sy-doc.ts` 或 `src/user-help/examples.ts`。
- 理解当前 Examples Tab → `src/user-help/examples.ts` → `public/example/` → `public/i18n/*.yaml`。
- 理解人类文档与类型声明如何进入发布包 → `README*.md`、`scripts/export-types.js` → `vite.config.ts` → `public/types.d.ts`。
- 理解旧帮助设置为什么会影响生成内容 → `src/setting/index.ts` → `src/user-help/sy-doc.ts`。
- 修改文档站相关用户文案时 → `public/i18n/*.yaml` → `src/types/i18n.d.ts`。

## Discovered Later

<!-- Append relevant files or navigation links discovered during implementation. -->
