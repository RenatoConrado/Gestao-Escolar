"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Filter, Printer } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiRequestAllPages } from "@/lib/api";

export default function SecretariaAlunosPage() {
  const { usuario } = useAuth();
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<{ id: number; matricula: string; nome: string; cpf?: string; responsavel: string }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const lista = await apiRequestAllPages<any>("/alunos");
        setAlunos(lista.map((a) => ({
          id: a.id,
          matricula: a.matricula,
          nome: a.nome,
          cpf: a.cpf,
          responsavel: a.responsavel || "Não informado",
        })));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível carregar os alunos.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // Regra LGPD: Mascara CPF para professor e leitor
  const exibirCpf = (cpf?: string) => {
    if (!cpf) return "—";
    if (usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") {
      return cpf;
    }
    return "***." + (cpf.split(".")[1] || "000") + ".***-**";
  };

  const filtrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.matricula.includes(busca)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cadastro de Alunos
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir Relação
          </Button>
          {(usuario?.perfil === "ADMIN" || usuario?.perfil === "SECRETARIO") && (
            <Link href="/secretaria/alunos/novo">
              <Button className="gap-2 font-semibold">
                <UserPlus className="h-4 w-4" />
                Novo Aluno
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Nome do Aluno</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-foreground">
                    {aluno.matricula}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    {aluno.nome}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                    {exibirCpf(aluno.cpf)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                  {aluno.responsavel}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/secretaria/alunos/${aluno.id}`}>
                      <Button variant="ghost" size="sm" className="font-semibold text-primary">
                        Prontuário
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando alunos...</td></tr>
              )}
              {!erro && !filtrados.length && !loading && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum aluno cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
