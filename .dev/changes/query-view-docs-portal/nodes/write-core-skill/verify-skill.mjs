// 核心技能内容验证（可复现：node .dev/changes/query-view-docs-portal/nodes/write-core-skill/verify-skill.mjs）
// 检查：frontmatter（js-yaml）、必需章节、自包含（无 references/ 依赖、无未验证的安装/加载承诺）、
// 以及正文 API 引用与权威来源（public/types.d.ts、basic-template.js、exp-*.js）的逐项一致性。
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import yaml from "js-yaml";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../../../..");

let fail = 0;
const check = (name, cond, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
    if (!cond) fail++;
};

const skillPath = path.join(repo, "skills/sy-query-view/SKILL.md");
let skill;
try {
    skill = readFileSync(skillPath, "utf8");
    check("SKILL.md exists at skills/sy-query-view/SKILL.md", true);
} catch {
    check("SKILL.md exists at skills/sy-query-view/SKILL.md", false);
    process.exit(1);
}

// ---- 1. frontmatter（js-yaml 解析）----
const fm = /^---\n([\s\S]*?)\n---\n/.exec(skill);
check("YAML frontmatter present", fm !== null);
if (fm) {
    let meta = null;
    try {
        meta = yaml.load(fm[1]);
    } catch (e) {
        console.log("  yaml error:", e.message);
    }
    check("frontmatter parses as YAML", meta !== null);
    check("frontmatter has stable name", meta !== null && meta.name === "sy-query-view");
    check("frontmatter has English description", meta !== null
        && typeof meta.description === "string" && meta.description.trim().length > 20
        && !/[\u4e00-\u9fff]/.test(meta.description));
    check("no extra required frontmatter keys invented", meta !== null
        && Object.keys(meta).every((k) => ["name", "description"].includes(k)));
}

// ---- 2. required sections（标题可带编号与后缀，如 "## 5. Core API facts (exact names ...)"）----
const sectionNames = ["Purpose and scope", "Working workflow", "Minimal skeleton", "Core API facts", "Adapting shipped examples", "Verification and iteration", "Safety boundaries"];
for (const s of sectionNames) {
    const header = skill.split("\n").find((l) => /^#{2,3} /.test(l) && l.replace(/^#+ \d*\.?\s*/, "").startsWith(s));
    check(`section present: "${s}"`, header !== undefined);
}

// ---- 3. self-contained ----
check("disclaims references/ readability (whitespace-normalized)",
    skill.replace(/\s+/g, " ").includes("no `references/` material is assumed to be readable"));
check("no instruction to read references/", !/read `references\/`|see `references\/`|open `references\/`/i.test(skill));
check("no unverified install/load promise",
    !/(will be (auto|automatically) (installed|loaded)|skill\.load\(|MCP integration|automatically install)/i.test(skill));
check("explicitly states skill does not install itself", skill.includes("does not install itself"));

// ---- 4. grounding: receiver-specific（按 Query/DataView/IWrappedList/IWrappedBlock 作用域分类） ----
const dts = readFileSync(path.join(repo, "public/types.d.ts"), "utf8");
const querySrc = readFileSync(path.join(repo, "src/core/query.ts"), "utf8");
const dvSrc = readFileSync(path.join(repo, "src/core/data-view.ts"), "utf8");

// 花括号平衡作用域提取（defensible structured scope）
const braceScope = (src, anchor) => {
    const start = src.indexOf(anchor);
    if (start < 0) return null;
    let i = src.indexOf("{", start);
    if (i < 0) return null;
    let depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
            depth--;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    return null;
};
const queryScope = braceScope(dts, "declare const Query");
const dvScope = braceScope(dts, "export declare class DataView");
const iwbScope = braceScope(dts, "export interface IWrappedBlock");
const iwlScope = braceScope(dts, "export interface IWrappedList");

// 作用域内 4 空格缩进的成员名（get/set/static/readonly 前缀、泛型、方法/属性声明）
const memberNames = (scope) => {
    const names = new Set();
    if (!scope) return names;
    for (const m of scope.matchAll(/^\s{4}(?:(?:get|set|static|readonly)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*[:(]/gm)) {
        names.add(m[1]);
    }
    return names;
};
const queryMembers = memberNames(queryScope);
const dvMembers = memberNames(dvScope);
const iwbMembers = memberNames(iwbScope);
const iwlMembers = memberNames(iwlScope);
check("dts scopes extracted (Query/DataView/IWrappedBlock/IWrappedList)",
    [queryScope, dvScope, iwbScope, iwlScope].every((s) => s !== null));

// 运行时注册别名（事实源：src/core/query.ts addAlias、src/core/data-view.ts 属性别名与 register 展开）
const registeredAliases = new Set();
for (const m of querySrc.matchAll(/addAlias\(Query,\s*'([^']+)',\s*\[([^\]]*)\]\)/g)) {
    for (const a of m[2].matchAll(/'([^']+)'/g)) registeredAliases.add(`Query.${a[1]}`);
}
for (const m of dvSrc.matchAll(/\n\s+([a-zA-Z]+) = this\.([a-zA-Z]+);/g)) {
    registeredAliases.add(`dv.${m[1]}`);
}
const dvNames = new Set();
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
for (const m of dvSrc.matchAll(/this\.register\(this\.([a-zA-Z]+)(?:, \{ aliases: \[([^\]]*)\] \})?\)/g)) {
    const aliasSet = new Set([m[1], ...(m[2] ? [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [])]);
    const expanded = new Set();
    for (const a of aliasSet) {
        expanded.add(a);
        expanded.add(capitalize(a));
        expanded.add(a.toLowerCase());
    }
    for (const e of expanded) {
        dvNames.add(e);
        dvNames.add(e.toLowerCase());
        dvNames.add("add" + e);
        dvNames.add("add" + e.toLowerCase());
    }
}

// 接收者分类：Query.* 只对 Query 作用域；dv.* 只对 DataView 作用域；list.*→IWrappedList；b.*→IWrappedBlock
// 成员名允许数字与下划线（如 fb2p），避免截断
const classify = (token) => {
    const [recv, name] = /^([A-Za-z0-9]+)\.([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(token)?.slice(1) ?? [];
    if (!recv || !name) return null;
    if (recv === "Query") {
        if (queryMembers.has(name)) return "canonical";
        if (registeredAliases.has(token)) return "alias";
        if (name === "fb") return "unsupported";
        return null;
    }
    if (recv === "dv") {
        if (dvMembers.has(name)) return "canonical"; // 与运行时别名可重叠（removeview/replaceview 两者皆是）
        if (registeredAliases.has(token) || dvNames.has(name)) return "registered";
        return null;
    }
    if (recv === "list") return iwlMembers.has(name) ? "canonical" : null;
    if (recv === "b" || recv === "IWrappedBlock") return iwbMembers.has(name) ? "canonical" : null;
    if (recv === "IWrappedList") return iwlMembers.has(name) ? "canonical" : null;
    return null;
};

// token 提取：成员名允许数字与下划线（Query.fb2p 必须整体捕获，不得截断为 Query.fb）
const tokenRe = /(?:Query|dv|IWrapped[A-Za-z]+|list)\.[a-zA-Z_][a-zA-Z0-9_]*|b\.(?:aslink|asurl|asref)/g;
const tokens = [...new Set(skill.match(tokenRe) ?? [])];
const unclassified = tokens.filter((t) => classify(t) === null);
check("every API token classifies (receiver-specific) as canonical | alias/registered | unsupported", unclassified.length === 0, unclassified.join(", "));

// 负向对照：错误接收者的 API 必须无法分类
check("negative control: Query.render does NOT classify", classify("Query.render") === null);
check("negative control: dv.sql does NOT classify", classify("dv.sql") === null);

// 截断防护：Query.fb2p 必须整体出现在 token 集且归类 canonical；精确 Query.fb 只可能是唯一的有意散文 token
check("tokens: Query.fb2p extracted whole (not truncated to Query.fb)", tokens.includes("Query.fb2p"));
check("tokens: Query.fb2p classifies canonical, exact Query.fb classifies unsupported",
    classify("Query.fb2p") === "canonical" && classify("Query.fb") === "unsupported");
check("tokens: exactly one exact Query.fb occurrence in prose (the intentional unsupported bullet)",
    (skill.match(/\bQuery\.fb\b/g) ?? []).length === 1);

// 事实交叉核对：Query.fb 确为未注册/未声明（精确 token，Query.fb2p 不得误匹配）
const fbRe = /\bQuery\.fb\b/;

// ---- 4b. 返回契约断言（从 Query 类型声明作用域逐方法提取，SKILL.md 描述必须一致）----
const returnOf = (member) => {
    const m = new RegExp(`^\\s{4}${member}: \\([\\s\\S]*?\\) => ([^;]+);`, "m").exec(queryScope ?? "");
    return m ? m[1].trim() : null;
};
check("decl: sql/backlink/tag/task/random/dailynote/keyword return Promise<IWrappedList<IWrappedBlock>>",
    ["sql", "backlink", "tag", "task", "random", "dailynote", "keyword"].every((m) => returnOf(m) === "Promise<IWrappedList<IWrappedBlock>>"));
check("decl: keywordDoc returns Promise<Block[]>", returnOf("keywordDoc") === "Promise<Block[]>");
check("decl: markdown returns Promise<any>", returnOf("markdown") === "Promise<any>");
check("decl: thisDoc returns Promise<IWrappedBlock>", returnOf("thisDoc") === "Promise<IWrappedBlock>");
check("decl: pruneBlocks returns Promise<Block[]>", returnOf("pruneBlocks") === "Promise<Block[]>");
check("decl: fb2p returns Promise<Block[]>", returnOf("fb2p") === "Promise<Block[]>");
check("decl: DataView returns DataView (sync, not a Promise)", returnOf("DataView") === "DataView");
check("decl: Utils is a sync object literal", /^\s{4}Utils: \{/m.test(queryScope ?? ""));

check("skill: prose no longer says 'all async'", !skill.includes("all async"));
check("skill: states Query.DataView and Query.Utils are sync", /Query\.DataView[\s\S]{0,80}Query\.Utils[\s\S]{0,80}are sync/.test(skill));
check("skill: keywordDoc sentence says Promise<Block[]> and not any[]",
    /keywordDoc[\s\S]{0,160}Promise<Block\[\]>/.test(skill) && !/keywordDoc[\s\S]{0,160}any\[\]/.test(skill));
check("skill: markdown sentence says Promise<any> and does not claim a string return",
    /markdown[\s\S]{0,160}Promise<any>/.test(skill) && !skill.includes("markdown string"));
check("skill: thisDoc sentence keeps Promise<IWrappedBlock>", /thisDoc[\s\S]{0,160}Promise<IWrappedBlock>/.test(skill));
check("skill: pruneBlocks sentence return compatible with Promise<Block[]>", /pruneBlocks[\s\S]{0,160}Promise<Block\[\]>/.test(skill));
check("skill: fb2p sentence return compatible with Promise<Block[]>", /fb2p[\s\S]{0,160}Promise<Block\[\]>/.test(skill));
check("skill: DataView bullet notes sync call returning DataView", /DataView\(protyle, item, top\)[\s\S]{0,160}sync/.test(skill));

check("fact: exact Query.fb is NOT a registered alias", ![...registeredAliases].some((a) => fbRe.test(a)));
check("fact: exact Query.fb is NOT a Query declaration member (direct member check)", !queryMembers.has("fb"));
const docText = readdirSync(path.join(repo, "docs")).includes("en_US")
    ? readdirSync(path.join(repo, "docs/en_US"), { recursive: true }).filter((f) => f.endsWith(".md"))
        .map((f) => readFileSync(path.join(repo, "docs/en_US", f), "utf8")).join("\n")
    : "";
check("fact: exact Query.fb absent from shipped examples",
    readdirSync(path.join(repo, "public/example")).filter((f) => f.startsWith("exp-"))
        .every((f) => !fbRe.test(readFileSync(path.join(repo, "public/example", f), "utf8"))));
check("fact: exact Query.fb absent from shipped English docs", !fbRe.test(docText));
check("fact: Query.fb2p present in Query scope (no false-negative from the boundary check)", /\bQuery\.fb2p\b/.test(queryScope ?? "") || queryMembers.has("fb2p"));

// 技能主张：别名均真实注册；规范名与精确 Query.fb 标记
const claimedAliases = ["Query.Dataview", "Query.utils", "Query.prune", "Query.redirect", "dv.removeview", "dv.replaceview"];
check("skill: claimed aliases are all actually registered at runtime", claimedAliases.every((a) => registeredAliases.has(a) && skill.includes(a)));
check("skill: removeview/replaceview are declared in dts AND registered at runtime (overlapping)",
    dvMembers.has("removeview") && dvMembers.has("replaceview") && registeredAliases.has("dv.removeview") && registeredAliases.has("dv.replaceview"));
check("skill: canonical preference stated for removeView/replaceView", skill.includes("dv.removeView") && skill.includes("dv.replaceView"));
const canonicalNames = ["Query.DataView", "Query.Utils", "Query.pruneBlocks", "Query.fb2p", "dv.removeView", "dv.replaceView", "dv.cards", "dv.repaint"];
check("skill: canonical names present (DataView/Utils/pruneBlocks/fb2p/removeView/replaceView/cards/repaint)", canonicalNames.every((c) => skill.includes(c)));
check("skill: no 'Legacy spellings to avoid' heading remains", !skill.includes("Legacy spellings to avoid"));
check("skill: canonical names not paired with avoid/legacy", !/dv\.cards[^\n]*(avoid|legacy)|dv\.replaceView[^\n]*(avoid|legacy)|dv\.repaint[^\n]*(avoid|legacy)/i.test(skill));
// Query.fb 的 unsupported 标记必须与同一句/同一条绑定（bullet 可跨行）
const skillLines = skill.split("\n");
const fbIdx = skillLines.findIndex((l) => fbRe.test(l));
const fbBullet = fbIdx >= 0 ? skillLines.slice(fbIdx, fbIdx + 3).join(" ") : "";
check("skill: exact Query.fb appears with 'not registered or documented' on the same bullet",
    fbIdx >= 0 && fbBullet.includes("not registered or documented"));
check("skill: Query.fb bullet also points to fb2p/redirect", fbBullet.includes("Query.fb2p") && fbBullet.includes("Query.redirect"));

// ---- 5. minimal skeleton grounded in basic-template.js ----
const skel = /```js\n([\s\S]*?)\n```/.exec(skill);
check("minimal skeleton fenced block present", skel !== null);
if (skel) {
    check("skeleton matches template semantics (Query.sql / pick('id') / DataView / addlist / render)",
        skel[1].includes("Query.sql") && skel[1].includes("pick('id')")
        && skel[1].includes("Query.DataView(protyle, item, top)")
        && skel[1].includes("dv.addlist") && skel[1].includes("dv.render"));
    check("skeleton attributes source to basic-template.js", skill.includes("public/example/basic-template.js"));
}

// ---- 6. example adaptation section grounded in shipped files（存在性 + 描述中的真实 API token）----
const exampleFiles = readdirSync(path.join(repo, "public/example"));
// 技能第 6 节对每个案例的描述 → 文件必须存在的实际源码 token（与 SKILL.md 描述一一对应）
const exampleClaims = [
    ["exp-doc-backlinks-table.js", ["Query.backlink", "addtable"]],
    ["exp-sql-executor.js", ["Query.sql", "useState"]],
    ["exp-list-tags.js", ["Query.tag", "dv.cards"]],
    ["exp-month-todo.js", ["Query.task"]],
    ["exp-today-updated.js", ["useState"]],
    ["exp-created-docs.js", ["addeline"]],
    ["exp-gpt-chat.js", ["Query.gpt"]],
];
for (const [f, tokens] of exampleClaims) {
    check(`example exists: ${f}`, exampleFiles.includes(f));
    if (exampleFiles.includes(f)) {
        const src = readFileSync(path.join(repo, "public/example", f), "utf8");
        check(`example ${f} contains its described API tokens (${tokens.join(", ")})`, tokens.every((t) => src.includes(t)));
    }
}

// ---- 7. terminology consistency with docs/TERM.md ----
check("uses 'JS Embedded Block' terminology", skill.includes("JS embedded block"));
check("uses 'Basic Template' terminology", /basic template/i.test(skill));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
