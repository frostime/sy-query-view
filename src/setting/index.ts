/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:25:57
 * @FilePath     : /src/setting/index.ts
 * @LastEditTime : 2024-12-03 12:45:28
 * @Description  : 
 */

import { i18n } from "@/index";

import { Plugin, showMessage } from "siyuan";
import { SettingUtils } from "@/libs/setting-utils";
import { loadUserCustomView } from "@/core/custom-view";


let defaultSetting = {
    codeEditor: 'code -w {{filepath}}',
    defaultTableColumns: ['type', 'content', 'hpath', 'box'].join(',')
};

let settingUtils: SettingUtils;

const useDeviceStorage = async (plugin: Plugin) => {
    const device = window.siyuan.config.system;
    const fname = `Device@${device.id}.json`;
    let config = await plugin.loadData(fname);
    config = config || {};
    return {
        get: (key: string | number) => {
            return config[key];
        },
        set: async (key: string | number, value: any) => {
            config[key] = value;
            await plugin.saveData(fname, config);
        },
    }
}

const storageName = 'setting';
export const load = async (plugin: Plugin) => {
    const localStorage = await useDeviceStorage(plugin);
    defaultSetting.codeEditor = localStorage.get('codeEditor') ?? defaultSetting.codeEditor;

    settingUtils = new SettingUtils({
        plugin,
        name: storageName,
        callback: (data: typeof defaultSetting) => {
            localStorage.set('codeEditor', data.codeEditor);
        },
        width: '1000px',
        height: '500px'
    });
    settingUtils.addItem({
        type: 'hint',
        title: i18n.src_setting_indexts.api_interface,
        description: i18n.src_setting_indexts.apitypedefinition + `<a href="https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts" target="_blank">frostime/sy-query-view/public/types.d.ts</a>`,
        key: 'apiDoc',
        value: '',
    });
    settingUtils.addItem({
        type: 'textinput',
        title: i18n.src_setting_indexts.open_local_editor,
        description: i18n.src_setting_indexts.local_command_desc,
        key: 'codeEditor',
        value: defaultSetting.codeEditor,
        direction: 'row'
    });
    settingUtils.addItem({
        type: 'textinput',
        title: i18n.src_setting_indexts.table_default_columns,
        description: i18n.src_setting_indexts.defaultcolumnsofdataviewtable,
        key: 'defaultTableColumns',
        value: defaultSetting.defaultTableColumns,
        direction: 'row'
    });
    settingUtils.addItem({
        type: 'button',
        title: ((`用户自定义视图`)),
        description: ((`用户自行编写的 View 组件, 存放在 '/data/public/custom-query-view.js' 下`)),
        key: 'userCustomView',
        value: '',
        button: {
            label: '重新导入',
            callback: async () => {
                const result = await loadUserCustomView();
                if (result.ok) {
                    let cnt = Object.keys(result.custom).length;
                    showMessage(((`导入成功, 共 {cnt} 个自定义视图`)).replace('{cnt}', `${cnt}`), 3000, 'info');
                } else {
                    showMessage(((`导入失败, 详细情况请检查控制台报错`)), 3000, 'error');
                }
            }
        }
    });
    const configs = await settingUtils.load();
    delete configs.codeEditor;
    defaultSetting = { ...defaultSetting, ...configs };
};

export const setting = new Proxy(defaultSetting, {
    get: (target, key: string) => {
        // return target[key];
        return settingUtils.get(key);
    },
    set: (target, key, value) => {
        console.warn('禁止外部修改插件配置变量');
        return false;
    }
});

