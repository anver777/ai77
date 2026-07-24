import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, LockKeyhole } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PinLock } from "@/components/PinLock";
import { GoalList } from "@/components/GoalList";
import { NoteList } from "@/components/NoteList";
import { Segmented } from "@/components/ui";

export const Vault = ({ onBack }: { onBack: () => void }) => {
  const { vaultUnlocked, unlockVault, lockVault } = useData();
  const [tab, setTab] = useState<"goals" | "notes">("goals");

  if (!vaultUnlocked) {
    return (
      <div className="px-4 pb-32 pt-4">
        <button onClick={onBack} className="glass mb-2 flex items-center gap-1 rounded-2xl px-3 py-2 text-xs text-dim">
          <ChevronLeft size={14} /> Назад
        </button>
        <PinLock onUnlocked={unlockVault} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 px-4 pb-32 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="glass rounded-2xl p-2.5 text-dim">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            <LockKeyhole size={18} className="accent-text" /> Личные цели
          </h1>
          <p className="text-xs text-dim">Видно только тебе</p>
        </div>
        <button onClick={lockVault} className="glass rounded-2xl px-3 py-2 text-xs font-semibold accent-text">
          Закрыть
        </button>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "goals", label: "Цели" },
          { value: "notes", label: "Заметки" },
        ]}
      />

      {tab === "goals" ? <GoalList vault /> : <NoteList vault />}
    </motion.div>
  );
};
