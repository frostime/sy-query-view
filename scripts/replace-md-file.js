import fs from 'fs';
import path from 'path';

const dirname = process.argv[2];

const readFile = (filepath) => {
    return fs.readFileSync(filepath, 'utf8');
}

/**
 * 自动替换 Markdown 文件当中的变量名
 * @param {string} dirname - Markdown 文件夹路径
 * @param {Object} varVal - 变量名和替换内容对象, { [key: string]: string }
 */
const replaceMDFileVar = (dirname, varVal) => {
    const replace = (filepath) => {
        let md = readFile(filepath);
        for (const [key, value] of Object.entries(varVal)) {
            md = md.replaceAll(key, value);
        }
        fs.writeFileSync(filepath, md);
    }

    // 遍历所有 README*.md 文件
    const files = fs.readdirSync(dirname).filter(file => file.startsWith('README') && file.endsWith('.md'));
    for (const file of files) {
        replace(path.join(dirname, file));
    }
}

const jsonfile = './types/types.d.ts.json';
const cache = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
replaceMDFileVar(dirname, cache);
