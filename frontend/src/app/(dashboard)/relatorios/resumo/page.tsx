"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, School, CheckCircle2, TrendingUp } from "lucide-react";
import { apiRequest, apiRequestAllPages } from "@/lib/api";
import { ResumoRedeResponse, Escola } from "@/types";

export default function RelatoriosResumoPage() {
  const [resumo, setResumo] = useState<ResumoRedeResponse | null>(null);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resumoData, escolasData] = await Promise.all([
          apiRequest<ResumoRedeResponse>("/relatorios/resumo"),
          apiRequestAllPages<Escola>("/escolas"),
        ]);
        setResumo(resumoData);
        setEscolas(escolasData);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível carregar o relatório.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Relatório Consolidado da Rede
          </h1>
        </div>
        {erro && <p role="alert" className="text-sm text-destructive no-print">{erro}</p>}
        <Button onClick={imprimir} className="gap-2 font-bold shadow-md">
          <Printer className="h-4 w-4" />
          Imprimir Relatório (A4)
        </Button>
      </div>

      <Card className="print-page shadow-md border bg-white text-black">
        <CardHeader className="border-b pb-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary no-print">
            <School className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-wider">
            Secretaria Municipal de Educação
          </CardTitle>
          <CardDescription className="text-xs">
            SIGE — Relatório Estatístico Oficial • Escopo: {resumo?.escopo || "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b pb-6">
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-xs uppercase text-muted-foreground font-semibold">Escolas</span>
              <p className="text-2xl font-bold mt-1">{resumo?.escolas ?? "—"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-xs uppercase text-muted-foreground font-semibold">Turmas</span>
              <p className="text-2xl font-bold mt-1">{resumo?.turmas ?? 0}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-xs uppercase text-muted-foreground font-semibold">Matriculas</span>
              <p className="text-2xl font-bold mt-1">{resumo?.alunosMatriculados ?? 0}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-xs uppercase text-muted-foreground font-semibold">Professores</span>
              <p className="text-2xl font-bold mt-1">{resumo?.professores ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Unidades Escolares da Rede
            </h3>
            <div className="table-scroll">
            <table className="w-full text-xs border border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="border p-2 text-left">Escola</th>
                  <th className="border p-2 text-center">Código</th>
                  <th className="border p-2 text-left">Contato / Endereço</th>
                </tr>
              </thead>
              <tbody>
                {escolas.map((esc) => (
                  <tr key={esc.id}>
                    <td className="border p-2 font-medium">{esc.nome}</td>
                    <td className="border p-2 text-center font-mono">{esc.codigo}</td>
                    <td className="border p-2 text-muted-foreground">
                      {esc.telefone ? `${esc.telefone} • ` : ""}{esc.endereco || esc.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
