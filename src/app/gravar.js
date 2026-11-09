/* ===================== Página de gravação das falas (gravar.html) ===================== */
(function(){
  var $=function(id){ return document.getElementById(id); };
  var REC={}, cur=null, stream=null, actx=null, an=null, raf=0, filt='todas';
  Array.prototype.forEach.call(document.querySelectorAll('.nome'),function(e){ e.textContent=MENINO.nome; });
  function warn(t){ var w=$('warn'); w.innerHTML=t; w.hidden=!t; }
  var ok=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
  if(!window.isSecureContext) warn('Este endereço não é seguro (https), e o navegador não libera o microfone aqui. Abra pela página publicada do jogo, ou use o gravador do celular (veja o fim da página).');
  else if(!ok) warn('Este navegador não grava áudio pela página. Use o Chrome, o Edge ou o Safari atualizados, ou o gravador do celular (veja o fim da página).');
  var MIME=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus','audio/ogg'].filter(function(m){ return window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m); })[0]||'';
  function ext(m){ return /mp4/.test(m)?'m4a':(/ogg/.test(m)?'ogg':'webm'); }

  /* ---- guarda no navegador (IndexedDB) ---- */
  var db=null;
  function openDB(cb){ try{ var r=indexedDB.open('regua_gravacoes',1); r.onupgradeneeded=function(){ r.result.createObjectStore('falas',{keyPath:'id'}); }; r.onsuccess=function(){ db=r.result; cb(); }; r.onerror=function(){ cb(); }; }catch(e){ cb(); } }
  function put(o){ if(!db) return; try{ db.transaction('falas','readwrite').objectStore('falas').put(o); }catch(e){} }
  function del(id){ if(!db) return; try{ db.transaction('falas','readwrite').objectStore('falas').delete(id); }catch(e){} }
  function loadAll(cb){ if(!db) return cb(); try{ var q=db.transaction('falas').objectStore('falas').getAll(); q.onsuccess=function(){ (q.result||[]).forEach(function(o){ REC[o.id]=o; }); cb(); }; q.onerror=function(){ cb(); }; }catch(e){ cb(); } }

  /* ---- lista ---- */
  var GR=['todas'].concat(FALAS.map(function(f){ return f.grupo; }).filter(function(g,i,a){ return a.indexOf(g)===i; }));
  $('filt').innerHTML=GR.map(function(g){ return '<button type="button" data-g="'+g+'" aria-pressed="'+(g===filt)+'">'+(g==='todas'?'Todas':g)+'</button>'; }).join('');
  $('filt').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; filt=b.getAttribute('data-g'); Array.prototype.forEach.call(this.children,function(x){ x.setAttribute('aria-pressed',x===b?'true':'false'); }); render(); });
  function esc(t){ return String(t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fmt(s){ s=Math.round(s||0); return Math.floor(s/60)+':'+('0'+s%60).slice(-2); }
  function render(){
    $('lista').innerHTML=FALAS.filter(function(f){ return filt==='todas'||f.grupo===filt; }).map(function(f){ var r=REC[f.id];
      return '<div class="card fala'+(r?' ok':'')+'" id="f'+f.id+'"><div class="n">'+f.id+'</div>'+
        '<div class="meta"><b>'+esc(f.grupo)+'</b> · '+esc(f.momento)+'</div>'+
        '<div class="txt">'+esc(f.txt.replace(/\{nome\}/g,MENINO.nome))+'</div>'+
        '<div class="tom">Tom: '+esc(f.tom)+'</div>'+
        '<div class="row"><button type="button" class="rec" data-a="rec" data-id="'+f.id+'"'+(ok&&window.isSecureContext?'':' disabled')+'>● Gravar</button>'+
        '<button type="button" data-a="play" data-id="'+f.id+'"'+(r?'':' disabled')+'>▶ Ouvir</button>'+
        (f.quem==='narrador'?'':'<button type="button" data-a="kid" data-id="'+f.id+'"'+(r?'':' disabled')+'>▶ Prévia criança</button>')+
        '<button type="button" data-a="del" data-id="'+f.id+'"'+(r?'':' disabled')+' aria-label="Apagar a gravação '+f.id+'">🗑</button>'+
        '<span class="dur">'+(r?fmt(r.dur):'')+'</span><span class="meter" hidden><b></b></span></div></div>'; }).join('');
    var n=FALAS.filter(function(f){ return REC[f.id]; }).length; $('prog').textContent=n+' de '+FALAS.length+' gravadas'; $('zip').disabled=!n; }
  $('lista').addEventListener('click',function(e){ var b=e.target.closest('button[data-a]'); if(!b||b.disabled) return; var id=b.getAttribute('data-id'), a=b.getAttribute('data-a');
    if(a==='rec') toggleRec(id,b); else if(a==='play') play(id,false); else if(a==='kid') play(id,true); else if(a==='del'){ if(confirmDel(id)){ delete REC[id]; del(id); render(); } } });
  function confirmDel(id){ return window.confirm?window.confirm('Apagar a gravação da fala '+id+'?'):true; }

  /* ---- ouvir ---- */
  var player=new Audio(), purl='';
  function play(id,kid){ var r=REC[id]; if(!r) return; try{ player.pause(); }catch(e){} if(purl) URL.revokeObjectURL(purl); purl=URL.createObjectURL(r.blob); player.src=purl;
    player.preservesPitch=player.mozPreservesPitch=player.webkitPreservesPitch=!kid; player.playbackRate=kid?1.22:1; player.play().catch(function(){}); }

  /* ---- gravar ---- */
  function toggleRec(id,btn){ if(cur&&cur.id===id){ cur.mr.stop(); return; } if(cur) return; start(id); }
  function start(id){ navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}}).then(function(s){ stream=s; var ch=[], mr;
      try{ mr=MIME?new MediaRecorder(s,{mimeType:MIME}):new MediaRecorder(s); }catch(e){ mr=new MediaRecorder(s); }
      var card=$('f'+id), btn=card.querySelector('[data-a="rec"]'), meter=card.querySelector('.meter'), t0=Date.now(), lim=FALAS.filter(function(f){ return f.id===id; })[0].quem==='narrador'?180:45;
      cur={id:id,mr:mr}; card.classList.add('recording'); btn.textContent='■ Parar'; btn.classList.add('on'); meter.hidden=false;
      Array.prototype.forEach.call(document.querySelectorAll('button[data-a="rec"]'),function(x){ if(x!==btn) x.disabled=true; });
      mr.ondataavailable=function(e){ if(e.data&&e.data.size) ch.push(e.data); };
      mr.onstop=function(){ var type=mr.mimeType||MIME||(ch[0]&&ch[0].type)||'audio/webm', blob=new Blob(ch,{type:type}), dur=(Date.now()-t0)/1000;
        s.getTracks().forEach(function(t){ t.stop(); }); stream=null; cancelAnimationFrame(raf); if(actx){ try{ actx.close(); }catch(e){} actx=null; }
        cur=null; if(blob.size>800){ REC[id]={id:id,blob:blob,mime:type,dur:dur,t:Date.now()}; put(REC[id]); } render(); };
      mr.start(250);
      try{ actx=new (window.AudioContext||window.webkitAudioContext)(); an=actx.createAnalyser(); an.fftSize=512; actx.createMediaStreamSource(s).connect(an); var buf=new Uint8Array(an.fftSize), bar=meter.querySelector('b');
        (function loop(){ an.getByteTimeDomainData(buf); var m=0; for(var i=0;i<buf.length;i++){ var v=Math.abs(buf[i]-128); if(v>m) m=v; } bar.style.width=Math.min(100,m/90*100)+'%'; bar.style.background=m>120?'#C62828':'#1E7A46';
          card.querySelector('.dur').textContent=fmt((Date.now()-t0)/1000); if((Date.now()-t0)/1000>lim&&mr.state==='recording'){ mr.stop(); return; } raf=requestAnimationFrame(loop); })(); }catch(e){}
    },function(err){ warn('Não consegui usar o microfone ('+esc(err&&err.name||'erro')+'). Libere a permissão do microfone para esta página nas configurações do navegador e tente de novo.'); }); }

  /* ---- zip (sem compressão; áudio já vem comprimido) ---- */
  var CRC=(function(){ var t=new Uint32Array(256); for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
  function crc32(u){ var c=0xFFFFFFFF; for(var i=0;i<u.length;i++) c=CRC[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
  function zip(files){ var parts=[], cd=[], off=0, enc=new TextEncoder(), d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
    files.forEach(function(f){ var nm=enc.encode(f.name), u=f.data, c=crc32(u), h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(8,0,true); h.setUint16(10,dt,true); h.setUint16(12,dd,true); h.setUint32(14,c,true); h.setUint32(18,u.length,true); h.setUint32(22,u.length,true); h.setUint16(26,nm.length,true); h.setUint16(28,0,true);
      parts.push(new Uint8Array(h.buffer),nm,u);
      var e=new DataView(new ArrayBuffer(46)); e.setUint32(0,0x02014b50,true); e.setUint16(4,20,true); e.setUint16(6,20,true); e.setUint16(8,0x0800,true); e.setUint16(10,0,true); e.setUint16(12,dt,true); e.setUint16(14,dd,true); e.setUint32(16,c,true); e.setUint32(20,u.length,true); e.setUint32(24,u.length,true); e.setUint16(28,nm.length,true); e.setUint32(42,off,true);
      cd.push(new Uint8Array(e.buffer),nm); off+=30+nm.length+u.length; });
    var cdl=cd.reduce(function(s,a){ return s+a.length; },0), end=new DataView(new ArrayBuffer(22)); end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true); end.setUint32(12,cdl,true); end.setUint32(16,off,true);
    return new Blob(parts.concat(cd).concat([new Uint8Array(end.buffer)]),{type:'application/zip'}); }
  $('zip').addEventListener('click',function(){ var ids=FALAS.filter(function(f){ return REC[f.id]; }), files=[], i=0, rot='Falas gravadas para A Régua das Águas · menino: '+MENINO.nome+'\n\n';
    FALAS.forEach(function(f){ rot+=f.id+(REC[f.id]?' [gravada] ':' [falta]   ')+f.txt.replace(/\{nome\}/g,MENINO.nome)+'\n'; });
    (function next(){ if(i>=ids.length){ files.push({name:'roteiro.txt',data:new TextEncoder().encode(rot)}); var b=zip(files), a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='falas-menino.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },5000); return; }
      var f=ids[i++], r=REC[f.id], fr=new FileReader(); fr.onload=function(){ files.push({name:'fala_'+f.id+'.'+ext(r.mime),data:new Uint8Array(fr.result)}); next(); }; fr.readAsArrayBuffer(r.blob); })(); });

  openDB(function(){ loadAll(render); });
})();
