"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/api";
import { Turma } from "@/types";
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  School,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";

interface AlunoFrequenciaLinha {
  alunoId: number;
  matricula: string;
  nome: string;
  totalAulas: number;
  presencas: number;
  faltas: number;
  percentual: number;
  alertaRisco: boolean;
}

export default function RelatorioFrequenciaTurmaPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [alunos, setAlunos] = useState<AlunoFrequenciaLinha[]>([]);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarFrequencia() {
      try {
        const [rawFreq, rawTurma] = await Promise.all([
          apiRequest<any[]>(`/relatorios/turmas/${turmaId}/frequencia`),
          apiRequest<Turma>(`/turmas/${turmaId}`),
        ]);
        setTurma(rawTurma);
        setAlunos(rawFreq.map((item) => {
          const percentual = Number(item.percentualPresenca ?? 0);
          const totalAulas = Number(item.totalRegistros ?? 0);
          return {
            alunoId: item.alunoId,
            matricula: item.matricula,
            nome: item.alunoNome,
            totalAulas,
            presencas: item.presencas,
            faltas: item.faltas,
            percentual,
            alertaRisco: totalAulas > 0 && percentual < 75,
          };
        }));
      } catch (err) {
        setAlunos([]);
        setTurma(null);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar o relatório.");
      } finally {
        setLoading(false);
      }
    }

    carregarFrequencia();
  }, [turmaId]);

  const totalAlunos = alunos.length;
  const alunosEmRisco = alunos.filter((a) => a.alertaRisco);
  const alunosComAula = alunos.filter((a) => a.totalAulas > 0);
  const totalAulasGeral = alunos.length > 0 ? Math.max(...alunos.map((a) => a.totalAulas)) : 0;
  const mediaFrequenciaTurma =
    alunosComAula.length > 0
      ? (
          alunosComAula.reduce((acc, curr) => acc + curr.percentual, 0) / alunosComAula.length
        ).toFixed(1)
      : "0";

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Barra de Ações (Oculta na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href="/secretaria/turmas">
            <Button variant="ghost" size="icon" title="Voltar para Turmas">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mapa de Frequência da Turma
            </h1>
          </div>
          {erro && <Alert variant="destructive"><AlertDescription>{erro}</AlertDescription></Alert>}
        </div>

        <Button onClick={handleImprimir} className="gap-2 font-bold shadow-md">
          <Printer className="h-4 w-4" />
          Imprimir Relatório (A4)
        </Button>
      </div>

      {alunosEmRisco.length > 0 && (
        <Alert variant="warning" className="no-print">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta Pedagógico: Risco de Reprovação por Faltas</AlertTitle>
          <AlertDescription>
            Existem <strong>{alunosEmRisco.length} alunos</strong> com frequência inferior ao limite legal de 75% estabelecido pela LDB.
          </AlertDescription>
        </Alert>
      )}

      {/* ÁREA IMPRIMÍVEL DO RELATÓRIO */}
      <Card className="print-page shadow-md border bg-card text-card-foreground">
        <CardHeader className="border-b pb-4 text-center">
          <div className="flex justify-between items-start">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-bold uppercase text-foreground">
                {turma?.escolaNome || "Escola Municipal"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Relatório de Frequência e Assiduidade • Ano Letivo {turma?.anoLetivo ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="font-mono text-xs">
                Turma #{turmaId} — {turma?.nome || "Turma"}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1">Turno {turma?.turno || "Geral"}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Métricas Rápidas da Turma */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border p-4 rounded-xl bg-muted/20">
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Total de Alunos</span>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalAlunos}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Aulas Registradas</span>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalAulasGeral}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Média da Turma</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{mediaFrequenciaTurma}%</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Alunos em Risco (&lt;75%)</span>
              <p className="text-2xl font-bold mt-1 text-rose-600">{alunosEmRisco.length}</p>
            </div>
          </div>

          {/* Tabela de Frequência Nominal */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Quadro Nominal de Assiduidade
            </h3>

            <div className="table-scroll border rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 uppercase font-semibold text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="p-3">Matrícula</th>
                    <th className="p-3">Nome do Aluno</th>
                    <th className="p-3 text-center">Aulas</th>
                    <th className="p-3 text-center">Presenças</th>
                    <th className="p-3 text-center">Faltas</th>
                    <th className="p-3 text-center">% Frequência</th>
                    <th className="p-3 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alunos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        {loading ? "Carregando frequência..." : "Nenhum registro de frequência encontrado."}
                      </td>
                    </tr>
                  ) : (
                    alunos.map((aluno) => (
                      <tr
                        key={aluno.alunoId}
                        className={`hover:bg-muted/20 transition-colors ${
                          aluno.alertaRisco ? "bg-rose-50/60 dark:bg-rose-950/20 font-medium" : ""
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-foreground">
                          {aluno.matricula}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          {aluno.nome}
                        </td>
                        <td className="p-3 text-center font-mono">{aluno.totalAulas}</td>
                        <td className="p-3 text-center font-mono text-emerald-600 font-bold">
                          {aluno.presencas}
                        </td>
                        <td className="p-3 text-center font-mono text-rose-600 font-bold">
                          {aluno.faltas}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={
                              aluno.alertaRisco ? "text-rose-600 font-extrabold" : "text-emerald-700"
                            }
                          >
                            {aluno.totalAulas > 0 ? `${aluno.percentual.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={aluno.totalAulas === 0 ? "secondary" : !aluno.alertaRisco ? "success" : "destructive"}
                            className="text-[10px]"
                          >
                            {aluno.totalAulas === 0 ? "Sem lançamentos" : !aluno.alertaRisco ? "Regular" : "Risco de Reprovação"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t pt-2">
              <p className="font-semibold text-foreground">Professor Responsável / Coordenação</p>
              <p className="text-[10px] text-muted-foreground">Visto do Diário de Classe</p>
            </div>
            <div className="border-t pt-2">
              <p className="font-semibold text-foreground">Secretaria / Direção Escolar</p>
              <p className="text-[10px] text-muted-foreground">Homologação da Frequência</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-muted-foreground border-t pt-4">
            Documento emitido via SIGE — Sistema de Informação Gerencial da Educação (Edge Computing)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
