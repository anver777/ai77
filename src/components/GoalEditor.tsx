import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ChecklistItem, Goal, Priority } from "@/types";
import { useData } from "@/context/DataContext";
import { Button, Segmented, Sheet, Toggle } from "@/components/ui";
import { uid } from "@/lib/storage";
import { cn } from "@/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  defaultVault?: boolean;
  defaultDeadline?: string;
}

const empty = (vault: boolean, deadline?: string): Partial<Goal> => ({
  title: "", description: "", categoryId: "work", priority: "medium",
  status: "active", deadline, pinned: false, vault, checklist: [],
});

export const GoalEditor = ({ open, onClose, goal, defaultVault = false, defaultDeadline }: Props) => {
  const { state, addGoal, updateGoal, deleteGoal } = useData();
  const [draft, setDraft] = useState<Partial<Goal>>(empty(defaultVault, defaultDeadline));
  const [item, setItem] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(goal ? { ...goal } : empty(defaultVault, defaultDeadline));
      setItem("");
    }
  }, [open, goal, defaultVault, defaultDeadline]);

  const set = (p: Partial<Goal>) => setDraft((d) => ({ ...d, ...p }));

  const save = () => {
    if (!draft.title?.trim()) return;
    if (goal) updateGoal(goal.id, draft);
    else addGoal(draft);
    onClose();
  };

  const addItem = () => {
    if (!item.trim()) return;
    const next: ChecklistItem[] = [...(draft.checklist || []), { id: uid(), text: item.trim(), done: false }];
    set({ checklist: next });
    setItem("");
  };

  return (
    <Sheet open={open} onClose={onClose} title={goal ? "Редактировать цель" : "Новая цель"}>
      <div className="space-y-4">
        <input
          className="field text-base font-semibold"
          placeholder="Что нужно сделать?"
          value={draft.title || ""}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus={!goal}
        />
        <textarea
          className="field min-h-[84px] resize-none text-sm"
          placeholder="Описание, детали, зачем это важно…"
          value={draft.description || ""}
          onChange={(e) => set({ description: e.target.value })}
        />

        <div>
          <p className="mb-2 text-xs font-semibold text-dim">Категория</p>
          <div className="flex flex-wrap gap-2">
            {state.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => set({ categoryId: c.id })}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                  draft.categoryId === c.id ? "border-transparent text-white" : "glass border-white/10 text-dim",
                )}
                style={draft.categoryId === c.id ? { background: c.color, color: "#04121f" } : undefined}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-dim">Приоритет</p>
          <Segmented<Priority>
            value={(draft.priority as Priority) || "medium"}
            onChange={(v) => set({ priority: v })}
            options={[
              { value: "low", label: "Низкий" },
              { value: "medium", label: "Средний" },
              { value: "high", label: "Высокий" },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold text-dim">Дедлайн</p>
            <input
              type="date"
              className="field text-sm"
              value={draft.deadline || ""}
              onChange={(e) => set({ deadline: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Закрепить сверху</p>
            <p className="text-xs text-dim">Всегда на виду в списке</p>
          </div>
          <Toggle checked={!!draft.pinned} onChange={(v) => set({ pinned: v })} />
        </div>

        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">🔒 Личная цель</p>
            <p className="text-xs text-dim">Видна только после ввода PIN</p>
          </div>
          <Toggle checked={!!draft.vault} onChange={(v) => set({ vault: v })} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-dim">Чек-лист</p>
          <div className="space-y-2">
            {(draft.checklist || []).map((c) => (
              <div key={c.id} className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5">
                <button
                  onClick={() =>
                    set({
                      checklist: (draft.checklist || []).map((x) =>
                        x.id === c.id ? { ...x, done: !x.done } : x),
                    })
                  }
                  className={cn(
                    "h-5 w-5 shrink-0 rounded-lg border transition",
                    c.done ? "border-transparent bg-[#34e5b0]" : "border-white/25",
                  )}
                />
                <span className={cn("flex-1 text-sm", c.done && "text-faint line-through")}>{c.text}</span>
                <button
                  onClick={() => set({ checklist: (draft.checklist || []).filter((x) => x.id !== c.id) })}
                  className="text-faint"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className="field flex-1 text-sm"
                placeholder="Добавить пункт"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Button variant="soft" onClick={addItem} className="px-4">
                <Plus size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pb-2 pt-2">
          {goal && (
            <Button
              variant="danger"
              onClick={() => {
                deleteGoal(goal.id);
                onClose();
              }}
            >
              <Trash2 size={16} /> Удалить
            </Button>
          )}
          <Button onClick={save} className="flex-1" type="button">
            {goal ? "Сохранить" : "Создать цель"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
