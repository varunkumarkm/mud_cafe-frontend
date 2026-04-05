import { useState, useEffect } from "react";
import { useTableStore } from "../store/tableStore";
import { useAuth } from "../hooks/useAuth";
import {
    getAllTables,
    createTable,
    updateTable,
    deleteTable,
    updateTableStatus,
} from "../api/tableApi";
import {
    createBill,
    getBillByTable,
    addItem,
    removeItem,
    markAsPaid,
    applyDiscount,
} from "../api/billApi";
import { formatCurrency } from "../utils/formatDate";
import toast from "react-hot-toast";

// ── Status config ─────────────────────────────────────────────────
const STATUS = {
    AVAILABLE: { label: "Available", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    OCCUPIED: { label: "Occupied", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    BILL_REQUESTED: { label: "Bill Requested", color: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)" },
    PAID: { label: "Paid", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
};

// ── Table Card ────────────────────────────────────────────────────
function TableCard({ table, onSelect, onStatusChange, onDelete, isOwnerOrManager, delay }) {
    const s = STATUS[table.status] || STATUS.AVAILABLE;

    return (
        <div
            className="table-card"
            style={{ animationDelay: `${delay}ms`, borderColor: s.border, background: s.bg }}
            onClick={() => onSelect(table)}
        >
            {/* Status dot */}
            <div className="card-status-row">
                <span className="status-dot" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                <span className="status-label" style={{ color: s.color }}>{s.label}</span>
                {isOwnerOrManager && (
                    <button
                        className="card-menu-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete(table); }}
                        title="Delete table"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Table name */}
            <div className="card-name">{table.name}</div>

            {/* Info row */}
            <div className="card-info-row">
                <span className="card-info-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                    {table.capacity}
                </span>
                {table.floor && (
                    <span className="card-info-item">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                        {table.floor}
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                {table.status === "AVAILABLE" && (
                    <button
                        className="card-action-btn primary"
                        onClick={() => onStatusChange(table, "OCCUPIED")}
                    >
                        Seat Guests
                    </button>
                )}
                {table.status === "OCCUPIED" && (
                    <button
                        className="card-action-btn warning"
                        onClick={() => onSelect(table)}
                    >
                        Open Bill
                    </button>
                )}
                {table.status === "BILL_REQUESTED" && (
                    <button
                        className="card-action-btn danger"
                        onClick={() => onSelect(table)}
                    >
                        Process Bill
                    </button>
                )}
                {table.status === "PAID" && (
                    <button
                        className="card-action-btn success"
                        onClick={() => onStatusChange(table, "AVAILABLE")}
                    >
                        Clear Table
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Bill Drawer ───────────────────────────────────────────────────
function BillDrawer({ table, onClose, onPaid }) {
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingItem, setAddingItem] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [discountOpen, setDiscountOpen] = useState(false);
    const [newItem, setNewItem] = useState({ itemName: "", quantity: 1, unitPrice: "" });
    const [discount, setDiscount] = useState({ type: "PERCENTAGE", value: "" });
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadOrCreateBill();
    }, [table.id]);

    const loadOrCreateBill = async () => {
        setLoading(true);
        try {
            const res = await getBillByTable(table.id);
            setBill(res.data);
        } catch {
            // No open bill — create one
            try {
                const res = await createBill({ tableId: table.id });
                setBill(res.data);
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to create bill");
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.itemName || !newItem.unitPrice || !newItem.quantity) {
            toast.error("Fill in all item fields");
            return;
        }
        try {
            const res = await addItem(bill.id, {
                itemName: newItem.itemName,
                quantity: Number(newItem.quantity),
                unitPrice: Number(newItem.unitPrice),
            });
            setBill(res.data);
            setNewItem({ itemName: "", quantity: 1, unitPrice: "" });
            setAddingItem(false);
            toast.success("Item added");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add item");
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            const res = await removeItem(bill.id, itemId);
            setBill(res.data);
            toast.success("Item removed");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove item");
        }
    };

    const handleApplyDiscount = async () => {
        if (!discount.value) { toast.error("Enter discount value"); return; }
        try {
            const res = await applyDiscount(bill.id, {
                type: discount.type,
                value: Number(discount.value),
            });
            setBill(res.data);
            setDiscountOpen(false);
            toast.success("Discount applied");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to apply discount");
        }
    };

    const handleMarkPaid = async () => {
        setProcessing(true);
        try {
            const res = await markAsPaid(bill.id, { paymentMethod });
            setBill(res.data);
            toast.success(`Payment received via ${paymentMethod}`);
            onPaid();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process payment");
        } finally {
            setProcessing(false);
        }
    };

    const methodColors = { CASH: "#10b981", CARD: "#3b82f6", UPI: "#8b5cf6" };

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="drawer-header">
                    <div>
                        <h2 className="drawer-title">{table.name}</h2>
                        <p className="drawer-subtitle">
                            {bill ? `Bill #${bill.id} · ${bill.staffName}` : "Loading..."}
                        </p>
                    </div>
                    <button className="drawer-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="drawer-loading">
                        <div className="drawer-spinner" />
                        <span>Setting up bill...</span>
                    </div>
                ) : (
                    <>
                        {/* Items list */}
                        <div className="drawer-section">
                            <div className="section-header">
                                <span className="section-title">Order Items</span>
                                <button className="add-item-btn" onClick={() => setAddingItem(!addingItem)}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add Item
                                </button>
                            </div>

                            {/* Add item form */}
                            {addingItem && (
                                <div className="add-item-form">
                                    <input
                                        className="item-input"
                                        placeholder="Item name"
                                        value={newItem.itemName}
                                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                                    />
                                    <div className="item-input-row">
                                        <input
                                            className="item-input small"
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                        />
                                        <input
                                            className="item-input"
                                            type="number"
                                            placeholder="Unit price (₹)"
                                            value={newItem.unitPrice}
                                            onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="item-btn-row">
                                        <button className="item-cancel-btn" onClick={() => setAddingItem(false)}>Cancel</button>
                                        <button className="item-save-btn" onClick={handleAddItem}>Add to Bill</button>
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <div className="items-list">
                                {(!bill?.items || bill.items.length === 0) ? (
                                    <div className="empty-items">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                            <line x1="3" y1="6" x2="21" y2="6" />
                                        </svg>
                                        <span>No items yet. Add items above.</span>
                                    </div>
                                ) : (
                                    bill.items.map((item) => (
                                        <div key={item.id} className="item-row">
                                            <div className="item-details">
                                                <span className="item-name">{item.itemName}</span>
                                                <span className="item-meta">
                                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                                </span>
                                            </div>
                                            <div className="item-right">
                                                <span className="item-total">{formatCurrency(item.lineTotal)}</span>
                                                <button
                                                    className="item-remove-btn"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Bill summary */}
                        <div className="drawer-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(bill?.subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>GST (5%)</span>
                                <span>{formatCurrency(bill?.tax)}</span>
                            </div>
                            {bill?.discount > 0 && (
                                <div className="summary-row discount">
                                    <span>Discount</span>
                                    <span>− {formatCurrency(bill?.discount)}</span>
                                </div>
                            )}
                            <div className="summary-divider" />
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>{formatCurrency(bill?.total)}</span>
                            </div>
                        </div>

                        {/* Discount section */}
                        <div className="drawer-discount">
                            <button
                                className="discount-toggle"
                                onClick={() => setDiscountOpen(!discountOpen)}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                </svg>
                                {discountOpen ? "Cancel Discount" : "Apply Discount"}
                            </button>
                            {discountOpen && (
                                <div className="discount-form">
                                    <div className="discount-type-row">
                                        {["PERCENTAGE", "FIXED"].map((t) => (
                                            <button
                                                key={t}
                                                className={`discount-type-btn ${discount.type === t ? "active" : ""}`}
                                                onClick={() => setDiscount({ ...discount, type: t })}
                                            >
                                                {t === "PERCENTAGE" ? "%" : "₹"} {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="discount-input-row">
                                        <input
                                            className="item-input"
                                            type="number"
                                            placeholder={discount.type === "PERCENTAGE" ? "e.g. 10 for 10%" : "e.g. 50 for ₹50"}
                                            value={discount.value}
                                            onChange={(e) => setDiscount({ ...discount, value: e.target.value })}
                                        />
                                        <button className="item-save-btn" onClick={handleApplyDiscount}>Apply</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment section */}
                        <div className="drawer-payment">
                            <p className="payment-label">Payment Method</p>
                            <div className="payment-methods">
                                {["CASH", "CARD", "UPI"].map((method) => (
                                    <button
                                        key={method}
                                        className={`method-btn ${paymentMethod === method ? "active" : ""}`}
                                        style={paymentMethod === method ? {
                                            borderColor: methodColors[method],
                                            color: methodColors[method],
                                            background: `${methodColors[method]}15`,
                                        } : {}}
                                        onClick={() => setPaymentMethod(method)}
                                    >
                                        {method === "CASH" && "💵"}
                                        {method === "CARD" && "💳"}
                                        {method === "UPI" && "📱"}
                                        {method}
                                    </button>
                                ))}
                            </div>
                            <button
                                className={`pay-btn ${processing ? "loading" : ""}`}
                                onClick={handleMarkPaid}
                                disabled={processing || !bill?.items?.length}
                            >
                                {processing ? (
                                    <><span className="btn-spin" /> Processing...</>
                                ) : (
                                    <>Mark as Paid · {formatCurrency(bill?.total)}</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
        /* ── Drawer styles ── */
        .drawer-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
        }
        .drawer {
          width: 420px;
          max-width: 95vw;
          height: 100vh;
          background: #0f0f0f;
          border-left: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: slideInRight 0.25s ease;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .drawer-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .drawer-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 700;
          color: #fff;
        }
        .drawer-subtitle { font-size: 12px; color: #525252; margin-top: 3px; }
        .drawer-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #737373; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .drawer-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .drawer-loading {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; color: #525252; font-size: 13px;
        }
        .drawer-spinner {
          width: 24px; height: 24px;
          border: 2px solid rgba(255,255,255,0.08);
          border-top-color: #f97316;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .drawer-section { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .section-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 14px;
        }
        .section-title { font-size: 13px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.06em; }
        .add-item-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px;
          border: 1px solid rgba(249,115,22,0.25);
          background: rgba(249,115,22,0.08);
          color: #f97316; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .add-item-btn:hover { background: rgba(249,115,22,0.15); }
        .add-item-form {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 14px;
          margin-bottom: 14px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .item-input {
          width: 100%; padding: 9px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; color: #fff;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border 0.15s;
        }
        .item-input:focus { border-color: rgba(249,115,22,0.4); }
        .item-input.small { width: 80px; }
        .item-input-row { display: flex; gap: 8px; }
        .item-btn-row { display: flex; gap: 8px; justify-content: flex-end; }
        .item-cancel-btn {
          padding: 7px 14px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .item-cancel-btn:hover { color: #fff; }
        .item-save-btn {
          padding: 7px 14px; border-radius: 8px;
          border: none; background: #f97316; color: #fff;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .item-save-btn:hover { background: #ea580c; }
        .items-list { display: flex; flex-direction: column; gap: 8px; }
        .empty-items {
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          padding: 24px; color: #404040; font-size: 13px;
        }
        .item-row {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .item-details { flex: 1; }
        .item-name { display: block; font-size: 14px; font-weight: 500; color: #d4d4d4; }
        .item-meta { font-size: 12px; color: #525252; margin-top: 2px; display: block; }
        .item-right { display: flex; align-items: center; gap: 10px; }
        .item-total { font-size: 14px; font-weight: 600; color: #fff; font-family: 'Syne', sans-serif; }
        .item-remove-btn {
          width: 22px; height: 22px; border-radius: 6px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.08);
          color: #ef4444; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .item-remove-btn:hover { background: rgba(239,68,68,0.2); }
        .drawer-summary { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .summary-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: #737373; margin-bottom: 8px;
        }
        .summary-row.discount { color: #10b981; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 0; font-family: 'Syne', sans-serif; }
        .summary-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 10px 0; }
        .drawer-discount { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .discount-toggle {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #737373;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .discount-toggle:hover { color: #f97316; }
        .discount-form { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .discount-type-row { display: flex; gap: 8px; }
        .discount-type-btn {
          flex: 1; padding: 7px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .discount-type-btn.active {
          border-color: rgba(249,115,22,0.4);
          background: rgba(249,115,22,0.1);
          color: #f97316;
        }
        .discount-input-row { display: flex; gap: 8px; align-items: center; }
        .drawer-payment { padding: 20px 24px; flex-shrink: 0; }
        .payment-label { font-size: 12px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
        .payment-methods { display: flex; gap: 8px; margin-bottom: 16px; }
        .method-btn {
          flex: 1; padding: 10px 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #737373; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .method-btn:hover { border-color: rgba(255,255,255,0.15); color: #d4d4d4; }
        .pay-btn {
          width: 100%; padding: 14px;
          border-radius: 12px; border: none;
          background: #f97316; color: #fff;
          font-size: 15px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pay-btn:hover:not(:disabled) { background: #ea580c; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(249,115,22,0.3); }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-btn.loading { opacity: 0.8; }
        .btn-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>
        </div>
    );
}

// ── Table Form Modal ──────────────────────────────────────────────
function TableFormModal({ editTable, onClose, onSave }) {
    const [form, setForm] = useState({
        name: editTable?.name || "",
        floor: editTable?.floor || "",
        section: editTable?.section || "",
        capacity: editTable?.capacity || 4,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name) { toast.error("Table name is required"); return; }
        setSaving(true);
        try {
            if (editTable) {
                await updateTable(editTable.id, form);
                toast.success("Table updated");
            } else {
                await createTable(form);
                toast.success("Table created");
            }
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save table");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{editTable ? "Edit Table" : "Add New Table"}</h3>
                    <button className="drawer-close" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {[
                        { label: "Table Name *", key: "name", placeholder: "e.g. Table 1" },
                        { label: "Floor", key: "floor", placeholder: "e.g. Ground Floor" },
                        { label: "Section", key: "section", placeholder: "e.g. Main Hall" },
                    ].map((f) => (
                        <div key={f.key} className="modal-field">
                            <label className="modal-label">{f.label}</label>
                            <input
                                className="item-input"
                                placeholder={f.placeholder}
                                value={form[f.key]}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                            />
                        </div>
                    ))}
                    <div className="modal-field">
                        <label className="modal-label">Capacity</label>
                        <input
                            className="item-input"
                            type="number" min="1" max="20"
                            value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="item-cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="item-save-btn"
                        style={{ padding: "10px 24px", fontSize: "14px" }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : editTable ? "Save Changes" : "Create Table"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main FloorPage ────────────────────────────────────────────────
export default function FloorPage() {
    const { tables, setTables } = useTableStore();
    const { isOwnerOrManager } = useAuth();

    const [loading, setLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showTableForm, setShowTableForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterFloor, setFilterFloor] = useState("ALL");

    useEffect(() => { loadTables(); }, []);

    const loadTables = async () => {
        try {
            const res = await getAllTables();
            setTables(res.data);
        } catch {
            toast.error("Failed to load tables");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (table, status) => {
        try {
            await updateTableStatus(table.id, status);
            await loadTables();
            toast.success(`${table.name} → ${status}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    };

    const handleDeleteTable = async (table) => {
        if (!window.confirm(`Delete ${table.name}?`)) return;
        try {
            await deleteTable(table.id);
            await loadTables();
            toast.success(`${table.name} deleted`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete table");
        }
    };

    // Derived values
    const floors = ["ALL", ...new Set(tables.map((t) => t.floor).filter(Boolean))];
    const filteredTables = tables.filter((t) => {
        const statusMatch = filterStatus === "ALL" || t.status === filterStatus;
        const floorMatch = filterFloor === "ALL" || t.floor === filterFloor;
        return statusMatch && floorMatch;
    });

    const stats = {
        total: tables.length,
        available: tables.filter((t) => t.status === "AVAILABLE").length,
        occupied: tables.filter((t) => t.status === "OCCUPIED").length,
        billRequested: tables.filter((t) => t.status === "BILL_REQUESTED").length,
        paid: tables.filter((t) => t.status === "PAID").length,
    };

    return (
        <div className="floor-page">
            {/* Stats bar */}
            <div className="floor-stats">
                {[
                    { label: "Total Tables", value: stats.total, color: "#737373" },
                    { label: "Available", value: stats.available, color: "#10b981" },
                    { label: "Occupied", value: stats.occupied, color: "#f59e0b" },
                    { label: "Bill Requested", value: stats.billRequested, color: "#f43f5e" },
                    { label: "Paid", value: stats.paid, color: "#3b82f6" },
                ].map((s, i) => (
                    <div key={i} className="stat-chip">
                        <span className="stat-chip-value" style={{ color: s.color }}>{s.value}</span>
                        <span className="stat-chip-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="floor-toolbar">
                <div className="filter-group">
                    {/* Status filter */}
                    <div className="filter-pills">
                        {["ALL", "AVAILABLE", "OCCUPIED", "BILL_REQUESTED", "PAID"].map((s) => (
                            <button
                                key={s}
                                className={`filter-pill ${filterStatus === s ? "active" : ""}`}
                                onClick={() => setFilterStatus(s)}
                                style={filterStatus === s && s !== "ALL" ? {
                                    borderColor: STATUS[s]?.border,
                                    color: STATUS[s]?.color,
                                    background: STATUS[s]?.bg,
                                } : {}}
                            >
                                {s === "ALL" ? "All" : STATUS[s]?.label || s}
                            </button>
                        ))}
                    </div>

                    {/* Floor filter */}
                    {floors.length > 2 && (
                        <select
                            className="floor-select"
                            value={filterFloor}
                            onChange={(e) => setFilterFloor(e.target.value)}
                        >
                            {floors.map((f) => (
                                <option key={f} value={f}>{f === "ALL" ? "All Floors" : f}</option>
                            ))}
                        </select>
                    )}
                </div>

                {isOwnerOrManager && (
                    <button className="add-table-btn" onClick={() => setShowTableForm(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Table
                    </button>
                )}
            </div>

            {/* Table grid */}
            {loading ? (
                <div className="floor-loading">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="table-skeleton" style={{ animationDelay: `${i * 0.05}s` }} />
                    ))}
                </div>
            ) : filteredTables.length === 0 ? (
                <div className="floor-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <p>No tables found</p>
                    {isOwnerOrManager && (
                        <button className="add-table-btn" onClick={() => setShowTableForm(true)}>
                            Add your first table
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-grid">
                    {filteredTables.map((table, i) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            delay={i * 40}
                            onSelect={setSelectedTable}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteTable}
                            isOwnerOrManager={isOwnerOrManager}
                        />
                    ))}
                </div>
            )}

            {/* Bill Drawer */}
            {selectedTable && (
                <BillDrawer
                    table={selectedTable}
                    onClose={() => setSelectedTable(null)}
                    onPaid={() => { loadTables(); setSelectedTable(null); }}
                />
            )}

            {/* Table Form Modal */}
            {showTableForm && (
                <TableFormModal
                    editTable={null}
                    onClose={() => setShowTableForm(false)}
                    onSave={loadTables}
                />
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .floor-page { display: flex; flex-direction: column; gap: 20px; }

        /* Stats */
        .floor-stats {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .stat-chip {
          display: flex; flex-direction: column;
          align-items: center;
          padding: 14px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          min-width: 100px;
          flex: 1;
        }
        .stat-chip-value {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 700;
          line-height: 1;
        }
        .stat-chip-label {
          font-size: 11px; color: #525252;
          margin-top: 4px; text-align: center;
          font-weight: 500;
        }

        /* Toolbar */
        .floor-toolbar {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }
        .filter-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-pill {
          padding: 6px 14px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #737373;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .filter-pill:hover { border-color: rgba(255,255,255,0.15); color: #d4d4d4; }
        .filter-pill.active { border-color: rgba(249,115,22,0.3); color: #f97316; background: rgba(249,115,22,0.08); }
        .floor-select {
          padding: 7px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #a3a3a3; font-size: 13px;
          outline: none; cursor: pointer;
        }
        .add-table-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          border: none; background: #f97316; color: #fff;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .add-table-btn:hover { background: #ea580c; transform: translateY(-1px); }

        /* Grid */
        .table-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .table-card {
          border-radius: 16px;
          border: 1px solid;
          padding: 18px;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 12px;
          transition: all 0.2s;
          animation: cardIn 0.4s ease forwards;
          opacity: 0;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .card-status-row {
          display: flex; align-items: center; gap: 7px;
        }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0;
        }
        .status-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; flex: 1; }
        .card-menu-btn {
          width: 22px; height: 22px; border-radius: 6px;
          border: 1px solid rgba(239,68,68,0.15);
          background: transparent; color: #525252;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .card-menu-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .card-name {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
        }
        .card-info-row { display: flex; gap: 12px; }
        .card-info-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #525252; font-weight: 500;
        }
        .card-actions { margin-top: 4px; }
        .card-action-btn {
          width: 100%; padding: 9px;
          border-radius: 10px; border: none;
          font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .card-action-btn.primary { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .card-action-btn.primary:hover { background: rgba(16,185,129,0.2); }
        .card-action-btn.warning { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .card-action-btn.warning:hover { background: rgba(245,158,11,0.2); }
        .card-action-btn.danger { background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.2); }
        .card-action-btn.danger:hover { background: rgba(244,63,94,0.2); }
        .card-action-btn.success { background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
        .card-action-btn.success:hover { background: rgba(59,130,246,0.2); }

        /* Skeleton */
        .floor-loading { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .table-skeleton {
          height: 180px; border-radius: 16px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Empty */
        .floor-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 16px; padding: 80px 20px;
          color: #404040; font-size: 14px;
          text-align: center;
        }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 300;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          width: 100%; max-width: 400px;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700; color: #fff;
        }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label { font-size: 12px; font-weight: 600; color: #737373; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>
        </div>
    );
}