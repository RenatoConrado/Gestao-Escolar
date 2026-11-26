"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Mail, Phone, School } from "lucide-react";

interface ContatoEscola {
  escolaId: number;
  escolaNome: string;
  emailInstitucional?: string;
  telefone?: string;
  contatos: { funcao: string; nome: string; email?: string; telefone?: string }[];
}

export default function ContatosPage() {
  const [escolas, setEscolas] = useState<ContatoEscola[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    apiRequest<ContatoEscola[]>("/contatos")
      .then(setEscolas)
      .catch((err: unknown) => setErro(err instanceof Error ? err.message : "Não foi possível carregar os contatos."));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Contatos escolares</h1>
        <p className="text-sm text-muted-foreground">Canais institucionais para comunicação com a direção e a secretaria.</p>
      </header>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {escolas.map((escola) => (
          <Card key={escola.escolaId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><School className="h-4 w-4" />{escola.escolaNome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 border-b pb-3 text-sm">
                <p className="font-semibold">Contato institucional</p>
                {escola.emailInstitucional && <a className="flex items-center gap-2 text-primary" href={`mailto:${escola.emailInstitucional}`}><Mail className="h-4 w-4" />{escola.emailInstitucional}</a>}
                {escola.telefone && <a className="flex items-center gap-2 text-primary" href={`tel:${escola.telefone}`}><Phone className="h-4 w-4" />{escola.telefone}</a>}
                {!escola.emailInstitucional && !escola.telefone && <p className="text-sm text-muted-foreground">A escola ainda não cadastrou contato institucional.</p>}
              </div>
              {escola.contatos.map((contato, index) => (
                <div key={`${contato.funcao}-${index}`} className="space-y-1 text-sm">
                  <p className="font-semibold">{contato.funcao}: {contato.nome}</p>
                  {contato.email && <a className="flex items-center gap-2 text-primary" href={`mailto:${contato.email}`}><Mail className="h-4 w-4" />{contato.email}</a>}
                  {contato.telefone && <a className="flex items-center gap-2 text-primary" href={`tel:${contato.telefone}`}><Phone className="h-4 w-4" />{contato.telefone}</a>}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {!erro && escolas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma escola disponível.</p>}
    </div>
  );
}
