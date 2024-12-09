//!js
const prompt = (text) => `
Please translate the following text to English:
Only output the translated text, no other text or comments.
Maintain the markdown format of the original text.
---
${text}
`;
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let block = (await Query.random(1, 'p'))[0];

    let md = block.markdown;
    dv.addmd(`
## Original Text

${md}

----
`);
    Query.gpt(prompt(md), { timeout: 15 * 1000 }).then(translated => {
      dv.addmd(`
## Translated Text

${translated}
`.trim());
    });

    dv.render();
}

return query();