"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  CalendarDays,
  ShieldAlert,
  ClipboardCheck,
  BookOpen,
  FileText,
  UserCheck,
  FolderKanban,
  KeyRound,
  Award,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"ADMIN" | "SECRETARIO" | "PROFESSOR" | "LEITOR">;
}

export const navItems: NavItem[] = [
  // Dashboard Geral
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"],
  },
  // Módulo do Professor
  {
    title: "Minhas Turmas",
    href: "/professor/turmas",
    icon: GraduationCap,
    roles: ["PROFESSOR"],
  },
  {
    title: "Diário de Frequência",
    href: "/professor/frequencia",
    icon: ClipboardCheck,
    roles: ["PROFESSOR"],
  },
  {
    title: "Avaliações e Notas",
    href: "/professor/avaliacoes",
    icon: Award,
    roles: ["PROFESSOR"],
  },
  // Módulo da Secretaria
  {
    title: "Alunos",
    href: "/secretaria/alunos",
    icon: Users,
    roles: ["ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"],
  },
  {
    title: "Professores",
    href: "/secretaria/professores",
    icon: GraduationCap,
    roles: ["ADMIN", "SECRETARIO", "LEITOR"],
  },
  {
    title: "Matrículas",
    href: "/secretaria/matriculas",
    icon: UserCheck,
    roles: ["ADMIN", "SECRETARIO", "LEITOR"],
  },
  {
    title: "Turmas e Séries",
    href: "/secretaria/turmas",
    icon: BookOpen,
    roles: ["ADMIN", "SECRETARIO", "LEITOR"],
  },
  {
    title: "Docentes e Atribuições",
    href: "/secretaria/atribuicoes",
    icon: FolderKanban,
    roles: ["ADMIN", "SECRETARIO", "LEITOR"],
  },
  // Módulo Administrativo
  {
    title: "Escolas Municipais",
    href: "/admin/escolas",
    icon: Building2,
    roles: ["ADMIN"],
  },
  {
    title: "Anos Letivos",
    href: "/admin/anos-letivos",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    title: "Gestão de Usuários",
    href: "/admin/usuarios",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Trilha de Auditoria",
    href: "/admin/auditoria",
    icon: ShieldAlert,
    roles: ["ADMIN"],
  },
  // Relatórios
  {
    title: "Relatórios e Impressão",
    href: "/relatorios/resumo",
    icon: FileText,
    roles: ["ADMIN", "SECRETARIO", "LEITOR"],
  },
  // Conta
  {
    title: "Alterar Senha",
    href: "/perfil/senha",
    icon: KeyRound,
    roles: ["ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuth();

  if (!usuario) return null;

  const itensFiltrados = navItems.filter((item) =>
    item.roles.includes(usuario.perfil)
  );

  return (
    <aside className="no-print hidden md:flex w-64 flex-col border-r bg-card/60 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
          S
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-foreground">
            SIGE Educação
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
            Rede Municipal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {itensFiltrados.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
