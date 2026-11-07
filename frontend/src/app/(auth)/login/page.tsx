"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api";
import { School, Lock, Mail, AlertTriangle, ShieldCheck } from "lucide-react";

function LoginForm() {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, restoreError, usuario } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Se já estiver logado, redireciona para a tela adequada
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.perfil === "PROFESSOR") {
        router.push("/professor/turmas");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, usuario, router]);

  // Mensagem caso o token tenha sido revogado por troca de senha ou logout
  useEffect(() => {
    if (searchParams.get("revogado") === "true") {
      setErro("Sua sessão foi encerrada por alteração de segurança. Por favor, entre novamente.");
    }
  }, [searchParams]);

  // Temporizador para Rate Limit 429
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryCountdown && retryCountdown > 0) return;

    setErro(null);
    setLoading(true);

    try {
      await login(identificador, senha);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setRetryCountdown(err.retryAfterSeconds || 60);
          setErro("Limite de tentativas excedido para este endereço IP. Aguarde antes de tentar novamente.");
        } else if (err.status === 401) {
          setErro("E-mail ou senha incorretos. Verifique suas credenciais.");
        } else if (err.status === 403) {
          setErro("Esta conta de usuário foi desativada pela administração.");
        } else {
          setErro(err.message || "Falha ao conectar com o servidor SIGE.");
        }
      } else {
        setErro("Não foi possível estabelecer conexão com a rede local da escola.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Cabeçalho Institucional */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <School className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            SIGE — Educação Municipal
          </h1>
        </div>

        {/* Card de Login Fiel ao Wireframe */}
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">LOGIN</CardTitle>
            <CardDescription>
              Informe seu e-mail institucional
            </CardDescription>
          </CardHeader>
          <CardContent>
            {restoreError && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sessão não validada</AlertTitle>
                <AlertDescription>{restoreError}</AlertDescription>
              </Alert>
            )}
            {erro && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {retryCountdown !== null && retryCountdown > 0 && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Tentativas Bloqueadas (HTTP 429)</AlertTitle>
                <AlertDescription>
                  Tente novamente em{" "}
                  <span className="font-bold text-foreground">
                    {retryCountdown}s
                  </span>
                  .
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-mail institucional
                </label>
                <Input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  disabled={loading || (retryCountdown !== null && retryCountdown > 0)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Senha
                </label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading || (retryCountdown !== null && retryCountdown > 0)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-base font-semibold"
                isLoading={loading}
                disabled={retryCountdown !== null && retryCountdown > 0}
              >
                {retryCountdown !== null && retryCountdown > 0
                  ? `Aguarde ${retryCountdown}s`
                  : "Continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rodapé Informativo */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Rede Local Segura • Servidor Orange Pi</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
