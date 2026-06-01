import React, { useState, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../App";

type SessionType = "initial" | "followup" | "crisis";
type Appointment = {
  id: string;
  clientId: string;
  clientName: string;
  sessionType: SessionType;
  dateTime: string;
  notes: string;
  createdAt: string;
};
type Client = { id: string; name: string };

const SESSION_COLORS: Record<SessionType, string> = {
  initial: "#6366f1",
  followup: "#3DD68C",
  crisis: "#ef4444",
};
const SESSION_LABELS: Record<SessionType, string> = {
  initial: "Initial",
  followup: "Follow-up",
  crisis: "Crisis",
};

function getWeekDays(anchor: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay()); // Sunday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8am–5pm

export function Schedule() {
  const { user } = useAuth();
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: "", sessionType: "followup" as SessionType, date: "", time: "10:00", notes: "" });
  const [saving, setSaving] = useState(false);

  const weekDays = getWeekDays(anchor);

  useEffect(() => {
    if (!user?.token) return;
    fetch("/api/v1/psychologist/appointments", { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json()).then((d) => setAppointments(d.appointments ?? []));
    fetch("/api/v1/psychologist/clients", { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json()).then((d) => setClients((d.clients ?? []).map((c: any) => ({ id: c.id, name: c.name }))));
  }, [user?.token]);

  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); };
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); };
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setAnchor(d); };

  const apptOnDay = (day: Date, hour: number) => {
    return appointments.filter((a) => {
      const dt = new Date(a.dateTime);
      return dt.toDateString() === day.toDateString() && dt.getHours() === hour;
    });
  };

  const handleSave = async () => {
    if (!form.clientId || !form.date) return;
    setSaving(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}:00`).toISOString();
      const res = await fetch("/api/v1/psychologist/appointments", {
        method: "POST",
        headers: { Authorization: `Bearer ${user!.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: form.clientId, sessionType: form.sessionType, dateTime, notes: form.notes }),
      });
      if (res.ok) {
        const appt = await res.json();
        setAppointments((prev) => [...prev, appt]);
        setShowModal(false);
        setForm({ clientId: "", sessionType: "followup", date: "", time: "10:00", notes: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dayLabel = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = (d: Date) => d.getDate();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={prevWeek} style={iconBtn}><ChevronLeft size={16} /></button>
          <button onClick={goToday} style={{ ...iconBtn, padding: "6px 14px", fontSize: 13, fontFamily: "Inter, sans-serif" }}>Today</button>
          <button onClick={nextWeek} style={iconBtn}><ChevronRight size={16} /></button>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginLeft: 8 }}>
            {fmt(weekDays[0])} – {fmt(weekDays[6])}
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, background: "#0a0a0a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
        >
          <Plus size={14} /> New appointment
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {(["initial", "followup", "crisis"] as SessionType[]).map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: SESSION_COLORS[t] }} />
            {SESSION_LABELS[t]}
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ padding: "10px 8px" }} />
          {weekDays.map((day) => (
            <div key={day.toISOString()} style={{ padding: "10px 8px", textAlign: "center", borderLeft: "1px solid var(--border)", background: isToday(day) ? "rgba(61,214,140,0.06)" : undefined }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{dayLabel(day)}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: isToday(day) ? "#3DD68C" : "var(--fg)", marginTop: 2 }}>{dayNum(day)}</div>
            </div>
          ))}
        </div>

        {/* Hour rows */}
        {HOURS.map((hour) => (
          <div key={hour} style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--border)", minHeight: 60 }}>
            <div style={{ padding: "8px 8px 0", fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
              {hour % 12 || 12}{hour < 12 ? "am" : "pm"}
            </div>
            {weekDays.map((day) => {
              const appts = apptOnDay(day, hour);
              return (
                <div key={day.toISOString()} style={{ borderLeft: "1px solid var(--border)", padding: 4, background: isToday(day) ? "rgba(61,214,140,0.03)" : undefined }}>
                  {appts.map((a) => (
                    <div
                      key={a.id}
                      title={`${a.clientName} — ${SESSION_LABELS[a.sessionType]}\n${a.notes}`}
                      style={{
                        background: SESSION_COLORS[a.sessionType] + "22",
                        borderLeft: `3px solid ${SESSION_COLORS[a.sessionType]}`,
                        borderRadius: 5,
                        padding: "4px 7px",
                        marginBottom: 3,
                        fontSize: 11,
                        color: SESSION_COLORS[a.sessionType],
                        fontWeight: 600,
                        cursor: "default",
                        lineHeight: 1.4,
                      }}
                    >
                      {a.clientName}
                      <span style={{ fontWeight: 400, opacity: 0.8 }}> · {SESSION_LABELS[a.sessionType]}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upcoming list */}
      {appointments.filter((a) => new Date(a.dateTime) > new Date()).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Upcoming appointments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {appointments
              .filter((a) => new Date(a.dateTime) > new Date())
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
              .slice(0, 5)
              .map((a) => {
                const dt = new Date(a.dateTime);
                const hoursUntil = Math.round((dt.getTime() - Date.now()) / 3600000);
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: SESSION_COLORS[a.sessionType], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{a.clientName}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{SESSION_LABELS[a.sessionType]} · {dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                    {hoursUntil <= 24 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", background: "#F59E0B22", padding: "3px 8px", borderRadius: 999 }}>
                        In {hoursUntil}h
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create appointment modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: 28, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)" }}>New appointment</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
            </div>

            {[
              { label: "Client", node: (
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} style={inputStyle}>
                  <option value="">Select a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )},
              { label: "Session type", node: (
                <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value as SessionType })} style={inputStyle}>
                  <option value="initial">Initial session</option>
                  <option value="followup">Follow-up</option>
                  <option value="crisis">Crisis session</option>
                </select>
              )},
              { label: "Date", node: <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} /> },
              { label: "Time", node: <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={inputStyle} /> },
              { label: "Notes (optional)", node: <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical" as const }} placeholder="Session notes…" /> },
            ].map(({ label, node }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                {node}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.clientId || !form.date} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: "#0a0a0a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: saving || !form.clientId || !form.date ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Create appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 7,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--muted)",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg2)",
  color: "var(--fg)",
  fontSize: 13,
  fontFamily: "Inter, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};
