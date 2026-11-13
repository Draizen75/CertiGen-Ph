"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, AlertCircle, CheckCircle2, Loader2, X, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlaceholdersFromDocx } from "@/lib/docx-engine";
import { loadVisualBackground, VisualBackground } from "@/lib/visual-certificate";

type TemplateKind = "docx" | "image" | "pdf";
interface Props {
  onFileSelected: (file: File, kind: TemplateKind, placeholders: string[], delimiters: { start: string; end: string }, background: VisualBackground | null) => void;
}
const MAX_TEMPLATE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
};

export function TemplateUpload({ onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<TemplateKind>("docx");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState({ start: "{{", end: "}}" });
  const [background, setBackground] = useState<VisualBackground | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (!selected) return;
    if (!selected.size) { setError("This file is empty. Choose a valid certificate template."); return; }
    setIsLoading(true); setError(null); setFile(null); setBackground(null); setPlaceholders([]);
    try {
      const extension = selected.name.toLowerCase().split(".").pop();
      if (extension === "docx") {
        const parsed = await getPlaceholdersFromDocx(selected);
        if (!parsed.placeholders.length) throw new Error("No placeholders found. Add fields such as {{NAME}} to your Word template.");
        setKind("docx"); setPlaceholders(parsed.placeholders); setDelimiters(parsed.delimiters);
      } else if (["png", "jpg", "jpeg", "pdf"].includes(extension ?? "")) {
        const loaded = await loadVisualBackground(selected);
        setKind(extension === "pdf" ? "pdf" : "image");
        setBackground(loaded);
      } else {
        throw new Error("Choose a DOCX, PNG, JPG, JPEG, or PDF certificate template.");
      }
      setFile(selected);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We couldn't read this template.");
    } finally { setIsLoading(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept: ACCEPTED, maxSize: MAX_TEMPLATE_BYTES, multiple: false, disabled: isLoading,
    onDropRejected: (rejections) => {
      const tooLarge = rejections.some((item) => item.errors.some((issue) => issue.code === "file-too-large"));
      setError(tooLarge ? "Template files must be 15 MB or smaller." : "Choose one DOCX, PNG, JPG, JPEG, or PDF file.");
    },
  });
  const removeFile = () => { setFile(null); setPlaceholders([]); setBackground(null); setError(null); };
  const isVisual = kind !== "docx";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 1 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose your certificate template</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Use an existing Word template or upload certificate artwork and place the personalized fields yourself.</p>
      </div>
      <div {...getRootProps()} className={`group relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:min-h-64 sm:p-10 ${isDragActive ? "border-primary bg-primary/5" : file ? "border-emerald-500/50 bg-emerald-500/[0.03]" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/[0.02]"} ${isDragReject ? "border-destructive bg-destructive/5" : ""}`}>
        <input {...getInputProps()} />
        {isLoading ? <><span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Loader2 className="size-7 animate-spin" /></span><p className="font-semibold">Preparing your template…</p><p className="mt-1 text-sm text-muted-foreground">Reading the document or rendering the first PDF page locally.</p></>
        : file ? <><span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">{isVisual ? <ImageIcon className="size-7" /> : <CheckCircle2 className="size-7" />}</span><p className="max-w-full break-all font-semibold">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · {isVisual ? "Visual template ready" : `${placeholders.length} merge fields detected`}</p><span className="mt-4 text-xs font-medium text-primary">Choose another file</span><Button type="button" variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); removeFile(); }} className="mt-2 text-muted-foreground"><X className="mr-2 size-4" />Remove template</Button></>
        : <><span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105"><Upload className="size-7" /></span><p className="font-semibold">{isDragActive ? "Drop your template here" : "Drag and drop your certificate template"}</p><p className="mt-2 text-sm text-muted-foreground">or <span className="font-medium text-primary">browse files</span> on your device</p><span className="mt-5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">DOCX · PNG · JPG · PDF · Up to 15 MB</span></>}
      </div>
      {error && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Template issue</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {file && isVisual && background && <div className="space-y-2 rounded-xl border bg-card p-4"><p className="text-sm font-semibold">Artwork preview</p><img src={background.dataUrl} alt="Uploaded certificate artwork" className="max-h-64 w-full rounded-lg object-contain" /><p className="text-xs text-muted-foreground">{background.width} × {background.height}px{kind === "pdf" ? ` · first page of ${background.pageCount}` : ""}. Text fields will be added in the next step.</p></div>}
      {file && !isVisual && placeholders.length > 0 && <div className="rounded-2xl border bg-card p-4"><p className="font-semibold">Fields detected</p><div className="mt-3 flex flex-wrap gap-2">{placeholders.map((item) => <code key={item} className="rounded-lg border bg-muted/60 px-2.5 py-1.5 text-xs">{delimiters.start}{item}{delimiters.end}</code>)}</div></div>}
      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">Templates are processed locally in your browser. For PDF templates, CertiGen uses the first page as the background image.</p></div>
      <div className="flex justify-end border-t pt-5"><Button onClick={() => file && onFileSelected(file, kind, placeholders, delimiters, background)} disabled={!file || isLoading}>Continue to recipient data<FileText className="ml-2 size-4" /></Button></div>
    </div>
  );
}
