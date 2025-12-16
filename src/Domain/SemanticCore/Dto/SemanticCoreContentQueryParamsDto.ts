export class SemanticCoreContentQueryParamsDto {
    private constructor(
        public readonly Page: number | null,
        public readonly Mode: string | null
    ) { }

    public static Create(args?: { Page?: number | null; Mode?: string | null }): SemanticCoreContentQueryParamsDto {
        return new SemanticCoreContentQueryParamsDto(args?.Page ?? null, args?.Mode ?? null);
    }
}
