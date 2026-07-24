import type { Goal } from "@/types";
import { addDays, toKey, todayKey, fromKey, MONTHS_NOM, WEEKDAYS_SHORT, startOfWeek } from "@/lib/date";

export const keyOfIso = (iso?: string): string | null => (iso ? toKey(new Date(iso)) : null);

export const completionsByDay = (goals: Goal[]): Record<string, number> => {
  const map: Record<string, number> = {};
  goals.forEach((g) => {
    const k = g.status === "done" ? keyOfIso(g.completedAt) : null;
    if (k) map[k] = (map[k] || 0) + 1;
  });
  return map;
};

export const goalsOfDay = (goals: Goal[], key: string): Goal[] =>
  goals.filter((g) => g.deadline === key || keyOfIso(g.completedAt) === key);

export const dayProgress = (goals: Goal[], key = todayKey()) => {
  const list = goalsOfDay(goals, key);
  const done = list.filter((g) => g.status === "done").length;
  const failed = list.filter((g) => g.status === "failed").length;
  const total = list.length;
  return { list, done, failed, total, percent: total ? Math.round((done / total) * 100) : 0 };
};

export const streakOf = (goals: Goal[]): number => {
  const map = completionsByDay(goals);
  let streak = 0;
  const today = new Date();
  if (!map[toKey(today)] && !map[toKey(addDays(today, -1))]) return 0;
  let cursor = map[toKey(today)] ? today : addDays(today, -1);
  while (map[toKey(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const bestStreak = (goals: Goal[]): number => {
  const keys = Object.keys(completionsByDay(goals)).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  keys.forEach((k) => {
    const d = fromKey(k);
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  });
  return best;
};

export interface Point {
  label: string;
  value: number;
  key?: string;
}

export const weekSeries = (goals: Goal[], offset = 0): Point[] => {
  const map = completionsByDay(goals);
  const start = addDays(startOfWeek(new Date()), offset * 7);
  return WEEKDAYS_SHORT.map((label, i) => {
    const d = addDays(start, i);
    const k = toKey(d);
    return { label, value: map[k] || 0, key: k };
  });
};

export const monthSeries = (goals: Goal[], year: number, month: number): Point[] => {
  const map = completionsByDay(goals);
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const k = toKey(new Date(year, month, i + 1));
    return { label: `${i + 1}`, value: map[k] || 0, key: k };
  });
};

export const yearSeries = (goals: Goal[], year: number): Point[] => {
  const map = completionsByDay(goals);
  const totals = Array(12).fill(0) as number[];
  Object.entries(map).forEach(([k, v]) => {
    const d = fromKey(k);
    if (d.getFullYear() === year) totals[d.getMonth()] += v;
  });
  return totals.map((value, i) => ({ label: MONTHS_NOM[i].slice(0, 3), value }));
};

export const categoryBreakdown = (goals: Goal[]) => {
  const map: Record<string, { total: number; done: number }> = {};
  goals.forEach((g) => {
    map[g.categoryId] ||= { total: 0, done: 0 };
    map[g.categoryId].total += 1;
    if (g.status === "done") map[g.categoryId].done += 1;
  });
  return map;
};

export const overallStats = (goals: Goal[]) => {
  const done = goals.filter((g) => g.status === "done").length;
  const failed = goals.filter((g) => g.status === "failed").length;
  const active = goals.filter((g) => g.status === "active").length;
  const total = goals.length;
  return {
    done, failed, active, total,
    rate: total ? Math.round((done / total) * 100) : 0,
  };
};
