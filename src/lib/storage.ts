import type { AppState, Category, Settings } from "@/types";
import { todayKey } from "@/lib/date";

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const sha256 = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(`aurora::${value}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "work", name: "Работа", emoji: "💼", color: "#4cc9ff", system: true },
  { id: "finance", name: "Финансы", emoji: "💰", color: "#34e5b0", system: true },
  { id: "business", name: "Бизнес", emoji: "🚀", color: "#8b5cf6", system: true },
  { id: "health", name: "Здоровье", emoji: "🫀", color: "#ff5f7e", system: true },
  { id: "growth", name: "Развитие", emoji: "📚", color: "#ffb547", system: true },
  { id: "personal", name: "Личное", emoji: "🌙", color: "#a78bfa", system: true },
];

export const defaultSettings = (name = "Гость"): Settings => ({
  theme: "dark",
  displayName: name,
  avatar: "🪐",
  pinHash: null,
  biometricEnabled: false,
  reminders: false,
  reminderTime: "09:00",
  accent: "#4cc9ff",
});

export const seedState = (name = "Гость"): AppState => {
  const now = new Date().toISOString();
  return {
    version: 1,
    categories: DEFAULT_CATEGORIES,
    settings: defaultSettings(name),
    goals: [
      {
        id: uid(),
        title: "Спланировать неделю",
        description: "Разложить крупные задачи по дням и оставить время на отдых.",
        categoryId: "work",
        priority: "high",
        status: "active",
        deadline: todayKey(),
        pinned: true,
        order: 0,
        vault: false,
        checklist: [
          { id: uid(), text: "Выписать приоритеты", done: true },
          { id: uid(), text: "Забронировать время в календаре", done: false },
        ],
        createdAt: now,
      },
      {
        id: uid(),
        title: "Тренировка 45 минут",
        categoryId: "health",
        priority: "medium",
        status: "done",
        deadline: todayKey(),
        pinned: false,
        order: 1,
        vault: false,
        checklist: [],
        createdAt: now,
        completedAt: now,
      },
      {
        id: uid(),
        title: "Отложить 10% дохода",
        categoryId: "finance",
        priority: "medium",
        status: "active",
        pinned: false,
        order: 2,
        vault: false,
        checklist: [],
        createdAt: now,
      },
    ],
    notes: [
      {
        id: uid(),
        title: "Идеи на квартал",
        body: "Собрать три ключевых направления и сфокусироваться только на них.",
        categoryId: "business",
        pinned: true,
        vault: false,
        images: [],
        checklist: [
          { id: uid(), text: "Продуктовая линейка", done: false },
          { id: uid(), text: "Партнёрства", done: false },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};

const stateKey = (userId: string) => `aurora:state:${userId}`;

export const loadState = (userId: string): AppState | null => {
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.categories?.length) parsed.categories = DEFAULT_CATEGORIES;
    if (!parsed.settings) parsed.settings = defaultSettings();
    parsed.goals ||= [];
    parsed.notes ||= [];
    return parsed;
  } catch {
    return null;
  }
};

export const saveState = (userId: string, state: AppState): void => {
  try {
    localStorage.setItem(stateKey(userId), JSON.stringify(state));
  } catch {
    /* quota */
  }
};

export const exportState = (state: AppState): void => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aurora-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const parseImport = (raw: string): AppState => {
  const parsed = JSON.parse(raw) as AppState;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.goals)) {
    throw new Error("Некорректный формат файла");
  }
  return {
    version: 1,
    goals: parsed.goals,
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    categories: Array.isArray(parsed.categories) && parsed.categories.length
      ? parsed.categories
      : DEFAULT_CATEGORIES,
    settings: { ...defaultSettings(), ...(parsed.settings || {}) },
  };
};

export const fileToDataUrl = (file: File, maxSize = 1100): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
