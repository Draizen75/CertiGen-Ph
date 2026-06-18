"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, ListPlus, UserPlus, ArrowLeft, ArrowRight, Trash2, CheckCircle2, X } from "lucide-react";
import { Recipient } from "@/lib/types";
import { parseExcelData, parseManualNames } from "@/lib/data-parser";
import { toast } from "sonner";

interface Props {
  onDataReady: (data: Recipient[]) => void;
  onBack: () => void;
}

export function DataInput({ onDataReady, onBack }: Props) {
  const [data, setData] = useState<Recipient[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [bulkNames, setBulkNames] = useState("");
  const [sharedEvent, setSharedEvent] = useState("");
  const [sharedDate, setSharedDate] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const results = await parseExcelData(file);
      setData(results);
      setExcelFileName(file.name);
      toast.success(`Successfully imported ${results.length} recipients.`);
    } catch (err) {
      toast.error("Failed to parse the data file.");
      console.error(err);
    }
  };

  const handleBulkSubmit = () => {
    if (!bulkNames.trim()) return;
    const results = parseManualNames(bulkNames, {
      EVENT: sharedEvent,
      DATE: sharedDate,
    });
    setData(results);
    toast.success(`Successfully added ${results.length} recipients.`);
  };

  const removeRow = (idx: number) => {
    const newData = [...data];
    newData.splice(idx, 1);
    setData(newData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Provide Recipient Data</h2>
        <p className="text-slate-500 mt-1">
          Choose how you want to provide the names and details.
        </p>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel / CSV
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <ListPlus className="h-4 w-4" />
            Bulk Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="space-y-4">
          <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            excelFileName 
              ? "border-green-500 bg-green-50/50" 
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}>
            {excelFileName ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="bg-green-100 p-4 rounded-full mb-4 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-xl shadow-sm border border-green-200">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-900">{excelFileName}</span>
                </div>
                <p className="text-sm font-medium text-green-700 mt-4">Spreadsheet successfully loaded!</p>
                <div className="mt-6 flex items-center gap-3">
                  <Label htmlFor="excel-upload-replace" className="cursor-pointer">
                    <div className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                      Replace file
                    </div>
                    <Input
                      id="excel-upload-replace"
                      type="file"
                      accept=".xlsx, .csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setExcelFileName(null);
                      setData([]);
                    }}
                    className="text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200"
                  >
                    <X className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Label htmlFor="excel-upload" className="cursor-pointer block w-full h-full">
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-lg font-medium text-slate-700">Click to upload spreadsheet</span>
                  <span className="text-sm text-slate-500 mt-1">Supports .xlsx and .csv</span>
                </div>
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx, .csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Name (Optional)</Label>
              <Input
                placeholder="e.g. ICT Seminar"
                value={sharedEvent}
                onChange={(e) => setSharedEvent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date (Optional)</Label>
              <Input
                placeholder="e.g. June 18, 2026"
                value={sharedDate}
                onChange={(e) => setSharedDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recipient Names (one per line)</Label>
            <textarea
              className="w-full min-h-[200px] p-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Juan Dela Cruz&#10;Maria Santos&#10;Pedro Reyes"
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
            />
          </div>
          <Button onClick={handleBulkSubmit} variant="outline" className="w-full">
            Apply Names
          </Button>
        </TabsContent>
      </Tabs>

      {data.length > 0 && (
        <div className="mt-8 border rounded-lg overflow-hidden">
          <div className="bg-slate-50 p-3 border-b flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{data.length}</span>
              Preview
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setData([]); setExcelFileName(null); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(data[0]).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((val, j) => (
                      <TableCell key={j}>{val}</TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => onDataReady(data)}
          disabled={data.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
