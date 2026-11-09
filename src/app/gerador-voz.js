/* ===================== Gerador da voz do menino (gerador_voz.html) =====================
   Voz de base: Piper no navegador (@diffusionstudio/vits-web, o mesmo do gerador do Severino).
   Transformação em voz de criança: VozInfantil (voz-infantil.js). */
(function(){
  var $=function(id){ return document.getElementById(id); };
  Array.prototype.forEach.call(document.querySelectorAll('.nome'),function(e){ e.textContent=MENINO.nome; });
  var PRESETS=[
    {k:'adulto',n:'Original (adulto)',d:'A voz de base, sem mudar nada. Só para comparar.',o:null},
    {k:'menino8',n:'Menino de 8 anos',d:'Tom bem mais agudo, timbre de criança, um pouco mais rápido.',o:{tom:11,timbre:3.5,velocidade:1.06}},
    {k:'novinho',n:'Menino mais novo',d:'Mais agudo e mais “pequeno”.',o:{tom:13,timbre:4.5,velocidade:1.08}},
    {k:'moleque',n:'Moleque elétrico',d:'Um pouco menos agudo, mas falando rápido.',o:{tom:10,timbre:3,velocidade:1.15}},
    {k:'pers',n:'Personalizado',d:'Ajuste você mesmo.',o:{tom:11,timbre:3.5,velocidade:1.06},custom:true}
  ];
  var sel='menino8';
  try{ var sv=JSON.parse(localStorage.getItem('regua_vozmenino')||'null'); if(sv){ sel=sv.sel||sel; if(sv.pers) PRESETS[4].o=sv.pers; } }catch(e){}
  function salvar(){ try{ localStorage.setItem('regua_vozmenino',JSON.stringify({sel:sel,pers:PRESETS[4].o})); }catch(e){} }
  function preset(){ for(var i=0;i<PRESETS.length;i++) if(PRESETS[i].k===sel) return PRESETS[i]; return PRESETS[1]; }
  function st(t,p){ $('st').textContent=t; if(p!=null) $('pb').style.width=Math.round(p*100)+'%'; }
  function aviso(t){ $('aviso').innerHTML=t; $('aviso').hidden=!t; }

  /* ---- armazenamento da voz: OPFS; se o navegador recusar (página aberta como arquivo), guarda na memória ---- */
  var memoria=false;
  function opfsMemoria(){ function Arq(n){ this.kind='file'; this.name=n; this.data=null; }
    Arq.prototype.createWritable=function(){ var a=this, parts=[]; return Promise.resolve({write:function(d){ parts.push(d); return Promise.resolve(); },close:function(){ a.data=new Blob(parts); return Promise.resolve(); }}); };
    Arq.prototype.getFile=function(){ if(!this.data) return Promise.reject(new DOMException('vazio','NotFoundError')); return Promise.resolve(new File([this.data],this.name)); };
    function Dir(n){ this.kind='directory'; this.name=n; this.e={}; }
    Dir.prototype.getDirectoryHandle=function(n,o){ if(!this.e[n]){ if(!(o&&o.create)) return Promise.reject(new DOMException(n,'NotFoundError')); this.e[n]=new Dir(n); } return Promise.resolve(this.e[n]); };
    Dir.prototype.getFileHandle=function(n,o){ var d=this; if(!d.e[n]){ if(!(o&&o.create)) return Promise.reject(new DOMException(n,'NotFoundError')); d.e[n]=new Arq(n); } var f=d.e[n]; f.remove=function(){ delete d.e[n]; return Promise.resolve(); }; return Promise.resolve(f); };
    Dir.prototype.remove=function(){ this.e={}; return Promise.resolve(); };
    Dir.prototype.keys=function(){ var k=Object.keys(this.e), i=0, me=this; return {next:function(){ return Promise.resolve(i<k.length?{value:k[i++],done:false}:{done:true}); },[Symbol.asyncIterator]:function(){ return this; }}; };
    var raiz=new Dir('');
    try{ Object.defineProperty(navigator.storage,'getDirectory',{value:function(){ return Promise.resolve(raiz); },configurable:true}); }catch(e){ navigator.storage.getDirectory=function(){ return Promise.resolve(raiz); }; } }
  function checarArmazenamento(){ if(!navigator.storage||!navigator.storage.getDirectory){ if(!navigator.storage) try{ navigator.storage={}; }catch(e){} memoria=true; opfsMemoria(); return Promise.resolve(); }
    return navigator.storage.getDirectory().then(function(d){ return d.getDirectoryHandle('piper',{create:true}); }).then(function(){},function(){ memoria=true; opfsMemoria(); }); }

  /* ---- motor de voz ---- */
  var tts=null, ready=false, crus={}, out={};
  function lib(){ if(tts) return Promise.resolve(tts); st('Carregando o motor de voz…',0.02);
    var SRC=['https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm','https://esm.sh/@diffusionstudio/vits-web@1.0.3'], i=0;
    return new Promise(function(res,rej){ (function tenta(){ if(i>=SRC.length) return rej(new Error('não consegui carregar o motor de voz')); import(SRC[i++]).then(function(m){ tts=m; res(m); },function(e){ console.warn(e); tenta(); }); })(); }); }
  function voz(){ return $('voice').value; }
  function cru(texto){ var key=voz()+'|'+texto; if(crus[key]) return Promise.resolve(crus[key]);
    return tts.predict({text:texto,voiceId:voz()}).then(function(b){ return b.arrayBuffer(); }).then(function(ab){ var w=VozInfantil.decodeWav(ab); crus[key]=w; return w; }); }
  function sintetizar(texto,o){ return cru(texto).then(function(w){ var pcm=o?VozInfantil.transformar(w.pcm,w.sr,o):w.pcm; return new Blob([VozInfantil.encodeWav(pcm,w.sr)],{type:'audio/wav'}); }); }
  $('prep').onclick=function(){ $('prep').disabled=true;
    checarArmazenamento().then(lib).then(function(){
      if(memoria) aviso('Esta página foi aberta como arquivo, e o navegador não deixa guardar a voz. Funciona, mas a voz é baixada de novo cada vez que a página abre. Pela página publicada (https) ela fica guardada.');
      return tts.download(voz(),function(p){ if(p.total) st('Baixando a voz: '+Math.round(p.loaded/1e6)+' de '+Math.round(p.total/1e6)+' MB',p.loaded/p.total); }); })
    .then(function(){ st('Testando…',1); return cru('Olá, eu sou o '+MENINO.nome+'.'); })
    .then(function(){ ready=true; st('Voz pronta. Ouça as opções de voz infantil.',1); habilitar(true); })
    .catch(function(err){ console.error(err); st('Erro ao preparar a voz: '+(err&&err.message||err)+'. Verifique a internet e tente no Chrome ou no Edge.',0); $('prep').disabled=false; }); };
  $('voice').onchange=function(){ if(ready){ ready=false; habilitar(false); $('prep').disabled=false; st('Voz trocada: clique em “1. Preparar a voz” de novo.',0); } };
  function habilitar(on){ Array.prototype.forEach.call(document.querySelectorAll('[data-ouvir],[data-g]'),function(b){ b.disabled=!on; }); $('all').disabled=!on; }

  /* ---- escolha da voz infantil ---- */
  var amostra=falaFalada(FALAS.filter(function(f){ return f.id==='03'; })[0])+' '+falaFalada(FALAS.filter(function(f){ return f.id==='04'; })[0]);
  $('amostra').value=amostra;
  var player=new Audio(), purl='';
  function tocar(blob){ try{ player.pause(); }catch(e){} if(purl) URL.revokeObjectURL(purl); purl=URL.createObjectURL(blob); player.src=purl; player.play().catch(function(){}); }
  function renderCards(){
    $('cards').innerHTML=PRESETS.map(function(p){ var o=p.o;
      return '<div class="card'+(p.k===sel?' on':'')+'" data-k="'+p.k+'"><b>'+p.n+'</b><span class="d">'+p.d+'</span>'+
        (p.custom?'<div class="sl"><span>Tom</span><input type="range" min="4" max="16" step="0.5" data-p="tom" value="'+o.tom+'" aria-label="Tom em semitons"><span>+'+o.tom+'</span>'+
          '<span>Timbre</span><input type="range" min="0" max="7" step="0.5" data-p="timbre" value="'+o.timbre+'" aria-label="Timbre em semitons"><span>+'+o.timbre+'</span>'+
          '<span>Velocidade</span><input type="range" min="0.85" max="1.3" step="0.01" data-p="velocidade" value="'+o.velocidade+'" aria-label="Velocidade"><span>'+o.velocidade.toFixed(2)+'×</span></div>':'')+
        '<button type="button" data-ouvir="'+p.k+'"'+(ready?'':' disabled')+'>▶ Ouvir</button>'+
        (p.o?'<label><input type="radio" name="voz" value="'+p.k+'"'+(p.k===sel?' checked':'')+'> usar esta</label>':'')+'</div>'; }).join(''); }
  renderCards();
  $('cards').addEventListener('click',function(e){ var b=e.target.closest('[data-ouvir]'); if(!b||!ready) return; var p=PRESETS.filter(function(x){ return x.k===b.getAttribute('data-ouvir'); })[0];
    b.textContent='gerando…'; sintetizar($('amostra').value,p.o).then(function(bl){ b.textContent='▶ Ouvir'; tocar(bl); },function(err){ b.textContent='erro'; console.error(err); }); });
  $('cards').addEventListener('change',function(e){ var r=e.target.closest('input[type=radio]'); if(r){ sel=r.value; salvar(); marcarSujo(); Array.prototype.forEach.call(document.querySelectorAll('.card'),function(c){ c.classList.toggle('on',c.getAttribute('data-k')===sel); }); } });
  $('cards').addEventListener('input',function(e){ var s=e.target.closest('input[type=range]'); if(!s) return; var o=PRESETS[4].o, k=s.getAttribute('data-p'); o[k]=parseFloat(s.value); s.nextElementSibling.textContent=k==='velocidade'?o[k].toFixed(2)+'×':'+'+o[k]; salvar(); if(sel==='pers') marcarSujo(); });
  function marcarSujo(){ Object.keys(out).forEach(function(id){ var s=$('s'+id); if(s&&id!=='00'){ s.textContent='voz mudou: gere de novo'; s.className='s run'; } }); }

  /* ---- falas ---- */
  var ROWS=FALAS.map(function(f){ return {id:f.id,legenda:f.txt.replace(/\{nome\}/g,MENINO.nome),falado:falaFalada(f),narr:f.quem==='narrador'}; });
  $('tb').innerHTML=ROWS.map(function(r,i){ return '<tr><td class="id">'+r.id+'</td><td class="leg"></td><td><textarea data-i="'+i+'" aria-label="Texto falado da fala '+r.id+'"></textarea></td><td class="act"><button type="button" data-g="'+i+'" disabled>Gerar</button><span class="s" id="s'+r.id+'">—</span><span id="a'+r.id+'"></span></td></tr>'; }).join('');
  Array.prototype.forEach.call($('tb').querySelectorAll('tr'),function(tr,i){ tr.querySelector('.leg').textContent=ROWS[i].legenda; tr.querySelector('textarea').value=ROWS[i].falado; });
  $('tb').addEventListener('click',function(e){ var b=e.target.closest('button[data-g]'); if(b) gen(+b.getAttribute('data-g'),true); });
  $('tb').addEventListener('input',function(e){ var t=e.target.closest('textarea'); if(!t) return; var r=ROWS[+t.getAttribute('data-i')]; r.falado=t.value; if(out[r.id]){ var s=$('s'+r.id); s.textContent='texto mudou: gere de novo'; s.className='s run'; } });
  function gen(i,play){ if(!ready) return Promise.resolve(); var r=ROWS[i], s=$('s'+r.id); s.textContent='gerando…'; s.className='s run';
    var o=r.narr&&$('narrAdulta').checked?null:preset().o;
    return sintetizar(r.falado,o).then(function(b){ out[r.id]={b:b,o:o}; var a=document.createElement('audio'); a.controls=true; a.src=URL.createObjectURL(b); var box=$('a'+r.id); box.innerHTML=''; box.appendChild(a);
        s.textContent='ok · '+Math.round(b.size/1024)+' KB'; s.className='s ok'; if(play) a.play().catch(function(){}); $('zip').disabled=false; },
      function(err){ console.error(err); s.textContent='erro: '+(err&&err.message||err); s.className='s err'; }); }
  $('all').onclick=function(){ $('all').disabled=true; var i=0; (function prox(){ if(i>=ROWS.length){ st('Todas geradas. Ouça e baixe o zip.',1); $('all').disabled=false; return; } st('Gerando '+(i+1)+' de '+ROWS.length+'…',i/ROWS.length); gen(i++,false).then(prox); })(); };

  /* ---- zip (sem compressão) ---- */
  var CRC=(function(){ var t=new Uint32Array(256); for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
  function crc32(u){ var c=0xFFFFFFFF; for(var i=0;i<u.length;i++) c=CRC[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
  function zip(files){ var parts=[], cd=[], off=0, enc=new TextEncoder(), d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
    files.forEach(function(f){ var nm=enc.encode(f.name), u=f.data, c=crc32(u), h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(10,dt,true); h.setUint16(12,dd,true); h.setUint32(14,c,true); h.setUint32(18,u.length,true); h.setUint32(22,u.length,true); h.setUint16(26,nm.length,true);
      parts.push(new Uint8Array(h.buffer),nm,u);
      var e=new DataView(new ArrayBuffer(46)); e.setUint32(0,0x02014b50,true); e.setUint16(4,20,true); e.setUint16(6,20,true); e.setUint16(8,0x0800,true); e.setUint16(12,dt,true); e.setUint16(14,dd,true); e.setUint32(16,c,true); e.setUint32(20,u.length,true); e.setUint32(24,u.length,true); e.setUint16(28,nm.length,true); e.setUint32(42,off,true);
      cd.push(new Uint8Array(e.buffer),nm); off+=30+nm.length+u.length; });
    var cdl=cd.reduce(function(s,a){ return s+a.length; },0), end=new DataView(new ArrayBuffer(22)); end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true); end.setUint32(12,cdl,true); end.setUint32(16,off,true);
    return new Blob(parts.concat(cd).concat([new Uint8Array(end.buffer)]),{type:'application/zip'}); }
  $('zip').onclick=function(){ var ids=ROWS.filter(function(r){ return out[r.id]; }), files=[], i=0, enc=new TextEncoder(), p=preset();
    var info='Voz de base: '+voz()+' (Piper, via @diffusionstudio/vits-web)\nVoz infantil: '+p.n+(p.o?' (tom +'+p.o.tom+' semitons, timbre +'+p.o.timbre+', velocidade '+p.o.velocidade+'x)':'')+'\nNarração 00 com voz adulta: '+($('narrAdulta').checked?'sim':'não')+'\n';
    (function prox(){ if(i>=ids.length){ files.push({name:'voz.txt',data:enc.encode(info)}); files.push({name:'falas.json',data:enc.encode(JSON.stringify(ROWS.map(function(r){ return {id:r.id,legenda:r.legenda,falado:r.falado,gerado:!!out[r.id]}; }),null,1))});
        var b=zip(files), a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='voz-menino.zip'; document.body.appendChild(a); a.click(); a.remove(); return; }
      var r=ids[i++]; out[r.id].b.arrayBuffer().then(function(ab){ files.push({name:'fala_'+r.id+'.wav',data:new Uint8Array(ab)}); prox(); }); })(); };
})();
