import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse(buffer);
    const result = await parser.getText();
    
    // Truncate to 50k chars to avoid DB bloat and AI token limits
    return result.text.trim().slice(0, 50000);
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
