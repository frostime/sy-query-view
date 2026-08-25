---
title: I-40 结项复核对象清单（定稿）
description: Query&View 语义对齐的自动、运行时和人工复核边界。
updated: 2026-08-25
---

# I-40 结项复核对象清单

行号按本次复核时的工作树记录；源码后续改动后应以符号和相邻代码重新定位。这里的“wrapper”指 `IWrappedList` / `IWrappedBlock` 包装对象。

## 复核入口

| 入口 | 验证对象 | 通过条件 |
| --- | --- | --- |
| `pnpm gen-ref:check` | `docs/en_US/agent-ref/*.md` | 生成器预期内容与四份产物一致，退出码 `0`；不覆盖文件 |
| `node scripts/check-agent-alignment.mjs` | `src/core/proxy.ts` 的纯 Proxy 逻辑 | 所有断言通过，退出码 `0`；不启动思源、DOM 或网络 |
| 思源运行时复测（I-50） | DOM、Kernel、Lute、ECharts、DataView 生命周期 | 在真实插件环境观察用户可见结果和副作用 |

## Node 可自动断言（A2）

### Wrapped list 基础契约

- `src/core/proxy.ts:271-290`：`wrapList` 返回数组代理，`unwrap()` 返回底层数组，`groupby` 等包装方法可访问。
- `src/core/proxy.ts:282`：Proxy 快速路径不能吞掉下方对原生数组方法的覆盖分支；当前排除 `filter`、`slice`、`map`、`concat`、`toSorted`。
- `src/core/proxy.ts:293-320`：
  - `pick('id')` 返回标量数组且仍是 wrapper；
  - `pick('id', 'content')` 返回对象数组且仍是 wrapper。
- `src/core/proxy.ts:397-414`：按属性分组，分组值仍为 wrapper。

### 链式和原生方法覆盖

- `src/core/proxy.ts:416-430`：`filter`、`slice` 返回 wrapper。
- `src/core/proxy.ts:431-452`：`map` 返回 wrapper；默认 `useWrapBlock=false`，元素严格保留回调返回值，不额外包裹；显式 `false` 后仍可继续链式操作。
- `src/core/proxy.ts:359-365`：`toSorted` 返回 wrapper。
- `src/core/proxy.ts:472-478`：`concat` 返回 wrapper。
- 这些对象与链式断言均在 `scripts/check-agent-alignment.mjs` 中执行；脚本通过 TypeScript 转译加载实际 `proxy.ts`，不是复制实现的测试替身。

### 生成物一致性（A1）

- `scripts/gen-agent-ref.mjs:331-357`：`--check` 对 `query-api.md`、`dataview.md`、`wrapped.md`、`types.md` 做内存生成结果比对；缺失或漂移必须非零退出。
- 生成器正常模式的产物纪律仍由源码注释、`types/core/*.d.ts` 和注册调用点驱动；参考文档不得手改。

## 需要思源运行时复测（I-50）

### Query / Kernel 数据边界

- `src/core/query.ts:475`：`Query.request` 是思源 Kernel 请求，不是任意 HTTP。
- `src/core/query.ts:484-488`：`getBlocksByIds` 的返回 wrapper 和元素包装状态。
- `src/core/query.ts:537-543`：`Query.sql(fmt, wrap=false)` 的 raw 数组与 `wrap=true` 的 wrapper 分支；条件返回类型已同步到声明，仍可在真实 Kernel 环境复测。
- `src/core/query.ts:738-753`：`childDoc` 的 Kernel 路径、文档排序和 wrapper 元素；声明现已为 `IWrappedList<IWrappedBlock>`。
- `src/core/query.ts:779-803`：`nearby` 的层级筛选、方向/数量边界和 Kernel 返回字段。
- `src/core/query.ts:864-914`：`keywordDoc` 的 `relation`、旧 `join` 映射、空输入、SQL 文档级聚合、`keywords` 附加字段和返回顺序。
- `src/core/query.ts:998-1092`：`fb2p` 的 Block/BlockId 输入、Kernel 树信息和返回 wrapper；声明现已同步。
- `src/core/query.ts:84-181`、`:1119-1121`：`pruneBlocks` 的 root/leaf、advanced 面包屑路径和返回 wrapper；声明现已同步。

### DataView / DOM / 生命周期

- `src/core/data-view.ts:88-140`、`:143-187`、`:202-268`：内建组件注册、大小写与 `add` 别名、用户自定义视图注册；需真实 DataView 实例验证。
- `src/core/data-view.ts:191-200`：`root_id` / `embed_id` 生命周期值。
- `src/core/data-view.ts:406-430`、`:440-503`：元素包装、移除、替换、disposer 以及失败分支返回值。
- `src/core/data-view.ts:526-537`：`details` 的 raw `innerHTML`、HTMLElement 内容和默认 `open=true`。
- `src/core/data-view.ts:679-708`：`columns` 的每列 `--flex-grow`、gap、最小宽度。
- `src/core/data-view.ts:1097-1238`：`echartsTree` 的 `layout`、orient、tooltip 和事件。
- `src/core/data-view.ts:1250-1413`：`echartsGraph` 不修改调用者传入的 link 对象及图表结果。
- `src/core/data-view.ts:1416-1504`：`render` 的 embed 持久化请求、innerText 转换和事件清理；不能用 Node 脚本替代验证。

## 需要人工判断或后续处置

### 公共语义 / 类型

- `src/core/proxy.ts:86-90` 与 `:367-387`：`sorton` 实现默认 `desc`，接口/JSDoc 曾写默认 `asc`；用户已拍板以实现为准，注释和生成文档现已统一为 `desc`。
- `src/core/query.ts:537-543` 与 `types/core/query.d.ts:216`：`Query.sql` 已用条件返回类型表达 `wrap=false` 的 raw 数组与默认 wrapper 分支；仍需真实 Kernel 复测。
- `src/core/query.ts:738-753`、`:1092`、`:1119-1121` 与 `types/core/query.d.ts:293,419,447`：childDoc、fb2p、pruneBlocks 的 wrapper 元素声明已同步；运行时仍需 I-50 复测。
- `src/core/query.ts:872-917` 与 `types/core/query.d.ts:370`：`keywordDoc` 已保留 wrapper 联合返回类型，但空数组分支造成 `any[]`，且动态 `keywords` 字段的结构仍未表达。
- `src/core/proxy.ts:302-309` 与 `types/core/proxy.d.ts:61`：`asMap` 默认 key 为 `id`，声明现已改为可选并写明默认值。
- `src/core/proxy.ts:194-206` 与 `types/core/proxy.d.ts:10-22`：`tourl`、`tolink`、`toref` 已作为运行时兼容别名进入声明和生成文档。

### 生成器覆盖边界

- `src/core/query.ts:1259-1264` 与 `scripts/gen-agent-ref.mjs:162-170`：Query/Utils 的变量驱动小写 alias（如 `childdoc`、`boxname`）未被字面量正则提取。
- `src/core/data-view.ts:371,416-420,457,503` 与 `scripts/gen-agent-ref.mjs:238-275`：直接赋值 alias（`addView`、`addele`、`adddisposer`、`removeview`、`replaceview`）和 getter (`root_id`、`embed_id`) 不在当前 `getMethods()` 生成范围；确认哪些应进入 Agent 参考体系。
- `src/core/data-view.ts:143-187`：自定义视图名称和 alias 来自运行时配置，构建期不能列出完整集合；需要运行时复测/文档边界决定。
- `scripts/gen-agent-ref.mjs:282-303`：Wrapped 模块的完整接口文本直接来自 `src/core/proxy.ts`，而 Query/DataView 签名来自 `types/core/*.d.ts`；若三来源契约要求统一，需后续改生成器。
- `scripts/gen-agent-ref.mjs:16` 与 `:333`：文件头历史注释写 `wrapped-list.md`，实际产物为 `wrapped.md`；不影响运行，但应在后续维护时统一命名。

### 当前已复核并处置

- `src/core/proxy.ts` 的 `map`、`concat`、`toSorted` 原生 Array 快速路径死代码已修复；A2 已覆盖。
- `src/core/proxy.ts` 的 `map` 默认元素不包裹，接口/实现/生成文档已同步。
- `src/core/data-view.ts:467` 的 `replaceView` 类型已改为 `HTMLElement | null`，行为未改。
- `src/core/query.ts:782-784` 的 `nearby` id 已改为 `BlockId`。
- `src/core/query.ts:984` 的 `fb2p` 输入已改为 `Block[] | BlockId[]`。
- `keywordDoc` 的显式 `Block[]` 返回注解已移除，生成声明保留 wrapper 联合。
- N6 已修复的 KNOWN_NOTES 已删除；当前保留的 hms、render 副作用、details raw HTML 警示与源码事实一致。
- `lastWeek`、`gpt`、`getBlocksByIds` 等发现的注释措辞已同步源码并重新生成参考文档。
