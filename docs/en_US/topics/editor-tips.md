# External Editor & Tips

## Editing Code in an External Editor

SiYuan's built-in embedded block' editing dialog is not user-friendly. Therefore, the plugin provides the function of opening js code in an external editor.

  **⚠️ Note! This feature is only available on the desktop.**

Users need to configure the command for opening the external editor in the plugin settings:

![image](../../assets/image-20241202164246-vla7mo8.png)

The default is `code -w {{filepath}}`​, which means using VsCode (please add `code`​ to the environment variables) to open. The `{{filepath}}`​ will be replaced with the actual temporary code file path at runtime.

When using it, you need to click the "Edit Code" button in the block's plugin menu.

![image](../../assets/image-20241202164442-588f7d7.png)

The plugin will automatically create a temporary code file locally and then open the code file using the above command. The plugin will **track the editing updates** of the code file and update the latest content in the file to the embedded block, refreshing the rendered content of the embedded block.

![image](../../assets/image-20241206211503-q3b2uk5.png)

Common code editor command-line references:

* vscode

  [https://code.visualstudio.com/docs/editor/command-line](https://code.visualstudio.com/docs/editor/command-line)
* sublime

  [https://www.sublimetext.com/docs/command_line.html](https://www.sublimetext.com/docs/command_line.html)

## My code in the embed block is not responding, what should I do?

1. Check if `//!js`​ is added. SiYuan only executes code as a JS program when it reads code prefixed with this.
2. See if any error logging in console

    Note that, since the code in the embed block is executed within a `Function`​ object, errors during execution may not appear in the console.
3. Debug your JavaScript code and carefully check if there are any mistakes.（See next part）

If possible, it is more recommended to edit your code in an external editor, where syntax highlighting can help avoid many low-level mistakes.

## How to Debug DataView Code?

You can add `debugger`​ in the code and open the developer mode. When it runs to this line, it will automatically enter breakpoint here, and then you can debug the program.

![image](../../assets/image-20241207204410-a231unc.png)

## Using SiYuan Templates

You can put the debugged embedded block code into the `template/`​ template file, so that for commonly used query templates, you can quickly call them:

![image](../../assets/image-20241209002057-jarcxsu.png)

Using templates also has the advantage that you can use some variables provided by the template. For example, in the following template, the `$datestr_sy`​ variable is used to query documents created today.

```markdown
.action{$datestr := now | date "2006-01-02"}
.action{$datestr_sy := now | date "20060102"}

{{//!js_esc_newline_const today = '.action{$datestr_sy}';_esc_newline_const query = async () => {_esc_newline_  let dv = Query.Dataview(protyle, item, top);_esc_newline_  let blocks = await Query.sql(`_esc_newline_    select * from blocks where type='d' and created like '${today}%'_esc_newline_  `);_esc_newline_  dv.addList(blocks, { type: 'o', columns: 2 });_esc_newline_  dv.render();_esc_newline_}_esc_newline_return query();}}
```

Similarly, although this function can also be achieved using `Query.Utils.today()`​, since the embedded block refreshes every day, if you want to fix the display of documents created on a certain day, you either manually fill in the `today`​ variable or use the `state`​ function to directly save the date information the first time.

However, the embedded block code in the template markdown file must be written in single-line mode, and each newline character needs to be replaced with `_esc_newline_`​, which is very inconvenient to convert.

The plugin provides a button in the block menu to directly perform the above conversion. You can directly copy the code in the pop-up window and paste it into the template file for use.

![image](../../assets/image-20241209001549-kcurxon.png)

![image](../../assets/image-20241209001506-1j38x18.png)
