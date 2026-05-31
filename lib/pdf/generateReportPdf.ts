import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  MAXSTRAT_PDF_THEME as T,
  PAGE,
  drawHeader,
  fileDateStamp,
  formatDate,
  formatPL,
  paintBackground,
  slugify,
  stampFootersOnAllPages,
} from "./theme";

export type ReportTrade = {
  id: string;
  pair: string;
  direction: string;
  entryTime: string;
  exitTime?: string | null;
  profitLoss?: number | null;
  riskReward?: number | null;
  checklistScore?: number | null;
};

export type GenerateReportInput = {
  title: string;
  subtitle?: string;
  dateRange?: string;
  filenameSlug?: string;
  trades: ReportTrade[];
};

const CARD_RADIUS = 2.5;

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

type StatCard = {
  label: string;
  value: string;
  sub?: string;
  valueColor?: [number, number, number];
};

function drawStatGrid(doc: jsPDF, startY: number, cards: StatCard[]): number {
  const usable = PAGE.width - PAGE.margin * 2;
  const gap = 4;
  const cols = cards.length;
  const cardW = (usable - gap * (cols - 1)) / cols;
  const cardH = 24;

  cards.forEach((card, i) => {
    const x = PAGE.margin + i * (cardW + gap);

    setFill(doc, T.bgSurface);
    setDraw(doc, T.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, startY, cardW, cardH, CARD_RADIUS, CARD_RADIUS, "FD");

    setText(doc, T.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(card.label.toUpperCase(), x + 4, startY + 6);

    setText(doc, card.valueColor ?? T.textPrimary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(card.value, x + 4, startY + 15);

    if (card.sub) {
      setText(doc, T.textMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(card.sub, x + 4, startY + 20.5);
    }
  });

  return startY + cardH;
}

function outcomeOf(t: ReportTrade): "win" | "loss" | "open" {
  const pl = t.profitLoss;
  if (pl === null || pl === undefined) return "open";
  if (pl > 0) return "win";
  if (pl < 0) return "loss";
  return "open";
}

function colorForPL(pl: number | null | undefined): [number, number, number] {
  if (pl === null || pl === undefined || pl === 0) return T.textMuted;
  return pl > 0 ? T.success : T.danger;
}

export async function generateReportPdf(input: GenerateReportInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  paintBackground(doc);
  drawHeader(doc, input.title, input.subtitle, { dateRange: input.dateRange });

  // Summary stats
  const trades = input.trades;
  const total = trades.length;
  const wins = trades.filter((t) => (t.profitLoss ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.profitLoss ?? 0) < 0).length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const totalPL = trades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
  const rrTrades = trades.filter((t) => t.riskReward !== null && t.riskReward !== undefined);
  const avgRR = rrTrades.length
    ? rrTrades.reduce((s, t) => s + (t.riskReward ?? 0), 0) / rrTrades.length
    : 0;
  const checklistTrades = trades.filter(
    (t) => t.checklistScore !== null && t.checklistScore !== undefined
  );
  const avgChecklist = checklistTrades.length
    ? Math.round(
        checklistTrades.reduce((s, t) => s + (t.checklistScore ?? 0), 0) /
          checklistTrades.length
      )
    : null;

  const winRateColor =
    total === 0
      ? T.textMuted
      : winRate >= 60
      ? T.success
      : winRate >= 40
      ? T.warning
      : T.danger;

  const statsY = drawStatGrid(doc, 38, [
    { label: "Total Trades", value: String(total), sub: total ? `${wins}W / ${losses}L` : "no data" },
    { label: "Win Rate", value: `${winRate}%`, sub: total ? "of closed trades" : "no data", valueColor: winRateColor },
    { label: "Total P/L", value: formatPL(totalPL), sub: "net across range", valueColor: totalPL === 0 ? T.textPrimary : totalPL > 0 ? T.success : T.danger },
    { label: "Avg RR", value: avgRR ? avgRR.toFixed(2) : "—", sub: "risk-to-reward" },
  ]);

  let cursorY = statsY + 6;

  if (avgChecklist !== null) {
    setText(doc, T.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Checklist average: ${avgChecklist} / 16 across ${checklistTrades.length} trade${checklistTrades.length !== 1 ? "s" : ""}.`,
      PAGE.margin,
      cursorY
    );
    cursorY += 6;
  }

  // Trade table
  if (trades.length > 0) {
    const head = [["Date", "Pair", "Direction", "Outcome", "P/L", "RR", "Checklist"]];
    const body = trades.map((t) => [
      formatDate(t.entryTime),
      t.pair,
      t.direction.toUpperCase(),
      outcomeOf(t).toUpperCase(),
      formatPL(t.profitLoss ?? null),
      t.riskReward !== null && t.riskReward !== undefined ? t.riskReward.toFixed(2) : "—",
      t.checklistScore !== null && t.checklistScore !== undefined ? `${t.checklistScore}/16` : "—",
    ]);

    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: PAGE.margin, right: PAGE.margin, top: 38, bottom: 20 },
      head,
      body,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: T.textPrimary,
        fillColor: T.bgSurface,
        lineColor: T.borderSubtle,
        lineWidth: 0.1,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      },
      headStyles: {
        fillColor: T.bgSurface2,
        textColor: T.accent,
        fontStyle: "bold",
        fontSize: 8.5,
        lineColor: T.border,
        lineWidth: 0.2,
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: T.bgSurface2,
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 28, fontStyle: "bold" },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 24, halign: "right" },
      },
      didParseCell: (data: CellHookData) => {
        if (data.section !== "body") return;
        const t = trades[data.row.index];
        if (!t) return;
        // Color the P/L cell
        if (data.column.index === 4) {
          const c = colorForPL(t.profitLoss);
          data.cell.styles.textColor = c;
          data.cell.styles.fontStyle = "bold";
        }
        // Color the outcome cell
        if (data.column.index === 3) {
          const outcome = outcomeOf(t);
          const c = outcome === "win" ? T.success : outcome === "loss" ? T.danger : T.textMuted;
          data.cell.styles.textColor = c;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 2) {
          data.cell.styles.textColor = t.direction === "buy" ? T.accent : T.textSecondary;
        }
      },
      willDrawPage: (data) => {
        // Page 1 already painted + headered by the caller above; only stamp
        // background + header on continuation pages, BEFORE autoTable draws
        // the page's rows. Using didDrawPage here would overpaint the table.
        if (data.pageNumber === 1) return;
        paintBackground(doc);
        drawHeader(doc, input.title, input.subtitle, { dateRange: input.dateRange });
      },
    });
  } else {
    // Empty-state notice
    setFill(doc, T.bgSurface);
    setDraw(doc, T.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(PAGE.margin, cursorY + 4, PAGE.width - PAGE.margin * 2, 28, CARD_RADIUS, CARD_RADIUS, "FD");
    setText(doc, T.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const msg = "No trades in this range.";
    const msgW = doc.getTextWidth(msg);
    doc.text(msg, (PAGE.width - msgW) / 2, cursorY + 21);
  }

  stampFootersOnAllPages(doc);

  const slug = slugify(input.filenameSlug ?? input.title);
  const filename = `maxstrat-report-${slug}-${fileDateStamp()}.pdf`;
  doc.save(filename);
}
