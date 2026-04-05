import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = [
    {
        path: "/dashboard",
        label: "Dashboard",
        roles: ["OWNER", "MANAGER", "WAITER"],
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        path: "/floor",
        label: "Floor Map",
        roles: ["OWNER", "MANAGER", "WAITER"],
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        path: "/analytics",
        label: "Analytics",
        roles: ["OWNER", "MANAGER"],
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        path: "/users",
        label: "Staff",
        roles: ["OWNER"],
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user, isOwner, isOwnerOrManager, logout } = useAuth();
    const location = useLocation();

    const visibleItems = NAV_ITEMS.filter((item) =>
        item.roles.includes(user?.role)
    );

    const roleColor = {
        OWNER: { bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.25)" },
        MANAGER: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
        WAITER: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.25)" },
    }[user?.role] || {};

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-mark">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="8" fill="#f97316" fillOpacity="0.15" />
                        <rect x="6" y="6" width="8" height="8" rx="2" fill="#f97316" />
                        <rect x="18" y="6" width="8" height="8" rx="2" fill="#f97316" fillOpacity="0.5" />
                        <rect x="6" y="18" width="8" height="8" rx="2" fill="#f97316" fillOpacity="0.5" />
                        <rect x="18" y="18" width="8" height="8" rx="2" fill="#f97316" />
                    </svg>
                </div>
                {!collapsed && (
                    <div className="logo-text">
                        <span className="logo-name">Mud Cafe</span>
                        <span className="logo-tagline">Operations</span>
                    </div>
                )}
                <button className="collapse-btn" onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        {collapsed
                            ? <polyline points="9 18 15 12 9 6" />
                            : <polyline points="15 18 9 12 15 6" />
                        }
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {!collapsed && <span className="nav-section-label">Menu</span>}
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        title={collapsed ? item.label : ""}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span className="nav-label">{item.label}</span>}
                        {!collapsed && location.pathname === item.path && (
                            <span className="nav-active-dot" />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="sidebar-bottom">
                {/* User card */}
                <div className={`user-card ${collapsed ? "collapsed" : ""}`}>
                    <div className="user-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    {!collapsed && (
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span
                                className="user-role"
                                style={{
                                    background: roleColor.bg,
                                    color: roleColor.text,
                                    border: `1px solid ${roleColor.border}`,
                                }}
                            >
                                {user?.role}
                            </span>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    className={`logout-btn ${collapsed ? "collapsed" : ""}`}
                    onClick={logout}
                    title="Sign out"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>

            <style>{`
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: #0d0d0d;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          transition: width 0.25s ease;
          position: fixed;
          left: 0; top: 0; bottom: 0;
          z-index: 50;
          overflow: hidden;
        }
        .sidebar.collapsed { width: 68px; }

        /* Logo */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          min-height: 68px;
          position: relative;
        }
        .logo-mark { width: 32px; height: 32px; flex-shrink: 0; }
        .logo-mark svg { width: 100%; height: 100%; }
        .logo-text { flex: 1; overflow: hidden; }
        .logo-name {
          display: block;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          white-space: nowrap;
        }
        .logo-tagline {
          display: block;
          font-size: 10px;
          color: #525252;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 1px;
        }
        .collapse-btn {
          width: 24px; height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #737373;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .collapse-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .sidebar.collapsed .collapse-btn { margin: 0 auto; }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }
        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          color: #404040;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 8px;
          margin-bottom: 6px;
          display: block;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #737373;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
          position: relative;
          white-space: nowrap;
        }
        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 10px;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #d4d4d4; }
        .nav-item.active {
          background: rgba(249,115,22,0.1);
          color: #f97316;
          border: 1px solid rgba(249,115,22,0.15);
        }
        .nav-icon { display: flex; align-items: center; flex-shrink: 0; }
        .nav-label { flex: 1; }
        .nav-active-dot {
          width: 6px; height: 6px;
          background: #f97316;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Bottom */
        .sidebar-bottom {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .user-card.collapsed { justify-content: center; padding: 10px; }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Syne', sans-serif;
        }
        .user-info { flex: 1; overflow: hidden; }
        .user-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #d4d4d4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 999px;
          margin-top: 3px;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: transparent;
          color: #525252;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .logout-btn:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .logout-btn.collapsed { padding: 9px; }
      `}</style>
        </aside>
    );
}