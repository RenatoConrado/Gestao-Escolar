"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { hojeLocalISO } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  Clock,
  Sparkles,
} from "lucide-react";

interface AnoLetivoItem {
  id: number;
  ano: number;
  dataInicio: string;
  dataFim: string;
  situacao: "VIGENTE" | "ENCERRADO" | "PLANEJADO";
}

export default function AnosLetivosPage() {
  const { usuario } = useAuth();

  const [anos, setAnos] = useState<AnoLetivoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo Ano
  const [modalNovo, setModalNovo] = useState(false);
  const anoSeguinte = new Date().getFullYear() + 1;
  const [ano, setAno] = useState(String(anoSeguinte));
  const [dataInicio, setDataInicio] = useState(`${anoSeguinte}-02-01`);
  const [dataFim, setDataFim] = useState(`${anoSeguinte}-12-15`);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  useEffect(() => {
    async function carregarAnos() {
      try {
        const lista = await apiRequestAllPages<Omit<AnoLetivoItem, "situacao">>("/anos-letivos");
        const hoje = hojeLocalISO();
        setAnos(lista.map((item) => ({
          ...item,
          situacao: hoje < item.dataInicio ? "PLANEJADO" : hoje <= item.dataFim ? "VIGENTE" : "ENCERRADO",
        })));
      } catch (err) {
        setErroCarga(err instanceof Error ? err.message : "Não foi possível carregar os anos letivos.");
      } finally {
        setLoading(false);
      }
    }

    carregarAnos();
  }, []);

  const anoVigente = anos.find((item) => item.situacao === "VIGENTE");

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (new Date(dataFim) <= new Date(dataInicio)) {
      setErro("A data de término do ano letivo deve ser posterior à data de início.");
      return;
    }

    setSalvando(true);

    const payload = {
      ano: Number(ano),
      dataInicio,
      dataFim,
    };

    try {
      const criado = await apiRequest<Omit<AnoLetivoItem, "situacao">>("/anos-letivos", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const hoje = hojeLocalISO();
      const novoAno: AnoLetivoItem = {
        ...criado,
        situacao: hoje < criado.dataInicio ? "PLANEJADO" : hoje <= criado.dataFim ? "VIGENTE" : "ENCERRADO",
      };
      setAnos((prev) => [novoAno, ...prev]);
      setModalNovo(false);
      setSucessoMsg(`Ano letivo ${novoAno.ano} cadastrado com sucesso no calendário!`);
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o ano letivo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Anos Letivos e Calendário
          </h1>
        </div>

        {usuario?.perfil === "ADMIN" && (
          <Button onClick={() => setModalNovo(true)} className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Novo Ano Letivo
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
      {erroCarga && <p role="alert" className="text-sm text-destructive">{erroCarga}</p>}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Ano Letivo Vigente</CardDescription>
            <CardTitle className="text-2xl font-bold">{anoVigente?.ano ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            {anoVigente ? `${anoVigente.dataInicio} a ${anoVigente.dataFim}` : "Nenhum ano letivo vigente cadastrado"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Meta Lei LDB 9.394/96</CardDescription>
            <CardTitle className="text-2xl font-bold">200 Dias</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Mínimo de 800 horas de efetivo trabalho
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Histórico Registrado</CardDescription>
            <CardTitle className="text-2xl font-bold">{anos.length} Anos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">
            Desde a implantação do SIGE Edge
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Anos Letivos */}
      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Ano de Referência</th>
                <th className="px-4 py-3">Data de Início</th>
                <th className="px-4 py-3">Data de Término</th>
                <th className="px-4 py-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {anos.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-bold font-mono text-base text-foreground">
                    {item.ano}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {item.dataInicio}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {item.dataFim}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      variant={
                        item.situacao === "VIGENTE"
                          ? "success"
                          : item.situacao === "PLANEJADO"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {item.situacao}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criação */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Novo Calendário / Ano Letivo</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNovo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSalvar}>
              <CardContent className="p-4 space-y-4 text-xs">
                {erro && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Ano Letivo *</label>
                  <Input
                    type="number"
                    min="2020"
                    max="2040"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Data de Início das Aulas *</label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Data de Encerramento *</label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNovo(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvando} className="font-semibold">
                  Cadastrar Ano Letivo
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
