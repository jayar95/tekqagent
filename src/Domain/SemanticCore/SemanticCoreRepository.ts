import { Observable } from "rxjs";

import { Result } from "../../Utility/Result";

import { SemanticCoreClient } from "./SemanticCoreClient";
import { SemanticCoreCreateDocumentRequestDto } from "./Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreCreateDocumentResponseDto } from "./Dto/SemanticCoreCreateDocumentResponseDto";
import { SemanticCoreIngestRequestDto } from "./Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreIngestResponseDto } from "./Dto/SemanticCoreIngestResponseDto";
import { SemanticCoreContentQueryParamsDto } from "./Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "./Dto/SemanticCoreSearchQueryParamsDto";
import { SemanticCoreDocumentContentResponseDto } from "./Dto/SemanticCoreDocumentContentResponseDto";
import { SemanticCoreSearchDocumentResponseDto } from "./Dto/SemanticCoreSearchDocumentResponseDto";

export class SemanticCoreRepository {
    public constructor(private readonly Client: SemanticCoreClient) { }

    public ProbeHealth(): Observable<Result<string, Error>> {
        return this.Client.ProbeHealth();
    }

    public PersistDocument(
        Request: SemanticCoreCreateDocumentRequestDto
    ): Observable<Result<SemanticCoreCreateDocumentResponseDto, Error>> {
        return this.Client.PersistDocument(Request);
    }

    public DispatchIngestJob(
        DocId: string,
        Request: SemanticCoreIngestRequestDto
    ): Observable<Result<SemanticCoreIngestResponseDto, Error>> {
        return this.Client.DispatchIngestJob(DocId, Request);
    }

    public FetchDocumentContent(
        DocId: string,
        Params: SemanticCoreContentQueryParamsDto
    ): Observable<Result<SemanticCoreDocumentContentResponseDto, Error>> {
        return this.Client.FetchDocumentContent(DocId, Params);
    }

    public SearchDocument(
        DocId: string,
        Params: SemanticCoreSearchQueryParamsDto
    ): Observable<Result<SemanticCoreSearchDocumentResponseDto, Error>> {
        return this.Client.SearchDocument(DocId, Params);
    }
}
