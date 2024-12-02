import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

let outputDir = './public';

const tsc = `tsc --declaration --emitDeclarationOnly --skipLibCheck --target ES2022 --project tsconfig.json --outDir ./types --noEmitOnError false`;

await exec(tsc);


const fileWriter = (filepath) => {
    let fd = fs.openSync(filepath, 'w');

    const process = (content) => {
        content = content.replaceAll(`import("./proxy").`, '');
        content = content.replaceAll(`import("@/core/query").default;`, 'Query');
        return content;
    }

    return {
        append: (content) => {
            content = process(content);
            fs.writeSync(fd, content);
        },
        close: () => {
            fs.closeSync(fd);
        }
    }
}

const readFile = (filepath) => {
    return fs.readFileSync(filepath, 'utf8');
}

const removeLine = (content, line) => {
    const lines = content.split('\n');
    lines.splice(lines.indexOf(line), 1);
    return lines.join('\n');
}

const writer = fileWriter(path.join(outputDir, 'types.d.ts'));

writer.append(`
declare module 'siyuan' {
    interface IProtyle {
        [key: string]: any;
    }
}

`.trimStart());

const query = readFile('./types/core/query.d.ts');
writer.append(query);
writer.append('\n');


let dataview = readFile('./types/core/data-view.d.ts');
dataview = removeLine(dataview, 'import { IProtyle } from "siyuan";');
writer.append(dataview);
writer.append('\n');

const proxy = readFile('./types/core/proxy.d.ts');
writer.append(proxy);
writer.append('\n');

const indexdts = readFile('./src/types/index.d.ts');
writer.append(indexdts);
writer.append('\n');

writer.close();

const cache = {
    '{{Query}}': query,
    '{{DataView}}': dataview,
    '{{Proxy}}': proxy,
}
// 写入 json
fs.writeFileSync('./types/types.d.ts.json', JSON.stringify(cache, null, 2));

//format
let content = fs.readFileSync(path.join(outputDir, 'types.d.ts'), 'utf8');
const ERASED_LINES = [
    'import { DataView } from "./data-view";',
    'export default Query;',
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
fs.writeFileSync(path.join(outputDir, 'types.d.ts'), lines.join('\n'));
