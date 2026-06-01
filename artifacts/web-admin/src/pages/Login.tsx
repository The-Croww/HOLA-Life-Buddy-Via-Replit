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
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Logo */}
        <img src={logoImg} alt="HOLA! Logo" style={styles.logoImg} />

        <div style={styles.heading}>HOLA!</div>
        <div style={styles.sub}>Clinician Portal</div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Email */}
        <div style={styles.inputWrap}>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* Password with eye toggle */}
        <div style={{ ...styles.inputWrap, position: "relative" }}>
          <input
            style={{ ...styles.input, paddingRight: 44 }}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          style={{
            ...styles.btn,
            opacity: loading || !email || !password ? 0.6 : 1,
          }}
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.hint}>Don't have an account? Ask your admin.</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    background: "#ffffff",
    width: 360,
    padding: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoImg: {
    width: 96,
    height: 96,
    objectFit: "contain",
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0a0a0a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 32,
  },
  inputWrap: {
    width: "100%",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #dbdbdb",
    background: "#fafafa",
    color: "#0a0a0a",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    background: "#0a0a0a",
    color: "#ffffff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    marginTop: 8,
    transition: "opacity 0.2s",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#dbdbdb",
  },
  dividerText: {
    fontSize: 12,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  hint: {
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
  },
};
