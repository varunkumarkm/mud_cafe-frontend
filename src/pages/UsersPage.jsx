import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    getAllUsers,
    createUser,
    deactivateUser,
    activateUser,
} from "../api/userApi";
import { formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";

const ROLE_CONFIG = {
    OWNER: {
        color: "#f97316",
        bg: "rgba(249,115,22,0.1)",
        border: "rgba(249,115,22,0.2)",
        icon: "👑",
        desc: "Full access to all features",
    },
    MANAGER: {
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.1)",
        border: "rgba(59,130,246,0.2)",
        icon: "🏢",
        desc: "Billing, analytics & notifications",
    },
    WAITER: {
        color: "#10b981",
        bg: "rgba(16,185,129,0.1)",
        border: "rgba(16,185,129,0.2)",
        icon: "🍽️",
        desc: "Tables & billing only",
    },
};

function UserAvatar({ name, role, size = 44 }) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.WAITER;
    const initials = name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";

    return (
        <div
            style={{
                width: size, height: size, borderRadius: "12px",
                background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}10)`,
                border: `1.5px solid ${cfg.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif",
                fontSize: size * 0.36 + "px",
                fontWeight: 800, color: cfg.color,
                flexShrink: 0,
            }}
        >
            {initials}
        </div>
    );
}

function CreateUserModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "", email: "", password: "", role: "WAITER",
    });
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleCreate = async () => {
        if (!form.name || !form.email || !form.password) {
            toast.error("All fields are required");
            return;
        }
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setSaving(true);
        try {
            await createUser(form);
            toast.success(`${form.name} added as ${form.role}`);
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create user");
        } finally {
            setSaving(false);
        }
    };

    const cfg = ROLE_CONFIG[form.role];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">Add Staff Member</h3>
                        <p className="modal-sub">Create a new account for your team</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Role selector */}
                <div className="modal-section">
                    <label className="field-label">Role</label>
                    <div className="role-selector">
                        {Object.entries(ROLE_CONFIG).map(([role, c]) => (
                            <button
                                key={role}
                                className={`role-option ${form.role === role ? "active" : ""}`}
                                style={form.role === role ? {
                                    borderColor: c.border,
                                    background: c.bg,
                                } : {}}
                                onClick={() => setForm({ ...form, role })}
                            >
                                <span className="role-opt-icon">{c.icon}</span>
                                <span className="role-opt-name" style={form.role === role ? { color: c.color } : {}}>
                                    {role}
                                </span>
                                <span className="role-opt-desc">{c.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fields */}
                <div className="modal-body">
                    <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <div className="input-wrap">
                            <span className="input-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                className="field-input"
                                placeholder="e.g. Ravi Kumar"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Email Address</label>
                        <div className="input-wrap">
                            <span className="input-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                className="field-input"
                                placeholder="ravi@mudcafe.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <div className="input-wrap">
                            <span className="input-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                type={showPass ? "text" : "password"}
                                className="field-input"
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                            <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                                {showPass ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="create-btn"
                        onClick={handleCreate}
                        disabled={saving}
                        style={{ background: cfg.color }}
                    >
                        {saving ? (
                            <><span className="btn-spin" /> Creating...</>
                        ) : (
                            <>{cfg.icon} Add {form.role}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UserCard({ user: u, currentUser, onToggle, delay }) {
    const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.WAITER;
    const isSelf = u.email === currentUser?.email;
    const [toggling, setToggling] = useState(false);

    const handleToggle = async () => {
        if (isSelf) { toast.error("You cannot deactivate your own account"); return; }
        setToggling(true);
        try {
            if (u.active) {
                await deactivateUser(u.id);
                toast.success(`${u.name} deactivated`);
            } else {
                await activateUser(u.id);
                toast.success(`${u.name} reactivated`);
            }
            onToggle();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update user");
        } finally {
            setToggling(false);
        }
    };

    return (
        <div
            className={`user-card ${!u.active ? "inactive" : ""}`}
            style={{ animationDelay: `${delay}ms`, borderColor: u.active ? cfg.border : "rgba(255,255,255,0.04)" }}
        >
            {/* Top row */}
            <div className="uc-top">
                <UserAvatar name={u.name} role={u.role} size={44} />
                <div className="uc-info">
                    <div className="uc-name-row">
                        <span className="uc-name">{u.name}</span>
                        {isSelf && <span className="self-badge">You</span>}
                    </div>
                    <span className="uc-email">{u.email}</span>
                </div>
                <div
                    className="uc-status-dot"
                    title={u.active ? "Active" : "Deactivated"}
                    style={{ background: u.active ? "#10b981" : "#404040", boxShadow: u.active ? "0 0 6px #10b981" : "none" }}
                />
            </div>

            {/* Role badge */}
            <div className="uc-role-row">
                <span
                    className="uc-role-badge"
                    style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                    {cfg.icon} {u.role}
                </span>
                <span className="uc-role-desc">{cfg.desc}</span>
            </div>

            {/* Meta */}
            <div className="uc-meta">
                <span className="uc-meta-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    Joined {formatDate(u.createdAt)?.split(",")[0]}
                </span>
                <span className={`uc-active-label ${u.active ? "active" : "inactive"}`}>
                    {u.active ? "● Active" : "○ Inactive"}
                </span>
            </div>

            {/* Action */}
            {!isSelf && (
                <button
                    className={`uc-toggle-btn ${u.active ? "deactivate" : "activate"}`}
                    onClick={handleToggle}
                    disabled={toggling}
                >
                    {toggling ? (
                        <><span className="btn-spin small" /> Processing...</>
                    ) : u.active ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            Deactivate
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Reactivate
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            setUsers(res.data);
        } catch {
            toast.error("Failed to load staff");
        } finally {
            setLoading(false);
        }
    };

    // Filtered users
    const filtered = users.filter((u) => {
        const roleMatch = filterRole === "ALL" || u.role === filterRole;
        const statusMatch =
            filterStatus === "ALL" ||
            (filterStatus === "ACTIVE" && u.active) ||
            (filterStatus === "INACTIVE" && !u.active);
        const searchMatch =
            !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        return roleMatch && statusMatch && searchMatch;
    });

    const stats = {
        total: users.length,
        owners: users.filter((u) => u.role === "OWNER").length,
        managers: users.filter((u) => u.role === "MANAGER").length,
        waiters: users.filter((u) => u.role === "WAITER").length,
        active: users.filter((u) => u.active).length,
        inactive: users.filter((u) => !u.active).length,
    };

    return (
        <div className="users-root">

            {/* Header */}
            <div className="users-header">
                <div>
                    <h1 className="users-title">Staff Management</h1>
                    <p className="users-sub">
                        {stats.active} active · {stats.inactive} inactive · {stats.total} total
                    </p>
                </div>
                <button className="add-staff-btn" onClick={() => setShowCreate(true)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Staff
                </button>
            </div>

            {/* Role stat cards */}
            <div className="role-stats">
                {[
                    { role: "OWNER", count: stats.owners },
                    { role: "MANAGER", count: stats.managers },
                    { role: "WAITER", count: stats.waiters },
                ].map(({ role, count }) => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                        <div
                            key={role}
                            className={`role-stat-card ${filterRole === role ? "selected" : ""}`}
                            style={filterRole === role ? { borderColor: cfg.border, background: cfg.bg } : {}}
                            onClick={() => setFilterRole(filterRole === role ? "ALL" : role)}
                        >
                            <div className="rsc-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                <span style={{ fontSize: "18px" }}>{cfg.icon}</span>
                            </div>
                            <div>
                                <div className="rsc-count" style={{ color: filterRole === role ? cfg.color : "#fff" }}>
                                    {count}
                                </div>
                                <div className="rsc-label">{role}{count !== 1 ? "S" : ""}</div>
                            </div>
                            <div className="rsc-desc">{cfg.desc}</div>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="users-toolbar">
                {/* Search */}
                <div className="search-wrap">
                    <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className="search-input"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch("")}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Status filter */}
                <div className="status-pills">
                    {[
                        { value: "ALL", label: "All" },
                        { value: "ACTIVE", label: "Active" },
                        { value: "INACTIVE", label: "Inactive" },
                    ].map((s) => (
                        <button
                            key={s.value}
                            className={`status-pill ${filterStatus === s.value ? "active" : ""}`}
                            onClick={() => setFilterStatus(s.value)}
                        >
                            {s.value === "ACTIVE" && <span className="pill-dot active" />}
                            {s.value === "INACTIVE" && <span className="pill-dot inactive" />}
                            {s.label}
                        </button>
                    ))}
                </div>

                <span className="result-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* User grid */}
            {loading ? (
                <div className="users-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="user-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="users-empty">
                    <div className="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <p className="empty-title">No staff found</p>
                    <p className="empty-sub">
                        {search ? `No results for "${search}"` : "Try adjusting your filters"}
                    </p>
                    {!search && (
                        <button className="add-staff-btn" onClick={() => setShowCreate(true)}>
                            Add your first staff member
                        </button>
                    )}
                </div>
            ) : (
                <div className="users-grid">
                    {filtered.map((u, i) => (
                        <UserCard
                            key={u.id}
                            user={u}
                            currentUser={currentUser}
                            onToggle={loadUsers}
                            delay={i * 50}
                        />
                    ))}
                </div>
            )}

            {/* Create modal */}
            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreated={loadUsers}
                />
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .users-root {
          display: flex; flex-direction: column; gap: 20px;
          font-family: 'DM Sans', sans-serif;
          animation: fadeUp 0.4s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .users-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .users-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px; font-weight: 800; color: #fff;
          letter-spacing: -0.02em;
        }
        .users-sub { font-size: 13px; color: #525252; margin-top: 3px; }
        .add-staff-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 11px;
          border: none; background: #f97316; color: #fff;
          font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .add-staff-btn:hover { background: #ea580c; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.3); }

        /* Role stats */
        .role-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        .role-stat-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          cursor: pointer; transition: all 0.2s;
        }
        .role-stat-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .role-stat-card.selected { transform: translateY(-2px); }
        .rsc-icon {
          width: 42px; height: 42px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rsc-count {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800; line-height: 1;
          transition: color 0.2s;
        }
        .rsc-label {
          font-size: 11px; color: #525252; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 2px;
        }
        .rsc-desc {
          font-size: 11px; color: #404040;
          margin-top: 6px; line-height: 1.4;
          display: none;
        }

        /* Toolbar */
        .users-toolbar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .search-wrap {
          position: relative; flex: 1; min-width: 200px;
        }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: #525252;
          pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 9px 36px 9px 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; color: #fff;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border 0.15s;
        }
        .search-input:focus { border-color: rgba(249,115,22,0.3); }
        .search-input::placeholder { color: #404040; }
        .search-clear {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: #525252;
          cursor: pointer; display: flex; align-items: center;
          padding: 4px; border-radius: 4px;
          transition: color 0.15s;
        }
        .search-clear:hover { color: #fff; }
        .status-pills { display: flex; gap: 6px; }
        .status-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .status-pill:hover { border-color: rgba(255,255,255,0.15); color: #d4d4d4; }
        .status-pill.active {
          border-color: rgba(249,115,22,0.3);
          background: rgba(249,115,22,0.08);
          color: #f97316;
        }
        .pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }
        .pill-dot.active { background: #10b981; }
        .pill-dot.inactive { background: #404040; }
        .result-count { font-size: 12px; color: #404040; white-space: nowrap; }

        /* User grid */
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }

        /* User card */
        .user-card {
          background: #111;
          border: 1px solid;
          border-radius: 18px;
          padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          animation: cardIn 0.4s ease forwards; opacity: 0;
          transition: all 0.2s;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .user-card.inactive { opacity: 0.6; }
        .user-card.inactive:hover { opacity: 0.8; }

        .uc-top { display: flex; align-items: center; gap: 12px; }
        .uc-info { flex: 1; min-width: 0; }
        .uc-name-row { display: flex; align-items: center; gap: 8px; }
        .uc-name {
          font-size: 15px; font-weight: 700; color: #fff;
          font-family: 'Syne', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .self-badge {
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          color: #f97316; white-space: nowrap;
        }
        .uc-email {
          font-size: 12px; color: #525252;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          display: block; margin-top: 2px;
        }
        .uc-status-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0; transition: all 0.3s;
        }

        .uc-role-row { display: flex; flex-direction: column; gap: 4px; }
        .uc-role-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 8px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; width: fit-content;
        }
        .uc-role-desc { font-size: 11px; color: #404040; }

        .uc-meta { display: flex; align-items: center; justify-content: space-between; }
        .uc-meta-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #404040;
        }
        .uc-active-label {
          font-size: 11px; font-weight: 700;
        }
        .uc-active-label.active { color: #10b981; }
        .uc-active-label.inactive { color: #404040; }

        .uc-toggle-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 9px;
          border-radius: 10px; border: 1px solid;
          font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .uc-toggle-btn.deactivate {
          border-color: rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
          color: #ef4444;
        }
        .uc-toggle-btn.deactivate:hover {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.3);
        }
        .uc-toggle-btn.activate {
          border-color: rgba(16,185,129,0.2);
          background: rgba(16,185,129,0.06);
          color: #10b981;
        }
        .uc-toggle-btn.activate:hover {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
        }
        .uc-toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Skeleton */
        .user-skeleton {
          height: 220px; border-radius: 18px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Empty */
        .users-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px; padding: 80px 16px; text-align: center;
        }
        .empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700; color: #525252;
        }
        .empty-sub { font-size: 13px; color: #404040; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          z-index: 300;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal {
          width: 100%; max-width: 480px;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          overflow: hidden;
          animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
          padding: 22px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 700; color: #fff;
        }
        .modal-sub { font-size: 12px; color: #525252; margin-top: 3px; }
        .close-btn {
          width: 30px; height: 30px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #737373; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .close-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

        .modal-section { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .field-label {
          font-size: 11px; font-weight: 700; color: #525252;
          text-transform: uppercase; letter-spacing: 0.08em;
          display: block; margin-bottom: 10px;
        }
        .role-selector { display: flex; flex-direction: column; gap: 8px; }
        .role-option {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          cursor: pointer; transition: all 0.15s; text-align: left;
          width: 100%;
        }
        .role-option:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }
        .role-opt-icon { font-size: 16px; flex-shrink: 0; }
        .role-opt-name {
          font-size: 13px; font-weight: 700; color: #d4d4d4;
          min-width: 70px; transition: color 0.15s;
        }
        .role-opt-desc { font-size: 11px; color: #525252; flex: 1; }

        .modal-body { padding: 18px 24px; display: flex; flex-direction: column; gap: 14px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute; left: 12px; color: #525252;
          display: flex; align-items: center; pointer-events: none;
        }
        .field-input {
          width: 100%; padding: 11px 14px 11px 38px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; color: #fff;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border 0.15s;
        }
        .field-input:focus { border-color: rgba(249,115,22,0.4); background: rgba(249,115,22,0.03); }
        .field-input::placeholder { color: #404040; }
        .toggle-pass {
          position: absolute; right: 12px;
          background: none; border: none; color: #525252;
          cursor: pointer; display: flex; align-items: center;
          padding: 4px; border-radius: 4px; transition: color 0.15s;
        }
        .toggle-pass:hover { color: #a3a3a3; }

        .modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .cancel-btn {
          padding: 10px 20px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .cancel-btn:hover { color: #fff; border-color: rgba(255,255,255,0.15); }
        .create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 10px;
          border: none; color: #fff;
          font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .create-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .create-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner */
        .btn-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .btn-spin.small { width: 12px; height: 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 768px) {
          .role-stats { grid-template-columns: 1fr; }
          .users-grid { grid-template-columns: 1fr; }
          .users-toolbar { flex-direction: column; align-items: stretch; }
        }
      `}</style>
        </div>
    );
}