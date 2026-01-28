import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { removeAuth } from "../../utils/auth";
import DashboardLayout from "./DashboardLayout";

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [paying, setPaying] = useState(false);

  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }
  const fullName = user?.fullName || "User";

  const handleLogout = () => {
    removeAuth();
    navigate("/landing", { replace: true });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" }).format(Number(value || 0));

  const formatInvoiceStatus = (status) => {
    if (!status) return "-";
    if (status === "PAYMENT_PENDING") return "Payment Pending";
    return status;
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/appointments");
      setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      setCancelingId(id);
      setError("");
      await api.patch(`/users/appointments/${id}/cancel`);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancelingId(null);
    }
  };

  const openCancelModal = (appt) => {
    setCancelTarget(appt);
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
  };

  const openInvoiceModal = (appt) => {
    setInvoiceModal(appt);
    setRedeemPoints("");
    setRedeemError("");
    setDownloadError("");
    setRewardsError("");
    setRewardsBalance(0);
    setRewardsLoading(true);
    api.get("/users/rewards")
      .then((res) => {
        const balance = Number(res.data?.data?.balance || 0);
        setRewardsBalance(balance);
        setRewardsError("");
      })
      .catch((err) => {
        setRewardsError(err.response?.data?.message || "Failed to load rewards");
        setRewardsBalance(0);
      })
      .finally(() => {
        setRewardsLoading(false);
      });
  };

  const closeInvoiceModal = () => {
    setInvoiceModal(null);
    setRedeemPoints("");
    setRedeemError("");
    setPaying(false);
    setRewardsLoading(false);
    setRewardsError("");
    setDownloadError("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    await handleCancel(cancelTarget.id);
    closeCancelModal();
  };

  const maxRedeemable = (invoiceTotal) => {
    const total = Number(invoiceTotal || 0);
    if (!Number.isFinite(total) || total <= 0) return 0;
    const maxByAmount = Math.floor(total * 0.5);
    const maxAllowed = Math.min(rewardsBalance, maxByAmount);
    return maxAllowed >= 100 ? maxAllowed : 0;
  };

  const handlePayInvoice = async () => {
    if (!invoiceModal?.invoice) return;
    const invoice = invoiceModal.invoice;
    const total = Number(invoice.total_amount || 0);
    const maxAllowed = maxRedeemable(total);
    const points = redeemPoints ? Number(redeemPoints) : 0;

    if (!Number.isInteger(points) || points < 0) {
      setRedeemError("Redeem points must be a positive integer.");
      return;
    }
    if (points > 0 && points < 100) {
      setRedeemError("Minimum redeemable points is 100.");
      return;
    }
    if (points > maxAllowed) {
      setRedeemError(`You can redeem up to ${maxAllowed} points for this invoice.`);
      return;
    }

    try {
      setPaying(true);
      setRedeemError("");
      await api.post(`/users/invoices/${invoice.id}/pay`, {
        redeem_points: points,
      });
      await fetchAppointments();
      closeInvoiceModal();
    } catch (err) {
      setRedeemError(err.response?.data?.message || "Failed to pay invoice");
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceModal?.invoice) return;
    setDownloadError("");
    const popup = window.open("", "_blank");
    try {
      const res = await api.get(`/users/invoices/${invoiceModal.invoice.id}/print`, {
        responseType: "blob",
      });
      const contentType = res.headers?.["content-type"] || "text/html";
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
      if (popup) {
        popup.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      if (popup) popup.close();
      setDownloadError(err.response?.data?.message || "Failed to download invoice");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!invoiceModal && !cancelTarget) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        if (invoiceModal) closeInvoiceModal();
        if (cancelTarget) closeCancelModal();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [invoiceModal, cancelTarget]);

  return (
    <DashboardLayout active="appointments" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">My Appointments</div>
          <div className="dash-subtitle">Track your upcoming service</div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : appointments.length > 0 ? (
            <div className="appointment-list">
              {appointments.map((appt) => {
                const priceValue = appt.invoice?.total_amount ?? appt.quoted_price;
                return (
                  <div key={appt.id} className="appointment-item">
                    <div>
                      <strong>{appt.service_type}</strong>
                      <div className="text-muted small">
                        {appt.preferred_date} at {appt.time_slot}
                      </div>
                    </div>
                    <div className="appointment-meta">
                      <div>{appt.garage?.name || "-"}</div>
                      <div className="text-muted small">{appt.bike?.registration_no || "-"}</div>
                      <div className="text-muted small">
                        Price: {priceValue !== null && priceValue !== undefined ? formatCurrency(priceValue) : "-"}
                      </div>
                      <div className="appointment-actions">
                        <span className="badge bg-secondary">{appt.status}</span>
                        {appt.invoice?.status && (
                          <button
                            type="button"
                            className="badge bg-info border-0"
                            onClick={() => openInvoiceModal(appt)}
                          >
                            Invoice {formatInvoiceStatus(appt.invoice.status)}
                          </button>
                        )}
                        {appt.status !== "CANCELLED" && (
                          <button
                            type="button"
                            className="appointment-cancel-btn"
                            onClick={() => openCancelModal(appt)}
                            disabled={cancelingId === appt.id}
                          >
                            {cancelingId === appt.id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted">You do not have any appointment right now.</div>
          )}
        </section>
      </div>
      {cancelTarget && (
        <div className="dash-modal-overlay" role="dialog" aria-modal="true" onClick={closeCancelModal}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel appointment?</h3>
            <p className="text-muted">
              Do you want to cancel the appointment for {cancelTarget.service_type} on{" "}
              {cancelTarget.preferred_date} at {cancelTarget.time_slot}?
            </p>
            <div className="dash-modal-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeCancelModal}
                disabled={cancelingId === cancelTarget.id}
              >
                No
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancel}
                disabled={cancelingId === cancelTarget.id}
              >
                {cancelingId === cancelTarget.id ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {invoiceModal?.invoice && (
        <div className="dash-modal-overlay" role="dialog" aria-modal="true" onClick={closeInvoiceModal}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invoice Details</h3>
            <p className="text-muted">
              {invoiceModal.service_type} • {invoiceModal.preferred_date} at{" "}
              {invoiceModal.time_slot}
            </p>
            <div className="appointment-list">
              {(invoiceModal.invoice.items || []).length > 0 ? (
                invoiceModal.invoice.items.map((item) => (
                  <div key={item.id} className="appointment-item">
                    <div>
                      <strong>{item.description}</strong>
                      <div className="text-muted small">
                        {item.quantity} × {Number(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="fw-semibold">{Number(item.line_total).toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <div className="text-muted">No invoice line items.</div>
              )}
            </div>
            <div className="mt-3">
              <div className="fw-semibold">Total: {Number(invoiceModal.invoice.total_amount).toFixed(2)}</div>
              <div className="text-muted small">
                Status: {invoiceModal.invoice.status}
              </div>
              {invoiceModal.invoice.redeemed_amount ? (
                <div className="text-muted small">
                  Redeemed: {Number(invoiceModal.invoice.redeemed_amount).toFixed(2)} points
                </div>
              ) : null}
              {invoiceModal.invoice.paid_amount ? (
                <div className="text-muted small">
                  Paid Amount: {Number(invoiceModal.invoice.paid_amount).toFixed(2)}
                </div>
              ) : null}
            </div>
            {invoiceModal.invoice.status === "PAYMENT_PENDING" && (
              <div className="alert alert-info mt-3">
                Payment request submitted. Please wait for admin approval.
              </div>
            )}
            {invoiceModal.invoice.status === "ISSUED" && (
              <div className="mt-3">
                <div className="fw-semibold mb-1">Redeem Points</div>
                <div className="text-muted small mb-2">
                  {rewardsLoading
                    ? "Loading rewards balance..."
                    : rewardsError
                      ? rewardsError
                      : `Balance: ${rewardsBalance} points • Max redeemable: ${maxRedeemable(invoiceModal.invoice.total_amount)} points`}
                </div>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Enter points to redeem (min 100)"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  disabled={rewardsLoading || Boolean(rewardsError)}
                />
                {redeemError && <div className="text-danger small mt-2">{redeemError}</div>}
              </div>
            )}
            <div className="dash-modal-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={closeInvoiceModal}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleDownloadInvoice}
              >
                Download PDF
              </button>
              {invoiceModal.invoice.status === "ISSUED" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePayInvoice}
                  disabled={paying}
                >
                  {paying ? "Processing..." : "Pay Invoice"}
                </button>
              )}
            </div>
            {downloadError && <div className="text-danger small mt-2">{downloadError}</div>}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
