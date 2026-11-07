"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Plus, Phone, Mail, MapPin, X, CheckCircle2, AlertCircle } from "lucide-react";

interface EscolaItem {
  id: number;
  nome: string;
  codigo: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  diretorNome?: string;
}

export default function AdminEscolasPage() {
  const { usuario } = useAuth();
  const [escolas, setEscolas] = useState<EscolaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nova Escola
  const [modalNova, setModalNova] = useState(false);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

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

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const novaPayload = {
      nome,
      codigo,
      endereco: endereco || null,
      telefone: telefone || null,
      email: email || null,
    };

    try {
      const criado = await apiRequest<EscolaItem>("/escolas", {
        method: "POST",
        body: JSON.stringify(novaPayload),
      });

      setEscolas((prev) => [criado, ...prev]);
      setSucessoMsg(`Escola "${criado.nome}" cadastrada com sucesso!`);
      setModalNova(false);
      setNome("");
      setCodigo("");
      setEndereco("");
      setTelefone("");
      setEmail("");
      setTimeout(() => setSucessoMsg(null), 4000);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível cadastrar a escola.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Polos & Escolas Municipais
          </h1>
        </div>
        {usuario?.perfil === "ADMIN" && (
          <Button onClick={() => setModalNova(true)} className="gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Nova Escola
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
            </CardContent>
          </Card>
        ))}
      </div>

      {modalNova && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-20">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base font-bold">Cadastrar Unidade Escolar</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalNova(false)}>
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
                  <label className="font-semibold text-foreground">Nome da Escola *</label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Código INEP/SIGE *</label>
                  <Input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Endereço</label>
                  <Input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Telefone</label>
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">E-mail Institucional</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setModalNova(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={salvando} className="font-semibold">
                  Cadastrar Escola
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
