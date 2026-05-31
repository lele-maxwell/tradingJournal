import type { jsPDF } from "jspdf";

export type RGB = [number, number, number];

export const MAXSTRAT_PDF_THEME = {
  bgBase: [8, 8, 8] as RGB,
  bgSurface: [18, 18, 18] as RGB,
  bgSurface2: [26, 26, 26] as RGB,
  border: [38, 38, 38] as RGB,
  borderSubtle: [28, 28, 28] as RGB,
  accent: [212, 175, 55] as RGB,
  accentHover: [241, 196, 15] as RGB,
  success: [16, 185, 129] as RGB,
  danger: [239, 68, 68] as RGB,
  warning: [245, 158, 11] as RGB,
  textPrimary: [241, 245, 249] as RGB,
  textSecondary: [148, 163, 184] as RGB,
  textMuted: [100, 116, 139] as RGB,
};

export const PAGE = {
  width: 210, // A4 mm
  height: 297,
  margin: 14,
  headerHeight: 32,
  footerHeight: 14,
};

export function formatPL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fileDateStamp(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "report";
}

function setFill(doc: jsPDF, rgb: RGB) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: jsPDF, rgb: RGB) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

export function paintBackground(doc: jsPDF) {
  setFill(doc, MAXSTRAT_PDF_THEME.bgBase);
  doc.rect(0, 0, PAGE.width, PAGE.height, "F");
}

export function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  options?: { dateRange?: string }
) {
  // Accent top bar
  setFill(doc, MAXSTRAT_PDF_THEME.accent);
  doc.rect(0, 0, PAGE.width, 2.5, "F");

  // Brand block
  setText(doc, MAXSTRAT_PDF_THEME.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MAXSTRAT", PAGE.margin, 10);

  setText(doc, MAXSTRAT_PDF_THEME.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("TRADING JOURNAL", PAGE.margin + 22, 10);

  // Title
  setText(doc, MAXSTRAT_PDF_THEME.textPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, PAGE.margin, 21);

  // Subtitle line
  if (subtitle) {
    setText(doc, MAXSTRAT_PDF_THEME.textSecondary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, PAGE.margin, 27);
  }

  // Date-range chip (right side)
  if (options?.dateRange) {
    const chip = options.dateRange;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const chipWidth = doc.getTextWidth(chip) + 8;
    const chipX = PAGE.width - PAGE.margin - chipWidth;
    const chipY = 17.5;
    setFill(doc, MAXSTRAT_PDF_THEME.bgSurface2);
    setDraw(doc, MAXSTRAT_PDF_THEME.accent);
    doc.setLineWidth(0.2);
    doc.roundedRect(chipX, chipY, chipWidth, 5.5, 1.2, 1.2, "FD");
    setText(doc, MAXSTRAT_PDF_THEME.accent);
    doc.text(chip, chipX + 4, chipY + 3.7);
  }

  // Underline
  setDraw(doc, MAXSTRAT_PDF_THEME.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, 32, PAGE.width - PAGE.margin, 32);
}

export function drawFooter(doc: jsPDF, pageNumber: number, pageCount: number) {
  const y = PAGE.height - 8;

  setDraw(doc, MAXSTRAT_PDF_THEME.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y - 4, PAGE.width - PAGE.margin, y - 4);

  setText(doc, MAXSTRAT_PDF_THEME.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const generated = `MaxStrat · Generated ${formatDateTime(new Date())}`;
  doc.text(generated, PAGE.margin, y);

  const pageLabel = `Page ${pageNumber} / ${pageCount}`;
  const pageLabelWidth = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, PAGE.width - PAGE.margin - pageLabelWidth, y);
}

export function stampFootersOnAllPages(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }
}

export const theme = MAXSTRAT_PDF_THEME;
