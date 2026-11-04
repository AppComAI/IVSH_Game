# A Régua das Águas

RPG 3D educativo sobre o **IVSH** (Índice de Vulnerabilidade Socioambiental de Sistemas Hídricos), proposta de índice para a Gerência Metropolitana de Fortaleza. Prévia, entrega 1 de 2.

- **Jogar:** `index.html` (jogo completo: abertura com a rede de qualidade da água, mundo sem régua, campanha de campo com 5 casos e Mesa da Controladoria).
- **Realidade virtual:** `vr.html` (demo de 3 a 5 minutos: óculos com WebXR, como o Meta Quest; celular em modo 360°; ou computador).

- **Modo Escola (piloto):** botão “Modo Escola” na abertura do `index.html`. Uma fase completa para crianças de 8 a 12 anos, no açude de treino: garça-guia, régua com carinhas, 6 pistas com foto, plano de cuidado com 8 gotas em que a cena muda e selo final.
- **Votação por QR code:** botão 🗳 no jogo. Cada pessoa vota no próprio celular em `votar.html` (rodada 1: entendi? rodada 2: o que melhorar?). Precisa ligar uma planilha: veja [`votacao/LEIAME.md`](votacao/LEIAME.md).

`index.html` e `vr.html` são independentes e não precisam de internet para jogar (three.js e fontes vão embutidos); devem ficar na mesma pasta porque um tem link para o outro. **A votação precisa de internet** (celulares e planilha). `config.js` guarda o endereço da planilha e pode ser editado sem rodar o build.

## Narração das boas-vindas

Ao entrar, o jogo abre uma janela de boas-vindas (o que é, para que serve, como jogar). Ela tem espaço para uma narração gravada: coloque o arquivo em `narracao/` com o nome `narracao.mp3` (ou `.m4a`, `.ogg`, `.wav`) e rode `python3 build.py`; o áudio é embutido no `index.html`. Sem arquivo, o botão de ouvir não aparece. O roteiro está em [`narracao/ROTEIRO.md`](narracao/ROTEIRO.md).

## Publicar no GitHub Pages

Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `(root)`.

## Avisos

- O IVSH é uma **proposta**, ainda não aplicada nem validada.
- Açudes, pessoas, fotos e notas do jogo são **fictícios**. RMQA e IET aparecem de forma ilustrativa.
- Os cortes das faixas (intervalos iguais da escala 0–3) e os custos e efeitos do orçamento são **convenções do jogo**.
- O Açude Gavião, o logo da COGERH e os dados de campo reais entram numa próxima versão.

## Editar e gerar os arquivos

O código-fonte fica em `src/` (`page.html`, `vr-page.html`, `votar-page.html`, `fonts.css` e `src/app/*.js`). Para gerar `index.html`, `vr.html` e `votar.html` de novo:

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
