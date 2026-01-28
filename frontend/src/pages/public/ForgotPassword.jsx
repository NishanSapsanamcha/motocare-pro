import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import logo from "../../assets/logo.png";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useMemo(() => new Date().getFullYear(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      setMessage("A reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-split">
        <div className="auth-brand-col">
          <img src={logo} alt="Motocare Pro" className="auth-logo mb-2" />
          <h2 className="fw-bold mb-0">Motocare Pro</h2>
        </div>

        <div className="auth-form-col">
          <h3 className="fw-bold mb-1">Forgot password</h3>
          <div className="mb-3" />

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {message && <div className="alert alert-success py-2">{message}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label className="form-label fw-semibold">
              Email <span className="text-danger">*</span>
            </label>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white">
                <i className="bi bi-envelope" />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg rounded-pill"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
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
