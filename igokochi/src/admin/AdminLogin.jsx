import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import styles from "./AdminLogin.module.css";

const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "https://igokochihouse.com/api";

// LocalStorage keys (Igokochi-specific)
const LS_TOKEN = "igokochi_token";
const LS_IS_LOGGED_IN = "igokochi_isLoggedIn";
const LS_PROFILE = "igokochi_profile";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in (token exists), skip login
  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN);
    if (token) navigate("/admin", {replace: true});
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${AUTH_BASE_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
      });

      const response = await res.json();

      // ✅ your exact criteria style:
      if (response.token && Number(response.isActive) === 1) {
        localStorage.setItem(LS_TOKEN, response.token);
        localStorage.setItem(LS_IS_LOGGED_IN, "true");
        localStorage.setItem(LS_PROFILE, username);

        navigate(from, {replace: true});
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <h1 className={styles.title}>Igokochi Admin</h1>
        <p className={styles.sub}>Staff login</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          Username
          <input
            className={styles.input}
            placeholder="e.g. admin01"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button className={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
