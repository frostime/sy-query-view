# 接入 Skill 并做整体发布验证

**状态：** 执行中
**负责人：** worker `docs-site-worker`

## 任务目的

让中英文文档站的“智能体技能”页面从同一份已验收的 `skills/sy-query-view/SKILL.md` 展示内容，并确保原始 Skill 随插件包发布。完成全量静态、构建和发布包验证，不实现或暗示 Skill 已安装、启用或接入 SiYuan Agent。

`references/` 文件读取研究由用户明确延后，不是本节点依赖，也不得在本节点创建。

## 已确认接入契约

1. 两个产品页面只维护各自本地化说明和同一个占位符：`{{skill:sy-query-view}}`；不得复制 Skill 正文。
2. 文档站运行时从 `/plugins/{pluginName}/skills/sy-query-view/SKILL.md` 读取；路径必须使用实际 `plugin.name`，不硬编码插件名。
3. README 生成器从仓库 `skills/sy-query-view/SKILL.md` 展开同一占位符。
4. 展示转换规则两端一致：YAML frontmatter 作为 `yaml` fenced code block 显示，frontmatter 后的正文继续按 Markdown 渲染；源文件内容不在 docs 中维护副本。
5. 缺 Skill 文件时：作者侧 README 生成必须失败；文档站运行时显示明确的本地缺失提示并 `console.warn`，页面其他说明仍可读，失败内容不缓存。
6. 原始 `skills/**` 随插件打包；“可在文档站查看”不等于“已安装或启用”。

## 输入

开始前阅读：

- `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../DECISIONS.md`、`../../graph.md`；
- `../write-core-skill/TASK-NODE.SPEC.md` 与 `verify-skill.mjs`；
- `../build-docs-gui/verify-content.cjs`、`../verify-docs-gui/AUTOMATED-VALIDATION.md`、`RUNTIME-CHECKLIST.md`；
- `skills/sy-query-view/SKILL.md`；
- `docs/{zh_CN,en_US}/skill/index.md`；
- `src/docs-site/{content,index}.ts`；
- `scripts/{build-docs,check-docs-sync}.js`、`vite.config.ts`、`package.json`。

## 允许修改

- `docs/zh_CN/skill/index.md`、`docs/en_US/skill/index.md`；
- `src/docs-site/content.ts`、`src/docs-site/index.ts`；
- `scripts/build-docs.js`；
- `vite.config.ts`；
- 由 `npm run docs:gen` 生成的 `README.md`、`README_zh_CN.md`；
- 本节点目录。

不得修改：

- 核心 `SKILL.md`（已验收）、其他 docs 页面、examples、i18n、设置、旧帮助、API、package/plugin 配置、全局 change 文件、`.gitignore`、`.pi/`、git 历史；
- 不创建 `references/`、安装器、Skill 状态 UI、Agent/MCP 集成；
- 不连接或修改用户 SiYuan 数据，不运行安装脚本。

## 实现要求

1. `ContentApi` 增加职责明确的 Skill 展开方法和独立成功缓存；`clearCache()` 同时清理。占位符只接受安全技能名，固定映射到本地 `skills/{name}/SKILL.md`。
2. `index.ts` 在案例展开后继续 await Skill 展开，并按现有 `requestSeq + siteGeneration + disposed` 契约再次检查，旧请求不得更新 DOM。
3. README 生成顺序为 docs-only 处理 → example 展开 → skill 展开 → 图片路径 → 标题降级；Skill body 的标题必须参与统一降级。
4. Vite 生产复制与 dev watch 均包含 `skills/**`；不把 `.dev` 验证材料打包。
5. 两端 frontmatter 展示转换必须对 LF/CRLF 输入一致；若 frontmatter 不存在，完整正文直接显示。不得擅自解析或改写 Skill 规则。

## 验证与交付

本节点创建自包含验证材料，至少证明：

- 双语页面各含且仅含一个相同 Skill 占位符，不含 Skill 正文副本；
- 运行时 URL 使用假插件名透传；成功展开、缓存、CRLF 归一化、frontmatter fenced 展示、缺文件降级和 `clearCache` 重取均可复现；
- README 两种语言均展开同一 Skill 内容，frontmatter/正文关键标识存在且无占位符残留；docs 同步检查通过；
- `vite.config.ts` 复制与 watch 均覆盖 skills；完整 build 后 `dist/skills/sy-query-view/SKILL.md` 与仓库源字节一致，`package.zip` 包含它；
- 已有 content/render/runtime/i18n/Skill 验证脚本全部通过；TypeScript、`git diff --check`、旧帮助静态检查通过；
- 构建产生的 `public/types.d.ts` 副作用恢复，`.gitignore`/`.pi/` 不进入改动。

完成后把本规格改为“等待验收”，记录准确命令、结果、包内证据与真实 SiYuan 剩余复测项。不得提交。

## 验收条件

- 文档站与 README 展示的 Skill 规则只能追溯到同一原始 `SKILL.md`，不存在第二份正文。
- Skill 原始文件随包发布且离线可读；无安装/启用/Agent 接入的虚假承诺。
- 既有页面加载竞态、语言回退、案例展开、复制与只读行为不回归。
- 自动发布验证通过；真实 SiYuan 中 Skill 页面展示仍明确留作人工复测。

## 结果与影响

等待执行。
