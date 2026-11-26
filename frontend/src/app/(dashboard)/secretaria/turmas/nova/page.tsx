"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { useSessionDraft } from "@/lib/use-session-draft";

type TurmaForm = { nome: string; serie: string; turno: string; escolaId: string; anoLetivoId: string };
const inicial: TurmaForm = { nome: "", serie: "7º Ano", turno: "MANHA", escolaId: "", anoLetivoId: "" };

export default function NovaTurmaPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft("turma-form-nova", inicial);
  const [escolas, setEscolas] = useState<{ id: number; nome: string }[]>([]);
  const [anos, setAnos] = useState<{ id: number; ano: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    Promise.all([apiRequestAllPages<{ id: number; nome: string }>("/escolas"), apiRequestAllPages<{ id: number; ano: number }>("/anos-letivos")])
      .then(([listaEscolas, listaAnos]) => {
        setEscolas(listaEscolas);
        setAnos(listaAnos);
        if (!hasDraft) setForm((draft) => ({
          ...draft, escolaId: usuario?.escolaId ? String(usuario.escolaId) : String(listaEscolas[0]?.id ?? ""),
          anoLetivoId: String(listaAnos[0]?.id ?? ""),
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar escolas e anos letivos."));
  }, [hasDraft, ready, setForm, usuario?.escolaId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const escolaId = usuario?.escolaId || Number(form.escolaId);
    if (!escolaId || !form.anoLetivoId) return setError("Selecione uma escola e um ano letivo.");
    setSaving(true);
    setError("");
    try {
      await apiRequest("/turmas", { method: "POST", body: JSON.stringify({ ...form, escolaId, anoLetivoId: Number(form.anoLetivoId) }) });
      clearDraft();
      router.push("/secretaria/turmas?sucesso=cadastrada");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar a turma.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/secretaria/turmas"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Cadastrar turma</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Nome da turma *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Série / etapa *<Input value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Turno *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}>
          <option value="MANHA">Manhã</option><option value="TARDE">Tarde</option><option value="NOITE">Noite</option><option value="INTEGRAL">Integral</option>
        </select>
      </label>
      {!usuario?.escolaId && <label className="space-y-1 text-sm font-medium">Escola *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.escolaId} onChange={(e) => setForm({ ...form, escolaId: e.target.value })} required>
          <option value="">Selecione</option>{escolas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>}
      <label className="space-y-1 text-sm font-medium">Ano letivo *
        <select className="h-10 w-full rounded-md border bg-background px-3" value={form.anoLetivoId} onChange={(e) => setForm({ ...form, anoLetivoId: e.target.value })} required>
          <option value="">Selecione</option>{anos.map((item) => <option key={item.id} value={item.id}>{item.ano}</option>)}
        </select>
      </label>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/secretaria/turmas"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />Cadastrar turma</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}
