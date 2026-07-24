import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase подключается автоматически, если заданы переменные окружения:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Ожидаемая таблица для синхронизации:
 *   create table user_state (
 *     user_id uuid primary key references auth.users on delete cascade,
 *     payload jsonb not null,
 *     updated_at timestamptz default now()
 *   );
 * Без переменных приложение работает полностью офлайн (локальное хранилище).
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const cloudEnabled = Boolean(supabase);
