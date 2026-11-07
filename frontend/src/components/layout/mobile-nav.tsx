"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/sidebar";

export function MobileNav() {
  const pathname = usePathname();
  const { usuario } = useAuth();

  if (!usuario) return null;

  const permitidos = navItems.filter((item) => item.roles.includes(usuario.perfil));

  return (
    <nav
      aria-label="Navegação principal"
      className="no-print fixed bottom-0 left-0 right-0 z-40 max-w-full border-t bg-card/95 shadow-lg backdrop-blur-md md:hidden"
    >
      <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
        <div className="flex w-max min-w-full items-center gap-1 px-2 py-1">
          {permitidos.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-[50px] min-w-[72px] flex-none flex-col items-center justify-center rounded-lg px-3 py-2 transition-all",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                <span className="mt-1 whitespace-nowrap text-[11px]">{link.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
