# Estúdio Criativo — Planejamento

> Nome provisório. Status: **planejamento** (nenhum código ainda).

Plataforma web para a equipe criar roteiros e vídeos curtos animados (gerados por código com Remotion), publicar e agendar posts em Instagram, TikTok, Facebook e YouTube, e acompanhar as métricas de todos os vídeos em um só lugar.

---

## 1. Decisões já tomadas

| Tema | Decisão |
| --- | --- |
| Usuários | Você e a equipe. Permissões e aprovação ficam para uma fase futura. |
| Onde roda | Local (seu PC) no desenvolvimento → VPS própria depois. |
| Contas | Várias contas por rede; meta inicial de 3 por rede. |
| IA | Claude Code da própria pessoa, via **agente local** (cada membro usa os próprios créditos). Haiku no chat e Sonnet na geração de roteiro/cenas. Motor trocável para chave de API no futuro. |
| Voz | ElevenLabs agora (escolher e criar vozes pelo sistema). Motor de voz trocável para uma opção open source (F5-TTS, XTTS-v2, Piper ou OpenVoice) quando o plano acabar, após teste comparativo. |
| Estilos de desenho | Sempre gerados por código. Novos estilos criados a partir de perfis de referência que você vai enviar (fase 2). |
| Formato | Vertical 1080x1920 primeiro. Horizontal 1920x1080 planejado (fase 6). |
| Edição | Opção A: editor simples (textos, tempo das cenas, cortes, voz, trilha) + pedir ajustes pelo chat + ver e editar o código da cena antes de renderizar. Opção B (linha do tempo) como expansão. |
| Postagem | Só APIs oficiais e gratuitas. **Sem Playwright/automação de navegador.** |
| Métricas | Views, curtidas, comentários, compartilhamentos, salvamentos, seguidores ganhos, alcance, retenção e tempo médio de visualização. Atualização a cada hora, com histórico. Importar vídeos antigos. |
| Agendamento | Mesmo vídeo e mesma legenda em todas as redes de uma vez, ou separado; caixinhas liga/desliga por rede. Sugestão de melhor horário pelos seus dados. |
| Notificações | No próprio site agora; WhatsApp/Telegram depois. |
| Renderização | No seu PC agora; na VPS depois. |
| Banco | SQLite local, com migrações versionadas prontas para migrar (ex.: PostgreSQL). |
| Interface | Português, tema escuro. |
| Conteúdo atual | Migrar vídeos e roteiros já feitos (Milgram, Terman, Tempo, Marshall, Maníaco, Daniel, Ponte, Fallon). |
| Código | Repositório público no GitHub. |

---

## 2. Arquitetura

```
┌──────────────────────── Navegador (equipe) ────────────────────────┐
│  Next.js (React, tema escuro, pt-BR)                               │
└───────────────┬────────────────────────────────────────────────────┘
                │ HTTP + WebSocket
┌───────────────▼──────────────── Servidor (PC agora / VPS depois) ──┐
│  Next.js (páginas + API)                                           │
│  Banco: SQLite via Drizzle ORM (migrações → PostgreSQL)            │
│  Fila de tarefas (tabela no banco): render, postar, coletar métricas│
│  Worker de render: Remotion                                        │
│  Worker de redes: publicar / agendar / coletar métricas (a cada 1h)│
│  Armazenamento de arquivos: pasta local (S3/compatível no futuro)  │
└───────────────▲────────────────────────────────────────────────────┘
                │ WebSocket (o agente se conecta ao servidor)
┌───────────────┴──────── Agente local (PC de cada membro) ──────────┐
│  Programa Node pequeno, roda `claude -p` com o login da pessoa     │
│  Executa: chat, ideias, roteiros, pesquisa de fatos, código de cena│
└────────────────────────────────────────────────────────────────────┘
```

### Por que essa forma
- **Agente local:** permite que cada membro use a própria assinatura do Claude sem guardar credenciais no servidor. Quando o agente da pessoa estiver desligado, as funções de IA ficam indisponíveis para ela; o resto do site continua funcionando.
- **Motores trocáveis:** interfaces `MotorIA` (agente local ↔ chave de API) e `MotorVoz` (ElevenLabs ↔ open source) para trocar sem reescrever o sistema.
- **Fila no banco:** dispensa o Redis na fase local; pode virar BullMQ/Redis na VPS se precisar.

### Tecnologias
- **Next.js + TypeScript** (front e API no mesmo projeto).
- **Drizzle ORM** + `better-sqlite3`; migrações em `drizzle/` (SQL versionado), compatíveis com PostgreSQL.
- **Remotion 4** (reaproveita o motor `toon.ts`, os componentes do `Milgram.tsx` e os efeitos sintetizados).
- **Python** para scripts de áudio (efeitos e corte de pausas) que já existem.
- **Auth.js** (login da equipe por e-mail e senha) — fase 1 com um usuário só, multiusuário já previsto no banco.
- **Monaco Editor** para ver e editar o código da cena.
- **Recharts** para os gráficos de métricas.

### Estrutura de pastas (monorepo)
```
estudio-criativo/
  apps/web/          # Next.js (site + API + workers)
  apps/agente/       # agente local (CLI Node)
  packages/video/    # Remotion: estilos, componentes, composições
  packages/db/       # schema Drizzle + migrações
  packages/redes/    # clientes das APIs (Meta, YouTube, TikTok)
  scripts/audio/     # efeitos, corte de pausas (Python)
  docs/
```

---

## 3. Telas

1. **Painel** — total de views de todas as redes, gráfico de crescimento, top vídeos, próximos posts agendados, avisos.
2. **Perfis** — cada perfil/marca (ex.: "Mentes diferentes", cliente Daniel) com nicho, tom de voz, voz padrão, estilo padrão e contas conectadas de cada rede.
3. **Ideias** — chat livre (como aqui) com contexto do perfil + botão "Gerar ideias pelo nicho"; cada ideia pode receber observações e votos da equipe e virar roteiro com um clique.
4. **Roteiros** — quadro por etapa (Ideia → Rascunho → Aprovado → Gravado → Publicado), por série; editor de texto; aba **Pesquisa de fatos** com fontes, ressalvas e "o que evitar" (como no Maníaco).
5. **Estúdio de vídeo** — escolhe roteiro, voz e estilo → gera voz → gera cenas → pré-visualização no navegador (Remotion Player) → ajustes:
   - editor simples: texto das etiquetas, tempo de cada cena, cortar pausas, volume de voz/efeitos/trilha;
   - chat de ajustes ("aumenta o texto da cena 4");
   - aba **Código** com o código da cena para ver/editar antes de renderizar;
   - botão **Renderizar** e histórico de versões (v1, v2, v3…).
6. **Vozes** — lista de vozes da ElevenLabs com amostra, criar voz nova (clonagem/design de voz, conforme o plano), padrão por perfil, ajuste de velocidade e estabilidade.
7. **Estilos** — galeria dos estilos disponíveis com prévia (fase 2).
8. **Agendamento** — calendário; post com vídeo, legenda, caixinhas por rede (liga/desliga), legenda igual ou separada por rede, data e hora, sugestão de melhor horário.
9. **Métricas** — tabela de todos os vídeos com as métricas somadas e por rede, "onde performou melhor", gráfico histórico por vídeo, comparação entre vídeos, melhores horários e dias.
10. **Notificações** — central no site (postado, falhou, render pronto, vídeo acima da média).
11. **Configurações** — contas conectadas, status do agente local, motor de IA, motor de voz, equipe.

---

## 4. Banco de dados (principais tabelas)

- `usuarios`, `equipes`, `membros` (papel já previsto para permissões futuras)
- `perfis` (nicho, tom, voz e estilo padrão)
- `contas_sociais` (rede, perfil, tokens criptografados, expiração)
- `series`, `ideias`, `comentarios_ideia`
- `roteiros` (etapa, texto, série), `fontes` (url, nota, ressalva)
- `vozes` (provedor, id externo, configurações)
- `estilos`
- `videos` (roteiro, estilo, formato vertical/horizontal), `versoes_video` (código das cenas, arquivos de voz/efeitos, render, duração)
- `posts` (vídeo, legenda base, data agendada, status), `posts_rede` (rede, conta, legenda própria, liga/desliga, id externo, status, erro)
- `metricas_snapshot` (post_rede, data/hora, views, curtidas, comentários, compartilhamentos, salvamentos, alcance, retenção, tempo médio) → é o histórico
- `tarefas` (fila: tipo, payload, status, tentativas, agendada_para)
- `notificacoes`
- `aprovacoes` (fase futura)

Tokens das redes ficam **criptografados** no banco; a chave fica em variável de ambiente, nunca no repositório.

---

## 5. Integrações com as redes

| Rede | Publicar no 1º dia | Depois da aprovação | Métricas |
| --- | --- | --- | --- |
| Instagram | Automático (app Meta em modo desenvolvimento, equipe como testadora, contas profissionais ligadas a uma Página) | Contas de terceiros, após revisão de app + verificação da empresa | Insights API |
| Facebook | Automático (mesmo app Meta) | Idem | Insights API |
| TikTok | Envio como **rascunho** para a caixa de notificações do app; você toca em publicar | Postagem direta pública após auditoria (vídeo demo + descrição de uso) | Display API |
| YouTube | Sobe como **privado**; o sistema avisa para publicar no Studio | Público direto após verificação do app no Google Cloud; pedir mais cota se precisar (≈6 envios/dia na cota grátis) | YouTube Analytics API (retenção e tempo médio) |

- **Vídeos antigos:** importar a lista de mídias de cada conta conectada e começar o histórico a partir da importação (a maioria das APIs não fornece histórico passado dia a dia, só o total atual).
- **Melhor horário:** média de desempenho nas primeiras 24 h por dia da semana e hora, por perfil e por rede; exige volume mínimo de posts antes de sugerir.

---

## 6. Fases

**Fase 0 — Base (fundação)**
Monorepo, Next.js tema escuro pt-BR, SQLite + Drizzle + migrações, login, fila de tarefas, estrutura de perfis. Mover o projeto Remotion atual para `packages/video`.

**Fase 1 — Roteiros e criação de vídeos**
Agente local + chat de ideias + gerar ideias por nicho; roteiros com etapas e pesquisa de fatos; vozes (ElevenLabs, escolher e criar); estúdio de vídeo com pré-visualização, editor simples, chat de ajustes, aba de código, render local e versões. Migração dos vídeos e roteiros existentes.

**Fase 2 — Novos estilos de desenho**
Você envia os perfis de referência → análise → cada estilo vira um pacote de componentes por código (personagem, cenário, tipografia, transições) selecionável no estúdio.

**Fase 3 — Métricas**
Conectar contas (OAuth), importar vídeos antigos, coleta a cada hora, histórico, painel, "onde performou melhor", gráficos.

**Fase 4 — Agendamento**
Calendário, caixinhas por rede, legenda igual/separada, publicação pela fila, rascunho no TikTok e privado no YouTube até as aprovações, melhor horário, notificações no site. Iniciar os pedidos de aprovação das redes já no começo desta fase (ou antes), porque podem levar semanas.

**Fase 5 — Equipe e servidor**
Subir para a VPS, render no servidor, permissões por papel, fluxo de aprovação de posts, notificações por WhatsApp/Telegram, backup do banco.

**Fase 6 — Expansões**
Formato horizontal; editor de linha do tempo (opção B); legenda palavra por palavra opcional; motor de voz open source; motor de IA por chave de API; armazenamento em S3.

---

## 7. Custos e riscos

- **Claude:** sem custo extra enquanto cada membro usa a própria assinatura pelo agente local; consome o limite de uso de cada um. Chave de API (opcional, futuro) é cobrada por uso — estimar antes de ativar.
- **ElevenLabs:** consome créditos do plano atual; criar vozes depende do plano.
- **APIs das redes:** gratuitas. Risco: prazos de aprovação e mudanças de regras das plataformas.
- **Voz open source:** qualidade em pt-BR a validar; precisa de GPU para velocidade aceitável.
- **VPS:** renderizar exige CPU e memória; dimensionar na fase 5.
- **Repositório público:** nenhuma chave, token ou `.env` no código; `.gitignore` e exemplo `.env.example` desde o primeiro commit.

---

## 8. Pendências para decidir depois
- Nome da plataforma.
- Perfis de referência para os novos estilos (fase 2).
- Papéis de permissão e regras de aprovação (fase 5).
- Canal de notificação externo: WhatsApp ou Telegram (fase 5).
