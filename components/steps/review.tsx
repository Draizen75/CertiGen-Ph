"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Recipient, OutputMode } from "@/lib/types";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, FileArchive, FileText, ShieldCheck } from "lucide-react";

interface Props {
  recipients: Recipient[];
  mapping: Record<string, string>;
  placeholders: string[];
  delimiters: { start: string; end: string };
  outputMode: OutputMode;
  onBack: () => void;
  onGenerate: () => void;
}

export function Review({ recipients, mapping, placeholders, delimiters, outputMode, onBack, onGenerate }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 5 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Review before generating</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Check how your spreadsheet values will fill each template field before creating the documents.
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
            {missingCount.toLocaleString()} mapped field value(s) are empty across this batch. Review the sample below and go back to recipient data if you need to correct them. Blank values will generate as empty text.
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
              <h3 className="text-sm font-semibold">Personalization data preview</h3>
              <p className="text-xs text-muted-foreground">Inspect the values for an individual recipient.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Recipient
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
        <div className="divide-y">
          {fields.map(({ placeholder, column, value }) => (
            <div key={placeholder} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-center">
              <div className="min-w-0">
                <code className="break-all rounded-md bg-muted px-2 py-1 text-xs">{delimiters.start}{placeholder}{delimiters.end}</code>
                <p className="mt-1 text-xs text-muted-foreground">From column: {column || "Not mapped"}</p>
              </div>
              <p className={value ? "break-words text-sm font-medium" : "text-sm italic text-amber-700 dark:text-amber-400"}>
                {value || "Empty value"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">
          This is a data-personalization preview, not a rendered Word-page preview. Word fonts, images, spacing, and page layout are preserved by the DOCX template and should be checked in Microsoft Word or a compatible editor after downloading.
        </p>
      </div>

      <section className="flex items-center gap-3 rounded-xl border p-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isCombined ? <FileText className="size-5" /> : <FileArchive className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{isCombined ? "One combined Word document" : "Individual Word documents in a ZIP"}</p>
          <p className="text-xs text-muted-foreground">{recipients.length.toLocaleString()} certificate(s) · {outputMode === "COMBINED_DOCX" ? "DOCX" : "ZIP"}</p>
        </div>
      </section>

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to output options</Button>
        <Button onClick={onGenerate}>
          Generate {recipients.length.toLocaleString()} certificates<ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
