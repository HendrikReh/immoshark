import type {
  Immobilie,
  ImmobilienFilter,
  ImmobilieCreateDTO,
  ImmobilieUpdateDTO,
  PaginatedResponse,
  ApiResponse,
  DashboardStats,
  CsvUploadResult,
  CsvColumnMapping,
  CsvImportResult,
  CsvMappingSuggestion,
} from "@immoshark/shared";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Fehler: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Immobilien
  list(filter: ImmobilienFilter = {}): Promise<PaginatedResponse<Immobilie>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value != null && value !== "") params.set(key, String(value));
    }
    return request(`/immobilien?${params}`);
  },

  get(id: number): Promise<ApiResponse<Immobilie>> {
    return request(`/immobilien/${id}`);
  },

  create(data: ImmobilieCreateDTO): Promise<ApiResponse<Immobilie>> {
    return request("/immobilien", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: ImmobilieUpdateDTO): Promise<ApiResponse<Immobilie>> {
    return request(`/immobilien/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return request(`/immobilien/${id}`, { method: "DELETE" });
  },

  // Stats
  stats(): Promise<ApiResponse<DashboardStats>> {
    return request("/stats");
  },

  // CSV
  uploadCsv(file: File): Promise<ApiResponse<CsvUploadResult & { session_id: string }>> {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE}/csv/upload`, { method: "POST", body: form }).then(
      async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || `Upload fehlgeschlagen: ${res.status}`);
        }
        return res.json();
      }
    );
  },

  importCsv(
    sessionId: string,
    mapping: CsvColumnMapping
  ): Promise<ApiResponse<CsvImportResult>> {
    return request("/csv/import", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, mapping }),
    });
  },

  suggestMapping(sessionId: string): Promise<ApiResponse<CsvMappingSuggestion>> {
    return request("/csv/suggest-mapping", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });
  },
};
