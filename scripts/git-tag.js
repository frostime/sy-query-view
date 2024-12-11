/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-11 14:35:13
 * @FilePath     : /scripts/git-tag.js
 * @LastEditTime : 2024-12-11 14:41:11
 * @Description  : 
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import readline from'readline';
import child_process from 'child_process';


// First define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const confirm = async (question) => {
    const userConfirm = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        userConfirm.question(question, (answer) => {
            userConfirm.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}


// Then use process
process.chdir(path.join(__dirname, '..'));
console.log(process.cwd());
const dirname = process.cwd();

const pluginJson = JSON.parse(fs.readFileSync(path.join(dirname, 'plugin.json'), 'utf-8'));
const tagName = `v${pluginJson.version}`;

// 检查 tag 是否存在, 如果存在就删掉
const gitTagListCommand = `git tag -l ${tagName}`;
console.log(gitTagListCommand);
const gitTagListResult = child_process.execSync(gitTagListCommand, { encoding: 'utf-8' });
console.log(gitTagListResult);
if (gitTagListResult.trim() === tagName) {
    console.log(`Tag ${tagName} already exists, it first.`);
    let flag = await confirm(`Do you want to delete the tag ${tagName}? (y/n) `);
    if (flag) {
        const gitTagDeleteCommand = `git tag -d ${tagName}`;
        console.log(gitTagDeleteCommand);
        const gitTagDeleteResult = child_process.execSync(gitTagDeleteCommand, { encoding: 'utf-8' });
        console.log(gitTagDeleteResult);
    } else {
        console.log('Aborted.');
        process.exit(0);
    }
}

// git tag
const gitTagCommand = `git tag ${tagName}`;
console.log(gitTagCommand);
const gitTagResult = child_process.execSync(gitTagCommand, { encoding: 'utf-8' });
console.log(gitTagResult);


let upload = await confirm(`Do you want to upload the tag ${tagName} to the remote repository? (y/n) `);
if (upload) {
    const gitPushCommand = `git push origin ${tagName}`;
    console.log(gitPushCommand);
    const gitPushResult = child_process.execSync(gitPushCommand, { encoding: 'utf-8' });
    console.log(gitPushResult);
}
