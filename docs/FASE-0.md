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

# Fase 1 — etapa 1: agente local e chat de ideias

- Tabelas novas: `agentes` (token só como hash), `conversas`, `mensagens`; `tarefas` ganhou `usuario_id`.
- API do agente (`/api/agente/pegar` e `/concluir`, autenticada por token Bearer).
- `apps/agente`: roda `claude -p --model haiku --tools ""` na máquina da pessoa (sem ferramentas, só texto).
- Páginas: **Agente local** (gera token, mostra online/offline) e **Ideias** (chat por perfil + botão "Gerar ideias pelo nicho").
- Testado de ponta a ponta com um comando falso no lugar do Claude (o `claude` não está instalado no PATH desta máquina).

Uso: em `/agentes` gere o token e rode `npm run agente -- --servidor http://localhost:3000 --token <token>`.

## Fase 1 — etapa 2: roteiros e pesquisa de fatos

- Quadro de **Roteiros** por etapa (ideia → rascunho → aprovado → gravado → publicado) e séries.
- Editor com campos de **pesquisa de fatos** e **roteiro**, mais lista de **fontes** com ressalvas.
- Botões de IA: **Pesquisar fatos** (Sonnet + WebSearch/WebFetch, só leitura da web) e **Escrever rascunho** (Sonnet, sem ferramentas). O agente só aceita essas duas ferramentas.
- Testado com o Claude real: a pesquisa trouxe fontes e avisou o que não conseguiu confirmar; o rascunho usou só os fatos da pesquisa.
- Correções: ações de formulário não podem capturar o objeto do banco; no Windows o `--tools ""` precisa de aspas literais.
