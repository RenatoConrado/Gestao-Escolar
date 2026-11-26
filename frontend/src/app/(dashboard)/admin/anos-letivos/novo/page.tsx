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

type AnoForm = { ano: string; dataInicio: string; dataFim: string };
const anoSeguinte = new Date().getFullYear() + 1;
const inicial: AnoForm = { ano: String(anoSeguinte), dataInicio: `${anoSeguinte}-02-01`, dataFim: `${anoSeguinte}-12-15` };

export default function NovoAnoLetivoPage() {
  const router = useRouter();
  const [form, setForm, clearDraft] = useSessionDraft("ano-letivo-form-novo", inicial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (new Date(form.dataFim) <= new Date(form.dataInicio)) {
      setError("A data de término deve ser posterior à data de início.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest("/anos-letivos", { method: "POST", body: JSON.stringify({ ...form, ano: Number(form.ano) }) });
      clearDraft();
      router.push("/admin/anos-letivos?sucesso=cadastrado");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o ano letivo.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/admin/anos-letivos"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Cadastrar ano letivo</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Ano letivo *<Input type="number" min="2020" max="2040" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Data de início *<Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Data de término *<Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} required /></label>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/admin/anos-letivos"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />Cadastrar ano letivo</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}
