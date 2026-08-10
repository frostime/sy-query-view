# API Reference

The precise signatures of the plugin's public API are defined in the shipped type declaration `public/types.d.ts`; this page is only a readable tour and does not copy the type declaration content.

The complete type declaration file is also available on GitHub: [frostime/sy-query-view/public/types.d.ts](https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts).

<!-- docs-only:start -->
## Open or Download the Type Declaration

- **Download types.d.ts**: downloads the type declaration of the currently installed version (file name `sy-query-view@{version}.types.d.ts`).
- **Open locally** (desktop only): opens the type declaration with the command configured in the plugin setting "Open Local Editor".
<!-- docs-only:end -->

## Query

`Query` is the API object passed through by the plugin inside the embedded block. It provides four categories of capabilities:

- **SQL and wrapped queries**: the most general one is `Query.sql(sql)` — pass an SQL statement directly; wrapped queries include `Query.backlink`, `Query.tag`, `Query.task`, `Query.random`, `Query.dailynote`, `Query.childDoc`, `Query.keyword`, `Query.keywordDoc`, `Query.markdown`, etc.
- **Result wrapping**: query results are returned as `IWrappedList<IWrappedBlock>`, which provide convenient members such as `pick` and `aslink` in addition to the basic block attributes.
- **Utility functions**: `Query.Utils` provides time, text, and other common utilities.
- **DataView construction**: `Query.DataView(protyle, item, top)` creates a DataView instance.

See the "Query API" topic for details.

## DataView

`DataView` renders query results as custom views. The workflow is: create an instance → add views → `dv.render()`.

- **Basic components**: `dv.addlist`, `dv.addtable`, `dv.addmd`;
- **Advanced components**: cards, embed, Mermaid series, ECharts series, columns/rows, details, addElement, addDisposer, removeView, replaceView, etc.;
- **Advanced features**: custom view components (`dv.xxx()` / `dv.addxxx()`), `DataView.useState` state persistence, and the view lifecycle.

See the "DataView Views" and "DataView Advanced Features" topics for details.

## IWrappedBlock & IWrappedList

The two core wrapper types of query results:

- `IWrappedBlock`: extends `Block` with convenient properties and conversions, such as `aslink` (SiYuan link), `asurl`, etc.;
- `IWrappedList<T>`: the array type of `IWrappedBlock`, with methods such as `pick(...)` for extracting selected attributes into a new list.

Exact members and signatures are defined in the type declaration.

## Other Basic Types

`Block`, `BlockType`, `Notebook`, `DocumentId`, `BlockId`, `SiYuanDate`, and other basic types are also defined in the type declaration.
