"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiError } from "@/lib/api";
import { hojeLocalISO } from "@/lib/utils";
import { useSessionDraft } from "@/lib/use-session-draft";
import { AtribuicaoDocente } from "@/types";

type AvaliacaoForm = { atribuicaoId: string; nome: string; data: string; valorMaximo: string };
const vazio: AvaliacaoForm = { atribuicaoId: "", nome: "", data: hojeLocalISO(), valorMaximo: "10.00" };

function AvaliacaoFormPage() {
  const router = useRouter();
  const search = useSearchParams();
  const atribuicaoParam = search.get("atribuicaoId") || "";
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft(`avaliacao-form-nova-${atribuicaoParam || "geral"}`, { ...vazio, atribuicaoId: atribuicaoParam });
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoDocente[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    apiRequest<AtribuicaoDocente[]>("/atribuicoes/minhas").then((items) => {
      setAtribuicoes(items);
      if (!hasDraft && !atribuicaoParam && items.length) setForm((draft) => ({ ...draft, atribuicaoId: String(items[0].id) }));
    }).catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar as atribuições."));
  }, [atribuicaoParam, hasDraft, ready, setForm]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const max = Number(form.valorMaximo.replace(",", "."));
    if (!Number.isFinite(max) || max <= 0 || max > 10) return setError("O valor máximo deve estar entre 0,01 e 10.");
    setSaving(true); setError("");
    try {
      await apiRequest("/avaliacoes", { method: "POST", body: JSON.stringify({ atribuicaoId: Number(form.atribuicaoId), nome: form.nome, data: form.data, valorMaximo: max }) });
      clearDraft();
      router.push(`/professor/avaliacoes?atribuicaoId=${form.atribuicaoId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a avaliação.");
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href={`/professor/avaliacoes${atribuicaoParam ? `?atribuicaoId=${atribuicaoParam}` : ""}`}><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Cadastrar avaliação</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Turma e disciplina *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.atribuicaoId} onChange={(e) => setForm({ ...form, atribuicaoId: e.target.value })} required>
          <option value="">Selecione</option>{atribuicoes.map((item) => <option key={item.id} value={item.id}>{item.turmaNome} — {item.disciplinaNome}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium">Nome da prova / trabalho *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Data da aplicação *<Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Nota máxima *<Input type="number" step="0.1" min="0.1" max="10" value={form.valorMaximo} onChange={(e) => setForm({ ...form, valorMaximo: e.target.value })} required /></label>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href={`/professor/avaliacoes${atribuicaoParam ? `?atribuicaoId=${atribuicaoParam}` : ""}`}><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving} disabled={!atribuicoes.length}><Save className="mr-2 h-4 w-4" />Criar avaliação</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}

export default function NovaAvaliacaoPage() {
  return <Suspense fallback={<p>Carregando formulário...</p>}><AvaliacaoFormPage /></Suspense>;
}
