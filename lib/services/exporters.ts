import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { compactValue } from "@/lib/utils/format";

type ExportRow = Record<string, unknown>;

function collectColumns(rows: ExportRow[]) {
  const columns = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columns.add(key);
    }
  }

  return Array.from(columns);
}

function normalizeRows(rows: ExportRow[]) {
  const columns = collectColumns(rows);

  return {
    columns,
    rows: rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column, compactValue(row[column])])),
    ),
  };
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function toCsv(rows: ExportRow[], meta: Record<string, string>) {
  const { columns, rows: normalizedRows } = normalizeRows(rows);
  const header = Object.entries(meta).map(([key, value]) => `${key},${csvCell(value)}`);
  const table = [
    columns.map(csvCell).join(","),
    ...normalizedRows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ];

  return [...header, "", ...table].join("\n");
}

export function toXlsx(rows: ExportRow[], sheetName: string) {
  const { rows: normalizedRows } = normalizeRows(rows);
  const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31) || "Export");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function toPdf(rows: ExportRow[], title: string, subtitle: string) {
  const { columns, rows: normalizedRows } = normalizeRows(rows.slice(0, 50));
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 36;
  const colWidth = Math.max(80, (pageWidth - margin * 2) / Math.max(columns.length, 1));
  let y = 42;

  pdf.setFontSize(15);
  pdf.text(title, margin, y);
  y += 20;
  pdf.setFontSize(9);
  pdf.text(subtitle, margin, y);
  y += 24;
  pdf.setFontSize(7);

  columns.forEach((column, index) => {
    pdf.text(column.slice(0, 18), margin + index * colWidth, y);
  });
  y += 14;

  normalizedRows.forEach((row) => {
    if (y > 550) {
      pdf.addPage();
      y = 42;
    }

    columns.forEach((column, index) => {
      pdf.text(String(row[column]).slice(0, 28), margin + index * colWidth, y, {
        maxWidth: colWidth - 6,
      });
    });
    y += 13;
  });

  return Buffer.from(pdf.output("arraybuffer"));
}
