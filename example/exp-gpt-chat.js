//!js
const chat = async () => {
    let dv = Query.DataView(protyle, item, top);
    const messages = dv.useState('messages', []);

    dv.addmd(`#### GPT Chat`);

    messages().forEach(msg => {
        dv.addmd(`**${msg.role === 'user' ? 'You' : 'GPT'}**: ${msg.content}`);
    });

    dv.addmd('---');

    const textarea = document.createElement('textarea');
    textarea.className = "fn__block b3-text-field";
    textarea.rows = 3;
    textarea.placeholder = "Input Your Message...";

    dv.addele(textarea);

    const button = document.createElement('button');
    button.className = "b3-button";
    button.textContent = "Send";
    dv.addele(button);

    button.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        messages([...messages(), { role: 'user', content: prompt }]);
        textarea.value = '';
        button.disabled = true;

        try {
            const response = await Query.gpt(prompt);
            messages([...messages(), { role: 'assistant', content: response }]);
        } catch (error) {
            dv.addmd(`Error: ${error.message}`);
        }

        button.disabled = false;
        dv.repaint();
    };

    dv.render();
}

return chat(); 