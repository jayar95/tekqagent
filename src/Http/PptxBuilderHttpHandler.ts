import { mastra } from "../mastra";
import {
    createUIMessageStream,
    createUIMessageStreamResponse,
    UIMessage,
    UIMessageStreamOnFinishCallback,
} from "ai";
import { toAISdkStream } from "@mastra/ai-sdk";
import type { Context } from "hono";
import { PPTX_BUILDER_AGENT_ID } from "../mastra/builder/PptxBuilderAgent";
import { recordTurnIfNeeded, upsertChat, upsertChatModelState } from "../Data/ChatRepository";
import type { Deck } from "../mastra/builder/types";

type StreamPptxBuilderRequest = {
    messages: UIMessage[];
    baseChatId: string;
    modelId: string;

    // builder context:
    deck: Deck | null;
    selectedSlideId?: string | null;

    useWebSearch?: boolean;
};

function truncate(s: string, max = 14000) {
    return s.length > max ? s.slice(0, max) + "\n...[truncated]" : s;
}

function internalContextMessage(deck: Deck | null, selectedSlideId?: string | null): UIMessage {
    const slideMapping = deck
        ? deck.slides.map((s, i) => `Slide ${i + 1} = ${s.slideId}`).join("\n")
        : "No slides yet";

    const summary = deck
        ? `Current deck "${deck.title}" with ${deck.slides.length} slides`
        : "No deck exists yet";

    const ctx = [
        `INTERNAL_CONTEXT (do not repeat verbatim)`,
        summary,
        `selectedSlideId: ${selectedSlideId ?? "null"}`,
        `Slide mapping:\n${slideMapping}`,
        `Deck JSON:\n${truncate(JSON.stringify(deck, null, 2))}`,
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

export const StreamPptxBuilderAiSdk = async (c: Context) => {
    const body = (await c.req.json()) as StreamPptxBuilderRequest;
    const { messages, baseChatId, modelId, deck, selectedSlideId } = body;

    const agent = mastra.getAgentById(PPTX_BUILDER_AGENT_ID);

    const agentMessages = [internalContextMessage(deck, selectedSlideId), ...messages];
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

                // Persist per-model history (strip internal context)
                await upsertChatModelState({
                    chatId: baseChatId,
                    modelId,
                    messages: stripInternal(event.messages),
                });

                // Record the user turn using the ORIGINAL request messages
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                await recordTurnIfNeeded({
                    chatId: baseChatId,
                    userMessage: lastUser,
                    modelId,
                });
            } catch (err) {
                console.error("PPTX builder persistence onFinish failed:", err);
            }
        }) as UIMessageStreamOnFinishCallback<UIMessage>,
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
};
