-- chats: base chat sessions
create table if not exists chats (
                                     id text primary key,
                                     created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
    );

-- one row per (chat_id, model_id): stores full UIMessage[] for that model-thread
create table if not exists chat_model_states (
                                                 chat_id text not null references chats(id) on delete cascade,
    model_id text not null,
    messages jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (chat_id, model_id)
    );

create index if not exists chat_model_states_chat_id_idx
    on chat_model_states(chat_id);

-- one row per user turn (user message), in the order we first observed it
create table if not exists chat_turns (
                                          chat_id text not null references chats(id) on delete cascade,
    user_message_id text not null,
    user_message jsonb not null,
    created_at timestamptz not null default now(),
    primary key (chat_id, user_message_id)
    );

create index if not exists chat_turns_chat_created_at_idx
    on chat_turns(chat_id, created_at);

-- many-to-many: which models have a response for that user turn
create table if not exists chat_turn_models (
                                                chat_id text not null references chats(id) on delete cascade,
    user_message_id text not null,
    model_id text not null,
    created_at timestamptz not null default now(),
    primary key (chat_id, user_message_id, model_id)
    );

create index if not exists chat_turn_models_chat_turn_idx
    on chat_turn_models(chat_id, user_message_id);

CREATE TABLE IF NOT EXISTS "chat_artifacts" (
                                                "chat_id" text NOT NULL,
                                                "artifact_type" text NOT NULL, -- "docx" | "pptx"
                                                "state" jsonb NOT NULL,
                                                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,

    -- Primary Key Constraint
    CONSTRAINT "chat_artifacts_pkey" PRIMARY KEY ("chat_id", "artifact_type"),

    -- Foreign Key Constraint
    CONSTRAINT "chat_artifacts_chat_id_fkey" FOREIGN KEY ("chat_id")
    REFERENCES "chats"("id")
                           ON DELETE CASCADE
    );

-- Index Definition
CREATE INDEX IF NOT EXISTS "chat_artifacts_chat_id_idx"
    ON "chat_artifacts" USING btree ("chat_id" ASC NULLS LAST);

CREATE TABLE IF NOT EXISTS chat_deck_states (
                                                chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    deck JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
CREATE INDEX IF NOT EXISTS chat_deck_states_chat_id_idx ON chat_deck_states(chat_id);

CREATE TABLE IF NOT EXISTS chat_doc_states (
                                               chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    doc JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
CREATE INDEX IF NOT EXISTS chat_doc_states_chat_id_idx ON chat_doc_states(chat_id);