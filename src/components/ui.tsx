import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export const Card = ({
  className, children, onClick, delay = 0,
}: { className?: string; children: ReactNode; onClick?: () => void; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    onClick={onClick}
    className={cn("glass rounded-3xl", className)}
  >
    {children}
  </motion.div>
);

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export const Button = ({
  children, onClick, variant = "primary", className, type = "button", disabled,
}: BtnProps) => (
  <motion.button
    whileTap={{ scale: disabled ? 1 : 0.96 }}
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "relative inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50",
      variant === "primary" && "accent-grad text-white shadow-lg shadow-black/30",
      variant === "soft" && "glass text-[var(--text-1)]",
      variant === "ghost" && "text-dim hover:text-[var(--text-1)]",
      variant === "danger" && "bg-[#ff5f7e]/15 text-[#ff8ba4] border border-[#ff5f7e]/30",
      className,
    )}
  >
    {children}
  </motion.button>
);

export const Sheet = ({
  open, onClose, title, children, full,
}: { open: boolean; onClose: () => void; title?: string; children: ReactNode; full?: boolean }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            className={cn(
              "glass-strong relative w-full max-w-lg rounded-t-[32px] px-5 pb-8 pt-3 safe-b",
              full ? "h-[92vh]" : "max-h-[88vh]",
              "overflow-y-auto no-scrollbar",
            )}
          >
            <div className="sticky top-0 z-10 -mx-5 mb-2 px-5 pb-3 pt-1 backdrop-blur-xl">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25" />
              {title && (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <button onClick={onClose} className="rounded-full p-2 text-dim hover:text-[var(--text-1)]">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Segmented = <T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) => (
  <div className="glass flex rounded-2xl p-1">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className="relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition"
      >
        {value === o.value && (
          <motion.span
            layoutId={`seg-${options.map((x) => x.value).join("")}`}
            className="absolute inset-0 rounded-xl accent-grad"
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
          />
        )}
        <span className={cn("relative z-10", value === o.value ? "text-white" : "text-dim")}>{o.label}</span>
      </button>
    ))}
  </div>
);

export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      "relative h-7 w-12 rounded-full transition",
      checked ? "accent-grad" : "bg-white/12 border border-white/10",
    )}
  >
    <motion.span
      layout
      transition={{ type: "spring", damping: 24, stiffness: 400 }}
      className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
      style={{ left: checked ? 26 : 4 }}
    />
  </button>
);

export const ProgressRing = ({
  percent, size = 132, stroke = 11, children,
}: { percent: number; size?: number; stroke?: number; children?: ReactNode }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke="rgba(255,255,255,0.09)" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          stroke="url(#ringGrad)" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.min(100, percent)) / 100 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

export const EmptyState = ({ icon, title, hint }: { icon: string; title: string; hint?: string }) => (
  <div className="flex flex-col items-center gap-2 py-14 text-center">
    <div className="floaty text-5xl">{icon}</div>
    <p className="font-semibold">{title}</p>
    {hint && <p className="max-w-[260px] text-sm text-dim">{hint}</p>}
  </div>
);

export const Chip = ({
  active, onClick, children, color,
}: { active?: boolean; onClick?: () => void; children: ReactNode; color?: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
      active
        ? "border-transparent text-white"
        : "glass border-white/10 text-dim",
    )}
    style={active ? { background: `linear-gradient(120deg, ${color || "var(--accent)"}, var(--accent-2))` } : undefined}
  >
    {children}
  </button>
);
