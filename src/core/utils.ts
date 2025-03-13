/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-11-28 21:29:40
 * @FilePath     : /src/core/utils.ts
 * @LastEditTime : 2025-03-13 19:36:01
 * @Description  : 
 */

import { Constants } from "siyuan";
import styles from './index.module.scss';

//https://github.com/siyuan-note/siyuan/blob/master/app/src/protyle/util/addScript.ts
export const addScript = (path: string, id: string) => {
    return new Promise((resolve) => {
        if (document.getElementById(id)) {
            // 脚本加载后再次调用直接返回
            resolve(false);
            return false;
        }
        const scriptElement = document.createElement("script");
        scriptElement.src = path;
        scriptElement.async = true;
        // 循环调用时 Chrome 不会重复请求 js
        document.head.appendChild(scriptElement);
        scriptElement.onload = () => {
            if (document.getElementById(id)) {
                // 循环调用需清除 DOM 中的 script 标签
                scriptElement.remove();
                resolve(false);
                return false;
            }
            scriptElement.id = id;
            resolve(true);
        };
    });
};


// https://github.com/siyuan-note/siyuan/blob/master/app/src/protyle/util/addStyle.ts
export const addStyle = (url: string, id: string) => {
    if (!document.getElementById(id)) {
        const styleElement = document.createElement("link");
        styleElement.id = id;
        styleElement.rel = "stylesheet";
        styleElement.type = "text/css";
        styleElement.href = url;
        const pluginsStyle = document.querySelector("#pluginsStyle");
        if (pluginsStyle) {
            pluginsStyle.before(styleElement);
        } else {
            document.getElementsByTagName("head")[0].appendChild(styleElement);
        }
    }
};

export const matchIDFormat = (id: string) => {
    let match = id.match(/^\d{14}-[a-z0-9]{7}$/);
    if (match) {
        return true;
    } else {
        return false;
    }
}

/**
 * Deep merges two objects, handling arrays and nested objects
 * @param source The original object
 * @param target The object to merge in
 * @returns The merged object
 */
export function deepMerge<T extends object>(source: T, target: Partial<T> | any): T {
    // Handle null/undefined cases
    if (!source) return target as T;
    if (!target) return source;

    const result = { ...source };

    Object.keys(target).forEach(key => {
        const sourceValue = source[key];
        const targetValue = target[key];

        // Skip undefined values
        if (targetValue === undefined) return;

        // Handle null values
        if (targetValue === null) {
            result[key] = null;
            return;
        }

        // Handle arrays
        if (Array.isArray(targetValue)) {
            result[key] = Array.isArray(sourceValue)
                ? sourceValue.map((item, index) => {
                    return targetValue[index] !== undefined
                        ? (typeof item === 'object' && typeof targetValue[index] === 'object')
                            ? deepMerge(item, targetValue[index])
                            : targetValue[index]
                        : item;
                  }).concat(targetValue.slice(sourceValue?.length || 0))
                : [...targetValue];
            return;
        }

        // Handle objects
        if (typeof targetValue === 'object' && Object.keys(targetValue).length > 0) {
            result[key] = typeof sourceValue === 'object'
                ? deepMerge(sourceValue, targetValue)
                : targetValue;
            return;
        }

        // Handle primitive values
        result[key] = targetValue;
    });

    return result;
}


export const initKatex = async () => {
    if (window.katex) return;
    // https://github.com/siyuan-note/siyuan/blob/master/app/src/protyle/render/mathRender.ts
    const cdn = Constants.PROTYLE_CDN;
    addStyle(`${cdn}/js/katex/katex.min.css`, "protyleKatexStyle");
    await addScript(`${cdn}/js/katex/katex.min.js`, "protyleKatexScript");
    return window.katex !== undefined && window.katex !== null;
}

export const renderMathBlock = (element: HTMLElement) => {
    try {
        // protyle dom 里面的是把公式放在 dataset.content 里面
        let formula = element.dataset.content || '';
        if (!formula.trim()) {
            return;
        }
        formula = window.Lute.UnEscapeHTMLStr(formula);

        const isBlock = element.tagName.toUpperCase() === 'DIV';

        // 使用 KaTeX 渲染公式
        const html = window.katex.renderToString(formula, {
            throwOnError: false, // 发生错误时不抛出异常
            displayMode: isBlock,   // 使用显示模式（居中显示）
            strict: (errorCode) => errorCode === "unicodeTextInMathMode" ? "ignore" : "warn",
            trust: true
        });

        // 清空原始内容并插入渲染后的内容
        element.innerHTML = html;
        // pointer-events
        element.style.pointerEvents = 'none';
        element.style.cursor = 'default';
        element.style.userSelect = 'text';
        if (isBlock) {
            element.classList.add(styles['katex-center-display']);
        }

    } catch (error) {
        console.error('Error rendering math formula:', error);
        // 可以在这里添加错误处理逻辑，比如显示错误提示
        element.innerHTML = `<span style="color: red;">Error rendering formula: ${error.message}</span>`;
    }
}
