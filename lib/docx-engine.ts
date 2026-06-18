import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import DocxMerger from "docx-merger";
import { Recipient } from "./types";

export async function getPlaceholdersFromDocx(file: File): Promise<{ placeholders: string[]; delimiters: { start: string; end: string } }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // We'll use a temporary doc instance to get the full text
    const tempDoc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" }, // Default, doesn't matter for getFullText
    });
    const text = tempDoc.getFullText();

    // Define supported patterns
    const patterns = [
      { start: "{{", end: "}}", regex: /\{\{(.+?)\}\}/g },
      { start: "[", end: "]", regex: /\[([A-Z0-9_]{2,})\]/g }, // Restricted to avoid common [text]
      { start: "<", end: ">", regex: /<(.+?)>/g },
      { start: "«", end: "»", regex: /«(.+?)»/g },
    ];

    let bestPattern = patterns[0];
    let maxMatches = 0;
    let bestPlaceholders = new Set<string>();

    for (const pattern of patterns) {
      const placeholders = new Set<string>();
      let match;
      // Reset regex state
      pattern.regex.lastIndex = 0;
      let count = 0;
      while ((match = pattern.regex.exec(text)) !== null) {
        placeholders.add(match[1].trim());
        count++;
      }
      
      if (count > maxMatches) {
        maxMatches = count;
        bestPattern = pattern;
        bestPlaceholders = placeholders;
      }
    }

    return {
      placeholders: Array.from(bestPlaceholders),
      delimiters: { start: bestPattern.start, end: bestPattern.end }
    };
  } catch (err) {
    console.error("Error extracting placeholders:", err);
    throw new Error("Failed to read placeholders from the Word document.");
  }
}

export async function generateDocx(
  templateBuffer: ArrayBuffer,
  data: Recipient,
  delimiters: { start: string; end: string } = { start: "{{", end: "}}" }
): Promise<ArrayBuffer> {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: delimiters,
    });

    doc.render(data);

    const out = doc.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });

    return out.buffer as ArrayBuffer;
  } catch (err) {
    console.error("Error generating DOCX:", err);
    throw new Error("Failed to merge data into the template.");
  }
}

export function mergeDocxBuffers(buffers: ArrayBuffer[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (buffers.length === 0) {
        throw new Error("No certificates to combine.");
      }
      
      if (buffers.length === 1) {
        resolve(new Blob([buffers[0]], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        return;
      }

      // DocxMerger expects JSZip instances or raw files. It works well with array buffers.
      const docx = new DocxMerger({}, buffers);
      
      docx.save('blob', function (data: Blob | ArrayBuffer | Uint8Array) {
          resolve(data as Blob);
      });
    } catch (err) {
      console.error("Error combining DOCX files:", err);
      reject(new Error("Failed to combine certificates into a single file."));
    }
  });
}
