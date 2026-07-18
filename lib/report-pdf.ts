"use client";
// Client-side PDF export for report tables — pdf-lib runs in the browser too,
// so this needs no server round-trip (mirrors the existing client-side CSV
// export pattern already used across the billing/reports pages).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function downloadReportPdf(title: string, headers: string[], rows: string[][]): Promise<void> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const purple = rgb(0.42, 0.13, 0.66);
  const dark = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.45, 0.45, 0.45);
  const line = rgb(0.88, 0.88, 0.88);

  const margin = 40;
  const colWidth = (595 - margin * 2) / headers.length;
  let y = 800;

  const drawHeader = () => {
    page.drawText(title, { x: margin, y, size: 16, font: fontBold, color: purple });
    y -= 20;
    page.drawText(`Generated ${new Date().toLocaleString()}`, { x: margin, y, size: 8, font, color: gray });
    y -= 20;
    headers.forEach((h, i) => page.drawText(h, { x: margin + i * colWidth, y, size: 8, font: fontBold, color: dark }));
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 1, color: line });
    y -= 14;
  };

  drawHeader();
  for (const row of rows) {
    if (y < 60) { page = doc.addPage([595, 842]); y = 800; drawHeader(); }
    row.forEach((cell, i) => {
      const text = cell.length > 28 ? `${cell.slice(0, 27)}…` : cell;
      page.drawText(text, { x: margin + i * colWidth, y, size: 8, font, color: dark });
    });
    y -= 14;
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
