import ExcelJS from "exceljs";
import { Recipient } from "./types";

export async function parseExcelData(file: File): Promise<Recipient[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  
  if (file.name.endsWith(".csv")) {
    // Read CSV correctly by waiting for text
    const text = await file.text();
    await workbook.csv.read(new Response(text).body as never);
  } else {
    await workbook.xlsx.load(arrayBuffer);
  }

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) return [];

  const recipients: Recipient[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(cell.text.trim());
      });
    } else {
      const recipient: Recipient = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          recipient[header] = cell.text.trim();
        }
      });
      if (Object.keys(recipient).length > 0) {
        recipients.push(recipient);
      }
    }
  });

  return recipients;
}

export function parseManualNames(names: string, sharedFields: Record<string, string> = {}): Recipient[] {
  return names
    .split("\n")
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => ({
      ...sharedFields,
      NAME: name,
    }));
}
