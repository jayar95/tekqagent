import { describe, it, expect, vi } from "vitest";
import { of } from "rxjs";


import { Result } from "../../../Utility/Result";

import { SemanticCoreServiceImpl } from "../SemanticCoreServiceImpl";
import { SemanticCoreCreateDocumentRequestDto } from "../Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreIngestRequestDto } from "../Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreContentQueryParamsDto } from "../Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "../Dto/SemanticCoreSearchQueryParamsDto";

describe("SemanticCoreServiceImpl", () => {
    it("Passes through to repo", () => {
        const repo = {
            ProbeHealth: vi.fn(() => of(Result.Ok("OK"))),
            PersistDocument: vi.fn(() => of(Result.Ok({} as any))),
            DispatchIngestJob: vi.fn(() => of(Result.Ok({} as any))),
            FetchDocumentContent: vi.fn(() => of(Result.Ok({}))),
            SearchDocument: vi.fn(() => of(Result.Ok({}))),
        } as any;

        const svc = new SemanticCoreServiceImpl(repo);

        svc.ProbeHealth();
        svc.PersistDocument(SemanticCoreCreateDocumentRequestDto.Create({ FileName: "f", MimeType: "m" }));
        svc.DispatchIngestJob("d1", SemanticCoreIngestRequestDto.Create());
        svc.FetchDocumentContent("d1", SemanticCoreContentQueryParamsDto.Create());
        svc.SearchDocument("d1", SemanticCoreSearchQueryParamsDto.Create({ Query: "q" }));

        expect(repo.ProbeHealth).toHaveBeenCalled();
        expect(repo.PersistDocument).toHaveBeenCalled();
        expect(repo.DispatchIngestJob).toHaveBeenCalled();
        expect(repo.FetchDocumentContent).toHaveBeenCalled();
        expect(repo.SearchDocument).toHaveBeenCalled();
    });
});
