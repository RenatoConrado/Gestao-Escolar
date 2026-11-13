"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, KeyRound, School, Shield, User } from "lucide-react";

export function Header() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  const perfilLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
    ADMIN: { label: "Administrador", variant: "default" },
    SECRETARIO: { label: "Secretaria", variant: "secondary" },
    PROFESSOR: { label: "Docente", variant: "success" },
    LEITOR: { label: "Leitor", variant: "warning" },
  };

  const perfilConfig = perfilLabels[usuario.perfil] || { label: usuario.perfil, variant: "secondary" };

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 md:px-8 backdrop-blur-md">
      {/* Escopo de Contexto */}
      <div className="flex items-center gap-2.5">
        <div>
          <h2 className="text-sm font-semibold leading-none text-foreground">
            {usuario.perfil === "ADMIN"
              ? "Rede Municipal de Educação"
              : usuario.escolaId
              ? `Escola Municipal (Polo #${usuario.escolaId})`
              : "Unidade Escolar"}
          </h2>
        </div>
      </div>

      {/* Perfil e Ações de Conta */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-medium text-foreground">{usuario.nome}</span>
          <span className="text-xs text-muted-foreground">{usuario.email}</span>
        </div>

        <Badge variant={perfilConfig.variant} className="capitalize">
          {perfilConfig.label}
        </Badge>

        <div className="flex items-center gap-1 border-l pl-3 ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sair do Sistema"
            aria-label="Sair"
            className="text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
