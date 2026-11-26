"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarTelefoneEntrada } from "@/lib/utils";
import { useSessionDraft } from "@/lib/use-session-draft";

type EscolaForm = { nome: string; codigo: string; endereco: string; telefone: string; email: string; diretorId: number | null };
const vazio: EscolaForm = { nome: "", codigo: "", endereco: "", telefone: "", email: "", diretorId: null };

function EscolaFormPage() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft(`escola-form-${id || "nova"}`, vazio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !ready) return;
    apiRequest<any>(`/escolas/${id}`).then((escola) => {
      if (hasDraft) return;
      setForm({
        nome: escola.nome ?? "", codigo: escola.codigo ?? "", endereco: escola.endereco ?? "",
        telefone: escola.telefone ?? "", email: escola.email ?? "", diretorId: escola.diretorId ?? null,
      });
    }).catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar a escola."));
  }, [id, ready, hasDraft, setForm]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(id ? `/escolas/${id}` : "/escolas", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ ...form, endereco: form.endereco || null, telefone: form.telefone || null, email: form.email || null }),
      });
      clearDraft();
      router.push("/admin/escolas?sucesso=salvo");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a escola.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/admin/escolas"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">{id ? "Editar escola" : "Cadastrar escola"}</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Nome da escola *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Código INEP *<Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.replace(/\D/g, "").slice(0, 8) })} inputMode="numeric" minLength={8} maxLength={8} pattern="\d{8}" required /></label>
      <label className="space-y-1 text-sm font-medium">Endereço<Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></label>
      <label className="space-y-1 text-sm font-medium">Telefone<Input type="tel" maxLength={15} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefoneEntrada(e.target.value) })} /></label>
      <label className="space-y-1 text-sm font-medium">E-mail institucional<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/admin/escolas"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />{id ? "Salvar alterações" : "Cadastrar escola"}</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}

export default function NovaEscolaPage() {
  return <Suspense fallback={<p>Carregando formulário...</p>}><EscolaFormPage /></Suspense>;
}
