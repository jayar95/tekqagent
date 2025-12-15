import { mastra } from "../mastra";
import {
    createUIMessageStream,
    createUIMessageStreamResponse,
    UIMessage,
    UIMessageStreamOnFinishCallback,
} from "ai";
import { toAISdkStream } from "@mastra/ai-sdk";
import type { Context } from "hono";
import { DOCX_BUILDER_AGENT_ID } from "../mastra/builder/DocxBuilderAgent";
import { recordTurnIfNeeded, upsertChat, upsertChatModelState } from "../Data/ChatRepository";
import type { Doc } from "../mastra/builder/types";

type StreamDocxBuilderRequest = {
    messages: UIMessage[];
    baseChatId: string;
    modelId: string;

    doc: Doc | null;
    selectedSectionId?: string | null;

    useWebSearch?: boolean;
};

function truncate(s: string, max = 16000) {
    return s.length > max ? s.slice(0, max) + "\n...[truncated]" : s;
}

const ORDINAL: Record<string, number> = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
    sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

function extractText(msg: UIMessage | undefined): string {
    if (!msg) return "";
    return (msg.parts ?? [])
        .filter((p: any) => p?.type === "text")
        .map((p: any) => String(p.text ?? ""))
        .join("");
}

function inferReplaceSectionId(doc: Doc | null, userText: string): string | null {
    if (!doc || !doc.sections?.length) return null;
    const lower = userText.toLowerCase();

    // patterns like "replace page 2", "rewrite section 3", "replace the second page"
    const m1 = lower.match(/\b(?:replace|rewrite|overhaul)\s+(?:the\s+)?(?:page|section)\s+(\d+)\b/);
    if (m1) {
        const idx = parseInt(m1[1], 10) - 1;
        return doc.sections[idx]?.sectionId ?? null;
    }

    const m2 = lower.match(/\b(?:replace|rewrite|overhaul)\s+(?:the\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+(?:page|section)\b/);
    if (m2) {
        const n = ORDINAL[m2[1]];
        const idx = (n ?? 0) - 1;
        return doc.sections[idx]?.sectionId ?? null;
    }

    return null;
}

function internalContextMessage(doc: Doc | null, selectedSectionId: string | null | undefined, userText: string): UIMessage {
    const sectionMapping = doc
        ? doc.sections.map((s, i) => `Section ${i + 1} = ${s.sectionId}`).join("\n")
        : "No sections yet";

    const summary = doc
        ? `Current document "${doc.title}" with ${doc.sections.length} sections`
        : "No document exists yet";

    const replaceSectionId = inferReplaceSectionId(doc, userText);

    const ctx = [
        `INTERNAL_CONTEXT (do not repeat verbatim)`,
        summary,
        `selectedSectionId: ${selectedSectionId ?? "null"}`,
        `Section mapping:\n${sectionMapping}`,
        replaceSectionId ? `INTENT=REPLACE_SECTION ${replaceSectionId}` : `INTENT=NONE`,
        `Doc JSON:\n${truncate(JSON.stringify(doc, null, 2))}`,
    ].join("\n\n");

    return {
        id: `internal:context:${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: ctx }],
    };
}

function stripInternal(messages: UIMessage[]) {
    return messages.filter((m) => !String(m.id ?? "").startsWith("internal:"));
}

export const StreamDocxBuilderAiSdk = async (c: Context) => {
    const body = (await c.req.json()) as StreamDocxBuilderRequest;
    const { messages, baseChatId, modelId, doc, selectedSectionId } = body;

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userText = extractText(lastUser);

    const agent = mastra.getAgentById(DOCX_BUILDER_AGENT_ID);
    const agentMessages = [internalContextMessage(doc, selectedSectionId, userText), ...messages];

    const stream = await agent.stream(agentMessages);

    const uiMessageStream = createUIMessageStream({
        originalMessages: messages,
        execute: async ({ writer }) => {
            for await (const part of toAISdkStream(stream, { from: "agent" })) {
                await writer.write(part);
            }
        },
        onFinish: (async (event) => {
            try {
                console.log(JSON.stringify(event));
                if (!baseChatId || !modelId) return;
                if (event.isAborted) return;

                await upsertChat(baseChatId);

                await upsertChatModelState({
                    chatId: baseChatId,
                    modelId,
                    messages: stripInternal(event.messages),
                });

                // record original user message
                await recordTurnIfNeeded({
                    chatId: baseChatId,
                    userMessage: lastUser,
                    modelId,
                });
            } catch (err) {
                console.error("DOCX builder persistence onFinish failed:", err);
            }
        }) as UIMessageStreamOnFinishCallback<UIMessage>,
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
};
