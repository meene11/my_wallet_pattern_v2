"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface AuthCtx {
  user:       AuthUser | null;
  appToken:   string | null;
  isLoggedIn: boolean;
  isLoading:  boolean;
  login:      () => void;
  logout:     () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, appToken: null, isLoggedIn: false, isLoading: true,
  login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user,     setUser]     = useState<AuthUser | null>(null);
  const [appToken, setAppToken] = useState<string | null>(null);

  // Google 로그인 완료 후 백엔드 JWT 교환
  useEffect(() => {
    if (status !== "authenticated" || !session?.idToken) return;

    // 이미 교환된 토큰이 있으면 유효성 확인
    const cached = sessionStorage.getItem("appToken");
    if (cached) {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${cached}` },
        });
        if (res.ok) {
          const u = await res.json();
          setAppToken(cached);
          setUser({ id: u.id, email: u.email, name: u.name, avatar_url: u.avatar_url });
          return;
        }
      } catch {}
      // 토큰 무효 → 캐시 삭제 후 재발급
      sessionStorage.removeItem("appToken");
      sessionStorage.removeItem("appUser");
    }

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: session.idToken }),
        });
        if (!res.ok) throw new Error("Backend auth failed");

        const data = await res.json();
        const u: AuthUser = {
          id:         data.user_id,
          email:      data.email,
          name:       data.name,
          avatar_url: data.avatar_url,
        };
        setAppToken(data.access_token);
        setUser(u);
        sessionStorage.setItem("appToken", data.access_token);
        sessionStorage.setItem("appUser", JSON.stringify(u));
      } catch (e) {
        console.error("Backend auth error:", e);
      }
    })();
  }, [status, session?.idToken]);

  const login  = useCallback(() => signIn("google"), []);
  const logout = useCallback(() => {
    sessionStorage.removeItem("appToken");
    sessionStorage.removeItem("appUser");
    setAppToken(null);
    setUser(null);
    signOut({ redirect: false });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      appToken,
      isLoggedIn: !!appToken,
      isLoading:  status === "loading",
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
