"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, ListPlus, ArrowLeft, ArrowRight, Trash2, CheckCircle2, UploadCloud, Users, Pencil, Check } from "lucide-react";
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
  const [isImporting, setIsImporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const results = await parseExcelData(file);
      setData(results);
      setExcelFileName(file.name);
      toast.success(`Imported ${results.length.toLocaleString()} recipients.`);
    } catch (error) {
      setData([]);
      setExcelFileName(null);
      toast.error(error instanceof Error ? error.message : "Could not read this spreadsheet.");
      console.error("Recipient import failed:", error);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleBulkSubmit = () => {
    try {
      const results = parseManualNames(bulkNames, {
        EVENT: sharedEvent.trim(),
        DATE: sharedDate.trim(),
      });
      if (results.length === 0) {
        toast.error("Enter at least one recipient name, one per line.");
        return;
      }
      setData(results);
      setExcelFileName(null);
      toast.success(`Added ${results.length.toLocaleString()} recipients.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add these names.");
    }
  };

  const updateCell = (rowIndex: number, column: string, value: string) => {
    setData((current) => current.map((row, index) => (
      index === rowIndex ? { ...row, [column]: value } : row
    )));
  };
  const removeRow = (index: number) => {
    setData((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setEditingIndex((current) => current === index ? null : current !== null && current > index ? current - 1 : current);
  };
  const clearData = () => {
    setData([]);
    setExcelFileName(null);
    setEditingIndex(null);
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 2 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Add your recipients</h2>
        <p className="mt-2 text-sm text-muted-foreground">Import a spreadsheet or paste names. You can review the rows before continuing.</p>
      </div>

      <Tabs defaultValue="spreadsheet" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger value="spreadsheet" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm">
            <FileSpreadsheet className="size-4" />Excel / CSV
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm">
            <ListPlus className="size-4" />Paste names
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spreadsheet" className="mt-5 space-y-4">
          <Label htmlFor="recipient-file" className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.02]">
            {excelFileName ? (
              <>
                <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-6" /></span>
                <span className="max-w-full break-all font-semibold text-foreground">{excelFileName}</span>
                <span className="mt-1 text-sm text-muted-foreground">{data.length.toLocaleString()} recipients imported</span>
                <span className="mt-3 text-xs font-medium text-primary">Choose a different file</span>
              </>
            ) : (
              <>
                <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><UploadCloud className="size-6" /></span>
                <span className="font-semibold text-foreground">{isImporting ? "Importing spreadsheet…" : "Choose an Excel or CSV file"}</span>
                <span className="mt-1 text-sm text-muted-foreground">First row must contain unique column names · Up to 10 MB</span>
                <span className="mt-4 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-primary shadow-sm">Browse files</span>
              </>
            )}
            <Input id="recipient-file" type="file" accept=".xlsx,.csv" className="sr-only" onChange={handleFileUpload} disabled={isImporting} />
          </Label>
        </TabsContent>

        <TabsContent value="manual" className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shared-event">Event name <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="shared-event" placeholder="e.g. ICT Seminar" value={sharedEvent} onChange={(event) => setSharedEvent(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shared-date">Event date <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="shared-date" placeholder="e.g. November 11, 2026" value={sharedDate} onChange={(event) => setSharedDate(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-recipient-names">Recipient names <span className="font-normal text-muted-foreground">(one per line)</span></Label>
            <textarea
              id="bulk-recipient-names"
              className="min-h-48 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              placeholder={"Juan Dela Cruz\nMaria Santos\nPedro Reyes"}
              value={bulkNames}
              onChange={(event) => setBulkNames(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Blank lines are ignored. Up to 1,000 recipients per batch.</p>
          </div>
          <Button variant="outline" onClick={handleBulkSubmit} className="w-full">Apply recipient names</Button>
        </TabsContent>
      </Tabs>

      {data.length > 0 && (
        <section className="overflow-hidden rounded-2xl border" aria-label="Recipient data preview">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold">{data.length.toLocaleString()} recipients ready</p>
                <p className="text-xs text-muted-foreground">{columns.length} data columns · Review before mapping</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearData} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="mr-2 size-4" />Clear data
            </Button>
          </div>
          <div className="max-h-80 overflow-auto overscroll-x-contain">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  {columns.map((column) => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{index + 1}</TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} className="min-w-36 max-w-64">
                        {editingIndex === index ? (
                          <Input
                            aria-label={`Edit ${column} for recipient ${index + 1}`}
                            value={String(row[column] ?? "")}
                            onChange={(event) => updateCell(index, column, event.target.value)}
                            className="h-9 min-w-32"
                          />
                        ) : (
                          <span className="block truncate">{row[column] ?? ""}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={editingIndex === index ? `Finish editing recipient row ${index + 1}` : `Edit recipient row ${index + 1}`}
                          onClick={() => setEditingIndex((current) => current === index ? null : index)}
                        >
                          {editingIndex === index ? <Check className="size-4 text-emerald-600" /> : <Pencil className="size-4 text-muted-foreground" />}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove recipient row ${index + 1}`} onClick={() => removeRow(index)}>
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.length > 10 && <p className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">Showing all rows in a scrollable preview.</p>}
        </section>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back to template</Button>
        <Button className="w-full sm:w-auto" onClick={() => onDataReady(data)} disabled={data.length === 0 || isImporting}>
          Continue with {data.length.toLocaleString()} recipients<ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}