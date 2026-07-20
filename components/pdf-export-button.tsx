"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ReportPdf } from "@/lib/pdf/report-pdf";
import type { DateRange } from "@/lib/pdf/pdf-actions";

interface PdfExportButtonProps {
  range: DateRange;
  label?: string;
  variant?: "primary" | "secondary";
}

export function PdfExportButton({ range, label = "Export PDF", variant = "secondary" }: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch report data
      const res = await fetch(`/api/reports?range=${range}`);
      if (!res.ok) {
        throw new Error("Failed to fetch report data");
      }
      const data = await res.json();

      if (!data) {
        throw new Error("No data available");
      }

      // Generate PDF
      const blob = await pdf(<ReportPdf data={data} />).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maxstrat-report-${range}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revocation to avoid issues in some browsers
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        onClick={handleExport}
        disabled={loading}
        className={variant === "primary" ? "btn btn-primary" : "btn btn-secondary"}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Generating...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}