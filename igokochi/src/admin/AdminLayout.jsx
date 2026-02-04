import {NavLink, Outlet, useNavigate} from "react-router-dom";
import {clearToken} from "./auth";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate("/admin/login", {replace: true});
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.dot} />
          <div className={styles.title}>Igokochi Admin</div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/admin/dashboard"
            className={({isActive}) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Dashboard
          </NavLink>

          <button className={styles.logout} onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
