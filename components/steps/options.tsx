"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, FileText, FileArchive } from "lucide-react";
import { OutputMode } from "@/lib/types";

interface Props {
  recipientsCount: number;
  onBack: () => void;
  onGenerate: (mode: OutputMode) => void;
}

export function Options({ recipientsCount, onBack, onGenerate }: Props) {
  const [outputMode, setOutputMode] = useState<OutputMode>("COMBINED_DOCX");

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Output Options</h2>
        <p className="text-slate-500 mt-1">
          Choose how you want to download your certificates.
        </p>
      </div>

      <div className="space-y-6">
        <RadioGroup
          value={outputMode}
          onValueChange={(val) => setOutputMode(val as OutputMode)}
          className="grid grid-cols-1 gap-5"
        >
          <div className={`relative flex items-start space-x-4 border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${outputMode === "COMBINED_DOCX" ? "bg-blue-50/50 border-blue-600 shadow-md scale-[1.02]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
            <RadioGroupItem value="COMBINED_DOCX" id="mode-combined" className="mt-1 border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600" />
            <Label htmlFor="mode-combined" className="flex-1 cursor-pointer flex flex-col">
              <span className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-1">
                <div className={`p-2 rounded-lg ${outputMode === "COMBINED_DOCX" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  <FileText className="h-5 w-5" />
                </div>
                Combined Word Document (.docx)
              </span>
              <span className="text-sm text-slate-600 leading-relaxed mt-2">
                Generates a single file containing all <strong>{recipientsCount}</strong> certificates separated by page breaks. Best for easy printing.
              </span>
            </Label>
            {outputMode === "COMBINED_DOCX" && (
              <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Selected</div>
            )}
          </div>

          <div className={`relative flex items-start space-x-4 border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${outputMode === "SEPARATE_DOCX" ? "bg-blue-50/50 border-blue-600 shadow-md scale-[1.02]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
            <RadioGroupItem value="SEPARATE_DOCX" id="mode-separate" className="mt-1 border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600" />
            <Label htmlFor="mode-separate" className="flex-1 cursor-pointer flex flex-col">
              <span className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-1">
                <div className={`p-2 rounded-lg ${outputMode === "SEPARATE_DOCX" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  <FileArchive className="h-5 w-5" />
                </div>
                Separate Word Documents (ZIP)
              </span>
              <span className="text-sm text-slate-600 leading-relaxed mt-2">
                Generates a ZIP file containing <strong>{recipientsCount}</strong> individual .docx files. Best for emailing to each recipient.
              </span>
            </Label>
            {outputMode === "SEPARATE_DOCX" && (
              <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Selected</div>
            )}
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => onGenerate(outputMode)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8 py-6 text-lg shadow-md"
        >
          <Play className="h-5 w-5 fill-current" />
          Start Generation
        </Button>
      </div>
    </div>
  );
}
