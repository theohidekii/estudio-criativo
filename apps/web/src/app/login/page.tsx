import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { usuarios } from "@estudio/db";
import { db } from "@/lib/db";
import { criarSessao } from "@/lib/sessao";

async function entrar(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const d = db();
  let u = d.select().from(usuarios).where(eq(usuarios.email, email)).get();
  // Primeiro acesso: se não existe nenhum usuário, o primeiro login cria o admin.
  if (!u && d.select().from(usuarios).limit(1).all().length === 0 && email && senha.length >= 8) {
    u = d.insert(usuarios).values({ nome: email.split("@")[0], email, senhaHash: await bcrypt.hash(senha, 12), papel: "admin" }).returning().get();
  }
  if (!u || !(await bcrypt.compare(senha, u.senhaHash))) redirect("/login?erro=1");
  await criarSessao(u.id);
  redirect("/");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="entrada">
      <div className="arte">
        <div className="marca" style={{ padding: 0 }}>Estúdio<small>sala de edição</small></div>
        <div>
          <h1>Do roteiro ao vídeo no ar.</h1>
          <p style={{ marginTop: 20 }}>Ideias, narração, cenas animadas e métricas em um só lugar.</p>
        </div>
        <span className="mono mudo">Vertical 1080 × 1920 · 30 fps</span>
      </div>
      <form action={entrar}>
        <h2>Entrar</h2>
        <p className="mudo" style={{ marginBottom: 24 }}>No primeiro acesso, estes dados criam a conta de administrador.</p>
        {erro && <p className="aviso erro" role="alert">E-mail ou senha incorretos. Confira os dados e tente de novo.</p>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required autoFocus /></label>
        <label>Senha<input name="senha" type="password" autoComplete="current-password" required minLength={8} placeholder="Mínimo de 8 caracteres" /></label>
        <button style={{ width: "100%", padding: "10px 14px" }}>Entrar</button>
      </form>
    </div>
  );
}
