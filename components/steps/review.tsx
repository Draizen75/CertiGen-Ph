"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Recipient, OutputMode } from "@/lib/types";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileArchive, FileText, ShieldCheck } from "lucide-react";

interface Props {
  recipients: Recipient[];
  mapping: Record<string, string>;
  placeholders: string[];
  outputMode: OutputMode;
  onBack: () => void;
  onGenerate: () => void;
}

export function Review({ recipients, mapping, placeholders, outputMode, onBack, onGenerate }: Props) {
  const missingCount = useMemo(() => recipients.reduce((count, recipient) => (
    count + placeholders.filter((placeholder) => !String(recipient[mapping[placeholder] ?? ""] ?? "").trim()).length
  ), 0), [recipients, placeholders, mapping]);
  const isCombined = outputMode === "COMBINED_DOCX";
  const sampleRecipients = recipients.slice(0, 5);
  const namePlaceholder = placeholders.find((field) => field.toLowerCase() === "name") ?? placeholders[0];
  const nameColumn = namePlaceholder ? mapping[namePlaceholder] : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 5 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Confirm your batch</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Check recipient data and field mappings before generating the actual certificates. You’ll review the generated PDF files in the next step.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Recipients</p><p className="mt-1 text-2xl font-semibold tabular-nums">{recipients.length.toLocaleString()}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Mapped fields</p><p className="mt-1 text-2xl font-semibold tabular-nums">{placeholders.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Blank values</p><p className="mt-1 text-2xl font-semibold tabular-nums">{missingCount.toLocaleString()}</p></div>
      </div>

      {missingCount > 0 ? (
        <Alert><AlertTriangle className="size-4" /><AlertTitle>Some recipient fields are blank</AlertTitle><AlertDescription>{missingCount.toLocaleString()} mapped field value(s) are empty. You can go back to recipient data to correct them, or continue knowing blank placeholders will be empty.</AlertDescription></Alert>
      ) : (
        <Alert><CheckCircle2 className="size-4" /><AlertTitle>Recipient data looks complete</AlertTitle><AlertDescription>Every recipient has a value for each mapped template field.</AlertDescription></Alert>
      )}

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-4"><h3 className="font-semibold">Field mapping</h3><p className="text-xs text-muted-foreground">Confirm each template placeholder is connected to the intended column.</p></div>
        <div className="divide-y">
          {placeholders.map((placeholder) => (
            <div key={placeholder} className="grid grid-cols-2 gap-3 p-3 text-sm sm:px-4">
              <code className="break-all text-xs">{placeholder}</code><span className="break-words text-muted-foreground">{mapping[placeholder] || "Not mapped"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-4"><h3 className="font-semibold">Recipient data sample</h3><p className="text-xs text-muted-foreground">Showing up to the first five recipients.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3">Recipient</th>{placeholders.slice(0, 3).map((field) => <th className="p-3" key={field}>{field}</th>)}</tr></thead>
            <tbody className="divide-y">
              {sampleRecipients.map((recipient, index) => (
                <tr key={index}><td className="p-3 font-medium">{String(recipient[nameColumn ?? ""] ?? `Recipient ${index + 1}`)}</td>
                  {placeholders.slice(0, 3).map((field) => <td className="max-w-48 truncate p-3 text-muted-foreground" key={field}>{String(recipient[mapping[field] ?? ""] ?? "—")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">What happens next</p>
          <p>CertiGen generates each DOCX once, converts that exact file to PDF, and opens the generated PDF for review. Downloads stay locked until every certificate is reviewed and approved.</p>
        </div>
      </div>

      <section className="flex items-center gap-3 rounded-xl border p-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{isCombined ? <FileText className="size-5" /> : <FileArchive className="size-5" />}</span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{isCombined ? "Combined DOCX + individual PDFs" : "Individual DOCX + PDF files"}</p><p className="text-xs text-muted-foreground">{recipients.length.toLocaleString()} certificate(s) · PDFs are included in the approved ZIP download.</p></div>
      </section>

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to output options</Button>
        <Button className="w-full sm:w-auto" onClick={onGenerate} disabled={recipients.length === 0}>Generate {recipients.length.toLocaleString()} certificates<ArrowRight className="ml-2 size-4" /></Button>
      </div>
    </div>
  );
}
