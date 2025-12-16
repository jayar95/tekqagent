import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { firstValueFrom } from "rxjs";

import { SemanticCoreClient, SemanticCoreHttpError } from "../SemanticCoreClient";
import { SemanticCoreCreateDocumentRequestDto } from "../Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreIngestRequestDto } from "../Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreContentQueryParamsDto } from "../Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "../Dto/SemanticCoreSearchQueryParamsDto";

import { Result } from "../../../Utility/Result";

function UnwrapOk<T>(r: Result<T, Error>): T {
    return r.Match({
        Ok: (v) => v,
        Err: (e) => {
            throw e;
        },
    });
}

function UnwrapErr<T>(r: Result<T, Error>): Error {
    return r.Match({
        Ok: () => {
            throw new Error("Expected Err");
        },
        Err: (e) => e,
    });
}

describe("SemanticCoreClient", () => {
    const baseUrl = "http://semantic-core";
    let fetchMock: any;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("ProbeHealth returns Ok(JSON string)", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify("OK"), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        expect(UnwrapOk(result)).toBe("OK");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/healthcheck`);
        expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    });

    it("PersistDocument sends JSON body and maps to DTO", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    doc_id: "d1",
                    upload_url: "https://u",
                    upload_method: "PUT",
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const client = new SemanticCoreClient(baseUrl);
        const req = SemanticCoreCreateDocumentRequestDto.Create({
            FileName: "10k.pdf",
            MimeType: "application/pdf",
            Source: "user",
        });

        const result = await firstValueFrom(client.PersistDocument(req));
        const dto = UnwrapOk(result);

        expect(dto.DocId).toBe("d1");
        expect(dto.UploadMethod).toBe("PUT");

        const init = fetchMock.mock.calls[0][1];
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ file_name: "10k.pdf", mime_type: "application/pdf", source: "user" }));
    });

    it("DispatchIngestJob encodes DocId and posts body", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ job_id: "j1", doc_id: "d/1", queued: true }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const client = new SemanticCoreClient(baseUrl);
        const req = SemanticCoreIngestRequestDto.Create({ UnstructuredStrategy: "hi", EmbeddingModel: "gte" });

        const result = await firstValueFrom(client.DispatchIngestJob("d/1", req));
        const dto = UnwrapOk(result);

        expect(dto.JobId).toBe("j1");
        expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/v1/documents/${encodeURIComponent("d/1")}/ingest`);
    });

    it("FetchDocumentContent builds query string and omits nulls", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ Any: "Thing" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const client = new SemanticCoreClient(baseUrl);
        const params = SemanticCoreContentQueryParamsDto.Create({ Page: 2, Mode: null });

        const result = await firstValueFrom(client.FetchDocumentContent("d1", params));
        expect(UnwrapOk(result)).toEqual({ Any: "Thing" });

        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toBe(`${baseUrl}/v1/documents/d1/content?page=2`);
    });

    it("Missing content-type header treats as plain text", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("some text", { status: 200, headers: { "content-type": "" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        expect(UnwrapOk(result)).toBe("some text");
    });

    it("FetchDocumentContent with no params produces no query string", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({}), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const client = new SemanticCoreClient(baseUrl);
        const params = SemanticCoreContentQueryParamsDto.Create({ Page: null, Mode: null });

        await firstValueFrom(client.FetchDocumentContent("d1", params));

        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toBe(`${baseUrl}/v1/documents/d1/content`);
    });

    it("SearchDocument builds query string with required query only when others null", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ Hits: [] }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        const client = new SemanticCoreClient(baseUrl);
        const params = SemanticCoreSearchQueryParamsDto.Create({ Query: "hello", Page: null, Limit: null });

        const result = await firstValueFrom(client.SearchDocument("d1", params));
        expect(UnwrapOk(result)).toEqual({ Hits: [] });

        const url = fetchMock.mock.calls[0][0] as string;
        expect(url).toBe(`${baseUrl}/v1/documents/d1/search?query=hello`);
    });

    it("Non-JSON content-type returns text body", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("PLAIN", { status: 200, headers: { "content-type": "text/plain" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        expect(UnwrapOk(result)).toBe("PLAIN");
    });

    it("Empty body returns Ok(undefined)", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("", { status: 200, headers: { "content-type": "application/json" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        expect(UnwrapOk(result)).toBe(undefined);
    });

    it("Invalid JSON returns Err(parse error)", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("not-json", { status: 200, headers: { "content-type": "application/json" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        const err = UnwrapErr(result);
        expect(err.message).toContain("Failed to parse JSON");
    });

    it("PersistDocument returns Err when upstream fails", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("fail", { status: 500, headers: { "content-type": "text/plain" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const req = SemanticCoreCreateDocumentRequestDto.Create({
            FileName: "10k.pdf",
            MimeType: "application/pdf",
            Source: "user",
        });

        const result = await firstValueFrom(client.PersistDocument(req));
        const err = UnwrapErr(result);
        expect(err).toBeInstanceOf(SemanticCoreHttpError);
    });

    it("DispatchIngestJob returns Err when upstream fails", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("fail", { status: 500, headers: { "content-type": "text/plain" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const req = SemanticCoreIngestRequestDto.Create({ UnstructuredStrategy: "hi", EmbeddingModel: "gte" });

        const result = await firstValueFrom(client.DispatchIngestJob("d1", req));
        const err = UnwrapErr(result);
        expect(err).toBeInstanceOf(SemanticCoreHttpError);
    });

    it("Non-2xx returns Err(SemanticCoreHttpError)", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response("fail", { status: 500, headers: { "content-type": "text/plain" } })
        );

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        const err = UnwrapErr(result);
        expect(err).toBeInstanceOf(SemanticCoreHttpError);
        const httpErr = err as SemanticCoreHttpError;
        expect(httpErr.StatusCode()).toBe(500);
        expect(httpErr.BodyText()).toBe("fail");
    });

    it("Fetch throws returns Err(network)", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network"));

        const client = new SemanticCoreClient(baseUrl);
        const result = await firstValueFrom(client.ProbeHealth());

        const err = UnwrapErr(result);
        expect(err.message).toBe("network");
    });
});
