/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-03 19:49:52
 * @FilePath     : /src/core/use-state.ts
 * @LastEditTime : 2024-12-04 20:07:25
 * @Description  : 
 */
import { setBlockAttrs } from "@/api";

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
    private customStateKey = (key: string) => `custom-dv-state-${key}`;

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
            ).filter(attr => attr.name.startsWith(this.customStateKey('')));
            customStateAttrs.forEach(attr => {
                this.stateMap.set(attr.name.replace(this.customStateKey(''), ''), JSON.parse(attr.value));
            });
        }
    }

    /**
     * @internal
     * 将 state 同步到块属性中
     */
    storeState() {
        if (this.stateMap.size === 0) {
            return;
        }
        const stateObj: Record<string, string> = {};
        const storageObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            stateObj[this.customStateKey(key)] = JSON.stringify(value);
            storageObj[key] = value;
        });
        // 同步到 sessionStorage 做临时缓存
        sessionStorage.setItem(this.sessionStorageKey(), JSON.stringify(storageObj));
        // 同步到块属性中, 做持久化保存
        setBlockAttrs(this.blockId, stateObj);
        //TODO 后面考虑在关闭 protyle 的时候清理 sessionStorage 中的数据
    }

    useState<T>(key: string, initialValue?: T): IState<T> {
        let isNew = false;
        if (!this.stateMap.has(key)) {
            isNew = true;
            this.setState(key, initialValue);
        }

        const state = (value?: any) => {
            if (value !== undefined) {
                this.setState(key, value);
                if (isNew) {
                    this.storeState();
                    /**
                     * 如果是新创建的 state, 则第一次设置的时候就同步缓存中
                     * 主要是考虑到有些 state 是 await 中获取到的
                     * 如果不这么做, 可能会在第一次重绘完成之后，来不及获得缓存中的数据，而不得不重新 await 获取新的状态
                     * @example
                     * const state = useState('test');
                     * if (state) {
                     *     console.log(state())
                     * } else {
                     *     const data = await fetchData();
                     *     state(data);
                     * }
                     */
                    isNew = false;
                }
            }
            return this.getState(key);
        };
        Object.defineProperty(state, 'value', {
            get: state,
            set: (value: any) => state(value),
        });
        /**
         * 清理持久化的存储 (sessionStorage 和 block 属性)
         */
        Object.defineProperty(state, 'purge', {
            value: () => {
                sessionStorage.removeItem(this.sessionStorageKey());
                setBlockAttrs(this.blockId, {
                    [this.customStateKey(key)]: null,
                });
            },
        });

        return state as IState<T>;
    }
}

export default UseStateMixin;
