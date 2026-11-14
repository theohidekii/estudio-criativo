// Ponto de entrada do Next para código de inicialização. O que usa banco e disco fica em instrumentation-node.ts (só Node).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
