"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiError } from "@/lib/api";
import { useSessionDraft } from "@/lib/use-session-draft";

type DisciplinaForm = { nome: string; codigo: string };
const vazio: DisciplinaForm = { nome: "", codigo: "" };

export default function NovaDisciplinaPage() {
  const router = useRouter();
  const [form, setForm, clearDraft] = useSessionDraft("disciplina-form-nova", vazio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await apiRequest("/disciplinas", { method: "POST", body: JSON.stringify({ nome: form.nome.trim(), codigo: form.codigo.trim() }) });
      clearDraft(); router.push("/secretaria/atribuicoes/nova");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar a disciplina.");
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/secretaria/atribuicoes/nova"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Cadastrar disciplina</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Nome *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} required /></label>
      <label className="space-y-1 text-sm font-medium">Código *<Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} maxLength={30} required /></label>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/secretaria/atribuicoes/nova"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />Cadastrar disciplina</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}
