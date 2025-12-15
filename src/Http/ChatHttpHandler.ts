import type { Context } from "hono";
import { generateId } from "ai";
import { getChatById, upsertChat } from "../Data/ChatRepository";

// POST /backend-api/chats  -> { chatId }
export const CreateChat = async (c: Context) => {
    const chatId = generateId();
    await upsertChat(chatId);
    return c.json({ chatId }, 201);
};

// GET /backend-api/chats/:chatId -> { chatId, turns, modelMessages }
export const GetChat = async (c: Context) => {
    const chatId = c.req.param("chatId");

    const chat = await getChatById(chatId);
    if (!chat) {
        return c.json({ error: "chat_not_found" }, 404);
    }

    return c.json(chat);
};
