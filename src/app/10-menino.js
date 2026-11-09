/* ===================== O MENINO: entrada pela régua e companhia na campanha =====================
   Falas em menino-falas.js. Áudio gravado (opcional) em MEN_AUDIO, embutido pelo build:
   {id:{s:'data:audio/mpeg;base64,…', e:'envelope 0–9 a 20 Hz', d:duração em s}}. Sem áudio, só balão. */
var MEN=null;
(function(){
  var AUD=(typeof MEN_AUDIO!=='undefined'&&MEN_AUDIO)||{};
  // opção A escolhida (chibi, moreninho): cabeção, corpo pequeno, pele morena, cabelo escuro, polo azul-clara, calça azul, tênis preto
  var c=makeKid({style:'chibi',skin:0xC98E62,hair:0x2b1a12,nose:0xB97B52,cheek:0xD9786A});
  c.g.visible=false; c.g.rotation.order='YXZ'; scene.add(c.g); if(typeof shadowSetup==='function') shadowSetup(c.g);
  var M=MEN={c:c,st:'off',mute:false,au:null,speak:null,q:[],clk:0,act:null,trail:[],path:null,pT:0,anc:null,lastP:{x:0,z:0},idleT:0,playT:3,singT:40,songI:0,saidIdle:false,arrN:0,evN:0,trips:0,jumps:0,bub:null,notes:[]};
  try{ M.mute=localStorage.getItem('regua_menino')==='0'; }catch(e){}

  /* ---- balão de fala (sprite) ---- */
  var bc=document.createElement('canvas'); bc.width=640; bc.height=260; var bx=bc.getContext('2d'), btx=new T.CanvasTexture(bc); btx.encoding=T.sRGBEncoding;
  var bub=new T.Sprite(new T.SpriteMaterial({map:btx,transparent:true,depthTest:false})); bub.center.set(.5,0); bub.renderOrder=8; bub.visible=false; scene.add(bub); M.bub=bub;
  function wrap(t,n){ var w=t.split(' '), L=[], cur=''; w.forEach(function(p){ if((cur+' '+p).trim().length>n&&cur){ L.push(cur); cur=p; } else cur=(cur+' '+p).trim(); }); if(cur) L.push(cur); return L; }
  function drawBub(t,sing){ var L=wrap(t,26).slice(0,5), lh=40, h=L.length*lh+44; bx.clearRect(0,0,640,260);
    var y0=260-h-22, r=22; bx.fillStyle=sing?'#FFF4DD':'#ffffff'; bx.strokeStyle='#F29A2E'; bx.lineWidth=5;
    bx.beginPath(); bx.moveTo(20+r,y0); bx.arcTo(620,y0,620,y0+h,r); bx.arcTo(620,y0+h,20,y0+h,r); bx.lineTo(340,y0+h); bx.lineTo(320,y0+h+20); bx.lineTo(300,y0+h); bx.arcTo(20,y0+h,20,y0,r); bx.arcTo(20,y0,620,y0,r); bx.closePath(); bx.fill(); bx.stroke();
    bx.fillStyle='#0A1B4D'; bx.font=(sing?'italic ':'')+'700 31px '+FONT_C; bx.textAlign='center'; bx.textBaseline='middle';
    L.forEach(function(l,i){ bx.fillText(l,320,y0+22+lh/2+i*lh); }); btx.needsUpdate=true; bub.scale.set(3.6,3.6*260/640,1); }

  /* ---- notinhas musicais ---- */
  ['♪','♫','♪'].forEach(function(s,i){ var cv=document.createElement('canvas'); cv.width=cv.height=64; var x=cv.getContext('2d'); x.font='700 52px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=6; x.strokeStyle='#fff'; x.strokeText(s,32,34); x.fillStyle=i===1?'#1B46C2':'#F29A2E'; x.fillText(s,32,34);
    var tx=new T.CanvasTexture(cv); tx.encoding=T.sRGBEncoding; var sp=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthTest:false})); sp.renderOrder=8; sp.scale.setScalar(.5); sp.visible=false; scene.add(sp); M.notes.push({s:sp,t:9,d:i*.45}); });

  /* ---- voz ---- */
  function canHear(force){ return SFX.isOn()&&(!M.mute||force); }
  // um só elemento de áudio, destravado no primeiro toque (o iPhone bloqueia áudio que começa sem toque)
  var AU=new Audio(); AU.preload='auto'; var unl=false;
  function unlock(){ if(unl) return; unl=true; try{ AU.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; var pr=AU.play(); if(pr&&pr.then) pr.then(function(){ AU.pause(); },function(){}); }catch(e){} }
  ['pointerdown','keydown','touchend'].forEach(function(ev){ document.addEventListener(ev,unlock,{once:true,capture:true}); });
  function stopVoice(){ if(M.au){ try{ M.au.pause(); }catch(e){} M.au=null; } if(M.speak){ if(M.speak.audio) SFX.duck(false); M.speak=null; } bub.visible=false; }
  // fala: mostra o balão (ou não, se o texto estiver no painel) e toca o áudio, se houver. Retorna a duração.
  function say(id,o){ o=o||{}; stopVoice(); var txt=falaTxt(id), a=AUD[id], d=a&&a.d?a.d:Math.max(1.6,0.9+txt.length*0.058), audio=false;
    if(a&&a.s&&canHear(o.force)){ var au=AU; try{ au.pause(); au.src=a.s; au.currentTime=0; }catch(e){} M.au=au; audio=true; au.onended=function(){ if(M.au===au) M.au=null; if(o.end) o.end(); };
      var pr=au.play(); if(pr&&pr.then) pr.then(null,function(){ if(M.au===au){ M.au=null; if(M.speak){ M.speak.audio=false; M.speak.t=0; } } }); }
    M.speak={id:id,t:0,d:d,env:a&&a.e||'',audio:audio,sing:!!o.sing}; if(audio) SFX.duck(true);
    if(!o.panel){ drawBub(txt,o.sing); bub.visible=true; }
    return {d:d,audio:audio}; }
  M.say=say; M.stop=stopVoice;

  /* ---- sequência e ações ---- */
  function at(s,fn){ M.q.push({t:M.clk+s,fn:fn}); }
  function act(name,dur,upd,done){ M.act={n:name,t:0,dur:dur,upd:upd,done:done}; }
  function face(x,z){ return Math.atan2(x-c.g.position.x,z-c.g.position.z); }
  function turnTo(y,k){ var d=y-c.g.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); c.g.rotation.y+=d*k; }
  function resetPose(){ c.g.rotation.x=0; c.g.position.y=0; c.body.position.y=0; c.body.rotation.set(0,0,0); [c.lL,c.lR].forEach(function(l){ l.hip.rotation.z=0; }); }

  var tl=null; regua.children.forEach(function(o){ if(o.isSprite&&Math.abs(o.position.y-7.0)<0.01) tl=o; });   // rótulo do topo da régua
  var FOTO=(typeof MEN_FOTO!=='undefined'&&MEN_FOTO)||'';   // retrato do menino (menino/retrato.jpg), se houver
  function npcBox(t){ return '<div class="npc"><div class="av" style="'+(FOTO?'background:#8CC4EC url('+FOTO+') center/cover;border:2px solid #F29A2E;width:46px;height:46px;flex-basis:46px':'background:#F29A2E')+'" aria-hidden="true">'+(FOTO?'':MENINO.nome.slice(0,1))+'</div><div class="tx"><span class="npcn">'+MENINO.nome+' <span style="color:var(--muted);text-transform:none;letter-spacing:0;font-weight:500">· '+MENINO.papel+'</span></span><p>'+t+'</p></div></div>'; }

  /* ---- entrada: do alto da régua até a entrevistadora ---- */
  var RTOP=5.9*regua.scale.y;   // altura do topo da régua acima da base
  // lugar livre para pousar: sem obstáculo e longe das pessoas visíveis
  function okSpot(x,z){ if(NAV.blocked(x,z)) return false; return Object.keys(NPC).every(function(k){ var g=NPC[k].g; return !g.visible||Math.hypot(g.position.x-x,g.position.z-z)>1.3; })&&
    (typeof cows==='undefined'||cows.every(function(w){ return Math.hypot(w.g.position.x-x,w.g.position.z-z)>1.4; })); }
  function intro(done){
    M.q=[]; M.act=null; M.clk=0; M.st='intro'; M.done=done; G.mode='cine'; objEl.hidden=true; $('gmen').hidden=false;
    var P=player.position, rot=player.rotation.y, fx=Math.sin(rot), fz=Math.cos(rot), rx=fz, rz=-fx, L=null, J=null;
    // tenta pousar ao lado dela (frente-direita, direita, frente-esquerda, esquerda...), rolando um pouco a partir da régua
    function far(x,z){ var m=9; Object.keys(NPC).forEach(function(k){ var g=NPC[k].g; if(g.visible) m=Math.min(m,Math.hypot(g.position.x-x,g.position.z-z)); }); return m; }
    var best=-1;
    [[1.4,2.1],[0.2,2.3],[1.4,-2.1],[0.2,-2.3],[2.2,1.0],[2.2,-1.0],[-0.8,2.3],[-0.8,-2.3]].forEach(function(o,i){
      var x=P.x+fx*o[0]+rx*o[1], z=P.z+fz*o[0]+rz*o[1]; if(!okSpot(x,z)) return;
      var dl=Math.hypot(x,z)||1, ux=x/dl, uz=z/dl, roll=1.2; while(roll>0.2&&!okSpot(x-ux*roll,z-uz*roll)) roll-=0.2;
      var jx=x-ux*roll, jz=z-uz*roll, sc=Math.min(2.4,far(x,z),far(jx,jz))-i*0.01;   // prefere longe das pessoas, na ordem da lista
      if(sc>best){ best=sc; L={x:x,z:z}; J={x:jx,z:jz}; } });
    if(!L){ L=NAV.free(P.x+2.0,P.z-1.4); J={x:L.x,z:L.z}; }
    M.L=L;
    // a régua ainda não apareceu (prólogo): sobe trazendo o menino e depois volta para o fundo
    var temp=!regua.visible||regua.position.y<-1, wait=0;
    if(temp){ M.tempRegua=true; regua.visible=true; regua.position.y=-9; regua.userData.goal=0; wait=2.6; SFX.whoosh(); setTimeout(splash,300); }
    function top(){ return regua.position.y+RTOP; }
    resetPose(); c.g.position.set(0,top(),0); c.g.rotation.y=face(P.x,P.z); c.g.visible=true; if(tl) tl.visible=false; M.ride=temp;
    var mid={x:(L.x+P.x)/2,z:(L.z+P.z)/2}, shotB=[mid.x+4.6,3.5,mid.z+5.4], lookB=[mid.x,0.9,mid.z];
    cineTo([5,9.6,9],[0,RTOP+0.7,0],1.6,null,{hold:true});
    at(1.7+wait,function(){ M.ride=false; var r=say('01'), y1=top(); act('wave',Math.max(1.8,r.d),function(k,t){ c.aR.sh.rotation.z=2.5+Math.sin(t*14)*.35; c.aR.el.rotation.z=.3; c.g.position.y=y1+Math.abs(Math.sin(t*6))*.12; });
      at(Math.max(1.8,r.d)+0.25,function(){ c.aR.el.rotation.z=0; jump(); }); });
    function jump(){ say('02'); var x0=0,z0=0,y0=top(), H=4.2, dur=1.5; c.g.rotation.y=face(J.x,J.z);
      if(M.tempRegua) setTimeout(function(){ regua.userData.goal=-9; },500);   // a régua volta para o fundo; ela aparece de novo em “Chamar a régua”
      CAM.cine=null; CAM.path=null; CAM.orbit=false; CAM.fixed={p:V(shotB[0],shotB[1],shotB[2]),l:V(0,y0+0.8,0)};   // a câmera acompanha o salto
      act('fly',dur,function(k,t){ c.g.position.set(x0+(J.x-x0)*k,y0*(1-k)+4*H*k*(1-k),z0+(J.z-z0)*k); if(CAM.fixed) CAM.fixed.l.set(c.g.position.x,c.g.position.y+0.8,c.g.position.z);
          c.aL.sh.rotation.z=-2.3+Math.sin(t*22)*.6; c.aR.sh.rotation.z=2.3-Math.sin(t*22)*.6; c.lL.hip.rotation.x=Math.sin(t*18)*.7; c.lR.hip.rotation.x=-Math.sin(t*18)*.7; c.g.rotation.x=k>0.55?(k-0.55)/0.45*0.5:0; },
        function(){ tumble(); }); }
    function tumble(){ SFX.stamp(); CAM.fixed={p:V(shotB[0],shotB[1],shotB[2]),l:V(lookB[0],lookB[1],lookB[2])}; for(var i=0;i<6;i++) puff(J.x+(Math.random()-.5),J.z+(Math.random()-.5));
      var h=c.H*0.4; act('roll',0.6,function(k){ var a=0.5+k*(Math.PI*2-0.5), px=J.x+(L.x-J.x)*k, pz=J.z+(L.z-J.z)*k, s=Math.sin(c.g.rotation.y), co=Math.cos(c.g.rotation.y);
          c.g.rotation.x=a; var oy=h*Math.cos(a), oz=h*Math.sin(a); c.g.position.set(px-s*oz,h-oy,pz-co*oz); c.aL.sh.rotation.z=-.3; c.aR.sh.rotation.z=.3; c.lL.hip.rotation.x=c.lR.hip.rotation.x=-1.2; },
        function(){ resetPose(); for(var i=0;i<5;i++) puff(L.x+(Math.random()-.5)*.8,L.z+(Math.random()-.5)*.8); sit(); }); }
    function sit(){ var sy=-(c.hipL-0.07); act('sit',0.9,function(k,t){ c.body.position.y=sy; c.lL.hip.rotation.x=c.lR.hip.rotation.x=-1.45; c.lL.knee.rotation.x=c.lR.knee.rotation.x=.2; c.head.rotation.z=Math.sin(t*9)*.18*(1-k); c.aL.sh.rotation.z=-.5; c.aR.sh.rotation.z=.5; },
      function(){ c.head.rotation.z=0; up(); }); }
    function up(){ var sy=-(c.hipL-0.07); act('up',0.4,function(k){ c.body.position.y=sy*(1-k); c.lL.hip.rotation.x=c.lR.hip.rotation.x=-1.45*(1-k); }, function(){ resetPose(); brush(); }); }
    function brush(){ c.g.rotation.y=face(P.x,P.z); var r=say('03'), dur=Math.max(2.0,r.d);
      act('brush',dur,function(k,t){ var a=Math.sin(t*11), b=Math.sin(t*11+Math.PI); c.aL.sh.rotation.x=-.55+a*.25; c.aL.el.rotation.x=-1.25; c.aR.sh.rotation.x=-.55+b*.25; c.aR.el.rotation.x=-1.25; c.aL.sh.rotation.z=-.2; c.aR.sh.rotation.z=.2;
          c.body.rotation.x=.12; if(Math.random()<dur*0.02) puff(c.g.position.x+(Math.random()-.5)*.6,c.g.position.z+(Math.random()-.5)*.6); },
        function(){ c.body.rotation.x=0; player.rotation.y=Math.atan2(L.x-P.x,L.z-P.z); talkLines(['04','05','06','07','08','09','10','11'],0); }); }
    function talkLines(ids,i){ var id=ids[i], last=i===ids.length-1, adv=false;
      var a1=face(P.x,P.z), a2=face(camera.position.x,camera.position.z), dA=Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)); c.g.rotation.y=a1+dA*0.6;   // fala com ela, de três quartos para a câmera
      function next(){ if(adv) return; adv=true; stopVoice(); if(last) finish(true); else talkLines(ids,i+1); }
      var r=say(id,{panel:true,end:function(){ setTimeout(next,450); }}); NPC_TALK=true;
      panel(npcBox(falaTxt(id))+chs([[last?'Bora! ›':'Continuar ›',next,true],['Pular apresentação',skip]],true)); }
  }
  var NPC_TALK=false;
  function skip(){ if(M.st!=='intro') return; stopVoice(); M.q=[]; M.act=null; M.ride=false; if(M.tempRegua) regua.userData.goal=-9; resetPose(); var L=M.L; c.g.position.set(L.x,0,L.z); c.g.rotation.y=face(player.position.x,player.position.z); finish(false); }
  function finish(happy){ NPC_TALK=false; closePanel(); releaseCam(); if(tl) tl.visible=true; M.st='follow'; M.lastP={x:player.position.x,z:player.position.z}; M.trail=[{x:c.g.position.x,z:c.g.position.z},{x:player.position.x,z:player.position.z}]; M.path=null; M.anc=null; M.idleT=0; M.saidIdle=false; M.singT=35+Math.random()*20;
    if(happy) hop(1,0.55,1.0); if(CAM.user<0.5) zset(0.5);   // câmera a meia distância, para ver o menino
    var d=M.done; M.done=null; if(d) d(); }
  M.intro=intro;

  /* ---- brincadeiras ---- */
  function hop(n,h,dur){ act('hop',dur,function(k){ var u=(k*n)%1; c.g.position.y=4*h*u*(1-u); c.aL.sh.rotation.z=-1.2*Math.sin(k*Math.PI); c.aR.sh.rotation.z=1.2*Math.sin(k*Math.PI); },function(){ c.g.position.y=0; }); }
  function play(quiet){ var r=quiet?0.22+Math.random()*0.78:Math.random(), y0=c.g.rotation.y;
    if(r<0.12&&M.jumps<4&&!M.speak){ M.jumps++; if(!M.mute) say('18'); act('big',1.0,function(k){ c.g.position.y=4*1.3*k*(1-k); c.aL.sh.rotation.z=-2.6; c.aR.sh.rotation.z=2.6; c.lL.hip.rotation.x=c.lR.hip.rotation.x=-.6*Math.sin(k*Math.PI); },function(){ c.g.position.y=0; for(var i=0;i<3;i++) puff(c.g.position.x,c.g.position.z); }); }
    else if(r<0.2&&M.trips<2&&!M.speak){ var fx=Math.sin(y0)*.7, fz=Math.cos(y0)*.7, gx=c.g.position.x+fx, gz=c.g.position.z+fz; if(NAV.blocked(gx,gz)) return hop(2,.3,.9); M.trips++; if(!M.mute) say('19'); var sx=c.g.position.x, sz=c.g.position.z;
      act('trip',1.1,function(k,t){ var e=Math.min(1,k*1.6); c.g.position.x=sx+fx*e; c.g.position.z=sz+fz*e; c.body.rotation.x=Math.sin(Math.min(1,k*1.4)*Math.PI)*.55; c.aL.sh.rotation.x=-2+Math.sin(t*20)*.8; c.aR.sh.rotation.x=-2-Math.sin(t*20)*.8; },function(){ c.body.rotation.x=0; M.path=null; }); }
    else if(r<0.42) act('spin',0.9,function(k){ c.g.rotation.y=y0+k*Math.PI*2; c.g.position.y=4*.45*k*(1-k); c.aL.sh.rotation.z=-1.4; c.aR.sh.rotation.z=1.4; },function(){ c.g.rotation.y=y0; c.g.position.y=0; });
    else if(r<0.62) act('jacks',1.6,function(k,t){ var u=Math.abs(Math.sin(t*Math.PI*2.5)); c.g.position.y=Math.abs(Math.sin(t*Math.PI*5))*.18; c.lL.hip.rotation.z=-.35*u; c.lR.hip.rotation.z=.35*u; c.aL.sh.rotation.z=-2.7*u-.1; c.aR.sh.rotation.z=2.7*u+.1; },function(){ resetPose(); });
    else if(r<0.8){ var cy=Math.atan2(camera.position.x-c.g.position.x,camera.position.z-c.g.position.z); act('wave',1.6,function(k,t){ turnTo(cy,.15); c.aR.sh.rotation.z=2.5+Math.sin(t*14)*.35; },null); }
    else hop(3,.28,1.2); }
  function sing(){ var id=['12','13','14'][M.songI++%3], r=say(id,{sing:true}); M.notes.forEach(function(n){ n.t=-n.d; n.s.visible=false; }); M.singD=r.d; M.singing=r.d; }

  /* ---- eventos do jogo ---- */
  window.menEvent=function(ev){
    if(ev==='reset'){ stopVoice(); if($('gmen')) $('gmen').hidden=true; if(M.tempRegua){ regua.visible=false; regua.position.y=-9; regua.userData.glow.visible=false; M.tempRegua=false; } M.ride=false; M.st='off'; M.q=[]; M.act=null; c.g.visible=false; resetPose(); M.trips=0; M.jumps=0; M.arrN=0; M.evN=0; if(tl) tl.visible=true; return; }
    if(M.st==='off') return;
    if(ev==='arrive'){ M.arrN++; if(M.arrN%2===1&&!M.mute) say('15'); }
    else if(ev==='case'){ if(G.caseI>=CASES.length) setTimeout(function(){ say('20',{force:true}); },700);
      else if(G.evid.length>M.evN&&!M.mute&&Math.random()<0.6) setTimeout(function(){ say('17'); },700); M.evN=G.evid.length; }
    else if(ev==='mesa'){ M.st='still'; M.path=null; M.act=null; resetPose(); c.g.position.set(MESA.x-2.5,0,MESA.z-3.4); c.g.rotation.y=0.15; setTimeout(function(){ say('21',{force:true}); },1500); }
    else if(ev==='end'){ setTimeout(function(){ say('22',{force:true}); hop(4,.4,1.8); },1200); }
  };

  /* ---- seguir pelo rastro, sem atravessar nada (usa a mesma grade de caminhada) ---- */
  function anchor(D){ var T2=M.trail, p={x:player.position.x,z:player.position.z}, acc=0, prev=p;
    for(var i=T2.length-1;i>=0;i--){ var q=T2[i], d=Math.hypot(q.x-prev.x,q.z-prev.z); if(acc+d>=D){ var u=(D-acc)/(d||1); return {x:prev.x+(q.x-prev.x)*u,z:prev.z+(q.z-prev.z)*u}; } acc+=d; prev=q; }
    return {x:prev.x,z:prev.z}; }
  // alvo: um ponto do rastro dela, ~1,9 m atrás, que esteja livre (sem gente nem gado em cima)
  function spot(){ var D=[1.9,2.5,1.4,3.1,3.8]; for(var i=0;i<D.length;i++){ var a=anchor(D[i]); if(okSpot(a.x,a.z)) return a; } return anchor(1.9); }
  function cancelAct(){ M.act=null; resetPose(); c.g.position.y=0; }
  // reaparece atrás dela (último recurso: quando fica preso ou muito longe), com poeirinha
  function rejoin(){ var P=player.position, ry=player.rotation.y, f=null;
    [1.9,2.6,1.3,3.2].some(function(d){ var a=anchor(d); if(okSpot(a.x,a.z)){ f=a; return true; } var b={x:P.x-Math.sin(ry)*d,z:P.z-Math.cos(ry)*d}; if(okSpot(b.x,b.z)){ f=b; return true; } return false; });
    if(!f) f=NAV.free(P.x-Math.sin(ry)*1.9,P.z-Math.cos(ry)*1.9);
    for(var i=0;i<3;i++) puff(c.g.position.x,c.g.position.z);
    cancelAct(); c.g.position.set(f.x,0,f.z); M.trail=[{x:f.x,z:f.z},{x:P.x,z:P.z}]; M.path=null; M.ev=null; M.stk=0; for(var k=0;k<3;k++) puff(f.x,f.z); }
  function follow(dt,tt){
    var P=player.position, moving=!!G.target, px=P.x, pz=P.z;
    if(Math.hypot(px-M.lastP.x,pz-M.lastP.z)>3){ M.lastP={x:px,z:pz}; rejoin(); }   // ela foi levada para longe (voo, troca de cena)
    var vx=px-M.lastP.x, vz=pz-M.lastP.z; M.lastP={x:px,z:pz};
    var T2=M.trail, lt=T2[T2.length-1]; if(!lt||Math.hypot(px-lt.x,pz-lt.z)>0.15){ T2.push({x:px,z:pz}); if(T2.length>260) T2.shift(); }
    var bx=c.g.position.x, bz=c.g.position.z, dp=Math.hypot(bx-px,bz-pz);
    if(dp>14){ rejoin(); bx=c.g.position.x; bz=c.g.position.z; dp=Math.hypot(bx-px,bz-pz); }
    // brincadeira não segura o menino: se ela sai andando, ele larga e vai atrás
    if(M.act&&(moving&&dp>1.6||dp>3.5)) cancelAct();
    // sai da frente se ela vier na direção dele (com prazo: se não der, desiste e volta a seguir)
    if(moving&&dp<0.9&&(vx*(bx-px)+vz*(bz-pz))>0&&!M.ev){ var n=Math.hypot(vx,vz)||1, sx=-vz/n, sz=vx/n; [1,-1].some(function(sg){ var tx=bx+sx*sg*1.3, tz=bz+sz*sg*1.3; if(okSpot(tx,tz)){ M.ev={x:tx,z:tz,t:0}; M.path=null; return true; } return false; }); }
    if(M.ev){ M.ev.t+=dt; if(M.ev.t>1.2||dp>2.2){ M.ev=null; M.path=null; } }
    var A=M.ev||spot(), da=Math.hypot(A.x-bx,A.z-bz);
    if(M.ev&&da<0.25){ M.ev=null; M.path=null; A=spot(); da=Math.hypot(A.x-bx,A.z-bz); }
    var walking=false, step=0;
    if(da>0.35&&!(M.act&&M.act.n!=='wave')){
      M.pT-=dt; if(!M.path||!M.path.length||!M.anc||Math.hypot(A.x-M.anc.x,A.z-M.anc.z)>0.6||M.pT<=0){ M.path=NAV.plan(bx,bz,A.x,A.z); M.anc=A; M.pT=0.7; }
      if(M.path&&M.path.length){ var v=Math.min(da>6?12:9.5,Math.max(3.2,2.5+da*2.2)), rem=v*dt, nx=bx, nz=bz;
        while(rem>1e-6&&M.path.length){ var w=M.path[0], ddx=w.x-nx, ddz=w.z-nz, d=Math.hypot(ddx,ddz); if(d<=rem){ nx=w.x; nz=w.z; rem-=d; M.path.shift(); } else { nx+=ddx/d*rem; nz+=ddz/d*rem; rem=0; } }
        step=Math.hypot(nx-bx,nz-bz);
        if(step>1e-5){ turnTo(Math.atan2(nx-bx,nz-bz),Math.min(1,dt*12)); walking=true; }
        c.g.position.x=nx; c.g.position.z=nz; }
      // preso: quer andar e não sai do lugar → replaneja; se continuar preso, reaparece atrás dela
      if(da>0.8&&step<0.25*dt){ M.stk=(M.stk||0)+dt; M.path=null; if(M.stk>1.5){ if(dp>2.6) rejoin(); else M.stk=0; } } else M.stk=Math.max(0,(M.stk||0)-dt*2);
    } else M.stk=0;
    if(walking){ if(M.act&&M.act.n==='wave') M.act=null; c.update(dt,true,tt,'idle',1.25); c.g.position.y=Math.abs(Math.sin(c.phase()))*.12; M.playT=2+Math.random()*3; }
    else { c.update(dt,false,tt,'idle'); if(!M.act){ turnTo(face(px,pz),Math.min(1,dt*4)); c.g.position.y*=.8; }
      var calm=dlg.hidden&&!moving;
      if(G.mode==='explore'&&calm){ M.playT-=dt; if(M.playT<=0&&!M.act){ play(); M.playT=3+Math.random()*3.5; } }
      else if(G.mode==='prologo'&&!moving){ M.playT-=dt; if(M.playT<=0&&!M.act){ play(true); M.playT=5+Math.random()*5; } } }   // no prólogo: brinca calado, sem atrapalhar a conversa
    // chama quando ela fica parada; canta de vez em quando
    if(G.mode==='explore'&&dlg.hidden&&!moving){ M.idleT+=dt; if(M.idleT>17&&!M.saidIdle&&!M.speak&&!M.mute&&G.caseI<CASES.length){ M.saidIdle=true; say('16'); hop(2,.35,.9); } } else { M.idleT=0; if(moving) M.saidIdle=false; }
    if(G.mode==='explore'&&dlg.hidden&&!M.mute){ M.singT-=dt; if(M.singT<=0&&!M.speak){ sing(); M.singT=45+Math.random()*30; } }
  }

  /* ---- laço do menino (chamado pelo motor) ---- */
  window.menTick=function(dt,tt){
    if(M.st==='off') return;
    if(M.ride) c.g.position.y=regua.position.y+RTOP;   // subindo junto com a régua
    if(M.tempRegua&&regua.userData.goal===-9&&regua.position.y<-8.6){ regua.visible=false; regua.userData.glow.visible=false; M.tempRegua=false; }
    M.clk+=dt; for(var i=M.q.length-1;i>=0;i--) if(M.q[i].t<=M.clk){ var f=M.q.splice(i,1)[0].fn; f(); }
    if(M.st==='follow'&&(G.mode==='explore'||G.mode==='arriving'||G.mode==='dialog'||G.mode==='cine'||G.mode==='prologo')) follow(dt,tt);
    else if(M.st==='intro'||M.st==='still'){ c.update(dt,false,tt,M.speak&&M.st==='intro'&&NPC_TALK?'talk':'idle'); if(M.st==='still'&&!M.act){ M.playT-=dt; if(M.playT<=0){ M.playT=4+Math.random()*4; if(Math.random()<0.5) hop(2,.3,.9); } } }
    if(M.act){ var a=M.act; a.t+=dt; var k=Math.min(1,a.t/a.dur); a.upd(k,a.t); if(k>=1&&M.act===a){ M.act=null; if(a.done) a.done(); } }
    // boca e balão
    var sp=M.speak, open=0; if(sp){ sp.t+=dt; if(sp.audio&&M.au){ var e=sp.env, ix=Math.floor(M.au.currentTime*20); open=e&&ix<e.length?(+e.charAt(ix))/9:0.5+0.5*Math.sin(tt*18); }
      else if(!sp.audio&&sp.t<sp.d) open=0.5+0.5*Math.sin(tt*17); if((sp.audio&&!M.au)||(!sp.audio&&sp.t>=sp.d)){ if(sp.audio) SFX.duck(false); M.speak=null; bub.visible=false; } }
    c.mouth.visible=open>0.05; c.mouth.scale.set(1,0.05+open*0.85,.4);
    if(bub.visible){ var hp=c.g.position; bub.position.set(hp.x,hp.y+c.H+0.75,hp.z); }
    M.notes.forEach(function(n){ if(n.t>=9) return; n.t+=dt; if(n.t<0) return; var u=n.t/1.6; if(u>=1){ if(M.speak&&M.speak.sing){ n.t=0; } else { n.t=9; n.s.visible=false; return; } u=0; }
      var hp=c.g.position; n.s.visible=true; n.s.position.set(hp.x+Math.sin(u*6+n.d*5)*.35+(n.d-.45)*.6,hp.y+c.H+0.3+u*1.4,hp.z); n.s.material.opacity=1-u; });
  };

  /* ---- botão para silenciar o menino ---- */
  function syncBtn(){ var b=$('gmen'); if(!b) return; b.setAttribute('aria-pressed',M.mute?'false':'true'); b.title=M.mute?'Ligar a voz e a cantoria do '+MENINO.nome:'Silenciar o '+MENINO.nome; b.style.opacity=M.mute?.5:1; }
  if($('gmen')){ $('gmen').addEventListener('click',function(){ M.mute=!M.mute; try{ localStorage.setItem('regua_menino',M.mute?'0':'1'); }catch(e){} if(M.mute&&M.speak&&M.st!=='intro') stopVoice(); syncBtn(); }); syncBtn(); }
})();
