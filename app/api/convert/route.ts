import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DOCX_BYTES = 4 * 1024 * 1024;

function getGotenbergUrl() {
  const configured = process.env.GOTENBERG_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("GOTENBERG_URL must use HTTPS outside local development.");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error("GOTENBERG_URL must be a valid HTTPS URL (HTTP is allowed only for localhost).");
  }
}

export async function GET() {
  try {
    const baseUrl = getGotenbergUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { error: "PDF preview is not configured. Set GOTENBERG_URL to your private Gotenberg service URL." },
        { status: 503 },
      );
    }
    const health = await fetch(`${baseUrl}/health`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!health.ok) {
      return NextResponse.json({ error: "The configured PDF conversion service is unhealthy." }, { status: 503 });
    }
    return NextResponse.json({ ready: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF conversion service is unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const baseUrl = getGotenbergUrl();
    if (!baseUrl) {
      return NextResponse.json({ error: "PDF preview is not configured. Set GOTENBERG_URL first." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload one DOCX file for conversion." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_DOCX_BYTES) {
      return NextResponse.json({ error: "The generated DOCX must be between 1 byte and 4 MB for PDF conversion." }, { status: 413 });
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX files can be converted." }, { status: 415 });
    }

    const converterForm = new FormData();
    converterForm.append("files", file, "certificate.docx");
    const conversion = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
      method: "POST",
      body: converterForm,
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });
    if (!conversion.ok) {
      return NextResponse.json({ error: "The PDF conversion service could not convert this certificate. Check the template and converter logs." }, { status: 502 });
    }

    const pdf = await conversion.arrayBuffer();
    const signature = new Uint8Array(pdf.slice(0, 5));
    if (signature[0] !== 0x25 || signature[1] !== 0x50 || signature[2] !== 0x44 || signature[3] !== 0x46 || signature[4] !== 0x2d) {
      return NextResponse.json({ error: "The conversion service returned an invalid PDF file." }, { status: 502 });
    }

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate-preview.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "PDF conversion timed out. Try again or check the converter service."
      : "PDF conversion failed. Check the converter service and try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
