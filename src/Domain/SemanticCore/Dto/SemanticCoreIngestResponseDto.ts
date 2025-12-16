export type SemanticCoreIngestResponseJson = {
    job_id: string;
    doc_id: string;
    queued: boolean;
};

export class SemanticCoreIngestResponseDto {
    private constructor(
        public readonly JobId: string,
        public readonly DocId: string,
        public readonly Queued: boolean
    ) { }

    public static FromJson(json: SemanticCoreIngestResponseJson): SemanticCoreIngestResponseDto {
        return new SemanticCoreIngestResponseDto(json.job_id, json.doc_id, json.queued);
    }

    public ToJson(): SemanticCoreIngestResponseJson {
        return {
            job_id: this.JobId,
            doc_id: this.DocId,
            queued: this.Queued,
        };
    }
}
