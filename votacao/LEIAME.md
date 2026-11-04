# Votação por QR code · como ligar à planilha

O jogo mostra um QR code para cada rodada. Cada pessoa aponta a câmera do celular e vota em `votar.html`.
Para os votos serem guardados e aparecerem na tela do jogo, a página precisa de **um lugar para escrever**. Este projeto usa uma **Planilha Google** com um pequeno script (Apps Script). Leva uns 5 minutos.

> Sem esse passo, `votar.html` funciona em **modo demonstração**: mostra as perguntas, mas **nenhum voto é guardado**. A página avisa isso na tela.

## Passo a passo
1. Entre no Google Planilhas com a conta da equipe e crie uma planilha nova (ex.: "Régua das Águas · votos").
2. Menu **Extensões → Apps Script**. Apague o código que aparece e cole o conteúdo de `apps-script.gs`.
3. Clique em **Implantar → Nova implantação → tipo "App da Web"**.
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Autorize quando o Google pedir. Copie o endereço que termina em `/exec`.
5. No repositório, abra `config.js` e cole o endereço:
   ```js
   window.VOTE_CFG={endpoint:"https://script.google.com/macros/s/XXXX/exec"};
   ```
6. Salve (commit). Em 1–2 minutos o GitHub Pages atualiza. Teste com 1 voto seu antes de usar com a turma.

## Como usar com a turma
1. Abra o jogo pelo endereço público (GitHub Pages) e clique no botão **🗳** (canto do jogo).
2. Escolha a rodada e clique em **Projetar na tela**. O código da turma (4 letras) já vem no QR.
3. A contagem e as barras de resultado aparecem no jogo e atualizam a cada 5 segundos.
4. **Rodada 1** ("Eu entendi?"): faça depois da atividade. **Rodada 2** ("O que melhorar?"): em seguida ou no dia seguinte.
5. Os dados ficam na planilha (abas `rodada1` e `rodada2`) para análise.

## O que é guardado
Data, código da turma, perfil (aluno, professor, outro), um código aleatório do aparelho e as respostas.
**Não** guarda nome, e-mail, telefone nem IP. O campo de texto livre existe só para professores e outros adultos, com aviso para não escrever nomes. Alunos respondem só por escolhas e carinhas.
Antes de usar com crianças, confirme com a escola/COGERH se é preciso aviso aos responsáveis (LGPD, art. 14).

## Limites (sem enfeite)
- **Não é urna auditada.** Quem tem o endereço pode votar mais de uma vez; os números são indicativos para melhorar o projeto, não resultado oficial.
- O navegador **não recebe confirmação** do servidor ao enviar (limitação do modo `no-cors`). Quem conduz confere a contagem no jogo.
- Precisa de **internet** no celular de cada pessoa e no computador do jogo.
- O script foi **testado só com uma simulação local**, não numa implantação real do Google. Faça o teste de 1 voto.
- O QR só funciona com o jogo aberto por um endereço de internet (não por arquivo no computador nem `localhost`).
