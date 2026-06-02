import React, { useState, createContext, useContext, useEffect } from "react";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ClientProfile } from "./pages/ClientProfile";
import { Alerts } from "./pages/Alerts";
import { Analytics } from "./pages/Analytics";
import { Messaging } from "./pages/Messaging";
import { Reports } from "./pages/Reports";
import { Schedule } from "./pages/Schedule";
import { Sidebar } from "./components/Sidebar";

const STORAGE_KEY = "hola_admin_session";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  token: string;
}
interface AuthCtx {
  user: AuthUser | null;
  signIn: (u: AuthUser) => void;
  signOut: () => void;
}
export const AuthContext = createContext<AuthCtx>({
  user: null,
  signIn: () => {},
  signOut: () => {},
});
export const useAuth = () => useContext(AuthContext);

export type Page =
  | "dashboard"
  | "alerts"
  | "analytics"
  | "messaging"
  | "reports"
  | "schedule"
  | { type: "client"; id: string; name: string };

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Client Roster", subtitle: "Monitor your clients' mental wellness" },
  alerts: { title: "Risk Alerts", subtitle: "Real-time client safety notifications" },
  analytics: { title: "Analytics", subtitle: "Practice-wide wellness insights" },
  messaging: { title: "Messages", subtitle: "Secure client communication" },
  reports: { title: "Reports", subtitle: "Weekly summaries and client progress reports" },
  schedule: { title: "Schedule", subtitle: "Manage sessions and appointments" },
};

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [page, setPage] = useState<Page>("dashboard");

  const signIn = (u: AuthUser) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    setUser(u);
    setPage("dashboard");
  };

  const signOut = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setUser(null);
  };

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, signIn, signOut }}>
        <Login />
      </AuthContext.Provider>
    );
  }

  const isClient = typeof page === "object" && page.type === "client";
  const pageKey = isClient ? "dashboard" : (page as string);
  const meta = isClient
    ? { title: (page as any).name, subtitle: "Client profile" }
    : PAGE_META[pageKey] ?? { title: pageKey, subtitle: "" };

  const renderPage = () => {
    if (isClient) {
      return (
        <ClientProfile
          clientId={(page as any).id}
          clientName={(page as any).name}
          onBack={() => setPage("dashboard")}
        />
      );
    }
    switch (page) {
      case "alerts":
        return (
          <Alerts
            onViewClient={(id, name) => setPage({ type: "client", id, name })}
          />
        );
      case "analytics":
        return <Analytics />;
      case "messaging":
        return <Messaging />;
      case "reports":
        return <Reports onViewClient={(id, name) => setPage({ type: "client", id, name })} />;
      case "schedule":
        return <Schedule />;
      default:
        return (
          <Dashboard
            onViewClient={(id, name) => setPage({ type: "client", id, name })}
          />
        );
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg2)" }}>
        <Sidebar
          currentPage={typeof page === "string" ? page : "dashboard"}
          onNavigate={setPage}
        />
        <main
          style={{
            flex: 1,
            marginLeft: 232,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top page header bar */}
          {page !== "messaging" && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
                padding: "0 32px",
                display: "flex",
                alignItems: "center",
                height: 56,
                gap: 12,
              }}
            >
              {isClient && (
                <button
                  onClick={() => setPage("dashboard")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    color: "var(--muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px 8px",
                    borderRadius: 6,
                    fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg3)";
                    e.currentTarget.style.color = "var(--fg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "var(--muted)";
                  }}
                >
                  ← Clients
                </button>
              )}
              {isClient && (
                <span style={{ fontSize: 13, color: "var(--border)" }}>/</span>
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--fg)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                  }}
                >
                  {meta.title}
                </div>
                {meta.subtitle && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                    {meta.subtitle}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page content */}
          <div style={{ flex: 1 }}>{renderPage()}</div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
