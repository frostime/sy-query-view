# 自动验证报告 / Automated Validation

**节点：** `nodes/verify-docs-gui`
**执行时间：** 2026-08-11（工作树 = 未提交的 GUI+退役改动，HEAD = f7f55ac）
**范围：** 仅读取/构建/静态验证；未连接、安装或修改任何 SiYuan 用户工作区；未运行任何用户笔记 API。
**结论：** 所有可自动验证的目标约束均通过；`public/types.d.ts` 构建副作用已还原（与 HEAD 字节一致）。

---

## 1. 文档结构与 README 同步

| 检查 | 命令 | 结果 |
|---|---|---|
| 中英文 10 页结构对称 | `find docs/{zh_CN,en_US} -name "*.md"` | 两侧各 10 页：index、quickstart/{concepts,template}、examples/index、topics/{query,dataview,dataview-advanced,editor-tips}、api/reference、skill/index ✓ |
| 术语表 | `ls docs/` | `docs/TERM.md` 存在 ✓ |
| 图片迁移 | `ls docs/assets \| wc -l` | 76 张 ✓ |
| README 同步（只读检查，未运行会写文件的 docs:gen） | `npm run docs:check` | `OK README_zh_CN.md` / `OK README.md` ✓ |

## 2. docs-site 验证脚本（前序节点产物，全部可重跑）

| 脚本 | 命令 | 结果 |
|---|---|---|
| 内容逻辑（404 回退/缓存/500→network/双 404→not-found/占位符/降级/docs-only/clearCache/pluginName 透传，自包含临时目录发射+清理） | `node .dev/changes/query-view-docs-portal/nodes/build-docs-gui/verify-content.cjs` | `ALL PASS`（14 断言；临时目录清理 `exists=false`） |
| Lute Block DOM 选择器契约（vendored `88250/lute test/m2p_test.go` 用例 117/26/32/34/44/46/81/88/9：NodeCodeBlock/.hljs/data-type~=a/data-href/NodeHeading-h1/img src+data-src；render.ts 源码交叉核对；生产无硬编码插件名） | `node .dev/changes/query-view-docs-portal/nodes/build-docs-gui/verify-render-selectors.mjs` | `ALL PASS`（33 断言） |
| i18n 结构与值（js-yaml：yaml↔TS 声明双向一致；生产引用全在；保留键值与 HEAD 相等；退役键整体消失） | `node .dev/changes/query-view-docs-portal/nodes/retire-legacy-help/verify-i18n.mjs` | `ALL PASS`（11 断言） |

## 3. TypeScript 与完整构建

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit -p tsconfig.json` | 0 错误 ✓ |
| 干净构建（export-types → docs:check → vite:build → zipPack） | `rm -rf dist && npm run build` | exit 0；`docs:check` OK/OK；`built in 1.60s`；`Zip packing Done` ✓ |
| 构建副作用还原 | `git show HEAD:public/types.d.ts > public/types.d.ts; git diff --quiet public/types.d.ts` | 字节一致（exit 0）✓ |

### package.zip 内容（`unzip -l package.zip`）

| 内容 | 计数/条目 |
|---|---|
| `docs/zh_CN/*.md` | 10 ✓ |
| `docs/en_US/*.md` | 10 ✓ |
| `docs/assets/image-*.png` | 76 ✓ |
| `docs/TERM.md` | 1 ✓ |
| `example/exp-*.js` | 19 ✓ |
| `example/basic-template.js` | 1 ✓ |
| `types.d.ts` | 1 ✓ |
| `index.js` / `plugin.json` / README\*.md | 在包 ✓ |

### dist 产物抽查

- `dist/README.md`、`dist/README_zh_CN.md`：`REFERENCE-START/END` 计数 0 ✓
- `dist/index.js`：旧符号 `useUserReadme`/`createReadmeText`/`onlyImportDtsInUserDoc` 计数 0；`Examples` 仅 2 处且均为 i18n 值（`nav_examples`/`nav_group_examples` 侧边栏标签），非退役菜单 ✓
- `dist/i18n/{zh_CN,en_US}.json`：`src_docsite_indexts` 22 键在位；无 `src_userhelp_examplests`/`src_userhelp_sydocts`/`user_help` 组 ✓

## 4. 旧帮助机制退役静态检查

| 检查 | 命令 | 结果 |
|---|---|---|
| 旧符号消失 | `grep -rn "useUserReadme\|createReadmeText\|custom-query-view-user-readme\|onlyImportDtsInUserDoc" src/ scripts/` | 0（仅注释提及退役事实）✓ |
| 旧文件删除 | `ls src/user-help/` | 仅 `index.ts`、`dts-actions.ts`（sy-doc.ts/examples.ts/index.module.scss 已删）✓ |
| README 标记消失 | `grep -c "REFERENCE-START\|REFERENCE-END" README.md README_zh_CN.md` | 均 0 ✓ |
| 菜单注册收敛 | `src/user-help/index.ts` 全文 | 仅 `help_doc` 一个 `registerMenuItem`（→ `docsSite.open()`）；无 Examples/d.ts 菜单 ✓ |
| 设置项消失 | `grep -n "onlyImportDtsInUserDoc" src/setting/index.ts` | 0 ✓ |

## 5. docs-site 内容契约静态检查

| 检查 | 命令 | 结果 |
|---|---|---|
| 无用户笔记写操作 | `grep -rn "createDocWithMd\|updateBlock\|setBlockAttrs\|removeDoc\|renameDoc" src/docs-site/ src/user-help/dts-actions.ts` | 0 ✓（qv-basic 的 `insertBlock` 仅存在于 user-help/index.ts，属既有模板插入功能） |
| 无远程文档内容路径 | `grep -rn "https\?://" src/docs-site/ src/user-help/dts-actions.ts` | 0 ✓ |
| 无硬编码插件名 | `grep -rn "sy-query-view" src/docs-site/ src/user-help/dts-actions.ts` | 0 ✓；路径均经 `plugin.name`/`createContent(pluginName)` 透传（`src/docs-site/index.ts` L29/L49/L284 证据） |
| 模板唯一来源 | `src/user-help/index.ts` L27 | `fetch(/plugins/{pluginName}/example/basic-template.js)` + 缓存 ✓；`BASIC_TEMPLATE` 内嵌副本已删除 ✓ |

## 6. 工作树卫生

| 检查 | 命令 | 结果 |
|---|---|---|
| 行尾空白 | `git diff --check` | exit 0 ✓ |
| 越界路径 | `git status --short` 全量比对前序节点允许集 | 无越界改动；`.gitignore` 的 M 为任务前既有（含 `.pi-input.md` 条目）；`public/types.d.ts` 的 ` M` 为 core.autocrlf 统计缓存伪影（内容字节一致，`git diff --quiet` exit 0）✓ |
| 本节点写入 | — | 仅 `AUTOMATED-VALIDATION.md`、`RUNTIME-CHECKLIST.md`、本任务规格 ✓ |

---

## 未能自动验证的项（见 RUNTIME-CHECKLIST.md）

所有涉及真实 SiYuan 运行时/用户工作区的行为均未在此环境执行：Help Tab 打开与多开行为、Lute `Md2BlockDOM` 在真实内核版本上的渲染保真、剪贴板复制、语言切换与 404 回退 UI、API 页打开/下载动作、`qv-basic` 斜杠插入、旧帮助笔记不受影响、移动端不回归。本报告不将上述任何项伪装为已验证。
