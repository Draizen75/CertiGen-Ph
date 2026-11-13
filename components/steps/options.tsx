"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, FileText, FileArchive, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { OutputMode } from "@/lib/types";

interface Props {
  recipientsCount: number;
  templateKind: "docx" | "image" | "pdf";
  onBack: () => void;
  onGenerate: (mode: OutputMode) => void;
}

export function Options({ recipientsCount, templateKind, onBack, onGenerate }: Props) {
  const isVisual = templateKind !== "docx";
  const [outputMode, setOutputMode] = useState<OutputMode>(isVisual ? "PNG_ZIP" : "COMBINED_DOCX");
  const options = isVisual ? [
    { value: "PNG_ZIP" as const, title: "Individual PNG certificates", description: "A ZIP archive with one high-resolution PNG certificate for each recipient.", icon: ImageIcon, note: "No conversion service required" },
  ] : [
    { value: "COMBINED_DOCX" as const, title: "One combined Word document", description: "All personalized certificates in one editable Word document.", icon: FileText, note: "Best for printing" },
    { value: "SEPARATE_DOCX" as const, title: "Individual Word documents", description: "A ZIP archive containing one editable Word document per recipient.", icon: FileArchive, note: "Best for sharing" },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-7 py-2 sm:py-4">
      <div className="text-center"><p className="text-sm font-semibold text-primary">STEP 4 OF 6</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Choose your certificate downloads</h2><p className="mt-2 text-sm text-muted-foreground">Your batch contains {recipientsCount.toLocaleString()} recipients.</p></div>
      <RadioGroup value={outputMode} onValueChange={(value) => setOutputMode(value as OutputMode)} className="grid gap-3">
        {options.map(({ value, title, description, icon: Icon, note }) => <Label key={value} htmlFor={`output-${value}`} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors sm:p-5 ${outputMode === value ? "border-primary bg-primary/[0.04] ring-2 ring-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}><RadioGroupItem value={value} id={`output-${value}`} className="mt-1" /><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="font-semibold">{title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span><span className="mt-3 inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{note}</span></span></Label>)}
      </RadioGroup>
      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">{isVisual ? "The uploaded image/PDF background and all recipient fields are rendered locally in your browser. No external conversion service receives your certificate data." : "DOCX templates remain editable Word files. Their browser preview may not perfectly reproduce advanced Word layout elements such as floating text boxes."}</p></div>
      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row"><Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to mapping</Button><Button className="w-full sm:w-auto" onClick={() => onGenerate(outputMode)} disabled={!recipientsCount}>Continue to review<ArrowRight className="ml-2 size-4" /></Button></div>
    </div>
  );
}