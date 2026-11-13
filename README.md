# CertiGen PH

CertiGen PH is a browser-based bulk certificate generator. Upload a Word DOCX template, import recipient data from XLSX/CSV or paste names, map template placeholders, confirm recipient data, generate certificates, review the resulting PDFs, and download approved PDF/DOCX output.

## Features

- DOCX templates with supported merge-field delimiters: `{{FIELD}}`, `[FIELD]`, `<FIELD>`, and `«FIELD»`.
- XLSX and CSV import, plus manual recipient entry.
- Recipient-row review and inline editing before field mapping.
- Conservative exact-name field auto-mapping with manual overrides.
- Pre-generation recipient/value review and blank-value warnings.
- Post-generation PDF review using PDFs converted from the exact generated DOCX files.
- Per-recipient navigation, inline correction and regeneration, review/approval tracking, and approval-gated ZIP downloads containing PDFs and DOCX files.
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

## PDF conversion service

The review workflow converts each generated DOCX to PDF using a Gotenberg-compatible service backed by LibreOffice. Configure `GOTENBERG_URL` in the deployment environment to the base URL of a trusted Gotenberg instance, for example `https://gotenberg.example.com`. The app checks the service health before starting a batch and posts each generated DOCX to Gotenberg's `/forms/libreoffice/convert` endpoint through the server-side `/api/convert` route.

Do not expose an unauthenticated converter publicly; protect it with network access controls or an authenticated reverse proxy. Generated DOCX files contain recipient data and are sent to the configured conversion service, so deployments must disclose this processing and use a service appropriate for the sensitivity of the data. Vercel deployments must account for function request-size and duration limits. If the converter is unavailable or not configured, generation stops before creating the batch.

## Certificate review

CertiGen generates each personalized DOCX once and converts that same file to PDF. The PDF is the primary visual review artifact and is also included in the approved batch download. Browser PDF viewers display the converted PDF rather than approximating Word layout. PDF fidelity still depends on the conversion service version and installed fonts; verify representative templates before production use.

Users can navigate between generated certificates, edit mapped recipient values, and regenerate only the affected certificate. Regeneration resets that certificate's review and approval state. Batch download remains disabled until every certificate has a successful DOCX/PDF, is marked reviewed, and is approved.

## Product direction

The current release intentionally keeps the workflow account-free. DOCX merge generation runs in the browser, while PDF conversion is handled by the deployment-configured service. Authentication, cloud-saved projects, generation history, paid usage tiers, team workspaces, email delivery, QR verification, and API access should be introduced as separate product phases after the local workflow and deployment pipeline are validated. Do not describe these future capabilities as available until implemented.
