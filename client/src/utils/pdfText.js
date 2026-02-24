/**
 * Extract text from a PDF ArrayBuffer using pdfjs-dist.
 * Used to build study material from uploaded PDFs for question generation.
 */
let pdfjsLib = null;

const PDFJS_VERSION = "5.4.624";

async function getPdfLib() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist");
  pdfjsLib = mod.default || mod;
  if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
  }
  return pdfjsLib;
}

/**
 * @param {ArrayBuffer} arrayBuffer - PDF file content
 * @returns {Promise<string>} - Extracted text from all pages
 */
export async function extractTextFromPdf(arrayBuffer) {
  if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) return "";
  const lib = await getPdfLib();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const parts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || [])
      .map((item) => (item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    if (pageText.trim()) parts.push(pageText.trim());
  }
  return parts.join("\n\n");
}

/**
 * @param {string} name - File name
 * @param {string} [mimeType] - MIME type
 * @returns {boolean}
 */
export function isPdfFile(name, mimeType) {
  if (mimeType === "application/pdf") return true;
  if (typeof name === "string" && name.toLowerCase().endsWith(".pdf")) return true;
  return false;
}
