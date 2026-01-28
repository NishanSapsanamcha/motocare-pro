import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import "./Login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("Reset token is missing");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      setMessage("Password reset successful. You can now log in.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-single">
        <div className="auth-single-col">
          <h3 className="fw-bold mb-1 text-center">Reset password</h3>
          <p className="text-muted mb-4 text-center">Enter your new password.</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {message && <div className="alert alert-success py-2">{message}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label className="form-label fw-semibold">
              New password <span className="text-danger">*</span>
            </label>
            <div className="input-group mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="New password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 5c5.523 0 9.5 5.5 9.5 7s-3.977 7-9.5 7S2.5 13.5 2.5 12 6.477 5 12 5Zm0 2c-4.21 0-7.2 4.167-7.2 5s2.99 5 7.2 5 7.2-4.167 7.2-5-2.99-5-7.2-5Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 5c5.523 0 9.5 5.5 9.5 7a10.2 10.2 0 0 1-3.105 4.23l1.387 1.387-1.414 1.414-2.05-2.05A9.55 9.55 0 0 1 12 19c-5.523 0-9.5-5.5-9.5-7a10.51 10.51 0 0 1 2.92-4.06L3.55 6.07 4.964 4.657l2.005 2.005A9.68 9.68 0 0 1 12 5Zm0 2a7.55 7.55 0 0 0-3.41.82l1.56 1.56A2.5 2.5 0 0 1 13.62 12l3.19 3.19A8.08 8.08 0 0 0 19.2 12c0-.833-2.99-5-7.2-5Zm-7.2 5c0 .833 2.99 5 7.2 5 1.03 0 1.99-.25 2.84-.69l-1.49-1.49A2.5 2.5 0 0 1 9.17 9.14L6 5.97A8.49 8.49 0 0 0 4.8 12Z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <label className="form-label fw-semibold">
              Confirm password <span className="text-danger">*</span>
            </label>
            <div className="input-group mb-3">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                aria-label="Confirm password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 5c5.523 0 9.5 5.5 9.5 7s-3.977 7-9.5 7S2.5 13.5 2.5 12 6.477 5 12 5Zm0 2c-4.21 0-7.2 4.167-7.2 5s2.99 5 7.2 5 7.2-4.167 7.2-5-2.99-5-7.2-5Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 5c5.523 0 9.5 5.5 9.5 7a10.2 10.2 0 0 1-3.105 4.23l1.387 1.387-1.414 1.414-2.05-2.05A9.55 9.55 0 0 1 12 19c-5.523 0-9.5-5.5-9.5-7a10.51 10.51 0 0 1 2.92-4.06L3.55 6.07 4.964 4.657l2.005 2.005A9.68 9.68 0 0 1 12 5Zm0 2a7.55 7.55 0 0 0-3.41.82l1.56 1.56A2.5 2.5 0 0 1 13.62 12l3.19 3.19A8.08 8.08 0 0 0 19.2 12c0-.833-2.99-5-7.2-5Zm-7.2 5c0 .833 2.99 5 7.2 5 1.03 0 1.99-.25 2.84-.69l-1.49-1.49A2.5 2.5 0 0 1 9.17 9.14L6 5.97A8.49 8.49 0 0 0 4.8 12Z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg rounded-pill"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <p className="text-center mt-3">
            <Link to="/login" className="text-decoration-none fw-semibold text-primary">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
