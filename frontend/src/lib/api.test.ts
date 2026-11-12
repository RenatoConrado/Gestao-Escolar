import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, apiRequestAllPages } from "./api";
import { formatarCpf, hojeLocalISO } from "./utils";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequestAllPages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("combines all pages and preserves caller filters", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        content: [{ id: 1 }],
        totalPages: 2,
      }))
      .mockResolvedValueOnce(response({
        content: [{ id: 2 }],
        totalPages: 2,
      }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequestAllPages<{ id: number }>("/alunos", {
      params: { escolaId: 7, ativo: true },
    });

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => new URL(String(url), "http://localhost").searchParams.toString()))
      .toEqual([
        "escolaId=7&ativo=true&page=0&size=100",
        "escolaId=7&ativo=true&page=1&size=100",
      ]);
  });

  it("returns an array response without requesting another page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([{ id: 1 }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequestAllPages("/atribuicoes/minhas")).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an empty result when the paginated response has no pages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ content: [], totalPages: 0 })));

    await expect(apiRequestAllPages("/alunos")).resolves.toEqual([]);
  });

  it("rejects an unexpected first-page format", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ items: [] })));

    await expect(apiRequestAllPages("/alunos")).rejects.toThrow("Formato de lista inesperado");
  });

  it("rejects invalid pagination metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ content: [], totalPages: "1" })));

    await expect(apiRequestAllPages("/alunos")).rejects.toThrow("Metadados de paginação inválidos");
  });

  it("rejects a malformed subsequent page", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ content: [{ id: 1 }], totalPages: 2 }))
      .mockResolvedValueOnce(response({ items: [{ id: 2 }] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequestAllPages("/alunos")).rejects.toThrow("Formato de página inesperado");
  });
});

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts unsuccessful HTTP responses to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      timestamp: "2026-01-01T00:00:00Z",
      status: 422,
      error: "Unprocessable Entity",
      message: "Regra de negócio violada",
      path: "/alunos",
    }, 422)));

    await expect(apiRequest("/alunos")).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "Regra de negócio violada",
    } satisfies Partial<ApiError>);
  });
});

describe("utils (hojeLocalISO & formatarCpf)", () => {
  it("formats local date as YYYY-MM-DD without UTC shift", () => {
    const dataLocal = new Date(2026, 2, 15, 22, 30, 0);
    expect(hojeLocalISO(dataLocal)).toBe("2026-03-15");
  });

  it("formats 11-digit CPF, masks when requested, and preserves backend masks", () => {
    expect(formatarCpf("12345678900")).toBe("123.456.789-00");
    expect(formatarCpf("12345678900", true)).toBe("***.456.***-**");
    expect(formatarCpf("***.456.***-**", true)).toBe("***.456.***-**");
    expect(formatarCpf(null)).toBe("—");
    expect(formatarCpf(undefined)).toBe("—");
  });
});
