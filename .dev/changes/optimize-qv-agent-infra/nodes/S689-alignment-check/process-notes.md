---
title: S689 对齐验证过程梳理
description: N4 对齐检查机制、源码复核和证据命令的可追溯记录。
updated: 2026-08-25
---

# 过程梳理

## 范围与输入

本次复核按 `delegation.md`、`NAVIGATION.MAP.md`、上级 `graph.yaml`、`TERM.md` 和 `BREAKCHANGE-v2.0.md` 执行。没有重新设计 API，也没有引入依赖；生成参考文档仍由 `scripts/gen-agent-ref.mjs` 负责。

对照面固定为：

```text
src/core 实现
    ├── types/core/*.d.ts（tsc 导出签名）
    ├── 源码 JSDoc（人写行为说明）
    ├── register()/addAlias() 调用点（动态名称）
    └── docs/en_US/agent-ref/*.md（生成产物）
```

## 执行顺序与关键发现

1. 检查基线生成器：直接运行生成器确认四份参考文档可幂等重建。
2. 增加 A1 `--check`：生成内容留在内存中，与四份现有产物逐一比较；`--check` 不覆盖产物，漂移或缺失以非零退出。
3. 设计 A2：生产 `proxy.ts` 依赖浏览器组件和 `window`，因此脚本用仓库已有 TypeScript 转译器移除唯一的 `renderAttr` import，在 VM 中注入最小 stub，执行实际 Proxy 源码；没有复制 Proxy 实现，也没有启动思源实例。
4. 首次对照发现 `wrapList` 的快速路径会吞掉数组原生 `map`，使源码 `case 'map'` 死代码；立即向 supervisor 报告并暂停该行为判断。随后 supervisor 修复快速路径，并同步将 map 默认元素行为定为不包裹。
5. 继续按“数组原生方法与 Proxy switch 交集”检查，发现 `concat`、`toSorted` 同类死代码；报告后 supervisor 修复并将两个方法加入声明，A2 随后增加对应断言。
6. 发现 `KNOWN_NOTES` 中四条提示已落后于 N6 修补（keywordDoc、columns、echartsTree、pick）；报告后 supervisor 清理，并在生成器旁写维护规则。
7. 逐项对照 Query/DataView 的返回值与声明，报告并由 supervisor 处理 nearby、fb2p、keywordDoc、replaceView；`sorton` 默认方向经用户拍板以实现的 `desc` 为准，注释和产物已同步。
8. 纯注释不一致按授权直接修正：`lastWeek`、`gpt` 参数名、`getBlocksByIds` 返回说明、缺失的 markdown/Date/asMap/openBlock/pick overload 注释、`addrow` alias 写法；每次均重新生成文档。
9. 其余公共类型/动态 alias/生成器覆盖边界保留在问题报告，不在本批次自行改变实现或 API 语义。

## 交付文件

- `scripts/gen-agent-ref.mjs`：新增 `--check`，保留原有生成路径。
- `package.json`：新增 `gen-ref:check`。
- `scripts/check-agent-alignment.mjs`：Node 纯逻辑断言。
- `AGENTS.md`：仓库级长期协作规则。
- `.agents/skills/qv-reference-alignment/SKILL.md`：参考体系维护技能。
- `I-40-final-review-checklist.md`：自动/运行时/人工复核对象定稿。
- `alignment-report.md`：问题、证据、处置和后续建议。
- `process-notes.md`：本过程梳理。

参考文档变更均通过生成器产生，未手改 `docs/en_US/agent-ref/*.md`。

## 证据命令

| 命令 | 结果 |
| --- | --- |
| `node scripts/gen-agent-ref.mjs --check`（干净产物） | 退出 `0` |
| 人为修改 `query-api.md` 一个标题字符后运行上命令 | 退出 `1`，提示 `query-api.md`；随后恢复文件 |
| `pnpm gen-ref:check` | 退出 `0` |
| `node scripts/check-agent-alignment.mjs` | 退出 `0`；覆盖 pick、filter、slice、map、concat、toSorted、groupby、unwrap 与链式操作 |
| `node scripts/gen-agent-ref.mjs` | 成功生成四份产物；无漂移时报告无变更 |

`npx tsc --noEmit` 在本机实际退出 `2`，报 TS5107（tsconfig 的 `moduleResolution=node10` 弃用提示，TS 5.7 起）；`pnpm gen-ref` 内部的 export-types 实际退出 `0`，supervisor 已确认不影响生成管线，未在本节点改配置。

## 边界与未决项

公共行为或签名问题均通过 mail 报告后等待决定；没有自行改实现。当前仍需后续决定或处理的重点是 keywordDoc 返回元素的动态 `keywords` 类型、动态 alias 和 DataView getter/直接 alias 的生成器覆盖范围，以及 Wrapped 签名是否统一从 tsc 声明读取。`Query.sql` 条件返回、wrapper 元素声明、asMap 默认参数和运行时兼容 alias 已在本批次同步。详见 `alignment-report.md` 与 `I-40-final-review-checklist.md`。
