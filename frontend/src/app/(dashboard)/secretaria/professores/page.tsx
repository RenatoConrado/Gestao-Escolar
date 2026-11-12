"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Plus,
  Search,
  Mail,
  Phone,
  FolderKanban,
  X,
  CheckCircle2,
  School,
  AlertCircle,
} from "lucide-react";

interface Professor {
  id: number;
  matricula: string;
  nome: string;
  cpf?: string;
  email: string;
  telefone?: string;
  formacao: string;
  escolaId?: number;
  escolaNome?: string;
  usuarioId?: number | null;
  totalAtribuicoes?: number;
}

interface EscolaOption {
  id: number;
  nome: string;
}

interface UsuarioOption {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}

export default function ProfessoresPage() {
  const { usuario } = useAuth();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [escolas, setEscolas] = useState<EscolaOption[]>([]);
  const [usuariosProfessor, setUsuariosProfessor] = useState<UsuarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // Modal Novo Docente
  const [modalNovo, setModalNovo] = useState(false);
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [formacao, setFormacao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [escolaId, setEscolaId] = useState<number | string>("");
  const [usuarioId, setUsuarioId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [listaProf, listaEscolas, listaUsuarios] = await Promise.all([
          apiRequestAllPages<Professor>("/professores"),
          apiRequestAllPages<EscolaOption>("/escolas"),
          usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO"
            ? apiRequestAllPages<UsuarioOption>("/usuarios")
            : Promise.resolve([]),
        ]);
        setEscolas(listaEscolas);
        setUsuariosProfessor(listaUsuarios.filter((u) => u.perfil === "PROFESSOR"));
        if (usuario?.escolaId) {
          setEscolaId(usuario.escolaId);
        } else if (listaEscolas.length > 0 && !escolaId) {
          setEscolaId(listaEscolas[0].id);
        }

        setProfessores(listaProf);
      } catch (err) {
        setProfessores([]);
        setErroCarga(err instanceof Error ? err.message : "Não foi possível carregar o corpo docente.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [usuario?.perfil]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErroMsg(null);

    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      setErroMsg("O CPF deve conter exatamente 11 dígitos numéricos.");
      setSalvando(false);
      return;
    }

    if (!escolaId) {
      setErroMsg("Selecione uma escola para o professor.");
      setSalvando(false);
      return;
    }

    const payload = {
      matricula,
      nome,
      cpf: cpfLimpo,
      email,
      formacao,
      telefone: telefone || undefined,
      escolaId: Number(escolaId),
      usuarioId: usuarioId ? Number(usuarioId) : null,
    };

    try {
      const criado = await apiRequest<Professor>("/professores", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const escolaEncontrada = escolas.find((e) => e.id === Number(escolaId));
      const profCompleto: Professor = {
        ...criado,
        escolaNome: escolaEncontrada?.nome || "Escola Municipal",
        totalAtribuicoes: 0,
      };

      setProfessores((prev) => [profCompleto, ...prev]);
      setSucessoMsg(`Professor "${profCompleto.nome}" cadastrado com sucesso!`);
      setModalNovo(false);
      setMatricula("");
      setNome("");
      setCpf("");
      setEmail("");
      setFormacao("");
      setTelefone("");
      setUsuarioId("");
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err: any) {
      setErroMsg(err?.message || "Erro ao cadastrar professor. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  };

  const getNomeEscola = (prof: Professor) => {
    if (prof.escolaNome) return prof.escolaNome;
    if (prof.escolaId) {
      const e = escolas.find((esc) => esc.id === prof.escolaId);
      if (e) return e.nome;
    }
    return "Não informada";
  };

  const filtrados = professores.filter((p) =>
    (p.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (p.matricula || "").toLowerCase().includes(busca.toLowerCase()) ||
    (p.formacao || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Corpo Docente (Professores)
          </h1>
        </div>

        <div className="flex gap-2">
          <Link href="/secretaria/atribuicoes">
            <Button variant="outline" className="gap-2 font-semibold">
              <FolderKanban className="h-4 w-4 text-primary" />
              Matriz de Atribuições
            </Button>
          </Link>
          {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
            <Button onClick={() => setModalNovo(true)} className="gap-2 font-semibold shadow-sm">
              <Plus className="h-4 w-4" />
              Novo Professor
            </Button>
          )}
        </div>
      </div>

      {sucessoMsg && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{sucessoMsg}</AlertDescription>
        </Alert>
      )}
      {erroCarga && <p role="alert" className="text-sm text-destructive">{erroCarga}</p>}

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela de Professores */}
      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Formação</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Escola Vinculada</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {loading ? "Carregando corpo docente..." : "Nenhum professor encontrado."}
                  </td>
                </tr>
              ) : (
                filtrados.map((prof) => (
                  <tr key={prof.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-foreground">
                      {prof.matricula}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">
                      <div>{prof.nome}</div>
                      <span className="text-[11px] text-muted-foreground font-normal">{prof.email}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {prof.formacao}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {prof.telefone || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <School className="h-3 w-3 text-primary" /> {getNomeEscola(prof)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/secretaria/atribuicoes?professorId=${prof.id}`}>
                        <Button variant="ghost" size="sm" className="font-semibold text-primary text-xs">
                          {usuario?.perfil === "LEITOR" ? "Ver Atribuições" : "Atribuir"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Cadastro de Professor */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Cadastrar Novo Docente</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNovo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSalvar}>
              <CardContent className="p-4 space-y-4 text-xs">
                {erroMsg && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{erroMsg}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">Nome Completo do Docente *</label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Matrícula Funcional *</label>
                    <Input
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">CPF (11 dígitos) *</label>
                    <Input
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      maxLength={14}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">E-mail Institucional *</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">Escola Vinculada *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-xs bg-background text-foreground"
                      value={escolaId}
                      onChange={(e) => setEscolaId(e.target.value)}
                      required
                    >
                      <option value="">Selecione uma escola...</option>
                      {escolas.map((esc) => (
                        <option key={esc.id} value={esc.id}>
                          {esc.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">Conta de acesso (opcional)</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-xs bg-background text-foreground"
                      value={usuarioId}
                      onChange={(e) => setUsuarioId(e.target.value)}
                    >
                      <option value="">Sem conta vinculada</option>
                      {usuariosProfessor.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nome} — {user.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      A conta deve ter o perfil PROFESSOR. Crie-a primeiro em Gestão de Usuários.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">Formação Acadêmica *</label>
                    <Input
                      value={formacao}
                      onChange={(e) => setFormacao(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground">Telefone / WhatsApp</label>
                    <Input
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNovo(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvando} className="font-semibold">
                  Salvar Cadastro
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
