"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, apiRequestAllPages, ApiError } from "@/lib/api";
import { PerfilRole } from "@/types";
import { useSessionDraft } from "@/lib/use-session-draft";

type UsuarioForm = { nome: string; email: string; perfil: PerfilRole; escolaId: string; ativo: boolean };
const vazio: UsuarioForm = { nome: "", email: "", perfil: "PROFESSOR", escolaId: "", ativo: true };

function UsuarioFormPage() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft(`usuario-form-${id || "novo"}`, vazio);
  const [escolas, setEscolas] = useState<{ id: number; nome: string }[]>([]);
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequestAllPages<{ id: number; nome: string }>("/escolas").then(setEscolas)
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar escolas."));
  }, []);

  useEffect(() => {
    if (!id || !ready || hasDraft) return;
    apiRequest<any>(`/usuarios/${id}`).then((item) => setForm({
      nome: item.nome, email: item.email, perfil: item.perfil,
      escolaId: item.escolaId ? String(item.escolaId) : "", ativo: item.ativo,
    })).catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar o usuário."));
  }, [id, ready, hasDraft, setForm]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const escolaId = form.perfil === "SECRETARIO" || form.perfil === "PROFESSOR" || (form.perfil === "LEITOR" && form.escolaId)
      ? Number(form.escolaId) : null;
    const payload = { ...form, escolaId, ...(id ? {} : { senha }) };
    try {
      await apiRequest(id ? `/usuarios/${id}` : "/usuarios", {
        method: id ? "PUT" : "POST", body: JSON.stringify(payload),
      });
      clearDraft();
      router.push("/admin/usuarios?sucesso=salvo");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  const escolaObrigatoria = form.perfil === "SECRETARIO" || form.perfil === "PROFESSOR";
  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/admin/usuarios"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">{id ? "Editar usuário" : "Cadastrar usuário"}</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6">
      <label className="space-y-1 text-sm font-medium">Nome completo *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={150} required /></label>
      <label className="space-y-1 text-sm font-medium">E-mail institucional *<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={150} required /></label>
      <label className="space-y-1 text-sm font-medium">Perfil *
        <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value as PerfilRole, escolaId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3">
          {["PROFESSOR", "SECRETARIO", "ADMIN", "LEITOR"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      {form.perfil !== "ADMIN" && <label className="space-y-1 text-sm font-medium">Escola {escolaObrigatoria ? "*" : "(opcional)"}
        <select value={form.escolaId} onChange={(e) => setForm({ ...form, escolaId: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3" required={escolaObrigatoria}>
          <option value="">{form.perfil === "LEITOR" ? "Rede geral" : "Selecione uma escola"}</option>
          {escolas.map((escola) => <option key={escola.id} value={escola.id}>{escola.nome}</option>)}
        </select>
      </label>}
      {id ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />Perfil ativo</label>
        : <label className="space-y-1 text-sm font-medium">Senha provisória *<Input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Link href="/admin/usuarios"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving} disabled={saving || (escolaObrigatoria && !form.escolaId)}><Save className="mr-2 h-4 w-4" />{id ? "Salvar alterações" : "Cadastrar acesso"}</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}

export default function NovoUsuarioPage() {
  return <Suspense fallback={<p>Carregando formulário...</p>}><UsuarioFormPage /></Suspense>;
}
