import {type Context, type Env, type Hono} from "hono";
import { firstValueFrom } from "rxjs";

import { ISemanticCoreService } from "./ISemanticCoreService";
import { SemanticCoreHttpError } from "./SemanticCoreClient";

import {
    SemanticCoreCreateDocumentRequestDto,
    SemanticCoreCreateDocumentRequestJson,
} from "./Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreIngestRequestDto, SemanticCoreIngestRequestJson } from "./Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreContentQueryParamsDto } from "./Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "./Dto/SemanticCoreSearchQueryParamsDto";
import type {ContentfulStatusCode} from "hono/utils/http-status"

export class SemanticCoreHttpHandler {
    public constructor(private readonly Service: ISemanticCoreService) { }

    public Register<T extends Env>(App: Hono<T>): void {
        App.post("/documents", this.handleCreateDocument);

        App.post("/documents/:doc_id/ingest", this.handleIngestDocument);

        App.get("/documents/:doc_id/content", this.handleGetDocumentContent);

        App.get("/documents/:doc_id/search", this.handleSearchDocument);
    }

    private handleCreateDocument = async (c: Context) => {
        const json = (await c.req.json()) as SemanticCoreCreateDocumentRequestJson;
        const dto = SemanticCoreCreateDocumentRequestDto.FromJson(json);

        const result = await firstValueFrom(this.Service.PersistDocument(dto));
        return result.Match({
            Ok: (resp: any) => c.json(resp.ToJson(), 200),
            Err: (error: Error) => c.json(this.errorBody(error), this.mapErrorToStatus(error)),
        });
    };

    private handleIngestDocument = async (c: Context) => {
        const docId = c.req.param("doc_id") as string;
        const json = (await c.req.json()) as SemanticCoreIngestRequestJson;
        const dto = SemanticCoreIngestRequestDto.FromJson(json);

        const result = await firstValueFrom(this.Service.DispatchIngestJob(docId, dto));
        return result.Match({
            Ok: (resp: any) => c.json(resp.ToJson(), 200),
            Err: (e: Error) => c.json(this.errorBody(e), this.mapErrorToStatus(e)),
        });
    };

    private handleGetDocumentContent = async (c: Context) => {
        const docId = c.req.param("doc_id") as string;

        const pageRaw = c.req.query("page");
        const modeRaw = c.req.query("mode");

        const params = SemanticCoreContentQueryParamsDto.Create({
            Page: this.parseIntOrNull(pageRaw),
            Mode: modeRaw ?? null,
        });

        const result = await firstValueFrom(this.Service.FetchDocumentContent(docId, params));
        return result.Match({
            Ok: (body: Record<string, unknown>) => c.json(body, 200),
            Err: (e: Error) => c.json(this.errorBody(e), this.mapErrorToStatus(e)),
        });
    };

    private handleSearchDocument = async (c: Context) => {
        const docId = c.req.param("doc_id") as string;

        const query = c.req.query("query");
        if (!query) {
            return c.json({ Error: "Missing required query param: query" }, 400);
        }

        const pageRaw = c.req.query("page");
        const limitRaw = c.req.query("limit");

        const params = SemanticCoreSearchQueryParamsDto.Create({
            Query: query,
            Page: this.parseIntOrNull(pageRaw),
            Limit: this.parseIntOrNull(limitRaw),
        });

        const result = await firstValueFrom(this.Service.SearchDocument(docId, params));
        return result.Match({
            Ok: (body: Record<string, unknown>) => c.json(body, 200),
            Err: (e: Error) => c.json(this.errorBody(e), this.mapErrorToStatus(e)),
        });
    };

    private parseIntOrNull(value: string | undefined): number | null {
        if (value === undefined) return null;
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) ? n : null;
    }

    private mapErrorToStatus(error: Error): ContentfulStatusCode {
        if (error instanceof SemanticCoreHttpError) {
            const status = error.StatusCode();
            return status >= 400 && status <= 599
                ? status as ContentfulStatusCode
                : 502;
        }
        return 502;
    }

    private errorBody(error: Error): Record<string, unknown> {
        if (error instanceof SemanticCoreHttpError) {
            return {
                Error: error.message,
                UpstreamStatusCode: error.StatusCode(),
                UpstreamBodyText: error.BodyText(),
            };
        }
        return { Error: error.message };
    }
}
