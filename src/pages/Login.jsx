import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("Email");
  const [password, setPassword] = useState("Password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      return setError("Please enter email and password");
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      const token = res.data.access_token;
      if (!token) throw new Error("No token");
      localStorage.setItem("token", token);
      onLogin();
      navigate("/chat");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Server error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      <div className="auth-container">
        {/* Logo / Brand */}
        <div className="brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M14 2L14 26M2 8L26 20M26 8L2 20" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
              <circle cx="14" cy="14" r="3" fill="currentColor"/>
            </svg>
          </div>
          <span className="brand-name">Quantum Mail</span>
        </div>

        {/* Card */}
        <form className="auth-card" onSubmit={handleLogin} noValidate>
          <div className="card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your encrypted workspace</p>
          </div>

          <div className="fields">
            {/* Email field */}
            <div className={`field-group ${focused === "email" ? "focused" : ""} ${email ? "has-value" : ""}`}>
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M1 5.5L8 10L15 5.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    if (email === "Email") setEmail("");
                    setFocused("email");
                  }}
                  onBlur={() => {
                    if (email === "") setEmail("Email");
                    setFocused(null);
                  }}
                  autoComplete="email"
                  className={email === "Email" ? "placeholder-style" : ""}
                />
              </div>
            </div>

            {/* Password field */}
            <div className={`field-group ${focused === "password" ? "focused" : ""} ${password ? "has-value" : ""}`}>
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="11" r="1" fill="currentColor"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type={focused === "password" || (password !== "Password" && password !== "") ? "password" : "text"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    if (password === "Password") setPassword("");
                    setFocused("password");
                  }}
                  onBlur={() => {
                    if (password === "") setPassword("Password");
                    setFocused(null);
                  }}
                  autoComplete="current-password"
                  className={password === "Password" ? "placeholder-style" : ""}
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="auth-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4v3.5M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={`auth-btn ${loading ? "loading" : ""}`} disabled={loading}>
            <span className="btn-text">{loading ? "Authenticating…" : "Sign in"}</span>
            {loading ? (
              <span className="spinner" />
            ) : (
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="auth-divider">
            <span>New to Quantum Mail?</span>
          </div>

          <button
            type="button"
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </form>

        <p className="auth-footer">
          End-to-end encrypted · created by Kunal Deore
        </p>
      </div>
    </div>
  );
}