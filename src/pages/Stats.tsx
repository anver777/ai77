import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Plus, Target, TrendingUp } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Card, Button, Segmented } from "@/components/ui";
import { AreaChart, BarChart, Heatmap } from "@/components/Charts";
import { GoalEditor } from "@/components/GoalEditor";
import {
  bestStreak, categoryBreakdown, completionsByDay, dayProgress, monthSeries,
  overallStats, streakOf, weekSeries, yearSeries,
} from "@/lib/stats";
import { MONTHS_NOM, WEEKDAYS_SHORT, monthMatrix, toKey, todayKey } from "@/lib/date";
import { cn } from "@/utils/cn";
import type { Goal } from "@/types";

type Period = "week" | "month" | "year";

export const Stats = () => {
  const { state, updateGoal } = useData();
  const goals = useMemo(() => state.goals.filter((g) => !g.vault), [state.goals]);
  const [period, setPeriod] = useState<Period>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayKey());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const map = useMemo(() => completionsByDay(goals), [goals]);
  const overall = useMemo(() => overallStats(goals), [goals]);
  const streak = streakOf(goals);
  const best = bestStreak(goals);
  const breakdown = useMemo(() => categoryBreakdown(goals), [goals]);

  const series = useMemo(() => {
    if (period === "week") return weekSeries(goals);
    if (period === "month") return monthSeries(goals, cursor.getFullYear(), cursor.getMonth());
    return yearSeries(goals, cursor.getFullYear());
  }, [goals, period, cursor]);

  const matrix = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const dayInfo = useMemo(() => dayProgress(goals, selected), [goals, selected]);
  const deadlineMap = useMemo(() => {
    const m: Record<string, number> = {};
    goals.forEach((g) => {
      if (g.deadline) m[g.deadline] = (m[g.deadline] || 0) + 1;
    });
    return m;
  }, [goals]);

  const shift = (delta: number) => {
    const d = new Date(cursor);
    if (period === "year") d.setFullYear(d.getFullYear() + delta);
    else d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat icon={<Flame size={15} className="text-[#ffb547]" />} label="Текущая серия" value={`${streak} дн.`} />
        <MiniStat icon={<TrendingUp size={15} className="text-[#34e5b0]" />} label="Рекорд серии" value={`${best} дн.`} />
        <MiniStat icon={<Target size={15} className="accent-text" />} label="Выполнено целей" value={`${overall.done}`} />
        <MiniStat icon={<CalendarDays size={15} className="text-[#8b5cf6]" />} label="Успешность" value={`${overall.rate}%`} />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Динамика</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} className="rounded-xl p-1.5 text-dim"><ChevronLeft size={16} /></button>
            <span className="min-w-[92px] text-center text-xs font-semibold">
              {period === "year"
                ? cursor.getFullYear()
                : period === "month"
                  ? `${MONTHS_NOM[cursor.getMonth()]} ${cursor.getFullYear()}`
                  : "Эта неделя"}
            </span>
            <button onClick={() => shift(1)} className="rounded-xl p-1.5 text-dim"><ChevronRight size={16} /></button>
          </div>
        </div>
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: "week", label: "Неделя" },
            { value: "month", label: "Месяц" },
            { value: "year", label: "Год" },
          ]}
        />
        <div className="mt-4">
          {period === "month" ? <AreaChart points={series} /> : <BarChart points={series} />}
        </div>
        <p className="mt-2 text-center text-xs text-dim">
          Всего выполнено за период:{" "}
          <span className="font-bold text-[var(--text-1)]">{series.reduce((a, p) => a + p.value, 0)}</span>
        </p>
      </Card>

      <Card className="p-4" delay={0.05}>
        <h3 className="mb-3 text-sm font-bold">Календарь</h3>
        <div className="mb-2 grid grid-cols-7 text-center text-[10px] text-faint">
          {WEEKDAYS_SHORT.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="space-y-1.5">
          {matrix.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1.5">
              {row.map((d, ci) => {
                if (!d) return <span key={ci} />;
                const key = toKey(d);
                const done = map[key] || 0;
                const planned = deadlineMap[key] || 0;
                const isToday = key === todayKey();
                const isSel = key === selected;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelected(key)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-xs font-semibold transition",
                      isSel ? "accent-grad text-white" : done ? "bg-white/10" : "bg-white/4 text-dim",
                      isToday && !isSel && "ring-1 ring-[var(--accent)]",
                    )}
                  >
                    {d.getDate()}
                    <span className="absolute bottom-1 flex gap-0.5">
                      {done > 0 && <span className="h-1 w-1 rounded-full bg-[#34e5b0]" />}
                      {planned > 0 && <span className="h-1 w-1 rounded-full bg-[#ffb547]" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">{selected}</p>
            <p className="text-[11px] text-dim">
              {dayInfo.done}/{dayInfo.total} выполнено · {dayInfo.percent}%
            </p>
          </div>
          <div className="mt-2 space-y-1.5">
            {dayInfo.list.slice(0, 5).map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setEditing(g);
                  setEditorOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    g.status === "done" ? "bg-[#34e5b0]" : g.status === "failed" ? "bg-[#ff5f7e]" : "bg-white/30",
                  )}
                />
                <span className={cn("flex-1 truncate text-xs", g.status !== "active" && "text-dim line-through")}>
                  {g.title}
                </span>
                <span
                  className="text-[10px] accent-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateGoal(g.id, { status: g.status === "done" ? "active" : "done" });
                  }}
                >
                  {g.status === "done" ? "✓" : "отметить"}
                </span>
              </button>
            ))}
            {dayInfo.list.length === 0 && <p className="text-xs text-faint">Задач на этот день нет</p>}
          </div>
          <Button
            variant="soft"
            className="mt-3 w-full"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus size={15} /> Задача на {selected.slice(8)}.{selected.slice(5, 7)}
          </Button>
        </div>
      </Card>

      <Card className="p-4" delay={0.1}>
        <h3 className="mb-3 text-sm font-bold">Активность за 18 недель</h3>
        <Heatmap map={map} />
      </Card>

      <Card className="p-4" delay={0.15}>
        <h3 className="mb-3 text-sm font-bold">По категориям</h3>
        <div className="space-y-3">
          {state.categories.map((c) => {
            const info = breakdown[c.id];
            if (!info) return null;
            const pct = info.total ? Math.round((info.done / info.total) * 100) : 0;
            return (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">{c.emoji} {c.name}</span>
                  <span className="text-dim">{info.done}/{info.total} · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${c.color}, var(--accent-2))` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <GoalEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        goal={editing}
        defaultDeadline={selected}
      />
    </div>
  );
};

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card className="p-3.5">
    <div className="flex items-center gap-2 text-[11px] text-dim">{icon}{label}</div>
    <p className="mt-1.5 text-xl font-extrabold accent-grad-text">{value}</p>
  </Card>
);
