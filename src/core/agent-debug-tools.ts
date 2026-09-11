/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2026-08-27
 * @FilePath     : /src/core/agent-debug-tools.ts
 * @Description  : Agent 调试工具：debug-qv.view
 */

import { getAllEditor, type App, type Plugin, type Protyle } from "siyuan";
import { getBlockByID } from "@/api";
import styles from "./index.module.scss";

/**
 * Agent tool: debug-qv.view.
 *
 * Reads the current output of an open Query&View query embed block. The result keeps
 * the host output (`.protyle-wysiwyg__embed`) and the DataView output separate because
 * host text is not necessarily an error: a query can produce host text and render a
 * DataView at the same time. If script execution fails, the host usually contains the
 * error while the DataView container is empty.
 *
 * `format: "text"` (default) selects the DataView plain text for `result`; `format: "html"`
 * selects its HTML. When the DataView has no output, `result` falls back to host text so
 * the agent can diagnose the script. The complete snapshot is returned as structured
 * content. The containing document must be open because this tool reads live DOM state.
 */
const TOOL_NAME = "debug-qv.view";

/** Tool input JSON Schema. */
const TOOL_INPUT_SCHEMA: Record<string, unknown> = {
    type: "object",
    properties: {
        blockId: {
            type: "string",
            description: "ID of the QV query embed block",
        },
        format: {
            type: "string",
            enum: ["text", "html"],
            default: "text",
            description: "Output format: plain text (default) or the rendered view HTML",
        },
    },
    required: ["blockId"],
};

const TOOL_OUTPUT_SCHEMA: Record<string, unknown> = {
    type: "object",
    properties: {
        result: { type: "string" },
        structuredContent: {
            type: "object",
            properties: {
                blockId: { type: "string" },
                format: { type: "string", enum: ["text", "html"] },
                resultSource: { type: "string", enum: ["view", "host-output", "empty"] },
                hostOutput: {
                    type: "object",
                    properties: {
                        present: { type: "boolean" },
                        text: { type: "string" },
                    },
                    required: ["present", "text"],
                },
                viewOutput: {
                    type: "object",
                    properties: {
                        present: { type: "boolean" },
                        empty: { type: "boolean" },
                        text: { type: "string" },
                        html: { type: "string" },
                    },
                    required: ["present", "empty", "text", "html"],
                },
            },
            required: ["blockId", "format", "resultSource", "hostOutput", "viewOutput"],
        },
        error: { type: "string" },
    },
};

// ── 1. 定位：先经内核 API 校验块，再检查文档是否打开 ────────────────────────────

/** Locate a QV block in the live DOM of an open document. */
type QvLookupResult =
    | { ok: true; protyle: Protyle; blockElement: HTMLElement }
    | { ok: false; reason: "not-found" | "not-qv" | "doc-not-open" | "not-rendered" };

async function findQvBlockInOpenDocs(blockId: string): Promise<QvLookupResult> {
    const block = await getBlockByID(blockId);
    if (!block) {
        return { ok: false, reason: "not-found" };
    }
    if (block.type !== "query_embed") {
        return { ok: false, reason: "not-qv" };
    }

    const matchingEditors = getAllEditor().filter(editor => editor.protyle.block.rootID === block.root_id);
    if (matchingEditors.length === 0) {
        return { ok: false, reason: "doc-not-open" };
    }

    for (const protyle of matchingEditors) {
        const blockElement = Array.from(
            protyle.protyle.element.querySelectorAll<HTMLElement>("[data-node-id]")
        ).find(element => element.dataset.nodeId === blockId);
        if (blockElement) {
            return { ok: true, protyle, blockElement };
        }
    }

    return { ok: false, reason: "not-rendered" };
}

// ── 2. 取内部渲染 DOM ─────────────────────────────────────────────────────────

/**
 * Read the DataView and host output regions belonging to a rendered QV block.
 * The two regions are intentionally returned separately rather than classified as
 * success/error based only on their presence.
 */
type RenderedContentResult =
    | {
        ok: true;
        hostOutput: { present: boolean; text: string };
        viewElement: HTMLElement | null;
    }
    | { ok: false; reason: "not-rendered" };

type ViewSnapshot = {
    blockId: string;
    format: "text" | "html";
    resultSource: "view" | "host-output" | "empty";
    hostOutput: {
        present: boolean;
        text: string;
    };
    viewOutput: {
        present: boolean;
        empty: boolean;
        text: string;
        html: string;
    };
};

function findRenderedContentElement(blockElement: HTMLElement): RenderedContentResult {
    const viewElement = blockElement.querySelector<HTMLElement>(`.${styles["data-query-embed"]}`);
    const hostElement = blockElement.querySelector<HTMLElement>(".protyle-wysiwyg__embed");
    const hostText = hostElement?.innerText.trim() ?? "";

    // The host may leave an empty DataView container after script execution fails.
    // Keep both regions so the caller can distinguish rendered content from host output.
    if (!viewElement && !hostElement) {
        return { ok: false, reason: "not-rendered" };
    }

    return {
        ok: true,
        hostOutput: {
            present: hostElement !== null,
            text: hostText,
        },
        viewElement,
    };
}

// ── 3. 序列化 ─────────────────────────────────────────────────────────────────

/** Serialize a complete snapshot for the agent-facing result. */
function createViewSnapshot(
    blockId: string,
    format: "text" | "html",
    renderedContent: Extract<RenderedContentResult, { ok: true }>,
): ViewSnapshot {
    const { viewElement, hostOutput } = renderedContent;
    const viewText = viewElement?.innerText ?? "";
    const viewHtml = viewElement?.outerHTML ?? "";
    const viewHasContent = viewElement !== null && viewElement.innerHTML.trim() !== "";

    return {
        blockId,
        format,
        resultSource: viewHasContent ? "view" : hostOutput.text ? "host-output" : "empty",
        hostOutput,
        viewOutput: {
            present: viewElement !== null,
            empty: !viewHasContent,
            text: viewText,
            html: viewHtml,
        },
    };
}

// ── 4. 工具 handler ───────────────────────────────────────────────────────────

/**
 * @param args Input object described by TOOL_INPUT_SCHEMA.
 * @returns A plain result string, optional structured snapshot, or an error string.
 */
async function handleView(args: Record<string, unknown>, _app: App): Promise<{
    result?: string;
    structuredContent?: ViewSnapshot;
    error?: string;
}> {
    const { blockId, format = "text" } = args as {
        blockId?: unknown;
        format?: unknown;
    };

    if (typeof blockId !== "string" || blockId.trim() === "") {
        return { error: "blockId must be a non-empty string" };
    }
    if (format !== "text" && format !== "html") {
        return { error: 'format must be either "text" or "html"' };
    }

    const lookup = await findQvBlockInOpenDocs(blockId);
    if ("reason" in lookup) {
        switch (lookup.reason) {
            case "not-found":
                return { error: `QV block not found: ${blockId}` };
            case "not-qv":
                return { error: `Block is not a QV query embed: ${blockId}` };
            case "doc-not-open":
                return { error: `The document containing QV block is not open: ${blockId}` };
            case "not-rendered":
                return { error: `QV block is not rendered in the open document: ${blockId}` };
        }
    }

    const renderedContent = findRenderedContentElement(lookup.blockElement);
    if ("reason" in renderedContent) {
        return { error: `QV block has no rendered output: ${blockId}` };
    }

    const snapshot = createViewSnapshot(blockId, format, renderedContent);
    const result = format === "html" ? snapshot.viewOutput.html : snapshot.viewOutput.text;

    return {
        // Return the requested view output when available. If execution produced
        // only host output, return that text so the agent can diagnose the script.
        result: result || snapshot.hostOutput.text,
        structuredContent: snapshot,
    };
}

// ── 5. 注册 / 注销 ────────────────────────────────────────────────────────────

/**
 * 注册 debug-qv.view 工具（随插件 onload 调用）。
 *
 * 运行时待确认：
 *  - 当前前端 Plugin API 没有对应的注销方法，因此 unload 不执行注销；插件卸载时
 *    是否由宿主自动清理注册项，需结合宿主行为确认。
 */
export function load(plugin: Plugin) {
    const registration = plugin.addAgentCapability({
        name: TOOL_NAME,
        title: "QV Debug View",
        description:
            "Read the current rendered output of an open Query&View query embed block. " +
            "The result includes the host output and the DataView output; format=text returns " +
            "plain text and format=html returns the rendered view HTML.",
        inputSchema: TOOL_INPUT_SCHEMA,
        outputSchema: TOOL_OUTPUT_SCHEMA,
        effects: { localRead: true },
        handler: handleView,
    });
    console.debug(`[agent-debug-tools] Registered ${TOOL_NAME}: ${registration}`);
}

/**
 * 注销 debug-qv.view 工具（随插件 onunload 调用）。
 *
 * TODO(确认): 当前前端 Plugin API（siyuan SDK 1.2.5）只有 addAgentCapability，
 * 没有对应的注销方法；需确认插件卸载时内核是否自动清理注册项。
 * 若需要运行时动态注销，可能要迁到内核侧 `siyuan.agent.unregisterCapability`。
 */
export function unload(_plugin: Plugin) {
    // Plugin.addAgentCapability currently has no matching unregister API.
    // The host's cleanup behavior still needs confirmation in a real SiYuan runtime.
}