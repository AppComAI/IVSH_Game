/* ===================== MUNDO 3D: Açude Pacajus (cenário fictício) ===================== */
var T=window.THREE;
var gbox=$('gamebox'), canvas=$('gl'), dlg=$('dlg'), hud=$('hud'), objEl=$('obj');
var renderer=new T.WebGLRenderer({canvas:canvas,antialias:true});
renderer.outputEncoding=T.sRGBEncoding;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
var scene=new T.Scene(), camera=new T.PerspectiveCamera(46,4/3,0.1,800);
var SKY=0xA9C8EE;
scene.background=new T.Color(SKY); scene.fog=new T.Fog(SKY,70,150);
var hemi=new T.HemisphereLight(0xffffff,0x8a7a55,0.64); scene.add(hemi);
var sun=new T.DirectionalLight(0xfff2dc,0.72); sun.position.set(18,30,10); scene.add(sun);
function mat(c,o){ return new T.MeshLambertMaterial(Object.assign({color:c},o||{})); }
function mesh(g,m,x,y,z){ var o=new T.Mesh(g,m); o.position.set(x||0,y||0,z||0); return o; }
function rot(m,x,y,z){ m.rotation.set(x||0,y||0,z||0); return m; }
var seed=11; function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
/* ---- obstáculos: pegada no chão de tudo o que é sólido (o motor monta a grade de caminhada com isto) ----
   c: círculo (árvore, poste, gente) · r: retângulo girado (construção, mesa) · s: faixa (cerca, adutora) */
var COL={c:[],r:[],s:[]};
function colC(x,z,r){ COL.c.push({x:x,z:z,r:r}); }
function colR(x,z,w,d,ry){ COL.r.push({x:x,z:z,hw:w/2,hd:d/2,ry:ry||0}); }
function colRG(gx,gz,ry,lx,lz,w,d){ var c=Math.cos(ry), s=Math.sin(ry); colR(gx+lx*c+lz*s,gz-lx*s+lz*c,w,d,ry); } // retângulo dentro de um grupo girado
function colS(x1,z1,x2,z2,t){ COL.s.push({x1:x1,z1:z1,x2:x2,z2:z2,t:t}); }
var FONT_C='"Barlow Condensed","Arial Narrow",sans-serif';

/* ---- rótulos (sprites) ---- */
function label(txt,o){ o=o||{}; var W=o.w||320, H=o.h||72, c=document.createElement('canvas'); c.width=W; c.height=H; var x=c.getContext('2d');
  var tx=new T.CanvasTexture(c); tx.encoding=T.sRGBEncoding;
  function draw(t){ x.clearRect(0,0,W,H); var r=14; x.fillStyle=o.bg||'rgba(255,255,255,.94)';
    x.beginPath(); x.moveTo(r,2); x.arcTo(W-2,2,W-2,H-2,r); x.arcTo(W-2,H-2,2,H-2,r); x.arcTo(2,H-2,2,2,r); x.arcTo(2,2,W-2,2,r); x.closePath(); x.fill();
    if(o.border!==false){ x.strokeStyle=o.border||'#1B46C2'; x.lineWidth=4; x.stroke(); }
    x.fillStyle=o.fg||'#0A1B4D'; x.font=(o.weight||800)+' '+(o.size||36)+'px '+FONT_C; x.textAlign='center'; x.textBaseline='middle';
    var lines=String(t).split('\n'); lines.forEach(function(l,i){ x.fillText(l,W/2,H/2+(i-(lines.length-1)/2)*(o.size||36)*1.05+2); }); tx.needsUpdate=true; }
  draw(txt);
  var sp=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:o.depth!==false,transparent:true}));
  var s=o.scale||1.6; sp.scale.set(s*W/H*0.5,s*0.5,1); sp.renderOrder=o.depth===false?6:2; sp.userData.set=draw; return sp; }

/* ---- lago com margem irregular; a parede (sul) achata a margem ---- */
var LAKE_ZMAX=8.35;
function baseR(a){ return 8.7+0.75*Math.sin(3*a+1.1)+0.45*Math.cos(2*a-0.4)+0.3*Math.sin(5*a); }
function lakeR(a){ var r=baseR(a), s=Math.sin(a); if(s>0.05) r=Math.min(r,LAKE_ZMAX/s); return r; }
function shore(a,off){ var r=lakeR(a)+(off||0); return {x:Math.cos(a)*r,z:Math.sin(a)*r}; }
function lakeShape(off,zmax){ var s=new T.Shape(), n=120;
  for(var i=0;i<=n;i++){ var a=i/n*Math.PI*2, r=baseR(a)+off, sn=Math.sin(a); if(sn>0.05) r=Math.min(r,zmax/sn); var px=Math.cos(a)*r, pz=Math.sin(a)*r; if(i===0) s.moveTo(px,-pz); else s.lineTo(px,-pz); }
  return s; }

/* ---- chão: textura pintada (caatinga, estradas de terra) ---- */
var GR=80;
function groundTex(){ var S=1024, c=document.createElement('canvas'); c.width=c.height=S; var x=c.getContext('2d');
  function P(v){ return (v+GR)/(2*GR)*S; }
  x.fillStyle='#CDB889'; x.fillRect(0,0,S,S);
  var g=x.createRadialGradient(P(0),P(0),P(9)-P(0),P(0),P(0),P(30)-P(0)); g.addColorStop(0,'#9FAE68'); g.addColorStop(.55,'#B5B278'); g.addColorStop(1,'rgba(205,184,137,0)');
  x.fillStyle=g; x.fillRect(0,0,S,S);
  for(var i=0;i<5200;i++){ var px=rnd()*S, py=rnd()*S, rr=rnd()*2.4+.6; x.fillStyle=rnd()<.5?'rgba(120,98,60,.16)':'rgba(255,248,225,.16)'; x.beginPath(); x.arc(px,py,rr,0,7); x.fill(); }
  for(i=0;i<160;i++){ var qx=rnd()*S, qy=rnd()*S; x.fillStyle='rgba(122,140,74,.20)'; x.beginPath(); x.ellipse(qx,qy,6+rnd()*16,4+rnd()*10,rnd()*3,0,7); x.fill(); }
  x.strokeStyle='#C2A26F'; x.lineCap='round'; x.lineJoin='round';
  function road(pts,w){ x.lineWidth=w; x.beginPath(); pts.forEach(function(p,i){ if(i) x.lineTo(P(p[0]),P(p[1])); else x.moveTo(P(p[0]),P(p[1])); }); x.stroke(); }
  road([[0,80],[0,40],[0,22],[1,13.5],[6,13],[13,11],[18,8],[17,3]],13);
  road([[0,22],[-3,30]],9); road([[0,24],[0,30]],13); road([[13,11],[18,12.5]],9); road([[-2,13.5],[-6,14],[-9,11.5]],8);
  road([[17,3],[16,-4],[12.5,-12],[5,-16],[-6,-15],[-11,-9],[-13.5,-2]],7);
  return c; }
var gtex=new T.CanvasTexture(groundTex()); gtex.encoding=T.sRGBEncoding; gtex.anisotropy=4;
var ground=mesh(new T.CircleGeometry(GR,72),new T.MeshLambertMaterial({map:gtex})); ground.rotation.x=-Math.PI/2; scene.add(ground);
var mud=mesh(new T.ShapeGeometry(lakeShape(1.5,9.0)),mat(0xB59A6C)); mud.rotation.x=-Math.PI/2; mud.position.y=0.02; scene.add(mud);
var waterMat=new T.MeshLambertMaterial({color:0x2F6FD6});
var lake=mesh(new T.ShapeGeometry(lakeShape(0,LAKE_ZMAX)),waterMat); lake.rotation.x=-Math.PI/2; lake.position.y=0.05; scene.add(lake);
var shine=mesh(new T.ShapeGeometry(lakeShape(-2.6,LAKE_ZMAX-2.2)),new T.MeshBasicMaterial({color:0x8FB3F5,transparent:true,opacity:.18,depthWrite:false})); shine.rotation.x=-Math.PI/2; shine.position.y=0.06; scene.add(shine);

/* ---- parede e sangradouro (sul) ---- */
var dshape=new T.Shape(); dshape.moveTo(-1.7,0); dshape.lineTo(1.7,0); dshape.lineTo(0.55,1.55); dshape.lineTo(-0.55,1.55); dshape.closePath();
var dgeo=new T.ExtrudeGeometry(dshape,{depth:16,bevelEnabled:false}); dgeo.translate(0,0,-8);
var dam=mesh(dgeo,mat(0x9D8E73),0,0,9.7); dam.rotation.y=Math.PI/2; scene.add(dam);
scene.add(mesh(new T.BoxGeometry(16,0.06,1.1),mat(0xC9BFA9),0,1.58,9.7));
for(var di=0;di<9;di++){ var rr0=0.35+rnd()*0.2, rx0=-7+di*1.8+rnd(), rz0=8.55+rnd()*0.2; scene.add(mesh(new T.DodecahedronGeometry(rr0,0),mat(0x8b8478),rx0,0.35,rz0)); colC(rx0,rz0,rr0); }
colR(0,9.7,16,3.4,0); colR(-9.2,9.4,2.2,4.2,0); // barramento e sangradouro
var sang=new T.Group(); sang.position.set(-9.2,0,9.4);
sang.add(mesh(new T.BoxGeometry(2.2,0.08,4.2),mat(0xBFC4C9),0,0.04,0)); sang.add(mesh(new T.BoxGeometry(0.25,0.9,4.2),mat(0xAEB4BA),-1.1,0.45,0)); sang.add(mesh(new T.BoxGeometry(0.25,0.9,4.2),mat(0xAEB4BA),1.1,0.45,0));
scene.add(sang);

/* ---- vegetação da caatinga ---- */
var TREES=[], TRASH=[], DUNG=[], EROS=[];
var trunkM=mat(0x7a5a3a), juaM=mat(0x3E7A3C), juaM2=mat(0x4C8A45), manM=mat(0x5B8C4E), carT=mat(0x8A7358), carL=mat(0x6E9A54), dryM=mat(0x9A8F6A), dryM2=mat(0x8a7f5e);
function juazeiro(x,z,s){ s=s||1; var g=new T.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  g.add(mesh(new T.CylinderGeometry(.16,.24,1.3,7),trunkM,0,.65,0));
  [[0,1.75,0,1.05],[.6,1.55,.25,.75],[-.55,1.6,-.2,.8],[.1,2.15,-.1,.7]].forEach(function(p,i){ var m=mesh(new T.IcosahedronGeometry(p[3],1),i%2?juaM2:juaM,p[0],p[1],p[2]); m.scale.y=.75; g.add(m); });
  scene.add(g); TREES.push(g); if(s>=0.2) colC(x,z,0.4*s); return g; }
function mandacaru(x,z,s){ s=s||1; var g=new T.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  g.add(mesh(new T.CylinderGeometry(.2,.24,2.6,8),manM,0,1.3,0));
  [[.55,1.1,.9],[-.5,1.4,.7]].forEach(function(a){ var sd=a[0]>0?1:-1; g.add(rot(mesh(new T.CylinderGeometry(.14,.14,Math.abs(a[0]),6),manM,a[0]/2,a[1],0),0,0,Math.PI/2));
    g.add(mesh(new T.CylinderGeometry(.14,.15,a[2],7),manM,a[0],a[1]+a[2]/2,0)); });
  scene.add(g); TREES.push(g); if(s>=0.2) colC(x,z,0.6*s); return g; }
function carnauba(x,z,s){ s=s||1; var g=new T.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  g.add(mesh(new T.CylinderGeometry(.11,.16,4.4,7),carT,0,2.2,0));
  for(var i=0;i<9;i++){ var lf=mesh(new T.ConeGeometry(.55,1.5,5,1,true),carL,0,4.5,0); lf.material.side=T.DoubleSide; var a=i/9*Math.PI*2; lf.position.set(Math.cos(a)*.55,4.55,Math.sin(a)*.55); lf.rotation.set(0,-a,0); lf.rotateZ(-1.15); lf.scale.set(1,1,.25); g.add(lf); }
  scene.add(g); TREES.push(g); if(s>=0.2) colC(x,z,0.28*s); return g; }
function shrub(x,z,s){ var m=mesh(new T.DodecahedronGeometry(.55*(s||1),0),rnd()<.5?dryM:dryM2,x,.35*(s||1),z); m.scale.y=.7; scene.add(m); colC(x,z,.5*(s||1)); return m; }
function patch(x,z,rx,rz,c,rot){ var m=mesh(new T.CircleGeometry(1,20),mat(c||0xB28A5A),x,0.025,z); m.rotation.x=-Math.PI/2; m.rotation.z=rot||0; m.scale.set(rx,rz,1); scene.add(m); return m; }
// mata ciliar: rala e fragmentada no setor oeste (caso 1), um pouco melhor no leste
[[3.0,1.4,1.1],[3.12,2.2,.95],[3.45,1.6,1.05],[3.62,2.3,.9],[2.92,2.4,.8],[3.9,1.9,1]].forEach(function(p){ var q=shore(p[0],p[1]); juazeiro(q.x,q.z,p[2]); });
[[3.25,1.6,2.4,1.1,.4],[2.85,1.4,1.8,1,1.1],[3.75,1.5,2,1.2,.2]].forEach(function(p){ var q=shore(p[0],p[1]); patch(q.x,q.z,p[2],p[3],0xB08257,p[4]); });
[[-0.2,1.6],[0.25,1.5],[-0.55,1.7],[-1.0,1.6],[1.2,1.7],[-2.4,1.6],[-2.75,1.8],[2.2,1.5]].forEach(function(p,i){ var q=shore(p[0],p[1]); if(i%3===2) carnauba(q.x,q.z,.95+rnd()*.2); else juazeiro(q.x,q.z,.8+rnd()*.3); });
for(var ti=0;ti<70;ti++){ var a=rnd()*Math.PI*2, r=22+rnd()*34, tx=Math.cos(a)*r, tz=Math.sin(a)*r;
  if(Math.abs(tx)<5&&tz>15) continue; if(tz>22&&tz<38&&Math.abs(tx)<12) continue;
  var k=rnd(); if(k<.35) juazeiro(tx,tz,.9+rnd()*.5); else if(k<.6) mandacaru(tx,tz,.8+rnd()*.5); else if(k<.75) carnauba(tx,tz,.9+rnd()*.3); else shrub(tx,tz,1+rnd()); }
for(ti=0;ti<26;ti++){ var a2=rnd()*Math.PI*2, r2=13+rnd()*7; var sx=Math.cos(a2)*r2, sz=Math.sin(a2)*r2; if(sz>8&&Math.abs(sx)<10) continue; shrub(sx,sz,.6+rnd()*.6); }
// serras ao longe
var serras=new T.Group(); for(var si=0;si<14;si++){ var aa=si/14*Math.PI*2+rnd()*.2, rr=95+rnd()*20; var sm=mesh(new T.ConeGeometry(14+rnd()*14,9+rnd()*12,5),mat(0x8FA3BF),Math.cos(aa)*rr,3,Math.sin(aa)*rr); sm.rotation.y=rnd()*3; serras.add(sm); } scene.add(serras);
// nuvens
var clouds=[]; for(var ci=0;ci<6;ci++){ var cg=new T.Group(); for(var cj=0;cj<3;cj++) cg.add(mesh(new T.SphereGeometry(1.7-cj*0.25,10,8),new T.MeshLambertMaterial({color:0xffffff}),cj*1.6-1.6,cj%2*0.35,0));
  cg.position.set(-40+ci*16,20+ci%2*3,-30+ci*7); scene.add(cg); clouds.push(cg); }

/* ---- construções ---- */
function house(x,z,w,d,h,wall,roof,ry){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0;
  g.add(mesh(new T.BoxGeometry(w,h,d),mat(wall),0,h/2,0));
  var rr=(d+0.35)/1.732, rf=mesh(new T.CylinderGeometry(rr,rr,w+0.35,3,1,false,Math.PI/2),mat(roof),0,h+0.5*rr*0.62,0); rf.rotation.z=Math.PI/2; rf.scale.x=0.62; g.add(rf);
  g.add(mesh(new T.BoxGeometry(0.55,0.95,0.05),mat(0x6b4a2e),0,0.48,d/2+0.02));
  g.add(mesh(new T.BoxGeometry(0.5,0.4,0.05),mat(0x9fc3e8),w*0.3,h*0.62,d/2+0.02));
  scene.add(g); colR(x,z,w+0.1,d+0.1,ry||0); return g; }
// cerca da área patrimonial (rompida no norte: D1.3)
var fenceM=mat(0x6e5a44), wireM=new T.MeshBasicMaterial({color:0x5d5d5d});
(function(){ var R=19.5, n=46, gaps=[[-1.72,-1.42],[-2.62,-2.45]];
  function inGap(a){ for(var i=0;i<gaps.length;i++) if(a>gaps[i][0]&&a<gaps[i][1]) return true; return false; }
  for(var i=0;i<n;i++){ var a=-Math.PI+i/n*Math.PI*2, a2=-Math.PI+(i+1)/n*Math.PI*2; if(inGap(a)) continue;
    var x1=Math.cos(a)*R, z1=Math.sin(a)*R; if(Math.abs(x1)<2.4&&z1>17) continue;
    scene.add(mesh(new T.CylinderGeometry(.07,.08,1.25,5),fenceM,x1,.62,z1)); colC(x1,z1,.1);
    if(inGap(a2)||(Math.abs(Math.cos(a2)*R)<2.4&&Math.sin(a2)*R>17)) continue;
    var x2=Math.cos(a2)*R, z2=Math.sin(a2)*R, L=Math.hypot(x2-x1,z2-z1);
    [.5,.95].forEach(function(h){ var w=mesh(new T.BoxGeometry(L,.025,.025),wireM,(x1+x2)/2,h,(z1+z2)/2); w.rotation.y=-Math.atan2(z2-z1,x2-x1); scene.add(w); }); colS(x1,z1,x2,z2,.1); }
  // porteira caída
  var pg=new T.Group(); pg.position.set(Math.cos(-1.57)*R,0,Math.sin(-1.57)*R); pg.add(mesh(new T.CylinderGeometry(.1,.1,1.5,6),fenceM,-1.3,.75,0)); pg.add(mesh(new T.CylinderGeometry(.1,.1,1.5,6),fenceM,1.3,.75,0));
  var gate=new T.Group(); gate.add(mesh(new T.BoxGeometry(2.4,.08,.08),fenceM,0,.9,0)); gate.add(mesh(new T.BoxGeometry(2.4,.08,.08),fenceM,0,.3,0)); gate.add(mesh(new T.BoxGeometry(.08,.7,.08),fenceM,-1.1,.6,0)); gate.add(mesh(new T.BoxGeometry(.08,.7,.08),fenceM,1.1,.6,0));
  gate.rotation.x=-1.25; gate.position.set(0,.12,-.6); pg.add(gate); scene.add(pg); colC(pg.position.x-1.3,pg.position.z,.12); colC(pg.position.x+1.3,pg.position.z,.12); })();
// caso 2: casa da curva e lixo disperso (sem cano)
var C2a=-0.86, casaP=shore(C2a-0.06,4.6); house(casaP.x,casaP.z,2.6,2,1.7,0xE9DCC0,0xB4553C,0.7);
var trashC=[0xffffff,0x3a8f4a,0x2a64c8,0xf2f2f2,0xd94a3a,0x8fd0ef,0xffffff,0x3a8f4a,0xe8e2d0,0x2a64c8,0xffffff,0x6aa84f];
for(var lx=0;lx<16;lx++){ var tp=shore(C2a+(rnd()-.5)*0.42,0.3+rnd()*2.2); var tb=mesh(lx%3?new T.BoxGeometry(.22+rnd()*.15,.14,.2+rnd()*.12):new T.CylinderGeometry(.06,.06,.32,6),mat(trashC[lx%trashC.length]),tp.x,.08,tp.z); tb.rotation.set(rnd()*.6,rnd()*3,lx%3?0:Math.PI/2); scene.add(tb); TRASH.push(tb); }
var canoaP=shore(C2a+0.2,-1.4), canoa=mesh(new T.CylinderGeometry(.35,.22,2.2,8,1),mat(0x8a5a3a),canoaP.x,.12,canoaP.z); canoa.rotation.z=Math.PI/2; canoa.rotation.y=.9; canoa.scale.set(1,1,.45); scene.add(canoa);
// caso 3: sede da associação, quadro de avisos e orelhão
var C3a=0.12, sedeP=shore(C3a,7.6); var sede=house(sedeP.x,sedeP.z,3.8,2.6,2.1,0xF1E7CF,0x2D5FE0,-Math.PI/2); var sedeLab=label('Associação',{w:300,h:64,size:34,scale:1.2}); sedeLab.position.set(sedeP.x,3.6,sedeP.z); scene.add(sedeLab);
var quadroP=shore(C3a-0.2,4.6); (function(){ var g=new T.Group(); g.position.set(quadroP.x,0,quadroP.z); g.rotation.y=-1.2; g.add(mesh(new T.CylinderGeometry(.06,.06,1.6,5),fenceM,-.6,.8,0)); g.add(mesh(new T.CylinderGeometry(.06,.06,1.6,5),fenceM,.6,.8,0)); g.add(mesh(new T.BoxGeometry(1.5,.9,.06),mat(0x7a5a3a),0,1.25,0)); g.add(mesh(new T.BoxGeometry(.4,.5,.07),mat(0xffffff),-.35,1.27,0)); g.add(mesh(new T.BoxGeometry(.35,.4,.07),mat(0xffe28a),.2,1.3,0)); scene.add(g); colR(quadroP.x,quadroP.z,1.5,.15,-1.2); })();
var orelP=shore(C3a+0.36,6.2); (function(){ var g=new T.Group(); g.position.set(orelP.x,0,orelP.z); g.add(mesh(new T.CylinderGeometry(.06,.06,1.5,6),mat(0x777777),0,.75,0)); var sh=mesh(new T.SphereGeometry(.55,14,10,0,Math.PI*2,0,Math.PI/1.6),mat(0x2D8BD6),0,1.75,0); g.add(sh); g.add(mesh(new T.BoxGeometry(.3,.4,.2),mat(0x333333),0,1.45,.25)); scene.add(g); colC(orelP.x,orelP.z,.5); })();
// caso 4: gado entrando na água, com dejetos (sem pasto plantado)
var C4a=-2.12, cows=[];
function cow(x,z,ry,c1,c2){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry; var b=mat(c1), s2=mat(c2);
  g.add(mesh(new T.BoxGeometry(1.35,.62,.62),b,0,.85,0)); g.add(mesh(new T.BoxGeometry(.5,.5,.64),s2,.15,.95,0));
  var hd=new T.Group(); hd.position.set(.82,1.0,0); hd.add(mesh(new T.BoxGeometry(.42,.38,.38),b)); hd.add(mesh(new T.BoxGeometry(.18,.2,.3),mat(0xe8b8a0),.25,-.08,0)); hd.add(mesh(new T.ConeGeometry(.05,.22,5),mat(0xeeeeee),0,.26,.15)); hd.add(mesh(new T.ConeGeometry(.05,.22,5),mat(0xeeeeee),0,.26,-.15)); g.add(hd);
  [[.5,.22],[.5,-.22],[-.5,.22],[-.5,-.22]].forEach(function(p){ g.add(mesh(new T.CylinderGeometry(.07,.07,.6,5),b,p[0],.3,p[1])); });
  g.add(rot(mesh(new T.CylinderGeometry(.03,.03,.5,4),b,-.72,.75,0),0,0,-.5));
  scene.add(g); cows.push({g:g,hd:hd,ph:rnd()*6}); return g; }
[[C4a+0.05,-0.9,0xf3efe6,0x7a4a2a],[C4a-0.12,-0.45,0x8a5a3a,0x5a3a20],[C4a+0.2,0.5,0xf3efe6,0x2a2a2a]].forEach(function(p,i){ var q=shore(p[0],p[1]); var g=cow(q.x,q.z,-p[0]+Math.PI*(i===2?0.7:1),p[2],p[3]); if(p[1]<0) g.position.y=-0.32; });
for(var dj=0;dj<9;dj++){ var dq=shore(C4a+(rnd()-.5)*.35,.2+rnd()*1.4); var dm=mesh(new T.CylinderGeometry(.13+rnd()*.06,.16,.05,8),mat(0x5a4022),dq.x,.04,dq.z); scene.add(dm); DUNG.push(dm); }
// caso 5: balneário com barracas de alvenaria e cobertura fixa
var C5a=0.6, balP=[];
[[C5a-0.1,3.1,0],[C5a+0.06,3.6,0.3],[C5a+0.2,3.2,0.6]].forEach(function(p,i){ var q=shore(p[0],p[1]); balP.push(q); var g=new T.Group(); g.position.set(q.x,0,q.z); g.rotation.y=-p[0]-Math.PI/2;
  g.add(mesh(new T.BoxGeometry(2.0,1.3,1.5),mat(0xE7D9BD),0,.65,0)); g.add(mesh(new T.BoxGeometry(2.5,.14,2.2),mat(0xB9BEC4),0,1.42,.2));
  g.add(mesh(new T.BoxGeometry(1.2,.7,.06),mat(i===1?0xd94a3a:0x2D5FE0),0,.9,.76)); [-1.1,1.1].forEach(function(px){ g.add(mesh(new T.CylinderGeometry(.06,.06,1.4,6),mat(0x9a9a9a),px,.7,1.2)); });
  for(var m=0;m<2;m++){ g.add(mesh(new T.CylinderGeometry(.32,.32,.05,10),mat(0xffffff),-.7+m*1.4,.62,2.0)); g.add(mesh(new T.CylinderGeometry(.04,.04,.6,5),mat(0xdddddd),-.7+m*1.4,.3,2.0)); }
  scene.add(g); var ry=g.rotation.y; colRG(q.x,q.z,ry,0,.2,2.5,2.2); colRG(q.x,q.z,ry,-.7,2.0,.7,.7); colRG(q.x,q.z,ry,.7,2.0,.7,.7); });
(function(){ var q=shore(C5a+0.02,1.6); var sp=mesh(new T.BoxGeometry(.5,.8,.45),mat(0x1a1a1a),q.x,.4,q.z); scene.add(sp); scene.add(rot(mesh(new T.CylinderGeometry(.14,.14,.05,10),mat(0x555555),q.x,.55,q.z+.23),Math.PI/2,0,0));
  var um=mesh(new T.ConeGeometry(1.1,.5,8),mat(0xF2C14E),q.x+1.2,2.0,q.z-.3); scene.add(um); scene.add(mesh(new T.CylinderGeometry(.04,.04,2,5),mat(0xeeeeee),q.x+1.2,1,q.z-.3)); colC(q.x,q.z,.35); colC(q.x+1.2,q.z-.3,.6); })();
// fichas pré-registradas: cenário de cada uma
var roP=shore(2.72,3.2); (function(){ for(var i=0;i<5;i++) for(var j=0;j<4;j++){ var c=mesh(new T.ConeGeometry(.16,1.1,5),mat(0x7fa64a),roP.x+(i-2)*.5,.55,roP.z+(j-1.5)*.55); scene.add(c); } patch(roP.x,roP.z,1.7,1.4,0xA07A4A); })();
var erP=shore(-1.36,1.0); (function(){ EROS.push(patch(erP.x,erP.z,2.6,1.4,0xB0714A,0.2)); for(var i=0;i<7;i++){ var rv=mesh(new T.BoxGeometry(.09,.03,1.2+rnd()*1.2),mat(0x5e3a22),erP.x+(i-3)*.42+(rnd()-.5)*.2,.035,erP.z+(rnd()-.5)*.4); rv.rotation.y=-1.36+Math.PI/2+(rnd()-.5)*.5; scene.add(rv); EROS.push(rv); } })();
var vzA=-1.85; (function(){ patch(shore(vzA,0.5).x,shore(vzA,0.5).z,2.2,1.0,0x8a7a4a,-vzA); for(var i=0;i<14;i++) for(var j=0;j<3;j++){ var q=shore(vzA+(i-6.5)*0.035,0.05+j*0.45); var bu=mesh(new T.IcosahedronGeometry(.17,0),mat(j%2?0x6f9f45:0x8fb35a),q.x,.12,q.z); bu.scale.y=.8; scene.add(bu); } })();
var casinhaP=shore(-0.32,4.2); house(casinhaP.x,casinhaP.z,2,1.6,1.4,0xF2E2C4,0xA34A33,-0.4);
var gaiP={x:2.6,z:-3.2}; (function(){ for(var i=0;i<4;i++){ var gx=gaiP.x+(i%2)*1.5, gz=gaiP.z+Math.floor(i/2)*1.5; var fr=mesh(new T.BoxGeometry(1.1,.12,1.1),mat(0x4a5560),gx,.12,gz); scene.add(fr); scene.add(mesh(new T.BoxGeometry(.9,.02,.9),new T.MeshBasicMaterial({color:0x1e3e70}),gx,.19,gz)); } })();
var guaritaP={x:-6.2,z:14.2}; house(guaritaP.x,guaritaP.z,1.5,1.5,1.7,0xE9EEF5,0x5b6b80,0.3);
var escolaP={x:18.5,z:13.2}; (function(){ house(escolaP.x,escolaP.z,4.6,2.6,2.0,0xF6EED8,0x2D5FE0,-0.5); scene.add(mesh(new T.CylinderGeometry(.05,.05,3.6,5),mat(0xcccccc),escolaP.x-3,1.8,escolaP.z+1.4)); var fl=mesh(new T.BoxGeometry(.9,.55,.03),mat(0x1B46C2),escolaP.x-2.5,3.3,escolaP.z+1.4); scene.add(fl); colC(escolaP.x-3,escolaP.z+1.4,.1); var el=label('Escola',{w:220,h:60,size:32,scale:1}); el.position.set(escolaP.x,3.6,escolaP.z); scene.add(el); })();
var bombaP=shore(-2.58,0.6); (function(){ scene.add(mesh(new T.BoxGeometry(.8,.6,.6),mat(0xC0392B),bombaP.x,.3,bombaP.z)); colR(bombaP.x,bombaP.z,.8,.6,0); var pp=mesh(new T.CylinderGeometry(.07,.07,2.2,6),mat(0x333333),bombaP.x+.9,.15,bombaP.z+.6); pp.rotation.z=Math.PI/2; pp.rotation.y=-.6; scene.add(pp); })();
var canalA={x:bombaP.x-1,z:bombaP.z}, canalB={x:-19,z:-8.5}; (function(){ var L=Math.hypot(canalB.x-canalA.x,canalB.z-canalA.z); var c=mesh(new T.BoxGeometry(L,.04,.45),mat(0x4f86d8),(canalA.x+canalB.x)/2,.03,(canalA.z+canalB.z)/2); c.rotation.y=-Math.atan2(canalB.z-canalA.z,canalB.x-canalA.x); scene.add(c);
  var fld=mesh(new T.PlaneGeometry(6,5),mat(0x79b04a),-22,.03,-10); fld.rotation.x=-Math.PI/2; scene.add(fld); for(var i=0;i<6;i++) scene.add(mesh(new T.BoxGeometry(5.6,.06,.12),mat(0x5f9a3a),-22,.06,-12.2+i*.9)); })();
/* adutora: sai do barramento enterrada, passa sob a estrada de terra e aflora depois do cruzamento (caixa de concreto) */
(function(){ var a0={x:7,z:10.8}, a2={x:24,z:18}, t1=0.267, a1={x:a0.x+(a2.x-a0.x)*t1,z:a0.z+(a2.z-a0.z)*t1}; var L=Math.hypot(a2.x-a1.x,a2.z-a1.z), ang=Math.atan2(a2.z-a1.z,a2.x-a1.x);
  var p=mesh(new T.CylinderGeometry(.28,.28,L,10),mat(0x7d8793),(a1.x+a2.x)/2,.3,(a1.z+a2.z)/2); p.rotation.z=Math.PI/2; p.rotation.y=-ang; scene.add(p);
  var cx=mesh(new T.BoxGeometry(.9,.75,.95),mat(0xB9BEC4),a1.x,.37,a1.z); cx.rotation.y=-ang; scene.add(cx);
  colS(a1.x,a1.z,a2.x,a2.z,.56); colR(a1.x,a1.z,.9,.95,-ang); })();
// prólogo: mesa de fichas atrás da parede
var mesaP={x:0,z:15.6}; (function(){ scene.add(mesh(new T.BoxGeometry(1.8,.08,.9),mat(0xd8c4a0),mesaP.x,.85,mesaP.z)); colR(mesaP.x,mesaP.z,1.8,.9,0); [[-.8,-.35],[.8,-.35],[-.8,.35],[.8,.35]].forEach(function(p){ scene.add(mesh(new T.CylinderGeometry(.04,.04,.85,5),mat(0x6b4a2e),mesaP.x+p[0],.42,mesaP.z+p[1])); });
  for(var i=0;i<3;i++){ var f=mesh(new T.BoxGeometry(.32,.01,.42),mat(0xffffff),mesaP.x-.5+i*.5,.9,mesaP.z); f.rotation.y=(i-1)*.2; scene.add(f); } })();

/* ---- a RÉGUA (régua linimétrica gigante, 0–3) ---- */
var REG_COL=[0xA9C0FF,0x6F93F0,0x2D5FE0,0x0A1B4D];
var regua=new T.Group(); regua.position.set(0,-9,0); regua.scale.setScalar(1.3); regua.visible=false; scene.add(regua);
(function(){ regua.add(mesh(new T.CylinderGeometry(.12,.12,7.6,8),mat(0x9aa4b2),0,3.6,-.25));
  for(var i=0;i<4;i++){ regua.add(mesh(new T.BoxGeometry(1.1,1.3,.22),new T.MeshLambertMaterial({color:REG_COL[i],emissive:REG_COL[i],emissiveIntensity:.25}),0,.7+i*1.3+.65,0));
    for(var k=1;k<5;k++) regua.add(mesh(new T.BoxGeometry(k===0?1.1:(k%2?.35:.6),.05,.24),new T.MeshBasicMaterial({color:0xffffff}),-.375+(k%2?0:.12),.7+i*1.3+k*0.26,.01));
    var nl=label(String(i),{w:96,h:96,size:62,scale:.9,bg:'#ffffff',border:'#0A1B4D'}); nl.position.set(1.05,.7+i*1.3+.65,0); regua.add(nl); }
  var tl=label('RÉGUA IVSH · 0 a 3',{w:420,h:72,size:38,scale:1.25,bg:'#0A1B4D',fg:'#ffffff',border:'#A9C0FF'}); tl.position.set(0,7.0,0); regua.add(tl);
  var gl=mesh(new T.RingGeometry(1.1,1.6,40),new T.MeshBasicMaterial({color:0xA9C0FF,transparent:true,opacity:.55,depthWrite:false}),0,.09,0); gl.rotation.x=-Math.PI/2; regua.userData.glow=gl; scene.add(gl); gl.visible=false; })();

/* ---- farol da missão e farol da faixa ---- */
var beam=mesh(new T.CylinderGeometry(0.9,0.9,9,20,1,true),new T.MeshBasicMaterial({color:0x2D5FE0,transparent:true,opacity:0.2,depthWrite:false,side:T.DoubleSide}),0,4.5,0);
var arrow=mesh(new T.ConeGeometry(0.55,1.1,12),new T.MeshBasicMaterial({color:0xFFC233}),0,8,0); arrow.rotation.x=Math.PI; scene.add(beam); scene.add(arrow); beam.visible=arrow.visible=false;
var farol=new T.Group(); farol.visible=false; scene.add(farol);
var farolMat=new T.MeshBasicMaterial({color:0xE06A1B,transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide});
farol.add(mesh(new T.CylinderGeometry(1.5,2.6,34,24,1,true),farolMat,0,17,0));
var farolRing=mesh(new T.RingGeometry(2.4,3.0,48),new T.MeshBasicMaterial({color:0xE06A1B,transparent:true,opacity:.7,depthWrite:false}),0,.09,0); farolRing.rotation.x=-Math.PI/2; farol.add(farolRing);
var radar=new T.Group(); radar.position.set(0,13,0); radar.visible=false; scene.add(radar);
var radarFill=null, radarLabs=[];
function buildRadar(dimVals,hex){
  while(radar.children.length) radar.remove(radar.children[0]); radarLabs=[];
  var R=2.2, ax=[[1,0],[0,-1],[-1,0],[0,1]], lm=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8});
  [1,2,3].forEach(function(l){ var pts=ax.map(function(a){ return new T.Vector3(a[0]*R*l,0,a[1]*R*l); }); pts.push(pts[0].clone()); radar.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),lm)); });
  ax.forEach(function(a){ radar.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,0),new T.Vector3(a[0]*R*3,0,a[1]*R*3)]),lm)); });
  var sh=new T.Shape(); ax.forEach(function(a,i){ var v=(dimVals[i]==null?0:dimVals[i])*R; if(i===0) sh.moveTo(a[0]*v,-a[1]*v); else sh.lineTo(a[0]*v,-a[1]*v); }); sh.closePath();
  radarFill=mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:hex,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false})); radarFill.rotation.x=-Math.PI/2; radar.add(radarFill);
  ax.forEach(function(a,i){ var lb=label('D'+(i+1)+' · '+fmt(dimVals[i]),{w:230,h:64,size:36,scale:1.15,bg:'rgba(10,27,77,.9)',fg:'#fff',border:'#A9C0FF'}); lb.position.set(a[0]*R*3.45,.4,a[1]*R*3.45); radar.add(lb); radarLabs.push(lb); });
}

/* ---- Mesa da Controladoria (fora da cerca, ao sul) ---- */
var MESA={x:0,z:28.5};
(function(){ var g=new T.Group(); g.position.set(MESA.x,0,MESA.z);
  g.add(mesh(new T.BoxGeometry(4.2,.1,1.3),mat(0xF1F4FA),0,.95,0)); g.add(mesh(new T.BoxGeometry(4.2,.8,.06),mat(0x1B46C2),0,.52,-.62));
  [[-2,-.55],[2,-.55],[-2,.55],[2,.55]].forEach(function(p){ g.add(mesh(new T.CylinderGeometry(.05,.05,.95,6),mat(0x888888),p[0],.47,p[1])); });
  var ml=label('Mesa da Controladoria',{w:520,h:76,size:42,scale:1.2,bg:'#0A1B4D',fg:'#fff',border:'#A9C0FF'}); ml.position.set(-3.6,2.0,-0.4); g.add(ml);
  g.add(mesh(new T.CylinderGeometry(.05,.05,1.5,6),mat(0x888888),-3.6,.75,-.4));
  colR(MESA.x,MESA.z,4.2,1.3,0); colR(MESA.x,MESA.z+2.05,5.4,.7,0); colC(MESA.x-3.6,MESA.z-.4,.1);
  for(var i=0;i<5;i++){ var ch=mesh(new T.BoxGeometry(.55,.06,.55),mat(0x2D5FE0),-2.4+i*1.2,.5,2.0); g.add(ch); g.add(mesh(new T.BoxGeometry(.55,.6,.06),mat(0x2D5FE0),-2.4+i*1.2,.8,2.27)); g.add(mesh(new T.CylinderGeometry(.03,.03,.5,4),mat(0x777777),-2.4+i*1.2,.25,2.0)); }
  scene.add(g); })();
var PIL=[], PILX=[-6,-2,2,6];
ACUDES.forEach(function(a,i){ var geo=new T.BoxGeometry(1.6,1,1.6); geo.translate(0,.5,0); var m=mesh(geo,new T.MeshLambertMaterial({color:0x9aa4b2}),PILX[i],0,MESA.z+6); m.scale.y=.01; scene.add(m);
  var lb=label(a.n,{w:300,h:110,size:38,scale:1.6}); lb.position.set(PILX[i],1,MESA.z+6); scene.add(lb);
  var base=mesh(new T.CylinderGeometry(1.3,1.4,.12,24),mat(0xC9D7F3),PILX[i],.06,MESA.z+6); scene.add(base);
  PIL.push({m:m,lb:lb,base:base,h:0.01,goal:0.01,a:a,txt:'',x:PILX[i],gx:PILX[i]}); });
function orderPillars(vals){ var idx=vals.map(function(v,i){ return i; }).sort(function(a,b){ return (vals[b]||0)-(vals[a]||0); }); idx.forEach(function(i,r){ PIL[i].gx=[6,2,-2,-6][r]; }); }
function setPillar(i,v,fx,tag){ var p=PIL[i]; p.goal=v==null?0.05:Math.max(0.05,v*3); p.m.material.color.setHex(fx?fx.hex:0x9aa4b2); var t=p.a.n+'\n'+fmt(v)+(tag?' · '+tag:''); if(t!==p.txt){ p.txt=t; p.lb.userData.set(t); } }

/* ---- marcadores das fichas pré-registradas ---- */
var pickables=[], markers=[];
function markerSprite(code){ var c=document.createElement('canvas'); c.width=200; c.height=96; var x=c.getContext('2d');
  x.fillStyle='#1B46C2'; x.beginPath(); x.moveTo(16,4); x.arcTo(196,4,196,80,14); x.arcTo(196,80,4,80,14); x.arcTo(4,80,4,4,14); x.arcTo(4,4,196,4,14); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(88,80); x.lineTo(100,95); x.lineTo(112,80); x.fill();
  x.fillStyle='#fff'; x.fillRect(18,18,34,46); x.fillStyle='#1B46C2'; for(var i=0;i<4;i++) x.fillRect(23,26+i*9,24,3);
  x.fillStyle='#fff'; x.font='800 44px '+FONT_C; x.textAlign='left'; x.textBaseline='middle'; x.fillText(code,62,44);
  var tx=new T.CanvasTexture(c); tx.encoding=T.sRGBEncoding; var sp=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthTest:true})); sp.scale.set(1.5,.72,1); sp.center.set(.5,0); return sp; }
var MK_POS={
 'D1.2':roP, 'D1.3':{x:0,z:-19.5}, 'D1.4':{x:1.5,z:9.7,y:1.6}, 'D1.5':erP, 'D2.2':casinhaP, 'D2.4':shore(vzA,0.6), 'D2.6':{x:gaiP.x+.75,z:gaiP.z+.75},
 'D3.2':guaritaP, 'D3.3':escolaP, 'D3.4':orelP, 'D4.1':bombaP, 'D4.2':quadroP, 'D4.3':{x:-14.5,z:-7}
};
Object.keys(MK_POS).forEach(function(code){ var p=MK_POS[code], sp=markerSprite(code); sp.position.set(p.x,(p.y||0)+2.3,p.z); sp.userData={kind:'ficha',code:code}; sp.visible=false; scene.add(sp); pickables.push(sp); markers.push(sp); });
function showMarkers(v){ markers.forEach(function(m){ m.visible=v; }); }

/* ---- abertura: rede de monitoramento da qualidade (ilustrativa: regiões, posições e classes fictícias) ---- */
function redeTex(){ var S=1536, PU=S/260, C=S/2, c=document.createElement('canvas'); c.width=c.height=S; var y=c.getContext('2d');
  function P(u){ return C+u*PU; }
  y.fillStyle='#EEF2F7'; y.fillRect(0,0,S,S);
  // contorno ilustrativo (não é o mapa real)
  var blob=[]; for(var i=0;i<64;i++){ var a=i/64*Math.PI*2, r=64+8*Math.sin(3*a+.7)+5*Math.cos(5*a-1.1)+3*Math.sin(7*a); blob.push([Math.cos(a)*r,Math.sin(a)*r*.92]); }
  function path(){ y.beginPath(); blob.forEach(function(p,k){ if(k) y.lineTo(P(p[0]),P(p[1])); else y.moveTo(P(p[0]),P(p[1])); }); y.closePath(); }
  // nove regiões (Voronoi), a central é a metropolitana
  var seeds=[[0,0]]; for(i=0;i<8;i++){ var a2=i/8*Math.PI*2+.3; seeds.push([Math.cos(a2)*42,Math.sin(a2)*38]); }
  var cols=['#D6E2F8','#E4ECDD','#ECE6D3','#DDE8F0','#E8E0CC','#DCE9DA','#E9E4D6','#DDE4F2','#E6EAD8'];
  var R=Math.round(80*PU), img=y.getImageData(0,0,S,S), d=img.data;
  for(var py=Math.max(0,C-R);py<Math.min(S-1,C+R);py+=2) for(var px=Math.max(0,C-R);px<Math.min(S-1,C+R);px+=2){ var ux=(px-C)/PU, uy=(py-C)/PU, b=0, bd=1e9, b2=1e9;
    for(var k=0;k<seeds.length;k++){ var dx=ux-seeds[k][0], dy=uy-seeds[k][1], dd=dx*dx+dy*dy; if(dd<bd){ b2=bd; bd=dd; b=k; } else if(dd<b2) b2=dd; }
    var edge=Math.sqrt(b2)-Math.sqrt(bd)<0.55, h=cols[b], rr=edge?150:parseInt(h.slice(1,3),16), gg=edge?165:parseInt(h.slice(3,5),16), bb=edge?190:parseInt(h.slice(5,7),16);
    for(var qy=0;qy<2;qy++) for(var qx=0;qx<2;qx++){ var o=((py+qy)*S+(px+qx))*4; if(o<0||o>=d.length) continue; d[o]=rr; d[o+1]=gg; d[o+2]=bb; d[o+3]=255; } }
  var reg=document.createElement('canvas'); reg.width=reg.height=S; reg.getContext('2d').putImageData(img,0,0);
  y.save(); path(); y.clip(); y.drawImage(reg,0,0); y.restore();
  path(); y.strokeStyle='#4A5E85'; y.lineWidth=5; y.stroke();
  // rios
  y.strokeStyle='#5B8FE6'; y.lineCap='round'; y.lineJoin='round';
  function river(pts,w){ y.lineWidth=w; y.beginPath(); pts.forEach(function(p,k){ if(k) y.lineTo(P(p[0]),P(p[1])); else y.moveTo(P(p[0]),P(p[1])); }); y.stroke(); }
  river([[-58,30],[-35,20],[-15,8],[0,0],[18,-12],[40,-30],[62,-44]],6);
  for(i=0;i<10;i++){ var aa=rnd()*Math.PI*2, rr2=30+rnd()*28, t=-50+rnd()*100; river([[Math.cos(aa)*rr2,Math.sin(aa)*rr2],[t*.6+(rnd()-.5)*12,-t*.5+(rnd()-.5)*12]],3); }
  // 155 pontos da rede, com classes fictícias
  var W=[.08,.22,.38,.22,.10], n=0, guard=0, pts=[];
  while(n<154&&guard<20000){ guard++; var qx=(rnd()*2-1)*72, qy=(rnd()*2-1)*68, ang=Math.atan2(qy/.92,qx), rb=64+8*Math.sin(3*ang+.7)+5*Math.cos(5*ang-1.1)+3*Math.sin(7*ang)-4;
    if(Math.hypot(qx,qy/.92)>rb) continue; if(Math.hypot(qx,qy)<5) continue; var ok=true; for(var m=0;m<pts.length;m++) if(Math.hypot(pts[m][0]-qx,pts[m][1]-qy)<3.4){ ok=false; break; } if(!ok) continue;
    var u=rnd(), cl=0, acc=0; for(m=0;m<5;m++){ acc+=W[m]; if(u<=acc){ cl=m; break; } } pts.push([qx,qy,cl]); n++; }
  pts.forEach(function(p){ y.fillStyle=IET_CL[p[2]].c; y.beginPath(); y.arc(P(p[0]),P(p[1]),8,0,7); y.fill(); y.lineWidth=2; y.strokeStyle='rgba(10,27,77,.55)'; y.stroke(); });
  // açude Pacajus no centro
  y.fillStyle=IET_CL[2].c; y.beginPath(); y.arc(C,C,14,0,7); y.fill(); y.lineWidth=4; y.strokeStyle='#0A1B4D'; y.stroke();
  y.lineWidth=6; y.beginPath(); y.arc(C,C,40,0,7); y.stroke();
  y.textAlign='center'; y.font='800 40px '+FONT_C; y.fillStyle='#0A1B4D'; y.fillText('Açude Pacajus (cenário fictício)',C,C-58);
  y.font='700 30px '+FONT_C; y.fillStyle='rgba(10,27,77,.72)'; y.fillText('região metropolitana (ilustrativa)',C,C+78);
  y.font='600 30px '+FONT_C; y.textAlign='left'; y.fillStyle='rgba(10,27,77,.7)'; y.fillText('Rede ilustrativa: 155 pontos, regiões e classes fictícias',P(-118),P(120));
  return c; }
var otex=new T.CanvasTexture(redeTex()); otex.encoding=T.sRGBEncoding; otex.anisotropy=4;
var otto=mesh(new T.PlaneGeometry(260,260),new T.MeshBasicMaterial({map:otex,transparent:true,opacity:1,depthTest:false,depthWrite:false,fog:false}),0,0.5,0); otto.rotation.x=-Math.PI/2; otto.renderOrder=50; scene.add(otto);
/* barco de coleta da RMQA no lago */
var coleta=new T.Group(); coleta.position.set(-2.2,0,-6.0); coleta.rotation.y=.3;
(function(){ var hull=mesh(new T.CylinderGeometry(.42,.28,2.4,8),mat(0xF2F2F2),0,.16,0); hull.rotation.z=Math.PI/2; hull.scale.set(1,1,.5); coleta.add(hull);
  coleta.add(mesh(new T.BoxGeometry(2.2,.06,.42),mat(0x1B46C2),0,.36,0)); coleta.add(mesh(new T.CylinderGeometry(.09,.09,.55,8),mat(0x3E69DE),.5,.6,0));
  coleta.add(mesh(new T.CylinderGeometry(.02,.02,.9,5),mat(0x888888),.5,.9,0)); coleta.add(mesh(new T.CylinderGeometry(.16,.16,.22,10),mat(0x333333),-.9,.4,0)); })();
scene.add(coleta);
var coletaLab=label('Coleta RMQA · IET',{w:330,h:64,size:34,scale:1.1,bg:'#ffffff',border:'#3E69DE'}); coletaLab.position.set(-2.2,2.4,-6.0); scene.add(coletaLab);

/* ---- personagens (originais, animados) ---- */
function L(c,o){ return new T.MeshLambertMaterial(Object.assign({color:c},o||{})); }
function S(c,r,m){ return new T.MeshStandardMaterial({color:c,roughness:r==null?0.8:r,metalness:m||0}); }
function makeChar(o){
  o=o||{}; var skin=L(o.skin||0xf0bf98), shirt=L(o.shirt||0x34507f), pants=L(o.pants||0x56657a), boot=L(o.boot||0x6b4426), sole=L(0x2a2a2a), hair=L(o.hair||0x2b2018),
      white=L(0xffffff), dark=L(0x151515), lip=L(0xa04a3a), hand=L(o.glove||o.skin||0xf0bf98);
  var root=new T.Group(), body=new T.Group(); root.add(body); var W=o.chub||1, HK=o.headK||1, LEGS=o.skirt||o.shorts;
  var sh=mesh(new T.CircleGeometry(.55,24),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.02; root.add(sh);
  var TN=!!o.toon, LK=TN?.72:1, LT=TN?1.25:1;   // toon: pernas curtas e grossas, corpo oval, cabeça grande
  var hips=new T.Group(); hips.position.y=.9-(TN?.22:0); body.add(hips);
  hips.add(mesh(new T.CylinderGeometry(.29*W,.27*W,.3,16),pants));
  if(o.skirt){ hips.add(mesh(new T.CylinderGeometry(.3,.42,.62,16),L(o.skirt),0,-.2,0)); }
  hips.add(mesh(new T.CylinderGeometry(.275*W,.275*W,.06,16),S(0x222222,.6),0,.1,0));
  function leg(side){ var hp=new T.Group(); hp.position.set(.15*W*side,-.08,0); hips.add(hp);
    hp.add(mesh(new T.SphereGeometry(.135*Math.sqrt(W)*LT,14,10),pants)); hp.add(mesh(new T.CylinderGeometry(.135*Math.sqrt(W)*LT,.115*Math.sqrt(W)*LT,.42*LK,14),o.skirt?skin:pants,0,-.21*LK,0));
    if(o.shorts) hp.add(mesh(new T.CylinderGeometry(.15*Math.sqrt(W),.15*Math.sqrt(W),.12,12),pants,0,-.33,0));
    var kn=new T.Group(); kn.position.y=-.42*LK; kn.add(mesh(new T.SphereGeometry(.112*LT,14,10),LEGS?skin:pants)); hp.add(kn);
    kn.add(mesh(new T.CylinderGeometry(.11*LT,.095*LT,.36*LK,14),LEGS?skin:pants,0,-.18*LK,0));
    var ft=new T.Group(); ft.position.y=-.38*LK; if(TN) ft.scale.setScalar(1.15); kn.add(ft);
    ft.add(mesh(new T.CylinderGeometry(.11,.12,.14,12),boot)); var toe=mesh(new T.SphereGeometry(.12,12,10),boot,0,-.04,.1); toe.scale.set(.95,.6,1.4); ft.add(toe); ft.add(mesh(new T.BoxGeometry(.22,.04,.36),o.sole?L(o.sole):sole,0,-.1,.06));
    if(o.sneaker){ var tc=mesh(new T.SphereGeometry(.1,12,8,0,Math.PI*2,0,Math.PI/2),white,0,-.075,.2); tc.scale.set(1.05,.55,.8); ft.add(tc); ft.add(mesh(new T.BoxGeometry(.12,.02,.1),white,0,.0,.12)); }
    if(o.cuff&&!LEGS) kn.add(mesh(new T.CylinderGeometry(.125*LT,.125*LT,.07,14),L(o.cuff===true?0x4a7cc0:o.cuff),0,-.33*LK,0));
    return {hip:hp,knee:kn,ft:ft}; }
  var lL=leg(-1), lR=leg(1);
  var torso=new T.Group(); torso.position.y=1.0-(TN?.22:0); body.add(torso);
  var EB={y:.26,ry:.42,rx:.38*W*.95,rz:.38*W*.82};   // corpo oval (toon)
  function zAt(x,y){ var u=1-(x/EB.rx)*(x/EB.rx)-((y-EB.y)/EB.ry)*((y-EB.y)/EB.ry); return u>0?EB.rz*Math.sqrt(u):0; }
  if(TN){ var eb=mesh(new T.SphereGeometry(1,36,26),shirt,0,EB.y,0); eb.scale.set(EB.rx,EB.ry,EB.rz); torso.add(eb); }
  else torso.add(mesh(new T.CylinderGeometry(.33*W,.29*W,.6,18),shirt,0,.28,0));
  if(W>1.05&&!TN){ var bel=mesh(new T.SphereGeometry(.31*W,18,14),shirt,0,.16,.05); bel.scale.set(1,.85,1); torso.add(bel); }   // barriga
  if(o.vest){ var vm=L(o.vest), refl=new T.MeshBasicMaterial({color:0xe9eef3}); torso.add(mesh(new T.CylinderGeometry(.345,.305,.52,18),vm,0,.28,0));
    torso.add(mesh(new T.CylinderGeometry(.338,.333,.05,18,1,true),refl,0,.2,0)); torso.add(mesh(new T.CylinderGeometry(.326,.32,.05,18,1,true),refl,0,.07,0)); }
  if(o.blazer){ var bm=L(o.blazer); torso.add(mesh(new T.CylinderGeometry(.35,.31,.56,18),bm,0,.28,0)); torso.add(mesh(new T.BoxGeometry(.16,.4,.05),L(0xffffff),0,.36,.31)); }
  if(!TN){ var shd=mesh(new T.SphereGeometry(.335*W,18,10,0,Math.PI*2,0,Math.PI/2),o.blazer?L(o.blazer):shirt,0,.56,0); shd.scale.y=.6; torso.add(shd);
  torso.add(mesh(new T.CylinderGeometry(.08,.09,.1,10),skin,0,.66,0)); }
  if(o.polo){ var pc=L(o.polo===true?0x7fb6df:o.polo), Z=function(x,y){ return TN?zAt(x,y):.33*W; };
    [-1,1].forEach(function(s){ var cl=mesh(new T.BoxGeometry(.19,.035,.13),pc,.085*s,TN?.61:.63,TN?Z(.085,.61)-.01:.11); cl.rotation.set(-.6,.45*s,-.35*s); torso.add(cl); });
    var pk=mesh(new T.BoxGeometry(.065,.17,.02),pc,0,.5,Z(0,.5)); if(TN) pk.rotation.x=-.63; torso.add(pk); [.55,.46].forEach(function(y){ torso.add(mesh(new T.SphereGeometry(.015,8,6),white,0,y,Z(0,y)+.008)); });
    torso.add(mesh(new T.SphereGeometry(.024,8,6),L(0xF2C14E),.2,.47,Z(.2,.47)+.004)); }
  var head=new T.Group(); head.position.y=.95+(HK-1)*.22; head.scale.setScalar(HK); torso.add(head);
  var hd=mesh(new T.SphereGeometry(.27,24,18),skin); hd.scale.set(1,1.08,1); head.add(hd);
  if(o.toon){ hd.scale.set(1.07,1.03,1); var jw=mesh(new T.SphereGeometry(.2,24,16),skin,0,-.16,.03); jw.scale.set(1.18,.55,.95); head.add(jw);
    [-1,1].forEach(function(s){ var ck=mesh(new T.SphereGeometry(.065,12,8),L(0xF4A3A0),.155*s,-.055,.205); ck.scale.set(1,.75,.45); head.add(ck); }); }
  head.add(mesh(new T.SphereGeometry(.06,10,8),skin,-.245,0,0)); head.add(mesh(new T.SphereGeometry(.06,10,8),skin,.245,0,0));
  var hr=mesh(new T.SphereGeometry(.262,20,12,0,Math.PI*2,0,Math.PI*.55),hair); hr.rotation.x=-.35; hr.position.set(0,.01,-.03); head.add(hr);
  if(o.hairStyle==='long'){ var tail=mesh(new T.CylinderGeometry(.09,.05,.5,8),hair,0,-.2,-.24); tail.rotation.x=.25; head.add(tail); head.add(mesh(new T.SphereGeometry(.07,8,6),hair,0,.05,-.25)); }
  if(o.hairStyle==='bun'){ head.add(mesh(new T.SphereGeometry(.12,12,10),hair,0,.2,-.2)); }
  if(o.hairStyle==='white'){ hr.material=L(0xd9d9d9); }
  if(o.hairStyle==='wavy'){ [[-.15,.19,.13,.11],[-.04,.25,.16,.12],[.08,.27,.15,.12],[.19,.22,.11,.1],[.26,.12,.02,.09],[-.26,.12,.0,.09],[-.2,.2,-.08,.12],[.18,.24,-.06,.12],[0,.27,-.06,.14],[-.1,.18,-.2,.13],[.1,.18,-.2,.13],[0,.06,-.24,.13],[.23,.02,-.1,.08],[-.23,.02,-.1,.08]].forEach(function(q){ var w=mesh(new T.SphereGeometry(q[3],12,8),hair,q[0],q[1],q[2]); w.scale.set(1.1,.8,1); head.add(w); });
    var tf=mesh(new T.TorusGeometry(.07,.035,8,14,Math.PI*1.4),hair,.03,.27,.17); tf.rotation.set(.3,.1,2.2); head.add(tf); }
  if(o.hairStyle==='curly'){ for(var cu=0;cu<16;cu++){ var ca=cu/16*Math.PI*2, cr=cu%2?.2:.13, cy=cu%2?.1:.2; head.add(mesh(new T.SphereGeometry(.075,8,6),hair,Math.cos(ca)*cr,cy,Math.sin(ca)*cr-.04)); } }
  var eyes=new T.Group(); eyes.position.y=-.01; head.add(eyes);
  if(o.toon){ [-1,1].forEach(function(s){ var e=mesh(new T.SphereGeometry(.074,18,14),white,.104*s,.03,.235); e.scale.set(.9,1.05,.55); eyes.add(e);
      var ir=mesh(new T.SphereGeometry(.048,16,12),L(0x4a2c18),.104*s,.022,.263); ir.scale.z=.5; eyes.add(ir); eyes.add(mesh(new T.SphereGeometry(.024,12,8),dark,.104*s,.022,.28));
      eyes.add(mesh(new T.SphereGeometry(.013,8,6),new T.MeshBasicMaterial({color:0xffffff}),.104*s+.016,.045,.292));
      var br=mesh(new T.BoxGeometry(.12,.03,.03),hair,.1*s,.135,.25); br.rotation.z=-.2*s; head.add(br); }); }
  else [-1,1].forEach(function(s){ var e=mesh(new T.SphereGeometry(.045,12,10),white,.085*s,.04,.215); e.scale.z=.6; eyes.add(e); eyes.add(mesh(new T.SphereGeometry(.025,10,8),dark,.085*s,.04,.24));
    var br=mesh(new T.BoxGeometry(.09,.018,.02),hair,.085*s,.11,.235); br.rotation.z=-.12*s; head.add(br); });
  if(o.glasses){ [-1,1].forEach(function(s){ var gl=mesh(new T.TorusGeometry(.06,.012,6,16),dark,.085*s,.04,.25); head.add(gl); }); head.add(mesh(new T.BoxGeometry(.05,.012,.012),dark,0,.05,.25)); }
  if(o.beard){ var bd=mesh(new T.SphereGeometry(.2,14,10,0,Math.PI*2,Math.PI*.55,Math.PI*.45),L(o.beard),0,-.04,.04); head.add(bd); }
  if(o.toon){ var ns=mesh(new T.SphereGeometry(.05,12,10),L(0xF0B49C),0,-.03,.258); ns.scale.set(1.25,.85,.8); head.add(ns); } else head.add(mesh(new T.SphereGeometry(.04,10,8),skin,0,-.02,.255));
  var mo=mesh(new T.TorusGeometry(.055,.012,6,16,Math.PI),lip,0,-.08,.225); mo.rotation.z=Math.PI; head.add(mo);
  var mOpen=mesh(new T.SphereGeometry(.05,12,8),L(0x5a1f1a),0,-.095,.228); mOpen.scale.set(1,.05,.4); mOpen.visible=false; head.add(mOpen);   // boca aberta (fala)
  if(o.toon){ mo.position.set(0,-.1,.272); mo.scale.setScalar(.85); mOpen.position.set(0,-.112,.274); }
  if(o.hat==='helmet'){ var helm=S(o.hatColor||0xffffff,.3), hg=new T.Group(); hg.position.y=.07; head.add(hg); hg.add(mesh(new T.SphereGeometry(.3,24,14,0,Math.PI*2,0,Math.PI/2),helm,0,.02,0)); var brim=mesh(new T.CylinderGeometry(.345,.355,.028,28),helm,0,.025,.035); brim.scale.z=1.08; hg.add(brim); hg.add(mesh(new T.CylinderGeometry(.302,.302,.045,24,1,true),L(0x1B46C2),0,.07,0)); }
  if(o.hat==='cap'){ var cm=L(o.hatColor||0x1B46C2); head.add(mesh(new T.SphereGeometry(.285,22,12,0,Math.PI*2,0,Math.PI/2),cm,0,.08,0)); var vis=mesh(new T.CylinderGeometry(.2,.2,.03,20,1,false,-Math.PI/2,Math.PI),cm,0,.1,.2); vis.scale.z=1.2; head.add(vis); }
  if(o.hat==='straw'){ var stw=L(0xE2C27A); head.add(mesh(new T.CylinderGeometry(.5,.52,.03,24),stw,0,.13,0)); head.add(mesh(new T.CylinderGeometry(.22,.28,.24,18),stw,0,.26,0)); head.add(mesh(new T.CylinderGeometry(.285,.285,.05,18,1,true),L(0x7a4a2a),0,.17,0)); }
  if(o.hat==='leather'){ var lm=L(0x8a5a2b); head.add(rot(mesh(new T.CylinderGeometry(.5,.5,.04,6),lm,0,.13,0),0,.5,0)); head.add(mesh(new T.ConeGeometry(.3,.3,6),lm,0,.32,0)); }
  function arm(side){ var s2=new T.Group(); s2.position.set((TN?EB.rx*.9:.39*W)*side,TN?.44:.5,0); torso.add(s2);
    var aw=Math.sqrt(W); s2.add(mesh(new T.SphereGeometry(.115*aw,12,10),o.blazer?L(o.blazer):shirt)); s2.add(mesh(new T.CylinderGeometry(.1*aw,.085*aw,.34,12),o.blazer?L(o.blazer):shirt,0,-.17,0));
    var el=new T.Group(); el.position.y=-.34; s2.add(el); el.add(mesh(new T.SphereGeometry(.085,10,8),o.blazer?L(o.blazer):shirt)); el.add(mesh(new T.CylinderGeometry(.08,.068,.3,12),o.sleeves?shirt:skin,0,-.15,0));
    var hn=mesh(new T.SphereGeometry(.075,12,10),hand,0,-.33,0); hn.scale.set(1,1.15,.9); el.add(hn); return {sh:s2,el:el}; }
  var aL=arm(-1), aR=arm(1);
  if(o.prop==='clipboard'){ var cb=new T.Group(); cb.position.set(0,-.36,.08); aR.el.add(cb); cb.add(mesh(new T.BoxGeometry(.26,.34,.02),L(0x9b7442))); cb.add(mesh(new T.PlaneGeometry(.22,.27),new T.MeshBasicMaterial({color:0xffffff}),0,-.02,.012)); cb.add(mesh(new T.BoxGeometry(.1,.04,.03),L(0x888888),0,.16,.015)); cb.rotation.x=-.9; }
  if(o.prop==='tablet'){ var tb=new T.Group(); tb.position.set(0,-.36,.08); aR.el.add(tb); tb.add(mesh(new T.BoxGeometry(.26,.34,.025),L(0x22272e))); tb.add(mesh(new T.PlaneGeometry(.22,.29),new T.MeshBasicMaterial({color:0x8fb0ff}),0,0,.014)); tb.rotation.x=-.9; }
  if(o.prop==='rod'){ var rod=mesh(new T.CylinderGeometry(.015,.025,2.4,5),L(0x5a3a1a),0,-.2,.9); rod.rotation.x=1.2; aR.el.add(rod); }
  var ph=0, blinkT=2, gest=0;
  function update(dt,mov,t,mode,k){
    if(mov){ ph+=dt*9.5*(k||1); var s=Math.sin(ph), c=Math.cos(ph);
      lL.hip.rotation.x=s*.55; lR.hip.rotation.x=-s*.55; lL.knee.rotation.x=Math.max(0,-c)*.95; lR.knee.rotation.x=Math.max(0,c)*.95;
      lL.ft.rotation.x=-lL.hip.rotation.x*.4; lR.ft.rotation.x=-lR.hip.rotation.x*.4;
      aL.sh.rotation.set(-s*.5,0,-.08); aR.sh.rotation.set(o.prop&&o.prop!=='none'?s*.25-.2:s*.5,0,.08); aL.el.rotation.x=-.35; aR.el.rotation.x=o.prop&&o.prop!=='none'?-1.05:-.35;
      body.position.y=Math.abs(c)*.045; torso.rotation.y=s*.07; torso.rotation.x=.05; head.rotation.y*=.9; head.rotation.x=0;
    } else {
      [lL,lR].forEach(function(l){ l.hip.rotation.x*=.85; l.knee.rotation.x*=.85; l.ft.rotation.x*=.85; });
      body.position.y=Math.sin(t*2+(o.ph||0))*.008; torso.rotation.y*=.9; torso.rotation.x=0;
      if(mode==='look'){ head.rotation.y=Math.sin(t*1.3)*.75; head.rotation.x=-.08; aL.sh.rotation.x+=((-2.55)-aL.sh.rotation.x)*.12; aL.sh.rotation.z+=((-.35)-aL.sh.rotation.z)*.12; aL.el.rotation.x+=((-1.75)-aL.el.rotation.x)*.12; torso.rotation.y=Math.sin(t*1.3)*.15; }
      else if(mode==='talk'){ gest+=dt; head.rotation.y=Math.sin(t*1.7)*.18; head.rotation.x=Math.sin(t*5.2)*.06; aL.sh.rotation.x+=((-0.9+Math.sin(gest*3.1)*.35)-aL.sh.rotation.x)*.12; aL.sh.rotation.z=-.25; aL.el.rotation.x+=((-1.0+Math.sin(gest*4.3)*.3)-aL.el.rotation.x)*.12; }
      else { head.rotation.y*=.9; head.rotation.x*=.9; aL.sh.rotation.x*=.9; aL.sh.rotation.z=-.08; aL.el.rotation.x=-.2; }
      if(o.prop==='rod'){ aR.sh.rotation.x+=(-.5-aR.sh.rotation.x)*.1; aR.el.rotation.x=-.6+Math.sin(t*.8)*.05; }
      else if(o.prop&&o.prop!=='none'){ aR.sh.rotation.x+=(-.2-aR.sh.rotation.x)*.1; aR.el.rotation.x=-1.05; }
      else { aR.sh.rotation.x*=.9; aR.el.rotation.x=-.2; }
    }
    blinkT-=dt; if(blinkT<0){ eyes.scale.y=.12; if(blinkT<-.12){ eyes.scale.y=1; blinkT=2+Math.random()*3; } }
  }
  root.scale.setScalar(o.scale||1.2);
  return {g:root,update:update,phase:function(){ return ph; },body:body,torso:torso,head:head,aL:aL,aR:aR,lL:lL,lR:lR,mouth:mOpen,smile:mo};
}
var OP=makeChar({skin:0xe3ad86,shirt:0x1B46C2,pants:0x3d4a63,vest:0xFFB020,hat:'cap',hatColor:0x0A1B4D,prop:'clipboard',hair:0x3a2416,hairStyle:'long'}), player=OP.g; player.position.set(0,0,18); scene.add(player);
var NPC={
  iara:{n:'Iara',role:'aplicadora · Regional Sul (fictícia)',av:'#00949A',c:makeChar({skin:0xc98e66,shirt:0x00949A,pants:0x34435e,hair:0x1a120c,hairStyle:'long',hat:'cap',hatColor:0x00949A,prop:'clipboard',ph:1})},
  bene:{n:'Seu Bené',role:'técnico antigo · Regional Norte (fictícia)',av:'#8a5a2b',c:makeChar({skin:0xb07a52,shirt:0xE8DCC0,pants:0x5a4a3a,hair:0xd9d9d9,hairStyle:'white',beard:0xdddddd,hat:'leather',prop:'none',ph:2})},
  ze:{n:'Seu Zé',role:'pescador',av:'#2D5FE0',c:makeChar({skin:0x9c6a45,shirt:0xffffff,pants:0x3b5a8a,hat:'straw',prop:'rod',sleeves:false,ph:3})},
  lucia:{n:'Dona Lúcia',role:'moradora · associação',av:'#C2185B',c:makeChar({skin:0xd9a37a,shirt:0xE57399,pants:0x5a3a5a,skirt:0x6a3f8a,hair:0x3a2a20,hairStyle:'bun',prop:'none',ph:4})},
  rastro:{n:'Dra. Rastro',role:'auditora · controladoria (fictícia)',av:'#0A1B4D',c:makeChar({skin:0xe7b590,shirt:0xffffff,pants:0x0A1B4D,blazer:0x0A1B4D,hair:0x3a2a1a,hairStyle:'bun',glasses:true,prop:'tablet',ph:5})},
  morador:{n:'Seu Toinho',role:'morador · audiência pública',av:'#7a5a3a',c:makeChar({skin:0xa8724c,shirt:0x6a9a5a,pants:0x4a4a4a,hat:'straw',prop:'none',ph:6})}
};
Object.keys(NPC).forEach(function(k){ var n=NPC[k]; n.g=n.c.g; n.mode='idle'; n.lab=label(n.n,{w:240,h:60,size:34,scale:.95,bg:'rgba(255,255,255,.92)',border:n.av}); n.lab.position.y=2.95; n.g.add(n.lab); n.g.visible=false; scene.add(n.g); });
function placeNPC(k,x,z,faceX,faceZ){ var n=NPC[k]; if(typeof NAV!=='undefined'&&NAV){ var q=NAV.free(x,z); x=q.x; z=q.z; } // ninguém fica dentro de parede, mesa ou água
  n.g.visible=true; n.g.position.set(x,0,z); if(faceX!=null) n.g.rotation.y=Math.atan2(faceX-x,faceZ-z); }
function hideNPC(k){ NPC[k].g.visible=false; }

/* ---- foto de campo: renderiza a cena de outro ponto de vista e guarda a imagem ---- */
var SNAPTXT='PACAJUS · CAMPANHA 1 · FICTÍCIO';
var photoCam=new T.PerspectiveCamera(50,4/3,0.1,300);
function snap(P,Lk){
  var hideList=[beam,arrow,player,farol,radar].concat(markers).concat(typeof MEN!=='undefined'&&MEN?[MEN.c.g,MEN.bub]:[]).concat(typeof PM!=='undefined'?PM.map(function(m){ return m.g; }):[]).concat(typeof GG!=='undefined'&&GG?[GG]:[]), prev=hideList.map(function(o){ return o.visible; });
  hideList.forEach(function(o){ o.visible=false; }); var labs=[], npcVis=[]; Object.keys(NPC).forEach(function(k){ labs.push(NPC[k].lab); NPC[k].lab.visible=false; npcVis.push([NPC[k].g,NPC[k].g.visible]); NPC[k].g.visible=false; });
  photoCam.aspect=canvas.width/canvas.height; photoCam.updateProjectionMatrix(); photoCam.position.set(P[0],P[1],P[2]); photoCam.lookAt(Lk[0],Lk[1],Lk[2]);
  var fog=scene.fog; scene.fog=null; renderer.render(scene,photoCam); scene.fog=fog;
  var url='';
  try{ var c2=document.createElement('canvas'); c2.width=400; c2.height=300; var x=c2.getContext('2d'), W=canvas.width, H=canvas.height, sw=Math.min(W,H*4/3), sh=sw*3/4;
    x.drawImage(canvas,(W-sw)/2,(H-sh)/2,sw,sh,0,0,400,300);
    var gr=x.createRadialGradient(200,150,90,200,150,260); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(40,20,0,.28)'); x.fillStyle=gr; x.fillRect(0,0,400,300);
    x.fillStyle='rgba(255,170,60,.07)'; x.fillRect(0,0,400,300);
    x.font='600 15px '+FONT_C; x.fillStyle='rgba(255,210,120,.95)'; x.textAlign='right'; x.fillText(SNAPTXT,392,290);
    url=c2.toDataURL('image/jpeg',.82); }catch(e){ url=''; }
  hideList.forEach(function(o,i){ o.visible=prev[i]; }); labs.forEach(function(l){ l.visible=true; }); npcVis.forEach(function(v){ v[0].visible=v[1]; });
  return url; }
