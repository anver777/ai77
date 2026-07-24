export type Priority = "low" | "medium" | "high";
export type GoalStatus = "active" | "done" | "failed";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  priority: Priority;
  status: GoalStatus;
  deadline?: string; // yyyy-mm-dd
  pinned: boolean;
  order: number;
  vault: boolean; // личные (защищённые) цели
  checklist: ChecklistItem[];
  createdAt: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  pinned: boolean;
  vault: boolean;
  images: string[];
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  system?: boolean;
}

export interface Settings {
  theme: "dark" | "light";
  displayName: string;
  avatar: string; // emoji or dataURL
  pinHash: string | null;
  biometricEnabled: boolean;
  reminders: boolean;
  reminderTime: string;
  accent: string;
}

export interface AppState {
  goals: Goal[];
  notes: Note[];
  categories: Category[];
  settings: Settings;
  version: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: "local" | "supabase";
}
