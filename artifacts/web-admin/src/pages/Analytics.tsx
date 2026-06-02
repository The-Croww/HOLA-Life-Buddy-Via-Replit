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
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Users, CheckSquare, Flame } from "lucide-react";

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
  overflow: "hidden",
};

const KEY_METRICS = [
  {
    label: "Total clients",
    value: "5",
    icon: Users,
    color: "var(--info)",
    bg: "var(--info-bg)",
    border: "var(--info-border)",
    badge: "+2 this month",
    badgeUp: true,
  },
  {
    label: "Avg mood this week",
    value: "6.5",
    icon: TrendingUp,
    color: "var(--calm)",
    bg: "var(--calm-bg)",
    border: "var(--calm-border)",
    badge: "+0.3 vs last week",
    badgeUp: true,
  },
  {
    label: "Check-ins this week",
    value: "23",
    icon: CheckSquare,
    color: "var(--warning)",
    bg: "var(--warning-bg)",
    border: "var(--warning-border)",
    badge: "82% completion",
    badgeUp: true,
  },
  {
    label: "Active streak avg",
    value: "4.2d",
    icon: Flame,
    color: "var(--alert)",
    bg: "var(--alert-bg)",
    border: "var(--alert-border)",
    badge: "Per client",
    badgeUp: null,
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        boxShadow: "var(--shadow-md)",
        color: "var(--fg)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--muted)" }}>
        {payload[0].name}: <strong style={{ color: "var(--fg)" }}>{payload[0].value}</strong>
      </div>
    </div>
  );
};

export function Analytics() {
  return (
    <div style={{ padding: "24px 28px 48px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {KEY_METRICS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              style={{
                ...card,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={s.color} strokeWidth={2} />
                </div>
                {s.badge && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: s.badgeUp === true ? "var(--calm-dark)" : s.badgeUp === false ? "var(--alert)" : "var(--muted)",
                      background: s.badgeUp === true ? "var(--calm-bg)" : s.badgeUp === false ? "var(--alert-bg)" : "var(--bg2)",
                      border: `1px solid ${s.badgeUp === true ? "var(--calm-border)" : s.badgeUp === false ? "var(--alert-border)" : "var(--border)"}`,
                      borderRadius: 999,
                      padding: "2px 7px",
                    }}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", lineHeight: 1, letterSpacing: "-0.05em" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em" }}>
              Avg mood trend
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Last 6 weeks across all clients
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={WEEKLY_DATA}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3DD68C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3DD68C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="#3DD68C"
                  strokeWidth={2.5}
                  fill="url(#moodGrad)"
                  dot={{ r: 4, fill: "#3DD68C", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3DD68C", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em" }}>
              Feature engagement
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Most used features this month
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ENGAGEMENT} barSize={26}>
                <XAxis
                  dataKey="feature"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <Bar dataKey="uses" fill="var(--fg)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={card}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em" }}>
            Engagement summary
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Practice-wide performance indicators
          </div>
        </div>
        {[
          { label: "Most engaged client", value: "Maria Santos", sub: "24 check-ins this month", color: "var(--fg)" },
          { label: "Most used feature", value: "Mood Log", sub: "124 uses across all clients", color: "var(--fg)" },
          { label: "Avg session frequency", value: "3.2×/wk", sub: "Per active client", color: "var(--calm)" },
          { label: "Task completion rate", value: "78%", sub: "Of all assigned tasks", color: "var(--calm)" },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em" }}>
                {row.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{row.sub}</div>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: row.color,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "4px 12px",
                letterSpacing: "-0.02em",
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
