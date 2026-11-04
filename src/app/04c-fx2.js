/* ===================== EFEITOS EXTRAS: vento, peixes, vaga-lumes, borboletas, confete, gotas voando, brilhos ===================== */
var glowTex=(function(){ var c=document.createElement('canvas'); c.width=c.height=64; var x=c.getContext('2d'), g=x.createRadialGradient(32,32,1,32,32,31); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); var t=new T.CanvasTexture(c); return t; })();
var dropTex=(function(){ var c=document.createElement('canvas'); c.width=c.height=64; var x=c.getContext('2d'); x.fillStyle='#4FA3FF'; x.strokeStyle='#fff'; x.lineWidth=4; x.beginPath(); x.moveTo(32,6); x.bezierCurveTo(52,30,54,44,44,54); x.bezierCurveTo(36,62,28,62,20,54); x.bezierCurveTo(10,44,12,30,32,6); x.fill(); x.stroke(); x.fillStyle='rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(26,40,4,7,.5,0,7); x.fill(); var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; })();

/* vento: as árvores balançam de leve; a carnaúba mais */
var FX2={windK:1};
function windTick(tt){ for(var i=0;i<TREES.length;i++){ var g=TREES[i], k=FX2.windK*(g.children.length>5?1.8:1); g.rotation.z=Math.sin(tt*.9+g.position.x*.35)*.022*k; g.rotation.x=Math.cos(tt*.7+g.position.z*.3)*.016*k; } }

/* peixes que saltam, com anéis na água */
var FISH=[], FRING=[];
(function(){ var fm=new T.MeshLambertMaterial({color:0xDDE6F2,emissive:0x334455}); for(var i=0;i<3;i++){ var g=new T.Group(); var b=mesh(new T.SphereGeometry(.2,8,6),fm); b.scale.set(2.1,.7,.6); g.add(b); g.add(rot(mesh(new T.ConeGeometry(.16,.3,4),fm,-.46,0,0),0,0,Math.PI/2)); g.visible=false; scene.add(g); FISH.push({g:g,t:9,x:0,z:0,dir:0,wait:2+i*2}); }
  for(i=0;i<4;i++){ var r=mesh(new T.RingGeometry(.35,.5,32),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),0,.1,0); r.rotation.x=-Math.PI/2; r.visible=false; scene.add(r); FRING.push({m:r,t:9}); } })();
var fringI=0; function ripple(x,z,big){ var r=FRING[fringI++%FRING.length]; r.t=0; r.big=big||1; r.m.position.set(x,.1,z); r.m.visible=true; }
function fishTick(dt){ FISH.forEach(function(f){ if(f.t>=1.1){ f.g.visible=false; f.wait-=dt; if(f.wait<=0){ var a=rnd()*6.283, rr=(0.25+rnd()*.5)*lakeR(a); if(Math.sin(a)>.5) rr*=.8; f.x=Math.cos(a)*rr; f.z=Math.sin(a)*rr; f.dir=rnd()*6.283; f.t=0; f.wait=4+rnd()*5; ripple(f.x,f.z,.8); } return; }
    f.t+=dt/1.1; var k=Math.min(1,f.t), y=Math.sin(k*Math.PI)*1.0; f.g.visible=true; f.g.position.set(f.x+Math.cos(f.dir)*k*1.3,.1+y,f.z+Math.sin(f.dir)*k*1.3); f.g.rotation.set(0,-f.dir,Math.cos(k*Math.PI)*.9); if(k>=.98&&!f.sp){ f.sp=true; ripple(f.g.position.x,f.g.position.z,1.1); } if(k<.1) f.sp=false; });
  FRING.forEach(function(r){ if(r.t>=1){ r.m.visible=false; return; } r.t+=dt/1.6; var k=Math.min(1,r.t); r.m.scale.setScalar(1+k*3.2*r.big); r.m.material.opacity=.7*(1-k); }); }

/* vaga-lumes (entardecer) */
var FF=(function(){ var n=70, pos=new Float32Array(n*3), base=[], g=new T.BufferGeometry(); for(var i=0;i<n;i++){ var a=rnd()*6.283, r=lakeR(a)+1+rnd()*9; base.push([Math.cos(a)*r,.6+rnd()*2.4,Math.sin(a)*r,rnd()*6.28,.4+rnd()*.8]); }
  g.setAttribute('position',new T.BufferAttribute(pos,3)); var m=new T.PointsMaterial({map:glowTex,color:0xD8FF6A,size:.55,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}); var p=new T.Points(g,m); p.frustumCulled=false; scene.add(p); return {p:p,b:base}; })();
function ffTick(tt){ var k=Math.max(0,Math.min(1,(skyK-.25)/.5)); FF.p.material.opacity=k*(.75+.25*Math.sin(tt*3)); FF.p.visible=k>.01; if(!FF.p.visible) return; var a=FF.p.geometry.attributes.position.array;
  for(var i=0;i<FF.b.length;i++){ var b=FF.b[i]; a[i*3]=b[0]+Math.sin(tt*b[4]+b[3])*.9; a[i*3+1]=b[1]+Math.sin(tt*b[4]*1.3+b[3]*2)*.5; a[i*3+2]=b[2]+Math.cos(tt*b[4]*.8+b[3])*.9; } FF.p.geometry.attributes.position.needsUpdate=true; }

/* borboletas de dia, perto da mata */
var BFLY=[]; (function(){ var cols=[0xFFB020,0xFF6FA8,0xFFFFFF,0x7FD1FF,0xFFE56A]; for(var i=0;i<7;i++){ var g=new T.Group(), m=new T.MeshBasicMaterial({color:cols[i%5],side:T.DoubleSide}), ws=[];
    [-1,1].forEach(function(sd){ var pv=new T.Group(); var w=mesh(new T.CircleGeometry(.13,6),m,0,0,.1*sd); w.rotation.x=-Math.PI/2; w.scale.set(1,1.2,1); pv.add(w); g.add(pv); ws.push({p:pv,sd:sd}); });
    g.scale.setScalar(1.3); scene.add(g); var a=2.9+rnd()*1.1; var c=shore(a,1.5+rnd()*1.5); BFLY.push({g:g,ws:ws,cx:c.x,cz:c.z,ph:rnd()*6.28,sp:.4+rnd()*.4,rr:1.5+rnd()*1.5}); } })();
function bflyTick(tt){ var vis=skyK<.6; BFLY.forEach(function(b){ b.g.visible=vis; if(!vis) return; var a=tt*b.sp+b.ph, x=b.cx+Math.cos(a)*b.rr, z=b.cz+Math.sin(a*1.3)*b.rr*.8, y=1.2+Math.sin(a*2.1)*.5;
    b.g.rotation.y=-Math.atan2(Math.cos(a*1.3)*1.3*b.rr*.8,-Math.sin(a)*b.rr); b.g.position.set(x,y,z); var f=Math.sin(tt*16+b.ph)*.9; b.ws.forEach(function(w){ w.p.rotation.x=w.sd*f; }); }); }

/* confete */
var CONF=(function(){ var n=260, pos=new Float32Array(n*3), col=new Float32Array(n*3), g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); g.setAttribute('color',new T.BufferAttribute(col,3));
  var m=new T.PointsMaterial({size:.3,vertexColors:true,transparent:true,opacity:1,depthWrite:false,map:glowTex}); var p=new T.Points(g,m); p.frustumCulled=false; p.visible=false; scene.add(p); return {p:p,v:new Float32Array(n*3),life:new Float32Array(n),n:n,i:0}; })();
function confetti(x,y,z,k){ var P=CONF.p.geometry.attributes.position.array, C=CONF.p.geometry.attributes.color.array, pal=[[1,.76,.2],[.18,.37,.88],[.2,.7,.4],[.95,.4,.2],[1,1,1],[.9,.3,.6]];
  for(var j=0;j<(k||90);j++){ var i=CONF.i++%CONF.n, a=Math.random()*6.283, s=2+Math.random()*4.5, c=pal[(Math.random()*pal.length)|0]; P[i*3]=x; P[i*3+1]=y; P[i*3+2]=z; CONF.v[i*3]=Math.cos(a)*s; CONF.v[i*3+1]=4+Math.random()*6; CONF.v[i*3+2]=Math.sin(a)*s; C[i*3]=c[0]; C[i*3+1]=c[1]; C[i*3+2]=c[2]; CONF.life[i]=2.2+Math.random()*1.2; }
  CONF.p.geometry.attributes.color.needsUpdate=true; CONF.p.visible=true; }
function confTick(dt,tt){ if(!CONF.p.visible) return; var P=CONF.p.geometry.attributes.position.array, any=false; for(var i=0;i<CONF.n;i++){ if(CONF.life[i]<=0){ P[i*3+1]=-50; continue; } any=true; CONF.life[i]-=dt; CONF.v[i*3+1]-=7*dt; CONF.v[i*3]*=1-dt*.7; CONF.v[i*3+2]*=1-dt*.7; P[i*3]+=CONF.v[i*3]*dt+Math.sin(tt*5+i)*.01; P[i*3+1]+=CONF.v[i*3+1]*dt; P[i*3+2]+=CONF.v[i*3+2]*dt; if(P[i*3+1]<.1){ P[i*3+1]=.1; CONF.v[i*3+1]=0; CONF.v[i*3]*=.3; CONF.v[i*3+2]*=.3; } }
  CONF.p.geometry.attributes.position.needsUpdate=true; if(!any) CONF.p.visible=false; }

/* gotas de cuidado: voam em arco do céu até o ponto */
var GOTAS=[]; for(var gi=0;gi<14;gi++){ var gs=new T.Sprite(new T.SpriteMaterial({map:dropTex,transparent:true,depthWrite:false})); gs.visible=false; gs.scale.setScalar(.9); scene.add(gs); GOTAS.push({s:gs,t:9,d:0}); }
var gotaI=0;
function gotaVoa(from,to,delay,cb){ var g=GOTAS[gotaI++%GOTAS.length]; g.a=new T.Vector3(from[0],from[1],from[2]); g.b=new T.Vector3(to[0],to[1],to[2]); g.mid=g.a.clone().lerp(g.b,.5); g.mid.y+=5; g.t=-delay; g.cb=cb; g.s.visible=false; g.dur=1.1; }
function gotasTick(dt){ GOTAS.forEach(function(g){ if(g.t>=9) return; g.t+=dt; if(g.t<0) return; var k=Math.min(1,g.t/g.dur), q=1-k; g.s.visible=true;
    g.s.position.set(q*q*g.a.x+2*q*k*g.mid.x+k*k*g.b.x,q*q*g.a.y+2*q*k*g.mid.y+k*k*g.b.y,q*q*g.a.z+2*q*k*g.mid.z+k*k*g.b.z); g.s.scale.setScalar(.7+.3*Math.sin(g.t*14)); g.s.material.rotation=Math.sin(g.t*6)*.3;
    if(Math.random()<.5) trail(g.s.position);
    if(k>=1){ g.t=9; g.s.visible=false; ripple(g.b.x,g.b.z,.6); if(g.cb) g.cb(); } }); }
/* rastro brilhante */
var TR=[]; for(var ti2=0;ti2<40;ti2++){ var ts=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0x8FD0FF,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0})); ts.visible=false; scene.add(ts); TR.push({s:ts,t:1}); }
var trI=0; function trail(p){ var r=TR[trI++%TR.length]; r.t=0; r.s.position.copy(p); r.s.visible=true; }
function trTick(dt){ TR.forEach(function(r){ if(r.t>=1){ r.s.visible=false; return; } r.t+=dt/.6; r.s.scale.setScalar(.5*(1-r.t)+.1); r.s.material.opacity=.7*(1-r.t); }); }

/* anel e faíscas de brilho (acerto, pista encontrada, ação feita) */
var PULSES=[]; for(var pi3=0;pi3<5;pi3++){ var pr=mesh(new T.RingGeometry(.8,1.0,40),new T.MeshBasicMaterial({color:0xFFD35A,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),0,.15,0); pr.rotation.x=-Math.PI/2; pr.visible=false; scene.add(pr); PULSES.push({m:pr,t:9}); }
var pulI=0; function pulse(x,z,color,sz){ var p=PULSES[pulI++%PULSES.length]; p.t=0; p.sz=sz||3.5; p.m.material.color.set(color||0xFFD35A); p.m.position.set(x,.15,z); p.m.visible=true; for(var i=0;i<5;i++) trail(new T.Vector3(x+(Math.random()-.5)*1.2,.4+Math.random()*1.4,z+(Math.random()-.5)*1.2)); }
function pulseTick(dt){ PULSES.forEach(function(p){ if(p.t>=1){ p.m.visible=false; return; } p.t+=dt/1.0; var k=Math.min(1,p.t); p.m.scale.setScalar(.4+k*p.sz); p.m.material.opacity=.9*(1-k); }); }

var kidsTick=null;
fxExtra=function(dt,tt){ windTick(tt); fishTick(dt); ffTick(tt); bflyTick(tt); confTick(dt,tt); gotasTick(dt); trTick(dt); pulseTick(dt); if(kidsTick) kidsTick(dt,tt); };
