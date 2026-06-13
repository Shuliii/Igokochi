import {useState, useEffect} from "react";
import {fetchBookedSlots} from "../data/pickupData";

const INTERVAL_MS = 30000;

export function useBookedSlots(date) {
  const [bookedCounts, setBookedCounts] = useState({});

  useEffect(() => {
    if (!date) {
      setBookedCounts({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const counts = await fetchBookedSlots(date);
        if (!cancelled) setBookedCounts(counts);
      } catch {
        // silently fail — slots won't be blocked if fetch fails
      }
    };

    load();
    const id = setInterval(load, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [date]);

  return bookedCounts;
}
