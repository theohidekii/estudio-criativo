# Estilos de desenho — análise de referências

Análise da linguagem visual (traço, paleta, composição, texto) de canais enviados pelo time. O objetivo é criar estilos **próprios** inspirados nessa linguagem, sem copiar personagens, logotipos ou cenas.

Fonte: páginas públicas (grades de miniaturas). Não foram vistos o movimento, o ritmo de corte nem o áudio.

## 1. Volta por Cima (Instagram, humor em série)
- **Traço:** vetor chapado, contorno preto grosso e uniforme, cores saturadas e planas.
- **Paleta:** céu azul, grama verde, vermelho e amarelo vivos; cada episódio troca o fundo (bege, azul, lilás).
- **Personagens:** cabeça grande e redonda, olhos expressivos, corpo simples; roupas em cores primárias.
- **Texto:** título condensado no topo, branco ou amarelo com contorno preto; etiquetas pequenas sobre os personagens ("O EX"); selo de episódio ("EP.10") e selo da série.
- **Dificuldade no nosso motor:** baixa. É a evolução mais direta do estilo atual.

## 2. Bíblia Animada (TikTok, histórias em família)
- **Traço:** vetor suave, formas arredondadas, sombreamento leve, aspecto de livro infantil.
- **Paleta:** areia, creme e pergaminho, colinas verdes, faixas em azul e vermelho.
- **Personagens:** cabeça redonda, olhos de ponto, túnicas em cores terrosas.
- **Texto:** faixa em fita (ribbon) com o tema e selo de categoria no topo ("DÚVIDA POLÊMICA"); legenda branca com contorno embaixo; ícones pequenos (cruz, alianças, coração).
- **Dificuldade:** baixa a média. Precisa de paleta nova, cenários (colinas, céu) e o componente de faixa.

## 3. Mundo Oculto (TikTok, curiosidades)
- **Traço:** linhas brancas finas, como giz ou caneta, sobre fundo escuro; desenho ligeiramente tremido.
- **Paleta:** roxo muito escuro e preto, linhas brancas, destaque em vermelho.
- **Texto:** manuscrito, no topo, com uma palavra-chave destacada em vermelho.
- **Dificuldade:** média. Exige um desenhista de linhas "à mão" (traço com tremor) e personagens só de contorno.

## 4. Matrixxtz (Instagram, humor e ciência)
- **Traço:** personagens estilizados com ar 3D, membros longos, cabeça simples; iluminação de cinema (feixes de luz, brilho quente, profundidade de campo).
- **Paleta:** tons quentes e dessaturados, contraste suave.
- **Texto:** legenda branca condensada em negrito, palavra-chave em amarelo, no centro-baixo.
- **Dificuldade:** alta. Dá para aproximar em 2D com gradientes, vinheta e desfoque; o 3D de verdade pede o motor three.js do vídeo da ponte.

## 5. Natan Madeira (Instagram, marketing)
- **Traço:** dioramas isométricos de poucos polígonos (árvores em bloco, trilhas hexagonais, prédio em corte como casa de bonecas).
- **Paleta:** verde vivo, azul de céu, nuvens brancas.
- **Texto:** título amarelo muito grosso com contorno escuro, subtítulo branco, palavra-chave em amarelo.
- **Dificuldade:** alta. Cena 3D em three.js com câmera aérea.

## Ordem sugerida
1. Volta por Cima (rápido, valida o sistema de estilos)
2. Bíblia Animada
3. Mundo Oculto
4. Matrixxtz em 2D "cinematográfico"
5. Natan Madeira (3D isométrico), depois de o resto estar pronto

## Limites
- Reproduzir linguagem visual (tipo de traço, paleta, composição, ritmo); nunca personagens, nomes, logotipos ou cenas dos canais.
- Para o ritmo de animação, precisamos de pelo menos um vídeo de cada estilo (arquivo ou link que abra).

---

# Parte 2 — Análise dos vídeos (ritmo e edição)

Base: 5 vídeos verticais de 81 a 99 s. Método: quadros ao longo do tempo, detecção de cortes (`ffmpeg`, limiar 0,25), abertura dos 2 primeiros segundos e paleta por quantização. Os vídeos são identificados pelo estilo visual, não por metadados (inferência): vídeos 1 e 2 = Matrixxtz, 3 e 4 = Natan Madeira, 5 = Volta por Cima. Os 4 MP3 do TikTok são só áudio: sem imagem não dá para ligá-los a um canal, e sem transcrição local só medi o volume (cerca de -15 LUFS, voz alta e comprimida).

| Estilo | Cortes duros | Cena média | Legenda | Gancho (0–2 s) |
|---|---|---|---|---|
| Matrixxtz | 27 em 82 s e 51 em 92 s | 3,0 s e 1,8 s | 2 a 4 palavras, terço inferior | Pergunta hipotética: "E se tu acordasse com telecinese?" |
| Natan Madeira | 1 e 6 (a câmera faz o trabalho do corte) | cena contínua | 1 palavra por vez, a cada ~0,33 s | Cena já montada e a primeira palavra no frame 1 |
| Volta por Cima | 26 em 98 s | 3,8 s | 1 a 3 palavras, palavra-chave colorida | Quadro cheio (HUD, celular, personagem) e legenda no frame 1 |

## Matrixxtz — movimentos que definem o estilo
1. **2D com textura de papel e grão**, paleta quente e dessaturada (marrons, ocre, creme: `#6a5546`, `#b6a589`, `#d1a974`), vinheta leve e fundo desfocado.
2. **Câmera de cinema em 2D:** push-in lento, close-up de mãos e objetos, feixes de luz entrando pela janela.
3. **Legenda:** branco, condensada, negrito, sombra fina, terço inferior; **uma palavra por frase em amarelo-ocre ou vermelho**.
4. **Corte em cada frase** (1,8 a 3 s), mais rápido nas viradas de humor.
5. **Ganchos hipotéticos** ("E se…") e comédia de situação cotidiana.

## Natan Madeira — movimentos que definem o estilo
1. **Cena 3D de poucos polígonos:** personagens de blocos, sem rosto, trilha de hexágonos, céu azul e nuvens (`#8dd25f`, `#4498d6`, `#f4e7d9`).
2. **Etiquetas em pílula** branca com ponto verde ("LINK", "CUPOM") flutuando sobre cada elemento do conceito.
3. **Legenda de uma palavra por vez**, branca, negrito, com contorno preto, centralizada.
4. **Câmera que segue a ação** (pan e tilt), sem cortes duros.
5. **Fecho fixo:** "PARABÉNS! Você construiu um…" com a palavra-chave em amarelo.

## Volta por Cima — movimentos que definem o estilo
1. **HUD de jogo no topo** (contagem regressiva e barras de MENTE, CORPO, CARA, GRANA) que muda ao longo do episódio: é o fio da série.
2. **Legenda grande, amarela ou branca com contorno preto**, ao centro; a palavra-chave troca de cor (vermelho, azul).
3. **Adesivos de ação** ("É ELE", "TODO DIA", "NÃO LARGOU") em faixa inclinada, e **telas de celular** (WhatsApp, Pix) como cenário narrativo.
4. **Fundos de cor chapada com raios** (rosa, azul, verde) alternando com cenários desenhados.
5. **Fecho com decisão** ("VAI OU SOME", "VOCÊS DECIDEM") para gerar comentários.

## Como isso vira estilo no sistema
- Cada estilo é um pacote: paleta, fontes, personagens, cenários, componentes de texto (legenda, etiqueta, adesivo, HUD, faixa) e **regras de ritmo** (cena média, palavras por legenda, push-in).
- O formato atual de cenas ganha `estilo` e novos tipos de elemento (etiqueta em pílula, adesivo, HUD, celular).
- Ordem: Volta por Cima (mais próximo do motor atual) → Matrixxtz 2D → Natan Madeira em 3D com three.js.
