# Query&View 协作约定

本仓库是思源笔记 Query&View（QV）插件。以下规则适用于修改 QV API、类型、注释、参考文档和构建产物的协作。

## 语义对齐

QV 的对齐检查同时看三类来源：

1. **运行时实现**：`src/core/` 中函数实际执行的行为。
2. **类型声明**：`types/core/*.d.ts` 中由 TypeScript 导出的签名。
3. **人写注释**：源码 JSDoc；它是 Agent 参考文档中行为说明的唯一人写来源。

动态成员还要检查注册调用点：Query 的 `addAlias()` 与 DataView 的 `register()` 会在运行时增加别名。生成器只能搬运签名、注释和可静态提取的别名，不替实现作语义判断。

发现实现、声明或注释的公共行为不一致时，先保留证据并报告；不要自行改变 API 行为、签名或兼容性。纯粹与实现不符的注释措辞可以直接修正，但仍需重新生成参考文档。

## 类型定义的定位（I-83）

QV 脚本运行在浏览器/Electron JavaScript 环境；类型定义主要服务于 Agent 参考和开发时提示，不是独立的运行时约束。优先保证类型不会让使用者形成错误认知或承担不必要的理解负担；不为类型理论上的极端精确度引入超过收益的复杂改造。

## 参考文档与生成物

`docs/en_US/agent-ref/*.md` 是生成产物，禁止手工修改。需要改变参考内容时：

1. 修改对应源码的 JSDoc 或实现（行为改变须先取得范围/语义决定）；
2. 运行 `pnpm gen-ref`；
3. 运行 `pnpm gen-ref:check`，确认退出码为 `0`；
4. 用 `git diff` 检查生成内容确实来自预期改动。

`pnpm gen-ref` 会先运行类型导出，再运行 `scripts/gen-agent-ref.mjs`。`scripts/gen-agent-ref.mjs --check` 只比较预期文档，不覆盖现有产物；产物缺失或内容不同会以非零退出。

行为对齐的 Node 断言运行：

```bash
node scripts/check-agent-alignment.mjs
```

该脚本只加载 `src/core/proxy.ts` 的纯 Proxy 逻辑，不启动思源实例或 DOM。

## 兼容性与变更记录

以兼容旧脚本为优先。不要无声地改变用户可见行为；需要用户迁移的行为变化追加到 `.dev/changes/optimize-qv-agent-infra/BREAKCHANGE-v2.0.md`。已决定的 `keywordDoc` 兼容映射和文档级语义不要重新设计。

API 实现/签名问题、需要新增依赖的问题，先向负责的 supervisor 报告；不要借维护文档或生成器之名扩大范围。

## 构建与提交

- `NODE_ENV=development vite build` 会被 livereload 挂起；需要开发产物时使用 `vite build --watch` 配合超时，或直接检查已有产物。
- `tsconfig` 使用 `strict:false`；判别联合窄化使用 `in` 操作符，不依赖失效的类型收窄。
- `public/types.d.ts` 是构建产物。若它发生变化，单独使用 `chore` 提交，不与功能或文档提交混在一起。
- 提交消息遵循本仓库的 Conventional Commits + emoji 规范；提交前给出相关命令和退出码。
