---
name: qv-reference-alignment
description: 维护 Query&View 的源码、类型、JSDoc、动态别名与 Agent 参考文档对齐；当修改 QV API、注释、类型导出、生成器或需要复核参考内容时使用。
---

# Query&View 参考体系对齐

## 对齐模型

把同一个公共 API 的信息分成四类核对：

- **行为**：`src/core/` 的实际运行逻辑。
- **签名**：`types/core/*.d.ts` 的 TypeScript 声明。
- **说明**：源码 JSDoc；`docs/en_US/agent-ref/*.md` 只能由生成器产生。
- **动态名称**：Query 的 `addAlias()` 和 DataView 的 `register()` 调用点，以及它们运行时生成的大小写和 `add` 前缀变体。

生成器是搬运工具，不是语义裁判。QV 类型主要服务于 Agent 参考和开发提示；只有类型会误导使用者或显著增加负担时，才把精确化作为问题处理。

## 修改与复核

当改动涉及 API、JSDoc、类型声明、动态别名或参考文档时：

1. 先确定改动是行为、签名、说明还是别名集合。实现与公共语义不一致时先报告，不用注释或生成器掩盖行为问题；纯注释措辞与实现不符可以修正。
2. 对照实现、`types/core/*.d.ts` 和生成产物。特别检查 Proxy 返回值是否仍是 `IWrappedList`、单/多属性 `pick` 的形态、链式操作、DataView 注册别名和有副作用的渲染方法。
3. 不要手改 `docs/en_US/agent-ref/*.md`。修改源码 JSDoc 后运行：

   ```bash
   pnpm gen-ref
   pnpm gen-ref:check
   ```

   `gen-ref:check` 必须退出 `0`；它发现产物缺失或漂移时退出非零且列出文件。
4. 运行纯 Node 复核：

   ```bash
   node scripts/check-agent-alignment.mjs
   ```

   它从实际 `src/core/proxy.ts` 转译并加载纯 Proxy 逻辑，不需要思源实例、网络或 DOM。应覆盖 `pick('id')` 标量数组、`pick('id','content')` 对象数组、`filter`、`slice`、`map` wrapper、`groupby`、`unwrap` 及链式操作。
5. DOM、Kernel 请求、ECharts、Lute、DataView 构造/注册和渲染副作用不能由该脚本冒充验证；把它们标为需要思源运行时复测（I-50），并记录人工判断项。
6. 每个发现记录源码、声明、生成文档的路径和当前行号，写清证据、影响和建议归宿：修实现、修注释、修声明、后续运行时复测或仅记录。若是用户可见行为变化，追加 `.dev/changes/optimize-qv-agent-infra/BREAKCHANGE-v2.0.md`，不要无声破坏兼容性。

## 生成器边界

当前生成器能从字面量 `addAlias`/`register` 调用点展开名称，但变量驱动的别名循环（例如 `key.toLocaleLowerCase()`）不应被假定为已提取。检查 `KNOWN_NOTES` 时要确认每条提示仍被当前实现支持；N6 已修复的行为若仍被旧提示警告，应报告为生成器注入内容过期，而不是手改产物。

## 环境与提交

- 不使用 `NODE_ENV=development vite build` 做一次性验证；livereload 可能使命令挂起。
- `tsconfig` 为 `strict:false`；判别联合需要用 `in` 操作符。
- `public/types.d.ts` 是导出产物；它变化时单独以 `chore` 提交。
- 提交消息遵循 Conventional Commits + emoji；回报中列出命令、退出码、产物路径和 commit hash。
