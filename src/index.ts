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

        this.addIcons(ICON);
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
            icon: 'iconQueryView',
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

const ICON = `
<symbol id="iconQueryView" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4362"><path d="M512 128C724.053333 128 896 299.946667 896 512 896 587.093333 874.666667 657.066667 837.12 716.373333L896 775.253333 896 853.333333C896 876.8 876.8 896 853.333333 896L775.68 896 716.373333 837.12C657.493333 874.666667 587.093333 896 512 896 299.946667 896 128 724.053333 128 512 128 299.946667 299.946667 128 512 128M512 298.666667C394.24 298.666667 298.666667 394.24 298.666667 512 298.666667 629.76 394.24 725.333333 512 725.333333 539.733333 725.333333 565.76 720.213333 590.08 710.4L467.2 587.52C433.92 554.666667 433.92 500.053333 467.2 466.773333 500.48 433.493333 554.666667 433.493333 587.946667 466.773333L710.826667 589.653333C720.213333 565.76 725.333333 539.306667 725.333333 512 725.333333 394.24 629.76 298.666667 512 298.666667Z" p-id="4363"></path></symbol>
`;

export { i18n, app };
