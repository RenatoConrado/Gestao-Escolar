"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeftRight, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { ApiError, apiRequest, apiRequestAllPages } from "@/lib/api";

interface Opcao { id: number; nome: string; matricula?: string; escolaId?: number; anoLetivoId?: number; }
interface Transferencia {
  id: number; alunoId: number; alunoNome: string; matricula: string;
  escolaOrigem: string; escolaDestino: string; escolaDestinoId: number;
  anoLetivoId: number; turmaDestino?: string; situacao: string; justificativa?: string;
}

export default function TransferenciasPage() {
  const { usuario } = useAuth();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [alunos, setAlunos] = useState<Opcao[]>([]);
  const [escolas, setEscolas] = useState<Opcao[]>([]);
  const [turmas, setTurmas] = useState<Opcao[]>([]);
  const [alunoId, setAlunoId] = useState("");
  const [escolaDestinoId, setEscolaDestinoId] = useState("");
  const [turmaPorTransferencia, setTurmaPorTransferencia] = useState<Record<number, string>>({});
  const [justificativaPorTransferencia, setJustificativaPorTransferencia] = useState<Record<number, string>>({});
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    try {
      const [requests, listaAlunos, listaEscolas, listaTurmas] = await Promise.all([
        apiRequestAllPages<Transferencia>("/transferencias"),
        apiRequestAllPages<Opcao>("/alunos"),
        apiRequestAllPages<Opcao>("/escolas"),
        apiRequestAllPages<Opcao>("/turmas"),
      ]);
      setTransferencias(requests);
      setAlunos(listaAlunos);
      setEscolas(listaEscolas);
      setTurmas(listaTurmas);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar as transferências.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  const solicitar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro("");
    setMensagem("");
    try {
      await apiRequest("/transferencias", {
        method: "POST",
        body: JSON.stringify({ alunoId: Number(alunoId), escolaDestinoId: Number(escolaDestinoId) }),
      });
      setMensagem("Solicitação enviada. A escola de destino receberá a notificação na lista abaixo.");
      setAlunoId("");
      setEscolaDestinoId("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível solicitar a transferência.");
    }
  };

  const decidir = async (item: Transferencia, aceitar: boolean) => {
    if (aceitar && !turmaPorTransferencia[item.id]) {
      setErro("Selecione uma turma de destino antes de aceitar.");
      return;
    }
    if (!aceitar && !justificativaPorTransferencia[item.id]?.trim()) {
      setErro("Informe uma justificativa para recusar a transferência.");
      return;
    }
    if (!window.confirm(`Confirmar ${aceitar ? "aceite" : "recusa"} da transferência de ${item.alunoNome}?`)) return;
    try {
      await apiRequest(`/transferencias/${item.id}/decisao`, {
        method: "PUT",
        body: JSON.stringify({
          aceitar,
          turmaDestinoId: aceitar ? Number(turmaPorTransferencia[item.id]) : null,
          justificativa: aceitar ? null : justificativaPorTransferencia[item.id].trim(),
        }),
      });
      setMensagem(aceitar ? "Transferência aceita; matrícula criada na escola de destino." : "Transferência recusada com justificativa.");
      setErro("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a decisão.");
    }
  };

  const pendentesEntrada = transferencias.filter((item) =>
    item.situacao === "PENDENTE" && (usuario?.perfil === "ADMIN" || item.escolaDestinoId === usuario?.escolaId));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="border-b pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ArrowLeftRight className="h-6 w-6" />Transferências de alunos</h1>
        <p className="text-sm text-muted-foreground">Solicitações pendentes aparecem para a escola de destino. A recusa exige justificativa.</p>
      </header>
      {erro && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Não foi possível concluir</AlertTitle><AlertDescription>{erro}</AlertDescription></Alert>}
      {mensagem && <p role="status" className="text-sm text-emerald-700">{mensagem}</p>}
      <Card>
        <CardHeader><CardTitle className="text-base">Solicitar transferência</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={solicitar} className="grid gap-3 md:grid-cols-3">
            <select required value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Selecione o aluno</option>
              {alunos.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.matricula}</option>)}
            </select>
            <select required value={escolaDestinoId} onChange={(e) => setEscolaDestinoId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Escola de destino</option>
              {escolas.filter((item) => item.id !== usuario?.escolaId).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
            <Button type="submit" disabled={!alunoId || !escolaDestinoId}>Enviar solicitação</Button>
          </form>
        </CardContent>
      </Card>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Solicitações e notificações</h2>
        {transferencias.map((item) => {
          const podeDecidir = item.situacao === "PENDENTE" && (usuario?.perfil === "ADMIN" || item.escolaDestinoId === usuario?.escolaId);
          const turmasDestino = turmas.filter((turma) =>
            turma.escolaId === item.escolaDestinoId && turma.anoLetivoId === item.anoLetivoId);
          return (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.alunoNome} <span className="font-normal text-muted-foreground">({item.matricula})</span></p>
                    <p className="text-sm text-muted-foreground">{item.escolaOrigem} → {item.escolaDestino}</p>
                    {item.justificativa && <p className="text-sm">Justificativa: {item.justificativa}</p>}
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{item.situacao}</span>
                </div>
                {podeDecidir && <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
                  <select value={turmaPorTransferencia[item.id] || ""} onChange={(e) => setTurmaPorTransferencia((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="h-10 rounded-md border bg-background px-3 text-sm">
                    <option value="">Turma para matrícula (aceite)</option>
                    {turmasDestino.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}
                  </select>
                  <Input maxLength={500} placeholder="Justificativa obrigatória se recusar"
                    value={justificativaPorTransferencia[item.id] || ""}
                    onChange={(e) => setJustificativaPorTransferencia((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => decidir(item, true)}><Check className="mr-1 h-4 w-4" />Aceitar</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => decidir(item, false)}><X className="mr-1 h-4 w-4" />Recusar</Button>
                  </div>
                </div>}
              </CardContent>
            </Card>
          );
        })}
        {!carregando && transferencias.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação de transferência.</p>}
        {pendentesEntrada.length > 0 && <p className="text-sm font-semibold text-amber-700">{pendentesEntrada.length} notificação(ões) aguardando decisão.</p>}
      </section>
    </div>
  );
}
