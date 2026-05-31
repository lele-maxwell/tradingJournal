import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MAXSTRAT_PDF_THEME as T,
  PAGE,
  drawHeader,
  fileDateStamp,
  formatDateTime,
  formatPL,
  paintBackground,
  slugify,
  stampFootersOnAllPages,
} from "./theme";

export type TradeImagePayload = {
  id: string;
  imageUrl: string;
  imageType: string;
};

export type TradeChecklistPayload = {
  score: number;
  items: { key: string; label: string; checked: boolean }[];
};

export type SingleTradePayload = {
  id: string;
  pair: string;
  direction: string;
  strategy: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number;
  positionSize: number | null;
  riskPercent: number | null;
  riskReward: number | null;
  entryTime: string;
  exitTime: string | null;
  entryTf: string | null;
  higherTf: string | null;
  profitLoss: number | null;
  setupNotes: string | null;
  executionNotes: string | null;
  mistakeNotes: string | null;
  lessonsLearned: string | null;
  mentalState: string | null;
  followedPlan: boolean | null;
  movedSL: boolean | null;
  enteredEarly: boolean | null;
  overtraded: boolean | null;
  mentalHealthOk: boolean | null;
  checklist: TradeChecklistPayload | null;
  images: TradeImagePayload[];
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

async function fetchImageAsDataUrl(
  url: string
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type.toLowerCase();
    const format: "PNG" | "JPEG" = mime.includes("png") ? "PNG" : "JPEG";
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch (err) {
    console.warn(`[generateTradePdf] failed to load image: ${url}`, err);
    return null;
  }
}

function colorForPL(pl: number | null): [number, number, number] {
  if (pl === null || pl === 0) return T.textMuted;
  return pl > 0 ? T.success : T.danger;
}

function drawSectionHeading(doc: jsPDF, y: number, label: string): number {
  setText(doc, T.textMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(label.toUpperCase(), PAGE.margin, y);
  setDraw(doc, T.border);
  doc.setLineWidth(0.15);
  doc.line(PAGE.margin, y + 1.5, PAGE.width - PAGE.margin, y + 1.5);
  return y + 6;
}

function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  setFill(doc, T.bgSurface);
  setDraw(doc, T.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "FD");
}

function ensureSpace(
  doc: jsPDF,
  cursorY: number,
  needed: number,
  title: string,
  subtitle: string | undefined
): number {
  if (cursorY + needed > PAGE.height - 18) {
    doc.addPage();
    paintBackground(doc);
    drawHeader(doc, title, subtitle);
    return 38;
  }
  return cursorY;
}

const MENTAL_STATE_LABELS: Record<string, string> = {
  calm: "Calm",
  focused: "Focused",
  tired: "Tired",
  fearful: "Fearful",
  overconfident: "Overconfident",
  revenge: "Revenge trading",
  emotional: "Emotional",
  distracted: "Distracted",
};

export async function generateTradePdf(trade: SingleTradePayload): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pl = trade.profitLoss;
  const isWin = pl !== null && pl > 0;
  const isLoss = pl !== null && pl < 0;
  const outcomeLabel = isWin ? "WIN" : isLoss ? "LOSS" : "OPEN";
  const outcomeColor = isWin ? T.success : isLoss ? T.danger : T.textMuted;
  const directionLabel = trade.direction.toUpperCase();
  const subtitle = `${formatDateTime(trade.entryTime)}${trade.strategy ? `  ·  ${trade.strategy}` : ""}`;
  const headerTitle = `Trade · ${trade.pair}`;

  paintBackground(doc);
  drawHeader(doc, headerTitle, subtitle);

  let y = 38;

  // Pair hero block
  drawCard(doc, PAGE.margin, y, PAGE.width - PAGE.margin * 2, 30);

  // Left: pair + badges
  setText(doc, T.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(trade.pair, PAGE.margin + 5, y + 12);

  // Outcome badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const badgeY = y + 17;
  const badgeText = ` ${outcomeLabel} `;
  const badgeW = doc.getTextWidth(badgeText) + 3;
  setFill(doc, outcomeColor);
  doc.roundedRect(PAGE.margin + 5, badgeY, badgeW, 4.5, 1, 1, "F");
  setText(doc, T.bgBase);
  doc.text(badgeText, PAGE.margin + 5 + 1.5, badgeY + 3.2);

  // Direction badge
  const dirX = PAGE.margin + 5 + badgeW + 3;
  const dirText = ` ${directionLabel} `;
  const dirW = doc.getTextWidth(dirText) + 3;
  setFill(doc, trade.direction === "buy" ? T.accent : T.bgSurface2);
  setDraw(doc, trade.direction === "buy" ? T.accent : T.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(dirX, badgeY, dirW, 4.5, 1, 1, "FD");
  setText(doc, trade.direction === "buy" ? T.bgBase : T.textSecondary);
  doc.text(dirText, dirX + 1.5, badgeY + 3.2);

  // Date line under badges
  setText(doc, T.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formatDateTime(trade.entryTime), PAGE.margin + 5, y + 27);

  // Right: P/L value + RR
  const plLabel = formatPL(pl);
  setText(doc, colorForPL(pl));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const plW = doc.getTextWidth(plLabel);
  doc.text(plLabel, PAGE.width - PAGE.margin - 5 - plW, y + 12);

  setText(doc, T.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const rrLabel = trade.riskReward ? `RR ${trade.riskReward.toFixed(2)}` : "RR —";
  const rrW = doc.getTextWidth(rrLabel);
  doc.text(rrLabel, PAGE.width - PAGE.margin - 5 - rrW, y + 18);

  y += 36;

  // Execution + Checklist two-column section
  y = drawSectionHeading(doc, y, "Execution & Checklist");

  const colW = (PAGE.width - PAGE.margin * 2 - 4) / 2;

  // Execution table (left)
  const execRows: [string, string][] = [
    ["Entry price", String(trade.entryPrice)],
    ["Exit price", trade.exitPrice !== null ? String(trade.exitPrice) : "—"],
    ["Stop loss", String(trade.stopLoss)],
    ["Take profit", String(trade.takeProfit)],
    ["Position size", trade.positionSize !== null ? String(trade.positionSize) : "—"],
    ["Risk %", trade.riskPercent !== null ? `${trade.riskPercent}%` : "—"],
    ["Risk / Reward", trade.riskReward !== null ? String(trade.riskReward) : "—"],
    ["Entry timeframe", trade.entryTf ?? "—"],
    ["Higher timeframe", trade.higherTf ?? "—"],
    ["Entry time", formatDateTime(trade.entryTime)],
    ["Exit time", trade.exitTime ? formatDateTime(trade.exitTime) : "—"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE.margin, right: PAGE.margin + colW + 4, bottom: 20 },
    tableWidth: colW,
    body: execRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: T.textPrimary,
      fillColor: T.bgSurface,
      lineColor: T.borderSubtle,
      lineWidth: 0.1,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    alternateRowStyles: { fillColor: T.bgSurface2 },
    columnStyles: {
      0: { textColor: T.textMuted, fontStyle: "bold", cellWidth: 36 },
      1: { halign: "right" },
    },
  });

  const execEndY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  // Checklist (right) — drawn manually
  const checklistX = PAGE.margin + colW + 4;
  const checklistW = colW;
  let checklistY = y;

  if (trade.checklist) {
    // Header card
    drawCard(doc, checklistX, checklistY, checklistW, 9);
    setText(doc, T.textMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("STRATEGY CHECKLIST", checklistX + 3, checklistY + 5.5);

    const scoreLabel = `${trade.checklist.score} / 16`;
    const scoreColor =
      trade.checklist.score >= 10
        ? T.success
        : trade.checklist.score >= 6
        ? T.warning
        : T.danger;
    setText(doc, scoreColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const sw = doc.getTextWidth(scoreLabel);
    doc.text(scoreLabel, checklistX + checklistW - sw - 3, checklistY + 5.8);
    checklistY += 11;

    // Items
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    trade.checklist.items.forEach((item, idx) => {
      const rowY = checklistY + idx * 4.6;
      if (rowY + 4 > PAGE.height - 20) return; // skip overflow — checklist is bounded at 16
      // Stripe
      if (idx % 2 === 1) {
        setFill(doc, T.bgSurface2);
        doc.rect(checklistX, rowY - 3, checklistW, 4.4, "F");
      } else {
        setFill(doc, T.bgSurface);
        doc.rect(checklistX, rowY - 3, checklistW, 4.4, "F");
      }
      // Mark
      setText(doc, item.checked ? T.accent : T.textMuted);
      doc.setFont("helvetica", "bold");
      doc.text(item.checked ? "✓" : "·", checklistX + 3, rowY);
      // Label
      setText(doc, item.checked ? T.textPrimary : T.textMuted);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, checklistX + 8, rowY);
    });
    checklistY += trade.checklist.items.length * 4.6 + 2;
  }

  y = Math.max(execEndY, checklistY) + 6;

  // Psychology section
  y = ensureSpace(doc, y, 32, headerTitle, subtitle);
  y = drawSectionHeading(doc, y, "Psychology");

  drawCard(doc, PAGE.margin, y, PAGE.width - PAGE.margin * 2, 26);

  // Mental state (left)
  setText(doc, T.textMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("MENTAL STATE", PAGE.margin + 5, y + 6);
  setText(doc, T.textPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const mentalText = trade.mentalState
    ? MENTAL_STATE_LABELS[trade.mentalState] ?? trade.mentalState
    : "—";
  doc.text(mentalText, PAGE.margin + 5, y + 14);

  // Toggles (right column)
  const togglesX = PAGE.margin + (PAGE.width - PAGE.margin * 2) / 2;
  const toggles: { key: keyof SingleTradePayload; label: string }[] = [
    { key: "followedPlan", label: "Followed plan" },
    { key: "movedSL", label: "Moved SL emotionally" },
    { key: "enteredEarly", label: "Entered early" },
    { key: "overtraded", label: "Overtraded" },
    { key: "mentalHealthOk", label: "Mental health was OK" },
  ];
  doc.setFontSize(8.5);
  toggles.forEach((t, idx) => {
    const val = trade[t.key] as boolean | null;
    const rowY = y + 5 + idx * 4;
    setText(
      doc,
      val === true ? T.success : val === false ? T.danger : T.textMuted
    );
    doc.setFont("helvetica", "bold");
    doc.text(val === true ? "✓" : val === false ? "✗" : "·", togglesX, rowY);
    setText(doc, T.textSecondary);
    doc.setFont("helvetica", "normal");
    doc.text(t.label, togglesX + 5, rowY);
  });

  y += 32;

  // Notes
  const notes: { label: string; text: string | null }[] = [
    { label: "Setup explanation", text: trade.setupNotes },
    { label: "Execution notes", text: trade.executionNotes },
    { label: "Mistakes made", text: trade.mistakeNotes },
    { label: "Lessons learned", text: trade.lessonsLearned },
  ].filter((n) => n.text && n.text.trim().length > 0);

  if (notes.length > 0) {
    y = ensureSpace(doc, y, 12, headerTitle, subtitle);
    y = drawSectionHeading(doc, y, "Notes");

    const innerW = PAGE.width - PAGE.margin * 2 - 8;
    for (const note of notes) {
      const text = note.text ?? "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(text, innerW) as string[];
      const blockH = 6 + lines.length * 4.2 + 4;

      y = ensureSpace(doc, y, blockH + 4, headerTitle, subtitle);

      drawCard(doc, PAGE.margin, y, PAGE.width - PAGE.margin * 2, blockH);
      setText(doc, T.textMuted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(note.label.toUpperCase(), PAGE.margin + 4, y + 5);

      setText(doc, T.textSecondary);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(lines, PAGE.margin + 4, y + 10);

      y += blockH + 4;
    }
  }

  // Screenshots — embed at 16:9
  if (trade.images.length > 0) {
    y = ensureSpace(doc, y, 16, headerTitle, subtitle);
    y = drawSectionHeading(doc, y, "Screenshots");

    const imgW = PAGE.width - PAGE.margin * 2;
    const imgH = imgW * (9 / 16);

    for (const img of trade.images) {
      y = ensureSpace(doc, y, imgH + 12, headerTitle, subtitle);

      const labelText = img.imageType.replace(/_/g, " ").toUpperCase();
      setText(doc, T.textMuted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(labelText, PAGE.margin, y);
      y += 3;

      const loaded = await fetchImageAsDataUrl(img.imageUrl);
      if (loaded) {
        try {
          doc.addImage(loaded.dataUrl, loaded.format, PAGE.margin, y, imgW, imgH);
        } catch (err) {
          console.warn(`[generateTradePdf] addImage failed for ${img.imageUrl}`, err);
          drawCard(doc, PAGE.margin, y, imgW, imgH);
          setText(doc, T.textMuted);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const msg = "Image could not be embedded";
          const mw = doc.getTextWidth(msg);
          doc.text(msg, (PAGE.width - mw) / 2, y + imgH / 2);
        }
      } else {
        drawCard(doc, PAGE.margin, y, imgW, imgH);
        setText(doc, T.textMuted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const msg = "Image unavailable";
        const mw = doc.getTextWidth(msg);
        doc.text(msg, (PAGE.width - mw) / 2, y + imgH / 2);
      }
      y += imgH + 6;
    }
  }

  stampFootersOnAllPages(doc);

  const pairSlug = slugify(trade.pair);
  const filename = `maxstrat-trade-${pairSlug}-${fileDateStamp(new Date(trade.entryTime))}.pdf`;
  doc.save(filename);
}
