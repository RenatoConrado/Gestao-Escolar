"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { ArrowLeft, Save, AlertCircle, Info } from "lucide-react";

export default function NovaMatriculaPage() {
  const router = useRouter();

  const [alunoId, setAlunoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [dataMatricula, setDataMatricula] = useState(new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Alunos e turmas disponíveis
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);

  React.useEffect(() => {
    async function carregarOpcoes() {
      try {
        const [alunos, turmas] = await Promise.all([
          apiRequestAllPages<any>("/alunos"),
          apiRequestAllPages<any>("/turmas"),
        ]);
        const alunosOptions = alunos.map((a) => ({ id: a.id, nome: `${a.nome} (Matrícula: ${a.matricula})` }));
        const turmasOptions = turmas.map((t) => ({ id: t.id, nome: `${t.nome} — ${t.serie} (Turno ${t.turno})` }));
        setAlunosDisponiveis(alunosOptions);
        setTurmasDisponiveis(turmasOptions);
        setAlunoId(alunosOptions[0] ? String(alunosOptions[0].id) : "");
        setTurmaId(turmasOptions[0] ? String(turmasOptions[0].id) : "");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível carregar alunos e turmas.");
      } finally {
        setCarregandoOpcoes(false);
      }
    }

    carregarOpcoes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      await apiRequest("/matriculas", {
        method: "POST",
        body: JSON.stringify({
          alunoId: Number(alunoId),
          turmaId: Number(turmaId),
          situacao: "ATIVA",
          dataMatricula,
        }),
      });

      router.push("/secretaria/matriculas?sucesso=matriculado");
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErro("Conflito: Este aluno já possui uma matrícula ATIVA para o ano letivo desta turma.");
        } else {
          setErro(err.message || "Erro ao efetivar matrícula.");
        }
      } else {
        setErro("Não foi possível conectar à API para efetivar a matrícula.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/secretaria/matriculas">
          <Button variant="ghost" size="icon" title="Voltar para Matrículas">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nova Matrícula & Enturmação
          </h1>
        </div>
      </div>

      <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 border-amber-300">
        <Info className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        <AlertTitle className="text-amber-900 dark:text-amber-200">Regra de Consistência</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          O sistema garante que cada aluno possui no máximo uma matrícula <strong>ATIVA</strong> por ano letivo em toda a rede municipal.
        </AlertDescription>
      </Alert>

      {erro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível matricular</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Selecione o Aluno *
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                disabled={carregandoOpcoes || alunosDisponiveis.length === 0}
                required
              >
                {alunosDisponiveis.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Selecione a Turma *
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                disabled={carregandoOpcoes || turmasDisponiveis.length === 0}
                required
              >
                {turmasDisponiveis.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Data da Matrícula *
              </label>
              <Input
                type="date"
                value={dataMatricula}
                onChange={(e) => setDataMatricula(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <div className="p-6 border-t flex justify-end gap-3 bg-muted/20">
            <Link href="/secretaria/matriculas">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={loading} disabled={carregandoOpcoes || !alunoId || !turmaId} className="gap-2 font-semibold">
              <Save className="h-4 w-4" />
              Efetivar Matrícula
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
