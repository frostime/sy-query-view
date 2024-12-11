//!js
const assetFile = async () => {
    let response = await Query.request('/api/file/readDir', {
        path: '/data/assets'
    });
    return response.map(file => file.name);
}

const ITEMS_PER_PAGE = 10;

const useControl = (files) => {
    let page = 1;
    let leftBtn = document.createElement('button');
    leftBtn.classList.add('b3-button');
    let span = document.createElement('span');
    let rightBtn = document.createElement('button');
    rightBtn.classList.add('b3-button');

    let slice = [];
    let total = files.length;
    let pages = Math.ceil(total / ITEMS_PER_PAGE);

    leftBtn.textContent = 'Previous';
    span.textContent = `Page ${page} of ${pages}`;
    rightBtn.textContent = 'Next';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px'
    });
    panel.appendChild(leftBtn);
    panel.appendChild(span);
    panel.appendChild(rightBtn);

    const updateSlice = () => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        slice = files.slice(start, end);
    };

    const left = () => {
        if (page > 1) {
            page--;
            span.textContent = `Page ${page} of ${pages}`;
            updateSlice();
        }
    };

    const right = () => {
        if (page < pages) {
            page++;
            span.textContent = `Page ${page} of ${pages}`;
            updateSlice();
        }
    };

    updateSlice();

    return {
        panel,
        leftBtn,
        rightBtn,
        left,
        right,
        slice: () => slice
    };
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let files = await assetFile();
    files = files.filter(file => {
        return file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg');
    });

    let control = useControl(files);

    dv.addele(control.panel);

    let ele = dv.addele('Placeholder');
    let id = ele.dataset.id;

    const createView = (slice) => {
        const data = slice.map(item => {
            return {
                name: item,
                img: `![](/assets/${item})`
            }
        });
        return dv.table(data, {
            fullwidth: true,
            cols: null,
        });
    }

    control.leftBtn.onclick = () => {
        control.left();
        const slice = control.slice();
        dv.replaceView(id, createView(slice))
    };
    control.rightBtn.onclick = () => {
        control.right();
        const slice = control.slice();
        dv.replaceView(id, createView(slice))
    };

    dv.replaceView(id, createView(control.slice()))

    dv.render();
};

return query();
