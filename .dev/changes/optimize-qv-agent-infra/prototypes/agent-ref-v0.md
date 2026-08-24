# Query&View Agent Reference — 原型 v0
> **目的**：一个"未来面向 Agent 参考文档长什么样"的实物样本，供方向直觉判断。
> **字段来源标记**：
> - 🤖 = 由构建工具从源码/声明提取（签名、别名集、来源行号 —— 保证与实现同步）
> - ✍️ = 撰写者/Agent 的行为要点与示例（未来由 `@agent-*` 注释 + 行为测试背书）
> - ⚠ = 已知"公开声明 与 运行时不符"（诚实标注，Agent 避坑关键）

## 模块导航
1. **Query 查询函数** —— 取数据
2. **DataView 组件** —— 渲染数据（dv.details / dv.cards / dv.columns / dv.render）
3. **WrappedList 工具** —— 数据加工（pick）

---

# 1. Query 查询函数

## Query.childDoc(b)
```ts
childDoc: (b: BlockId | Block) => Promise<IWrappedList<IWrappedBlock>>   // 🤖 正确签名
```
**说明** ✍️ 获取指定块下直接子文档。

**行为要点** ✍️
- ⚠ 实际返回**包裹列表**（可用 `.pick()` / `.groupby()` / `.addcols()`）。当前 tsc 公开声明写作 `Promise<Block[]>`，**与实现不符**——是"自动生成但语义错"的实例。
- 传入 `BlockId` 字符串时内部先 `getBlocksByIds`，需块已加载。

**示例** ✍️
```js
const children = await Query.childDoc(block);
dv.addlist(children, { type: 'o' });
```
**来源** 🤖 `src/core/query.ts:729`

## Query.Utils.today / thisWeek
```ts
today: (hms?: boolean) => string   // 🤖 签名（tsc 声明为 any，此处按实现整理）
thisWeek: (hms?: boolean) => string
```
**说明** ✍️ 返回今天 / 本周开始时刻的时间戳（SiYuan 时间戳）。

**行为要点** ✍️
- ⚠ **默认 `hms=true`** → 14 位完整戳 `yyyyMMddHHmmss`；`hms=false` 才返回 8 位 `yyyymmdd`。
- ⚠ `thisWeek` 从**周日**开始计算。
- 声明 `(hms?: boolean) => any` 丢失了返回类型，Agent 无法从类型得知是字符串。

**来源** 🤖 `src/core/query.ts:305` / `:312`

---

# 2. DataView 组件（dv.*）
> 组件经 `register()` 运行时注册，衍生出完整别名集合（含大小写与 `add` 前缀），由构建期从调用点提取 🤖。

## dv.details(summary, content)
```ts
details(summary: string, content: string | HTMLElement): HTMLDetailsElement   // 🤖 来自 data-view.d.ts
```
**全部可用名** 🤖 `details` · `Details` · `Detail` · `adddetails` · `addDetails` · `addDetail`

**行为要点** ✍️
- ⚠ `content` 为字符串时**直拼 `innerHTML`** —— 原始 HTML，**不是 markdown**。
- 默认 `open=true`（默认展开）。

**示例** ✍️
```js
dv.adddetails('标题', '<b>加粗</b>');   // 想放 markdown 文本者易踩坑
```
**来源** 🤖 `src/core/data-view.ts:515`

## dv.cards(blocks, options)
```ts
cards(blocks: Block[], options?: { cardWidth?: string; cardHeight?: string; fontSize?: string }): HTMLElement   // 🤖
```
**全部可用名** 🤖 `cards` · `Cards` · `Card` · `addcards` · `addCards` · `addCard`

**行为要点** ✍️
- 默认 `cardWidth='175px'`、`fontSize='14px'`；`cardHeight` 缺省跟随 `cardWidth`。
- 兼容旧键 `options['width']` / `options['height']`。
- 卡片内容构成 = 类型图标 + `content` 可点标题 + 笔记本名/hpath + `created`/`updated`。
- **来源** 🤖 `src/core/data-view.ts:642`（组件实现 `components.ts:379`）

## dv.columns(elements, options)
```ts
columns(elements: HTMLElement[], options?: { gap?: string; flex?: number[]; minWidth?: string | number }): HTMLElement   // 🤖
```
**行为要点** ✍️
- ⚠ `flex:[1,1,2]` 实际**未按列生效**：实现把 `--flex-grow` 写为父容器单一变量反复覆盖（data-view.ts:686）。已知限制，勿依赖。

**来源** 🤖 `src/core/data-view.ts:668`

## dv.render()
```ts
render(): void   // 🤖
```
**行为要点** ✍️
- ⚠ **非纯渲染**：执行时持久化嵌入块（`POST /api/search/updateEmbedBlock`，内容取该块 innerText）。静态视图末尾调一次；勿在循环/高频路径调用。

**来源** 🤖 `src/core/data-view.ts:1406`

---

# 3. WrappedList 工具

## list.pick(...attrs)
```ts
pick(...attrs: (keyof T)[]): IWrappedList<Partial<T>>   // 🤖 来自 tsc 声明（上方）
```
**行为要点** ✍️
- ⚠ **单/多属性返回不同**（声明未体现）：
  - `list.pick('id')` → `IWrappedList<string>` 标量数组
  - `list.pick('id','content')` → `IWrappedList<{id,content}>` 对象数组
- 单参数传数组 `pick(['id'])` 会被自适应摊平为多属性形式。

**示例** ✍️
```js
const ids = list.pick('id');
const objs = list.pick('id', 'content');
```
**来源** 🤖 `src/core/proxy.ts:74`

---

## 验证状态
| 字段 | 状态 |
|---|---|
| 签名 | 🤖 来自 tsc 声明（整理显示）；childDoc/pick 处声明本身有误，已在⚠标出 |
| 别名集 | 🤖 由 `register()`/`addAlias()` 调用点计算 |
| 行为要点 | ✍️ 本质是源码 JSDoc 注释，生成器提取；每个 ⚠ 项是测试发现，应在 N4 加行为测试背书后转"已确认" |

---

## 附录 A：这份参考是怎么「长」出来的

一句话：**写好源码注释，参考文档基本自动生成**。生成器不编造任何知识，只做三件事：*扣签名*、*扣注释*、*展开别名*。

### A.1 三个信息来源 → 一条产出链

| 文档里的字段 | 从哪来 | 人要动手吗 |
|---|---|---|
| 签名 | 类型检查器 / tsc 声明（ts-morph `getType()`） | ❌ 不需要，代码本身就是 |
| 说明 / 要点 / 示例 | 源码 **JSDoc 注释**（普通注释 + 面向 agent 的约定字段） | ⚠️ **写注释**——唯一的人力投入 |
| 别名集 | `register()` / `addAlias()` 调用点（AST 提取） | ❌ 不需要，调用点就是真相 |
| 来源行号 | AST 节点行号 | ❌ 不需要 |
| ⚠ 声明与运行时不符 | **行为测试**发现（不是注释能证明的） | 由 N4/N6 处理 |

> ⚠️ 真正要人动手的只有一格：**源码注释**。注释写得面向 agent（默认值、副作用、示例都在里面），文档就自动好了。

### A.2 例 1：Query.childDoc —— 对象字面量成员

**① 源码侧**（`src/core/query.ts`）

```ts
/**
 * 获取指定块下直接子文档。
 * @param b - 父块或块 ID
 * @returns 子文档的包裹列表，支持 .pick()/.groupby()/.addcols()
 *
 * [agent] 返回 wrapped list 而非普通 Block[]，别当普通数组 push 后直接用
 * [agent] 传入 BlockId 字符串时内部先 getBlocksByIds，需块已加载
 */
childDoc: async (b: BlockId | Block) => {
    ...
    return wrapList(docs);   // ← 运行时的真相在这里，注释只是把它说明白
},
```

（`[agent]` 是示意占位——面向 agent 的增量字段，具体 tag 命名留给 N3 定）

**② 中间桥接**（生成器纯机械操作）

| 输入 | 桥接手段 | 输出 |
|---|---|---|
| 对象字面量成员 `childDoc` | ts-morph 定位 → 类型检查器 | 签名 |
| 上面的 JSDoc | `ts.getJSDocCommentsAndTags()` | desc / @param / @returns / `[agent]` 字段 |
| 声明里的返回类型 | （见下方"诚实性前置"） | ⚠ 提示 |

**③ 文档侧**（即正文 `Query.childDoc` 一节，无需重抄）

```
签名 ✓（自动）   说明 ✓（注释）   要点 ✓（[agent] 注释）   示例 ✓（注释）   来源 ✓（行号）
```

### A.3 例 2：dv.cards —— 动态别名 + 默认值

**① 源码侧**（`src/core/data-view.ts`）

```ts
/**
 * 卡片视图
 * @param blocks - 要展示的块
 * @param options - 
 *   cardWidth 默认 '175px'；fontSize 默认 '14px'；cardHeight 缺省跟随 cardWidth
 *   （兼容旧键 options.width / options.height）
 * [agent] 卡片内容 = 类型图标 + content 可点标题 + 笔记本名/hpath + created/updated
 */
cards(blocks: Block[], options?: { cardWidth?: string; cardHeight?: string; fontSize?: string }) {
    const cardsContainer = newViewWrapper();
    const cards = new BlockCards({ target: cardsContainer, blocks, ...options });
    ...
}
```

注册点（构造函数里）：

```ts
this.register(this.cards, { aliases: ['card'] });
```

**② 中间桥接**

| 输入 | 桥接手段 | 输出 |
|---|---|---|
| 方法 `cards` | 类型检查器 → 签名文本 | `cards(blocks, options?)` |
| 方法 JSDoc | 注释提取 → 默认值 / 要点 / 示例 | "行为要点" 栏 |
| `this.register(this.cards, { aliases:['card'] })` | AST 提取调用点 → 按 register 规则展开 | `cards` `Cards` `Card` `addcards` `addCards` `addCard` |

**③ 文档侧**（即正文 `dv.cards` 一节）

```
全部可用名 ✓（register 调用点自动展开）   默认值 ✓（注释 @default）   要点 ✓（[agent] 注释）   来源 ✓（行号）
```

### A.4 诚实性前置（重要，别误以为"抠签名"能解决一切）

"抠签名"只能拿到**声明长什么样**，不能判断声明对不对。`childDoc` 当前 tsc 声明是 `Promise<Block[]>`，而运行时是 wrapped list——生成器照抠只会把**错的**签名印进文档。

所以：

```text
生成器 = 诚实搬运（只输出"源码当前这么说"，不担保对）
测试   = 唯一裁判（发现 ✗ 项：声明与运行时不符）
N6     = 决定处置（修类型 / 修实现 / 或文档化）
```

也就是说，你的直觉"写好注释就能自动生成"**基本成立**，但有一个前置：**类型本身先要诚实**（`wrapList` 返回类型、`pick` 单属性标量等），否则自动抠出来的是"看似权威、其实错误"的签名——这正是 Worker-B 在 v1.3 手工文档里抓到、也是本方案要避免的坑。

