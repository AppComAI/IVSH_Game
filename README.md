# A Régua das Águas

RPG 3D educativo sobre o **IVSH** (Índice de Vulnerabilidade Socioambiental de Sistemas Hídricos), proposta de índice para a Gerência Metropolitana de Fortaleza. Prévia, entrega 1 de 2.

- **Jogar:** `index.html` (jogo completo: abertura com a rede de qualidade da água, mundo sem régua, campanha de campo com 5 casos e Mesa da Controladoria).
- **Realidade virtual:** `vr.html` (demo de 3 a 5 minutos: óculos com WebXR, como o Meta Quest; celular em modo 360°; ou computador).

- **Modo Escola (piloto):** botão “Modo Escola” na abertura do `index.html`. Uma fase completa para crianças de 8 a 12 anos, no açude de treino: garça-guia, régua com carinhas, 6 pistas com foto, plano de cuidado com 8 gotas em que a cena muda e selo final.
- **Votação por QR code:** botão 🗳 no jogo. Cada pessoa vota no próprio celular em `votar.html` (rodada 1: entendi? rodada 2: o que melhorar?). Precisa ligar uma planilha: veja [`votacao/LEIAME.md`](votacao/LEIAME.md).

`index.html` e `vr.html` são independentes e não precisam de internet para jogar (three.js e fontes vão embutidos); devem ficar na mesma pasta porque um tem link para o outro. **A votação precisa de internet** (celulares e planilha). `config.js` guarda o endereço da planilha e pode ser editado sem rodar o build.

## O menino (Juninho, nome provisório)

Logo depois de “Entrar no Pacajus”, a régua sobe do fundo do açude trazendo um menino (chibi, moreninho). Ele pula lá de cima, leva um tombo, se limpa e explica as regras; a régua volta para o fundo e só reaparece em “Chamar a régua”. Depois ele acompanha a entrevistadora pelo prólogo e pela campanha, pulando, brincando e cantarolando de vez em quando. Se uma brincadeira o atrasa, ele larga e vai atrás; se ficar preso ou muito longe, reaparece atrás dela. O corpo dele é feito em `src/app/04d-kid.js` (`makeKid`); o retrato do painel é `menino/retrato.jpg`. Ele fica quieto nos diálogos, não aparece nas fotos de campo, respeita os obstáculos e pode ser silenciado no botão 🧒. As falas estão em `src/app/menino-falas.js` (para trocar o nome, mude `MENINO.nome`).

**Gravar as vozes:** abra `gravar.html` (pela página publicada, porque o navegador só libera o microfone em https). Grave cada fala, ouça, regrave se quiser e toque em **Baixar tudo (.zip)**. Para encaixar no jogo:

```bash
python3 menino/processar_falas.py falas-menino.zip            # voz como foi gravada
python3 menino/processar_falas.py falas-menino.zip --tom 3    # 3 semitons mais aguda
python3 build.py
```

**Voz sintética (Letícia, Azure):** `node menino/gerar_ssml.js` gera em `menino/ssml/` o teste de tom e as falas em SSML para colar no Audio Content Creation (passo a passo em `menino/ssml/LEIA-ME.txt`). A exportação vem num arquivo só, com 2 s de pausa entre as falas: `python3 menino/processar_falas.py falas.mp3 --dividir` corta e numera; a narração entra com `--narracao`.

O script corta os silêncios, iguala o volume, converte para MP3 e calcula o movimento da boca. Precisa de ffmpeg (com rubberband para `--tom`). Fala sem áudio aparece só no balão.

## Narração das boas-vindas

Ao entrar, o jogo abre uma janela de boas-vindas (o que é, para que serve, como jogar). Ela tem espaço para uma narração gravada: coloque o arquivo em `narracao/` com o nome `narracao.mp3` (ou `.m4a`, `.ogg`, `.wav`) e rode `python3 build.py`; o áudio é embutido no `index.html`. Sem arquivo, o botão de ouvir não aparece. O roteiro está em [`narracao/ROTEIRO.md`](narracao/ROTEIRO.md).

## Publicar no GitHub Pages

Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `(root)`.

## Avisos

- O IVSH é uma **proposta**, ainda não aplicada nem validada.
- Os nomes dos açudes (Pacajus, Pacoti, Gavião e Riachão) são reais, mas cenário, pessoas, fotos e notas do jogo são **fictícios**. RMQA e IET aparecem de forma ilustrativa.
- Os cortes das faixas (intervalos iguais da escala 0–3) e os custos e efeitos do orçamento são **convenções do jogo**.
- O contorno e os dados de campo reais do Açude Gavião e o logo da COGERH entram numa próxima versão.

## Editar e gerar os arquivos

O código-fonte fica em `src/` (`page.html`, `vr-page.html`, `votar-page.html`, `gravar-page.html`, `fonts.css` e `src/app/*.js`). Para gerar `index.html`, `vr.html`, `votar.html` e `gravar.html` de novo:

```bash
npm install        # baixa three.js 0.150.0 e qrcode-generator
python3 build.py   # gera index.html, vr.html e votar.html na raiz
```

Parâmetro de teste: `?q=lo` força qualidade baixa (sem sombras); `?q=hi` impede a redução automática.

## Créditos

- Base: apresentação “Proposta de um Índice de Vulnerabilidade Socioambiental de Sistemas Hídricos (IVSH) para a Gerência Metropolitana de Fortaleza”, Sosthenis e Ana, UFC · FEAAC · PPAC-PROF.
- Design: @sosthenislima.
- [three.js](https://threejs.org) r150, licença MIT (aviso de licença mantido no arquivo).
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 (Kazuhiko Arase), licença MIT (aviso mantido no arquivo).
- Fontes Barlow e Barlow Condensed, de Jeremy Tribby, licença SIL Open Font License 1.1.

Licença deste projeto: a definir.

## Artigo

O artigo que propõe o IVSH está em [`Artigo_IVSH.pdf`](Artigo_IVSH.pdf). O jogo tem link para ele no cabeçalho e na janela de boas-vindas.
