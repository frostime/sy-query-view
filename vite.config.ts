import { resolve } from "path"
import { defineConfig, loadEnv } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import livereload from "rollup-plugin-livereload"
import zipPack from "vite-plugin-zip-pack";
import fg from 'fast-glob';

import vitePluginYamlI18n from './yaml-plugin';

const env = process.env;
const isSrcmap = env.VITE_SOURCEMAP === 'inline';
const isDev = env.NODE_ENV === 'development';
const minify = env.NO_MINIFY ? false : true;

const outputDir = isDev ? "dev" : "dist";

console.log("isDev=>", isDev);
console.log("isSrcmap=>", isSrcmap);
console.log("outputDir=>", outputDir);

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        }
    },

    plugins: [
        vitePluginYamlI18n({
            inDir: 'public/i18n',
            outDir: `${outputDir}/i18n`
        }),

        viteStaticCopy({
            structured: true,
            targets: [
                { src: "./README*.md", dest: "./" },
                { src: "./CHANGELOG.md", dest: "./" },
                { src: "./plugin.json", dest: "./" },
                { src: "./preview.png", dest: "./" },
                { src: "./icon.png", dest: "./" },
                { src: "./docs/**", dest: "./" },
                { src: "./skills/**", dest: "./" }
            ],
        }),

    ],

    define: {
        "process.env.DEV_MODE": JSON.stringify(isDev),
        "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
    },

    build: {
        outDir: outputDir,
        emptyOutDir: false,
        minify: minify ?? true,
        sourcemap: isSrcmap ? 'inline' : false,

        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            fileName: "index",
            formats: ["cjs"],
        },
        rollupOptions: {
            plugins: [
                ...(isDev ? [
                    livereload(outputDir),
                    {
                        name: 'watch-external',
                        async buildStart() {
                            const files = await fg([
                                'public/i18n/**',
                                './README*.md',
                                './plugin.json',
                                './docs/**',
                                './skills/**'
                            ]);
                            for (let file of files) {
                                this.addWatchFile(file);
                            }
                        }
                    },
                    replaceMDImgUrl(outputDir),
                    copySkillReferences(outputDir)
                ] : [
                    // Clean up unnecessary files under dist dir
                    cleanupDistFiles({
                        patterns: ['i18n/*.yaml', 'i18n/*.md'],
                        distDir: outputDir
                    }),
                    replaceMDImgUrl(outputDir),
                    copySkillReferences(outputDir),
                    zipPack({
                        inDir: './dist',
                        outDir: './',
                        outFileName: 'package.zip'
                    })
                ])
            ],

            external: ["siyuan", "process"],

            output: {
                entryFileNames: "[name].js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === "style.css") {
                        return "index.css"
                    }
                    return assetInfo.name
                },
            },
        },
    }
});


/**
 * Clean up some dist files after compiled
 * @author frostime
 * @param options:
 * @returns 
 */
function cleanupDistFiles(options: { patterns: string[], distDir: string }) {
    const {
        patterns,
        distDir
    } = options;

    return {
        name: 'rollup-plugin-cleanup',
        enforce: 'post',
        writeBundle: {
            sequential: true,
            order: 'post' as 'post',
            async handler() {
                const fg = await import('fast-glob');
                const fs = await import('fs');
                // const path = await import('path');

                // 使用 glob 语法，确保能匹配到文件
                const distPatterns = patterns.map(pat => `${distDir}/${pat}`);
                console.debug('Cleanup searching patterns:', distPatterns);

                const files = await fg.default(distPatterns, {
                    dot: true,
                    absolute: true,
                    onlyFiles: false
                });

                // console.info('Files to be cleaned up:', files);

                for (const file of files) {
                    try {
                        if (fs.default.existsSync(file)) {
                            const stat = fs.default.statSync(file);
                            if (stat.isDirectory()) {
                                fs.default.rmSync(file, { recursive: true });
                            } else {
                                fs.default.unlinkSync(file);
                            }
                            console.log(`Cleaned up: ${file}`);
                        }
                    } catch (error) {
                        console.error(`Failed to clean up ${file}:`, error);
                    }
                }
            }
        }
    };
}


function copySkillReferences(dirname: string) {
    return {
        name: 'rollup-plugin-copy-skill-references',
        enforce: 'post',
        writeBundle: {
            sequential: true,
            order: 'post' as 'post',
            async handler() {
                const fs = await import('fs');
                const path = await import('path');
                // 真相源：docs/en_US/agent-ref（文档站体系的一部分）；
                // 产物：技能包内 references/（SDK 整目录同步，SKILL 自包含）
                const srcDir = path.resolve(__dirname, 'docs/en_US/agent-ref');
                const destDir = path.join(dirname, 'skills/sy-query-view/references');
                fs.mkdirSync(destDir, { recursive: true });
                for (const f of ['query-api.md', 'dataview.md']) {
                    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
                    console.log(`[skill-refs] copied ${f}`);
                }
            }
        }
    };
}

function replaceMDImgUrl(dirname: string) {
    return {
        name: 'rollup-plugin-replace-md-img-url',
        enforce: 'post',
        writeBundle: {
            sequential: true,
            order: 'post' as 'post',
            async handler() {
                const fs = await import('fs');
                const { resolve } = await import('path');

                console.log('Replace MD image URLs under:', dirname);

                const replace = async (readmePath: string, prefix: string) => {
                    if (prefix.endsWith('/')) {
                        prefix = prefix.slice(0, -1);
                    }
                    function replaceImageUrl(url: string) {
                        // Replace with your desired image hosting URL
                        if (url.startsWith('docs/assets/')) {
                            return `${prefix}/${url}`;
                        }
                        return url;
                    }

                    try {
                        let readmeContent = fs.readFileSync(readmePath, 'utf-8');

                        // Regular expression to match Markdown image syntax
                        // Matches both with and without title/alt text
                        const imageRegex = /!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)/g;

                        // Replace all image URLs in the content
                        const updatedReadmeContent = readmeContent.replace(
                            imageRegex,
                            (match, alt, url, title) => {
                                const newUrl = replaceImageUrl(url);
                                // If there was a title, include it in the new markdown
                                if (title) {
                                    return `![${alt}](${newUrl} "${title}")`;
                                }
                                // Otherwise just return the image with alt text
                                return `![${alt}](${newUrl})`;
                            }
                        );

                        // Write the updated content back to the file
                        fs.writeFileSync(readmePath, updatedReadmeContent, 'utf-8');
                        console.log(`Successfully updated ${readmePath}`);

                    } catch (error) {
                        console.error(`Error processing ${readmePath}:`, error);
                    }
                }

                const prefix_github = 'https://github.com/frostime/sy-query-view/raw/main';
                const prefix_cdn = 'https://cdn.jsdelivr.net/gh/frostime/sy-query-view@main';
                // const prefix_cdn = 'https://ghgo.xyz/https://github.com/frostime/sy-query-view/raw/main';

                let readmePath = resolve(dirname, 'README.md');
                await replace(readmePath, prefix_github);
                readmePath = resolve(dirname, 'README_zh_CN.md');
                await replace(readmePath, prefix_cdn);
            }
        }
    };
}
