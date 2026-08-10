# DataView Advanced Features

## Custom View Components

The plugin automatically creates a `query-view.custom.js`​ script in the `/data/public`​ directory. Using this script, you can create your own custom components. Following this:

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
        render: (container: HTMLElement, ...args: any[]) => void | string | HTMLElement; // Create the user custom view.
        dispose?: () => void;  // Unmount hook for the user custom view.
    },
    alias?: string[]; // Alias name for the custom view
}

interface IUserCustom {
    [key: string]: ICustomView;
}
```

Each component structure is as follows:

* ​`alias`​: Optional, defines the component's alias.
* ​`use`​: Used to implement the custom component function.

  * **Parameter**: `dv`​, a `DataView`​ instance.

    * Note: The `dv`​ parameter **may pass a null**.
    * The reason is that the plugin needs to check whether the component function structure is correct when importing the script, passing a `null`​ to check the return value of `use`​.
  * **Return**:

    * ​`render`​: Required. The first `container`​ parameter is the component's container element, and the following parameters are the component's call parameters. You can:

      1. Create your own elements in render and call `container.append`​ to add elements to the container.
      2. Return custom elements (or just strings), and the return value will be added to the container by default.
    * ​`dispose`​: Optional. If your component has some side effects that need to be cleaned up, you must return this parameter. The `dispose`​ method will be called when DataView is destroyed.

Taking the default example component as an example:

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

After successfully registering the custom component, you can directly call `dv.example`​, `dv.addExampleView`​, etc.

```js
//!js
let dv = Query.DataView(protyle, item, top);
dv.addexample(`ID = ${Query.utils.date()}`);
dv.render();
```

![image](../../assets/image-20241206200537-udf4v6b.png)

> 🔔 **Note**: `DataView`​ automatically adds **the lowercase version of the component name as an alias**, so two components named `Add`​ and `add`​ may overwrite each other!

Custom components are automatically imported when the plugin starts. If you change the js file during the plugin's runtime, you can click the "**Reload Custom**" button in the settings panel or the top-bar menu to update the component status.

## DataView.useState

> 🔔 **Note**: `useState`​ is an experimental feature, and the current test cases are not sufficient to guarantee that no issues will occur in multi-device synchronization.
>
> <u>Not recommended</u> for newcomers without programming experience (to use extensively)!

Embedded blocks are automatically repainted (re-exeucute) every time the document is opened or the embedded block is dynamically loaded, meaning that each DataView is **stateless**.

The `dv.useState`​ method provides some **persistence** functionality for DataView, returning a `State`​ object. It has two usage styles: `getter/setter`​ style similar to `signal`​ and `.value`​ style similar to `vue`​.

```js
const state = dv.useState('keyname', 1); // key, default value
// Get the current state
state();
state.value;
// Update the state
state(2)
state.value = 2;
```

Each state will write the current state to the **cache** and **eventually** save it to the **block's custom attributes** during the embedded block refresh, achieving state persistence.

The following is an example. You can keep clicking the button, and the number on the left will keep increasing.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const state = dv.useState('counter', 1);
const button = document.createElement('button');
button.textContent = '+1';
button.onclick = (e) => {
    state.value += 1; // Update the state, equivalent to state(state() + 1)
    dv.repaint(); // repaint is used to actively trigger the repaint of the embedded block
}
dv.addcols([button, dv.md(`State = ${state()}`)]); // Equivalent to using state.value

dv.render();
```

Now: <u>Close the current document and reopen it</u>, and you will find that the content of the embedded block is still this number. Open the block's attribute panel, and you will find that the state named `counter`​ has been saved to the custom attributes.

![image](../../assets/image-20241206201729-1bfn3md.png)

The following gives a "Daily Quote" example:

* Get a sentence from the network API every day.
* Save this sentence via state and ensure it is displayed for the day.

```js
//!js
let dv = Query.DataView(protyle, item, top);
const today = Query.Utils.today();
const state = dv.useState(today);
// If the state exists, use the previous cache
if (state()) {
  dv.addmd('今天的每日一句')
  dv.addmd(`> ${state()}`)
} else {
// Note: According to your network environment, you may not be able to access this API when you try to test locally
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    // Update the state
    state.value = `${data.data.content} —— ${data.data.origin}`;
    dv.addmd('今天的每日一句') // Today\'s daily quote
    dv.addmd(`> ${state.value}`)
 }
});
}
dv.render();
```

Since we used the timestamp as the state key, if you run it for several days and then open the attribute panel, you will find that the quotes for each day are saved here.

![image](../../assets/image-20241206202124-3pu0qdw.png)

### State Update Write Mechanism (Technical Details, Skippable)

> 🔔 State is an experimental feature, and I don't know if it will cause strange problems. If you encounter issues during use, you can refer to this section.

DataView's state uses a cache + block attribute storage method for persistence.

1. **Cache**: When staying on the document page, the state will be written to the Session Storage. Everytime  `state()`​ is called to update the state or the embedded block is repainted, only the state data in the Session cache will be changed.
2. **Document-level Write**: When a document is closed, all states used by the embedded blocks in the document will be written to the block attributes and deleted from the Session Storage.
3. **Full Write**: When the plugin is disabled or the desktop window is closed (specifically, the click event of the top-right "X" button is monitored), all states in the cache will be written to the block attributes and cleared from the entire Session Storage.

🤔 **Why not save to the block attributes directly every time the state is updated in the code?**

* A secondary reason is to prevent overly frequent block update operations (although this can be solved with debounce).
* **The primary reason** is to prevent **data conflicts** and even the hellish "**loop conflicts**" in multi-device synchronization.

The following is an example to explain what "**loop conflicts**" are.

Example: Consider this DataView:

```js
//!js
const dv = Query.DataView(protyle, item, top);
const cnt = dv.useState('counter', 1);
dv.addmd(`${cnt()} --> ${cnt() + 1}`);
cnt.value += 1;
dv.render();
```

Suppose there are two devices, A and B, both opening this document's embedded block. **If** real-time updates to the block attributes are triggered, it will cause a suffocating "**loop conflict**."

1. Device A updates the state and synchronizes the data to the cloud.
2. Suppose device B has synchronization awareness, it will automatically update the data; and since the document state has changed, it will trigger document-level repainting—leading to B's embedded block repainting.
3. But once B's embedded block repaints, it will automatically update the counter state, causing B's embedded block state to conflict with the cloud data state—specifically, generating a conflict document.
4. Since B's state has changed, it will also synchronize to the cloud.
5. At this time, if A has synchronization awareness, it will also trigger document repainting, similarly causing the updated embedded block state to conflict with the cloud data state.
6. If this process is not manually intervened to stop, <u>it can repeat indefinitely, with both sides alternately generating one conflict document after another</u>...

It can be seen that the most direct problem causing the conflict is: SiYuan will trigger repainting after synchronizing the document, and repainting will cause the block state to be automatically updated.

🙁 Therefore, to avoid this loop conflict, the state will only be written to the cache when updating within the document and will not change the block state; only when the document is closed and it is confirmed that no conflict repainting will occur, will it be written to the block attributes.

## Understanding DataView's Lifecycle (Technical Details, Skippable)

1. **Create Instance**: When opening a document or dynamically loading the embedded block, the embedded block's code will automatically run; at this time, the DataView constructor will be triggered, and the dv instance will be created.

    * **Restore Component State**: First, try to find the component cache state in `SessionStorage`​. If it does not exist, parse the block attributes and restore the component state from the Element attributes.
    * **Register Components**: During the creation of DataView, built-in components and externally imported components will be registered. After registration, you can construct view components via `dv.addxxx`​.
2. ​**​`dv.addxxx`​**​: In the embedded block code, call the `dv.addxxx()`​ function line by line to call each component.

    * For components with side effects, register the `dispose`​ callback function in the `dv`​ instance to clean up side effects when destroyed.
3. **State Update**: During the embedded block's runtime, if `dv.useState`​ is called and the state is updated, the latest state will be cached in `SessionStorage`​.
4. ​**​`dv.render`​**​:

    * Bind the current embedded block element, intercept part of the event bubbling.
    * Register the `dispose`​ callback function related to side effects in the render function.
    * Monitor the state of the current embedded block.
5. **Repaint Embedded Block**:

    * **Trigger Conditions**: When the embedded block code is updated or the user clicks refresh, SiYuan will destroy the content of the DataView's embedded block.
    * **Dispose**: Detect that the embedded block is destroyed, the current DataView is invalid, and call all `dispose`​ callback functions to clean up DataView's side effects.
    * **Next, return to state 1**, recreate the new instance.
6. **End of Lifecycle**:

    * **Trigger Conditions**: The embedded block's document is closed, the SiYuan desktop window is closed, the window is reloaded, or the plugin is disabled.
    * **Finalize**: 1) Call DataView's dispose operation; 2) Read the relevant DataView state in `SessionStorage`​ and write it to the block attributes; 3) Clear the `SessionStorage`​ cache.

## ⚠️ Some Suggestions

1. **Not recommended** to write **a lot of interaction** in DataView!

    * Although there are no restrictions in the provided APIs to prevent users from writing interactive view components (such as input boxes, buttons, etc.); please note: DataView is designed as a  **&quot;theoretically read-only&quot;**  element, a DashBoard embedded in the document.
    * **Core contradiction** lies in: SiYuan's editor itself monitors various user input events, and if user input events in DataView are incorrectly passed to SiYuan's monitors, risks may occur.
    * DataView internally prevents some common event bubbling, but it cannot rule out some special unexpected situations.

      ```js
      const EVENTS_TO_STOP = [
          'compositionstart', 'compositionend',
          'mousedown', 'mouseup', 'keydown', 'keyup', 'input',
          'copy', 'cut', 'paste'
      ];
      ```
    * If you encounter abnormal situations related to user input during the process of writing custom dv, you should stop and not continue to try, to avoid adverse effects on important data.
2. <u>In multi-device synchronization</u>, use `useState`​ with caution. It is highly recommended to enable "**Settings-Cloud-Generate Conflict Documents**" ![image](../../assets/image-20241210133627-mnp2zup.png)

    ![image](../../assets/image-20241211194757-74vrp7m.png)

    Although the state function avoids the "loop conflict" problem, **data conflicts may still occur** in some special multi-device synchronization situations.

    To avoid data state loss, it is recommended to enable the "Generate Conflict Documents" setting in SiYuan's synchronization settings. In case of problems, manual processing is still possible.
