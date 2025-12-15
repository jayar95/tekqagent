import { pgTable, text, timestamp, index, foreignKey, primaryKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { UIMessage } from "ai";
import type { Deck, Doc } from "../mastra/builder/types";



export const chats = pgTable("chats", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatTurns = pgTable("chat_turns", {
	chatId: text("chat_id").notNull(),
	userMessageId: text("user_message_id").notNull(),
	userMessage: jsonb("user_message").$type<UIMessage>().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("chat_turns_chat_created_at_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.chatId],
		foreignColumns: [chats.id],
		name: "chat_turns_chat_id_fkey"
	}).onDelete("cascade"),
	primaryKey({ columns: [table.userMessageId, table.chatId], name: "chat_turns_pkey" }),
]);

export const chatTurnModels = pgTable("chat_turn_models", {
	chatId: text("chat_id").notNull(),
	userMessageId: text("user_message_id").notNull(),
	modelId: text("model_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("chat_turn_models_chat_turn_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops"), table.userMessageId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.chatId],
		foreignColumns: [chats.id],
		name: "chat_turn_models_chat_id_fkey"
	}).onDelete("cascade"),
	primaryKey({ columns: [table.userMessageId, table.modelId, table.chatId], name: "chat_turn_models_pkey" }),
]);

export const chatModelStates = pgTable("chat_model_states", {
	chatId: text("chat_id").notNull(),
	modelId: text("model_id").notNull(),
	messages: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("chat_model_states_chat_id_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.chatId],
		foreignColumns: [chats.id],
		name: "chat_model_states_chat_id_fkey"
	}).onDelete("cascade"),
	primaryKey({ columns: [table.modelId, table.chatId], name: "chat_model_states_pkey" }),
]);

export const chatDeckStates = pgTable(
	"chat_deck_states",
	{
		chatId: text("chat_id").notNull(),
		deck: jsonb("deck").$type<Deck>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("chat_deck_states_chat_id_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "chat_deck_states_chat_id_fkey",
		}).onDelete("cascade"),
		primaryKey({ columns: [table.chatId], name: "chat_deck_states_pkey" }),
	],
);

export const chatDocStates = pgTable(
	"chat_doc_states",
	{
		chatId: text("chat_id").notNull(),
		doc: jsonb("doc").$type<Doc>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("chat_doc_states_chat_id_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "chat_doc_states_chat_id_fkey",
		}).onDelete("cascade"),
		primaryKey({ columns: [table.chatId], name: "chat_doc_states_pkey" }),
	],
);
