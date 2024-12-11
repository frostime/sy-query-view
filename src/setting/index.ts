/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:25:57
 * @FilePath     : /src/setting/index.ts
 * @LastEditTime : 2024-12-05 21:43:39
 * @Description  : 
 */

import { i18n } from "@/index";

import { Plugin, showMessage } from "siyuan";
import { SettingUtils } from "@/libs/setting-utils";
import { loadUserCustomView } from "@/core/custom-view";
import { getSessionStorageSize } from "@/core/finalize";


let defaultSetting = {
    codeEditor: 'code -w {{filepath}}',
    defaultTableColumns: ['type', 'content', 'hpath', 'box'].join(','),
    echartsRenderer: 'svg'
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
    /* For Debug Only
    settingUtils.addItem({
        type: 'hint',
        title: 'Session Storage Size',
        description: 'For debugging, please omit this item',
        key: 'sessionStorageSize',
        value: '',
        createElement: () => {
            let size = getSessionStorageSize();
            let span = document.createElement('span');
            const updateSize = (size) => {
                span.innerText = size;
                if (size.endsWith('MB')) {
                    span.style.color = 'var(--b3-theme-error)';
                    const num = parseFloat(size.replace('MB', ''));
                    if (num >= 2.5) {
                        span.style.fontWeight = 'bold';
                    }
                }
            }
            updateSize(size);
            const button = document.createElement('button');
            button.className = "b3-button b3-button--text";
            button.innerText = 'Clear';
            button.onclick = () => {
                //iterate through all keys in sessionStorage and remove them
                const keys = new Array(sessionStorage.length).fill(0).map((_, i) => sessionStorage.key(i));
                keys.forEach(key => {
                    if (key.startsWith('dv-state@')) {
                        sessionStorage.removeItem(key);
                    }
                });
                // span.innerText = getSessionStorageSize();
                updateSize(getSessionStorageSize());
            };
            const div = document.createElement('div');
            Object.assign(div.style, {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            });
            div.appendChild(span);
            div.appendChild(button);
            return div;
        }
    });
    */
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

