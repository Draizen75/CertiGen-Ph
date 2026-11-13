"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle2, CheckCheck, Download, Image as ImageIcon, Loader2, RefreshCw, ShieldCheck, SkipForward } from "lucide-react";
import { Recipient } from "@/lib/types";
import { VisualBackground, VisualField, createPdfFromPngs, renderVisualCertificate } from "@/lib/visual-certificate";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

type Item = { recipient: Recipient; image: Blob | null; status: "generating" | "ready" | "error"; error?: string; reviewed: boolean; approved: boolean };
interface Props { background: VisualBackground; fields: VisualField[]; recipients: Recipient[]; onBack: () => void; }

function safeName(value: string, fallback: string) {
  return value.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ").replace(/[. ]+$/g, "").trim().replace(/\s+/g, "_").slice(0, 80) || fallback;
}
function getName(recipient: Recipient, fields: VisualField[], index: number) {
  const nameField = fields.find((field) => /name/i.test(field.label));
  return String((nameField && recipient[nameField.column]) || Object.values(recipient)[0] || `Recipient ${index + 1}`);
}

export function VisualProcessing({ background, fields, recipients, onBack }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [processed, setProcessed] = useState(0);
  const [generating, setGenerating] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [edited, setEdited] = useState<Recipient>(recipients[0] ?? {});
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setGenerating(true); setProcessed(0); setBatchError(null);
      setItems(recipients.map((recipient) => ({ recipient, image: null, status: "generating", reviewed: false, approved: false })));
      for (let index = 0; index < recipients.length; index++) {
        if (cancelled) return;
        try {
          const image = await renderVisualCertificate(background, fields, recipients[index]);
          if (cancelled) return;
          setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, image, status: "ready" } : item));
        } catch (error) {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "Image generation failed.";
          setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: "error", error: message } : item));
        }
        setProcessed(index + 1);
      }
      if (!cancelled) setGenerating(false);
    }
    if (!recipients.length || !fields.length) { setBatchError("Add recipients and map at least one visual field."); setGenerating(false); return; }
    void run().catch((error) => { if (!cancelled) { setBatchError(error instanceof Error ? error.message : "Batch generation failed."); setGenerating(false); } });
    return () => { cancelled = true; };
  }, [background, fields, recipients]);

  const selected = items[selectedIndex];
  const readyCount = items.filter((item) => item.status === "ready" && item.image).length;
  const reviewedCount = items.filter((item) => item.reviewed).length;
  const approvedCount = items.filter((item) => item.approved).length;
  const failedCount = items.filter((item) => item.status === "error").length;
  const allReady = items.length > 0 && readyCount === items.length;
  const allReviewed = allReady && reviewedCount === items.length;
  const allApproved = allReviewed && approvedCount === items.length;
  const canDownload = allApproved && !generating && !downloading;
  const columns = useMemo(() => [...new Set(fields.map((field) => field.column))], [fields]);

  useEffect(() => {
    if (!selected?.image) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(selected.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selected?.image]);

  const selectRecipient = (index: number) => { setSelectedIndex(index); setEdited(items[index]?.recipient ?? {}); };
  const regenerate = async () => {
    if (!selected) return;
    setRegenerating(true);
    try {
      const image = await renderVisualCertificate(background, fields, edited);
      setItems((current) => current.map((item, index) => index === selectedIndex
        ? { ...item, recipient: edited, image, status: "ready", error: undefined, reviewed: false, approved: false }
        : item));
      toast.success("Certificate updated. Its review and approval were reset.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not regenerate this certificate."); }
    finally { setRegenerating(false); }
  };
  const retrySelected = async () => {\n    if (!selected) return;\n    setRegenerating(true);\n    try {\n      const image = await renderVisualCertificate(background, fields, edited);\n      setItems((current) => current.map((item, index) => index === selectedIndex ? { ...item, recipient: edited, image, status: "ready", error: undefined, reviewed: false, approved: false } : item));\n      toast.success("Certificate generated. Review and approve it before download.");\n    } catch (error) { toast.error(error instanceof Error ? error.message : "Retry failed."); }\n    finally { setRegenerating(false); }\n  };\n  const markAllReviewed = () => {
    if (!allReady) return;
    setItems((current) => current.map((item) => item.status === "ready" ? { ...item, reviewed: true } : item));
    toast.success("All certificates marked as reviewed.");
  };
  const approveAll = () => {
    if (!allReviewed) return;
    if (!window.confirm(`Approve all ${items.length} certificates for download?`)) return;
    setItems((current) => current.map((item) => item.reviewed ? { ...item, approved: true } : item));
    toast.success("All certificates approved.");
  };
  const nextUnreviewed = () => {
    const index = items.findIndex((item, i) => i > selectedIndex && item.status === "ready" && !item.reviewed);
    const next = index >= 0 ? index : items.findIndex((item) => item.status === "ready" && !item.reviewed);
    if (next >= 0) selectRecipient(next);
  };
  const download = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      items.forEach((item, index) => {
        if (item.image && item.approved) zip.file(`${String(index + 1).padStart(4, "0")}_${safeName(getName(item.recipient, fields, index), `recipient_${index + 1}`)}.png`, item.image);
      });
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      saveAs(blob, `certigen-certificates-${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success(`Downloaded ${approvedCount} PNG certificates and a combined PDF.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the ZIP download."); }
    finally { setDownloading(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center"><p className="text-sm font-semibold text-primary">STEP 6 OF 6</p><h2 className="mt-2 text-2xl font-bold">Review generated certificates</h2><p className="mt-2 text-sm text-muted-foreground">Each certificate is rendered directly from your artwork. PNG files and a combined multi-page PDF are created locally in your browser.</p></div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[[ "Generated", readyCount ],[ "Reviewed", reviewedCount ],[ "Approved", approvedCount ],[ "Needs attention", failedCount ]].map(([label, value]) => <div key={String(label)} className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{Number(value).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {items.length}</span></p></div>)}
      </div>
      {generating && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Rendering PNG certificates</span><span>{items.length ? Math.round(processed / items.length * 100) : 0}%</span></div><Progress value={items.length ? processed / items.length * 100 : 0} /><p className="text-xs text-muted-foreground">{processed} of {items.length} recipients processed.</p></div>}
      {batchError && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Batch generation error</AlertTitle><AlertDescription>{batchError}</AlertDescription></Alert>}
      {failedCount > 0 && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>{failedCount} certificate(s) need attention</AlertTitle><AlertDescription>Select a failed recipient and retry after correcting their data.</AlertDescription></Alert>}
      {allReady && !generating && <section className="space-y-3 rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Batch review actions</h3><p className="text-xs text-muted-foreground">Review a sample or navigate recipients, then confirm bulk review and approval.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={nextUnreviewed} disabled={allReviewed}><SkipForward className="mr-2 size-4" />Next unreviewed</Button><Button size="sm" variant="outline" onClick={markAllReviewed} disabled={allReviewed}><CheckCircle2 className="mr-2 size-4" />Mark all reviewed</Button><Button size="sm" onClick={approveAll} disabled={!allReviewed || allApproved}><CheckCheck className="mr-2 size-4" />Approve all</Button></div></div><p className="text-xs text-muted-foreground">Bulk actions are explicit confirmations; they do not claim that the system visually inspected every certificate.</p></section>}
      {selected && <section className="overflow-hidden rounded-2xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h3 className="font-semibold">Certificate review</h3><p className="text-xs text-muted-foreground">Recipient {selectedIndex + 1} of {items.length}</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={!selectedIndex} onClick={() => selectRecipient(selectedIndex - 1)}>Previous</Button><select aria-label="Select recipient" className="h-9 max-w-56 rounded-md border bg-background px-2 text-sm" value={selectedIndex} onChange={(event) => selectRecipient(Number(event.target.value))}>{items.map((item, index) => <option key={index} value={index}>{index + 1}. {getName(item.recipient, fields, index)} · {item.status}</option>)}</select><Button size="sm" variant="outline" disabled={selectedIndex >= items.length - 1} onClick={() => selectRecipient(selectedIndex + 1)}>Next</Button></div></div>
        {selected.status === "generating" && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Rendering certificate…</div>}
        {selected.status === "error" && <div className="space-y-4 p-5"><Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Certificate rendering failed</AlertTitle><AlertDescription>{selected.error}</AlertDescription></Alert><div className="grid gap-3 sm:grid-cols-2">{columns.map((column) => <div key={column} className="space-y-1"><Label className="text-xs">{column}</Label><Input value={String(edited[column] ?? "")} onChange={(event) => setEdited((current) => ({ ...current, [column]: event.target.value }))} /></div>)}</div><Button onClick={retrySelected} disabled={regenerating}><RefreshCw className="mr-2 size-4" />Retry this certificate</Button></div>}
        {selected.status === "ready" && previewUrl && <><div className="bg-muted/40 p-4"><img src={previewUrl} alt={`Certificate for ${getName(selected.recipient, fields, selectedIndex)}`} className="mx-auto max-h-[70vh] w-full rounded-lg border bg-white object-contain shadow-sm" /></div><div className="grid gap-4 border-t p-4 lg:grid-cols-[1fr_1fr]"><div className="space-y-3"><div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="size-4" />Correct recipient data</div><div className="grid gap-3 sm:grid-cols-2">{columns.map((column) => <div key={column} className="space-y-1"><Label className="text-xs">{column}</Label><Input value={String(edited[column] ?? "")} onChange={(event) => setEdited((current) => ({ ...current, [column]: event.target.value }))} /></div>)}</div><Button variant="outline" onClick={regenerate} disabled={regenerating || JSON.stringify(edited) === JSON.stringify(selected.recipient)}>{regenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Save changes & regenerate</Button></div><div className="space-y-3 rounded-xl bg-muted/40 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" />Review decision</div><p className="text-xs text-muted-foreground">Inspect the rendered certificate, then mark it reviewed and approve it.</p><div className="flex flex-wrap gap-2"><Button variant={selected.reviewed ? "secondary" : "outline"} onClick={() => setItems((current) => current.map((item, index) => index === selectedIndex ? { ...item, reviewed: true } : item))}><CheckCircle2 className="mr-2 size-4" />{selected.reviewed ? "Reviewed" : "Mark reviewed"}</Button><Button disabled={!selected.reviewed || selected.approved} onClick={() => setItems((current) => current.map((item, index) => index === selectedIndex ? { ...item, approved: true } : item))}><ShieldCheck className="mr-2 size-4" />{selected.approved ? "Approved" : "Approve"}</Button></div></div></div></>}
      </section>}
      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row"><Button variant="outline" onClick={onBack} disabled={generating}><ArrowLeft className="mr-2 size-4" />Back to options</Button><Button size="lg" onClick={download} disabled={!canDownload}><Download className="mr-2 size-4" />Download PNGs + PDF ({approvedCount}/{items.length})</Button></div>
      {!canDownload && <p className="text-center text-xs text-muted-foreground">Download unlocks after every PNG is generated, reviewed, and approved.</p>}
      {canDownload && <p className="flex items-center justify-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-4" />All certificates are ready for download.</p>}
    </div>
  );
}
