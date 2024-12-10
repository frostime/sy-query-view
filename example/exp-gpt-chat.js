//!js

const ui = () => {
    const textarea = document.createElement('textarea');
    textarea.className = "fn__block b3-text-field";
    textarea.rows = 3;
    textarea.placeholder = "Input Your Message...";

    // 创建按钮容器，使用 flex 布局
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.marginTop = '8px';

    const removeLastButton = document.createElement('button');
    removeLastButton.className = "b3-button";
    removeLastButton.textContent = "Remove Last";
    buttonContainer.appendChild(removeLastButton);

    // Send 按钮
    const sendButton = document.createElement('button');
    sendButton.className = "b3-button";
    sendButton.textContent = "Send Input";

    // 将按钮添加到容器
    buttonContainer.appendChild(removeLastButton);
    buttonContainer.appendChild(sendButton);

    return { textarea, buttonContainer, sendButton, removeLastButton };

}


const chat = async () => {
    let dv = Query.DataView(protyle, item, top);
    const messages = dv.useState('messages', []);

    dv.addmd(`#### GPT Chat`);
    const msgIds = [];
    messages().forEach(msg => {
        let el = dv.addmd(`**${msg.role === 'user' ? 'You' : 'GPT'}**: ${msg.content}`);
        msgIds.push(el.dataset.id);
    });

    dv.addmd('---');

    const { textarea, buttonContainer, sendButton, removeLastButton } = ui();

    dv.addele(textarea);

    dv.addele(buttonContainer);

    sendButton.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        messages([...messages(), { role: 'user', content: prompt }]);
        textarea.value = '';
        sendButton.disabled = true;
        removeLastButton.disabled = true;
        let respond = dv.addmd(`**GPT**: `);
        let id = respond.dataset.id;

        try {
            const response = await Query.gpt(prompt, {
                stream: true,
                streamInterval: 3,
                streamMsg: (content) => {
                    dv.replaceView(id, dv.md(`**GPT**: ${content}`));
                }
            });
            messages([...messages(), { role: 'assistant', content: response }]);
        } catch (error) {
            dv.addmd(`Error: ${error.message}`);
        }

        sendButton.disabled = false;
        removeLastButton.disabled = false;
        dv.repaint();
    };

    removeLastButton.onclick = () => {
        if (msgIds.length < 2) return;

        // 删除最后两条消息
        messages(messages().slice(0, -2));

        // 删除最后两个消息的 DOM 元素
        dv.removeView(msgIds.pop());
        dv.removeView(msgIds.pop());
    };

    dv.render();
}

return chat();