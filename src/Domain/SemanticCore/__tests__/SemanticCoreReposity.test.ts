import { describe, it, expect, vi } from "vitest";
import { of } from "rxjs";

import { Result } from "../../../Utility/Result";

import { SemanticCoreRepository } from "../SemanticCoreRepository";
import { SemanticCoreCreateDocumentRequestDto } from "../Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreIngestRequestDto } from "../Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreContentQueryParamsDto } from "../Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "../Dto/SemanticCoreSearchQueryParamsDto";

describe("SemanticCoreRepository", () => {
    it("Passes through to client", async () => {
        const client = {
            ProbeHealth: vi.fn(() => of(Result.Ok("OK"))),
            PersistDocument: vi.fn(() => of(Result.Err(new Error("x")))),
            DispatchIngestJob: vi.fn(() => of(Result.Err(new Error("y")))),
            FetchDocumentContent: vi.fn(() => of(Result.Ok({}))),
            SearchDocument: vi.fn(() => of(Result.Ok({}))),
        } as any;

        const repo = new SemanticCoreRepository(client);

        repo.ProbeHealth();
        repo.PersistDocument(SemanticCoreCreateDocumentRequestDto.Create({ FileName: "f", MimeType: "m" }));
        repo.DispatchIngestJob("d1", SemanticCoreIngestRequestDto.Create());
        repo.FetchDocumentContent("d1", SemanticCoreContentQueryParamsDto.Create());
        repo.SearchDocument("d1", SemanticCoreSearchQueryParamsDto.Create({ Query: "q" }));

        expect(client.ProbeHealth).toHaveBeenCalled();
        expect(client.PersistDocument).toHaveBeenCalled();
        expect(client.DispatchIngestJob).toHaveBeenCalled();
        expect(client.FetchDocumentContent).toHaveBeenCalled();
        expect(client.SearchDocument).toHaveBeenCalled();
    });
});
