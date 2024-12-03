// import { getBlockByID } from "@/api";
import { showMessage } from "siyuan";

import { updateBlock } from "@/api";
import { debounce } from "@/utils";

import { setting } from "@/setting";

import { i18n } from "@/index";
import { inputDialog, simpleDialog } from "@/libs/dialog";

const child_process = require("child_process");

declare global {
    interface Window {
        monaco: any;
    }
}

const editJsCode = async (blockId: BlockId, code: string) => {
    // const block = await getBlockByID(blockId);

    // let code = element.dataset.content;
    code = window.Lute.UnEscapeHTMLStr(code);

    // const elementRef = new WeakRef<HTMLDivElement>(element);

    /**
     * 更新内核的块数据
     * @param code 
     */
    const updateBlockData = async (code: string) => {
        const embedBlock = '{{' + code.replaceAll('\n', '_esc_newline_') + '}}';
        updateBlock('markdown', embedBlock, blockId);
    }
    const updateBlockDataDebounced = debounce(updateBlockData, 1500);

    //桌面环境, 可以访问 node 环境
    if (child_process) {
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const ext = code.startsWith('//!js') ? 'js' : 'sql';
        const filePath = path.join(os.tmpdir(), `siyuan-${blockId}-${Date.now()}.${ext}`);

        // 写入文件
        fs.writeFileSync(filePath, code);
        let editor: any;
        let watcher: any;
        const cleanUp = () => {
            watcher?.close();
            try {
                fs.unlinkSync(filePath); // 删除临时文件
            } catch (e) {
                console.error('清理临时文件失败:', e);
            }
        }

        const codeEditor = setting.codeEditor;
        //codeEditor 为一个命令行, 其中 {{filepath}} 会被替换为真实的文件路径
        const input = codeEditor.replace('{{filepath}}', filePath);
        const commandArr = input.split(' ').map(item => item.trim()).filter(item => item !== '');

        // 添加调试信息
        console.debug('About to execute command:', {
            command: input,
            commandArr,
            codeEditor: setting.codeEditor
        });
        let command = commandArr[0];

        try {
            editor = child_process.spawn(command, commandArr.slice(1), {
                shell: true
            });
        } catch (e) {
            console.error('启动代码编辑器失败:', e);
            showMessage(i18n.src_core_editorts.unusableexteditorcmd.replace('{0}', input), 5000, 'error');
            cleanUp();
            return;
        }

        editor.on('error', (err: any) => {
            console.error('代码编辑器错误:', err);
            showMessage(i18n.src_core_editorts.unusableexteditorcmd.replace('{0}', input));
            cleanUp();
        });

        editor.on('exit', () => {
            showMessage(i18n.src_core_editorts.ext_code_editor_closed.replace('{0}', commandArr[0]));
            console.log('代码编辑器已关闭');
            try {
                const updatedContent = fs.readFileSync(filePath, 'utf-8');
                updateBlockDataDebounced(updatedContent);
            } catch (e) {
                console.error('读取文件失败:', e);
            }
            cleanUp();
        });

        // 监听文件变化
        watcher = fs.watch(filePath, (eventType, _filename) => {
            if (eventType === 'change') {
                try {
                    const updatedContent = fs.readFileSync(filePath, 'utf-8');
                    updateBlockDataDebounced(updatedContent);
                } catch (e) {
                    console.error('读取文件失败:', e);
                }
            }
        });
    } else {
        showMessage(i18n.src_dataquery_editorts.onlydesktop, 3000, 'error');
    }
}

export async function embedBlockEvent({ detail }: any) {
    if (detail.blockElements.length > 1) {
        return;
    }
    let ele: HTMLDivElement = detail.blockElements[0];
    // const protyleRef = new WeakRef(detail.protyle);
    let type = ele.getAttribute("data-type");
    if (type !== "NodeBlockQueryEmbed") {
        return;
    }

    let id = ele.getAttribute("data-node-id");
    let menu = detail.menu;
    menu.addItem({
        icon: "iconGit",
        label: "Edit Code",
        click: () => {
            editJsCode(id, ele.dataset.content);
        }
    });
    menu.addItem({
        icon: "iconMarkdown",
        label: i18n.src_core_editorts.show_as_template_format,
        click: () => {
            let code = ele.dataset.content;
            code = window.Lute.UnEscapeHTMLStr(code);
            //换行符全部替换为 `_esc_newline_`
            code = code.replace(/\n/g, '_esc_newline_');
            const textarea = document.createElement('textarea');
            textarea.value = `{{${code}}}`;
            textarea.style.flex = "1";
            textarea.style.fontSize = "16px";
            textarea.style.margin = "15px 10px";
            textarea.style.borderRadius = "5px";
            textarea.style.resize = "none";
            // 不可编辑
            textarea.setAttribute("readonly", "true");

            simpleDialog({
                title: i18n.src_core_editorts.show_embedded_block_code_in_siyuan_template_format,
                ele: textarea,
                width: "700px",
                height: "300px"
            });
        }
    });
}
