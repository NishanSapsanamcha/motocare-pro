import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import api from "../../utils/api";
import { removeAuth } from "../../utils/auth";

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export default function ServicingAppointmentDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const garageIdParam = searchParams.get("garageId") || "";

  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const defaultMaxPerSlot = Number(import.meta.env.VITE_APPOINTMENT_MAX_PER_SLOT || 2);
  const [slotInfo, setSlotInfo] = useState({});
  const [maxPerSlot, setMaxPerSlot] = useState(defaultMaxPerSlot);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    garageId: garageIdParam,
    kmRunning: "",
    serviceType: "",
    preferredDate: "",
    timeSlot: "",
    notes: "",
  });

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

  useEffect(() => {
    if (!garageIdParam) {
      navigate("/dashboard/servicing/appointment");
    }
  }, [garageIdParam, navigate]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, garageId: garageIdParam }));
  }, [garageIdParam]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const bikesRes = await api.get("/users/bikes");
        const bikes = Array.isArray(bikesRes.data.data) ? bikesRes.data.data : [];
        if (bikes.length === 0) {
          navigate("/dashboard/bikes");
          return;
        }
        if (active) {
          setBike(bikes[0]);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Failed to load appointment data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [navigate]);

  const minDate = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const availableSlots = useMemo(() => {
    if (!form.preferredDate) return timeSlots;
    const today = new Date();
    const isToday =
      form.preferredDate ===
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;
    if (!isToday) return timeSlots;
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    return timeSlots.filter((slot) => {
      const [h, m] = slot.split(":").map((v) => parseInt(v, 10));
      return h * 60 + m > nowMinutes;
    });
  }, [form.preferredDate]);

  useEffect(() => {
    let active = true;
    if (!form.preferredDate || !form.garageId) return undefined;
    const fetchAvailability = async () => {
      try {
        setSlotLoading(true);
        const res = await api.get("/users/appointments/availability", {
          params: { garageId: form.garageId, date: form.preferredDate },
        });
        if (active) {
          const data = res.data?.data || {};
          setSlotInfo(data.counts || {});
          setMaxPerSlot(Number(data.maxPerSlot || defaultMaxPerSlot));
        }
      } catch {
        if (active) {
          setSlotInfo({});
        }
      } finally {
        if (active) {
          setSlotLoading(false);
        }
      }
    };
    fetchAvailability();
    const intervalId = setInterval(fetchAvailability, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [form.preferredDate, form.garageId]);

  useEffect(() => {
    if (!form.timeSlot) return;
    const count = Number(slotInfo[form.timeSlot] || 0);
    if (count >= maxPerSlot) {
      setForm((prev) => ({ ...prev, timeSlot: "" }));
    }
  }, [slotInfo, maxPerSlot, form.timeSlot]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!form.garageId || !form.kmRunning || !form.serviceType || !form.preferredDate || !form.timeSlot) {
      setError("Please fill garage, km running, service type, date, and time slot");
      return;
    }
    try {
      setSaving(true);
      await api.post("/users/appointments", {
        bikeId: bike.id,
        garageId: form.garageId,
        kmRunning: form.kmRunning,
        serviceType: form.serviceType,
        preferredDate: form.preferredDate,
        timeSlot: form.timeSlot,
        notes: form.notes,
      });
      setSuccess("Appointment created");
      setForm({
        garageId: form.garageId,
        kmRunning: "",
        serviceType: "",
        preferredDate: "",
        timeSlot: "",
        notes: "",
      });
      navigate("/dashboard/bikes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout active="servicing" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">Appointment Details</div>
          <div className="dash-subtitle">Fill the details to confirm your booking</div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : (
            <>
              {bike && (
                <div className="appointment-card">
                  <div className="appointment-card-title">Your Bike</div>
                  <div className="appointment-grid">
                    <div><strong>Company:</strong> {bike.company}</div>
                    <div><strong>Model:</strong> {bike.model}</div>
                    <div><strong>Registration:</strong> {bike.registration_no}</div>
                    <div><strong>Color:</strong> {bike.color}</div>
                    {bike.use_new_number && (
                      <>
                        <div><strong>State:</strong> {bike.state}</div>
                        <div><strong>New Reg:</strong> {bike.new_registration_no}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="appointment-card">
                <div className="appointment-card-title">Appointment Details</div>
                <div className="appointment-form-grid">
                  <div className="appointment-field">
                    <label className="appointment-label">KM Running*</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Eg: 12000"
                      value={form.kmRunning}
                      onChange={(e) => updateField("kmRunning", e.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="appointment-field">
                    <label className="appointment-label">Service Type*</label>
                    <select
                      className="form-select"
                      value={form.serviceType}
                      onChange={(e) => updateField("serviceType", e.target.value)}
                    >
                      <option value="">Select Service</option>
                      <option value="General Service">General Service</option>
                      <option value="Oil Change">Oil Change</option>
                      <option value="Engine Check">Engine Check</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Full Service">Full Service</option>
                    </select>
                  </div>

                  <div className="appointment-field">
                    <label className="appointment-label">Preferred Date*</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.preferredDate}
                      onChange={(e) => updateField("preferredDate", e.target.value)}
                      min={minDate}
                    />
                  </div>

                  <div className="appointment-field">
                    <label className="appointment-label">Time Slot*</label>
                    <div className="slot-grid">
                      {availableSlots.map((slot) => {
                        const count = Number(slotInfo[slot] || 0);
                        const isFull = count >= maxPerSlot;
                        const isSelected = form.timeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`slot-btn ${isFull ? "full" : ""} ${isSelected ? "selected" : ""}`}
                            onClick={() => updateField("timeSlot", slot)}
                            disabled={isFull}
                          >
                            <span>{slot}</span>
                            <small>{isFull ? "Full" : `${count}/${maxPerSlot}`}</small>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-muted small mt-2">
                      {slotLoading ? "Checking availability..." : "Slots update every 30 seconds."}
                    </div>
                  </div>
                </div>

                <div className="appointment-field">
                  <label className="appointment-label">Notes (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add any message for the garage..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                  />
                </div>

                <div className="appointment-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
