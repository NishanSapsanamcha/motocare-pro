import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { removeAuth } from "../../utils/auth";
import api from "../../utils/api";

export default function Rewards() {
  const navigate = useNavigate();
  const [openSet, setOpenSet] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ balance: 0, earned: 0, redeemed: 0 });
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

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

  const faqs = useMemo(
    () => [
      {
        q: "How do I earn Motocare Pro Reward Points?",
        a: "Reward points are assigned when you purchase services on Motocare Pro. Whenever you make payments for services provided by Motocare Pro, you earn Reward Points.",
      },
      {
        q: "Do I get Reward Points for every service?",
        a: "Yes, you will get reward points for every redeemable service available at the time of redemption.",
      },
      {
        q: "Can I transfer my reward points to another user?",
        a: "No, reward points are non-transferable and can only be redeemed by you from your account.",
      },
      {
        q: "Will I lose my reward points if I don't redeem them for a long time?",
        a: "No, your reward points will remain in your Motocare Pro account.",
      },
      {
        q: "Can I redeem my reward points partially?",
        a: "Yes, you have the option to redeem your reward points partially or fully.",
      },
      {
        q: "Are reward points redeemable for cash?",
        a: "No, reward points are not redeemable for cash.",
      },
      {
        q: "How do I calculate my Motocare Pro Reward Points?",
        a: "You can estimate reward points based on your service value. Service requests earn 50% of the value as points, and the maximum points earned per request is capped at 1000 points.",
      },
      {
        q: "How do I redeem my reward points?",
        a: "Rewards are redeemed during invoice payment. You can apply points while paying an issued invoice, subject to the minimum and maximum limits.",
      },
      {
        q: "What is the maximum points I can earn per request?",
        a: "You can earn a maximum of 1000 points per request for services.",
      },
    ],
    []
  );

  useEffect(() => {
    let active = true;
    const fetchRewards = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/users/rewards");
        const data = res.data?.data || {};
        if (active) {
          setSummary({
            balance: Number(data.balance || 0),
            earned: Number(data.earned || 0),
            redeemed: Number(data.redeemed || 0),
          });
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Failed to load rewards");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRewards();
    return () => {
      active = false;
    };
  }, []);

  const allOpen = openSet.size === faqs.length;

  const toggleAll = () => {
    if (allOpen) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(faqs.map((_, idx) => idx)));
    }
  };

  const toggleItem = (index) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <DashboardLayout active="rewards" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">Rewards</div>
          <div className="dash-subtitle">Learn about rewards and its benefits.</div>

          <div className="rewards-summary">
            <div className="rewards-summary-card">
              <div className="rewards-summary-label">Available Points</div>
              <div className="rewards-summary-value">{summary.balance}</div>
            </div>
            <div className="rewards-summary-card">
              <div className="rewards-summary-label">Points Earned</div>
              <div className="rewards-summary-value">{summary.earned}</div>
            </div>
            <div className="rewards-summary-card">
              <div className="rewards-summary-label">Points Redeemed</div>
              <div className="rewards-summary-value">{summary.redeemed}</div>
            </div>
          </div>

          <div className="rewards-history">
            <div className="rewards-history-title">Recent Activity</div>
            {loading ? (
              <div className="rewards-history-empty">Loading rewards...</div>
            ) : error ? (
              <div className="rewards-history-empty">{error}</div>
            ) : transactions.length === 0 ? (
              <div className="rewards-history-empty">No reward activity yet.</div>
            ) : (
              <ul className="rewards-history-list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="rewards-history-item">
                    <div>
                      <div className="rewards-history-main">
                        {tx.type === "EARN" ? "Service reward earned" : "Points redeemed"}
                      </div>
                      <div className="rewards-history-sub">
                        {tx.note || "Service completed"}
                      </div>
                    </div>
                    <div className={`rewards-history-points ${tx.type === "EARN" ? "earn" : "redeem"}`}>
                      {tx.type === "EARN" ? "+" : "-"}{tx.points}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rewards-faq-header">
            <div className="rewards-faq-title">FAQs</div>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={toggleAll}>
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>

          <div className="rewards-card">
            {faqs.map((item, index) => {
              const isOpen = openSet.has(index);
              return (
                <div key={item.q} className={`rewards-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="rewards-question"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="rewards-qtext">{index + 1}. {item.q}</span>
                    <span className="rewards-toggle" aria-hidden="true">
                      <i className={`bi ${isOpen ? "bi-dash-lg" : "bi-plus-lg"}`} />
                    </span>
                  </button>
                  {isOpen && <div className="rewards-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
