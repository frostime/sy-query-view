# API 参考

插件对外 API 的精确签名以随插件发布的类型声明 `public/types.d.ts` 为准；本页只提供可读导览，不复制类型声明的内容。

完整类型声明文件也可在 GitHub 查看：[frostime/sy-query-view/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts)。

<!-- docs-only:start -->
## 打开或下载类型声明

- **下载 types.d.ts**：下载当前安装版本的类型声明文件（文件名 `sy-query-view@{版本}.types.d.ts`）。
- **在本地打开**（仅桌面端）：用插件设置中「打开本地编辑器」配置的命令打开类型声明文件。
<!-- docs-only:end -->

## Query

`Query` 是插件在嵌入块中透传的 API 对象，主要分为四类能力：

- **SQL 与封装查询**：最通用的是 `Query.sql(sql)`，直接把 SQL 语句传入即可；另有 `Query.backlink`、`Query.tag`、`Query.task`、`Query.random`、`Query.dailynote`、`Query.childDoc`、`Query.keyword`、`Query.keywordDoc`、`Query.markdown` 等封装查询。
- **结果包装**：查询结果返回 `IWrappedList<IWrappedBlock>`，除了块的基本属性外还带 `pick`、`aslink` 等便捷成员。
- **工具函数**：`Query.Utils` 提供时间、文本等常用工具。
- **DataView 构造**：`Query.DataView(protyle, item, top)` 创建 DataView 实例。

详细说明见「Query 查询」主题。

## DataView

`DataView` 把查询结果渲染为自定义视图，使用流程是：创建实例 → 添加视图 → `dv.render()`。

- **基础组件**：`dv.addlist`、`dv.addtable`、`dv.addmd`；
- **高级组件**：cards、embed、mermaid 系列、echarts 系列、columns/rows、details、addElement、addDisposer、removeView、replaceView 等；
- **高级特性**：自定义视图组件（`dv.xxx()` / `dv.addxxx()`）、`DataView.useState` 状态持久化、视图生命周期。

详细说明见「DataView 视图」与「DataView 高级特性」主题。

## IWrappedBlock & IWrappedList

查询结果的两个核心包装类型：

- `IWrappedBlock`：在 `Block` 基础上增加便捷属性与转换能力，例如 `aslink`（思源链接）、`asurl` 等；
- `IWrappedList<T>`：`IWrappedBlock` 的数组类型，带 `pick(...)` 等方法，可从列表中提取指定属性组成新列表。

精确成员与签名以类型声明为准。

## 其他基础类型

`Block`、`BlockType`、`Notebook`、`DocumentId`、`BlockId`、`SiYuanDate` 等基础类型同样定义在类型声明中。
