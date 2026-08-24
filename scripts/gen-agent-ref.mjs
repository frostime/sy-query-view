/**
 * gen-agent-ref.mjs — Query&View Agent Reference 生成器（正式版 v1）
 *
 * 用法：pnpm gen-ref（= npm run export-types && node scripts/gen-agent-ref.mjs）
 *
 * 原理（语义对齐三来源）：
 *   - 签名：从 tsc 声明产物 types/core/*.d.ts 提取（AST，禁止字符串切割）
 *   - 注释：从源码 JSDoc 提取（ts.getJSDocCommentsAndTags，人写信息的唯一通道）
 *   - 别名：从 register()/addAlias() 调用点展开（动态成员真相源）
 * 生成器不编造任何知识，只做搬运与拼接。
 *
 * 模块 → 输出文件：
 *   Query（含 Utils）          → docs/en_US/agent-ref/query-api.md
 *   DataView（组件+方法）       → docs/en_US/agent-ref/dataview.md
 *   WrappedList / WrappedBlock → docs/en_US/agent-ref/wrapped-list.md
 *   类型参考（手写 interface）   → docs/en_US/agent-ref/types.md
 */
import { Project, SyntaxKind, Node } from "ts-morph";
import ts from "typescript";
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(root, "docs/en_US/agent-ref");
const project = new Project({ tsConfigFilePath: path.join(root, "tsconfig.json") });

// ============ 工具 ============

/** 把 JSDoc comment（string | JSDocComment 节点数组）转成纯文本 */
function commentToText(comment) {
  if (comment == null) return "";
  if (typeof comment === "string") return comment;
  // JSDocComment 节点数组：递归拼接（含 {@link X} 内联标签的文本）
  return comment.map(c => {
    if (typeof c === "string") return c;
    return c.text ?? ""; // JSDocText / JSDocInlineTag 均有 .text
  }).join("").trim();
}

/** 从任意 ts-morph 节点拿结构化的 JSDoc（TS 官方 API，对 interface 成员/对象字面量成员统一有效） */
function extractDoc(compilerNode) {
  const units = ts.getJSDocCommentsAndTags(compilerNode);
  if (!units.length) return null;
  const jsdoc = units.find(ts.isJSDoc);
  if (!jsdoc) return null;
  const desc = commentToText(jsdoc.comment);
  const params = [], examples = [], returns = [], aliases = [];
  for (const tag of jsdoc.tags ?? []) {
    const c = commentToText(tag.comment).replace(/^-\s*/, ""); // 剥风格化前导 "- "
    switch (tag.tagName.text) {
      case "param": params.push({ name: tag.name?.getText() ?? "?", comment: c }); break;
      case "example": examples.push(c); break;
      case "returns": returns.push(c); break;
      case "alias": aliases.push(c); break;
    }
  }
  return { desc, params, examples, returns, aliases, hasDoc: true };
}

/** 短签名：名字 + 参数名列表（永不做字符串切割） */
function shortSig(name, params) {
  const ps = (params ?? []).map(p => p.getName() + (p.hasQuestionToken?.() ? "?" : ""));
  return `${name}(${ps.join(", ")})`;
}

/** 单行化签名文本（tsc 声明可能是多行的） */
function singleLine(text) {
  return text.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

/** 渲染一节 */
function renderSection({ heading, fullSig, doc, aliases, source, notes, noDoc }) {
  let s = `## ${heading}\n\n`;
  s += "```ts\n" + fullSig + "\n```\n\n";
  if (noDoc) {
    s += `> ⚠ 无 JSDoc 说明（行为未验证）——请查阅源码或官方教程\n\n`;
  } else {
    if (doc.desc) s += doc.desc + "\n\n";
    if (doc.params.length) {
      s += "**参数**\n\n";
      s += doc.params.map(p => `- \`${p.name}\` — ${p.comment}`).join("\n") + "\n\n";
    }
    if (doc.returns.length) s += "**返回**：" + doc.returns.join("；") + "\n\n";
    if (doc.examples.length) {
      s += "**示例**\n\n```ts\n" + doc.examples.join("\n\n") + "\n```\n\n";
    }
  }
  if (notes?.length) s += notes.map(n => `> ⚠ ${n}`).join("\n") + "\n\n";
  if (aliases?.length) s += `**全部可用名**（${aliases.length}，register/别名规则展开）：${aliases.map(a => "`" + a + "`").join(" · ")}\n\n`;
  if (source) s += `**来源** \`${source}\`\n\n`;
  s += "---\n\n";
  return s;
}

// ============ 已知不对齐清单（Worker-B 校验 + N1 原型确认的坑；N6 处置前先诚实标注） ============
const KNOWN_NOTES = {
  "Query.childDoc": ["实际返回 **wrapped 列表**（可用 .pick()/.groupby()/.addcols()），tsc 声明写作 Block[]，与实现不符"],
  "Query.keywordDoc": ["`join:'or'` 并不真正 OR：SQL 阶段是 OR，但后续过滤仍要求每个关键词都命中，实际接近 AND"],
  "Query.Utils.today": ["默认 `hms=true` 返回 14 位完整戳 yyyyMMddHHmmss；false 才返回 8 位；thisWeek 从周日开始"],
  "Query.Utils.thisWeek": ["默认 `hms=true` 返回 14 位完整戳 yyyyMMddHHmmss；false 才返回 8 位；本周从周日开始计算"],
  "dv.columns": ["`flex:[1,1,2]` 实际未按列生效：实现把 --flex-grow 写为父容器单一变量反复覆盖（已知限制，勿依赖）"],
  "dv.echartsTree": ["顶层 `layout:'radial'` 参数实际被忽略，实现硬编码为 'orthogonal'"],
  "dv.render": ["**非纯渲染**：执行时持久化嵌入块（POST /api/search/updateEmbedBlock，内容取该块 innerText）。静态视图末尾调一次；勿在循环/高频路径调用"],
  "dv.details": ["content 为字符串时**直拼 innerHTML**——原始 HTML，不是 markdown；默认 `open=true`（默认展开）"],
  "list.pick": ["**单/多属性返回不同**（声明未体现）：`pick('id')` 返回标量数组；`pick('id','content')` 返回对象数组"],
};

// ============ 1. Query 模块 ============
function genQuery() {
  const src = project.getSourceFileOrThrow("src/core/query.ts");
  const decl = project.createSourceFile(
    "__q.d.ts", fs.readFileSync(path.join(root, "types/core/query.d.ts"), "utf8"), { overwrite: true });

  // 源码：对象字面量属性（JSDoc + 参数名 + 行号）
  const QVar = src.getVariableDeclarations().find(v => v.getName() === "Query");
  const qObj = QVar.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  const srcProps = new Map();
  for (const p of qObj.getProperties()) {
    const ini = p.getInitializer?.();
    let params = [];
    if (Node.isArrowFunction(ini)) params = ini.getParameters();
    else if (Node.isFunctionExpression(ini)) params = ini.getParameters();
    srcProps.set(p.getName(), {
      doc: extractDoc(p.compilerNode),
      params,
      line: p.getStartLineNumber(),
    });
  }

  // 声明：Query 类型字面量属性（完整签名）
  const qDecl = decl.getVariableDeclarations().find(v => v.getName() === "Query");
  const qType = qDecl.getTypeNode();
  const sigByName = new Map();
  if (Node.isTypeLiteral(qType)) {
    for (const prop of qType.getProperties()) {
      const t = prop.getTypeNode();
      if (t && !prop.hasQuestionToken()) {
        sigByName.set(prop.getName(), singleLine(`${prop.getName()}: ${t.getText()}`));
      }
    }
  } else {
    // 兜底：从类型对象取（不理想，不应走到）
    for (const prop of qDecl.getType().getProperties()) {
      sigByName.set(prop.getName(), `${prop.getName()}: ${prop.getTypeAtLocation(qDecl).getText()}`);
    }
  }

  // 动态别名：addAlias 调用点
  const qAlias = new Map(); // target -> [{base, aliases}]
  for (const call of src.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const txt = call.getText();
    const m = txt.match(/addAlias\((Query(?:\.Utils)?),\s*['"`](\w+)['"`](?:\s*,\s*\[([^\]`]*)\])?\)/);
    if (m) {
      const list = m[3] ? m[3].split(",").map(s => s.trim().replace(/'|`/g, "")).filter(Boolean) : [];
      if (!qAlias.has(m[1])) qAlias.set(m[1], []);
      qAlias.get(m[1]).push({ base: m[2], aliases: list });
    }
  }

  let md = "# Query API 参考（自动生成，来源：src/core/query.ts）\n\n";
  md += "> 本文件由 `scripts/gen-agent-ref.mjs` 生成——签名取 tsc 声明、注释取源码 JSDoc、别名取 addAlias 调用点。请勿手改；修改请改源码注释。\n\n";

  const renderMember = (fullName, name, m) => {
    const sig = sigByName.get(name);
    if (!sig) return;
    const aliasList = (qAlias.get("Query") ?? []).filter(a => a.base === name)[0]?.aliases ?? [];
    md += renderSection({
      heading: shortSig(fullName, m.params),
      fullSig: sig,
      doc: m.doc,
      noDoc: !m.doc,
      notes: KNOWN_NOTES[fullName],
      aliases: aliasList.length ? [name, ...aliasList] : null,
      source: `src/core/query.ts:${m.line}`,
    });
  };

  for (const [name, m] of srcProps) {
    if (name === "Utils") continue; // 单独子模块
    renderMember(`Query.${name}`, name, m);
  }

  // Utils 子模块
  const utilsProp = srcProps.get("Utils");
  const utilsObj = qObj.getProperty("Utils").getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (utilsObj) {
    md += `## Query.Utils\n\n> 工具函数集合，全部为同步函数，无需 await。注册于对象 \`Query.Utils\`。\n\n---\n\n`;
    for (const p of utilsObj.getProperties()) {
      const ini = p.getInitializer?.();
      let params = [];
      if (Node.isArrowFunction(ini)) params = ini.getParameters();
      else if (Node.isFunctionExpression(ini)) params = ini.getParameters();
      const doc = extractDoc(p.compilerNode);
      const sig = sigByName.get("Utils");
      // Utils 成员的签名从声明嵌套类型取
      let subSig = null;
      const utilsSig = qType && Node.isTypeLiteral(qType) ? qType.getProperty("Utils")?.getTypeNode() : null;
      if (utilsSig && Node.isTypeLiteral(utilsSig)) {
        const sub = utilsSig.getProperty(p.getName())?.getTypeNode();
        if (sub) subSig = singleLine(`${p.getName()}: ${sub.getText()}`);
      }
      const aliasList = (qAlias.get("Query.Utils") ?? []).filter(a => a.base === p.getName())[0]?.aliases ?? [];
      md += renderSection({
        heading: shortSig(`Query.Utils.${p.getName()}`, params),
        fullSig: subSig ?? `${p.getName()}: …（签名提取失败）`,
        doc,
        noDoc: !doc,
        notes: KNOWN_NOTES[`Query.Utils.${p.getName()}`],
        aliases: aliasList.length ? [p.getName(), ...aliasList] : null,
        source: `src/core/query.ts:${p.getStartLineNumber()}`,
      });
    }
  }

  return md;
}

// ============ 2. DataView 模块 ============
function genDataView() {
  const src = project.getSourceFileOrThrow("src/core/data-view.ts");
  const decl = project.createSourceFile(
    "__dv.d.ts", fs.readFileSync(path.join(root, "types/core/data-view.d.ts"), "utf8"), { overwrite: true });
  const dvClass = decl.getClass("DataView");
  const methods = dvClass.getMethods().filter(m => !m.hasModifier(SyntaxKind.PrivateKeyword));

  // register 调用点：基名 → 完整别名集合（复刻 register 命名规则）
  const regAliases = new Map(); // base -> Set<name>
  for (const call of src.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const txt = call.getText();
    const m = txt.match(/this\.register\(this\.(\w+)(?:,\s*\{[^}]*aliases:\s*\[([^\]]*)\][^}]*\})?\)/s);
    if (!m) continue;
    const base = m[1];
    const aliases = m[2] ? m[2].split(",").map(s => s.trim().replace(/'/g, "")).filter(Boolean) : [];
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const set = new Set([base, ...aliases]);
    for (const a of [...set]) { set.add(cap(a)); set.add(a.toLowerCase()); }
    const full = new Set();
    for (const a of set) {
      full.add(a); full.add("add" + a); full.add("add" + cap(a)); full.add("add" + a.toLowerCase());
    }
    regAliases.set(base, [...full].sort());
  }

  let md = "# DataView 组件参考（自动生成，来源：src/core/data-view.ts）\n\n";
  md += "> 本文件由 `scripts/gen-agent-ref.mjs` 生成——签名取 tsc 声明、注释取源码 JSDoc、别名取 register 调用点。组件经 `register()` 运行时注册，衍生出完整别名集合（含大小写与 `add` 前缀）。请勿手改。\n\n";

  for (const m of methods) {
    const name = m.getName();
    const srcMethod = src.getClass("DataView").getMethod(name);
    const hasSrc = !!srcMethod;
    const doc = hasSrc ? extractDoc(srcMethod.compilerNode) : extractDoc(m.compilerNode);
    const srcParams = hasSrc ? srcMethod.getParameters() : m.getParameters();
    const aliases = regAliases.get(name);
    md += renderSection({
      heading: shortSig(`dv.${name}`, srcParams),
      fullSig: singleLine(m.getText()),
      doc,
      noDoc: !doc,
      notes: KNOWN_NOTES[`dv.${name}`],
      aliases,
      source: hasSrc ? `src/core/data-view.ts:${srcMethod.getStartLineNumber()}` : `types/core/data-view.d.ts`,
    });
  }
  return md;
}

// ============ 3. WrappedList 模块 ============
function genWrappedList() {
  const src = project.getSourceFileOrThrow("src/core/proxy.ts");
  let md = "# WrappedList 工具参考（自动生成，来源：src/core/proxy.ts）\n\n";
  md += "> 查询/组件 API 返回的包裹列表与包裹块，提供数据处理方法。请勿手改。\n\n";

  for (const iname of ["IWrappedList", "IWrappedBlock"]) {
    const iface = src.getInterface(iname);
    const typeParams = iface.getTypeParameters().map(tp => tp.getText()).join(", ");
    const heritage = iface.getHeritageClauses().map(h => h.getText()).join(" ");
    md += `## ${iname}${typeParams ? `<${typeParams}>` : ""} ${heritage ? `(extends ${heritage})` : ""}\n\n`;
    md += "```ts\n" + singleLine(iface.getText()) + "\n```\n\n---\n\n";
    for (const m of [...iface.getMethods(), ...iface.getProperties()]) {
      const doc = extractDoc(m.compilerNode);
      const aliasList = doc?.aliases ?? [];
      md += renderSection({
        heading: shortSig(`list.${m.getName()}`, m.getParameters?.() ?? []),
        fullSig: singleLine(m.getText()),
        doc,
        noDoc: !doc,
        notes: KNOWN_NOTES[`list.${m.getName()}`],
        aliases: aliasList.length ? [m.getName(), ...aliasList] : null,
        source: `src/core/proxy.ts:${m.getStartLineNumber()}`,
      });
    }
  }
  return md;
}

// ============ 4. 类型参考 ============
function genTypes() {
  const src = project.getSourceFileOrThrow("src/types/data-view.d.ts");
  let md = "# 类型参考（自动生成，来源：src/types/data-view.d.ts）\n\n";
  md += "> 构造 DataView 组件 options 时需要的接口定义。请勿手改。\n\n";
  for (const iface of src.getInterfaces()) {
    const doc = extractDoc(iface.compilerNode);
    md += `## ${iface.getName()}\n\n`;
    if (doc?.desc) md += doc.desc + "\n\n";
    md += "```ts\n" + singleLine(iface.getText()) + "\n```\n\n---\n\n";
  }
  return md;
}

// ============ 主流程 ============
if (!fs.existsSync(path.join(root, "types/core/query.d.ts"))) {
  console.error("[gen-agent-ref] 缺少 types/core/*.d.ts —— 请先运行 `npm run export-types`");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const outputs = [
  ["query-api.md", genQuery()],
  ["dataview.md", genDataView()],
  ["wrapped-list.md", genWrappedList()],
  ["types.md", genTypes()],
];

const changed = [];
for (const [file, content] of outputs) {
  const target = path.join(OUT_DIR, file);
  const old = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  fs.writeFileSync(target, content);
  if (old !== content) changed.push(file);
}
console.log(`[gen-agent-ref] 已生成 ${outputs.length} 份参考文档 → ${OUT_DIR}`);
if (changed.length) console.log(`[gen-agent-ref] 变更：${changed.join(", ")}`);
else console.log("[gen-agent-ref] 无变更（与上次生成一致）");