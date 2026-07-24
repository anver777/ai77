import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("aurora:install-dismissed") === "1");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("aurora:install-dismissed", "1");
    setHidden(true);
  };

  return (
    <AnimatePresence>
      {evt && !hidden && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed inset-x-3 top-3 z-50 mx-auto max-w-lg"
        >
          <div className="glass-strong flex items-center gap-3 rounded-3xl px-4 py-3 shadow-2xl shadow-black/40">
            <span className="text-2xl">🪐</span>
            <div className="flex-1">
              <p className="text-sm font-bold">Установить Aurora</p>
              <p className="text-[11px] text-dim">Работает офлайн, как обычное приложение</p>
            </div>
            <button
              onClick={async () => {
                await evt.prompt();
                await evt.userChoice;
                setEvt(null);
              }}
              className="accent-grad flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold text-white"
            >
              <Download size={14} /> Да
            </button>
            <button onClick={dismiss} className="text-faint">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
