/* ===================== PAINEL (lado esquerdo) ===================== */
function scClass(v){ return v===undefined?'pend':(v===null?'na':'s'+v); }
function jScores(){ return G.audited&&G.audJ ? G.audJ : G.sc; }
function renderFlow(){
  var sc=jScores(), r=calc(sc), h='';
  DIMS.forEach(function(d,di){
    var st=r.dims[di], cells=CODES.filter(function(c){ return dimOf(c)===d.c; }).map(function(c){
      var v=sc[c], m=G.meta[c]||{}, cls='cell '+scClass(v)+(G.cur===c?' cur':'')+(!G.audited&&m.flag?' flag':'');
      var lab=v===undefined?'pendente':(v===null?'sem registro':'nota '+v);
      return '<button type="button" class="'+cls+'" data-code="'+c+'" title="'+c+' '+IX[c][1]+': '+lab+'" aria-label="'+c+' '+IX[c][1]+', '+lab+'">'+c+'<b>'+(v===undefined?'·':(v===null?'s/r':v))+'</b></button>';
    }).join('');
    h+='<div class="drow"><div class="dlab">'+d.c+' · '+d.n.split(' ')[0]+'<small>'+(st.na?st.vals.length+' válidos de '+st.n:st.n+' itens')+'</small></div><div class="cells">'+cells+'</div><div class="dmean'+(st.pend?' p':'')+'" title="Média dos itens válidos">'+fmt(st.mean)+'</div></div>';
  });
  $('flowgrid').innerHTML=h;
  var started=Object.keys(sc).length>0;
  $('ivnum').textContent=started?fmt(r.ivsh):'—';
  var fx=$('ivfx');
  if(!started){ fx.className='fx'; fx.textContent='aguardando'; $('ivnote').textContent='A ficha do Jandaia começa na campanha de campo.'; }
  else { fx.className='fx '+(r.fx?r.fx.k:''); fx.textContent=(r.fx?r.fx.n:'—')+(r.pend?' · parcial':'');
    $('ivnote').textContent= r.pend ? r.pend+' indicador(es) pendente(s). O valor muda conforme a campanha avança.' :
      (G.audited?'Ficha auditada pela Mesa da Controladoria.':(G.closed?'Ficha fechada. Falta a auditoria.':'Todos os indicadores registrados.')); }
  // marcadores na escala
  var sEl=$('scale'); Array.prototype.forEach.call(sEl.querySelectorAll('.mk'),function(m){ m.remove(); });
  function mark(v,txt,o){ if(v==null) return; var e=document.createElement('div'); e.className='mk'+(o?' o':''); e.style.left=(Math.max(0,Math.min(3,v))/3*100)+'%'; e.textContent=txt; sEl.appendChild(e); }
  if(G.reguaOn) ACUDES.forEach(function(a){ if(a.me) return; mark(calc(G.audited?a.aud:a.regd).ivsh,a.n.slice(0,4),true); });
  if(started) mark(r.ivsh,'Jandaia '+fmt(r.ivsh));
  // passos
  var stp=!started?-1:(r.pend?0:(G.closed?3:2));
  Array.prototype.forEach.call($('steps').children,function(li,i){ li.classList.toggle('on',started&&(i<=stp||(r.pend&&i<3))); });
}
function rankRows(){
  return ACUDES.map(function(a){
    var sc=a.me?jScores():(G.audited?a.aud:a.regd), r=calc(sc), reg=a.me?null:calc(a.regd).ivsh;
    var regJ=a.me&&G.audited?calc(G.sc).ivsh:null;
    return {a:a,v:a.me&&!Object.keys(G.sc).length?null:r.ivsh,fx:r.fx,partial:a.me&&r.pend>0,before:a.me?regJ:reg};
  });
}
function ietTag(a){ var c=IET_CL[a.iet]; return '<span class="iet"><i style="background:'+c.c+'"></i>IET '+c.n+'</span>'; }
function renderRank(){
  var h='<table class="rank"><thead><tr><th></th><th>Açude</th><th>Faixa</th><th class="n">IVSH</th></tr></thead><tbody>';
  if(!G.reguaOn){
    ACUDES.forEach(function(a){
      var q=a.me?'sem ficha ainda':Object.keys(a.nom).slice(0,2).map(function(k){ return k+': “'+a.nom[k]+'”'; }).join(' · ');
      h+='<tr'+(a.me?' class="me"':'')+'><td class="pos">?</td><td class="nm">'+a.n+'<small>'+a.reg+'</small>'+ietTag(a)+'</td><td colspan="2" class="nom">'+q+'</td></tr>';
    });
    $('ranktag').textContent='fichas nominais, sem régua';
  } else {
    var rows=rankRows().sort(function(x,y){ return (y.v==null?-1:y.v)-(x.v==null?-1:x.v); });
    rows.forEach(function(r,i){
      var d='';
      if(G.audited&&r.before!=null&&Math.abs(r.before-r.v)>0.004){ var dv=r.v-r.before; d='<span class="delta '+(dv>0?'up':'dn')+'" title="Variação na auditoria">'+(dv>0?'+':'−')+fmt(Math.abs(dv))+'</span>'; }
      h+='<tr'+(r.a.me?' class="me"':'')+'><td class="pos">'+(r.v==null?'–':i+1)+'</td><td class="nm">'+r.a.n+'<small>'+(r.a.me?(G.audited?'sua ficha, auditada':'sua ficha'+(r.partial?' (parcial)':'')):r.a.reg)+'</small>'+ietTag(r.a)+'</td><td>'+(r.fx?'<span class="fx '+r.fx.k+'">'+r.fx.n+'</span>':'—')+'</td><td class="n">'+fmt(r.v)+d+'</td></tr>';
    });
    $('ranktag').textContent=G.audited?'auditado pela Controladoria':'como registrado (antes da auditoria)';
  }
  $('rank').innerHTML=h+'</tbody></table>';
}
function renderEvid(){
  var el=$('ev');
  if(!G.evid.length){ el.innerHTML='<div class="empty">As fotos tiradas em campo aparecem aqui. Foto é evidência mínima em vários indicadores.</div>'; }
  else el.innerHTML=G.evid.map(function(e){ return '<figure><img alt="Foto de campo: '+e.cap+'" src="'+e.url+'"><figcaption>'+e.code+' · '+e.cap+'</figcaption></figure>'; }).join('');
  $('evtag').textContent=G.evid.length+(G.evid.length===1?' foto':' fotos');
}
function renderDash(){ renderFlow(); renderRank(); renderEvid(); }
$('flowgrid').addEventListener('click',function(e){ var b=e.target.closest('.cell'); if(b) openRegua(b.getAttribute('data-code')); });

/* ===================== MODAL: régua completa ===================== */
var regLast=null;
function senseTxt(s){ return s==='I'?'<span class="sn2" style="color:var(--teal)">Inverso (protetivo)</span>':'<span class="sn2">Direto</span>'; }
function regRows(dc,hl){
  var h='';
  DIMS.forEach(function(d){
    if(dc!=='all'&&dc!==d.c) return;
    var rows=IND.filter(function(r){ return dimOf(r[0])===d.c; });
    h+='<tr class="gh"><td colspan="6">'+d.c+' · '+d.n+' · '+rows.length+' indicadores · '+d.cap+'</td></tr>';
    rows.forEach(function(r){ h+='<tr id="rg-'+r[0].replace('.','-')+'"'+(r[0]===hl?' class="hl"':'')+'><td class="c">'+r[0]+'</td><td class="n">'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td><ol>'+r[4].map(function(x,i){ return '<li><b>'+i+'</b>'+x+'</li>'; }).join('')+'</ol></td><td>'+senseTxt(r[5])+'</td></tr>'; });
  });
  return h;
}
function regTab(dc,hl){
  Array.prototype.forEach.call($('regtabs').children,function(b){ var on=b.getAttribute('data-d')===dc; b.setAttribute('aria-selected',on?'true':'false'); b.tabIndex=on?0:-1; });
  $('regbody').innerHTML=regRows(dc,hl);
}
function openRegua(code){
  regLast=document.activeElement; $('regua').hidden=false; regTab(code?dimOf(code):'all',code);
  var b=$('regua').querySelector('.rbody'); b.scrollTop=0;
  if(code){ var row=$('rg-'+code.replace('.','-')); if(row) setTimeout(function(){ row.scrollIntoView({block:'center'}); },30); }
  $('regx').focus();
}
function closeRegua(){ $('regua').hidden=true; if(regLast&&regLast.focus) regLast.focus(); }
$('regtabs').addEventListener('click',function(e){ var b=e.target.closest('button'); if(b) regTab(b.getAttribute('data-d')); });
$('regx').addEventListener('click',closeRegua);
$('regua').addEventListener('click',function(e){ if(e.target===this) closeRegua(); });
$('openregua').addEventListener('click',function(){ openRegua(); });

/* ===================== MODAL: regras ===================== */
var rLast=null;
function openRules(tab){ rLast=document.activeElement; $('rules').hidden=false; rTab(tab||'r1'); var s=$('rules').querySelector('[aria-selected="true"]'); if(s) s.focus(); }
function closeRules(){ $('rules').hidden=true; if(rLast&&rLast.focus) rLast.focus(); }
function rTab(id){
  Array.prototype.forEach.call($('rules').querySelectorAll('.rtabs button'),function(b){ var on=b.getAttribute('data-t')===id; b.setAttribute('aria-selected',on?'true':'false'); b.tabIndex=on?0:-1; if(on&&b.scrollIntoView) b.scrollIntoView({block:'nearest',inline:'nearest'}); });
  Array.prototype.forEach.call($('rules').querySelectorAll('.rpane'),function(p){ p.hidden=(p.id!==id); }); $('rules').querySelector('.rbody').scrollTop=0;
}
$('rules').querySelector('.rtabs').addEventListener('click',function(e){ var b=e.target.closest('button'); if(b){ rTab(b.getAttribute('data-t')); b.focus(); } });
$('rules').querySelector('.rtabs').addEventListener('keydown',function(e){ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; var bs=[].slice.call(this.querySelectorAll('button')), i=bs.indexOf(document.activeElement); if(i<0) return; e.preventDefault(); var n=bs[(i+(e.key==='ArrowRight'?1:bs.length-1))%bs.length]; rTab(n.getAttribute('data-t')); n.focus(); });
$('rclose').addEventListener('click',closeRules);
$('rules').addEventListener('click',function(e){ if(e.target===this) closeRules(); });
$('grules').addEventListener('click',function(){ openRules(); });
$('openrules2').addEventListener('click',function(){ openRules(); });
var HOOK={};
$('rplay').addEventListener('click',function(){ closeRules(); if(HOOK.play) HOOK.play(); });
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape') return;
  if(!$('regua').hidden){ e.preventDefault(); closeRegua(); return; }
  if(!$('rules').hidden){ e.preventDefault(); closeRules(); return; }
  if(!$('welcome').hidden){ e.preventDefault(); closeWelcome(); return; }
  if($('gamebox').classList.contains('full')) toggleFull();
});
function toggleFull(){ var gb=$('gamebox'); gb.classList.toggle('full'); var fl=gb.classList.contains('full'); $('gfull').textContent=fl?'✕':'⛶'; $('gfull').title=fl?'Sair da tela cheia':'Ampliar'; $('gfull').setAttribute('aria-label',fl?'Sair da tela cheia':'Ampliar'); if(HOOK.resize) HOOK.resize(); }
$('gfull').addEventListener('click',toggleFull);
renderDash();

/* ===================== BOAS-VINDAS (com narração opcional) ===================== */
var welLast=null, NA=$('narraudio');
function openWelcome(){ welLast=document.activeElement; $('welcome').hidden=false; try{ $('welhide').checked=localStorage.getItem('regua_bv')==='0'; }catch(e){} $('welgo').focus(); }
function closeWelcome(){ $('welcome').hidden=true; if(!NA.paused) NA.pause(); if(welLast&&welLast.focus) welLast.focus(); }
$('welx').addEventListener('click',closeWelcome);
$('welcome').addEventListener('click',function(e){ if(e.target===this) closeWelcome(); });
$('openwel').addEventListener('click',openWelcome);
$('welrules').addEventListener('click',function(){ closeWelcome(); openRules(); });
$('welgo').addEventListener('click',function(){ closeWelcome(); if(HOOK.play) HOOK.play(); });
$('welhide').addEventListener('change',function(){ try{ localStorage.setItem('regua_bv',this.checked?'0':'1'); }catch(e){} });
function mmss(t){ t=Math.max(0,Math.round(t||0)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
if(typeof NARR_SRC==='string'&&NARR_SRC){ NA.src=NARR_SRC; $('narr').hidden=false;
  $('narrplay').addEventListener('click',function(){ if(NA.paused){ NA.play().catch(function(){}); } else NA.pause(); });
  NA.addEventListener('play',function(){ $('narrplay').textContent='❚❚ Pausar'; $('narrplay').setAttribute('aria-pressed','true'); if(window.SFXduck) SFXduck(true); });
  NA.addEventListener('pause',function(){ $('narrplay').textContent=NA.ended||NA.currentTime<0.1?'▶ Ouvir a apresentação':'▶ Continuar'; $('narrplay').setAttribute('aria-pressed','false'); if(window.SFXduck) SFXduck(false); });
  NA.addEventListener('ended',function(){ NA.currentTime=0; $('narrplay').textContent='▶ Ouvir de novo'; });
  NA.addEventListener('timeupdate',function(){ var d=NA.duration||0; $('narrfill').style.width=(d?NA.currentTime/d*100:0)+'%'; $('narrtime').textContent=mmss(NA.currentTime)+' / '+mmss(d); });
  NA.addEventListener('loadedmetadata',function(){ $('narrtime').textContent='0:00 / '+mmss(NA.duration); }); }
(function(){ var show=true; try{ show=localStorage.getItem('regua_bv')!=='0'; }catch(e){} if(show) openWelcome(); })();
