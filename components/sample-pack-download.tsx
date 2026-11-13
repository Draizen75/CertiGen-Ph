"use client";

import { useState } from "react";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, PageOrientation } from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const sampleRows = [
  { NAME: "Maria Santos", EVENT: "Community Leadership Seminar", DATE: "November 15, 2026", ORGANIZER: "CertiGen PH Training Team" },
  { NAME: "Juan Dela Cruz", EVENT: "Community Leadership Seminar", DATE: "November 15, 2026", ORGANIZER: "CertiGen PH Training Team" },
  { NAME: "Angela Reyes", EVENT: "Community Leadership Seminar", DATE: "November 15, 2026", ORGANIZER: "CertiGen PH Training Team" },
];

function createSampleTemplate() {
  const gold = "9A7438";
  const border = { style: BorderStyle.SINGLE, size: 18, color: gold, space: 18 };
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
          margin: { top: 900, right: 1100, bottom: 900, left: 1100 },
          borders: {
            pageBorders: { offsetFrom: "page", zOrder: "front" },
            pageBorderTop: border,
            pageBorderBottom: border,
            pageBorderLeft: border,
            pageBorderRight: border,
          },
        },
      },
      children: [
        new Paragraph({ text: "", spacing: { after: 180 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CERTIFICATE OF", bold: true, color: gold, size: 24, characterSpacing: 100 })], spacing: { after: 120 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "APPRECIATION", bold: true, color: "76501F", size: 48, font: "Georgia" })], spacing: { after: 420 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "This certificate is proudly presented to", italics: true, color: "555555", size: 22 })], spacing: { after: 220 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{{NAME}}", bold: true, italics: true, color: "222222", size: 38, font: "Georgia" })], spacing: { after: 300 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "In recognition of your valuable participation in", color: "555555", size: 20 })], spacing: { after: 120 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{{EVENT}}", bold: true, color: "333333", size: 24 })], spacing: { after: 180 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Presented this {{DATE}}", color: "555555", size: 18 })], spacing: { after: 520 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{{ORGANIZER}}", bold: true, color: "333333", size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Authorized Organizer", color: "777777", size: 16 })] }),
      ],
    }],
  });
  return Packer.toBlob(doc);
}

export function SamplePackDownload() {
  const [loading, setLoading] = useState(false);

  const downloadPack = async () => {
    setLoading(true);
    try {
      const [templateBlob] = await Promise.all([createSampleTemplate()]);
      const csv = [
        "NAME,EVENT,DATE,ORGANIZER",
        ...sampleRows.map((row) => [row.NAME, row.EVENT, row.DATE, row.ORGANIZER].map((value) => '"' + value.replace(/"/g, '""') + '"').join(",")),
      ].join("\r\n");
      const zip = new JSZip();
      zip.file("Sample_Certificate_Template.docx", templateBlob);
      zip.file("Sample_Recipients.csv", "\uFEFF" + csv);
      zip.file("README.txt", [
        "CERTIGEN PH - SAMPLE TUTORIAL FILES",
        "",
        "1. Open CertiGen PH and choose Start Creating Certificates.",
        "2. Upload Sample_Certificate_Template.docx.",
        "3. Import Sample_Recipients.csv as recipient data.",
        "4. Map NAME, EVENT, DATE, and ORGANIZER to their matching fields.",
        "5. Choose combined DOCX or separate DOCX files in a ZIP.",
        "6. Review the sample recipients and generate your certificates.",
        "7. Download the generated document or ZIP from the final step.",
        "",
        "All names and event details in this sample are fictional.",
      ].join("\r\n"));
      const output = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      saveAs(output, "CertiGen_PH_Sample_Tutorial.zip");
      toast.success("Sample tutorial pack downloaded.");
    } catch (error) {
      console.error("Could not create sample tutorial pack:", error);
      toast.error("Could not create the sample files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="lg" onClick={downloadPack} disabled={loading} className="h-11 rounded-xl px-5">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {loading ? "Preparing sample files..." : "Download sample tutorial pack"}
    </Button>
  );
}
