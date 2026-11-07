"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { ResumoRedeResponse } from "@/types";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  ClipboardCheck,
  UserPlus,
  ArrowRight,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [resumo, setResumo] = useState<ResumoRedeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarResumo() {
      try {
        const data = await apiRequest<ResumoRedeResponse>("/relatorios/resumo");
        setResumo(data);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível carregar o resumo.");
      } finally {
        setLoading(false);
      }
    }

    carregarResumo();
  }, []);

  if (!usuario) return null;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. SEÇÃO DE MÉTRICAS RÁPIDAS (ADAPTATIVO) */}
      <section className="space-y-3">
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Métricas Rápidas
          </h2>
          <Badge variant="outline" className="text-xs">
            {usuario.perfil === "ADMIN" && "Rede Municipal"}
            {usuario.perfil === "SECRETARIO" && "Unidade Escolar"}
            {usuario.perfil === "PROFESSOR" && "Minhas Turmas"}
            {usuario.perfil === "LEITOR" && "Visão Consolidada"}
          </Badge>
        </div>

        {usuario.perfil === "ADMIN" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Escolas Ativas</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.escolas ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Polos da rede municipal
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Total de Alunos</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.alunosMatriculados ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Matrículas ativas
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Professores</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.professores ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Corpo docente
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Turmas em Andamento</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.turmas ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Turmas cadastradas
              </CardContent>
            </Card>
          </div>
        )}

        {usuario.perfil === "SECRETARIO" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Alunos da Escola</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.alunosMatriculados ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Matrículas regulares
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Turmas Ativas</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.turmas ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Manhã e Tarde
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Docentes Alocados</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.professores ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Com atribuição ativa
              </CardContent>
            </Card>

          </div>
        )}

        {(usuario.perfil === "PROFESSOR" || usuario.perfil === "LEITOR") && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Turmas no escopo</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.turmas ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Turmas vinculadas ao seu perfil
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs font-medium">Alunos matriculados</CardDescription>
                <CardTitle className="text-2xl font-bold">{resumo?.alunosMatriculados ?? (loading ? "..." : "—")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Conforme os dados disponíveis na API
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* 2. SEÇÃO DE ATALHOS RÁPIDOS (ADAPTATIVO) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Atalhos Rápidos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {usuario.perfil === "ADMIN" && (
            <>
              <Link href="/admin/escolas">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <Building2 className="h-5 w-5 text-primary" />
                    Gerenciar Escolas
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/admin/usuarios">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5 text-primary" />
                    Novo Usuário
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/admin/auditoria">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Trilha de Auditoria
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </>
          )}

          {usuario.perfil === "SECRETARIO" && (
            <>
              <Link href="/secretaria/matriculas">
                <Button className="w-full justify-between h-14 px-4 shadow-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <UserPlus className="h-5 w-5" />
                    Nova Matrícula
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/secretaria/alunos">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5 text-primary" />
                    Cadastrar Aluno
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/secretaria/turmas">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Quadro de Turmas
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </>
          )}

          {usuario.perfil === "PROFESSOR" && (
            <>
              <Link href="/professor/turmas">
                <Button className="w-full justify-between h-14 px-4 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white">
                  <span className="flex items-center gap-2 font-bold">
                    <ClipboardCheck className="h-5 w-5" />
                    Minhas Turmas
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/perfil/senha">
                <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                  <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Segurança & Senha
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </>
          )}
          {usuario.perfil === "LEITOR" && (
            <Link href="/relatorios/resumo">
              <Button variant="outline" className="w-full justify-between h-14 px-4 border-dashed">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  Relatórios Consolidados
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
