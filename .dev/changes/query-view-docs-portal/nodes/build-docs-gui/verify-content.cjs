// 文档站内容逻辑验证（自包含、可复现，单命令：node <本文件>）。
// 步骤：用仓库现有 TypeScript 工具链把 src/docs-site/content.ts 发射到 OS 临时目录（commonjs），
//       运行内容断言，finally 中删除临时目录；不向仓库写入任何生成物。
// 测试使用显式假插件名 "test-plugin"（生产代码不硬编码真实插件名）。
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const scriptDir = __dirname;
const repoRoot = path.resolve(scriptDir, "../../../../..");

let fail = 0;
const check = (name, cond) => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
    if (!cond) fail++;
};

const files = {
    "/plugins/test-plugin/docs/zh_CN/index.md": { status: 404, body: "" },
    "/plugins/test-plugin/docs/en_US/index.md": { status: 200, body: "# EN Index\n\n![image](../../assets/a.png)\n" },
    "/plugins/test-plugin/docs/zh_CN/topics/query.md": { status: 500, body: "" },
    "/plugins/test-plugin/docs/en_US/topics/query.md": { status: 404, body: "" },
    "/plugins/test-plugin/docs/zh_CN/skill/index.md": { status: 404, body: "" },
    "/plugins/test-plugin/docs/en_US/skill/index.md": { status: 500, body: "" },
    "/plugins/test-plugin/docs/zh_CN/examples/index.md": { status: 404, body: "" },
    "/plugins/test-plugin/docs/en_US/examples/index.md": { status: 0, body: "" }, // 网络异常（fetch 抛错）
    "/plugins/test-plugin/docs/en_US/topics/dataview.md": { status: 200, body: "# DV\n\n{{example:exp-x.js}}\n" },
    "/plugins/test-plugin/example/exp-x.js": { status: 200, body: "// demo\r\nreturn 1;\r\n" },
    "/plugins/test-plugin/example/exp-missing.js": { status: 404, body: "" },
};
global.fetch = async (url) => {
    const f = files[url];
    if (!f) return { ok: false, status: 404, text: async () => "" };
    if (f.status === 0) throw new Error("network down");
    return { ok: f.status === 200, status: f.status, text: async () => f.body };
};

// ---- 编译 src/docs-site/content.ts 到 OS 临时目录（仅用仓库现有 TypeScript）----
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "docs-gui-verify-"));
const outDir = path.join(tempDir, "emit");
let createContent;
try {
    const tscPath = require.resolve("typescript/bin/tsc", { paths: [repoRoot] });
    const ambientDts = path.join(tempDir, "ambient.d.ts");
    fs.writeFileSync(
        ambientDts,
        "// 仅用于独立编译验证：补齐项目全局类型（项目构建时由 src/types/index.d.ts 提供）\ndeclare interface Window {\n    siyuan: any;\n}\n",
        "utf8"
    );
    const tsc = spawnSync(
        process.execPath,
        [
            tscPath,
            path.join(repoRoot, "src/docs-site/content.ts"),
            ambientDts,
            "--outDir", outDir,
            "--module", "commonjs",
            "--target", "es2020",
            "--moduleResolution", "node",
            "--skipLibCheck",
            "--rootDir", path.join(repoRoot, "src/docs-site"),
        ],
        { cwd: repoRoot, encoding: "utf8" }
    );
    if (tsc.status !== 0) {
        console.error("tsc emit failed:\n" + (tsc.stdout + tsc.stderr));
        process.exitCode = 2;
    } else {
        // 仓库 package.json 为 "type": "module"，.js 会被当作 ESM；发射物改为 .cjs 并修正内部相对引用
        fs.renameSync(path.join(outDir, "content.js"), path.join(outDir, "content.cjs"));
        fs.renameSync(path.join(outDir, "nav.js"), path.join(outDir, "nav.cjs"));
        const contentCjs = path.join(outDir, "content.cjs");
        const src = fs.readFileSync(contentCjs, "utf8");
        fs.writeFileSync(contentCjs, src.replace('require("./nav")', 'require("./nav.cjs")'), "utf8");

        createContent = require(contentCjs).createContent;
    }
} finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`[cleanup] removed temp dir: ${tempDir} (exists=${fs.existsSync(tempDir)})`);
}

if (!createContent) {
    process.exit(process.exitCode ?? 1);
}

(async () => {
    const c = createContent("test-plugin");

    // 1. 首语言 404 → 回退另一语言（含 requestedLang / 实际 baseUrl）
    const r1 = await c.loadPage("zh_CN", "index");
    check("404 -> fallback", r1.status === "fallback");
    if (r1.status === "fallback") {
        check("fallback lang= en_US, requested= zh_CN", r1.lang === "en_US" && r1.requestedLang === "zh_CN");
        check("fallback baseUrl uses en_US", r1.baseUrl === "/plugins/test-plugin/docs/en_US/index.md");
    }

    // 2. 缓存命中 → ok
    const r2 = await c.loadPage("en_US", "index");
    check("cache hit -> ok", r2.status === "ok" && r2.markdown.includes("# EN Index"));

    // 3. 首语言 500 → error network（不回退）
    const r3 = await c.loadPage("zh_CN", "topic-query");
    check("500 -> error network, no fallback", r3.status === "error" && r3.reason === "network");

    // 4. 首语言 404 + 另一语言 404 → not-found
    const r4 = await c.loadPage("zh_CN", "quickstart-concepts");
    check("zh 404 + en 404 -> not-found", r4.status === "error" && r4.reason === "not-found");

    // 5. 首语言 404 + 另一语言 500 → network（仅双 404 才是 not-found）
    const r5 = await c.loadPage("zh_CN", "skill");
    check("zh 404 + en 500 -> network", r5.status === "error" && r5.reason === "network");

    // 6. 首语言 404 + 另一语言网络异常 → network
    const r6 = await c.loadPage("zh_CN", "examples");
    check("zh 404 + en network-fail -> network", r6.status === "error" && r6.reason === "network");

    // 7. 占位符展开：围栏 + 行尾归一化
    const expanded = await c.expandExamples("# Q\n\n{{example:exp-x.js}}\n\n{{example:exp-x.js}}\n");
    check("example expanded to js fence", expanded.includes("```js\n// demo\nreturn 1;\n```"));
    check("example CRLF normalized", !expanded.includes("\r"));

    // 8. 缺文件降级
    const degraded = await c.expandExamples("{{example:exp-missing.js}}");
    check("missing example degraded", degraded.includes("// [docs] example not found: exp-missing.js"));

    // 9. docs-only 标记剥离（保留内容）
    const stripped = c.stripDocsOnlyMarkers("# A\n\n<!-- docs-only:start -->\n## Cards\n\nbody\n<!-- docs-only:end -->\n\ntail\n");
    check("docs-only markers stripped", !stripped.includes("docs-only") && stripped.includes("## Cards") && stripped.includes("tail"));

    // 10. clearCache 后重新拉取
    c.clearCache();
    const r10 = await c.loadPage("en_US", "index");
    check("after clearCache refetch ok", r10.status === "ok");

    // 11. 页面 URL 用插件名透传（显式假名）
    check("pageUrl uses pluginName", c.pageUrl("zh_CN", "topic-query") === "/plugins/test-plugin/docs/zh_CN/topics/query.md");

    console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
    process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
    console.error(e);
    process.exit(2);
});
