CREATE TABLE IF NOT EXISTS chats (
    id              UUID PRIMARY KEY,
    user_id         UUID,
    created_at      TIMESTAMPTZ NOT NULL
                        DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL
                        DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
);

CREATE INDEX IF NOT EXISTS idx_chats_owner ON chats (user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id                  UUID PRIMARY KEY,
    chat_id             UUID NOT NULL
                            REFERENCES chats(id),
    role                TEXT NOT NULL,
    parent_message_id   UUID
                            REFERENCES chat_messages(id),
    created_at          TIMESTAMPTZ NOT NULL
                            DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created
    ON chat_messages (chat_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_parent_message_id
    ON chat_messages (chat_id, parent_message_id);

CREATE TABLE IF NOT EXISTS chat_message_parts (
    id              UUID PRIMARY KEY,
    message_id      UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    part_type       TEXT,
    content         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
);
