# 接入 Skill 并做整体发布验证

**状态：** 已验收（自动与构建验证）
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

**改动（全部在允许路径内）：**

1. `docs/{zh_CN,en_US}/skill/index.md`：本地化简介更新为现在时（技能已存在），各含且仅含一个 `{{skill:sy-query-view}}` 占位符，不复制 Skill 正文。
2. `src/docs-site/content.ts`：`ContentApi` 新增 `expandSkill(md)`；占位符正则只接受安全技能名 `[a-zA-Z0-9_-]+`，固定映射 `/plugins/{pluginName}/skills/{name}/SKILL.md`（pluginName 透传）；独立成功缓存 `skillCache`（key=技能名，存 LF 归一化原文），`clearCache()` 同时清理；缺文件时返回双语缺失提示并 `console.warn`，失败不缓存，页面其余说明仍可读；导出纯函数 `skillToDisplay`（frontmatter→yaml 围栏 + 正文 Markdown，输入 LF 归一化，无 frontmatter 时全文直显）。
3. `src/docs-site/index.ts`：navigate 在 `expandExamples` 之后 `await content.expandSkill(md)`，并按既有 `requestSeq + siteGeneration + disposed` 契约再次检查后才更新 DOM。
4. `scripts/build-docs.js`：新增 `skillToDisplay` 与 `expandSkill`（作者侧缺 Skill 文件直接抛错），拼装顺序为 docs-only → example → **skill** → 图片路径 → 标题降级（Skill 正文标题参与统一降级，yaml 围栏不受降级影响）；导出 `skillToDisplay` 供一致性验证。
5. `vite.config.ts`：viteStaticCopy 增加 `{ src: "./skills/**", dest: "./" }`，dev watch fg 列表增加 `'./skills/**'`。
6. README 经 `npm run docs:gen` 重建（两种语言均展开同一 Skill 内容）。

**验证（节点自包含脚本 `verify-skill-integration.mjs`，全部 ALL PASS，exit 0）：**

- 双语页面各含且仅含一个相同占位符、无其他占位符、无 Skill 正文副本（3×2 断言）；
- 运行时（tsc 发射 content.ts 至 OS 临时目录、finally 清理并证明 `exists=false`）：fetch URL 为 `/plugins/test-plugin/skills/sy-query-view/SKILL.md`（假插件名透传）；成功展开为 yaml 围栏 + Markdown 正文；成功内容缓存（二次调用无新 fetch）；CRLF 归一化；缺文件降级提示 + 不缓存（重取）；`clearCache` 后重取；不安全名（`{{skill:../evil}}`、`{{skill:a/b}}`）不展开、不发起 fetch；
- 两端 frontmatter 展示转换一致性：运行时发射产物与 `scripts/build-docs.js` 的 `skillToDisplay` 在 LF/CRLF/无 frontmatter/frontmatter-only 四组输入上逐字节一致；
- README 两种语言：无 `{{skill:` 残留、含 yaml 围栏、frontmatter 标识（`name: sy-query-view`、`description:`）、正文标识（Working workflow、Minimal skeleton）、Skill 标题降级（`### 1. Purpose and scope`）；
- vite 配置：静态复制与 dev watch 均含 `./skills/**`；
- 打包：`dist/skills/sy-query-view/SKILL.md` 与仓库源**字节一致**（9567/9567），`package.zip` 含 `skills/sy-query-view/SKILL.md`，zip 无 `.dev/` 条目；
- 前序全部验证脚本通过：verify-skill、verify-content、verify-render-selectors、verify-i18n、verify-runtime-fixes；
- `npm run docs:check` OK/OK；`npx tsc --noEmit` 0 错误；`npm run build` exit 0（docs:check OK/OK → vite:build → zipPack）；`git diff --check` exit 0；旧帮助静态检查通过（唯一命中为 build-docs.js 中说明退役事实的注释）；`public/types.d.ts` 构建副作用已还原（字节一致）。

**包内证据：** `package.zip` 含 `skills/sy-query-view/SKILL.md`（9567B，与源字节一致）、`docs/`（20 页 + assets 76 图 + SVG）、`example/`（19 案例 + basic-template.js）、`types.d.ts`、`i18n/zh_CHT.json` 等；无 `.dev/` 内容。

**真实 SiYuan 复测项（保留给用户/主 Agent 隔离工作区）：** ① 打开“智能体技能”页：frontmatter 以 yaml 代码块展示、正文按 Markdown 渲染，与 README 中展示一致；② 页面其余导航/语言/复制/只读行为不回归；③ “可在文档站查看”不等于“已安装/已启用”——插件管理界面不出现技能安装/启用状态（本节点未实现任何此类 UI）；④ 原始 SKILL.md 在插件目录 `data/plugins/sy-query-view/skills/sy-query-view/SKILL.md` 离线可读。

**最终验收：** 主 Agent 亲自检查运行时一次展开、竞态守卫、生成器顺序、Vite 路径和包内容；修正嵌套占位符二次展开风险并补强字节级验证后，最终独立 reviewer 结论为 `ACCEPT`。真实 SiYuan Skill 页面展示仍按人工清单复测。

**（修正轮）** 按终审意见修正四项并保持 `等待验收`：

1. **运行时 expandSkill 改为切片重建**（`src/docs-site/content.ts`）：用原始页面 `md.matchAll` 的索引/切片重构输出（`md.slice(last, idx)` + 展开结果 + 更新 last），插入的 Skill 正文永不重扫、不会被再次展开；异步按占位符出现顺序依次 await，缓存与安全名（`[a-zA-Z0-9_-]+`）行为不变。**行为测试**：mock Skill “first” 正文含字面 `{{skill:sy-query-view}}`，原始页面为 `{{skill:first}} tail {{skill:sy-query-view}}`——断言输出中 `{{skill:sy-query-view}}` 字面出现恰 1 次（嵌套插入文本保持字面）、yaml 围栏恰 2 个（两个原始占位符均展开）。**one-pass 一致性**：同一 mock 解析器下，运行时输出与生成器 `expandSkillText`（`String.replace` 回调天然不重扫）输出逐字节相等。
2. **验证器证据加强**：① 无正文副本断言升级为“实质性行对比”（SKILL.md 中 trim 后 ≥30 字符的行逐一检查不出现于页面，剔除占位符行后）+ 页面尺寸上界（chars<800、行数<14）；② `index.ts` 源码断言：`expandSkill` await 位于 `expandExamples` 之后，且其后的 `seq !== requestSeq || gen !== siteGeneration || disposed` 守卫同现；③ 生成器管道顺序断言：`stripDocsOnly < expandExamples < expandSkill < normalizeImagePaths < shiftHeadings`（源码调用点索引序）；④ 作者侧缺文件抛错行为测试：`gen.expandSkill("{{skill:definitely-missing-skill-xyz}}", "en_US")` 必须抛含 “skill file not found” 的错误（`expandSkillText` 纯函数 + 导出，生产接口保持合理）；⑤ dev watch 检查改称“config-level coverage, not a running watch test”。
3. **原始字节比对**：dist 与 package.zip 内 SKILL 条目均以 raw Buffer 比对（`readFileSync().equals()`）；包内提取用 `unzip -p package.zip skills/sy-query-view/SKILL.md`（js-yaml 非 zip 工具、adm-zip 不存在；`unzip` 失败时显式 FAIL 并带错误信息，不静默）；listing 仍证明条目存在且无 `.dev/` 条目。
4. **重跑结果**：`verify-skill-integration.mjs` 52 项断言 ALL PASS（exit 0，最终构建后复跑）；`npm run docs:gen`/`docs:check` OK/OK；`npx tsc --noEmit` 0 错误；`npm run build` exit 0；`git diff --check` exit 0；`public/types.d.ts` 已还原（字节一致）。真实 SiYuan 复测项同前（技能页展示、无安装/启用 UI、离线 SKILL.md 可读、其余回归项）。
