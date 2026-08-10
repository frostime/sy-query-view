# DataView 高级特性

## 自定义视图组件

插件会在 `/data/public`​ 目录下自动创建一个 `query-view.custom.js`​ 的脚本。利用这个脚本，你可以创建自己的自定义组件。

```ts
/**
 * User customized view. If registered, you can use it inside DataView by `dv.xxx()` or `dv.addxxx()`
 */
interface ICustomView {
    /**
     * Use the custom view
     * @param dv - DataView instance, might be empty while validating process
     */
    use: (dv?: IDataView) => {
        render: (container: HTMLElement, ...args: any[]) => void | string | HTMLElement; //Create the user custom view.
        dispose?: () => void;  // Unmount hook for the user custom view.
    },
    alias?: string[]; // Alias name for the custom view
}

interface IUserCustom {
    [key: string]: ICustomView;
}
```

每个组件结构如下：

* ​`alias`​：可选，定义组件的别名
* ​`use`​：用来实现自定义组件的函数

  * **参数**：`dv`​，一个 `DataView`​ 的实例

    * 注意：`dv`​ 参数**可能传入一个 null**
    * 原因是插件在导入脚本的时候需要检查组件函数的结构是否正确，会传入一个 `null`​ 用于检查 `use`​ 的返回值
  * **返回**：

    * ​`render`​：必要返回值，该方法的第一个 `container`​ 参数为组件的容器元素，后面的参数则为组件调用的参数；你可以

      1. 在 render 中创建自己的元素并调用 `container.append`​ 将元素加入容器中
      2. 也可以返回自定义的元素（或者单纯的字符串），返回值会被默认加入到 container 中
    * ​`dispose`​：可选，如果你的组件有一些副作用需要清理，则必须返回这个参数，`dispose`​ 方法将在 DataView 被销毁的时候调用

以默认的 example 组件为例：

```js
const custom = {
    example: {
        use: () => {
            let state;
            return {
                render: (element, id) => {
                    console.log('init example custom view with id:', id);
                    state = id;
                    element.innerHTML = 'This is a example custom view ' + id;
                },
                dispose: () => {
                    console.log('dispose example custom view ' + state);
                }
            };
        },
        alias: ['Example', 'ExampleView']
    }
}

export default custom;
```

成功注册自定义组件之后，可以直接调用 `dv.example`​, `dv.addExampleView`​ 等。

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addexample(`ID = ${Query.utils.date()}`);
dv.render();
```

![image](../../assets/image-20241206200537-udf4v6b.png)

> 🔔 **注意**：`DataView`​ 会给所有的组件**自动添加他小写版本的别名**，所以两个名为 `Add`​ 和 `add`​ 的组件可能会一方覆盖另一方！

自定义的组件会在插件启动的时候自动导入，如果你在插件运行的过程当中更改了 js 文件，可以在设置面板或者顶栏菜单中点击「**重载自定义组件**」的按钮更新组件的状态。

## DataView.useState

> 🔔 **注意**：`useState`​ 为一个实验性的功能，目前的测试样例还不足以完全保证在多端同步的情况下不会出现任何问题。<u>不推荐</u>没有编程经验背景的新人（大量）使用！

嵌入块在每次打开文档、点击刷新按钮的时候，都会自动重绘（repaint），意味着每次 DataView 都会从头开始，是一个**无状态**的视图。

​`dv.useState`​ 方法为 DataView 提供了一些**持久化**的功能，该方法会返回一个 `State`​ 对象。他有两种使用的风格：类似 `signal`​ 的 `getter/setter`​ 风格和类似 `vue`​ 的 `.value`​ 风格。

```js
const state = dv.useState('keyname', 1); //key, default value
//获取当前状态
state();
state.value;
//更新状态
state(2)
state.value = 2;
```

每个 state 都会在嵌入块刷新的时候，会将当前的状态写入**缓存**并**最终**保存到**块的自定义属性**当中，从而实现状态的持久化。

以下是一个案例，你可以不断的点击按钮，左侧的数目会一直增长。

```js
//!js
let dv = Query.DataView(protyle, item, top);
const state = dv.useState('counter', 1);
const button = document.createElement('button');
button.textContent = '+1';
button.onclick = (e) => {
    state.value += 1; //更新状态, 等价于 state(state() + 1)
    dv.repaint(); // repaint 用于主动触发嵌入块的重绘
}
dv.addcols([button, dv.md(`State = ${state()}`)]); //等价于使用 state.value

dv.render();
```

现在：<u>关闭当前的文档，然后重新打开</u>，你会发现嵌入块的内容依然是这个数值。再打开嵌入块的属性面板，会发现名为 `counter`​ 的 state 已经保存到自定义属性中。

![image](../../assets/image-20241206201729-1bfn3md.png)

以下给出一个「每日一句」的案例：

* 通过网络 API 每天获取一个句子
* 通过 state 保存这个句子，并保证这一天一直显示这一句话

```js
//!js
let dv = Query.DataView(protyle, item, top);
const today = Query.Utils.today();
const state = dv.useState(today);
//如果 state 存在，就用之前的缓存
if (state()) {
  dv.addmd('今天的每日一句')
  dv.addmd(`> ${state()}`)
} else {
//注：受到网络环境的影响，你在本地测试的时候可能不一定能访问这个 API
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    //更新 state
    state.value = `${data.data.content} —— ${data.data.origin}`;
    dv.addmd('今天的每日一句')
    dv.addmd(`> ${state.value}`)
 }
});
}
dv.render();
```

由于我们使用了时间戳作为 state key，所以如果你多运行几天再打开属性面板，会发现每天的一句话都保存在这里。

![image](../../assets/image-20241206202124-3pu0qdw.png)

### state 的更新写入机制（技术细节，可跳过）

> 🔔 state 是一个实验性的功能，我也不知道是否会引发奇怪的问题。如果你在使用的过程中遇到了问题，可以参考这一小节。

DataView 的 state 采用了缓存 + 块属性存储的方式进行持久化。

1. **缓存**：当停留在文档页面中的时候，state 会写入到 Session Storage 的缓存中；每次调用 `state()`​ 更新状态或者触发嵌入块重绘，也只会更改 Session 缓存中的 state 数据
2. **文档级写入**：当一个文档被关闭的时候，文档内所有嵌入块用到的 state 会写入到块属性中，并从 Session Storage 缓存中删除对应文档中的缓存
3. **全部写入**：当插件被禁用或者桌面端的窗口被关闭（准确来说是监听了右上角 X 按钮的点击事件）的时候，所有缓存中的 State 会被写入块属性中，并清空全部 Session Storage 中缓存的 state

🤔 **为什么要这么做，而不是每次在代码中更新 state 的时候，直接保存到块属性中？**

* 次要的原因是：为了防止过于频繁的块更新操作（当然这个可以通过 debounce 来解决）。
* **首要原因**是：防止在多端同步的情况下出现**数据冲突**乃至地狱的“**循环冲突**”的情况

以下是一个案例来解释什么是“**循环冲突**”。

案例：考虑这种 DataView

```js
//!js
const dv = Query.DataView(protyle, item, top);
const cnt = dv.useState('counter', 1);
dv.addmd(`${cnt()} --> ${cnt() + 1}`);
cnt.value += 1;
dv.render();
```

假如有两个设备 A，B，同时打开了这个文档的嵌入块，**假如**实时更新块属性的话就会触发窒息般的“**循环冲突**”。

1. 设备 A 更新了状态后，数据同步到云端
2. 假设设备 B 开启了同步感知，则会自动更新数据；并且由于所在的文档状态发生变化，会触发文档级别的重绘——进而导致 B 中嵌入块的重绘
3. 但是一旦 B 的嵌入块重绘，就会自动更新 counter 状态，于是 B 中嵌入块的状态就和云端更新下来的数据产生冲突——具体表现为生成一个冲突文档
4. 由于 B 的状态发生了变化，所以同样会同步到云端
5. 此时如果 A 开启同步感知，也会触发文档重绘，同样会出现更新的嵌入块状态和云端数据状态发生冲突的情况
6. 以上过程如果不进行人为干预阻止，<u>可以无限重复下去，双方依次不断地生成一个又一个冲突文档</u>……

可以看到，引发冲突的最直接的问题是：思源在同步文档后会触发重绘，而重绘会引发块状态的自动更新。

🙁 所以为了避免这种循环冲突的发生，state 在文档内更新的时候只会写入缓存，不会更改块的状态；只有文档被关闭了、确认不会引发冲突性的重绘的时候，才会写入到块属性中。

## 理解 DataView 的生命周期（技术细节，可跳过）

1. **创建实例**：当打开文档，或者文档动态加载到嵌入块的时候，嵌入块的代码会自动运行；此时就会触发 DataView 的构造函数，并创建 dv 实例

    * **恢复组件状态**：首先尝试从 `SessionStorage`​ 中查找组件缓存的状态，如果不存在则解析嵌入块的块属性并从 Element 属性中恢复组件状态
    * **注册组件**：在 DataView 创建的过程中，会注册内置的组件和外部导入的组件，注册完毕之后，将可以通过 `dv.addxxx`​ 来构造视图组件
2. ​**​`dv.addxxx`​**​：在嵌入块代码中，逐行调用 `dv.addxxx()`​ 函数，依次调用各个组件

    * 对于副作用的组件，会在 `dv`​ 实例中注册 `dispose`​ 回调函数用于在销毁的时候清理副作用
3. **状态更新**：在嵌入块运行过程中，如果调用了 `dv.useState`​ 并更新了状态，将会把最新的状态缓存到 SessionStorage 当中
4. ​**​`dv.render`​**​：

    * 绑定当前嵌入块的元素，截断部分事件冒泡
    * 注册 render 函数中相关副作用的 `dispose`​ 回调函数
    * 监控当前嵌入块的状态
5. **重绘嵌入块**：

    * **触发条件**：当嵌入块代码更新、用户点击刷新的时候，思源将销毁 DataView 所在的嵌入块内容
    * **Dispose**：检测到嵌入块被销毁，当前 DataView 已经失效，调用所有 `dispose`​ 回调函数清理 DataView 的副作用
    * **接下来回到状态 1**，重新创建新的实例
6. **生命周期结束**

    * **触发条件**：嵌入块所在的文档被关闭、思源桌面端窗口被关闭、window 被重载或者插件被禁用
    * **Finalize**：1）调用 DataView 的 dispose 操作；2）读取 SessionStorage 内相关的 DataView 的状态写入到嵌入块属性中；3）清理 SessionStorage 缓存

## ⚠️ 一些建议

1. **不建议**在 DataView 里写**大量的交互**！

    * 尽管在提供的 API 等方面并没有禁止用户编写交互性的视图组件（例如输入框，按钮等）；但请注意：DataView 被设计为一个 **「理论上只读」** 的元素、一个嵌入在文档中的 DashBoard
    * **核心矛盾**在于：思源编辑器本身就会监听各种用户输入事件，而 DataView 中用户输入事件如果错误地传递到思源的监听器中，可能造成风险
    * DataView 内部会阻止一些常见事件的冒泡，但是也不能排除一些特殊的意外情况

      ```js
      const EVENTS_TO_STOP = [
          'compositionstart', 'compositionend',
          'mousedown', 'mouseup', 'keydown', 'keyup', 'input',
          'copy', 'cut', 'paste'
      ];
      ```
    * 如果你在编写自定义的 dv 的过程中，发现了和用户输入相关的异常情况，你最好停下来，不要再继续尝试，以免对重要数据造成不良影响
2. <u>多端设备同步情况下</u>，使用 useState 要小心，建议开启「**设置-云端-生成冲突文件**」![image](../../assets/image-20241210133627-mnp2zup.png)

    ![image](../../assets/image-20241211194757-74vrp7m.png)

    目前 state 功能虽然规避了「循环冲突」的问题，但是在一些特殊的多端同步情况下**仍然可能出现数据冲突的情况**。

    为了避免出现数据状态丢失，建议在思源的同步设置中开启「生成冲突文档」的设置，这样则遇到问题的时候还可以手动处理。
