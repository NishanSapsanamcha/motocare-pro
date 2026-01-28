import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "./admin.css";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsId, setDetailsId] = useState(null);
  const [details, setDetails] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/services", {
        params: { page, limit: 10, status, search },
      });
      setServices(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id) => {
    try {
      const res = await api.get(`/admin/services/${id}`);
      setDetails(res.data.data);
      setDetailsId(id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch service details");
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, status, search]);

  const handleStatusChange = async (id) => {
    if (!newStatus) {
      setError("Select a status");
      return;
    }
    try {
      await api.patch(`/admin/services/${id}/status`, {
        status: newStatus,
        note: note || undefined,
      });
      setStatusModal(null);
      setNewStatus("");
      setNote("");
      fetchServices();
      if (detailsId === id) fetchDetails(id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const statuses = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-row">
          <h1>Service Requests</h1>
          <div className="admin-header-actions">
            <Link to="/admin/dashboard" className="btn btn-outline-light">
              <i className="bi bi-arrow-left me-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="filter-section">
        <input
          type="text"
          className="form-control"
          placeholder="Search service type/description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-border">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Service Type</th>
                <th>Assigned Garage</th>
                <th>Status</th>
                <th>Requested Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id}>
                  <td>{svc.id}</td>
                  <td>
                    <div>
                      <strong>{svc.user?.full_name}</strong>
                      <br />
                      <small className="text-muted">{svc.user?.email}</small>
                    </div>
                  </td>
                  <td>{svc.service_type}</td>
                  <td>{svc.garage?.name || "Not assigned"}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        svc.status === "COMPLETED" ? "success" :
                        svc.status === "IN_PROGRESS" ? "info" :
                        svc.status === "PENDING" ? "warning" :
                        "danger"
                      }`}
                    >
                      {svc.status}
                    </span>
                  </td>
                  <td>{new Date(svc.requested_date).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => fetchDetails(svc.id)}
                      >
                        <i className="bi bi-eye" />
                        Details
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => setStatusModal(svc.id)}
                      >
                        <i className="bi bi-arrow-repeat" />
                        Update Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {detailsId && details && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <h2>Service Details</h2>
            <div className="service-details">
              <p><strong>Service ID:</strong> {details.id}</p>
              <p><strong>User:</strong> {details.user?.full_name} ({details.user?.email})</p>
              <p><strong>Phone:</strong> {details.user?.phone_number}</p>
              <p><strong>Service Type:</strong> {details.service_type}</p>
              <p><strong>Description:</strong> {details.description}</p>
              <p><strong>Vehicle Info:</strong> {JSON.stringify(details.vehicle_info)}</p>
              <p><strong>Assigned Garage:</strong> {details.garage?.name || "Not assigned"}</p>
              <p><strong>Status:</strong> <span className="badge bg-info">{details.status}</span></p>

              <h4 className="mt-4">Status History</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {details.statusHistory?.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleString()}</td>
                      <td>{h.status}</td>
                      <td>{h.note}</td>
                      <td>{h.updatedByUser?.full_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-outline-secondary"
              onClick={() => { setDetailsId(null); setDetails(null); }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Update Service Status</h2>
            <div className="mb-3">
              <label>New Status *</label>
              <select
                className="form-control"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label>Note (Optional)</label>
              <textarea
                className="form-control"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => handleStatusChange(statusModal)}
              >
                Update
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => { setStatusModal(null); setNewStatus(""); setNote(""); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
