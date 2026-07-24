import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pin, Plus, Search } from "lucide-react";
import type { Note } from "@/types";
import { useData } from "@/context/DataContext";
import { NoteEditor } from "@/components/NoteEditor";
import { Button, Chip, EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";

export const NoteList = ({ vault = false }: { vault?: boolean }) => {
  const { state, updateNote } = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.notes
      .filter((n) => Boolean(n.vault) === vault)
      .filter((n) => (category === "all" ? true : n.categoryId === category))
      .filter((n) => (q ? `${n.title} ${n.body}`.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [state.notes, query, category, vault]);

  const cat = (id: string) => state.categories.find((c) => c.id === id);

  return (
    <div className="space-y-3">
      <div className="glass flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
        <Search size={16} className="text-faint" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Поиск по заметкам"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>Все</Chip>
        {state.categories.map((c) => (
          <Chip key={c.id} active={category === c.id} color={c.color} onClick={() => setCategory(c.id)}>
            {c.emoji} {c.name}
          </Chip>
        ))}
      </div>

      <div className="columns-2 gap-2.5 [column-fill:_balance]">
        {notes.map((n, i) => {
          const c = cat(n.categoryId);
          const done = n.checklist.filter((x) => x.done).length;
          return (
            <motion.div
              key={n.id}
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setEditing(n);
                setOpen(true);
              }}
              className="glass mb-2.5 block w-full cursor-pointer break-inside-avoid rounded-3xl p-3.5 text-left"
            >
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold">{n.title}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateNote(n.id, { pinned: !n.pinned });
                  }}
                  className={cn(n.pinned ? "accent-text" : "text-faint")}
                >
                  <Pin size={13} />
                </button>
              </div>
              {n.images[0] && (
                <img src={n.images[0]} alt="" className="mt-2 h-24 w-full rounded-2xl object-cover" />
              )}
              {n.body && <p className="mt-1.5 line-clamp-5 whitespace-pre-wrap text-xs text-dim">{n.body}</p>}
              {n.checklist.length > 0 && (
                <p className="mt-2 text-[10px] font-semibold text-faint">☑ {done}/{n.checklist.length}</p>
              )}
              {c && (
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${c.color}22`, color: c.color }}
                >
                  {c.emoji} {c.name}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {notes.length === 0 && (
        <EmptyState icon="📝" title="Заметок нет" hint="Мысли, идеи, списки — всё останется здесь" />
      )}

      <Button
        className="w-full"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Plus size={18} /> Новая заметка
      </Button>

      <NoteEditor open={open} onClose={() => setOpen(false)} note={editing} defaultVault={vault} />
    </div>
  );
};
