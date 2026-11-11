"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, FileText, FileArchive, ArrowLeft, Download } from "lucide-react";
import { Recipient, OutputMode } from "@/lib/types";
import { generateDocx, mergeDocxBuffers } from "@/lib/docx-engine";
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

function safeFileName(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFKC")
    .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, " ")
    .replace(/[. ]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ /g, "_")
    .slice(0, 80);
  return cleaned || fallback;
}

export function Processing({ templateFile, recipients, mapping, delimiters, outputMode, onBack }: Props) {
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed" | "error">("processing");
  const [error, setError] = useState<string | null>(null);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [generationAttempt, setGenerationAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function startGeneration() {
      try {
        setProgress(0);
        setProcessed(0);
        setStatus("processing");
        setError(null);
        setFinalBlob(null);

        if (recipients.length === 0) throw new Error("There are no recipients to generate.");
        if (Object.keys(mapping).length === 0) throw new Error("No template fields have been mapped.");

        const templateBuffer = await templateFile.arrayBuffer();
        if (cancelled) return;

        const docxBuffers: ArrayBuffer[] = [];
        const zip = outputMode === "SEPARATE_DOCX" ? new JSZip() : null;
        const usedNames = new Set<string>();
        const nameColumn = Object.entries(mapping).find(([placeholder]) => placeholder.toLowerCase() === "name")?.[1];

        for (let index = 0; index < recipients.length; index++) {
          if (cancelled) return;
          const recipient = recipients[index];
          const mappedData: Record<string, string> = {};

          Object.entries(mapping).forEach(([placeholder, column]) => {
            mappedData[placeholder] = String(recipient[column] ?? "");
          });

          const docxBuffer = await generateDocx(templateBuffer, mappedData, delimiters);
          if (cancelled) return;

          if (outputMode === "COMBINED_DOCX") {
            docxBuffers.push(docxBuffer);
          } else if (zip) {
            const recipientName = nameColumn ? String(recipient[nameColumn] ?? "") : "";
            const baseName = safeFileName(recipientName, `certificate_${index + 1}`);
            let uniqueName = baseName;
            let suffix = 2;
            while (usedNames.has(uniqueName.toLocaleLowerCase())) {
              uniqueName = baseName + "_" + suffix;
              suffix += 1;
            }
            usedNames.add(uniqueName.toLocaleLowerCase());
            zip.file(uniqueName + ".docx", docxBuffer);
          }

          setProcessed(index + 1);
          setProgress(Math.round(((index + 1) / recipients.length) * 85));
          if (index % 5 === 4) await new Promise((resolve) => setTimeout(resolve, 0));
        }

        if (cancelled) return;
        let output: Blob;

        if (outputMode === "COMBINED_DOCX") {
          output = await mergeDocxBuffers(docxBuffers);
        } else {
          if (!zip) throw new Error("The ZIP archive could not be initialized.");
          output = await zip.generateAsync(
            { type: "blob", compression: "DEFLATE" },
            (metadata) => {
              if (!cancelled) setProgress(85 + Math.round(metadata.percent * 0.15));
            }
          );
        }

        if (cancelled) return;
        if (output.size === 0) throw new Error("The generated file is empty. Please try again with a different template.");
        setFinalBlob(output);
        setProgress(100);
        setStatus("completed");
        toast.success(`Generated ${recipients.length.toLocaleString()} certificates successfully.`);
      } catch (generationError) {
        if (cancelled) return;
        setStatus("error");
        setError(generationError instanceof Error ? generationError.message : "Generation failed. Please review your template and data.");
        console.error("Certificate generation failed:", generationError);
      }
    }

    void startGeneration();
    return () => {
      cancelled = true;
    };
  }, [templateFile, recipients, mapping, delimiters, outputMode, generationAttempt]);

  const isCombined = outputMode === "COMBINED_DOCX";

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4 sm:py-8">
      <div className="text-center">
        {status === "processing" && (
          <>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-primary">STEP 6 OF 6</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Creating your certificates</h2>
            <p className="mt-2 text-sm text-muted-foreground">Keep this tab open while your files are being prepared.</p>
          </>
        )}
        {status === "completed" && (
          <>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Your files are ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your documents were generated in this browser and are ready to download.</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">We couldn’t finish generating</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your original template and data have not been changed.</p>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{status === "completed" ? "Completed" : "Generation progress"}</span>
          <span className="tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2.5" />
        <p className="text-xs text-muted-foreground">
          {status === "processing"
            ? `Processed ${processed.toLocaleString()} of ${recipients.length.toLocaleString()} recipients`
            : status === "completed"
              ? `${recipients.length.toLocaleString()} certificates generated`
              : "Generation stopped before a download was created."}
        </p>
      </div>

      {status === "error" && (
        <div className="space-y-3">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => setGenerationAttempt((attempt) => attempt + 1)} className="w-full sm:w-auto">
          Try generating again
        </Button>
        </div>
      )}

      {status === "completed" && finalBlob && (
        <div className="rounded-2xl border bg-card p-5 text-center sm:p-7">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isCombined ? <FileText className="size-6" /> : <FileArchive className="size-6" />}
          </div>
          <p className="font-semibold">{isCombined ? "Combined Word document" : "Individual Word documents"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCombined ? "One DOCX file with all certificates." : `A ZIP archive containing ${recipients.length.toLocaleString()} DOCX files.`}
          </p>
          <Button
            size="lg"
            className="mt-6 w-full sm:w-auto"
            onClick={() => saveAs(finalBlob, isCombined ? "certificates_combined.docx" : "certificates.zip")}
          >
            <Download className="mr-2 size-4" />
            Download {isCombined ? "DOCX" : "ZIP"}
          </Button>
        </div>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        {status === "processing" ? (
          <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Cancel generation</Button>
        ) : (
          <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />{status === "error" ? "Review settings" : "Change output"}</Button>
        )}
        {status === "completed" && (
          <Button variant="ghost" onClick={() => window.location.reload()}>Start a new batch</Button>
        )}
      </div>
    </div>
  );
}