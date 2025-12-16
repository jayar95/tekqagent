export type SemanticCoreCreateDocumentRequestJson = {
    file_name: string;
    mime_type: string;
    source?: string | null;
};

export class SemanticCoreCreateDocumentRequestDto {
    private constructor(
        public readonly FileName: string,
        public readonly MimeType: string,
        public readonly Source: string | null
    ) { }

    public static Create(args: {
        FileName: string;
        MimeType: string;
        Source?: string | null;
    }): SemanticCoreCreateDocumentRequestDto {
        return new SemanticCoreCreateDocumentRequestDto(
            args.FileName,
            args.MimeType,
            args.Source ?? null
        );
    }

    public static FromJson(json: SemanticCoreCreateDocumentRequestJson): SemanticCoreCreateDocumentRequestDto {
        return SemanticCoreCreateDocumentRequestDto.Create({
            FileName: json.file_name,
            MimeType: json.mime_type,
            Source: json.source ?? null,
        });
    }

    public ToJson(): SemanticCoreCreateDocumentRequestJson {
        return {
            file_name: this.FileName,
            mime_type: this.MimeType,
            source: this.Source,
        };
    }
}
