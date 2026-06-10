"use client";

import { PdfExportButton } from "./pdf-export-button";
import type { DateRange } from "@/lib/pdf/pdf-actions";

interface PdfExportWrapperProps {
  range: DateRange;
  label?: string;
  variant?: "primary" | "secondary";
}

export function PdfExportWrapper({ range, label, variant }: PdfExportWrapperProps) {
  return <PdfExportButton range={range} label={label} variant={variant} />;
}