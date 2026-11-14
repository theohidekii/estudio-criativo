type FetchFn = typeof fetch;
const g = globalThis as { __redesFetch?: FetchFn };

/** Troca o fetch (usado nos testes com respostas simuladas). Fica em globalThis para valer mesmo se o pacote for carregado duas vezes. */
export const usarFetch = (f: FetchFn) => { g.__redesFetch = f; };
const impl = (...a: Parameters<FetchFn>) => (g.__redesFetch ?? fetch)(...a);

/** GET/POST que devolve JSON. Em erro, a mensagem traz o status e o motivo da rede, nunca a URL (que pode conter tokens). */
export async function json<T>(url: string, init: RequestInit | undefined, rotulo: string): Promise<T> {
  const r = await impl(url, init);
  const texto = await r.text();
  let j: any;
  try { j = JSON.parse(texto); } catch { j = undefined; }
  if (!r.ok) {
    const motivo = j?.error?.message ?? j?.error_description ?? j?.error?.code ?? (typeof j?.error === "string" ? j.error : "");
    throw new Error(`${rotulo}: HTTP ${r.status} ${motivo ?? ""}`.trim());
  }
  return j as T;
}
export const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
export const POST_FORM = (o: Record<string, string>): RequestInit => ({ method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form(o) });
