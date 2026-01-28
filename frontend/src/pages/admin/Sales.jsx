import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../utils/api";
import "./admin.css";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [garages, setGarages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [garageId, setGarageId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [datePreset, setDatePreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    let active = true;
    const loadGarages = async () => {
      try {
        const res = await api.get("/admin/garages");
        if (active) {
          setGarages(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (active) {
          setGarages([]);
        }
      }
    };
    loadGarages();
    return () => {
      active = false;
    };
  }, []);

  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const format = (d) => d.toISOString().slice(0, 10);
    if (datePreset === "today") {
      return { fromDate: format(now), toDate: format(now) };
    }
    if (datePreset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { fromDate: format(start), toDate: format(now) };
    }
    if (datePreset === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { fromDate: format(start), toDate: format(now) };
    }
    return { fromDate: customFrom, toDate: customTo };
  }, [datePreset, customFrom, customTo]);

  useEffect(() => {
    let active = true;
    const fetchSales = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/admin/sales", {
          params: {
            q: search || undefined,
            garageId: garageId || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
            paymentStatus: paymentStatus || undefined,
            page,
            limit,
            sort,
          },
        });
        if (active) {
          setSales(Array.isArray(res.data.data) ? res.data.data : []);
          setPages(res.data.pagination?.pages || 1);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Failed to load sales");
          setSales([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSales();
    return () => {
      active = false;
    };
  }, [search, garageId, fromDate, toDate, paymentStatus, page, limit, sort]);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const res = await api.get("/admin/sales/summary", {
          params: {
            from: fromDate || undefined,
            to: toDate || undefined,
            garageId: garageId || undefined,
          },
        });
        if (active) {
          setSummary(res.data.data || null);
        }
      } catch {
        if (active) setSummary(null);
      } finally {
        if (active) setLoadingSummary(false);
      }
    };
    fetchSummary();
    return () => {
      active = false;
    };
  }, [fromDate, toDate, garageId]);

  const clearFilters = () => {
    setSearch("");
    setGarageId("");
    setPaymentStatus("");
    setDatePreset("30d");
    setCustomFrom("");
    setCustomTo("");
    setSort("newest");
    setPage(1);
    setLimit(10);
  };

  const currency = (value) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" }).format(Number(value || 0));

  const trendData = Array.isArray(summary?.trend) ? summary.trend : [];
  const garageSalesData = Array.isArray(summary?.garageSales) ? summary.garageSales : [];
  const serviceTypeData = Array.isArray(summary?.serviceTypeSales) ? summary.serviceTypeSales : [];

  return (
    <div className="admin-page sales-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <h1>Sales Management</h1>
          <div className="admin-header-actions">
            <Link to="/admin/dashboard" className="btn btn-outline-light">
              <i className="bi bi-arrow-left me-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setPage(1)}>
            Retry
          </button>
        </div>
      )}

      <div className="sales-cards">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div className="sales-card skeleton" key={`card-${idx}`}>
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))
        ) : (
          <>
            <div className="sales-card">
              <div className="sales-card-label">Total Sales</div>
              <div className="sales-card-value">{currency(summary?.totalSales)}</div>
            </div>
            <div className="sales-card">
              <div className="sales-card-label">Total Orders</div>
              <div className="sales-card-value">{summary?.totalOrders || 0}</div>
            </div>
            <div className="sales-card">
              <div className="sales-card-label">Sales Today</div>
              <div className="sales-card-value">{currency(summary?.salesToday)}</div>
            </div>
            <div className="sales-card">
              <div className="sales-card-label">Top Garage</div>
              <div className="sales-card-value">{summary?.topGarage?.name || "-"}</div>
              <div className="sales-card-sub">{currency(summary?.topGarage?.total)}</div>
            </div>
          </>
        )}
      </div>

      <div className="sales-charts">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Sales Trend</h3>
            <div className="chart-sub">Daily / Weekly / Monthly</div>
          </div>
          <div className="chart-body">
            {loadingSummary ? (
              <div className="chart-skeleton skeleton" />
            ) : trendData.length === 0 ? (
              <div className="empty-note">No trend data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#ff7a18" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Sales by Garage</h3>
            <div className="chart-sub">Top 5 garages</div>
          </div>
          <div className="chart-body">
            {loadingSummary ? (
              <div className="chart-skeleton skeleton" />
            ) : garageSalesData.length === 0 ? (
              <div className="empty-note">No garage data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={garageSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#071827" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Sales by Service Type</h3>
            <div className="chart-sub">Service distribution</div>
          </div>
          <div className="chart-body">
            {loadingSummary ? (
              <div className="chart-skeleton skeleton" />
            ) : serviceTypeData.length === 0 ? (
              <div className="empty-note">No service data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={serviceTypeData}
                    dataKey="total"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#ff7a18"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="filter-section sales-filter">
        <input
          type="text"
          className="form-control"
          placeholder="Search by customer, service, garage, request id..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="form-select"
          value={garageId}
          onChange={(e) => {
            setGarageId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Garages</option>
          {garages.map((garage) => (
            <option key={garage.id} value={garage.id}>
              {garage.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={datePreset}
          onChange={(e) => {
            setDatePreset(e.target.value);
            setPage(1);
          }}
        >
          {DATE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>

        {datePreset === "custom" && (
          <>
            <input
              type="date"
              className="form-control"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setPage(1);
              }}
            />
            <input
              type="date"
              className="form-control"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setPage(1);
              }}
            />
          </>
        )}

        <select
          className="form-select"
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Payment Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          className="form-select"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_desc">Highest Amount</option>
          <option value="amount_asc">Lowest Amount</option>
        </select>

        <select
          className="form-select"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="table-responsive sales-table">
        <table className="table">
          <thead>
            <tr>
              <th>Sale / Request ID</th>
              <th>Customer</th>
              <th>Garage</th>
              <th>Service Type</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td colSpan="8">
                    <div className="table-skeleton skeleton" />
                  </td>
                </tr>
              ))
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.request_id || sale.id}</td>
                  <td>
                    <div className="text-dark fw-semibold">{sale.user?.full_name || "-"}</div>
                    <div className="text-muted small">{sale.user?.phone || sale.user?.email || "-"}</div>
                  </td>
                  <td>
                    <div className="text-dark fw-semibold">{sale.garage?.name || "-"}</div>
                    <div className="text-muted small">{sale.garage?.address || "-"}</div>
                  </td>
                  <td>{sale.service_type || "-"}</td>
                  <td className="fw-semibold">{currency(sale.total_amount)}</td>
                  <td>
                    <div className="text-dark fw-semibold">{sale.payment_method || "-"}</div>
                    <div className="text-muted small">{sale.payment_status || "-"}</div>
                  </td>
                  <td>{sale.created_at ? new Date(sale.created_at).toLocaleString() : "-"}</td>
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <i className="bi bi-eye" />
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => window.open(sale.invoice_url || `/admin/sales/${sale.id}/invoice`, "_blank")}
                        disabled={!sale.invoice_url && !sale.id}
                      >
                        <i className="bi bi-download" />
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-title">No sales found</div>
                    <div className="empty-sub">Try adjusting your filters or date range.</div>
                    <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="pagination-controls">
          <div className="pagination-info">
            Page {page} of {pages}
          </div>
          <div className="pagination-buttons">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page === pages}
              onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Sale #{selectedSale.request_id || selectedSale.id}</h3>
              <button type="button" className="modal-close" onClick={() => setSelectedSale(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Customer</h6>
                  <p className="mb-0">{selectedSale.user?.full_name || "-"}</p>
                  <p className="text-muted small">{selectedSale.user?.phone || selectedSale.user?.email || "-"}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Garage</h6>
                  <p className="mb-0">{selectedSale.garage?.name || "-"}</p>
                  <p className="text-muted small">{selectedSale.garage?.address || "-"}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Service Type</h6>
                  <p className="mb-0">{selectedSale.service_type || "-"}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Payment</h6>
                  <p className="mb-0">{selectedSale.payment_method || "-"}</p>
                  <p className="text-muted small">{selectedSale.payment_status || "-"}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Total</h6>
                  <p className="mb-0">{currency(selectedSale.total_amount)}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Date</h6>
                  <p className="mb-0">
                    {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedSale(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.open(selectedSale.invoice_url || `/admin/sales/${selectedSale.id}/invoice`, "_blank")}
                disabled={!selectedSale.invoice_url && !selectedSale.id}
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
