import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from 'hono/cors'
import { HonoBindings, HonoVariables } from "@mastra/hono";
import { StreamFinanceAgentAiSdk } from "./Http/FinanceHttpHandler";
import { RegisterHonoMastraServer } from "./mastra/Hono";
import { CreateChat, GetChat } from "./Http/ChatHttpHandler";
import { StreamPptxBuilderAiSdk } from "./Http/PptxBuilderHttpHandler";
import { StreamDocxBuilderAiSdk } from "./Http/DocxBuilderHttpHandler";
import {SemanticCoreModule} from "./Domain/SemanticCore/SemanticCoreModule";

type HonoMastraServerBindings = {
    Bindings: HonoBindings;
    Variables: HonoVariables;
}

const app = new Hono<HonoMastraServerBindings>();
app.use(cors());

await RegisterHonoMastraServer(app);

const semanticCoreBaseUrl = process.env.SEMANTIC_CORE_BASE_URL ?? "http://localhost:8080";

SemanticCoreModule.Create({
  BaseUrl: semanticCoreBaseUrl,
  TimeoutMs: 360_000,
  RoutePrefix: "/backend-api/semantic-core",
}).Register(app);

app.post('/backend-api/finance-agent', StreamFinanceAgentAiSdk)
app.post("/backend-api/pptx-agent", StreamPptxBuilderAiSdk);
app.post("/backend-api/docx-agent", StreamDocxBuilderAiSdk);

app.post("/backend-api/chats", CreateChat);
app.get("/backend-api/chats/:chatId", GetChat);

serve({ fetch: app.fetch, port: 4111 }, () => {
    console.log('Server running on port 4111');
});
