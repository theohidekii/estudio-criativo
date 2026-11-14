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
    <form action={entrar} className="card" style={{ maxWidth: 360, margin: "80px auto" }}>
      <h2>Entrar</h2>
      {erro && <p style={{ color: "#f87171" }}>E-mail ou senha incorretos.</p>}
      <label>E-mail<input name="email" type="email" required /></label>
      <label>Senha (mín. 8 caracteres)<input name="senha" type="password" required minLength={8} /></label>
      <button>Entrar</button>
      <p className="mudo">No primeiro acesso, esses dados criam a conta de administrador.</p>
    </form>
  );
}
