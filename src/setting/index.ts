/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:25:57
 * @FilePath     : /src/setting/index.ts
 * @LastEditTime : 2024-12-02 22:48:08
 * @Description  : 
 */

import { i18n } from "@/index";

import { Plugin } from "siyuan";
import { SettingUtils } from "@/libs/setting-utils";
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
        description: ((`API 接口的类型定义，请参考: `)) + `<a href="https://github.com/frostime/sy-query-view/blob/main/public/types.d.ts" target="_blank">frostime/sy-query-view/public/types.d.ts</a>`,
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

