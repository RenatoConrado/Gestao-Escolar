"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  GraduationCap,
  Calendar,
  CheckCircle2,
  X,
  Search,
  Filter,
  PowerOff,
  Power,
  School,
} from "lucide-react";

interface AtribuicaoItem {
  id: number;
  professorId: number;
  professorNome: string;
  turmaId: number;
  turmaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  anoLetivo: number;
  ativo: boolean;
}

function AtribuicoesContent() {
  const searchParams = useSearchParams();
  const filtroProfessorId = searchParams.get("professorId");
  const { usuario } = useAuth();

  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [somenteAtivas, setSomenteAtivas] = useState(false);

  // Modal de Nova Atribuição
  const [modalNova, setModalNova] = useState(false);
  const [modalDisciplina, setModalDisciplina] = useState(false);
  const [profId, setProfId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [nomeDisciplina, setNomeDisciplina] = useState("");
  const [codigoDisciplina, setCodigoDisciplina] = useState("");
  const [salvandoDisciplina, setSalvandoDisciplina] = useState(false);
  const [erroDisciplina, setErroDisciplina] = useState<string | null>(null);

  // Opções para modal
  const [professores, setProfessores] = useState<{ id: number; nome: string }[]>([]);
  const [turmas, setTurmas] = useState<{ id: number; nome: string }[]>([]);
  const [disciplinas, setDisciplinas] = useState<{ id: number; nome: string }[]>([]);
  const [anosLetivos, setAnosLetivos] = useState<{ id: number; ano: number }[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [atribuicoesData, professoresData, turmasData, disciplinasData, anosData] = await Promise.all([
          apiRequestAllPages<any>("/atribuicoes"),
          apiRequestAllPages<any>("/professores"),
          apiRequestAllPages<any>("/turmas"),
          apiRequestAllPages<any>("/disciplinas"),
          apiRequestAllPages<any>("/anos-letivos"),
        ]);
        setProfessores(professoresData);
        setTurmas(turmasData);
        setDisciplinas(disciplinasData);
        setAnosLetivos(anosData);
        if (professoresData.length) setProfId(String(professoresData[0].id));
        if (turmasData.length) setTurmaId(String(turmasData[0].id));
        if (disciplinasData.length) setDisciplinaId(String(disciplinasData[0].id));
        const anoPorId = new Map(anosData.map((item) => [item.id, item.ano]));
        setAtribuicoes(
              atribuicoesData.map((a) => ({
                id: a.id,
                professorId: a.professorId,
                professorNome: a.professorNome,
                turmaId: a.turmaId,
                turmaNome: a.turmaNome,
                disciplinaId: a.disciplinaId,
                disciplinaNome: a.disciplinaNome,
                anoLetivo: anoPorId.get(a.anoLetivoId) ?? a.anoLetivoId,
                ativo: a.ativo,
              }))
            );
      } catch (err) {
        setAtribuicoes([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar as atribuições.");
      } finally {
        setCarregandoOpcoes(false);
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const handleCriarDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoDisciplina(true);
    setErroDisciplina(null);

    try {
      const criada = await apiRequest<{ id: number; nome: string; codigo: string }>("/disciplinas", {
        method: "POST",
        body: JSON.stringify({
          nome: nomeDisciplina.trim(),
          codigo: codigoDisciplina.trim(),
        }),
      });
      setDisciplinas((prev) => [...prev, criada].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setDisciplinaId(String(criada.id));
      setNomeDisciplina("");
      setCodigoDisciplina("");
      setModalDisciplina(false);
      setSucessoMsg(`Disciplina "${criada.nome}" cadastrada e selecionada.`);
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErroDisciplina(err instanceof ApiError ? err.message : "Não foi possível cadastrar a disciplina.");
    } finally {
      setSalvandoDisciplina(false);
    }
  };

  const alternarStatus = async (id: number) => {
    const item = atribuicoes.find((a) => a.id === id);
    if (!item) return;
    const novoStatus = !item.ativo;

    setErro(null);
    try {
      await apiRequest(`/atribuicoes/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          professorId: item.professorId,
          turmaId: item.turmaId,
          disciplinaId: item.disciplinaId,
          ativo: novoStatus,
        }),
      });
      setAtribuicoes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ativo: novoStatus } : a))
      );
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível alterar a atribuição.");
    }
  };

  const handleSalvarNova = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const profNome = professores.find((p) => String(p.id) === profId)?.nome || `Docente #${profId}`;
    const tNome = turmas.find((t) => String(t.id) === turmaId)?.nome || `Turma #${turmaId}`;
    const dNome = disciplinas.find((d) => String(d.id) === disciplinaId)?.nome || `Disciplina #${disciplinaId}`;

    const payload = {
      professorId: Number(profId),
      turmaId: Number(turmaId),
      disciplinaId: Number(disciplinaId),
      ativo: true,
    };

    try {
      const criado = await apiRequest<any>("/atribuicoes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const nova: AtribuicaoItem = {
        id: criado.id,
        professorId: criado.professorId,
        professorNome: criado.professorNome || profNome,
        turmaId: criado.turmaId,
        turmaNome: criado.turmaNome || tNome,
        disciplinaId: criado.disciplinaId,
        disciplinaNome: criado.disciplinaNome || dNome,
        anoLetivo: criado.anoLetivo,
        ativo: criado.ativo,
      };
      setAtribuicoes((prev) => [nova, ...prev]);
      setModalNova(false);
      setSucessoMsg(`Atribuição de ${nova.disciplinaNome} para ${nova.professorNome} na turma ${nova.turmaNome} cadastrada!`);
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível cadastrar a atribuição.");
    } finally {
      setSalvando(false);
    }
  };

  const filtradas = atribuicoes.filter((a) => {
    const matchBusca =
      a.professorNome.toLowerCase().includes(busca.toLowerCase()) ||
      a.turmaNome.toLowerCase().includes(busca.toLowerCase()) ||
      a.disciplinaNome.toLowerCase().includes(busca.toLowerCase());
    const matchAtiva = !somenteAtivas || a.ativo;
    const matchProfId = !filtroProfessorId || String(a.professorId) === filtroProfessorId;
    return matchBusca && matchAtiva && matchProfId;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Matriz de Atribuições Docentes
          </h1>
        </div>

        {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
          <Button onClick={() => setModalNova(true)} className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Nova Atribuição
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

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant={somenteAtivas ? "default" : "outline"}
          onClick={() => setSomenteAtivas(!somenteAtivas)}
          className="text-xs gap-1.5"
        >
          <Filter className="h-4 w-4" />
          {somenteAtivas ? "Exibindo Somente Ativas" : "Todas as Atribuições"}
        </Button>
      </div>

      {/* Grade / Tabela de Atribuições */}
      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Disciplina Curricular</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Ano Letivo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((atrib) => (
                <tr key={atrib.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {atrib.professorNome}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {atrib.disciplinaNome}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className="font-mono text-xs">
                      {atrib.turmaNome}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                    {atrib.anoLetivo}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      variant={atrib.ativo ? "success" : "secondary"}
                      className="text-[11px]"
                    >
                      {atrib.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
                      <Button
                        variant={atrib.ativo ? "outline" : "default"}
                        size="sm"
                        onClick={() => alternarStatus(atrib.id)}
                        className="text-xs font-semibold gap-1"
                        title={atrib.ativo ? "Inativar atribuição" : "Reativar atribuição"}
                      >
                        {atrib.ativo ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5 text-rose-500" />
                            Inativar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 text-emerald-500" />
                            Ativar
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Nova Atribuição */}
      {modalNova && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Vincular Docente a Turma</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNova(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSalvarNova}>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Professor *</label>
                  <select
                    value={profId}
                    onChange={(e) => setProfId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {professores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Turma *</label>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {turmas.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Disciplina Curricular *</label>
                  <select
                    value={disciplinaId}
                    onChange={(e) => setDisciplinaId(e.target.value)}
                    disabled={carregandoOpcoes || disciplinas.length === 0}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {disciplinas.length === 0 && <option value="">Nenhuma disciplina cadastrada</option>}
                    {disciplinas.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nome}
                        </option>
                      ))}
                  </select>
                  {disciplinas.length === 0 && !carregandoOpcoes && (
                    <p className="text-xs text-muted-foreground">
                      Cadastre uma disciplina para poder concluir esta atribuição.
                    </p>
                  )}
                  {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setErroDisciplina(null);
                        setModalDisciplina(true);
                      }}
                    >
                      Cadastrar disciplina
                    </Button>
                  )}
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNova(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvando} disabled={salvando || carregandoOpcoes || !profId || !turmaId || !disciplinaId} className="font-semibold">
                  Confirmar Vínculo
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {modalDisciplina && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Cadastrar Disciplina</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => setModalDisciplina(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCriarDisciplina}>
              <CardContent className="space-y-4 p-4">
                {erroDisciplina && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroDisciplina}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="disciplina-nome" className="text-sm font-semibold">Nome *</label>
                  <Input
                    id="disciplina-nome"
                    value={nomeDisciplina}
                    onChange={(e) => setNomeDisciplina(e.target.value)}
                    maxLength={100}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="disciplina-codigo" className="text-sm font-semibold">Código *</label>
                  <Input
                    id="disciplina-codigo"
                    value={codigoDisciplina}
                    onChange={(e) => setCodigoDisciplina(e.target.value)}
                    maxLength={30}
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 border-t p-4">
                <Button type="button" variant="outline" onClick={() => setModalDisciplina(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvandoDisciplina} disabled={salvandoDisciplina}>
                  Salvar disciplina
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AtribuicoesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AtribuicoesContent />
    </Suspense>
  );
}
