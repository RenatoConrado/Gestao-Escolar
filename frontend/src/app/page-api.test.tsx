import React, { type ComponentType } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PerfilRole } from "@/types";
import AdminAnosLetivosPage from "@/app/(dashboard)/admin/anos-letivos/page";
import AdminAuditoriaPage from "@/app/(dashboard)/admin/auditoria/page";
import AdminEscolasPage from "@/app/(dashboard)/admin/escolas/page";
import AdminUsuariosPage from "@/app/(dashboard)/admin/usuarios/page";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import AlterarSenhaPage from "@/app/(dashboard)/perfil/senha/page";
import ProfessorAvaliacoesPage from "@/app/(dashboard)/professor/avaliacoes/page";
import ProfessorFrequenciaPage from "@/app/(dashboard)/professor/frequencia/page";
import ProfessorTurmasPage from "@/app/(dashboard)/professor/turmas/page";
import RelatoriosResumoPage from "@/app/(dashboard)/relatorios/resumo/page";
import RelatorioFrequenciaTurmaPage from "@/app/(dashboard)/relatorios/turmas/[id]/frequencia/page";
import AlunoDetalhePage from "@/app/(dashboard)/secretaria/alunos/[id]/page";
import AlunoNovoPage from "@/app/(dashboard)/secretaria/alunos/novo/page";
import AlunosPage from "@/app/(dashboard)/secretaria/alunos/page";
import AtribuicoesPage from "@/app/(dashboard)/secretaria/atribuicoes/page";
import MatriculaNovaPage from "@/app/(dashboard)/secretaria/matriculas/nova/page";
import MatriculasPage from "@/app/(dashboard)/secretaria/matriculas/page";
import ProfessoresPage from "@/app/(dashboard)/secretaria/professores/page";
import TurmasPage from "@/app/(dashboard)/secretaria/turmas/page";

const mocks = vi.hoisted(() => ({
  user: null as { perfil: PerfilRole; escolaId: number; id: number; nome: string; email: string } | null,
  params: { id: "42" },
  apiRequest: vi.fn(),
  apiRequestAllPages: vi.fn(),
  atualizarToken: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn() },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
    apiRequestAllPages: mocks.apiRequestAllPages,
  };
});

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    usuario: mocks.user,
    isAuthenticated: true,
    isLoading: false,
    restoreError: null,
    login: vi.fn(),
    logout: vi.fn(),
    atualizarToken: mocks.atualizarToken,
    temPermissao: (perfis: PerfilRole[]) => !!mocks.user && perfis.includes(mocks.user.perfil),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
  useParams: () => mocks.params,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  return {
    default: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
      ReactModule.createElement("a", { href, ...props }, children),
  };
});

type TestePagina = {
  nome: string;
  pagina: ComponentType;
  perfis: PerfilRole[];
  chamadasDiretas?: string[];
  chamadasPaginadas?: string[];
};

const todosPerfis: PerfilRole[] = ["ADMIN", "SECRETARIO", "PROFESSOR", "LEITOR"];
const perfisSecretaria: PerfilRole[] = ["ADMIN", "SECRETARIO", "LEITOR"];
const perfisEscritaSecretaria: PerfilRole[] = ["ADMIN", "SECRETARIO"];
const perfisRelatorio: PerfilRole[] = ["ADMIN", "SECRETARIO", "LEITOR"];

const paginas: TestePagina[] = [
  { nome: "dashboard", pagina: DashboardPage, perfis: todosPerfis, chamadasDiretas: ["/relatorios/resumo"] },
  { nome: "anos letivos", pagina: AdminAnosLetivosPage, perfis: ["ADMIN"], chamadasPaginadas: ["/anos-letivos"] },
  { nome: "auditoria", pagina: AdminAuditoriaPage, perfis: ["ADMIN"], chamadasPaginadas: ["/auditoria"] },
  { nome: "escolas", pagina: AdminEscolasPage, perfis: ["ADMIN"], chamadasPaginadas: ["/escolas"] },
  { nome: "usuários", pagina: AdminUsuariosPage, perfis: ["ADMIN"], chamadasPaginadas: ["/usuarios", "/escolas"] },
  { nome: "alteração de senha", pagina: AlterarSenhaPage, perfis: todosPerfis },
  {
    nome: "avaliações do professor",
    pagina: ProfessorAvaliacoesPage,
    perfis: ["PROFESSOR"],
    chamadasDiretas: ["/atribuicoes/minhas", "/turmas/2/alunos"],
    chamadasPaginadas: ["/avaliacoes", "/notas/avaliacao/9"],
  },
  {
    nome: "frequência do professor",
    pagina: ProfessorFrequenciaPage,
    perfis: ["PROFESSOR"],
    chamadasDiretas: ["/atribuicoes/minhas", "/turmas/2/alunos"],
    chamadasPaginadas: ["/frequencias"],
  },
  {
    nome: "turmas do professor",
    pagina: ProfessorTurmasPage,
    perfis: ["PROFESSOR"],
    chamadasDiretas: ["/atribuicoes/minhas"],
  },
  {
    nome: "relatório consolidado",
    pagina: RelatoriosResumoPage,
    perfis: perfisRelatorio,
    chamadasDiretas: ["/relatorios/resumo"],
    chamadasPaginadas: ["/escolas"],
  },
  {
    nome: "frequência da turma",
    pagina: RelatorioFrequenciaTurmaPage,
    perfis: perfisRelatorio,
    chamadasDiretas: ["/relatorios/turmas/42/frequencia", "/turmas/42"],
  },
  {
    nome: "prontuário do aluno",
    pagina: AlunoDetalhePage,
    perfis: todosPerfis,
    chamadasDiretas: ["/alunos/42", "/relatorios/alunos/42"],
  },
  { nome: "novo aluno", pagina: AlunoNovoPage, perfis: perfisEscritaSecretaria },
  {
    nome: "lista de alunos",
    pagina: AlunosPage,
    perfis: todosPerfis,
    chamadasPaginadas: ["/alunos"],
  },
  {
    nome: "atribuições",
    pagina: AtribuicoesPage,
    perfis: perfisSecretaria,
    chamadasPaginadas: ["/atribuicoes", "/professores", "/turmas", "/disciplinas", "/anos-letivos"],
  },
  {
    nome: "nova matrícula",
    pagina: MatriculaNovaPage,
    perfis: perfisEscritaSecretaria,
    chamadasPaginadas: ["/alunos", "/turmas"],
  },
  {
    nome: "matrículas",
    pagina: MatriculasPage,
    perfis: perfisSecretaria,
    chamadasPaginadas: ["/matriculas"],
  },
  {
    nome: "professores",
    pagina: ProfessoresPage,
    perfis: perfisSecretaria,
    chamadasPaginadas: ["/professores", "/escolas"],
  },
  {
    nome: "turmas da secretaria",
    pagina: TurmasPage,
    perfis: perfisSecretaria,
    chamadasPaginadas: ["/escolas", "/anos-letivos", "/turmas"],
  },
];

const atribuicao = {
  id: 3,
  turmaId: 2,
  professorId: 4,
  turmaNome: "Turma A",
  professorNome: "Professor",
  disciplinaId: 5,
  disciplinaNome: "Matemática",
  escolaNome: "Escola",
  serie: "5º Ano",
  turno: "MANHA",
  ativo: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params.id = "42";
  mocks.apiRequest.mockImplementation(async (endpoint: string) => {
    if (endpoint === "/atribuicoes/minhas") return [atribuicao];
    if (endpoint === "/alunos/42") return { id: 42, nome: "Ana", matricula: "A-42" };
    if (endpoint === "/relatorios/alunos/42") {
      return { disciplinas: [], frequencia: { totalRegistros: 0, presencas: 0, faltas: 0, percentualPresenca: 0 } };
    }
    if (endpoint === "/relatorios/resumo" || endpoint === "/turmas/42") return {};
    if (endpoint.startsWith("/relatorios/turmas/") || endpoint.endsWith("/alunos")) return [];
    return [];
  });
  mocks.apiRequestAllPages.mockImplementation(async (endpoint: string) => {
    if (endpoint === "/avaliacoes") {
      return [{ id: 9, atribuicaoId: 3, nome: "Prova", data: "2026-03-15", valorMaximo: 10 }];
    }
    return [];
  });
  mocks.user = { perfil: "ADMIN", escolaId: 1, id: 7, nome: "Usuário de teste", email: "teste@sige.local" };
});

afterEach(() => {
  cleanup();
});

describe("chamadas de API por página e perfil", () => {
  for (const caso of paginas) {
    for (const perfil of caso.perfis) {
      it(`${caso.nome} (${perfil}) chama os endpoints esperados`, async () => {
        mocks.user = { ...mocks.user!, perfil };
        render(React.createElement(caso.pagina));

        await waitFor(() => {
          for (const endpoint of caso.chamadasDiretas ?? []) {
            expect(mocks.apiRequest.mock.calls.some(([url]) => url === endpoint)).toBe(true);
          }
          for (const endpoint of caso.chamadasPaginadas ?? []) {
            expect(mocks.apiRequestAllPages.mock.calls.some(([url]) => url === endpoint)).toBe(true);
          }
        });

        if (caso.nome === "professores") {
          const carregaUsuarios = perfil === "ADMIN" || perfil === "SECRETARIO";
          expect(mocks.apiRequestAllPages.mock.calls.some(([url]) => url === "/usuarios")).toBe(carregaUsuarios);
        }
      });
    }
  }
});

describe("permissões e gravações iniciadas na página de alunos", () => {
  it.each([
    ["ADMIN", true],
    ["SECRETARIO", true],
    ["PROFESSOR", false],
    ["LEITOR", false],
  ] as const)("mostra ação de cadastro para %s conforme permissão", (perfil, podeCadastrar) => {
    mocks.user = { ...mocks.user!, perfil };
    render(<AlunosPage />);

    expect(screen.queryByRole("link", { name: /Novo Aluno/i }) !== null).toBe(podeCadastrar);
  });

  it.each(["ADMIN", "SECRETARIO"] as const)("envia cadastro de aluno para %s", async (perfil) => {
    mocks.user = { ...mocks.user!, perfil };
    render(<AlunoNovoPage />);
    const inputs = document.querySelectorAll("form input");

    fireEvent.change(inputs[0], { target: { value: "Ana Silva" } });
    fireEvent.change(inputs[1], { target: { value: "A-100" } });
    fireEvent.change(inputs[2], { target: { value: "2012-03-15" } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mocks.apiRequest).toHaveBeenCalledWith(
        "/alunos",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
