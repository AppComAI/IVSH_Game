/* ===================== votar.html: votação anônima no celular ===================== */
(function(){
var $=function(id){ return document.getElementById(id); };
var qs=new URLSearchParams(location.search), R=qs.get('r')==='2'?2:1, TURMA=(qs.get('t')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8), DEF=VOTE['r'+R];
var S={i:-1,perfil:null,a:{},c:''}, tela=$('tela');
$('rnome').textContent=DEF.nome+(TURMA?' · turma '+TURMA:'');
if(!VOTE_CFG.endpoint){ $('warn').hidden=false; $('warn').innerHTML='<b>Modo demonstração.</b> Este endereço ainda não está ligado a uma planilha de respostas: o voto <b>não será enviado a ninguém</b>.'; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function itens(){ return DEF.itens.filter(function(it){ return !(it.soAdulto&&S.perfil==='aluno'); }); }
function bar(){ var n=itens().length; return '<div class="bar" aria-hidden="true"><b style="width:'+Math.round(Math.max(0,S.i)/n*100)+'%"></b></div>'; }
function inicio(){
  S={i:-1,perfil:null,a:{},c:''};
  tela.innerHTML='<h1>'+esc(DEF.nome)+'</h1><p>'+esc(DEF.intro)+'</p><h2 style="margin-top:14px">Quem está votando?</h2><div class="opts">'+VOTE.perfis.map(function(p){ return '<button type="button" data-p="'+p[0]+'">'+esc(p[1])+'</button>'; }).join('')+'</div>';
  Array.prototype.forEach.call(tela.querySelectorAll('[data-p]'),function(b){ b.addEventListener('click',function(){ S.perfil=b.getAttribute('data-p'); S.i=0; pergunta(); }); });
}
function pergunta(){
  var L=itens(); if(S.i>=L.length){ enviar(); return; }
  var it=L[S.i], h=bar()+'<h2>'+esc(it.q)+'</h2>', cur=S.a[it.id];
  if(it.tipo==='rosto'){ var lab=VOTE.rosto[it.esc];
    h+='<div class="faces" role="group" aria-label="'+esc(it.q)+'">'+[1,2,3,4].map(function(l){ return '<button type="button" data-v="'+l+'" class="'+(cur===l?'sel':'')+'">'+faceSVG(4-l,FACE_NOTA_COL[l-1],52,lab[l-1])+'<span>'+esc(lab[l-1])+'</span></button>'; }).join('')+'</div>'; }
  else if(it.tipo==='quiz'||it.tipo==='escolha'){ h+='<div class="opts">'+it.o.map(function(o){ return '<button type="button" data-v="'+o[0]+'" class="'+(cur===o[0]?'sel':'')+'">'+esc(o[1])+'</button>'; }).join('')+'</div>'; }
  else if(it.tipo==='texto'){ h+='<textarea id="txt" maxlength="280" aria-label="Sugestão">'+esc(S.c)+'</textarea><p class="note">Opcional. Até 280 letras. Não escreva nomes.</p><div class="opts"><button type="button" class="pri" id="prox">Enviar</button></div>'; }
  if(S.i>0) h+='<div class="opts"><button type="button" class="ghost" id="volta">Voltar</button></div>';
  tela.innerHTML=h;
  Array.prototype.forEach.call(tela.querySelectorAll('[data-v]'),function(b){ b.addEventListener('click',function(){ var v=b.getAttribute('data-v'); S.a[it.id]=it.tipo==='rosto'?parseInt(v,10):v; S.i++; pergunta(); }); });
  var px=$('prox'); if(px) px.addEventListener('click',function(){ S.c=($('txt').value||'').slice(0,280); S.i++; pergunta(); });
  var vb=$('volta'); if(vb) vb.addEventListener('click',function(){ if(it.tipo==='texto') S.c=($('txt').value||'').slice(0,280); S.i--; pergunta(); });
  window.scrollTo(0,0);
}
var ID=(function(){ var k='regua_dev'; try{ var v=localStorage.getItem(k); if(!v){ v=Math.random().toString(36).slice(2,8); localStorage.setItem(k,v); } return v; }catch(e){ return Math.random().toString(36).slice(2,8); } })();
function enviar(){
  var body={v:1,r:R,t:TURMA,p:S.perfil,id:ID,a:S.a,c:S.c};
  tela.innerHTML='<h2>Enviando…</h2>';
  if(!VOTE_CFG.endpoint){ fim(false,null); return; }
  try{ fetch(VOTE_CFG.endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(){ fim(true,null); },function(){ fim(false,'rede'); }); }
  catch(e){ fim(false,'rede'); }
}
function fim(enviado,erro){
  var h='';
  if(erro){ h+='<div class="err"><b>Não consegui enviar.</b> Confira a internet do celular.</div><div class="opts"><button type="button" class="pri" id="tenta">Tentar de novo</button></div>'; tela.innerHTML=h; $('tela').querySelector('#tenta').addEventListener('click',enviar); return; }
  h+='<h1>'+(enviado?'Obrigado!':'Pronto (demonstração)')+'</h1>';
  h+=enviado?'<p>Seu voto foi enviado. O navegador não recebe confirmação do servidor; quem conduz a atividade vê a contagem no jogo.</p>':'<p>Nada foi enviado: este endereço está em modo demonstração.</p>';
  if(R===1){ h+='<h2 style="margin-top:14px">Como era cada resposta</h2><p class="note">Sem nota e sem prova. Só para você conferir.</p>';
    DEF.itens.filter(function(it){ return it.tipo==='quiz'; }).forEach(function(it){ var ok=S.a[it.id]===it.ok, txt=it.o.filter(function(o){ return o[0]===it.ok; })[0][1];
      h+='<div class="fb"><b>'+esc(it.q)+'</b><br>'+(ok?'Você marcou: ':'Resposta do jogo: ')+esc(txt)+'.<br><span class="note">'+esc(it.why)+'</span></div>'; }); }
  h+='<div class="opts"><button type="button" id="outro">Outra pessoa vai votar neste aparelho</button></div>';
  tela.innerHTML=h; $('outro').addEventListener('click',inicio); window.scrollTo(0,0);
}
inicio();
})();
