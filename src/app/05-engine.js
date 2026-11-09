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
/* navegação: grade de ocupação + A*. Nada sólido é atravessado: lago, barramento, construções,
   cerca (só passa pelos trechos rompidos e pela entrada da estrada), árvores, arbustos, postes,
   adutora, gado e pessoas. Os obstáculos vêm de COL (04-world), com a folga do corpo do jogador. */
var NAV=(function(){
  var CS=0.25, RW=26, PR=0.5, O=-RW-CS, N=Math.ceil((2*RW+2*CS)/CS), stat=new Uint8Array(N*N), grid=new Uint8Array(N*N);
  function ci(v){ return Math.max(0,Math.min(N-1,Math.floor((v-O)/CS))); } function wc(i){ return O+(i+0.5)*CS; }
  function circ(G,x,z,r){ var R=r+PR, i0=ci(x-R), i1=ci(x+R), j0=ci(z-R), j1=ci(z+R);
    for(var j=j0;j<=j1;j++) for(var i=i0;i<=i1;i++){ var dx=wc(i)-x, dz=wc(j)-z; if(dx*dx+dz*dz<=R*R) G[j*N+i]=1; } }
  function rect(G,o){ var c=Math.cos(o.ry), s=Math.sin(o.ry), ex=Math.abs(o.hw*c)+Math.abs(o.hd*s)+PR, ez=Math.abs(o.hw*s)+Math.abs(o.hd*c)+PR, i0=ci(o.x-ex), i1=ci(o.x+ex), j0=ci(o.z-ez), j1=ci(o.z+ez);
    for(var j=j0;j<=j1;j++) for(var i=i0;i<=i1;i++){ var dx=wc(i)-o.x, dz=wc(j)-o.z, lx=Math.max(Math.abs(dx*c-dz*s)-o.hw,0), lz=Math.max(Math.abs(dx*s+dz*c)-o.hd,0); if(lx*lx+lz*lz<=PR*PR) G[j*N+i]=1; } }
  function seg(G,o){ var R=o.t/2+PR, i0=ci(Math.min(o.x1,o.x2)-R), i1=ci(Math.max(o.x1,o.x2)+R), j0=ci(Math.min(o.z1,o.z2)-R), j1=ci(Math.max(o.z1,o.z2)+R), vx=o.x2-o.x1, vz=o.z2-o.z1, L2=vx*vx+vz*vz||1;
    for(var j=j0;j<=j1;j++) for(var i=i0;i<=i1;i++){ var px=wc(i)-o.x1, pz=wc(j)-o.z1, t=Math.max(0,Math.min(1,(px*vx+pz*vz)/L2)), dx=px-vx*t, dz=pz-vz*t; if(dx*dx+dz*dz<=R*R) G[j*N+i]=1; } }
  for(var j=0;j<N;j++) for(var i=0;i<N;i++){ var x=wc(i), z=wc(j), r=Math.hypot(x,z); if(r>RW||r<lakeR(Math.atan2(z,x))+0.7) stat[j*N+i]=1; }
  COL.c.forEach(function(o){ circ(stat,o.x,o.z,o.r); }); COL.r.forEach(function(o){ rect(stat,o); }); COL.s.forEach(function(o){ seg(stat,o); });
  function dyn(){ grid.set(stat);   // gente e gado entram na hora de planejar
    Object.keys(NPC).forEach(function(k){ var g=NPC[k].g; if(g.visible) circ(grid,g.position.x,g.position.z,0.3); });
    cows.forEach(function(w){ var g=w.g, a=g.rotation.y; rect(grid,{x:g.position.x+0.15*Math.cos(a),z:g.position.z-0.15*Math.sin(a),hw:0.9,hd:0.33,ry:a}); }); }
  function nearest(G,i0,j0){ if(!G[j0*N+i0]) return j0*N+i0;   // célula livre mais próxima (anéis crescentes)
    for(var k=1;k<N;k++){ var best=-1, bd=1e9; for(var j=j0-k;j<=j0+k;j++) for(var i=i0-k;i<=i0+k;i++){ if(i<0||j<0||i>=N||j>=N) continue; if(Math.max(Math.abs(i-i0),Math.abs(j-j0))!==k||G[j*N+i]) continue; var d=(i-i0)*(i-i0)+(j-j0)*(j-j0); if(d<bd){ bd=d; best=j*N+i; } } if(best>=0) return best; } return -1; }
  function free(x,z){ if(Math.hypot(x,z)>RW-0.5||!stat[ci(z)*N+ci(x)]) return {x:x,z:z}; var c=nearest(stat,ci(x),ci(z)); return c<0?{x:x,z:z}:{x:wc(c%N),z:wc((c/N)|0)}; }   // fora da área de caminhada (Mesa) fica onde está
  var gS=new Float32Array(N*N), from=new Int32Array(N*N), st=new Uint8Array(N*N), heap=[];
  function hpush(n,f){ heap.push([f,n]); var k=heap.length-1; while(k>0){ var p=(k-1)>>1; if(heap[p][0]<=heap[k][0]) break; var t=heap[p]; heap[p]=heap[k]; heap[k]=t; k=p; } }
  function hpop(){ var top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; var k=0; for(;;){ var l=2*k+1, r=l+1, m=k; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===k) break; var t=heap[m]; heap[m]=heap[k]; heap[k]=t; k=m; } } return top; }
  var NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
  function astar(s,g){ st.fill(0); heap.length=0; var gi=g%N, gj=(g/N)|0;
    function h(n){ var dx=Math.abs(n%N-gi), dz=Math.abs(((n/N)|0)-gj); return (dx+dz)+(1.4142-2)*Math.min(dx,dz); }
    gS[s]=0; from[s]=-1; st[s]=1; hpush(s,h(s)); var best=s, bh=h(s);
    while(heap.length){ var n=hpop()[1]; if(st[n]===2) continue; st[n]=2; if(n===g){ best=g; break; } var hn=h(n); if(hn<bh){ bh=hn; best=n; }
      var i=n%N, j=(n/N)|0;
      for(var k=0;k<8;k++){ var ii=i+NB[k][0], jj=j+NB[k][1]; if(ii<0||jj<0||ii>=N||jj>=N) continue; var m=jj*N+ii; if(grid[m]||st[m]===2) continue;
        if(NB[k][2]>1&&(grid[j*N+ii]||grid[jj*N+i])) continue;   // sem cortar quina
        var ng=gS[n]+NB[k][2]; if(st[m]===1&&ng>=gS[m]) continue; gS[m]=ng; from[m]=n; st[m]=1; hpush(m,ng+h(m)); } }
    var out=[]; for(var c=best;c>=0;c=from[c]) out.push(c); return out.reverse(); }
  function los(ax,az,bx,bz){ var d=Math.hypot(bx-ax,bz-az), n=Math.ceil(d/0.08); for(var k=1;k<=n;k++){ var t=k/n; if(grid[ci(az+(bz-az)*t)*N+ci(ax+(bx-ax)*t)]) return false; } return true; }
  function plan(px,pz,tx,tz){ dyn();
    var s=nearest(grid,ci(px),ci(pz)), tc=ci(tz)*N+ci(tx), g=nearest(grid,ci(tx),ci(tz)); if(s<0||g<0) return [];
    var cells=astar(s,g), pts=cells.map(function(c){ return {x:wc(c%N),z:wc((c/N)|0)}; });
    if(cells.length&&cells[cells.length-1]===tc&&!grid[tc]) pts[pts.length-1]={x:tx,z:tz};   // destino livre: vai ao ponto exato
    var out=[], cur={x:px,z:pz}, i=-1;
    if(grid[ci(pz)*N+ci(px)]&&pts.length){ out.push(pts[0]); cur=pts[0]; i=0; }   // começou encostado em algo: primeiro sai
    while(i<pts.length-1){ var j=i+1; while(j+1<pts.length&&los(cur.x,cur.z,pts[j+1].x,pts[j+1].z)) j++; out.push(pts[j]); cur=pts[j]; i=j; }
    return out; }
  return {plan:plan,free:free,blocked:function(x,z){ return !!stat[ci(z)*N+ci(x)]; },_g:function(){ return {N:N,O:O,CS:CS,stat:stat,grid:grid,dyn:dyn,los:los}; }};
})();
function walkTo(x,z,stopShort){
  if(G.mode!=='explore') return;
  if(stopShort){ var px=player.position.x-x, pz=player.position.z-z, pd=Math.hypot(px,pz)||1; x+=px/pd*1.2; z+=pz/pd*1.2; }
  var path=NAV.plan(player.position.x,player.position.z,x,z);
  if(!path.length){ G.target=null; G.path=null; return; }
  G.path=path; G.target=path[path.length-1];
}
canvas.addEventListener('pointerdown',function(e){
  if((CAM.path||CAM.cine)&&dlg.hidden){ CAM.skip(); return; }
  if(G.mode!=='explore') return;
  var r=this.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc,camera);
  var hits=ray.intersectObjects(pickables.filter(function(o){ var k=o.userData.kind; return k==='case'||(k==='pista'?o.parent.visible:(k==='regua'?regua.visible&&regua.position.y>-1:o.visible)); }),false);
  for(var i=0;i<hits.length;i++){ var u=hits[i].object.userData;
    if(u.kind==='pista'){ kidsClickPista(u.i); return; }
    if(u.kind==='ficha'){ openFicha(u.code); return; }
    if(u.kind==='regua'){ SFX.reguaNote(u.i); toast('Faixa '+u.i+' da régua'+(u.i===0?': condição mais favorável':(u.i===3?': condição mais vulnerável':''))); return; }
    if(u.kind==='case'){ if(u.i!==G.caseI&&G.caseI<CASES.length) toast('Primeiro o caso '+(G.caseI+1)+': '+CASES[G.caseI].t); var q=CASES[u.i].p; walkTo(q.x,q.z,true); return; } }
  if(ray.ray.intersectPlane(plane,hitp)) walkTo(hitp.x,hitp.z,false);
});
function arriveFly(c){ var px=player.position.x, pz=player.position.z, r=Math.hypot(c.p.x,c.p.z)||1, ox=c.p.x/r, oz=c.p.z/r;
  var fin=[px+5.4,6.6,pz+6.8], finL=[px+0.4,1.0,pz+0.5];
  flyTo([[c.p.x+ox*9+3,15,c.p.z+oz*9+3],[c.p.x+ox*4+7,9,c.p.z+oz*4+8],fin],[[c.p.x*0.6,0,c.p.z*0.6],[c.p.x,1,c.p.z],finL],2.8,function(){ CAM.z=1; CAM.boost=1; openCase(); }); }

/* laço */
var clock=new T.Clock(), visible=true, tt=0;
if(window.IntersectionObserver) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; }).observe(gbox);
function loop(){
  requestAnimationFrame(loop);
  SFX.active(visible&&!document.hidden);
  if(!visible||document.hidden) return;
  var raw=clock.getDelta(), dt=Math.min(raw,0.06), rdt=Math.min(raw,0.25); tt+=dt;
  // jogador: segue o caminho calculado (contorna tudo o que é sólido)
  if(!G.target) G.path=null;
  if(G.target&&G.path){ var px=player.position.x, pz=player.position.z, nx=px, nz=pz, rem=7.5*dt;
    while(rem>1e-6&&G.path.length){ var w=G.path[0], dx=w.x-nx, dz=w.z-nz, d=Math.hypot(dx,dz); if(d<=rem){ nx=w.x; nz=w.z; rem-=d; G.path.shift(); } else { nx+=dx/d*rem; nz+=dz/d*rem; rem=0; } }
    if(Math.abs(nx-px)+Math.abs(nz-pz)>1e-5){ var yw=Math.atan2(nx-px,nz-pz)-player.rotation.y; yw=Math.atan2(Math.sin(yw),Math.cos(yw)); player.rotation.y+=yw*Math.min(1,dt*14); }
    player.position.x=nx; player.position.z=nz;
    var ph=Math.floor(OP.phase()/Math.PI); if(ph!==G._stp){ G._stp=ph; SFX.step(); puff(player.position.x,player.position.z); }
    if(!G.path.length){ G.target=null; G.path=null; }
  }
  player.position.y+=(0-player.position.y)*Math.min(1,dt*10);
  var moving=!!G.target; OP.update(dt,moving,tt,!moving&&G.mode==='explore'?'look':'idle',1.6); SFX.walkVoice(moving);
  if(G.mode==='explore'&&!moving){ G.idleT=(G.idleT||0)+rdt; if(G.idleT>12){ G.idleT=-14; SFX.whistle(); } } else G.idleT=0;
  Object.keys(NPC).forEach(function(k){ var n=NPC[k]; if(n.g.visible) n.c.update(dt,false,tt,n.mode); });
  if(window.menTick) menTick(dt,tt);   // o menino
  // chegada ao caso
  if(G.mode==='explore'&&G.caseI<CASES.length){ var c=CASES[G.caseI], ddx=c.p.x-player.position.x, ddz=c.p.z-player.position.z;
    if(ddx*ddx+ddz*ddz<2.6*2.6){ G.target=null; player.rotation.y=Math.atan2(NPC[c.npc].g.position.x-player.position.x,NPC[c.npc].g.position.z-player.position.z);
      SFX.arrive(); if(window.menEvent) menEvent('arrive'); if(CAM.auto){ G.mode='arriving'; objEl.hidden=true; arriveFly(c); } else openCase(); } }
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
