import type { ReactNode } from "react";

/** Cabeçalho padrão de página: título, uma linha de contexto e a ação principal à direita. */
export function PageHead({ titulo, descricao, children }: { titulo: ReactNode; descricao?: ReactNode; children?: ReactNode }) {
  return (
    <header className="topo">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children && <div className="linha">{children}</div>}
    </header>
  );
}
