import React from "react";
import {
  LayoutDashboard,
  Bell,
  BarChart2,
  MessageCircle,
  LogOut,
  FileText,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { useAuth, Page } from "../App";
import logoImg from "../assets/logo.png";

const NAV_GROUPS = [
  {
    label: "Clients",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Clients" },
      { id: "alerts", icon: Bell, label: "Alerts" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "analytics", icon: BarChart2, label: "Analytics" },
      { id: "reports", icon: ClipboardList, label: "Reports" },
    ],
  },
  {
    label: "Practice",
    items: [
      { id: "schedule", icon: Calendar, label: "Schedule" },
      { id: "messaging", icon: MessageCircle, label: "Messages" },
    ],
  },
];

export function Sidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: string;
  onNavigate: (p: Page) => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <aside
      style={{
        width: 220,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "#111113",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: "18px 16px 16px",
          borderBottom: "1px solid #2a2a2e",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <img
          src={logoImg}
          alt="HOLA!"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: "contain",
            flexShrink: 0,
            background: "#fff",
          }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            HOLA!
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Clinician Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          gap: 4,
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "10px 10px 6px",
              }}
            >
              {group.label}
            </div>

            {group.items.map(({ id, icon: Icon, label }) => {
              const active = currentPage === id;

              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id as Page)}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#1e1e22";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active ? "#1e1e22" : "transparent",
                    color: active ? "#fff" : "#999",
                    border: "none",
                    borderLeft: active ? "2px solid #3DD68C" : "2px solid transparent",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "Inter, sans-serif",
                    marginBottom: 2,
                    transition: "all 0.1s ease",
                    textAlign: "left",
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {label}

                  {id === "alerts" && (
                    <span
                      style={{
                        marginLeft: "auto",
                        minWidth: 18,
                        height: 18,
                        borderRadius: 999,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                      }}
                    >
                      !
                    </span>
                  )}
                </button>
              );
            })}

            <div
              style={{
                height: 1,
                background: "#2a2a2e",
                margin: "8px 4px 2px",
              }}
            />
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #2a2a2e",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: "10px 12px",
            background: "#1a1a1e",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#3DD68C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#666",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Psychologist
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            background: "transparent",
            border: "1px solid #2a2a2e",
            cursor: "pointer",
            color: "#ef4444",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            transition: "all 0.12s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2a1515")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
