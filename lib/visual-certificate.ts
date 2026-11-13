export type VisualField = {
  id: string;
  label: string;
  column: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
};

export type VisualBackground = {
  dataUrl: string;
  width: number;
  height: number;
  sourceType: "image" | "pdf";
  pageCount: number;
};

const MAX_CANVAS_PIXELS = 20_000_000;

export async function loadVisualBackground(file: File): Promise<VisualBackground> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const page = await document.getPage(1);
    const baseViewport = page.getViewport({ scale: 2 });
    const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (baseViewport.width * baseViewport.height)));
    const viewport = page.getViewport({ scale: 2 * scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create a PDF preview canvas.");
    await page.render({ canvasContext: context, viewport, canvas } as never).promise;
    const dataUrl = canvas.toDataURL("image/png");
    const result = { dataUrl, width: canvas.width, height: canvas.height, sourceType: "pdf" as const, pageCount: document.numPages };
    await document.destroy();
    return result;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (image.naturalWidth * image.naturalHeight)));
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create an image preview canvas.");
    context.drawImage(image, 0, 0);
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, sourceType: "image", pageCount: 1 };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function createDefaultVisualField(columns: string[], index: number): VisualField {
  const label = index === 0 ? "Recipient name" : `Text field ${index + 1}`;
  return {
    id: crypto.randomUUID(),
    label,
    column: columns[index] ?? columns[0] ?? "",
    x: 0.2,
    y: Math.min(0.82, 0.44 + (index * 0.1)),
    width: 0.6,
    height: 0.1,
    fontSize: 42,
    fontFamily: "Arial",
    color: "#172554",
    bold: index === 0,
    align: "center",
  };
}

export async function renderVisualCertificate(
  background: VisualBackground,
  fields: VisualField[],
  recipient: Record<string, unknown>,
): Promise<Blob> {
  const image = new Image();
  image.src = background.dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = background.width;
  canvas.height = background.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not render this certificate.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const field of fields) {
    const value = String(recipient[field.column] ?? "");
    const left = field.x * canvas.width;
    const top = field.y * canvas.height;
    const boxWidth = field.width * canvas.width;
    const boxHeight = field.height * canvas.height;
    const horizontalPadding = Math.max(4, boxWidth * 0.015);
    const maxWidth = Math.max(1, boxWidth - horizontalPadding * 2);
    let fontSize = Math.max(8, Math.min(field.fontSize, boxHeight * 0.8));
    const weight = field.bold ? "700" : "400";
    context.textAlign = field.align;
    context.textBaseline = "middle";
    while (fontSize > 8) {
      context.font = `${weight} ${fontSize}px "${field.fontFamily}", Arial, sans-serif`;
      if (context.measureText(value).width <= maxWidth) break;
      fontSize -= 1;
    }
    context.fillStyle = field.color;
    context.font = `${weight} ${fontSize}px "${field.fontFamily}", Arial, sans-serif`;
    const x = field.align === "left" ? left + horizontalPadding : field.align === "right" ? left + boxWidth - horizontalPadding : left + boxWidth / 2;
    context.save();
    context.beginPath();
    context.rect(left, top, boxWidth, boxHeight);
    context.clip();
    context.fillText(value, x, top + boxHeight / 2, maxWidth);
    context.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the certificate image.")), "image/png");
  });
}

async function blobToJpeg(blob: Blob): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const image = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare certificate pages for PDF export.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  image.close();
  const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not encode a certificate page.")), "image/jpeg", 0.94));
  return { bytes: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height };
}

function joinBytes(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.byteLength; }
  return result;
}

export async function createPdfFromPngs(images: Blob[]): Promise<Blob> {
  if (!images.length) throw new Error("There are no generated certificates to export.");
  const pages: Awaited<ReturnType<typeof blobToJpeg>>[] = [];
  for (const image of images) pages.push(await blobToJpeg(image));
  const encoder = new TextEncoder();
  const objects: Uint8Array[] = [];
  const pageIds = pages.map((_, index) => 3 + index * 3);
  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.push(encoder.encode(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));

  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const widthPt = (page.width * 72 / 96).toFixed(3);
    const heightPt = (page.height * 72 / 96).toFixed(3);
    objects.push(encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    const stream = encoder.encode(`q
${widthPt} 0 0 ${heightPt} 0 0 cm
/Im0 Do
Q
`);
    objects.push(joinBytes([encoder.encode(`<< /Length ${stream.byteLength} >>
stream
`), stream, encoder.encode("endstream")]));
    objects.push(joinBytes([
      encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.byteLength} >>
stream
`),
      page.bytes,
      encoder.encode("
endstream"),
    ]));
  });

  const parts: Uint8Array[] = [encoder.encode("%PDF-1.4
%\xE2\xE3\xCF\xD3
")];
  const offsets = [0];
  let offset = parts[0].byteLength;
  objects.forEach((object, index) => {
    offsets.push(offset);
    const wrapped = joinBytes([encoder.encode(`${index + 1} 0 obj
`), object, encoder.encode("
endobj
")]);
    parts.push(wrapped);
    offset += wrapped.byteLength;
  });
  const xrefOffset = offset;
  const xref = [
    `xref
0 ${objects.length + 1}
`,
    "0000000000 65535 f 
",
    ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n 
`),
    `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`,
  ].join("");
  parts.push(encoder.encode(xref));
  return new Blob([joinBytes(parts).buffer as ArrayBuffer], { type: "application/pdf" });
}
