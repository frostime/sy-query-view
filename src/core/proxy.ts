import { renderAttr } from "./components";

/** Wrapped Block interface with extended convenient properties and methods */
export interface IWrappedBlock extends Block {
    /** Method to return the original Block object */
    unwrap(): Block;

    /** Original Block object */
    unwrapped: Block;

    /** Block's URI link in format: siyuan://blocks/xxx */
    asuri: string;
    /** Block's URI link in format: siyuan://blocks/xxx */
    touri: string;

    /** Block's Markdown format link */
    aslink: string;
    /** Block's Markdown format link */
    tolink: string;

    /** Block's SiYuan reference format text */
    asref: string;
    /** Block's SiYuan reference format text */
    toref: string;

    /**
     * Returns a rendered SiYuan attribute
     * @param attr - Attribute name
     * @param renderer - Custom render function, uses default rendering when returns null
     */
    attr(attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string | null): string;

    /** Update date in YYYY-MM-DD format */
    updatedDate: string;
    /** Creation date in YYYY-MM-DD format */
    createdDate: string;
    /** Update time in HH:mm:ss format */
    updatedTime: string;
    /** Creation time in HH:mm:ss format */
    createdTime: string;
    /** Update datetime in YYYY-MM-DD HH:mm:ss format */
    updatedDatetime: string;
    /** Creation datetime in YYYY-MM-DD HH:mm:ss format */
    createdDatetime: string;

    /** Get custom attribute value */
    [key: `custom-${string}`]: string;
}

/** Wrapped array interface with extended convenient methods */
export interface IWrappedList<T> extends Array<T> {
    /** Method to return the original array */
    unwrap(): T[];

    /** Original array */
    unwrapped: T[];

    /**
     * Returns a new array containing only specified properties
     * @param attrs - Property names to keep
     */
    pick(...attrs: (keyof T)[]): IWrappedList<Partial<T>>;

    /**
     * Returns a new array excluding specified properties
     * @param attrs - Property names to exclude
     */
    omit(...attrs: (keyof T)[]): IWrappedList<T>;

    /**
     * Returns a new array sorted by specified property
     * @param attr - Property to sort by
     * @param order - Sort direction, defaults to 'asc'
     */
    sorton(attr: keyof T, order?: 'asc' | 'desc'): IWrappedList<T>;

    /**
     * Returns an object grouped by specified condition
     * @param predicate - Grouping criteria, can be property name or function
     * @param fnEach - Optional callback function for each group
     */
    groupby(
        predicate: keyof T | ((item: T) => any),
        fnEach?: (groupName: any, list: T[]) => unknown
    ): Record<string, IWrappedList<T>>;

    /**
     * Returns a filtered new array, ensuring it's also an IWrappedList
     * @param predicate - Filter condition function
     */
    filter(predicate: (value: T, index: number, array: T[]) => boolean): IWrappedList<T>;
}


/**
 * @internal
 * Add some helper properties to the Block for direct use
 * @param block 
 * @returns 
 */
export const wrapBlock = (block: Block): IWrappedBlock => {
    // If it's already a Proxy, return directly
    if (block?.['unwrapped']) {
        return block as IWrappedBlock;
    }

    let proxy = new Proxy(block, {
        get(target: Block, prop: keyof Block | string) {
            if (prop in target) {
                return target[prop];
            }
            // Add some convenient properties and methods
            switch (prop) {
                case 'unwrap':
                    /** @returns {Block} 返回原始 Block 对象 */
                    return () => target;
                case 'unwrapped':
                    /** @type {Block} 返回原始 Block 对象 */
                    return target;

                case 'asuri':
                case 'touri':
                    /** @returns {string} 块的 URI 链接，格式: siyuan://blocks/xxx */
                    return `siyuan://blocks/${block.id}`

                case 'aslink':
                case 'tolink':
                    /** @returns {string} 块的 Markdown 格式链接 */
                    return `[${block.fcontent || block.content}](siyuan://blocks/${block.id})`

                case 'asref':
                case 'toref':
                    /** @returns {string} 块的思源引用格式文本 */
                    return `((${block.id} '${block.fcontent || block.content}'))`

                case 'attr':
                    /**
                     * 以渲染后的形式返回思源的某个属性；
                     * 例如 `attr(box)` 会返回笔记本的名称而非 id; `attr(root_id)` 会返回文档的块链接等
                     * 可以传入一个 renderer 函数来自定义渲染方式，当返回为 null 时，会使用默认渲染方式
                     * @param {keyof Block} attr - 属性名
                     * @param {Function} [renderer] - 自定义渲染函数，返回 null 时使用默认渲染
                     * @returns {string} 渲染后的属性值
                     * @example
                     *  block.attr('box') // 返回笔记本名称
                     *  block.attr('root_id') // 返回文档的块链接
                     */
                    return (attr: keyof Block, renderer?: (block: Block, attr: keyof Block) => string | null) => {
                        let ans: string;
                        if (renderer) {
                            ans = renderer(block, attr);
                        }
                        return ans ?? renderAttr(block, attr);
                    }

                case 'updatedDate':
                    /** @returns {string} YYYY-MM-DD 格式的更新日期 */
                    return renderAttr(block, 'updated', { onlyDate: true });
                case 'createdDate':
                    /** @returns {string} YYYY-MM-DD 格式的创建日期 */
                    return renderAttr(block, 'created', { onlyDate: true });
                case 'updatedTime':
                    /** @returns {string} HH:mm:ss 格式的更新时间 */
                    return renderAttr(block, 'updated', { onlyTime: true });
                case 'createdTime':
                    /** @returns {string} HH:mm:ss 格式的创建时间 */
                    return renderAttr(block, 'created', { onlyTime: true });
                case 'updatedDatetime':
                    /** @returns {string} YYYY-MM-DD HH:mm:ss 格式的更新时间 */
                    return renderAttr(block, 'updated');
                case 'createdDatetime':
                    /** @returns {string} YYYY-MM-DD HH:mm:ss 格式的创建时间 */
                    return renderAttr(block, 'created');
            }
            /**
             * 直接获取块的自定义属性
             */
            if (prop.startsWith('custom-')) {
                let ial = block.ial;
                // ial 格式 `{: id="20231218144345-izn0eer" custom-a="aa" }`
                let pattern = new RegExp(`${prop}=\"(.*?)\"`);
                let match = ial.match(pattern);
                if (match) {
                    return match[1];
                } else {
                    return "";
                }
            }
            return null;
        }
    });
    return proxy as IWrappedBlock;
}


/**
 * @internal
 * Add a Proxy layer to the list of SQL query results to attach some convenient methods
 * @param list 
 * @returns 
 */
export const wrapList = (list: Block[], useWrapBlock: boolean = true): IWrappedList<IWrappedBlock> => {
    if (list?.['unwrapped']) {
        return list as IWrappedList<IWrappedBlock>;
    }

    // let wrappedBlocks = list.map(block => wrapBlock(block as Block));
    list = useWrapBlock ? list.map(block => wrapBlock(block as Block)) : list;

    let proxy = new Proxy(list, {
        get(target: Block[], prop: any) {
            if (prop in target) {
                return Reflect.get(target, prop);
            }
            switch (prop) {
                case 'unwrap':
                    /** @returns {Block[]} 返回原始数组 */
                    return () => target;
                case 'unwrapped':
                    /** @type {Block[]} 原始数组 */
                    return target;
                case 'pick':
                    /**
                     * 返回只包含指定属性的新数组
                     * @param {...(keyof Block)} attrs - 需要保留的属性名
                     * @returns {ProxyList} 新的代理数组
                     * @example list.pick('id', 'content')
                     */
                    return (...attrs: (keyof Block)[]) => {
                        if (attrs.length === 1) {
                            //适配 attrs 为单个数组的情况（虽然这是错误的用法）
                            if (Array.isArray(attrs[0])) {
                                attrs = attrs[0];
                                //@ts-ignore
                                return proxy.pick(...attrs);
                            }
                            let picked = target.map(b => b[attrs[0]]);
                            //@ts-ignore
                            return wrapList(picked, false);
                        } else {
                            let picked = target.map(block => {
                                let obj: any = {};
                                attrs.forEach(attr => {
                                    obj[attr] = block[attr] ?? null;
                                });
                                return obj;
                            });
                            return wrapList(picked);
                        }
                    }
                case 'omit':
                    /**
                     * 返回排除指定属性的新数组
                     * @param {...(keyof Block)} attrs - 需要排除的属性名
                     * @returns {ProxyList} 新的代理数组
                     * @example list.omit('id', 'content')
                     */
                    return (...attrs: (keyof Block)[]) => {
                        const ommited = target.filter(block => !attrs.some(attr => attr in block));
                        return wrapList(ommited);
                    }
                case 'sorton':
                    /**
                     * 返回按指定属性排序的新数组
                     * @param {keyof Block} attr - 排序依据的属性
                     * @param {'asc'|'desc'} [order='asc'] - 排序方向
                     * @returns {ProxyList} 排序后的新代理数组
                     * @example list.sorton('updated', 'desc')
                     */
                    return (attr: keyof Block, order: 'asc' | 'desc' = 'asc') => {
                        let sorted = target.sort((a, b) => {
                            if (a[attr] > b[attr]) {
                                return order === 'asc' ? 1 : -1;
                            } else if (a[attr] < b[attr]) {
                                return order === 'asc' ? -1 : 1;
                            } else {
                                return 0;
                            }
                        });
                        // return sorted;
                        return wrapList(sorted);
                    }
                case 'groupby':
                    /**
                     * 返回按指定条件分组的对象
                     * @param {(keyof Block)|Function} predicate - 分组依据，可以是属性名或函数
                     * @param {Function} [fnEach] - 可选的分组回调函数
                     * @returns {Object.<string, ProxyList>} 分组结果对象
                     * @example
                     * list.groupby('box')
                     * list.groupby(block => block.created.slice(0, 4))
                     */
                    return (predicate: (keyof Block) | ((b: Partial<Block>) => any), fnEach?: (groupName: any, list: Block[]) => unknown) => {
                        const maps: Record<string, Block[]> = {};
                        const getKey = (b: Partial<Block>) => {
                            if (typeof predicate === 'function') {
                                return predicate(b);
                            } else {
                                return b[predicate];
                            }
                        };
                        target.forEach(block => {
                            const key = getKey(block);
                            if (!(key in maps)) {
                                maps[key] = wrapList([]);
                            }
                            maps[key].push(block);
                        });
                        if (fnEach) {
                            Object.entries(maps).forEach(([key, list]) => {
                                fnEach(key, list);
                            });
                        }
                        return maps;
                    }
                case 'filter':
                    /**
                     * 返回过滤后的新数组
                     */
                    return (predicate: (value: Block, index: number, array: Block[]) => boolean) => {
                        return wrapList(target.filter(predicate));
                    }
            };
            return null;
        }
    });
    return proxy as IWrappedList<IWrappedBlock>;
}
