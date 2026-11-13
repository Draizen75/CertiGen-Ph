# CertiGen PH

CertiGen PH is a browser-based bulk certificate generator. Upload a Word DOCX template, import recipient data from XLSX/CSV or paste names, map template placeholders, confirm recipient data, generate certificates, convert the generated Word documents to PDF for faithful preview, and download approved DOCX/PDF output.

## Features

- DOCX templates with supported merge-field delimiters: `{{FIELD}}`, `[FIELD]`, `<FIELD>`, and `«FIELD»`.
- XLSX and CSV import, plus manual recipient entry.
- Recipient-row review and inline editing before field mapping.
- Conservative exact-name field auto-mapping with manual overrides.
- Pre-generation recipient/value review and blank-value warnings.
- Post-generation PDF preview converted directly from each personalized DOCX using LibreOffice through Gotenberg.
- Per-recipient navigation, inline correction and regeneration, review/approval tracking, and approval-gated DOCX and matching PDF downloads.
- Combined DOCX output or one DOCX per recipient in a ZIP archive; matching PDFs are included in either mode.
- DOCX generation runs in the browser. PDF preview requires a trusted Gotenberg conversion service configured with `GOTENBERG_URL`; generated recipient data is sent to that service.
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

Set `GOTENBERG_URL` in `.env.local` to a private or trusted Gotenberg 9 instance. In production, configure it in the hosting environment. If the service uses HTTP Basic Auth, also set `GOTENBERG_USERNAME` and `GOTENBERG_PASSWORD`; both must be set together. Never expose these as `NEXT_PUBLIC_` variables. Enable Gotenberg Basic Auth with `API_ENABLE_BASIC_AUTH=true`, `GOTENBERG_API_BASIC_AUTH_USERNAME`, and `GOTENBERG_API_BASIC_AUTH_PASSWORD` on the converter service. Do not expose an unauthenticated converter publicly; it receives documents containing recipient information. The conversion endpoint accepts DOCX files up to 4 MB per recipient.

Before releasing a change, manually test:
- A DOCX template with multiple placeholders and formatting.
- XLSX and CSV imports, empty files, duplicate/missing headers, and malformed files.
- Manual names, inline edits, duplicate recipient names, and blank mapped values.
- Combined DOCX and separate ZIP generation.
- Navigation away during generation, retry after an error, and a batch near the 1,000-recipient limit.

## Certificate review

CertiGen generates each personalized DOCX once in the browser, then converts that exact DOCX to PDF through LibreOffice on the configured Gotenberg service. The PDF preview preserves floating text boxes, paragraph alignment, page dimensions, images, and pagination much more faithfully than a browser DOCX-to-HTML renderer. The original DOCX remains the editable source and is not recreated for preview.

Users can navigate between generated certificates, edit mapped recipient values, and regenerate only the affected certificate. Regeneration resets that certificate's review and approval state. Batch download remains disabled until every certificate has a successful DOCX and matching PDF, is marked reviewed, and is approved. Every ZIP includes the matching PDF previews; the selected output mode determines whether it also contains individual DOCX files or one combined DOCX.

## Product direction

The current release intentionally keeps the workflow account-free. DOCX generation and merging run in the browser; PDF preview uses the configured Gotenberg conversion service. Authentication, cloud-saved projects, generation history, paid usage tiers, team workspaces, email delivery, QR verification, and API access should be introduced as separate product phases after the local workflow and deployment pipeline are validated. Do not describe these future capabilities as available until implemented.
