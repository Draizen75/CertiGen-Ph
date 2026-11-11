import ExcelJS from "exceljs";
import { Recipient } from "./types";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_RECIPIENTS = 1000;

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

export async function parseExcelData(file: File): Promise<Recipient[]> {
  const extension = validateFile(file);
  const workbook = new ExcelJS.Workbook();

  if (extension === "csv") {
    const text = await file.text();
    await workbook.csv.read(new Response(text).body as never);
  } else {
    await workbook.xlsx.load(await file.arrayBuffer());
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error("No worksheet data was found in this file.");
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  const seen = new Set<string>();
  const columnCount = Math.max(headerRow.cellCount, headerRow.actualCellCount);

  for (let column = 1; column <= columnCount; column++) {
    const header = String(headerRow.getCell(column).text ?? "").trim();
    if (!header) {
      throw new Error(`Column ${column} is missing a header. Add a name to every column in the first row.`);
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
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const recipient: Recipient = {};
    let hasValue = false;

    headers.forEach((header, index) => {
      const value = String(row.getCell(index + 1).text ?? "").trim();
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