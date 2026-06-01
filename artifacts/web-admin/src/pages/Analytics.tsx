import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const WEEKLY_DATA = [
  { week: "W1", avg: 5.2 },
  { week: "W2", avg: 6.1 },
  { week: "W3", avg: 5.8 },
  { week: "W4", avg: 6.8 },
  { week: "W5", avg: 7.1 },
  { week: "W6", avg: 6.5 },
];

const ENGAGEMENT = [
  { feature: "Mood Log", uses: 124 },
  { feature: "AI Chat", uses: 89 },
  { feature: "Breathe", uses: 67 },
  { feature: "Journal", uses: 45 },
  { feature: "Meditate", uses: 38 },
];

const card: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-card)",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export function Analytics() {
  return (
    <div style={{ padding: "24px 32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Key metrics */}
      <div>
        <SectionHeading>Key metrics</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { label: "Total clients", value: "5", emoji: "👥", color: "#6366f1", bg: "#eef2ff" },
            { label: "Avg mood this week", value: "6.5", emoji: "📊", color: "#3dd68c", bg: "#f0fdf4" },
            { label: "Check-ins this week", value: "23", emoji: "✅", color: "#f59e0b", bg: "#fffbeb" },
            { label: "Active streak avg", value: "4.2d", emoji: "🔥", color: "#ef4444", bg: "#fef2f2" },
          ].map((s) => (
            <div key={s.label} style={{ ...card, padding: "20px" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: s.bg,
                  border: `1px solid ${s.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  marginBottom: 12,
                }}
              >
                {s.emoji}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <SectionHeading>Trends</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Avg mood trend</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Last 6 weeks across all clients</div>
            </div>
            <div style={{ padding: "20px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={WEEKLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, background: "#fff", border: "1px solid var(--border)" }}
                  />
                  <Line type="monotone" dataKey="avg" stroke="#3dd68c" strokeWidth={2.5} dot={{ r: 4, fill: "#3dd68c" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Feature engagement</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Most used features this month</div>
            </div>
            <div style={{ padding: "20px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ENGAGEMENT}>
                  <XAxis dataKey="feature" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, background: "#fff", border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="uses" fill="#0a0a0a" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div>
        <SectionHeading>Engagement summary</SectionHeading>
        <div style={card}>
          {[
            { label: "Most engaged client", value: "Maria Santos", sub: "24 check-ins this month" },
            { label: "Most used feature", value: "Mood Log", sub: "124 uses across all clients" },
            { label: "Avg session frequency", value: "3.2×/week", sub: "Per active client" },
            { label: "Task completion rate", value: "78%", sub: "Of all assigned tasks" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>{row.label}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{row.sub}</div>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--fg)",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "4px 12px",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
