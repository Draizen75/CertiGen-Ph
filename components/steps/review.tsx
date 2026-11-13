"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Recipient, OutputMode } from "@/lib/types";
import { generateDocx } from "@/lib/docx-engine";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, FileArchive, FileText, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  templateFile: File;
  recipients: Recipient[];
  mapping: Record<string, string>;
  placeholders: string[];
  delimiters: { start: string; end: string };
  outputMode: OutputMode;
  onBack: () => void;
  onGenerate: () => void;
}

export function Review({ templateFile, recipients, mapping, placeholders, delimiters, outputMode, onBack, onGenerate }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "error">("loading");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const selectedRecipient = recipients[selectedIndex] ?? {};
  const fields = useMemo(() => placeholders.map((placeholder) => ({
    placeholder,
    column: mapping[placeholder] ?? "",
    value: String(selectedRecipient[mapping[placeholder] ?? ""] ?? "").trim(),
  })), [placeholders, mapping, selectedRecipient]);
  const missingCount = useMemo(() => recipients.reduce((count, recipient) => (
    count + placeholders.filter((placeholder) => !String(recipient[mapping[placeholder] ?? ""] ?? "").trim()).length
  ), 0), [recipients, placeholders, mapping]);
  const isCombined = outputMode === "COMBINED_DOCX";

  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      setPreviewState("loading");
      setPreviewError(null);
      if (previewRef.current) previewRef.current.replaceChildren();

      try {
        const mergeData = Object.fromEntries(
          placeholders.map((placeholder) => [
            placeholder,
            String(selectedRecipient[mapping[placeholder] ?? ""] ?? ""),
          ]),
        );
        const templateBuffer = await templateFile.arrayBuffer();
        const mergedDocument = await generateDocx(templateBuffer, mergeData, delimiters);
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !previewRef.current) return;

        await renderAsync(mergedDocument, previewRef.current, previewRef.current, {
          className: "certigen-docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });

        if (!cancelled) setPreviewState("ready");
        else previewRef.current?.replaceChildren();
      } catch (error) {
        if (cancelled) return;
        console.error("Certificate preview failed:", error);
        setPreviewError(error instanceof Error ? error.message : "The Word template could not be rendered in the preview.");
        setPreviewState("error");
      }
    }

    void renderPreview();
    return () => {
      cancelled = true;
      previewRef.current?.replaceChildren();
    };
  }, [templateFile, selectedRecipient, mapping, placeholders, delimiters]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 5 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Review your certificates</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Preview the actual Word certificate with a recipient’s values merged into your uploaded template.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recipients</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{recipients.length.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mapped fields</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{placeholders.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Blank values</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{missingCount.toLocaleString()}</p>
        </div>
      </div>

      {missingCount > 0 ? (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Some recipient fields are blank</AlertTitle>
          <AlertDescription>
            {missingCount.toLocaleString()} mapped field value(s) are empty across this batch. Blank values will appear as empty text in the generated certificates.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>All mapped values are present</AlertTitle>
          <AlertDescription>Every recipient has a value for each mapped template field.</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-2xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Actual certificate preview</h3>
              <p className="text-xs text-muted-foreground">Rendered from your DOCX template, not a mock certificate.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Preview recipient
            <select
              aria-label="Choose recipient to preview"
              value={selectedIndex}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
              className="h-9 max-w-48 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            >
              {recipients.map((recipient, index) => (
                <option key={index} value={index}>
                  {index + 1}. {String(recipient.NAME ?? recipient.Name ?? recipient.name ?? Object.values(recipient)[0] ?? "Recipient").slice(0, 36)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative min-h-[420px] overflow-x-auto bg-muted/60 p-3 sm:p-6">
          {previewState === "loading" && (
            <div className="absolute inset-0 z-10 flex min-h-[420px] flex-col items-center justify-center gap-3 bg-muted/80 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              Preparing your personalized certificate…
            </div>
          )}
          {previewState === "error" && (
            <div className="mx-auto flex min-h-[360px] max-w-lg flex-col items-center justify-center gap-3 text-center">
              <AlertTriangle className="size-8 text-amber-600" />
              <p className="font-semibold">We couldn’t render this Word template</p>
              <p className="text-sm text-muted-foreground">{previewError}</p>
              <p className="text-xs text-muted-foreground">You can still continue. The original DOCX template will be used for generation.</p>
            </div>
          )}
          <div ref={previewRef} className="mx-auto w-fit min-w-0" />
        </div>
        <div className="flex items-start gap-3 border-t bg-card p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-5 text-muted-foreground">
            This preview uses the actual personalized DOCX output and preserves many Word layout elements, including text styles, tables, images, headers, and footers. Browser rendering can differ slightly from Microsoft Word, so use the downloaded document for final print-layout verification.
          </p>
        </div>
      </section>

      <section className="flex items-center gap-3 rounded-xl border p-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isCombined ? <FileText className="size-5" /> : <FileArchive className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{isCombined ? "One combined Word document" : "Individual Word documents in a ZIP"}</p>
          <p className="text-xs text-muted-foreground">{recipients.length.toLocaleString()} certificate(s) · {isCombined ? "DOCX" : "ZIP"}</p>
        </div>
      </section>

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to output options</Button>
        <Button className="w-full sm:w-auto" onClick={onGenerate}>
          Generate {recipients.length.toLocaleString()} certificates<ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
