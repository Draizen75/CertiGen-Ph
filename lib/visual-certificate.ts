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

const MAX_CANVAS_PIXELS = 40_000_000;

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
    let fontSize = Math.max(8, field.fontSize);
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
