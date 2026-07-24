import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Flame, Lock, Plus, Quote as QuoteIcon, Sparkles } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button, Card, ProgressRing } from "@/components/ui";
import { GoalCard } from "@/components/GoalCard";
import { GoalEditor } from "@/components/GoalEditor";
import { dayProgress, streakOf } from "@/lib/stats";
import { formatLong, greeting, todayKey } from "@/lib/date";
import { quoteOfDay } from "@/lib/quotes";
import type { Goal } from "@/types";

export const Home = ({ onNavigate }: { onNavigate: (t: "goals" | "stats" | "vault") => void }) => {
  const { state, updateGoal } = useData();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);

  const publicGoals = useMemo(() => state.goals.filter((g) => !g.vault), [state.goals]);
  const progress = useMemo(() => dayProgress(publicGoals), [publicGoals]);
  const streak = useMemo(() => streakOf(state.goals), [state.goals]);
  const quote = quoteOfDay(todayKey());

  const upcoming = useMemo(
    () =>
      publicGoals
        .filter((g) => g.status === "active")
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
          if (a.deadline) return -1;
          if (b.deadline) return 1;
          return a.order - b.order;
        })
        .slice(0, 4),
    [publicGoals],
  );

  const cat = (id: string) => state.categories.find((c) => c.id === id);

  return (
    <div className="space-y-4 px-4 pb-32 pt-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="glass flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-2xl">
          {state.settings.avatar.startsWith("data:")
            ? <img src={state.settings.avatar} alt="" className="h-full w-full object-cover" />
            : state.settings.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-dim">{greeting()},</p>
          <p className="truncate text-lg font-bold">{state.settings.displayName}</p>
        </div>
        <button onClick={() => onNavigate("vault")} className="glass rounded-2xl p-3 text-dim">
          <Lock size={18} />
        </button>
      </motion.div>

      <Card className="relative overflow-hidden p-5" delay={0.05}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full accent-grad opacity-20 blur-3xl" />
        <div className="flex items-center gap-2 text-xs text-dim">
          <CalendarDays size={14} className="accent-text" />
          {formatLong(new Date())}
        </div>
        <div className="mt-4 flex items-center gap-5">
          <ProgressRing percent={progress.percent}>
            <span className="text-3xl font-extrabold accent-grad-text">{progress.percent}%</span>
            <span className="text-[10px] text-dim">прогресс дня</span>
          </ProgressRing>
          <div className="flex-1 space-y-2.5">
            <Stat label="Выполнено" value={`${progress.done}`} tone="#34e5b0" />
            <Stat label="Осталось" value={`${Math.max(0, progress.total - progress.done - progress.failed)}`} tone="var(--accent)" />
            <Stat label="Пропущено" value={`${progress.failed}`} tone="#ff5f7e" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2.5">
          <Flame size={16} className="text-[#ffb547]" />
          <p className="text-xs text-dim">
            Серия выполнения: <span className="font-bold text-[var(--text-1)]">{streak} дн.</span>
          </p>
          <button onClick={() => onNavigate("stats")} className="ml-auto flex items-center gap-1 text-xs accent-text">
            Статистика <ChevronRight size={13} />
          </button>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-5" delay={0.1}>
        <QuoteIcon size={40} className="absolute -right-1 -top-1 opacity-10" />
        <p className="text-sm leading-relaxed">«{quote.text}»</p>
        <p className="mt-2 text-xs accent-text">— {quote.author}</p>
      </Card>

      <div className="flex items-center justify-between pt-1">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Sparkles size={16} className="accent-text" /> Ближайшие задачи
        </h2>
        <button onClick={() => onNavigate("goals")} className="text-xs text-dim">Все цели</button>
      </div>

      <div className="space-y-2.5">
        {upcoming.length === 0 && (
          <Card className="p-6 text-center text-sm text-dim">
            На сегодня всё чисто. Самое время поставить новую цель ✨
          </Card>
        )}
        {upcoming.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            category={cat(g.categoryId)}
            onOpen={() => {
              setEditing(g);
              setOpen(true);
            }}
            onStatus={(status) => updateGoal(g.id, { status })}
            onPin={() => updateGoal(g.id, { pinned: !g.pinned })}
          />
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Plus size={18} /> Новая цель на сегодня
      </Button>

      <GoalEditor open={open} onClose={() => setOpen(false)} goal={editing} defaultDeadline={todayKey()} />
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="flex items-center gap-2.5">
    <span className="h-2 w-2 rounded-full" style={{ background: tone, boxShadow: `0 0 10px ${tone}` }} />
    <span className="text-xs text-dim">{label}</span>
    <span className="ml-auto text-sm font-bold">{value}</span>
  </div>
);
