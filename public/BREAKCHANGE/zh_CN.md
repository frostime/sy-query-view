# BREAKCHANGE

Query&View 的破坏性变更与预告，面向脚本作者。
未发布的内容放在 `[Unreleased]`，随版本发布改为版本号。

## [Unreleased]

## [2.0.0]

### `Query.keywordDoc` (保持兼容)

**接口变更**：

```ts
// --- OLD ---
keywordDoc(keywords, options?: { join?: 'or' | 'and', limit?: number } | 'or' | 'and', limit?: number)
// --- NEW ---
keywordDoc(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**行为变更**：

- `{ join: 'or' }` 自动映射为 `relation:'any'`：v1.x 只返回包含全部关键词的文档；v2.x 返回包含任一关键词的文档，结果可能变多
- `{ join: 'and' }` 自动映射为 `relation:'all'`：v1.x 要求全部关键词出现在**同一块内**；v2.x 要求全部关键词出现在**同一文档内**（可跨块），结果可能变多
- `limit`：v1.x 为检索块数上限，超出部分被丢弃，所在文档可能整篇漏查；v2.x 为返回文档数上限
- 无参数调用行为不变；返回结果仍为文档数组，附 `.keywords` 属性
- 旧的位置参数 `limit`（第三参）已移除；请把 `limit` 写入 options 对象

**用例对比**：

```js
// 旧 join 写法（仍兼容，行为按映射后的语义执行）
await Query.keywordDoc(["TODO", "会议"], { join: 'or' });   // 映射为 'any'：任一词出现即返回
await Query.keywordDoc(["TODO", "会议"], { join: 'and' });  // 映射为 'all'：两词都出现才返回
await Query.keywordDoc(["TODO", "会议"], { join: 'and' }, 20); // 第三参 limit 已失效

// 新写法
await Query.keywordDoc(["TODO", "会议"]);                                 // 默认 'all'
await Query.keywordDoc(["TODO", "会议"], { relation: 'any' });            // 任一词出现即返回
await Query.keywordDoc(["TODO", "会议"], { relation: 'all', limit: 20 }); // 两词都出现才返回，最多 20 篇
```

**兼容性声明**:

旧的 `join` 对象及直接字符串形态在 v2.0.0 仍可用，但每次调用会输出 `console.warn`，未来版本将移除。第三个位置参数 `limit` 已在 v2.0.0 移除。

### `Query.keyword` (保持兼容)

**接口变更**：

```ts
// --- OLD ---
keyword(keywords, options?: { join?: 'or' | 'and', limit?: number } | 'or' | 'and', limit?: number)
// --- NEW ---
keyword(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**行为变更**：`join` 自动映射为 `relation`（`'or'→'any'`，`'and'→'all'`），块级匹配逻辑不变。旧的位置参数 `limit`（第三参）已移除；请把 `limit` 写入 options 对象。

**用例对比**：

```js
// 旧 join 写法（仍兼容）
await Query.keyword("日记", { join: 'or' });
await Query.keyword("日记", 'and');
await Query.keyword("日记", { join: 'and' }, 20); // 第三参 limit 已失效

// 新写法
await Query.keyword("日记", { relation: 'any' });
await Query.keyword("日记", { relation: 'all', limit: 20 });
```

**兼容性声明**:

旧的 `join` 对象及直接字符串形态在 v2.0.0 仍可用，但每次调用会输出 `console.warn`，未来版本将移除。第三个位置参数 `limit` 已在 v2.0.0 移除。

### `Query.attr` (已废除旧写法)

自 v1.x 起标记废弃的直传形态在 v2.0.0 移除。

**接口变更**：

```ts
// --- OLD ---
attr(name, val?, optsOrValMatch?: { valMatch?: '=' | 'like', limit?: number } | '=' | 'like', limit?: number)
// --- NEW ---
attr(name, val?, options?: { valMatch?: '=' | 'like', limit?: number })
```

**行为变更**：直传形态整体失效——直传 `'like'` 会退回默认的精确匹配 `'='`；位置 `limit` 被忽略。

**用例对比**：

```js
// 旧写法（已移除）
await Query.attr('memo', 'hello', '=');                    // ✗ 改为 { valMatch: '=' }
await Query.attr('memo', 'hello', 'like');                 // ✗ 改为 { valMatch: 'like' }
await Query.attr('memo', 'hello', { valMatch: '=' }, 10);  // ✗ limit 写入对象

// 新写法
await Query.attr('memo', 'hello');
await Query.attr('memo', 'hello', { valMatch: 'like', limit: 10 });
```

**兼容性声明**:

旧写法自 v1.x 起即有运行时警告，v2.0.0 彻底移除。

### `Query.tag` (已废除旧写法)

自 v1.x 起标记废弃的直传形态在 v2.0.0 移除。

**接口变更**：

```ts
// --- OLD ---
tag(tags, joinOrOpts?: { join?, limit?, match? } | 'or' | 'and', limit?: number)
// --- NEW ---
tag(tags, options?: { join?: 'or' | 'and', limit?: number, match?: '=' | 'like' })
```

**行为变更**：直传 `'or'` / `'and'` 与位置 `limit` 失效——直传 `'and'` 会退回默认的 `'or'`，位置 `limit` 被忽略。对象形态中的 `join` 未更名，仍为 `'or' | 'and'`。

**用例对比**：

```js
// 旧写法（已移除）
await Query.tag(['tag1', 'tag2'], 'or');                   // ✗ 改为 { join: 'or' }
await Query.tag(['tag1', 'tag2'], { join: 'and' }, 10);    // ✗ limit 写入对象

// 新写法
await Query.tag(['tag1', 'tag2'], { join: 'and', limit: 10 });
```

**兼容性声明**:

旧写法自 v1.x 起即有运行时警告，v2.0.0 彻底移除。

### `Query.task` (已废除旧写法)

自 v1.x 起标记废弃的直传形态在 v2.0.0 移除。

**接口变更**：

```ts
// --- OLD ---
task(afterOrOpts?: { after?: string, limit?: number } | string, limit?: number)
// --- NEW ---
task(options?: { after?: string, limit?: number })
```

**行为变更**：直传日期字符串与位置 `limit` 失效——直传的 `after` 被忽略，会返回全部未完成任务。

**用例对比**：

```js
// 旧写法（已移除）
await Query.task('2024101000');                // ✗ 改为 { after: '2024101000' }

// 新写法
await Query.task({ after: '2024101000', limit: 32 });
```

**兼容性声明**:

旧写法自 v1.x 起即有运行时警告，v2.0.0 彻底移除。

### `Query.dailynote` (已废除旧写法)

v1.x 保留的兼容形态在 v2.0.0 移除，其中包括未写入类型声明的旧 `{ box }` 特判。

**接口变更**：

```ts
// --- OLD ---
dailynote(
    notebookOrOpts?: { notebook?: NotebookId, box?: NotebookId, limit?: number } | NotebookId,
    limit?: number
)
// --- NEW ---
dailynote(options?: { notebook?: NotebookId, limit?: number })
```

**行为变更**：直传笔记本 id、`{ box }` 与位置 `limit` 全部失效——不指定 `notebook` 时返回全部日记文档（默认上限 64）。

**用例对比**：

```js
// 旧写法（已移除）
await Query.dailynote('20231224140619-bpyuay4');       // ✗ 改为 { notebook: '…' }
await Query.dailynote({ box: '20231224140619-bpyuay4' }); // ✗ box 改为 notebook
await Query.dailynote({ notebook: '20231…' }, 32);     // ✗ limit 写入对象

// 新写法
await Query.dailynote({ notebook: '20231224140619-bpyuay4', limit: 32 });
```

**兼容性声明**:

直传笔记本 id 和位置 `limit` 自 v1.2.0 起会触发运行时警告；`{ box }` 兼容特判不会触发警告。以上旧形态均在 v2.0.0 移除。
