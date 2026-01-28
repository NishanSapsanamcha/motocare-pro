import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../../utils/api";
import "./Profile.css";

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(36, "Full name must not exceed 36 characters"),
  email: z.string().email("Please enter valid email"),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[+0-9 ()-]{7,20}$/.test(val),
      "Phone number must be valid"
    ),
});

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarData, setAvatarData] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      user = null;
    }

    const imageBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "") || "http://localhost:4000";
    const avatarUrl = user?.avatarUrl || "";
    const avatarSrc = avatarUrl
      ? avatarUrl.startsWith("http")
        ? avatarUrl
        : `${imageBaseUrl}${avatarUrl}`
      : "";

    setForm({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setAvatarPreview(avatarSrc);
  }, []);

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

    const parsed = profileSchema.safeParse(form);
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
      const res = await api.put("/users/me", {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phoneNumber: parsed.data.phoneNumber || null,
      });

      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("user-updated"));
      setSuccessMsg("Profile updated.");
    } catch {
      setErrorMsg("Network error. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    setErrorMsg("");
    setSuccessMsg("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setAvatarData(result);
      setAvatarPreview(result);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarData) {
      setErrorMsg("Please choose an image first.");
      return;
    }
    try {
      setAvatarUploading(true);
      const res = await api.put("/users/me/avatar", { imageData: avatarData });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("user-updated"));
      const imageBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "") || "http://localhost:4000";
      const nextAvatar = res.data.user.avatarUrl || "";
      setAvatarPreview(nextAvatar ? `${imageBaseUrl}${nextAvatar}` : avatarPreview);
      setAvatarData("");
      setSuccessMsg("Profile image updated.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <button
          type="button"
          className="profile-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left" />
          Back
        </button>

        <div className="profile-card">
          <div className="profile-head">
            <div>
              <h1>Profile</h1>
              <p>Update your details below.</p>
            </div>
            <div className="profile-ring">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="profile-avatar" />
              ) : (
                <i className="bi bi-person-circle" />
              )}
            </div>
          </div>

          {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

          <div className="mb-3">
            <label className="form-label fw-semibold">Profile Photo</label>
            <div className="d-flex flex-column gap-2">
              <input type="file" accept="image/*" className="form-control" onChange={handleAvatarChange} />
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4 align-self-start"
                onClick={handleAvatarUpload}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
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
              />
              {fieldErrors.fullName && (
                <div className="invalid-feedback">{fieldErrors.fullName}</div>
              )}
            </div>

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
              />
              {fieldErrors.email && (
                <div className="invalid-feedback">{fieldErrors.email}</div>
              )}
            </div>

            <label className="form-label fw-semibold">Phone Number</label>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white">
                <i className="bi bi-telephone" />
              </span>
              <input
                type="tel"
                name="phoneNumber"
                className={`form-control ${fieldErrors.phoneNumber ? "is-invalid" : ""}`}
                placeholder="98XXXXXXXX"
                value={form.phoneNumber}
                onChange={handleChange}
              />
              {fieldErrors.phoneNumber && (
                <div className="invalid-feedback">{fieldErrors.phoneNumber}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary rounded-pill px-4"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
