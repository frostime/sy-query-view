# BREAKCHANGE

Query&View 的破坏性变更与预告，面向脚本作者。
未发布的内容放在 `[Unreleased]`，随版本发布改为版本号。

## [Unreleased]

## [2.0.0]

### `Query.keywordDoc` (保持兼容)

**接口变更**：

```ts
// --- OLD ---
keywordDoc(keywords, options?: { join?: 'or' | 'and', limit?: number })
// --- NEW ---
keywordDoc(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**行为变更**：

- `{ join: 'or' }` 自动映射为 `relation:'any'`：v1.x 只返回包含全部关键词的文档；v2.x 返回包含任一关键词的文档，结果可能变多
- `{ join: 'and' }` 自动映射为 `relation:'all'`：v1.x 要求全部关键词出现在**同一块内**；v2.x 要求全部关键词出现在**同一文档内**（可跨块），结果可能变多
- `limit`：v1.x 为检索块数上限，超出部分被丢弃，所在文档可能整篇漏查；v2.x 为返回文档数上限
- 无参数调用行为不变；返回结果仍为文档数组，附 `.keywords` 属性

**用例对比**：

```js
// 旧写法（仍可用，行为按映射后的语义执行）
await Query.keywordDoc(["TODO", "会议"], { join: 'or' });   // 映射为 'any'：任一词出现即返回
await Query.keywordDoc(["TODO", "会议"], { join: 'and' });  // 映射为 'all'：两词都出现才返回

// 新写法
await Query.keywordDoc(["TODO", "会议"]);                      // 默认 'all'：两词都出现才返回
await Query.keywordDoc(["TODO", "会议"], { relation: 'any' }); // 任一词出现即返回
await Query.keywordDoc(["TODO", "会议"], { relation: 'all' }); // 两词都出现才返回
```

**兼容性声明**:

旧参数形态在 v2.0.0 版依然可用，未来版本将移除。

### `Query.keyword` (保持兼容)

**接口变更**：同上，`join` 参数改名为 `relation`（取值 `'or'→'any'`，`'and'→'all'`）。

**行为变更**：无，仅仅是参数改名。

**用例对比**：

```js
// 旧写法（仍可用，行为按映射后的语义执行）
await Query.keyword("日记", { join: 'or' });
await Query.keywordDoc("日记", 'and');


// 新写法
await Query.keyword("日记", { relation: 'any' });
await Query.keywordDoc("日记", { relation: 'all' });
```

**兼容性声明**:

旧参数形态在 v2.0.0 版依然可用，但每次调用会输出 `console.warn`，未来版本将移除。
