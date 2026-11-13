"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { TemplateUpload } from "./steps/template-upload";
import { DataInput } from "./steps/data-input";
import { Mapping } from "./steps/mapping";
import { VisualMapping } from "./steps/visual-mapping";
import { Options } from "./steps/options";
import { Processing } from "./steps/processing";
import { VisualProcessing } from "./steps/visual-processing";
import { Review } from "./steps/review";
import { Recipient, OutputMode } from "@/lib/types";
import { VisualBackground, VisualField } from "@/lib/visual-certificate";

type TemplateKind = "docx" | "image" | "pdf";
export type Step = "template" | "data" | "mapping" | "options" | "review" | "processing";
const steps: { id: Step; label: string; shortLabel: string }[] = [
  { id: "template", label: "Template", shortLabel: "Template" },
  { id: "data", label: "Recipient data", shortLabel: "Data" },
  { id: "mapping", label: "Field mapping", shortLabel: "Mapping" },
  { id: "options", label: "Output options", shortLabel: "Options" },
  { id: "review", label: "Review", shortLabel: "Review" },
  { id: "processing", label: "Generate", shortLabel: "Generate" },
];

export function CertificateGenerator() {
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateKind, setTemplateKind] = useState<TemplateKind>("docx");
  const [background, setBackground] = useState<VisualBackground | null>(null);
  const [visualFields, setVisualFields] = useState<VisualField[]>([]);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState({ start: "{{", end: "}}" });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [outputMode, setOutputMode] = useState<OutputMode>("COMBINED_DOCX");
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const nextStep = () => { const next = steps[currentStepIndex + 1]; if (next) setCurrentStep(next.id); };
  const prevStep = () => { const previous = steps[currentStepIndex - 1]; if (previous) setCurrentStep(previous.id); };

  return (
    <div className="space-y-7 sm:space-y-9">
      <nav aria-label="Certificate generation steps" className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center justify-between gap-3 sm:hidden"><span className="text-xs font-semibold text-primary">STEP {currentStepIndex + 1} OF {steps.length}</span><span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{steps[currentStepIndex]?.label}</span></div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted sm:hidden" role="progressbar" aria-label="Workflow progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={currentStepIndex + 1}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} /></div>
        <ol className="hidden grid-cols-6 gap-1 sm:grid sm:gap-3">{steps.map((step, index) => { const complete = index < currentStepIndex; const current = index === currentStepIndex; return <li key={step.id} aria-current={current ? "step" : undefined} className="relative min-w-0">{index < steps.length - 1 && <span aria-hidden="true" className={`absolute left-[calc(50%+1.1rem)] right-[-50%] top-4 hidden h-px sm:block ${complete ? "bg-primary" : "bg-border"}`} />}<div className="relative flex flex-col items-center gap-2 text-center"><span className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold sm:size-9 ${complete ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10" : "border-border bg-muted text-muted-foreground"}`}>{complete ? <Check className="size-4" /> : index + 1}</span><span className={`max-w-full truncate text-[10px] font-medium sm:text-xs ${current ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span></div></li>; })}</ol>
      </nav>
      <Card className="overflow-visible border-border/80 shadow-none sm:shadow-sm"><CardContent className="px-4 py-5 sm:px-7 sm:py-8">
        {currentStep === "template" && <TemplateUpload onFileSelected={(file, kind, found, delimiter, visualBackground) => { setTemplateFile(file); setTemplateKind(kind); setBackground(visualBackground); setPlaceholders(found); setDelimiters(delimiter); setMapping({}); setVisualFields([]); nextStep(); }} />}
        {currentStep === "data" && <DataInput onDataReady={(data) => { setRecipients(data); setMapping({}); nextStep(); }} onBack={prevStep} />}
        {currentStep === "mapping" && (templateKind === "docx"
          ? <Mapping placeholders={placeholders} delimiters={delimiters} columns={recipients.length ? Object.keys(recipients[0]) : []} onMappingComplete={(nextMapping) => { setMapping(nextMapping); nextStep(); }} onBack={prevStep} />
          : background && <VisualMapping background={background} columns={recipients.length ? Object.keys(recipients[0]) : []} sampleRecipients={recipients.slice(0, 10)} initialFields={visualFields} onComplete={(fields) => { setVisualFields(fields); nextStep(); }} onBack={prevStep} />)}
        {currentStep === "options" && <Options recipientsCount={recipients.length} templateKind={templateKind} onBack={prevStep} onGenerate={(mode) => { setOutputMode(mode); nextStep(); }} />}
        {currentStep === "review" && <Review recipients={recipients} mapping={templateKind === "docx" ? mapping : Object.fromEntries(visualFields.map((field) => [field.label, field.column]))} placeholders={templateKind === "docx" ? placeholders : visualFields.map((field) => field.label)} outputMode={outputMode} templateKind={templateKind} onBack={prevStep} onGenerate={nextStep} />}
        {currentStep === "processing" && templateKind === "docx" && templateFile && <Processing templateFile={templateFile} recipients={recipients} mapping={mapping} delimiters={delimiters} outputMode={outputMode} onBack={() => setCurrentStep("options")} />}
        {currentStep === "processing" && templateKind !== "docx" && background && <VisualProcessing background={background} fields={visualFields} recipients={recipients} onBack={() => setCurrentStep("options")} />}
      </CardContent></Card>
    </div>
  );
}
