import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "./admin.css";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priceModal, setPriceModal] = useState(null);
  const [priceValue, setPriceValue] = useState("");
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState("DRAFT");
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [vatRate, setVatRate] = useState("13");
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [rescheduleTo, setRescheduleTo] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/appointments", {
        params: { page, limit: 10, search, status: statusFilter },
      });
      setAppointments(res.data.data || []);
      setTotal(res.data.pagination?.pages || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoadingPending(true);
      const res = await api.get("/admin/invoices/pending");
      setPendingPayments(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setPendingPayments([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const normalizeStatus = (status) => (status === "PENDING" ? "REQUESTED" : status);

  const getAdminOptions = (status) => {
    const current = normalizeStatus(status);
    if (current === "REQUESTED") return ["CONFIRMED", "REJECTED", "CANCELLED"];
    if (current === "CONFIRMED") return ["CANCELLED", "RESCHEDULED", "NO_SHOW", "COMPLETED"];
    if (current === "RESCHEDULED") return ["CONFIRMED", "CANCELLED"];
    return [];
  };

  const openStatusModal = (appt) => {
    setStatusModal(appt);
    setNewStatus("");
    setReason("");
    setRescheduleTo("");
    setNote("");
  };

  const closeStatusModal = () => {
    setStatusModal(null);
    setNewStatus("");
    setReason("");
    setRescheduleTo("");
    setNote("");
  };

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) {
      setError("Select a status");
      return;
    }
    if (newStatus === "CANCELLED" && !reason.trim()) {
      setError("Cancellation reason is required");
      return;
    }
    if (newStatus === "RESCHEDULED" && !rescheduleTo) {
      setError("Reschedule time is required");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await api.patch(`/appointments/${statusModal.id}/status`, {
        status: newStatus,
        reason: reason.trim() || undefined,
        reschedule_to: rescheduleTo || undefined,
        note: note.trim() || undefined,
      });
      closeStatusModal();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update appointment status");
    } finally {
      setSaving(false);
    }
  };

  const openPriceModal = (appt) => {
    setPriceModal(appt);
    setPriceValue(appt.quoted_price ?? "");
  };

  const closePriceModal = () => {
    setPriceModal(null);
    setPriceValue("");
  };

  const handlePriceSave = async () => {
    if (!priceModal) return;
    const price = Number(priceValue);
    if (!Number.isFinite(price) || price < 0) {
      setError("Valid quoted price is required");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await api.patch(`/admin/appointments/${priceModal.id}/price`, {
        quoted_price: price,
      });
      closePriceModal();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  const openInvoiceModal = (appt) => {
    setInvoiceModal(appt);
    setInvoiceStatus(appt.invoice?.status || "DRAFT");
    if (appt.invoice?.items?.length) {
      setInvoiceItems(
        appt.invoice.items.map((item) => ({
          id: item.id,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
        }))
      );
      setVatRate(appt.invoice.vat_rate ?? "13");
    } else {
      setInvoiceItems([{ description: appt.service_type || "", unit_price: "", quantity: 1 }]);
      setVatRate("13");
    }
  };

  const closeInvoiceModal = () => {
    setInvoiceModal(null);
    setInvoiceStatus("DRAFT");
    setInvoiceItems([]);
    setVatRate("13");
  };

  const updateItem = (index, key, value) => {
    setInvoiceItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  const addItem = () => {
    setInvoiceItems((prev) => [...prev, { description: "", unit_price: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    setInvoiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const computeTotals = () => {
    const items = invoiceItems
      .map((item) => ({
        description: String(item.description || "").trim(),
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity || 1),
      }))
      .filter((item) => item.description && Number.isFinite(item.unit_price) && item.unit_price >= 0);

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const vat = Number(vatRate);
    const safeVat = Number.isFinite(vat) && vat >= 0 ? vat : 0;
    const vatAmount = (subtotal * safeVat) / 100;
    const total = subtotal + vatAmount;
    return { items, subtotal, vatAmount, total };
  };

  const renderPriceDiff = (total) => {
    const quoted = Number(invoiceModal?.quoted_price);
    if (!Number.isFinite(quoted)) return "No quoted price";
    const diff = total - quoted;
    if (diff === 0) return "Matches quoted price";
    if (diff > 0) return `Higher by ${diff.toFixed(2)}`;
    return `Lower by ${Math.abs(diff).toFixed(2)}`;
  };

  const handleInvoiceSave = async () => {
    if (!invoiceModal) return;
    const { items, total } = computeTotals();
    if (!items.length) {
      setError("At least one invoice item is required");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError("Invoice total must be greater than 0");
      return;
    }
    try {
      setSaving(true);
      setError("");
      if (invoiceModal.invoice) {
        if (invoiceModal.invoice.status === "DRAFT") {
          await api.patch(`/admin/invoices/${invoiceModal.invoice.id}`, {
            items,
            vat_rate: Number(vatRate),
          });
        }
        if (invoiceModal.invoice.status !== invoiceStatus) {
          await api.patch(`/admin/invoices/${invoiceModal.invoice.id}/status`, {
            status: invoiceStatus,
          });
        }
      } else {
        await api.post(`/admin/appointments/${invoiceModal.id}/invoice`, {
          status: invoiceStatus,
          items,
          vat_rate: Number(vatRate),
        });
      }
      closeInvoiceModal();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingPayments();
  }, [page, search, statusFilter]);

  const approvePayment = async (invoiceId) => {
    try {
      setSaving(true);
      await api.patch(`/admin/invoices/${invoiceId}/status`, { status: "PAID" });
      await fetchPendingPayments();
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <h1>Appointments</h1>
          <div className="admin-header-actions">
            <Link to="/admin/dashboard" className="btn btn-outline-light">
              <i className="bi bi-arrow-left me-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section">
        <input
          type="text"
          className="form-control"
          placeholder="Search user/garage/service/registration..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="REQUESTED">Requested</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No Show</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner-border">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Bike</th>
                <th>Garage</th>
                <th>Service</th>
                <th>KM</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Price</th>
                <th>Invoice</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <div>
                        <strong>{appt.user?.full_name || "-"}</strong>
                        <br />
                        <small className="text-muted">{appt.user?.email || ""}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{appt.bike?.company || "-"}</strong>
                        <br />
                        <small className="text-muted">{appt.bike?.registration_no || ""}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{appt.garage?.name || "-"}</strong>
                        <br />
                        <small className="text-muted">{appt.garage?.phone || ""}</small>
                      </div>
                    </td>
                    <td>{appt.service_type || "-"}</td>
                    <td>{appt.km_running}</td>
                    <td>{appt.preferred_date}</td>
                    <td>{appt.time_slot}</td>
                    <td>
                      <span className="badge bg-secondary">{normalizeStatus(appt.status)}</span>
                    </td>
                    <td>{appt.quoted_price ?? "-"}</td>
                    <td>
                      {appt.invoice ? (
                        <span className="badge bg-info">
                          {appt.invoice.status === "PAYMENT_PENDING" ? "PAYMENT PENDING" : appt.invoice.status}
                        </span>
                      ) : (
                        <span className="text-muted">No invoice</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openPriceModal(appt)}
                        >
                          <i className="bi bi-cash-coin" />
                          Set Price
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openInvoiceModal(appt)}
                        >
                          <i className="bi bi-receipt" />
                          Invoice
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openStatusModal(appt)}
                          disabled={getAdminOptions(appt.status).length === 0}
                        >
                          <i className="bi bi-sliders2" />
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold mb-0">Payment Pending</h5>
            <span className="text-muted small">Approve to mark paid</span>
          </div>
          {loadingPending ? (
            <div className="text-muted">Loading...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-muted">No pending payments</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Garage</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.appointment?.user?.full_name || "-"}</strong>
                        <br />
                        <small className="text-muted">{inv.appointment?.user?.phone_number || ""}</small>
                      </td>
                      <td>{inv.appointment?.garage?.name || "-"}</td>
                      <td>{inv.appointment?.service_type || "-"}</td>
                      <td>{inv.appointment?.preferred_date || "-"}</td>
                      <td>{inv.appointment?.time_slot || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => approvePayment(inv.id)}
                          disabled={saving}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {total > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(page - 1)}>
                Previous
              </button>
            </li>
            {Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1).map((p) => (
              <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(p)}>
                  {p}
                </button>
              </li>
            ))}
            <li className={`page-item ${page === total ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(page + 1)}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {statusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Appointment Status</h3>
              <button type="button" className="modal-close" onClick={closeStatusModal}>
                &times;
              </button>
            </div>
            <div>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select status</option>
                  {getAdminOptions(statusModal.status).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === "CANCELLED" && (
                <div className="mb-3">
                  <label className="form-label">Cancellation Reason *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancellation"
                  />
                </div>
              )}

              {newStatus === "RESCHEDULED" && (
                <div className="mb-3">
                  <label className="form-label">Reschedule To *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={rescheduleTo}
                    onChange={(e) => setRescheduleTo(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Internal Note (optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={closeStatusModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStatusUpdate}
                disabled={saving}
              >
                {saving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {priceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Set Appointment Price</h3>
              <button type="button" className="modal-close" onClick={closePriceModal}>
                &times;
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label">Quoted Price</label>
              <input
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="Enter price"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={closePriceModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePriceSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Price"}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Invoice</h3>
              <button type="button" className="modal-close" onClick={closeInvoiceModal}>
                &times;
              </button>
            </div>
            <div className="mb-3">
              <div className="fw-semibold">{invoiceModal.service_type || "Service"}</div>
              <div className="text-muted small">
                {invoiceModal.user?.full_name || "-"} • {invoiceModal.user?.phone_number || "-"}
              </div>
              <div className="text-muted small">
                KM: {invoiceModal.km_running ?? "-"} • Reg: {invoiceModal.bike?.registration_no || "-"}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Items</label>
              <div className="d-flex flex-column gap-2">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Particular"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Qty"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => removeItem(index)}
                      disabled={invoiceItems.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary" onClick={addItem}>
                  + Add Item
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">VAT %</label>
              <input
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
            </div>
            {(() => {
              const totals = computeTotals();
              return (
                <div className="mb-3">
                  <div className="fw-semibold">Subtotal: {totals.subtotal.toFixed(2)}</div>
                  <div className="fw-semibold">VAT: {totals.vatAmount.toFixed(2)}</div>
                  <div className="fw-bold">Total: {totals.total.toFixed(2)}</div>
                  <div className="text-muted small">
                    {renderPriceDiff(totals.total)}
                  </div>
                </div>
              );
            })()}
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={closeInvoiceModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInvoiceSave}
                disabled={saving}
              >
                {saving ? "Saving..." : invoiceModal.invoice ? "Update Invoice" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
