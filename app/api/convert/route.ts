import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const configuredUrl = process.env.GOTENBERG_URL?.trim();
  if (!configuredUrl) {
    return NextResponse.json(
      { ready: false, error: "PDF conversion is not configured. Set GOTENBERG_URL to a trusted Gotenberg service." },
      { status: 503 },
    );
  }
  try {
    const baseUrl = new URL(configuredUrl);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("GOTENBERG_URL must use HTTP or HTTPS.");
    const healthUrl = new URL("/health", baseUrl);
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
    if (!response.ok) throw new Error(`Gotenberg health check returned ${response.status}.`);
    return NextResponse.json({ ready: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The PDF conversion service is unavailable.";
    return NextResponse.json({ ready: false, error: message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const gotenbergUrl = process.env.GOTENBERG_URL?.trim();
  if (!gotenbergUrl) {
    return NextResponse.json(
      { error: "PDF conversion is not configured. Set GOTENBERG_URL to a private or trusted Gotenberg service URL." },
      { status: 503 },
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(gotenbergUrl);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("Unsupported protocol");
  } catch {
    return NextResponse.json({ error: "GOTENBERG_URL must be a valid HTTP(S) URL." }, { status: 500 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "A non-empty DOCX file is required." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX files can be converted." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "The generated DOCX exceeds the 10 MB conversion limit." }, { status: 413 });
    }

    const form = new FormData();
    form.append("files", file, file.name);
    const endpoint = new URL("/forms/libreoffice/convert", baseUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(50_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      return NextResponse.json(
        { error: `The PDF conversion service returned ${response.status}.${detail ? ` ${detail}` : ""}` },
        { status: 502 },
      );
    }

    const pdf = await response.arrayBuffer();
    if (pdf.byteLength < 5 || new TextDecoder().decode(pdf.slice(0, 5)) !== "%PDF-") {
      return NextResponse.json({ error: "The conversion service did not return a valid PDF." }, { status: 502 });
    }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown conversion error";
    return NextResponse.json({ error: `PDF conversion failed: ${message}` }, { status: 502 });
  }
}
