import { Hono } from "hono";
import { HonoBindings, HonoVariables } from "@mastra/hono";

import { SemanticCoreClient } from "./SemanticCoreClient";
import { SemanticCoreRepository } from "./SemanticCoreRepository";
import { SemanticCoreServiceImpl } from "./SemanticCoreServiceImpl";
import { SemanticCoreHttpHandler } from "./SemanticCoreHttpHandler";

export type SemanticCoreModuleConfig = {
    BaseUrl: string;
    TimeoutMs?: number;
    RoutePrefix?: string | null;
};

type HonoMastraServerBindings = {
    Bindings: HonoBindings;
    Variables: HonoVariables;
};

export class SemanticCoreModule {
    private constructor(
        private readonly Config: SemanticCoreModuleConfig,
        private readonly Handler: SemanticCoreHttpHandler
    ) {}

    public static Create(Config: SemanticCoreModuleConfig): SemanticCoreModule {
        const client = new SemanticCoreClient(Config.BaseUrl, Config.TimeoutMs ?? 30_000);
        const repo = new SemanticCoreRepository(client);
        const service = new SemanticCoreServiceImpl(repo);
        const handler = new SemanticCoreHttpHandler(service);

        return new SemanticCoreModule(Config, handler);
    }

    public Register(App: Hono<HonoMastraServerBindings>): void {
        const prefix = this.Config.RoutePrefix ?? null;
        if (prefix === null || prefix.length === 0) {
            this.Handler.Register(App);
            return;
        }

        const scoped = new Hono<HonoMastraServerBindings>();
        this.Handler.Register(scoped);

        App.route(prefix, scoped);
    }
}
