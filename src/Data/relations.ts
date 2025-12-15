import { relations } from "drizzle-orm/relations";
import { chats, chatTurns, chatTurnModels, chatModelStates } from "./schema";

export const chatTurnsRelations = relations(chatTurns, ({one}) => ({
	chat: one(chats, {
		fields: [chatTurns.chatId],
		references: [chats.id]
	}),
}));

export const chatsRelations = relations(chats, ({many}) => ({
	chatTurns: many(chatTurns),
	chatTurnModels: many(chatTurnModels),
	chatModelStates: many(chatModelStates),
}));

export const chatTurnModelsRelations = relations(chatTurnModels, ({one}) => ({
	chat: one(chats, {
		fields: [chatTurnModels.chatId],
		references: [chats.id]
	}),
}));

export const chatModelStatesRelations = relations(chatModelStates, ({one}) => ({
	chat: one(chats, {
		fields: [chatModelStates.chatId],
		references: [chats.id]
	}),
}));