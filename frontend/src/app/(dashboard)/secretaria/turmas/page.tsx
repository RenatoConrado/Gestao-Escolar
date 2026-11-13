"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  School,
  X,
  FileText,
  ClipboardCheck,
  Search,
  CheckCircle2,
} from "lucide-react";

interface TurmaItem {
  id: number;
  nome: string;
  serie: string;
  turno: "MANHA" | "TARDE" | "NOITE" | "INTEGRAL";
  anoLetivo: number;
  escolaId?: number;
  escolaNome: string;
  anoLetivoId: number;
}

interface AlunoMatriculado {
  id: number;
  matricula: string;
  nome: string;
  dataMatricula?: string;
  situacao?: string;
}

interface DocenteAtribuido {
  id: number;
  professorNome: string;
  disciplina: string;
}

export default function TurmasPage() {
  const { usuario } = useAuth();

  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTurno, setFiltroTurno] = useState<string>("TODOS");

  // Escolas e anos letivos disponíveis
  const [escolasDisponiveis, setEscolasDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const [anosLetivosDisponiveis, setAnosLetivosDisponiveis] = useState<{ id: number; ano: number }[]>([]);

  // Modal de Detalhes da Turma (Alunos e Professores)
  const [turmaDetalhe, setTurmaDetalhe] = useState<TurmaItem | null>(null);
  const [alunosDetalhe, setAlunosDetalhe] = useState<AlunoMatriculado[]>([]);
  const [professoresDetalhe, setProfessoresDetalhe] = useState<DocenteAtribuido[]>([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  // Modal de Criação de Turma
  const [modalNovaTurma, setModalNovaTurma] = useState(false);
  const [nomeNova, setNomeNova] = useState("");
  const [serieNova, setSerieNova] = useState("7º Ano");
  const [turnoNovo, setTurnoNovo] = useState<"MANHA" | "TARDE" | "NOITE" | "INTEGRAL">("MANHA");
  const [escolaIdNova, setEscolaIdNova] = useState("");
  const [anoLetivoIdNova, setAnoLetivoIdNova] = useState("");
  const [carregandoOpcoesNova, setCarregandoOpcoesNova] = useState(true);
  const [erroOpcoesNova, setErroOpcoesNova] = useState<string | null>(null);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [erroNova, setErroNova] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      setErro(null);
      setErroOpcoesNova(null);
      setCarregandoOpcoesNova(true);

      let listaEscolas: { id: number; nome: string }[] = [];
      let listaAnos: { id: number; ano: number }[] = [];
      try {
        [listaEscolas, listaAnos] = await Promise.all([
          apiRequestAllPages<any>("/escolas"),
          apiRequestAllPages<any>("/anos-letivos"),
        ]);
        setEscolasDisponiveis(listaEscolas);
        setAnosLetivosDisponiveis(listaAnos);
        if (usuario?.escolaId) setEscolaIdNova(String(usuario.escolaId));
        else if (listaEscolas.length) setEscolaIdNova(String(listaEscolas[0].id));
        if (listaAnos.length) setAnoLetivoIdNova(String(listaAnos[0].id));
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : "Não foi possível carregar escolas e anos letivos.";
        setErro(mensagem);
        setErroOpcoesNova(mensagem);
      } finally {
        setCarregandoOpcoesNova(false);
      }

      try {
        const rawTurmas = await apiRequestAllPages<any>("/turmas");
        const escolasMap = new Map<number, string>(listaEscolas.map((e) => [e.id, e.nome]));
        const anosMap = new Map<number, number>(listaAnos.map((a) => [a.id, a.ano]));
        setTurmas(rawTurmas.map((t) => ({
                id: t.id,
                nome: t.nome,
                serie: t.serie,
                turno: t.turno,
                anoLetivo: anosMap.get(t.anoLetivoId) ?? t.anoLetivoId,
                escolaId: t.escolaId,
                anoLetivoId: t.anoLetivoId,
                escolaNome: t.escolaNome || escolasMap.get(t.escolaId) || `Escola #${t.escolaId}`,
              })));
      } catch (err) {
        setTurmas([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar as turmas.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [usuario]);

  const abrirDetalhes = async (turma: TurmaItem) => {
    setTurmaDetalhe(turma);
    setLoadingDetalhe(true);
    setErroDetalhe(null);

    try {
      const [alunosRes, atribList] = await Promise.all([
        apiRequest<any[]>(`/turmas/${turma.id}/alunos`),
        apiRequestAllPages<any>("/atribuicoes", { params: { turmaId: turma.id } }),
      ]);

      setAlunosDetalhe(
          alunosRes.map((a) => ({
            id: a.id,
            matricula: a.matricula,
            nome: a.nome,
            situacao: "ATIVA",
          }))
        );
      setProfessoresDetalhe(
            atribList.map((at) => ({
              id: at.id,
              professorNome: at.professorNome,
              disciplina: at.disciplinaNome,
            }))
          );
    } catch (err) {
      setAlunosDetalhe([]);
      setProfessoresDetalhe([]);
      setErroDetalhe(err instanceof Error ? err.message : "Não foi possível carregar os detalhes da turma.");
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const handleCriarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    const escId = usuario?.escolaId || Number(escolaIdNova);
    if (!anoLetivoIdNova || !escId) {
      setErroNova("Selecione uma escola e um ano letivo antes de cadastrar a turma.");
      return;
    }

    setSalvandoNova(true);
    setErroNova(null);

    const escNome = escolasDisponiveis.find((e) => e.id === escId)?.nome || "";
    const anoNum = anosLetivosDisponiveis.find((a) => a.id === Number(anoLetivoIdNova))?.ano;

    const payload = {
      nome: nomeNova,
      serie: serieNova,
      turno: turnoNovo,
      anoLetivoId: Number(anoLetivoIdNova),
      escolaId: escId,
    };

    try {
      const criada = await apiRequest<any>("/turmas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const nova: TurmaItem = {
        ...criada,
        anoLetivo: anoNum ?? criada.anoLetivoId,
        anoLetivoId: criada.anoLetivoId,
        escolaNome: escNome,
      };
      setTurmas((prev) => [nova, ...prev]);
      setModalNovaTurma(false);
      setNomeNova("");
      setSucessoMsg(`Turma "${nova.nome}" cadastrada com sucesso!`);
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErroNova(err instanceof ApiError ? err.message : "Não foi possível cadastrar a turma.");
    } finally {
      setSalvandoNova(false);
    }
  };

  const turmasFiltradas = turmas.filter((t) => {
    const matchBusca =
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.serie.toLowerCase().includes(busca.toLowerCase()) ||
      t.escolaNome.toLowerCase().includes(busca.toLowerCase());
    const matchTurno = filtroTurno === "TODOS" || t.turno === filtroTurno;
    return matchBusca && matchTurno;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Cabeçalho e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Turmas e Séries
          </h1>
        </div>

        {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
          <Button onClick={() => setModalNovaTurma(true)} className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Nova Turma
          </Button>
        )}
      </div>

      {sucessoMsg && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{sucessoMsg}</AlertDescription>
        </Alert>
      )}
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          {["TODOS", "MANHA", "TARDE", "NOITE", "INTEGRAL"].map((turno) => (
            <Button
              key={turno}
              variant={filtroTurno === turno ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroTurno(turno)}
              className="text-xs"
            >
              {turno === "TODOS" ? "Todos os Turnos" : turno}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Turmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmasFiltradas.map((turma) => (
          <Card key={turma.id} className="hover:border-primary/50 transition-all shadow-sm">
            <CardHeader className="bg-muted/40 p-4 pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {turma.serie}
                </Badge>
                <Badge
                  variant={
                    turma.turno === "MANHA"
                      ? "default"
                      : turma.turno === "TARDE"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-[11px]"
                >
                  Turno {turma.turno}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-2">
                {turma.nome}
              </CardTitle>
              <CardDescription className="text-xs flex items-center gap-1">
                <School className="h-3.5 w-3.5" /> {turma.escolaNome}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs border-b pb-2">
                <span className="text-muted-foreground">Ano Letivo:</span>
                <span className="font-mono font-bold text-foreground">
                  {turma.anoLetivo}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDetalhes(turma)}
                  className="w-full text-xs font-semibold"
                >
                  <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                  Ver Alunos
                </Button>

                <Link href={`/relatorios/turmas/${turma.id}/frequencia`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-semibold"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Frequência
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal / Dialog de Detalhes da Turma */}
      {turmaDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <div>
                <CardTitle className="text-lg font-bold">
                  {turmaDetalhe.nome} ({turmaDetalhe.serie})
                </CardTitle>
                <CardDescription className="text-xs">
                  {turmaDetalhe.escolaNome} • Turno {turmaDetalhe.turno}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTurmaDetalhe(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto space-y-6">
              {erroDetalhe && <p role="alert" className="text-sm text-destructive">{erroDetalhe}</p>}
              {/* Professores Atribuídos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Corpo Docente Atribuído
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {professoresDetalhe.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-lg border bg-muted/30 text-xs">
                      <p className="font-semibold text-foreground">{p.professorNome}</p>
                      <p className="text-[11px] text-muted-foreground">{p.disciplina}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alunos Matriculados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Alunos Enturmados ({alunosDetalhe.length})
                </h4>
                <div className="border rounded-lg divide-y text-xs">
                  {alunosDetalhe.map((a) => (
                    <div key={a.id} className="p-2.5 flex items-center justify-between hover:bg-muted/20">
                      <div>
                        <p className="font-semibold text-foreground">{a.nome}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">Matrícula: {a.matricula}</p>
                      </div>
                      <Link href={`/secretaria/alunos/${a.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-primary">
                          Ver Boletim
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t flex justify-end">
              <Button variant="outline" onClick={() => setTurmaDetalhe(null)}>
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Criação de Nova Turma */}
      {modalNovaTurma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Nova Turma Escolar</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNovaTurma(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCriarTurma}>
              <CardContent className="p-4 space-y-4 text-xs">
                {carregandoOpcoesNova && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Carregando escolas e anos letivos...
                  </p>
                )}
                {erroOpcoesNova && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroOpcoesNova}</AlertDescription>
                  </Alert>
                )}
                {!carregandoOpcoesNova && !erroOpcoesNova && (!anosLetivosDisponiveis.length || (!usuario?.escolaId && !escolasDisponiveis.length)) && (
                  <Alert variant="warning">
                    <AlertDescription className="space-y-2">
                      <p>Para criar uma turma, cadastre ao menos uma escola e um ano letivo primeiro.</p>
                      {usuario?.perfil === "ADMIN" && (
                        <div className="flex gap-3">
                          {!escolasDisponiveis.length && <Link className="underline" href="/admin/escolas">Cadastrar escola</Link>}
                          {!anosLetivosDisponiveis.length && <Link className="underline" href="/admin/anos-letivos">Cadastrar ano letivo</Link>}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {erroNova && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroNova}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Identificação / Nome da Turma *</label>
                  <Input
                    value={nomeNova}
                    onChange={(e) => setNomeNova(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Série / Etapa *</label>
                  <Input
                    value={serieNova}
                    onChange={(e) => setSerieNova(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Turno de Funcionamento *</label>
                  <select
                    value={turnoNovo}
                    onChange={(e: any) => setTurnoNovo(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MANHA">Manhã (Matutino)</option>
                    <option value="TARDE">Tarde (Vespertino)</option>
                    <option value="NOITE">Noite (Noturno)</option>
                    <option value="INTEGRAL">Integral</option>
                  </select>
                </div>

                {!usuario?.escolaId && escolasDisponiveis.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Escola *</label>
                    <select
                      value={escolaIdNova}
                      onChange={(e) => setEscolaIdNova(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {escolasDisponiveis.map((esc) => (
                        <option key={esc.id} value={esc.id}>
                          {esc.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {anosLetivosDisponiveis.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Ano Letivo *</label>
                    <select
                      value={anoLetivoIdNova}
                      onChange={(e) => setAnoLetivoIdNova(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {anosLetivosDisponiveis.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.ano}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNovaTurma(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={salvandoNova}
                  disabled={salvandoNova || carregandoOpcoesNova || !!erroOpcoesNova || !anoLetivoIdNova || (!usuario?.escolaId && !escolaIdNova)}
                  className="font-semibold"
                >
                  Cadastrar Turma
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
