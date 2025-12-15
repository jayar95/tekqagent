import { mastra } from "../mastra";
import {
    createUIMessageStream,
    createUIMessageStreamResponse,
    UIMessage,
    UIMessageStreamOnFinishCallback,
} from "ai";
import { toAISdkStream } from "@mastra/ai-sdk";
import type { Context } from "hono";
import { FINANCE_AGENT_ID } from "../mastra/finance/FinanceAgent";
import { recordTurnIfNeeded, upsertChat, upsertChatModelState } from "../Data/ChatRepository";

type StreamFinanceAgentAiSdkRequest = {
    messages: UIMessage[];

    // Sent from the frontend sendMessage(..., { body: { baseChatId, modelId, ... }})
    baseChatId: string;
    modelId: string;

    // ✅ NEW: unified context (cross-model + cross-channel) to prepend for the model run
    contextMessages?: UIMessage[];

    // other fields you already send; optional
    useWebSearch?: boolean;
    selectedFileId?: string | null;
};

export const StreamFinanceAgentAiSdk = async (c: Context) => {
    const body = (await c.req.json()) as StreamFinanceAgentAiSdkRequest;

    const { messages, baseChatId, modelId, contextMessages } = body;

    const myAgent = mastra.getAgentById(FINANCE_AGENT_ID);

    // ✅ Use contextMessages for the model call ONLY (do not persist them in model history)
    const agentMessages =
        Array.isArray(contextMessages) && contextMessages.length
            ? [...contextMessages, ...messages]
            : messages;

    const stream = await myAgent.stream(agentMessages);

    const uiMessageStream = createUIMessageStream({
        // IMPORTANT: keep originalMessages == per-model messages so persistence stays "pure"
        originalMessages: messages,

        execute: async ({ writer }) => {
            for await (const part of toAISdkStream(stream, { from: "agent" })) {
                await writer.write(part);
            }
        },

        // createUIMessageStream’s onFinish gets the final messages/response
        onFinish: (async (event) => {
            try {
                if (!baseChatId || !modelId) return;
                if (event.isAborted) return;

                // 1) ensure chat exists
                await upsertChat(baseChatId);

                // 2) persist per-model full message history (NO contextMessages included)
                await upsertChatModelState({
                    chatId: baseChatId,
                    modelId,
                    messages: event.messages,
                });

                // 3) record the "turn" index for UI hydration
                const lastUser = [...event.messages].reverse().find((m) => m.role === "user");
                await recordTurnIfNeeded({
                    chatId: baseChatId,
                    userMessage: lastUser,
                    modelId,
                });
            } catch (err) {
                console.error("Persistence onFinish failed:", err);
            }
        }) as UIMessageStreamOnFinishCallback<UIMessage>,
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
};
