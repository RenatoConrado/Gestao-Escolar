"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarCpfEntrada, formatarTelefoneEntrada } from "@/lib/utils";
import { useSessionDraft } from "@/lib/use-session-draft";

type AlunoForm = { nome: string; matricula: string; dataNascimento: string; cpf: string; responsavel: string; telefone: string; endereco: string };
const vazio: AlunoForm = { nome: "", matricula: "", dataNascimento: "", cpf: "", responsavel: "", telefone: "", endereco: "" };

export default function EditarAlunoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft(`aluno-form-edicao-${id}`, vazio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || hasDraft) return;
    apiRequest<any>(`/alunos/${id}`).then((aluno) => setForm({
      nome: aluno.nome, matricula: aluno.matricula, dataNascimento: aluno.dataNascimento,
      cpf: formatarCpfEntrada(aluno.cpf || ""), responsavel: aluno.responsavel || "",
      telefone: aluno.telefone || "", endereco: aluno.endereco || "",
    })).catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar o aluno."));
  }, [id, ready, hasDraft, setForm]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await apiRequest(`/alunos/${id}`, { method: "PUT", body: JSON.stringify({ ...form, cpf: form.cpf.replace(/\D/g, "") || null }) });
      clearDraft(); router.push(`/secretaria/alunos/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar o cadastro.");
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href={`/secretaria/alunos/${id}`}><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Editar cadastro do aluno</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Nome *<Input required maxLength={150} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
      <label className="space-y-1 text-sm font-medium">Matrícula *<Input required maxLength={30} pattern="[A-Za-z0-9./-]{1,30}" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} /></label>
      <label className="space-y-1 text-sm font-medium">Data de nascimento *<Input required type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} /></label>
      <label className="space-y-1 text-sm font-medium">CPF<Input inputMode="numeric" maxLength={14} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatarCpfEntrada(e.target.value) })} /></label>
      <label className="space-y-1 text-sm font-medium">Responsável<Input maxLength={150} value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></label>
      <label className="space-y-1 text-sm font-medium">Telefone<Input type="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefoneEntrada(e.target.value) })} /></label>
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Endereço<Input maxLength={255} value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></label>
      <div className="flex justify-end gap-3 border-t pt-4 sm:col-span-2">
        <Link href={`/secretaria/alunos/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />Salvar alterações</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}
