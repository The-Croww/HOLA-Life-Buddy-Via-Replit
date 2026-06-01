import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Users, Activity, Award } from "lucide-react";
import { useAuth } from "../App";

type ReportEntry = {
  clientId: string;
  clientName: string;
  avgMood: string | null;
  checkInRate: number;
  checkIns: number;
  tasksCompleted: number;
  topEmotions: string[];
  insight: string;
};

type Overview = {
  totalCheckIns: number;
  mostImproved: string | null;
  overallAvgMood: string | null;
  clientCount: number;
};

type ReportRange = "week" | "lastweek" | "month";

const RANGE_LABELS: Record<ReportRange, string> = {
  week: "This week",
  lastweek: "Last week",
  month: "Last 30 days",
};

function moodColor(score: number | null) {
  if (!score) return "#999";
  if (score >= 7) return "#3DD68C";
  if (score >= 5) return "#F59E0B";
  return "#ef4444";
}

function MoodBar({ score }: { score: number | null }) {
  const pct = score ? (score / 10) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg2)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: moodColor(score ? Number(score) : null), borderRadius: 999, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", minWidth: 32 }}>{score ?? "—"}</span>
    </div>
  );
}

export function Reports({ onViewClient }: { onViewClient: (id: string, name: string) => void }) {
  const { user } = useAuth();
  const [range, setRange] = useState<ReportRange>("week");
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    fetch(`/api/v1/psychologist/reports?range=${range}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? []);
        setOverview(d.overview ?? null);
      })
      .finally(() => setLoading(false));
  }, [range, user?.token]);

  const handlePrint = () => window.print();

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Practice overview</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {(["week", "lastweek", "month"] as ReportRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: range === r ? "#0a0a0a" : "var(--bg)",
                color: range === r ? "#fff" : "var(--muted)",
                fontSize: 12,
                fontWeight: range === r ? 600 : 400,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
          <button
            onClick={handlePrint}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid #3DD68C",
              background: "transparent",
              color: "#3DD68C",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              marginLeft: 8,
            }}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Practice overview stats */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total check-ins", value: overview.totalCheckIns, icon: <Activity size={16} color="#3DD68C" /> },
            { label: "Active clients", value: overview.clientCount, icon: <Users size={16} color="#6366f1" /> },
            { label: "Avg mood (practice)", value: overview.overallAvgMood ? `${overview.overallAvgMood}/10` : "—", icon: <TrendingUp size={16} color="#F59E0B" /> },
            { label: "Top performer", value: overview.mostImproved ?? "—", icon: <Award size={16} color="#E1306C" /> },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>{s.icon}<span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.label}</span></div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-client report cards */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
        Client reports — {RANGE_LABELS[range]}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Loading reports…</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>No client data yet</div>
          <div style={{ fontSize: 13 }}>Link clients and they'll appear here once they start logging.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r) => (
            <div key={r.clientId} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: previewId === r.clientId ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                    {r.clientName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{r.clientName}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{r.checkIns} check-ins · {r.tasksCompleted} tasks done</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPreviewId(previewId === r.clientId ? null : r.clientId)}
                    style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                  >
                    {previewId === r.clientId ? "Hide report" : "Preview report"}
                  </button>
                  <button
                    onClick={() => onViewClient(r.clientId, r.clientName)}
                    style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#0a0a0a", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                  >
                    Open profile →
                  </button>
                </div>
              </div>

              {/* Expanded report card */}
              {previewId === r.clientId && (
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Average Mood</div>
                      <MoodBar score={r.avgMood ? Number(r.avgMood) : null} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Check-in rate</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--bg2)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(r.checkInRate, 100)}%`, height: "100%", background: "#6366f1", borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", minWidth: 36 }}>{Math.min(r.checkInRate, 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {r.topEmotions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Top emotions</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.topEmotions.map((e) => (
                          <span key={e} style={{ padding: "4px 10px", borderRadius: 999, background: "var(--bg2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--muted)" }}>{e}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg2)", borderRadius: 10, borderLeft: "3px solid #3DD68C" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#3DD68C", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>✦ AI Insight</div>
                    <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.6 }}>{r.insight}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
