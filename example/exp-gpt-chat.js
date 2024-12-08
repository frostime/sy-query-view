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

    // Send 按钮
    const button = document.createElement('button');
    button.className = "b3-button";
    button.textContent = "Send";

    // 将按钮添加到容器
    buttonContainer.appendChild(button);

    return { textarea, buttonContainer, button };

}


const chat = async () => {
    let dv = Query.DataView(protyle, item, top);
    const messages = dv.useState('messages', []);

    dv.addmd(`#### GPT Chat`);

    messages().forEach(msg => {
        dv.addmd(`**${msg.role === 'user' ? 'You' : 'GPT'}**: ${msg.content}`);
    });

    dv.addmd('---');

    const { textarea, buttonContainer, button } = ui();

    dv.addele(textarea);

    dv.addele(buttonContainer);

    button.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        messages([...messages(), { role: 'user', content: prompt }]);
        textarea.value = '';
        button.disabled = true;

        try {
            const response = await Query.gpt(prompt, { timeout: 20 * 1000 });
            messages([...messages(), { role: 'assistant', content: response }]);
        } catch (error) {
            dv.addmd(`Error: ${error.message}`);
        }

        button.disabled = false;
        dv.repaint();
    };

    dv.addDisposer(() => {
        button.onclick = null;
    });

    dv.render();
}

return chat(); 