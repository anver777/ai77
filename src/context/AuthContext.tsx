import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import type { AuthUser } from "@/types";
import { sha256, uid } from "@/lib/storage";
import { cloudEnabled, supabase } from "@/lib/supabase";

interface LocalAccount {
  id: string;
  email: string;
  name: string;
  passHash: string;
}

const ACCOUNTS_KEY = "aurora:accounts";
const SESSION_KEY = "aurora:session";

const readAccounts = (): LocalAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as LocalAccount[];
  } catch {
    return [];
  }
};
const writeAccounts = (list: LocalAccount[]) =>
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  cloud: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const boot = async () => {
      if (cloudEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        if (active && s?.user) {
          setUser({
            id: s.user.id,
            email: s.user.email || "",
            name: (s.user.user_metadata?.name as string) || s.user.email?.split("@")[0] || "Пользователь",
            provider: "supabase",
          });
        }
      }
      if (!cloudEnabled) {
        const sessionId = localStorage.getItem(SESSION_KEY);
        if (sessionId) {
          const acc = readAccounts().find((a) => a.id === sessionId);
          if (acc && active) {
            setUser({ id: acc.id, email: acc.email, name: acc.name, provider: "local" });
          } else if (sessionId === "guest" && active) {
            setUser({ id: "guest", email: "guest@aurora.app", name: "Гость", provider: "local" });
          }
        }
      }
      if (active) setLoading(false);
    };
    void boot();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const mail = email.trim().toLowerCase();
    if (cloudEnabled && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) throw new Error(error.message);
      const u = data.user!;
      setUser({
        id: u.id, email: u.email || mail,
        name: (u.user_metadata?.name as string) || mail.split("@")[0], provider: "supabase",
      });
      return;
    }
    const acc = readAccounts().find((a) => a.email === mail);
    if (!acc) throw new Error("Аккаунт не найден. Создайте новый.");
    if (acc.passHash !== (await sha256(password))) throw new Error("Неверный пароль");
    localStorage.setItem(SESSION_KEY, acc.id);
    setUser({ id: acc.id, email: acc.email, name: acc.name, provider: "local" });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const mail = email.trim().toLowerCase();
    if (password.length < 6) throw new Error("Пароль от 6 символов");
    if (cloudEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: mail, password, options: { data: { name } },
      });
      if (error) throw new Error(error.message);
      if (data.user) {
        setUser({ id: data.user.id, email: mail, name, provider: "supabase" });
      }
      return;
    }
    const list = readAccounts();
    if (list.some((a) => a.email === mail)) throw new Error("Такой email уже зарегистрирован");
    const acc: LocalAccount = { id: uid(), email: mail, name: name.trim() || "Пользователь", passHash: await sha256(password) };
    writeAccounts([...list, acc]);
    localStorage.setItem(SESSION_KEY, acc.id);
    setUser({ id: acc.id, email: acc.email, name: acc.name, provider: "local" });
  }, []);

  const signInAsGuest = useCallback(async () => {
    localStorage.setItem(SESSION_KEY, "guest");
    setUser({ id: "guest", email: "guest@aurora.app", name: "Гость", provider: "local" });
  }, []);

  const signOut = useCallback(async () => {
    if (cloudEnabled && supabase) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, cloud: cloudEnabled, signIn, signUp, signInAsGuest, signOut }),
    [user, loading, signIn, signUp, signInAsGuest, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
