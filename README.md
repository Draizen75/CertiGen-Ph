# CertiGen PH

CertiGen PH is a browser-based bulk certificate generator. Upload a Word DOCX template, import recipient data from XLSX/CSV or paste names, map template placeholders, review the personalized values, and download editable DOCX output.

## Features

- DOCX templates with supported merge-field delimiters: `{{FIELD}}`, `[FIELD]`, `<FIELD>`, and `«FIELD»`.
- XLSX and CSV import, plus manual recipient entry.
- Recipient-row review and inline editing before field mapping.
- Conservative exact-name field auto-mapping with manual overrides.
- Pre-generation recipient/value review and blank-value warnings.\n- Post-generation PDF review using PDFs converted from the exact generated DOCX files.\n- Per-recipient navigation, inline correction and regeneration, review/approval tracking, and approval-gated ZIP downloads containing PDFs and DOCX files.
- Combined DOCX output or one DOCX per recipient in a ZIP archive.
- DOCX generation runs in the browser; PDF conversion uses a configured Gotenberg-compatible service. No account is required for the current workflow.
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

## Preview limitation

The review step previews the actual recipient values that will be merged into each placeholder. It is not a pixel-accurate rendering of the Word page. Open a downloaded DOCX in Microsoft Word or a compatible editor to verify fonts, images, spacing, and page layout.

## Product direction

The current release intentionally keeps the core workflow account-free and browser-based. Authentication, cloud-saved projects, generation history, paid usage tiers, team workspaces, email delivery, QR verification, and API access should be introduced as separate product phases after the local workflow and deployment pipeline are validated. Do not describe these future capabilities as available until implemented.
