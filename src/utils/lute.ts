/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 16:16:53
 * @FilePath     : /src/utils/lute.ts
 * @LastEditTime : 2025-03-13 19:04:33
 * @Description  : 
 */
//from https://github.com/zxhd863943427/siyuan-plugin-data-query/blob/main/src/libs/utils.ts

import { Lute } from "siyuan";

export interface ILute extends Lute {
    SetHTMLTag2TextMark: (enable: boolean) => void;
    InlineMd2BlockDOM: (md: string) => string;
    // HTML2Markdown: (html: string) => string;
    HTML2Md: (html: string) => string;
    SetGitConflict: (args: boolean) => void;
}

export const setLute = (options) => {
    let lute: ILute = globalThis.Lute.New();
    lute.SetSpellcheck(window.siyuan.config.editor.spellcheck);
    lute.SetProtyleMarkNetImg(window.siyuan.config.editor.displayNetImgMark);
    lute.SetFileAnnotationRef(true);
    lute.SetTextMark(true);
    lute.SetHeadingID(false);
    lute.SetYamlFrontMatter(false);
    // lute.PutEmojis(options.emojis);
    // lute.SetEmojiSite(options.emojiSite);
    // lute.SetHeadingAnchor(options.headingAnchor);
    lute.SetInlineMathAllowDigitAfterOpenMarker(true);
    lute.SetToC(false);
    lute.SetIndentCodeBlock(false);
    lute.SetParagraphBeginningSpace(true);
    lute.SetSetext(false);
    lute.SetFootnotes(false);
    lute.SetLinkRef(false);
    // lute.SetSanitize(options.sanitize);
    // lute.SetChineseParagraphBeginningSpace(options.paragraphBeginningSpace);
    // lute.SetRenderListStyle(options.listStyle);
    lute.SetImgPathAllowSpace(true);
    lute.SetKramdownIAL(true);
    lute.SetTag(true);
    lute.SetSuperBlock(true);
    // lute.SetGitConflict(true);
    lute.SetMark(true);
    lute.SetInlineAsterisk(window.siyuan.config.editor.markdown.inlineAsterisk);
    lute.SetInlineUnderscore(window.siyuan.config.editor.markdown.inlineUnderscore);
    lute.SetSup(window.siyuan.config.editor.markdown.inlineSup);
    lute.SetSub(window.siyuan.config.editor.markdown.inlineSub);
    lute.SetTag(window.siyuan.config.editor.markdown.inlineTag);
    lute.SetInlineMath(window.siyuan.config.editor.markdown.inlineMath);
    lute.SetGFMStrikethrough1(false);
    lute.SetGFMStrikethrough(window.siyuan.config.editor.markdown.inlineStrikethrough);
    lute.SetMark(window.siyuan.config.editor.markdown.inlineMark);
    lute.SetProtyleWYSIWYG(true);
    // if (options.lazyLoadImage) {
    //     lute.SetImageLazyLoading(options.lazyLoadImage);
    // }
    lute.SetBlockRef(true);
    lute.SetHTMLTag2TextMark(true)
    if (window.siyuan.emojis[0].items.length > 0) {
        const emojis = {};
        window.siyuan.emojis[0].items.forEach(item => {
            emojis[item.keywords] = options.emojiSite + "/" + item.unicode;
        });
        lute.PutEmojis(emojis);
    }
    return lute;
};
