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
import { PerfilRole } from "@/types";
import {
  Plus,
  Search,
  KeyRound,
  PowerOff,
  Power,
  Shield,
  CheckCircle2,
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
    if (!window.confirm(`Certeza de que quer ${novoStatus ? "ativar" : "inativar"} o perfil de ${user.nome}?`)) return;

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
    if (!window.confirm(`Certeza de que quer resetar a senha de ${u.nome}? Uma senha temporária será gerada.`)) return;
    const senhaTemporaria = `${crypto.randomUUID()}Aa1!`;
    setErro(null);
    try {
      await apiRequest(`/usuarios/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: u.nome,
          email: u.email,
          senha: senhaTemporaria,
          perfil: u.perfil,
          escolaId: u.escolaId,
          ativo: u.ativo,
        }),
      });
      setSucessoMsg(`Senha provisória de ${u.nome}: ${senhaTemporaria}. As sessões anteriores foram invalidadas.`);
      window.alert(`Senha temporária de ${u.nome}: ${senhaTemporaria}\nCopie e entregue por um canal institucional seguro.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.");
    }
    setTimeout(() => setSucessoMsg(null), 5000);
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
            Gestão de Usuários e Acessos
          </h1>
        </div>

        {usuario?.perfil === "ADMIN" && (
          <Link href="/admin/usuarios/novo"><Button className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button></Link>
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
                        {u.escolaNome}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground/70">Rede Geral</span>
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
                    <Link href={`/admin/usuarios/novo?id=${u.id}`}><Button variant="outline" size="sm" className="text-xs">Editar</Button></Link>
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

    </div>
  );
}
