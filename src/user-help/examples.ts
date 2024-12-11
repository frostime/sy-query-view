import { getFileBlob, readDir } from "@/api";
import type QueryViewPlugin from ".."
import { getLute } from "@/core/lute";
import { openTab } from "siyuan";

let exampleHTML = '';

const addSection = (title: string, content: string) => {
let newpart = `
<h4>${title}</h4>

<textarea class="form-control" rows="15" readonly>${content}</textarea>
`;
    exampleHTML += newpart;
}

const loadJsContent = async (path: string) => {
    const blob = await getFileBlob(path);
    const content = await blob.text();
    return content;
}

export const useExamples = async (plugin: QueryViewPlugin) => {
    const examplePath = `/data/plugins/${plugin.name}/example`;
    const files = await readDir(examplePath);

    const routePrefix = `/plugins/${plugin.name}/example`;
    for (const file of files) {
        let name = file.name;
        const filePath = `${examplePath}/${name}`;
        const content = await loadJsContent(filePath);
        addSection(name, content);
    }

    plugin.addTab({
        type: 'js-example',
        init() {
            const readme = document.createElement('div');
            readme.classList.add('item__readme');
            readme.classList.add('b3-typography');
            readme.classList.add('b3-typography--default');
            readme.innerHTML = exampleHTML;
            readme.style.padding = '10px 15px';
            this.element.appendChild(readme);
        }
    });

    return {
        open() {
            openTab({
                app: plugin.app,
                custom: {
                    id: `${plugin.name}js-example`,
                    title: 'Query&View Examples',
                    icon: 'iconCode'
                }
            })
        }
    }
}
