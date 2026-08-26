---
name: qv-breakchange
description: 维护 Query&View 的破坏性变更记录（BREAKCHANGE.md）；当修改 src/core 公共 API 的用户可见行为、废弃或移除 API、需要判定改动属 fix 还是 breaking change 时使用。
---

# Query&View 破坏性变更维护

政策权威：`src/core/core.SPEC.md` 第 2 节（生命周期、警告通道要求、收录边界）。本文件只提供操作流程；对齐义务（JSDoc/类型/参考文档同步）遵循 `qv-reference-alignment` SKILL。

## 第一步：判定变更类别

对每一项用户可见的行为改动，先回答：**旧行为是否从未按预期工作过？**

- 是 → 属 fix error，不进 BREAKCHANGE.md。若 JSDoc/类型描述了错误行为，同步修正并重新生成参考文档。
- 否 → 进入第二步分类。

## 第二步：分类处置

**A. 直接破坏**（新行为随发布立即生效）

1. 前置检查：该用法是否已在 BREAKCHANGE.md 预告区登记？
   - 已预告 → 执行移除：在目标版本的「Break Change in v{version}」区新增条目（含迁移路径），并从预告区删除对应条目。
   - 未预告 → 原则上不得直接破坏；确有必要时（如安全原因）与用户确认后按已预告流程处理，并在条目注明跳过预告的原因。
2. 同步义务见 `qv-reference-alignment`；若触及 `core.SPEC.md` §3 不变量，同一变更中更新 SPEC。

**B. 废弃**（进入兼容期）

四件事缺一不可（细节见 SPEC §2）：兼容映射保留旧行为；运行时警告（复用 query.ts 的 `handleOptions()`，勿另起炉灶）；类型声明保留旧形态；BREAKCHANGE.md 预告区登记条目。

预告区的准入标准：条目必须是对脚本作者的**承诺**——移除意图已定，读者能据此开始迁移。维护者内部未决的清理想法、待定项一律不进 BREAKCHANGE.md，待拍板后再登记。

**C. 仅声明层面变化**（运行时不变）

类型层面的变化不构成 break change——运行时行为是唯一判定基准：

- 声明与既有运行时不符的修正 → 属 fix error，记入 CHANGELOG 的 Fixed；
- 公开类型删除/收紧迫使 TS 作者改代码的 → 记入 CHANGELOG 的 Changed，并注明"类型层面，运行时无变化"。

两者均不进 BREAKCHANGE.md。

## 第三步：登记格式

- 文件：仓库根 `BREAKCHANGE.md`，Keep a Changelog 式按版本分节；未发布内容放 `[Unreleased]`，发版时随之改为版本号。
- 实际破坏 → 目标版本「### Break Change in v{version}」；废弃预告 → 待发布版本的「### Future Break Change Forenotice」。
- 条目必须包含：受影响 API、旧行为与新行为对照（差异复杂时用表格）、对现有脚本的影响、迁移方式。
- 语言面向脚本作者（终端用户），不使用仓库内部术语。

## 提交前检查

- [ ] BREAKCHANGE.md 已更新，条目含迁移路径
- [ ] `pnpm gen-ref:check` 与 `node scripts/check-agent-alignment.mjs` 均退出 0
- [ ] 若触及 SPEC §3 不变量，`core.SPEC.md` 已同步
