import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarData(dataIso: string): string {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Retorna a data no fuso horário local do navegador no formato YYYY-MM-DD (evita avanço UTC após 21h BRT). */
export function hojeLocalISO(data: Date = new Date()): string {
  return data.toLocaleDateString("en-CA");
}

export function formatarCpf(cpf?: string | null, mascarar = false): string {
  if (!cpf) return "—";
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length === 11) {
    if (mascarar) {
      return `***.${limpo.slice(3, 6)}.***-**`;
    }
    return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
  }
  return cpf;
}

export function formatarTelefone(telefone?: string): string {
  if (!telefone) return "";
  const limpo = telefone.replace(/\D/g, "");
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return telefone;
}

export function formatarTelefoneEntrada(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos ? `(${digitos}` : "";
  const ddd = digitos.slice(0, 2);
  const restante = digitos.slice(2);
  const tamanhoInicial = digitos.length > 10 ? 5 : 4;
  return `(${ddd}) ${restante.slice(0, tamanhoInicial)}${restante.length > tamanhoInicial ? `-${restante.slice(tamanhoInicial)}` : ""}`;
}

export function formatarCpfEntrada(cpf: string): string {
  const digitos = cpf.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}
