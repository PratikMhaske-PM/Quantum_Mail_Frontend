import { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "./Register.css";

/* ─────────────────────────────────────────────────────────────
   Particle intro canvas
───────────────────────────────────────────────────────────── */
function QuantumIntro({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    /* ── sample letter pixels ── */
    const offC = document.createElement("canvas");
    offC.width = W;
    offC.height = H;
    const offCtx = offC.getContext("2d");
    const fontSize = Math.min(W * 0.13, 88);
    offCtx.font = `700 ${fontSize}px 'Outfit', sans-serif`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "#fff";
    offCtx.fillText("QUANTUM", W / 2, H / 2);
    const { data: d } = offCtx.getImageData(0, 0, W, H);
    const points = [];
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 128) {
        const px = (i / 4) % W;
        const py = Math.floor(i / 4 / W);
        if (px % 5 === 0 && py % 5 === 0) points.push({ x: px, y: py });
      }
    }

    /* ── build particles ── */
    const particles = points.map((pt) => ({
      tx: pt.x,
      ty: pt.y,
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.7,
    }));
    const dissolveTargets = particles.map(() => ({
      x: (Math.random() - 0.5) * W * 1.6 + W / 2,
      y: (Math.random() - 0.5) * H * 1.4 + H / 2,
    }));

    const ease = (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const ASSEMBLE = 1800;
    const HOLD = 2200;
    const DISSOLVE = 1000;

    let phase = "assemble";
    let startTime = null;
    let rafId;
    let isDone = false;

    const tick = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W, H);

      if (phase === "assemble") {
        const p = ease(Math.min(elapsed / ASSEMBLE, 1));
        particles.forEach((pt) => {
          const cx = pt.x + (pt.tx - pt.x) * p;
          const cy = pt.y + (pt.ty - pt.y) * p;
          ctx.beginPath();
          ctx.arc(cx, cy, pt.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${Math.round(90 + p * 30)},${Math.round(
            130 + p * 20
          )},255,${0.3 + p * 0.65})`;
          ctx.fill();
        });
        if (elapsed >= ASSEMBLE) {
          phase = "hold";
          startTime = ts;
        }
      } else if (phase === "hold") {
        const pulse = 0.88 + Math.sin((elapsed / 1000) * Math.PI * 2) * 0.12;
        particles.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.tx, pt.ty, pt.r * pulse, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(110,155,255,0.92)";
          ctx.fill();
        });
        if (elapsed >= HOLD) {
          phase = "dissolve";
          startTime = ts;
        }
      } else if (phase === "dissolve") {
        const p = ease(Math.min(elapsed / DISSOLVE, 1));
        particles.forEach((pt, i) => {
          const tx2 = dissolveTargets[i].x;
          const ty2 = dissolveTargets[i].y;
          const cx = pt.tx + (tx2 - pt.tx) * p;
          const cy = pt.ty + (ty2 - pt.ty) * p;
          ctx.beginPath();
          ctx.arc(cx, cy, pt.r * (1 - p * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,140,255,${(1 - p) * 0.9})`;
          ctx.fill();
        });
        if (elapsed >= DISSOLVE && !isDone) {
          isDone = true;
          cancelAnimationFrame(rafId);
          onDone();
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onDone]);

  return <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />;
}

/* ─────────────────────────────────────────────────────────────
   Background canvas (floating particles + grid)
───────────────────────────────────────────────────────────── */
function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.4 + 0.1,
      blue: Math.random() < 0.5,
    }));

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      /* grid */
      ctx.strokeStyle = "rgba(100,130,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      /* wave line */
      ctx.beginPath();
      ctx.strokeStyle = "rgba(130,160,255,0.06)";
      ctx.lineWidth = 1.5;
      const now = Date.now() / 2000;
      for (let x = 0; x <= W; x += 4) {
        const y2 = H / 2 + Math.sin(x / 80 + now) * 18 + Math.sin(x / 40 + now * 1.3) * 10;
        x === 0 ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2);
      }
      ctx.stroke();
      /* particles */
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.blue
          ? `rgba(100,140,255,${p.a})`
          : `rgba(155,125,255,${p.a})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />;
}

/* ─────────────────────────────────────────────────────────────
   Register Page
───────────────────────────────────────────────────────────── */
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  const navigate = useNavigate();

  const handleIntroDone = () => {
    setIntroVisible(false);
    requestAnimationFrame(() => setFormVisible(true));
  };

  const handleRegister = async () => {
    setError("");
    if (!email || !password || !confirm) return setError("All fields are required");
    if (password !== confirm) return setError("Passwords do not match");

    try {
      setLoading(true);
      // ⚠️ TEMP FAKE KEYS (replace later with real PQC keys)
      const kyberKey = "kyber_public_key_example";
      const dilithiumKey = "dilithium_public_key_example";

      await API.post("/auth/register", {
        email,
        password,
        kyber_public_key: kyberKey,
        dilithium_public_key: dilithiumKey,
      });

      console.log("✅ Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      if (err.response?.data) console.log("❌ Backend Error:", err.response.data);
      setError("Registration failed. Check input or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Ambient orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      {/* Animated background */}
      <Background />

      {/* Particle intro */}
      {introVisible && <QuantumIntro onDone={handleIntroDone} />}

      {/* Register form */}
      <div className={`form-wrap ${formVisible ? "form-wrap--visible" : ""}`}>
        <div className="auth-card">
          {/* Brand */}
          <div className="auth-brand">
            <svg className="auth-logo" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="lg" x1="3" y1="2" x2="33" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6b8fff" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <polygon points="18,2 33,10.5 33,25.5 18,34 3,25.5 3,10.5" fill="url(#lg)" opacity=".12" />
              <polygon points="18,2 33,10.5 33,25.5 18,34 3,25.5 3,10.5" stroke="url(#lg)" strokeWidth="1.5" fill="none" />
              <polygon points="18,9 26,13.5 26,22.5 18,27 10,22.5 10,13.5" stroke="url(#lg)" strokeWidth="1" fill="none" opacity=".5" />
              <circle cx="18" cy="18" r="3" fill="url(#lg)" />
            </svg>
            <span className="auth-brand-name">QUANTUM MAIL</span>
          </div>

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Post-quantum encrypted from day one</p>

          <div className="auth-divider">
            <span>IDENTITY SETUP</span>
          </div>

          {/* Fields */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-email">Email address</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <input
                id="reg-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="8" cy="11" r="1" fill="currentColor" />
              </svg>
              <input
                id="reg-password"
                type="password"
                className="auth-input"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="reg-confirm"
                type="password"
                className="auth-input"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <button
            className={`auth-btn ${loading ? "auth-btn--loading" : ""}`}
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Generating keys…
              </>
            ) : (
              "Create secure account →"
            )}
          </button>

          <div className="auth-pqc-badge" aria-label="Kyber-1024 and Dilithium-3 encrypted">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1l4.33 2.5v5L6 11 1.67 8.5v-5L6 1z" stroke="currentColor" strokeWidth="1" />
            </svg>
            Kyber-1024 &amp; Dilithium-3 protected
          </div>

          <p className="auth-switch">
            Already have an account?{" "}
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate("/login")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}