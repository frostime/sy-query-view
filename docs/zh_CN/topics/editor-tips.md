# 外部编辑器与调试

## 在外部编辑器中编辑代码

思源内置的嵌入块悬浮窗在编辑略微复杂的代码的时候体验非常差劲。因此插件提供了在外部编辑器中打开 js 代码的功能。

 **⚠️ 注意！本功能仅在桌面端可用。**

用户需要在插件设置中配置外部编辑器打开的命令参数：

![image](../../assets/image-20241202164246-vla7mo8.png)

默认为 `code -w {{filepath}}`​，代表会使用 VsCode （请将 `code`​ 添加到环境变量中）来打开。其中 `{{filepath}}`​ 会在运行时被替换为实际的临时代码文件的路径。

使用的时候，需要在块的插件菜单中点击“Edit Code”按钮。

![image](../../assets/image-20241202164442-588f7d7.png)

插件会自动在本地创建一个临时的代码文件，然后在使用上述命令打开代码文件。插件会**跟踪代码文件的编辑更新**并将文件中最新的内容更新到嵌入块中，并刷新渲染嵌入块的内容。

![image](../../assets/image-20241206211503-q3b2uk5.png)

常见代码编辑器的命令行参考：

* vscode

  [https://code.visualstudio.com/docs/editor/command-line](https://code.visualstudio.com/docs/editor/command-line)
* sublime

  [https://www.sublimetext.com/docs/command_line.html](https://www.sublimetext.com/docs/command_line.html)

## 我在嵌入块中的代码没有什么反应，我该怎么办？

1. 检查有没有加 `//!js`​，思源只有在读入以这个为前缀的代码，才会当作 JS 程序来执行。
2. 查看控制台报错

    不过由于嵌入块的代码是在一个 `Function`​ 对象中执行，所以当执行出现错误的时候不一定会在控制台有报错。
3. Debug 你的 Js 代码，然后详细查看是不是哪里写错了。（见下一小节）

如果有条件，更加推荐在外部编辑器中编辑你的代码，有语法高亮等提示后可以规避很多低级错误（例如不慎输入了中文符号等）。

## 如何 Debug DataView 的代码？

你可以在在代码中添加 `debugger`​，然后打开开发者模式。当运行到这一行的时候，就会自动进入断点模式，然后就可以调试程序了。

![image](../../assets/image-20241207204410-a231unc.png)

## 配合思源模板使用

你可以将调试好的嵌入块代码放入 `template/`​ 下的模板文件中，这样对于常用的查询模板都可以快速调用：

![image](../../assets/image-20241209002057-jarcxsu.png)

使用模板还有一个好处是，可以使用一些模板提供的变量，例如下面这个模板中，使用了 `$datestr_sy`​ 变量，用来查询今天创建的文档。

```markdown
.action{$datestr := now | date "2006-01-02"}
.action{$datestr_sy := now | date "20060102"}

{{//!js_esc_newline_const today = '.action{$datestr_sy}';_esc_newline_const query = async () => {_esc_newline_  let dv = Query.Dataview(protyle, item, top);_esc_newline_  let blocks = await Query.sql(`_esc_newline_    select * from blocks where type='d' and created like '${today}%'_esc_newline_  `);_esc_newline_  dv.addList(blocks, { type: 'o', columns: 2 });_esc_newline_  dv.render();_esc_newline_}_esc_newline_return query();}}
```

同样的功能虽然也能用 `Query.Utils.today()`​ 来实现，但是由于嵌入块每天都会刷新，如果想要固定显示某一天创建的文档，要么手动填写 `today`​ 变量，要么使用 `state`​ 功能在第一次的时候直接保存日期信息。

不过模板 markdown 文件中的嵌入块代码必须以单行模式编写，每个换行符都需要替换为 `_esc_newline_`​，非常不方便转换。

插件在块菜单中提供了一个按钮，可以直接进行上述转换。你可以直接复制弹出窗口中的代码，粘贴到 template 文件中使用。

![image](../../assets/image-20241209001549-kcurxon.png)

![image](../../assets/image-20241209001506-1j38x18.png)
