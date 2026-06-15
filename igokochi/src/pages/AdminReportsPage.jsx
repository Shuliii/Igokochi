import {useState} from "react";
import {useNavigate} from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import {apiGet, apiGetBlob, forceLogout} from "../admin/api";
import styles from "./AdminReportsPage.module.css";
import pageStyles from "./AdminPage.module.css";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtSlot(slot) {
  if (!slot) return "";
  const [hh, mm] = slot.split(":").map(Number);
  const suffix = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}.${String(mm).padStart(2, "0")}${suffix}`;
}

function parseItems(raw) {
  let items = raw;
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return Array.isArray(items) ? items : [];
}

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const today = todayYmd();

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [orders, setOrders] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [netError, setNetError] = useState(false);

  const onLogout = () => {
    forceLogout();
    navigate("/admin/login", {replace: true, state: {reason: "logged_out"}});
  };

  const handleSessionExpired = (err) => {
    if (err?.code === "SESSION_EXPIRED") {
      navigate("/admin/login", {replace: true, state: {reason: "expired"}});
      return true;
    }
    return false;
  };

  const handleSearch = async () => {
    if (!from || !to) return;
    setLoading(true);
    setNetError(false);
    try {
      const data = await apiGet(`/reports/orders?from=${from}&to=${to}`);
      setOrders(data.orders || []);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (err) {
      if (handleSessionExpired(err)) return;
      setNetError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await apiGetBlob(`/reports/orders/pdf?from=${from}&to=${to}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `igokochi-orders-${from}-to-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (handleSessionExpired(err)) return;
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <AdminHeader onLogout={onLogout} />

      {netError && (
        <div className={pageStyles.netError}>
          Connection issue. Please try again.
        </div>
      )}

      <AdminMain>
        {/* DATE RANGE */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Order Report</h2>

          <div className={styles.rangePill}>
            <div className={styles.rangeField}>
              <span className={styles.rangeLabel}>From</span>
              <input
                type="date"
                className={styles.dateInput}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <span className={styles.rangeSep}>→</span>

            <div className={styles.rangeField}>
              <span className={styles.rangeLabel}>To</span>
              <input
                type="date"
                className={styles.dateInput}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.searchBtn}
            disabled={!from || !to || loading}
            onClick={handleSearch}
          >
            {loading ? "Loading…" : "Search"}
          </button>
        </section>

        {/* RESULTS */}
        {orders !== null && (
          <section className={styles.section}>
            {orders.length === 0 ? (
              <p className={styles.empty}>No paid or done orders for this period.</p>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Pickup</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className={styles.tdId}>{o.id}</td>
                          <td className={styles.tdName}>{o.customer_name}</td>
                          <td className={styles.tdPickup}>
                            <span className={styles.pickupDate}>{fmtDate(o.pickup_date)}</span>
                            <span className={styles.pickupSlot}>{fmtSlot(o.pickup_slot)}</span>
                          </td>
                          <td className={styles.tdItems}>
                            {parseItems(o.items).map((item, idx) => (
                              <div key={idx} className={styles.itemLine}>
                                {item.name}
                                <span className={styles.itemQty}> ×{item.qty}</span>
                              </div>
                            ))}
                          </td>
                          <td className={styles.tdTotal}>
                            ${Number(o.total).toFixed(2)}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles[`badge_${o.status}`]}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.summary}>
                  <span className={styles.summaryCount}>
                    {orders.length} order{orders.length !== 1 ? "s" : ""}
                  </span>
                  <span className={styles.summaryRevenue}>
                    Total <strong>${Number(totalRevenue).toFixed(2)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.pdfBtn}
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  {downloading ? "Generating…" : "Download PDF"}
                </button>
              </>
            )}
          </section>
        )}
      </AdminMain>
    </>
  );
}
