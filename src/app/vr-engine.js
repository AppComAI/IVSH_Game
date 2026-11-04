/* ===================== DEMO DE REALIDADE VIRTUAL (WebXR) + modo 360° + computador ===================== */
otto.visible=false; coletaLab.visible=false; serras.visible=true; scene.fog.near=70; scene.fog.far=170; player.visible=false;
function V3(x,y,z){ return new T.Vector3(x||0,y||0,z||0); }
function resize(){ var w=innerWidth, h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
renderer.xr.enabled=true;

/* jogador: um "rig" que leva a câmera; nos óculos a cabeça move a câmera dentro dele */
var EYE=1.6, rig=new T.Group(); rig.position.set(0,1.55,9.7); scene.add(rig); rig.add(camera); camera.position.set(0,EYE,0); camera.rotation.set(0,0,0);
var look={yaw:0,pitch:-0.05};
function applyLook(){ if(renderer.xr.isPresenting||MODE==='360') return; camera.rotation.set(look.pitch,look.yaw,0,'YXZ'); }
function faceTo(x,z){ var dx=x-rig.position.x, dz=z-rig.position.z; look.yaw=Math.atan2(-dx,-dz); rig.rotation.y=0; applyLook(); }

/* esmaecer (conforto no teletransporte) */
var fade=mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:1,depthTest:false,depthWrite:false})); fade.position.z=-0.15; fade.renderOrder=999; camera.add(fade);
var fadeGoal=0;

/* painel flutuante (texto em textura) */
var PW=1024, PH=520, pc=document.createElement('canvas'); pc.width=PW; pc.height=PH; var px=pc.getContext('2d'), ptex=new T.CanvasTexture(pc); ptex.encoding=T.sRGBEncoding;
var board=mesh(new T.PlaneGeometry(1.7,1.7*PH/PW),new T.MeshBasicMaterial({map:ptex,transparent:true,depthWrite:false})); board.renderOrder=20; scene.add(board);
function boardText(kick,title,lines){
  px.clearRect(0,0,PW,PH); px.fillStyle='rgba(255,255,255,.95)'; var r=34; px.beginPath(); px.moveTo(r,6); px.arcTo(PW-6,6,PW-6,PH-6,r); px.arcTo(PW-6,PH-6,6,PH-6,r); px.arcTo(6,PH-6,6,6,r); px.arcTo(6,6,PW-6,6,r); px.closePath(); px.fill();
  px.lineWidth=8; px.strokeStyle='#1B46C2'; px.stroke();
  px.fillStyle='#1B46C2'; px.font='700 34px '+FONT_C; px.fillText(kick.toUpperCase(),48,78);
  px.fillStyle='#0A1B4D'; px.font='800 62px '+FONT_C; px.fillText(title,48,150);
  px.font='500 38px Barlow, sans-serif'; px.fillStyle='#0A1B4D'; lines.forEach(function(l,i){ px.fillText(l,48,225+i*54); });
  ptex.needsUpdate=true; }
function placeBoard(dist,h,side){ var dir=new T.Vector3(); camera.getWorldDirection(dir); dir.y=0; if(dir.lengthSq()<1e-4) dir.set(0,0,-1); dir.normalize(); if(side) dir.applyAxisAngle(V3(0,1,0),side);
  var p=new T.Vector3(); camera.getWorldPosition(p); board.position.set(p.x+dir.x*dist,(renderer.xr.isPresenting?p.y:rig.position.y+EYE)+(h==null?-0.1:h),p.z+dir.z*dist); board.lookAt(p.x,board.position.y,p.z); }

/* problemas a encontrar (cenário de treino) */
var PROB=[
  {id:'lixo',p:shore(C2a,1.2),r:2.4,code:'D2.5',n:'Lixo espalhado na margem',d:'Resíduos e efluentes: a foto é a prova.'},
  {id:'gado',p:shore(C4a+0.05,-0.2),r:2.6,code:'D2.3',n:'Gado entrando na água',d:'Criação de animais: acesso direto, com dejetos.'},
  {id:'erosao',p:erP,r:2.6,code:'D1.5',n:'Margem com erosão',d:'Solo exposto e sulcos: a água leva a terra.'}
];
var found=0, targets=[];
PROB.forEach(function(q){ var hit=mesh(new T.SphereGeometry(q.r,12,8),new T.MeshBasicMaterial({visible:false}),q.p.x,1,q.p.z); hit.userData={kind:'prob',q:q}; scene.add(hit); targets.push(hit);
  var ring=mesh(new T.TorusGeometry(q.r*0.9,.09,8,40),new T.MeshBasicMaterial({color:0xFFB020}),q.p.x,.25,q.p.z); ring.rotation.x=Math.PI/2; ring.visible=false; scene.add(ring); q.ring=ring;
  var lb=label(q.code+' · '+q.n,{w:560,h:70,size:36,scale:1.5,bg:'#ffffff',border:'#FFB020'}); lb.position.set(q.p.x,3.6,q.p.z); lb.visible=false; scene.add(lb); q.lab=lb; });
/* círculos de teletransporte */
var PADS=[{p:{x:0,z:9.7},y:1.55,face:{x:0,z:-4}},{p:shore(-0.45,4.6),y:0,face:shore(-0.75,0)},{p:shore(-1.75,4.6),y:0,face:shore(-2.0,0)},{p:shore(2.9,4.6),y:0,face:{x:0,z:0}}];
PADS.forEach(function(pd,i){ var g=new T.Group(); g.position.set(pd.p.x,pd.y+0.05,pd.p.z);
  var disc=mesh(new T.CircleGeometry(0.9,32),new T.MeshBasicMaterial({color:0x3E69DE,transparent:true,opacity:.35,depthWrite:false})); disc.rotation.x=-Math.PI/2; g.add(disc);
  var rg=mesh(new T.RingGeometry(0.9,1.05,40),new T.MeshBasicMaterial({color:0xA9C0FF,transparent:true,opacity:.9,depthWrite:false})); rg.rotation.x=-Math.PI/2; g.add(rg);
  var hit=mesh(new T.CylinderGeometry(1.1,1.1,0.6,16),new T.MeshBasicMaterial({visible:false}),0,0.3,0); hit.userData={kind:'pad',i:i}; g.add(hit); targets.push(hit);
  scene.add(g); pd.g=g; });
function teleport(i){ var pd=PADS[i]; fadeGoal=1; SFX.click(); setTimeout(function(){ rig.position.set(pd.p.x,pd.y,pd.p.z); faceTo(pd.face.x,pd.face.z); if(renderer.xr.isPresenting) rig.rotation.y=Math.atan2(-(pd.face.x-pd.p.x),-(pd.face.z-pd.p.z)); placeBoard(3.6,-0.05,0.32); fadeGoal=0; PADS.forEach(function(o,j){ o.g.visible=(j!==i); }); },260); }
function pick(obj){ var u=obj.userData;
  if(u.kind==='pad'){ teleport(u.i); return; }
  if(u.kind==='prob'){ var q=u.q; if(q.ok) return; q.ok=true; found++; q.ring.visible=true; q.lab.visible=true; SFX.reguaNote(Math.min(3,found)); setTimeout(function(){ SFX.good(); },350);
    if(found<3){ boardText('Achou '+found+' de 3',q.n,[q.code+' · '+q.d,'No IVSH, cada problema vira nota de 0 a 3,','sempre com prova de campo. Faltam '+(3-found)+'.']); tipText('<b>'+found+' de 3.</b> '+q.n+' ('+q.code+').'); }
    else { boardText('Você achou os 3','Isso é o que o IVSH mede',['O entorno do açude: proteção, pressão humana,','governança e conflito de uso, em 18 indicadores.','COGERH · cenário de treino, dados ilustrativos.']); tipText('<b>Pronto!</b> Você achou os 3 problemas. Toque em ☰ para recomeçar.'); setTimeout(function(){ SFX.fanfare(true); },700); }
    placeBoard(3.6,-0.05,0.32); } }

/* seleção: controles dos óculos, clique/toque, ou mira no centro (modo 360°) */
var ray2=new T.Raycaster(), tmpM=new T.Matrix4(), ndc2=new T.Vector2();
function selectFrom(origin,dir){ ray2.set(origin,dir); var h=ray2.intersectObjects(targets.filter(function(t){ return t.parent.visible!==false; }),false)[0]; if(h) pick(h.object); }
[0,1].forEach(function(i){ var c=renderer.xr.getController(i); rig.add(c);
  var ln=new T.Line(new T.BufferGeometry().setFromPoints([V3(0,0,0),V3(0,0,-1)]),new T.LineBasicMaterial({color:0xFFB020})); ln.scale.z=40; c.add(ln);
  c.addEventListener('selectstart',function(){ tmpM.identity().extractRotation(c.matrixWorld); var o=V3().setFromMatrixPosition(c.matrixWorld), d=V3(0,0,-1).applyMatrix4(tmpM).normalize(); selectFrom(o,d); }); });
var drag=null;
canvas.addEventListener('pointerdown',function(e){ drag={x:e.clientX,y:e.clientY,moved:0}; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove',function(e){ if(!drag||MODE==='360') return; var dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.moved+=Math.abs(dx)+Math.abs(dy); drag.x=e.clientX; drag.y=e.clientY; look.yaw+=dx*0.005; look.pitch=Math.max(-1.2,Math.min(1.2,look.pitch+dy*0.005)); applyLook(); });
canvas.addEventListener('pointerup',function(e){ if(!drag) return; var tap=drag.moved<8; drag=null; if(!tap) return;
  if(MODE==='360'){ ndc2.set(0,0); } else { ndc2.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); }
  ray2.setFromCamera(ndc2,camera); var h=ray2.intersectObjects(targets.filter(function(t){ return t.parent.visible!==false; }),false)[0]; if(h) pick(h.object); });

/* modo 360°: giroscópio do celular */
var ori=null, yaw0=null, zee=V3(0,0,1), qx=new T.Quaternion(-Math.sqrt(0.5),0,0,Math.sqrt(0.5)), eul=new T.Euler(), q0=new T.Quaternion(), qYaw=new T.Quaternion();
addEventListener('deviceorientation',function(e){ if(e.alpha!=null) ori=e; });
function oriTick(){ if(MODE!=='360'||!ori||renderer.xr.isPresenting) return; var D=Math.PI/180, sa=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  eul.set(ori.beta*D,ori.alpha*D,-ori.gamma*D,'YXZ'); camera.quaternion.setFromEuler(eul); camera.quaternion.multiply(qx); camera.quaternion.multiply(q0.setFromAxisAngle(zee,-sa*D));
  if(yaw0===null){ var f=V3(0,0,-1).applyQuaternion(camera.quaternion); yaw0=Math.atan2(-f.x,-f.z)-look.yaw; }
  qYaw.setFromAxisAngle(V3(0,1,0),-yaw0); camera.quaternion.premultiply(qYaw); }

/* roteiro da demo */
var MODE='desk', started=false, introT=0;
function tipText(h){ $('tip').innerHTML=h; }
function begin(mode){ MODE=mode; $('menu').hidden=true; $('hud').hidden=false; $('cross').hidden=(mode!=='360'); SFX.start(); SFX.scene('campo'); SFX.active(true);
  found=0; PROB.forEach(function(q){ q.ok=false; q.ring.visible=false; q.lab.visible=false; });
  rig.position.set(0,1.55,9.7); look.yaw=0; look.pitch=-0.12; yaw0=null; applyLook(); PADS.forEach(function(o,j){ o.g.visible=(j!==0); });
  regua.visible=true; regua.position.y=-9; regua.userData.goal=-9; started=true; introT=0; fadeGoal=0;
  boardText('Açude · demo IVSH','Olhe para o meio do açude',['A régua do IVSH vai subir da água.','Ela vai de 0 (tudo bem) a 3 (grave).','Depois, encontre 3 problemas na margem.']); placeBoard(3.6,-0.05,0.32);
  tipText(mode==='360'?'<b>Mexa o celular</b> para olhar. Mire no círculo do centro e toque para apontar.':(mode==='vr'?'Use o gatilho para apontar e para ir aos círculos azuis.':'<b>Arraste</b> para olhar em volta. <b>Clique</b> num problema ou num círculo azul.'));
  setTimeout(function(){ regua.userData.goal=0; SFX.regua(); setTimeout(splash,400); },1800);
  setTimeout(function(){ boardText('Sua missão','Encontre 3 problemas',['Lixo, bicho na água, margem estragada…','Aponte e aperte o gatilho (ou toque).','Os círculos azuis levam você mais perto.']); placeBoard(3.6,-0.05,0.32); },7000); }
$('bdesk').addEventListener('click',function(){ begin('desk'); });
$('b360').addEventListener('click',function(){ var go=function(){ begin('360'); }; if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){ DeviceOrientationEvent.requestPermission().then(go,go); } else go(); });
$('bmenu').addEventListener('click',function(){ var s=renderer.xr.getSession&&renderer.xr.getSession(); if(s) s.end(); $('menu').hidden=false; $('hud').hidden=true; $('cross').hidden=true; });
if(navigator.xr&&navigator.xr.isSessionSupported){ navigator.xr.isSessionSupported('immersive-vr').then(function(ok){ $('bvr').disabled=!ok; $('bvrs').textContent=ok?'Óculos detectados: Meta Quest e outros com WebXR':'Este aparelho ou navegador não oferece RV imersiva'; },function(){ $('bvrs').textContent='Não foi possível verificar a RV'; }); }
else $('bvrs').textContent='Este navegador não oferece RV imersiva (WebXR)';
$('bvr').addEventListener('click',function(){ navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']}).then(function(s){ renderer.xr.setReferenceSpaceType('local-floor'); renderer.xr.setSession(s).then(function(){ camera.position.set(0,0,0); begin('vr'); });
  s.addEventListener('end',function(){ camera.position.set(0,EYE,0); MODE='desk'; applyLook(); }); },function(err){ $('bvrs').textContent='Não foi possível abrir a RV: '+err.message; }); });

/* laço (setAnimationLoop é obrigatório para a RV) */
var clk=new T.Clock(), tt2=0;
renderer.setAnimationLoop(function(){
  var raw=clk.getDelta(), dt=Math.min(raw,0.06); tt2+=dt;
  oriTick();
  fade.material.opacity+=(fadeGoal-fade.material.opacity)*Math.min(1,dt*(started?6:2)); fade.visible=fade.material.opacity>0.01;
  if(regua.visible){ regua.position.y+=((regua.userData.goal||0)-regua.position.y)*Math.min(1,dt*1.1); var gl=regua.userData.glow; gl.visible=regua.position.y>-3; gl.scale.setScalar(1+0.15*Math.sin(tt2*2.4)); gl.material.opacity=.35+.2*Math.sin(tt2*2.4); }
  PROB.forEach(function(q){ if(q.ring.visible){ q.ring.scale.setScalar(1+0.08*Math.sin(tt2*4)); } });
  PADS.forEach(function(pd,i){ pd.g.children[1].scale.setScalar(1+0.1*Math.sin(tt2*3+i)); });
  cows.forEach(function(c){ c.hd.rotation.z=-0.35+Math.sin(tt2*1.4+c.ph)*0.25; });
  clouds.forEach(function(c,i){ c.position.x+=dt*(0.5+i*0.1); if(c.position.x>60) c.position.x=-60; });
  fxTick(dt,tt2); if(!renderer.xr.isPresenting) qualTick(raw);
  renderer.render(scene,camera);
});
fadeGoal=0;
window.__vr={begin:begin,PROB:PROB,pick:pick,targets:targets,rig:rig,camera:camera};
