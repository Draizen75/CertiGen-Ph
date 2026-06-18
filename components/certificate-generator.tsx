"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { TemplateUpload } from "./steps/template-upload";
import { DataInput } from "./steps/data-input";
import { Mapping } from "./steps/mapping";
import { Options } from "./steps/options";
import { Processing } from "./steps/processing";
import { Recipient, OutputMode } from "@/lib/types";

export type Step = "template" | "data" | "mapping" | "options" | "processing";

export function CertificateGenerator() {
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState<{ start: string; end: string }>({ start: "{{", end: "}}" });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [outputMode, setOutputMode] = useState<OutputMode>("COMBINED_DOCX");

  const steps: { id: Step; label: string }[] = [
    { id: "template", label: "Upload Template" },
    { id: "data", label: "Provide Data" },
    { id: "mapping", label: "Map Fields" },
    { id: "options", label: "Options" },
    { id: "processing", label: "Generate" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const nextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < steps.length) {
      setCurrentStep(steps[nextIdx].id);
    }
  };

  const prevStep = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(steps[prevIdx].id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between w-full">
          {steps.map((step, idx) => (
            <li key={step.id} className="relative flex flex-col items-center flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  idx <= currentStepIndex
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  idx <= currentStepIndex ? "text-blue-600" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 transition-colors ${
                    idx < currentStepIndex ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          {currentStep === "template" && (
            <TemplateUpload
              onFileSelected={(file, phs, delim) => {
                setTemplateFile(file);
                setPlaceholders(phs);
                setDelimiters(delim);
                nextStep();
              }}
            />
          )}

          {currentStep === "data" && (
            <DataInput
              onDataReady={(data) => {
                setRecipients(data);
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
              onMappingComplete={(m) => {
                setMapping(m);
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

          {currentStep === "processing" && (
            <Processing
              templateFile={templateFile!}
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
