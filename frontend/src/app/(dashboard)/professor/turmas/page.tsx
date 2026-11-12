"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { AtribuicaoDocente, Aluno } from "@/types";
import {
  Users,
  ClipboardCheck,
  Award,
  BookOpen,
  School,
  Calendar,
  X,
  UserCheck,
} from "lucide-react";

export default function ProfessorTurmasPage() {
  const { usuario } = useAuth();
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAlunos, setErroAlunos] = useState<string | null>(null);

  // Estado para o modal "Ver Alunos"
  const [turmaSelecionada, setTurmaSelecionada] = useState<{ id: number; nome: string } | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  useEffect(() => {
    async function carregarAtribuicoes() {
      try {
        const data = await apiRequest<AtribuicaoDocente[]>("/atribuicoes/minhas");
        setAtribuicoes(data);
      } catch (err) {
        setAtribuicoes([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar suas turmas.");
      } finally {
        setLoading(false);
      }
    }

    carregarAtribuicoes();
  }, []);

  const abrirModalAlunos = async (turmaId: number, turmaNome: string) => {
    setTurmaSelecionada({ id: turmaId, nome: turmaNome });
    setLoadingAlunos(true);
    setErroAlunos(null);
    try {
      const data = await apiRequest<Aluno[]>(`/turmas/${turmaId}/alunos`);
      setAlunosTurma(data);
    } catch (err) {
      setAlunosTurma([]);
      setErroAlunos(err instanceof Error ? err.message : "Não foi possível carregar os alunos da turma.");
    } finally {
      setLoadingAlunos(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TURMAS
          </h1>
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <Badge variant="success" className="w-fit">
          {atribuicoes.length} {atribuicoes.length === 1 ? "turma ativa" : "turmas ativas"}
        </Badge>
      </div>

      {/* Lista de Cartões Fiel ao Wireframe 3 */}
      <div className="space-y-4">
        {atribuicoes.map((atrib) => (
          <Card key={atrib.id} className="overflow-hidden border-2 hover:border-primary/40 transition-colors shadow-sm">
            <CardHeader className="bg-muted/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  {atrib.escolaNome} — {atrib.turmaNome} — {atrib.turno} — {atrib.disciplinaNome}
                </CardTitle>
                <Badge variant="outline" className="bg-background text-xs">
                  {atrib.serie}
                </Badge>
              </div>
              <CardDescription className="text-xs flex items-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <School className="h-3.5 w-3.5" /> {atrib.escolaNome}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Turno {atrib.turno}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {/* Barra de 3 Botões em Destaque Conforme Wireframe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => abrirModalAlunos(atrib.turmaId, `${atrib.turmaNome} (${atrib.disciplinaNome})`)}
                  className="w-full font-semibold h-12"
                >
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Ver Alunos
                </Button>

                <Link href={`/professor/frequencia?turmaId=${atrib.turmaId}&atribuicaoId=${atrib.id}`}>
                  <Button className="w-full font-bold h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Fazer chamada
                  </Button>
                </Link>

                <Link href={`/professor/avaliacoes?turmaId=${atrib.turmaId}&atribuicaoId=${atrib.id}`}>
                  <Button
                    variant="secondary"
                    className="w-full font-semibold h-12 hover:bg-secondary/80"
                  >
                    <Award className="h-4 w-4 mr-2 text-amber-600" />
                    Lançar Notas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {atribuicoes.length === 0 && !loading && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl p-8">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-semibold text-foreground">Nenhuma turma atribuída</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Consulte a secretaria da sua unidade para vincular suas disciplinas.
            </p>
          </div>
        )}
      </div>

      {/* Modal / Dialog: Ver Alunos da Turma */}
      {turmaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <div>
                <CardTitle className="text-base font-bold">
                  Alunos Matriculados
                </CardTitle>
                <CardDescription className="text-xs">
                  {turmaSelecionada.nome}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTurmaSelecionada(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1 divide-y">
              {loadingAlunos ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Carregando lista de alunos...
                </div>
              ) : (
                <>
                {erroAlunos && <p role="alert" className="py-2 text-sm text-destructive">{erroAlunos}</p>}
                {alunosTurma.map((aluno) => (
                  <div key={aluno.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{aluno.nome}</p>
                      <p className="text-xs text-muted-foreground">Matrícula: {aluno.matricula}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        Ativo
                      </Badge>
                      <Link href={`/secretaria/alunos/${aluno.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                          Boletim
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {!erroAlunos && alunosTurma.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhum aluno matriculado nesta turma.</p>}
                </>
              )}
            </CardContent>
            <div className="p-4 border-t flex justify-end">
              <Button variant="outline" onClick={() => setTurmaSelecionada(null)}>
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
