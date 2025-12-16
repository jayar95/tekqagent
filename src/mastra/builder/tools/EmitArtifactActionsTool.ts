import { createTool } from "@mastra/core/tools";
import { z } from "zod";


export const EmitArtifactActionsTool = createTool({
    id: "EmitArtifactActionsTool",
    description:
        "Emit artifact actions for the client to apply (deck/doc builder). Call exactly once with assistantMessage + actions.",
    inputSchema: z.object({
        assistantMessage: z.string(),
        actions: z.array(z.unknown()),
    }),
    execute: async (payload) => payload,
});
