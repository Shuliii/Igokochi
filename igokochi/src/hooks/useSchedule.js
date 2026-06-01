import {useState, useEffect} from "react";
import {fetchSchedule} from "../data/pickupData";

const EMPTY_SCHEDULE = {
  PICKUP_HOURS_BY_DAY: {},
  EXTRA_PICKUP_HOURS_BY_DATE: {},
  CLOSED_PICKUP_DATES: [],
};

export function useSchedule() {
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let firstLoad = true;

    const load = async () => {
      try {
        const data = await fetchSchedule();
        if (!mounted) return;
        setSchedule((prev) => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(data);
          return prevStr !== nextStr ? data : prev;
        });
      } catch (err) {
        console.error("Schedule fetch error:", err);
      } finally {
        if (mounted && firstLoad) {
          firstLoad = false;
          setLoading(false);
        }
      }
    };

    load();
    const id = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return {schedule, loading};
}
