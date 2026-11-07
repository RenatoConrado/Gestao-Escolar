"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, ApiError } from "@/lib/api";
import { KeyRound, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlterarSenhaPage() {
  const { atualizarToken, usuario } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (novaSenha.length < 8 || novaSenha.length > 72) {
      setErro("A nova senha deve possuir entre 8 e 72 caracteres (limite do algoritmo BCrypt).");
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setErro("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErro("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<{ token: string; usuario: import("@/types").Usuario }>("/auth/alterar-senha", {
        method: "PUT",
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
        }),
      });

      if (response?.token) {
        atualizarToken(response.token);
      }

      setSucesso(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmaSenha("");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErro(err.message || "Erro ao processar alteração de senha.");
      } else {
        setErro("Não foi possível conectar à API para alterar a senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-in fade-in-50 duration-300">
      <Card className="shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">ALTERAR SENHA</CardTitle>
        </CardHeader>
        <CardContent>
          {erro && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro na Validação</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {sucesso && (
            <Alert variant="success" className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Senha Alterada</AlertTitle>
              <AlertDescription>
                Sua credencial foi atualizada com sucesso. Seu acesso continua ativo de forma segura.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Senha Atual
              </label>
              <Input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Nova Senha
              </label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-[11px] text-muted-foreground">
                Deve ter entre 8 e 72 caracteres.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Confirme Nova Senha
              </label>
              <Input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              isLoading={loading}
            >
              Confirmar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Invalidação síncrona de sessões via versão de token</span>
      </div>
    </div>
  );
}
