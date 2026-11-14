// Cliente mínimo da ElevenLabs. A chave fica só no servidor (ELEVENLABS_API_KEY) e nunca é exibida.
const API = "https://api.elevenlabs.io";

function chave() {
  const k = process.env.ELEVENLABS_API_KEY?.trim();
  if (!k) throw new Error("Defina ELEVENLABS_API_KEY em apps/web/.env.local");
  return k;
}

async function chamar(caminho: string, init: RequestInit = {}) {
  const r = await fetch(API + caminho, { ...init, headers: { "xi-api-key": chave(), ...(init.headers ?? {}) } });
  if (!r.ok) {
    let detalhe = "";
    try { detalhe = JSON.stringify((await r.json()).detail ?? ""); } catch {}
    throw new Error(`ElevenLabs ${r.status} em ${caminho.split("?")[0]} ${detalhe}`.trim());
  }
  return r;
}

export type VozRemota = { voice_id: string; name: string; category?: string; description?: string | null; preview_url?: string | null };

export async function listarVozes(): Promise<VozRemota[]> {
  const r = await chamar("/v1/voices");
  return ((await r.json()) as { voices: VozRemota[] }).voices ?? [];
}

/** Gera uma frase de teste. eleven_v3 só aceita estabilidade 0, 0.5 ou 1. */
export async function gerarAmostra(vozId: string, texto: string, estabilidade = 0.5): Promise<Buffer> {
  const r = await chamar(`/v1/text-to-speech/${encodeURIComponent(vozId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: "eleven_v3", voice_settings: { stability: estabilidade } }),
  });
  return Buffer.from(await r.arrayBuffer());
}

/** Clona uma voz a partir de amostras de áudio (precisa de um plano que permita clonagem instantânea). */
export async function clonarVoz(nome: string, descricao: string, arquivos: File[]): Promise<string> {
  const fd = new FormData();
  fd.set("name", nome);
  if (descricao) fd.set("description", descricao);
  fd.set("remove_background_noise", "true");
  for (const a of arquivos) fd.append("files", a, a.name);
  const r = await chamar("/v1/voices/add", { method: "POST", body: fd });
  return ((await r.json()) as { voice_id: string }).voice_id;
}
