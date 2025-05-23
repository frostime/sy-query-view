/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-04-18 21:05:32
 * @FilePath     : /src/utils/index.ts
 * @LastEditTime : 2025-01-14 14:28:41
 * @Description  : 
 */
import * as api from '../api';
import { getFrontend, openMobileFileById, openTab, TProtyleAction, type Plugin } from 'siyuan';
import { app } from '@/index';


export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return function(...args: Parameters<F>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export const isMobile = () => {
    return getFrontend().endsWith('mobile');
}

export const openBlock = (id: BlockId, options?: {
    zoomIn?: boolean;
    action?: TProtyleAction[];
    position?: Parameters<typeof openTab>[0]['position'];
    keepCursor?: boolean;
}) => {
    if (isMobile()) {
        openMobileFileById(app, id);
    } else {
        openTab({
            app: app,
            doc: {
                id: id,
                zoomIn: options?.zoomIn ?? false,
                action: options?.action ?? [],
            },
            position: options?.position,
            keepCursor: options?.keepCursor,
        });
    }
};


export const getNotebook = (boxId: string): Notebook => {
    let notebooks: Notebook[] =  window.siyuan.notebooks;
    for (let notebook of notebooks) {
        if (notebook.id === boxId) {
            return notebook;
        }
    }
}

export function getActiveDoc() {
    let tab = document.querySelector("div.layout__wnd--active ul.layout-tab-bar>li.item--focus");
    let dataId: string = tab?.getAttribute("data-id");
    if (!dataId) {
        return null;
    }
    const activeTab: HTMLDivElement = document.querySelector(
        `.layout-tab-container.fn__flex-1>div.protyle[data-id="${dataId}"]`
    ) as HTMLDivElement;
    if (!activeTab) {
        return;
    }
    const eleTitle = activeTab.querySelector(".protyle-title");
    let docId = eleTitle?.getAttribute("data-node-id");
    return docId;
}

export function isnot(value: any) {
    if (value === undefined || value === null) {
        return true;
    } else if (value === false) {
        return true;
    } else if (typeof value === 'string' && value.trim() === '') {
        return true;
    } else if (value?.length === 0) {
        return true;
    }
    return false;
}

export async function getChildDocs(block: BlockId, limit=64) {
    let sqlCode = `select * from blocks where path regexp '.*/${block}/[0-9a-z\-]+\.sy' and type='d'
    order by hpath desc limit ${limit};`;
    let childDocs = await api.sql(sqlCode);
    return childDocs;
}


export const html2ele = (html: string): DocumentFragment => {
    let template = document.createElement('template');
    template.innerHTML = html.trim();
    let ele = document.importNode(template.content, true);
    return ele;
}

export function throttle<T extends (...args: any[]) => any>(func: T, wait: number = 500){
    let previous = 0;
    return function(...args: Parameters<T>){
        let now = Date.now(), context = this;
        if(now - previous > wait){
            func.apply(context, args);
            previous = now;
        }
    }
}
