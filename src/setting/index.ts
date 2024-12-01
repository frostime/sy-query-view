/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:25:57
 * @FilePath     : /src/setting/index.ts
 * @LastEditTime : 2024-12-01 17:02:39
 * @Description  : 
 */

import { i18n } from "@/index";

import { Plugin } from "siyuan";
import { SettingUtils } from "@/libs/setting-utils";
let defaultSetting = {
    codeEditor: 'code -w {{filepath}}'
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
        type: 'textinput',
        title: i18n.src_setting_indexts.open_local_editor,
        description: i18n.src_setting_indexts.local_command_desc,
        key: 'codeEditor',
        value: defaultSetting.codeEditor,
        direction: 'row'
    });
    const configs = await settingUtils.load();
    delete configs.codeEditor;
    defaultSetting = { ...defaultSetting, ...configs };
};

export const setting = new Proxy(defaultSetting, {
    get: (target, key) => {
        return target[key];
    },
    set: (target, key, value) => {
        console.warn('禁止外部修改插件配置变量');
        return false;
    }
});

