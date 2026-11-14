/** Gráfico de linha em SVG, desenhado no servidor (sem JavaScript no navegador). */
export function Grafico({ pontos, rotulo }: { pontos: { x: string; y: number }[]; rotulo: string }) {
  const W = 720, H = 220, mx = 8, topo = 14, base = 28;
  const max = Math.max(1, ...pontos.map((p) => p.y));
  const n = pontos.length;
  const px = (i: number) => mx + (n <= 1 ? 0 : (i * (W - 2 * mx)) / (n - 1));
  const py = (v: number) => topo + (1 - v / max) * (H - topo - base);
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(p.y).toFixed(1)}`).join(" ");
  const area = n > 1 ? `${linha} L${px(n - 1).toFixed(1)} ${H - base} L${px(0).toFixed(1)} ${H - base} Z` : "";
  const ult = pontos[n - 1];
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotulo} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 0.5, 1].map((t) => <line key={t} x1={mx} x2={W - mx} y1={py(max * t)} y2={py(max * t)} stroke="var(--linha)" strokeWidth="1" />)}
        {area && <path d={area} fill="var(--acento)" opacity="0.1" />}
        <path d={linha} fill="none" stroke="var(--acento)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {ult && <circle cx={px(n - 1)} cy={py(ult.y)} r="4.5" fill="var(--acento)" />}
        <text x={mx} y={H - 8} fill="var(--mudo)" fontSize="12" fontFamily="var(--mono)">{pontos[0]?.x}</text>
        <text x={W - mx} y={H - 8} fill="var(--mudo)" fontSize="12" fontFamily="var(--mono)" textAnchor="end">{ult?.x}</text>
        <text x={W - mx} y={topo - 2} fill="var(--mudo)" fontSize="12" fontFamily="var(--mono)" textAnchor="end">{max.toLocaleString("pt-BR")}</text>
      </svg>
    </figure>
  );
}
