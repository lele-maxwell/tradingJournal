import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { ReportData } from "./pdf-actions";
import { formatPL, formatDate } from "./utils";

// Suppress Font.register calls during SSR if fonts aren't available
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#080808",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: "1px solid #222222",
  },
  logo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: "#D4AF37",
  },
  tagline: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
  },
  date: {
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: "#f5f5f5",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 11,
    color: "#b0b0b0",
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 16,
    border: "1px solid #222222",
  },
  statLabel: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#f5f5f5",
  },
  statValueSuccess: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#22C55E",
  },
  statValueDanger: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#EF4444",
  },
  statSub: {
    fontSize: 9,
    color: "#666666",
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#f5f5f5",
    marginBottom: 12,
    marginTop: 24,
  },
  table: {
    width: "100%",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderBottom: "1px solid #222222",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 10,
    color: "#f5f5f5",
  },
  tdMuted: {
    fontSize: 10,
    color: "#b0b0b0",
  },
  col1: { width: "28%" },
  col2: { width: "12%" },
  col3: { width: "12%" },
  col4: { width: "16%", textAlign: "right" },
  col5: { width: "12%", textAlign: "right" },
  col6: { width: "20%", textAlign: "right" },
  badgeWin: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#22C55E",
  },
  badgeLoss: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#EF4444",
  },
  badgeNeutral: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#b0b0b0",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#666666",
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 12,
    color: "#666666",
  },
});

function StatCard({ label, value, sub, color = "default" }: { label: string; value: string; sub?: string; color?: "default" | "success" | "danger" }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={color === "success" ? styles.statValueSuccess : color === "danger" ? styles.statValueDanger : styles.statValue}>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function TableHeader() {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.th, styles.col1]}>Asset</Text>
      <Text style={[styles.th, styles.col2]}>Direction</Text>
      <Text style={[styles.th, styles.col3]}>Outcome</Text>
      <Text style={[styles.th, styles.col4]}>P/L</Text>
      <Text style={[styles.th, styles.col5]}>RR</Text>
      <Text style={[styles.th, styles.col6]}>Date</Text>
    </View>
  );
}

function TableRow({ trade }: { trade: ReportData["trades"][0] }) {
  const pl = trade.profitLoss;
  const isWin = pl !== null && pl > 0;
  const isLoss = pl !== null && pl < 0;
  const outcomeText = pl === null ? "Open" : isWin ? "Win" : "Loss";
  const outcomeStyle = isWin ? styles.badgeWin : isLoss ? styles.badgeLoss : styles.badgeNeutral;

  return (
    <View style={styles.tableRow} key={trade.id}>
      <Text style={[styles.td, styles.col1]}>{trade.pair}</Text>
      <Text style={[styles.tdMuted, styles.col2]}>{trade.direction === "buy" ? "Buy" : "Sell"}</Text>
      <Text style={[outcomeStyle, styles.col3]}>{outcomeText}</Text>
      <Text style={[styles.td, styles.col4, { color: isWin ? "#22C55E" : isLoss ? "#EF4444" : "#b0b0b0" }]}>
        {formatPL(pl)}
      </Text>
      <Text style={[styles.tdMuted, styles.col5]}>{trade.riskReward?.toFixed(2) ?? "—"}</Text>
      <Text style={[styles.tdMuted, styles.col6]}>{formatDate(trade.entryTime)}</Text>
    </View>
  );
}

export function ReportPdf({ data }: { data: ReportData }) {
  const { trades, stats, dateRange } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MaxStrat</Text>
            <Text style={styles.tagline}>Trading Journal</Text>
          </View>
          <Text style={styles.date}>
            Generated: {formatDate(new Date())}
            {"\n"}
            {dateRange.label}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Performance Report</Text>
        <Text style={styles.subtitle}>
          {dateRange.start
            ? `${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`
            : `All trades through ${formatDate(dateRange.end)}`}
        </Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Trades"
            value={String(stats.total)}
            sub={`${stats.wins}W / ${stats.losses}L`}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            sub="win percentage"
            color={stats.winRate >= 60 ? "success" : stats.winRate >= 40 ? "default" : "danger"}
          />
          <StatCard
            label="Total P/L"
            value={formatPL(stats.totalPL)}
            sub="profit/loss"
            color={stats.totalPL >= 0 ? "success" : "danger"}
          />
          <StatCard
            label="Avg RR"
            value={stats.avgRR !== null ? stats.avgRR.toFixed(2) : "—"}
            sub="risk/reward"
          />
        </View>

        {/* Checklist Average */}
        <Text style={styles.sectionTitle}>Checklist Consistency</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { flex: 0.5 }]}>
            <Text style={styles.statLabel}>Average Score</Text>
            <Text style={[styles.statValue, { color: stats.avgChecklist >= 10 ? "#22C55E" : stats.avgChecklist >= 6 ? "#F59E0B" : "#EF4444" }]}>
              {stats.avgChecklist} / 16
            </Text>
          </View>
        </View>

        {/* Trade List */}
        <Text style={styles.sectionTitle}>Trade History</Text>
        {trades.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No trades in this period.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <TableHeader />
            {trades.map((trade) => (
              <TableRow key={trade.id} trade={trade} />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by MaxStrat — {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}