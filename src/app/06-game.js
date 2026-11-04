/* ===================== FLUXO: abertura, prólogo e campanha ===================== */
var CASES=[
 {code:'D1.1',t:'A régua',place:'mata ciliar, margem oeste',a:3.22,off:5.4,npc:'iara',na:2.95,noff:4.4},
 {code:'D2.5',t:'Evidência mínima',place:'casa da curva, margem nordeste',a:C2a-0.22,off:3.0,npc:'ze',na:C2a-0.08,noff:1.3},
 {code:'D3.1',t:'Regra de ausência',place:'sede da associação, margem leste',a:C3a,off:5.0,npc:'lucia',na:C3a+0.1,noff:6.2},
 {code:'D2.3',t:'Mecanismo principal',place:'bebedouro do gado, margem noroeste',a:C4a+0.3,off:3.0,npc:'bene',na:C4a+0.42,noff:2.2},
 {code:'D2.1',t:'Concordância',place:'balneário, margem sudeste',a:C5a-0.32,off:2.8,npc:'iara',na:C5a-0.2,noff:2.0}
];
function outLake(q,m){ var a=Math.atan2(q.z,q.x), r=Math.hypot(q.x,q.z), lim=lakeR(a)+m; if(r<lim){ q.x=Math.cos(a)*lim; q.z=Math.sin(a)*lim; } return q; }
CASES.forEach(function(c,i){ c.p=shore(c.a,c.off); c.n=outLake({x:c.p.x+2.1,z:c.p.z-0.9},0.8);
  var hit=mesh(new T.CylinderGeometry(2.3,2.3,5,10),new T.MeshBasicMaterial({visible:false}),c.p.x,2.5,c.p.z); hit.userData={kind:'case',i:i}; scene.add(hit); pickables.push(hit); });
var PHOTO={ /* fotos tiradas de dentro d'água, de frente para a margem */
 'D1.1':function(){ var c=shore(3.12,-5.6), l=shore(3.3,1.6); return [[c.x,2.6,c.z],[l.x,0.8,l.z]]; },
 'D2.5':function(){ var c=shore(C2a+0.06,-2.4), l=shore(C2a-0.02,1.4); return [[c.x,1.5,c.z],[l.x,0.0,l.z]]; },
 'D2.3':function(){ var c=shore(C4a+0.26,-3.8), l=shore(C4a,0.1); return [[c.x,1.8,c.z],[l.x,0.5,l.z]]; },
 'D2.1':function(){ var c=shore(C5a-0.06,-4.2), l=shore(C5a+0.05,3.2); return [[c.x,2.4,c.z],[l.x,1.0,l.z]]; }
};
function photo(code,cap){ var pp=PHOTO[code](); flash(); SFX.shutter(); var url=snap(pp[0],pp[1]); if(url){ G.evid.push({code:code,cap:cap,url:url}); renderEvid(); } return url; }
function pola(url,t,sub){ return '<figure class="pola">'+(url?'<img alt="Foto de campo: '+t+'" src="'+url+'">':'')+'<figcaption>'+t+'<small>'+sub+'</small></figcaption></figure>'; }
function setScore(code,v,meta){ G.sc[code]=v; G.meta[code]=meta||{}; renderDash(); }
function rulerHTML(code,onPick,opt){ var r=IX[code]; opt=opt||{};
  return '<div class="ihead"><span class="code">'+code+'</span><span class="nm">'+r[1]+'</span><span class="sn">'+(r[5]==='I'?'Inverso (protetivo)':'Direto')+'</span></div>'+
    '<p class="idef">'+r[2]+' <b>Evidência mínima:</b> '+r[3]+'.</p>'+
    '<div class="ruler" role="group" aria-label="Régua do indicador '+code+'">'+r[4].map(function(d,i){ return '<button type="button" class="r'+i+'" data-h="'+H(function(){ onPick(i); })+'"><b>'+i+'</b>'+d+'</button>'; }).join('')+'</div>'+
    (opt.na===false?'':'<div class="nr"><span>Sem a evidência mínima? Vale a regra de ausência.</span>'+btn('Sem registro (fora da média)',function(){ onPick(null); },'')+'</div>'); }
function rulerShow(code,picked,gab){ var r=IX[code];
  return '<div class="ruler" aria-disabled="true">'+r[4].map(function(d,i){ var c='r'+i+(i===gab?' gab':'')+(i===picked&&picked!==gab?' pick':''); return '<button type="button" class="'+c+'" disabled><b>'+i+'</b>'+d+'</button>'; }).join('')+'</div>'+
    '<p class="note">'+(picked===gab?'Contorno verde: sua nota, igual ao descritor que a evidência sustenta.':(picked==null&&gab!=null?'Você marcou “sem registro”. Contorno verde: a nota que a evidência sustenta.':(gab==null?'':'Contorno laranja: sua nota. Contorno verde: a nota que a evidência sustenta.')))+'</p>'; }
function dimFormula(sc,dc){ var it=CODES.filter(function(c){ return dimOf(c)===dc; }), vals=[], na=[];
  it.forEach(function(c){ var v=sc[c]; if(v===null) na.push(c); else if(v!==undefined) vals.push(v); });
  var m=vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:null;
  return dc+' = ('+vals.join(' + ')+') / '+vals.length+' = '+fmt(m)+(na.length?' <span style="color:var(--muted)">· '+na.join(', ')+' sem registro, fora da média</span>':''); }

/* ---------- tela de título ---------- */
function intro(){
  G.mode='title'; hud.hidden=true; objEl.hidden=true; CAM.orbit=true; otto.visible=true; otto.material.opacity=1; serras.visible=false; scene.fog.near=600; scene.fog.far=1400;
  $('gload').hidden=true;
  panel('<span class="k">RPG 3D · IVSH · entrega 1 de 2</span><h3>A Régua das Águas</h3><p>Você é aplicador(a) do <b>IVSH</b>, o índice proposto para medir a vulnerabilidade socioambiental dos açudes da Gerência Metropolitana de Fortaleza.</p><p>Missão: fazer a primeira campanha com a régua no <b>Açude Jandaia</b> e levar a ficha à <b>Mesa da Controladoria</b>, onde ela vira decisão de orçamento.</p><p class="note">Açudes, pessoas, fotos e notas são fictícios. As regras do índice vêm do artigo.</p>'+
    chs([['Começar',startGame,true],['❔ Regras do jogo',function(){ openRules(); }]],true),'glass');
}
HOOK.play=function(){ if(G.mode==='title') startGame(); };
function startGame(){ SFX.start(); SFX.scene('abertura'); resetState(); renderDash(); setHud(); abertura1(); }

/* ---------- ato 0: a COGERH já mede a água (RMQA/IET); o IVSH mede o entorno ---------- */
function ietLegend(){ return '<div class="tlg">'+IET_CL.map(function(c){ return '<span><i style="background:'+c.c+'"></i>'+c.n+'</span>'; }).join('')+'</div>'; }
function abertura1(){
  G.mode='abertura'; CAM.orbit=true; coletaLab.visible=false;
  panel('<span class="k">Escala da rede · RMQA e IET (COGERH)</span><h3>Daqui de cima, a COGERH já vê a água</h3>'+
    '<p>A rede de monitoramento da qualidade da água da COGERH, a <b>RMQA</b>, cobre 155 reservatórios em campanhas periódicas. A cada trimestre, o estado trófico dos açudes é classificado pelo <b>IET</b>, o Índice de Estado Trófico.</p>'+
    '<p>A pergunta dele: <b>quanto a água do açude está enriquecida por nutrientes?</b> Nutriente em excesso alimenta algas e cianobactérias.</p>'+ietLegend()+
    '<p class="note">Mapa ilustrativo: regiões, posições e classes dos pontos são fictícias.</p>'+cont('Descer até o açude',descer),'glass');
}
function descer(){
  closePanel(); SFX.whoosh(); G.mode='cine'; CAM.z=0; CAM.desired(); var pd=CAM.pd.clone(), ld=CAM.ld.clone();
  flyTo([[40,82,56],[30,24,40],[12,7.5,24],[2,5,14.5],[-5,4.2,-1],[-15,11,-13],[pd.x,pd.y,pd.z]],
        [[0,0,0],[0,0,0],[0,1.5,0],[0,1.2,-3],[-12,1.5,-9],[0,0,0],[ld.x,ld.y,ld.z]],9.5,abertura2,
        {hint:true,onT:function(k){ var e=Math.max(0,Math.min(1,(k-0.1)/0.28)); otto.material.opacity=1-e*e*(3-2*e); var f=Math.min(1,k/0.42);
          scene.fog.near=600-530*f; scene.fog.far=1400-1250*f; if(k>0.25) serras.visible=true; if(k>=0.42) otto.visible=false; if(k>=1){ scene.fog.near=70; scene.fog.far=150; } }});
}
function abertura2(){
  G.mode='abertura'; coletaLab.visible=true;
  var rows=[['Pergunta','Quanto a água está enriquecida por nutrientes?','Quão vulnerável é o reservatório e seu entorno?'],['Onde olha','Dentro d’água, no ponto de amostragem','Na margem e no entorno do açude'],['Dados','Amostras analisadas em laboratório','Evidência de campo registrada nas fichas'],['Situação','Já existe, em rede, com classificação trimestral','Proposta, para ir na mesma campanha'],['Governança e conflito de uso','Não medidos','Dimensões D3 e D4']];
  panel('<span class="k">Escala do açude · IVSH (proposta)</span><h3>Aqui embaixo, a pergunta muda</h3><p>O barco da RMQA coleta a água; o IET diz como ela está. O IVSH olha o que está em volta, com o que a equipe de campo vê. A ideia do artigo é levar a régua na mesma campanha.</p>'+
    '<div style="overflow-x:auto"><table class="cmp"><thead><tr><th></th><th>IET · COGERH</th><th>IVSH · proposta</th></tr></thead><tbody>'+rows.map(function(r){ return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>'; }).join('')+'</tbody></table></div>'+
    '<p class="note">O artigo lista como pesquisa futura correlacionar o IVSH com o IET. O jogo não afirma relação entre os dois.</p>'+cont('Entrar no Jandaia',prologo));
}

/* ---------- ato 1: mundo sem régua ---------- */
var PRO_A=['carnauba','juazeiro','mandacaru'], IARA_ORD=['carnauba','juazeiro','mandacaru'], BENE_ORD=['juazeiro','carnauba','mandacaru'];
function prologo(){
  G.mode='prologo'; releaseCam(); player.position.set(0,0,17.8); player.rotation.y=Math.PI; CAM.boost=1; CAM.z=0.6;
  placeNPC('iara',-1.7,15.0,0,17.8); placeNPC('bene',1.7,15.0,0,17.8);
  SFX.scene('campo'); G.prolog.order=[]; drawFichas();
}
function drawFichas(){
  var ord=G.prolog.order;
  var cards=PRO_A.map(function(id){ var a=acude(id), k=ord.indexOf(id);
    return btn('<span class="ord">'+(k>=0?(k+1)+'º':'')+'</span><span class="rg">'+a.reg+'</span><b>Açude '+a.n+'</b>'+Object.keys(a.nom).map(function(q){ return q+': <q>“'+a.nom[q]+'”</q>'; }).join(''),function(){ if(k>=0) return; ord.push(id); SFX.chip(); if(ord.length===3) setTimeout(revealProlog,350); drawFichas(); },'ficha'+(k>=0?' sel':'')); }).join('');
  panel(npc('bene','Chegaram as fichas das três regionais. Cada uma escreveu do seu jeito, como sempre foi. Antes da régua, me diga: qual desses açudes está mais vulnerável?')+
    '<p>Clique nas fichas na ordem, do <b>mais vulnerável</b> ao <b>menos vulnerável</b>.</p><div class="fichas">'+cards+'</div>'+(ord.length?btn('Recomeçar a ordem',function(){ G.prolog.order=[]; drawFichas(); },''):''),'full');
}
function ordTxt(o){ return o.map(function(id){ return acude(id).n; }).join(' › '); }
function revealProlog(){
  var me=G.prolog.order, sameI=me.join()===IARA_ORD.join(), sameB=me.join()===BENE_ORD.join();
  panel('<div class="res"><b>Sua ordem:</b> '+ordTxt(me)+'<br><b>Iara:</b> '+ordTxt(IARA_ORD)+'<br><b>Seu Bené:</b> '+ordTxt(BENE_ORD)+'</div>'+
    npc('iara','“Escassa” é pior que “moderada”, ora. Carnaúba primeiro.')+npc('bene','Pois para mim “moderada” quer dizer desmatamento moderado, e no Juazeiro ainda tem esgoto. Juazeiro primeiro.')+
    '<p>'+(sameI||sameB?'Você concordou com '+(sameI?'a Iara':'o Seu Bené')+', mas nenhum de vocês consegue provar a ordem.':'Três pessoas, três ordens.')+' <b>Sem régua, só opinião.</b> E como explicar à comunidade por que um açude recebe recurso e o outro não?</p>'+
    cont('Chamar a régua',chamarRegua),'full');
}
function chamarRegua(){
  closePanel(); G.mode='cine'; regua.visible=true; regua.position.y=-9; regua.userData.goal=0; SFX.regua(); setTimeout(splash,500);
  var a0=Math.atan2(camera.position.z,camera.position.x), pts=[], lks=[];
  for(var i=1;i<=7;i++){ var a=a0-i/7*Math.PI*1.7, r=21-i*0.3, h=5+i*0.8; pts.push([Math.cos(a)*r,h,Math.sin(a)*r]); lks.push([0,1.5+i*0.5,0]); }
  pts.push([11,10,24]); lks.push([0,-2,0]);
  flyTo(pts,lks,7.5,function(){ toast('A régua chegou ao açude');
    setTimeout(function(){ panel(npc('iara','Agora sim: a régua. Cada indicador tem quatro descritores escritos, de 0 a 3. Zero é a condição mais favorável e três a mais vulnerável, em todos os 18 indicadores.')+
      '<div class="math">Carnaúba, mata ciliar “Escassa” → descritor 2 da D1.1, “escassa/fragmentada” → <b>nota 2</b></div>'+
      '<p>Sua vez. Na ficha do Mandacaru, a mata ciliar está “Bem preservada em parte”. Que nota a régua dá?</p>'+
      chs([['0 · contínua e densa',function(){ quiz(0); }],['1 · contínua com clareiras',function(){ quiz(1); }],['Não dá para converter sem foto e descrição',function(){ quiz(2); }]])); },700); },{hold:true,hint:true});
}
function quiz(i){
  var ok=i===2; G.dec.push(ok); bump({xp:ok?10:0}); if(ok) SFX.good(); else SFX.soft();
  G.reguaOn=true; renderDash();
  var reg=ACUDES.filter(function(a){ return !a.me; }).map(function(a){ return {n:a.n,id:a.id,v:calc(a.regd).ivsh}; }).sort(function(x,y){ return y.v-x.v; });
  var same=reg.map(function(r){ return r.id; }).join()===G.prolog.order.join();
  bump({social:10});
  panel(npc('iara',(ok?'Exato. “Em parte” não diz nada sobre continuidade e densidade: pode ser 1, pode ser 2. ':'Pode ser 1, pode ser 2: “em parte” não diz nada sobre continuidade e densidade. ')+'Sem foto e descrição, não dá para converter. Por isso as regionais voltaram a campo com a régua e refizeram as fichas.')+
    '<div class="res">Fichas refeitas com a régua: '+reg.map(function(r){ return '<b>'+r.n+' '+fmt(r.v)+'</b>'; }).join(' · ')+'. Falta o Jandaia: é a sua campanha. '+(same?'Sua ordem do começo coincidiu com a da régua, mas agora ela tem conta e evidência por trás.':'A ordem da régua difere da sua: agora existe conta e evidência para discutir.')+'</div>'+
    '<p class="note">Veja o painel ao lado: o ranking agora tem números. São valores registrados, ainda não auditados.</p>'+cont('Começar a campanha no Jandaia',startCampaign));
}

/* ---------- ato 2: campanha de campo ---------- */
function startCampaign(){
  coletaLab.visible=false; releaseCam(); CAM.boost=0; CAM.z=0.9;
  Object.keys(PRE).forEach(function(c){ G.sc[c]=PRE[c].v; G.meta[c]={ev:PRE[c].ev,pre:true}; });
  G.caseI=0; G.cur=CASES[0].code; renderDash();
  CASES.forEach(function(c){ if(c.npc==='iara'&&c!==CASES[0]) return; placeNPC(c.npc,c.n.x,c.n.z,c.p.x,c.p.z); });
  showMarkers(true); hud.hidden=false; setHud(); closePanel(); G.mode='cine'; placeBeam(CASES[0].p.x,CASES[0].p.z);
  CAM.z=0; CAM.boost=0; CAM.desired(); var a0=Math.atan2(camera.position.z,camera.position.x), pts=[], lks=[];
  for(var i=1;i<=9;i++){ var a=a0+i/9*Math.PI*1.75, r=28-i*0.3, h=14+Math.sin(i/9*Math.PI)*7; pts.push([Math.cos(a)*r,h,Math.sin(a)*r]); lks.push([0,0.5,0]); }
  pts.push([CAM.pd.x,CAM.pd.y,CAM.pd.z]); lks.push([CAM.ld.x,CAM.ld.y,CAM.ld.z]);
  toast('Campanha 1 · Açude Jandaia · 13 fichas já registradas, 5 casos com você');
  flyTo(pts,lks,8,function(){ G.mode='explore'; showObj(); },{hint:false});
}
function showObj(){
  if(G.mode!=='explore'){ objEl.hidden=true; return; }
  objEl.hidden=false; var h;
  if(G.caseI<CASES.length){ var c=CASES[G.caseI]; h='<span><b>Caso '+(G.caseI+1)+'/5 · '+c.t+'</b><br>'+c.code+' · '+c.place+'</span>'+btn('Ir até lá',function(){ walkTo(c.p.x,c.p.z,true); },'');
  } else h='<span><b>Ficha completa</b><br>18 indicadores registrados no Jandaia</span>'+btn('Fechar a ficha',fecharFicha,'');
  objEl.innerHTML=h; var P=PEND; PEND={}; Array.prototype.forEach.call(objEl.querySelectorAll('[data-h]'),function(el){ el.addEventListener('click',function(){ SFX.click(); P[el.getAttribute('data-h')](); }); });
}
function openFicha(code){
  var p=PRE[code]; if(!p) return; G.mode='dialog'; objEl.hidden=true; G.target=null; var v=G.sc[code];
  panel('<span class="k">Ficha já registrada · Jandaia</span><div class="ihead"><span class="code">'+code+'</span><span class="nm">'+IX[code][1]+'</span><span class="sn">nota '+(v==null?'s/r':v)+'</span></div>'+
    '<p><b>Observação:</b> '+p.obs+'</p><p class="idef"><b>Evidência:</b> '+p.ev+'.</p>'+rulerShow(code,v,v).replace(/<p class="note">.*<\/p>/,'')+cont('Fechar',function(){ closePanel(); G.mode='explore'; showObj(); }));
}
function openCase(){ G.mode='dialog'; objEl.hidden=true; var c=CASES[G.caseI]; G.cur=c.code; renderDash(); [case1,case2,case3,case4,case5][G.caseI](); }
function finishCase(){
  G.caseI++; CAM.boost=0;
  if(G.caseI===1){ var c5=CASES[4]; placeNPC('iara',c5.n.x,c5.n.z,c5.p.x,c5.p.z); }
  G.cur=G.caseI<CASES.length?CASES[G.caseI].code:null; renderDash();
  G.mode='explore'; closePanel();
  if(G.caseI<CASES.length){ placeBeam(CASES[G.caseI].p.x,CASES[G.caseI].p.z); toast('Caso '+(G.caseI+1)+' de 5: '+CASES[G.caseI].t); }
  else { hideBeam(); toast('Os 18 indicadores estão registrados'); SFX.good(); }
  showObj(); setHud();
}

/* caso 1 · a régua (D1.1) */
function case1(){
  panel(npc('iara','Primeiro caso, o mais básico: a mata ciliar, D1.1. A régua pede duas coisas como evidência mínima: a descrição na ficha e uma foto da margem. Sem foto, a nota não se sustenta.')+
    cont('📷 Fotografar a margem oeste',function(){ var url=photo('D1.1','margem oeste'); bump({rast:10}); step(url); }));
  function step(url){ panel(pola(url,'D1.1 · margem oeste','Manchas isoladas de juazeiro, com trechos longos de solo exposto entre elas.')+rulerHTML('D1.1',pick),'full'); }
  function pick(v){ var ok=v===2; G.dec.push(ok); bump({xp:ok?15:5}); if(ok) SFX.good(); else SFX.soft();
    var fb={0:'Contínua e densa? A foto mostra o contrário: manchas isoladas. A descrição sustenta 2.',1:'Quase. “Contínua com clareiras” supõe uma faixa contínua com aberturas. Aqui as manchas são isoladas, com trechos longos sem árvore: é fragmentada, nota 2.',2:'Isso: escassa/fragmentada. Repare que a nota saiu do descritor, não da impressão. Duas pessoas olhando a mesma foto chegam ao mesmo número.',3:'“Ausente” seria sem vegetação nativa. Ainda há manchas de juazeiro, então não é 3. A descrição sustenta 2.'}[v];
    if(v===null) fb='Aqui a evidência existe: temos foto e descrição. A regra de ausência é para quando falta a evidência mínima. A descrição sustenta 2.';
    setScore('D1.1',2,{ev:'foto + descrição'});
    panel(npc('iara',fb)+rulerShow('D1.1',v,2)+'<div class="res good">Registrado: <b>D1.1 = 2</b>, com foto e descrição.</div>'+cont('Registrar e seguir',finishCase),'full'); }
}
/* caso 2 · evidência mínima (D2.5) */
function case2(){
  panel(npc('ze','Bom dia! Vou lhe dizer uma coisa: aquela casa da curva solta esgoto no açude. Todo mundo aqui sabe.')+
    chs([['Registrar D2.5 = 3 (lançamento de efluente) com base no relato.<small>Mais rápido. O relato vai no campo de observação.</small>',relato],
         ['Agradecer e ir verificar a margem em frente à casa.<small>Leva mais tempo, mas a nota fica com lastro.</small>',verif]]));
  function relato(){ G.rule.c2=false; setScore('D2.5',3,{flag:'relato',ev:'relato de morador'}); bump({rast:-15}); SFX.soft();
    panel(npc('ze','Pois é! Pode anotar.')+'<div class="res">Nota lançada: <b>D2.5 = 3</b>. Campo de evidência: “relato de morador”. Nenhuma foto anexada.</div>'+cont('Seguir',finishCase)); }
  function verif(){ G.rule.c2=true;
    panel(npc('ze','Fique à vontade, a casa é logo ali na curva.')+cont('📷 Fotografar a margem em frente à casa',function(){ var url=photo('D2.5','margem da casa da curva'); bump({rast:15,xp:15});
      panel(pola(url,'D2.5 · margem da casa da curva','Sacolas, garrafas e embalagens espalhadas. Nenhum cano, vala ou mancha de efluente.')+rulerHTML('D2.5',pick),'full'); })); }
  function pick(v){ var ok=v===1; G.dec.push(ok); bump({xp:ok?15:5}); if(ok) SFX.good(); else SFX.soft();
    var fb={0:'A foto mostra lixo espalhado: não é ausente. Fica 1, lixo disperso.',1:'Isso. O relato falava de esgoto, mas a evidência mostra lixo disperso. A nota segue a evidência.',2:'“Acúmulo ou entulho” seria lixo concentrado. Aqui ele está espalhado: 1, lixo disperso.',3:'Sem cano nem mancha na foto, o relato de esgoto não se confirma. A foto sustenta 1. Se o lançamento aparecer depois, a nota muda, com nova evidência.'}[v];
    if(v===null) fb='Agora a evidência existe: a foto. Não cabe “sem registro”. Ela sustenta 1, lixo disperso.';
    setScore('D2.5',1,{ev:'foto + campo resíduos'});
    panel('<div class="res'+(ok?' good':'')+'">'+fb+'</div>'+npc('ze','Hum... cano eu nunca vi não, é verdade. Mas que tem lixo, tem.')+rulerShow('D2.5',v,1)+cont('Registrar e seguir',finishCase),'full'); }
}
/* caso 3 · regra de ausência (D3.1) */
function case3(){
  var doc='<div class="ficha" style="margin:4px 0 10px"><span class="rg">Pasta da comissão gestora · sede da associação</span><b>Evidência mínima da D3.1</b>Ata: <b style="display:inline;color:var(--crit)">não disponível</b> · Portaria: <b style="display:inline;color:var(--crit)">não encontrada</b> · Data da última reunião: <b style="display:inline;color:var(--crit)">sem registro</b></div>';
  panel(npc('lucia','A comissão? Existe, sim, desde o tempo do meu compadre. A ata ficou com o antigo presidente, que se mudou para Fortaleza. Aqui na sede não tem papel nenhum, nem portaria. Reunião... faz tempo, não sei dizer quando.')+doc+
    chs([['Nota 3 (inexistente): se não tem papel, a comissão não existe.',function(){ choose(3); }],
         ['Nota 0 (formalizada e ativa): Dona Lúcia garante que existe e funciona.',function(){ choose(0); }],
         ['Sem registro: falta a evidência mínima, então o item fica fora da média.',function(){ choose(null); }]]));
  function choose(v){
    if(v===null){ G.rule.c3=true; setScore('D3.1',null,{ev:'sem evidência mínima'}); bump({rast:10,xp:20}); SFX.good();
      panel(npc('lucia','Vou pedir a ata ao compadre, então. Da próxima vez vocês encontram aqui.')+'<div class="res good">Registrado: <b>D3.1 sem registro</b>. O item não vira zero nem três: sai da conta até haver evidência.</div><div class="math">'+dimFormula(G.sc,'D3')+'</div>'+cont('Seguir',finishCase),'full'); }
    else { G.rule.c3=false; setScore('D3.1',v,{flag:'semdoc',ev:'nenhum documento'}); bump({rast:-10}); SFX.soft();
      panel(npc('lucia',v===3?'Mas existe, viu? Só não tem o papel aqui.':'Isso, obrigada! Pode confiar.')+'<div class="res">Nota lançada: <b>D3.1 = '+v+'</b>. Documento anexado: nenhum.</div><div class="math">'+dimFormula(G.sc,'D3')+'</div>'+cont('Seguir',finishCase),'full'); }
  }
}
/* caso 4 · mecanismo principal (D2.3 × D1.2) */
function case4(){
  panel(npc('bene','Olhe ali o gado do compadre: desce todo dia, entra na água e deixa a sujeira na beira. Pasto plantado aqui não tem, não; é só passagem para beber.')+
    cont('📷 Fotografar o gado na margem',function(){ var url=photo('D2.3','gado na margem noroeste'); bump({rast:5}); step(url); }));
  function step(url){
    panel(pola(url,'Margem noroeste','Três cabeças de gado dentro d’água, dejetos na margem; sem pasto plantado nem curral na APP.')+'<p><b>Um fato, um indicador.</b> Onde este fato entra?</p>'+
      chs([['D1.2 · Ocupação de APP<small>uso do solo dentro da faixa de APP por cultivo, edificação ou pastagem</small>',d12],
           ['D2.3 · Criação de animais<small>rebanhos, currais e acesso de animais à margem ou à água</small>',function(){ G.rule.c4=true; bump({xp:15}); ruler(false); }],
           ['Nos dois: o caso é grave, conta em D1.2 e em D2.3',function(){ G.rule.c4=false; ruler(true); }]]),'full'); }
  function d12(){ G.rule.c4=false; setScore('D1.2',2,{flag:'reclass',ev:'foto do gado'}); setScore('D2.3',null,{flag:'reclass'}); SFX.soft();
    panel(npc('bene','Hum. Pasto mesmo não tem... mas você é quem sabe.')+'<div class="res">Lançado: <b>D1.2 = 2</b> (parcial, em trechos). A <b>D2.3</b> ficou sem registro.</div>'+cont('Seguir',finishCase),'full'); }
  function ruler(both){ panel('<p>Agora a nota da <b>D2.3</b>, pelo descritor:</p>'+rulerHTML('D2.3',function(v){ pick(v,both); },{na:false}),'full'); }
  function pick(v,both){ var ok=v===3; G.dec.push(ok); bump({xp:ok?15:5}); if(ok) SFX.good(); else SFX.soft();
    setScore('D2.3',3,{ev:'foto + indícios de dejetos',flag:both?'dupla':undefined});
    if(both) setScore('D1.2',2,{flag:'dupla',ev:'foto do gado'});
    var fb=ok?'Isso: acesso direto à água com dejetos. É o descritor 3, palavra por palavra.':'O descritor 3 diz “acesso direto à água com dejetos”, e é exatamente o que a foto mostra. Fica 3.';
    panel(npc('bene',fb)+rulerShow('D2.3',v,3)+'<div class="res">'+(both?'Lançado: <b>D2.3 = 3</b> e <b>D1.2 = 2</b>, o mesmo fato nos dois indicadores.':'Registrado: <b>D2.3 = 3</b>. A D1.2 continua com o registro do roçado (1).')+'</div>'+cont('Registrar e seguir',finishCase),'full'); }
}
/* caso 5 · concordância (D2.1) */
function case5(){
  panel(npc('iara','Último caso, e a gente faz junto: cada um pontua na sua ficha, sem olhar a do outro. Depois compara. Isso é concordância entre aplicadores.')+
    cont('📷 Fotografar o balneário',function(){ var url=photo('D2.1','balneário'); bump({rast:5});
      panel(pola(url,'D2.1 · balneário, margem sudeste','Três barracas de alvenaria com cobertura fixa, mesas e caixa de som. O dono diz que enche todo fim de semana.')+rulerHTML('D2.1',pick,{na:false}),'full'); }));
  function pick(v){ var ok=v===3; G.dec.push(ok); bump({xp:ok?20:5}); if(ok) SFX.good(); else SFX.soft();
    var fb;
    if(v===3) fb='Eu dei 2, você deu 3. Discordamos, então vamos ao descritor, não à opinião. O 3 diz: “intenso com estruturas permanentes”. Barraca de alvenaria com cobertura fixa é estrutura permanente. Você tem razão: revejo para 3. Discordância resolvida pela regra escrita, não por quem fala mais alto.';
    else if(v===2) fb='Demos os dois 2. Concordamos... mas olhe de novo o descritor 3: “intenso com estruturas permanentes”. Alvenaria com cobertura fixa é permanente. Erramos igual. <b>Concordar não é acertar</b>: a concordância mede consistência entre aplicadores; quem diz o que a nota significa é o descritor. Fica 3.';
    else fb='Eu dei 2, você deu '+v+'. Estamos longe, então vamos ao descritor. O 3 diz “intenso com estruturas permanentes”, e alvenaria com cobertura fixa é permanente. Nós dois revemos: fica 3.';
    setScore('D2.1',3,{ev:'foto + campo balneários'});
    panel(npc('iara',fb)+rulerShow('D2.1',v,3)+'<div class="res">Iara: <b>2</b> · Você: <b>'+v+'</b> · Após calibrar pelo descritor: <b>3</b></div>'+cont('Registrar e seguir',finishCase),'full'); }
}

/* ---------- fechar a ficha: farol e losango ---------- */
function fecharFicha(){
  G.mode='dialog'; objEl.hidden=true; G.closed=true; renderDash();
  var r=calc(G.sc);
  panel('<span class="k">Ficha do Açude Jandaia (fictício)</span><h3>Do indicador à faixa</h3>'+
    DIMS.map(function(d){ return '<div class="math">'+dimFormula(G.sc,d.c)+' <span style="color:var(--muted)">· '+d.n+'</span></div>'; }).join('')+
    '<div class="math">IVSH = ('+r.dims.map(function(d){ return fmt(d.mean); }).join(' + ')+') / 4 = <b>'+fmt(r.ivsh)+'</b> → faixa <b>'+(r.fx?r.fx.n:'—')+'</b></div>'+
    '<p class="note">Pesos iguais no cenário-base, como no artigo. Faixa por intervalos iguais da escala (convenção do jogo).</p>'+cont('Acender o farol da faixa',acender),'full');
}
function acender(){
  closePanel(); G.mode='cine'; var r=calc(G.sc), hex=r.fx?r.fx.hex:0x9aa4b2;
  farolMat.color.setHex(hex); farolRing.material.color.setHex(hex); farol.visible=true;
  buildRadar(r.dims.map(function(d){ return d.mean; }),hex); radar.visible=true; SFX.fanfare(false);
  flyTo([[15,3,12],[10,8,-8],[-9,13,-9],[-13,18,7],[14,25,23]],[[0,3,0],[0,7,0],[0,12,0],[0,13,0],[0,3.5,0]],7.5,function(){ setTimeout(function(){
    panel('<span class="k">Jandaia · IVSH '+fmt(r.ivsh)+' · faixa '+(r.fx?r.fx.n:'—')+'</span><p>O farol mostra a faixa; o losango acima do açude mostra o perfil das quatro dimensões. Mesmo IVSH, perfis diferentes pedem ações diferentes.</p><p>Agora a ficha vai para a <b>Mesa da Controladoria</b>. Lá, nota sem evidência não passa.</p>'+cont('Ir à Mesa da Controladoria',startMesa)); },500); },{hold:true});
}
