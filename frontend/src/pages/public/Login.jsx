import { useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "../../schema/auth.schema";
import "./Login.css";

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const year = useMemo(() => new Date().getFullYear(), []);

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

      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Network error. Please try again.");
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
              <p className="small text-muted">c {year} Motocare Pro. All rights reserved.</p>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="col-md-6">
            <h3 className="fw-bold mb-1 text-center text-md-start">Welcome back</h3>
            <p className="text-muted mb-4 text-center text-md-start">Login to continue</p>

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
                  placeholder="you@example.com"
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
          </div>
        </div>
      </div>
    </div>
  );
}
