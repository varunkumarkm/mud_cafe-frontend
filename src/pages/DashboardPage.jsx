import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTableStore } from "../store/tableStore";
import { useNotificationStore } from "../store/notificationStore";
import { useAuth } from "../hooks/useAuth";
import { getAllTables } from "../api/tableApi";
import { getRecentPaidBills } from "../api/billApi";
import { getDailySummary } from "../api/analyticsApi";
import { formatCurrency, formatRelative, formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const target = parseFloat(value) || 0;
        const duration = 800;
        const steps = 40;
        const step = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            setDisplay(current);
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value]);

    return (
        <span ref={ref}>
            {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}
        </span>
    );
}

function StatCard({ icon, label, value, sub, color, delay, prefix = "", suffix = "", decimals = 0 }) {
    return (
        <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
            <div className="stat-card-top">
                <div className="stat-icon-wrap" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <div className="stat-trend">
                    <span className="stat-label">{label}</span>
                </div>
            </div>
            <div className="stat-value" style={{ color }}>
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            </div>
            {sub && <div className="stat-sub">{sub}</div>}
            <div className="stat-glow" style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}18 0%, transparent 70%)` }} />
        </div>
    );
}

function MiniFloorMap({ tables, onTableClick }) {
    const STATUS_COLORS = {
        AVAILABLE: "#10b981",
        OCCUPIED: "#f59e0b",
        BILL_REQUESTED: "#f43f5e",
        PAID: "#3b82f6",
    };

    return (
        <div className="mini-map">
            <div className="mini-map-grid">
                {tables.map((table, i) => {
                    const color = STATUS_COLORS[table.status] || "#404040";
                    return (
                        <div
                            key={table.id}
                            className="mini-table"
                            style={{
                                borderColor: color,
                                background: `${color}12`,
                                animationDelay: `${i * 30}ms`,
                            }}
                            onClick={() => onTableClick(table)}
                            title={`${table.name} — ${table.status}`}
                        >
                            <div className="mini-table-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                            <span className="mini-table-name">{table.name.replace(/table\s*/i, "T")}</span>
                            <span className="mini-table-status" style={{ color }}>
                                {table.status === "BILL_REQUESTED" ? "Bill" :
                                    table.status === "AVAILABLE" ? "Free" :
                                        table.status === "OCCUPIED" ? "Occ" : "Paid"}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PaymentFeedItem({ bill, delay }) {
    const methodColors = { CASH: "#10b981", CARD: "#3b82f6", UPI: "#8b5cf6" };
    const methodIcons = { CASH: "💵", CARD: "💳", UPI: "📱" };
    const color = methodColors[bill.paymentMethod] || "#737373";

    return (
        <div className="feed-item" style={{ animationDelay: `${delay}ms` }}>
            <div className="feed-icon" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <span style={{ fontSize: "14px" }}>{methodIcons[bill.paymentMethod] || "💰"}</span>
            </div>
            <div className="feed-content">
                <div className="feed-top">
                    <span className="feed-table">{bill.tableName}</span>
                    <span className="feed-amount" style={{ color }}>{formatCurrency(bill.total)}</span>
                </div>
                <div className="feed-bottom">
                    <span className="feed-staff">{bill.staffName}</span>
                    <span className="feed-time">{formatRelative(bill.paidAt)}</span>
                </div>
            </div>
            <div className="feed-method" style={{ color, background: `${color}10`, border: `1px solid ${color}20` }}>
                {bill.paymentMethod}
            </div>
        </div>
    );
}

function OccupancyDonut({ occupied, total }) {
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const r = 36;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    return (
        <div className="donut-wrap">
            <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                    cx="48" cy="48" r={r}
                    fill="none" stroke="#f97316" strokeWidth="8"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                />
            </svg>
            <div className="donut-center">
                <span className="donut-pct">{pct}%</span>
                <span className="donut-label">Full</span>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, isOwnerOrManager } = useAuth();
    const { tables, setTables } = useTableStore();
    const { notifications, unreadCount } = useNotificationStore();

    const [summary, setSummary] = useState(null);
    const [recentBills, setRecentBills] = useState([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const hour = now.getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadAll = async () => {
        try {
            const [tablesRes, billsRes, summaryRes] = await Promise.all([
                getAllTables(),
                getRecentPaidBills(),
                isOwnerOrManager ? getDailySummary() : Promise.resolve(null),
            ]);
            setTables(tablesRes.data);
            setRecentBills(billsRes.data || []);
            if (summaryRes) setSummary(summaryRes.data);
        } catch {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Table stats
    const tableStats = {
        total: tables.length,
        available: tables.filter((t) => t.status === "AVAILABLE").length,
        occupied: tables.filter((t) => t.status === "OCCUPIED").length,
        billRequested: tables.filter((t) => t.status === "BILL_REQUESTED").length,
        paid: tables.filter((t) => t.status === "PAID").length,
    };

    const unread = unreadCount();

    return (
        <div className="dash-root">

            {/* ── Header ── */}
            <div className="dash-header">
                <div className="dash-greeting">
                    <p className="greeting-sub">{greeting},</p>
                    <h1 className="greeting-name">{user?.name} 👋</h1>
                    <p className="greeting-date">
                        {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                {unread > 0 && (
                    <div className="notif-alert">
                        <div className="notif-alert-dot" />
                        <span>{unread} new payment{unread > 1 ? "s" : ""} received</span>
                    </div>
                )}
            </div>

            {/* ── Summary stats (owner/manager only) ── */}
            {isOwnerOrManager && (
                <div className="stats-grid">
                    <StatCard
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        }
                        label="Today's Revenue"
                        value={summary?.totalRevenue || 0}
                        prefix="₹"
                        decimals={0}
                        sub="Total collected today"
                        color="#f97316"
                        delay={0}
                    />
                    <StatCard
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        }
                        label="Bills Closed"
                        value={summary?.totalBills || 0}
                        sub="Completed transactions"
                        color="#10b981"
                        delay={80}
                    />
                    <StatCard
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                        }
                        label="Avg Bill Value"
                        value={summary?.averageBillValue || 0}
                        prefix="₹"
                        decimals={0}
                        sub="Per closed bill"
                        color="#3b82f6"
                        delay={160}
                    />
                    <StatCard
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        }
                        label="Tables Occupied"
                        value={summary?.occupiedTables || tableStats.occupied}
                        suffix={`/${summary?.totalTables || tableStats.total}`}
                        sub="Currently in use"
                        color="#8b5cf6"
                        delay={240}
                    />
                </div>
            )}

            {/* ── Main content grid ── */}
            <div className="dash-grid">

                {/* Floor map panel */}
                <div className="dash-panel floor-panel">
                    <div className="panel-header">
                        <div className="panel-title-row">
                            <h2 className="panel-title">Live Floor</h2>
                            <div className="live-pill">
                                <span className="live-dot-anim" />
                                Live
                            </div>
                        </div>
                        <button className="panel-action-btn" onClick={() => navigate("/floor")}>
                            View Full Map →
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="floor-legend">
                        {[
                            { color: "#10b981", label: "Available", count: tableStats.available },
                            { color: "#f59e0b", label: "Occupied", count: tableStats.occupied },
                            { color: "#f43f5e", label: "Bill Req.", count: tableStats.billRequested },
                            { color: "#3b82f6", label: "Paid", count: tableStats.paid },
                        ].map((l) => (
                            <div key={l.label} className="legend-item">
                                <span className="legend-dot" style={{ background: l.color }} />
                                <span className="legend-label">{l.label}</span>
                                <span className="legend-count" style={{ color: l.color }}>{l.count}</span>
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="panel-skeleton-grid">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="mini-skeleton" style={{ animationDelay: `${i * 50}ms` }} />
                            ))}
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="panel-empty">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                            <span>No tables configured</span>
                            {isOwnerOrManager && (
                                <button className="panel-link-btn" onClick={() => navigate("/floor")}>
                                    Add tables →
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="floor-and-donut">
                            <MiniFloorMap
                                tables={tables}
                                onTableClick={() => navigate("/floor")}
                            />
                            <OccupancyDonut
                                occupied={tableStats.occupied + tableStats.billRequested}
                                total={tableStats.total}
                            />
                        </div>
                    )}
                </div>

                {/* Recent payments panel */}
                <div className="dash-panel feed-panel">
                    <div className="panel-header">
                        <div className="panel-title-row">
                            <h2 className="panel-title">Recent Payments</h2>
                            <span className="feed-count">{recentBills.length}</span>
                        </div>
                        {isOwnerOrManager && (
                            <button className="panel-action-btn" onClick={() => navigate("/analytics")}>
                                View Analytics →
                            </button>
                        )}
                    </div>

                    <div className="feed-list">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="feed-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
                            ))
                        ) : recentBills.length === 0 ? (
                            <div className="panel-empty">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                <span>No payments yet today</span>
                            </div>
                        ) : (
                            recentBills.map((bill, i) => (
                                <PaymentFeedItem key={bill.id} bill={bill} delay={i * 50} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Quick actions ── */}
            <div className="quick-actions">
                <h3 className="section-label">Quick Actions</h3>
                <div className="action-cards">
                    <div className="action-card" onClick={() => navigate("/floor")}>
                        <div className="action-icon" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <span className="action-label">Floor Map</span>
                        <span className="action-sub">Manage tables</span>
                    </div>

                    {isOwnerOrManager && (
                        <div className="action-card" onClick={() => navigate("/analytics")}>
                            <div className="action-icon" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                            </div>
                            <span className="action-label">Analytics</span>
                            <span className="action-sub">Sales reports</span>
                        </div>
                    )}

                    {user?.role === "OWNER" && (
                        <div className="action-card" onClick={() => navigate("/users")}>
                            <div className="action-icon" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <span className="action-label">Staff</span>
                            <span className="action-sub">Manage team</span>
                        </div>
                    )}

                    <div className="action-card refresh-card" onClick={loadAll}>
                        <div className="action-icon" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </div>
                        <span className="action-label">Refresh</span>
                        <span className="action-sub">Update data</span>
                    </div>
                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .dash-root {
          display: flex; flex-direction: column; gap: 24px;
          font-family: 'DM Sans', sans-serif;
          animation: fadeUp 0.4s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Header ── */
        .dash-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
        }
        .greeting-sub { font-size: 13px; color: #525252; font-weight: 500; }
        .greeting-name {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800; color: #fff;
          line-height: 1.1; margin: 4px 0;
        }
        .greeting-date { font-size: 12px; color: #404040; }
        .notif-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 12px;
          background: rgba(249,115,22,0.08);
          border: 1px solid rgba(249,115,22,0.2);
          color: #f97316; font-size: 13px; font-weight: 600;
        }
        .notif-alert-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #f97316;
          animation: ping 1.5s infinite;
        }
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .stat-card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 20px;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; overflow: hidden;
          animation: cardIn 0.5s ease forwards; opacity: 0;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card-top { display: flex; align-items: center; justify-content: space-between; }
        .stat-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-trend { text-align: right; }
        .stat-label { font-size: 12px; color: #525252; font-weight: 500; }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800; line-height: 1;
        }
        .stat-sub { font-size: 11px; color: #404040; }
        .stat-glow {
          position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
          pointer-events: none;
        }

        /* ── Main grid ── */
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 16px;
        }
        .dash-panel {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 22px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .panel-header {
          display: flex; align-items: center;
          justify-content: space-between;
        }
        .panel-title-row { display: flex; align-items: center; gap: 10px; }
        .panel-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #fff;
        }
        .live-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 999px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.15);
          color: #10b981; font-size: 11px; font-weight: 700;
        }
        .live-dot-anim {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10b981;
          animation: ping 2s infinite;
        }
        .panel-action-btn {
          font-size: 12px; color: #f97316; font-weight: 600;
          background: none; border: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .panel-action-btn:hover { opacity: 0.7; }
        .feed-count {
          padding: 2px 8px; border-radius: 999px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          color: #f97316; font-size: 11px; font-weight: 700;
        }

        /* Floor legend */
        .floor-legend {
          display: flex; gap: 16px; flex-wrap: wrap;
        }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { font-size: 12px; color: #737373; }
        .legend-count { font-size: 12px; font-weight: 700; }

        /* Floor + donut layout */
        .floor-and-donut {
          display: flex; align-items: flex-start; gap: 16px;
        }
        .mini-map { flex: 1; }
        .mini-map-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }
        .mini-table {
          border: 1px solid;
          border-radius: 10px; padding: 8px;
          display: flex; flex-direction: column;
          align-items: center; gap: 3px;
          cursor: pointer; transition: all 0.15s;
          animation: cardIn 0.4s ease forwards; opacity: 0;
        }
        .mini-table:hover { transform: scale(1.04); }
        .mini-table-dot { width: 7px; height: 7px; border-radius: 50%; }
        .mini-table-name { font-size: 11px; font-weight: 700; color: #d4d4d4; text-align: center; }
        .mini-table-status { font-size: 10px; font-weight: 600; }

        /* Donut */
        .donut-wrap {
          position: relative; width: 96px; height: 96px;
          flex-shrink: 0;
        }
        .donut-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .donut-pct {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 800; color: #f97316;
          line-height: 1;
        }
        .donut-label { font-size: 10px; color: #525252; margin-top: 2px; }

        /* Panel empty */
        .panel-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px; padding: 40px 16px;
          color: #404040; font-size: 13px;
        }
        .panel-link-btn {
          font-size: 12px; color: #f97316; font-weight: 600;
          background: none; border: none; cursor: pointer;
        }

        /* Skeletons */
        .panel-skeleton-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;
        }
        .mini-skeleton {
          height: 70px; border-radius: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Payment feed */
        .feed-list {
          display: flex; flex-direction: column; gap: 8px;
          max-height: 420px; overflow-y: auto;
        }
        .feed-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          animation: cardIn 0.4s ease forwards; opacity: 0;
          transition: background 0.15s;
        }
        .feed-item:hover { background: rgba(255,255,255,0.04); }
        .feed-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .feed-content { flex: 1; min-width: 0; }
        .feed-top {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
        }
        .feed-table { font-size: 13px; font-weight: 600; color: #d4d4d4; }
        .feed-amount { font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif; }
        .feed-bottom {
          display: flex; align-items: center;
          justify-content: space-between; margin-top: 3px;
        }
        .feed-staff { font-size: 11px; color: #525252; }
        .feed-time { font-size: 11px; color: #404040; }
        .feed-method {
          padding: 3px 8px; border-radius: 6px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.05em; flex-shrink: 0;
        }
        .feed-skeleton {
          height: 58px; border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        /* ── Quick actions ── */
        .section-label {
          font-size: 12px; font-weight: 700; color: #404040;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .action-cards {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .action-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 20px 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; cursor: pointer;
          transition: all 0.2s; min-width: 110px;
        }
        .action-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-3px);
        }
        .action-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .action-label {
          font-size: 13px; font-weight: 700; color: #d4d4d4;
          font-family: 'Syne', sans-serif;
        }
        .action-sub { font-size: 11px; color: #525252; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .greeting-name { font-size: 22px; }
          .floor-and-donut { flex-direction: column; }
        }
      `}</style>
        </div>
    );
}