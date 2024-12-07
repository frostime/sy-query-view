/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-11-28 21:29:40
 * @FilePath     : /src/core/utils.ts
 * @LastEditTime : 2024-12-07 17:05:34
 * @Description  : 
 */
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
