---
title: S689 Delegation Context Map — Query&View 对齐验证
created: 2026-08-24
---

# S689 Context Map (Alignment Check)

## Core Files

- `src/core/query.ts` — Query API 对象字面量（真相源之一）；`Query` 在 :267 定义，`export default` 在文件尾
  - `keywordDoc()` / `keyword()` — 已重构（文档级聚合 SQL），**勿动**
  - `handleOptions()` — 顶部通用参数处理（deprecated 兼容机制）
- `src/core/data-view.ts` — `DataView` class：组件实现 + `register()` 调用点（:247-268），别名真相源
- `src/core/proxy.ts` — `IWrappedList`/`IWrappedBlock` interface + `wrapList()`/`wrapBlock()` Proxy 实现（A2 断言主战场）
- `src/types/data-view.d.ts` — 手写类型（IState/ICustomView/IGraphNode 等；IDataView 已删）
- `scripts/export-types.js` — tsc 声明导出（`types/core/*.d.ts` 生成；`public/types.d.ts` 拼接）
- `scripts/gen-agent-ref.mjs` — **参考文档生成器**（三来源纯搬运；KNOWN_NOTES 坑注表在文件内；A1 的 --check 加在这里）
- `docs/en_US/agent-ref/*.md` — **生成产物**（query-api/dataview/wrapped/types.md；勿手改）
- `package.json` — scripts：`gen-ref` = export-types + gen-agent-ref
- `vite.config.ts` — `copySkillReferences` 把 agent-ref 复制进技能包 references/（:174-191）
- `skills/sy-query-view/SKILL.md` — 现有 v1.3 技能（v1.3 时代产物，与同目录无关，不要动）
- `BREAKCHANGE-v2.0.md`（`.dev/changes/optimize-qv-agent-infra/` 下）— SDK 变更记录（发布用，只追加）
- `.dev/changes/optimize-qv-agent-infra/graph.yaml` — 任务控制状态（读它了解全貌）
- `.dev/changes/optimize-qv-agent-infra/issues.yaml` — 候选池（25 条；n4 的 I-40/41/42 与你的任务相关）
- `.dev/changes/optimize-qv-agent-infra/TERM.md` — 术语册（语义对齐/生成器/注册调用点等）

## Navigation

- 理解管线：`express-types`（tsc 声明）→ `gen-ref`（签名从声明、注释从源码、别名从调用点）→ 文档→ 构建时复制进技能包
- 理解语义对齐：读 `prototypes/agent-ref-v0.md` 附录 A（源码→桥接→文档三对应）
- A2 断言目标：`src/core/proxy.ts` 的 `wrapList`（纯 JS，node 可测）；`data-view.ts` 的 `details()`（DOM 依赖，无 jsdom 则列入运行时复核清单）
- 生成器坑注表：`scripts/gen-agent-ref.mjs` 内 `KNOWN_NOTES`（⚠ 注入机制；内容与源码注释同步）

## Environment Traps

- `NODE_ENV=development vite build` 会被 livereload 挂起（不要用）
- tsconfig `strict:false`：判别联合窄化失效，用 `in` 操作符
- `public/types.d.ts` 是构建产物：有变化时单独 chore commit
- 验证生成器产物一致性：`node scripts/gen-agent-ref.mjs` 重跑后 `git diff` 应无变化（幂等）

## Discovered Later

<!-- append-only -->