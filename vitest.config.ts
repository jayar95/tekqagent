import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            include: ["src/Domain/SemanticCore/**/*.ts"],
            exclude: [
                "**/*.d.ts",
                "**/*.test.ts",
                "**/__tests__/**",
                "**/node_modules/**",
                "**/dist/**",
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                statements: 70,
                branches: 70,
            },
        },
    },
});
