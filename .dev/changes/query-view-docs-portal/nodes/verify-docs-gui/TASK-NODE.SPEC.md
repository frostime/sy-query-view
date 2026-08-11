# 验收人类文档与 GUI

**状态：** 已验收（自动验证）
**负责人：** worker `docs-site-worker`

## 任务目的

在不连接、不安装或修改用户 SiYuan 数据库的前提下，验证文档源、打包内容、文档站代码和旧帮助退役结果。将不能由当前环境验证的 SiYuan 运行时行为整理成最小手工检查清单，为后续 Skill 工作提供可信的稳定基线。

## 输入与边界

开始前阅读：

1. `../../TARGET.SPEC.md`、`../../THIS.RULE.md`、`../../TERM.md`、`../../DECISIONS.md`
2. 已验收节点：`../define-doc-structure/`、`../write-human-docs/`、`../shape-docs-gui/`、`../build-docs-gui/`、`../retire-legacy-help/`
3. 当前 docs、README、scripts、docs-site、user-help、setting、i18n 与 Vite/package 配置。

必须遵守：

- 只可写入本节点目录；不得修改生产代码、docs、README、设置、全局 change 文件、`.gitignore` 或 git 历史。
- 不运行安装脚本、不操作 SiYuan 用户目录、不调用用户笔记 API、不启动会修改用户数据的 UI 自动化。
- 构建造成的 `public/types.d.ts` 已知副作用必须在验证后还原，不能保留生产 diff。

## 预期输出

1. `AUTOMATED-VALIDATION.md`：记录可复现的命令、结果、构建包内容和静态契约检查。
2. `RUNTIME-CHECKLIST.md`：一份给人工在隔离测试工作区执行的简短检查清单，覆盖 Help Tab、语言、复制、API 动作、qv-basic、旧帮助笔记不受影响；明确本任务没有实际执行这些步骤。
3. 自动验证至少覆盖：
   - docs 结构、中英文页面和术语表；README 同步；
   - docs-site 内容/Block DOM 选择器/i18n 验证脚本；
   - 完整 build 与 package.zip 的 docs、assets、examples、types.d.ts；
   - 旧帮助消费者、设置、Reference 标记和菜单注册均已消失；
   - docs-site 不含用户笔记写操作、无远程文档内容路径、使用 plugin.name；
   - `git diff --check` 与禁止路径检查。
4. 对每个无法自动验证的运行时项目说明原因和后续人工验收条件，不把它伪装为已验证。

完成后更新本任务状态为“等待验收”，并简述自动验证结论、运行时待验证项和任何阻塞。

## 验收条件

- 自动验证可由后续 Agent 重跑，结果可定位到命令和证据。
- 已知目标约束均有至少一个静态或构建证据；人工运行时缺口明确、有限且不被遗漏。
- 本任务不产生任何用户数据或生产文件改动。
- 若自动验证发现目标不满足，任务必须标为受阻而非自行扩大范围修复。

## 结果与影响

**交付物：** 本目录新增 `AUTOMATED-VALIDATION.md`（可重跑命令/结果/证据表）与 `RUNTIME-CHECKLIST.md`（人工隔离测试工作区清单，A–H 共 22 项：Help Tab/语言/渲染只读/复制/API 动作/qv-basic/旧笔记不受影响/离线与移动端不回归；明确标注本任务未执行）。

**自动验证结论（全部通过）：** ① docs 结构：中英各 10 页对称、`docs/TERM.md` 在位、`docs/assets` 76 图；`npm run docs:check` OK/OK（只读，未运行写文件的 docs:gen）。② 前序验证脚本全部可重跑且 ALL PASS：`verify-content.cjs`（14 断言）、`verify-render-selectors.mjs`（33 断言）、`verify-i18n.mjs`（11 断言）。③ `npx tsc --noEmit` 0 错误；`rm -rf dist && npm run build` exit 0（docs:check OK/OK → vite:build → zipPack）；package.zip 含 docs/zh_CN 10 页、docs/en_US 10 页、docs/assets 76 图、docs/TERM.md、example/exp-*.js 19 个、basic-template.js、types.d.ts；dist README 无 REFERENCE 标记；dist/index.js 无旧符号（`Examples` 仅 2 处 i18n 侧边栏标签值）；dist/i18n 无退役组、`src_docsite_indexts` 22 键在位。④ 退役静态检查：旧符号/旧文件/设置项/标记/菜单注册全部消失（`src/user-help/` 仅剩 index.ts 与 dts-actions.ts，唯一 registerMenuItem 为 help_doc）。⑤ docs-site 契约：无用户笔记写操作、无远程内容路径、无硬编码插件名（全部 `plugin.name`/`pluginName` 透传）、模板唯一来源为 `basic-template.js`。⑥ `git diff --check` exit 0；`git status` 全量比对无越界改动（`.gitignore` 的 M 为任务前既有；`public/types.d.ts` 的 M 为 autocrlf 统计伪影，`git diff --quiet` 证明内容与 HEAD 字节一致）。

**构建副作用处理：** build 改写 `public/types.d.ts` 后已用 `git show HEAD:…` 精确还原，未保留任何生产 diff。

**运行时待验证项（未伪装为已验证，原因=需要真实 SiYuan 实例）：** Help Tab 打开/多开/关闭重开/卸载；Lute `Md2BlockDOM` 真实渲染保真与只读化；剪贴板复制与失败回退；语言切换与 404 回退 UI；API 页下载/本地打开动作；`qv-basic` 斜杠插入；旧帮助笔记不受影响；移动端不回归。全部列入 `RUNTIME-CHECKLIST.md`（A–H，含通过标准与执行记录区）。

**阻塞：** 无。若人工清单任一项目失败，应回到对应实现节点修复后重跑本验证，而非在本节点扩大范围。
