# CertiGen PH

CertiGen PH is a browser-based bulk certificate generator. Upload a Word DOCX template or image/PDF certificate artwork, import recipients from XLSX/CSV or paste names, map fields, preview personalized certificates, review the batch, and download approved output.

## Template types

### Visual templates (recommended)
- PNG and JPG/JPEG image backgrounds.
- PDF backgrounds rendered locally in the browser with Mozilla PDF.js. The first page is used; multi-page PDFs currently use page 1 only.
- Add, move, resize, and style text fields directly over the certificate artwork.
- Map each visual field to a recipient spreadsheet column.
- Configure font family, size, weight, color, and alignment.
- Preview sample recipient data before generation.
- The same Canvas renderer is used for generated preview images and final PNG downloads.
- PNG certificates are generated locally and packaged into a ZIP, alongside a combined multi-page PDF built from those exact PNGs in the browser. No Gotenberg service or external conversion endpoint is used.

### DOCX templates
- Existing Word templates and supported merge-field delimiters: `{{FIELD}}`, `[FIELD]`, `<FIELD>`, and `«FIELD»`.
- XLSX and CSV import, plus manual recipient entry.
- Conservative exact-name placeholder mapping.
- DOCX generation and download remain supported.
- Browser preview uses Mammoth HTML conversion. Floating Word text boxes and some advanced Word layout features may not be represented accurately; open the downloaded DOCX in Microsoft Word or LibreOffice for the authoritative layout.

## Batch workflow

- Recipient-row review and inline editing before mapping.
- Pre-generation data review and blank-value warnings.
- Per-recipient navigation, correction, and regeneration.
- Review and approval counters, bulk review/approval, and next-unreviewed navigation.
- Batch download stays locked until all generated certificates are reviewed and approved.
- Image/PDF templates download as individual PNG files in a ZIP.
- DOCX templates download as a combined DOCX or separate DOCX files in a ZIP.

## Privacy and rendering

All template parsing, PDF page rendering, Canvas rendering, DOCX generation, and ZIP creation happen in the browser. Recipient data and uploaded templates are not sent to a document-conversion service by this workflow. The PDF.js library is bundled with the application; it is not loaded from a third-party CDN.

For PDF templates, CertiGen rasterizes the first page into an image background at upload time. Text fields are then drawn on top of that background. This means the generated output is a raster PNG, not an editable PDF. Use a high-resolution source PDF or image for print-quality results.

## Requirements

- Node.js 20 or later
- npm

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```

Before release, manually test:
- PNG, JPG, and PDF template uploads, including large dimensions and multi-page PDFs.
- Field placement, dragging, resizing, style changes, and spreadsheet-column mapping.
- Short and very long names, non-Latin characters, empty values, and different browser zoom levels.
- XLSX/CSV imports, manual recipients, and duplicate recipient names.
- Per-recipient correction/regeneration, bulk review/approval, and ZIP downloads.
- DOCX generation, Mammoth preview limitations, and both DOCX output modes.
- Navigation away during generation, retry after an error, and a batch near the 1,000-recipient limit.

## Product direction

Visual templates are the recommended workflow for accurate positioning because the editor defines exact field coordinates over the certificate artwork and uses the same renderer for preview and export. DOCX remains available for users who require editable Word output, with the documented preview limitations.
