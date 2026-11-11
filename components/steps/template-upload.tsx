"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, AlertCircle, CheckCircle2, Loader2, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlaceholdersFromDocx } from "@/lib/docx-engine";

interface Props {
  onFileSelected: (file: File, placeholders: string[], delimiters: { start: string; end: string }) => void;
}

const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

export function TemplateUpload({ onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState<{ start: string; end: string }>({ start: "{{", end: "}}" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".docx")) {
      setError("Please choose a Word document (.docx).");
      return;
    }
    if (selectedFile.size === 0) {
      setError("This file is empty. Choose a valid Word template.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFile(null);
    setPlaceholders([]);

    try {
      const { placeholders: foundPlaceholders, delimiters: foundDelimiters } = await getPlaceholdersFromDocx(selectedFile);
      if (foundPlaceholders.length === 0) {
        setError("No placeholders were found. Add fields such as {{NAME}}, [NAME], or «NAME» to your template.");
        return;
      }
      setFile(selectedFile);
      setPlaceholders(foundPlaceholders);
      setDelimiters(foundDelimiters);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We couldn’t read this Word file. It may be corrupted or unsupported.");
      console.error("Template parsing failed:", uploadError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: MAX_TEMPLATE_BYTES,
    multiple: false,
    disabled: isLoading,
    onDropRejected: (rejections) => {
      const tooLarge = rejections.some((rejection) => rejection.errors.some((issue) => issue.code === "file-too-large"));
      setError(tooLarge ? "Template files must be 10 MB or smaller." : "Only one .docx Word document can be uploaded at a time.");
    },
  });

  const removeFile = () => {
    setFile(null);
    setPlaceholders([]);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 1 OF 5</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Start with your Word template</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upload a DOCX file that already has the design and layout you want to use.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`group relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:min-h-64 sm:p-10 ${isDragActive ? "border-primary bg-primary/5" : file ? "border-emerald-500/50 bg-emerald-500/[0.03]" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/[0.02]"} ${isDragReject ? "border-destructive bg-destructive/5" : ""}`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Loader2 className="size-7 animate-spin" /></span>
            <p className="font-semibold">Reading your template…</p>
            <p className="mt-1 text-sm text-muted-foreground">Looking for merge fields in your Word document.</p>
          </>
        ) : file ? (
          <>
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-7" /></span>
            <p className="max-w-full break-all font-semibold text-foreground">{file.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · {placeholders.length} fields detected</p>
            <span className="mt-4 text-xs font-medium text-primary">Choose another file</span>
            <Button type="button" variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); removeFile(); }} className="mt-2 text-muted-foreground">
              <X className="mr-2 size-4" />Remove template
            </Button>
          </>
        ) : (
          <>
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105"><Upload className="size-7" /></span>
            <p className="font-semibold text-foreground">{isDragActive ? "Drop your template here" : "Drag and drop your DOCX template"}</p>
            <p className="mt-2 text-sm text-muted-foreground">or <span className="font-medium text-primary">browse files</span> on your device</p>
            <span className="mt-5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">DOCX · Up to 10 MB</span>
          </>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Template issue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {placeholders.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Fields detected</p>
              <p className="mt-0.5 text-xs text-muted-foreground">These values will be personalized for each recipient.</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{placeholders.length} found</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((placeholder) => (
              <code key={placeholder} className="rounded-lg border bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-foreground">
                {delimiters.start}{placeholder}{delimiters.end}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">Your Word template stays on this device. CertiGen reads it locally to detect placeholders before generation.</p>
      </div>

      <div className="flex justify-end border-t pt-5">
        <Button onClick={() => file && placeholders.length > 0 && onFileSelected(file, placeholders, delimiters)} disabled={!file || placeholders.length === 0 || isLoading}>
          Continue to recipient data
          <FileText className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}