# BREAKCHANGE

Query&View 的破坏性变更与预告，面向脚本作者。
未发布的内容放在 `[Unreleased]`，随版本发布改为版本号。

## [Unreleased]

## [2.0.0]

### `Query.Utils` 日期输出格式参数 (保持兼容)

**接口变更**：

```ts
// --- OLD ---
now(offset?, hms?: boolean)
today(hms?: boolean)
thisWeek(hms?: boolean)
lastWeek(hms?: boolean)
thisMonth(hms?: boolean)
lastMonth(hms?: boolean)
thisYear(hms?: boolean)
SiYuanDate.toString(hms?: boolean)

// --- NEW ---
now(offset?, format?: 'date' | 'datetime')
today(format?: 'date' | 'datetime')
thisWeek(format?: 'date' | 'datetime')
lastWeek(format?: 'date' | 'datetime')
thisMonth(format?: 'date' | 'datetime')
lastMonth(format?: 'date' | 'datetime')
thisYear(format?: 'date' | 'datetime')
SiYuanDate.toString(format?: 'date' | 'datetime')
asTimestr(date, format?: 'date' | 'datetime')
```

**行为变更**：

- `'date'` 返回 8 位日历日期 `yyyyMMdd`；`'datetime'` 返回 14 位本地日期时间 `yyyyMMddHHmmss`
- 不传 `format` 时仍默认返回 14 位日期时间
- 原布尔参数保持原行为：`false` 映射到 `'date'`，`true` 映射到 `'datetime'`
- `asTimestr` 新增同名 `format` 参数；此前不传第二个参数的行为不变

**用例对比**：

```js
// 旧写法（仍兼容）
Query.Utils.today(false);                    // 20260827
Query.Utils.thisMonth(true);                 // 20260801000000
Query.Utils.Date().toString(false);          // 20260827

// 新写法
Query.Utils.today('date');                   // 20260827
Query.Utils.thisMonth('datetime');           // 20260801000000
Query.Utils.Date().toString('date');         // 20260827
Query.Utils.asTimestr(new Date(), 'date');   // 20260827
```

**兼容性声明**:

旧布尔参数在 v2.0.0 仍可用且返回结果不变，但每次调用会输出 `console.warn`，未来版本将移除。省略参数的默认行为不变，不会触发警告。

### `Query.task` 的 `options.after` 日期格式 (保持兼容)

**接口变更**：

```ts
// --- OLD ---
task(options?: { after?: string, limit?: number })

// --- NEW ---
task(options?: { after?: Date | string, limit?: number })
// string 正式支持 yyyyMMdd 或 yyyyMMddHHmmss
```

**行为变更**：

- `Date` 和 8 位 `yyyyMMdd` 会转换成当天本地时间 `00:00:00` 对应的 14 位查询边界
- 14 位 `yyyyMMddHHmmss` 直接作为查询边界
- 旧的 10 位小时和 12 位分钟写法仍会补零成 14 位，但进入废弃期
- 非法格式与不存在的日历日期会直接报错，不再拼入 SQL

**用例对比**：

```js
// 旧写法（仍兼容）
await Query.task({ after: '2024101000' });

// 新写法
await Query.task({ after: '20241010' });
await Query.task({ after: '20241010000000' });
await Query.task({ after: new Date(2024, 9, 10) });
```

**兼容性声明**:

10 位和 12 位日期时间字符串在 v2.0.0 仍可用，但每次调用会输出 `console.warn`，未来版本将移除。8 位、14 位和 `Date` 输入是正式支持的写法。

### `Query.dailynote` 的日期范围校验 (保持兼容)

**行为变更**：

- `after` / `before` 接受 `Date`、8 位 `yyyyMMdd`、14 位 `yyyyMMddHHmmss`，统一归一化为 8 位日记日期后参与比较；14 位输入在旧版会原样拼入 SQL，结果不可靠
- 非法格式与不存在的日历日期会直接报错，不再静默返回空结果
- `after` 晚于 `before` 时抛出 `RangeError`（旧版静默返回空数组）

**用例对比**：

```js
// 旧写法（行为保持）
await Query.dailynote({ after: '20241010', before: '20241031' });
await Query.dailynote({ after: new Date(2024, 9, 10) });

// 新写法
await Query.dailynote({ after: '20241010000000' }); // 14 位输入归一化为 20241010
```

**兼容性声明**:

8 位日期字符串与 `Date` 的既有用法行为不变。`after` 晚于 `before` 的调用由“返回空数组”变为“抛出异常”，请修正调用参数；非法日期输入同理。

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
