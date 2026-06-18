"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Zap, FileText, FileArchive, ArrowLeft } from "lucide-react";
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

export function Processing({ templateFile, recipients, mapping, delimiters, outputMode, onBack }: Props) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed" | "error">("processing");
  const [error, setError] = useState<string | null>(null);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);

  useEffect(() => {
    async function startGeneration() {
      try {
        const templateBuffer = await templateFile.arrayBuffer();
        const docxBuffers: ArrayBuffer[] = [];
        const zip = outputMode === "SEPARATE_DOCX" ? new JSZip() : null;
        
        const total = recipients.length;
        
        for (let i = 0; i < total; i++) {
          const recipient = recipients[i];
          const mappedData: Record<string, string> = {};
          Object.entries(mapping).forEach(([ph, col]) => {
            mappedData[ph] = recipient[col] || "";
          });

          // Generate single DOCX certificate
          const docxBuffer = await generateDocx(templateBuffer, mappedData, delimiters);
          
          if (outputMode === "COMBINED_DOCX") {
            docxBuffers.push(docxBuffer);
          } else if (zip) {
            const name = recipient[mapping["NAME"] || Object.keys(recipient)[0]] || `certificate_${i + 1}`;
            zip.file(`${name}.docx`, docxBuffer);
          }

          setProgress(Math.round(((i + 1) / total) * 90)); 
          
          if (i % 5 === 0) await new Promise(r => setTimeout(r, 10)); // Breathe
        }

        if (outputMode === "COMBINED_DOCX") {
          if (docxBuffers.length > 0) {
             const combinedBlob = await mergeDocxBuffers(docxBuffers);
             setFinalBlob(combinedBlob);
          }
        } else if (zip) {
          const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
          setFinalBlob(zipBlob);
        }
        
        setProgress(100);
        setStatus("completed");
        toast.success(`Successfully processed ${total} certificates!`);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Generation failed.");
        console.error(err);
      }
    }

    startGeneration();
  }, [templateFile, recipients, mapping, outputMode]);

  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        {status === "processing" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full animate-pulse">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Direct Structure Generation</h2>
            <p className="text-slate-500 mt-1">Generating 100% accurate Word documents.</p>
          </>
        )}
        {status === "completed" && (
          <>
            <h2 className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8" />
              Generation Complete!
            </h2>
            <p className="text-slate-500 mt-1">Your 100% accurate certificates are ready.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-8 w-8" />
              Error
            </h2>
            <p className="text-slate-500 mt-1">{error}</p>
          </>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-between text-sm font-medium text-slate-600">
          <span>{status === "completed" ? "Finished" : "Progress"}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {status === "completed" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center pt-4">
            {finalBlob && outputMode === "COMBINED_DOCX" && (
              <Button
                onClick={() => saveAs(finalBlob, "certificates_combined.docx")}
                className="h-28 px-12 flex flex-col items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 shadow-lg border-2 border-blue-900"
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold text-lg">Download Combined Word (.docx)</div>
                  <div className="text-xs opacity-90 uppercase tracking-wider font-bold mt-1">All certificates in one file</div>
                </div>
              </Button>
            )}
            {finalBlob && outputMode === "SEPARATE_DOCX" && (
              <Button
                onClick={() => saveAs(finalBlob, "certificates.zip")}
                className="h-28 px-12 flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 shadow-lg border-2 border-slate-900"
              >
                <FileArchive className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold text-lg">Download Separate Files (.zip)</div>
                  <div className="text-xs opacity-90 uppercase tracking-wider font-bold mt-1">Individual .docx files</div>
                </div>
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={onBack} className="mt-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Change Download Option
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex justify-center pt-4">
          <Button onClick={onBack} variant="outline">Try Again</Button>
        </div>
      )}

      {status === "completed" && (
        <div className="text-center pt-8">
          <Button variant="ghost" onClick={() => window.location.reload()} className="text-slate-500">
            Start New Project
          </Button>
        </div>
      )}
    </div>
  );
}
