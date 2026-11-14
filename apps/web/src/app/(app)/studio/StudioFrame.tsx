"use client";
import { useEffect, useState } from "react";

/** Liga o Remotion Studio sob demanda e o mostra dentro do sistema. */
export default function StudioFrame({ composicao }: { composicao?: string }) {
  const [estado, setEstado] = useState<"ligando" | "pronto" | "erro">("ligando");
  const [url, setUrl] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        await fetch("/api/studio", { method: "POST" });
        for (let i = 0; i < 60 && vivo; i++) {
          const j = (await (await fetch("/api/studio")).json()) as { ativo: boolean; url: string };
          if (j.ativo) { setUrl(j.url); setEstado("pronto"); return; }
          await new Promise((r) => setTimeout(r, 1500));
        }
        if (vivo) setEstado("erro");
      } catch { if (vivo) setEstado("erro"); }
    })();
    return () => { vivo = false; };
  }, []);

  if (estado === "ligando") return <div className="vazio"><strong>Ligando o editor</strong>O Remotion Studio abre em alguns segundos na primeira vez.</div>;
  if (estado === "erro") return <div className="aviso erro">Não consegui ligar o Remotion Studio. Rode <code>npm run video:studio</code> no terminal e recarregue esta página.</div>;
  return (
    <iframe
      title="Remotion Studio"
      src={composicao ? `${url}/${composicao}` : url}
      style={{ width: "100%", height: "calc(100vh - 190px)", minHeight: 520, border: "1px solid var(--linha)", background: "#000" }}
    />
  );
}
