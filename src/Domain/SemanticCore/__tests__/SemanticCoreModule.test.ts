import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

vi.mock("../SemanticCoreClient", () => {
    return {
        SemanticCoreClient: class SemanticCoreClient {
            public constructor(public readonly BaseUrl: string, public readonly TimeoutMs: number) { }
        },
    };
});

const repositoryCtor = vi.fn();
vi.mock("../SemanticCoreRepository", () => {
    return {
        SemanticCoreRepository: class SemanticCoreRepository {
            public constructor(client: unknown) {
                repositoryCtor(client);
            }
        },
    };
});

const serviceCtor = vi.fn();
vi.mock("../SemanticCoreServiceImpl", () => {
    return {
        SemanticCoreServiceImpl: class SemanticCoreServiceImpl {
            public constructor(repo: unknown) {
                serviceCtor(repo);
            }
        },
    };
});

const handlerCtor = vi.fn();
const handlerRegister = vi.fn();

vi.mock("../SemanticCoreHttpHandler", () => {
    return {
        SemanticCoreHttpHandler: class SemanticCoreHttpHandler {
            public constructor(service: unknown) {
                handlerCtor(service);
            }
            public Register(app: unknown): void {
                handlerRegister(app);
            }
        },
    };
});

import { SemanticCoreModule } from "../SemanticCoreModule";

describe("SemanticCoreModule", () => {
    beforeEach(() => {
        repositoryCtor.mockClear();
        serviceCtor.mockClear();
        handlerCtor.mockClear();
        handlerRegister.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("Create() wires Client -> Repository -> Service -> Handler", () => {
        const module = SemanticCoreModule.Create({
            BaseUrl: "http://semantic-core",
            TimeoutMs: 12345,
            RoutePrefix: null,
        });

        expect(repositoryCtor).toHaveBeenCalledTimes(1);
        expect(serviceCtor).toHaveBeenCalledTimes(1);
        expect(handlerCtor).toHaveBeenCalledTimes(1);

        expect(module).toBeInstanceOf(SemanticCoreModule);

        const repoArg = repositoryCtor.mock.calls[0][0];
        const serviceArg = serviceCtor.mock.calls[0][0];
        const handlerArg = handlerCtor.mock.calls[0][0];

        expect(repoArg).toBeTruthy();
        expect(serviceArg).toBeTruthy();
        expect(handlerArg).toBeTruthy();

        expect(serviceArg).toBeInstanceOf(Object);
    });

    it("Register() with RoutePrefix null mounts on root (calls Handler.Register(App))", () => {
        const module = SemanticCoreModule.Create({
            BaseUrl: "http://semantic-core",
            RoutePrefix: null,
        });

        const app = new Hono();

        module.Register(app as any);

        expect(handlerRegister).toHaveBeenCalledTimes(1);
        expect(handlerRegister.mock.calls[0][0]).toBe(app);
    });

    it("Register() with RoutePrefix empty string mounts on root (calls Handler.Register(App))", () => {
        const module = SemanticCoreModule.Create({
            BaseUrl: "http://semantic-core",
            RoutePrefix: "",
        });

        const app = new Hono();

        module.Register(app as any);

        expect(handlerRegister).toHaveBeenCalledTimes(1);
        expect(handlerRegister.mock.calls[0][0]).toBe(app);
    });

    it("Register() with RoutePrefix set creates a scoped app and routes it under prefix", () => {
        const module = SemanticCoreModule.Create({
            BaseUrl: "http://semantic-core",
            RoutePrefix: "/backend-api/semantic-core",
        });

        const app = new Hono() as any;
        app.route = vi.fn();

        module.Register(app);

        expect(handlerRegister).toHaveBeenCalledTimes(1);
        const scopedApp = handlerRegister.mock.calls[0][0];
        expect(scopedApp).toBeTruthy();

        expect(app.route).toHaveBeenCalledTimes(1);
        expect(app.route.mock.calls[0][0]).toBe("/backend-api/semantic-core");
        expect(app.route.mock.calls[0][1]).toBe(scopedApp);
    });
});
