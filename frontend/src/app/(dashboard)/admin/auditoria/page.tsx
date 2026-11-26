"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequestAllPages } from "@/lib/api";
import { History, RefreshCw } from "lucide-react";

interface EventoAuditoriaItem {
  id: number;
  em: string;
  usuarioId: number;
  usuarioNome?: string;
  perfil: string;
  entidade: string;
  entidadeId?: number | null;
  acao: string;
  detalhes?: string;
}

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [perfil, setPerfil] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const carregarAuditoria = async () => {
    setLoading(true);
    setErro(null);
    try {
      const lista = await apiRequestAllPages<any>("/auditoria", {
        params: { perfil: perfil || undefined, de: de || undefined, ate: ate || undefined },
      });
      setEventos(
          lista.map((ev) => ({
            id: ev.id,
            em: ev.em || "",
            usuarioId: ev.usuarioId,
            usuarioNome: ev.usuarioNome,
            perfil: ev.perfil,
            entidade: ev.entidade,
            entidadeId: ev.entidadeId,
            acao: ev.acao,
            detalhes: ev.detalhes || `Registro de ${ev.acao} em ${ev.entidade} #${ev.entidadeId}`,
          }))
        );
    } catch (err) {
      setEventos([]);
      setErro(err instanceof Error ? err.message : "Não foi possível carregar a auditoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAuditoria();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Trilha de Auditoria e Conformidade
          </h1>
          <p className="text-sm text-muted-foreground">Eventos de todos os perfis, com identificação de quem realizou cada ação.</p>
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregarAuditoria} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <label className="space-y-1 text-xs font-medium">
            Perfil responsável
            <select value={perfil} onChange={(e) => setPerfil(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos os perfis</option>
              {["ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">De
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="space-y-1 text-xs font-medium">Até
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <Button onClick={carregarAuditoria} className="gap-1.5">Aplicar filtros</Button>
        </div>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Detalhes do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {eventos.map((evento) => (
                <tr key={evento.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {evento.em ? new Date(evento.em).toLocaleString("pt-BR") : ""}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    <div>{evento.usuarioNome || `Usuário #${evento.usuarioId}`}</div>
                    <span className="text-[10px] text-muted-foreground uppercase">{evento.perfil}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {evento.entidade}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        evento.acao === "CRIACAO" || evento.acao === "LOGIN"
                          ? "success"
                          : evento.acao === "ATUALIZACAO" || evento.acao === "LOTE"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {evento.acao}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-foreground max-w-md">
                    {evento.detalhes}
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
