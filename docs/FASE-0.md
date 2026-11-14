# Fase 0 — concluída

- Monorepo npm workspaces: `apps/web`, `packages/db`, `packages/video`.
- Banco: SQLite + Drizzle, migração em `packages/db/drizzle/` (SQL versionado, troca para PostgreSQL = mudar dialect/driver).
- Fila de tarefas no banco (`packages/db/src/fila.ts`) com retentativas, testada (`npm test`).
- Site Next.js em pt-BR, tema escuro, login com sessão (JWT em cookie httpOnly), página de Perfis.
- Remotion movido para `packages/video` (código); áudio/saídas ficam fora do git.

## Rodar
1. `npm install`
2. Copie `.env.example` para `apps/web/.env.local` e troque `SESSION_SECRET`.
3. `npm run dev` → http://localhost:3000 (o primeiro login cria o administrador).
4. Studio do Remotion: `npm run video:studio`.
