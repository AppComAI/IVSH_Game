/* ===================== Votação no jogo: QR por rodada, código da turma, resultados ao vivo ===================== */
(function(){
var vR=1, vLast=null, vTimer=null, vRes=null, vErr=null;
function turma(){ var t=null; try{ t=sessionStorage.getItem('regua_turma'); }catch(e){} if(!t){ t=novo(); } return t; }
function novo(){ var a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', t=''; for(var i=0;i<4;i++) t+=a[Math.floor(Math.random()*a.length)]; try{ sessionStorage.setItem('regua_turma',t); }catch(e){} return t; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function drawQR(cv,url){
  var q=qrcode(0,'M'); q.addData(url); q.make(); var n=q.getModuleCount(), qz=4, tot=n+qz*2, S=Math.floor(cv.width/tot), off=Math.floor((cv.width-S*tot)/2), x=cv.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,cv.width,cv.height); x.fillStyle='#000';
  for(var r=0;r<n;r++) for(var c=0;c<n;c++) if(q.isDark(r,c)) x.fillRect(off+(c+qz)*S,off+(r+qz)*S,S,S); }
function pct(a,b){ return b?Math.round(a/b*100):0; }
function row(lbl,p,right){ return '<div class="vrow"><div class="t"><i style="width:'+p+'%"></i><span>'+esc(lbl)+'</span></div><b>'+right+'</b></div>'; }
function resultados(){
  if(!VOTE_CFG.endpoint) return '<div class="vwarn"><b>Sem planilha ligada.</b> O QR abre a votação em modo demonstração e nenhum voto é guardado. Para ligar: veja <code>votacao/LEIAME.md</code>.</div>';
  if(vErr) return '<div class="vwarn">Não consegui buscar a contagem agora ('+esc(vErr==='tempo'?'demorou demais':'sem rede')+'). Tento de novo sozinho.</div>';
  if(!vRes) return '<p class="note">Buscando a contagem…</p>';
  var n=vRes.n||0, d=VOTE['r'+vR], I=vRes.itens||{}, h='<div class="vcount" aria-live="polite">'+n+'</div><div class="note">'+(n===1?'voto':'votos')+' da turma '+esc(turma())+' (atualiza a cada 5 s)</div>';
  var pf=vRes.perfis||{}; if(n) h+='<div class="note">'+[['aluno','alunos'],['professor','professores'],['outro','outros']].map(function(p){ return (pf[p[0]]||0)+' '+p[1]; }).join(' · ')+'</div>';
  if(n<10&&n>0) h+='<div class="vwarn" style="margin-top:8px">Poucos votos: não conclua nada ainda.</div>';
  if(!n) return h+'<p class="note" style="margin-top:8px">Ninguém votou ainda nesta rodada com este código.</p>';
  h+='<div class="vres">';
  d.itens.forEach(function(it){ var c=I[it.id]||{}, tot=0; Object.keys(c).forEach(function(k){ tot+=c[k]; }); if(!tot||it.tipo==='texto') return;
    h+='<h4>'+esc(it.q)+'</h4>';
    if(it.tipo==='rosto'){ var lab=VOTE.rosto[it.esc]; [4,3,2,1].forEach(function(l){ var v=c[l]||0; h+=row(lab[l-1],pct(v,tot),pct(v,tot)+'%'); }); }
    else if(it.tipo==='quiz'){ it.o.forEach(function(o){ var v=c[o[0]]||0; h+=row((o[0]===it.ok?'✔ ':'')+o[1],pct(v,tot),pct(v,tot)+'%'); }); }
    else { it.o.slice().sort(function(a,b){ return (c[b[0]]||0)-(c[a[0]]||0); }).forEach(function(o){ var v=c[o[0]]||0; h+=row(o[1],pct(v,tot),pct(v,tot)+'%'); }); }
  });
  return h+'</div>';
}
function render(){
  var url=voteUrl(vR,turma()), local=/^file:/.test(location.protocol)||/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname), body=$('votebody');
  var d=VOTE['r'+vR];
  body.innerHTML='<div class="vgrid"><div class="vqr"><canvas id="vcan" width="400" height="400" aria-label="QR code da '+esc(d.nome)+'"></canvas><div class="vurl">'+esc(url)+'</div>'+
    '<div class="vcode"><span class="note">Código da turma</span><b>'+esc(turma())+'</b></div>'+
    '<div class="chs row"><button type="button" class="ch pri" id="vproj">Projetar na tela</button><button type="button" class="ch" id="vnovo">Nova turma</button></div></div>'+
    '<div><p><b>'+esc(d.nome)+'</b></p><p class="note">'+esc(d.intro)+' Cada pessoa aponta a câmera do celular para o QR e responde. Aluno, professor e visita usam o mesmo QR; a pessoa diz quem é na primeira tela.</p>'+
    (local?'<div class="vwarn">Este jogo está aberto em um endereço local ('+esc(location.protocol==='file:'?'arquivo no computador':location.hostname)+'). Os celulares não alcançam esse endereço. Abra o jogo pelo endereço publicado na internet antes de mostrar o QR.</div>':'')+
    '<div id="vresbox" class="vres">'+resultados()+'</div></div></div>';
  try{ drawQR($('vcan'),url); }catch(e){ $('vcan').replaceWith(document.createTextNode('Não consegui gerar o QR: '+e.message)); }
  $('vproj').addEventListener('click',function(){ proj(url,d); });
  $('vnovo').addEventListener('click',function(){ novo(); vRes=null; vErr=null; render(); busca(); });
}
function busca(){
  if(!VOTE_CFG.endpoint||$('vote').hidden) return;
  var r=vR; voteJsonp({acao:'resumo',r:r,t:turma()},function(res,err){ if(r!==vR||$('vote').hidden) return; if(err){ vErr=err; vRes=null; } else { vErr=null; vRes=res; }
    var b=$('vresbox'); if(b) b.innerHTML=resultados(); });
}
function proj(url,d){ $('vbig').hidden=false; drawQR($('vbigc'),url); $('vbigt').innerHTML=esc(d.nome)+'<br><span style="font-size:.6em;font-weight:600">Aponte a câmera do celular · código da turma '+esc(turma())+'</span>'; $('vbigx').focus(); }
function fechaProj(){ $('vbig').hidden=true; }
function tab(r){ vR=r; vRes=null; vErr=null; Array.prototype.forEach.call($('votetabs').children,function(b){ b.setAttribute('aria-selected',b.getAttribute('data-r')==String(r)?'true':'false'); }); render(); busca(); }
window.openVote=function(r){ vLast=document.activeElement; $('vote').hidden=false; tab(r||vR); clearInterval(vTimer); vTimer=setInterval(busca,5000); $('votex').focus(); };
function closeVote(){ $('vote').hidden=true; clearInterval(vTimer); fechaProj(); if(vLast&&vLast.focus) vLast.focus(); }
Array.prototype.forEach.call($('votetabs').children,function(b){ b.addEventListener('click',function(){ tab(parseInt(b.getAttribute('data-r'),10)); }); });
$('votex').addEventListener('click',closeVote); $('vote').addEventListener('click',function(e){ if(e.target===this) closeVote(); });
$('vbigx').addEventListener('click',fechaProj); $('gvote').addEventListener('click',function(){ openVote(); });
window.addEventListener('keydown',function(e){ if(e.key!=='Escape') return; if(!$('vbig').hidden){ e.preventDefault(); e.stopImmediatePropagation(); fechaProj(); } else if(!$('vote').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeVote(); } },true);
})();
