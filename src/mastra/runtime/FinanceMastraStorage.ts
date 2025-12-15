import { LibSQLStore } from "@mastra/libsql";

// Not sure how I feel about this atm
export const FinanceMastraStorage = new LibSQLStore({
    id: "finance-mastra-storage",
    url: ":memory:",
});
