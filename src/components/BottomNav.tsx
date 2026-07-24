import { motion } from "framer-motion";
import { BarChart3, Home, NotebookPen, Target, User } from "lucide-react";
import { cn } from "@/utils/cn";

export type Tab = "home" | "goals" | "notes" | "stats" | "profile";

const items: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "goals", label: "Цели", icon: Target },
  { id: "notes", label: "Заметки", icon: NotebookPen },
  { id: "stats", label: "Аналитика", icon: BarChart3 },
  { id: "profile", label: "Профиль", icon: User },
];

export const BottomNav = ({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 safe-b">
    <nav className="glass-strong pointer-events-auto flex w-full max-w-lg items-center justify-between rounded-[26px] px-2 py-2 shadow-2xl shadow-black/40">
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2"
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="absolute inset-0 rounded-2xl bg-white/10 border border-white/10"
              />
            )}
            <Icon
              size={20}
              className={cn("relative z-10 transition", active ? "accent-text" : "text-faint")}
              style={active ? { filter: "drop-shadow(0 0 8px var(--accent))" } : undefined}
            />
            <span className={cn("relative z-10 text-[10px] font-semibold", active ? "text-[var(--text-1)]" : "text-faint")}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  </div>
);
