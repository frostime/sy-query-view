// import { glob } from 'glob';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

// First define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Then use process
process.chdir(path.join(__dirname, '..'));
console.log(process.cwd());
const dirname = process.cwd();

// 读取 plugin.json
const pluginJson = fs.readFileSync('./plugin.json', 'utf8');
const plugin = JSON.parse(pluginJson);

const removeTypesDir = () => {
    if (fs.existsSync('./types')) {
        fs.rmSync('./types', { recursive: true, force: true });
        console.debug('remove ./types');
    }
}

removeTypesDir();

let outputDir = './public';

const tsc = `tsc --declaration --emitDeclarationOnly --skipLibCheck --target ESNext --project tsconfig.json --outDir ./types --noEmitOnError false --stripInternal`;

console.log(tsc);
execSync(tsc);


const fileWriter = (filepath) => {
    let fd = fs.openSync(filepath, 'w');

    return {
        append: (content) => {
            fs.writeSync(fd, content);
        },
        close: () => {
            fs.closeSync(fd);
        }
    }
}

const readFile = (filepath) => {
    filepath = path.join(__dirname, '..', filepath);
    return fs.readFileSync(filepath, 'utf8');
}

const removeLine = (content, line) => {
    const lines = content.split('\n');
    lines.splice(lines.indexOf(line), 1);
    return lines.join('\n');
}

const writer = fileWriter(path.join(outputDir, 'types.d.ts'));
const replaceSomething = (content, lines = []) => {
    if (lines.length > 0) {
        lines.forEach(line => {
            content = content.replaceAll(line, '');
        });
    }
    content = content.replaceAll(`import("./proxy").`, '');
    content = content.replaceAll(`import("@/core/query").default;`, 'Query');
    return content;
}

writer.append(`
/**
 * @name ${plugin.name}
 * @author ${plugin.author}
 * @version ${plugin.version}
 * @updated ${new Date().toISOString()}
 */

declare module 'siyuan' {
    interface IProtyle {
        [key: string]: any;
    }
}

/**
 * Send siyuan kernel request
 */
declare function request(url: string, data: any): Promise<any | null>;

`.trimStart());

writer.append('///@query.d.ts\n');
let query = readFile('./types/core/query.d.ts');
query = replaceSomething(query, [
    'import { request } from "@/api";',
    'import { IWrappedBlock, IWrappedList } from "./proxy";'
]);
writer.append(query);
writer.append('\n');

writer.append('///@data-view-types.d.ts\n');
let dataviewdts = readFile('./src/types/data-view.d.ts');
dataviewdts = replaceSomething(dataviewdts);
writer.append(dataviewdts);
writer.append('\n');

writer.append('///@data-view.d.ts\n');
let dataview = readFile('./types/core/data-view.d.ts');
dataview = removeLine(dataview, 'import { IProtyle } from "siyuan";');
dataview = replaceSomething(dataview);
dataview = dataview.replaceAll('DataView extends UseStateMixin', 'DataView');
writer.append(dataview);
writer.append('\n');

// writer.append('// ================== use-state.d.ts ==================\n');
// let useState = readFile('./types/core/use-state.d.ts');
// useState = removeLine(useState, 'import { IProtyle } from "siyuan";');
// useState = replaceSomething(useState);
// writer.append(useState);
// writer.append('\n');

writer.append('///@proxy.d.ts\n');
let proxy = readFile('./types/core/proxy.d.ts');
proxy = replaceSomething(proxy);
writer.append(proxy);
writer.append('\n');

writer.append('///@index.d.ts\n');
let indexdts = readFile('./src/types/index.d.ts');
indexdts = replaceSomething(indexdts);
writer.append(indexdts);
writer.append('\n');

writer.close();

const cache = {
    '{{Query}}': query,
    '{{DataView}}': dataview + '\n\n' + dataviewdts,
    '{{Proxy}}': proxy,
}
// 写入 json
fs.writeFileSync('./types/types.d.ts.json', JSON.stringify(cache, null, 2));

//format
let content = fs.readFileSync(path.join(outputDir, 'types.d.ts'), 'utf8');
const ERASED_LINES = [
    'import { DataView } from "./data-view";',
    'export default Query;',
    'import UseStateMixin from "./use-state";',
];

for (const line of ERASED_LINES) {
    content = removeLine(content, line);
}

const lines = content.split('\n');

for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '}') {
        if (lines[i + 1].trim() !== '') {
            lines.splice(i + 1, 0, '');
        }
    }
}

// removeTypesDir();
fs.writeFileSync(path.join(outputDir, 'types.d.ts'), lines.join('\n'));
console.log(`${outputDir}/types.d.ts generated`);
