# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Query.dailynote` 支持通过 `after` / `before` 按日记日期划定包含边界的检索范围。
- 时间转换与查询边界支持 8 位 `yyyyMMdd`、14 位 `yyyyMMddHHmmss` 和 JavaScript `Date`，由对应 API 自动归一化。

### Changed

- 时间输出参数改用更明确的 `'date' | 'datetime'`；旧布尔值保持兼容并进入废弃期。
- 非法的思源日期、日期范围和日期偏移会直接报错，不再静默产生无效日期或错误 SQL。

### Fixed

- 修复 `Query.Utils.lastMonth()` 在部分月末错误返回本月月初的问题。
- 修复 `Query.Utils.asDate()` 无法解析同组 API 产生的 8 位日期的问题。

## [1.3.0] - 2026-08-07

### Fixed

- 适配 SiYuan 3.7.0 嵌入块原地编辑：DataView 视图内容持续保持只读，避免误编辑进入思源编辑链路导致编辑器异常。
- 修复集市校验失败问题（`readme.default` 缺失、`icon.png` 超过 20 KB 上限），确保更新包可被 Bazaar 正常索引。

## [1.2.3] - 2025-05-21

### Added

- 新增 `Query.nearby` API：查询指定块同级别的相邻块，支持 `previous | next | both` 三种方向。

### Changed

- 修正 README 文档中的错别字。

## [1.2.2] - 2025-05-14

### Fixed

- 修复 `Query.tag` 匹配代码中的逻辑错误。

## [1.2.1] - 2025-05-12

### Added

- `Query.tag` API 新增 `match` 选项，支持 `=` 和 `like` 两种匹配模式。

### Changed

- `Query.task` API 适配 SiYuan 3.1.29 对列表符号的变更，自动按思源版本适配。
- 改进 `Query.markdown` 函数的实现方案。

## [1.2.0] - 2025-04-15

v1.1.0 曾因与思源的不兼容问题暂时下架；v1.2.0 重新上架，且自该版本起不再兼容思源 3.1.24、3.1.25。

### Added

- DataView 新增 `Card` 组件。
- DataView 的 `Markdown` 组件支持渲染数学公式。
- 新增 `Query.pruneBlocks` 函数：合并查询结果中具有父子关系的块，实现结果去重。
- Example 中新增 `list-tag` 案例。

### Changed

- 优化 DataView 中的 `Embed` 组件。

### Deprecated

- `Query.attr` 旧参数用法弃用（仍兼容但会提出警示，建议迁移到新用法）：`Query.attr("name", "value", "=", 10)` → `Query.attr("name", "value", { valMatch: "=", limit: 10 })`。
- `Query.tag` 旧参数用法弃用：`Query.tag("tag1", "or", 10)` → `Query.tag("tag1", { join: "or", limit: 10 })`。
- `Query.task` 旧参数用法弃用：`Query.task("2024101000", 32)` → `Query.task({ after: "2024101000", limit: 32 })`。
- `Query.keyword` / `Query.keywordDoc` 旧参数用法弃用：`Query.keyword("keyword", "or", 10)` → `Query.keyword("keyword", { join: "or", limit: 10 })`。
- `Query.dailynote` 旧参数用法弃用：`Query.dailynote("20231224140619-bpyuay4", 32)` → `Query.dailynote({ notebook: "20231224140619-bpyuay4", limit: 32 })`。

[Unreleased]: https://github.com/frostime/sy-query-view/compare/v1.2.3...HEAD
[1.3.0]: https://github.com/frostime/sy-query-view/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/frostime/sy-query-view/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/frostime/sy-query-view/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/frostime/sy-query-view/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/frostime/sy-query-view/compare/v1.1.2...v1.2.0
