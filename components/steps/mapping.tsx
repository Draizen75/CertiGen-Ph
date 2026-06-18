"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";

interface Props {
  placeholders: string[];
  delimiters: { start: string; end: string };
  columns: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

export function Mapping({ placeholders, delimiters, columns, onMappingComplete, onBack }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const hasMappedRef = useRef(false);

  useEffect(() => {
    if (!hasMappedRef.current && placeholders.length > 0 && columns.length > 0) {
      // Use setTimeout to avoid synchronous setState inside effect warning
      setTimeout(() => {
        const initialMapping: Record<string, string> = {};
        placeholders.forEach((ph) => {
          const match = columns.find(
            (col) => col.toLowerCase() === ph.toLowerCase() || col.toLowerCase().includes(ph.toLowerCase())
          );
          if (match) {
            initialMapping[ph] = match;
          }
        });
        setMapping(initialMapping);
        hasMappedRef.current = true;
      }, 0);
    }
  }, [placeholders, columns]);

  const autoMap = () => {
    const newMapping: Record<string, string> = {};
    placeholders.forEach((ph) => {
      const match = columns.find(
        (col) => col.toLowerCase() === ph.toLowerCase() || col.toLowerCase().includes(ph.toLowerCase())
      );
      if (match) {
        newMapping[ph] = match;
      }
    });
    setMapping(newMapping);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Map Placeholders</h2>
        <p className="text-slate-500 mt-1">
          Connect your template placeholders to the columns in your data.
        </p>
      </div>

      <div className="flex justify-between items-end">
        <p className="text-sm text-slate-600 font-medium">
          {Object.keys(mapping).length} of {placeholders.length} mapped
        </p>
        <Button variant="outline" size="sm" onClick={autoMap} className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800">
          <Wand2 className="h-4 w-4" />
          Auto-Map Fields
        </Button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
        {placeholders.map((ph) => (
          <div key={ph} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Template Field</span>
              <div className="flex items-center">
                <Label className="text-sm font-mono text-blue-800 bg-blue-100/50 border border-blue-200 px-3 py-1.5 rounded-md shadow-sm">{delimiters.start}{ph}{delimiters.end}</Label>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Column</span>
              <Select
                value={mapping[ph] || ""}
                onValueChange={(val) => setMapping({ ...mapping, [ph]: val })}
              >
                <SelectTrigger className={`bg-white border shadow-sm focus:ring-blue-500 h-10 transition-colors ${mapping[ph] ? 'border-green-300 ring-1 ring-green-100' : 'border-slate-300'}`}>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => onMappingComplete(mapping)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
