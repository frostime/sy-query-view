---
title: N4 Query&View 对齐性问题报告
description: 对照运行时实现、TypeScript 声明、JSDoc、生成器和参考文档形成的问题与处置记录。
updated: 2026-08-25
---

# N4 对齐性问题报告

## 结论

A1 和 A2 已建立并通过：生成物检查能在漂移时非零退出，Node 断言直接加载 `src/core/proxy.ts` 的纯 Proxy 逻辑。审计中发现的问题分为三类：

- 已在本批次修复并重新生成文档的对齐问题；
- 已报告、需要用户/后续节点决定的公共语义或类型问题；
- 生成器当前覆盖边界，暂不在本批次改动。

本报告不把 `docs/en_US/agent-ref/*.md` 当作独立真相源；文档证据均追溯到源码、声明或生成器。

## 已处置问题

| 编号 | 发现与证据 | 处置/验证 |
| --- | --- | --- |
| R-01 | `src/core/proxy.ts` 的 `wrapList` 快速路径原先会先命中数组原生 `map`，使 `case 'map'` 不可达；修复点现为 :282，显式排除 `map`。 | supervisor 修复实现；A2 现断言 `map()` 返回 wrapper 且默认保留回调原始元素。BREAKCHANGE §3 已记录。 |
| R-02 | 同样的可达性问题存在于 `concat`、`toSorted`；修复点现为 `src/core/proxy.ts:282`，接口声明现为 :114-120。 | supervisor 修复实现并同步 d.ts；A2 断言两者返回 wrapper。 |
| R-03 | `scripts/gen-agent-ref.mjs` 的旧 `KNOWN_NOTES` 曾继续警告已修复的 keywordDoc、columns flex、echartsTree layout、pick 类型。 | 已清理并在 :111-118 写维护规则；重新生成的文档只保留仍成立的 hms、render 副作用、details raw HTML 警示。 |
| R-04 | `DataView.replaceView` 失败分支返回 `null` 或裸 `return`，原声明固定 `HTMLElement`。 | supervisor 将源码和导出声明改为 `HTMLElement | null`（`src/core/data-view.ts:467`、`types/core/data-view.d.ts:67`），行为未变，文档同步。 |
| R-05 | `nearby` 运行时字段 `id` 是 `BlockId`，旧返回类型写成 `Block`（`src/core/query.ts:779-791`）。 | supervisor 将源码返回类型改为 `BlockId`，并重新导出声明和文档。 |
| R-06 | `fb2p` 实现按首元素支持 `BlockId[]`，但参数曾仅声明 `Block[]`（`src/core/query.ts:984-998`）。 | supervisor 将签名改为 `Block[] | BlockId[]`，内部断言同步；文档已重生成。 |
| R-07 | `keywordDoc` 实际经 `Query.getBlocksByIds` 返回 wrapper，旧源码显式 `Block[]` 注解会压低推导结果（`src/core/query.ts:909-914`）。 | 显式注解已移除，当前声明为 `Promise<any[] | IWrappedList<IWrappedBlock>>`；`any[]` 空数组分支和动态 `keywords` 字段仍列入残余类型判断。 |
| R-08 | `src/core/query.ts` 原 `lastWeek` JSDoc 写 “next week”，实现按函数名返回上周。 | 已将注释改为 “last week”，生成 `query-api.md` 并通过 A1。 |
| R-09 | `gpt` JSDoc 使用 `@param prompt`，源码参数名是 `input` 且也接受消息数组（`src/core/query.ts:1127`）。 | 注释改为 `input` 并说明两种输入，文档已重生成。 |
| R-10 | `getBlocksByIds` 注释曾称始终返回普通 Block 数组，同时返回段又称 wrapped blocks（`src/core/query.ts:478-488`）。 | 注释统一为 wrapped blocks，文档已重生成。 |
| R-11 | `IWrappedList` 第二个 `pick` overload 曾没有 JSDoc，生成器会输出未验证警示。 | 已补充 `src/core/proxy.ts:77` 注释；当前生成物无 No JSDoc 警示。 |
| R-12 | `Utils.markdown`、`Utils.Date`、`Utils.asMap`、`Utils.openBlock` 原来缺少可搬运的 JSDoc。 | 已补充源码注释并重新生成；参考文档现在有对应说明。 |
| R-13 | `addrow` 的 `@alias concat: ...` 被生成器当作完整 alias 文本，曾产生错误名称。 | 已改为 `@alias concat`（`src/core/proxy.ts:138`），生成文档名称正确。 |

## 已确认与待后续处理

> 表中保留已处置项，作为本次问题发现与闭环的完整审计轨迹；“已处理”表示不再是当前阻塞项。

| 编号 | 不一致与证据 | 建议归宿/状态 |
| --- | --- | --- |
| O-01 | `sorton` 接口/JSDoc 曾写默认 `asc`，实现参数默认 `desc`（`src/core/proxy.ts:86-90,367-387`）。 | 用户已拍板以实现为准；JSDoc 已统一为 `desc`，文档已重生成，零行为变化。 |
| O-02 | `Query.sql(fmt, false)` 直接返回 raw `data`（`src/core/query.ts:537-543`），曾被声明固定为 wrapper。 | 已改为条件返回类型 `<W extends boolean = true>`；`types/core/query.d.ts:216` 与文档同步，运行时行为未变。 |
| O-03 | `childDoc`、`fb2p`、`pruneBlocks` 默认调用 `wrapList`，元素是 `IWrappedBlock`，曾宽化为 `IWrappedList<Block>`。 | 已通过 `wrapList` overload 和 Query 声明同步为 `IWrappedList<IWrappedBlock>`；当前 d.ts 为 `types/core/query.d.ts:293,419,447`。 |
| O-04 | `keywordDoc` 当前返回类型已保留 wrapper 联合，但 `any[]` 来自空数组分支，`keywords` 动态字段也未在返回元素类型中表达（`src/core/query.ts:872-917`、`types/core/query.d.ts:370`）。 | 低优先级类型精化；按 I-83 只在能减少 Agent 误导/负担时处理。 |
| O-05 | `asMap` 运行时默认 `key='id'`（`src/core/proxy.ts:302-309`），曾在接口和 d.ts 中要求 `key` 必传。 | 已改为 `key?: string` 并在 JSDoc 注明默认 `id`；文档同步。 |
| O-06 | `IWrappedBlock` 运行时兼容 `tourl`、`tolink`、`toref`（`src/core/proxy.ts:194-206`），曾未出现在声明/参考。 | 已作为 runtime-compatible alias 补进接口、d.ts 和生成文档。 |
| O-07 | Query 的小写 alias 由变量循环生成（`src/core/query.ts:1259-1264`），生成器只解析字面量正则（`scripts/gen-agent-ref.mjs:162-170`），因此如 `childdoc`、`boxname` 不会列入参考。 | 已确认的生成器限制；后续决定增强静态提取或明确参考只列静态 alias。 |
| O-08 | DataView 直接赋值 alias 与 getter 不在生成器 `getMethods()` 范围：运行时 `adddisposer/addView/addelement/addele/removeview/replaceview`（`src/core/data-view.ts:371,416-420,457,503`），getter `root_id/embed_id`（`:191-200`）；生成器只取 `types/core/data-view.d.ts` 的 methods（`scripts/gen-agent-ref.mjs:238-239`）。 | 确定公共范围后再扩展生成器；自定义视图 alias 还需运行时复测。 |
| O-09 | 自定义视图名称/alias 来自运行时配置（`src/core/data-view.ts:143-187`），构建期不可能列出完整集合。 | 文档说明构建时只覆盖内建注册点，完整集合归运行时复测/人工判断。 |
| O-10 | Wrapped 完整接口文本直接从源码接口读取（`scripts/gen-agent-ref.mjs:282-303`），而 Query/DataView 方法签名从导出的 d.ts 读取。 | 若要求三来源机械一致，后续改 generator；本批次仅按委托限制增加 `--check`，不重构现有逻辑。 |
| O-11 | 生成器文件头历史说明写 `wrapped-list.md`，实际输出数组写 `wrapped.md`（`scripts/gen-agent-ref.mjs:16,333`）。 | 低风险文案清理；不影响当前产物。 |

## 生成器与产物当前状态

- `scripts/gen-agent-ref.mjs --check`：当前产物一致，退出码 `0`。
- `docs/en_US/agent-ref/` 当前四份产物由生成器重建，无手工改动。
- `KNOWN_NOTES` 中仅保留当前仍为真的行为警示；N6 已修复项目不再注入误导文本。
- A2 不依赖思源运行时；DOM、Kernel、Lute、ECharts 和生命周期项目已转 I-50/人工复核。
