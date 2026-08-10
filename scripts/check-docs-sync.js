#!/usr/bin/env node
/**
 * README 同步检查：重新生成根 README.md / README_zh_CN.md 并与仓库已提交文件比对。
 * 比较前仅对两边做行尾归一化（CRLF/LF/CR → LF），行尾差异不视为不同步；
 * 其余任何内容差异都视为不同步，打印首个差异行并以非零码退出（构建链的一部分，见 package.json "build"）。
 */
import fs from "fs";
import path from "path";
import { generateAll } from "./build-docs.js";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// 仅归一化行尾（\r\n 与 \r → \n），不改变其他内容
const normalize = (s) => s.replace(/\r\n?/g, "\n");

let failed = false;
const generated = generateAll();
for (const [name, content] of Object.entries(generated)) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) {
        console.error(`[docs:check] FAIL ${name}: file does not exist`);
        failed = true;
        continue;
    }
    const committed = normalize(fs.readFileSync(p, "utf8"));
    const expected = normalize(content);
    if (committed !== expected) {
        failed = true;
        const a = committed.split("\n");
        const b = expected.split("\n");
        let firstDiff = -1;
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i] !== b[i]) {
                firstDiff = i;
                break;
            }
        }
        console.error(`[docs:check] FAIL ${name}: not in sync with docs/`);
        console.error(`  first difference at line ${firstDiff + 1}:`);
        console.error(`  committed: ${a[firstDiff] ?? "<EOF>"}`);
        console.error(`  generated: ${b[firstDiff] ?? "<EOF>"}`);
        console.error(`  run "npm run docs:gen" and commit the regenerated README(s).`);
    } else {
        console.log(`[docs:check] OK ${name} is in sync`);
    }
}

process.exitCode = failed ? 1 : 0;
