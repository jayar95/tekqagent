import { HonoBindings, HonoVariables, MastraServer } from "@mastra/hono";
import { Hono } from "hono";
import { mastra as _mastra } from "./index";
import { Mastra } from "@mastra/core/mastra";
import { Result } from "../Utility/Result";

export type HonoMastraServerBindings = {
    Bindings: HonoBindings;
    Variables: HonoVariables;
}

export class FailedToRegisterMastraError extends Error {
    constructor() {
        super("Failed to register Mastra with Hono");
    }
}

export async function RegisterHonoMastraServer(
    app: Hono<HonoMastraServerBindings>,
    mastraServerFactory: Mastra = _mastra
): Promise<Result<void, FailedToRegisterMastraError>> {
    const server = new MastraServer({ app, mastra: mastraServerFactory });

    return await Result.FromPromise(
        server.init(),
        (_) => new FailedToRegisterMastraError
    )
}
