/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 18:18:56
 * @FilePath     : /scripts/generate-types.js
 * @LastEditTime : 2024-12-01 22:05:03
 * @Description  : 
 */
import { Project } from 'ts-morph';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { ts } from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const project = new Project({
    tsConfigFilePath: resolve(__dirname, '../tsconfig.json'),
});
async function generateTypeDefinitions() {

    const outputFile = project.createSourceFile(
        resolve(__dirname, '../public/types.d.ts'),
        '',
        { overwrite: true }
    );

    outputFile.addStatements('// Auto-generated type definitions\n');

    // ========== types/index.d.ts ==========

    const idxFile = project.addSourceFileAtPath(resolve(__dirname, '../src/types/index.d.ts'));
    idxFile.getTypeAliases().forEach(typeAlias => {
        const name = typeAlias.getName();
        if (['NotebookConf', 'doOperation'].includes(name)) {
            return;
        }
        const text = typeAlias.getText();
        outputFile.addStatements(text);
    });


    // Add IProtyle declaration
    outputFile.addStatements(`
/** 
 * IProtyle interface from Siyuan
 */
declare interface IProtyle {
    [key: string]: any;
}`);

    // ========== query.ts ==========
    const queryFile = project.addSourceFileAtPath(resolve(__dirname, '../src/core/query.ts'));
    extractQueryInterface(queryFile, outputFile);
    outputFile.addStatements('\n');

    // ========== data-view.ts ==========

    const dataViewFile = project.addSourceFileAtPath(resolve(__dirname, '../src/core/data-view.ts'));

    extractClassAndInterface(dataViewFile, outputFile);

    await outputFile.save();
}

function extractQueryInterface(sourceFile, outputFile) {
    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
        if (variable.getName() === 'Query') {
            const type = variable.getType();
            const interfaceDec = outputFile.addInterface({
                name: 'Query',
                isExported: false
            });

            // Add properties and methods from the Query object
            type.getProperties().forEach(prop => {
                const propType = prop.getTypeAtLocation(variable);
                if (prop.getName() === 'Utils') {
                    // 特殊处理 Utils 对象，为其创建独立的接口
                    outputFile.addInterface({
                        name: 'QueryUtils',
                        isExported: false
                    });

                    interfaceDec.addProperty({
                        name: 'Utils',
                        type: 'QueryUtils'
                    });

                    const utilsType = propType;
                    utilsType.getProperties().forEach(utilProp => {
                        const utilPropType = utilProp.getTypeAtLocation(variable);
                        if (utilPropType.getCallSignatures().length > 0) {
                            const signature = utilPropType.getCallSignatures()[0];
                            outputFile.getInterface('QueryUtils').addMethod({
                                name: utilProp.getName(),
                                parameters: signature.getParameters().map(p => ({
                                    name: p.getName(),
                                    type: p.getTypeAtLocation(variable).getText().replace(/import\(".*?"\)\./g, ''),
                                    hasQuestionToken: p.isOptional()
                                })),
                                returnType: signature.getReturnType().getText().replace(/import\(".*?"\)\./g, '')
                            });
                        }
                    });
                } else if (propType.getCallSignatures().length > 0) {
                    // 其他方法保持不变
                    const signature = propType.getCallSignatures()[0];
                    interfaceDec.addMethod({
                        name: prop.getName(),
                        parameters: signature.getParameters().map(p => ({
                            name: p.getName(),
                            type: p.getTypeAtLocation(variable).getText().replace(/import\(".*?"\)\./g, '')
                        })),
                        returnType: signature.getReturnType().getText().replace(/import\(".*?"\)\./g, '')
                    });
                } else {
                    // 其他属性保持不变
                    interfaceDec.addProperty({
                        name: prop.getName(),
                        type: propType.getText().replace(/import\(".*?"\)\./g, '')
                    });
                }
            });
        }
    }
}

function extractClassAndInterface(sourceFile, outputFile) {
    // 提取类定义
    for (const cls of sourceFile.getClasses()) {
        const name = cls.getName();
        const interfaceDec = outputFile.addInterface({
            name: name,
            isExported: false,
            docs: [{ description: cls.getJsDocs().map(doc => doc.getDescription()).join('\n') }]
        });

        // 添加方法和属性
        cls.getMethods().forEach(method => {
            if (method.getScope() === 'private') return;

            const docs = method.getJsDocs();
            const parameters = method.getParameters().map(p => {
                // 获取参数的 JSDoc 注释
                const paramDocs = docs
                    .map(doc => doc.getTags())
                    .flat()
                    .map(tag => tag.getCommentText())
                    .join('\n');

                return {
                    name: p.getName(),
                    type: p.getType().getText().replace(/import\(".*?"\)\./g, ''),
                    hasQuestionToken: p.hasQuestionToken(),
                    docs: paramDocs ? [{ description: paramDocs }] : undefined
                };
            });

            interfaceDec.addMethod({
                name: method.getName(),
                parameters: parameters,
                returnType: method.getReturnType().getText().replace(/import\(".*?"\)\./g, ''),
                docs: docs.length > 0 ? [{ description: docs.map(doc => doc.getDescription()).join('\n') }] : undefined
            });
        });
    }

    function processInterfaceText(text) {
        // 将整个文本按行分割
        const lines = text.split('\n');

        // 处理每一行
        const processedLines = lines.map(line => {
            // 移除行首多余的空格，但保留缩进
            line = line.replace(/^\s{2,}/, '    ');

            // 如果是注释行，确保它单独成行
            if (line.trim().startsWith('//')) {
                return line;
            }

            if (line.trim().startsWith('export')) {
                line = line.replace('export ', '');
            }

            return line;
        });

        // 修改：确保接口定义之间有两个空行
        let result = processedLines.join('\n');

        return result;
    }

    // 提取接口定义
    const handledInterfaces = new Set();
    for (const intf of sourceFile.getInterfaces()) {
        const name = intf.getName();
        if (handledInterfaces.has(name)) return;

        const text = processInterfaceText(intf.getText().replace(/import\(".*?"\)\./g, ''));
        outputFile.addStatements(text);
        handledInterfaces.add(name);
    }
}

// 运行生成器
generateTypeDefinitions().catch(console.error);
