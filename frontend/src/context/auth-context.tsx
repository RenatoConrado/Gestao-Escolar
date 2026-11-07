"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Usuario, LoginResponse } from "@/types";
import {
  ApiError,
  getStoredToken,
  setStoredSession,
  clearStoredSession,
  apiRequest,
} from "@/lib/api";

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  restoreError: string | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
  atualizarToken: (novoToken: string) => void;
  temPermissao: (perfisPermitidos: Usuario["perfil"][]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const savedToken = getStoredToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);
      try {
        const currentUser = await apiRequest<Usuario>("/auth/me");
        if (active) {
          setUsuario(currentUser);
          setStoredSession(savedToken, currentUser);
        }
      } catch (err) {
        if (active) {
          setToken(null);
          setUsuario(null);
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            clearStoredSession();
          } else {
            setRestoreError("Não foi possível validar a sessão. Verifique a conexão com a API e entre novamente.");
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, senha: string): Promise<Usuario> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          senha,
        }),
      });

      setToken(data.token);
      setUsuario(data.usuario);
      setRestoreError(null);
      setStoredSession(data.token, data.usuario);
      router.push(data.usuario.perfil === "PROFESSOR" ? "/professor/turmas" : "/dashboard");
      return data.usuario;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUsuario(null);
    setRestoreError(null);
    router.push("/login");
  }, [router]);

  const atualizarToken = (novoToken: string) => {
    setToken(novoToken);
    if (usuario) {
      setStoredSession(novoToken, usuario);
    }
  };

  const temPermissao = (perfisPermitidos: Usuario["perfil"][]): boolean => {
    if (!usuario) return false;
    return perfisPermitidos.includes(usuario.perfil);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isLoading,
        restoreError,
        isAuthenticated: !!token && !!usuario,
        login,
        logout,
        atualizarToken,
        temPermissao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
