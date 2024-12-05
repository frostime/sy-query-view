/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-03 19:49:52
 * @FilePath     : /src/core/use-state.ts
 * @LastEditTime : 2024-12-05 19:04:14
 * @Description  : 
 */
import { setBlockAttrs } from "@/api";
import { debounce } from "@/utils";
import { isWriteBlockAllowed } from "./sync-control";

export const purgeSessionStorage = () => {
    const keys = new Array(sessionStorage.length).fill(0).map((_, i) => sessionStorage.key(i));
    keys.forEach(key => {
        if (key.startsWith('dv-state@')) {
            sessionStorage.removeItem(key);
        }
    });
}

class UseStateMixin {
    /** @internal */
    private stateMap: Map<string, any> = new Map();
    /** @internal */
    private blockId: BlockId;
    /** @internal */
    private node: WeakRef<Element>;

    constructor(node: HTMLElement) {
        this.blockId = node.dataset.nodeId;
        this.node = new WeakRef(node);
        this.restoreState();  // 从块属性中恢复 state
    }


    /** @internal */
    private getState(key: string) {
        return this.stateMap.get(key);
    }

    /** @internal */
    private setState(key: string, value: any) {
        this.stateMap.set(key, value);
    }

    private sessionStorageKey = () => `dv-state@${this.blockId}`;
    static customStateKey = (key: string) => `custom-dv-state-${key}`;

    /** @internal */
    protected restoreState() {
        //先尝试从 sessionStorage 中恢复
        const storage = sessionStorage.getItem(this.sessionStorageKey());
        if (storage) {
            this.stateMap = new Map(Object.entries(JSON.parse(storage)));
        } else {
            //如果没有数据, 就从 element 的属性中查找恢复
            const customStateAttrs = Array.from(
                this.node.deref()?.attributes ?? []
            ).filter(attr => attr.name.startsWith(UseStateMixin.customStateKey('')));
            customStateAttrs.forEach(attr => {
                this.stateMap.set(attr.name.replace(UseStateMixin.customStateKey(''), ''), JSON.parse(attr.value));
            });
        }
    }

    private saveToBlockAttrs() {
        const allowance = isWriteBlockAllowed();
        if (!allowance) {
            console.debug('State.saveToBlockAttrs: During sync, disallowed');
            return;
        }
        const stateObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            stateObj[UseStateMixin.customStateKey(key)] = JSON.stringify(value);
        });
        console.log('State.saveToBlockAttrs', this.blockId, stateObj);
        setBlockAttrs(this.blockId, stateObj);
    }

    //debounce 参数设置的大一点, 尽量避免同步造成的数据冲突
    private saveToBlockDebounced = debounce(this.saveToBlockAttrs.bind(this), 5000); //#TODO 改大一点
    // private saveToBlockThrottled = throttle(this.saveToBlockAttrs.bind(this), 1000);

    private saveToBlockSafely() {
        /**
         * 防止出现在同步过程调用了 save，刚好在同步结束之后, protyle reload 之前调用，从而造成数据冲突
         */
        const allowance = isWriteBlockAllowed();
        if (!allowance) {
            console.debug('State.saveToBlockSafely: During sync, disallowed');
            return;
        }
        this.saveToBlockAttrs();
    }


    private saveToSessionStorage() {
        const storageObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            storageObj[key] = value;
        });
        sessionStorage.setItem(this.sessionStorageKey(), JSON.stringify(storageObj));
    }

    /**
     * @internal
     * 将 state 同步到块属性中
     */
    protected storeState() {
        if (this.stateMap.size === 0) {
            return;
        }
        console.debug('State.storeState', this.blockId);
        // 同步到 sessionStorage 做临时缓存
        this.saveToSessionStorage();
        // 同步到块属性中, 做持久化保存
        this.saveToBlockSafely();
        //TODO 后面考虑在关闭 protyle 的时候清理 sessionStorage 中的数据
    }

    useState<T>(key: string, initialValue?: T): IState<T> {
        if (!this.stateMap.has(key)) {
            this.setState(key, initialValue);
        }

        const registeredEffects: ((newValue: T, oldValue: T) => void)[] = [];

        const state = (value?: any) => {
            if (value !== undefined) {
                this.setState(key, value);
                this.storeState();
                registeredEffects.forEach(effect => effect(value, this.getState(key)));
            }
            return this.getState(key);
        };
        Object.defineProperty(state, 'value', {
            get: state,
            set: (value: any) => state(value),
        });

        Object.defineProperty(state, 'effect', {
            value: (effect: (newValue: T, oldValue: T) => void) => {
                registeredEffects.push(effect);
            },
        });
        Object.defineProperty(state, 'derived', {
            value: (derive: (value: T) => T) => {
                return () => derive(state());
            },
        });

        /**
         * 清理当前的 state key
         */
        Object.defineProperty(state, 'purge', {
            value: () => {
                this.stateMap.delete(key);
                this.storeState();
            },
        });

        return state as IState<T>;
    }
}

export default UseStateMixin;
