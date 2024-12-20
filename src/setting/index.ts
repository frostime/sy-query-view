/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:25:57
 * @FilePath     : /src/setting/index.ts
 * @LastEditTime : 2024-12-20 21:58:58
 * @Description  : 
 */

import { i18n } from "@/index";

import { Plugin, showMessage } from "siyuan";
import { SettingUtils } from "@/libs/setting-utils";
import { loadUserCustomView } from "@/core/custom-view";


let defaultSetting = {
    codeEditor: 'code -w {{filepath}}',
    defaultTableColumns: ['type', 'content', 'hpath', 'box'].join(','),
    echartsRenderer: 'svg',
    onlyImportDtsInUserDoc: true
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
        type: 'checkbox',
        title: i18n.src_setting_indexts.user_doc_import_type_ref,
        description: i18n.src_setting_indexts.plugin_import_help_doc,
        key: 'onlyImportDtsInUserDoc',
        value: defaultSetting.onlyImportDtsInUserDoc,
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
        title: i18n.src_setting_indexts.user_custom_view,
        description: i18n.src_setting_indexts.user_self_written_view,
        key: 'userCustomView',
        value: '',
        button: {
            label: i18n.src_setting_indexts.reload,
            callback: async () => {
                const result = await loadUserCustomView();
                if (result.ok) {
                    let cnt = Object.keys(result.custom).length;
                    showMessage(i18n.src_setting_indexts.import_success.replace('{cnt}', `${cnt}`), 3000, 'info');
                } else {
                    showMessage(i18n.src_setting_indexts.import_failed, 3000, 'error');
                }
            }
        }
    });
    settingUtils.addItem({
        type: 'select',
        title: i18n.src_setting_indexts.echarts_renderer,
        key: 'echartsRenderer',
        description: i18n.src_setting_indexts.echarts_renderer_option,
        value: defaultSetting.echartsRenderer,
        options: {
            canvas: 'canvas',
            svg: 'svg'
        }
    });

    const configs = await settingUtils.load();
    // codeEditor config is sotred in localstorage
    let codeEditor = localStorage.get('codeEditor') ?? configs.codeEditor;
    settingUtils.set('codeEditor', codeEditor);
};

export const setting = new Proxy({} as typeof defaultSetting, {
    get: (target, key: string) => {
        // return target[key];
        return settingUtils.get(key);
    },
    set: (target, key, value) => {
        console.warn('禁止外部修改插件配置变量');
        return false;
    }
});

