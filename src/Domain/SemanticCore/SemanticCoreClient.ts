import { Observable, of } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { catchError, map, switchMap, timeout } from "rxjs/operators";

import { Result } from "../../Utility/Result";

import {
    SemanticCoreCreateDocumentRequestDto,
    SemanticCoreCreateDocumentRequestJson,
} from "./Dto/SemanticCoreCreateDocumentRequestDto";
import {
    SemanticCoreCreateDocumentResponseDto,
    SemanticCoreCreateDocumentResponseJson,
} from "./Dto/SemanticCoreCreateDocumentResponseDto";
import {
    SemanticCoreIngestRequestDto,
    SemanticCoreIngestRequestJson,
} from "./Dto/SemanticCoreIngestRequestDto";
import {
    SemanticCoreIngestResponseDto,
    SemanticCoreIngestResponseJson,
} from "./Dto/SemanticCoreIngestResponseDto";
import { SemanticCoreContentQueryParamsDto } from "./Dto/SemanticCoreContentQueryParamsDto";
import { SemanticCoreSearchQueryParamsDto } from "./Dto/SemanticCoreSearchQueryParamsDto";
import { SemanticCoreDocumentContentResponseDto } from "./Dto/SemanticCoreDocumentContentResponseDto";
import { SemanticCoreSearchDocumentResponseDto } from "./Dto/SemanticCoreSearchDocumentResponseDto";

export class SemanticCoreHttpError extends Error {
    public constructor(
        private readonly _statusCode: number,
        private readonly _bodyText: string
    ) {
        super(`Upstream HTTP ${_statusCode}`);
    }

    public StatusCode(): number {
        return this._statusCode;
    }

    public BodyText(): string {
        return this._bodyText;
    }
}

export class SemanticCoreClient {
    public constructor(
        private readonly BaseUrl: string,
        private readonly TimeoutMs: number = 30_000
    ) { }

    public ProbeHealth(): Observable<Result<string, Error>> {
        return this.executeJson<string>("GET", `/healthcheck`, undefined);
    }

    public PersistDocument(
        Request: SemanticCoreCreateDocumentRequestDto
    ): Observable<Result<SemanticCoreCreateDocumentResponseDto, Error>> {
        const body: SemanticCoreCreateDocumentRequestJson = Request.ToJson();
        return this.executeJson<SemanticCoreCreateDocumentResponseJson>(
            "POST",
            `/v1/documents`,
            body
        ).pipe(
            map((r) =>
                r.Match({
                    Ok: (json) => Result.Ok(
                        SemanticCoreCreateDocumentResponseDto.FromJson(json)
                    ),
                    Err: (e) => Result.Err(e),
                })
            )
        );
    }

    public DispatchIngestJob(
        DocId: string,
        Request: SemanticCoreIngestRequestDto
    ): Observable<Result<SemanticCoreIngestResponseDto, Error>> {
        const body: SemanticCoreIngestRequestJson = Request.ToJson();
        return this.executeJson<SemanticCoreIngestResponseJson>(
            "POST",
            `/v1/documents/${encodeURIComponent(DocId)}/ingest`,
            body
        ).pipe(
            map((r) =>
                r.Match({
                    Ok: (json) => Result.Ok(SemanticCoreIngestResponseDto.FromJson(json)),
                    Err: (e) => Result.Err(e),
                })
            )
        );
    }

    public FetchDocumentContent(
        DocId: string,
        Params: SemanticCoreContentQueryParamsDto
    ): Observable<Result<SemanticCoreDocumentContentResponseDto, Error>> {
        const qs = this.buildQuery({
            page: Params.Page,
            mode: Params.Mode,
        });
        return this.executeJson<SemanticCoreDocumentContentResponseDto>(
            "GET",
            `/v1/documents/${encodeURIComponent(DocId)}/content${qs}`,
            undefined
        );
    }

    public SearchDocument(
        DocId: string,
        Params: SemanticCoreSearchQueryParamsDto
    ): Observable<Result<SemanticCoreSearchDocumentResponseDto, Error>> {
        const qs = this.buildQuery({
            query: Params.Query,
            page: Params.Page,
            limit: Params.Limit,
        });
        return this.executeJson<SemanticCoreSearchDocumentResponseDto>(
            "GET",
            `/v1/documents/${encodeURIComponent(DocId)}/search${qs}`,
            undefined
        );
    }

    private buildQuery(values: Record<string, string | number | null | undefined>): string {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(values)) {
            if (v === undefined || v === null) continue;
            sp.set(k, String(v));
        }
        const q = sp.toString();
        return q.length > 0 ? `?${q}` : "";
    }

    private executeJson<T>(
        method: "GET" | "POST",
        path: string,
        body: unknown | undefined
    ): Observable<Result<T, Error>> {
        const url = `${this.BaseUrl}${path}`;

        const headers: Record<string, string> = {
            Accept: "application/json",
        };

        const init: RequestInit = {
            method,
            headers,
            body: body === undefined
                ? undefined
                : JSON.stringify(body),
        };

        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        return fromFetch(url, init).pipe(
            timeout({ first: this.TimeoutMs }),
            switchMap(async (res) => {
                let contentType = res.headers.get("content-type");
                if (!contentType) {
                    contentType = "";
                }
                const text = await res.text();

                if (!res.ok) {
                    return Result.Err<Error, T>(new SemanticCoreHttpError(res.status, text));
                }

                if (text.length === 0) {
                    return Result.Ok<T, Error>(undefined as unknown as T);
                }

                if (contentType.includes("application/json")) {
                    try {
                        return Result.Ok<T, Error>(JSON.parse(text) as T);
                    } catch (e) {
                        return Result.Err<Error, T>(
                            new Error(`Failed to parse JSON from upstream: ${(e as Error).message}`)
                        );
                    }
                }

                return Result.Ok<T, Error>(text as unknown as T);
            }),
            catchError((e: unknown) => of(Result.Err<Error, T>(e as Error)))
        );
    }
}
