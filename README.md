# CertiGen PH

CertiGen PH is a browser-based bulk certificate generator. Upload a Word DOCX template, import recipient data from XLSX/CSV or paste names, map template placeholders, confirm recipient data, generate certificates, preview the generated Word documents, and download approved DOCX output.

## Features

- DOCX templates with supported merge-field delimiters: `{{FIELD}}`, `[FIELD]`, `<FIELD>`, and `«FIELD»`.
- XLSX and CSV import, plus manual recipient entry.
- Recipient-row review and inline editing before field mapping.
- Conservative exact-name field auto-mapping with manual overrides.
- Pre-generation recipient/value review and blank-value warnings.
- Post-generation browser preview of each personalized DOCX file.
- Per-recipient navigation, inline correction and regeneration, review/approval tracking, and approval-gated DOCX downloads.
- Combined DOCX output or one DOCX per recipient in a ZIP archive.
- DOCX generation and preview run in the browser; no external document-conversion service or account is required.
- Batch safety limits: 1,000 recipients, 50 columns, 10 MB input files.

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

Before releasing a change, manually test:
- A DOCX template with multiple placeholders and formatting.
- XLSX and CSV imports, empty files, duplicate/missing headers, and malformed files.
- Manual names, inline edits, duplicate recipient names, and blank mapped values.
- Combined DOCX and separate ZIP generation.
- Navigation away during generation, retry after an error, and a batch near the 1,000-recipient limit.

## Certificate review

CertiGen generates each personalized DOCX once in the browser and previews that same generated file using a browser-side DOCX renderer. The preview is intended for content and layout review, but it is not a pixel-perfect replacement for Microsoft Word or LibreOffice; pagination, fonts, and some advanced Word features may render differently. Open the downloaded DOCX in Word or LibreOffice when exact print layout matters.

Users can navigate between generated certificates, edit mapped recipient values, and regenerate only the affected certificate. Regeneration resets that certificate's review and approval state. Batch download remains disabled until every certificate has a successful DOCX, is marked reviewed, and is approved. Downloads contain either one combined DOCX or individual DOCX files, according to the selected output mode.

## Product direction

The current release intentionally keeps the workflow account-free. DOCX generation, merging, and preview run in the browser. Authentication, cloud-saved projects, generation history, paid usage tiers, team workspaces, email delivery, QR verification, and API access should be introduced as separate product phases after the local workflow and deployment pipeline are validated. Do not describe these future capabilities as available until implemented.
