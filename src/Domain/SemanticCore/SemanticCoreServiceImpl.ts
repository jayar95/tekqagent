import { Observable } from "rxjs";

import { Result } from "../../Utility/Result";

import { ISemanticCoreService } from "./ISemanticCoreService";
import { SemanticCoreRepository } from "./SemanticCoreRepository";

import { SemanticCoreCreateDocumentRequestDto } from "./Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreCreateDocumentResponseDto } from "./Dto/SemanticCoreCreateDocumentResponseDto";
import { SemanticCoreIngestRequestDto } from "./Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreIngestResponseDto } from "./Dto/SemanticCoreIngestResponseDto";
import { SemanticCoreContentQueryParamsDto } from "./Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "./Dto/SemanticCoreSearchQueryParamsDto";
import { SemanticCoreDocumentContentResponseDto } from "./Dto/SemanticCoreDocumentContentResponseDto";
import { SemanticCoreSearchDocumentResponseDto } from "./Dto/SemanticCoreSearchDocumentResponseDto";

export class SemanticCoreServiceImpl implements ISemanticCoreService {
    public constructor(private readonly Repo: SemanticCoreRepository) { }

    public ProbeHealth(): Observable<Result<string, Error>> {
        return this.Repo.ProbeHealth();
    }

    public PersistDocument(
        Request: SemanticCoreCreateDocumentRequestDto
    ): Observable<Result<SemanticCoreCreateDocumentResponseDto, Error>> {
        return this.Repo.PersistDocument(Request);
    }

    public DispatchIngestJob(
        DocId: string,
        Request: SemanticCoreIngestRequestDto
    ): Observable<Result<SemanticCoreIngestResponseDto, Error>> {
        return this.Repo.DispatchIngestJob(DocId, Request);
    }

    public FetchDocumentContent(
        DocId: string,
        Params: SemanticCoreContentQueryParamsDto
    ): Observable<Result<SemanticCoreDocumentContentResponseDto, Error>> {
        return this.Repo.FetchDocumentContent(DocId, Params);
    }

    public SearchDocument(
        DocId: string,
        Params: SemanticCoreSearchQueryParamsDto
    ): Observable<Result<SemanticCoreSearchDocumentResponseDto, Error>> {
        return this.Repo.SearchDocument(DocId, Params);
    }
}
