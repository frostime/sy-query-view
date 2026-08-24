---
title: N0 探索分支 → 回退方向确认节点（分支间 handover）
created: 2026-08-24T17:30:00+08:00
from: Tree branch "基本可以吧…" (N0 探索) → 回退至 "方向请你确认" 节点后继续
consumed: false
---

# Handover: 分支回退（N0 探索产出 → 新的主线继续）

## Assume Reader

从「方向请你确认：按 tsc 核心导出 + register/addAlias 调用点生成动态成员集合 + 结项复核这条路继续？」对话节点之后继续工作的 Pi Coding Agent。该 Reader 拥有此节点之前的全部对话上下文（含 Worker-B 校验材料、导出调研结论、P0 决策讲解），且可检查当前工作区（.dev/changes/optimize-qv-agent-infra/ 下的稳定文件均在，分支回退不回滚文件）。本 handover 只补充**探索分支（N0）中影响后续执行、且无法从稳定文件恢复**的信息。

## Background Context

用户原计划：探索「面向 Agent 的 API 参考体系」——从源码自动生成参考文档（语义对齐：实际行为/类型/文档三者一致）。在方向确认节点处，用户未直接回答，而是提出"先看实物效果"，由此产生 N0 探索分支：做了原型、建立了候选池与术语体系、提炼了语义对齐框架。现在用户回退到方向确认节点，已经**重新给出确认**（见下）。N0 探索结论全部有效并已固化，作为本分支的输入知识，不重做。

## Current Status

- 方向已确认：**tsc 核心导出 + register/addAlias 调用点生成动态成员集合 + 结项复核**，继续走。
- 用户拍板：消费形式 = **markdown 主格式**（d.ts 降级为签名核对层）；**类型诚实后置**（先跑通框架，再回头修源码类型）。
- 下一步（已与用户对齐）：**N1 收尾 = 生成真实产物样本**——一份带完整别名的 DataView 方法声明 markdown（签名 + JSDoc + 别名集 + 行号，全部自动提取），连上 N2/N3 的格式讨论。

## N1 收尾结论（2026-08-24，产物为临时物）

- **生成器**：`tmp/gen-dv-ref.mjs`（临时工具，勿入正式管线）；产物样本 `tmp/dataview-reference-gen.md`（18 组件、171 别名，**主 agent 无需读它**，本段结论即其全部价值）。
- **签名提取**：ts-morph 用 `useInMemoryFileSystem` 加载 `types/core/data-view.d.ts`，`getMethod(base).getText()` 单行化——完整不截断。教训：正则文本提取不可靠（曾因非贪婪匹配到对象类型内第一个 `;` 而截断 options）。
- **JSDoc 提取**：`ts.getJSDocCommentsAndTags` 对全部 18 个注册组件有效；唯一无 JSDoc 的是 `details`（覆盖率问题实证，N3 补注释的起点；其余 17 个注释质量好，含默认值——「注释即行为真相」在老代码已部分成立）。
- **别名展开**：register 调用点展开准确，累计 171 名字；按组件分组展示成立，平铺是灾难。
- **N2/N3 待决策**（由样本实景暴露）：①长签名单行化约 200 字符（table options）——单行 or 折行（I-20/I-21）；②无注释组件只有签名+别名，需占位提示 or 补注释（I-31/I-32）。
- **类型诚实后置**（用户拍板）：样本未标注已知不对齐（render 副作用等），先跑通框架，回头按坑清单处理（I-17/I-65/I-70）。
- **手写成本确认**：产物 100% 自动，人写投入 = 源码注释本身；生成器自身健壮性（如截断 bug）属 I-11 正式化时解决。


## Trajectory（N0 探索分支的成就，仅列影响后续执行的）

1. **原型与机制验证**：`prototypes/agent-ref-v0.md`（含附录 A：源码→桥接→文档三对应、A.4 诚实性前置）——用户审阅过正文与附录，方向认可。原型中字段标记 🤖（自动提取）/✍️（本质是源码注释）/⚠（已知不对齐）。
2. **候选池与术语治理**：`issues.yaml`（46 条，由 `gen-issues.py` 生成）+ `TERM.md`（能指→所指对照，含已淘汰名称）。用户明确：候选池非承诺清单，可处理/可抛弃/可新增。
3. **语义对齐框架**（用户定义，最高优先级）：函数实际做的 / 类型标注 / 文档标注三者一致。第 1 层=本轮任务；第 2 层=长期协作规范（AGENTS.md/SKILL，只预订入口 I-80，不提前定细节）。
4. **结项复核定义**（用户修正我误用的"测试"）：本轮结尾（如 N6 阶段）派 subagent 复核，或写可长期复用的检测脚本；原则现在定、细节后置。**不要在前期把复核细节敲死**。

## Key Information for the Successor

- **决策**：I-01 消费形式已 done（markdown）；I-17 类型诚实 open（后置，先跑通）；I-02 结项复核原则待正式固化（hang）。详情见 `issues.yaml`。
- **生成器技术要点**（N1 已验证，勿重做调研）：
  - 签名：ts-morph 定位节点 + 类型检查器/tsc 声明；**禁止字符串切割**（I-10）；`types/core/*.d.ts` 是现成干净签名源。
  - 注释：`ts.getJSDocCommentsAndTags(node.compilerNode)` 对 interface 成员与对象字面量成员统一有效（ts-morph 的 `getJsDocs()` 对 PropertyAssignment 不可用）；`getTags(name)` 按名过滤失效，自行遍历。
  - 别名：提取 `this.register(this.X, {aliases:[...]})` / `addAlias(...)` 调用点 → 按 register 命名规则展开（19 处 register → 171 个名字；验证脚本 `tmp/smoke-dynamic.mjs`）。
  - 依赖升级无解（I-16）；动态别名进静态类型是语言语义限制。
- **类型诚实后置的执行含义**：生成器对已知不对齐点（childDoc 等 wrapped 声明、pick 单属性标量）用「待核实」标注呈现，**不要在本阶段修源码类型**（那是框架跑通后 I-17/I-60 的活）。
- **工具脚本**：`tmp/` 下有 smoke-extract.mjs / smoke-tags.mjs / smoke-dynamic.mjs / mini-generator.mjs / proto-gen.mjs，可复用或废弃。
- **环境陷阱**（graph.yaml runtime_rules 同源）：`NODE_ENV=development vite build` 会被 livereload 挂起；tsconfig `strict:false` 判别联合窄化失效（用 `in` 操作符）；`types.d.ts` 是构建产物，提交时单独 chore commit。

## File Reference Map

| 文件 | 用途 |
|---|---|
| `.dev/changes/optimize-qv-agent-infra/graph.yaml` | 任务控制状态（target/节点/已接受结论/风险/待决）|
| `.dev/changes/optimize-qv-agent-infra/issues.yaml` | 候选池 46 条（gen-issues.py 生成，勿手改）|
| `.dev/changes/optimize-qv-agent-infra/gen-issues.py` | issues.yaml 生成器（改数据 → 重跑）|
| `.dev/changes/optimize-qv-agent-infra/TERM.md` | 术语登记册（语义对齐/第 1-2 层/结项复核/生成器/注册调用点/wrapped 列表…）|
| `.dev/changes/optimize-qv-agent-infra/prototypes/agent-ref-v0.md` | 原型 v0（形态样本 + 附录 A 三对应）|
| `tmp/dataview-reference-gen.md` + `tmp/gen-dv-ref.mjs` | N1 收尾产物（临时）：DataView 参考文档自动生成样本与生成器，**结论已入本 handover** |
| `.dev/changes/optimize-qv-agent-infra/entry-handoff/` | 上一个 session 的入口材料（Worker-B 校验等）|
| `src/core/data-view.ts` / `query.ts` / `proxy.ts` / `components.ts` | 生成器输入（真相源）|
| `types/core/*.d.ts` | tsc 声明产物（干净签名源）|