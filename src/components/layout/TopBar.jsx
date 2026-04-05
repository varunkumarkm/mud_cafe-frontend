import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationStore } from "../../store/notificationStore";
import { getMyNotifications, markAsRead, markAllRead } from "../../api/notificationApi";
import { formatRelative } from "../../utils/formatDate";

const PAGE_TITLES = {
    "/dashboard": { title: "Dashboard", subtitle: "Overview of your restaurant" },
    "/floor": { title: "Floor Map", subtitle: "Live table status" },
    "/analytics": { title: "Analytics", subtitle: "Sales insights & reports" },
    "/users": { title: "Staff Management", subtitle: "Manage your team" },
};

export default function TopBar({ sidebarCollapsed }) {
    const location = useLocation();
    const { user, isOwnerOrManager } = useAuth();
    const { notifications, add, markRead, markAllRead: markAllReadStore, unreadCount } =
        useNotificationStore();

    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const count = unreadCount();

    const pageInfo = PAGE_TITLES[location.pathname] || { title: "Mud Cafe", subtitle: "" };

    // Load notifications on mount
    useEffect(() => {
        if (!isOwnerOrManager) return;
        getMyNotifications()
            .then((res) => res.data.forEach((n) => add(n)))
            .catch(() => { });
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            markAllReadStore();
        } catch { }
    };

    const handleMarkRead = async (id) => {
        try {
            await markAsRead(id);
            markRead(id);
        } catch { }
    };

    const methodColor = {
        CASH: "#10b981",
        CARD: "#3b82f6",
        UPI: "#8b5cf6",
    };

    return (
        <header
            className="topbar"
            style={{ left: sidebarCollapsed ? "68px" : "240px" }}
        >
            {/* Page title */}
            <div className="topbar-left">
                <div>
                    <h1 className="page-title">{pageInfo.title}</h1>
                    {pageInfo.subtitle && (
                        <p className="page-subtitle">{pageInfo.subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right actions */}
            <div className="topbar-right">
                {/* Live indicator */}
                <div className="live-badge">
                    <span className="live-dot" />
                    Live
                </div>

                {/* Notifications */}
                {isOwnerOrManager && (
                    <div className="notif-wrapper" ref={notifRef}>
                        <button
                            className={`notif-btn ${notifOpen ? "open" : ""}`}
                            onClick={() => setNotifOpen(!notifOpen)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {count > 0 && (
                                <span className="notif-badge">{count > 9 ? "9+" : count}</span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {notifOpen && (
                            <div className="notif-dropdown">
                                <div className="notif-header">
                                    <span className="notif-title">Notifications</span>
                                    {count > 0 && (
                                        <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="1.5">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                            </svg>
                                            <span>No notifications yet</span>
                                        </div>
                                    ) : (
                                        notifications.slice(0, 10).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`notif-item ${!n.read ? "unread" : ""}`}
                                                onClick={() => handleMarkRead(n.id)}
                                            >
                                                <div className="notif-icon-wrap">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                    </svg>
                                                </div>
                                                <div className="notif-content">
                                                    <p className="notif-msg">{n.message}</p>
                                                    <span className="notif-time">
                                                        {formatRelative(n.sentAt)}
                                                    </span>
                                                </div>
                                                {!n.read && <span className="unread-dot" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* User pill */}
                <div className="user-pill">
                    <div className="topbar-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="topbar-username">{user?.name}</span>
                </div>
            </div>

            <style>{`
        .topbar {
          position: fixed;
          top: 0; right: 0;
          height: 64px;
          background: rgba(8,8,8,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 40;
          transition: left 0.25s ease;
        }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .page-subtitle {
          font-size: 12px;
          color: #525252;
          margin-top: 2px;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Live badge */
        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.15);
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .live-dot {
          width: 6px; height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: livePulse 2s infinite;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        /* Notifications */
        .notif-wrapper { position: relative; }
        .notif-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #737373;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
        }
        .notif-btn:hover, .notif-btn.open {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.12);
        }
        .notif-badge {
          position: absolute;
          top: -5px; right: -5px;
          min-width: 18px; height: 18px;
          background: #f97316;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #080808;
        }

        /* Dropdown */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 340px;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          animation: dropDown 0.15s ease;
          z-index: 100;
        }
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .notif-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          font-family: 'Syne', sans-serif;
        }
        .mark-all-btn {
          font-size: 11px;
          color: #f97316;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .mark-all-btn:hover { background: rgba(249,115,22,0.1); }
        .notif-list { max-height: 320px; overflow-y: auto; }
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 32px;
          color: #404040;
          font-size: 13px;
        }
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          position: relative;
        }
        .notif-item:hover { background: rgba(255,255,255,0.03); }
        .notif-item.unread { background: rgba(249,115,22,0.03); }
        .notif-icon-wrap {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: rgba(249,115,22,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notif-content { flex: 1; min-width: 0; }
        .notif-msg {
          font-size: 13px;
          color: #d4d4d4;
          line-height: 1.5;
          margin-bottom: 3px;
        }
        .notif-time {
          font-size: 11px;
          color: #525252;
        }
        .unread-dot {
          width: 7px; height: 7px;
          background: #f97316;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        /* User pill */
        .user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .topbar-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
        }
        .topbar-username {
          font-size: 13px;
          font-weight: 600;
          color: #d4d4d4;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
        </header>
    );
}