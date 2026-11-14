import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Rede } from "@estudio/redes";
import { contasSociais, perfis } from "@estudio/db";
import { db } from "@/lib/db";
import { NOMES_REDE, REDES, coletarConta, coletarTodas, configApp, contaManual, podeConectar, redirectDe, temColetaAutomatica } from "@/lib/redes";
import { PageHead } from "../PageHead";

export const dynamic = "force-dynamic";

async function coletar(form: FormData) {
  "use server";
  const r = await coletarConta(Number(form.get("id")));
  redirect(`/contas?${r.ok ? "ok" : "erro"}=${encodeURIComponent(r.ok ? `${r.total} publicações lidas, ${r.novas} novas.` : (r.erro ?? "falhou"))}`);
}
async function coletarAgora() {
  "use server";
  const r = await coletarTodas();
  const ok = r.filter((x) => x.ok).length;
  redirect(`/contas?ok=${encodeURIComponent(`${ok} de ${r.length} contas atualizadas.`)}`);
}
async function criarManual(form: FormData) {
  "use server";
  const rede = String(form.get("rede")) as Rede;
  const perfilId = Number(form.get("perfilId"));
  if (!REDES.includes(rede) || !perfilId) return;
  const nome = String(form.get("nome") ?? "").trim();
  contaManual(perfilId, rede, nome || undefined);
  revalidatePath("/contas");
}
async function remover(form: FormData) {
  "use server";
  db().delete(contasSociais).where(eq(contasSociais.id, Number(form.get("id")))).run();
  revalidatePath("/contas");
}

export default async function Contas({ searchParams }: { searchParams: Promise<{ perfil?: string; ok?: string; erro?: string }> }) {
  const sp = await searchParams;
  const d = db();
  const ps = d.select().from(perfis).all();
  const perfilId = Number(sp.perfil) || ps[0]?.id;
  const contas = perfilId ? d.select().from(contasSociais).where(eq(contasSociais.perfilId, perfilId)).all() : [];
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const chaveOk = Boolean(process.env.TOKEN_ENC_KEY && process.env.TOKEN_ENC_KEY.length >= 32);
  return (
    <>
      <PageHead titulo="Contas" descricao="Conecte as redes de cada perfil para trazer as publicações e as métricas. Os acessos ficam cifrados no banco.">
        <form action={coletarAgora}><button className="sec">Atualizar tudo agora</button></form>
      </PageHead>
      {sp.ok && <div className="aviso ok" role="status">{sp.ok}</div>}
      {sp.erro && <div className="aviso erro" role="alert">{sp.erro}</div>}
      {ps.length === 0 ? (
        <div className="vazio"><strong>Crie um perfil primeiro</strong>As contas das redes pertencem a um perfil. Vá em Perfis.</div>
      ) : (
        <>
          <form method="get" className="linha" style={{ marginBottom: 24 }}>
            <label style={{ margin: 0 }}>Perfil
              <select name="perfil" defaultValue={perfilId} style={{ marginBottom: 0, minWidth: 220 }}>{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
            </label>
            <button className="sec" style={{ alignSelf: "flex-end" }}>Trocar</button>
          </form>

          <h2 style={{ marginTop: 0 }}>Conectar</h2>
          <div className="linha" style={{ marginBottom: 8 }}>
            {(["instagram", "tiktok", "youtube"] as const).map((r) => podeConectar(r)
              ? <a key={r} href={`/api/redes/${r}/conectar?perfil=${perfilId}`} className="btn">{NOMES_REDE[r]}</a>
              : <button key={r} className="sec" disabled title="Faltam as credenciais do app no .env.local">{NOMES_REDE[r]}</button>)}
          </div>
          <p className="mudo pequeno" style={{ maxWidth: "70ch" }}>
            O Facebook conecta junto com o Instagram (mesmo app da Meta). Botões desligados faltam credenciais no <code>.env.local</code>{!chaveOk && <>, e a <code>TOKEN_ENC_KEY</code> também não está definida</>}. Veja o passo a passo abaixo.
          </p>

          <h2>Contas deste perfil</h2>
          {contas.length === 0 ? (
            <div className="vazio"><strong>Nenhuma conta ainda</strong>Conecte uma rede acima ou cadastre uma conta manual para lançar métricas à mão.</div>
          ) : (
            <div className="lista">
              {contas.map((c) => (
                <div key={c.id}>
                  <div className="grow">
                    <span className="titulo">{c.nomeExibicao}</span> <span className="etiqueta">{NOMES_REDE[c.rede as Rede]}</span>
                    <div className="mudo pequeno">
                      {c.tokenCriptografado ? (temColetaAutomatica(c.rede as Rede) ? "Conectada" : "Conectada, sem coleta automática (use a entrada manual)") : "Manual (sem conexão)"}
                      {c.ultimaColeta && <> · última coleta {c.ultimaColeta.toLocaleString("pt-BR")}</>}
                      {c.expiraEm && c.tokenCriptografado && <> · acesso vale até {c.expiraEm.toLocaleDateString("pt-BR")}</>}
                    </div>
                    {c.erro && <div className="pequeno" style={{ color: "var(--erro)" }}>{c.erro}</div>}
                  </div>
                  {c.tokenCriptografado && temColetaAutomatica(c.rede as Rede) && <form action={coletar}><input type="hidden" name="id" value={c.id} /><button className="sec peq">Coletar agora</button></form>}
                  <form action={remover}><input type="hidden" name="id" value={c.id} /><button className="perigo peq" title="Apaga também as publicações e o histórico desta conta">Remover</button></form>
                </div>
              ))}
            </div>
          )}

          <details className="card" style={{ marginTop: 28 }}>
            <summary>Cadastrar conta manual</summary>
            <form action={criarManual}>
              <input type="hidden" name="perfilId" value={perfilId} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
                <label>Rede<select name="rede">{REDES.map((r) => <option key={r} value={r}>{NOMES_REDE[r]}</option>)}</select></label>
                <label>Nome da conta<input name="nome" placeholder="@mentesdiferentes" /></label>
              </div>
              <button className="sec">Cadastrar</button>
            </form>
          </details>

          <details className="card">
            <summary>Passo a passo para conectar cada rede</summary>
            <div className="mudo" style={{ display: "grid", gap: 14, maxWidth: "72ch" }}>
              <p style={{ margin: 0 }}>Defina também <code>APP_URL</code> (hoje <code>{base}</code>) e <code>TOKEN_ENC_KEY</code> (texto aleatório de 32+ caracteres) no <code>apps/web/.env.local</code> e reinicie o site.</p>
              <div><strong style={{ color: "var(--txt)" }}>YouTube</strong> — no Google Cloud, crie um projeto, ative a <em>YouTube Data API v3</em> e a <em>YouTube Analytics API</em>, crie uma credencial OAuth do tipo aplicativo da Web e coloque este endereço de redirecionamento: <code>{redirectDe("youtube")}</code>. Variáveis: <code>YOUTUBE_CLIENT_ID</code> e <code>YOUTUBE_CLIENT_SECRET</code>. {configApp("youtube") ? "✓ Credenciais encontradas." : "Credenciais ainda não definidas."} Enquanto o app não for verificado pelo Google, só contas de teste cadastradas no projeto conseguem conectar.</div>
              <div><strong style={{ color: "var(--txt)" }}>Instagram e Facebook</strong> — em developers.facebook.com, crie um app do tipo Empresa e adicione o <em>Facebook Login</em>, com este redirecionamento: <code>{redirectDe("instagram")}</code>. A conta do Instagram precisa ser profissional (Criador ou Empresa) e estar ligada a uma Página do Facebook. Em modo de desenvolvimento, cadastre as pessoas da equipe como testadoras. Variáveis: <code>META_APP_ID</code> e <code>META_APP_SECRET</code>. {configApp("instagram") ? "✓ Credenciais encontradas." : "Credenciais ainda não definidas."}</div>
              <div><strong style={{ color: "var(--txt)" }}>TikTok</strong> — em developers.tiktok.com, crie um app, adicione o <em>Login Kit</em> e a <em>Display API</em> (escopos <code>user.info.basic</code> e <code>video.list</code>) e o redirecionamento <code>{redirectDe("tiktok")}</code>. Variáveis: <code>TIKTOK_CLIENT_KEY</code> e <code>TIKTOK_CLIENT_SECRET</code>. {configApp("tiktok") ? "✓ Credenciais encontradas." : "Credenciais ainda não definidas."} O TikTok não informa tempo médio de visualização por esta API e pode exigir um endereço HTTPS (use o domínio da VPS ou um túnel, se recusar o localhost).</div>
            </div>
          </details>
        </>
      )}
    </>
  );
}
