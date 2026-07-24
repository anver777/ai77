import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import type { ChecklistItem, Note } from "@/types";
import { useData } from "@/context/DataContext";
import { Button, Sheet, Toggle } from "@/components/ui";
import { fileToDataUrl, uid } from "@/lib/storage";
import { cn } from "@/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  defaultVault?: boolean;
}

const empty = (vault: boolean): Partial<Note> => ({
  title: "", body: "", categoryId: "personal", pinned: false, vault, images: [], checklist: [],
});

export const NoteEditor = ({ open, onClose, note, defaultVault = false }: Props) => {
  const { state, addNote, updateNote, deleteNote } = useData();
  const [draft, setDraft] = useState<Partial<Note>>(empty(defaultVault));
  const [item, setItem] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(note ? { ...note } : empty(defaultVault));
      setItem("");
    }
  }, [open, note, defaultVault]);

  const set = (p: Partial<Note>) => setDraft((d) => ({ ...d, ...p }));

  const save = () => {
    if (!draft.title?.trim() && !draft.body?.trim()) return onClose();
    if (note) updateNote(note.id, draft);
    else addNote(draft);
    onClose();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).slice(0, 4).map((f) => fileToDataUrl(f)));
    set({ images: [...(draft.images || []), ...urls] });
  };

  const addItem = () => {
    if (!item.trim()) return;
    const next: ChecklistItem[] = [...(draft.checklist || []), { id: uid(), text: item.trim(), done: false }];
    set({ checklist: next });
    setItem("");
  };

  return (
    <Sheet open={open} onClose={onClose} title={note ? "Заметка" : "Новая заметка"} full>
      <div className="space-y-4">
        <input
          className="field text-base font-semibold"
          placeholder="Заголовок"
          value={draft.title || ""}
          onChange={(e) => set({ title: e.target.value })}
        />
        <textarea
          className="field min-h-[160px] resize-none text-sm leading-relaxed"
          placeholder="Пиши свободно — это твоё личное пространство…"
          value={draft.body || ""}
          onChange={(e) => set({ body: e.target.value })}
        />

        <div className="flex flex-wrap gap-2">
          {state.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => set({ categoryId: c.id })}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                draft.categoryId === c.id ? "border-transparent" : "glass border-white/10 text-dim",
              )}
              style={draft.categoryId === c.id ? { background: c.color, color: "#04121f" } : undefined}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {!!draft.images?.length && (
          <div className="grid grid-cols-3 gap-2">
            {draft.images.map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl">
                <img src={src} alt="" className="h-24 w-full object-cover" />
                <button
                  onClick={() => set({ images: (draft.images || []).filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button variant="soft" onClick={() => fileRef.current?.click()} className="w-full">
          <ImagePlus size={16} /> Добавить изображение
        </Button>

        <div className="space-y-2">
          {(draft.checklist || []).map((c) => (
            <div key={c.id} className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <button
                onClick={() =>
                  set({
                    checklist: (draft.checklist || []).map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
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
              placeholder="Пункт чек-листа"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button variant="soft" onClick={addItem} className="px-4">
              <Plus size={18} />
            </Button>
          </div>
        </div>

        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold">📌 Закрепить</p>
          <Toggle checked={!!draft.pinned} onChange={(v) => set({ pinned: v })} />
        </div>
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold">🔒 Приватная заметка</p>
          <Toggle checked={!!draft.vault} onChange={(v) => set({ vault: v })} />
        </div>

        <div className="flex gap-2 pb-4">
          {note && (
            <Button
              variant="danger"
              onClick={() => {
                deleteNote(note.id);
                onClose();
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
          <Button onClick={save} className="flex-1">Сохранить</Button>
        </div>
      </div>
    </Sheet>
  );
};
