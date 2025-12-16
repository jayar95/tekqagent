import { describe, it, expect } from "vitest";

import { SemanticCoreCreateDocumentRequestDto } from "../Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreCreateDocumentResponseDto } from "../Dto/SemanticCoreCreateDocumentResponseDto";
import { SemanticCoreIngestRequestDto } from "../Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreIngestResponseDto } from "../Dto/SemanticCoreIngestResponseDto";
import { SemanticCoreContentQueryParamsDto } from "../Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "../Dto/SemanticCoreSearchQueryParamsDto";

describe("SemanticCore DTOs", () => {
    it("CreateDocumentRequestDto FromJson/ToJson roundtrip", () => {
        const dto = SemanticCoreCreateDocumentRequestDto.FromJson({
            file_name: "10k.pdf",
            mime_type: "application/pdf",
            source: null,
        });

        expect(dto.FileName).toBe("10k.pdf");
        expect(dto.MimeType).toBe("application/pdf");
        expect(dto.Source).toBeNull();

        expect(dto.ToJson()).toEqual({
            file_name: "10k.pdf",
            mime_type: "application/pdf",
            source: null,
        });
    });

    it("CreateDocumentRequestDto Create defaults Source to null", () => {
        const dto = SemanticCoreCreateDocumentRequestDto.Create({
            FileName: "x",
            MimeType: "y",
        });
        expect(dto.Source).toBeNull();
    });

    it("CreateDocumentResponseDto FromJson/ToJson", () => {
        const dto = SemanticCoreCreateDocumentResponseDto.FromJson({
            doc_id: "d1",
            upload_url: "https://u",
            upload_method: "PUT",
        });

        expect(dto.DocId).toBe("d1");
        expect(dto.UploadUrl).toBe("https://u");
        expect(dto.UploadMethod).toBe("PUT");

        expect(dto.ToJson()).toEqual({
            doc_id: "d1",
            upload_url: "https://u",
            upload_method: "PUT",
        });
    });

    it("IngestRequestDto Create defaults fields to null", () => {
        const dto = SemanticCoreIngestRequestDto.Create();
        expect(dto.UnstructuredStrategy).toBeNull();
        expect(dto.EmbeddingModel).toBeNull();
        expect(dto.ToJson()).toEqual({
            unstructured_strategy: null,
            embedding_model: null,
        });
    });

    it("IngestRequestDto FromJson/ToJson", () => {
        const dto = SemanticCoreIngestRequestDto.FromJson({
            unstructured_strategy: "hi_res",
            embedding_model: "gte-small",
        });

        expect(dto.UnstructuredStrategy).toBe("hi_res");
        expect(dto.EmbeddingModel).toBe("gte-small");

        expect(dto.ToJson()).toEqual({
            unstructured_strategy: "hi_res",
            embedding_model: "gte-small",
        });
    });

    it("IngestResponseDto FromJson/ToJson", () => {
        const dto = SemanticCoreIngestResponseDto.FromJson({
            job_id: "j1",
            doc_id: "d1",
            queued: true,
        });

        expect(dto.JobId).toBe("j1");
        expect(dto.DocId).toBe("d1");
        expect(dto.Queued).toBe(true);

        expect(dto.ToJson()).toEqual({
            job_id: "j1",
            doc_id: "d1",
            queued: true,
        });
    });

    it("ContentQueryParamsDto Create defaults to nulls", () => {
        const dto = SemanticCoreContentQueryParamsDto.Create();
        expect(dto.Page).toBeNull();
        expect(dto.Mode).toBeNull();
    });

    it("SearchQueryParamsDto Create defaults Page/Limit to null", () => {
        const dto = SemanticCoreSearchQueryParamsDto.Create({ Query: "q" });
        expect(dto.Query).toBe("q");
        expect(dto.Page).toBeNull();
        expect(dto.Limit).toBeNull();
    });
});
