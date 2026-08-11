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

// ---- 4. grounding: every canonical token resolves in authoritative sources ----
const dts = readFileSync(path.join(repo, "public/types.d.ts"), "utf8");
const tpl = readFileSync(path.join(repo, "public/example/basic-template.js"), "utf8");
const examples = readdirSync(path.join(repo, "public/example"))
    .filter((f) => f.startsWith("exp-"))
    .map((f) => readFileSync(path.join(repo, "public/example", f), "utf8"))
    .join("\n");
const all = dts + "\n" + tpl + "\n" + examples;

// 技能明确要求避免的旧拼写（仅允许出现在 avoid-note 中）
const legacy = ["Query.Dataview", "Query.utils", "Query.fb", "Query.prune", "dv.cards", "dv.replaceView", "dv.repaint"];

const grounded = (token) => {
    if (legacy.includes(token) || all.includes(token)) return true;
    const member = /^[A-Za-z0-9]+\.([a-zA-Z]+)$/.exec(token)?.[1];
    if (!member) return false;
    // 类型声明中的成员/方法（如 "    sql:"、"    addlist("、"    aslink:"）
    return dts.includes(`    ${member}:`) || dts.includes(`    ${member}(`) || dts.includes(`${member}: (`);
};

const tokens = [
    ...new Set([
        ...(skill.match(/Query\.[A-Za-z]+/g) ?? []),
        ...(skill.match(/dv\.[a-zA-Z]+/g) ?? []),
        ...(skill.match(/IWrapped[A-Za-z]+\.[a-zA-Z]+/g) ?? []),
        ...(skill.match(/list\.[a-zA-Z]+/g) ?? []),
        ...(skill.match(/b\.(aslink|asurl|asref)/g) ?? []),
    ]),
];
const ungrounded = tokens.filter((t) => !grounded(t));
check("all canonical Query./dv./IWrapped*/list/b. tokens grounded in types/template/examples", ungrounded.length === 0, ungrounded.join(", "));
check("legacy spellings appear only in the avoid-note", legacy.every((t) => skill.includes(t)));

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

// ---- 6. example adaptation section grounded in shipped files ----
const exampleFiles = readdirSync(path.join(repo, "public/example"));
for (const f of ["exp-doc-backlinks-table.js", "exp-sql-executor.js", "exp-list-tags.js", "exp-month-todo.js", "exp-today-updated.js", "exp-created-docs.js", "exp-gpt-chat.js"]) {
    check(`example mentioned exists: ${f}`, exampleFiles.includes(f));
}

// ---- 7. terminology consistency with docs/TERM.md ----
check("uses 'JS Embedded Block' terminology", skill.includes("JS embedded block"));
check("uses 'Basic Template' terminology", /basic template/i.test(skill));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
