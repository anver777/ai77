export const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
export const MONTHS_NOM = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAYS_FULL = [
  "воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота",
];

export const toKey = (d: Date): string => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const todayKey = (): string => toKey(new Date());

export const fromKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const formatLong = (d: Date): string =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS_FULL[d.getDay()]}`;

export const formatShort = (key?: string): string => {
  if (!key) return "";
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

export const daysBetween = (a: Date, b: Date): number => {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() -
    new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  return Math.round(ms / 86400000);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Monday-first index (0 = Mon) */
export const dowMon = (d: Date): number => (d.getDay() + 6) % 7;

export const startOfWeek = (d: Date): Date => addDays(d, -dowMon(d));

export const monthMatrix = (year: number, month: number): (Date | null)[][] => {
  const first = new Date(year, month, 1);
  const total = new Date(year, month + 1, 0).getDate();
  const lead = dowMon(first);
  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let i = 1; i <= total; i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

export const greeting = (d = new Date()): string => {
  const h = d.getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
};

export const relativeDeadline = (key?: string): { label: string; tone: "ok" | "warn" | "late" } | null => {
  if (!key) return null;
  const diff = daysBetween(new Date(), fromKey(key));
  if (diff < 0) return { label: `Просрочено на ${Math.abs(diff)} дн.`, tone: "late" };
  if (diff === 0) return { label: "Сегодня", tone: "warn" };
  if (diff === 1) return { label: "Завтра", tone: "warn" };
  if (diff < 7) return { label: `Через ${diff} дн.`, tone: "ok" };
  return { label: formatShort(key), tone: "ok" };
};
