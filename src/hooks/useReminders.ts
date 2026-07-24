import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import { dayProgress } from "@/lib/stats";
import { todayKey } from "@/lib/date";

const LAST_KEY = "aurora:last-reminder";

/** Локальные ежедневные напоминания, пока вкладка открыта / PWA активна. */
export const useReminders = () => {
  const { state } = useData();
  const { reminders, reminderTime } = state.settings;

  useEffect(() => {
    if (!reminders || !("Notification" in window) || Notification.permission !== "granted") return;

    const tick = () => {
      const now = new Date();
      const hhmm = `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
      if (hhmm < reminderTime) return;
      if (localStorage.getItem(LAST_KEY) === todayKey()) return;
      localStorage.setItem(LAST_KEY, todayKey());
      const p = dayProgress(state.goals.filter((g) => !g.vault));
      new Notification("Aurora · план дня", {
        body: p.total
          ? `Выполнено ${p.done} из ${p.total} (${p.percent}%). Продолжай в том же духе!`
          : "На сегодня целей нет. Самое время поставить одну ✨",
        icon: "/icons/icon-512.png",
      });
    };

    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [reminders, reminderTime, state.goals]);
};
