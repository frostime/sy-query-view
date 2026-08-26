# Query&View 项目协作规则

本仓库是思源笔记的 Query&View（QV）插件。各类工作分 Scope 约定规范：**改代码前先确认涉及哪个 Scope，只遵循该范围的要求**。通用协作原则见文末。

---

## 1. 运行时行为（`src/core/`）— 面向最终脚本用户

`//!js` 嵌入块直接调用这些 API，在浏览器/Electron 环境执行，是插件的用户契约。

规范：

- 兼容性优先：不改变既有脚本的行为；**用户可见的行为变化必须记录**到 `public/BREAKCHANGE/`（中英双语，随包分发并在内置文档站展示；格式与 CHANGELOG 同构）
- 公共 API 的运行时行为、类型声明、JSDoc 说明三者必须一致；声明或文档不能用来掩盖实现问题
- 行为/兼容性问题不明确时，先确认契约再动手；不自行拍板用户可见语义

检查：DOM/Kernel/副作用路径需在思源真实环境复测（Node 断言覆盖不了）。

## 2. 参考文档（`docs/en_US/agent-ref/`）— 面向 AI Agent，自动生成

产物由 `scripts/gen-agent-ref.mjs` 从源码生成（签名取 tsc 声明、说明取自源码 JSDoc、动态别名取自 `register()`/`addAlias()` 调用点），构建时复制进技能包供 Agent 读取。

规范：

- **禁止手工修改产物**；需要改内容时改源码 JSDoc 或实现
- 生成器是搬运工：不编造知识；`KNOWN_NOTES` 警示必须与源码现状一致（修复代码须同步删除过时条目）
- 行为要点写在源码 JSDoc 中（人写信息的唯一通道）

检查：

```bash
pnpm gen-ref         # 重新生成（先跑类型导出）
pnpm gen-ref:check   # 产物与生成结果比对，必须退出 0
node scripts/check-agent-alignment.mjs   # 核心行为断言，必须退出 0
```

遵循：`qv-reference-alignment` 维护 SKILL（存于 `.agents/`，位置可能随维护调整；若缺失则以本节规范为准）。

## 3. 类型定义（`types/*.d.ts`、`public/types.d.ts`）— 面向参考与开发提示

由 tsc 声明自动导出（`export-types`），不是手写真相源；QV 脚本运行时不经过类型检查。

规范：

- 类型只服务于 Agent 参考与开发时的提示
- 优先避免让使用者形成错误认知；不为理论上的精确度引入不必要复杂度

## 4. 构建与提交

- `public/types.d.ts` 是构建产物：有变化时**单独 chore 提交**，不与功能/文档提交混在一起
- 环境陷阱：`NODE_ENV=development vite build` 会被 livereload 挂起（需要 dev 产物时用 `vite build --watch` + 超时，或直接看产物）；`tsconfig` 为 `strict:false`，判别联合窄化用 `in` 操作符
- 提交消息遵循 Conventional Commits + emoji；提交前给出相关命令与退出码

---

## 5. 文档与工作产物布局

- 模块契约 `src/core/core.SPEC.md`：改 `src/core` 公共行为前必读；改行为的同一变更中同步更新
- 破坏性变更记录：`public/BREAKCHANGE/`（zh_CN 主文件 + en_US 同步维护）；维护流程见 `.agents/skills/qv-breakchange/SKILL.md`
- `.dev/changes/<slug>/`：单个进行中变更的工作区（spec/计划/交接）；完结后迁出持久知识，目录移入 `.dev/changes/archive/`（git 忽略）或删除
- `.dev/docs/`：跨模块持久文档（如上游思源版本行为分析）
- 参考文档对齐维护：`.agents/skills/qv-reference-alignment/SKILL.md`

---

## 通用协作原则

- **责任边界**：完成当前目标即可，不顺手扩大到无关重构、依赖或 API 设计
- **报告优先**：发现行为/声明/说明不一致时保留证据并报告；纯注释措辞与实现不符可以修正，但修正后需要重新生成参考文档