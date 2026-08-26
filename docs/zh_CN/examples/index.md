# 案例总览

本页汇总随插件发布的全部可运行案例。案例代码的唯一来源是仓库 `public/example/`（安装后位于插件目录的 `example/` 下），随插件版本一起发布；本页不复制代码，代码块由文档站和 README 从该目录自动读取/生成。

使用方式：把案例代码复制到一个嵌入块（内容以 `//!js` 开头）并运行即可看到效果。部分案例在上面的文档中其实已经出现过了。

> 💡 所有案例代码都随插件发布在插件目录 `example/` 中；下方每个案例都提供了完整的代码。

## 案例列表

| 文件 | 标题 | 说明 | 标签 |
|---|---|---|---|
| exp-month-todo.js | 本月待办列表 | 查询本月所有未完成的 TODO 列表 | task, todo, list |
| exp-month-dailynotes.js | 本月日记 | 按日记日期查询本月截至今天的日记文档 | dailynote, date, list |
| exp-child-docs.js | 子文档列表 | 列出当前文档的所有子文档，效果类似 Notion 等软件 | doc, list |
| exp-avs-under-root-doc.js | 属性视图汇总 | 查询所在文档下所有的属性视图（Attribute View），然后汇总显示在嵌入块中 | attribute-view, embed |
| exp-doc-backlinks-table.js | 当前文档反向链接表格 | 以表格的形式显示当前文档的回链 | backlink, table |
| exp-doc-backlinks-grouped.js | 反向链接分组展示 | 按照引用块的类型，分组查看当前文档的反向链接，并放入折叠列表中展示 | backlink, list |
| exp-outline.js | 文档大纲 | 查询当前文档的大纲，并以树状结构展示 | outline, tree |
| exp-list-tags.js | 标签卡片视图 | 查询并以卡片视图的形式展示所有的标签（tags） | tag, card |
| exp-latest-update-doc.js | 最近更新的文档 | 展示最近更新的 32 篇文档 | doc, list, superblock |
| exp-today-updated.js | 今天更新的文档 | 查询今天更新的所有文档，并以列表的形式展示 | doc, date, state |
| exp-created-docs.js | 每月创建文档数曲线 | 查询每个月创建的文档的数量，并使用 echarts 折线图展示出来 | doc, echarts, chart |
| exp-sql-executor.js | SQL 查询器 | 在输入框中输入 SQL 语句，点击执行按钮，将执行结果以表格的形式展示 | sql, table |
| exp-gpt-chat.js | ChatGPT 对话 | 一个非常简单的 ChatGPT 对话框，使用思源内部设置的 GPT API | gpt, chat |
| exp-doc-backlinks-graph.js | 反链关系图 | 使用 Echarts Graph 展示当前文档的反链引用块 | backlink, echarts, graph |
| exp-show-asset-images.js | 资源目录图片查看 | 分页查看 assets 目录下所有的图片 | asset, image, paging |
| exp-daily-sentence.js | 每日一句 | 每日一句，这个案例中用到了 state，所以每天只会显示一条句子 | quote, state |
| exp-gpt-translate.js | GPT 翻译 | 随机从思源中选取一段文字，然后使用 GPT 翻译成英文，使用思源内部设置的 GPT API | gpt, translate |
| exp-doc-tree.js | 文档树 | 查询当前文档下属的文档树结构，并使用嵌套列表展示；最大深度由 MAX_DEPTH 变量控制 | doc, tree, list |
| exp-month-todo-kanban.js | 每月任务看板 | 查询每个月尚未完成的 Task，汇总显示在看板上 | task, kanban |
| exp-month-todo-timeline.js | 未完成任务时间线 | 查询所有未完成的任务块，以月份时间线分组横向排列 | task, timeline |

## exp-month-todo

查询本月所有未完成的 TODO 列表。

{{example:exp-month-todo.js}}

## exp-month-dailynotes

按日记日期查询本月截至今天的日记文档，结果从新到旧排列。

{{example:exp-month-dailynotes.js}}

## exp-child-docs

列出当前文档的所有子文档，效果类似 Notion 等软件。

{{example:exp-child-docs.js}}

## exp-avs-under-root-doc

查询所在文档下所有的属性视图（Attribute View），然后汇总显示在嵌入块中。

{{example:exp-avs-under-root-doc.js}}

## exp-doc-backlinks-table

以表格的形式显示当前文档的回链。

![image](../../assets/image-20241210183914-5nm5w4r.png)

{{example:exp-doc-backlinks-table.js}}

## exp-doc-backlinks-grouped

按照引用块的类型，分组查看当前文档的反向链接，并放入折叠列表中展示。

![image](../../assets/image-20241213161247-f6qm95q.png)

{{example:exp-doc-backlinks-grouped.js}}

## exp-outline

查询当前文档的大纲，并以树状结构展示。

![image](../../assets/image-20241210172133-ivjwzpc.png)

{{example:exp-outline.js}}

## exp-list-tags

查询并以卡片视图的形式展示所有的标签（tags）。

{{example:exp-list-tags.js}}

## exp-latest-update-doc

展示最近更新的 32 篇文档。

💡 本代码中用到了特殊的 `{{{col }}}` 语法，这种语法为思源特有的超级块 Markdown 标记语法，用于创建多行、多列的块结构。

![image](../../assets/image-20241213160419-62pwf7s.png)

{{example:exp-latest-update-doc.js}}

## exp-today-updated

查询今天更新的所有文档，并以列表的形式展示。

这个案例中，使用 `state` 来存储日期信息，过了今天之后，表格的内容将一直保持不变，而非获取未来某天更新的文档。实际使用过程中，其实更加建议配合模板使用，在创建的时候直接配置 `now` 为当天的日期，而非通过 `state` 来维护日期状态。

![image](../../assets/image-20241210172746-kbxtfhr.png)

{{example:exp-today-updated.js}}

## exp-created-docs

查询每个月创建的文档的数量，并使用 echarts 折线图展示出来。

![image](../../assets/image-20241207010811-8lh25x5.png)

{{example:exp-created-docs.js}}

## exp-sql-executor

在输入框中输入 SQL 语句，点击执行按钮，将执行结果以表格的形式展示。

![image](../../assets/image-20241209005221-qtytbib.png)

{{example:exp-sql-executor.js}}

## exp-gpt-chat

一个非常简单的 ChatGPT 对话框，使用思源内部设置的 GPT API。

> 这个代码用到了一个上面没有提到的 `Query.gpt` API，具体用法请参考 d.ts 文件。

![image](../../assets/image-20241210171119-o72dyyd.png)

{{example:exp-gpt-chat.js}}

## exp-doc-backlinks-graph

使用 Echarts Graph 展示当前文档的反链引用块。

![image](../../assets/image-20241211213426-38ws4kk.png)

{{example:exp-doc-backlinks-graph.js}}

## exp-show-asset-images

分页查看 assets 目录下所有的图片。

![image](../../assets/image-20241211225413-fc962d4.png)

{{example:exp-show-asset-images.js}}

## exp-daily-sentence

每日一句，这个案例中用到了 `state`，所以每天只会显示一条句子。

> 注意：这个例子中用到了随便从网上找到的 API，不一定稳定，当个案例看看就行。

{{example:exp-daily-sentence.js}}

## exp-gpt-translate

随机从思源中选取一段文字，然后使用 GPT 翻译成英文，使用思源内部设置的 GPT API。

{{example:exp-gpt-translate.js}}

## exp-doc-tree

查询当前文档下属的文档树结构，并使用嵌套列表展示；最大深度由 `MAX_DEPTH` 变量控制。

{{example:exp-doc-tree.js}}

## exp-month-todo-kanban

查询每个月尚未完成的 Task，汇总显示在看板上。

{{example:exp-month-todo-kanban.js}}

## exp-month-todo-timeline

查询所有未完成的任务块，以月份时间线分组横向排列。

{{example:exp-month-todo-timeline.js}}
