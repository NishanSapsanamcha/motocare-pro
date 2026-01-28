import { useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginSchema } from "../../schema/auth.schema";
import api from "../../utils/api";
import { setAdminUser, setToken, setUser } from "../../utils/auth";
import "./Login.css";

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const location = useLocation();
  const navigate = useNavigate();
  const year = useMemo(() => new Date().getFullYear(), []);
  const isAdminLogin = location.pathname.startsWith("/admin");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path?.[0];
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);

      const endpoint = isAdminLogin ? "/admin/auth/login" : "/auth/login";
      const res = await api.post(endpoint, parsed.data);
      const { token, user, admin } = res.data || {};
      const authUser = user || admin;

      if (!token || !authUser) {
        setError("Invalid response from server");
        return;
      }

      setToken(token);
      setUser(authUser);
      if (authUser.role === "ADMIN") {
        setAdminUser(authUser);
      }

      // Route based on role
      if (authUser.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="row align-items-center g-4">
          {/* LEFT CONTENT */}
          <div className="col-md-6 text-center">
            <img src={logo} alt="Motocare Pro" className="auth-logo mb-3" />

            <h2 className="fw-bold mb-2">Motocare Pro</h2>

            <p className="text-muted mb-4">
              Book trusted mechanics, track service updates, and enjoy transparent pricing.
            </p>

            <div className="d-none d-md-block">
              <p className="small text-muted">© {year} Motocare Pro. All rights reserved.</p>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="col-md-6">
            <h3 className="fw-bold mb-1 text-center text-md-start">Welcome back</h3>
            <p className="text-muted mb-4 text-center text-md-start">Login to your account</p>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <label className="form-label fw-semibold">
                Email <span className="text-danger">*</span>
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  type="email"
                  className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                  placeholder="youremail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>

              {/* Password */}
              <label className="form-label fw-semibold">
                Password <span className="text-danger">*</span>
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPw((s) => !s)}
                >
                  <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block">{fieldErrors.password}</div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="remember" />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me
                  </label>
                </div>

                <Link to="/forgot-password" className="text-decoration-none fw-semibold text-primary">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 btn-lg rounded-pill"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-3">
              Don't have an account?{" "}
              {onSwitch ? (
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={onSwitch}
                >
                  Register here
                </button>
              ) : (
                <Link to="/register" className="btn btn-link p-0">
                  Register here
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
