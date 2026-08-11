// i18n 退役清理验证（js-yaml）：
// 1) yaml 结构（组/键）与 src/types/i18n.d.ts 声明双向一致；
// 2) 生产代码引用的每个 i18n 键都存在；
// 3) 保留键的解析值与 HEAD 完全一致（证明无退役文案残片嵌入保留标签）；新增键仅在新建文件出现。
// 运行：node .dev/changes/query-view-docs-portal/nodes/retire-legacy-help/verify-i18n.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../../../..");

let fail = 0;
const check = (name, cond) => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
    if (!cond) fail++;
};

const loadYaml = (p) => yaml.load(readFileSync(p, "utf8"));

// ---- 0. 当前与 HEAD 的 yaml ----
const cur = { zh: loadYaml(path.join(repo, "public/i18n/zh_CN.yaml")), en: loadYaml(path.join(repo, "public/i18n/en_US.yaml")) };
const headText = {
    zh: execFileSync("git", ["show", "HEAD:public/i18n/zh_CN.yaml"], { cwd: repo, encoding: "utf8" }),
    en: execFileSync("git", ["show", "HEAD:public/i18n/en_US.yaml"], { cwd: repo, encoding: "utf8" }),
};
const head = { zh: yaml.load(headText.zh), en: yaml.load(headText.en) };

// ---- 1. 从 i18n.d.ts 提取声明结构 ----
const dts = readFileSync(path.join(repo, "src/types/i18n.d.ts"), "utf8");
const declared = {};
let curGroup = null;
for (const raw of dts.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const g = /^    ([a-z_]+): \{$/.exec(line);
    if (g) { curGroup = g[1]; declared[curGroup] = []; continue; }
    if (/^    \};$/.test(line)) { curGroup = null; continue; }
    if (curGroup) {
        const k = /^        ([a-z_0-9]+): string;$/.exec(line);
        if (k) declared[curGroup].push(k[1]);
    }
}

// ---- 2. 生产代码引用 ----
const src = execFileSync("rg", ["-o", "i18n\\.src_[a-z_0-9]+\\.([a-z_0-9]+)", "src/", "-g", "*.ts", "-g", "*.d.ts", "--no-filename"], { cwd: repo, encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
const refs = new Map(); // group -> Set(keys)
for (const r of src) {
    const m = /i18n\.(src_[a-z_0-9]+)\.([a-z_0-9]+)/.exec(r);
    if (m) {
        if (!refs.has(m[1])) refs.set(m[1], new Set());
        refs.get(m[1]).add(m[2]);
    }
}

// ---- 断言 ----
for (const lang of ["zh", "en"]) {
    const c = cur[lang], h = head[lang];
    const tag = lang.toUpperCase();

    // 1a. 顶层组一致
    check(`${tag} top-level groups == TS declarations`, JSON.stringify(Object.keys(c).sort()) === JSON.stringify(Object.keys(declared).sort()));
    // 1b. 组内键一致（双向）
    let keysOk = true;
    for (const g of Object.keys(declared)) {
        const dk = [...declared[g]].sort();
        const yk = Object.keys(c[g] ?? {}).sort();
        if (JSON.stringify(dk) !== JSON.stringify(yk)) { keysOk = false; console.log(`   mismatch ${g}: dts=${dk} yaml=${yk}`); }
    }
    check(`${tag} per-group keys == TS declarations (bidirectional)`, keysOk);

    // 2. 生产引用存在
    let refsOk = true;
    for (const [g, keys] of refs) {
        for (const k of keys) {
            if (!(c[g] && k in c[g])) { refsOk = false; console.log(`   missing ref: ${g}.${k}`); }
        }
    }
    check(`${tag} all production i18n refs exist in yaml`, refsOk);

    // 3. 保留键值 == HEAD（无残片）；新增键仅新建
    let valOk = true;
    for (const g of Object.keys(declared)) {
        for (const k of declared[g]) {
            if (h[g] && k in h[g] && h[g][k] !== c[g][k]) { valOk = false; console.log(`   value changed: ${g}.${k}\n     head: ${JSON.stringify(h[g][k])}\n     now:  ${JSON.stringify(c[g][k])}`); }
        }
    }
    check(`${tag} retained key values identical to HEAD (no embedded retired prose)`, valOk);

    // 4. 退役组/键整体消失
    const retired = ["src_userhelp_examplests", "src_userhelp_sydocts", "user_help",
        "create_notebook", "help_doc_2", "useview", "useview2", "unable_open_d_ts",
        "user_doc_import_type_ref", "plugin_import_help_doc"];
    const gone = retired.every((k) => !(k in c) && !Object.values(c).some((g) => typeof g === "object" && g && k in g));
    check(`${tag} retired groups/keys fully absent`, gone);
}

// 5. 新增键双语存在且非空
check("basic_template_load_failed present in both langs", typeof cur.zh.src_userhelp_indexts.basic_template_load_failed === "string"
    && cur.zh.src_userhelp_indexts.basic_template_load_failed.length > 0
    && typeof cur.en.src_userhelp_indexts.basic_template_load_failed === "string"
    && cur.en.src_userhelp_indexts.basic_template_load_failed.length > 0);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
