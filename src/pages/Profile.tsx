import { useRef, useState } from "react";
import {
  Bell, Cloud, CloudOff, Download, LogOut, Lock, Moon, Palette, Plus, RefreshCw,
  Sun, Trash2, Upload, UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Button, Card, Sheet, Toggle } from "@/components/ui";
import { exportState, fileToDataUrl } from "@/lib/storage";
import { overallStats, streakOf } from "@/lib/stats";
import { cn } from "@/utils/cn";

const AVATARS = ["🪐", "🚀", "🦊", "🐺", "🌊", "🔥", "🌙", "⚡️", "🧠", "🍀", "🎯", "💎"];
const ACCENTS = ["#4cc9ff", "#8b5cf6", "#34e5b0", "#ff5f7e", "#ffb547", "#00e0ff"];

export const Profile = ({ onOpenVault }: { onOpenVault: () => void }) => {
  const { user, signOut, cloud } = useAuth();
  const { state, updateSettings, addCategory, deleteCategory, importData, resetData, setPin, syncing } = useData();
  const stats = overallStats(state.goals);
  const streak = streakOf(state.goals);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("✨");
  const [catColor, setCatColor] = useState("#4cc9ff");
  const [msg, setMsg] = useState("");

  const notify = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(""), 2400);
  };

  const onAvatar = async (f: File | null) => {
    if (!f) return;
    updateSettings({ avatar: await fileToDataUrl(f, 320) });
  };

  const onImport = async (f: File | null) => {
    if (!f) return;
    try {
      importData(await f.text());
      notify("Данные импортированы ✨");
    } catch {
      notify("Не удалось прочитать файл");
    }
  };

  const toggleReminders = async (v: boolean) => {
    if (v && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        notify("Разрешение на уведомления не выдано");
        return;
      }
      new Notification("Aurora", { body: "Напоминания включены. Мы подскажем о целях дня." });
    }
    updateSettings({ reminders: v });
  };

  return (
    <div className="space-y-4 pb-4">
      <Card className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full accent-grad opacity-20 blur-3xl" />
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="glass flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl text-4xl"
          >
            {state.settings.avatar.startsWith("data:")
              ? <img src={state.settings.avatar} alt="" className="h-full w-full object-cover" />
              : state.settings.avatar}
          </button>
          <div className="min-w-0 flex-1">
            <input
              className="w-full bg-transparent text-lg font-bold outline-none"
              value={state.settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
            />
            <p className="truncate text-xs text-dim">{user?.email}</p>
            <p className={cn("mt-1 inline-flex items-center gap-1 text-[11px]", cloud ? "accent-text" : "text-faint")}>
              {cloud ? <Cloud size={12} /> : <CloudOff size={12} />}
              {cloud
                ? syncing === "saving" ? "Синхронизация…" : syncing === "error" ? "Ошибка синхронизации" : "Синхронизировано"
                : "Локальное хранилище"}
            </p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onAvatar(e.target.files?.[0] || null)} />

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => updateSettings({ avatar: a })}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg",
                state.settings.avatar === a ? "accent-grad" : "glass",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric label="Целей" value={stats.total} />
          <Metric label="Выполнено" value={stats.done} />
          <Metric label="Серия" value={streak} />
        </div>
      </Card>

      <Card className="divide-y divide-white/5 p-1" delay={0.05}>
        <Row icon={state.settings.theme === "dark" ? <Moon size={17} /> : <Sun size={17} />} title="Тёмная тема" subtitle="Переключить оформление">
          <Toggle
            checked={state.settings.theme === "dark"}
            onChange={(v) => updateSettings({ theme: v ? "dark" : "light" })}
          />
        </Row>
        <Row icon={<Bell size={17} />} title="Напоминания" subtitle={`Ежедневно в ${state.settings.reminderTime}`}>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={state.settings.reminderTime}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              className="rounded-xl bg-white/8 px-2 py-1 text-xs"
            />
            <Toggle checked={state.settings.reminders} onChange={(v) => void toggleReminders(v)} />
          </div>
        </Row>
        <Row icon={<Lock size={17} />} title="Личный раздел" subtitle={state.settings.pinHash ? "PIN установлен" : "PIN не задан"}>
          <button onClick={onOpenVault} className="text-xs font-semibold accent-text">Открыть</button>
        </Row>
        <Row icon={<UserRound size={17} />} title="Биометрия" subtitle="Разблокировка отпечатком / Face ID">
          <Toggle
            checked={state.settings.biometricEnabled}
            onChange={(v) => updateSettings({ biometricEnabled: v })}
          />
        </Row>
      </Card>

      <Card className="p-4" delay={0.1}>
        <div className="mb-3 flex items-center gap-2">
          <Palette size={16} className="accent-text" />
          <h3 className="text-sm font-bold">Акцентный цвет</h3>
        </div>
        <div className="flex gap-3">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => updateSettings({ accent: c })}
              className={cn(
                "h-9 w-9 rounded-2xl transition",
                state.settings.accent === c && "ring-2 ring-white/70 ring-offset-2 ring-offset-transparent",
              )}
              style={{ background: c, boxShadow: `0 0 16px ${c}66` }}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4" delay={0.15}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Категории</h3>
          <button onClick={() => setCatOpen(true)} className="flex items-center gap-1 text-xs accent-text">
            <Plus size={14} /> Добавить
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold"
              style={{ background: `${c.color}1f`, color: c.color }}
            >
              {c.emoji} {c.name}
              {!c.system && (
                <button onClick={() => deleteCategory(c.id)} className="opacity-60">
                  <Trash2 size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 p-4" delay={0.2}>
        <h3 className="text-sm font-bold">Данные</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={() => exportState(state)}>
            <Download size={16} /> Экспорт
          </Button>
          <Button variant="soft" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Импорт
          </Button>
        </div>
        <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => void onImport(e.target.files?.[0] || null)} />
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (confirm("Сбросить все данные? Действие необратимо.")) {
              resetData();
              notify("Данные сброшены");
            }
          }}
        >
          <RefreshCw size={16} /> Сбросить данные
        </Button>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            void setPin(null);
            notify("PIN сброшен");
          }}
        >
          <Lock size={16} /> Сбросить PIN личного раздела
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => void signOut()}>
          <LogOut size={16} /> Выйти
        </Button>
        {msg && <p className="pt-1 text-center text-xs accent-text">{msg}</p>}
      </Card>

      <p className="pb-2 text-center text-[11px] text-faint">Aurora · персональное пространство целей · v1.0</p>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="Новая категория">
        <div className="space-y-3">
          <input className="field" placeholder="Название" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <input className="field" placeholder="Эмодзи" value={catEmoji} onChange={(e) => setCatEmoji(e.target.value)} />
          <div className="flex gap-3">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => setCatColor(c)}
                className={cn("h-9 w-9 rounded-2xl", catColor === c && "ring-2 ring-white/70")}
                style={{ background: c }}
              />
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              addCategory(catName, catEmoji, catColor);
              setCatName("");
              setCatOpen(false);
            }}
          >
            Создать
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl bg-white/5 py-3">
    <p className="text-xl font-extrabold accent-grad-text">{value}</p>
    <p className="text-[10px] text-dim">{label}</p>
  </div>
);

const Row = ({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-3.5 py-3.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8 accent-text">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{title}</p>
      {subtitle && <p className="truncate text-[11px] text-dim">{subtitle}</p>}
    </div>
    {children}
  </div>
);
