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
    baseChatId: string;
    modelId: string;
    contextMessages?: UIMessage[];
    useWebSearch?: boolean;
    selectedFileId?: string | null;
};

export const StreamFinanceAgentAiSdk = async (c: Context) => {
    const body = (await c.req.json()) as StreamFinanceAgentAiSdkRequest;

    const { messages, baseChatId, modelId, contextMessages } = body;

    const myAgent = mastra.getAgentById(FINANCE_AGENT_ID);
    const agentMessages =
        Array.isArray(contextMessages) && contextMessages.length
            ? [...contextMessages, ...messages]
            : messages;

    const stream = await myAgent.stream(agentMessages);

    const uiMessageStream = createUIMessageStream({
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

                await upsertChatModelState({
                    chatId: baseChatId,
                    modelId,
                    messages: event.messages,
                });

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
