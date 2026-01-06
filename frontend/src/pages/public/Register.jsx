import { useState } from "react";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
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

  const handleChange = (e) => {
    setErrorMsg("");
    setSuccessMsg("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Basic validation
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.message || "Registration failed.");
        return;
      }

      setSuccessMsg("Account created successfully! Redirecting to login...");
      // Optional: store token if backend returns it
      if (data?.token) localStorage.setItem("token", data.token);

      // redirect after short delay
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setErrorMsg("Network error. Is your backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        {/* LEFT BRAND PANEL */}
        <div
          className="col-lg-6 d-none d-lg-flex position-relative text-white"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% 20%, rgba(255,122,24,0.22), transparent 55%)," +
              "linear-gradient(135deg, #071827 0%, #020b14 100%)",
            padding: "64px",
          }}
        >
          <div className="w-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-4"
                  style={{
                    width: 88,
                    height: 88,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                  }}
                >
                  <img
                    src={logo}
                    alt="Motocare Pro"
                    style={{ width: 70, height: 70 }}
                  />
                </div>

                <div>
                  <div className="fw-bold fs-4">Motocare Pro</div>
                  <div className="text-white-50">Best two-wheeler servicing</div>
                </div>
              </div>

              <div className="mt-5">
                <h1 className="display-5 fw-bold lh-sm mb-3">
                  Create Your <br /> Motocare Account
                </h1>

                <p className="text-white-50 fs-5" style={{ maxWidth: 520 }}>
                  Join Motocare Pro to book premium bike services, manage
                  appointments, and track service history — all in one place.
                </p>

                <div className="d-flex gap-2 mt-4 flex-wrap">
                  {["Trusted", "Fast", "Transparent"].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-2 rounded-pill fw-semibold"
                      style={{
                        background: "rgba(255,122,24,0.12)",
                        border: "1px solid rgba(255,122,24,0.22)",
                        color: "#ff7a18",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-white-50 small">
              © {new Date().getFullYear()} Motocare Pro
            </div>
          </div>
        </div>

        {/* RIGHT REGISTER FORM */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light">
          <div className="w-100" style={{ maxWidth: 520, padding: "40px 18px" }}>
            <div className="card border-0 shadow-sm" style={{ borderRadius: 18 }}>
              <div className="card-body p-4 p-md-5">
                <h2 className="fw-bold mb-1">Create account</h2>
                <p className="text-muted mb-4">
                  Sign up to get started with Motocare Pro
                </p>

                {/* Alerts */}
                {errorMsg && (
                  <div className="alert alert-danger py-2">{errorMsg}</div>
                )}
                {successMsg && (
                  <div className="alert alert-success py-2">{successMsg}</div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <label className="form-label fw-semibold">Full Name</label>
                  <div className="input-group input-group-lg mb-3">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-person" />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      className="form-control"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Email */}
                  <label className="form-label fw-semibold">Email</label>
                  <div className="input-group input-group-lg mb-3">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-envelope" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Password */}
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group input-group-lg mb-3">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-lock" />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      name="password"
                      className="form-control"
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
                  </div>

                  {/* Confirm Password */}
                  <label className="form-label fw-semibold">Confirm Password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    name="confirmPassword"
                    className="form-control form-control-lg mb-4"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white"
                    disabled={loading}
                    style={{
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #ff7a18 0%, #ff4d00 100%)",
                      boxShadow: "0 14px 30px rgba(255,122,24,0.25)",
                    }}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>

                  <div className="text-center mt-4">
                    <span className="text-muted">Already have an account?</span>{" "}
                    <Link
                      to="/login"
                      className="fw-bold text-decoration-none"
                      style={{ color: "#ff7a18" }}
                    >
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center text-muted small mt-3">
              By signing up, you agree to our Terms & Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
