import React from "react";
import {
  LayoutDashboard,
  Bell,
  BarChart2,
  MessageCircle,
  LogOut,
  Calendar,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { useAuth, Page } from "../App";
import logoImg from "../assets/logo.png";

const NAV_GROUPS = [
  {
    label: "Clients",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Client Roster" },
      { id: "alerts", icon: Bell, label: "Risk Alerts" },
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
  alertCount = 0,
}: {
  currentPage: string;
  onNavigate: (p: Page) => void;
  alertCount?: number;
}) {
  const { user, signOut } = useAuth();

  return (
    <aside
      style={{
        width: 240,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1c1c1c",
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "18px 16px 16px",
          borderBottom: "1px solid #1c1c1c",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "#3DD68C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={logoImg}
            alt="HOLA!"
            style={{ width: 22, height: 22, objectFit: "contain" }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
            }}
          >
            HOLA!
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 1, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
            Clinician Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          gap: 2,
        }}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: "#2e2e2e",
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                padding: "8px 10px 4px",
              }}
            >
              {group.label}
            </div>

            {group.items.map(({ id, icon: Icon, label }) => {
              const active = currentPage === id;
              const isAlerts = id === "alerts";
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id as Page)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active ? "#1a1a1a" : "transparent",
                    color: active ? "#ffffff" : "#4a4a4a",
                    border: active ? "1px solid #2a2a2a" : "1px solid transparent",
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    fontFamily: "inherit",
                    marginBottom: 1,
                    textAlign: "left" as const,
                    letterSpacing: "-0.01em",
                    transition: "all 0.1s ease",
                    position: "relative" as const,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#141414";
                      e.currentTarget.style.color = "#c0c0c0";
                      e.currentTarget.style.borderColor = "#1f1f1f";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#4a4a4a";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  <Icon
                    size={14}
                    strokeWidth={active ? 2.2 : 1.8}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{label}</span>

                  {isAlerts && alertCount > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9999,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                        lineHeight: 1,
                      }}
                    >
                      {alertCount > 99 ? "99+" : alertCount}
                    </span>
                  )}

                  {active && (
                    <ChevronRight size={12} style={{ opacity: 0.4 }} />
                  )}
                </button>
              );
            })}

            {gi < NAV_GROUPS.length - 1 && (
              <div
                style={{
                  height: 1,
                  background: "#161616",
                  margin: "8px 6px 4px",
                }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div
        style={{
          padding: "10px",
          borderTop: "1px solid #1c1c1c",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: "10px 12px",
            background: "#111",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3DD68C, #22c073)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#0a0a0a",
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#d0d0d0",
                whiteSpace: "nowrap" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: 10.5, color: "#3DD68C", marginTop: 1, letterSpacing: "0.02em" }}>
              Psychologist
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            background: "transparent",
            border: "1px solid #1f1f1f",
            cursor: "pointer",
            color: "#555",
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
            transition: "all 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1a0a0a";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderColor = "#3a1212";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#555";
            e.currentTarget.style.borderColor = "#1f1f1f";
          }}
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
