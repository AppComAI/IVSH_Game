/**
 * A Régua das Águas · recebe e resume os votos (Google Planilhas + Apps Script)
 *
 * Como usar (resumo; passo a passo no README da pasta):
 *  1. Crie uma planilha nova no Google Planilhas.
 *  2. Extensões > Apps Script. Apague o código de exemplo e cole este arquivo inteiro.
 *  3. Implantar > Nova implantação > tipo "App da Web".
 *     Executar como: Eu.  Quem tem acesso: Qualquer pessoa.
 *  4. Copie o endereço que termina em /exec e cole em config.js (campo endpoint).
 *
 * Guarda: data, turma, perfil, aparelho (código aleatório) e as respostas.
 * Não guarda nome, e-mail, telefone nem IP.
 * AVISO: não foi testado em implantação real por quem escreveu; teste com 1 voto antes de usar com a turma.
 */
var MAX_TXT = 280;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var d = JSON.parse(e.postData.contents);
    var r = (d.r === 2) ? 2 : 1;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nome = 'rodada' + r;
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    var base = ['data', 'turma', 'perfil', 'aparelho'];
    if (sh.getLastRow() === 0) sh.appendRow(base);
    var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var chaves = Object.keys(d.a || {}).concat(['comentario']);
    chaves.forEach(function (k) {
      k = String(k).slice(0, 24);
      if (cab.indexOf(k) < 0) { cab.push(k); sh.getRange(1, cab.length).setValue(k); }
    });
    var valores = {
      data: new Date(),
      turma: String(d.t || '').slice(0, 8),
      perfil: String(d.p || '').slice(0, 12),
      aparelho: String(d.id || '').slice(0, 12),
      comentario: String(d.c || '').slice(0, MAX_TXT)
    };
    Object.keys(d.a || {}).forEach(function (k) { valores[String(k).slice(0, 24)] = String(d.a[k]).slice(0, 24); });
    sh.appendRow(cab.map(function (h) { return valores.hasOwnProperty(h) ? valores[h] : ''; }));
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  var p = e.parameter || {};
  var cb = String(p.callback || 'cb').replace(/[^A-Za-z0-9_$.]/g, '');
  var res = { n: 0, perfis: {}, itens: {} };
  if (p.acao === 'resumo') {
    var r = (p.r === '2') ? 2 : 1;
    var turma = String(p.t || '').toUpperCase();
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('rodada' + r);
    if (sh && sh.getLastRow() > 1) {
      var v = sh.getDataRange().getValues();
      var cab = v[0];
      for (var i = 1; i < v.length; i++) {
        var lin = v[i];
        if (turma && String(lin[cab.indexOf('turma')]).toUpperCase() !== turma) continue;
        res.n++;
        var pf = String(lin[cab.indexOf('perfil')]);
        res.perfis[pf] = (res.perfis[pf] || 0) + 1;
        for (var c = 0; c < cab.length; c++) {
          var h = String(cab[c]);
          if (['data', 'turma', 'perfil', 'aparelho', 'comentario'].indexOf(h) >= 0) continue;
          var val = String(lin[c]);
          if (val === '') continue;
          res.itens[h] = res.itens[h] || {};
          res.itens[h][val] = (res.itens[h][val] || 0) + 1;
        }
      }
    }
  }
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(res) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
