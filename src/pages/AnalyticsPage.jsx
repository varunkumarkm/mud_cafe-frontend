import { useState, useEffect } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { getDailySummary, getRevenue, getTopItems } from "../api/analyticsApi";
import { formatCurrency } from "../utils/formatDate";
import toast from "react-hot-toast";

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
};

const PRESETS = [
    { label: "Today", from: today(), to: today() },
    { label: "7 Days", from: daysAgo(6), to: today() },
    { label: "30 Days", from: daysAgo(29), to: today() },
    { label: "90 Days", from: daysAgo(89), to: today() },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <p style={{ color: "#737373", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color, fontSize: "14px", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                    {p.name === "revenue" ? formatCurrency(p.value) : p.value}
                </p>
            ))}
        </div>
    );
};

function SummaryPill({ label, value, color, icon }) {
    return (
        <div className="summary-pill">
            <div className="pill-icon" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                {icon}
            </div>
            <div>
                <div className="pill-value" style={{ color }}>{value}</div>
                <div className="pill-label">{label}</div>
            </div>
        </div>
    );
}

const exportCSV = (data, filename) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
};

const exportJSON = (data, filename) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("JSON exported");
};

export default function AnalyticsPage() {
    const [activePreset, setActivePreset] = useState(1); 
    const [from, setFrom] = useState(PRESETS[1].from);
    const [to, setTo] = useState(PRESETS[1].to);
    const [customMode, setCustomMode] = useState(false);

    const [summary, setSummary] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState("area"); 

    useEffect(() => {
        loadData();
    }, [from, to]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sumRes, revRes, topRes] = await Promise.all([
                getDailySummary(),
                getRevenue(from, to),
                getTopItems(from, to),
            ]);
            setSummary(sumRes.data);
            
            const formatted = (revRes.data || []).map((d) => ({
                date: d.date?.slice(5) || d.date, 
                revenue: Number(d.revenue) || 0,
                bills: Number(d.billCount) || 0,
                fullDate: d.date,
            }));
            setRevenueData(formatted);
            setTopItems(topRes.data || []);
        } catch {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handlePreset = (i) => {
        setActivePreset(i);
        setCustomMode(false);
        setFrom(PRESETS[i].from);
        setTo(PRESETS[i].to);
    };

    const handleCustomApply = () => {
        if (from > to) { toast.error("From date must be before To date"); return; }
        setActivePreset(-1);
        loadData();
    };

    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
    const totalBills = revenueData.reduce((s, d) => s + d.bills, 0);
    const avgBill = totalBills > 0 ? totalRevenue / totalBills : 0;
    const peakDay = revenueData.reduce((max, d) => d.revenue > (max?.revenue || 0) ? d : max, null);
    const maxItemRevenue = topItems[0]?.totalRevenue || 1;

    const ITEM_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

    return (
        <div className="analytics-root">

            {/* ── Top bar ── */}
            <div className="analytics-topbar">
                <div>
                    <h1 className="analytics-title">Sales Analytics</h1>
                    <p className="analytics-sub">Track revenue, trends, and top performers</p>
                </div>
                <div className="export-group">
                    <button className="export-btn" onClick={() => exportCSV(revenueData.map(d => ({ date: d.fullDate, revenue: d.revenue, bills: d.bills })), `revenue-${from}-${to}`)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                    </button>
                    <button className="export-btn" onClick={() => exportJSON(topItems, `top-items-${from}-${to}`)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Export JSON
                    </button>
                </div>
            </div>

            {/* ── Date filters ── */}
            <div className="filter-bar">
                <div className="preset-pills">
                    {PRESETS.map((p, i) => (
                        <button
                            key={i}
                            className={`preset-pill ${activePreset === i ? "active" : ""}`}
                            onClick={() => handlePreset(i)}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        className={`preset-pill ${customMode ? "active" : ""}`}
                        onClick={() => setCustomMode(!customMode)}
                    >
                        Custom
                    </button>
                </div>
                {customMode && (
                    <div className="custom-date-row">
                        <div className="date-field">
                            <label className="date-label">From</label>
                            <input
                                type="date"
                                className="date-input"
                                value={from}
                                max={to}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>
                        <div className="date-field">
                            <label className="date-label">To</label>
                            <input
                                type="date"
                                className="date-input"
                                value={to}
                                min={from}
                                max={today()}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                        <button className="apply-btn" onClick={handleCustomApply}>Apply</button>
                    </div>
                )}
            </div>

            {/* ── Summary pills ── */}
            <div className="summary-strip">
                <SummaryPill
                    label="Total Revenue"
                    value={loading ? "—" : formatCurrency(totalRevenue)}
                    color="#f97316"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                />
                <SummaryPill
                    label="Total Bills"
                    value={loading ? "—" : totalBills.toString()}
                    color="#10b981"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
                />
                <SummaryPill
                    label="Avg Bill Value"
                    value={loading ? "—" : formatCurrency(avgBill)}
                    color="#3b82f6"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
                />
                <SummaryPill
                    label="Peak Day"
                    value={loading ? "—" : (peakDay ? peakDay.date : "N/A")}
                    color="#8b5cf6"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                />
                <SummaryPill
                    label="Today's Revenue"
                    value={loading ? "—" : formatCurrency(summary?.totalRevenue)}
                    color="#f59e0b"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
            </div>

            {/* ── Revenue chart ── */}
            <div className="chart-panel">
                <div className="chart-header">
                    <div>
                        <h2 className="chart-title">Revenue Over Time</h2>
                        <p className="chart-sub">{from} → {to}</p>
                    </div>
                    <div className="chart-type-toggle">
                        <button
                            className={`type-btn ${chartType === "area" ? "active" : ""}`}
                            onClick={() => setChartType("area")}
                            title="Area chart"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </button>
                        <button
                            className={`type-btn ${chartType === "bar" ? "active" : ""}`}
                            onClick={() => setChartType("bar")}
                            title="Bar chart"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="chart-skeleton" />
                ) : revenueData.length === 0 ? (
                    <div className="chart-empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        <p>No revenue data for this period</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        {chartType === "area" ? (
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#f97316" }} />
                            </AreaChart>
                        ) : (
                            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" name="revenue" radius={[4, 4, 0, 0]}>
                                    {revenueData.map((_, i) => (
                                        <Cell key={i} fill={`rgba(249,115,22,${0.4 + (i / revenueData.length) * 0.6})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Bills count chart ── */}
            <div className="chart-panel">
                <div className="chart-header">
                    <div>
                        <h2 className="chart-title">Daily Bill Count</h2>
                        <p className="chart-sub">Number of transactions per day</p>
                    </div>
                </div>
                {loading ? (
                    <div className="chart-skeleton" />
                ) : revenueData.length === 0 ? (
                    <div className="chart-empty">
                        <p>No bill data for this period</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="bills" name="bills" radius={[4, 4, 0, 0]}>
                                {revenueData.map((_, i) => (
                                    <Cell key={i} fill={`rgba(59,130,246,${0.4 + (i / revenueData.length) * 0.5})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Top items ── */}
            <div className="chart-panel">
                <div className="chart-header">
                    <div>
                        <h2 className="chart-title">Top Selling Items</h2>
                        <p className="chart-sub">Ranked by quantity sold in period</p>
                    </div>
                    <button className="export-btn small" onClick={() => exportCSV(topItems.map(i => ({ item: i.itemName, qty: i.totalQuantity, revenue: i.totalRevenue })), `top-items-${from}-${to}`)}>
                        Export
                    </button>
                </div>

                {loading ? (
                    <div className="items-skeleton">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="item-skel" style={{ animationDelay: `${i * 60}ms` }} />
                        ))}
                    </div>
                ) : topItems.length === 0 ? (
                    <div className="chart-empty">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        </svg>
                        <p>No item data for this period</p>
                    </div>
                ) : (
                    <div className="top-items-list">
                        {topItems.slice(0, 10).map((item, i) => {
                            const pct = Math.round((item.totalRevenue / maxItemRevenue) * 100);
                            const color = ITEM_COLORS[i % ITEM_COLORS.length];
                            return (
                                <div key={i} className="top-item-row" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="item-rank" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
                                        {i + 1}
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name-row">
                                            <span className="item-nm">{item.itemName}</span>
                                            <span className="item-rev" style={{ color }}>{formatCurrency(item.totalRevenue)}</span>
                                        </div>
                                        <div className="item-bar-wrap">
                                            <div
                                                className="item-bar-fill"
                                                style={{ width: `${pct}%`, background: color }}
                                            />
                                        </div>
                                        <div className="item-qty">{item.totalQuantity} sold</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Revenue data table ── */}
            {revenueData.length > 0 && (
                <div className="chart-panel">
                    <div className="chart-header">
                        <h2 className="chart-title">Detailed Breakdown</h2>
                        <button className="export-btn small" onClick={() => exportCSV(revenueData.map(d => ({ date: d.fullDate, revenue: d.revenue, bills: d.bills })), `breakdown-${from}-${to}`)}>
                            Export CSV
                        </button>
                    </div>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Revenue</th>
                                    <th>Bills</th>
                                    <th>Avg/Bill</th>
                                    <th>Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueData.map((d, i) => {
                                    const avg = d.bills > 0 ? d.revenue / d.bills : 0;
                                    const share = totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
                                    return (
                                        <tr key={i}>
                                            <td className="date-cell">{d.fullDate || d.date}</td>
                                            <td className="revenue-cell">{formatCurrency(d.revenue)}</td>
                                            <td>{d.bills}</td>
                                            <td>{formatCurrency(avg)}</td>
                                            <td>
                                                <div className="share-cell">
                                                    <div className="share-bar" style={{ width: `${share}%` }} />
                                                    <span>{share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="total-row">
                                    <td>Total</td>
                                    <td>{formatCurrency(totalRevenue)}</td>
                                    <td>{totalBills}</td>
                                    <td>{formatCurrency(avgBill)}</td>
                                    <td>100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .analytics-root {
          display: flex; flex-direction: column; gap: 20px;
          font-family: 'DM Sans', sans-serif;
          animation: fadeUp 0.4s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Topbar */
        .analytics-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .analytics-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px; font-weight: 800; color: #fff;
          letter-spacing: -0.02em;
        }
        .analytics-sub { font-size: 13px; color: #525252; margin-top: 3px; }
        .export-group { display: flex; gap: 8px; }
        .export-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #a3a3a3; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .export-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .export-btn.small { padding: 6px 12px; }

        /* Filter */
        .filter-bar { display: flex; flex-direction: column; gap: 12px; }
        .preset-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .preset-pill {
          padding: 7px 16px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .preset-pill:hover { border-color: rgba(255,255,255,0.15); color: #d4d4d4; }
        .preset-pill.active {
          border-color: rgba(249,115,22,0.4);
          background: rgba(249,115,22,0.1);
          color: #f97316;
        }
        .custom-date-row {
          display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap;
          padding: 14px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }
        .date-field { display: flex; flex-direction: column; gap: 5px; }
        .date-label { font-size: 11px; font-weight: 600; color: #525252; }
        .date-input {
          padding: 8px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff; font-size: 13px;
          outline: none; transition: border 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .date-input:focus { border-color: rgba(249,115,22,0.4); }
        .apply-btn {
          padding: 9px 18px; border-radius: 8px;
          border: none; background: #f97316; color: #fff;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .apply-btn:hover { background: #ea580c; }

        /* Summary strip */
        .summary-strip {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .summary-pill {
          display: flex; align-items: center; gap: 12px;
          flex: 1; min-width: 160px;
          padding: 14px 18px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          animation: cardIn 0.4s ease forwards; opacity: 0;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pill-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pill-value {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 700; line-height: 1;
        }
        .pill-label { font-size: 11px; color: #525252; margin-top: 3px; }

        /* Chart panel */
        .chart-panel {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          padding: 22px;
          display: flex; flex-direction: column; gap: 18px;
        }
        .chart-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
        }
        .chart-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #fff;
        }
        .chart-sub { font-size: 12px; color: #525252; margin-top: 2px; }
        .chart-type-toggle { display: flex; gap: 4px; }
        .type-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .type-btn.active {
          background: rgba(249,115,22,0.1);
          border-color: rgba(249,115,22,0.3);
          color: #f97316;
        }
        .chart-skeleton {
          height: 280px; border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .chart-empty {
          height: 200px; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px; color: #404040; font-size: 13px;
        }

        /* Top items */
        .items-skeleton { display: flex; flex-direction: column; gap: 10px; }
        .item-skel {
          height: 52px; border-radius: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .top-items-list { display: flex; flex-direction: column; gap: 10px; }
        .top-item-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          animation: cardIn 0.4s ease forwards; opacity: 0;
          transition: background 0.15s;
        }
        .top-item-row:hover { background: rgba(255,255,255,0.04); }
        .item-rank {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
          font-family: 'Syne', sans-serif; flex-shrink: 0;
        }
        .item-info { flex: 1; }
        .item-name-row {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 6px;
        }
        .item-nm { font-size: 14px; font-weight: 600; color: #d4d4d4; }
        .item-rev { font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif; }
        .item-bar-wrap {
          height: 4px; background: rgba(255,255,255,0.06);
          border-radius: 999px; overflow: hidden; margin-bottom: 5px;
        }
        .item-bar-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.8s ease;
          opacity: 0.7;
        }
        .item-qty { font-size: 11px; color: #525252; }

        /* Data table */
        .data-table-wrap { overflow-x: auto; }
        .data-table {
          width: 100%; border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          text-align: left; padding: 10px 14px;
          font-size: 11px; font-weight: 700; color: #525252;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .data-table td {
          padding: 12px 14px; color: #a3a3a3;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .data-table tr:hover td { background: rgba(255,255,255,0.02); }
        .date-cell { color: #d4d4d4; font-weight: 500; }
        .revenue-cell { color: #f97316; font-weight: 700; font-family: 'Syne', sans-serif; }
        .share-cell { display: flex; align-items: center; gap: 8px; }
        .share-bar {
          height: 4px; background: #f97316;
          border-radius: 999px; min-width: 2px;
          max-width: 60px; opacity: 0.6;
          transition: width 0.5s ease;
        }
        .total-row td {
          font-weight: 700; color: #fff;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: none;
        }
        .total-row td:first-child { font-family: 'Syne', sans-serif; color: #f97316; }

        /* Responsive */
        @media (max-width: 768px) {
          .summary-strip { flex-direction: column; }
          .summary-pill { min-width: unset; }
          .analytics-topbar { flex-direction: column; }
        }
      `}</style>
        </div>
    );
}