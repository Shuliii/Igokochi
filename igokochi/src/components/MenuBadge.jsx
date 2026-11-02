import { Sparkles, Flame, Crown, Clock } from "lucide-react";
import styles from "./MenuBadge.module.css";
import { findBadge } from "../utils/menuBadges";

const ICONS = {
  new: Sparkles,
  "must-try": Flame,
  bestseller: Crown,
  limited: Clock,
};

const STYLE_CLASS = {
  new: styles.new,
  "must-try": styles.mustTry,
  bestseller: styles.bestseller,
  limited: styles.limited,
};

const MenuBadge = ({ badge }) => {
  const def = findBadge(badge);
  if (!def) return null;

  const Icon = ICONS[def.id];

  return (
    <span className={`${styles.badge} ${STYLE_CLASS[def.id]}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {def.label}
    </span>
  );
};

export default MenuBadge;
