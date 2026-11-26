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
import { formatarCpfEntrada, formatarTelefoneEntrada } from "@/lib/utils";
import { useSessionDraft } from "@/lib/use-session-draft";

type ProfessorForm = { matricula: string; nome: string; cpf: string; email: string; formacao: string; telefone: string; escolaId: string; usuarioId: string };
const inicial: ProfessorForm = { matricula: "", nome: "", cpf: "", email: "", formacao: "", telefone: "", escolaId: "", usuarioId: "" };

export default function NovoProfessorPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [form, setForm, clearDraft, ready, hasDraft] = useSessionDraft("professor-form-novo", inicial);
  const [escolas, setEscolas] = useState<{ id: number; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string; email: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    Promise.all([
      apiRequestAllPages<{ id: number; nome: string }>("/escolas"),
      apiRequestAllPages<{ id: number; nome: string; email: string; perfil: string }>("/usuarios"),
    ]).then(([listaEscolas, listaUsuarios]) => {
      setEscolas(listaEscolas);
      setUsuarios(listaUsuarios.filter((u) => u.perfil === "PROFESSOR"));
      if (!hasDraft) setForm((draft) => ({ ...draft, escolaId: usuario?.escolaId ? String(usuario.escolaId) : String(listaEscolas[0]?.id ?? "") }));
    }).catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar as opções do formulário."));
  }, [hasDraft, ready, setForm, usuario?.escolaId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cpf = form.cpf.replace(/\D/g, "");
    if (cpf.length !== 11) return setError("O CPF deve conter exatamente 11 dígitos.");
    setSaving(true);
    setError("");
    try {
      await apiRequest("/professores", {
        method: "POST",
        body: JSON.stringify({ ...form, cpf, escolaId: Number(form.escolaId), usuarioId: form.usuarioId ? Number(form.usuarioId) : null, telefone: form.telefone || null }),
      });
      clearDraft();
      router.push("/secretaria/professores?sucesso=cadastrado");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar o professor.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="flex items-center gap-3 border-b pb-4">
      <Link href="/secretaria/professores"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Cadastrar professor</h1>
    </header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><form onSubmit={submit}><CardContent className="grid gap-4 p-6 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Nome completo *<Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Matrícula funcional *<Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value.slice(0, 30) })} maxLength={30} pattern="[A-Za-z0-9./-]{1,30}" required /></label>
      <label className="space-y-1 text-sm font-medium">CPF *<Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatarCpfEntrada(e.target.value) })} inputMode="numeric" maxLength={14} required /></label>
      <label className="space-y-1 text-sm font-medium sm:col-span-2">E-mail institucional *<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium">Escola *<select className="h-10 w-full rounded-md border bg-background px-3" value={form.escolaId} onChange={(e) => setForm({ ...form, escolaId: e.target.value })} required>
        <option value="">Selecione</option>{escolas.map((escola) => <option key={escola.id} value={escola.id}>{escola.nome}</option>)}
      </select></label>
      <label className="space-y-1 text-sm font-medium">Conta vinculada<select className="h-10 w-full rounded-md border bg-background px-3" value={form.usuarioId} onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}>
        <option value="">Sem conta vinculada</option>{usuarios.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.email}</option>)}
      </select></label>
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Formação acadêmica *<Input value={form.formacao} onChange={(e) => setForm({ ...form, formacao: e.target.value })} required /></label>
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Telefone<Input type="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefoneEntrada(e.target.value) })} /></label>
      <div className="flex justify-end gap-3 border-t pt-4 sm:col-span-2">
        <Link href="/secretaria/professores"><Button type="button" variant="outline">Cancelar</Button></Link>
        <Button type="submit" isLoading={saving}><Save className="mr-2 h-4 w-4" />Salvar cadastro</Button>
      </div>
    </CardContent></form></Card>
  </div>;
}
