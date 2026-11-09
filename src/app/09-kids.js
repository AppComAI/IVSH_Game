/* ===================== MODO ESCOLA (piloto): "Guardiões do Açude" ===================== */
var KCOL=['#3FAE5A','#F2C230','#F08A24','#D9432F'], KWORD=['Tudo bem','Atenção','Preocupa','Grave'], KHEX=[0x3FAE5A,0xF2C230,0xF08A24,0xD9432F];
var KGOTAS=8;
var K={on:false,found:{},ans:{},plan:{},busy:false,goal:-1,idle:0,now:0,q:[],an:[],added:[],undo:[],hold:null,speak:0,hint:false,regOrig:null,regFaces:[],mark:null};

/* --- carinha desenhada em canvas (sem fonte de emoji) --- */
function faceCanvas(e,color,S){ var c=document.createElement('canvas'); c.width=c.height=S; var x=c.getContext('2d'), k=S/100; x.scale(k,k);
  x.fillStyle=color; x.strokeStyle='#0A1B4D'; x.lineWidth=4; x.beginPath(); x.arc(50,50,46,0,7); x.fill(); x.stroke();
  x.fillStyle='#0A1B4D'; x.beginPath(); x.arc(35,42,6,0,7); x.fill(); x.beginPath(); x.arc(65,42,6,0,7); x.fill();
  x.lineCap='round'; x.lineJoin='round'; x.lineWidth=5;
  if(e===0){ x.fillStyle='#fff'; x.lineWidth=4; x.beginPath(); x.moveTo(27,55); x.quadraticCurveTo(50,86,73,55); x.closePath(); x.fill(); x.stroke(); }
  else if(e===1){ x.beginPath(); x.moveTo(31,60); x.quadraticCurveTo(50,76,69,60); x.stroke(); }
  else if(e===2){ x.beginPath(); x.moveTo(34,68); x.lineTo(66,68); x.stroke(); x.lineWidth=4; x.beginPath(); x.moveTo(25,34); x.lineTo(39,29); x.moveTo(75,34); x.lineTo(61,29); x.stroke(); }
  else { x.beginPath(); x.moveTo(31,74); x.quadraticCurveTo(50,55,69,74); x.stroke(); x.lineWidth=4.5; x.beginPath(); x.moveTo(24,31); x.lineTo(40,37); x.moveTo(76,31); x.lineTo(60,37); x.stroke(); }
  return c; }
function faceSprite(e,sz){ var t=new T.CanvasTexture(faceCanvas(e,KCOL[e],128)); t.encoding=T.sRGBEncoding; var s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(sz,sz,1); s.renderOrder=7; return s; }

/* --- pistas --- */
var PISTAS=[
 {id:'mata',nome:'Mata da beira',nivel:2,pos:shore(3.4,2.0),vp:function(){ return PHOTO['D1.1'](); },
  txt:'Na beira do açude só tem algumas árvores, bem separadas. Entre elas, o chão está pelado.',
  why:'A mata da beira segura a terra e segura também o que escorre para a água. Com poucas árvores, ela protege pouco.',acao:'mata'},
 {id:'lixo',nome:'Lixo na beira',nivel:3,pos:shore(C2a,1.4),vp:function(){ return PHOTO['D2.5'](); },
  txt:'Tem lixo espalhado bem perto da água: sacolas, garrafas e latas. Não vejo nenhuma lixeira.',
  why:'A chuva leva o lixo da beira para dentro do açude. Sem lixeira por perto, ele só aumenta.',acao:'lixo'},
 {id:'gado',nome:'Gado na água',nivel:2,pos:shore(C4a+0.15,0.9),vp:function(){ return PHOTO['D2.3'](); },
  txt:'Algumas vacas entram na água para beber. Perto delas tem esterco e a terra está toda pisada.',
  why:'O esterco chega à água e a terra pisada se solta. Um bebedouro longe da margem ajuda.',acao:'gado'},
 {id:'erosao',nome:'Terra descendo',nivel:2,pos:erP,vp:function(){ var c=shore(-1.36,-5.5); return [[c.x,2.4,c.z],[erP.x,.2,erP.z]]; },
  txt:'O chão tem sulcos fundos, como riozinhos de terra seca. Quando chove, a terra desce para a água.',
  why:'Quando a terra desce, o açude vai ficando mais raso e mais barrento.',acao:'erosao'},
 {id:'boa',nome:'Mata bem cuidada',nivel:0,pos:shore(-0.2,1.6),vp:function(){ var c=shore(-0.2,-5.2), l=shore(-0.2,1.6); return [[c.x,2.2,c.z],[l.x,1.0,l.z]]; },
  txt:'Aqui as árvores são muitas e ficam juntinhas. O chão tem sombra e folhas.',
  why:'É assim que a gente quer a beira do açude: coberta e protegida. Também vale anotar o que está bom!',acao:null},
 {id:'sede',nome:'Sede fechada',nivel:null,pos:sedeP,vp:function(){ var c=shore(C3a,2.4); return [[c.x,1.8,c.z],[sedeP.x,1.2,sedeP.z]]; },
  txt:'Esta é a sede da associação de moradores. A porta e as janelas estão fechadas. Dizem que lá dentro tem um caderno com as reuniões sobre o açude.',
  why:'Você não viu o caderno, então não dá nota. “Não vi, não chuto.” Esse item fica fora da conta e, na próxima visita, a gente pede para ver.',acao:'sede'}
];
var ACOES=[
 {id:'lixo',nome:'Lixeiras e mutirão de limpeza',custo:3,pista:'lixo',novo:1,desc:'Tirar o lixo da beira e colocar lixeiras.',at:function(){ return shore(C2a,1.4); }},
 {id:'gado',nome:'Cerca e bebedouro longe da água',custo:2,pista:'gado',novo:0,desc:'O gado bebe num cocho, fora do açude.',at:function(){ return shore(C4a,2.4); }},
 {id:'erosao',nome:'Barraginhas e plantas na terra',custo:2,pista:'erosao',novo:1,desc:'Pequenas bacias seguram a terra e a água da chuva.',at:function(){ return erP; }},
 {id:'mata',nome:'Plantar a mata da beira',custo:3,pista:'mata',novo:0,desc:'Mudas de árvores nativas na margem.',at:function(){ return shore(3.4,2.4); }},
 {id:'sede',nome:'Abrir a sede e mostrar os dados',custo:1,pista:null,desc:'A associação mostra o caderno. Na próxima visita dá para ver.',at:function(){ return sedeP; }}
];
var PM=[]; /* marcadores 3D das pistas */
(function(){ PISTAS.forEach(function(p,i){ var g=new T.Group(); g.position.set(p.pos.x,0,p.pos.z); g.visible=false;
  var beamM=new T.MeshBasicMaterial({color:0xFFC233,transparent:true,opacity:.22,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  g.add(mesh(new T.CylinderGeometry(.55,.9,5,16,1,true),beamM,0,2.5,0));
  var ring=mesh(new T.RingGeometry(.9,1.25,36),new T.MeshBasicMaterial({color:0xFFC233,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending}),0,.12,0); ring.rotation.x=-Math.PI/2; g.add(ring);
  var q=label('?',{w:96,h:96,size:64,bg:'#FFC233',border:'#0A1B4D',scale:.95,depth:false}); q.position.y=3.0; g.add(q);
  var ok=label('✓',{w:96,h:96,size:64,bg:'#3FAE5A',border:'#0A1B4D',fg:'#fff',scale:.95,depth:false}); ok.position.y=3.0; ok.visible=false; g.add(ok);
  var hit=mesh(new T.CylinderGeometry(1.8,1.8,5,10),new T.MeshBasicMaterial({visible:false}),0,2.5,0); hit.userData={kind:'pista',i:i}; g.add(hit); pickables.push(hit);
  scene.add(g); PM.push({g:g,beam:beamM,ring:ring,q:q,ok:ok}); }); })();

/* --- garça-guia (mascote) --- */
var GG=makeGarca(true); GG.scale.setScalar(.62); GG.visible=false;
GG.traverse(function(o){ if(o.isMesh){ o.material.depthTest=false; o.renderOrder=20; } });
var GGv=new T.Vector3(), GGq=new T.Quaternion(), GGe=new T.Euler();
function ggTick(dt,tt){ if(!GG.visible) return; var u=GG.userData, f=5.5+(K.speak>0?3:0), amp=.55;
  u.wings.forEach(function(w){ w.p.rotation.x=w.sd*(Math.sin(tt*f)*amp+.15); });
  var tx,ty,tz; GG.scale.setScalar(camera.aspect<1?.46:.62);
  if(K.hint&&K.hintAt){ GGv.set(K.hintAt.x+Math.cos(tt*.8)*1.2,3.4+Math.sin(tt*2)*.25,K.hintAt.z+Math.sin(tt*.8)*1.2); GG.position.lerp(GGv,Math.min(1,dt*2)); GG.rotation.set(0,-tt*.8-Math.PI/2,.1); return; }
  var asp=camera.aspect, dx=-Math.min(2.3,1.55*asp*.62), dy=.95+Math.sin(tt*2.2)*.12+(K.speak>0?Math.sin(tt*14)*.05:0);
  GGv.set(dx,dy,-4.2).applyMatrix4(camera.matrixWorld); GG.position.lerp(GGv,Math.min(1,dt*(K.fresh?30:9))); K.fresh=false;
  GGe.set(0,-.5,Math.sin(tt*2.2)*.08); GGq.setFromEuler(GGe); GG.quaternion.copy(camera.quaternion).multiply(GGq);
  u.head.position.y=.45+(K.speak>0?Math.sin(tt*12)*.05:0); if(K.speak>0) K.speak-=dt; }
var G_AV='<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><ellipse cx="17" cy="27" rx="11" ry="6.5" fill="#fff" stroke="#0A1B4D" stroke-width="1.6"/><path d="M24 24 Q30 17 28 10" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M24 24 Q30 17 28 10" fill="none" stroke="#0A1B4D" stroke-width="1.2" stroke-linecap="round" opacity=".5"/><circle cx="28" cy="9" r="3.6" fill="#fff" stroke="#0A1B4D" stroke-width="1.4"/><path d="M31 8 L38 10 L31 11.5 Z" fill="#F2C14E" stroke="#0A1B4D" stroke-width="1"/><circle cx="28.6" cy="8.2" r="1" fill="#0A1B4D"/></svg>';
function say(text,quiet){ K.speak=quiet?0:2.2; if(!quiet) SFX.garca(); return '<div class="npc"><div class="av" style="background:#DCE6FA;border:2px solid #0A1B4D" aria-hidden="true">'+G_AV+'</div><div class="tx"><span class="npcn">Garça-guia <span style="color:var(--muted);text-transform:none;letter-spacing:0;font-weight:500">· sua companheira</span></span><p>'+text+'</p></div></div>'; }
function facesBtns(onPick,naFn){ return '<div class="kfaces" role="group" aria-label="Quanto isso preocupa?">'+[0,1,2,3].map(function(e){ return '<button type="button" class="kface" data-h="'+H(function(){ onPick(e); })+'">'+faceSVG(e,KCOL[e],54,KWORD[e])+'<b>'+e+'</b><span>'+KWORD[e]+'</span></button>'; }).join('')+'</div>'+
  (naFn?'<div class="chs" style="margin-top:6px">'+btn('<b>Não vi</b> · não dá para saber <small>Sem evidência, sem nota: “não vi, não chuto”.</small>',naFn)+'</div>':''); }

/* --- agenda e animações do modo --- */
function after(s,fn){ K.q.push({t:K.now+s,fn:fn}); }
function anim(delay,dur,fn,done){ K.an.push({d:delay,t:0,dur:dur,fn:fn,done:done}); }
function backOut(k){ var c=1.70158; return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2); }
kidsTick=function(dt,tt){ if(!K.on) return; K.now+=dt;
  for(var i=K.q.length-1;i>=0;i--) if(K.q[i].t<=K.now){ var f=K.q.splice(i,1)[0].fn; f(); }
  for(i=K.an.length-1;i>=0;i--){ var a=K.an[i]; if(a.d>0){ a.d-=dt; continue; } a.t+=dt; var k=Math.min(1,a.t/a.dur); a.fn(k); if(k>=1){ K.an.splice(i,1); if(a.done) a.done(); } }
  ggTick(dt,tt);
  PM.forEach(function(m,i){ if(!m.g.visible) return; m.q.position.y=3.0+Math.sin(tt*2.4+i)*.18; m.ok.position.y=m.q.position.y; m.ring.scale.setScalar(1+.18*Math.sin(tt*3+i)); m.beam.opacity=(K.busy?.05:(K.found[PISTAS[i].id]?.1:.2+.08*Math.sin(tt*2.5+i))); });
  if(K.mode==='hunt'&&!K.busy){ K.idle+=dt; if(K.idle>22&&!K.hint){ var nx=PISTAS.filter(function(p){ return !K.found[p.id]; })[0]; if(nx){ K.hint=true; K.hintAt=nx.pos; toast('A garça está mostrando onde olhar'); } } if(K.goal>=0){ var p=PISTAS[K.goal], dx=p.pos.x-player.position.x, dz=p.pos.z-player.position.z; if(dx*dx+dz*dz<3.4*3.4){ var g=K.goal; K.goal=-1; G.target=null; openPista(g); } } } };

/* --- hud: cartas na mão --- */
var khand=document.createElement('div'); khand.className='khand'; khand.hidden=true; gbox.appendChild(khand);
function drawHand(){ khand.innerHTML=PISTAS.map(function(p){ var f=K.found[p.id], lv=f?(p.nivel==null?null:p.nivel):undefined;
  return '<i class="'+(f?'got':'')+'" title="'+(f?p.nome:'Pista ainda não encontrada')+'">'+(f?(lv==null?'<span class="nv">?</span>':faceSVG(lv,KCOL[lv],26,KWORD[lv])):'')+'</i>'; }).join('')+'<em>'+Object.keys(K.found).length+'/'+PISTAS.length+' cartas</em>'; }
function setObj(t){ objEl.hidden=!t; objEl.innerHTML=t||''; }

/* --- fluxo --- */
function startKids(){
  if(window.menEvent) menEvent('reset');
  K.autoPrev=CAM.auto; K.full=!$('gamebox').classList.contains('full'); if(K.full) toggleFull(); K.on=true; K.mode='intro'; K.found={}; K.ans={}; K.plan={}; K.q=[]; K.an=[]; K.hint=false; K.busy=false; K.goal=-1; SNAPTXT='AÇUDE DE TREINO · FICTÍCIO'; G.evid=[]; G.mode='kidsbusy'; G.caseI=99;
  SFX.start(); SFX.scene('campo'); hud.hidden=true; setObj(null); closePanel(); GG.visible=true; K.fresh=true; PM.forEach(function(m){ m.g.visible=false; m.ok.visible=false; m.q.visible=true; });
  otto.visible=false; serras.visible=true; scene.fog.near=70; scene.fog.far=150; releaseCam(); CAM.orbit=false; CAM.z=0; CAM.boost=0; setDusk(false,true); player.position.set(0,0,17.8); player.rotation.y=Math.PI; G.target=null;
  Object.keys(NPC).forEach(hideNPC); coletaLab.visible=false; showMarkers(false); hideBeam(); khand.hidden=true;
  CAM.desired(); var pd=CAM.pd.clone(), ld=CAM.ld.clone();
  SFX.whoosh();
  flyTo([[-30,16,26],[-26,9,-8],[0,13,-30],[28,9,-6],[24,7,20],[pd.x,pd.y,pd.z]],[[0,0,0],[0,1,0],[0,.5,2],[0,1,0],[0,1,0],[ld.x,ld.y,ld.z]],11,kIntro,{hint:true});
}
function kIntro(){ K.mode='intro'; G.mode='kidsbusy';
  panel('<span class="k">Modo Escola · piloto · açude de treino (fictício)</span><h3>Guardiões do Açude</h3>'+
    say('Oi! Eu sou a garça-guia e moro aqui no açude há muito tempo. Hoje você vai ser <b>Guardião ou Guardiã do Açude</b>: vai procurar pistas, dar a nota de cada uma e cuidar do que preocupa.')+
    '<p class="note">Este é um açude de treino, inventado para o jogo. Nada aqui descreve um açude de verdade.</p>'+cont('Vamos!',kRegua),'glass kid'); }
function kReguaOn(){ var bands=reguaBands; if(!K.regOrig) K.regOrig=bands.map(function(b){ return [b.material.color.getHex(),b.material.emissive.getHex()]; });
  bands.forEach(function(b,i){ b.material.color.setHex(KHEX[i]); b.material.emissive.setHex(KHEX[i]); });
  if(!K.regFaces.length) bands.forEach(function(b,i){ var s=faceSprite(i,.95); s.position.set(-1.15,.7+i*1.3+.65,.15); regua.add(s); K.regFaces.push(s); });
  K.regFaces.forEach(function(s){ s.visible=true; }); regua.visible=true; regua.userData.goal=0; regua.position.set(0,-9,0); }
function kReguaOff(){ if(K.regOrig) reguaBands.forEach(function(b,i){ b.material.color.setHex(K.regOrig[i][0]); b.material.emissive.setHex(K.regOrig[i][1]); }); K.regFaces.forEach(function(s){ s.visible=false; }); if(K.mark) K.mark.visible=false; }
function kRegua(){ K.mode='regua'; kReguaOn(); SFX.regua();
  flyTo([[8,6,10],[10,4.2,6]],[[0,3,0],[0,3.2,0]],3.2,null,{hold:true});
  panel('<span class="k">Passo 1 · a régua do cuidado</span><h3>Cada pista ganha uma nota</h3>'+
    say('Esta é a nossa régua. Quanto mais para cima, mais a pista preocupa. Toque nas faixas para ouvir cada nota.')+
    '<div class="kfaces ro">'+[0,1,2,3].map(function(e){ return '<div class="kface">'+faceSVG(e,KCOL[e],54,KWORD[e])+'<b>'+e+'</b><span>'+KWORD[e]+'</span></div>'; }).join('')+'</div>'+
    '<div class="krules"><span>Sem prova, sem nota</span><span>Não vi, não chuto</span><span>Um problema, uma carta</span></div>'+
    cont('Começar a caça às pistas',kHunt),'glass kid'); }
function kHunt(){ closePanel(); K.mode='hunt'; G.mode='explore'; K.busy=false; K.idle=0; K.hint=false; releaseCam(); CAM.boost=1; CAM.z=.55; CAM.auto=false; kReguaOff(); regua.userData.goal=-9;
  PM.forEach(function(m,i){ m.g.visible=true; m.ok.visible=!!K.found[PISTAS[i].id]; m.q.visible=!K.found[PISTAS[i].id]; m.beam.color.setHex(K.found[PISTAS[i].id]?0x3FAE5A:0xFFC233); m.ring.material.color.setHex(K.found[PISTAS[i].id]?0x3FAE5A:0xFFC233); });
  khand.hidden=false; drawHand(); player.position.set(0,0,17.8);
  setObj('<b>Caça às pistas</b> Toque nos balões amarelos para andar até eles.');
  toast('Toque num balão amarelo'); SFX.scene('campo'); }
function kidsClickPista(i){ if(K.mode!=='hunt'||K.busy) return; K.idle=0; K.hint=false; if(K.found[PISTAS[i].id]){ toast('Você já pegou esta carta'); return; } K.goal=i; walkTo(PISTAS[i].pos.x,PISTAS[i].pos.z,true); }
function openPista(i){ var p=PISTAS[i]; K.busy=true; G.mode='kidsbusy'; K.cur=i; setObj(null);
  var o=p.pos, r=Math.hypot(o.x,o.z)||1, ox=o.x/r, oz=o.z/r;
  cineTo([o.x+ox*7.5-oz*2.2,4.4,o.z+oz*7.5+ox*2.2],[o.x,1.0,o.z],1.8,null,{hold:true});
  var vp=p.vp(); flash(); SFX.shutter(); var url=snap(vp[0],vp[1]); if(url) G.evid.push({code:p.id,cap:p.nome,url:url});
  after(1.0,function(){ if(K.cur!==i) return;
    panel('<span class="k">Pista '+(Object.keys(K.found).length+1)+' de '+PISTAS.length+' · '+p.nome+'</span><div class="kpista"><div>'+pola(url,p.nome,'Foto do açude de treino')+'</div><div>'+say(p.txt)+'<p><b>Quanto isso preocupa?</b></p>'+facesBtns(function(e){ kAnswer(i,e); },function(){ kAnswer(i,null); })+'</div></div>','glass kid'); }); }
function kAnswer(i,e){ var p=PISTAS[i]; K.ans[p.id]=e; K.found[p.id]=true; var ok=(e===p.nivel), lv=p.nivel;
  var head, extra='';
  if(p.nivel==null){ head=(e==null)?'Isso! A régua concorda: <b>não vi, não chuto</b>.':'Você deu nota '+e+', mas a gente não viu o caderno. Sem evidência, o item fica sem nota.'; }
  else if(e==null){ head='Você marcou “não vi”. Dava para ver: a foto mostra. A régua do jogo dá <b>'+lv+' · '+KWORD[lv]+'</b>.'; }
  else if(ok){ head='Isso! Você e a régua deram a mesma nota: <b>'+lv+' · '+KWORD[lv]+'</b>.'; }
  else { head='Boa tentativa! Eu olho assim: <b>'+lv+' · '+KWORD[lv]+'</b>. Pode ser que a gente veja de modos diferentes, e tudo bem.'; }
  if(ok||(p.nivel==null&&e==null)){ SFX.good(); SFX.brilho(); pulse(p.pos.x,p.pos.z,0x3FAE5A,4.5); confetti(p.pos.x,2.4,p.pos.z,45); } else { SFX.soft(); pulse(p.pos.x,p.pos.z,0xFFC233,3); }
  PM[i].q.visible=false; PM[i].ok.visible=true; PM[i].beam.color.setHex(0x3FAE5A); PM[i].ring.material.color.setHex(0x3FAE5A); drawHand();
  var card='<div class="kcard"><div class="kc-f">'+(lv==null?'<span class="nv big">?</span>':faceSVG(lv,KCOL[lv],64,KWORD[lv]))+'</div><div class="kc-t"><b>'+p.nome+'</b><span>'+(lv==null?'sem nota · não vi':'nota '+lv+' · '+KWORD[lv])+'</span></div></div>';
  var n=Object.keys(K.found).length;
  panel('<span class="k">Carta nova na sua mão</span>'+say(head)+card+'<p class="note">'+p.why+'</p>'+cont(n>=PISTAS.length?'Ver a régua do açude':'Guardar a carta e continuar',function(){ if(n>=PISTAS.length) kAntes(); else { kHunt(); } }),'glass kid'); }

/* --- régua do açude (antes) --- */
function avg(newv){ var v=[]; PISTAS.forEach(function(p){ var l=p.nivel; if(newv&&newv[p.id]!==undefined) l=newv[p.id]; if(l!=null) v.push(l); }); return v.length?v.reduce(function(a,b){return a+b;},0)/v.length:null; }
function faixaK(a){ return a<.75?0:(a<1.5?1:(a<2.25?2:3)); }
function markerSet(a,instant){ if(!K.mark){ K.mark=faceSprite(0,1.6); K.mark.position.set(-2.7,0,.2); regua.add(K.mark); }
  var f=faixaK(a); K.mark.material.map=new T.CanvasTexture(faceCanvas(f===0?0:f===1?1:f===2?2:3,KCOL[f],128)); K.mark.material.map.encoding=T.sRGBEncoding; K.mark.material.needsUpdate=true;
  var y=.7+(a+.5)*1.3, y0=K.mark.position.y; K.mark.visible=true; if(instant){ K.mark.position.y=y; return; } anim(0,1.6,function(k){ K.mark.position.y=y0+(y-y0)*(k*k*(3-2*k)); }); }
function kAntes(){ K.mode='antes'; closePanel(); setObj(null); khand.hidden=false; PM.forEach(function(m){ m.g.visible=false; }); GG.visible=true;
  kReguaOn(); K.regFaces.forEach(function(s){ s.visible=true; }); var a0=avg(), f0=faixaK(a0); markerSet(a0,true); K.mark.visible=false; SFX.regua();
  flyTo([[10,7,10],[7,5,5]],[[0,3,0],[0,3.4,0]],3.4,function(){ K.mark.visible=true; K.mark.position.y=0; markerSet(a0); SFX.reguaNote(f0); },{hold:true});
  after(4.2,function(){ var c=Object.keys(K.ans).filter(function(id){ var p=PISTAS.filter(function(x){ return x.id===id; })[0]; return K.ans[id]===p.nivel; }).length;
    panel('<span class="k">Passo 2 · a régua do açude de treino</span><h3>Média das pistas com nota: '+fmtK(a0)+'</h3>'+
      say('Juntando as pistas que tiveram nota, a régua fica em <b>'+f0+' · '+KWORD[f0]+'</b>. A pista que você não viu ficou de fora da conta, como manda a regra.')+
      '<div class="kmini">'+PISTAS.map(function(p){ var l=p.nivel; return '<span>'+(l==null?'<i class="nv">?</i>':faceSVG(l,KCOL[l],22,KWORD[l]))+p.nome+'</span>'; }).join('')+'</div>'+
      '<p class="note">Você e a régua concordaram em '+c+' de '+PISTAS.length+' pistas. Isso não é nota para você: é só para a gente conversar sobre o que cada um viu. No IVSH de verdade são 18 indicadores; aqui são 6, só para treinar. Valores ilustrativos.</p>'+cont('Montar o plano de cuidado',kPlano),'glass kid'); }); }
function fmtK(a){ return a==null?'—':a.toFixed(1).replace('.',','); }

/* --- plano de cuidado --- */
function gotasSVG(used){ var h=''; for(var i=0;i<KGOTAS;i++) h+='<svg viewBox="0 0 24 30" width="22" height="26" aria-hidden="true"><path d="M12 2C7 10 3 14 3 19a9 9 0 0018 0c0-5-4-9-9-17z" fill="'+(i<used?'#DCE6FA':'#2D8CFF')+'" stroke="#0A1B4D" stroke-width="1.6"/></svg>'; return '<div class="kdrops" aria-label="'+(KGOTAS-used)+' gotas sobrando">'+h+'<span>'+(KGOTAS-used)+' gota'+((KGOTAS-used)===1?'':'s')+' sobrando</span></div>'; }
function usadas(){ var u=0; ACOES.forEach(function(a){ if(K.plan[a.id]) u+=a.custo; }); return u; }
function kPlano(){ K.mode='plano'; K.plan={}; K.plano=false; kPlanoView(); K.plano=true; cineTo([14,16,16],[0,0,0],2.2,null,{hold:true}); }
function kPlanoView(msg){ var u=usadas();
  panel('<span class="k">Passo 3 · plano de cuidado</span><h3>Escolha onde usar as gotas</h3>'+
    say(msg||'Eu tenho só <b>'+KGOTAS+' gotas</b> de cuidado. Cada ação gasta algumas. Não dá para fazer tudo, então a turma conversa e escolhe o que mais ajuda.',K.plano)+
    gotasSVG(u)+'<div class="kacts">'+ACOES.map(function(a){ var on=!!K.plan[a.id], p=a.pista?PISTAS.filter(function(x){ return x.id===a.pista; })[0]:null;
      return '<button type="button" class="kact'+(on?' on':'')+'" aria-pressed="'+on+'" data-h="'+H(function(){ if(on) delete K.plan[a.id]; else if(u+a.custo>KGOTAS){ SFX.bad(); kPlanoView('Ih, não sobram gotas para essa. Tire outra ação ou escolha uma mais barata.'); return; } else K.plan[a.id]=true; SFX.gota(); kPlanoView(); })+'">'+
      '<span class="kc">'+a.custo+'<small>gota'+(a.custo>1?'s':'')+'</small></span><span class="kn"><b>'+a.nome+'</b><small>'+a.desc+'</small></span>'+(p&&p.nivel!=null?'<span class="kto">'+faceSVG(p.nivel,KCOL[p.nivel],22,'')+'→'+faceSVG(a.novo,KCOL[a.novo],22,'')+'</span>':'<span class="kto">+</span>')+'</button>'; }).join('')+'</div>'+
    '<div class="chs"><button type="button" class="ch pri" '+(u?'':'disabled')+' data-h="'+H(kExecuta)+'">Fazer o plano acontecer</button></div>','glass kid'); }
function kExecuta(){ closePanel(); K.mode='exec'; GG.visible=true; var list=ACOES.filter(function(a){ return K.plan[a.id]; }), t=0; SFX.whoosh();
  list.forEach(function(a,i){ after(t,function(){ kAcao(a); }); t+=6.2; });
  after(t,kDepois); }
function kAcao(a){ var c=a.at(), r=Math.hypot(c.x,c.z)||1, ox=c.x/r, oz=c.z/r;
  flyTo([[c.x+ox*10+oz*5,8,c.z+oz*10-ox*5],[c.x+ox*7,5.2,c.z+oz*7]],[[c.x,1,c.z],[c.x,.8,c.z]],2.8,null,{});
  toast(a.nome);
  for(var i=0;i<a.custo;i++){ (function(i){ gotaVoa([c.x+(Math.random()-.5)*8,16,c.z+(Math.random()-.5)*8],[c.x+(Math.random()-.5)*1.6,.7,c.z+(Math.random()-.5)*1.6],1.0+i*.35,function(){ SFX.gota(); }); })(i); }
  after(2.7+a.custo*.2,function(){ SFX.brilho(); pulse(c.x,c.z,0x3FAE5A,6); confetti(c.x,2,c.z,60); puff(c.x,c.z); EFX[a.id](c); if(Math.random()<.5) SFX.garca(); }); }

/* --- efeitos de cada ação (com desfazer) --- */
function addObj(o){ K.added.push(o); return o; }
function bin(x,z,col){ var g=new T.Group(); g.position.set(x,0,z); g.add(mesh(new T.CylinderGeometry(.28,.22,.7,10),mat(col),0,.35,0)); g.add(mesh(new T.CylinderGeometry(.3,.3,.07,10),mat(0x333333),0,.74,0)); g.scale.setScalar(.01); scene.add(g); return addObj(g); }
var EFX={
 lixo:function(c){ TRASH.forEach(function(t,i){ var s0=t.scale.x; anim(i*.07,.6,function(k){ t.scale.setScalar(Math.max(.001,s0*(1-k))); },function(){ t.visible=false; }); });
   [[-.18,-.6,0x3FAE5A],[-.1,.3,0x2D5FE0],[-.22,1.2,0xF2C230]].forEach(function(b,i){ var q=shore(C2a+b[0]*.8,2.6+b[1]*.3+i*.2), g=bin(q.x,q.z,b[2]); anim(.5+i*.25,.8,function(k){ g.scale.setScalar(Math.max(.01,backOut(k))); }); });
   K.undo.push(function(){ TRASH.forEach(function(t){ t.visible=true; t.scale.setScalar(1); }); }); },
 gado:function(c){ var cw=cows.map(function(w){ return {g:w.g,x:w.g.position.x,z:w.g.position.z}; });
   cw.forEach(function(w,i){ var r=Math.hypot(w.x,w.z)||1, a=Math.atan2(w.z,w.x), q=shore(a,4.0+i*.7); anim(.4+i*.3,1.8,function(k){ var e=k*k*(3-2*k); w.g.position.x=w.x+(q.x-w.x)*e; w.g.position.z=w.z+(q.z-w.z)*e; w.g.position.y=Math.abs(Math.sin(k*18))*.04; }); });
   K.undo.push(function(){ cw.forEach(function(w){ w.g.position.set(w.x,0,w.z); }); });
   DUNG.forEach(function(d,i){ var s0=d.scale.x; anim(i*.08,.6,function(k){ d.scale.setScalar(Math.max(.001,s0*(1-k))); },function(){ d.visible=false; }); }); K.undo.push(function(){ DUNG.forEach(function(d){ d.visible=true; d.scale.setScalar(1); }); });
   for(var i=0;i<7;i++){ (function(i){ var a=C4a-.38+i*.13, q=shore(a,2.2), g=new T.Group(); g.position.set(q.x,0,q.z); g.add(mesh(new T.CylinderGeometry(.07,.08,1.25,5),fenceM,0,.62,0)); g.scale.y=.01; scene.add(g); addObj(g); anim(.3+i*.12,.5,function(k){ g.scale.y=Math.max(.01,k); });
     if(i>0){ var q0=shore(a-.13,2.2), L=Math.hypot(q.x-q0.x,q.z-q0.z); [.5,.95].forEach(function(h){ var w=mesh(new T.BoxGeometry(L,.025,.025),wireM,(q.x+q0.x)/2,h,(q.z+q0.z)/2); w.rotation.y=-Math.atan2(q.z-q0.z,q.x-q0.x); w.scale.x=.01; scene.add(w); addObj(w); anim(.5+i*.12,.4,function(k){ w.scale.x=Math.max(.01,k); }); }); } })(i); }
   var tq=shore(C4a,3.2), tg=new T.Group(); tg.position.set(tq.x,0,tq.z); tg.add(mesh(new T.BoxGeometry(1.6,.4,.5),mat(0x8A6A48),0,.25,0)); tg.add(mesh(new T.BoxGeometry(1.4,.05,.34),new T.MeshBasicMaterial({color:0x4F9BEA}),0,.46,0)); tg.rotation.y=-C4a+Math.PI/2; tg.scale.setScalar(.01); scene.add(tg); addObj(tg); anim(1,.8,function(k){ tg.scale.setScalar(Math.max(.01,backOut(k))); }); },
 erosao:function(c){ var pt=EROS[0], c0=pt.material.color.getHex(); anim(0,1.6,function(k){ pt.material.color.lerpColors(new T.Color(c0),new T.Color(0x7FA64A),k); }); K.undo.push(function(){ pt.material.color.setHex(c0); });
   EROS.slice(1).forEach(function(r,i){ var s0=r.scale.x; anim(i*.1,.8,function(k){ r.scale.x=Math.max(.001,s0*(1-k)); },function(){ r.visible=false; }); }); K.undo.push(function(){ EROS.slice(1).forEach(function(r){ r.visible=true; r.scale.x=1; }); });
   for(var i=0;i<7;i++){ (function(i){ var ang=-Math.PI*.15+i*Math.PI*.3/6*2.4, px=c.x+Math.cos(ang+1.2)*2.0*(i%2?1:-1)*.5+(i-3)*.45, pz=c.z+1.1+Math.sin(i)*.3, g=mesh(new T.DodecahedronGeometry(.28,0),mat(0x8b8478),px,.2,pz); g.scale.setScalar(.01); scene.add(g); addObj(g); anim(.3+i*.12,.5,function(k){ g.scale.setScalar(Math.max(.01,backOut(k))); }); })(i); }
   for(i=0;i<14;i++){ (function(i){ var g=mesh(new T.ConeGeometry(.12,.55,5),mat(0x6EA84A),c.x+(Math.random()-.5)*5,.28,c.z+(Math.random()-.5)*2.6); g.scale.setScalar(.01); scene.add(g); addObj(g); anim(.6+i*.08,.6,function(k){ g.scale.setScalar(Math.max(.01,backOut(k))); }); })(i); } },
 mata:function(c){ [[2.95,1.0],[3.2,1.1],[3.3,2.9],[3.55,1.0],[3.75,1.2],[3.85,2.8],[3.05,3.0],[3.4,3.4],[3.65,3.2]].forEach(function(p,i){ var q=shore(p[0],p[1]), s=.85+Math.random()*.35, g=juazeiro(q.x,q.z,.01); addObj(g); anim(.2+i*.28,1.3,function(k){ g.scale.setScalar(Math.max(.01,s*backOut(k))); }); }); },
 sede:function(c){ var l=label('Dados abertos\npara a comunidade',{w:380,h:112,size:38,scale:1.8,bg:'#3FAE5A',fg:'#fff',border:'#0A1B4D'}); l.position.set(sedeP.x,4.6,sedeP.z); l.scale.multiplyScalar(.01); scene.add(l); addObj(l); var s0=l.scale.clone().multiplyScalar(100); anim(.2,.9,function(k){ l.scale.copy(s0).multiplyScalar(Math.max(.01,backOut(k))); }); }
};
function kUndoAll(){ K.undo.forEach(function(f){ f(); }); K.undo=[]; K.added.forEach(function(o){ scene.remove(o); var i=TREES.indexOf(o); if(i>=0) TREES.splice(i,1); }); K.added=[]; K.an=[]; K.q=[]; }

/* --- depois --- */
function kDepois(){ K.mode='depois'; var nv={}; ACOES.forEach(function(a){ if(K.plan[a.id]&&a.pista) nv[a.pista]=a.novo; }); var a0=avg(), a1=avg(nv), f0=faixaK(a0), f1=faixaK(a1);
  flyTo([[11,9,12],[8,6,7]],[[0,3,0],[0,3.3,0]],3.4,null,{hold:true}); kReguaOn(); regua.position.y=0; markerSet(a0,true); after(1.2,function(){ markerSet(a1); SFX.reguaNote(f1); });
  after(5,function(){ var feitas=ACOES.filter(function(a){ return K.plan[a.id]; }), sem=ACOES.filter(function(a){ return !K.plan[a.id]; });
    panel('<span class="k">Passo 4 · e agora?</span><h3>Antes '+fmtK(a0)+' → depois '+fmtK(a1)+'</h3>'+
      say(f1<f0?'Olha só: a régua desceu de <b>'+KWORD[f0]+'</b> para <b>'+KWORD[f1]+'</b>! Cuidar das pistas que mais preocupam faz diferença.':'A régua ficou em <b>'+KWORD[f1]+'</b>. Dá para tentar outro plano e ver o que muda mais.')+
      '<div class="kba"><div>'+faceSVG(f0,KCOL[f0],56,KWORD[f0])+'<span>Antes<br><b>'+KWORD[f0]+'</b></span></div><div class="arr">→</div><div>'+faceSVG(f1,KCOL[f1],56,KWORD[f1])+'<span>Depois<br><b>'+KWORD[f1]+'</b></span></div></div>'+
      '<p class="note">Feito: '+feitas.map(function(a){ return a.nome; }).join('; ')+'.'+(sem.length?' Ficou de fora: '+sem.map(function(a){ return a.nome; }).join('; ')+'.':'')+' Os efeitos de cada ação são ilustrativos: no mundo real, resultados dependem de dinheiro, tempo e de muita gente.</p>'+
      chs([['Receber o selo',kSelo,true],['Mudar o plano',function(){ kUndoAll(); GG.visible=true; kPlano(); }]],true),'glass kid'); }); }

/* --- selo e final --- */
function seloSVG(){ return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 260" width="200" height="236" role="img" aria-label="Selo Guardião do Açude"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D5FE0"/><stop offset="1" stop-color="#0A1B4D"/></linearGradient></defs>'+
  '<path d="M110 8 L204 38 V120 C204 182 160 226 110 252 C60 226 16 182 16 120 V38 Z" fill="url(#sg)" stroke="#FFC233" stroke-width="6" stroke-linejoin="round"/>'+
  '<g transform="translate(22 12) scale(.8)"><path d="M110 54 C88 92 70 110 70 134 a40 40 0 0080 0 c0-24-18-42-40-80z" fill="#fff" stroke="#FFC233" stroke-width="5"/><path d="M90 136 q6 22 26 24" fill="none" stroke="#2D8CFF" stroke-width="7" stroke-linecap="round"/></g>'+
  '<text x="110" y="184" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="24" fill="#fff" letter-spacing="1">GUARDIÃO</text><text x="110" y="207" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="18" fill="#FFC233" letter-spacing="2">DO AÇUDE</text>'+
  [60,110,160].map(function(x,i){ return '<path transform="translate('+x+','+(i===1?30:40)+') scale(.9)" d="M0 -9 L2.6 -3 L9 -2.5 L4 2 L5.6 8.5 L0 5 L-5.6 8.5 L-4 2 L-9 -2.5 L-2.6 -3 Z" fill="#FFC233"/>'; }).join('')+'</svg>'; }
function kSelo(){ K.mode='selo'; closePanel(); GG.visible=true; setDusk(true); SFX.fanfare(true);
  var ty=Math.min(Math.PI*2,1);
  flyTo([[22,10,18],[26,7,-6],[0,9,-24],[-24,8,-4],[-14,5.5,15]],[[0,1,0],[0,1,0],[0,.8,0],[0,1,0],[0,1,0]],11,null,{});
  [0,1.2,2.6,4].forEach(function(d,i){ after(d,function(){ var a=Math.random()*6.28; confetti(Math.cos(a)*6,3+Math.random()*3,Math.sin(a)*6,70); SFX.brilho(); }); });
  after(3,function(){ panel('<span class="k">Missão cumprida</span><div class="kfinal"><div class="kselo">'+seloSVG()+'</div><div><h3>Guardiões do Açude!</h3>'+say('Você olhou com atenção, deu notas, escolheu onde cuidar e viu o açude mudar. Isso é ser guardião: gente que cuida do que é de todo mundo.')+
    '<div class="chs row">'+btn('Votação da turma (QR code)',function(){ openVote(1); },'ch pri')+btn('Baixar o selo (imagem)',baixaSelo)+btn('Jogar de novo',kReinicia)+btn('Voltar ao início',kSai)+'</div></div></div><p class="note">Piloto em teste. A votação é anônima: a turma diz se entendeu (rodada 1) e depois opina para melhorar o projeto (rodada 2).</p>','glass kid'); }); }
function baixaSelo(){ try{ var img=new Image(), svg=seloSVG(); img.onload=function(){ var c=document.createElement('canvas'); c.width=440; c.height=520; c.getContext('2d').drawImage(img,0,0,440,520); c.toBlob(function(b){ var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='selo-guardiao-do-acude.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },4000); }); };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }catch(e){ toast('Não consegui gerar a imagem neste aparelho'); } }
function kLimpa(){ kUndoAll(); K.on=true; setDusk(false,true); kReguaOff(); regua.visible=false; regua.position.y=-9; regua.userData.glow.visible=false; PM.forEach(function(m){ m.g.visible=false; }); khand.hidden=true; setObj(null); closePanel(); releaseCam(); K.mode='off'; K.hint=false; K.busy=false; G.target=null; }
function kReinicia(){ kLimpa(); startKids(); }
function kSai(){ kLimpa(); K.on=false; if(K.full&&$('gamebox').classList.contains('full')) toggleFull(); GG.visible=false; SNAPTXT='PACAJUS · CAMPANHA 1 · FICTÍCIO'; G.mode='title'; G.caseI=0; otto.visible=true; otto.material.opacity=1; serras.visible=false; scene.fog.near=600; scene.fog.far=1400; CAM.boost=0; CAM.user=0; CAM.auto=K.autoPrev!==false; player.position.set(0,0,18); intro(); }
