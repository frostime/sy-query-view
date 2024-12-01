/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-23 17:52:18
 * @FilePath     : /src/utils/style.ts
 * @LastEditTime : 2024-06-23 17:54:03
 * @Description  : 
 */
export const updateStyleDom = (domId: string, css: string) => {
    let style: HTMLStyleElement = document.getElementById(domId) as HTMLStyleElement;
    if (!style) {
        style = document.createElement('style');
        style.id = domId;
        document.head.appendChild(style);
    }
    style.innerHTML = css;
}

export const removeStyleDom = (domId: string) => {
    const style = document.querySelector(`style#${domId}`);
    style?.remove();
}

