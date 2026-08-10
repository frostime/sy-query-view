# Examples

This page collects all runnable examples shipped with the plugin. The single source of the example code is the repository's `public/example/` directory (installed at the plugin's `example/` directory), shipped with the plugin release; this page never copies the code — the code blocks are read from / generated from that directory by the documentation site and the README.

Usage: copy an example's code into an embedded block (the content starts with `//!js`) and run it to see the effect. Some examples have already appeared in the documentation above.

> 💡 All example code is shipped with the plugin in the plugin's `example/` directory; every example below provides its complete code.

## Example List

| File | Title | Description | Tags |
|---|---|---|---|
| exp-month-todo.js | Unfinished TODOs This Month | Query all unfinished TODO lists of this month | task, todo, list |
| exp-child-docs.js | List Sub-documents | List all the sub-documents of the current document; similar to software such as Notion | doc, list |
| exp-avs-under-root-doc.js | Summarize Attribute Views | Query all attribute views under the current document and summarize them in an embedded block | attribute-view, embed |
| exp-doc-backlinks-table.js | Backlink Table of the Current Document | Display backlinks of the current document in a table format | backlink, table |
| exp-doc-backlinks-grouped.js | Backlinks Grouped by Type | View the backlinks of the current document grouped by the type of reference blocks, displayed in a collapsible list | backlink, list |
| exp-outline.js | Document Outline | Query the outline of the current document and display it in a tree structure | outline, tree |
| exp-list-tags.js | Tags Card View | Query and display all tags in card view | tag, card |
| exp-latest-update-doc.js | Recently Updated Documents | Displays the 32 most recently updated documents | doc, list, superblock |
| exp-today-updated.js | Documents Updated Today | Query all documents updated today and display them in a list | doc, date, state |
| exp-created-docs.js | Docs Created per Month | Query the number of documents created each month and display them using an echarts line chart | doc, echarts, chart |
| exp-sql-executor.js | SQL Executor | Enter an SQL statement in the input box, click the execute button, and display the execution result in a table format | sql, table |
| exp-gpt-chat.js | Chat with GPT | A very simple ChatGPT dialog box, using the GPT API set internally in SiYuan | gpt, chat |
| exp-doc-backlinks-graph.js | Backlink Graph | Using Echarts Graph to display backlink reference blocks of the current document | backlink, echarts, graph |
| exp-show-asset-images.js | View Images under assets | View all images in the assets directory by pagination | asset, image, paging |
| exp-daily-sentence.js | Daily Sentence | Daily sentence; this example uses state, so only one quote is displayed per day | quote, state |
| exp-gpt-translate.js | GPT Translate | Randomly select a piece of text from SiYuan and translate it into English using GPT, with the GPT API set internally in SiYuan | gpt, translate |
| exp-doc-tree.js | Document Tree | Query the document tree structure under the current document and display it using a nested list; the maximum depth is controlled by the MAX_DEPTH variable | doc, tree, list |
| exp-month-todo-kanban.js | Monthly Task Kanban | Query unfinished Tasks for each month and display them in summary on the board | task, kanban |
| exp-month-todo-timeline.js | Unfinished Tasks Timeline | Query all unfinished task blocks and arrange them horizontally grouped by monthly timelines | task, timeline |

## exp-month-todo

Query all unfinished TODO lists of this month.

{{example:exp-month-todo.js}}

## exp-child-docs

List all the sub-documents of the current document; similar to software such as Notion.

{{example:exp-child-docs.js}}

## exp-avs-under-root-doc

Query all attribute views under the current document and summarize them in an embedded block.

{{example:exp-avs-under-root-doc.js}}

## exp-doc-backlinks-table

Display backlinks of the current document in a table format.

![image](../../assets/image-20241210183914-5nm5w4r.png)

{{example:exp-doc-backlinks-table.js}}

## exp-doc-backlinks-grouped

View the backlinks of the current document grouped by the type of reference blocks, displayed in a collapsible list.

![image](../../assets/image-20241213161247-f6qm95q.png)

{{example:exp-doc-backlinks-grouped.js}}

## exp-outline

Query the outline of the current document and display it in a tree structure.

![image](../../assets/image-20241210172133-ivjwzpc.png)

{{example:exp-outline.js}}

## exp-list-tags

Query and display all tags in card view.

{{example:exp-list-tags.js}}

## exp-latest-update-doc

Displays the 32 most recently updated documents.

💡 In this code, the special `{{{col }}}` syntax is used. This syntax is the unique super-block Markdown markup syntax of SiYuan, used to create block structures with multiple rows or columns.

![image](../../assets/image-20241213160419-62pwf7s.png)

{{example:exp-latest-update-doc.js}}

## exp-today-updated

Query all documents updated today and display them in a list.

In this example, `state` is used to store the date information. After today, the content of the table will remain unchanged rather than fetching documents updated on a future day. In practice, it is more recommended to use it with a template: configure `now` as the date of the current day when creating, instead of maintaining the date status through `state`.

![image](../../assets/image-20241210172746-kbxtfhr.png)

{{example:exp-today-updated.js}}

## exp-created-docs

Query the number of documents created each month and display them using an echarts line chart.

![image](../../assets/image-20241207010811-8lh25x5.png)

{{example:exp-created-docs.js}}

## exp-sql-executor

Enter an SQL statement in the input box, click the execute button, and display the execution result in a table format.

![image](../../assets/image-20241209005221-qtytbib.png)

{{example:exp-sql-executor.js}}

## exp-gpt-chat

A very simple ChatGPT dialog box, using the GPT API set internally in SiYuan.

> This code uses an API `Query.gpt` that was not mentioned above. For specific usage, please refer to the d.ts file.

![image](../../assets/image-20241210171119-o72dyyd.png)

{{example:exp-gpt-chat.js}}

## exp-doc-backlinks-graph

Using Echarts Graph to display backlink reference blocks of the current document.

![image](../../assets/image-20241211213426-38ws4kk.png)

{{example:exp-doc-backlinks-graph.js}}

## exp-show-asset-images

View all images in the assets directory by pagination.

![image](../../assets/image-20241211225413-fc962d4.png)

{{example:exp-show-asset-images.js}}

## exp-daily-sentence

Daily sentence; this example uses `state`, so only one quote is displayed per day.

> Note: this example uses an API found randomly online, which may not be stable; just consider it a case study.

{{example:exp-daily-sentence.js}}

## exp-gpt-translate

Randomly select a piece of text from SiYuan and translate it into English using GPT, with the GPT API set internally in SiYuan.

{{example:exp-gpt-translate.js}}

## exp-doc-tree

Query the document tree structure under the current document and display it using a nested list; the maximum depth is controlled by the `MAX_DEPTH` variable.

{{example:exp-doc-tree.js}}

## exp-month-todo-kanban

Query unfinished Tasks for each month and display them in summary on the board.

{{example:exp-month-todo-kanban.js}}

## exp-month-todo-timeline

Query all unfinished task blocks and arrange them horizontally grouped by monthly timelines.

{{example:exp-month-todo-timeline.js}}
