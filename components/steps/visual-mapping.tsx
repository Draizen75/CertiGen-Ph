"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Plus, Trash2, Move, AlertCircle, CheckCircle2 } from "lucide-react";
import { VisualBackground, VisualField, createDefaultVisualField } from "@/lib/visual-certificate";

interface Props {
  background: VisualBackground;
  columns: string[];
  sampleRecipients: Record<string, string>[];
  initialFields?: VisualField[];
  onComplete: (fields: VisualField[]) => void;
  onBack: () => void;
}

type DragState = { id: string; mode: "move" | "resize"; startX: number; startY: number; original: VisualField } | null;

export function VisualMapping({ background, columns, sampleRecipients, initialFields, onComplete, onBack }: Props) {
  const [fields, setFields] = useState<VisualField[]>(() => initialFields?.length ? initialFields : [createDefaultVisualField(columns, 0)]);
  const [selectedId, setSelectedId] = useState(fields[0]?.id ?? "");
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewRecipient = sampleRecipients[previewIndex] ?? {};
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);
  const selected = fields.find((field) => field.id === selectedId) ?? fields[0];
  const mappedCount = fields.filter((field) => Boolean(field.column)).length;
  const canContinue = fields.length > 0 && fields.every((field) => field.column);

  const addField = () => {
    const field = createDefaultVisualField(columns, fields.length);
    setFields((current) => [...current, field]);
    setSelectedId(field.id);
  };
  const updateField = (patch: Partial<VisualField>) => {
    if (!selected) return;
    setFields((current) => current.map((field) => field.id === selected.id ? { ...field, ...patch } : field));
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!drag || !bounds) return;
    const dx = (event.clientX - drag.startX) / bounds.width;
    const dy = (event.clientY - drag.startY) / bounds.height;
    setFields((current) => current.map((field) => {
      if (field.id !== drag.id) return field;
      if (drag.mode === "resize") {
        return { ...field, width: Math.max(0.08, Math.min(1 - field.x, drag.original.width + dx)), height: Math.max(0.04, Math.min(1 - field.y, drag.original.height + dy)) };
      }
      return { ...field, x: Math.max(0, Math.min(1 - field.width, drag.original.x + dx)), y: Math.max(0, Math.min(1 - field.height, drag.original.y + dy)) };
    }));
  };
  const stopDrag = () => { dragRef.current = null; };
  const startDrag = (event: React.PointerEvent<HTMLDivElement>, field: VisualField, mode: "move" | "resize") => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(field.id);
    dragRef.current = { id: field.id, mode, startX: event.clientX, startY: event.clientY, original: field };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">STEP 3 OF 6</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Place your certificate fields</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add text fields on top of your artwork, drag them into position, then connect each one to a spreadsheet column.</p>
      </div>
      {background.sourceType === "pdf" && background.pageCount > 1 && (
        <Alert><AlertCircle className="size-4" /><AlertDescription>This PDF has {background.pageCount} pages. CertiGen currently uses the first page as the certificate background.</AlertDescription></Alert>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-3 rounded-xl border bg-muted/30 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold">Certificate canvas</p><p className="text-xs text-muted-foreground">{background.width} × {background.height}px · {fields.length} field(s)</p></div>
            <Button size="sm" variant="outline" onClick={addField}><Plus className="mr-2 size-4" />Add text field</Button>
          </div>
          <div className="overflow-auto">
            <div ref={stageRef} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag}
              className="relative mx-auto w-full touch-none select-none overflow-hidden bg-white shadow-sm" style={{ aspectRatio: `${background.width} / ${background.height}`, maxWidth: "100%", containerType: "inline-size" }}>
              <img src={background.dataUrl} alt="Certificate template background" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
              {fields.map((field) => {
                const active = selectedId === field.id;
                const value = String(previewRecipient[field.column] ?? field.label);
                return (
                  <div key={field.id} onPointerDown={(event) => startDrag(event, field, "move")}
                    className={`absolute flex cursor-move items-center overflow-visible border-2 ${active ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20" : "border-dashed border-blue-400/70 bg-blue-400/5"}`}
                    style={{ left: `${field.x * 100}%`, top: `${field.y * 100}%`, width: `${field.width * 100}%`, height: `${field.height * 100}%` }}>
                    <span className="pointer-events-none w-full truncate px-1" style={{ color: field.color, fontFamily: field.fontFamily, fontWeight: field.bold ? 700 : 400, textAlign: field.align, fontSize: `${Math.max(8, field.fontSize / background.width * 100)}cqw` }}>{value}</span>
                    <span className="absolute -top-5 left-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{field.label}</span>
                    {active && <span onPointerDown={(event) => startDrag(event, field, "resize")} className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Move className="size-3.5" />Drag a field to move it. Drag its bottom-right handle to resize it.</p>
        </section>

        <aside className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Field properties</h3><span className="text-xs text-muted-foreground">{mappedCount}/{fields.length} mapped</span></div>
          <div className="space-y-2">
            <Label>Selected field</Label>
            <Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fields.map((field) => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}</SelectContent></Select>
          </div>
          {selected && <>
            <div className="space-y-2"><Label>Field label</Label><Input value={selected.label} onChange={(event) => updateField({ label: event.target.value })} /></div>
            <div className="space-y-2"><Label>Spreadsheet column</Label>
              <Select value={selected.column} onValueChange={(column) => { updateField({ column }); setPreviewIndex(0); }}><SelectTrigger><SelectValue placeholder="Choose a column" /></SelectTrigger><SelectContent>{columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Preview recipient</Label><Select value={String(previewIndex)} onValueChange={(value) => setPreviewIndex(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sampleRecipients.map((recipient, index) => <SelectItem key={index} value={String(index)}>{index + 1}. {String(Object.values(recipient)[0] ?? `Recipient ${index + 1}`)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Font size (px)</Label><Input type="number" min={8} max={240} value={selected.fontSize} onChange={(event) => updateField({ fontSize: Math.max(8, Number(event.target.value) || 8) })} /></div>
              <div className="space-y-1"><Label>Font family</Label><Select value={selected.fontFamily} onValueChange={(fontFamily) => updateField({ fontFamily })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Arial","Georgia","Times New Roman","Verdana","Trebuchet MS"].map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Text color</Label><Input type="color" value={selected.color} onChange={(event) => updateField({ color: event.target.value })} className="h-10 p-1" /></div>
              <div className="space-y-1"><Label>Alignment</Label><Select value={selected.align} onValueChange={(align) => updateField({ align: align as VisualField["align"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.bold} onChange={(event) => updateField({ bold: event.target.checked })} />Bold text</label>
            <Button variant="outline" className="w-full" onClick={() => { setFields((current) => current.filter((field) => field.id !== selected.id)); setSelectedId(fields.find((field) => field.id !== selected.id)?.id ?? ""); }} disabled={fields.length === 1}><Trash2 className="mr-2 size-4" />Delete field</Button>
          </>}
          <div className="flex flex-col gap-2 border-t pt-4">
            <Button onClick={() => onComplete(fields)} disabled={!canContinue}><CheckCircle2 className="mr-2 size-4" />Continue with {fields.length} field(s)<ArrowRight className="ml-auto size-4" /></Button>
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 size-4" />Back</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
