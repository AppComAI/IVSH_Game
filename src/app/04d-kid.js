/* ===================== CORPO DE CRIANÇA (para o menino) =====================
   Proporções de criança: cabeça grande, olhos grandes e baixos no rosto, nariz pequeno, membros curtos.
   Três estilos: 'chibi' (cabeção de jogo de celular), 'desenho' (criança gordinha de desenho animado),
   'vinil' (bonequinho de brinquedo, plástico brilhante).
   Mesma interface de makeChar: {g,update,phase,body,torso,head,aL,aR,lL,lR,mouth,smile}. */
function makeKid(o){
  o=o||{}; var sty=o.style||'chibi';
  var ST={
    chibi:  {thigh:.11,shin:.09,legR:.085,body:[.25,.24,.22,.2],headR:.37,sh:.8,up:.13,lo:.11,armR:.062,scale:1.12,eye:'pebble'},
    desenho:{thigh:.18,shin:.16,legR:.09,body:[.3,.26,.29,.22],chest:[.25,.22,.23,.39],headR:.3,sh:.82,up:.17,lo:.15,armR:.068,scale:.92,eye:'cartoon'},
    vinil:  {thigh:.1,shin:.08,legR:.1,body:[.3,.18,.27,.22],headR:.33,sh:.86,up:.14,lo:.12,armR:.075,scale:1.05,eye:'dot'}
  }[sty];
  var M=sty==='vinil'?function(c){ return new T.MeshPhongMaterial({color:c,shininess:70,specular:0x3a3a3a}); }:L;
  var skin=M(o.skin||0xF6CDB2), shirt=M(o.shirt||0x8CC4EC), pc=M(o.polo||0x6FA8D8), pants=M(o.pants||0x5F93D6), cuff=M(o.cuff||0x4C7EC4), shoe=M(o.shoe||0x1d1d22), hair=M(o.hair||0x7E3A1E),
      white=M(0xffffff), dark=new T.MeshBasicMaterial({color:0x1a1410}), lip=L(0xA84840), cheek=L(o.cheek||0xF29A98), nose=M(o.nose||0xF0B49C), glow=new T.MeshBasicMaterial({color:0xffffff});
  var root=new T.Group(), body=new T.Group(); root.add(body);
  var shd=mesh(new T.CircleGeometry(.42,24),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false})); shd.rotation.x=-Math.PI/2; shd.position.y=.02; root.add(shd);
  var hipY=ST.thigh+ST.shin+.06, hips=new T.Group(); hips.position.y=hipY; body.add(hips);
  var B=ST.body, by=B[3], cap=sty==='vinil';
  var pb=mesh(new T.SphereGeometry(1,24,16),pants,0,.03,0); pb.scale.set(B[0]*.9,.13,B[2]*.9); hips.add(pb);   // quadril (calça)
  function leg(side){ var hp=new T.Group(); hp.position.set(B[0]*.42*side,0,0); hips.add(hp);
    hp.add(mesh(new T.SphereGeometry(ST.legR*1.05,14,10),pants)); hp.add(mesh(new T.CylinderGeometry(ST.legR,ST.legR*.95,ST.thigh,14),pants,0,-ST.thigh/2,0));
    var kn=new T.Group(); kn.position.y=-ST.thigh; hp.add(kn); kn.add(mesh(new T.SphereGeometry(ST.legR*.95,14,10),pants));
    kn.add(mesh(new T.CylinderGeometry(ST.legR*.95,ST.legR*1.04,ST.shin,14),pants,0,-ST.shin/2,0));
    kn.add(mesh(new T.CylinderGeometry(ST.legR*1.12,ST.legR*1.12,.035,14),cuff,0,-ST.shin+.025,0));   // barra dobrada
    var ft=new T.Group(); ft.position.y=-ST.shin; kn.add(ft);
    var sb=mesh(new T.SphereGeometry(1,16,10),shoe,0,-.02,.03); sb.scale.set(ST.legR*1.25,.055,ST.legR*1.9); ft.add(sb);
    var so=mesh(new T.CylinderGeometry(1,1,.024,16),white,0,-.058,.03); so.scale.set(ST.legR*1.32,1,ST.legR*1.98); ft.add(so);
    var tc=mesh(new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),white,0,-.05,.03+ST.legR*1.45); tc.scale.set(ST.legR*.95,.04,ST.legR*.6); ft.add(tc);
    return {hip:hp,knee:kn,ft:ft}; }
  var lL=leg(-1), lR=leg(1);
  var torso=new T.Group(); torso.position.y=hipY; body.add(torso);
  if(cap){ var cp=mesh(new T.CapsuleGeometry(B[0],B[1],10,24),shirt,0,by,0); cp.scale.z=B[2]/B[0]; torso.add(cp); }
  var EL=cap?[]:[B].concat(ST.chest?[ST.chest]:[]);   // barriga (+ peito, no estilo desenho)
  EL.forEach(function(e){ var m=mesh(new T.SphereGeometry(1,32,24),shirt,0,e[3],0); m.scale.set(e[0],e[1],e[2]); torso.add(m); });
  // meia-largura e profundidade da superfície do corpo numa altura y
  function xE(e,y){ var q=1-((y-e[3])/e[1])*((y-e[3])/e[1]); return q>0?e[0]*Math.sqrt(q):0; }
  function zE(e,x,y){ var w=xE(e,y); return w>Math.abs(x)?e[2]*Math.sqrt(1-(x/w)*(x/w))*(w/e[0]):0; }
  function xB(y){ if(cap){ var yy=Math.max(0,Math.abs(y-by)-B[1]/2); return Math.sqrt(Math.max(0,B[0]*B[0]-yy*yy)); } return Math.max.apply(null,EL.map(function(e){ return xE(e,y); })); }
  function zB(x,y){ if(cap){ var w=xB(y); return w>Math.abs(x)?B[2]*Math.sqrt(1-(x/w)*(x/w))*(w/B[0]):0; } return Math.max.apply(null,EL.map(function(e){ return zE(e,x,y); })); }
  var topY=cap?by+B[1]/2+B[0]:Math.max.apply(null,EL.map(function(e){ return e[3]+e[1]; }));
  // polo: gola deitada, abertura com botões, emblema amarelo
  var ny=topY-.045, rr=xB(ny)+.004, ring=mesh(new T.TorusGeometry(rr,.018,8,28),pc,0,ny,0); ring.rotation.x=Math.PI/2; ring.scale.y=zB(0,ny)/Math.max(.01,xB(ny)); torso.add(ring);
  [-1,1].forEach(function(s){ var y=ny-.045, x=.04*s, f=mesh(new T.BoxGeometry(.055,.075,.012),pc,x,y,zB(x,y)+.004); f.rotation.set(-.5,0,.55*s); torso.add(f); });
  [ny-.07,ny-.12].forEach(function(y){ torso.add(mesh(new T.SphereGeometry(.01,8,6),white,0,y,zB(0,y)+.003)); });
  var ex0=B[0]*.48, ey0=by+B[1]*.38; torso.add(mesh(new T.SphereGeometry(.016,8,6),M(0xF2C14E),ex0,ey0,zB(ex0,ey0)+.001));
  // braços (ombro rente à lateral do corpo)
  function arm(side){ var shY=ST.chest?ST.chest[3]+ST.chest[1]*.35:by+B[1]*(cap?.55:.5), s2=new T.Group(); s2.position.set((xB(shY)-ST.armR*.35)*side,shY,0); torso.add(s2);
    var sl=mesh(new T.SphereGeometry(ST.armR*1.18,14,10),shirt); sl.scale.y=.9; s2.add(sl);
    s2.add(mesh(new T.CylinderGeometry(ST.armR*1.18,ST.armR*1.12,ST.up*.5,14),shirt,0,-ST.up*.25,0));
    s2.add(mesh(new T.CylinderGeometry(ST.armR,ST.armR*.95,ST.up,14),skin,0,-ST.up/2,0));
    var el=new T.Group(); el.position.y=-ST.up; s2.add(el); el.add(mesh(new T.SphereGeometry(ST.armR*.95,12,8),skin));
    el.add(mesh(new T.CylinderGeometry(ST.armR*.95,ST.armR*.85,ST.lo,14),skin,0,-ST.lo/2,0));
    var hn=mesh(new T.SphereGeometry(ST.armR*1.25,14,10),skin,0,-ST.lo-ST.armR*.6,0); hn.scale.set(1,1.1,.9); el.add(hn);
    return {sh:s2,el:el}; }
  var aL=arm(-1), aR=arm(1);
  // cabeça
  var R=ST.headR, head=new T.Group(); head.position.y=topY+R*.84; torso.add(head);
  var HX=sty==='desenho'?1.08:1.04, hd=mesh(new T.SphereGeometry(R,32,24),skin); hd.scale.set(HX,.97,1); head.add(hd);
  function zH(x,y){ var u=R*R-(x/HX)*(x/HX)-(y/.97)*(y/.97); return u>0?Math.sqrt(u):0; }
  if(sty!=='vinil') [-1,1].forEach(function(s){ var e=mesh(new T.SphereGeometry(R*.19,14,10),skin,R*HX*.98*s,-R*.08,-R*.02); e.scale.set(.55,1,.8); head.add(e); });   // orelhas
  var eyes=new T.Group(); head.add(eyes); var ey=-R*.1, ex=R*(sty==='desenho'?.34:.37);
  [-1,1].forEach(function(s){ var x=ex*s, z=zH(x,ey);
    if(ST.eye==='pebble'){ var p=mesh(new T.SphereGeometry(R*.16,16,12),dark,x,ey,z-R*.035); p.scale.set(.82,1.12,.5); eyes.add(p);
      eyes.add(mesh(new T.SphereGeometry(R*.055,8,6),glow,x+R*.045*s,ey+R*.065,z+R*.03)); eyes.add(mesh(new T.SphereGeometry(R*.026,8,6),glow,x-R*.035*s,ey-R*.06,z+R*.03)); }
    else if(ST.eye==='cartoon'){ var w=mesh(new T.SphereGeometry(R*.2,16,12),white,x,ey,z-R*.07); w.scale.set(.86,1.08,.5); eyes.add(w);
      var ir=mesh(new T.SphereGeometry(R*.13,14,10),L(0x5a3418),x,ey-R*.025,z+R*.0); ir.scale.set(1,1.1,.45); eyes.add(ir);
      var pu=mesh(new T.SphereGeometry(R*.065,10,8),dark,x,ey-R*.025,z+R*.035); pu.scale.z=.5; eyes.add(pu);
      eyes.add(mesh(new T.SphereGeometry(R*.04,8,6),glow,x+R*.045*s,ey+R*.04,z+R*.055)); }
    else { var d=mesh(new T.SphereGeometry(R*.1,14,10),dark,x,ey,z-R*.025); d.scale.set(.78,1.3,.45); eyes.add(d); eyes.add(mesh(new T.SphereGeometry(R*.032,8,6),glow,x+R*.03*s,ey+R*.055,z+R*.02)); }
    if(sty!=='vinil'){ var byy=ey+R*.31, br=mesh(new T.TorusGeometry(R*.11,R*.022,6,12,Math.PI*.8),hair,x,byy,zH(x,byy)+.002); br.rotation.z=Math.PI*.1; head.add(br); }
    var ck=mesh(new T.SphereGeometry(R*.14,12,8),cheek,R*.56*s,-R*.33,zH(R*.56,-R*.33)-R*.06); ck.scale.set(1,.68,.4); head.add(ck); });
  eyes.children.forEach(function(c){ c.position.y-=ey; }); eyes.position.y=ey;   // piscar em torno do olho
  if(sty!=='vinil'){ var nz=mesh(new T.SphereGeometry(R*.075,12,8),nose,0,-R*.24,zH(0,-R*.24)+.001); nz.scale.set(1.25,.9,.7); head.add(nz); }
  var my=-R*.45, mo=mesh(new T.TorusGeometry(R*.12,R*.026,6,16,Math.PI),lip,0,my,zH(0,my)+.003); mo.rotation.z=Math.PI; head.add(mo);
  var mOpen=mesh(new T.SphereGeometry(R*.11,12,8),L(0x5a1f1a),0,my-R*.03,zH(0,my)+.002); mOpen.scale.set(1,.05,.35); mOpen.visible=false; head.add(mOpen);
  // cabelo: calota inclinada para trás + franja de mechas + topete
  var hc=mesh(new T.SphereGeometry(R*1.045,28,16,0,Math.PI*2,0,Math.PI*.5),hair,0,R*.05,-R*.05); hc.rotation.x=-.45; head.add(hc);
  var back=mesh(new T.SphereGeometry(R*1.03,24,14),hair,0,R*.02,-R*.12); back.scale.set(1,.92,.92); head.add(back);   // nuca
  var fr=sty==='vinil'?[[-.42,.6,-.45,1.25],[-.08,.72,-.1,1.4],[.3,.66,.35,1.3],[-.82,.2,-.9,.9],[.84,.2,.9,.9]]:[[-.55,.52,-.55,1],[-.22,.64,-.22,1.1],[.12,.66,.15,1.1],[.45,.56,.5,1],[-.78,.25,-.9,.8],[.8,.25,.9,.8]];
  fr.forEach(function(q){ var x=R*q[0], y=R*q[1], m=mesh(new T.SphereGeometry(R*.2*q[3],14,10),hair,x,y,Math.max(zH(x,y)-R*.08,-R*.2)); m.scale.set(1.25,.7,.55); m.rotation.z=q[2]; head.add(m); });
  if(sty==='vinil'){ var sw=mesh(new T.TorusGeometry(R*.18,R*.075,10,18,Math.PI*1.3),hair,R*.08,R*1.0,R*.12); sw.rotation.set(0,.2,.6); head.add(sw); }
  else [[.02,1.0,.02,.15,-.25]].forEach(function(q){ var m=mesh(new T.SphereGeometry(R*q[3],12,8),hair,R*q[0],R*q[1],R*q[2]); m.scale.set(.8,1.3,.8); m.rotation.z=q[4]; head.add(m); });
  root.scale.setScalar((o.scale||1)*ST.scale);
  var ph=0, blinkT=2.5, gest=0;
  function update(dt,mov,t,mode,k){
    if(mov){ ph+=dt*11*(k||1); var s=Math.sin(ph), c=Math.cos(ph);
      lL.hip.rotation.x=s*.6; lR.hip.rotation.x=-s*.6; lL.knee.rotation.x=Math.max(0,-c)*.8; lR.knee.rotation.x=Math.max(0,c)*.8;
      aL.sh.rotation.set(-s*.6,0,-.25); aR.sh.rotation.set(s*.6,0,.25); aL.el.rotation.x=-.3; aR.el.rotation.x=-.3;
      body.position.y=Math.abs(c)*.035; torso.rotation.y=s*.08; head.rotation.x=0; }
    else { [lL,lR].forEach(function(l){ l.hip.rotation.x*=.85; l.knee.rotation.x*=.85; });
      body.position.y=Math.sin(t*2.2)*.006; torso.rotation.y*=.9;
      if(mode==='talk'){ gest+=dt; head.rotation.y=Math.sin(t*1.7)*.15; head.rotation.x=Math.sin(t*5)*.05; aL.sh.rotation.x+=((-0.8+Math.sin(gest*3.1)*.4)-aL.sh.rotation.x)*.12; aL.sh.rotation.z=-.35; aL.el.rotation.x+=((-0.9+Math.sin(gest*4.3)*.3)-aL.el.rotation.x)*.12; aR.sh.rotation.z=.25; aR.sh.rotation.x*=.9; }
      else { head.rotation.y*=.9; head.rotation.x*=.9; aL.sh.rotation.x*=.9; aR.sh.rotation.x*=.9; aL.sh.rotation.z=-.25; aR.sh.rotation.z=.25; aL.el.rotation.x=-.15; aR.el.rotation.x=-.15; } }
    blinkT-=dt; if(blinkT<0){ eyes.scale.y=.12; if(blinkT<-.12){ blinkT=2+Math.random()*3; eyes.scale.y=1; } } }
  var sc=(o.scale||1)*ST.scale; root.updateMatrixWorld(true); var H=new T.Box3().setFromObject(root).max.y;
  return {g:root,update:update,phase:function(){ return ph; },body:body,torso:torso,head:head,aL:aL,aR:aR,lL:lL,lR:lR,mouth:mOpen,smile:mo,
    H:H,hip:hipY*sc,sc:sc,hipL:hipY};   // H: altura total no mundo; hip: altura do quadril no mundo; hipL: idem, em unidades locais do corpo
}
