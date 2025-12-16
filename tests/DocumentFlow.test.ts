import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

type CreateDocumentResponse = {
    doc_id: string;
    upload_url: string;
    upload_method: string;
};

type IngestResponse = {
    job_id: string;
    doc_id: string;
    queued: boolean;
};

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil<T>(
    fn: () => Promise<T | null>,
    opts: { timeoutMs: number; intervalMs: number }
): Promise<T> {
    const started = Date.now();
    while (true) {
        const v = await fn();
        if (v !== null) return v;

        if (Date.now() - started > opts.timeoutMs) {
            throw new Error(`Timed out after ${opts.timeoutMs}ms waiting for condition`);
        }
        await sleep(opts.intervalMs);
    }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
        throw new Error(`POST ${url} -> ${res.status}: ${text}`);
    }
    return JSON.parse(text) as T;
}

async function getJson<T>(url: string): Promise<{ status: number; body: T | null; text: string }> {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();

    if (!res.ok) {
        return { status: res.status, body: null, text };
    }

    if (text.trim().length === 0) {
        return { status: res.status, body: null, text };
    }

    try {
        return { status: res.status, body: JSON.parse(text) as T, text };
    } catch {
        return { status: res.status, body: null, text };
    }
}

async function putBinary(url: string, bytes: Uint8Array): Promise<void> {
    const res = await fetch(url, {
        method: "PUT",
        body: bytes,
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(`PUT presign -> ${res.status}: ${text}`);
    }
}

const BaseUrl = (process.env.INTEGRATION_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const RoutePrefix = (process.env.INTEGRATION_ROUTE_PREFIX ?? "").replace(/\/+$/, "");
const Api = `${BaseUrl}${RoutePrefix}`;

const PdfPath =
    process.env.INTEGRATION_PDF_PATH ??
    path.resolve(process.cwd(), "data", "10k.pdf");

describe.runIf(true)("Integration: document ingest flow", () => {
    it(
        "Create -> Upload -> Ingest -> Content -> Search",
        async () => {
            const create = await postJson<CreateDocumentResponse>(`${Api}/documents`, {
                file_name: "10k.pdf",
                mime_type: "application/pdf",
            });

            expect(typeof create.doc_id).toBe("string");
            expect(create.doc_id.length).toBeGreaterThan(0);

            expect(typeof create.upload_url).toBe("string");
            expect(create.upload_url.length).toBeGreaterThan(0);

            expect(typeof create.upload_method).toBe("string");
            expect(create.upload_method.toUpperCase()).toBe("PUT");

            const docId = create.doc_id;
            const presignUrl = create.upload_url;

            const pdfBytes = new Uint8Array(await readFile(PdfPath));
            await putBinary(presignUrl, pdfBytes);

            const ingest = await postJson<IngestResponse>(`${Api}/documents/${encodeURIComponent(docId)}/ingest`, {
                unstructured_strategy: "fast",
            });

            expect(ingest.doc_id).toBe(docId);
            expect(ingest.queued).toBe(true);
            expect(typeof ingest.job_id).toBe("string");
            expect(ingest.job_id.length).toBeGreaterThan(0);

            const content = await waitUntil<Record<string, unknown>>(async () => {
                const r = await getJson<Record<string, unknown>>(`${Api}/documents/${encodeURIComponent(docId)}/content`);
                if (r.body && Object.keys(r.body).length > 0) return r.body;
                return null;
            }, { timeoutMs: 120_000, intervalMs: 2_000 });

            expect(Object.keys(content).length).toBeGreaterThan(0);

            const search = await waitUntil<Record<string, unknown>>(async () => {
                const q = new URLSearchParams({ query: "tarrif" }).toString();
                const r = await getJson<Record<string, unknown>>(
                    `${Api}/documents/${encodeURIComponent(docId)}/search?${q}`
                );
                if (r.body && Object.keys(r.body).length > 0) return r.body;
                return null;
            }, { timeoutMs: 120_000, intervalMs: 2_000 });

            expect(Object.keys(search).length).toBeGreaterThan(0);
        },
        240_000
    );
});
