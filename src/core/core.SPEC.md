# core 模块契约

> 状态：草案 v0（供评审，未定稿）
>
> 本文只记录**无法从代码直接推断**的行为约束、兼容政策与边界规则。API 签名以 tsc 导出为准；
> 行为说明的唯一权威通道是源码 JSDoc（生成链：JSDoc → `docs/en_US/agent-ref/` → 技能包 references），
> 本文不复述可从签名或 JSDoc 读出的信息。
> 维护规则：改变本文所述行为的同一变更中，必须同步更新本文对应条目。

## 1. 模块定位与用户契约

- 本模块实现 QV 的用户 SDK：终端用户在 `//!js` 嵌入块中直接调用这些 API。
  **脚本是第三方用户编写的持久产物，公共 API 一经发布即是契约**，变更受第 2 节政策约束。
- 唯一全局入口是 `globalThis.Query`（加载时挂载、卸载时删除，`index.ts`）。用户可见的 API 面共三组：
  1. `Query.*` 查询函数（query.ts）；
  2. `Query.DataView(...)` 视图构建器及其注册的渲染方法（data-view.ts，含自定义视图动态注册）；
  3. wrapped Block / wrapped List Proxy 便捷层（proxy.ts）。
- 嵌入块的执行主体与 `protyle/item/top` 变量注入均在思源侧，非本插件提供；本插件只消费执行结果。
- 发布链一体化：一次构建同时交付插件本体、内置文档站（`docs/**`）与 Agent 技能包（`skills/**`，
  其 references 复制自 agent-ref）。**改 JSDoc 即同时改动用户文档与 Agent 参考**，三者必须一致。

## 2. 兼容性与破坏性变更政策

原则：

- 兼容性优先。修复"从未按预期工作过"的行为不算破坏性变更；除此之外任何用户可见的行为变化必须走本节流程。
- 不设固定的废弃周期数：从宣布废弃到实际移除间隔多久由维护者按影响面判断，但**移除必须经过预告阶段**，不得跳过。

生命周期（每个被废弃的用法经历以下状态）：

1. **引入** —— 正常发布。
2. **宣布废弃** —— 同时满足四件事：
   - 旧行为继续可用（兼容映射/兼容参数）；
   - 运行时警告：`console.warn` 每次调用提示；用户可见提示用 `showMessage` 且每 API 会话级去重只弹一次
     （标准实现见 query.ts `handleOptions()`，新增废弃参数应复用它而不是另起炉灶）；
   - 类型声明保留旧形态（TS 兼容）；
   - 在 `BREAKCHANGE.md` 的「Future Break Change Forenotice」区登记条目。
3. **移除** —— 实际的破坏性变更：在 `BREAKCHANGE.md` 对应版本的「Break Change in v2.0.0」区（写实际版本号）
   新增条目并给出迁移路径，同时从预告区删除对应条目。

记录文件为仓库根 `BREAKCHANGE.md`，按版本分节（惯例同 CHANGELOG，未发布内容放 `[Unreleased]`，
发版时随之改为版本号）。收录边界：只记"会导致现有 `//!js` 脚本**运行时行为**变化"的内容；
类型/JSDoc 层面的变化不构成破坏性变更（运行时行为是唯一判定基准），按性质记入 CHANGELOG 的
Changed/Fixed。

首个走完整流程的实例：`keyword`/`keywordDoc` 的 `join` → `relation`（预告已登记在 Unreleased 区）。

## 3. 行为不变量

以下约束一旦打破即构成对既有脚本的破坏，修改前必须走第 2 节流程。

### 3.1 包装纪律（wrapped 层的核心设计原则）

凡与 Array 原生方法**同名**的包装方法，必须保证与原生方法一致的接口与语义（参数形态、返回值、
遍历行为），即"干净的包装"；做不到干净的宁可原生透传。

- 目前只有 `filter` / `slice` 满足此标准并被同名覆盖（且返回值重新包装，proxy.ts:423-436）；
- 其余一切属性与方法一律原生透传（proxy.ts:282-285）。因此 `map()`/`concat()` 等返回普通数组、
  失去链式 IWrappedList 方法是**特性而非缺陷**，需要链式时应显式 `Query.wrapBlocks(...)` 重包；
- symbol 属性永远直通。
- 已知遗留：proxy switch 中的 `case 'toSorted'` 因前置透传而不可达（死分支），其存在违反本条精神，
  应在后续清理中移除而非扩展。

### 3.2 包装幂等

`wrapBlock` / `wrapList` 对已包装对象直接透传（proxy.ts:143-145, 236-238）。任何返回 wrapped
数据的 API 都依赖此性质，不得引入"双重包装"路径。

### 3.3 DataView 方法的双轨制

裸注册方法只构造并返回元素，**不进入视图内容区**；`add...` 前缀变体才把元素挂载进视图
（data-view.ts:119-137, 381-393）。注意：根容器在 constructor 中即已插入文档（data-view.ts:242），
"不挂载"仅相对 DataView 内容区而言。

### 3.4 render() 的持久化通道

`dv.render()` 把视图内容经 Lute `BlockDOM2Content` 转换后写入 `/api/search/updateEmbedBlock`
（data-view.ts:1433-1438）。**嵌入块自身的内容就是视图状态的持久化载体**——任何绕过 render 直接改
嵌入块内容的机制都会与本通道竞争。

### 3.5 useState 的双存储模型

`useState` 写入时立即落 sessionStorage（会话级）；仅在 finalize（protyle 销毁/插件卸载）时 flush 到
块属性 `custom-dv-state-*`（持久化）；恢复优先级 session > 块属性（use-state.ts:46-96）。
render() 不参与状态管理。

### 3.6 方法名黑名单

`PROHIBIT_METHOD_NAMES = ['register', 'element', 'ele', 'render']` 对 DataView 方法注册与自定义视图
校验共同生效（data-view.ts:73）。新增保留字时两处同步。

### 3.7 内核请求的错误吞噬约定

`request()` 对业务码非零的响应一律返回 `null`（api.ts:12-15）。所有基于它的查询 API 都可能返回
`null`/空值，内部实现不得假设返回值必有 `.length` 或对象方法。

### 3.8 别名即契约

Query 与 DataView 两级的别名（含自动生成的全小写别名，query.ts:1233-1278、data-view.ts:106-137）
一经发布即可能被脚本依赖，移除任何别名按第 2 节流程处理。
