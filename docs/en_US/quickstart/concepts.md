# Basic Concepts: What is a JS Embedded Block?

SiYuan's default embedded blocks use SQL syntax to query blocks, which are then automatically rendered into content.

```sql
select * from blocks order by random() limit 1;
```

A JS embedded block is a special usage where, when the content of the embedded block starts with `//!js`​, SiYuan treats the following code as JavaScript and executes it automatically.

A JS embedded block's code is passed the following variables:

* Protyle: The protyle object of the document where the embedded block is located.
* item: The HTML element object of the embedded block itself.
* top: A special identifier, usually can be ignored.

The code of a JS embedded block theoretically needs to **return a list of Block IDs** (`BlockID[]`​), and the blocks corresponding to these IDs will be rendered in the embedded block.

You can try copying the following code into an embedded block; it will render the document where the embedded block is located.

```js
//!js
return [protyle.block.rootID]
```

💡 This plugin provides a series of features to enhance the functionality of JS embedded blocks. The core of the plugin is to pass a `Query`​ API within the embedded block, with the following relationship:

![Query & DataView relationship](../../assets/query-dataview-overview.svg)

For the complete interface file, please visit: [https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)

> 🖋️ **Using Skeleton Template**
>
> Using the Query View requires writing JavaScript code within an embedded block. You can quickly insert a skeleton template by typing `/qv`​ in the editor, eliminating the need to start from scratch each time with the usual program structures like `//!js...`​, allowing you to focus on writing the core logic.
>
> ![image](../../assets/image-20241214183258-vdarhfx.png)
>
> The default basic template function is to randomly query five blocks, which you can modify to suit your desired query logic.
>
> See the "Start from the Template" page for the full template code and step-by-step instructions.
