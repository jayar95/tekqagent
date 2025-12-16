export type SemanticCoreIngestRequestJson = {
    unstructured_strategy?: string | null;
    embedding_model?: string | null;
};

export class SemanticCoreIngestRequestDto {
    private constructor(
        public readonly UnstructuredStrategy: string | null,
        public readonly EmbeddingModel: string | null
    ) { }

    public static Create(args?: {
        UnstructuredStrategy?: string | null;
        EmbeddingModel?: string | null;
    }): SemanticCoreIngestRequestDto {
        return new SemanticCoreIngestRequestDto(
            args?.UnstructuredStrategy ?? null,
            args?.EmbeddingModel ?? null
        );
    }

    public static FromJson(json: SemanticCoreIngestRequestJson): SemanticCoreIngestRequestDto {
        return SemanticCoreIngestRequestDto.Create({
            UnstructuredStrategy: json.unstructured_strategy ?? null,
            EmbeddingModel: json.embedding_model ?? null,
        });
    }

    public ToJson(): SemanticCoreIngestRequestJson {
        return {
            unstructured_strategy: this.UnstructuredStrategy,
            embedding_model: this.EmbeddingModel,
        };
    }
}
