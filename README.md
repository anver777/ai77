# Aurora — премиальное личное пространство целей 🪐

Мобильное по ощущениям PWA-приложение для целей, заметок и привычек: тёмно-синяя палитра
с неоновыми акцентами, стекло (glassmorphism), плавные анимации и приватный раздел под PIN.

## Возможности

- **Авторизация** — email/пароль (Supabase) или полностью локальный режим / гостевой вход.
- **Синхронизация** — при наличии Supabase состояние сохраняется в таблицу `user_state` (jsonb).
- **Главный экран** — приветствие, дата, кольцо прогресса дня, выполнено/осталось/пропущено,
  streak, ближайшие задачи и цитата дня (меняется ежедневно).
- **Мои цели** — создание, редактирование, удаление, закрепление, перетаскивание (dnd-kit),
  приоритеты, категории, дедлайны, чек-листы, поиск и фильтры. Статусы: ✅ выполнено / ❌ нет.
- **Личные цели** — отдельный защищённый раздел: PIN-код + биометрия (WebAuthn, если доступна).
- **Заметки** — текст, изображения, чек-листы, закрепление, категории, поиск.
- **Календарь и аналитика** — отметки задач по дням, графики за неделю/месяц/год, heatmap
  активности, разбивка по категориям, текущая и рекордная серия.
- **Профиль** — аватар, статистика, тёмная/светлая тема, акцентный цвет, свои категории,
  напоминания, экспорт/импорт JSON.
- **PWA** — manifest, service worker, офлайн-кеш, установка на домашний экран.

## Стек

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · dnd-kit · Supabase JS · lucide-react

## Запуск

```bash
npm install
npm run dev
npm run build      # production сборка в dist/
```

## Supabase (необязательно)

Создайте `.env` на основе `.env.example`:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

SQL для синхронизации:

```sql
create table user_state (
  user_id uuid primary key references auth.users on delete cascade,
  payload jsonb not null,
  updated_at timestamptz default now()
);
alter table user_state enable row level security;
create policy "own row" on user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Без переменных окружения приложение работает офлайн: аккаунты и данные хранятся в localStorage.

## Деплой

- **Netlify** — конфиг в `netlify.toml` (`npm run build`, каталог `dist`, SPA-redirect).
- **GitHub Pages / любой статик-хостинг** — достаточно отдать содержимое `dist/`.

## Структура

```
src/
  components/   переиспользуемые UI-блоки (Sheet, Charts, GoalCard, PinLock…)
  context/      AuthContext (вход) и DataContext (данные, тема, синхронизация)
  hooks/        useReminders — локальные ежедневные напоминания
  lib/          даты, статистика, хранилище, цитаты, supabase-клиент
  pages/        Auth, Home, Stats, Profile, Vault
```
