// src/components/admin/AdminMain.jsx
import styles from "./AdminMain.module.css";

const AdminMain = ({ children }) => {
  return <main className={styles.main}>{children}</main>;
};

export default AdminMain;
