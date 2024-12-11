//!js
const prompt = (text) => `
Please translate the text after --- to English.
Then output the translated text, no other text or comments.
Maintain the markdown format of the original text.
---

${text}
`;
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    //任意选择一个不为空的段落
    let block = (await Query.random(10, 'p')).find(b => b.markdown !== '');

    let md = block.markdown;
    dv.addmd(`
## Original Text

${md}

----
`);
    const div = document.createElement('div');
    let tempid = (dv.addele(div)).dataset.id;
    const translated = await Query.gpt(prompt(md), {
        stream: true,
        streamMsg: (content) => {
            div.innerText = content;
        }
    });
    dv.removeView(tempid);

    dv.addmd(`
## Translated Text

${translated}
`.trim());

    dv.render();
}

return query();