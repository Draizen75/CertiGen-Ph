"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Wand2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  placeholders: string[];
  delimiters: { start: string; end: string };
  columns: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

function normalizeField(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildAutoMapping(placeholders: string[], columns: string[]) {
  const result: Record<string, string> = {};
  placeholders.forEach((placeholder) => {
    const normalized = normalizeField(placeholder);
    const exactMatches = columns.filter((column) => normalizeField(column) === normalized);
    if (exactMatches.length === 1) result[placeholder] = exactMatches[0];
  });
  return result;
}

export function Mapping({ placeholders, delimiters, columns, onMappingComplete, onBack }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => buildAutoMapping(placeholders, columns));
  const unmapped = useMemo(() => placeholders.filter((placeholder) => !mapping[placeholder]), [placeholders, mapping]);
  const mappedCount = placeholders.length - unmapped.length;

  const autoMap = () => setMapping(buildAutoMapping(placeholders, columns));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 3 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Match your template fields</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Connect each placeholder in your Word template to the matching spreadsheet column.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{mappedCount} of {placeholders.length} fields mapped</p>
          <p className="mt-1 text-xs text-muted-foreground">Only exact field-name matches are suggested automatically.</p>
        </div>
        <Button variant="outline" size="sm" onClick={autoMap}>
          <Wand2 className="mr-2 size-4" />
          Auto-map exact matches
        </Button>
      </div>

      <div className="space-y-3">
        {placeholders.map((placeholder) => {
          const isMapped = Boolean(mapping[placeholder]);
          return (
            <div key={placeholder} className="grid gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 sm:grid-cols-[1fr_1fr] sm:items-center">
              <div className="min-w-0">
                <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Template placeholder</Label>
                <code className="inline-flex max-w-full break-all rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground">
                  {delimiters.start}{placeholder}{delimiters.end}
                </code>
              </div>
              <div className="min-w-0">
                <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Spreadsheet column</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={mapping[placeholder] || ""}
                    onValueChange={(value) => setMapping((current) => ({ ...current, [placeholder]: value }))}
                  >
                    <SelectTrigger aria-label={`Map ${placeholder} to a spreadsheet column`} className="h-10">
                      <SelectValue placeholder="Choose a column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isMapped ? <CheckCircle2 aria-label="Mapped" className="size-5 shrink-0 text-emerald-600" /> : <AlertCircle aria-label="Needs mapping" className="size-5 shrink-0 text-amber-600" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {unmapped.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Map all {unmapped.length} remaining field{unmapped.length === 1 ? "" : "s"} before continuing: {unmapped.join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back</Button>
        <Button className="w-full sm:w-auto" onClick={() => onMappingComplete(mapping)} disabled={unmapped.length > 0}>
          Review output options<ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}