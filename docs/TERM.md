# 产品文档术语表 / Documentation Terminology Glossary

本文件是 Query&View 产品文档（`docs/zh_CN/`、`docs/en_US/`）与生成的 README 的中英文术语权威表。写作和审查必须使用本表译名，不得自行创造新译名；新增反复使用的术语，先在本表登记再使用。

本表不约束代码标识符与插件界面文案（界面文案以 `public/i18n/*.yaml` 为准）。

## 规则

- API 名与代码标识符（`Query`、`DataView`、`IWrappedBlock`、`IWrappedList`、`protyle`、`item`、`top`、`Block` 等）一律不翻译，直接使用原标识符。
- 中文文档中首次出现的英文术语可给出英文原文，例如：嵌入块（Embedded Block）。

## 术语表

| 中文 | English | 说明 |
|---|---|---|
| 插件内文档站 | In-Plugin Documentation Site | 随插件版本发布、在 SiYuan 独立 Tab 中浏览的帮助站点 |
| 帮助文档 | Help Document | 文档站的旧称；也指旧机制在知识库中创建/更新的笔记 |
| 知识库笔记 | Knowledge-base Note | 旧帮助机制在用户笔记本中创建并维护的文档 |
| 嵌入块 | Embedded Block | SiYuan 原生块类型 |
| JS 嵌入块 | JS Embedded Block | 内容以 `//!js` 开头、按 JavaScript 执行的嵌入块 |
| 基础模板 | Basic Template | `public/example/basic-template.js`，`/qv` 斜杠菜单插入的骨架代码 |
| 模板 | Template | 与思源模板功能配合的模板文件 |
| 案例 | Example | `public/example/exp-*.js` 中的可运行示例 |
| 案例总览 | Examples | 文档站「案例」章节页面 |
| 类型声明 | Type Declaration | `public/types.d.ts` 及 README 中的 d.ts 附录 |
| API 参考 | API Reference | 文档站 API 章节 |
| 智能体技能 | Agent Skill | 面向 AI 代理的 `SKILL.md` |
| 侧边栏 | Sidebar | 文档站导航栏 |
| 复制 | Copy | 复制代码的操作，不写入用户笔记 |
| 只读 | Read-only | DataView 视图的展示语义 |
| 随插件版本发布 | Shipped with the Plugin Version | 离线材料与版本一致性的规则 |
