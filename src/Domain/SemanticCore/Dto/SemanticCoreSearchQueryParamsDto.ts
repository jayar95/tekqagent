export class SemanticCoreSearchQueryParamsDto {
    private constructor(
        public readonly Query: string,
        public readonly Page: number | null,
        public readonly Limit: number | null
    ) {}

    public static Create(args: {
        Query: string;
        Page?: number | null;
        Limit?: number | null
    }): SemanticCoreSearchQueryParamsDto {
        return new SemanticCoreSearchQueryParamsDto(
            args.Query,
            args.Page ?? null,
            args.Limit ?? null,
        );
    }
}
