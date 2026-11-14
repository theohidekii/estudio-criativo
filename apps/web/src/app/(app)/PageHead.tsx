import type { ReactNode } from "react";

/** Cabeçalho padrão: linha de contexto (como a claquete), título em serifa, uma linha de apoio e a ação principal. */
export function PageHead({ titulo, descricao, slate, children }: { titulo: ReactNode; descricao?: ReactNode; slate?: ReactNode; children?: ReactNode }) {
  return (
    <header className="topo">
      <div>
        {slate && <span className="slate">{slate}</span>}
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children && <div className="linha">{children}</div>}
    </header>
  );
}
