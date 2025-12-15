import type { UIMessage } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "./Db";
import { chats, chatModelStates, chatTurns, chatTurnModels } from "./schema";

function stripFilePartsFromMessage(message: UIMessage): UIMessage {
    return {
        ...message,
        parts: message.parts.filter((p) => p.type !== "file"),
    };
}

function stripFilePartsFromMessages(messages: UIMessage[]): UIMessage[] {
    return messages.map(stripFilePartsFromMessage);
}

export async function upsertChat(chatId: string) {
    await db
        .insert(chats)
        .values({ id: chatId })
        .onConflictDoUpdate({
            target: chats.id,
            set: { updatedAt: new Date() },
        });
}

export async function upsertChatModelState(params: {
    chatId: string;
    modelId: string;
    messages: UIMessage[];
}) {
    const { chatId, modelId } = params;
    const cleaned = stripFilePartsFromMessages(params.messages);

    await db
        .insert(chatModelStates)
        .values({
            chatId,
            modelId,
            messages: cleaned,
        })
        .onConflictDoUpdate({
            target: [chatModelStates.chatId, chatModelStates.modelId],
            set: {
                messages: cleaned,
                updatedAt: new Date(),
            },
        });
}

export async function recordTurnIfNeeded(params: {
    chatId: string;
    userMessage: UIMessage | undefined;
    modelId: string;
}) {
    const { chatId, userMessage, modelId } = params;
    if (!userMessage) return;

    const cleanedUser = stripFilePartsFromMessage(userMessage);

    await db
        .insert(chatTurns)
        .values({
            chatId,
            userMessageId: cleanedUser.id,
            userMessage: cleanedUser,
        })
        .onConflictDoNothing();

    await db
        .insert(chatTurnModels)
        .values({
            chatId,
            userMessageId: cleanedUser.id,
            modelId,
        })
        .onConflictDoNothing();
}

export async function getChatById(chatId: string) {
    const chatRow = await db.query.chats.findFirst({
        where: eq(chats.id, chatId),
    });

    if (!chatRow) {
        return null;
    }

    const turnsRows = await db
        .select({
            userMessageId: chatTurns.userMessageId,
            user: chatTurns.userMessage,
            createdAt: chatTurns.createdAt,
        })
        .from(chatTurns)
        .where(eq(chatTurns.chatId, chatId))
        .orderBy(chatTurns.createdAt);

    const userMessageIds = turnsRows.map((t) => t.userMessageId);

    const modelsRows =
        userMessageIds.length === 0
            ? []
            : await db
                .select({
                    userMessageId: chatTurnModels.userMessageId,
                    modelId: chatTurnModels.modelId,
                })
                .from(chatTurnModels)
                .where(
                    and(
                        eq(chatTurnModels.chatId, chatId),
                        inArray(chatTurnModels.userMessageId, userMessageIds)
                    )
                );

    const modelsByUserMessageId = new Map<string, string[]>();
    for (const row of modelsRows) {
        const arr = modelsByUserMessageId.get(row.userMessageId) ?? [];
        arr.push(row.modelId);
        modelsByUserMessageId.set(row.userMessageId, arr);
    }

    const turns = turnsRows.map((t) => ({
        user: t.user,
        models: modelsByUserMessageId.get(t.userMessageId) ?? [],
    }));

    // Load model message histories
    const modelStates = await db
        .select({
            modelId: chatModelStates.modelId,
            messages: chatModelStates.messages,
            updatedAt: chatModelStates.updatedAt,
        })
        .from(chatModelStates)
        .where(eq(chatModelStates.chatId, chatId))
        .orderBy(desc(chatModelStates.updatedAt));

    const modelMessages: Record<string, UIMessage[]> = {};
    for (const ms of modelStates) {
        modelMessages[ms.modelId] = ms.messages as UIMessage[];
    }

    return {
        chatId,
        turns,
        modelMessages,
    };
}
