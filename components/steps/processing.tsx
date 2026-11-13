"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recipient, OutputMode } from "@/lib/types";
import { generateDocx, mergeDocxBuffers } from "@/lib/docx-engine";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileArchive, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface Props {
  templateFile: File;
  recipients: Recipient[];
  mapping: Record<string, string>;
  delimiters: { start: string; end: string };
  outputMode: OutputMode;
  onBack: () => void;
}

type Certificate = {
  recipient: Recipient;
  docx: Blob | null;
  pdf: Blob | null;
  status: "generating" | "ready" | "error";
  error?: string;
  reviewed: boolean;
  approved: boolean;
};

function safeFileName(value: string, fallback: string) {
  const cleaned = value.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/[. ]+$/g, "").replace(/\s+/g, " ").trim().replace(/ /g, "_").slice(0, 80);
  return cleaned || fallback;
}

function recipientName(recipient: Recipient, mapping: Record<string, string>, index: number) {
  const nameColumn = Object.entries(mapping).find(([key]) => key.toLowerCase() === "name")?.[1];
  return String((nameColumn && recipient[nameColumn]) || Object.values(recipient)[0] || `Recipient ${index + 1}`);
}

async function convertDocxToPdf(docx: Blob, fileName: string): Promise<Blob> {
  const form = new FormData();
  form.append("file", docx, fileName);
  const response = await fetch("/api/convert", { method: "POST", body: form });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || `PDF conversion failed (${response.status}).`);
  }
  const pdf = await response.blob();
  if (pdf.type !== "application/pdf" || pdf.size === 0) throw new Error("The conversion service returned an invalid PDF.");
  return pdf;
}

export function Processing({ templateFile, recipients, mapping, delimiters, outputMode, onBack }: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [processed, setProcessed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editedRecipient, setEditedRecipient] = useState<Recipient>({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [combinedDocx, setCombinedDocx] = useState<Blob | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function generateBatch() {
      setIsGenerating(true);
      setBatchError(null);
      setCertificates(recipients.map((recipient) => ({
        recipient, docx: null, pdf: null, status: "generating", reviewed: false, approved: false,
      })));
      setProcessed(0);
      try {
        if (!recipients.length) throw new Error("There are no recipients to generate.");
        if (!Object.keys(mapping).length) throw new Error("No template fields have been mapped.");
        const templateBuffer = await templateFile.arrayBuffer();
        const generatedBuffers: ArrayBuffer[] = [];

        for (let index = 0; index < recipients.length; index++) {
          if (cancelled) return;
          const recipient = recipients[index];
          const mergeData = Object.fromEntries(
            Object.entries(mapping).map(([placeholder, column]) => [placeholder, String(recipient[column] ?? "")]),
          );
          try {
            const buffer = await generateDocx(templateBuffer, mergeData, delimiters);
            const docxBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            const name = safeFileName(recipientName(recipient, mapping, index), `certificate_${index + 1}`);
            const pdfBlob = await convertDocxToPdf(docxBlob, `${name}.docx`);
            if (cancelled) return;
            generatedBuffers.push(buffer);
            setCertificates((current) => current.map((item, itemIndex) => itemIndex === index
              ? { ...item, docx: docxBlob, pdf: pdfBlob, status: "ready" }
              : item));
          } catch (error) {
            if (cancelled) return;
            setCertificates((current) => current.map((item, itemIndex) => itemIndex === index
              ? { ...item, status: "error", error: error instanceof Error ? error.message : "Certificate generation failed." }
              : item));
          }
          setProcessed(index + 1);
        }

        if (cancelled) return;
        if (outputMode === "COMBINED_DOCX" && generatedBuffers.length === recipients.length) {
          setCombinedDocx(await mergeDocxBuffers(generatedBuffers));
        }
      } catch (error) {
        if (!cancelled) setBatchError(error instanceof Error ? error.message : "Batch generation failed.");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }
    void generateBatch();
    return () => { cancelled = true; };
  }, [templateFile, recipients, mapping, delimiters, outputMode]);

  const selected = certificates[selectedIndex];
  const generatedCount = certificates.filter((item) => item.status === "ready").length;
  const reviewedCount = certificates.filter((item) => item.reviewed).length;
  const approvedCount = certificates.filter((item) => item.approved).length;
  const failedCount = certificates.filter((item) => item.status === "error").length;
  const allGenerated = certificates.length > 0 && generatedCount === certificates.length && !isGenerating;
  const canDownload = allGenerated && approvedCount === certificates.length;
  const progress = recipients.length ? Math.round((processed / recipients.length) * 100) : 0;

  useEffect(() => {
    if (selected) setEditedRecipient(selected.recipient);
  }, [selectedIndex, certificates.length, selected?.recipient]);

  const editableFields = useMemo(() => Object.entries(mapping), [mapping]);

  async function regenerateSelected() {
    if (!selected) return;
    setIsRegenerating(true);
    setBatchError(null);
    try {
      const templateBuffer = await templateFile.arrayBuffer();
      const mergeData = Object.fromEntries(
        Object.entries(mapping).map(([placeholder, column]) => [placeholder, String(editedRecipient[column] ?? "")]),
      );
      const buffer = await generateDocx(templateBuffer, mergeData, delimiters);
      const docxBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const name = safeFileName(recipientName(editedRecipient, mapping, selectedIndex), `certificate_${selectedIndex + 1}`);
      const pdfBlob = await convertDocxToPdf(docxBlob, `${name}.docx`);
      setCertificates((current) => current.map((item, index) => index === selectedIndex
        ? { ...item, recipient: editedRecipient, docx: docxBlob, pdf: pdfBlob, status: "ready", error: undefined, reviewed: false, approved: false }
        : item));
      toast.success("Certificate regenerated. Please review and approve it again.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not regenerate this certificate.";
      setCertificates((current) => current.map((item, index) => index === selectedIndex
        ? { ...item, status: "error", error: message, reviewed: false, approved: false }
        : item));
      toast.error(message);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function downloadBatch() {
    if (!canDownload) return;
    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (let index = 0; index < certificates.length; index++) {
      const item = certificates[index];
      const base = safeFileName(recipientName(item.recipient, mapping, index), `certificate_${index + 1}`);
      let name = base, suffix = 2;
      while (usedNames.has(name.toLowerCase())) name = `${base}_${suffix++}`;
      usedNames.add(name.toLowerCase());
      zip.file(`${name}.pdf`, item.pdf!);
      if (outputMode === "SEPARATE_DOCX") zip.file(`${name}.docx`, item.docx!);
    }
    if (outputMode === "COMBINED_DOCX" && combinedDocx) zip.file("certificates_combined.docx", combinedDocx);
    const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    saveAs(archive, "certigen-approved-certificates.zip");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-3 sm:py-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 6 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{isGenerating ? "Generating your certificates" : "Review generated certificates"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each DOCX is generated once, converted to PDF, and reviewed from that exact PDF before download.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Generated", generatedCount, certificates.length],
          ["Reviewed", reviewedCount, certificates.length],
          ["Approved", approvedCount, certificates.length],
          ["Needs attention", failedCount, certificates.length],
        ].map(([label, count, total]) => (
          <div key={label} className="rounded-xl border bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{count}<span className="text-sm font-normal text-muted-foreground"> / {total}</span></p>
          </div>
        ))}
      </div>

      {isGenerating && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <div className="flex justify-between text-sm"><span>Generating and converting files</span><span>{progress}%</span></div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Processed {processed} of {recipients.length} recipients.</p>
        </div>
      )}

      {batchError && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Batch generation error</AlertTitle><AlertDescription>{batchError}</AlertDescription></Alert>}

      {failedCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{failedCount} certificate(s) need attention</AlertTitle>
          <AlertDescription>Select a failed recipient and retry. Downloads stay locked until every certificate has a valid PDF and approval.</AlertDescription>
        </Alert>
      )}

      {selected && (
        <section className="overflow-hidden rounded-2xl border">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Certificate review</h3>
              <p className="text-xs text-muted-foreground">Recipient {selectedIndex + 1} of {certificates.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={selectedIndex === 0} onClick={() => setSelectedIndex((value) => value - 1)}>Previous</Button>
              <select aria-label="Select recipient certificate" className="h-9 max-w-48 rounded-md border bg-background px-2 text-sm" value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
                {certificates.map((item, index) => <option key={index} value={index}>{index + 1}. {recipientName(item.recipient, mapping, index)}</option>)}
              </select>
              <Button variant="outline" size="sm" disabled={selectedIndex >= certificates.length - 1} onClick={() => setSelectedIndex((value) => value + 1)}>Next</Button>
            </div>
          </div>

          {selected.status === "generating" && <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Generating this certificate…</div>}
          {selected.status === "error" && (
            <div className="space-y-3 p-6">
              <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Certificate generation failed</AlertTitle><AlertDescription>{selected.error}</AlertDescription></Alert>
              <Button onClick={regenerateSelected} disabled={isRegenerating}><RefreshCw className="mr-2 size-4" />Retry this certificate</Button>
            </div>
          )}
          {selected.status === "ready" && selected.pdf && (
            <>
              <div className="bg-muted/50 p-2 sm:p-4">
                <iframe title={`PDF certificate for ${recipientName(selected.recipient, mapping, selectedIndex)}`} src={URL.createObjectURL(selected.pdf)} className="h-[65vh] min-h-[480px] w-full rounded-lg border bg-white" />
              </div>
              <div className="grid gap-4 border-t p-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4" />Correct recipient data</div>
                  <p className="text-xs text-muted-foreground">Change a mapped value and regenerate only this certificate. Its previous approval will be reset.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {editableFields.map(([placeholder, column]) => (
                      <div key={placeholder} className="space-y-1">
                        <Label htmlFor={`edit-${selectedIndex}-${placeholder}`} className="text-xs">{placeholder}</Label>
                        <Input id={`edit-${selectedIndex}-${placeholder}`} value={String(editedRecipient[column] ?? "")} onChange={(event) => setEditedRecipient((current) => ({ ...current, [column]: event.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={regenerateSelected} disabled={isRegenerating || JSON.stringify(editedRecipient) === JSON.stringify(selected.recipient)}>
                    {isRegenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Save changes & regenerate
                  </Button>
                </div>
                <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" />Review decision</div>
                  <p className="text-xs text-muted-foreground">Inspect the PDF above. Mark it reviewed, then approve it for the batch download.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={selected.reviewed ? "secondary" : "outline"} onClick={() => setCertificates((current) => current.map((item, index) => index === selectedIndex ? { ...item, reviewed: true } : item))}>
                      <CheckCircle2 className="mr-2 size-4" />{selected.reviewed ? "Reviewed" : "Mark as reviewed"}
                    </Button>
                    <Button disabled={!selected.reviewed || selected.approved} onClick={() => setCertificates((current) => current.map((item, index) => index === selectedIndex ? { ...item, approved: true } : item))}>
                      <ShieldCheck className="mr-2 size-4" />{selected.approved ? "Approved" : "Approve certificate"}
                    </Button>
                  </div>
                  {selected.approved && <p className="text-xs font-medium text-emerald-700">This certificate is approved for download.</p>}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}><ArrowLeft className="mr-2 size-4" />Back to output options</Button>
        <Button size="lg" onClick={downloadBatch} disabled={!canDownload}>
          <Download className="mr-2 size-4" />Download approved batch ({approvedCount}/{certificates.length})
        </Button>
      </div>
      {!canDownload && !isGenerating && <p className="text-center text-xs text-muted-foreground">Download unlocks after every certificate has generated successfully, been reviewed, and approved.</p>}
      {canDownload && <p className="flex items-center justify-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-4" />All certificates are generated, reviewed, and approved.</p>}
    </div>
  );
}
