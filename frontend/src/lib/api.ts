import { ApiErrorResponse } from "@/types";
import { Usuario } from "@/types";

const TOKEN_KEY = "sige_auth_token";
const USER_KEY = "sige_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredSession(token: string, usuario: Usuario): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): Usuario | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) as Usuario : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;
  retryAfterSeconds?: number;

  constructor(status: number, data: ApiErrorResponse, retryAfterSeconds?: number) {
    super(data.message || `Erro HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers = {}, ...rest } = options;

  let url = endpoint.startsWith("http") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getStoredToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401) {
    clearStoredSession();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login?revogado=true";
    }
    throw new ApiError(401, {
      timestamp: new Date().toISOString(),
      status: 401,
      error: "Unauthorized",
      message: "Sessão expirada ou token revogado. Por favor, faça login novamente.",
      path: endpoint,
    });
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
    let errBody: any = {};
    try {
      errBody = await response.json();
    } catch {
      errBody = { message: "Muitas tentativas de login. Aguarde antes de tentar novamente." };
    }
    throw new ApiError(429, {
      timestamp: new Date().toISOString(),
      status: 429,
      error: "Too Many Requests",
      message: errBody.message || "Limite de requisições excedido.",
      path: endpoint,
      retryAfterSeconds: retrySeconds,
    }, retrySeconds);
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        message: `Falha na requisição: ${response.statusText}`,
        path: endpoint,
      };
    }
    throw new ApiError(response.status, errorData);
  }

  // Resposta sem conteúdo (ex: 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function apiRequestAllPages<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T[]> {
  const firstPage = await apiRequest<unknown>(endpoint, {
    ...options,
    params: { ...options.params, page: 0, size: 100 },
  });

  if (Array.isArray(firstPage)) return firstPage as T[];
  if (!firstPage || typeof firstPage !== "object") {
    throw new Error(`Resposta inválida ao carregar a lista de ${endpoint}.`);
  }

  const page = firstPage as { content?: unknown; totalPages?: unknown };
  if (!Array.isArray(page.content)) {
    throw new Error(`Formato de lista inesperado ao carregar ${endpoint}.`);
  }

  const result = [...page.content] as T[];
  if (typeof page.totalPages !== "number" || page.totalPages < 0) {
    throw new Error(`Metadados de paginação inválidos ao carregar ${endpoint}.`);
  }
  const totalPages = page.totalPages;
  for (let pageNumber = 1; pageNumber < totalPages; pageNumber += 1) {
    const data = await apiRequest<unknown>(endpoint, {
      ...options,
      params: { ...options.params, page: pageNumber, size: 100 },
    });
    if (!data || typeof data !== "object" || !Array.isArray((data as { content?: unknown }).content)) {
      throw new Error(`Formato de página inesperado ao carregar ${endpoint}.`);
    }
    result.push(...((data as { content: T[] }).content));
  }
  return result;
}
