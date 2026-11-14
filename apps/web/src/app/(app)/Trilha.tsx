export const ETAPAS = ["ideia", "rascunho", "aprovado", "gravado", "publicado"] as const;
export type Etapa = (typeof ETAPAS)[number];
export const NOME_ETAPA: Record<Etapa, string> = { ideia: "Ideia", rascunho: "Rascunho", aprovado: "Aprovado", gravado: "Gravado", publicado: "Publicado" };

/** Trilha de produção: cinco segmentos como uma timeline, preenchidos até a etapa atual. */
export function Trilha({ etapa }: { etapa: Etapa }) {
  const n = ETAPAS.indexOf(etapa);
  return (
    <span className="trilha" role="img" aria-label={`Etapa: ${NOME_ETAPA[etapa]}`} title={NOME_ETAPA[etapa]}>
      {ETAPAS.map((e, i) => <i key={e} className={i <= n ? (n === ETAPAS.length - 1 ? "fim" : "on") : ""} />)}
    </span>
  );
}
