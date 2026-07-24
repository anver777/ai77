import { useState } from "react";
import { motion } from "framer-motion";
import { Delete, Fingerprint, ShieldCheck } from "lucide-react";
import { useData } from "@/context/DataContext";
import { cn } from "@/utils/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"];

export const PinLock = ({ onUnlocked }: { onUnlocked: () => void }) => {
  const { state, setPin, verifyPin } = useData();
  const hasPin = Boolean(state.settings.pinHash);
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);

  const fail = (msg: string) => {
    setError(msg);
    setShake((s) => s + 1);
    setCode("");
  };

  const submit = async (value: string) => {
    if (hasPin) {
      if (await verifyPin(value)) onUnlocked();
      else fail("Неверный PIN");
      return;
    }
    if (confirmCode === null) {
      setConfirmCode(value);
      setCode("");
      setError("");
      return;
    }
    if (confirmCode === value) {
      await setPin(value);
      onUnlocked();
    } else {
      setConfirmCode(null);
      fail("PIN-коды не совпали");
    }
  };

  const press = (k: string) => {
    if (k === "del") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (k === "bio") {
      void biometric();
      return;
    }
    if (code.length >= 4) return;
    const next = code + k;
    setCode(next);
    setError("");
    if (next.length === 4) window.setTimeout(() => void submit(next), 160);
  };

  const biometric = async () => {
    if (!hasPin) {
      setError("Сначала задайте PIN-код");
      return;
    }
    try {
      const available = window.PublicKeyCredential &&
        (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
      if (!available) {
        setError("Биометрия недоступна на этом устройстве");
        return;
      }
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: "required",
          timeout: 30000,
        },
      });
      onUnlocked();
    } catch {
      setError("Не удалось подтвердить личность");
    }
  };

  return (
    <div className="flex flex-col items-center px-6 pt-10">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass mb-5 flex h-16 w-16 items-center justify-center rounded-3xl glow"
      >
        <ShieldCheck size={28} className="accent-text" />
      </motion.div>
      <h2 className="text-xl font-bold">Личное пространство</h2>
      <p className="mt-1 max-w-[280px] text-center text-sm text-dim">
        {hasPin
          ? "Введите PIN-код, чтобы открыть приватные цели и заметки"
          : confirmCode === null
            ? "Придумайте PIN-код из 4 цифр"
            : "Повторите PIN-код"}
      </p>

      <motion.div key={shake} animate={{ x: error ? [0, -10, 10, -6, 6, 0] : 0 }} className="my-7 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: code.length === i + 1 ? [1, 1.35, 1] : 1 }}
            className={cn(
              "h-3.5 w-3.5 rounded-full transition",
              i < code.length ? "accent-grad glow" : "bg-white/15",
            )}
          />
        ))}
      </motion.div>

      <p className={cn("h-5 text-xs font-semibold", error ? "text-[#ff8ba4]" : "text-transparent")}>{error || "."}</p>

      <div className="mt-4 grid w-full max-w-[280px] grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.92 }}
            onClick={() => press(k)}
            className={cn(
              "flex h-16 items-center justify-center rounded-3xl text-xl font-semibold",
              k === "bio" || k === "del" ? "text-dim" : "glass",
            )}
          >
            {k === "bio" ? <Fingerprint size={22} /> : k === "del" ? <Delete size={22} /> : k}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
