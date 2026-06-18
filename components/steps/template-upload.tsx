"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlaceholdersFromDocx } from "@/lib/docx-engine";

interface Props {
  onFileSelected: (file: File, placeholders: string[], delimiters: { start: string; end: string }) => void;
}

export function TemplateUpload({ onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [delimiters, setDelimiters] = useState<{ start: string; end: string }>({ start: "{{", end: "}}" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".docx")) {
      setError("Please upload a valid .docx file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFile(selectedFile);

    try {
      const { placeholders: phs, delimiters: delim } = await getPlaceholdersFromDocx(selectedFile);
      setPlaceholders(phs);
      setDelimiters(delim);
      if (phs.length === 0) {
        setError("No placeholders found. Try using [NAME], {{NAME}}, or <NAME>.");
      }
    } catch (err) {
      setError("Failed to process the DOCX file. It might be corrupted.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Upload Certificate Template</h2>
        <p className="text-slate-500 mt-1">
          Upload your .docx file with placeholders like [NAME] or {"{{NAME}}"}
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragActive 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : file 
              ? "border-green-500 bg-green-50/50 hover:bg-green-50" 
              : "border-slate-300 hover:border-slate-400 cursor-pointer"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {file ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="bg-green-100 p-4 rounded-full mb-4 shadow-sm">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-xl shadow-sm border border-green-200">
                <FileText className="h-6 w-6 text-green-600" />
                <span className="font-semibold text-green-900">{file.name}</span>
              </div>
              <p className="text-sm font-medium text-green-700 mt-4">Template successfully uploaded!</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPlaceholders([]);
                }}
                className="mt-6 text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200"
              >
                <X className="h-4 w-4 mr-2" /> Remove file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-slate-500 mt-1">Only .docx files are supported</p>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-slate-600">Extracting placeholders...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {placeholders.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold">Found {placeholders.length} placeholders</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((ph) => (
              <code key={ph} className="bg-white border border-slate-200 px-2 py-1 rounded text-sm font-mono text-blue-700">
                {delimiters.start}{ph}{delimiters.end}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => file && placeholders.length > 0 && onFileSelected(file, placeholders, delimiters)}
          disabled={!file || placeholders.length === 0 || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
