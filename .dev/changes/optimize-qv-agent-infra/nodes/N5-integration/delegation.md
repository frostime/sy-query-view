---
title: N5 — 与 SKILL/发布体系集成（委托执行）
created: 2026-08-25
status: delegated
supervisor: pi main agent（本 session）
executor: reusable subagent（本 brief 接收者）
---

# N5 集成执行委托

## 节点职责与为什么重要

N5 是第 1 层的收尾节点：让「自动生成的 Agent 参考文档」成为插件发布体系的一部分——
文档站可见、SKILL 按新参考翻新、Agent 的最终 fallback 从 GitHub 变成本地打包源码。
第 1 层结项时，用户打开插件文档站和技能包应直接看到新机制的产物，而不是 v1.3 的手工体系。

## 已拍板的决策（勿重开，勿自行扩大范围）

1. **minAppVersion 3.1.14 → 3.8.0**（用户拍板 2026-08-25）
   - plugin.json 同步修改
   - src/index.ts 中 3.1.25/3.1.26 版本检查段删除（minAppVersion 已在安装时拦截，变成死代码）；相关 i18n 键清理
   - BREAKCHANGE-v2.0.md 追加条目（对用户可见：插件最低版本提升，v2.0 发布时用户需思源 3.8.0+）
2. **文档站新增「Agent Reference」组 4 个页面**（用户拍板：四个独立条目；只 en_US，fallback 机制已存在，勿做 zh_CN 镜像）
   - 页面源 = 现有生成产物 docs/en_US/agent-ref/{query-api,dataview,wrapped,types}.md（勿手工改这些 md）
   - 导航：src/docs-site/nav.ts（PageId 联合、PAGE_TREE reference 组、NavLabelKey）+ i18n 侧边栏标签键（zh_CN/en_US 文案）
   - content.ts 无需改（通用 fetch + Lute 渲染 + fallback 已支持）
3. **api/reference.md 退役（用户拍板「拆分退役」）**
   - 手写导览部分退役：删 docs/en_US/api/reference.md 与 docs/zh_CN/api/reference.md
   - 其「打开/下载 types.d.ts」操作（docs-only 块 + src/docs-site/index.ts 的 pageActions["api-reference"]）**转移**到文档站首页（index 页）：index.md 加 docs-only 块 + pageActions 注册挪到 index
   - nav.ts 移除 api-reference 条目（PageId/NavLabelKey/i18n 键清理）；README.md/README_zh_CN.md 中该页链接改为新目标
4. **SKILL 翻新**（用户拍板：参考原 SKILL 思路，把参考体系改成新版）
   - 文件：skills/sy-query-view/SKILL.md（单一真相源；文档站 skill 页经 {{skill:}} 展开自动跟随，勿另改 docs/*/skill/index.md）
   - 原 SKILL 的组织思路保留：pre-requisites → 30 秒介绍 → 场景表（校准示例）→ 工作流 → 安全边界 → 分级参考文件地图 → grep 定位策略
   - 但参考体系整体换成新版四份：references/query-api.md、dataview.md、wrapped.md、types.md（构建时从 docs/en_US/agent-ref 复制，SKILL 内路径引用不变）
   - 正文逐节核对 v2 语义（以新参考 + 源码为准）：keywordDoc 的 relation/'any'/'all' 与 limit=文档数、keyword 的 join 兼容映射、map/concat/toSorted 为原生透传（返回普通数组，无 wrapper 方法）、pick('id') 返回标量数组、sorton 默认 desc、时间函数（today/thisWeek/nextWeek/lastWeek）默认 hms=true、dv.details 裸 HTML、dv.render 持久化副作用、Query.request 仅内核请求、gpt 是唯一外部 HTTP API、wrapList 元素形态（filter/slice 结果元素为 wrapped、map 结果为裸元素）
   - ⚠ 未知或与源码冲突的表述：记录到交付报告的「存疑清单」，不要自行拍板
5. **核心源码打包**（用户拍板：只打「核心影响 Query 使用的部分」）
   - 构建时把 **src/core/query.ts 与 src/core/proxy.ts 两份**复制进技能包 `references/source/`（vite.config.ts 的 copySkillReferences 扩展，逻辑参考已有 agent-ref 复制段）
   - SKILL §6 fallback 链更新：references 四份 → 插件包 docs → **references/source 本地源码**（新，最终兜底）→ GitHub（仅当本地文件不可读时）
   - 单元：query.ts（1.2k 行）+ proxy.ts（0.5k 行）≈ 80KB，体积可接受

## 边界与禁止（重要）

- **不提交 git**。只改工作区，交付 diff 与报告；提交由 supervisor 验收后另行处理。
- 不修改 docs/en_US/agent-ref/*.md（生成产物，禁手改）；不修改生成器/断言脚本/公共 API 行为。
- 不碰 src/core/* 的运行时逻辑（除 index.ts 版本检查删除外）；不碰 .dev/changes/optimize-qv-agent-infra/ 下任何文件（graph/issues 归 supervisor）。
- 用户可见语义出现新的不确定点：停下记录到报告，不自行决定。
- 构建验证注意环境陷阱：NODE_ENV=development 的 vite build 会被 livereload 挂起——用 production 构建（npm run build 或 vite:build）验证打包产物。

## 预期结果与验收证据（supervisor 验收用）

1. plugin.json minAppVersion=3.8.0；index.ts 无 3.1.25/26 检查；BREAKCHANGE 有新条目
2. nav.ts：reference 组 = Agent Reference（4 页）+ Skill；无 api-reference；i18n 键齐全（zh/en）
3. docs 无 api/reference.md；首页含 d.ts open/download 块；README 链接有效
4. SKILL.md：参考地图四份全列、v2 语义核对完成、fallback 链含 references/source；无 v1.3 残留表述（或残留列在报告）
5. 构建产物（dist/）：skills/sy-query-view/references/ 含四份参考 + source/{query,proxy}.ts
6. 验证命令全绿：pnpm gen-ref:check（先 npm run export-types 如有需要）、node scripts/check-agent-alignment.mjs

## 交付物

改动 diff（git diff）+ 简短报告：改了什么、SKILL 存疑清单（如有）、验证输出。

## 冷启动指引

- 本 brief 的决策与边界可信，无需重新调研或质疑
- 需要读的文件：skills/sy-query-view/SKILL.md、src/docs-site/nav.ts、src/docs-site/index.ts、src/i18n/*（找到 docsite 相关键）、vite.config.ts、src/index.ts、plugin.json、docs/en_US/agent-ref/*.md（核对用）、README.md、README_zh_CN.md、BREAKCHANGE-v2.0.md
- 生成产物不必读全（1.2k~2k 行）；用 grep 找到相关 API 段落再读