import React from "react";
import {
  LayoutDashboard,
  Bell,
  BarChart2,
  MessageCircle,
  LogOut,
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
        width: 232,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1a1a1a",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid #1f1f1f",
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
            width: 32,
            height: 32,
            borderRadius: 8,
            objectFit: "contain",
            flexShrink: 0,
            background: "#fff",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            HOLA!
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            Clinician Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#333",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "8px 8px 5px",
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active ? "#1a1a1a" : "transparent",
                    color: active ? "#ffffff" : "#565656",
                    border: "none",
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    fontFamily: "inherit",
                    marginBottom: 1,
                    textAlign: "left",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#161616";
                      e.currentTarget.style.color = "#c0c0c0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#565656";
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>

                  {id === "alerts" && (
                    <span
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 9999,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}
                    >
                      !
                    </span>
                  )}
                </button>
              );
            })}

            {gi < NAV_GROUPS.length - 1 && (
              <div
                style={{
                  height: 1,
                  background: "#1a1a1a",
                  margin: "10px 4px 6px",
                }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: "10px 12px",
            background: "#141414",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#3DD68C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#0d0d0d",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#e0e0e0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>
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
            color: "#ef4444",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#1a0a0a")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
