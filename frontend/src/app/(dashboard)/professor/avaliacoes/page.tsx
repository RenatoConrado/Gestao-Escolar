"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages } from "@/lib/api";
import { Aluno } from "@/types";
import {
  Plus,
  ArrowLeft,
  Calendar,
  Save,
  FileCheck,
  AlertCircle,
  X,
} from "lucide-react";

interface Avaliacao {
  id: number;
  atribuicaoId: number;
  nome: string;
  data: string;
  valorMaximo: number;
}

interface LinhaNotaAluno {
  alunoId: number;
  matricula: string;
  nome: string;
  notaId?: number;
  valor: string; // representação em string para input
}

function AvaliacoesContent() {
  const searchParams = useSearchParams();
  const atribuicaoIdParam = searchParams.get("atribuicaoId") || "";
  const turmaIdParam = searchParams.get("turmaId") || "";

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [avaliacaoAtiva, setAvaliacaoAtiva] = useState<Avaliacao | null>(null);
  const [linhasNotas, setLinhasNotas] = useState<LinhaNotaAluno[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Modal de Criação de Nova Avaliação
  const [modalAberta, setModalAberta] = useState(false);
  const [nomeNovaAvaliacao, setNomeNovaAvaliacao] = useState("");
  const [dataNovaAvaliacao, setDataNovaAvaliacao] = useState(new Date().toISOString().split("T")[0]);
  const [valorMaximoNova, setValorMaximoNova] = useState("10.00");
  const [criando, setCriando] = useState(false);

  // 1. Carrega as avaliações desta atribuição
  useEffect(() => {
    async function carregarAvaliacoes() {
      if (!atribuicaoIdParam) {
        setErro("Selecione uma atribuição docente para consultar as avaliações.");
        setAvaliacoes([]);
        setAvaliacaoAtiva(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErro(null);
      try {
        const lista = await apiRequestAllPages<Avaliacao>("/avaliacoes", {
          params: { atribuicaoId: Number(atribuicaoIdParam) },
        });
        setAvaliacoes(lista);
        setAvaliacaoAtiva(lista[0] ?? null);
      } catch (err) {
        setAvaliacoes([]);
        setAvaliacaoAtiva(null);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar as avaliações.");
      } finally {
        setLoading(false);
      }
    }

    carregarAvaliacoes();
  }, [atribuicaoIdParam]);

  // 2. Carrega os alunos e as notas da avaliação ativa
  useEffect(() => {
    if (!avaliacaoAtiva) return;
    const avaliacaoId = avaliacaoAtiva.id;

    async function carregarNotas() {
      setLoading(true);
      setSucesso(false);
      setErro(null);

      try {
        if (!turmaIdParam) throw new Error("A turma não foi informada.");
        const [alunos, notasSalvas] = await Promise.all([
          apiRequest<Aluno[]>(`/turmas/${turmaIdParam}/alunos`),
          apiRequestAllPages<any>(`/notas/avaliacao/${avaliacaoId}`),
        ]);

        const mapaNotas = new Map<number, { id: number; valor: number }>();
        notasSalvas.forEach((n) => mapaNotas.set(n.alunoId, { id: n.id, valor: n.valor }));

        const linhas: LinhaNotaAluno[] = alunos.map((aluno) => {
          const nota = mapaNotas.get(aluno.id);
          return {
            alunoId: aluno.id,
            matricula: aluno.matricula,
            nome: aluno.nome,
            notaId: nota?.id,
            valor: nota ? String(nota.valor) : "",
          };
        });

        setLinhasNotas(linhas);
      } catch (err) {
        setLinhasNotas([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar alunos e notas.");
      } finally {
        setLoading(false);
      }
    }

    carregarNotas();
  }, [avaliacaoAtiva, turmaIdParam]);

  // Alterar valor da nota individual
  const alterarNota = (alunoId: number, valorDigitado: string) => {
    setLinhasNotas((prev) =>
      prev.map((item) =>
        item.alunoId === alunoId ? { ...item, valor: valorDigitado } : item
      )
    );
  };

  // Criar nova avaliação via POST /api/avaliacoes
  const handleCriarAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    setErro(null);

    if (!atribuicaoIdParam) {
      setErro("A atribuição docente não foi informada.");
      setCriando(false);
      return;
    }

    const valorMax = parseFloat(valorMaximoNova.replace(",", "."));
    if (isNaN(valorMax) || valorMax <= 0) {
      setErro("O valor máximo da avaliação deve ser um número positivo.");
      setCriando(false);
      return;
    }

    try {
      const nova = await apiRequest<Avaliacao>("/avaliacoes", {
        method: "POST",
        body: JSON.stringify({
          atribuicaoId: Number(atribuicaoIdParam),
          nome: nomeNovaAvaliacao,
          data: dataNovaAvaliacao,
          valorMaximo: valorMax,
        }),
      });

      setAvaliacoes((prev) => [...prev, nova]);
      setAvaliacaoAtiva(nova);
      setModalAberta(false);
      setNomeNovaAvaliacao("");
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a avaliação.");
    } finally {
      setCriando(false);
    }
  };

  // Salvar notas digitadas
  const handleSalvarNotas = async () => {
    if (!avaliacaoAtiva) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);

    // Validação de negócio da API: nota.valor <= avaliacao.valorMaximo
    for (const linha of linhasNotas) {
      if (linha.valor.trim() !== "") {
        const num = parseFloat(linha.valor.replace(",", "."));
        if (isNaN(num) || num < 0 || num > avaliacaoAtiva.valorMaximo) {
          setErro(`A nota de ${linha.nome} deve estar entre 0 e ${avaliacaoAtiva.valorMaximo}.`);
          setSalvando(false);
          return;
        }
      }
    }

    try {
      // Salva notas individualmente (cria se nova, atualiza se já existir)
      const atualizadas: LinhaNotaAluno[] = [];
      for (const linha of linhasNotas) {
        if (linha.valor.trim() !== "") {
          const num = parseFloat(linha.valor.replace(",", "."));
          if (linha.notaId) {
            await apiRequest(`/notas/${linha.notaId}`, {
              method: "PUT",
              body: JSON.stringify({ valor: num }),
            });
            atualizadas.push({ ...linha, valor: String(num) });
          } else {
            const resp = await apiRequest<any>("/notas", {
              method: "POST",
              body: JSON.stringify({
                alunoId: linha.alunoId,
                avaliacaoId: avaliacaoAtiva.id,
                valor: num,
              }),
            });
            atualizadas.push({ ...linha, notaId: resp?.id, valor: String(num) });
          }
        } else {
          atualizadas.push(linha);
        }
      }
      setLinhasNotas(atualizadas);
      setSucesso(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar as notas.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in-50 duration-300">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/professor/turmas">
            <Button variant="ghost" size="icon" title="Voltar para Turmas">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AVALIAÇÕES & NOTAS
            </h1>
          </div>
        </div>

        <Button onClick={() => setModalAberta(true)} disabled={!atribuicaoIdParam} className="gap-2 font-semibold">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      {sucesso && (
        <Alert variant="success">
          <FileCheck className="h-4 w-4" />
          <AlertTitle>Operação Concluída</AlertTitle>
          <AlertDescription>
            Notas salvas e consolidadas com sucesso no banco de dados.
          </AlertDescription>
        </Alert>
      )}

      {erro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validação de Notas</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {!loading && avaliacoes.length === 0 && !erro && (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação cadastrada para esta atribuição.</p>
      )}

      {/* Seletor de Avaliações */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">
            Selecione a Avaliação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2 mt-2">
            {avaliacoes.map((av) => (
              <Button
                key={av.id}
                variant={avaliacaoAtiva?.id === av.id ? "default" : "outline"}
                onClick={() => setAvaliacaoAtiva(av)}
                className="h-11 font-medium text-xs gap-2"
              >
                <span>{av.nome}</span>
                <Badge variant="secondary" className="text-[10px]">
                  Valor: {Number(av.valorMaximo).toFixed(1)}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grade de Digitação de Notas */}
      {avaliacaoAtiva && (
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-muted/50 p-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {avaliacaoAtiva.nome}
              </CardTitle>
              <CardDescription className="text-xs flex items-center gap-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5" /> Data: {avaliacaoAtiva.data} • Valor Máximo:{" "}
                <span className="font-bold text-foreground">
                  {Number(avaliacaoAtiva.valorMaximo).toFixed(1)} pts
                </span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {linhasNotas.map((item) => (
              <div
                key={item.alunoId}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Matrícula: <span className="font-mono">{item.matricula}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Nota:</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={Number(avaliacaoAtiva.valorMaximo)}
                    value={item.valor}
                    onChange={(e) => alterarNota(item.alunoId, e.target.value)}
                    className="w-24 text-center font-bold font-mono h-11 text-base"
                  />
                  <span className="text-xs text-muted-foreground">
                    / {Number(avaliacaoAtiva.valorMaximo).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Botão Fixo de Salvar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 border-t p-4 backdrop-blur-md shadow-2xl flex justify-center">
        <div className="w-full max-w-4xl flex items-center justify-between gap-4">
          <div className="hidden sm:block text-xs text-muted-foreground">
            Validação ativa: nota máxima permitida de {Number(avaliacaoAtiva?.valorMaximo ?? 10).toFixed(1)} pts
          </div>
          <Button
            onClick={handleSalvarNotas}
            isLoading={salvando}
            className="w-full sm:w-auto px-8 font-bold text-base h-12 shadow-md bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Notas
          </Button>
        </div>
      </div>

      {/* Modal Nova Avaliação */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Nova Avaliação</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalAberta(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCriarAvaliacao}>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Nome da Prova / Trabalho
                  </label>
                  <Input
                    value={nomeNovaAvaliacao}
                    onChange={(e) => setNomeNovaAvaliacao(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Data da Aplicação
                  </label>
                  <Input
                    type="date"
                    value={dataNovaAvaliacao}
                    onChange={(e) => setDataNovaAvaliacao(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Valor Máximo da Nota
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={valorMaximoNova}
                    onChange={(e) => setValorMaximoNova(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalAberta(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={criando} className="font-semibold">
                  Criar Avaliação
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AvaliacoesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AvaliacoesContent />
    </Suspense>
  );
}
