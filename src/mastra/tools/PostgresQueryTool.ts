import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConnectionString } from "../runtime/Env";
import { Client } from 'pg';

export const PostgresQueryTool = createTool({
    id: 'PostgresQueryTool',
    inputSchema: z.object({
        query: z.string().describe('The Postgres SQL query to execute'),
    }),
    description: 'Use this tool to execute Postgres SQL queries on the PostgreSQL database',
    execute: async ({ query }) => {
        const client = new Client({
            connectionString: ConnectionString,
            connectionTimeoutMillis: 30000, // 30 seconds
            statement_timeout: 60000, // 1 minute
            query_timeout: 60000, // 1 minute
        });

        try {
            console.log('Connecting to PostgreSQL for query execution...');
            await client.connect();
            console.log('Connected to PostgreSQL for query execution');

            const trimmedQuery = query.trim().toLowerCase();
            if (!trimmedQuery.startsWith('select')) {
                throw new Error('Only SELECT queries are allowed for security reasons');
            }

            const result = await client.query(query);

            return {
                success: true,
                data: result.rows,
                rowCount: result.rows.length,
                executedQuery: query,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executedQuery: query,
            };
        } finally {
            await client.end();
        }
    },
});
