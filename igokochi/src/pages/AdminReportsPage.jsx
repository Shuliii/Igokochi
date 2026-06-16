import {useState, forwardRef} from "react";
import {useNavigate} from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import {apiGet, apiGetBlob, forceLogout} from "../admin/api";
import styles from "./AdminReportsPage.module.css";
import pageStyles from "./AdminPage.module.css";

function dateToYmd(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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


const DateField = forwardRef(({value, onClick, label}, ref) => (
  <button type="button" className={styles.dateField} onClick={onClick} ref={ref}>
    <span className={styles.dateFieldLabel}>{label}</span>
    <span className={styles.dateFieldValue}>{value || "—"}</span>
  </button>
));
DateField.displayName = "DateField";

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [orders, setOrders] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [netError, setNetError] = useState(false);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

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
    const from = dateToYmd(fromDate);
    const to = dateToYmd(toDate);
    if (!from || !to) return;
    setLoading(true);
    setNetError(false);
    try {
      const data = await apiGet(`/reports/orders?from=${from}&to=${to}`);
      setOrders(data.orders || []);
      setTotalRevenue(data.totalRevenue || 0);
      setPage(1);
    } catch (err) {
      if (handleSessionExpired(err)) return;
      setNetError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const from = dateToYmd(fromDate);
    const to = dateToYmd(toDate);
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
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              maxDate={toDate}
              dateFormat="d MMM yyyy"
              customInput={<DateField label="FROM" />}
              withPortal
            />

            <span className={styles.rangeSep}>→</span>

            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              minDate={fromDate}
              dateFormat="d MMM yyyy"
              customInput={<DateField label="TO" />}
              withPortal
            />
          </div>

          <button
            type="button"
            className={styles.searchBtn}
            disabled={!fromDate || !toDate || loading}
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
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Math.ceil(orders.length / PAGE_SIZE) > 1 && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ←
                    </button>
                    <span className={styles.pageInfo}>
                      {page} / {Math.ceil(orders.length / PAGE_SIZE)}
                    </span>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={page === Math.ceil(orders.length / PAGE_SIZE)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      →
                    </button>
                  </div>
                )}

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
