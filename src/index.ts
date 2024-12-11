/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 15:57:28
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-12-11 01:00:01
 * @Description  : 
 */
import {
    IMenu,
    Menu,
    Plugin,
    type App,
} from "siyuan";
import "@/index.scss";
import * as DataQuery from "./core";
import * as Setting from "./setting";
import * as UserHelp from "./user-help";

let i18n: I18n;
let app: App;

const onClose = () => {
    console.debug('Close Window')
    DataQuery.finalizeAllDataviews();
}

export default class QueryViewPlugin extends Plugin {

    disposeCb = [];

    private topBarMenuItems: IMenu[] = [];

    declare version: string;

    private init() {
        const showMenu = () => {
            let menu = new Menu("query-view");
            this.topBarMenuItems.forEach(item => {
                menu.addItem(item);
            });

            const rect = topbar.getBoundingClientRect();
            menu.open({
                x: rect.left,
                y: rect.bottom,
                isLeft: false
            });
        }

        const topbar = this.addTopBar({
            icon: 'iconEmbed',
            title: 'Query&View',
            position: 'left',
            callback: showMenu
        });
    }

    registerMenuItem(item: IMenu) {
        this.topBarMenuItems.push(item);
    }

    async onload() {
        //@ts-ignore
        i18n = this.i18n as I18n;
        app = this.app;
        this.init();

        Setting.load(this);
        DataQuery.load(this);
        UserHelp.load(this);
    }

    async onunload() {
        DataQuery.unload(this);
        this.disposeCb.forEach(f => f());
    }

    onLayoutReady(): void {
        //Ctrl + F5 刷新的时候起作用
        window.addEventListener('beforeunload', onClose);
        this.disposeCb.push(() => {
            window.removeEventListener('beforeunload', onClose);
        })


        const closeEle = document.querySelector('div#windowControls > div#closeWindow');
        if (closeEle) {
            closeEle.addEventListener('click', onClose, true);
            this.disposeCb.push(() => {
                closeEle.removeEventListener('click', onClose, true);
            })
        }
    }
}

export { i18n, app };
