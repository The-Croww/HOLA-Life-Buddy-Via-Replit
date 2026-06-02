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
  low: "#f0fdf4",
  medium: "#fffbeb",
  high: "#fef2f2",
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

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAlerts = clients.filter((c) => c.risk === "high").length;
  const avgMood =
    clients.length > 0
      ? (clients.reduce((s, c) => s + c.avgMood, 0) / clients.length).toFixed(1)
      : "—";

  const stats = [
    { label: "Total clients", value: clients.length, icon: Users, color: "#6366f1", bg: "#eef2ff" },
    { label: "Active today", value: clients.filter((c) => c.lastCheckin === "Today").length, icon: Activity, color: "#3dd68c", bg: "#f0fdf4" },
    { label: "Risk alerts", value: totalAlerts, icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2" },
    { label: "Avg mood", value: avgMood, icon: BarChart3, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div style={{ padding: "28px 32px 48px" }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px 22px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px solid ${stat.color}18`,
                }}
              >
                <Icon size={16} color={stat.color} strokeWidth={2} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5, letterSpacing: "-0.01em" }}>
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
          borderRadius: 16,
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {/* Table toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
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
                width: 200,
                letterSpacing: "-0.01em",
              }}
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0d0d0d")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
          <button
            onClick={fetchClients}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "7px 10px",
              borderRadius: 8,
              background: "none",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
            title="Refresh"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
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
              borderRadius: 9999,
              background: "#0d0d0d",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: generatingCode ? "wait" : "pointer",
              fontFamily: "inherit",
              opacity: generatingCode ? 0.6 : 1,
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!generatingCode) e.currentTarget.style.background = "#1a1a1a";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0d0d0d")}
          >
            <UserPlus size={13} />
            {generatingCode ? "Generating…" : "Add client"}
          </button>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={{ padding: 56, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div
            style={{
              padding: "64px 48px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
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
            <div style={{ fontSize: 13, maxWidth: 280, margin: "0 auto", lineHeight: 1.6 }}>
              Click <strong>Add client</strong> to generate a link code and share it with your client.
            </div>
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
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      padding: "10px 18px",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      background: "var(--bg2)",
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
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg)")}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#0d0d0d",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                          letterSpacing: "-0.01em",
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
                  <td style={{ padding: "14px 18px", fontSize: 13, color: client.lastCheckin === "Today" ? "var(--calm)" : "var(--muted)", fontWeight: client.lastCheckin === "Today" ? 500 : 400 }}>
                    {client.lastCheckin === "Today" && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--calm)",
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {client.lastCheckin}
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          client.avgMood >= 7
                            ? "var(--calm)"
                            : client.avgMood >= 4
                            ? "var(--warning)"
                            : "var(--alert)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {client.avgMood}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>/10</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {client.trend === "up" ? (
                      <TrendingUp size={15} color="var(--calm)" />
                    ) : client.trend === "down" ? (
                      <TrendingDown size={15} color="var(--alert)" />
                    ) : (
                      <Minus size={15} color="var(--muted)" />
                    )}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {client.emotions.length > 0 ? (
                        client.emotions.slice(0, 3).map((e) => (
                          <span
                            key={e}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "var(--bg2)",
                              color: "var(--muted)",
                              border: "1px solid var(--border)",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {e}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: RISK_BG[client.risk],
                        color: RISK_COLORS[client.risk],
                        border: `1px solid ${RISK_COLORS[client.risk]}33`,
                        textTransform: "capitalize",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {client.risk}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button
                      onClick={() => onViewClient(client.id, client.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 9999,
                        border: "1px solid var(--border)",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                        color: "var(--fg)",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0d0d0d";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.borderColor = "#0d0d0d";
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
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            backdropFilter: "blur(4px)",
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
              boxShadow: "0 24px 64px rgba(0,0,0,0.14)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 22,
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
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Share this code with your client. They enter it in their Profile screen to link with you. Expires in 24 hours.
            </div>

            <div
              style={{
                background: "var(--bg2)",
                border: "1px dashed var(--border)",
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
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  fontFamily: "monospace",
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
                  borderRadius: 9999,
                  border: "1px solid var(--border)",
                  background: copied ? "#f0fdf4" : "var(--bg)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  color: copied ? "var(--calm)" : "var(--fg)",
                  fontWeight: 500,
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
                borderRadius: 9999,
                background: "#0d0d0d",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0d0d0d")}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
