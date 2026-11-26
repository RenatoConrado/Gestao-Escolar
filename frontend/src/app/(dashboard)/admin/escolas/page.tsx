"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Plus, Phone, Mail, MapPin, CheckCircle2, Pencil, Trash2 } from "lucide-react";

interface EscolaItem {
  id: number;
  nome: string;
  codigo: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  diretorId?: number | null;
  diretorNome?: string;
}

export default function AdminEscolasPage() {
  const { usuario } = useAuth();
  const [escolas, setEscolas] = useState<EscolaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarEscolas() {
      try {
        setEscolas(await apiRequestAllPages<EscolaItem>("/escolas"));
      } catch (err) {
        setErroCarga(err instanceof Error ? err.message : "Não foi possível carregar as escolas.");
      } finally {
        setLoading(false);
      }
    }

    carregarEscolas();
  }, []);

  const excluirEscola = async (escola: EscolaItem) => {
    if (!window.confirm(`Certeza de que quer excluir a escola ${escola.nome}? Esta ação não pode ser desfeita.`)) return;
    setErro(null);
    try {
      await apiRequest(`/escolas/${escola.id}`, { method: "DELETE" });
      setEscolas((prev) => prev.filter((item) => item.id !== escola.id));
      setSucessoMsg(`Escola "${escola.nome}" excluída.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir a escola.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Polos e Escolas Municipais
          </h1>
        </div>
        {usuario?.perfil === "ADMIN" && (
          <Link href="/admin/escolas/novo"><Button className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />Nova Escola
          </Button></Link>
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
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {escolas.map((esc) => (
          <Card key={esc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/40 pb-3">
              <Badge variant="outline" className="w-fit font-mono text-[10px] mb-1">
                INEP/Código: {esc.codigo}
              </Badge>
              <CardTitle className="text-base font-bold text-foreground">
                {esc.nome}
              </CardTitle>
              {esc.diretorNome && (
                <CardDescription className="text-xs">
                  Diretor: <span className="font-semibold text-foreground">{esc.diretorNome}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              {esc.endereco && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {esc.endereco}
                </p>
              )}
              {esc.telefone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {esc.telefone}
                </p>
              )}
              {esc.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {esc.email}
                </p>
              )}
              {usuario?.perfil === "ADMIN" && (
                <div className="flex justify-end gap-2 border-t pt-3">
                  <Link href={`/admin/escolas/novo?id=${esc.id}`}><Button size="sm" variant="outline">
                    <Pencil className="mr-1 h-3.5 w-3.5" />Editar
                  </Button></Link>
                  <Button size="sm" variant="destructive" onClick={() => excluirEscola(esc)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Excluir
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
