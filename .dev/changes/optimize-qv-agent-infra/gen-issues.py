# issues.yaml 的生成器：改数据 → `python gen-issues.py` → 重新 dump 并校验
# 避免手工维护 YAML 的引号/多行/冒号踩坑（本项目已踩三次）。
import yaml, sys

OUT = ".dev/changes/optimize-qv-agent-infra/issues.yaml"

data = {
  "meta": {
    "purpose": "候选 issue 池：可处理、可抛弃、可新增",
    "status_values": ["open", "hang", "active", "done", "wontfix"],
    "prio_values": ["P0", "P1", "P2", "info"],
  },
  "domains": [
    {"key": "milestone", "title": "决策里程碑（悬空优先，需用户拍板）", "issues": [
      {"id": "I-00", "title": "总体成功标准 / 推进深度", "prio": "P0", "status": "hang", "note": "里程碑处拍板走到哪一步（N1 PoC 或 N4 或 N5 集成）"},
      {"id": "I-01", "title": "消费形式拍板（md 主 / d.ts 核对层）", "prio": "P0", "status": "done", "note": "用户拍板（2026-08-24）：markdown 主格式；类型诚实（I-17）后置。d.ts 作为签名核对层的定位保留"},
      {"id": "I-02", "title": "结项复核的定位与时机（原则确认）", "prio": "P0", "status": "hang", "note": "用户定义：本轮结尾（如 N6 阶段）派 subagent 复核，或写可长期复用的检测脚本；原则已定（第 1 层结束时要有验证手段），细节不提前敲死；对应节点可预订、后置。见 TERM.md『结项复核』"},
      {"id": "I-03", "title": "2.0 全新 API 骨架", "prio": "P0", "status": "hang", "ev": "user", "note": "明确排除在本任务外，独立 backlog；防止本任务范围蔓延"},
    ]},
    {"key": "n1", "title": "N1 — 高保真提取 / 导出机制", "issues": [
      {"id": "I-10", "title": "签名提取禁止字符串切割", "prio": "P0", "status": "done", "ev": "N1", "note": "原型教训：split(\"{\") 破坏类型；签名一律走类型检查器/tsc 声明"},
      {"id": "I-11", "title": "签名生成器正式化（ts-morph getType + tsc 声明）", "prio": "P1", "status": "open", "note": "附录 A.2/A.3 桥接表已定义；N1 收尾实现"},
      {"id": "I-12", "title": "Query 对象字面量只有匿名类型", "prio": "P1", "status": "open", "note": "declare const Query: {...} 无命名类型；是否生成命名 QueryAPI interface"},
      {"id": "I-13", "title": "UseStateMixin 不能干净导出", "prio": "P1", "status": "open", "note": "export-types 靠字符串 hack 抹除 extends UseStateMixin；use-state.d.ts 被注释"},
      {"id": "I-14", "title": "export-types.js 脆弱字符串替换", "prio": "P2", "status": "open", "note": "import(\"./proxy\"). 剥离、default;→Query、mixin 抹除；新管线不复刻"},
      {"id": "I-15", "title": "ts-morph getTags(name) 按名过滤失效", "prio": "info", "status": "open", "note": "遍历 + getTagName() 过滤可绕过；工具降级记录，非阻塞"},
      {"id": "I-16", "title": "依赖升级不解决问题", "prio": "info", "status": "done", "ev": "N1", "note": "TS 5.7.2/ts-morph 24 已够；动态别名进静态类型是语言语义限制，升级无解"},
      {"id": "I-17", "title": "源码类型声明的诚实度是文档准确度天花板", "prio": "P0", "status": "open", "note": "用户拍板（2026-08-24）：后置——等整个生成框架跑通后再回头修源码类型（先跑通，再保证内容正确）。生成器对已知不对齐点先用标注/待核实呈现"},
    ]},
    {"key": "n2", "title": "N2 — 生成格式与文档结构", "issues": [
      {"id": "I-20", "title": "嵌套对象字面量展示策略", "prio": "P1", "status": "open", "note": "Query.Utils 类型整段展开超长；摘要 or 递归"},
      {"id": "I-21", "title": "每节模板固化", "prio": "P1", "status": "open", "note": "签名→说明→行为要点→示例→来源；grep 定位性（用户偏好）"},
      {"id": "I-22", "title": "行为要点 = 源码注释（生成器纯搬运）", "prio": "P0", "status": "active", "ev": "user", "note": "用户已确认：任何人写的信息都进 JSDoc，生成器一个字不编（语义对齐的文档侧来源）"},
    ]},
    {"key": "n3", "title": "N3 — 生成器机制：动态 API 与注释提取规则", "issues": [
      {"id": "I-30", "title": "register/addAlias 调用点生成别名", "prio": "P1", "status": "open", "note": "demo 已验证（19 处 register→171 名、8 组 Query 别名）；正式化已完成（gen-agent-ref.mjs），条目待验收关闭"},
      {"id": "I-31", "title": "面向 agent 注释约定定稿", "prio": "P0", "status": "hang", "note": "[agent] 占位的具体 tag/结构（默认值/副作用/陷阱怎么标注）；设计归 N3，落实到源码注释的动作归 N6"},
    ]},
    {"key": "n4", "title": "N4 — 对齐验证（后置预订，不纳入前期处理）", "issues": [
      {"id": "I-40", "title": "结项复核对象清单（预备清单）", "prio": "P1", "status": "open", "note": "预订到 N6 阶段要验证的已知不对齐点（childDoc wrapped、today hms、pick 标量、details innerHTML、columns flex、render 副作用、alias 存在性）。细节待结项时定"},
      {"id": "I-41", "title": "生成物一致性检查（生成+diff）", "prio": "P2", "status": "open", "note": "生成物提交后 git diff --exit-code；是否进 CI 后置评估"},
      {"id": "I-42", "title": "可复用检测脚本形态", "prio": "P2", "status": "open", "note": "结项复核落地为可长期复用的脚本/子流程的形态评估；可能过度工程，留到 N6 阶段再决定"},
    ]},
    {"key": "n5", "title": "N5 — 与 SKILL/发布体系集成", "issues": [
      {"id": "I-50", "title": "运行时复测", "prio": "P1", "status": "hang", "ev": "HO", "note": "技能注册无 warn、Agent 读 references/、dev 改 SKILL 即同步"},
      {"id": "I-51", "title": "参考文档双语镜像 or 改契约", "prio": "P2", "status": "hang", "ev": "HO", "note": "DOC-STRUCTURE §1.2 要求同构；现只有 en_US"},
      {"id": "I-52", "title": "参考文档是否进文档站导航", "prio": "P2", "status": "hang", "ev": "HO", "note": "PAGE_TREE 无条目；新机制后形态待重估"},
      {"id": "I-53", "title": "SKILL 触发面验证", "prio": "P3", "status": "open", "ev": "HO", "note": "若未来接思源 Agent 自动触发需另验证"},
      {"id": "I-54", "title": "README 提及 Agent 入口", "prio": "info", "status": "wontfix", "ev": "HO", "note": "用户明确：README 是纯用户门面，勿擅自加"},
    ]},
    {"key": "n6", "title": "N6 — 代码扫清（扫描/类型/注释）+ API 诚实化", "issues": [
      {"id": "I-60", "title": "childDoc/keywordDoc/fb2p/pruneBlocks 声明 Block[] 实为 wrapped", "prio": "P0", "status": "open", "ev": "WB", "disposition": "修类型", "note": "query.ts:729/881/956/1077；d.ts 同错；含 I-17 类型诚实前置。根因：wrapList 无返回标注（proxy.ts:254），new Proxy 推断为 Block[]；修法：wrapList 加 `: IWrappedList<Block>` 返回标注，下游声明自动修正"},
      {"id": "I-61", "title": "pick('id') 单属性返回标量，多属性返回对象；声明统一 Partial<T>", "prio": "P0", "status": "open", "ev": "WB", "disposition": "修类型", "note": "proxy.ts:283-310；双 overload 或文档化"},
      {"id": "I-62", "title": "map 声称保留 wrapper 实为普通数组（override 被注释）", "prio": "P2", "status": "open", "ev": "WB", "disposition": "修实现/文档化/抛弃", "note": "proxy.ts:404-424"},
      {"id": "I-63", "title": "keywordDoc({join:'or'}) SQL OR 但后续仍要求全匹配", "prio": "P1", "status": "open", "ev": "WB", "disposition": "修实现/文档化", "note": "query.ts:843-886"},
      {"id": "I-64", "title": "时间函数默认 hms=true（非 yyyyMMdd）；thisWeek 从周日始", "prio": "P1", "status": "open", "ev": "WB", "disposition": "文档化", "note": "query.ts:294-315；文档曾写反"},
      {"id": "I-65", "title": "dv.render() 会写嵌入块（updateEmbedBlock）副作用", "prio": "P0", "status": "open", "ev": "WB", "disposition": "文档化", "note": "data-view.ts:1423；行为确认，不轻易改"},
      {"id": "I-66", "title": "useState 会话/块属性延迟持久化未文档化", "prio": "P1", "status": "open", "ev": "WB", "disposition": "文档化", "note": "use-state.ts:69-75"},
      {"id": "I-67", "title": "details content 字符串直拼 innerHTML（非 markdown）；open=true", "prio": "P1", "status": "open", "ev": "WB", "disposition": "文档化", "note": "data-view.ts:515-527"},
      {"id": "I-68", "title": "addmd 实支持 KaTeX（文档称不支持）", "prio": "P1", "status": "open", "ev": "WB", "disposition": "修文档", "note": "components.ts:1352-1374；行为正确，文档错"},
      {"id": "I-69", "title": "echartsTree layout:'radial' 参数被忽略（硬编码 orthogonal）", "prio": "P1", "status": "open", "ev": "WB", "disposition": "修实现/文档化", "note": "data-view.ts:1151-1158；选项从未生效（兼容安全）"},
      {"id": "I-70", "title": "addcolumns flex:[1,1,2] 未按列生效", "prio": "P1", "status": "open", "ev": "WB", "disposition": "修实现/文档化", "note": "data-view.ts:686-690"},
      {"id": "I-71", "title": "关系图/嵌入组件默认值缺（flowchart+LR、breadcrumb、zoom1）；graph roam 默认 false", "prio": "P2", "status": "open", "ev": "WB", "disposition": "文档化", "note": "data-view.ts:790/1031/1322"},
      {"id": "I-72", "title": "graph 渲染 mutate 调用者链接对象（删 source/target）", "prio": "P2", "status": "open", "ev": "WB", "disposition": "修实现/文档化", "note": "data-view.ts:1308-1318"},
      {"id": "I-73", "title": "minAppVersion 3.1.14 vs SKILL 称 3.8.0；顶层 await 需 3.8.0", "prio": "P1", "status": "open", "ev": "WB", "disposition": "修文档", "note": "plugin.json:5；index.ts:100；分层事实"},
      {"id": "I-74", "title": "Query.request 是内核请求非任意 HTTP；Query.gpt 才是外部 fetch", "prio": "P0", "status": "open", "ev": "WB", "disposition": "修文档", "note": "api.ts:12；query.ts:1108；安全边界说明"},
      {"id": "I-75", "title": "IDataView 手写桩只有 render()，与真实 class 脱节", "prio": "P1", "status": "open", "ev": "WB", "disposition": "规范/废弃", "note": "src/types/data-view.d.ts"},
      {"id": "I-76", "title": "IWrappedList 假泛型：interface <T> 但实现硬编码 Block", "prio": "P2", "status": "open", "ev": "scan", "disposition": "修类型", "note": "proxy.ts:74 附近 interface 写泛型，pick/omit 等 case 实现全是 (keyof Block)[]；建议定死 IWrappedList<Block> 或真泛型"},
      {"id": "I-77", "title": "内部方法未标 private：isValidViewContainer 确定标；view 待拍板", "prio": "P2", "status": "open", "ev": "scan", "disposition": "修类型", "note": "标 private + @internal 后从 d.ts 消失（stripInternal），生成器无需过滤；view 无文档引用但为 addElement 基础，保守保留待用户拍板"},
      {"id": "I-78", "title": "details 无 JSDoc（register 组件中唯一无注释）", "prio": "P1", "status": "open", "ev": "scan", "disposition": "补注释", "note": "data-view.ts:515-527；补注释样本（含 innerHTML 直拼/open=true 行为真相），生成器对无注释输出占位行；附初稿见本会话讨论"},
      {"id": "I-79", "title": "deprecated 参数名暴露内部实现（optionDeprecatedAsValMatch 等）", "prio": "P3", "status": "open", "ev": "scan", "disposition": "文档化", "note": "query.ts handleOptions 模式；这些参数名会进 agent 参考；改名需 breaking change"},
      {"id": "I-81", "title": "request/renderAttr 属性=函数引用形态：短签名取不到参数名", "prio": "P3", "status": "open", "ev": "scan", "disposition": "待定", "note": "query.ts:474 `request: request`（initializer 是 Identifier）；途径：改代码形态（内联箭头函数）or 生成器增强（解析引用目标参数）"},
    ]},
    {"key": "layer2", "title": "第 2 层 — 长期对齐规范（独立问题，只预订入口）", "issues": [
      {"id": "I-80", "title": "长期对齐规范机制（AGENTS.md / SKILL 形式）", "prio": "P2", "status": "open", "note": "用户定义：让后续协作持续保持『语义对齐』的规范，属长期 infrastructure 问题，独立于本轮 graph 任务；此处只订入口，条件：第 1 层结项后评估。规范内容不得在本任务中提前定死"},
    ]},
    {"key": "research", "title": "悬空研究（不做也 OK）", "issues": [
      {"id": "I-90", "title": "2.0 骨架方向性调研入口", "prio": "P2", "status": "open", "note": "未来独立任务入口，现在不启动"},
      {"id": "I-91", "title": "「面向 agent 的 API 设计原则」提炼", "prio": "P2", "status": "open", "note": "从 N6 修补中总结（行为可预期/类型准确/例外最少），供 2.0 用"},
      {"id": "I-92", "title": "新参考文档的打包分发形态评估", "prio": "P2", "status": "open", "note": "构建 copy 管线沿用或改造"},
    ]},
  ],
}

header = """# optimize-qv-agent-infra — Issue 候选池
# 性质（重要）：
#   这不是承诺清单，是「当前阶段梳理出的候选」。绝大多数 issue 不是必须做，
#   可处理、可抛弃、可随时间新增。何时处理、是否处理，由推进过程与用户决策决定。
# 术语定义与对照见同目录 TERM.md（语义对齐 / 第1层第2层 / 参考文档 / 生成器 /
# 注册调用点 / 结项复核 / wrapped 列表 / 坑清单 / breaking change 文档）。
# 本文件由 gen-issues.py 生成：改内容请改脚本数据后 `python .dev/changes/optimize-qv-agent-infra/gen-issues.py`。
"""

body = yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=160, default_flow_style=False)
open(OUT, "w", encoding="utf-8").write(header + body)
d2 = yaml.safe_load(header + body)
total = sum(len(x["issues"]) for x in d2["domains"])
print(f"OK: {OUT} 重建完成并校验通过；issues 总数 {total}")