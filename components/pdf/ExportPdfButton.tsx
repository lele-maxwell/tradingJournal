"use client";

import { useState } from "react";
import type { GenerateReportInput, ReportTrade } from "@/lib/pdf/generateReportPdf";
import type { SingleTradePayload } from "@/lib/pdf/generateTradePdf";
import ExportRangeDialog, { type ExportRange } from "./ExportRangeDialog";

type ReportProps = {
  variant: "report";
  payload: {
    title: string;
    subtitle?: string;
    dateRange?: string;
    filenameSlug?: string;
    trades: ReportTrade[];
  };
  enableRangePicker?: boolean;
  label?: string;
  className?: string;
};

type TradeProps = {
  variant: "trade";
  payload: SingleTradePayload;
  label?: string;
  className?: string;
};

type Props = ReportProps | TradeProps;

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function filterTradesByRange(
  trades: ReportTrade[],
  range: ExportRange
): { trades: ReportTrade[]; rangeLabel: string } {
  if (range.kind === "all") {
    return { trades, rangeLabel: "All trades" };
  }

  const now = new Date();
  let from: Date;
  let to: Date = now;
  let rangeLabel = "";

  if (range.kind === "last7") {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    rangeLabel = "Last 7 days";
  } else if (range.kind === "last30") {
    from = new Date(now);
    from.setDate(now.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    rangeLabel = "Last 30 days";
  } else {
    from = new Date(`${range.from}T00:00:00`);
    to = new Date(`${range.to}T23:59:59`);
    rangeLabel = `${range.from} → ${range.to}`;
  }

  const filtered = trades.filter((t) => {
    const ts = new Date(t.entryTime).getTime();
    return ts >= from.getTime() && ts <= to.getTime();
  });
  return { trades: filtered, rangeLabel };
}

export default function ExportPdfButton(props: Props) {
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const label = props.label ?? "Export PDF";
  const className = props.className ?? "btn btn-secondary";

  async function runReport(input: GenerateReportInput) {
    setBusy(true);
    try {
      const { generateReportPdf } = await import("@/lib/pdf/generateReportPdf");
      await generateReportPdf(input);
    } catch (err) {
      console.error("[ExportPdfButton] report failed", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function runTrade(payload: SingleTradePayload) {
    setBusy(true);
    try {
      const { generateTradePdf } = await import("@/lib/pdf/generateTradePdf");
      await generateTradePdf(payload);
    } catch (err) {
      console.error("[ExportPdfButton] trade failed", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClick() {
    if (props.variant === "trade") {
      await runTrade(props.payload);
      return;
    }

    if (props.enableRangePicker) {
      setDialogOpen(true);
      return;
    }

    await runReport({
      title: props.payload.title,
      subtitle: props.payload.subtitle,
      dateRange: props.payload.dateRange,
      filenameSlug: props.payload.filenameSlug,
      trades: props.payload.trades,
    });
  }

  async function handleRangeConfirm(range: ExportRange) {
    setDialogOpen(false);
    if (props.variant !== "report") return;
    const { trades, rangeLabel } = filterTradesByRange(props.payload.trades, range);
    await runReport({
      title: props.payload.title,
      subtitle: props.payload.subtitle,
      dateRange: rangeLabel,
      filenameSlug: `${props.payload.filenameSlug ?? "report"}-${range.kind}`,
      trades,
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
      >
        <DownloadIcon />
        <span>{busy ? "Generating…" : label}</span>
      </button>
      {dialogOpen && (
        <ExportRangeDialog
          onCancel={() => setDialogOpen(false)}
          onConfirm={handleRangeConfirm}
        />
      )}
    </>
  );
}
