export type Rede = "instagram" | "tiktok" | "facebook" | "youtube";

export type PublicacaoRemota = { idExterno: string; titulo: string; url: string; publicadoEm: Date | null; tipo?: string };
/** Métricas de uma coleta. Campos que a rede não informa ficam null (nunca 0 inventado). */
export type MetricasRemotas = {
  views: number; curtidas: number; comentarios: number; compartilhamentos: number; salvamentos: number;
  alcance: number | null; tempoMedio: number | null; retencao: number | null; seguidoresGanhos: number | null;
};
export type Coletada = { publicacao: PublicacaoRemota; metricas: MetricasRemotas };

export type Credenciais = { accessToken: string; refreshToken?: string; expiraEm?: Date; extra: Record<string, string> };
export type ConfigApp = { clientId: string; clientSecret: string };
export type Tokens = { accessToken: string; refreshToken?: string; expiraEm?: Date; extra: Record<string, string> };

export const vazias = (): MetricasRemotas => ({ views: 0, curtidas: 0, comentarios: 0, compartilhamentos: 0, salvamentos: 0, alcance: null, tempoMedio: null, retencao: null, seguidoresGanhos: null });
