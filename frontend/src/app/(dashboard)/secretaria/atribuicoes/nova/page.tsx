"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useSessionDraft } from "@/lib/use-session-draft";

type FormData = { professorId: string; turmaId: string; disciplinaId: string };
const vazio: FormData = { professorId: "", turmaId: "", disciplinaId: "" };

function AtribuicaoForm() {
  const router = useRouter();
  const search = useSearchParams();
  const professorParam = search.get("professorId") || "";
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft(`atribuicao-form-nova-${professorParam || "geral"}`, vazio);
  const [professores, setProfessores] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    Promise.all([apiRequestAllPages<any>("/professores"), apiRequestAllPages<any>("/turmas"), apiRequestAllPages<any>("/disciplinas")])
      .then(([ps, ts, ds]) => {
        setProfessores(ps); setTurmas(ts); setDisciplinas(ds);
        if (!hasDraft) setForm({ professorId: professorParam || String(ps[0]?.id ?? ""), turmaId: String(ts[0]?.id ?? ""), disciplinaId: String(ds[0]?.id ?? "") });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar as opções."))
      .finally(() => setLoadingOptions(false));
  }, [hasDraft, professorParam, ready, setForm]);

  const professor = professores.find((item) => String(item.id) === form.professorId);
  const turmasFiltradas = professor?.escolaId ? turmas.filter((item) => !item.escolaId || item.escolaId === professor.escolaId) : turmas;
  const escolherProfessor = (professorId: string) => {
    const selecionado = professores.find((item) => String(item.id) === professorId);
    const turmasDisponiveis = selecionado?.escolaId ? turmas.filter((item) => !item.escolaId || item.escolaId === selecionado.escolaId) : turmas;
    setForm({ ...form, professorId, turmaId: turmasDisponiveis.some((item) => String(item.id) === form.turmaId) ? form.turmaId : String(turmasDisponiveis[0]?.id ?? "") });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await apiRequest("/atribuicoes", { method: "POST", body: JSON.stringify({ professorId: Number(form.professorId), turmaId: Number(form.turmaId), disciplinaId: Number(form.disciplinaId), ativo: true }) });
      clearDraft(); router.push(`/secretaria/atribuicoes${professorParam ? `?professorId=${professorParam}` : ""}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar a atribuição.");
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/secretaria/atribuicoes"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Vincular professor à turma</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Professor *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.professorId} onChange={(e) => escolherProfessor(e.target.value)} required>
          {professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium">Turma *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })} required>
          {turmasFiltradas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium">Disciplina *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })} required>
          {disciplinas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      {disciplinas.length === 0 && !loadingOptions && <p className="text-sm text-muted-foreground">Cadastre primeiro uma disciplina curricular.</p>}
      <Link href="/secretaria/disciplinas/nova"><Button type="button" variant="outline"><Plus className="mr-2 h-4 w-4" />Cadastrar disciplina</Button></Link>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/secretaria/atribuicoes"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving} disabled={loadingOptions || !form.professorId || !form.turmaId || !form.disciplinaId}><Save className="mr-2 h-4 w-4" />Confirmar vínculo</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}

export default function NovaAtribuicaoPage() {
  return <Suspense fallback={<p>Carregando formulário...</p>}><AtribuicaoForm /></Suspense>;
}
