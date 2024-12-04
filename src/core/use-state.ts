/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-03 19:49:52
 * @FilePath     : /src/core/use-state.ts
 * @LastEditTime : 2024-12-04 10:21:39
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
    }


    /** @internal */
    private getState(key: string) {
        return this.stateMap.get(key);
    }

    /** @internal */
    private setState(key: string, value: any) {
        this.stateMap.set(key, value);
    }

    /** @internal */
    protected restoreState() {
        // 查找当前 element 所有以 custom-state- 开头的属性，并将其作为 state 的 key
        const customStateAttrs = Array.from(this.node.deref().attributes).filter(attr => attr.name.startsWith('custom-state-'));
        customStateAttrs.forEach(attr => {
            this.stateMap.set(attr.name.replace('custom-state-', ''), JSON.parse(attr.value));
        });
    }

    /**
     * @internal
     * 将 state 同步到块属性中
     */
    protected storeState() {
        if (this.stateMap.size === 0) {
            return;
        }
        const stateObj: Record<string, string> = {};
        this.stateMap.forEach((value, key) => {
            stateObj[`custom-state-${key}`] = JSON.stringify(value);
        });
        const ele = this.node.deref();
        if (ele) {
            Object.entries(stateObj).forEach(([key, value]) => {
                ele.setAttribute(key, value);
            });
        }
        setBlockAttrs(this.blockId, stateObj);
    }

    useState<T>(key: string, initialValue?: T): IState<T> {
        if (!this.stateMap.has(key)) {
            this.setState(key, initialValue);
        }

        const state = (value?: any) => {
            if (value !== undefined) {
                this.setState(key, value);
            }
            return this.getState(key);
        };
        Object.defineProperty(state, 'value', {
            get: state,
            set: (value: any) => state(value),
        });

        return state as IState<T>;
    }
}

export default UseStateMixin;
