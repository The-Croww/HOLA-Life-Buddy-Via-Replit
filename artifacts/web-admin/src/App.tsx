import React, { useState, createContext, useContext } from "react";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ClientProfile } from "./pages/ClientProfile";
import { Alerts } from "./pages/Alerts";
import { Analytics } from "./pages/Analytics";
import { Messaging } from "./pages/Messaging";
import { Reports } from "./pages/Reports";
import { Schedule } from "./pages/Schedule";
import { Sidebar } from "./components/Sidebar";

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

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");

  if (!user) {
    return (
      <AuthContext.Provider
        value={{ user, signIn: setUser, signOut: () => setUser(null) }}
      >
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
    <AuthContext.Provider
      value={{ user, signIn: setUser, signOut: () => setUser(null) }}
    >
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg2)" }}>
        <Sidebar
          currentPage={typeof page === "string" ? page : "dashboard"}
          onNavigate={setPage}
        />
        <main style={{ flex: 1, marginLeft: 220, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Top page header bar */}
          {page !== "messaging" && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "var(--bg)",
                borderBottom: "3px solid var(--border)",
                borderTop: "3px solid #3DD68C",
                padding: "14px 32px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {isClient && (
                <button
                  onClick={() => setPage("dashboard")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontFamily: "Inter, sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  ← Clients
                </button>
              )}
              {isClient && (
                <span style={{ fontSize: 13, color: "var(--border)" }}>/</span>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", lineHeight: 1.2 }}>
                  {meta.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {meta.subtitle}
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <div style={{ flex: 1 }}>
            {renderPage()}
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
