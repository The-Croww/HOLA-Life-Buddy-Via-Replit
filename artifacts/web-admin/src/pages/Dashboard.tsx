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
    <div style={{ padding: "24px 32px 40px" }}>

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
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px solid ${stat.color}22`,
                }}
              >
                <Icon size={18} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
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
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>All clients</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              {loading ? "Loading…" : `${filtered.length} of ${clients.length}`}
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
              }}
            />
            <input
              style={{
                padding: "7px 12px 7px 30px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                background: "var(--bg2)",
                color: "var(--fg)",
                width: 200,
              }}
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              borderRadius: 8,
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: generatingCode ? "wait" : "pointer",
              fontFamily: "Inter, sans-serif",
              opacity: generatingCode ? 0.7 : 1,
            }}
          >
            <UserPlus size={13} />
            {generatingCode ? "Generating…" : "Add client"}
          </button>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div
            style={{
              padding: 56,
              textAlign: "center",
              color: "var(--muted)",
              background: "var(--bg2)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--bg3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Users size={24} strokeWidth={1.5} color="var(--muted)" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--fg)", fontSize: 15 }}>
              No clients linked yet
            </div>
            <div style={{ fontSize: 13, maxWidth: 280, margin: "0 auto" }}>
              Click <strong>Add client</strong> to generate a link code and share it with your client.
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
                {["Client", "Last check-in", "Avg mood", "Trend", "Emotions", "Risk", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      padding: "10px 16px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
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
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#0a0a0a",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: client.lastCheckin === "Today" ? "var(--calm)" : "var(--muted)", fontWeight: client.lastCheckin === "Today" ? 500 : 400 }}>
                    {client.lastCheckin === "Today" && (
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--calm)", marginRight: 6, verticalAlign: "middle" }} />
                    )}
                    {client.lastCheckin}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: client.avgMood >= 7 ? "var(--calm)" : client.avgMood >= 4 ? "var(--warning)" : "var(--alert)" }}>
                      {client.avgMood}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>/10</span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {client.trend === "up" ? (
                      <TrendingUp size={16} color="var(--calm)" />
                    ) : client.trend === "down" ? (
                      <TrendingDown size={16} color="var(--alert)" />
                    ) : (
                      <Minus size={16} color="var(--muted)" />
                    )}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {client.emotions.length > 0 ? (
                        client.emotions.slice(0, 3).map((e) => (
                          <span
                            key={e}
                            style={{
                              fontSize: 11,
                              padding: "2px 7px",
                              borderRadius: 99,
                              background: "var(--bg2)",
                              color: "var(--muted)",
                              border: "1px solid var(--border)",
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
                  <td style={{ padding: "13px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: RISK_BG[client.risk],
                        color: RISK_COLORS[client.risk],
                        border: `1px solid ${RISK_COLORS[client.risk]}44`,
                        textTransform: "capitalize",
                      }}
                    >
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
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "Inter, sans-serif",
                        color: "var(--fg)",
                        fontWeight: 500,
                        transition: "all 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--fg)"; e.currentTarget.style.color = "var(--bg)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--fg)"; }}
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
            zIndex: 50,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowCodeModal(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 36,
              width: 400,
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              🔗
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "var(--fg)" }}>
              Client Link Code
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Share this code with your client. They enter it in their Profile screen to link with you. Expires in 24 hours.
            </div>

            {/* Code display */}
            <div
              style={{
                background: "var(--bg2)",
                border: "2px dashed var(--border)",
                borderRadius: 12,
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
                  letterSpacing: "0.2em",
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
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: copied ? "#f0fdf4" : "var(--bg)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
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
                borderRadius: 10,
                background: "#0a0a0a",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
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
