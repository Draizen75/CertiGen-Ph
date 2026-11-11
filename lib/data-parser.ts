import ExcelJS from "exceljs";
import { Recipient } from "./types";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_RECIPIENTS = 1000;
export const MAX_COLUMNS = 50;
const MAX_WORKSHEET_ROWS = 50000;

function validateFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "xlsx" && extension !== "csv") {
    throw new Error("Choose an Excel (.xlsx) or CSV (.csv) file.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("The file is larger than 10 MB. Split it into smaller batches and try again.");
  }
  return extension;
}

/**
 * Parse RFC 4180-style CSV in the browser. ExcelJS's CSV reader expects a
 * Node.js readable stream (with .pipe()), while File.text() returns browser
 * text and Response.body is a WHATWG ReadableStream. Keeping CSV parsing here
 * avoids passing an incompatible stream across that boundary.
 */
function parseCsvText(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("The CSV file contains an unclosed quoted field. Check the file and try again.");
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export async function parseExcelData(file: File): Promise<Recipient[]> {
  const extension = validateFile(file);
  let rows: string[][];

  if (extension === "csv") {
    rows = parseCsvText(await file.text());
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount === 0) {
      throw new Error("No worksheet data was found in this file.");
    }
    if (worksheet.rowCount > MAX_WORKSHEET_ROWS) {
      throw new Error("This spreadsheet has too many rows to inspect safely. Split it into smaller files and retry.");
    }

    rows = [];
    worksheet.eachRow({ includeEmpty: false }, (worksheetRow) => {
      rows.push(
        Array.from({ length: worksheetRow.cellCount }, (_, index) =>
          String(worksheetRow.getCell(index + 1).text ?? ""),
        ),
      );
    });
  }

  if (rows.length === 0) {
    throw new Error("No worksheet data was found in this file.");
  }
  if (rows.length > MAX_WORKSHEET_ROWS) {
    throw new Error("This spreadsheet has too many rows to inspect safely. Split it into smaller files and retry.");
  }

  const headerRow = rows[0];
  const headers: string[] = [];
  const seen = new Set<string>();
  const columnCount = headerRow.length;

  if (columnCount > MAX_COLUMNS) {
    throw new Error(`This spreadsheet has more than ${MAX_COLUMNS} columns. Remove unused columns and retry.`);
  }

  for (let column = 0; column < columnCount; column++) {
    const header = String(headerRow[column] ?? "").trim();
    if (!header) {
      throw new Error(`Column ${column + 1} is missing a header. Add a name to every column in the first row.`);
    }
    const normalized = header.toLocaleLowerCase();
    if (seen.has(normalized)) {
      throw new Error(`The column header "${header}" appears more than once. Rename duplicate headers and retry.`);
    }
    seen.add(normalized);
    headers.push(header);
  }

  if (headers.length === 0) {
    throw new Error("The first row must contain column headers.");
  }

  const recipients: Recipient[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const values = rows[rowIndex];
    const recipient: Recipient = {};
    let hasValue = false;

    headers.forEach((header, index) => {
      const value = String(values[index] ?? "").trim();
      recipient[header] = value;
      if (value) hasValue = true;
    });

    if (hasValue) recipients.push(recipient);
    if (recipients.length > MAX_RECIPIENTS) {
      throw new Error(`This file contains more than ${MAX_RECIPIENTS.toLocaleString()} recipients. Split it into smaller batches.`);
    }
  }

  if (recipients.length === 0) {
    throw new Error("No recipient rows were found below the header row.");
  }

  return recipients;
}

export function parseManualNames(names: string, sharedFields: Record<string, string> = {}): Recipient[] {
  const parsedNames = names
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (parsedNames.length > MAX_RECIPIENTS) {
    throw new Error(`You can add up to ${MAX_RECIPIENTS.toLocaleString()} recipients at a time.`);
  }

  return parsedNames.map((name) => ({
    ...sharedFields,
    NAME: name,
  }));
}
