# 从模板开始

本页带你用最小成本跑起第一个 Query View。基础模板的代码权威位于 `public/example/basic-template.js`，文档站与插件的 `/qv` 斜杠菜单共用这一份代码，不会在别处重复维护。

## 复制模板

<!-- docs-only:start -->
点击下方代码块右上角的「复制」按钮复制模板代码；复制操作不会向你的笔记写入任何内容。
<!-- docs-only:end -->

{{example:basic-template.js}}

模板默认随机查询五个块，并把查询到的块 ID 返回给思源渲染。

## 插入嵌入块

两种方式任选其一：

1. **斜杠菜单**：在文档中键入 `/qv`（或 `/queryview`），选择「Query View 基本模板」，插件会把模板作为嵌入块插入当前文档。
2. **手动插入**：新建一个嵌入块（嵌入块类型的块），把上面复制的代码完整粘贴进去。嵌入块内容以 `//!js` 开头时，思源会将其作为 JavaScript 执行。

## 运行

嵌入块插入后会自动执行。看到随机展示的五个块即为成功。如果没有反应，先检查代码是否以 `//!js` 开头，再查看控制台报错（排查建议见「外部编辑器与调试」）。

## 改造模板

模板中有两段被注释的代码：`Query.DataView(protyle, item, top)` 与 `dv.addlist(blocks)` / `dv.render()`。

- **使用 DataView 渲染视图**：注释掉 `return blocks.pick('id');`，取消注释 DataView 两行，模板就会把查询结果渲染为一个列表视图。注意 `protyle`、`item`、`top` 三个参数永远固定不动。
- **查询其他内容**：修改 `Query.sql` 中的 SQL 语句，或改用 `Query.backlink`、`Query.tag` 等封装查询（见「Query 查询」主题）。

想直接看各种效果，可以打开「案例总览」，找到最接近你需求的案例，复制并改造。
