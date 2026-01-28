import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "./admin.css";

export default function Garages() {
  const imageBaseUrl = (api.defaults.baseURL || "")
    .replace(/\/api\/?$/, "") || "http://localhost:4000";
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    photo: null,
  });

  const fetchGarages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/garages", {
        params: { page, limit: 10, search, status },
      });
      setGarages(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch garages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarages();
  }, [page, search, status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.address || !form.phone || !form.email) {
      setError("All fields required");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("address", form.address);
    formData.append("phone", form.phone);
    formData.append("email", form.email);
    formData.append("description", form.description);
    if (form.photo) formData.append("photo", form.photo);

    try {
      if (editingId) {
        await api.put(`/admin/garages/${editingId}`, formData);
      } else {
        await api.post("/admin/garages", formData);
      }
      setShowModal(false);
      resetForm();
      fetchGarages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save garage");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/garages/${id}`);
      setDeleteConfirm(null);
      fetchGarages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete garage");
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/garages/${id}/approve`);
      fetchGarages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve garage");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/admin/garages/${id}/reject`);
      fetchGarages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject garage");
    }
  };

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "", email: "", description: "", photo: null });
    setPhotoPreview(null);
    setEditingId(null);
  };

  const openEditModal = (garage) => {
    setForm({
      name: garage.name,
      address: garage.address,
      phone: garage.phone,
      email: garage.email,
      description: garage.description || "",
      photo: null,
    });
    setPhotoPreview(garage.photo_url);
    setEditingId(garage.id);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-row">
          <h1>Garages Management</h1>
          <div className="admin-header-actions">
            <Link to="/admin/dashboard" className="btn btn-outline-light">
              <i className="bi bi-arrow-left me-1" />
              Back to Dashboard
            </Link>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              <i className="bi bi-plus-circle me-1" />
              + Add Garage
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="filter-section">
        <input
          type="text"
          className="form-control"
          placeholder="Search name/location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
                <th>Photo</th>
                <th>Name</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {garages.map((garage) => (
                <tr key={garage.id}>
                  <td>
                    {garage.photo_url ? (
                      <img src={`${imageBaseUrl}${garage.photo_url}`} alt={garage.name} className="garage-thumb" />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{garage.name}</td>
                  <td>{garage.address}</td>
                  <td>{garage.phone}</td>
                  <td>
                    <span className={`badge bg-${garage.status === "APPROVED" ? "success" : garage.status === "PENDING" ? "warning" : "danger"}`}>
                      {garage.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      <button className="btn btn-sm btn-warning" onClick={() => openEditModal(garage)}>
                        <i className="bi bi-pencil-square" />
                        Edit
                      </button>
                      {garage.status === "PENDING" && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(garage.id)}>
                            <i className="bi bi-check2-circle" />
                            Approve
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(garage.id)}>
                            <i className="bi bi-x-circle" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteConfirm(garage.id)}
                      >
                        <i className="bi bi-trash" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? "Edit Garage" : "Add Garage"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Address *</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Phone *</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="mb-3">
                <label>Photo</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img src={photoPreview} alt="Preview" className="garage-preview" />
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this garage?</p>
            <div className="d-flex gap-2">
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
