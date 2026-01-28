import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "./admin.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users", {
        params: { page, limit: 10, search, role },
      });
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, role]);

  const handleBlock = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/block`);
      setBlockConfirm(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to block user");
    }
  };

  const handleUnblock = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/unblock`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unblock user");
    }
  };

  const handleRoleChange = async (id) => {
    if (!newRole) {
      setError("Select a role");
      return;
    }
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      setRoleModal(null);
      setNewRole("");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-row">
          <h1>Users Management</h1>
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
          placeholder="Search name/email/phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
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
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number || "-"}</td>
                  <td>
                    <span className="badge bg-secondary">{user.role}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${user.is_blocked ? "bg-danger" : "bg-success"}`}
                    >
                      {user.is_blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-action-buttons">
                      {user.is_blocked ? (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUnblock(user.id)}
                        >
                          <i className="bi bi-check-circle" />
                          Unblock
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => setBlockConfirm(user.id)}
                        >
                          <i className="bi bi-slash-circle" />
                          Block
                        </button>
                      )}

                      {user.role !== "ADMIN" && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => { setRoleModal(user.id); setNewRole(user.role); }}
                        >
                          <i className="bi bi-person-gear" />
                          Change Role
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteConfirm(user.id)}
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

      {/* Block Confirm */}
      {blockConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Block</h3>
            <p>Block this user? They won't be able to login.</p>
            <div className="d-flex gap-2">
              <button className="btn btn-warning" onClick={() => handleBlock(blockConfirm)}>
                Block
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setBlockConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change User Role</h3>
            <div className="mb-3">
              <label>Select Role *</label>
              <select
                className="form-control"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => handleRoleChange(roleModal)}
              >
                Update
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => { setRoleModal(null); setNewRole(""); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Delete this user? This action cannot be undone.</p>
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
