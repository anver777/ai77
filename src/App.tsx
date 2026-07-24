import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider, useData } from "@/context/DataContext";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GoalList } from "@/components/GoalList";
import { NoteList } from "@/components/NoteList";
import { Home } from "@/pages/Home";
import { Stats } from "@/pages/Stats";
import { Profile } from "@/pages/Profile";
import { Auth } from "@/pages/Auth";
import { Vault } from "@/pages/Vault";
import { formatLong } from "@/lib/date";
import { useReminders } from "@/hooks/useReminders";

type Route = Tab | "vault";

const TITLES: Record<Exclude<Route, "home" | "vault">, string> = {
  goals: "Мои цели",
  notes: "Заметки",
  stats: "Аналитика",
  profile: "Профиль",
};

const Shell = () => {
  const { user, loading } = useAuth();
  const { ready, lockVault } = useData();
  const [route, setRoute] = useState<Route>("home");
  useReminders();

  useEffect(() => {
    if (route !== "vault") lockVault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route, lockVault]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin accent-text" size={28} />
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin accent-text" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg safe-t">
      <InstallPrompt />
      <AnimatePresence mode="wait">
        <motion.main
          key={route}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {route === "home" && <Home onNavigate={(t) => setRoute(t)} />}
          {route === "vault" && <Vault onBack={() => setRoute("home")} />}
          {route !== "home" && route !== "vault" && (
            <div className="space-y-4 px-4 pb-32 pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">{TITLES[route]}</h1>
                  <p className="text-xs text-dim">{formatLong(new Date())}</p>
                </div>
                {(route === "goals" || route === "notes") && (
                  <button
                    onClick={() => setRoute("vault")}
                    className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold text-dim"
                  >
                    <Lock size={13} /> Личное
                  </button>
                )}
              </div>
              {route === "goals" && <GoalList />}
              {route === "notes" && <NoteList />}
              {route === "stats" && <Stats />}
              {route === "profile" && <Profile onOpenVault={() => setRoute("vault")} />}
            </div>
          )}
        </motion.main>
      </AnimatePresence>
      <BottomNav tab={route === "vault" ? "home" : route} onChange={(t) => setRoute(t)} />
    </div>
  );
};

export default function App() {
  return (
    <div className="app-bg min-h-screen">
      <AuthProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </AuthProvider>
    </div>
  );
}
