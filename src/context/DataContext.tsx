import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import type { AppState, Category, Goal, Note, Settings } from "@/types";
import {
  DEFAULT_CATEGORIES, loadState, parseImport, saveState, seedState, sha256, uid,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface DataCtx {
  state: AppState;
  ready: boolean;
  syncing: "idle" | "saving" | "synced" | "error";
  addGoal: (g: Partial<Goal>) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  reorderGoals: (ids: string[]) => void;
  addNote: (n: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addCategory: (name: string, emoji: string, color: string) => void;
  deleteCategory: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setPin: (pin: string | null) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  vaultUnlocked: boolean;
  unlockVault: () => void;
  lockVault: () => void;
  importData: (raw: string) => void;
  resetData: () => void;
}

const Ctx = createContext<DataCtx | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState<DataCtx["syncing"]>("idle");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const timer = useRef<number | null>(null);

  // загрузка при входе
  useEffect(() => {
    if (!user) {
      setReady(false);
      return;
    }
    setVaultUnlocked(false);
    const local = loadState(user.id);
    const base = local || seedState(user.name);
    if (!local) base.settings.displayName = user.name;
    setState(base);
    setReady(true);

    if (supabase && user.provider === "supabase") {
      void (async () => {
        const { data } = await supabase
          .from("user_state").select("payload").eq("user_id", user.id).maybeSingle();
        if (data?.payload) {
          try {
            const remote = parseImport(JSON.stringify(data.payload));
            setState(remote);
            saveState(user.id, remote);
            setSyncing("synced");
          } catch {
            /* ignore */
          }
        }
      })();
    }
  }, [user]);

  // сохранение (локально + облако с дебаунсом)
  useEffect(() => {
    if (!user || !ready) return;
    saveState(user.id, state);
    const sb = supabase;
    if (sb && user.provider === "supabase") {
      setSyncing("saving");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        const { error } = await sb
          .from("user_state")
          .upsert({ user_id: user.id, payload: state, updated_at: new Date().toISOString() });
        setSyncing(error ? "error" : "synced");
      }, 900);
    }
  }, [state, user, ready]);

  // тема
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", state.settings.theme === "light");
    root.style.setProperty("--accent", state.settings.accent);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "light" ? "#eef2fb" : "#05070f");
  }, [state.settings.theme, state.settings.accent]);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const addGoal = useCallback<DataCtx["addGoal"]>((g) => {
    const goal: Goal = {
      id: uid(),
      title: g.title?.trim() || "Без названия",
      description: g.description || "",
      categoryId: g.categoryId || "work",
      priority: g.priority || "medium",
      status: g.status || "active",
      deadline: g.deadline,
      pinned: g.pinned ?? false,
      order: -Date.now(),
      vault: g.vault ?? false,
      checklist: g.checklist || [],
      createdAt: new Date().toISOString(),
    };
    patch((s) => ({ ...s, goals: [goal, ...s.goals] }));
    return goal;
  }, [patch]);

  const updateGoal = useCallback<DataCtx["updateGoal"]>((id, p) => {
    patch((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...p };
        if (p.status && p.status !== g.status) {
          next.completedAt = p.status === "done" ? new Date().toISOString() : undefined;
        }
        return next;
      }),
    }));
  }, [patch]);

  const deleteGoal = useCallback<DataCtx["deleteGoal"]>((id) => {
    patch((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, [patch]);

  const reorderGoals = useCallback<DataCtx["reorderGoals"]>((ids) => {
    patch((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        const i = ids.indexOf(g.id);
        return i === -1 ? g : { ...g, order: i };
      }),
    }));
  }, [patch]);

  const addNote = useCallback<DataCtx["addNote"]>((n) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: uid(),
      title: n.title?.trim() || "Новая заметка",
      body: n.body || "",
      categoryId: n.categoryId || "personal",
      pinned: n.pinned ?? false,
      vault: n.vault ?? false,
      images: n.images || [],
      checklist: n.checklist || [],
      createdAt: now,
      updatedAt: now,
    };
    patch((s) => ({ ...s, notes: [note, ...s.notes] }));
    return note;
  }, [patch]);

  const updateNote = useCallback<DataCtx["updateNote"]>((id, p) => {
    patch((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: new Date().toISOString() } : n)),
    }));
  }, [patch]);

  const deleteNote = useCallback<DataCtx["deleteNote"]>((id) => {
    patch((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, [patch]);

  const addCategory = useCallback<DataCtx["addCategory"]>((name, emoji, color) => {
    const cat: Category = { id: uid(), name: name.trim() || "Категория", emoji: emoji || "✨", color };
    patch((s) => ({ ...s, categories: [...s.categories, cat] }));
  }, [patch]);

  const deleteCategory = useCallback<DataCtx["deleteCategory"]>((id) => {
    patch((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      goals: s.goals.map((g) => (g.categoryId === id ? { ...g, categoryId: "work" } : g)),
      notes: s.notes.map((n) => (n.categoryId === id ? { ...n, categoryId: "personal" } : n)),
    }));
  }, [patch]);

  const updateSettings = useCallback<DataCtx["updateSettings"]>((p) => {
    patch((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  }, [patch]);

  const setPin = useCallback<DataCtx["setPin"]>(async (pin) => {
    const hash = pin ? await sha256(pin) : null;
    patch((s) => ({ ...s, settings: { ...s.settings, pinHash: hash } }));
    if (pin) setVaultUnlocked(true);
  }, [patch]);

  const verifyPin = useCallback<DataCtx["verifyPin"]>(async (pin) => {
    if (!state.settings.pinHash) return true;
    return (await sha256(pin)) === state.settings.pinHash;
  }, [state.settings.pinHash]);

  const importData = useCallback<DataCtx["importData"]>((raw) => {
    const next = parseImport(raw);
    setState(next);
  }, []);

  const resetData = useCallback(() => {
    setState({ ...seedState(user?.name), categories: DEFAULT_CATEGORIES });
  }, [user?.name]);

  const value = useMemo<DataCtx>(() => ({
    state, ready, syncing,
    addGoal, updateGoal, deleteGoal, reorderGoals,
    addNote, updateNote, deleteNote,
    addCategory, deleteCategory, updateSettings,
    setPin, verifyPin,
    vaultUnlocked,
    unlockVault: () => setVaultUnlocked(true),
    lockVault: () => setVaultUnlocked(false),
    importData, resetData,
  }), [state, ready, syncing, addGoal, updateGoal, deleteGoal, reorderGoals, addNote, updateNote,
    deleteNote, addCategory, deleteCategory, updateSettings, setPin, verifyPin, vaultUnlocked,
    importData, resetData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useData = (): DataCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};
