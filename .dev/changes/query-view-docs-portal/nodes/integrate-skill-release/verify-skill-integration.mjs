// Skill 接入验证（自包含可复现：node .dev/changes/query-view-docs-portal/nodes/integrate-skill-release/verify-skill-integration.mjs）
// 覆盖：双语页面占位符唯一性、运行时 expandSkill（假插件名 URL/缓存/CRLF/缺文件降级/clearCache/安全名）、
// 两端 frontmatter 展示转换一致性、README 展开与标题降级、vite 打包与 watch、包内原始 SKILL.md 字节一致。
// 前置：npm run docs:gen 与 npm run build 已执行（脚本对缺失产物给出明确 FAIL）。
import { readFileSync, existsSync, mkdtempSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../../../..");

let fail = 0;
const check = (name, cond, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
    if (!cond) fail++;
};
const read = (p) => readFileSync(path.join(repo, p), "utf8");

const SKILL_SRC = "skills/sy-query-view/SKILL.md";
const skillSrc = read(SKILL_SRC);

// ---- 1. 双语页面：各含且仅含一个相同占位符；无 Skill 正文副本（实质性行对比 + 页面尺寸上界）----
const skillSubstantialLines = skillSrc.split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 30);
for (const lang of ["zh_CN", "en_US"]) {
    const page = read(`docs/${lang}/skill/index.md`);
    check(`${lang} skill page: exactly one {{skill:sy-query-view}}`, (page.match(/\{\{skill:sy-query-view\}\}/g) ?? []).length === 1);
    check(`${lang} skill page: no other skill placeholder`, !/\{\{skill:[^}]+\}\}/.test(page.replace(/\{\{skill:sy-query-view\}\}/g, "")));
    const pageNoPlaceholder = page.replace(/\{\{skill:sy-query-view\}\}/g, "");
    const leaked = skillSubstantialLines.filter((l) => pageNoPlaceholder.includes(l));
    check(`${lang} skill page: no substantial SKILL.md line copied (${skillSubstantialLines.length} lines checked)`, leaked.length === 0, leaked.slice(0, 2).join("; "));
    check(`${lang} skill page: size bounded around intro + one placeholder`, page.length < 800 && page.split("\n").length < 14, `chars=${page.length}`);
}

// 1b. 运行时/生成器源码顺序与竞态守卫断言
const indexSrc = read("src/docs-site/index.ts");
const idxExp = indexSrc.indexOf("await content.expandExamples(md)");
const idxSkill = indexSrc.indexOf("await content.expandSkill(md)");
const guardAfterSkill = /await content\.expandSkill\(md\);\s*if \(seq !== requestSeq \|\| gen !== siteGeneration \|\| disposed\) return;/.test(indexSrc);
check("index.ts: expandSkill awaited after expandExamples", idxSkill > idxExp);
check("index.ts: seq/generation/disposed guard follows expandSkill await", guardAfterSkill);
const genSrc = read("scripts/build-docs.js");
const order = ["stripDocsOnly(md)", "expandExamples(md", "expandSkill(md", "normalizeImagePaths(md)", "shiftHeadings(md)"]
    .map((s) => genSrc.indexOf(s));
check("generator: pipeline order docs-only < examples < skill < images < headings",
    order.every((v) => v >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]));

// ---- 2. 运行时 expandSkill（tsc 发射到 OS 临时目录，finally 清理）----
const tempDir = mkdtempSync(path.join(os.tmpdir(), "skill-integ-verify-"));
let contentMod = null;
try {
    const outDir = path.join(tempDir, "emit");
    writeFileSync(path.join(tempDir, "ambient.d.ts"), "declare interface Window {\n    siyuan: any;\n}\n", "utf8");
    const tsc = spawnSync(process.execPath, [
        require.resolve("typescript/bin/tsc", { paths: [repo] }),
        path.join(repo, "src/docs-site/content.ts"),
        path.join(tempDir, "ambient.d.ts"),
        "--outDir", outDir,
        "--module", "commonjs",
        "--target", "es2020",
        "--moduleResolution", "node",
        "--skipLibCheck",
        "--rootDir", path.join(repo, "src/docs-site"),
    ], { cwd: repo, encoding: "utf8" });
    check("runtime: content.ts tsc emit succeeds", tsc.status === 0);
    if (tsc.status === 0) {
        renameSync(path.join(outDir, "content.js"), path.join(outDir, "content.cjs"));
        renameSync(path.join(outDir, "nav.js"), path.join(outDir, "nav.cjs"));
        const cjs = path.join(outDir, "content.cjs");
        writeFileSync(cjs, readFileSync(cjs, "utf8").replace('require("./nav")', 'require("./nav.cjs")'), "utf8");
        contentMod = require(cjs);
    }
} finally {
    rmSync(tempDir, { recursive: true, force: true });
    check("runtime: temp emit dir cleaned", !existsSync(tempDir));
}

if (contentMod) {
    const fetchUrls = [];
    const sampleSkill = "---\nname: sy-query-view\ndescription: Sample skill description\n---\n## Body heading\n\nSome body content.\n";
    global.fetch = async (url) => {
        fetchUrls.push(url);
        if (url.includes("skills/sy-query-view/SKILL.md")) {
            return { ok: true, status: 200, text: async () => sampleSkill };
        }
        if (url.includes("skills/missing/SKILL.md")) {
            return { ok: false, status: 404, text: async () => "" };
        }
        if (url.includes("crlf")) {
            return { ok: true, status: 200, text: async () => "---\r\nname: crlf\r\n---\r\n# CRLF Body\r\n" };
        }
        return { ok: false, status: 404, text: async () => "" };
    };
    const c = contentMod.createContent("test-plugin");

    const expanded = await c.expandSkill("{{skill:sy-query-view}}");
    check("runtime: expands to yaml fence + markdown body", expanded.includes("```yaml\nname: sy-query-view") && expanded.includes("## Body heading"));
    check("runtime: frontmatter fenced, body not fenced", expanded.includes("```yaml") && expanded.includes("```\n\n## Body heading"));
    check("runtime: fetch URL uses fake plugin name + skills path", fetchUrls[0] === "/plugins/test-plugin/skills/sy-query-view/SKILL.md");

    const before = fetchUrls.length;
    await c.expandSkill("{{skill:sy-query-view}}");
    check("runtime: successful expansion is cached (no second fetch)", fetchUrls.length === before);

    const crlf = await c.expandSkill("{{skill:crlf}}");
    check("runtime: CRLF normalized in cached raw and display", !crlf.includes("\r") && crlf.includes("```yaml\nname: crlf\n```"));

    const missing = await c.expandSkill("{{skill:missing}}");
    check("runtime: missing skill shows clear degrade notice", missing.includes("Skill 内容缺失") || missing.includes("Skill content missing"));
    const n1 = fetchUrls.filter((u) => u.includes("missing")).length;
    await c.expandSkill("{{skill:missing}}");
    const n2 = fetchUrls.filter((u) => u.includes("missing")).length;
    check("runtime: missing skill is NOT cached (refetched)", n2 > n1);

    c.clearCache();
    const before2 = fetchUrls.filter((u) => u.includes("sy-query-view")).length;
    await c.expandSkill("{{skill:sy-query-view}}");
    check("runtime: clearCache clears skill cache (refetch)", fetchUrls.filter((u) => u.includes("sy-query-view")).length > before2);

    const unsafeBefore = fetchUrls.length;
    const unsafe = await c.expandSkill("{{skill:../evil}} and {{skill:a/b}}");
    check("runtime: unsafe skill names are not expanded and not fetched", unsafe.includes("{{skill:../evil}}") && unsafe.includes("{{skill:a/b}}") && fetchUrls.length === unsafeBefore);

    // 嵌套占位符行为：插入的 Skill 正文中的字面 {{skill:...}} 不得被重扫/二次展开
    const nestedSkill = "---\nname: first\n---\nI contain a literal {{skill:sy-query-view}} inside.\n";
    global.fetch = async (url) => {
        fetchUrls.push(url);
        if (url.includes("skills/first/SKILL.md")) return { ok: true, status: 200, text: async () => nestedSkill };
        if (url.includes("skills/sy-query-view/SKILL.md")) return { ok: true, status: 200, text: async () => sampleSkill };
        return { ok: false, status: 404, text: async () => "" };
    };
    const nested = await c.expandSkill("{{skill:first}} tail {{skill:sy-query-view}}");
    check("runtime: nested inserted skill placeholder stays literal (count of {{skill:sy-query-view}} == 1)",
        (nested.match(/\{\{skill:sy-query-view\}\}/g) ?? []).length === 1);
    check("runtime: both original placeholders expanded (two yaml fences)", (nested.match(/```yaml/g) ?? []).length === 2);

    // 3. 两端 frontmatter 展示转换一致性（运行时发射产物 vs scripts/build-docs.js）
    const gen = await import(pathToFileURL(path.join(repo, "scripts/build-docs.js")).href);
    for (const [name, input] of [
        ["lf-frontmatter", sampleSkill],
        ["crlf-frontmatter", "---\r\nname: crlf\r\n---\r\n# Body\r\n"],
        ["no-frontmatter", "# Just a body\n\nNo frontmatter here.\n"],
        ["frontmatter-no-body", "---\nname: x\n---\n"],
    ]) {
        check(`transform consistency (${name}): runtime == generator`, contentMod.skillToDisplay(input) === gen.skillToDisplay(input));
    }

    // one-pass 语义一致性：运行时切片重建 vs 生成器 String.replace 回调（同一 mock 解析器）
    const resolver = (name) => (name === "first" ? nestedSkill : sampleSkill);
    check("one-pass semantics: runtime == generator for nested-placeholder input",
        nested === gen.expandSkillText("{{skill:first}} tail {{skill:sy-query-view}}", resolver));

    // 生成器作者侧缺文件必须抛错
    let threw = false;
    try {
        gen.expandSkill("{{skill:definitely-missing-skill-xyz}}", "en_US");
    } catch (e) {
        threw = String(e).includes("skill file not found");
    }
    check("generator: author-side expandSkill throws on missing skill file", threw);
} else {
    check("runtime: expandSkill behavior verifiable", false, "tsc emit failed");
}

// ---- 4. README 展开（docs:gen 已执行）----
for (const [lang, readme] of [["zh_CN", "README_zh_CN.md"], ["en_US", "README.md"]]) {
    const md = read(readme);
    check(`README ${lang}: no skill placeholder leftover`, !md.includes("{{skill:"));
    check(`README ${lang}: yaml fence present`, md.includes("```yaml"));
    check(`README ${lang}: frontmatter identifiers present`, md.includes("name: sy-query-view") && md.includes("description:"));
    check(`README ${lang}: body identifiers present`, md.includes("Working workflow") && md.includes("Minimal skeleton"));
    check(`README ${lang}: skill body headings demoted (### 1. Purpose and scope)`, md.includes("### 1. Purpose and scope"));
}

// ---- 5. vite 配置与打包（原始 Buffer 字节比对）----
const viteSrc = read("vite.config.ts");
check("vite: static copy config covers ./skills/**", viteSrc.includes('{ src: "./skills/**", dest: "./" }'));
check("vite: dev watch config covers ./skills/** (config-level coverage, not a running watch test)", viteSrc.includes("'./skills/**'"));
const skillPath = path.join(repo, SKILL_SRC);
const srcBuffer = readFileSync(skillPath);
const distSkill = path.join(repo, "dist/skills/sy-query-view/SKILL.md");
check("dist: dist/skills/sy-query-view/SKILL.md exists", existsSync(distSkill));
if (existsSync(distSkill)) {
    check("dist: SKILL.md raw Buffer byte-identical to repo source", readFileSync(distSkill).equals(srcBuffer));
}
// 包内条目：先 listing 证明存在与无 .dev；再用 unzip -p 提取原始字节比对（显式前置/错误处理）
const zip = execFileSync("unzip", ["-l", "package.zip"], { cwd: repo, encoding: "utf8" });
check("package.zip listing: contains skills/sy-query-view/SKILL.md", zip.includes("skills/sy-query-view/SKILL.md"));
check("package.zip listing: no .dev verification material packaged", !zip.includes(".dev/"));
try {
    const pkgBuffer = execFileSync("unzip", ["-p", "package.zip", "skills/sy-query-view/SKILL.md"], { cwd: repo, encoding: null });
    check("package.zip: extracted SKILL.md raw Buffer byte-identical to repo source (unzip -p)", Buffer.isBuffer(pkgBuffer) && pkgBuffer.equals(srcBuffer));
} catch (e) {
    check("package.zip: extracted SKILL.md raw Buffer byte-identical to repo source (unzip -p)", false, `unzip -p failed: ${e.message}`);
}

// ---- 6. 前序验证脚本全部通过 ----
const pred = [
    ["nodes/write-core-skill/verify-skill.mjs", "skill"],
    ["nodes/build-docs-gui/verify-content.cjs", "content"],
    ["nodes/build-docs-gui/verify-render-selectors.mjs", "render-selectors"],
    ["nodes/retire-legacy-help/verify-i18n.mjs", "i18n"],
    ["nodes/fix-runtime-feedback/verify-runtime-fixes.mjs", "runtime-fixes"],
];
for (const [rel, label] of pred) {
    const p = path.join(repo, ".dev/changes/query-view-docs-portal", rel);
    const r = spawnSync(process.execPath, [p], { cwd: repo, encoding: "utf8" });
    check(`predecessor verifier passes: ${label}`, r.status === 0, r.stdout.split("\n").filter((l) => l.includes("FAIL")).slice(0, 2).join("; "));
}

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
