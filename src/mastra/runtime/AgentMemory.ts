import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

export const AgentMemory = new Memory({
    storage: new LibSQLStore({
        id: 'memory-storage',
        url: 'file:../mastra.db',
    }),
});
