"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { hojeLocalISO } from "@/lib/utils";
import { Aluno, AtribuicaoDocente, SalvarChamadaLoteRequest } from "@/types";
import {
  Check,
  X,
  CheckCheck,
  Calendar,
  Save,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

interface LinhaAlunoChamada {
  alunoId: number;
  matricula: string;
  nome: string;
  presente: boolean;
  justificativa: string;
}

function FrequenciaContent() {
  const searchParams = useSearchParams();
  const turmaIdParam = searchParams.get("turmaId") || "";

  // Data atual formatada para YYYY-MM-DD no fuso local do navegador
  const dataHoje = hojeLocalISO();
  const [dataSelecionada, setDataSelecionada] = useState(dataHoje);
  const [turmaIdSelecionada, setTurmaIdSelecionada] = useState(turmaIdParam);
  const [minhasTurmas, setMinhasTurmas] = useState<{ id: number; nome: string }[]>([]);

  const [listaAlunos, setListaAlunos] = useState<LinhaAlunoChamada[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (turmaIdParam) {
      setTurmaIdSelecionada(turmaIdParam);
    }
  }, [turmaIdParam]);

  useEffect(() => {
    async function carregarMinhasTurmas() {
      try {
        const atribs = await apiRequest<AtribuicaoDocente[]>("/atribuicoes/minhas");
        const mapa = new Map<number, string>();
        atribs.forEach((a) => {
          if (!mapa.has(a.turmaId)) {
            mapa.set(a.turmaId, `${a.turmaNome} — ${a.serie} (${a.escolaNome})`);
          }
        });
        const opcoes = Array.from(mapa.entries()).map(([id, nome]) => ({ id, nome }));
        setMinhasTurmas(opcoes);
        if (!turmaIdParam && opcoes.length > 0) {
          setTurmaIdSelecionada(String(opcoes[0].id));
        }
      } catch {
        // Caso não haja atribuições ou ocorra erro, mantém seleção atual
      }
    }
    carregarMinhasTurmas();
  }, [turmaIdParam]);

  useEffect(() => {
    async function carregarDadosChamada() {
      if (!turmaIdSelecionada) {
        setListaAlunos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSucesso(false);
      setErro(null);

      try {
        // 1. Carrega alunos da turma
        const [alunos, frequenciasSalvas] = await Promise.all([
          apiRequest<Aluno[]>(`/turmas/${turmaIdSelecionada}/alunos`),
          apiRequestAllPages<any>("/frequencias", {
            params: { turmaId: Number(turmaIdSelecionada), data: dataSelecionada },
          }),
        ]);

        const mapaSalvo = new Map<number, { presente: boolean; observacao?: string }>();
        frequenciasSalvas.forEach((f) => {
          mapaSalvo.set(f.alunoId, { presente: f.presente, observacao: f.observacao });
        });

        // Monta as linhas da chamada
        const linhas: LinhaAlunoChamada[] = alunos.map((aluno) => {
          const salvo = mapaSalvo.get(aluno.id);
          return {
            alunoId: aluno.id,
            matricula: aluno.matricula,
            nome: aluno.nome,
            presente: salvo ? salvo.presente : true, // Padrão: presente
            justificativa: salvo?.observacao || "",
          };
        });

        setListaAlunos(linhas);
      } catch (err) {
        setListaAlunos([]);
        setErro(err instanceof ApiError ? err.message : "Não foi possível carregar a chamada.");
      } finally {
        setLoading(false);
      }
    }

    carregarDadosChamada();
  }, [turmaIdSelecionada, dataSelecionada]);

  // Ação em lote: Marcar todos como presentes (conforme wireframe)
  const marcarTodosPresentes = () => {
    setListaAlunos((prev) =>
      prev.map((item) => ({
        ...item,
        presente: true,
      }))
    );
  };

  // Alternar presença do aluno (Verde <-> Vermelho/Rosa)
  const togglePresenca = (alunoId: number) => {
    setListaAlunos((prev) =>
      prev.map((item) =>
        item.alunoId === alunoId ? { ...item, presente: !item.presente } : item
      )
    );
  };

  // Alterar campo de justificativa
  const alterarJustificativa = (alunoId: number, texto: string) => {
    setListaAlunos((prev) =>
      prev.map((item) =>
        item.alunoId === alunoId ? { ...item, justificativa: texto } : item
      )
    );
  };

  // Salvar chamada em lote via POST /api/frequencias/lote
  const salvarChamada = async () => {
    setSalvando(true);
    setSucesso(false);
    setErro(null);

    if (listaAlunos.length === 0) {
      setErro("Não há alunos carregados para salvar a chamada.");
      setSalvando(false);
      return;
    }

    const payload: SalvarChamadaLoteRequest = {
      turmaId: Number(turmaIdSelecionada),
      data: dataSelecionada,
      registros: listaAlunos.map((item) => ({
        alunoId: item.alunoId,
        presente: item.presente,
        observacao: item.justificativa ? item.justificativa : null,
      })),
    };

    try {
      await apiRequest("/frequencias/lote", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSucesso(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar a chamada.");
    } finally {
      setSalvando(false);
    }
  };

  const totalPresentes = listaAlunos.filter((a) => a.presente).length;
  const totalFaltas = listaAlunos.length - totalPresentes;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in-50 duration-300">
      {/* Botão Voltar & Cabeçalho */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/professor/turmas">
          <Button variant="ghost" size="icon" title="Voltar para Turmas">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            FREQUÊNCIA
          </h1>
          <p className="text-xs text-muted-foreground">
            {turmaIdSelecionada ? `Diário de classe eletrônico da turma #${turmaIdSelecionada}` : "Selecione uma turma para fazer a chamada."}
          </p>
        </div>
      </div>

      {sucesso && (
        <Alert variant="success" aria-live="polite">
          <FileCheck className="h-4 w-4" />
          <AlertTitle>Chamada Salva com Sucesso!</AlertTitle>
          <AlertDescription>
            Os registros de frequência para o dia {dataSelecionada} foram salvos com integridade no banco de dados.
          </AlertDescription>
        </Alert>
      )}

      {erro && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha ao Salvar</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* 1. SELEÇÃO DE TURMA E DATA */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Histórico, Turma e Seleção de Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {minhasTurmas.length > 0 && (
              <div>
                <label htmlFor="turma-chamada" className="text-xs font-medium">Turma</label>
                <select
                  id="turma-chamada"
                  value={turmaIdSelecionada}
                  onChange={(e) => setTurmaIdSelecionada(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {minhasTurmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="data-chamada" className="text-xs font-medium">Data da chamada</label>
              <Input
                id="data-chamada"
                type="date"
                value={dataSelecionada}
                max={dataHoje}
                onChange={(event) => setDataSelecionada(event.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. BARRA DE CONTROLE & BOTÃO "MARCAR TODOS COMO PRESENTES" */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
            {totalPresentes} Presentes
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 font-bold">
            <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
            {totalFaltas} Faltas
          </span>
        </div>

        {/* Botão em destaque idêntico ao wireframe */}
        <Button
          variant="outline"
          onClick={marcarTodosPresentes}
          className="font-bold border-emerald-500 text-emerald-700 hover:bg-emerald-50 h-11 min-h-[44px]"
        >
          <CheckCheck className="h-4 w-4 mr-2 text-emerald-600" />
          Marcar todos como presentes
        </Button>
      </div>

      {/* 3. GRADE / TABELA DE CHAMADA COM SWITCHES VERDE / VERMELHO */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="bg-muted/50 p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
              Lista de Alunos ({listaAlunos.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Toque no switch para alternar Presença / Falta
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {listaAlunos.map((aluno) => (
            <div
              key={aluno.alunoId}
              className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                aluno.presente
                  ? "bg-background hover:bg-muted/30"
                  : "bg-rose-50/40 dark:bg-rose-950/20"
              }`}
            >
              {/* Botão de Presença Tátil e Dados do Aluno */}
              <div className="flex items-center gap-3">
                {/* Switch de Presença: Verde (Presente) / Vermelho (Falta) conforme wireframe */}
                <button
                  type="button"
                  aria-label={`Presença de ${aluno.nome}: ${aluno.presente ? "Presente" : "Falta"}`}
                  onClick={() => togglePresenca(aluno.alunoId)}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-transform active:scale-90 select-none ${
                    aluno.presente
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-500 hover:bg-rose-600"
                  }`}
                  title={aluno.presente ? "Presente (Clique para dar falta)" : "Falta (Clique para dar presença)"}
                >
                  {aluno.presente ? (
                    <Check className="h-6 w-6 stroke-[3]" />
                  ) : (
                    <X className="h-6 w-6 stroke-[3]" />
                  )}
                </button>

                <div>
                  <p className="font-bold text-base text-foreground leading-tight">
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Matrícula: <span className="font-mono">{aluno.matricula}</span>
                  </p>
                </div>
              </div>

              {/* Campo Justificativa (Opcional) */}
              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  aria-label={`Justificativa de ${aluno.nome}`}
                  value={aluno.justificativa}
                  onChange={(e) => alterarJustificativa(aluno.alunoId, e.target.value)}
                  className="h-10 text-xs bg-background/80"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. BOTÃO FIXO NO RODAPÉ: "SALVAR CHAMADA" */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-background/95 border-t p-4 backdrop-blur-md shadow-2xl flex justify-center">
        <div className="w-full max-w-4xl flex items-center justify-between gap-4">
          <div className="hidden sm:block text-xs text-muted-foreground">
            Lote atômico de {listaAlunos.length} registros para {dataSelecionada}
          </div>
          <Button
            onClick={salvarChamada}
            isLoading={salvando}
            disabled={listaAlunos.length === 0 || loading || !!erro}
            className="w-full sm:w-auto px-8 font-bold text-base h-12 shadow-md bg-primary hover:bg-primary/90"
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Chamada
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FrequenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <FrequenciaContent />
    </Suspense>
  );
}
