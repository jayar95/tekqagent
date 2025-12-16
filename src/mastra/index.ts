import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Observability, SensitiveDataFilter, DefaultExporter } from '@mastra/observability';
import { FinanceAgent } from "./finance/FinanceAgent";
import { FinanceMastraStorage } from "./runtime/FinanceMastraStorage";
import { PptxBuilderAgent } from "./builder/PptxBuilderAgent";
import { DocxBuilderAgent } from "./builder/DocxBuilderAgent";

export const mastra = new Mastra({
    agents: {
        FinanceAgent,
        PptxBuilderAgent,
        DocxBuilderAgent,
    },
    storage: FinanceMastraStorage,
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    observability: new Observability({
        configs: {
            default: {
                serviceName: "mastra",
                sampling: { type: "always" },
                spanOutputProcessors: [new SensitiveDataFilter()],
                exporters: [new DefaultExporter()],
            },
        },
    }),
});
