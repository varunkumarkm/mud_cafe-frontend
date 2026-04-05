import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            const res = await loginApi(form);
            const { token, name, email, role } = res.data;
            login({ name, email, role }, token);
            toast.success(`Welcome back, ${name}!`);
            navigate("/dashboard");
        } catch (err) {
            const msg =
                err.response?.data?.message || "Login failed. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            {/* Ambient background */}
            <div className="ambient-bg">
                <div className="ambient-orb orb-1" />
                <div className="ambient-orb orb-2" />
                <div className="ambient-orb orb-3" />
                <div className="grid-overlay" />
            </div>

            {/* Left panel - Branding */}
            <div className="brand-panel">
                <div className="brand-content">
                    <div className="brand-badge">
                        <span className="badge-dot" />
                        Restaurant Management System
                    </div>

                    <div className="brand-logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 12C8 9.79 9.79 8 12 8H36C38.21 8 40 9.79 40 12V36C40 38.21 38.21 40 36 40H12C9.79 40 8 38.21 8 36V12Z" fill="#f97316" fillOpacity="0.15" stroke="#f97316" strokeWidth="1.5" />
                                <path d="M16 20C16 17.79 17.79 16 20 16H28C30.21 16 32 17.79 32 20V28C32 30.21 30.21 32 28 32H20C17.79 32 16 30.21 16 28V20Z" fill="#f97316" fillOpacity="0.3" />
                                <circle cx="24" cy="24" r="4" fill="#f97316" />
                                <path d="M24 8V16M24 32V40M8 24H16M32 24H40" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="brand-name">Mud Cup</h1>
                            <p className="brand-sub">Billing & Operations</p>
                        </div>
                    </div>

                    <div className="brand-desc">
                        <p>Manage your tables, track payments, and grow your business — all in one place.</p>
                    </div>

                    <div className="feature-list">
                        {[
                            { icon: "⚡", text: "Real-time table tracking" },
                            { icon: "🔔", text: "Instant payment alerts" },
                            { icon: "📊", text: "Smart sales analytics" },
                            { icon: "👥", text: "Role-based staff access" },
                        ].map((f, i) => (
                            <div className="feature-item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                                <span className="feature-icon">{f.icon}</span>
                                <span>{f.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="brand-footer">
                        <div className="stat-pills">
                            <div className="stat-pill">
                                <span className="stat-num">100+</span>
                                <span className="stat-label">Tables</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-pill">
                                <span className="stat-num">3</span>
                                <span className="stat-label">Roles</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-pill">
                                <span className="stat-num">99.5%</span>
                                <span className="stat-label">Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel - Login form */}
            <div className="form-panel">
                <div className="form-card">
                    {/* Header */}
                    <div className="form-header">
                        <div className="form-tag">Staff Portal</div>
                        <h2 className="form-title">Sign in to your account</h2>
                        <p className="form-subtitle">Enter your credentials to continue</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Email */}
                        <div className={`field-group ${focused === "email" ? "focused" : ""} ${form.email ? "has-value" : ""}`}>
                            <label className="field-label">Email address</label>
                            <div className="field-wrapper">
                                <span className="field-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocused("email")}
                                    onBlur={() => setFocused("")}
                                    placeholder="you@mudcafe.com"
                                    className="field-input"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={`field-group ${focused === "password" ? "focused" : ""} ${form.password ? "has-value" : ""}`}>
                            <label className="field-label">Password</label>
                            <div className="field-wrapper">
                                <span className="field-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused("")}
                                    placeholder="••••••••"
                                    className="field-input"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Role hint */}
                        <div className="role-hints">
                            <span className="role-hint-label">Login as:</span>
                            {["OWNER", "MANAGER", "WAITER"].map((role) => (
                                <span className="role-badge" key={role}>{role}</span>
                            ))}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className={`submit-btn ${loading ? "loading" : ""}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-loader">
                                    <span className="spinner" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="btn-content">
                                    Sign In
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p className="form-note">
                        Contact your administrator if you don't have an account.
                    </p>
                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          background: #080808;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── Ambient Background ── */
        .ambient-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: #f97316;
          top: -200px; left: -100px;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: #ea580c;
          bottom: -100px; left: 30%;
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: #f97316;
          top: 40%; right: 10%;
          animation: orbFloat 12s ease-in-out infinite;
          opacity: 0.06;
        }
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Brand Panel ── */
        .brand-panel {
          width: 45%;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          padding: 3rem;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .brand-content {
          width: 100%;
          max-width: 420px;
          animation: slideUp 0.7s ease forwards;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          color: #f97316;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2.5rem;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #f97316;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .logo-icon {
          width: 56px; height: 56px;
          flex-shrink: 0;
        }
        .logo-icon svg { width: 100%; height: 100%; }
        .brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .brand-sub {
          font-size: 13px;
          color: #737373;
          margin-top: 3px;
          font-weight: 500;
        }
        .brand-desc {
          margin-bottom: 2rem;
        }
        .brand-desc p {
          color: #a3a3a3;
          font-size: 15px;
          line-height: 1.7;
        }
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 3rem;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d4d4d4;
          font-size: 14px;
          font-weight: 500;
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .feature-icon {
          width: 32px; height: 32px;
          background: rgba(249,115,22,0.08);
          border: 1px solid rgba(249,115,22,0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .brand-footer { margin-top: auto; }
        .stat-pills {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
        }
        .stat-pill { text-align: center; }
        .stat-num {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #f97316;
        }
        .stat-label {
          font-size: 11px;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.06);
        }

        /* ── Form Panel ── */
        .form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 2rem;
        }
        .form-card {
          width: 100%;
          max-width: 420px;
          animation: slideUp 0.6s ease 0.1s forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .form-header { margin-bottom: 2.5rem; }
        .form-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #f97316;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        .form-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.5rem;
        }
        .form-subtitle {
          color: #737373;
          font-size: 14px;
        }

        /* ── Form Fields ── */
        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .field-group { display: flex; flex-direction: column; gap: 8px; }
        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #a3a3a3;
          transition: color 0.2s;
        }
        .field-group.focused .field-label { color: #f97316; }
        .field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          color: #525252;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          pointer-events: none;
        }
        .field-group.focused .field-icon { color: #f97316; }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 13px 14px 13px 42px;
          color: #fff;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .field-input::placeholder { color: #525252; }
        .field-input:focus {
          border-color: rgba(249,115,22,0.4);
          background: rgba(249,115,22,0.05);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
        }
        .toggle-password {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .toggle-password:hover { color: #a3a3a3; }

        /* ── Role Hints ── */
        .role-hints {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .role-hint-label {
          font-size: 12px;
          color: #525252;
          font-weight: 500;
        }
        .role-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(249,115,22,0.2);
          color: #f97316;
          background: rgba(249,115,22,0.06);
        }

        /* ── Submit Button ── */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          pointer-events: none;
        }
        .submit-btn:hover:not(:disabled) {
          background: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(249,115,22,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        /* ── Form Note ── */
        .form-note {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 12px;
          color: #525252;
          line-height: 1.6;
        }

        /* ── Animations ── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .brand-panel {
            width: 100%;
            padding: 2rem;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.04);
          }
          .brand-content { max-width: 100%; }
          .feature-list { display: none; }
          .stat-pills { justify-content: center; }
          .brand-name { font-size: 2rem; }
          .form-panel { padding: 2rem; }
        }
      `}</style>
        </div>
    );
}