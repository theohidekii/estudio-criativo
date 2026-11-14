// Coleta automática de métricas a cada hora, dentro do próprio servidor (só Node). Ligue com COLETA_AUTOMATICA=1.
import { processarPendentes } from "./lib/agendador";
import { coletarTodas } from "./lib/redes";

const g = globalThis as { __coletaHoraria?: NodeJS.Timeout };
if (process.env.COLETA_AUTOMATICA === "1" && !g.__coletaHoraria) { // evita um segundo relógio quando o servidor recarrega
  const rodar = () => { coletarTodas().catch((e) => console.error("Coleta de métricas falhou:", (e as Error).message)); };
  g.__coletaHoraria = setInterval(rodar, 60 * 60 * 1000);
  setTimeout(rodar, 60_000); // primeira coleta 1 minuto depois de subir
}

// Agendador: a cada minuto publica o que já passou da hora. Ligue com AGENDADOR_AUTOMATICO=1 (só em UMA instância do site, senão publicaria em dobro).
const h = globalThis as { __agendador?: NodeJS.Timeout };
if (process.env.AGENDADOR_AUTOMATICO === "1" && !h.__agendador) {
  h.__agendador = setInterval(() => { processarPendentes().catch((e) => console.error("Agendador falhou:", (e as Error).message)); }, 60_000);
}
