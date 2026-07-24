import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Cloud, CloudOff, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

export const Auth = () => {
  const { signIn, signUp, signInAsGuest, cloud } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(name, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="glass floaty mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] glow">
            <Sparkles size={32} className="accent-text" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Aurora</h1>
          <p className="mt-2 text-sm text-dim">
            Твоё приватное пространство целей, заметок и привычек. Надёжная замена тетради.
          </p>
        </div>

        <div className="glass-strong rounded-[28px] p-5">
          <div className="mb-4 flex rounded-2xl bg-white/5 p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative flex-1 rounded-xl py-2.5 text-sm font-semibold"
              >
                {mode === m && (
                  <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl accent-grad" />
                )}
                <span className={cn("relative z-10", mode === m ? "text-white" : "text-dim")}>
                  {m === "in" ? "Вход" : "Регистрация"}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === "up" && (
              <input className="field" placeholder="Как тебя зовут?" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input
              className="field"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field"
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
            />
            {error && <p className="text-xs text-[#ff8ba4]">{error}</p>}
            <Button className="w-full" onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <>{mode === "in" ? "Войти" : "Создать аккаунт"} <ArrowRight size={16} /></>}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => void signInAsGuest()}>
              Продолжить без аккаунта
            </Button>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-faint">
          {cloud ? <Cloud size={12} /> : <CloudOff size={12} />}
          {cloud ? "Синхронизация Supabase активна" : "Офлайн-режим: данные хранятся на устройстве"}
        </p>
      </motion.div>
    </div>
  );
};
