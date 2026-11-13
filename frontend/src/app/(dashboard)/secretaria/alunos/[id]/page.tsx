"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarCpf } from "@/lib/utils";
import { Aluno, BoletimAluno } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Printer,
  AlertCircle,
  Info,
} from "lucide-react";

export default function ProntuarioAlunoPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const { usuario } = useAuth();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [boletim, setBoletim] = useState<BoletimAluno | null>(null);
  const [semMatriculaAtiva, setSemMatriculaAtiva] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarAluno() {
      try {
        const dadosAluno = await apiRequest<Aluno>(`/alunos/${alunoId}`);
        setAluno(dadosAluno);
        try {
          const dadosBoletim = await apiRequest<BoletimAluno>(`/relatorios/alunos/${alunoId}`);
          setBoletim(dadosBoletim);
          setSemMatriculaAtiva(false);
        } catch (errBoletim) {
          setBoletim(null);
          if (errBoletim instanceof ApiError && errBoletim.status === 404) {
            setSemMatriculaAtiva(true);
          }
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível carregar o prontuário do aluno.");
      } finally {
        setLoading(false);
      }
    }

    carregarAluno();
  }, [alunoId]);

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <h2 className="text-lg font-bold">{erro || "Aluno não encontrado"}</h2>
        <Link href="/secretaria/alunos">
          <Button variant="outline" className="mt-4">
            Voltar para listagem
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href="/secretaria/alunos">
            <Button variant="ghost" size="icon" title="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Prontuário e Boletim Escolar
            </h1>
          </div>
        </div>

        <Button onClick={handleImprimir} className="gap-2 font-bold shadow-md">
          <Printer className="h-4 w-4" />
          Imprimir Boletim (A4)
        </Button>
      </div>

      {semMatriculaAtiva && (
        <Alert variant="warning" className="no-print">
          <Info className="h-4 w-4" />
          <AlertTitle>Sem matrícula ativa</AlertTitle>
          <AlertDescription>
            Este aluno ainda não possui matrícula ativa no ano letivo corrente. Os dados cadastrais do prontuário estão disponíveis abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* ÁREA IMPRIMÍVEL DO BOLETIM */}
      <Card className="print-page shadow-md border bg-card text-card-foreground">
        {/* Cabeçalho Oficial do Boletim */}
        <CardHeader className="border-b pb-4 text-center">
          <div className="flex justify-between items-start">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-bold uppercase text-foreground">
                {boletim?.escolaNome || "Secretaria Municipal de Educação"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {boletim?.turmaNome
                  ? `Boletim e Prontuário Escolar — ${boletim.turmaNome}`
                  : "Prontuário Cadastral do Aluno (Sem matrícula ativa)"}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Ano Letivo {boletim?.anoLetivo ?? "—"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Ficha Cadastral Resumida */}
          <div className="bg-muted/30 p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold">Nome do Aluno:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">{aluno.nome}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Matrícula:</span>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">{aluno.matricula}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">CPF (LGPD):</span>
              <p className="text-sm font-mono text-foreground mt-0.5">
                {formatarCpf(aluno.cpf, usuario?.perfil !== "ADMIN" && usuario?.perfil !== "SECRETARIO")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Responsável:</span>
              <p className="text-foreground mt-0.5">{aluno.responsavel || "Não informado"}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Telefone:</span>
              <p className="text-foreground mt-0.5">{aluno.telefone || "Não informado"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground font-semibold">Endereço Residencial:</span>
              <p className="text-foreground mt-0.5">{aluno.endereco || "Não informado"}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Turma Atual:</span>
              <p className="font-bold text-primary mt-0.5">{boletim?.turmaNome || "Sem matrícula ativa"}</p>
            </div>
          </div>

          {/* Tabela de Notas e Rendimento Bimestral */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Rendimento Escolar por Disciplina
            </h3>

            <div className="table-scroll border rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 uppercase font-semibold text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="p-3">Componente Curricular</th>
                    <th className="p-3 text-center">Avaliações</th>
                    <th className="p-3 text-center font-bold">Média</th>
                    <th className="p-3">Notas lançadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(boletim?.disciplinas || []).map((disc) => (
                    <tr key={disc.disciplinaId} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{disc.disciplinaNome}</td>
                      <td className="p-3 text-center font-mono">{disc.avaliacoes.length}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">
                        {disc.media === null ? "—" : disc.media.toFixed(2)}
                      </td>
                      <td className="p-3 text-xs">
                        {disc.avaliacoes.length === 0 ? "Nenhuma avaliação cadastrada" : disc.avaliacoes.map((avaliacao) => (
                          <div key={avaliacao.id}>
                            {avaliacao.nome} ({new Date(`${avaliacao.data}T00:00:00`).toLocaleDateString("pt-BR")}):{" "}
                            {avaliacao.valor === null ? "sem nota" : `${avaliacao.valor} / ${avaliacao.valorMaximo}`}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {(!boletim || boletim.disciplinas.length === 0) && (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhuma disciplina atribuída neste ano letivo.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo da Frequência Geral */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border p-4 rounded-xl bg-muted/20">
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Total de Aulas</span>
              <p className="text-xl font-bold mt-0.5">{boletim?.frequencia.totalRegistros ?? 0}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Total de Presenças</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{boletim?.frequencia.presencas ?? 0}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Total de Faltas</span>
              <p className="text-xl font-bold text-rose-600 mt-0.5">{boletim?.frequencia.faltas ?? 0}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">% Frequência Final</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{(boletim?.frequencia.percentualPresenca ?? 0).toFixed(1)}%</p>
            </div>
          </div>

          {/* Assinaturas no Rodapé do Boletim */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t pt-2">
              <p className="font-semibold text-foreground">Secretaria Escolar</p>
              <p className="text-[10px] text-muted-foreground">Responsável pelo Registro</p>
            </div>
            <div className="border-t pt-2">
              <p className="font-semibold text-foreground">Direção da Unidade</p>
              <p className="text-[10px] text-muted-foreground">Homologação Pedagógica</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
