import { Agent } from "@mastra/core/agent";
import { AgentMemory } from "../runtime/AgentMemory";
import { EmitArtifactActionsTool } from "./tools/EmitArtifactActionsTool";
import { DocxBuilderAgentInstructions } from "./DocxBuilderAgentInstructions";

export const DOCX_BUILDER_AGENT_ID = "docx-builder-agent";

export const DocxBuilderAgent = new Agent({
    id: DOCX_BUILDER_AGENT_ID,
    name: "DocxBuilderAgent",
    instructions: DocxBuilderAgentInstructions,
    model: "openai/gpt-4o",
    memory: AgentMemory,
    tools: {
        EmitArtifactActionsTool,
    },
});
