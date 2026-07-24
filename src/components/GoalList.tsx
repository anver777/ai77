import { useMemo, useState } from "react";
import {
  DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Plus, Search } from "lucide-react";
import type { Goal, GoalStatus } from "@/types";
import { useData } from "@/context/DataContext";
import { GoalCard } from "@/components/GoalCard";
import { GoalEditor } from "@/components/GoalEditor";
import { Button, Chip, EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";

type StatusFilter = "all" | GoalStatus;

export const GoalList = ({ vault = false }: { vault?: boolean }) => {
  const { state, updateGoal, reorderGoals } = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  );

  const sorted = useMemo(() => {
    const base = state.goals.filter((g) => Boolean(g.vault) === vault);
    return [...base].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
  }, [state.goals, vault]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((g) => {
      if (category !== "all" && g.categoryId !== category) return false;
      if (status !== "all" && g.status !== status) return false;
      if (q && !(`${g.title} ${g.description || ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [sorted, query, category, status]);

  const canSort = !query && category === "all" && status === "all";

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = filtered.map((g) => g.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderGoals(ids);
  };

  const cat = (id: string) => state.categories.find((c) => c.id === id);
  const doneCount = sorted.filter((g) => g.status === "done").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="glass flex flex-1 items-center gap-2 rounded-2xl px-3.5 py-2.5">
          <Search size={16} className="text-faint" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Поиск по целям"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn("glass rounded-2xl p-3", showFilters && "accent-text")}
        >
          <Filter size={17} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-1">
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {(["all", "active", "done", "failed"] as StatusFilter[]).map((s) => (
                  <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                    {s === "all" ? "Все" : s === "active" ? "В работе" : s === "done" ? "✅ Выполнено" : "❌ Пропущено"}
                  </Chip>
                ))}
              </div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                <Chip active={category === "all"} onClick={() => setCategory("all")}>Все категории</Chip>
                {state.categories.map((c) => (
                  <Chip key={c.id} active={category === c.id} color={c.color} onClick={() => setCategory(c.id)}>
                    {c.emoji} {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-1 text-xs text-dim">
        <span>
          {filtered.length} {filtered.length === 1 ? "цель" : "целей"} · выполнено {doneCount}
        </span>
        {canSort && sorted.length > 1 && <span className="text-faint">Удерживай ⠿ для сортировки</span>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filtered.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {filtered.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  category={cat(g.categoryId)}
                  sortable={canSort}
                  onOpen={() => {
                    setEditing(g);
                    setOpen(true);
                  }}
                  onStatus={(s) => updateGoal(g.id, { status: s })}
                  onPin={() => updateGoal(g.id, { pinned: !g.pinned })}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {filtered.length === 0 && (
        <EmptyState
          icon={vault ? "🔐" : "🎯"}
          title="Пока пусто"
          hint={vault ? "Здесь хранятся только твои личные цели" : "Создай первую цель — и день обретёт структуру"}
        />
      )}

      <Button
        className="w-full"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Plus size={18} /> Добавить цель
      </Button>

      <GoalEditor open={open} onClose={() => setOpen(false)} goal={editing} defaultVault={vault} />
    </div>
  );
};
