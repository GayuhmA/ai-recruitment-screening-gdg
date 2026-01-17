// src/lib/pdf.ts
import type { Buffer } from "node:buffer";

type PdfParseResult = { text?: string };

async function resolvePdfParseFn(): Promise<(data: Uint8Array) => Promise<PdfParseResult>> {
  // pdf-parse exports PDFParse class (not a direct function)
  const mod: any = await import("pdf-parse");

  // Try PDFParse class first (ESM build exports this)
  if (mod.PDFParse && typeof mod.PDFParse === "function") {
    return async (data: Uint8Array) => {
      const parser = new mod.PDFParse(data);
      return await parser.getText();
    };
  }

  // Fallback: check for default/direct function export
  const candidates = [
    mod?.default,
    mod,
    mod?.pdfParse,
  ];

  const fn = candidates.find((x) => typeof x === "function");
  if (fn) {
    return fn;
  }

  const keys = mod && typeof mod === "object" ? Object.keys(mod) : [];
  throw new Error(`pdf-parse export is not a function. Keys: ${keys.join(", ")}`);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parse = await resolvePdfParseFn();

  // IMPORTANT: pdf-parse (ESM build) expects Uint8Array, not Buffer
  const uint8 = new Uint8Array(buffer);

  const res = await parse(uint8);
  return (res?.text ?? "").trim();
}
