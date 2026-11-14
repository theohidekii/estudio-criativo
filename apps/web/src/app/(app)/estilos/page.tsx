import { ESTILOS_INFO } from "@/lib/estilos";
import { PageHead } from "../PageHead";
import Previa from "./Previa";

export const dynamic = "force-dynamic";

export default function Estilos() {
  return (
    <>
      <PageHead titulo="Estilos" descricao="Cada estilo define cenários, personagens, texto e ritmo. Escolha o estilo ao criar um vídeo." />
      <div style={{ display: "grid", gap: 40 }}>
        {ESTILOS_INFO.map((e) => (
          <section key={e.id} className="editor" style={{ gridTemplateColumns: "240px minmax(0, 1fr)" }}>
            <Previa estilo={e.id} />
            <div>
              <h2 style={{ marginTop: 0 }}>{e.nome}</h2>
              <p className="mudo" style={{ maxWidth: "56ch" }}>{e.descricao}</p>
              <p className="pequeno mudo">Ritmo: {e.ritmo}</p>
              <div className="linha" style={{ marginTop: 14 }}>
                {e.cores.map((c) => <span key={c} title={c} style={{ width: 28, height: 28, background: c, border: "1px solid var(--linha-forte)" }} />)}
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
