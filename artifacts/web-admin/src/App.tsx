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
import { Bell, Search, ChevronRight } from "lucide-react";

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

function Header({
  page,
  onNavigate,
  alertCount,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  alertCount: number;
}) {
  const { user } = useAuth();
  const isClient = typeof page === "object" && page.type === "client";
  const pageKey = isClient ? "dashboard" : (page as string);
  const meta = isClient
    ? { title: (page as any).name, subtitle: "Client profile" }
    : PAGE_META[pageKey] ?? { title: pageKey, subtitle: "" };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        height: 54,
        gap: 0,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        {isClient && (
          <>
            <button
              onClick={() => onNavigate("dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 6,
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.background = "var(--bg3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              Clients
            </button>
            <ChevronRight size={13} color="var(--border2)" />
          </>
        )}
        <div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg)",
              letterSpacing: "-0.02em",
            }}
          >
            {meta.title}
          </span>
          {meta.subtitle && (
            <span
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginLeft: 10,
                letterSpacing: "-0.01em",
              }}
            >
              {meta.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Notification bell */}
        <button
          onClick={() => onNavigate("alerts")}
          title="Risk Alerts"
          style={{
            position: "relative",
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "none",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            transition: "all 0.1s",
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
          <Bell size={15} />
          {alertCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--alert)",
                border: "1.5px solid var(--bg)",
              }}
            />
          )}
        </button>

        {/* User avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3DD68C, #22c073)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#0a0a0a",
            flexShrink: 0,
            marginLeft: 4,
            cursor: "default",
          }}
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [page, setPage] = useState<Page>("dashboard");
  const [alertCount, setAlertCount] = useState(0);

  const signIn = (u: AuthUser) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    setUser(u);
    setPage("dashboard");
  };

  const signOut = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setUser(null);
  };

  useEffect(() => {
    if (!user?.token) return;
    fetch("/api/v1/psychologist/alerts", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.alerts) {
          setAlertCount(data.alerts.filter((a: any) => !a.reviewed).length);
        }
      })
      .catch(() => {});
  }, [user?.token]);

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, signIn, signOut }}>
        <Login />
      </AuthContext.Provider>
    );
  }

  const isMessaging = page === "messaging";

  const renderPage = () => {
    const isClient = typeof page === "object" && page.type === "client";
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
          alertCount={alertCount}
        />
        <main
          style={{
            flex: 1,
            marginLeft: 240,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!isMessaging && (
            <Header
              page={page}
              onNavigate={setPage}
              alertCount={alertCount}
            />
          )}
          <div style={{ flex: 1 }}>{renderPage()}</div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
