"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequestAllPages } from "@/lib/api";
import { Plus, Search, Calendar, GraduationCap, School } from "lucide-react";

interface MatriculaItem {
  id: number;
  alunoId: number;
  alunoNome: string;
  turmaId: number;
  turmaNome: string;
  anoLetivoId: number;
  situacao: "ATIVA" | "CANCELADA" | "TRANSFERIDA" | "CONCLUIDA";
  dataMatricula: string;
}

export default function SecretariaMatriculasPage() {
  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarMatriculas() {
      try {
        const lista = await apiRequestAllPages<any>("/matriculas");
        setMatriculas(
            lista.map((m) => ({
              id: m.id,
              alunoId: m.alunoId,
              alunoNome: m.alunoNome,
              turmaId: m.turmaId,
              turmaNome: m.turmaNome,
              anoLetivoId: m.anoLetivoId,
              situacao: m.situacao,
              dataMatricula: m.dataMatricula,
            }))
          );
      } catch (err) {
        setMatriculas([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar as matrículas.");
      } finally {
        setLoading(false);
      }
    }

    carregarMatriculas();
  }, []);

  const totalAtivas = matriculas.filter((m) => m.situacao === "ATIVA").length;
  const totalTransferidas = matriculas.filter((m) => m.situacao === "TRANSFERIDA").length;

  const filtradas = matriculas.filter(
    (m) =>
      m.alunoNome.toLowerCase().includes(busca.toLowerCase()) ||
      m.turmaNome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Matrículas & Movimentação Escolar
          </h1>
        </div>
        <Link href="/secretaria/matriculas/nova">
          <Button className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Nova Matrícula
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Matrículas Ativas</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalAtivas}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Enturmados no ano letivo corrente
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Transferências / Canceladas</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalTransferidas}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Movimentação no período
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Regra de Consistência</CardDescription>
            <CardTitle className="text-sm font-semibold">Matrícula Única</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Garantida via índice único parcial no PostgreSQL
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {/* Tabela de Matrículas */}
      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Data Matrícula</th>
                <th className="px-4 py-3 text-center">Situação</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((mat) => (
                <tr key={mat.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {mat.alunoNome}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className="font-mono text-xs">
                      {mat.turmaNome}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                    {mat.dataMatricula ? new Date(`${mat.dataMatricula}T00:00:00`).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      variant={mat.situacao === "ATIVA" ? "success" : "secondary"}
                      className="text-xs"
                    >
                      {mat.situacao}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/secretaria/alunos/${mat.alunoId}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                        Prontuário
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!erro && !loading && filtradas.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma matrícula encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
