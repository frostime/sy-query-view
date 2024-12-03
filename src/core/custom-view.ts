/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-02 22:54:07
 * @FilePath     : /src/core/custom-view.ts
 * @LastEditTime : 2024-12-03 14:25:59
 * @Description  : 
 */

import { putFile } from "@/api";
import { PROHIBIT_METHOD_NAMES } from "@/core/data-view";

const blankContent = `
/**
This script is used for sy-query-view plugin to define user's customized view components. Type declarations as follows:

interface ICustomView {
    use: () => {
        init: (dv: IDataView, ...args: any[]) => HTMLElement; //Create the user custom view.
        dispose?: (dv: IDataView) => void;  // Unmount hook for the user custom view.
    },
    alias?: string[]; // alias name for the custom view
}

interface IUserCustom {
    [key: string]: ICustomView;
}

Once correctly registerd, you can use the custom view like this:

dv.addexample(1);
dv.addcols([dv.table(childs), dv.Example(2)]); //use alias
 */

const custom = {
    example: {
        use: () => {
            let state;
            return {
                init: (dv, id) => {
                    console.log('init example custom view inside DataView:', dv);
                    state = id;
                    return 'This is a example custom view ' + id;
                },
                dispose: () => {
                    console.log('dispose example custom view ' + state);
                }
            };
        },
        alias: ['Example', 'ExampleView']
    }
}

export default custom;
`.trimStart();

let customView: IUserCustom;

const filename = 'query-view.custom.js';
export const filepath = `/data/public/${filename}`;

const createCustomModuleFile = async () => {
    const file = new File([blankContent], filename, { type: 'text/javascript' });
    const res = await putFile(
        filepath,
        false,
        file
    );
    return res;
}

const validateCustomView = (module: IUserCustom) => {
    if (typeof module !== 'object') {
        console.warn('Invalid custom query-view module format, should be an object');
        return false;
    }

    for (const [key, value] of Object.entries(module)) {
        if (PROHIBIT_METHOD_NAMES.includes(key)) {
            console.warn(`Invalid custom query-view module format, ${key} is a prohibited method name`);
            return false;
        }
        const view = value as ICustomView;
        if (!view.use || typeof view.use !== 'function') {
            console.warn(`Invalid custom query-view module format, ${key} should have a use method`);
            return false;
        }
        const { init, dispose } = view.use();
        if (typeof init !== 'function') {
            console.warn(`Invalid custom query-view module format, ${key} init should be a function`);
            return false;
        }
        if (dispose && typeof dispose !== 'function') {
            console.warn(`Invalid custom query-view module format, ${key} dispose should be a function`);
            return false;
        }
    }
    return true;
}

export const loadUserCustomView = async () => {
    const result = {
        ok: false,
        exists: false,
        valid: false,
        custom: null
    }

    let url: string | undefined;
    try {
        const response = await fetch(filepath.replace('/data', ''));  // /data 是路径, 路由则不需要这个前缀
        if (!response.ok) {
            result.exists = false;
            throw new Error(`Failed to fetch custom JS file: ${response.statusText}`);
        }
        result.exists = true;
        const jsContent = await response.text();

        const blob = new Blob([jsContent], { type: 'text/javascript' });
        url = URL.createObjectURL(blob);

        const module = await import(url);
        const custom = module.default;
        const validateResult = validateCustomView(custom);
        if (validateResult) {
            customView = custom;
            result.valid = true;
            result.custom = custom;
        } else {
            result.valid = false;
        }
    } catch (error) {
        console.warn('Failed to load custom JS file:', error);
        if (!result.exists) {
            try {
                await createCustomModuleFile();
            } catch (createError) {
                console.error('Failed to create custom module file:', createError);
            }
        }
    } finally {
        if (url) {
            URL.revokeObjectURL(url);
        }
    }
    result.ok = result.exists && result.valid;
    return result;
}

export const getCustomView = () => customView;
