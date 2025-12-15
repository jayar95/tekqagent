import { generateId } from "ai";
import type { Deck, SlideElement, DeckTheme, Doc, DocTheme } from "./types";

// Keep these aligned with the frontend defaults
const DEFAULT_DECK_THEME: DeckTheme = {
    backgroundColor: "#ffffff",
    primaryColor: "#0088cc",
    textColor: "#1a1a1a",
    fontFamily: "Arial",
};

const DEFAULT_DOC_THEME: DocTheme = {
    fontFamily: "Arial",
    textColor: "#1a1a1a",
    headingColor: "#0f172a",
};

function createEmptyDeckFromActions(actions: any[]): Deck {
    const now = new Date().toISOString();
    const titleAction = actions.find((a) => a?.type === "UPDATE_DECK_TITLE" && typeof a.title === "string");
    const title = titleAction?.title ?? "Untitled Presentation";

    return {
        id: generateId(),
        title,
        theme: DEFAULT_DECK_THEME,
        slides: [],
        createdAt: now,
        updatedAt: now,
    };
}

function createEmptyDocFromActions(actions: any[]): Doc {
    const now = new Date().toISOString();
    const titleAction = actions.find((a) => a?.type === "DOC_SET_TITLE" && typeof a.title === "string");
    const title = titleAction?.title ?? "Untitled Document";

    return {
        id: generateId(),
        title,
        theme: DEFAULT_DOC_THEME,
        sections: [],
        createdAt: now,
        updatedAt: now,
    };
}

function deckReducer(deck: Deck, action: any): Deck {
    const now = new Date().toISOString();

    switch (action?.type) {
        case "ADD_SLIDE": {
            const newSlide = { slideId: action.slideId, elements: action.elements ?? [] };
            const slides = [...deck.slides];
            if (action.insertAt !== undefined && action.insertAt >= 0 && action.insertAt <= slides.length) {
                slides.splice(action.insertAt, 0, newSlide);
            } else {
                slides.push(newSlide);
            }
            return { ...deck, slides, updatedAt: now };
        }

        case "UPDATE_SLIDE": {
            const idx = deck.slides.findIndex((s) => s.slideId === action.slideId);
            if (idx === -1) return deck;
            const slides = [...deck.slides];
            slides[idx] = { ...slides[idx], elements: action.elements ?? [] };
            return { ...deck, slides, updatedAt: now };
        }

        case "DELETE_SLIDE": {
            const slides = deck.slides.filter((s) => s.slideId !== action.slideId);
            if (slides.length === deck.slides.length) return deck;
            return { ...deck, slides, updatedAt: now };
        }

        case "REORDER_SLIDES": {
            const slideMap = new Map(deck.slides.map((s) => [s.slideId, s] as const));
            const reordered = (action.slideIds ?? [])
                .map((id: string) => slideMap.get(id))
                .filter((s: any) => Boolean(s));
            if (reordered.length !== deck.slides.length) return deck;
            return { ...deck, slides: reordered, updatedAt: now };
        }

        case "ADD_ELEMENT": {
            const idx = deck.slides.findIndex((s) => s.slideId === action.slideId);
            if (idx === -1) return deck;
            const slides = [...deck.slides];
            slides[idx] = { ...slides[idx], elements: [...slides[idx].elements, action.element] };
            return { ...deck, slides, updatedAt: now };
        }

        case "UPDATE_ELEMENT": {
            const idx = deck.slides.findIndex((s) => s.slideId === action.slideId);
            if (idx === -1) return deck;
            const slide = deck.slides[idx];
            const eidx = slide.elements.findIndex((e) => e.id === action.elementId);
            if (eidx === -1) return deck;

            const slides = [...deck.slides];
            const elements = [...slide.elements];
            elements[eidx] = { ...elements[eidx], ...(action.updates ?? {}) } as SlideElement;
            slides[idx] = { ...slide, elements };
            return { ...deck, slides, updatedAt: now };
        }

        case "DELETE_ELEMENT": {
            const idx = deck.slides.findIndex((s) => s.slideId === action.slideId);
            if (idx === -1) return deck;
            const slide = deck.slides[idx];
            const elements = slide.elements.filter((e) => e.id !== action.elementId);
            if (elements.length === slide.elements.length) return deck;

            const slides = [...deck.slides];
            slides[idx] = { ...slide, elements };
            return { ...deck, slides, updatedAt: now };
        }

        case "UPDATE_DECK_TITLE":
            return { ...deck, title: action.title ?? deck.title, updatedAt: now };

        case "UPDATE_DECK_THEME":
            return { ...deck, theme: { ...deck.theme, ...(action.theme ?? {}) }, updatedAt: now };

        default:
            return deck;
    }
}

export function applyDeckActionsToState(deck: Deck | null, actions: unknown[]): Deck | null {
    if (!Array.isArray(actions) || actions.length === 0) return deck;
    const base = deck ?? createEmptyDeckFromActions(actions as any[]);
    return (actions as any[]).reduce((d, a) => deckReducer(d, a), base);
}

// ---------- DOCX reducer (mirrors src/lib/builder/docReducer.ts) ----------
function docReducer(doc: Doc, action: any): Doc {
    const now = new Date().toISOString();

    switch (action?.type) {
        case "DOC_SET_TITLE":
            return { ...doc, title: action.title ?? doc.title, updatedAt: now };

        case "DOC_UPDATE_THEME":
            return { ...doc, theme: { ...doc.theme, ...(action.theme ?? {}) }, updatedAt: now };

        case "ADD_SECTION": {
            const newSection = {
                sectionId: action.sectionId,
                heading: action.heading,
                blocks: action.blocks ?? [],
                startOnNewPage: action.startOnNewPage ?? false,
            };
            const sections = [...doc.sections];
            if (action.insertAt !== undefined && action.insertAt >= 0 && action.insertAt <= sections.length) {
                sections.splice(action.insertAt, 0, newSection);
            } else {
                sections.push(newSection);
            }
            return { ...doc, sections, updatedAt: now };
        }

        case "UPDATE_SECTION": {
            const idx = doc.sections.findIndex((s) => s.sectionId === action.sectionId);
            if (idx === -1) return doc;

            const sections = [...doc.sections];
            sections[idx] = {
                ...sections[idx],
                ...(action.heading !== undefined ? { heading: action.heading } : {}),
                ...(action.blocks !== undefined ? { blocks: action.blocks } : {}),
                ...(action.startOnNewPage !== undefined ? { startOnNewPage: action.startOnNewPage } : {}),
            };

            return { ...doc, sections, updatedAt: now };
        }

        case "DELETE_SECTION": {
            const sections = doc.sections.filter((s) => s.sectionId !== action.sectionId);
            if (sections.length === doc.sections.length) return doc;
            return { ...doc, sections, updatedAt: now };
        }

        case "REORDER_SECTIONS": {
            const map = new Map(doc.sections.map((s) => [s.sectionId, s] as const));
            const reordered = (action.sectionIds ?? [])
                .map((id: string) => map.get(id))
                .filter((s: any) => Boolean(s));
            if (reordered.length !== doc.sections.length) return doc;
            return { ...doc, sections: reordered, updatedAt: now };
        }

        default:
            return doc;
    }
}

export function applyDocActionsToState(doc: Doc | null, actions: unknown[]): Doc | null {
    if (!Array.isArray(actions) || actions.length === 0) return doc;
    const base = doc ?? createEmptyDocFromActions(actions as any[]);
    return (actions as any[]).reduce((d, a) => docReducer(d, a), base);
}
