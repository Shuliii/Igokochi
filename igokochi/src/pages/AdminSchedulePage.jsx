import {useEffect, useState, forwardRef} from "react";
import {useNavigate} from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import {apiGet, apiPost, apiDelete, forceLogout} from "../admin/api";
import styles from "./AdminSchedulePage.module.css";
import pageStyles from "./AdminPage.module.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtHour(h) {
  if (h == null) return "";
  const totalMin = Math.round(h * 60);
  const hour = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return min > 0
    ? `${hour12}.${String(min).padStart(2, "0")}${suffix}`
    : `${hour12}${suffix}`;
}

function fmtRange(start, end) {
  return `${fmtHour(start)}–${fmtHour(end)}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateToYmd(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const ScheduleDateField = forwardRef(({value, onClick}, ref) => (
  <button
    type="button"
    className={`${styles.datePickerBtn} ${!value ? styles.datePickerBtnEmpty : ""}`}
    onClick={onClick}
    ref={ref}
  >
    {value || "Pick a date"}
  </button>
));
ScheduleDateField.displayName = "ScheduleDateField";

function fmtDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// 7:00am–9:00pm in 30-min steps → [7, 7.5, 8, 8.5, ..., 21]
const HOUR_OPTIONS = Array.from({length: 29}, (_, i) => 7 + i * 0.5);

export default function AdminSchedulePage() {
  const navigate = useNavigate();
  const [weekly, setWeekly] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [netError, setNetError] = useState(false);

  // Add form state
  const [date, setDate] = useState(null);
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
    const dateStr = dateToYmd(date);
    if (!dateStr) return;
    if (type === "open" && startHour >= endHour) {
      alert("Start time must be before end time.");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/schedule/overrides", {
        date: dateStr,
        type,
        start_hour: type === "open" ? startHour : null,
        end_hour: type === "open" ? endHour : null,
      });
      setDate(null);
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

  const today = todayYmd();
  const upcomingOverrides = overrides.filter((o) => o.date >= today);

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
            <DatePicker
              selected={date}
              onChange={(d) => setDate(d)}
              dateFormat="EEE, d MMM yyyy"
              customInput={<ScheduleDateField />}
              withPortal
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
          ) : upcomingOverrides.length === 0 ? (
            <p className={styles.empty}>No upcoming overrides.</p>
          ) : (
            <ul className={styles.overrideList}>
              {upcomingOverrides.map((o) => (
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
