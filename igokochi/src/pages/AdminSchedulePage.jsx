import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import {apiGet, apiPost, apiDelete, forceLogout} from "../admin/api";
import styles from "./AdminSchedulePage.module.css";
import pageStyles from "./AdminPage.module.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtHour(h) {
  if (h == null) return "";
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

function fmtRange(start, end) {
  return `${fmtHour(start)}–${fmtHour(end)}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const HOUR_OPTIONS = Array.from({length: 15}, (_, i) => i + 7); // 7am–9pm

export default function AdminSchedulePage() {
  const navigate = useNavigate();
  const [weekly, setWeekly] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [netError, setNetError] = useState(false);

  // Add form state
  const [date, setDate] = useState("");
  const [type, setType] = useState("closed");
  const [startHour, setStartHour] = useState(11);
  const [endHour, setEndHour] = useState(17);
  const [saving, setSaving] = useState(false);

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

  const fetchSchedule = async () => {
    try {
      const data = await apiGet("/schedule");
      setWeekly(data.weekly || []);
      setOverrides(data.overrides || []);
      setNetError(false);
    } catch (err) {
      if (handleSessionExpired(err)) return;
      console.error("Failed to fetch schedule", err);
      setNetError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      await apiPost("/schedule/overrides", {
        date,
        type,
        start_hour: type === "open" ? startHour : null,
        end_hour: type === "open" ? endHour : null,
      });
      setDate("");
      setType("closed");
      setStartHour(11);
      setEndHour(17);
      await fetchSchedule();
    } catch (err) {
      if (handleSessionExpired(err)) return;
      console.error("Failed to add override", err);
      setNetError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dateStr) => {
    try {
      await apiDelete(`/schedule/overrides/${dateStr}`);
      setOverrides((prev) => prev.filter((o) => o.date !== dateStr));
    } catch (err) {
      if (handleSessionExpired(err)) return;
      console.error("Failed to delete override", err);
    }
  };

  return (
    <>
      <AdminHeader onLogout={onLogout} />

      {netError && (
        <div className={pageStyles.netError}>Connection issue. Retrying…</div>
      )}

      <AdminMain>
        {/* BASE SCHEDULE */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Base Schedule</h2>
          <div className={styles.weekGrid}>
            {DAYS.map((label, idx) => {
              const row = weekly.find((r) => r.day_of_week === idx);
              const open = row?.enabled;
              return (
                <div
                  key={idx}
                  className={`${styles.dayCell} ${open ? styles.dayCellOpen : styles.dayCellClosed}`}
                >
                  <span className={styles.dayLabel}>{label}</span>
                  <span className={styles.dayHours}>
                    {open ? fmtRange(row.start_hour, row.end_hour) : "Closed"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ADD OVERRIDE */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Add Date Override</h2>
          <form className={styles.form} onSubmit={handleAdd}>
            <input
              type="date"
              className={styles.dateInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === "closed" ? styles.typeBtnActive : ""}`}
                onClick={() => setType("closed")}
              >
                Close day
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === "open" ? styles.typeBtnActive : ""}`}
                onClick={() => setType("open")}
              >
                Custom hours
              </button>
            </div>

            {type === "open" && (
              <div className={styles.hoursRow}>
                <select
                  className={styles.hourSelect}
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>{fmtHour(h)}</option>
                  ))}
                </select>
                <span className={styles.hourSep}>to</span>
                <select
                  className={styles.hourSelect}
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>{fmtHour(h)}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className={styles.addBtn} disabled={saving || !date}>
              {saving ? "Saving…" : "Add"}
            </button>
          </form>
        </section>

        {/* OVERRIDE LIST */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Date Overrides</h2>

          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : overrides.filter((o) => o.date >= todayYmd()).length === 0 ? (
            <p className={styles.empty}>No upcoming overrides.</p>
          ) : (
            <ul className={styles.overrideList}>
              {overrides.filter((o) => o.date >= todayYmd()).map((o) => (
                <li key={o.date} className={styles.overrideItem}>
                  <div className={styles.overrideLeft}>
                    <span className={styles.overrideDate}>{fmtDate(o.date)}</span>
                    <span
                      className={`${styles.badge} ${o.type === "closed" ? styles.badgeClosed : styles.badgeOpen}`}
                    >
                      {o.type === "closed" ? "Closed" : fmtRange(o.start_hour, o.end_hour)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(o.date)}
                    aria-label={`Remove override for ${o.date}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminMain>
    </>
  );
}
