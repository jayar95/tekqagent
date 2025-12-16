import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { of } from "rxjs";

import { Result } from "../../../Utility/Result";

import { SemanticCoreHttpHandler } from "../SemanticCoreHttpHandler";
import { SemanticCoreHttpError } from "../SemanticCoreClient";
import { ISemanticCoreService } from "../ISemanticCoreService";

import { SemanticCoreCreateDocumentResponseDto } from "../Dto/SemanticCoreCreateDocumentResponseDto";
import { SemanticCoreIngestResponseDto } from "../Dto/SemanticCoreIngestResponseDto";

function MakeApp(service: ISemanticCoreService): Hono {
    const app = new Hono();
    new SemanticCoreHttpHandler(service).Register(app);
    return app;
}

describe("SemanticCoreHttpHandler", () => {
    it("POST /documents -> 200", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: (req) => {
                expect(req.FileName).toBe("10k.pdf");
                return of(
                    Result.Ok(
                        SemanticCoreCreateDocumentResponseDto.FromJson({
                            doc_id: "d1",
                            upload_url: "https://u",
                            upload_method: "PUT",
                        })
                    )
                );
            },
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ file_name: "10k.pdf", mime_type: "application/pdf", source: null }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            doc_id: "d1",
            upload_url: "https://u",
            upload_method: "PUT",
        });
    });

    it("POST /documents/:doc_id/ingest -> 200", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: (docId, req) => {
                expect(docId).toBe("d/1");
                expect(req.UnstructuredStrategy).toBe("hi_res");
                return of(
                    Result.Ok(
                        SemanticCoreIngestResponseDto.FromJson({
                            job_id: "j1",
                            doc_id: "d/1",
                            queued: true,
                        })
                    )
                );
            },
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request(`/documents/${encodeURIComponent("d/1")}/ingest`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ unstructured_strategy: "hi_res", embedding_model: null }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ job_id: "j1", doc_id: "d/1", queued: true });
    });

    it("GET /documents/:doc_id/content -> parses ints + invalid ints become null", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: (docId, params) => {
                expect(docId).toBe("d1");
                expect(params.Page).toBeNull(); // page=abc
                expect(params.Mode).toBe("full");
                return of(Result.Ok({ Content: true }));
            },
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/content?page=abc&mode=full");

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ Content: true });
    });

    it("GET /documents/:doc_id/search -> missing query returns 400", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/search?page=1");

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ Error: "Missing required query param: query" });
    });

    it("GET /documents/:doc_id/search -> parses page/limit", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: (docId, params) => {
                expect(docId).toBe("d1");
                expect(params.Query).toBe("hi");
                expect(params.Page).toBe(2);
                expect(params.Limit).toBe(50);
                return of(Result.Ok({ Hits: [] }));
            },
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/search?query=hi&page=2&limit=50");

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ Hits: [] });
    });

    it("POST /documents returns error on service failure", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: () => of(Result.Err(new Error("persist failed"))),
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ file_name: "f", mime_type: "m" }),
        });

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ Error: "persist failed" });
    });

    it("POST /documents/:doc_id/ingest returns error on service failure", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: () => of(Result.Err(new Error("ingest failed"))),
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/ingest", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ Error: "ingest failed" });
    });

    it("GET /documents/:doc_id/content returns error on service failure", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: () => of(Result.Err(new Error("content failed"))),
            SearchDocument: vi.fn() as any,
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/content");

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ Error: "content failed" });
    });

    it("GET /documents/:doc_id/search returns error on service failure", async () => {
        const service: ISemanticCoreService = {
            ProbeHealth: vi.fn() as any,
            PersistDocument: vi.fn() as any,
            DispatchIngestJob: vi.fn() as any,
            FetchDocumentContent: vi.fn() as any,
            SearchDocument: () => of(Result.Err(new Error("search failed"))),
        };

        const app = MakeApp(service);
        const res = await app.request("/documents/d1/search?query=x");

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ Error: "search failed" });
    });
});
