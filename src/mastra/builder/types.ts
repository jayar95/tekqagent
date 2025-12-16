export type TextElement = {
    id: string;
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    fontSize: number;
    fontWeight?: "normal" | "bold";
    color?: string;
    align?: "left" | "center" | "right";
};

export type BulletListElement = {
    id: string;
    type: "bulletList";
    x: number;
    y: number;
    width: number;
    height: number;
    items: string[];
    fontSize: number;
    color?: string;
};

export type ImageElement = {
    id: string;
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
};

export type ShapeElement = {
    id: string;
    type: "shape";
    x: number;
    y: number;
    width: number;
    height: number;
    shapeType: "rectangle" | "circle" | "line";
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
};

export type SlideElement = TextElement | BulletListElement | ImageElement | ShapeElement;

export type Slide = {
    slideId: string;
    elements: SlideElement[];
};

export type DeckTheme = {
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
    fontFamily: string;
};

export type Deck = {
    id: string;
    title: string;
    theme: DeckTheme;
    slides: Slide[];
    createdAt: string;
    updatedAt: string;
};

export type ParagraphBlock = { id: string; type: "paragraph"; text: string };
export type BulletsBlock = { id: string; type: "bullets"; items: string[] };
export type QuoteBlock = { id: string; type: "quote"; text: string };
export type CodeBlock = { id: string; type: "code"; language?: string; code: string };

export type DocBlock = ParagraphBlock | BulletsBlock | QuoteBlock | CodeBlock;

export type DocSection = {
    sectionId: string;
    heading: string;
    blocks: DocBlock[];
    startOnNewPage?: boolean;
};

export type DocTheme = {
    fontFamily: string;
    textColor: string;
    headingColor: string;
};

export type Doc = {
    id: string;
    title: string;
    theme: DocTheme;
    sections: DocSection[];
    createdAt: string;
    updatedAt: string;
};
