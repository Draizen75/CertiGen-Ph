"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { TemplateUpload } from "./steps/template-upload";
import { DataInput } from "./steps/data-input";
import { Mapping } from "./steps/mapping";
import { Options } from "./steps/options";
import { Processing } from "./steps/processing";
import { Recipient, OutputMode } from "@/lib/types";

export type Step = "template" | "data" | "mapping" | "options" | "processing";

const steps: { id: Step; label: string; shortLabel: string }[] = [
  { id: "template", label: "Template", shortLabel: "Template" },
  { id: "data", label: "Recipient data", shortLabel: "Data" },
  { id: "mapping", label: "Field mapping", shortLabel: "Mapping" },
  { id: "options", label: "Output options", shortLabel: "Options" },
  { id: "processing", label: "Generate", shortLabel: "Generate" },
];

export function CertificateGenerator() {
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState<{ start: string; end: string }>({ start: "{{", end: "}}" });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [outputMode, setOutputMode] = useState<OutputMode>("COMBINED_DOCX");

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const nextStep = () => {
    const next = steps[currentStepIndex + 1];
    if (next) setCurrentStep(next.id);
  };
  const prevStep = () => {
    const previous = steps[currentStepIndex - 1];
    if (previous) setCurrentStep(previous.id);
  };

  return (
    <div className="space-y-7 sm:space-y-9">
      <nav aria-label="Certificate generation steps" className="mx-auto max-w-4xl">
        <ol className="grid grid-cols-5 gap-1 sm:gap-3">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <li key={step.id} aria-current={isCurrent ? "step" : undefined} className="relative min-w-0">
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className={`absolute left-[calc(50%+1.1rem)] right-[-50%] top-4 hidden h-px sm:block ${isComplete ? "bg-primary" : "bg-border"}`} />
                )}
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <span className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-9 ${isComplete ? "border-primary bg-primary text-primary-foreground" : isCurrent ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10" : "border-border bg-muted text-muted-foreground"}`}>
                    {isComplete ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span className={`max-w-full truncate text-[10px] font-medium sm:text-xs ${isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <Card className="overflow-visible border-border/80 shadow-none sm:shadow-sm">
        <CardContent className="px-4 py-5 sm:px-7 sm:py-8">
          {currentStep === "template" && (
            <TemplateUpload
              onFileSelected={(file, foundPlaceholders, delimiter) => {
                setTemplateFile(file);
                setPlaceholders(foundPlaceholders);
                setDelimiters(delimiter);
                setMapping({});
                nextStep();
              }}
            />
          )}

          {currentStep === "data" && (
            <DataInput
              onDataReady={(data) => {
                setRecipients(data);
                setMapping({});
                nextStep();
              }}
              onBack={prevStep}
            />
          )}

          {currentStep === "mapping" && (
            <Mapping
              placeholders={placeholders}
              delimiters={delimiters}
              columns={recipients.length > 0 ? Object.keys(recipients[0]) : []}
              onMappingComplete={(nextMapping) => {
                setMapping(nextMapping);
                nextStep();
              }}
              onBack={prevStep}
            />
          )}

          {currentStep === "options" && (
            <Options
              recipientsCount={recipients.length}
              onBack={prevStep}
              onGenerate={(mode) => {
                setOutputMode(mode);
                nextStep();
              }}
            />
          )}

          {currentStep === "processing" && templateFile && (
            <Processing
              templateFile={templateFile}
              recipients={recipients}
              mapping={mapping}
              delimiters={delimiters}
              outputMode={outputMode}
              onBack={() => setCurrentStep("options")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}