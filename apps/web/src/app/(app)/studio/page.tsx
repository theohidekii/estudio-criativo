import Link from "next/link";
import { isNotNull } from "drizzle-orm";
import { videos } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "../PageHead";
import StudioFrame from "./StudioFrame";

export const dynamic = "force-dynamic";

export default async function Studio({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const c = (await searchParams).c;
  const comps = db().select().from(videos).where(isNotNull(videos.composicao)).all();
  const atual = comps.find((v) => v.composicao === c);
  return (
    <>
      <PageHead titulo="Editor Remotion" descricao={atual ? `Editando a composição de “${atual.titulo}”. As alterações no código ficam no projeto.` : "O editor completo do Remotion, com linha do tempo, props e render."}>
        {comps.length > 0 && (
          <form method="get" className="linha">
            <select name="c" defaultValue={c ?? ""} style={{ margin: 0, width: "auto" }} aria-label="Composição">
              <option value="">Todas as composições</option>
              {comps.map((v) => <option key={v.id} value={v.composicao!}>{v.titulo}</option>)}
            </select>
            <button className="sec">Abrir</button>
          </form>
        )}
      </PageHead>
      <StudioFrame key={c ?? "todas"} composicao={c} />
      <p className="mudo pequeno" style={{ marginTop: 10 }}>
        Preferir tela cheia? <Link href="http://localhost:3030" target="_blank" style={{ textDecoration: "underline" }}>Abrir o Studio em outra aba</Link>.
      </p>
    </>
  );
}
