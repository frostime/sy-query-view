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
      {"id": "I-00", "title": "总体成功标准 / 推进深度", "prio": "P0", "status": "hang", "note": "里程碑处拍板走到哪一步（N5 集成已完成，剩余运行时复测、C-3、结项定稿）"},
      {"id": "I-03", "title": "2.0 全新 API 骨架", "prio": "P0", "status": "hang", "ev": "user", "note": "明确排除在本任务外，独立 backlog；防止本任务范围蔓延"},
    ]},
    {"key": "n6", "title": "N6 — 代码扫清（扫描/类型/注释）+ API 诚实化", "issues": [{"id": "I-31", "title": "面向 agent 注释约定定稿", "prio": "P0", "status": "hang", "note": "KNOWN_NOTES 注入口 + JSDoc 纯搬运已运转（N3 done 移交）；正式 [agent] tag 结构未定稿，落实注释动作归 N6/维护 SKILL"},{"id": "I-79", "title": "deprecated 参数名暴露内部实现（optionDeprecatedAsValMatch 等）", "prio": "P3", "status": "hang", "ev": "scan", "disposition": "待用户决策", "note": "独立节点（C-3）：用户决定保留 or 2.0 清理；2026-08-24 用户明确单独处理，不在 N6 本批做；对应 graph.yaml conditional_candidates C-3"},{"id": "I-81", "title": "request/renderAttr 属性=函数引用形态：短签名取不到参数名", "prio": "P3", "status": "open", "ev": "scan", "disposition": "待定", "note": "query.ts:474 `request: request`（initializer 是 Identifier）；途径：改代码形态（内联箭头函数）or 生成器增强（解析引用目标参数）"},{"id": "I-82", "title": "源码 JSDoc 偶见中文（query.ts:290 now 的 days 参数），en_US 文档原样带出", "prio": "info", "status": "open", "ev": "scan", "disposition": "补注释", "note": "纯搬运原则下生成器不改内容；是否英文化源码注释待 N6 处置（可与 I-31 注释约定一并考虑）"}]},
    {"key": "layer2", "title": "第 2 层 — 长期对齐规范（独立问题，只预订入口）", "issues": [
      {"id": "I-80", "title": "长期对齐规范机制（AGENTS.md / SKILL 形式）", "prio": "P2", "status": "open", "note": "机制初版已落地（2026-08-25 N4 交付）：AGENTS.md（仓库根）+ .agents/skills/qv-reference-alignment；内容随实践迭代"},
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