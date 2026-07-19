import {X} from "lucide-react";
import styles from "./ErrorBanner.module.css";

const ErrorBanner = ({message, onDismiss}) => {
  if (!message) return null;

  return (
    <div className={styles.banner}>
      <span>{message}</span>
      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ErrorBanner;
