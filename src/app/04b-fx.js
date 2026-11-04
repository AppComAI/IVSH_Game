/* ===================== EFEITOS: céu, água, sombras, garças, poeira, respingos, entardecer ===================== */
var QS=(location.search.match(/[?&]q=(\w+)/)||[])[1];

/* céu em degradê com halo do sol (esfera que acompanha a câmera) */
var DAY={top:new T.Color(0x5B95E0),hor:new T.Color(0xDDEBFA),bot:new T.Color(0xE6D9BC),sunC:new T.Color(0xFFF4D6),light:new T.Color(0xfff2dc),li:0.78,hi:0.62,sp:new T.Vector3(26,42,16)};
var DUSK={top:new T.Color(0x34408A),hor:new T.Color(0xF59A4E),bot:new T.Color(0xC07E4E),sunC:new T.Color(0xFFB070),light:new T.Color(0xFF9850),li:0.9,hi:0.45,sp:new T.Vector3(34,11,22)};
var HEMI_DAY=new T.Color(0xffffff), HEMI_DUSK=new T.Color(0xFFB98A);
var skyU={top:{value:DAY.top.clone()},hor:{value:DAY.hor.clone()},bot:{value:DAY.bot.clone()},sunC:{value:DAY.sunC.clone()},sunDir:{value:new T.Vector3()}};
var sky=new T.Mesh(new T.SphereGeometry(450,32,16),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunC; uniform vec3 sunDir; varying vec3 vD;'+
    'void main(){ vec3 d=normalize(vD); float h=d.y; vec3 c= h>0.0 ? mix(hor,top,pow(clamp(h,0.0,1.0),0.55)) : mix(hor,bot,pow(clamp(-h,0.0,1.0),0.4));'+
    ' float s=max(dot(d,normalize(sunDir)),0.0); c+=sunC*(pow(s,700.0)*1.4+pow(s,20.0)*0.2); gl_FragColor=vec4(c,1.0); }'}));
sky.renderOrder=-10; sky.frustumCulled=false; scene.add(sky);
var skyK=0, skyGoal=0;
function applySky(k){ ['top','hor','bot','sunC'].forEach(function(n){ skyU[n].value.lerpColors(DAY[n],DUSK[n],k); });
  sun.color.lerpColors(DAY.light,DUSK.light,k); sun.intensity=DAY.li+(DUSK.li-DAY.li)*k; hemi.intensity=DAY.hi+(DUSK.hi-DAY.hi)*k; hemi.color.lerpColors(HEMI_DAY,HEMI_DUSK,k);
  sun.position.lerpVectors(DAY.sp,DUSK.sp,k); skyU.sunDir.value.copy(sun.position).sub(sun.target.position).normalize();
  scene.fog.color.copy(skyU.hor.value); scene.background.copy(skyU.hor.value); }
function setDusk(on,instant){ skyGoal=on?1:0; if(instant){ skyK=skyGoal; applySky(skyK); } }

/* água: Phong com mapa de normais procedural rolando (brilho do sol) */
function waterNormals(){ var N=256, c=document.createElement('canvas'); c.width=c.height=N; var x=c.getContext('2d'), im=x.createImageData(N,N),
    W=[[3,1,.5],[1,4,.42],[5,-2,.26],[-2,7,.18],[8,3,.12],[-6,-5,.1],[11,-4,.06]], ph=W.map(function(){ return rnd()*6.283; });
  function h(i,j){ var v=0; for(var k=0;k<W.length;k++) v+=W[k][2]*Math.sin(2*Math.PI*(W[k][0]*i+W[k][1]*j)/N+ph[k]); return v; }
  for(var j=0;j<N;j++) for(var i=0;i<N;i++){ var nx=-(h(i+1,j)-h(i-1,j))*6, ny=-(h(i,j+1)-h(i,j-1))*6, l=Math.sqrt(nx*nx+ny*ny+1), o=(j*N+i)*4;
    im.data[o]=(nx/l*.5+.5)*255; im.data[o+1]=(ny/l*.5+.5)*255; im.data[o+2]=(1/l*.5+.5)*255; im.data[o+3]=255; }
  x.putImageData(im,0,0); var t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(.07,.07); return t; }
var wNorm=waterNormals();
lake.material=new T.MeshPhongMaterial({color:0x2A68CF,specular:0x7f9dc4,shininess:140,normalMap:wNorm,normalScale:new T.Vector2(.22,.22)});

/* sombras do sol */
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
sun.target.position.set(0,0,6); scene.add(sun.target);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
(function(){ var c=sun.shadow.camera; c.left=-46; c.right=46; c.top=46; c.bottom=-46; c.near=5; c.far=140; c.updateProjectionMatrix(); })();
sun.shadow.bias=-0.0005; sun.shadow.normalBias=0.04;
function shadowSetup(root){ (root||scene).traverse(function(o){ if(!o.isMesh) return; var m=o.material, gt=o.geometry&&o.geometry.type;
  if(o===ground||o===mud||o===lake) { o.receiveShadow=true; return; }
  if(!m||m.transparent||m.isMeshBasicMaterial||m.isShaderMaterial||m.visible===false) return;
  if(gt==='CircleGeometry'||gt==='PlaneGeometry'||gt==='ShapeGeometry'||gt==='RingGeometry'){ o.receiveShadow=true; return; }
  o.castShadow=true; o.receiveShadow=true; }); }

/* qualidade: reduz sozinho se o aparelho não aguentar (sombras e resolução) */
var QUAL={hi:true,acc:0,n:0,t0:0};
function setQual(hi){ QUAL.hi=hi; renderer.shadowMap.enabled=hi; renderer.setPixelRatio(hi?Math.min(window.devicePixelRatio||1,2):1);
  scene.traverse(function(o){ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){ m.needsUpdate=true; }); }); if(typeof resize==='function') resize(); }
function qualTick(raw){ if(QS==='hi'||!QUAL.hi) return; QUAL.t0+=raw; if(QUAL.t0<6) return; QUAL.acc+=raw; QUAL.n++; if(QUAL.acc>=3){ var fps=QUAL.n/QUAL.acc; QUAL.acc=0; QUAL.n=0; if(fps<24) setQual(false); } }

/* garças: voando em volta do açude e pousadas na margem */
function makeGarca(flying){ var g=new T.Group(), w=mat(0xffffff), yb=mat(0xF2C14E), k=mat(0x2a2a2a);
  var body=mesh(new T.SphereGeometry(.28,12,8),w); body.scale.set(1.9,1,1); g.add(body);
  var neck=rot(mesh(new T.CylinderGeometry(.05,.07,.55,6),w,.45,.25,0),0,0,-0.7); g.add(neck);
  var head=mesh(new T.SphereGeometry(.09,8,6),w,.68,.45,0); g.add(head);
  var beak=rot(mesh(new T.ConeGeometry(.03,.32,5),yb,.86,.43,0),0,0,-Math.PI/2); g.add(beak);
  g.add(rot(mesh(new T.ConeGeometry(.07,.36,5),w,-.62,0,0),0,0,Math.PI/2));
  var wings=[]; [-1,1].forEach(function(sd){ var piv=new T.Group(); piv.position.set(0,.12,.12*sd); piv.add(mesh(new T.BoxGeometry(.7,.03,1.15),w,0,0,.58*sd)); g.add(piv); wings.push({p:piv,sd:sd}); });
  if(!flying){ wings.forEach(function(wi){ wi.p.scale.set(.7,1,.3); }); [-.08,.08].forEach(function(z){ g.add(mesh(new T.CylinderGeometry(.02,.02,.85,4),k,-.05,-.6,z)); });
    neck.rotation.z=-0.15; neck.position.set(.36,.36,0); head.position.set(.42,.66,0); beak.position.set(.6,.64,0); g.position.y=1.0; }
  g.userData={wings:wings,head:head,beak:beak,neck:neck}; g.scale.setScalar(1.15); scene.add(g); return g; }
var BIRDS=[]; for(var bi=0;bi<6;bi++) BIRDS.push({g:makeGarca(true),r:9+bi*1.6+rnd()*2,h:6+rnd()*5,sp:(bi%2?1:-1)*(0.18+rnd()*0.12),ph:rnd()*6.28});
var STAND=[[-1.95,0.15],[2.95,0.2],[1.05,0.15],[-0.65,0.1]].map(function(p){ var q=shore(p[0],p[1]), g=makeGarca(false); g.position.x=q.x; g.position.z=q.z; g.rotation.y=-p[0]+Math.PI*0.5+rnd(); return {g:g,ph:rnd()*6.28}; });

/* poeira nos passos */
var dustTex=(function(){ var c=document.createElement('canvas'); c.width=c.height=64; var x=c.getContext('2d'), gr=x.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,'rgba(220,196,148,.95)'); gr.addColorStop(1,'rgba(220,196,148,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64); var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; })();
var puffs=[], puffI=0; for(var pi2=0;pi2<20;pi2++){ var ps=new T.Sprite(new T.SpriteMaterial({map:dustTex,transparent:true,depthWrite:false,opacity:0})); ps.visible=false; scene.add(ps); puffs.push({s:ps,t:1}); }
function puff(x,z){ var p=puffs[puffI++%puffs.length]; p.t=0; p.s.position.set(x+(Math.random()-.5)*.35,.22,z+(Math.random()-.5)*.35); p.s.visible=true; }

/* sombras de nuvem no chão */
var cloudSh=clouds.map(function(c){ var m=mesh(new T.CircleGeometry(6,24),new T.MeshBasicMaterial({color:0x1a2a40,transparent:true,opacity:.08,depthWrite:false})); m.rotation.x=-Math.PI/2; m.scale.set(1.7,1,1); m.position.y=.07; m.renderOrder=1; scene.add(m); return m; });

/* respingo quando a régua sai da água */
var rings=[], drops=null, dropV=null, dropT=9;
for(var ri=0;ri<3;ri++){ var rg=mesh(new T.RingGeometry(.9,1.1,48),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false})); rg.rotation.x=-Math.PI/2; rg.position.y=.1; rg.visible=false; scene.add(rg); rings.push({m:rg,t:9,d:ri*.45}); }
(function(){ var n=120, pos=new Float32Array(n*3); dropV=new Float32Array(n*3); var g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3));
  drops=new T.Points(g,new T.PointsMaterial({color:0xE6F0FF,size:.22,transparent:true,opacity:.9,depthWrite:false})); drops.visible=false; scene.add(drops); })();
function splash(){ rings.forEach(function(r){ r.t=-r.d; r.m.visible=true; }); var p=drops.geometry.attributes.position.array;
  for(var i=0;i<p.length/3;i++){ var a=Math.random()*6.283, s=1+Math.random()*3; p[i*3]=Math.cos(a)*.5; p[i*3+1]=.3; p[i*3+2]=Math.sin(a)*.5; dropV[i*3]=Math.cos(a)*s; dropV[i*3+1]=5+Math.random()*6; dropV[i*3+2]=Math.sin(a)*s; }
  drops.geometry.attributes.position.needsUpdate=true; drops.visible=true; dropT=0; }

/* régua: cada faixa toca a sua nota ao clicar */
var reguaBands=[]; regua.children.forEach(function(o){ if(o.isMesh&&o.geometry.parameters&&o.geometry.parameters.height===1.3){ o.userData={kind:'regua',i:reguaBands.length}; reguaBands.push(o); pickables.push(o); } });

function fxTick(dt,tt){
  if(Math.abs(skyGoal-skyK)>0.001){ skyK+=(skyGoal-skyK)*Math.min(1,dt*0.8); applySky(skyK); }
  camera.getWorldPosition(sky.position);
  wNorm.offset.set(tt*0.010,tt*0.006);
  BIRDS.forEach(function(b){ var a=b.ph+tt*b.sp, x=Math.cos(a)*b.r, z=Math.sin(a)*b.r, dx=-Math.sin(a)*b.sp, dz=Math.cos(a)*b.sp;
    b.g.position.set(x,b.h+Math.sin(tt*.7+b.ph)*.7,z); b.g.visible=b.g.position.distanceTo(sky.position)>7; b.g.rotation.y=Math.atan2(-dz,dx); b.g.rotation.z=Math.sin(tt*.5+b.ph)*.08;
    var amp=.25+.55*Math.max(0,Math.sin(tt*.45+b.ph)); b.g.userData.wings.forEach(function(w){ w.p.rotation.x=w.sd*(Math.sin(tt*7+b.ph)*amp+.1); }); });
  STAND.forEach(function(s){ var u=s.g.userData, peck=Math.max(0,Math.sin(tt*.6+s.ph)); peck=peck>0.93?(peck-0.93)*14:0; u.head.position.y=.66-peck*.35; u.beak.position.y=.64-peck*.35; });
  puffs.forEach(function(p){ if(p.t>=1){ p.s.visible=false; return; } p.t+=dt/0.9; var k=Math.min(1,p.t); p.s.scale.setScalar(.35+k*1.3); p.s.material.opacity=.5*(1-k); p.s.position.y+=dt*.35; });
  clouds.forEach(function(c,i){ cloudSh[i].position.x=c.position.x-c.position.y*0.6; cloudSh[i].position.z=c.position.z-c.position.y*0.38; });
  rings.forEach(function(r){ if(r.t>3) { r.m.visible=false; return; } r.t+=dt; if(r.t<0) return; var k=r.t/3; r.m.scale.setScalar(1+k*9); r.m.material.opacity=.8*(1-k); });
  if(drops.visible){ dropT+=dt; var p=drops.geometry.attributes.position.array; for(var i=0;i<p.length/3;i++){ dropV[i*3+1]-=9.8*dt; p[i*3]+=dropV[i*3]*dt; p[i*3+1]=Math.max(.05,p[i*3+1]+dropV[i*3+1]*dt); p[i*3+2]+=dropV[i*3+2]*dt; }
    drops.geometry.attributes.position.needsUpdate=true; drops.material.opacity=Math.max(0,.9-dropT*.45); if(dropT>2.2) drops.visible=false; }
}
applySky(0); shadowSetup();
if(QS==='lo') setQual(false);
