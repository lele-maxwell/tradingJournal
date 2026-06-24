"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createTradeAction, type TradeActionState } from "@/lib/actions/trade.actions";
import { calcChecklistScore, calcRR } from "@/lib/validations/trade.schema";

const initialState: TradeActionState = {};

// ────────────────────────────────────────────────────────────────
// Checklist config (label keys resolve via useTranslations)
// ────────────────────────────────────────────────────────────────
const CHECKLIST_GROUPS = [
  {
    labelKey: "groupMarketStructure",
    items: [
      { name: "supportRespected", labelKey: "supportRespected" },
      { name: "resistanceRespected", labelKey: "resistanceRespected" },
      { name: "trendlineRespected", labelKey: "trendlineRespected" },
      { name: "orderBlockRespected", labelKey: "orderBlockRespected" },
      { name: "confluence", labelKey: "confluence" },
      { name: "retestConfirmed", labelKey: "retestConfirmed" },
      { name: "rejectionCandle", labelKey: "rejectionCandle" },
      { name: "liquiditySweep", labelKey: "liquiditySweep" },
      { name: "msShift", labelKey: "msShift" },
      { name: "htfAligned", labelKey: "htfAligned" },
    ],
  },
  {
    labelKey: "groupSessionConditions",
    items: [
      { name: "londonSession", labelKey: "londonSession" },
      { name: "nySession", labelKey: "nySession" },
      { name: "avoidedLowVolume", labelKey: "avoidedLowVolume" },
    ],
  },
  {
    labelKey: "groupExecution",
    items: [
      { name: "entryConfirmed", labelKey: "entryConfirmed" },
      { name: "riskManaged", labelKey: "riskManaged" },
      { name: "noImpulsiveEntry", labelKey: "noImpulsiveEntry" },
    ],
  },
];

const MENTAL_STATES = [
  { value: "calm", labelKey: "calm" },
  { value: "focused", labelKey: "focused" },
  { value: "tired", labelKey: "tired" },
  { value: "fearful", labelKey: "fearful" },
  { value: "overconfident", labelKey: "overconfident" },
  { value: "revenge", labelKey: "revenge" },
  { value: "emotional", labelKey: "emotional" },
  { value: "distracted", labelKey: "distracted" },
];

const PSYCH_QUESTIONS = [
  { name: "followedPlan", labelKey: "followedPlan" },
  { name: "movedSL", labelKey: "movedSL" },
  { name: "enteredEarly", labelKey: "enteredEarly" },
  { name: "overtraded", labelKey: "overtraded" },
  { name: "mentalHealthOk", labelKey: "mentalHealthOk" },
];

const SCREENSHOT_SLOTS = [
  { type: "before_entry", labelKey: "beforeEntry", icon: "📷" },
  { type: "after_exit", labelKey: "afterExit", icon: "📸" },
  { type: "higher_timeframe", labelKey: "htfAnalysis", icon: "🔭" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"];

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────
export default function NewTradeForm() {
  const [state, action, pending] = useActionState(createTradeAction, initialState);
  const t = useTranslations("newTrade");
  const tChecklist = useTranslations("newTrade.checklist");
  const tMentalStates = useTranslations("newTrade.mentalStates");

  // Checklist booleans
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  // Psychology booleans
  const [psych, setPsych] = useState<Record<string, boolean>>({});
  const [mentalState, setMentalState] = useState("");
  // Price fields for live RR calc
  const [prices, setPrices] = useState({ direction: "buy", entry: "", sl: "", tp: "" });
  // Screenshot previews
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const toggleChecklist = (name: string) =>
    setChecklist((prev) => ({ ...prev, [name]: !prev[name] }));

  const togglePsych = (name: string) =>
    setPsych((prev) => ({ ...prev, [name]: !prev[name] }));

  const score = calcChecklistScore(checklist as never);
  const rr = calcRR(
    prices.direction as "buy" | "sell",
    parseFloat(prices.entry),
    parseFloat(prices.sl),
    parseFloat(prices.tp)
  );

  const handleScreenshot = useCallback(
    (type: string, file: File | null) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [type]: url }));
    },
    []
  );

  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 760 }}>
      {/* Hidden boolean fields */}
      {Object.entries(checklist).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      {Object.entries(psych).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      <input type="hidden" name="mentalState" value={mentalState} />

      {/* ── Section 1: Strategy Checklist ── */}
      <Section
        number={1}
        title={t("section1Title")}
        subtitle={t("confirmationsMet", { score })}
        scoreColor={score >= 10 ? "var(--success)" : score >= 6 ? "var(--warning)" : "var(--danger)"}
      >
        {/* Score bar */}
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(score / 16) * 100}%`,
              background:
                score >= 10
                  ? "var(--success)"
                  : score >= 6
                  ? "var(--warning)"
                  : "var(--danger)",
              transition: "width 0.3s ease",
              borderRadius: 2,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {CHECKLIST_GROUPS.map((group) => (
            <div key={group.labelKey}>
              <p className="section-title">{t(group.labelKey)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {group.items.map((item) => (
                  <label
                    key={item.name}
                    className={`toggle-item ${checklist[item.name] ? "checked" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${checklist[item.name] ? "var(--accent)" : "var(--border)"}`,
                        background: checklist[item.name] ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.12s",
                      }}
                      onClick={() => toggleChecklist(item.name)}
                    >
                      {checklist[item.name] && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: checklist[item.name] ? "var(--text-primary)" : "var(--text-secondary)",
                        userSelect: "none",
                      }}
                      onClick={() => toggleChecklist(item.name)}
                    >
                      {tChecklist(item.labelKey)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 2: Trade Journal ── */}
      <Section number={2} title={t("section2Title")} subtitle={t("section2Subtitle")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Row 1: Pair + Direction + Strategy */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label={t("fieldPair")} error={fe.pair?.[0]}>
              <input name="pair" placeholder={t("pairPlaceholder")} className={`input ${fe.pair ? "input-error" : ""}`} />
            </Field>
            <Field label={t("fieldDirection")} error={fe.direction?.[0]}>
              <select
                name="direction"
                className="input"
                value={prices.direction}
                onChange={(e) => setPrices((p) => ({ ...p, direction: e.target.value }))}
                style={{ cursor: "pointer" }}
              >
                <option value="buy">{t("buyLong")}</option>
                <option value="sell">{t("sellShort")}</option>
              </select>
            </Field>
            <Field label={t("fieldStrategy")}>
              <input name="strategy" placeholder={t("strategyPlaceholder")} className="input" />
            </Field>
          </div>

          {/* Row 2: Entry, Exit, SL, TP */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label={t("fieldEntryPrice")} error={fe.entryPrice?.[0]}>
              <input
                name="entryPrice"
                type="number"
                step="any"
                placeholder={t("pricePlaceholder")}
                className={`input ${fe.entryPrice ? "input-error" : ""}`}
                onChange={(e) => setPrices((p) => ({ ...p, entry: e.target.value }))}
              />
            </Field>
            <Field label={t("fieldExitPrice")}>
              <input name="exitPrice" type="number" step="any" placeholder={t("pricePlaceholder")} className="input" />
            </Field>
            <Field label={t("fieldStopLoss")} error={fe.stopLoss?.[0]}>
              <input
                name="stopLoss"
                type="number"
                step="any"
                placeholder={t("pricePlaceholder")}
                className={`input ${fe.stopLoss ? "input-error" : ""}`}
                onChange={(e) => setPrices((p) => ({ ...p, sl: e.target.value }))}
              />
            </Field>
            <Field label={t("fieldTakeProfit")} error={fe.takeProfit?.[0]}>
              <input
                name="takeProfit"
                type="number"
                step="any"
                placeholder={t("pricePlaceholder")}
                className={`input ${fe.takeProfit ? "input-error" : ""}`}
                onChange={(e) => setPrices((p) => ({ ...p, tp: e.target.value }))}
              />
            </Field>
          </div>

          {/* RR display */}
          {rr !== null && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: rr >= 2 ? "var(--success-muted)" : "var(--accent-muted)",
                border: `1px solid ${rr >= 2 ? "var(--success)" : "var(--accent)"}`,
                borderRadius: 6,
                fontSize: 13,
                color: rr >= 2 ? "var(--success)" : "var(--accent)",
                fontWeight: 600,
              }}
            >
              {t("calculatedRR", { rr })}
            </div>
          )}

          {/* Row 3: Risk */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={t("fieldPositionSize")}>
              <input name="positionSize" type="number" step="any" placeholder={t("positionSizePlaceholder")} className="input" />
            </Field>
            <Field label={t("fieldRiskPercent")}>
              <input name="riskPercent" type="number" step="any" min="0" max="100" placeholder={t("riskPercentPlaceholder")} className="input" />
            </Field>
          </div>

          {/* Row 4: Timing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label={t("fieldEntryTime")} error={fe.entryTime?.[0]}>
              <input name="entryTime" type="datetime-local" className={`input ${fe.entryTime ? "input-error" : ""}`} />
            </Field>
            <Field label={t("fieldExitTime")}>
              <input name="exitTime" type="datetime-local" className="input" />
            </Field>
            <Field label={t("fieldEntryTimeframe")}>
              <select name="entryTf" className="input">
                <option value="">{t("selectTf")}</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </Field>
            <Field label={t("fieldHigherTf")}>
              <select name="higherTf" className="input">
                <option value="">{t("selectTf")}</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </Field>
          </div>

          {/* Notes */}
          <Field label={t("fieldSetupExplanation")}>
            <textarea name="setupNotes" rows={3} placeholder={t("setupPlaceholder")} className="input" style={{ resize: "vertical" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={t("fieldExecutionNotes")}>
              <textarea name="executionNotes" rows={2} placeholder={t("executionPlaceholder")} className="input" style={{ resize: "vertical" }} />
            </Field>
            <Field label={t("fieldMistakesMade")}>
              <textarea name="mistakeNotes" rows={2} placeholder={t("mistakesPlaceholder")} className="input" style={{ resize: "vertical" }} />
            </Field>
          </div>
          <Field label={t("fieldLessonsLearned")}>
            <textarea name="lessonsLearned" rows={2} placeholder={t("lessonsPlaceholder")} className="input" style={{ resize: "vertical" }} />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Psychology ── */}
      <Section number={3} title={t("section3Title")} subtitle={t("section3Subtitle")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p className="section-title">{t("emotionalState")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MENTAL_STATES.map((ms) => (
                <button
                  key={ms.value}
                  type="button"
                  onClick={() => setMentalState(mentalState === ms.value ? "" : ms.value)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: `1px solid ${mentalState === ms.value ? "var(--accent)" : "var(--border)"}`,
                    background:
                      mentalState === ms.value ? "var(--accent-muted)" : "var(--bg-surface-2)",
                    color:
                      mentalState === ms.value ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: mentalState === ms.value ? 500 : 400,
                    transition: "all 0.12s",
                  }}
                >
                  {tMentalStates(ms.labelKey as never)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title">{t("selfAssessment")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {PSYCH_QUESTIONS.map((q) => (
                <label
                  key={q.name}
                  className={`toggle-item ${psych[q.name] ? "checked" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => togglePsych(q.name)}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${psych[q.name] ? "var(--accent)" : "var(--border)"}`,
                      background: psych[q.name] ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.12s",
                    }}
                  >
                    {psych[q.name] && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", userSelect: "none" }}>
                    {t(q.labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Screenshots ── */}
      <Section number={4} title={t("section4Title")} subtitle={t("section4Subtitle")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {SCREENSHOT_SLOTS.map((slot) => (
            <ScreenshotSlot
              key={slot.type}
              type={slot.type}
              label={t(slot.labelKey)}
              icon={slot.icon}
              uploadLabel={t("clickToUpload")}
              preview={previews[slot.type]}
              onChange={(file) => handleScreenshot(slot.type, file)}
            />
          ))}
        </div>
      </Section>

      {/* Global error */}
      {state.error && (
        <div
          style={{
            background: "var(--danger-muted)",
            border: "1px solid var(--danger)",
            borderRadius: 7,
            padding: "12px 16px",
            fontSize: 13,
            color: "var(--danger)",
          }}
        >
          {state.error}
        </div>
      )}

      {/* Submit */}
      <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-lg"
          style={{ minWidth: 160 }}
        >
          {pending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner />
              {t("savingTrade")}
            </span>
          ) : (
            t("saveTrade")
          )}
        </button>
        <Link href="/trades" className="btn btn-secondary btn-lg">
          {t("cancel")}
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Section({
  number,
  title,
  subtitle,
  scoreColor,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  scoreColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "var(--accent-muted)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </div>
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: scoreColor ?? "var(--text-muted)",
                marginTop: 1,
                fontWeight: scoreColor ? 600 : 400,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ marginBottom: 5 }}>{label}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

function ScreenshotSlot({
  type,
  label,
  icon,
  uploadLabel,
  preview,
  onChange,
}: {
  type: string;
  label: string;
  icon: string;
  uploadLabel: string;
  preview?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>
        {icon} {label}
      </p>
      <label
        style={{
          display: "block",
          border: `2px dashed var(--border)`,
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.15s",
          aspectRatio: "16/9",
          background: "var(--bg-surface-2)",
          position: "relative",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLLabelElement).style.borderColor = "var(--accent)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border)")
        }
      >
        <input
          type="file"
          name={`screenshot_${type}`}
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--text-muted)",
            }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M4 16l4-4 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="3" width="18" height="18" rx="3" />
            </svg>
            <span style={{ fontSize: 11 }}>{uploadLabel}</span>
          </div>
        )}
      </label>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}
