#!/usr/bin/env node
/* Gera os arquivos SSML para a voz Letícia (Azure, pt-BR-LeticiaNeural), a partir de src/app/menino-falas.js.
   Uso: node menino/gerar_ssml.js [pasta-de-saída]
   Saída: 0-teste-de-tom.ssml, 1-falas-tom-A..D.ssml (falas 01–22, separadas por 2 s de silêncio) e 2-narracao.ssml (fala 00).
   O texto falado pode diferir da legenda para a voz pronunciar melhor (campo fal em menino-falas.js). */
const fs = require('fs'), path = require('path');
const B = path.dirname(__dirname), OUT = process.argv[2] || path.join(B, 'menino', 'ssml');
const src = fs.readFileSync(path.join(B, 'src/app/menino-falas.js'), 'utf8');
const ctx = {}; new Function('ctx', src + ';ctx.FALAS=FALAS;ctx.MENINO=MENINO;')(ctx);
const { FALAS, MENINO } = ctx;
const VOZ = 'pt-BR-LeticiaNeural', ANUNCIO = 'pt-BR-AntonioNeural', NARRADORA = 'pt-BR-FranciscaNeural';
const TONS = {
  A: { pitch: '+0%', rate: '+0%', nome: 'natural, como a Letícia é' },
  B: { pitch: '-5%', rate: '+4%', nome: 'um pouco mais grave' },
  C: { pitch: '-10%', rate: '+4%', nome: 'mais grave (mais “menino”)' },
  D: { pitch: '+6%', rate: '+8%', nome: 'mais agudo e mais rápido (mais criança)' },
};
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fal = f => (f.fal || f.txt).replace(/\{nome\}/g, MENINO.nome);   // fal = como deve soar (está em menino-falas.js)
const head = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="pt-BR">\n';
fs.mkdirSync(OUT, { recursive: true });
const falas = FALAS.filter(f => f.id !== '00');
let n = 0;
for (const [k, t] of Object.entries(TONS)) {
  let s = head + `<voice name="${VOZ}">\n<!-- Falas 01 a ${falas[falas.length - 1].id} do ${MENINO.nome}, tom ${k}: ${t.nome}. Não apague as pausas de 2 s: é por elas que eu separo as falas. -->\n`;
  falas.forEach(f => { s += `<prosody pitch="${t.pitch}" rate="${t.rate}">${esc(fal(f))}</prosody><break time="2000ms"/>\n`; });
  s += '</voice>\n</speak>\n';
  fs.writeFileSync(path.join(OUT, `1-falas-tom-${k}.ssml`), s); n++;
}
const amostra = 'Ops… tô bem, tô bem! Foi só um tombinho. Eu sou o ' + MENINO.nome + ', moro aqui na beira do Pacajus. Vem cá, deixa eu te explicar a regra dessa parada!';
let t0 = head;
for (const [k, t] of Object.entries(TONS)) {
  t0 += `<voice name="${ANUNCIO}">Opção ${k}.</voice>\n<voice name="${VOZ}"><break time="300ms"/><prosody pitch="${t.pitch}" rate="${t.rate}">${esc(amostra)}</prosody><break time="1200ms"/></voice>\n`;
}
fs.writeFileSync(path.join(OUT, '0-teste-de-tom.ssml'), t0 + '</speak>\n');
const nar = FALAS.find(f => f.id === '00').txt.replace(/IVSH/g, '<sub alias="i vê ésse agá">IVSH</sub>');
fs.writeFileSync(path.join(OUT, '2-narracao.ssml'), head + `<voice name="${NARRADORA}">\n${nar}\n</voice>\n</speak>\n`);
const plain = falas.map(fal).join(' ').length;
console.log(`ok: ${n} arquivos de falas (${falas.length} falas, ${plain} caracteres de texto cada), teste de tom e narração em ${OUT}`);
