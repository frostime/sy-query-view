/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-03 19:49:52
 * @FilePath     : /src/core/use-state.ts
 * @LastEditTime : 2024-12-08 19:38:54
 * @Description  : 
 */
import { setBlockAttrs } from "@/api";
import { debounce } from "@/utils";
// import { debounce } from "@/utils";

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
    protected stateMap: Map<string, any> = new Map();
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

    protected sessionStorageKey = () => `dv-state@${this.blockId}`;
    static customStateKey = (key: string) => `custom-dv-state-${key}`;

    /** @internal
     * 首先尝试从 sessionStorage 中恢复 state, 如果 sessionStorage 中没有数据, 则从 element 的属性中查找恢复
    */
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

    protected async saveToBlockAttrs() {
        const stateObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            stateObj[UseStateMixin.customStateKey(key)] = JSON.stringify(value);
        });
        console.debug('saveToBlockAttrs', this.blockId, stateObj);
        await setBlockAttrs(this.blockId, stateObj);
    }

    // protected saveToBlockDebounced = debounce(this.saveToBlockAttrs.bind(this), 1000);
    // private saveToBlockThrottled = throttle(this.saveToBlockAttrs.bind(this), 1000);

    public get hasState() {
        return this.stateMap.size > 0;
    }


    protected saveToSessionStorage() {
        if (!this.hasState) {
            return;
        }
        const storageObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            storageObj[key] = value;
        });
        sessionStorage.setItem(this.sessionStorageKey(), JSON.stringify(storageObj));
    }

    public removeFromSessionStorage() {
        sessionStorage.removeItem(this.sessionStorageKey());
    }

    useState<T>(key: string, initialValue?: T): IState<T> {
        if (!this.stateMap.has(key)) {
            this.setState(key, initialValue);
        }

        const registeredEffects: ((newValue: T, oldValue: T) => void)[] = [];

        const getter = () => this.getState(key);
        const setter = (value: any) => {
            this.setState(key, value);
            this.saveToSessionStorage();
            registeredEffects.forEach(effect => effect(value, this.getState(key)));
        }

        const state = (value?: any) => {
            if (value !== undefined) {
                setter(value);
            }
            return getter();
        };
        Object.defineProperty(state, 'value', {
            get: getter,
            set: setter,
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


        return state as IState<T>;
    }
}

export default UseStateMixin;
