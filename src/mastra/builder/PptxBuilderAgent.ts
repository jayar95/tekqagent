import { Agent } from "@mastra/core/agent";
import { AgentMemory } from "../runtime/AgentMemory";
import { EmitArtifactActionsTool } from "./tools/EmitArtifactActionsTool";
import { PptxBuilderAgentInstructions } from "./PptxBuilderAgentInstructions";

export const PPTX_BUILDER_AGENT_ID = "pptx-builder-agent";

export const PptxBuilderAgent = new Agent({
    id: PPTX_BUILDER_AGENT_ID,
    name: "PptxBuilderAgent",
    instructions: PptxBuilderAgentInstructions,
    model: "openai/gpt-4o",
    memory: AgentMemory,
    tools: {
        EmitArtifactActionsTool,
    },
});
