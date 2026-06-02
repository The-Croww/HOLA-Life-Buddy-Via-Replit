import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAuth } from "../App";

type ClientSummary = {
  id: string;
  name: string;
  email: string;
  lastCheckin: string;
  avgMood: number;
  trend: "up" | "down" | "neutral";
  risk: "low" | "medium" | "high";
  streak: number;
  emotions: string[];
};

const RISK_COLORS: Record<string, string> = {
  low: "#3dd68c",
  medium: "#f59e0b",
  high: "#ef4444",
};
const RISK_BG: Record<string, string> = {
  low: "var(--calm-bg)",
  medium: "var(--warning-bg)",
  high: "var(--alert-bg)",
};
const RISK_BORDER: Record<string, string> = {
  low: "var(--calm-border)",
  medium: "var(--warning-border)",
  high: "var(--alert-border)",
};

export function Dashboard({
  onViewClient,
}: {
  onViewClient: (id: string, name: string) => void;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const fetchClients = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/psychologist/clients", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [user?.token]);

  const handleGenerateCode = async () => {
    if (!user?.token) return;
    setGeneratingCode(true);
    try {
      const res = await fetch("/api/v1/psychologist/link-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLinkCode(data);
        setShowCodeModal(true);
        setCopied(false);
      }
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopy = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filtered = clients
    .filter((c) => riskFilter === "all" || c.risk === riskFilter)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()),
    );

  const totalAlerts = clients.filter((c) => c.risk === "high").length;
  const activeToday = clients.filter((c) => c.lastCheckin === "Today").length;
  const avgMood =
    clients.length > 0
      ? (clients.reduce((s, c) => s + c.avgMood, 0) / clients.length).toFixed(1)
      : null;

  const stats = [
    {
      label: "Total clients",
      value: loading ? "—" : String(clients.length),
      icon: Users,
      color: "var(--info)",
      bg: "var(--info-bg)",
      border: "var(--info-border)",
      trend: null,
      trendLabel: "",
    },
    {
      label: "Active today",
      value: loading ? "—" : String(activeToday),
      icon: Activity,
      color: "var(--calm)",
      bg: "var(--calm-bg)",
      border: "var(--calm-border)",
      trend: activeToday > 0 ? "up" : null,
      trendLabel: clients.length > 0 ? `${Math.round((activeToday / Math.max(clients.length, 1)) * 100)}% check-in rate` : "",
    },
    {
      label: "Risk alerts",
      value: loading ? "—" : String(totalAlerts),
      icon: AlertTriangle,
      color: totalAlerts > 0 ? "var(--alert)" : "var(--calm)",
      bg: totalAlerts > 0 ? "var(--alert-bg)" : "var(--calm-bg)",
      border: totalAlerts > 0 ? "var(--alert-border)" : "var(--calm-border)",
      trend: totalAlerts > 0 ? "down" : null,
      trendLabel: totalAlerts > 0 ? "Needs review" : "All clear",
    },
    {
      label: "Avg mood score",
      value: loading ? "—" : avgMood ?? "—",
      icon: BarChart3,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      border: "var(--warning-border)",
      trend: avgMood && parseFloat(avgMood) >= 6 ? "up" : avgMood ? "down" : null,
      trendLabel: avgMood ? `Out of 10` : "",
    },
  ];

  return (
    <div style={{ padding: "24px 28px 48px" }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "var(--shadow-card)",
                transition: "box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={stat.color} strokeWidth={2} />
                </div>
                {stat.trend && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 500,
                      color: stat.trend === "up" ? "var(--calm)" : "var(--alert)",
                      background: stat.trend === "up" ? "var(--calm-bg)" : "var(--alert-bg)",
                      padding: "2px 7px",
                      borderRadius: 999,
                      border: `1px solid ${stat.trend === "up" ? "var(--calm-border)" : "var(--alert-border)"}`,
                    }}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {stat.trendLabel}
                  </div>
                )}
                {!stat.trend && stat.trendLabel && (
                  <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "-0.01em" }}>
                    {stat.trendLabel}
                  </span>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1,
                    letterSpacing: "-0.05em",
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "-0.01em" }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client table card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {/* Table toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
                letterSpacing: "-0.02em",
              }}
            >
              All clients
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              {loading ? "Loading…" : `${filtered.length} of ${clients.length} clients`}
            </div>
          </div>

          {/* Risk filter pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "high", "medium", "low"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  border: "1px solid",
                  letterSpacing: "-0.01em",
                  transition: "all 0.1s",
                  background: riskFilter === r
                    ? r === "all" ? "var(--fg)" : RISK_BG[r]
                    : "transparent",
                  color: riskFilter === r
                    ? r === "all" ? "var(--bg)" : RISK_COLORS[r]
                    : "var(--muted)",
                  borderColor: riskFilter === r
                    ? r === "all" ? "var(--fg)" : RISK_BORDER[r]
                    : "var(--border)",
                }}
              >
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
            <input
              style={{
                padding: "7px 12px 7px 30px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: "var(--bg2)",
                color: "var(--fg)",
                width: 190,
                letterSpacing: "-0.01em",
                transition: "border-color 0.1s",
              }}
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--fg)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
          <button
            onClick={fetchClients}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "7px 9px",
              borderRadius: 8,
              background: "none",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.1s",
            }}
            title="Refresh"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg2)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={handleGenerateCode}
            disabled={generatingCode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              background: "var(--fg)",
              color: "var(--bg)",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: generatingCode ? "wait" : "pointer",
              fontFamily: "inherit",
              opacity: generatingCode ? 0.6 : 1,
              letterSpacing: "-0.01em",
              transition: "opacity 0.1s",
            }}
          >
            <UserPlus size={13} />
            {generatingCode ? "Generating…" : "Add client"}
          </button>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={{ padding: 56, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid var(--border)",
                borderTopColor: "var(--fg)",
                borderRadius: "50%",
                margin: "0 auto 12px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div
            style={{
              padding: "72px 48px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Users size={22} strokeWidth={1.5} color="var(--muted)" />
            </div>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--fg)",
                fontSize: 15,
                letterSpacing: "-0.02em",
              }}
            >
              No clients linked yet
            </div>
            <div style={{ fontSize: 13, maxWidth: 280, margin: "0 auto 20px", lineHeight: 1.6 }}>
              Generate a link code and share it with your client to get started.
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                borderRadius: 999,
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <UserPlus size={14} />
              Add your first client
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Client", "Last check-in", "Avg mood", "Trend", "Emotions", "Risk", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "var(--muted)",
                      padding: "10px 16px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: "var(--bg2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    background: "var(--bg)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg)")}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `hsl(${client.name.charCodeAt(0) * 17 % 360}, 60%, 15%)`,
                          color: `hsl(${client.name.charCodeAt(0) * 17 % 360}, 70%, 75%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--fg)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.3,
                          }}
                        >
                          {client.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {client.lastCheckin === "Today" && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--calm)",
                            boxShadow: "0 0 0 3px var(--calm-bg)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          color: client.lastCheckin === "Today" ? "var(--calm-dark)" : "var(--muted)",
                          fontWeight: client.lastCheckin === "Today" ? 500 : 400,
                        }}
                      >
                        {client.lastCheckin}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color:
                            client.avgMood >= 7
                              ? "var(--calm)"
                              : client.avgMood >= 4
                              ? "var(--warning)"
                              : "var(--alert)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {client.avgMood}
                      </span>
                      <span style={{ color: "var(--muted2)", fontSize: 11 }}>/10</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {client.trend === "up" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--calm)" }}>
                        <TrendingUp size={14} />
                        <span style={{ fontSize: 11, fontWeight: 500 }}>Up</span>
                      </div>
                    ) : client.trend === "down" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--alert)" }}>
                        <TrendingDown size={14} />
                        <span style={{ fontSize: 11, fontWeight: 500 }}>Down</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--muted)" }}>
                        <Minus size={14} />
                        <span style={{ fontSize: 11 }}>Stable</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {client.emotions.length > 0 ? (
                        client.emotions.slice(0, 2).map((e) => (
                          <span
                            key={e}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "var(--bg2)",
                              color: "var(--muted)",
                              border: "1px solid var(--border)",
                              letterSpacing: "-0.01em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted2)" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: RISK_BG[client.risk],
                        color: RISK_COLORS[client.risk],
                        border: `1px solid ${RISK_BORDER[client.risk]}`,
                        textTransform: "capitalize",
                        letterSpacing: "0.01em",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: RISK_COLORS[client.risk],
                          flexShrink: 0,
                        }}
                      />
                      {client.risk}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <button
                      onClick={() => onViewClient(client.id, client.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                        color: "var(--fg)",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        transition: "all 0.1s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--fg)";
                        e.currentTarget.style.color = "var(--bg)";
                        e.currentTarget.style.borderColor = "var(--fg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "var(--fg)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Link code modal */}
      {showCodeModal && linkCode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowCodeModal(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 36,
              width: 420,
              textAlign: "center",
              boxShadow: "var(--shadow-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--calm-bg)",
                border: "1px solid var(--calm-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                fontSize: 24,
              }}
            >
              🔗
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 6,
                color: "var(--fg)",
                letterSpacing: "-0.03em",
              }}
            >
              Client Link Code
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 24px" }}>
              Share this code with your client. They enter it in their Profile screen to link with you. Expires in 24 hours.
            </div>

            <div
              style={{
                background: "var(--bg2)",
                border: "1.5px dashed var(--border2)",
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  fontFamily: "var(--mono)",
                  color: "var(--fg)",
                }}
              >
                {linkCode.code}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: copied ? "var(--calm-bg)" : "var(--bg)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  color: copied ? "var(--calm)" : "var(--fg)",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setShowCodeModal(false)}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 999,
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
