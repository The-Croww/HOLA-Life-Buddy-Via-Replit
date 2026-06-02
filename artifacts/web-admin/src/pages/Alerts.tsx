import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, Eye, Zap } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../App";

type RiskAlert = {
  id: string;
  clientId: string;
  clientName: string;
  type: "mood_drop" | "no_checkin" | "distress_emotion" | "task_overdue";
  message: string;
  severity: "high" | "medium" | "low";
  reviewed: boolean;
  createdAt: string;
};

const SEV_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6366f1",
};
const SEV_BG: Record<string, string> = {
  high: "#fef2f2",
  medium: "#fffbeb",
  low: "#eef2ff",
};
const TYPE_LABELS: Record<string, string> = {
  mood_drop: "Mood Drop",
  no_checkin: "No Check-in",
  distress_emotion: "Distress Signal",
  task_overdue: "Task Overdue",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

export function Alerts({
  onViewClient,
}: {
  onViewClient: (id: string, name: string) => void;
}) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchAlerts = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch("/api/v1/psychologist/alerts", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchAlerts();
    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      query: { psychologistId: user.id },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("alert", (alert: RiskAlert) => {
      setAlerts((prev) => [alert, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [user?.id]);

  const markReviewed = async (id: string) => {
    if (!user?.token) return;
    const res = await fetch(`/api/v1/psychologist/alerts/${id}/review`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (res.ok) {
      const updated = await res.json();
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
  };

  const unreviewed = alerts.filter((a) => !a.reviewed).length;
  const reviewed = alerts.filter((a) => a.reviewed);
  const pending = alerts.filter((a) => !a.reviewed);

  return (
    <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Live status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "16px 20px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: unreviewed > 0 ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${unreviewed > 0 ? "#fecaca" : "#a7f3d0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={18} color={unreviewed > 0 ? "#ef4444" : "#3dd68c"} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
              {loading ? "Loading alerts…" : unreviewed > 0 ? `${unreviewed} alert${unreviewed !== 1 ? "s" : ""} need${unreviewed === 1 ? "s" : ""} attention` : "All alerts reviewed"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {alerts.length} total · {reviewed.length} reviewed
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            background: connected ? "#f0fdf4" : "var(--bg2)",
            color: connected ? "#3dd68c" : "var(--muted)",
            border: `1px solid ${connected ? "#a7f3d0" : "var(--border)"}`,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: connected ? "#3dd68c" : "var(--muted)",
              boxShadow: connected ? "0 0 0 3px #3dd68c33" : "none",
            }}
          />
          <Zap size={11} />
          {connected ? "Live" : "Connecting…"}
        </div>
      </div>

      {/* Pending alerts */}
      <div>
        <SectionHeading>Needs attention ({pending.length})</SectionHeading>
        {!loading && pending.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--fg)", fontSize: 15 }}>
              No pending alerts
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              The risk engine will notify you here when a client needs attention.
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onViewClient={onViewClient}
              onMarkReviewed={markReviewed}
            />
          ))}
        </div>
      </div>

      {reviewed.length > 0 && (
        <div>
          <SectionHeading>Reviewed ({reviewed.length})</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviewed.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onViewClient={onViewClient}
                onMarkReviewed={markReviewed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onViewClient,
  onMarkReviewed,
}: {
  alert: RiskAlert;
  onViewClient: (id: string, name: string) => void;
  onMarkReviewed: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: alert.reviewed ? "var(--bg2)" : "var(--bg)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${alert.reviewed ? "var(--border)" : SEV_COLORS[alert.severity]}`,
        borderRadius: 12,
        padding: "16px 20px",
        opacity: alert.reviewed ? 0.65 : 1,
        boxShadow: alert.reviewed ? "none" : "var(--shadow-card)",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: SEV_BG[alert.severity],
              border: `1px solid ${SEV_COLORS[alert.severity]}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={16} color={SEV_COLORS[alert.severity]} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>
              {alert.clientName}
            </div>
            <div style={{ fontSize: 12, color: SEV_COLORS[alert.severity], marginTop: 1, fontWeight: 500 }}>
              {TYPE_LABELS[alert.type] ?? alert.type}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
              {alert.message}
            </div>
          </div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: SEV_BG[alert.severity],
            color: SEV_COLORS[alert.severity],
            border: `1px solid ${SEV_COLORS[alert.severity]}44`,
            flexShrink: 0,
            textTransform: "capitalize",
          }}
        >
          {alert.severity}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 0 12px" }} />

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(alert.createdAt)}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onViewClient(alert.clientId, alert.clientName)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 9999,
              border: "1px solid var(--border)",
              background: "#0d0d0d",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            <Eye size={12} /> View client
          </button>
          {!alert.reviewed ? (
            <button
              onClick={() => onMarkReviewed(alert.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 9999,
                border: "1px solid var(--border)",
                background: "none",
                color: "var(--fg)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              <CheckCircle size={12} /> Mark reviewed
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "var(--calm)", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle size={12} /> Reviewed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
