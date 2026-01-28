import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeAuth } from "../../utils/auth";
import DashboardLayout from "./DashboardLayout";
import api from "../../utils/api";
import re from "../../assets/brands/re.jpg";
import yamaha from "../../assets/brands/yamaha.jpg";
import tvs from "../../assets/brands/tvs.jpg";
import hero from "../../assets/brands/hero.jpg";
import honda from "../../assets/brands/honda.jpg";
import vespa from "../../assets/brands/vespa.jpg";
import triumph from "../../assets/brands/triumph.jpg";
import suzuki from "../../assets/brands/suzuki.jpg";
import ktm from "../../assets/brands/ktm.jpg";
import bajaj from "../../assets/brands/bajaj.jpg";
import bmw from "../../assets/brands/bmw.jpg";
import benelli from "../../assets/brands/benelli.jpg";
import ducati from "../../assets/brands/ducati.jpg";
import aprilia from "../../assets/brands/apriliajpg.jpg";
import husqvarna from "../../assets/brands/husqvarna.jpg";

export default function MyBikes() {
  const navigate = useNavigate();
  const [bikeForm, setBikeForm] = useState({
    company: "",
    model: "",
    registration: "",
    color: "",
    useNewNumber: false,
    state: "",
    newRegistration: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingBikes, setLoadingBikes] = useState(false);
  const [bikes, setBikes] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }
  const fullName = user?.fullName || "User";

  const handleLogout = () => {
    removeAuth();
    navigate("/landing", { replace: true });
  };

  const fetchBikes = async () => {
    try {
      setLoadingBikes(true);
      const res = await api.get("/users/bikes");
      setBikes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bikes");
    } finally {
      setLoadingBikes(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      if (!isEditing && bikes.length > 0) {
        setError("You can only save one bike");
        return;
      }
      const payload = {
        company: bikeForm.company,
        model: bikeForm.model,
        registration: bikeForm.registration,
        color: bikeForm.color,
        useNewNumber: bikeForm.useNewNumber,
        state: bikeForm.useNewNumber ? bikeForm.state : undefined,
        newRegistration: bikeForm.useNewNumber ? bikeForm.newRegistration : undefined,
      };
      if (isEditing && editingId) {
        await api.put(`/users/bikes/${editingId}`, payload);
        setSuccess("Bike updated");
      } else {
        await api.post("/users/bikes", payload);
        setSuccess("Bike saved");
      }
      setBikeForm({
        company: "",
        model: "",
        registration: "",
        color: "",
        useNewNumber: false,
        state: "",
        newRegistration: "",
      });
      setIsEditing(false);
      setEditingId(null);
      fetchBikes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save bike");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout active="bikes" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loadingBikes ? (
            <div className="text-muted">Loading...</div>
          ) : bikes.length > 0 && !isEditing ? (
            <SavedBike
              bike={bikes[0]}
              detailsOpen={detailsOpen}
              onToggle={() => setDetailsOpen((prev) => !prev)}
              onEdit={() => {
                const bike = bikes[0];
                setBikeForm({
                  company: bike.company || "",
                  model: bike.model || "",
                  registration: bike.registration_no || "",
                  color: bike.color || "",
                  useNewNumber: Boolean(bike.use_new_number),
                  state: bike.state || "",
                  newRegistration: bike.new_registration_no || "",
                });
                setEditingId(bike.id);
                setIsEditing(true);
                setDetailsOpen(true);
              }}
            />
          ) : (
            <BikeForm
              form={bikeForm}
              setForm={setBikeForm}
              onSave={handleSave}
              saving={saving}
              isEditing={isEditing}
              onCancel={() => {
                setIsEditing(false);
                setEditingId(null);
                setBikeForm({
                  company: "",
                  model: "",
                  registration: "",
                  color: "",
                  useNewNumber: false,
                  state: "",
                  newRegistration: "",
                });
              }}
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function SavedBike({ bike, detailsOpen, onToggle, onEdit }) {
  const logoMap = {
    "Royal Enfield": re,
    Yamaha: yamaha,
    TVS: tvs,
    Hero: hero,
    Honda: honda,
    Vespa: vespa,
    Triumph: triumph,
    Suzuki: suzuki,
    KTM: ktm,
    Bajaj: bajaj,
    BMW: bmw,
    Benelli: benelli,
    Ducati: ducati,
    Aprilia: aprilia,
    Husqvarna: husqvarna,
  };

  const logoSrc = logoMap[bike.company];

  return (
    <div className="bike-card">
      <div className="bike-title">Saved Bike</div>
      <button type="button" className="bike-logo-card" onClick={onToggle}>
        {logoSrc ? (
          <img className="bike-logo" src={logoSrc} alt={bike.company} />
        ) : (
          <div className="bike-logo-fallback">{bike.company}</div>
        )}
        <div className="bike-logo-name">{bike.company}</div>
      </button>

      {detailsOpen && (
        <div className="bike-details">
          <div><strong>Model:</strong> {bike.model}</div>
          <div><strong>Registration:</strong> {bike.registration_no}</div>
          <div><strong>Color:</strong> {bike.color}</div>
          {bike.use_new_number && (
            <>
              <div><strong>State:</strong> {bike.state}</div>
              <div><strong>New Registration:</strong> {bike.new_registration_no}</div>
            </>
          )}
        </div>
      )}

      <div className="bike-actions">
        <button type="button" className="btn btn-outline-primary" onClick={onEdit}>
          Edit Bike
        </button>
      </div>
    </div>
  );
}

function BikeForm({ form, setForm, onSave, saving, isEditing, onCancel }) {
  const brands = [
    "Royal Enfield",
    "Yamaha",
    "TVS",
    "Hero",
    "Honda",
    "Vespa",
    "Triumph",
    "Suzuki",
    "KTM",
    "Bajaj",
    "BMW",
    "Benelli",
    "Ducati",
    "Aprilia",
    "Husqvarna",
  ];

  const models = [
    "Model 100",
    "Model 200",
    "Model 250",
    "Model 350",
    "Model 500",
  ];
  const modelsByCompany = {};

  const states = [
    "Bagmati",
    "Gandaki",
    "Karnali",
    "Koshi",
    "Lumbini",
    "Madhesh",
    "Sudurpashchim",
  ];

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bike-card">
      <div className="bike-title">{isEditing ? "Edit Bike" : "Add New Bike"}</div>
      <div className="bike-form-grid">
        <div className="bike-field">
          <label className="bike-label">Company*</label>
          <select
            className="form-select"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
          >
            <option value="">Select Company</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="bike-field">
          <label className="bike-label">Model*</label>
          {modelsByCompany[form.company]?.length ? (
            <select
              className="form-select"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
            >
              <option value="">Select Model</option>
              {modelsByCompany[form.company].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="form-control"
              placeholder="Enter model"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
            />
          )}
        </div>

        <div className="bike-field">
          <label className="bike-label">Registration No.*</label>
          <input
            type="text"
            className="form-control"
            placeholder="BA 33 PA 3333"
            value={form.registration}
            onChange={(e) => updateField("registration", e.target.value)}
          />
        </div>

        <div className="bike-field">
          <label className="bike-label">Color*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Eg: Red"
            value={form.color}
            onChange={(e) => updateField("color", e.target.value)}
          />
        </div>
      </div>

      <label className="bike-checkbox">
        <input
          type="checkbox"
          checked={form.useNewNumber}
          onChange={(e) => updateField("useNewNumber", e.target.checked)}
        />
        New Bike Number System (STATE 3 01 001 PA 0101)
      </label>

      {form.useNewNumber && (
        <div className="bike-form-grid">
          <div className="bike-field">
            <label className="bike-label">State*</label>
            <select
              className="form-select"
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="bike-field">
            <label className="bike-label">New Registration No*</label>
            <input
              type="text"
              className="form-control"
              placeholder="Eg: 01 001 PA 0101"
              value={form.newRegistration}
              onChange={(e) => updateField("newRegistration", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="bike-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : isEditing ? "Update Bike" : "Save Bike"}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
