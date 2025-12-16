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
import {
    recordTurnIfNeeded,
    upsertChat,
    upsertChatModelState,
    getChatDeckState,
    upsertChatDeckState,
} from "../Data/ChatRepository";
import type { Deck } from "../mastra/builder/types";
import { extractEmitArtifactActionsPayload } from "../mastra/builder/extractEmitArtifactActions";
import { applyDeckActionsToState } from "../mastra/builder/stateReducers";

type StreamPptxBuilderRequest = {
    messages: UIMessage[];
    baseChatId: string;
    modelId: string;

    // unified context (cross-model + cross-channel) to prepend for the model run
    contextMessages?: UIMessage[];

    selectedSlideId?: string | null;
    useWebSearch?: boolean;
};

function truncate(s: string, max = 14000) {
    return s.length > max ? s.slice(0, max) + "\n...[truncated]" : s;
}

function internalContextMessage(deck: Deck | null, selectedSlideId?: string | null): UIMessage {
    const slideMapping = deck ? deck.slides.map((s, i) => `Slide ${i + 1} = ${s.slideId}`).join("\n") : "No slides yet";

    const summary = deck ? `Current deck "${deck.title}" with ${deck.slides.length} slides` : "No deck exists yet";

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
    const { messages, baseChatId, modelId, selectedSlideId, contextMessages } = body;

    // Load deck from DB (server is source of truth)
    const persistedDeck = baseChatId ? await getChatDeckState(baseChatId) : null;

    const agent = mastra.getAgentById(PPTX_BUILDER_AGENT_ID);

    // prepend internal deck context, then unified cross-chat context, then this model’s own messages
    const agentMessages = [
        internalContextMessage(persistedDeck, selectedSlideId),
        ...(Array.isArray(contextMessages) ? contextMessages : []),
        ...messages,
    ];

    const stream = await agent.stream(agentMessages);

    const uiMessageStream = createUIMessageStream({
        // keep originalMessages == per-model messages so persistence stays "pure"
        originalMessages: messages,

        execute: async ({ writer }) => {
            for await (const part of toAISdkStream(stream, { from: "agent" })) {
                await writer.write(part);
            }
        },
        onFinish: (async (event) => {
            try {
                if (!baseChatId || !modelId) return;
                if (event.isAborted) return;

                await upsertChat(baseChatId);

                const cleanedMessages = stripInternal(event.messages);

                // Persist per-model history
                await upsertChatModelState({
                    chatId: baseChatId,
                    modelId,
                    messages: cleanedMessages,
                });

                // Record original user message from request
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                await recordTurnIfNeeded({
                    chatId: baseChatId,
                    userMessage: lastUser,
                    modelId,
                });

                // Persist updated deck state based on emitted actions
                const payload = extractEmitArtifactActionsPayload(cleanedMessages);
                if (payload) {
                    const currentDeck = await getChatDeckState(baseChatId);
                    const nextDeck = applyDeckActionsToState(currentDeck, payload.actions);
                    if (nextDeck) {
                        await upsertChatDeckState({ chatId: baseChatId, deck: nextDeck });
                    }
                }
            } catch (err) {
                console.error("PPTX builder persistence onFinish failed:", err);
            }
        }) as UIMessageStreamOnFinishCallback<UIMessage>,
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
};
