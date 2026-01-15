import { useState } from "react";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "../../schema/auth.schema";
import "./Register.css";

export default function Register({ onSwitch, mode = "page" }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});

    const parsed = registerSchema.safeParse(form);
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

      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.message || "Registration failed.");
        return;
      }

      setSuccessMsg("Account created successfully!");

      // If opened from landing modal -> switch to login inside modal
      if (mode === "modal") {
        setTimeout(() => onSwitch?.(), 800);
      } else {
        setTimeout(() => navigate("/login"), 800);
      }
    } catch (err) {
      setErrorMsg("Network error. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="row align-items-center g-4">
          {/* LEFT INFO (logo / text) */}
          <div className="col-md-6 text-center">
            <img src={logo} alt="Motocare Pro" className="auth-logo mb-3" />

            <h2 className="fw-bold mb-2 auth-title">Motocare Pro</h2>

            <p className="text-muted mb-4">
              Create an account to book services, manage appointments, and track
              your services.
            </p>

            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {["Trusted", "Fast", "Transparent"].map((item) => (
                <span key={item} className="auth-pill">
                  {item}
                </span>
              ))}
            </div>

            <div className="d-none d-md-block mt-4 small auth-footer-note">
              © {new Date().getFullYear()} Motocare Pro. All rights reserved.
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="col-md-6">
            <h3 className="fw-bold mb-1 text-center text-md-start">
              Create account
            </h3>
            <p className="text-muted mb-4 text-center text-md-start">
              Sign up to get started with Motocare Pro
            </p>

            {errorMsg && (
              <div className="alert alert-danger py-2">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="alert alert-success py-2">{successMsg}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <label className="form-label fw-semibold">Full Name</label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-person" />
                </span>
                <input
                  type="text"
                  name="fullName"
                  className={`form-control ${fieldErrors.fullName ? "is-invalid" : ""}`}
                  placeholder="Your Full Name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.fullName && (
                  <div className="invalid-feedback">{fieldErrors.fullName}</div>
                )}
              </div>

              {/* Email */}
              <label className="form-label fw-semibold">Email</label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                  placeholder="youremail@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>

              {/* Password */}
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPw((s) => !s)}
                  disabled={loading}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block">{fieldErrors.password}</div>
                )}
              </div>

              {/* Confirm Password */}
              <label className="form-label fw-semibold">Confirm Password</label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-white">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPw((s) => !s)}
                  disabled={loading}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div className="invalid-feedback d-block mb-4">
                  {fieldErrors.confirmPassword}
                </div>
              )}
              <br></br>
              <button
                type="submit"
                className="btn btn-primary w-100 btn-lg rounded-pill"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="text-center text-muted small mt-3">
              By signing up, you agree to our Terms & Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
