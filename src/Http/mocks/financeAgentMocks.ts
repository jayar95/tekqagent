import type { UIMessage } from "ai";

/**
 * Mock requests for StreamFinanceAgentAiSdk endpoint
 */

// Simple single user message
export const mockSimpleUserMessage: { messages: UIMessage[] } = {
    messages: [
        {
            id: "msg-001",
            role: "user",
            content: "What is my current account balance?",
            parts: [{ type: "text", text: "What is my current account balance?" }],
        },
    ],
};

// Multi-turn conversation mock
export const mockMultiTurnConversation: { messages: UIMessage[] } = {
    messages: [
        {
            id: "msg-001",
            role: "user",
            content: "Show me my recent transactions",
            parts: [{ type: "text", text: "Show me my recent transactions" }],
        },
        {
            id: "msg-002",
            role: "assistant",
            content: "Here are your recent transactions:\n1. $50.00 - Amazon\n2. $120.00 - Electric Bill\n3. $35.50 - Gas Station",
            parts: [{ type: "text", text: "Here are your recent transactions:\n1. $50.00 - Amazon\n2. $120.00 - Electric Bill\n3. $35.50 - Gas Station" }],
        },
        {
            id: "msg-003",
            role: "user",
            content: "What was my total spending this month?",
            parts: [{ type: "text", text: "What was my total spending this month?" }],
        },
    ],
};

// Investment query mock
export const mockInvestmentQuery: { messages: UIMessage[] } = {
    messages: [
        {
            id: "msg-001",
            role: "user",
            content: "What stocks should I consider for my retirement portfolio?",
            parts: [{ type: "text", text: "What stocks should I consider for my retirement portfolio?" }],
        },
    ],
};

// Budget analysis mock
export const mockBudgetAnalysis: { messages: UIMessage[] } = {
    messages: [
        {
            id: "msg-001",
            role: "user",
            content: "Analyze my spending patterns and suggest a budget",
            parts: [{ type: "text", text: "Analyze my spending patterns and suggest a budget" }],
        },
    ],
};

// Empty message (edge case)
export const mockEmptyMessages: { messages: UIMessage[] } = {
    messages: [],
};

// Long conversation history mock
export const mockLongConversation: { messages: UIMessage[] } = {
    messages: [
        {
            id: "msg-001",
            role: "user",
            content: "I need help with financial planning",
            parts: [{ type: "text", text: "I need help with financial planning" }],
        },
        {
            id: "msg-002",
            role: "assistant",
            content: "I'd be happy to help with your financial planning. What specific areas would you like to focus on?",
            parts: [{ type: "text", text: "I'd be happy to help with your financial planning. What specific areas would you like to focus on?" }],
        },
        {
            id: "msg-003",
            role: "user",
            content: "I want to save for a house down payment",
            parts: [{ type: "text", text: "I want to save for a house down payment" }],
        },
        {
            id: "msg-004",
            role: "assistant",
            content: "Great goal! How much are you looking to save, and what's your target timeline?",
            parts: [{ type: "text", text: "Great goal! How much are you looking to save, and what's your target timeline?" }],
        },
        {
            id: "msg-005",
            role: "user",
            content: "I need $50,000 in the next 2 years",
            parts: [{ type: "text", text: "I need $50,000 in the next 2 years" }],
        },
    ],
};
