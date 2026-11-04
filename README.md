# A Régua das Águas

RPG 3D educativo sobre o **IVSH** (Índice de Vulnerabilidade Socioambiental de Sistemas Hídricos), proposta de índice para a Gerência Metropolitana de Fortaleza. Prévia, entrega 1 de 2.

- **Jogar:** `index.html` (jogo completo: abertura com a rede de qualidade da água, mundo sem régua, campanha de campo com 5 casos e Mesa da Controladoria).
- **Realidade virtual:** `vr.html` (demo de 3 a 5 minutos: óculos com WebXR, como o Meta Quest; celular em modo 360°; ou computador).

Os dois arquivos são independentes, não precisam de internet (three.js e fontes vão embutidos) e devem ficar na mesma pasta, porque um tem link para o outro.

## Publicar no GitHub Pages

Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `(root)`.

## Avisos

- O IVSH é uma **proposta**, ainda não aplicada nem validada.
- Açudes, pessoas, fotos e notas do jogo são **fictícios**. RMQA e IET aparecem de forma ilustrativa.
- Os cortes das faixas (intervalos iguais da escala 0–3) e os custos e efeitos do orçamento são **convenções do jogo**.
- O Açude Gavião, o logo da COGERH e os dados de campo reais entram numa próxima versão.

## Editar e gerar os arquivos

O código-fonte fica em `src/` (`page.html`, `vr-page.html`, `fonts.css` e `src/app/*.js`). Para gerar `index.html` e `vr.html` de novo:

```bash
npm install        # baixa o three.js 0.150.0
python3 build.py   # gera index.html e vr.html na raiz
```

Parâmetro de teste: `?q=lo` força qualidade baixa (sem sombras); `?q=hi` impede a redução automática.

## Créditos

- Base: apresentação “Proposta de um Índice de Vulnerabilidade Socioambiental de Sistemas Hídricos (IVSH) para a Gerência Metropolitana de Fortaleza”, Sosthenis e Ana, UFC · FEAAC · PPAC-PROF.
- Design: @sosthenislima.
- [three.js](https://threejs.org) r150, licença MIT (aviso de licença mantido no arquivo).
- Fontes Barlow e Barlow Condensed, de Jeremy Tribby, licença SIL Open Font License 1.1.

Licença deste projeto: a definir.
