import { Observable } from "rxjs";

import { Result } from "../../Utility/Result";

import { SemanticCoreCreateDocumentRequestDto } from "./Dto/SemanticCoreCreateDocumentRequestDto";
import { SemanticCoreCreateDocumentResponseDto } from "./Dto/SemanticCoreCreateDocumentResponseDto";
import { SemanticCoreIngestRequestDto } from "./Dto/SemanticCoreIngestRequestDto";
import { SemanticCoreIngestResponseDto } from "./Dto/SemanticCoreIngestResponseDto";
import { SemanticCoreContentQueryParamsDto } from "./Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "./Dto/SemanticCoreSearchQueryParamsDto";
import { SemanticCoreDocumentContentResponseDto } from "./Dto/SemanticCoreDocumentContentResponseDto";
import { SemanticCoreSearchDocumentResponseDto } from "./Dto/SemanticCoreSearchDocumentResponseDto";

export interface ISemanticCoreService {
    ProbeHealth(): Observable<Result<string, Error>>;

    PersistDocument(
        Request: SemanticCoreCreateDocumentRequestDto
    ): Observable<Result<SemanticCoreCreateDocumentResponseDto, Error>>;

    DispatchIngestJob(
        DocId: string,
        Request: SemanticCoreIngestRequestDto
    ): Observable<Result<SemanticCoreIngestResponseDto, Error>>;

    FetchDocumentContent(
        DocId: string,
        Params: SemanticCoreContentQueryParamsDto
    ): Observable<Result<SemanticCoreDocumentContentResponseDto, Error>>;

    SearchDocument(
        DocId: string,
        Params: SemanticCoreSearchQueryParamsDto
    ): Observable<Result<SemanticCoreSearchDocumentResponseDto, Error>>;
}
