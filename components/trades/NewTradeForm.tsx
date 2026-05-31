"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import { createTradeAction, type TradeActionState } from "@/lib/actions/trade.actions";
import { calcChecklistScore, calcRR } from "@/lib/validations/trade.schema";

const initialState: TradeActionState = {};

// ────────────────────────────────────────────────────────────────
// Checklist config
// ────────────────────────────────────────────────────────────────
const CHECKLIST_GROUPS = [
  {
    label: "Market Structure",
    items: [
      { name: "supportRespected", label: "Support respected" },
      { name: "resistanceRespected", label: "Resistance respected" },
      { name: "trendlineRespected", label: "Trendline respected" },
      { name: "orderBlockRespected", label: "Order block respected" },
      { name: "confluence", label: "Confluence / Intersection present" },
      { name: "retestConfirmed", label: "Retest confirmed" },
      { name: "rejectionCandle", label: "Rejection candle formed" },
      { name: "liquiditySweep", label: "Liquidity sweep occurred" },
      { name: "msShift", label: "Market structure shift confirmed" },
      { name: "htfAligned", label: "Higher timeframe aligned" },
    ],
  },
  {
    label: "Session Conditions",
    items: [
      { name: "londonSession", label: "London session" },
      { name: "nySession", label: "New York session" },
      { name: "avoidedLowVolume", label: "Avoided low-volume hours" },
    ],
  },
  {
    label: "Execution",
    items: [
      { name: "entryConfirmed", label: "Entry confirmation respected" },
      { name: "riskManaged", label: "Risk management respected" },
      { name: "noImpulsiveEntry", label: "No impulsive entry" },
    ],
  },
];

const MENTAL_STATES = [
  { value: "calm", label: "😌 Calm" },
  { value: "focused", label: "🎯 Focused" },
  { value: "tired", label: "😴 Tired" },
  { value: "fearful", label: "😨 Fearful" },
  { value: "overconfident", label: "😤 Overconfident" },
  { value: "revenge", label: "😤 Revenge trading" },
  { value: "emotional", label: "😰 Emotional" },
  { value: "distracted", label: "🙃 Distracted" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"];

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────
export default function NewTradeForm() {
  const [state, action, pending] = useActionState(createTradeAction, initialState);

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
        title="Strategy Checklist"
        subtitle={`${score} / 16 confirmations met`}
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
            <div key={group.label}>
              <p className="section-title">{group.label}</p>
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
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 2: Trade Journal ── */}
      <Section number={2} title="Trade Journal" subtitle="Record your execution details">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Row 1: Pair + Direction + Strategy */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Asset / Pair *" error={fe.pair?.[0]}>
              <input name="pair" placeholder="e.g. EUR/USD" className={`input ${fe.pair ? "input-error" : ""}`} />
            </Field>
            <Field label="Direction *" error={fe.direction?.[0]}>
              <select
                name="direction"
                className="input"
                value={prices.direction}
                onChange={(e) => setPrices((p) => ({ ...p, direction: e.target.value }))}
                style={{ cursor: "pointer" }}
              >
                <option value="buy">📈 Buy / Long</option>
                <option value="sell">📉 Sell / Short</option>
              </select>
            </Field>
            <Field label="Strategy">
              <input name="strategy" placeholder="e.g. OB Retest" className="input" />
            </Field>
          </div>

          {/* Row 2: Entry, Exit, SL, TP */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label="Entry Price *" error={fe.entryPrice?.[0]}>
              <input
                name="entryPrice"
                type="number"
                step="any"
                placeholder="0.00"
                className={`input ${fe.entryPrice ? "input-error" : ""}`}
                onChange={(e) => setPrices((p) => ({ ...p, entry: e.target.value }))}
              />
            </Field>
            <Field label="Exit Price">
              <input name="exitPrice" type="number" step="any" placeholder="0.00" className="input" />
            </Field>
            <Field label="Stop Loss *" error={fe.stopLoss?.[0]}>
              <input
                name="stopLoss"
                type="number"
                step="any"
                placeholder="0.00"
                className={`input ${fe.stopLoss ? "input-error" : ""}`}
                onChange={(e) => setPrices((p) => ({ ...p, sl: e.target.value }))}
              />
            </Field>
            <Field label="Take Profit *" error={fe.takeProfit?.[0]}>
              <input
                name="takeProfit"
                type="number"
                step="any"
                placeholder="0.00"
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
              Calculated RR: 1 : {rr}
            </div>
          )}

          {/* Row 3: Risk */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Position Size">
              <input name="positionSize" type="number" step="any" placeholder="e.g. 0.10 lots" className="input" />
            </Field>
            <Field label="Risk %">
              <input name="riskPercent" type="number" step="any" min="0" max="100" placeholder="e.g. 1" className="input" />
            </Field>
          </div>

          {/* Row 4: Timing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label="Entry Time *" error={fe.entryTime?.[0]}>
              <input name="entryTime" type="datetime-local" className={`input ${fe.entryTime ? "input-error" : ""}`} />
            </Field>
            <Field label="Exit Time">
              <input name="exitTime" type="datetime-local" className="input" />
            </Field>
            <Field label="Entry Timeframe">
              <select name="entryTf" className="input">
                <option value="">Select TF</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </Field>
            <Field label="Higher TF">
              <select name="higherTf" className="input">
                <option value="">Select TF</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </Field>
          </div>

          {/* Notes */}
          <Field label="Setup Explanation">
            <textarea name="setupNotes" rows={3} placeholder="Describe your setup and why you took this trade…" className="input" style={{ resize: "vertical" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Execution Notes">
              <textarea name="executionNotes" rows={2} placeholder="How did the execution go?" className="input" style={{ resize: "vertical" }} />
            </Field>
            <Field label="Mistakes Made">
              <textarea name="mistakeNotes" rows={2} placeholder="Any mistakes?" className="input" style={{ resize: "vertical" }} />
            </Field>
          </div>
          <Field label="Lessons Learned">
            <textarea name="lessonsLearned" rows={2} placeholder="What will you do differently?" className="input" style={{ resize: "vertical" }} />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Psychology ── */}
      <Section number={3} title="Psychology" subtitle="Track your mental state">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p className="section-title">Emotional State</p>
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
                  {ms.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-title">Self-Assessment</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { name: "followedPlan", label: "✅ I followed my trading plan" },
                { name: "movedSL", label: "⚠️ I moved my Stop Loss emotionally" },
                { name: "enteredEarly", label: "⚠️ I entered too early" },
                { name: "overtraded", label: "⚠️ I overtraded today" },
                { name: "mentalHealthOk", label: "✅ My mental health was okay before entry" },
              ].map((q) => (
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
                    {q.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Screenshots ── */}
      <Section number={4} title="Screenshots" subtitle="Upload chart images for review">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { type: "before_entry", label: "Before Entry", icon: "📷" },
            { type: "after_exit", label: "After Exit", icon: "📸" },
            { type: "higher_timeframe", label: "HTF Analysis", icon: "🔭" },
          ].map((slot) => (
            <ScreenshotSlot
              key={slot.type}
              type={slot.type}
              label={slot.label}
              icon={slot.icon}
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
              Saving trade…
            </span>
          ) : (
            "Save Trade"
          )}
        </button>
        <Link href="/trades" className="btn btn-secondary btn-lg">
          Cancel
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
  preview,
  onChange,
}: {
  type: string;
  label: string;
  icon: string;
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
            <span style={{ fontSize: 11 }}>Click to upload</span>
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
