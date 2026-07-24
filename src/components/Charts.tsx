import { motion } from "framer-motion";
import type { Point } from "@/lib/stats";
import { addDays, startOfWeek, toKey, WEEKDAYS_SHORT } from "@/lib/date";
import { cn } from "@/utils/cn";

export const BarChart = ({ points, height = 150 }: { points: Point[]; height?: number }) => {
  const max = Math.max(1, ...points.map((p) => p.value));
  const dense = points.length > 14;
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {points.map((p, i) => (
        <div key={p.label + i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex w-full flex-1 items-end justify-center">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(p.value / max) * 100}%` }}
              transition={{ delay: i * 0.02, type: "spring", damping: 20, stiffness: 180 }}
              className={cn(
                "w-full rounded-t-lg",
                p.value ? "accent-grad" : "bg-white/8",
              )}
              style={{ minHeight: 4, maxWidth: dense ? 10 : 26 }}
            />
          </div>
          {(!dense || i % 5 === 0) && (
            <span className="text-[9px] text-faint">{p.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const AreaChart = ({ points, height = 140 }: { points: Point[]; height?: number }) => {
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 300;
  const h = height;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => [i * step, h - 12 - (p.value / max) * (h - 30)] as const);
  const path = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#areaFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.path
        d={path}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
};

export const Heatmap = ({ map, weeks = 18 }: { map: Record<string, number>; weeks?: number }) => {
  const start = addDays(startOfWeek(new Date()), -(weeks - 1) * 7);
  const cols = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      const key = toKey(date);
      return { key, value: map[key] || 0, future: date > new Date() };
    }),
  );
  const tone = (v: number) => {
    if (!v) return "rgba(255,255,255,0.07)";
    if (v === 1) return "color-mix(in srgb, var(--accent) 35%, transparent)";
    if (v === 2) return "color-mix(in srgb, var(--accent) 60%, transparent)";
    return "var(--accent)";
  };
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-[1px] text-[8px] text-faint">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="h-[10px] leading-[10px]">{d[0]}</span>
        ))}
      </div>
      <div className="no-scrollbar flex flex-1 gap-[3px] overflow-x-auto">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <motion.span
                key={cell.key}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: cell.future ? 0.25 : 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                title={`${cell.key}: ${cell.value}`}
                className="h-[10px] w-[10px] rounded-[3px]"
                style={{ background: tone(cell.value) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
