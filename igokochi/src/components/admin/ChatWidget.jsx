import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {MessageCircle, X, Send} from "lucide-react";
import {apiPost, apiPatch} from "../../admin/api";
import ErrorBanner from "../ErrorBanner";
import ConfirmDialog from "../ConfirmDialog";
import styles from "./ChatWidget.module.css";

const SUGGESTIONS = ["How many orders today?", "What sold best this week?"];

function toYmd(raw) {
  return String(raw || "").slice(0, 10);
}

function formatSlot(hhmm) {
  if (!hhmm) return "";
  const [hhStr, mmStr] = String(hhmm).split(":");
  const h = Number(hhStr);
  const m = Number(mmStr);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}.${String(m).padStart(2, "0")}${suffix}`;
}

function pendingActionTitle(pendingAction) {
  if (!pendingAction) return "";
  const {newDate, newTime} = pendingAction;
  if (newDate && newTime) return "Change pickup date & time?";
  if (newTime) return "Change pickup time?";
  return "Change pickup date?";
}

function describePendingAction(pendingAction) {
  const {orderId, customerName, oldDate, newDate, oldTime, newTime} = pendingAction;
  const changes = [];
  if (newDate) changes.push(`date from ${toYmd(oldDate)} to ${toYmd(newDate)}`);
  if (newTime) changes.push(`time from ${formatSlot(oldTime)} to ${formatSlot(newTime)}`);
  return `Order #${orderId} (${customerName}) will move ${changes.join(" and ")}.`;
}

function getDisplayText(message) {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }
  return "";
}

export default function ChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Mounted once at the App level (not per-page) so it survives navigation
  // between admin pages — only its own open/closed + conversation state
  // decides whether it's visible, not the route.
  const isAdminRoute =
    location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";

  if (!isAdminRoute) return null;

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, {role: "user", content: trimmed}];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/admin/chat", {messages: nextMessages});
      setMessages([...nextMessages, data.assistantMessage]);
      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
        setConfirmOpen(true);
      }
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {replace: true, state: {reason: "expired"}});
        return;
      }

      let message = err.message || "Something went wrong";
      try {
        const parsed = JSON.parse(message);
        if (parsed?.message) message = parsed.message;
      } catch {
        // not JSON — use the raw message as-is
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickupChange = async () => {
    if (!pendingAction) return;
    const {orderId, newDate, newTime} = pendingAction;

    try {
      if (newDate) await apiPatch(`/orders/${orderId}/pickup-date`, {pickupDate: newDate});
      if (newTime) await apiPatch(`/orders/${orderId}/pickup-slot`, {pickupSlot: newTime});

      const parts = [];
      if (newDate) parts.push(`date to ${toYmd(newDate)}`);
      if (newTime) parts.push(`time to ${formatSlot(newTime)}`);

      setMessages((prev) => [
        ...prev,
        {role: "assistant", content: `Order #${orderId} pickup ${parts.join(" and ")} updated.`},
      ]);
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {replace: true, state: {reason: "expired"}});
        return;
      }

      let message = err.message || "Failed to update pickup date/time";
      try {
        const parsed = JSON.parse(message);
        if (parsed?.message) message = parsed.message;
      } catch {
        // not JSON — use the raw message as-is
      }
      setError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Ask about your data</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.messageList} ref={listRef}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <p>Ask me about orders, sales, or trends — I only read data, I can&apos;t change anything.</p>
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={styles.suggestionChip}
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.role === "user" ? styles.userBubble : styles.assistantBubble}
              >
                {getDisplayText(m)}
              </div>
            ))}

            {loading && (
              <div className={styles.thinking} aria-label="Thinking">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <ErrorBanner message={error} onDismiss={() => setError("")} />

          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={pendingActionTitle(pendingAction)}
        description={pendingAction && describePendingAction(pendingAction)}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirmPickupChange}
      />
    </div>
  );
}
