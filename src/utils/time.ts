/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-11 14:21:11
 * @FilePath     : /src/utils/time.ts
 * @LastEditTime : 2024-07-14 21:52:43
 * @Description  : 
 */

/**
 * 将 SiYuan block 中的时间格式转换为 Date
 * @param fmt 
 * @returns 
 */
export const sy2Date = (fmt: string): Date => {
    // Extract year, month, day, hour, minute, and second from the fmt string
    const year = parseInt(fmt.slice(0, 4), 10);
    const month = parseInt(fmt.slice(4, 6), 10) - 1; // Month is 0-indexed in JavaScript Date
    const day = parseInt(fmt.slice(6, 8), 10);
    const hour = parseInt(fmt.slice(8, 10), 10);
    const minute = parseInt(fmt.slice(10, 12), 10);
    const second = parseInt(fmt.slice(12, 14), 10);

    // Create a new Date object using the extracted values
    return new Date(year, month, day, hour, minute, second);
}

export function formatDate(date?: Date, sep=''): string {
    date = date === undefined ? new Date() : date;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return `${year}${sep}${month < 10 ? '0' + month : month}${sep}${day < 10 ? '0' + day : day}`;
}

const renderString = (template: string, data: { [key: string]: string }) => {
    for (let key in data) {
        template = template.replace(key, data[key]);
    }
    return template;
}

/**
 * yyyy-MM-dd HH:mm:ss
 * @param template 
 * @param now 
 * @returns 
 */
export const formatDateTime = (template: string, now?: Date) => {
    now = now || new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    return renderString(template, {
        'yyyy': year.toString(),
        'MM': month.toString().padStart(2, '0'),
        'dd': day.toString().padStart(2, '0'),
        'HH': hour.toString().padStart(2, '0'),
        'mm': minute.toString().padStart(2, '0'),
        'ss': second.toString().padStart(2, '0'),
        'yy': year.toString().slice(-2),
    });
}
