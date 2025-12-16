export type SemanticCoreCreateDocumentResponseJson = {
    doc_id: string;
    upload_url: string;
    upload_method: string;
};

export class SemanticCoreCreateDocumentResponseDto {
    private constructor(
        public readonly DocId: string,
        public readonly UploadUrl: string,
        public readonly UploadMethod: string
    ) { }

    public static FromJson(json: SemanticCoreCreateDocumentResponseJson): SemanticCoreCreateDocumentResponseDto {
        return new SemanticCoreCreateDocumentResponseDto(json.doc_id, json.upload_url, json.upload_method);
    }

    public ToJson(): SemanticCoreCreateDocumentResponseJson {
        return {
            doc_id: this.DocId,
            upload_url: this.UploadUrl,
            upload_method: this.UploadMethod,
        };
    }
}
