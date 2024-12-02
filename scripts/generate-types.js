/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 18:18:56
 * @FilePath     : /scripts/generate-types.js
 * @LastEditTime : 2024-12-02 09:48:24
 * @Description  : 废弃，效果一般
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

    // declare globalThis.Query
    outputFile.addStatements(`
declare interface Window {
    Query: Query;
}

declare interface GlobalThis {
    Query: Query;
}
        `);

    // ========== data-view.ts ==========

    const dataViewFile = project.addSourceFileAtPath(resolve(__dirname, '../src/core/data-view.ts'));

    extractClassAndInterface(dataViewFile, outputFile);

    // ========== proxy.ts ==========
    const proxyFile = project.addSourceFileAtPath(resolve(__dirname, '../src/core/proxy.ts'));
    extractClassAndInterface(proxyFile, outputFile);

    await outputFile.save();
}


const addMethodProperty = (interfaceDec, prop, variable) => {
    const propType = prop.getTypeAtLocation(variable);
    const signature = propType.getCallSignatures()[0];

    // 获取属性声明并检查类型
    // const declarations = prop.getDeclarations();
    // let description;
    // if (declarations && declarations.length > 0) {
    //     const declaration = declarations[0];
    //     // PropertyAssignment 类型的处理
    //     if (declaration.getJsDocs) {
    //         const docs = declaration.getJsDocs();
    //         description = docs.length > 0
    //             ? docs.map(doc => doc.getDescription()).join('\n')
    //             : undefined;
    //     } else if (declaration.jsDoc) {
    //         // 直接访问 jsDoc 属性
    //         const docs = declaration.jsDoc;
    //         description = docs && docs.length > 0
    //             ? docs.map(doc => doc.comment).filter(Boolean).join('\n')
    //             : undefined;
    //     }
    // }

    interfaceDec.addMethod({
        name: prop.getName(),
        parameters: signature.getParameters().map(p => ({
            name: p.getName(),
            type: p.getTypeAtLocation(variable).getText().replace(/import\(".*?"\)\./g, '')
        })),
        returnType: signature.getReturnType().getText().replace(/import\(".*?"\)\./g, ''),
        docs: description ? [{ description }] : undefined
    });
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
                            addMethodProperty(outputFile.getInterface('QueryUtils'), utilProp, variable);
                        }
                    });
                } else if (propType.getCallSignatures().length > 0) {
                    // 其他方法保持不变
                    addMethodProperty(interfaceDec, prop, variable);
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

const methodParamsAndDocs = (method) => {
    const docs = method.getJsDocs();
    const parameters = method.getParameters().map(p => {
        // 获取参数的 JSDoc 注释
        const paramDocs = docs
        // .map(doc => doc.getTags())
        // .flat()
        // .map(tag => tag.getCommentText())
        // .join('\n');

        return {
            name: p.getName(),
            type: p.getType().getText().replace(/import\(".*?"\)\./g, ''),
            hasQuestionToken: p.hasQuestionToken(),
            docs: paramDocs ? [{ description: paramDocs }] : undefined
        };
    });
    return { parameters, docs };
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

            const { parameters, docs } = methodParamsAndDocs(method);

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
