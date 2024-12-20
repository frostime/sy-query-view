//!js
const row = (block) => `
{{{col

${block.icon} **${block.aslink}**

**${block.createdDate} ~ ${block.updatedDate}**
{: style="flex: none;" }

}}}
{: style="border-bottom: 1px dashed var(--b3-theme-on-surface-light); border-radius: 0px;" }
`.trim();

const query = async () => {
    let dv = Query.DataView(protyle, item, top);

    let blocks = await Query.childDoc(dv.root_id);
    let icons = blocks.map(block => Query.Utils.docIcon(block));
    blocks = blocks.addcols({ 'icon': icons });

    dv.addmd(blocks.map(row).join('\n\n'));
    dv.render();
}

return query();