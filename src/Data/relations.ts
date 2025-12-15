import { relations } from "drizzle-orm/relations";
import { chats, chatTurns, chatTurnModels, chatModelStates, chatDeckStates, chatDocStates } from "./schema";

export const chatTurnsRelations = relations(chatTurns, ({ one }) => ({
	chat: one(chats, {
		fields: [chatTurns.chatId],
		references: [chats.id]
	}),
}));

export const chatsRelations = relations(chats, ({ many, one }) => ({
	chatTurns: many(chatTurns),
	chatTurnModels: many(chatTurnModels),
	chatModelStates: many(chatModelStates),

	// one-to-one “artifact states”
	deckState: one(chatDeckStates, { fields: [chats.id], references: [chatDeckStates.chatId] }),
	docState: one(chatDocStates, { fields: [chats.id], references: [chatDocStates.chatId] }),
}));

export const chatTurnModelsRelations = relations(chatTurnModels, ({ one }) => ({
	chat: one(chats, {
		fields: [chatTurnModels.chatId],
		references: [chats.id]
	}),
}));

export const chatModelStatesRelations = relations(chatModelStates, ({ one }) => ({
	chat: one(chats, {
		fields: [chatModelStates.chatId],
		references: [chats.id]
	}),
}));

export const chatDeckStatesRelations = relations(chatDeckStates, ({ one }) => ({
	chat: one(chats, {
		fields: [chatDeckStates.chatId],
		references: [chats.id],
	}),
}));

export const chatDocStatesRelations = relations(chatDocStates, ({ one }) => ({
	chat: one(chats, {
		fields: [chatDocStates.chatId],
		references: [chats.id],
	}),
}));