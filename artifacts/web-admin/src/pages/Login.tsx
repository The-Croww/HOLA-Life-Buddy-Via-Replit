import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../App";
import logoImg from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL ?? "";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      if (data.user.role !== "psychologist" && data.user.role !== "admin") {
        setError("This portal is for psychologists only.");
        return;
      }
      signIn({ ...data.user, token: data.token });
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#fafafa",
      }}
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <img
              src={logoImg}
              alt="HOLA!"
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "#0d0d0d" }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d0d", letterSpacing: "-0.02em", lineHeight: 1 }}>
                HOLA!
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Clinician Portal</div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0d0d0d",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: 8,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>
              Sign in to your clinician dashboard
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 13,
                marginBottom: 20,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#444",
                  marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}
              >
                Email
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  color: "#0d0d0d",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box" as const,
                  letterSpacing: "-0.01em",
                }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d0d0d")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#444",
                  marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={{
                    width: "100%",
                    padding: "11px 42px 11px 14px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    background: "#fff",
                    color: "#0d0d0d",
                    fontSize: 14,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box" as const,
                    letterSpacing: "-0.01em",
                  }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0d0d0d")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#aaa",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              background: "#0d0d0d",
              color: "#ffffff",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              marginTop: 20,
              letterSpacing: "-0.01em",
              opacity: loading || !email || !password ? 0.5 : 1,
            }}
            onClick={handleLogin}
            disabled={loading || !email || !password}
            onMouseEnter={(e) => {
              if (!loading && email && password) e.currentTarget.style.background = "#1a1a1a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0d0d0d";
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p
            style={{
              fontSize: 12,
              color: "#999",
              textAlign: "center",
              marginTop: 24,
              lineHeight: 1.5,
            }}
          >
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div
        style={{
          width: 480,
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>💚</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Supporting mental
            <br />
            wellness, together
          </div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            Track client wellbeing, review mood patterns, and provide better care — all from one place.
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 40,
              textAlign: "left",
            }}
          >
            {[
              { icon: "📊", label: "Real-time mood insights" },
              { icon: "🔔", label: "Automated risk alerts" },
              { icon: "💬", label: "Secure client messaging" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "#141414",
                  border: "1px solid #1f1f1f",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: "#888", letterSpacing: "-0.01em" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
