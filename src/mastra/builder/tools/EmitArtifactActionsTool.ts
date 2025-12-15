import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * The builder agents MUST call this tool exactly once per request
 * to provide the "CRUD-like" action payload the frontend will apply.
 */
export const EmitArtifactActionsTool = createTool({
    id: "EmitArtifactActionsTool",
    description:
        "Emit artifact actions for the client to apply (deck/doc builder). Call exactly once with assistantMessage + actions.",
    inputSchema: z.object({
        assistantMessage: z.string(),
        actions: z.array(z.unknown()),
    }),
    execute: async (payload) => {
        // Server is the source of truth for tool results:
        // return exactly what the model requested.
        return payload;
    },
});
