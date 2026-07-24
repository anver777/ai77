import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Check, GripVertical, Pin, X } from "lucide-react";
import type { Category, Goal } from "@/types";
import { relativeDeadline } from "@/lib/date";
import { cn } from "@/utils/cn";

const PRIORITY: Record<Goal["priority"], { label: string; color: string }> = {
  high: { label: "Высокий", color: "#ff5f7e" },
  medium: { label: "Средний", color: "#ffb547" },
  low: { label: "Низкий", color: "#34e5b0" },
};

interface Props {
  goal: Goal;
  category?: Category;
  onOpen: () => void;
  onStatus: (status: Goal["status"]) => void;
  onPin: () => void;
  sortable?: boolean;
}

type DragBag = {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
};

const GoalCardBody = ({
  goal, category, onOpen, onStatus, onPin, sortable, drag = {},
}: Props & { drag?: DragBag }) => {
  const { attributes, listeners, setNodeRef, style, isDragging } = drag;
  const dl = relativeDeadline(goal.deadline);
  const checked = goal.checklist.filter((c) => c.done).length;
  const prio = PRIORITY[goal.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-90")}
    >
      <motion.div
        layout
        className={cn(
          "glass overflow-hidden rounded-3xl p-3.5 transition",
          isDragging && "glass-strong shadow-2xl shadow-black/50",
          goal.status === "done" && "opacity-70",
          goal.status === "failed" && "opacity-60",
        )}
      >
        <div className="flex items-start gap-3">
          {sortable && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab touch-none text-faint active:cursor-grabbing"
              aria-label="Переместить"
            >
              <GripVertical size={18} />
            </button>
          )}

          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: prio.color, boxShadow: `0 0 8px ${prio.color}` }}
              />
              <p
                className={cn(
                  "truncate font-semibold",
                  goal.status === "done" && "line-through decoration-[#34e5b0]/70",
                  goal.status === "failed" && "line-through decoration-[#ff5f7e]/70",
                )}
              >
                {goal.title}
              </p>
              {goal.pinned && <Pin size={13} className="shrink-0 accent-text" />}
            </div>
            {goal.description && (
              <p className="mt-1 line-clamp-2 text-xs text-dim">{goal.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {category && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${category.color}22`, color: category.color }}
                >
                  {category.emoji} {category.name}
                </span>
              )}
              {dl && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    dl.tone === "late" && "bg-[#ff5f7e]/15 text-[#ff8ba4]",
                    dl.tone === "warn" && "bg-[#ffb547]/15 text-[#ffc978]",
                    dl.tone === "ok" && "bg-white/8 text-[var(--text-2)]",
                  )}
                >
                  ⏱ {dl.label}
                </span>
              )}
              {goal.checklist.length > 0 && (
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-dim">
                  ✓ {checked}/{goal.checklist.length}
                </span>
              )}
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="flex gap-1.5">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onStatus(goal.status === "done" ? "active" : "done")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl border transition",
                  goal.status === "done"
                    ? "border-transparent bg-[#34e5b0] text-[#04241a] shadow-[0_0_18px_rgba(52,229,176,0.55)]"
                    : "border-white/10 bg-white/5 text-[#34e5b0]",
                )}
                aria-label="Выполнено"
              >
                <Check size={17} strokeWidth={3} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onStatus(goal.status === "failed" ? "active" : "failed")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl border transition",
                  goal.status === "failed"
                    ? "border-transparent bg-[#ff5f7e] text-white shadow-[0_0_18px_rgba(255,95,126,0.5)]"
                    : "border-white/10 bg-white/5 text-[#ff8ba4]",
                )}
                aria-label="Не выполнено"
              >
                <X size={17} strokeWidth={3} />
              </motion.button>
            </div>
            <button onClick={onPin} className={cn("text-[10px] font-semibold", goal.pinned ? "accent-text" : "text-faint")}>
              {goal.pinned ? "Откр." : "Закреп."}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SortableGoalCard = (props: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.goal.id,
  });
  return (
    <GoalCardBody
      {...props}
      drag={{
        attributes,
        listeners,
        setNodeRef,
        isDragging,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 30 : undefined,
        },
      }}
    />
  );
};

export const GoalCard = (props: Props) =>
  props.sortable ? <SortableGoalCard {...props} /> : <GoalCardBody {...props} />;
