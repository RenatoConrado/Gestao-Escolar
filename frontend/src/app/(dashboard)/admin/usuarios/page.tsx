"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { PerfilRole } from "@/types";
import {
  Plus,
  Search,
  KeyRound,
  PowerOff,
  Power,
  Shield,
  School,
  X,
  CheckCircle2,
  Mail,
} from "lucide-react";

interface UsuarioItem {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilRole;
  escolaNome?: string;
  escolaId?: number | null;
  ativo: boolean;
}

export default function UsuariosPage() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("TODOS");

  // Modal Novo Usuário
  const [modalNovo, setModalNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("trocar-123");
  const [perfil, setPerfil] = useState<PerfilRole>("PROFESSOR");
  const [escolasDisponiveis, setEscolasDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const [escolaId, setEscolaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [usersData, escolasData] = await Promise.all([
          apiRequestAllPages<any>("/usuarios"),
          apiRequestAllPages<any>("/escolas"),
        ]);
        const listaEscolas = escolasData;
        setEscolasDisponiveis(listaEscolas);
        if (listaEscolas.length > 0) setEscolaId(String(listaEscolas[0].id));

        const mapaEscolas = new Map<number, string>();
        listaEscolas.forEach((e) => mapaEscolas.set(e.id, e.nome));
        setUsuarios(usersData.map((u) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          perfil: u.perfil,
          escolaId: u.escolaId,
          escolaNome: u.escolaId ? mapaEscolas.get(u.escolaId) : undefined,
          ativo: u.ativo,
        })));
      } catch (err) {
        setUsuarios([]);
        setErro(err instanceof Error ? err.message : "Não foi possível carregar os usuários.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const alternarStatus = async (id: number) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;
    const novoStatus = !user.ativo;

    setErro(null);
    try {
      await apiRequest(`/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
          escolaId: user.escolaId,
          ativo: novoStatus,
        }),
      });
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ativo: novoStatus } : u)));
      setSucessoMsg(`Status do usuário ${user.email} alterado para ${novoStatus ? "ATIVO" : "INATIVO"}.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível alterar o status do usuário.");
    }
    setTimeout(() => setSucessoMsg(null), 4000);
  };

  const redefinirSenhaAdmin = async (u: UsuarioItem) => {
    setErro(null);
    try {
      await apiRequest(`/usuarios/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: u.nome,
          email: u.email,
          senha: "trocar-123",
          perfil: u.perfil,
          escolaId: u.escolaId,
          ativo: u.ativo,
        }),
      });
      setSucessoMsg(`Senha provisória de ${u.nome} redefinida. Sessões anteriores foram invalidadas.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.");
    }
    setTimeout(() => setSucessoMsg(null), 5000);
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const escNome = escolasDisponiveis.find((e) => String(e.id) === escolaId)?.nome;
    const novoPayload = {
      nome,
      email,
      senha,
      perfil,
      escolaId: perfil === "SECRETARIO" || perfil === "PROFESSOR" ? Number(escolaId) : null,
      ativo: true,
    };

    try {
      const criado = await apiRequest<UsuarioItem & { escolaId?: number | null }>("/usuarios", {
        method: "POST",
        body: JSON.stringify(novoPayload),
      });
      const novoItem: UsuarioItem = {
        ...criado,
        escolaNome: criado.escolaId ? escNome : undefined,
      };
      setUsuarios((prev) => [novoItem, ...prev]);
      setModalNovo(false);
      setNome("");
      setEmail("");
      setSucessoMsg(`Usuário ${novoItem.email} criado com sucesso com perfil ${novoItem.perfil}!`);
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSalvando(false);
    }
  };

  const filtrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    const matchPerfil = filtroPerfil === "TODOS" || u.perfil === filtroPerfil;
    return matchBusca && matchPerfil;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Usuários & Acessos
          </h1>
        </div>

        {usuario?.perfil === "ADMIN" && (
          <Button onClick={() => setModalNovo(true)} className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      {sucessoMsg && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Operação Concluída</AlertTitle>
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

        <div className="flex flex-wrap gap-2">
          {["TODOS", "ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"].map((p) => (
            <Button
              key={p}
              variant={filtroPerfil === p ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroPerfil(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Papel / Perfil</th>
                <th className="px-4 py-3">Escola Vinculada</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações de Segurança</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div>{u.nome}</div>
                    <span className="text-xs text-muted-foreground font-mono font-normal">
                      {u.email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        u.perfil === "ADMIN"
                          ? "default"
                          : u.perfil === "SECRETARIO"
                          ? "secondary"
                          : u.perfil === "PROFESSOR"
                          ? "outline"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {u.perfil}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {u.escolaNome ? (
                      <span className="flex items-center gap-1">
                        <School className="h-3 w-3 text-primary" />
                        {u.escolaNome}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground/70">Rede Geral (Sem escola fixa)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      variant={u.ativo ? "success" : "destructive"}
                      className="text-[11px]"
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => redefinirSenhaAdmin(u)}
                      className="text-xs font-semibold"
                      title="Redefinir senha para padrão"
                    >
                      <KeyRound className="h-3.5 w-3.5 mr-1 text-amber-600" />
                      Reset Senha
                    </Button>

                    <Button
                      variant={u.ativo ? "outline" : "default"}
                      size="sm"
                      onClick={() => alternarStatus(u.id)}
                      className="text-xs font-semibold"
                    >
                      {u.ativo ? (
                        <>
                          <PowerOff className="h-3.5 w-3.5 mr-1 text-rose-500" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Novo Usuário */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Cadastrar Novo Usuário</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNovo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSalvarNovo}>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Nome Completo *</label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">E-mail Institucional *</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Perfil de Acesso (RBAC) *</label>
                  <select
                    value={perfil}
                    onChange={(e: any) => setPerfil(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="PROFESSOR">PROFESSOR</option>
                    <option value="SECRETARIO">SECRETARIO</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="LEITOR">LEITOR</option>
                  </select>
                </div>

                {(perfil === "SECRETARIO" || perfil === "PROFESSOR") && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Escola Vinculada *</label>
                    <select
                      value={escolaId}
                      onChange={(e) => setEscolaId(e.target.value)}
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

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Senha Provisória</label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    O usuário deverá alterá-la no primeiro acesso em /perfil/senha.
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNovo(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvando} disabled={salvando || ((perfil === "SECRETARIO" || perfil === "PROFESSOR") && !escolaId)} className="font-semibold">
                  Cadastrar Acesso
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
