import { useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">

        {/* LEFT PANEL */}
        <div
          className="col-lg-6 d-none d-lg-flex position-relative text-white"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% 20%, rgba(255,122,24,0.22), transparent 55%)," +
              "linear-gradient(135deg, #071827 0%, #020b14 100%)",
            padding: "64px",
            overflow: "hidden",
          }}
        >
          {/* subtle grid/pattern */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              opacity: 0.12,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              pointerEvents: "none",
            }}
          />

          <div className="position-relative w-100 d-flex flex-column justify-content-between">
            {/* top brand */}
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
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <img
                    src={logo}
                    alt="Motocare Pro"
                    style={{ width: 70, height: 70, objectFit: "contain" }}
                  />
                </div>

                <div>
                  <div className="fw-bold fs-4" style={{ letterSpacing: "0.3px" }}>
                    Motocare Pro
                  </div>
                  <div className="text-white-50">
                    Best two-wheeler servicing
                  </div>
                </div>
              </div>

              {/* big headline */}
              <div className="mt-5">
                <h1 className="display-5 fw-bold lh-sm mb-3">
                  Premium <br /> Service at Your Fingertips
                </h1>

                <p className="mb-0 text-white-50 fs-5" style={{ maxWidth: 520 }}>
                  Book trusted mechanics, track service updates, and enjoy
                  transparent pricing — fast and hassle-free.
                </p>

                {/* highlights */}
                <div className="d-flex flex-wrap gap-2 mt-4">
                  {[
                    { icon: "bi-shield-check", text: "Trusted" },
                    { icon: "bi-lightning-charge", text: "Fast" },
                    { icon: "bi-receipt", text: "Transparent" },
                  ].map((item) => (
                    <span
                      key={item.text}
                      className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                      style={{
                        background: "rgba(255,122,24,0.12)",
                        border: "1px solid rgba(255,122,24,0.22)",
                        color: "#ff7a18",
                        fontWeight: 600,
                      }}
                    >
                      <i className={`bi ${item.icon}`} />
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="text-white-50 small">
              © {year} Motocare Pro. All rights reserved.
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light">
          <div className="w-100" style={{ maxWidth: 520, padding: "40px 18px" }}>
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 18 }}
            >
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <h2 className="fw-bold mb-1">Welcome back</h2>
                    <div className="text-muted">
                      Login to continue to Motocare Pro
                    </div>
                  </div>

                  {/* show logo on mobile too */}
                  <div className="d-lg-none">
                    <img
                      src={logo}
                      alt="Motocare Pro"
                      style={{ width: 54, height: 54, objectFit: "contain" }}
                    />
                  </div>
                </div>

                <form className="mt-4" onSubmit={handleSubmit}>
                  {/* Email */}
                  <label className="form-label fw-semibold">
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-lg mb-3">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-envelope" />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password */}
                  <label className="form-label fw-semibold">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-lg mb-2">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-lock" />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((s) => !s)}
                      title={showPw ? "Hide password" : "Show password"}
                    >
                      <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="remember"
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Remember me
                      </label>
                    </div>

                    <a
                      href="/forgot-password"
                      className="text-decoration-none fw-semibold"
                      style={{ color: "#ff7a18" }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white"
                    style={{
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #ff7a18 0%, #ff4d00 100%)",
                      border: "none",
                      boxShadow: "0 14px 30px rgba(255, 122, 24, 0.25)",
                    }}
                  >
                    Login
                  </button>

                  <Link
                    to="/register"
                    className="fw-bold text-decoration-none"
                    style={{ color: "#ff7a18" }}
                  >
                    Sign up
                  </Link>

                </form>
              </div>
            </div>

            <div className="text-center text-muted small mt-3">
              By continuing, you agree to our Terms & Privacy Policy.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
