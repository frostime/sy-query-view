//!js

const useButton = (title, onclick) => {
    let button = document.createElement('button');
    button.className = 'b3-button b3-button--text';
    button.innerText = title;
    button.onclick = onclick;
    return button;
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    dv.render();
    let tags = await Query.request('/api/tag/getTag', {
        sort: 4
    });

    tags = tags.sort((a, b) => - a.count + b.count);

    const onclick = (tag) => {
        Query.tag(tag.label).then(async (blocks) => {
            if (blocks.length == 0) return;
            blocks = blocks.sorton('created');
            blocks = await Query.prune(blocks, 'leaf');
            blocks = await Query.fb2p(blocks);
            //const table = dv.table(blocks, {fullwidth: true} );
            const table = dv.cards(blocks, {
                width: '275px',
                height: '150px'
            });
            dv.replaceView(main.dataset.id, table);
        });
    }

    const createTagButtons = (tags) => {
        const buttons = [];
        tags.forEach(tag => {
            const button = useButton(`#${tag.label} (${tag.count})`, () => {
                onclick(tag);
            });
            button.style.margin = '5px';
            buttons.push(button);

            // Recursively process children tags
            if (tag.children && tag.children.length > 0) {
                const childButtons = createTagButtons(tag.children);
                buttons.push(...childButtons);
            }
        });
        return buttons;
    }

    const tagButtons = createTagButtons(tags);

    const allTagsList = document.createElement('div');
    allTagsList.style.display = 'flex';
    allTagsList.style.flexWrap = 'wrap';
    tagButtons.forEach(tagElement => {
        allTagsList.appendChild(tagElement);
    });
    dv.addele(allTagsList);
    dv.addmd('---');

    let main = dv.addele('')
}

return query();
