# 基本概念：什么是 JS 嵌入块

思源默认的嵌入块使用 SQL 语法，查询到 block 之后，会自动放入嵌入块渲染成为内容。

```sql
select * from blocks order by random() limit 1;
```

JS 嵌入块则是另一种特殊的用法，当嵌入块里面的内容以 `//!js`​ 为开头的时候，思源会将后面的代码内容视为 javascript 代码，并自动执行。

一个 JS 嵌入块的代码，会传入以下的变量：

* Protyle：嵌入块所在的文档的 protyle 对象
* item：嵌入块自身的 HTML 元素对象
* top：一个特殊的标识符，一般可以无视

而一个 JS 嵌入块的代码，理论上需要 **return 一个 Block ID 的列表**（`BlockID[]`​），这些 ID 对应的块就会被渲染到嵌入块中。

你可以尝试将如下的代码复制到嵌入块中，它会渲染当前嵌入块所在的文档。

```js
//!js
return [protyle.block.rootID]
```

💡 本插件提供了一系列功能，来增强 JS 嵌入块的功能。插件的核心是在嵌入块当中透传一个 `Query`​ API，大致关系如下。

![Query 与 DataView 关系图](../../assets/query-dataview-overview.svg)

完整的接口文件请查看：[https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)

> 🖋️ **使用骨架模板**
>
> 使用 Query View 需要在嵌入块中编写 js 代码，你可以在编辑器中输入 `/qv`​ 快速插入一个骨架模板，无需每次都从头编写 `//!js...`​ 这些常规的程序结构，而专注与编写核心逻辑。
>
> ![image](../../assets/image-20241214183258-vdarhfx.png)
>
> 默认的基础模板的功能是随机查询五个块，你可以自行修改成你想要的查询逻辑。
>
> 模板的完整代码与分步操作见「从模板开始」页面。
