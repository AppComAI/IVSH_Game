# Falas gravadas do menino

Esta pasta recebe as falas já tratadas (`01.mp3`, `02.mp3`…) e `env.json` (duração e movimento da boca). O `build.py` embute tudo no `index.html`.

1. Grave em `gravar.html` e baixe o `.zip`, ou junte arquivos com o número da fala no nome (`01.m4a`, `fala_02.webm`…).
2. Rode `python3 menino/processar_falas.py caminho/do/arquivo.zip` (acrescente `--tom 3` para deixar a voz mais aguda).
3. Rode `python3 build.py`.

A fala `00` (narração de boas-vindas) vai para `narracao/narracao.mp3`.

`retrato.jpg` é o rosto do menino que aparece nas caixas de diálogo (recorte da imagem de referência). Se não existir, aparece a inicial do nome.
