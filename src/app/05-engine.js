/* ===================== MOTOR: câmera, diálogo, HUD, entrada, laço ===================== */
function resize(){ var w=gbox.clientWidth, h=gbox.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
HOOK.resize=resize; if(window.ResizeObserver) new ResizeObserver(resize).observe(gbox); window.addEventListener('resize',resize); resize();

/* câmera: segue o jogador (mapa ↔ perto), faz travellings (cine) e pode ficar fixa */
var V=function(x,y,z){ return new T.Vector3(x||0,y||0,z||0); };
var CAM={z:0,user:0,auto:true,boost:0,dock:false,dk:0,cine:null,path:null,fixed:null,orbit:false,oa:0,look:V(0,0,0),pd:V(),ld:V(),
  desired:function(){ var px=player.position.x, pz=player.position.z, k=this.z, e=k*k*(3-2*k), d=this.dk;
    var a=V(px*0.3+15,26,pz*0.3+25), b=V(px+5.4,6.6,pz+6.8), la=V(px*0.32,-3*d,pz*0.32-1), lb=V(px+0.4,1.0-1.3*d,pz+0.5);
    this.pd.lerpVectors(a,b,e); this.ld.lerpVectors(la,lb,e); },
  update:function(dt,rdt){
    this.dk+=((this.dock?1:0)-this.dk)*Math.min(1,dt*3);
    if(this.orbit){ this.oa+=dt*0.05; camera.position.set(Math.sin(this.oa)*60,165,Math.cos(this.oa)*60); this.look.set(0,0,0); camera.lookAt(this.look); return; }
    if(this.path){ var q=this.path; q.t+=(rdt||dt); var kq=Math.min(1,q.t/q.dur), eq=kq<.5?2*kq*kq:1-Math.pow(-2*kq+2,2)/2;
      camera.position.copy(q.pc.getPoint(eq)); this.look.copy(q.lc.getPoint(Math.min(1,eq*(q.lead||1)))); camera.lookAt(this.look); if(q.onT) q.onT(kq);
      if(kq>=1){ this.path=null; if(q.hold) this.fixed={p:camera.position.clone(),l:this.look.clone()}; if(q.done) q.done(); } return; }
    if(this.cine){ var c=this.cine; c.t+=(rdt||dt); var k=Math.min(1,c.t/c.dur), e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
      camera.position.lerpVectors(c.p0,c.p1,e); this.look.lerpVectors(c.l0,c.l1,e); camera.lookAt(this.look); if(c.onT) c.onT(k);
      if(k>=1){ this.cine=null; if(c.hold) this.fixed={p:c.p1.clone(),l:c.l1.clone()}; if(c.done) c.done(); } return; }
    if(this.fixed){ var f=Math.min(1,dt*3); camera.position.lerp(this.fixed.p,f); this.look.lerp(this.fixed.l,f); camera.lookAt(this.look); return; }
    var tg=Math.max(this.user,this.auto?this.boost:0); this.z+=(tg-this.z)*Math.min(1,dt*2.4);
    this.desired(); var s=Math.min(1,dt*4); camera.position.lerp(this.pd,s); this.look.lerp(this.ld,s); camera.lookAt(this.look); } };
function cineTo(p,l,dur,done,o){ o=o||{}; CAM.orbit=false; CAM.fixed=null; CAM.cine={p0:camera.position.clone(),l0:CAM.look.clone(),p1:V(p[0],p[1],p[2]),l1:V(l[0],l[1],l[2]),t:0,dur:dur||2,done:done,hold:o.hold,onT:o.onT}; }
function releaseCam(){ CAM.fixed=null; CAM.cine=null; CAM.path=null; CAM.orbit=false; }
function flyTo(pts,lks,dur,done,o){ o=o||{}; CAM.orbit=false; CAM.fixed=null; CAM.cine=null;
  var P=[camera.position.clone()].concat(pts.map(function(p){ return V(p[0],p[1],p[2]); })), Lk=[CAM.look.clone()].concat(lks.map(function(p){ return V(p[0],p[1],p[2]); }));
  CAM.path={pc:new T.CatmullRomCurve3(P,false,'centripetal'),lc:new T.CatmullRomCurve3(Lk,false,'centripetal'),t:0,dur:dur,done:done,hold:o.hold,onT:o.onT,lead:o.lead};
  if(o.hint) toast('Toque na cena para pular o sobrevoo'); }
CAM.skip=function(){ if(this.path) this.path.t=this.path.dur; if(this.cine) this.cine.t=this.cine.dur; };
function zset(v){ CAM.user=Math.max(0,Math.min(1,Math.round(v*4)/4)); }
$('zin').addEventListener('click',function(){ zset(CAM.user+0.25); });
$('zout').addEventListener('click',function(){ zset(CAM.user-0.25); });
$('zmap').addEventListener('click',function(){ zset(0); });
$('zauto').addEventListener('click',function(){ CAM.auto=!CAM.auto; this.setAttribute('aria-pressed',CAM.auto?'true':'false'); this.title='Zoom automático ao chegar nos casos: '+(CAM.auto?'ligado':'desligado'); try{ localStorage.setItem('regua_zauto',CAM.auto?'1':'0'); }catch(e){} });
try{ if(localStorage.getItem('regua_zauto')==='0'){ CAM.auto=false; $('zauto').setAttribute('aria-pressed','false'); $('zauto').title='Zoom automático ao chegar nos casos: desligado'; } }catch(e){}
gbox.addEventListener('wheel',function(e){ if(!(gbox.classList.contains('full')||e.ctrlKey)) return; e.preventDefault(); CAM.user=Math.max(0,Math.min(1,CAM.user+(e.deltaY<0?0.12:-0.12))); },{passive:false});

/* diálogos */
var PEND={}, pk=0;
function H(fn){ var k='h'+(++pk); PEND[k]=fn; return k; }
function btn(lbl,fn,cls){ return '<button type="button" class="'+(cls==null?'ch':cls)+'" data-h="'+H(fn)+'">'+lbl+'</button>'; }
function chs(arr,row){ return '<div class="chs'+(row?' row':'')+'">'+arr.map(function(c){ return btn(c[0],c[1],'ch'+((arr.length===1||c[2])?' pri':'')); }).join('')+'</div>'; }
function cont(lbl,fn){ return chs([[lbl,fn]]); }
function talk(k){ Object.keys(NPC).forEach(function(n){ NPC[n].mode=(n===k)?'talk':'idle'; }); }
function npc(k,text){ var n=NPC[k]; talk(k); var ini=n.n.replace(/^(Seu|Dona|Dra\.)\s+/,'').slice(0,1);
  return '<div class="npc"><div class="av" style="background:'+n.av+'" aria-hidden="true">'+ini+'</div><div class="tx"><span class="npcn">'+n.n+' <span style="color:var(--muted);text-transform:none;letter-spacing:0;font-weight:500">· '+n.role+'</span></span><p>'+text+'</p></div></div>'; }
function panel(html,mode){
  dlg.hidden=false; dlg.className='dlg'+(mode?' '+mode:''); dlg.innerHTML=html; dlg.scrollTop=0;
  CAM.dock=!mode||!/full|center/.test(mode);
  var P=PEND; PEND={};
  Array.prototype.forEach.call(dlg.querySelectorAll('[data-h]'),function(el){ var f=P[el.getAttribute('data-h')]; if(f) el.addEventListener('click',function(e){ if(el.disabled) return; SFX.click(); f(el,e); }); });
  var first=dlg.querySelector('button:not([disabled])'); if(first&&document.activeElement&&gbox.contains(document.activeElement)) try{ first.focus({preventScroll:true}); }catch(e){}
}
function closePanel(){ dlg.hidden=true; CAM.dock=false; talk(null); }
var toastEl=null,toastT=null;
function toast(t){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='toast'; gbox.appendChild(toastEl); } toastEl.textContent=t; toastEl.hidden=false; SFX.blip(); clearTimeout(toastT); toastT=setTimeout(function(){ toastEl.hidden=true; },2600); }
function flash(){ var f=$('flash'); f.classList.add('on'); setTimeout(function(){ f.classList.remove('on'); },60); }

/* HUD */
function setHud(){
  var rp=reguaPct();
  function m(n,v,show){ var w=v==null?0:v; return '<div class="m'+(v!=null&&v<35?' low':'')+'">'+n+' <b>'+(v==null?'—':v+(show||''))+'</b><i><b style="width:'+w+'%"></b></i></div>'; }
  hud.innerHTML=m('Rastreab.',cl(G.rast),'')+m('Régua',rp,'%')+m('Controle social',cl(G.social),'')+'<div class="m">XP <b>'+G.xp+'</b><i><b style="width:'+Math.min(100,G.xp/3.2)+'%"></b></i></div><div class="credit">design by @sosthenislima</div>';
}
function bump(o){ if(o.xp) G.xp=Math.max(0,G.xp+o.xp); if(o.rast) G.rast=cl(G.rast+o.rast); if(o.social) G.social=cl(G.social+o.social); setHud(); }

/* farol da missão */
function placeBeam(x,z){ beam.position.set(x,4.5,z); arrow.position.set(x,9,z); beam.visible=arrow.visible=true; }
function hideBeam(){ beam.visible=arrow.visible=false; }

/* movimento */
var ray=new T.Raycaster(), ndc=new T.Vector2(), plane=new T.Plane(new T.Vector3(0,1,0),0), hitp=new T.Vector3();
function walkTo(x,z,stopShort){
  if(G.mode!=='explore') return;
  var a=Math.atan2(z,x), r=Math.hypot(x,z), lim=lakeR(a)+0.9; if(r<lim){ x=Math.cos(a)*lim; z=Math.sin(a)*lim; }
  r=Math.hypot(x,z); if(r>26){ x*=26/r; z*=26/r; }
  if(stopShort){ var px=player.position.x-x, pz=player.position.z-z, pd=Math.hypot(px,pz)||1; x+=px/pd*1.2; z+=pz/pd*1.2; }
  G.target={x:x,z:z};
}
canvas.addEventListener('pointerdown',function(e){
  if((CAM.path||CAM.cine)&&dlg.hidden){ CAM.skip(); return; }
  if(G.mode!=='explore') return;
  var r=this.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc,camera);
  var hits=ray.intersectObjects(pickables.filter(function(o){ var k=o.userData.kind; return k==='case'||(k==='regua'?regua.visible&&regua.position.y>-1:o.visible); }),false);
  for(var i=0;i<hits.length;i++){ var u=hits[i].object.userData;
    if(u.kind==='ficha'){ openFicha(u.code); return; }
    if(u.kind==='regua'){ SFX.reguaNote(u.i); toast('Faixa '+u.i+' da régua'+(u.i===0?': condição mais favorável':(u.i===3?': condição mais vulnerável':''))); return; }
    if(u.kind==='case'){ if(u.i!==G.caseI&&G.caseI<CASES.length) toast('Primeiro o caso '+(G.caseI+1)+': '+CASES[G.caseI].t); var q=CASES[u.i].p; walkTo(q.x,q.z,true); return; } }
  if(ray.ray.intersectPlane(plane,hitp)) walkTo(hitp.x,hitp.z,false);
});
function arriveFly(c){ var px=player.position.x, pz=player.position.z, r=Math.hypot(c.p.x,c.p.z)||1, ox=c.p.x/r, oz=c.p.z/r;
  var fin=[px+5.4,6.6,pz+6.8], finL=[px+0.4,1.0,pz+0.5];
  flyTo([[c.p.x+ox*9+3,15,c.p.z+oz*9+3],[c.p.x+ox*4+7,9,c.p.z+oz*4+8],fin],[[c.p.x*0.6,0,c.p.z*0.6],[c.p.x,1,c.p.z],finL],2.8,function(){ CAM.z=1; CAM.boost=1; openCase(); }); }
function damY(x,z){ if(Math.abs(x)>8) return 0; var d=Math.abs(z-9.7); if(d>=1.7) return 0; return d<=0.55?1.55:1.55*(1.7-d)/1.15; }

/* laço */
var clock=new T.Clock(), visible=true, tt=0;
if(window.IntersectionObserver) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; }).observe(gbox);
function loop(){
  requestAnimationFrame(loop);
  SFX.active(visible&&!document.hidden);
  if(!visible||document.hidden) return;
  var raw=clock.getDelta(), dt=Math.min(raw,0.06), rdt=Math.min(raw,0.25); tt+=dt;
  // jogador (desvia do lago deslizando pela margem)
  if(G.target){ var px=player.position.x, pz=player.position.z, dx=G.target.x-px, dz=G.target.z-pz, d=Math.hypot(dx,dz), stp=7.5*dt;
    if(d<=stp){ player.position.x=G.target.x; player.position.z=G.target.z; G.target=null; }
    else { var nx=px+dx/d*stp, nz=pz+dz/d*stp, a=Math.atan2(nz,nx), lim=lakeR(a)+0.7;
      if(Math.hypot(nx,nz)<lim){ var a0=Math.atan2(pz,px), tx=-Math.sin(a0), tz=Math.cos(a0), sg=(tx*dx+tz*dz)>=0?1:-1; nx=px+tx*sg*stp; nz=pz+tz*sg*stp; a=Math.atan2(nz,nx); lim=lakeR(a)+0.7; if(Math.hypot(nx,nz)<lim){ nx=Math.cos(a)*lim; nz=Math.sin(a)*lim; } }
      player.rotation.y=Math.atan2(nx-px,nz-pz); player.position.x=nx; player.position.z=nz;
      var ph=Math.floor(OP.phase()/Math.PI); if(ph!==G._stp){ G._stp=ph; SFX.step(); puff(player.position.x,player.position.z); } }
  }
  player.position.y+=(damY(player.position.x,player.position.z)-player.position.y)*Math.min(1,dt*10);
  var moving=!!G.target; OP.update(dt,moving,tt,!moving&&G.mode==='explore'?'look':'idle',1.6); SFX.walkVoice(moving);
  if(G.mode==='explore'&&!moving){ G.idleT=(G.idleT||0)+rdt; if(G.idleT>12){ G.idleT=-14; SFX.whistle(); } } else G.idleT=0;
  Object.keys(NPC).forEach(function(k){ var n=NPC[k]; if(n.g.visible) n.c.update(dt,false,tt,n.mode); });
  // chegada ao caso
  if(G.mode==='explore'&&G.caseI<CASES.length){ var c=CASES[G.caseI], ddx=c.p.x-player.position.x, ddz=c.p.z-player.position.z;
    if(ddx*ddx+ddz*ddz<2.6*2.6){ G.target=null; player.rotation.y=Math.atan2(NPC[c.npc].g.position.x-player.position.x,NPC[c.npc].g.position.z-player.position.z);
      SFX.arrive(); if(CAM.auto){ G.mode='arriving'; objEl.hidden=true; arriveFly(c); } else openCase(); } }
  // régua subindo
  if(regua.visible){ regua.position.y+=((regua.userData.goal||0)-regua.position.y)*Math.min(1,dt*1.3); var gl=regua.userData.glow; gl.visible=true; gl.scale.setScalar(1+0.15*Math.sin(tt*2.4)); gl.material.opacity=.35+.2*Math.sin(tt*2.4); }
  // pilares da Mesa
  PIL.forEach(function(p){ p.h+=(p.goal-p.h)*Math.min(1,dt*2.2); p.x+=(p.gx-p.x)*Math.min(1,dt*1.8); p.m.scale.y=Math.max(0.01,p.h); p.m.position.x=p.base.position.x=p.lb.position.x=p.x; p.lb.position.y=p.h+1.15; });
  // farol e losango
  if(farol.visible){ farolMat.opacity=.2+.08*Math.sin(tt*2); farolRing.scale.setScalar(1+.12*Math.sin(tt*2.6)); }
  if(radar.visible) radar.rotation.y+=dt*0.35;
  arrow.position.y=9+Math.sin(tt*3)*0.35; beam.rotation.y+=dt;
  markers.forEach(function(m,i){ m.position.y=(MK_POS[m.userData.code].y||0)+2.3+Math.sin(tt*2+i)*0.08; });
  cows.forEach(function(c){ c.hd.rotation.z=-0.35+Math.sin(tt*1.4+c.ph)*0.25; });
  shine.material.opacity=.14+.06*Math.sin(tt*1.1);
  clouds.forEach(function(c,i){ c.position.x+=dt*(0.5+i*0.1); if(c.position.x>60) c.position.x=-60; });
  CAM.update(dt,rdt);
  fxTick(dt,tt); qualTick(raw);
  renderer.render(scene,camera);
}
