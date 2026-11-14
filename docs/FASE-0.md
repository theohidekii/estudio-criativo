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

## Fase 1 — etapa 3: vozes (ElevenLabs)

- Tabela `vozes`; cliente em `apps/web/src/lib/elevenlabs.ts` (chave só no servidor, `ELEVENLABS_API_KEY` em `apps/web/.env.local`).
- Página **Vozes**: importa as vozes da conta (inclui Lucas e a Markel clonada), toca a amostra da ElevenLabs, gera amostra em pt-BR (guardada em `storage/amostras`, gasta créditos só na 1ª vez), ajusta estabilidade (0 / 0.5 / 1, exigência do eleven_v3) e velocidade, e define a voz padrão de cada perfil.
- **Clonar voz** por upload de áudio, com caixa de autorização obrigatória. Não testado (consome vaga de voz e exige plano com clonagem).
- A velocidade é guardada, mas aplicada depois, na etapa de geração do vídeo (como no `--speed` do script atual).

## Fase 1 — etapa 4: estúdio de vídeo

Fluxo: roteiro → **narração** (ElevenLabs com tempos por palavra; velocidade aplicada com ffmpeg) → **cenas** (Claude/Sonnet gera um JSON validado) → **pré-visualização** no navegador (Remotion Player) → **editor simples** (textos, tempos, expressões) ou aba **Código** (JSON) → **pedido de ajuste** à IA → **render MP4** (Remotion CLI) → **versões** v1, v2, v3.

- Composição `Generico` (`packages/video/src/generic`): desenha o vídeo a partir do JSON (cenário, até 3 personagens com o motor toon, textos, zoom). O formato e a validação ficam em `tipos.ts`, usados pelo servidor e pelo navegador.
- Testado de ponta a ponta com a ElevenLabs e o Claude reais: narração de 9,8 s, 7 cenas válidas, render 1080x1920 com áudio.
- Limites atuais: o visual dos vídeos gerados é bem mais simples que os feitos à mão (Maníaco, Daniel); ainda não há efeitos sonoros nem trilha, corte de pausas, nem legenda palavra a palavra. Vídeos antigos continuam como composições próprias do Remotion.
- Correções do teste: `<form>` dentro de `<p>` (hidratação) e caminhos com espaço no `remotion render` no Windows.

## Redesign da interface

- Sistema de design em `apps/web/src/app/globals.css`: grafite frio, um único acento azul (ação principal, item ativo, foco), Geist para texto e Geist Mono só para números e tempos.
- Barra lateral com o fluxo (Criar: Ideias, Roteiros, Vídeos; Biblioteca: Perfis, Vozes), item ativo e indicador de conexão do agente sempre visível. No celular vira uma barra superior com rolagem lateral.
- Rotas das telas internas agrupadas em `(app)`; o login fica fora, sem a barra lateral. Cabeçalho padrão de página em `PageHead`.
- Estúdio de vídeo como sequência de 4 etapas (narração, cenas, pré-visualização, render) com o estado de cada uma.
- Estados vazios com orientação, erros que dizem o que fazer, botões com hierarquia (principal, secundário, perigo), foco visível e respeito a `prefers-reduced-motion`.

## Acervo, Remotion Studio e nova direção visual

- **Acervo importado** (`npm run acervo -- --origem "<pasta do my-video>"`): 10 roteiros (Markdown) e 8 vídeos com 11 versões renderizadas, ligados às composições do Remotion (coluna `videos.composicao`). Idempotente. Os MP4 vão para `storage/acervo/` e as mídias para `packages/video/public/` (ambos fora do git).
- **Editor Remotion dentro do sistema** (`/studio`): o site liga o Remotion Studio sob demanda (porta 3030) e o mostra num iframe, abrindo direto na composição do vídeo (`/studio?c=ManiacoP1`). Vídeos importados mostram o MP4 e o botão "Editar no Remotion".
- **Novo visual "sala de edição"**: grafite quente, um único âmbar, serifa Newsreader nos títulos, Instrument Sans no texto, JetBrains Mono para tempos; sem cartões nem ícones, listas em linhas finas, campos só com sublinhado e a **trilha de produção** (5 segmentos) mostrando a etapa de cada roteiro.

## Fase 3 (métricas): em andamento

Pronto: tabelas `publicacoes` e `metricas_snapshot` (histórico) e colunas novas em `contas_sociais` (migração 0007); pacote `packages/redes` com tipos, criptografia AES-256-GCM dos tokens (`TOKEN_ENC_KEY`) e cliente HTTP.
Falta: clientes YouTube, TikTok e Instagram (métricas confirmadas na documentação oficial), leitura de CSV, OAuth, páginas Contas e Métricas, coleta a cada hora. Nada disso foi testado com contas reais.

## Fase 3 — métricas (concluída, falta validar com contas reais)

- **Páginas:** **Métricas** (totais, gráfico de views por dia, divisão por rede, ranking "onde cada vídeo foi melhor", melhores dias e horários a partir de 8 publicações com data, lançamento manual e importação de CSV), página de cada publicação com o histórico de coletas, e **Contas** (conectar redes, coletar agora, contas manuais, passo a passo).
- **Pacote `packages/redes`:** clientes do YouTube (Data + Analytics), TikTok (Display API) e Instagram (insights por mídia), leitura de CSV e criptografia AES-256-GCM dos tokens. 10 testes com respostas simuladas.
- **Servidor:** OAuth com `state` em cookie, renovação de token, coleta que grava um ponto de histórico por coleta, e coleta automática a cada hora (`COLETA_AUTOMATICA=1`, em `instrumentation-node.ts`).
- **Teste de integração** (`apps/web/src/lib/redes.test.ts`): renovação, cifragem no banco, histórico sem duplicar, erro registrado na conta.
- **Limites:** nada foi testado com contas reais (exige criar os apps na Meta, TikTok e Google); o TikTok não informa tempo médio de visualização; o Facebook não tem coleta automática (métricas não confirmadas), só entrada manual; o token da Meta dura cerca de 60 dias e precisa de nova conexão; o TikTok pode exigir HTTPS no redirecionamento.
- **Bugs achados no teste:** respostas de erro do TikTok vêm com HTTP 200 (agora validadas), troca da cópia do pacote entre carregadores (o `fetch` simulado fica em `globalThis`), arquivo de instrumentação compilado para o edge (separado em `instrumentation-node.ts`) e tabela sem largura mínima.

## Fase 4 — agendamento (concluída, falta validar com contas reais)

- **Página Agendamento:** novo post com vídeo renderizado, legenda comum, data/hora (ou "publicar agora"), **caixinha por conta**, legenda própria por conta, título e privacidade do YouTube; sugestão do melhor momento a partir das métricas (quando há 8+ publicações com data); calendário do mês; lista com o estado de cada rede e ações (publicar agora, cancelar, tentar de novo, excluir).
- **Publicadores** (`packages/redes/src/publicar.ts`), conforme a documentação oficial: YouTube (upload resumível, **privado por padrão**), Instagram Reels (contêiner, upload resumível, espera o processamento, publica; usa o token da Página) e TikTok (envia para o **rascunho** na caixa de entrada). 18 testes com rede simulada.
- **Agendador** (`apps/web/src/lib/agendador.ts`): a cada minuto publica o que passou da hora (`AGENDADOR_AUTOMATICO=1`, só em uma instância). **Sem tentativa automática**: repetir sozinho poderia duplicar o vídeo; quem decide é a pessoa. Envios interrompidos há mais de 1 h são marcados como falha para conferência. YouTube e Instagram publicados entram sozinhos nas métricas, ligados ao vídeo.
- **Novos escopos de OAuth** (precisam reconectar as contas já ligadas): YouTube `youtube.upload`, Instagram `instagram_content_publish`, TikTok `video.upload`.
- **Limites:** nada foi testado com contas reais; o **Facebook** não publica automaticamente (fluxo não confirmado); a documentação do YouTube e minhas anotações se contradizem sobre vídeos de projetos não verificados serem forçados a privado, então o sistema envia privado e mostra o status que o YouTube devolver; o TikTok exige que a pessoa toque em publicar no app; o horário usa o fuso do servidor (ajustar na fase da VPS); o Instagram limita 100 publicações por 24 h.
