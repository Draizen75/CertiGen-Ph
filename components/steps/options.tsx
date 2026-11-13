"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, FileText, FileArchive, ShieldCheck } from "lucide-react";
import { OutputMode } from "@/lib/types";

interface Props {
  recipientsCount: number;
  onBack: () => void;
  onGenerate: (mode: OutputMode) => void;
}

export function Options({ recipientsCount, onBack, onGenerate }: Props) {
  const [outputMode, setOutputMode] = useState<OutputMode>("COMBINED_DOCX");

  const options = [
    {
      value: "COMBINED_DOCX" as const,
      title: "One combined Word file",
      description: "All certificates in one DOCX, separated for convenient printing.",
      icon: FileText,
      note: "Best for printing",
    },
    {
      value: "SEPARATE_DOCX" as const,
      title: "Individual Word files",
      description: "A ZIP archive with one editable DOCX per recipient.",
      icon: FileArchive,
      note: "Best for sharing",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-7 py-2 sm:py-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 4 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose your download format</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your batch contains {recipientsCount.toLocaleString()} recipients.</p>
      </div>

      <RadioGroup value={outputMode} onValueChange={(value) => setOutputMode(value as OutputMode)} className="grid gap-3">
        {options.map(({ value, title, description, icon: Icon, note }) => {
          const selected = outputMode === value;
          return (
            <Label
              key={value}
              htmlFor={`output-${value}`}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors sm:p-5 ${selected ? "border-primary bg-primary/[0.04] ring-2 ring-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
            >
              <RadioGroupItem value={value} id={`output-${value}`} className="mt-1" />
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
                <span className="mt-3 inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{note}</span>
              </span>
            </Label>
          );
        })}
      </RadioGroup>

      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">
          DOCX files are generated in your browser. To create accurate PDF previews, each generated DOCX is sent through the configured PDF conversion service. Do not continue with confidential recipient data unless you trust the service configured by this deployment.
        </p>
      </div>

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to mapping</Button>
        <Button className="w-full sm:w-auto" onClick={() => onGenerate(outputMode)} disabled={recipientsCount === 0}>
          Generate {recipientsCount.toLocaleString()} certificates<ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}