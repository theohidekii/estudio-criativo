import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const chave = () => {
  const k = process.env.TOKEN_ENC_KEY;
  if (!k || k.length < 32) throw new Error("Defina TOKEN_ENC_KEY (32 ou mais caracteres) no .env.local para guardar tokens das redes");
  return createHash("sha256").update(k).digest();
};

/** AES-256-GCM: devolve base64(iv | tag | texto cifrado). Os tokens das redes só ficam no banco assim. */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}

export function decifrar(b64: string): string {
  const b = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", chave(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}
