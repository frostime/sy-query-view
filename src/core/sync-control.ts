import { purgeSessionStorage } from "./use-state";

/**
 * 在同步的过程当中，禁止在 UseState 中更新块的属性
 */
const status = {
    syncthing: false,
}

export const isWriteBlockAllowed = () => !status.syncthing;

export const onSyncStart = ({detail}: CustomEvent) => {
    console.debug('Sync Start');
    status.syncthing = true;
}

export const onSyncEnd = ({detail}: CustomEvent) => {
    console.debug('Sync End');
    /**
     * 在同步结束的时候清理掉本地的 sessionStorage，保证下次 useState 的时候只能从 block element 中读取
     * 确保多端状态同步
     */
    purgeSessionStorage();
    setTimeout(() => {
        status.syncthing = false;
    }, 1000);
}

export const onSyncFail = ({detail}: CustomEvent) => {
    console.debug('Sync Fail');
    purgeSessionStorage();
    setTimeout(() => {
        status.syncthing = false;
    }, 1000);
}
