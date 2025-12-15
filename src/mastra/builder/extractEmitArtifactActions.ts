import type { UIMessage } from "ai";

export type EmitArtifactActionsPayload = {
    assistantMessage: string;
    actions: unknown[];
};

/**
 * Finds the most recent assistant message containing the EmitArtifactActions tool output.
 */
export function extractEmitArtifactActionsPayload(messages: UIMessage[]): EmitArtifactActionsPayload | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (!msg || msg.role !== "assistant") continue;

        const parts = (msg.parts ?? []) as any[];

        // In AI SDK 5, tool parts are typed like: `tool-${toolName}`
        // Your frontend already uses `includes("EmitArtifactActions")`, so we mirror it.
        const toolPart = parts.find(
            (p) => p && typeof p.type === "string" && p.type.includes("EmitArtifactActions"),
        );

        const output = toolPart?.output;
        if (!output || typeof output !== "object") continue;

        const assistantMessage = (output as any).assistantMessage;
        const actions = (output as any).actions;

        if (typeof assistantMessage !== "string") continue;
        if (!Array.isArray(actions)) continue;

        return { assistantMessage, actions };
    }

    return null;
}
