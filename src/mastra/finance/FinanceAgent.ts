import { Agent } from '@mastra/core/agent';
import { PostgresQueryTool } from "../tools/PostgresQueryTool";
import { FinanceAgentInstructions } from "./FinanceAgentInstructions";
import { AgentMemory } from "../runtime/AgentMemory";

export const FINANCE_AGENT_ID: string = "finance-agent";

export const FinanceAgent = new Agent({
    id: FINANCE_AGENT_ID,
    name: 'FinanceAgent',
    instructions: FinanceAgentInstructions,
    model: 'openai/gpt-4o',
    memory: AgentMemory,
    tools: {
        PostgresQueryTool
    },
});

