"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarCpfEntrada, formatarTelefoneEntrada } from "@/lib/utils";
import { useSessionDraft } from "@/lib/use-session-draft";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NovoAlunoPage() {
  const router = useRouter();
  const [form, setForm, clearDraft] = useSessionDraft("aluno-form-novo", {
    nome: "", matricula: "", dataNascimento: "", cpf: "", responsavel: "", telefone: "", endereco: "",
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const cpfLimpo = form.cpf.replace(/\D/g, "");

    try {
      await apiRequest("/alunos", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome,
          matricula: form.matricula,
          dataNascimento: form.dataNascimento,
          cpf: cpfLimpo ? cpfLimpo : null,
          responsavel: form.responsavel,
          telefone: form.telefone,
          endereco: form.endereco,
        }),
      });

      clearDraft();
      router.push("/secretaria/alunos?sucesso=cadastrado");
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErro("Já existe um aluno cadastrado com esta matrícula ou CPF.");
        } else {
          setErro(err.message || "Erro ao registrar aluno no sistema.");
        }
      } else {
        setErro("Não foi possível conectar à API para cadastrar o aluno.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/secretaria/alunos">
          <Button variant="ghost" size="icon" title="Voltar para Alunos">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cadastrar Novo Aluno
          </h1>
        </div>
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível cadastrar</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Nome Completo do Aluno *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Matrícula do Aluno *
                </label>
                <Input
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  maxLength={30}
                  pattern="[A-Za-z0-9./-]{1,30}"
                  title="Use letras, números, ponto, barra ou hífen (até 30 caracteres)."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Data de Nascimento *
                </label>
                <Input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  CPF do Aluno
                </label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatarCpfEntrada(e.target.value) })}
                  maxLength={14}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Telefone de Contato
                </label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatarTelefoneEntrada(e.target.value) })}
                  type="tel"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Nome do Responsável Legal
                </label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Endereço Residencial
                </label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                />
              </div>
            </div>
          </CardContent>

          <div className="p-6 border-t flex justify-end gap-3 bg-muted/20">
            <Link href="/secretaria/alunos">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={loading} className="gap-2 font-semibold">
              <Save className="h-4 w-4" />
              Salvar Aluno
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
