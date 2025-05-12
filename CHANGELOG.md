# Changelog

### v1.2.1 适配 SiYuan 3.1.29 版本

* `Query.task` API 适配 3.1.29 对列表符号的变更，自动按照思源版本适配
* `Query.tag` API 新增 `match` 选项，支持 `=` 和 `like` 两种匹配模式
* 改进 `Query.markdown` 函数的实现方案

### v1.1.0 ~ v1.2.0 的变化

v1.1.0 版本中，由于存在和思源的不兼容性问题，插件暂时下架。

v1.2.0 版本后，插件将不兼容思源的 3.1.24,25 版本。请选择其他的思源的版本来使用 Query View 插件。

✨ **新增功能**

1. DataView 中增加 `Card` 组件
2. DataView 的 `Markdown` 组件支持渲染数学公式
3. 优化了 DataView 中的 `Embed` 组件
4. 增加了 `Query.pruneBlocks` 函数，用于合并查询过程中具有父子关系的块，从而实现查询结果的去重
5. Example 中增加了 `list-tag` 的案例

⚠️ **API 变动**

Query 中部分 API 的参数用法发生变动；旧的用法依然兼容，但是会提出警示，建议迁移到新的用法；具体情况请参考相关文档。

1. `Query.attr`

    ```javascript
    Query.attr("name", "value", "=", 10); // 弃用
    Query.attr("name", "value", { valMatch: "=", limit: 10 }); // 推荐
    ```
2. `Query.tag`

    ```javascript
    Query.tag("tag1", "or", 10); // 弃用
    Query.tag("tag1", { join: "or", limit: 10 }); // 推荐
    ```
3. `Query.task`

    ```javascript
    Query.task("2024101000", 32); // 弃用
    Query.task({ after: "2024101000", limit: 32 }); // 推荐
    ```
4. `Query.keyword`/ `Query.keywordDoc`

    ```
    Query.keyword("keyword", "or", 10); // 弃用
    Query.keyword("keyword", { join: "or", limit: 10 }); // 推荐
    ```
5. `Query.dailynote`

    ```javascript
    Query.dailynote("20231224140619-bpyuay4", 32); // 弃用
    Query.dailynote({ notebook: "20231224140619-bpyuay4", limit: 32 }); // 推荐
    ```