/* ===================== ATO 3: Mesa da Controladoria ===================== */
function ivReg(a){ return calc(a.me?G.sc:a.regd).ivsh; }
function scAud(a){ return a.me?G.audJ:a.aud; }
function ivAud(a){ return calc(scAud(a)).ivsh; }
function startMesa(){
  closePanel(); G.mode='mesa'; hideBeam(); objEl.hidden=true; showMarkers(false); SFX.scene('mesa');
  ['iara','ze','lucia','bene'].forEach(hideNPC);
  player.position.set(MESA.x-1.5,0,MESA.z-2.3); player.rotation.y=0.25;
  placeNPC('rastro',MESA.x+0.3,MESA.z+1.0,MESA.x-1.5,MESA.z-2.3);
  placeNPC('iara',MESA.x-3.0,MESA.z-1.8,MESA.x,MESA.z); NPC.iara.mode='idle';
  ACUDES.forEach(function(a,i){ var v=ivReg(a); setPillar(i,v,faixa(v),'registrado'); }); orderPillars(ACUDES.map(ivReg)); PIL.forEach(function(p){ p.x=p.gx; });
  flyTo([[2,30,12],[16,11,MESA.z+19],[-15,8,MESA.z+12],[0,12,MESA.z-21]],[[0,0,MESA.z],[0,3,MESA.z+6],[0,3,MESA.z+6],[0,0,MESA.z+6]],8.5,function(){
    panel(npc('rastro','Bem-vindo à Mesa da Controladoria. Aqui o índice vira decisão, e por isso eu audito antes. Três perguntas para cada nota: tem evidência mínima? A regra de ausência foi respeitada? Algum fato foi contado duas vezes?')+
      '<p class="note">Os pilares mostram o IVSH registrado de cada açude, antes da auditoria.</p>'+cont('Auditar as quatro fichas',audit)); },{hold:true});
}
function auditJandaia(){
  var sc=clone(G.sc), it=[], gl=0;
  function ok(w,t){ it.push({ok:true,w:w,t:t}); } function glo(w,t){ it.push({ok:false,w:w,t:t}); gl++; }
  ok('Jandaia · D1.1','Foto e descrição anexadas. A nota 2 se sustenta.');
  if((G.meta['D2.5']||{}).flag==='relato'){ sc['D2.5']=null; glo('Jandaia · D2.5','Nota 3 lançada só com relato de morador, sem foto nem registro no campo “resíduos”. Glosada: sai da média. O valor real ficou desconhecido.'); }
  else ok('Jandaia · D2.5','Foto anexada. Ela sustenta 1 (lixo disperso), e não o 3 do relato.');
  if((G.meta['D3.1']||{}).flag==='semdoc'){ sc['D3.1']=null; glo('Jandaia · D3.1','Nota '+G.sc['D3.1']+' sem ata, portaria nem data da última reunião. Glosada: vira sem registro.'); }
  else ok('Jandaia · D3.1','Sem evidência mínima, o item ficou fora da média. Regra de ausência bem aplicada.');
  var f=(G.meta['D1.2']||{}).flag;
  if(f==='dupla'){ sc['D1.2']=PRE['D1.2'].v; glo('Jandaia · D1.2 × D2.3','Dupla contagem: o gado na água estava em D2.3 e em D1.2. Pelo mecanismo principal, fica só em D2.3. A D1.2 volta ao registro do roçado (1).'); }
  else if(f==='reclass'){ sc['D1.2']=PRE['D1.2'].v; sc['D2.3']=3; glo('Jandaia · D1.2 → D2.3','Gado com acesso direto à água e dejetos é criação de animais (D2.3 = 3, pela foto), e não uso do solo da APP. Reclassificado; a D1.2 volta ao registro do roçado (1).'); }
  else ok('Jandaia · D2.3','Um fato, um indicador: mecanismo principal respeitado.');
  ok('Jandaia · D2.1','Nota calibrada pelo descritor “estruturas permanentes”, com foto.');
  ok('Jandaia · 13 fichas já registradas','Todas com evidência mínima.');
  return {sc:sc,items:it,gl:gl};
}
function audit(){
  G.before=ACUDES.map(function(a){ return {a:a,v:ivReg(a)}; });
  var A=auditJandaia(); G.audJ=A.sc; G.glosas=A.gl; G.audited=true;
  G.dec.push(!!G.rule.c2,!!G.rule.c3,!!G.rule.c4);
  var f=(G.meta['D1.2']||{}).flag; if(f==='dupla'||f==='reclass') bump({rast:-10});
  if(A.gl===0) bump({xp:30,social:10}); setHud(); renderDash();
  var items=A.items.slice();
  items.push({ok:true,w:'Carnaúba',t:'Fichas com evidência mínima. Sem glosas.'});
  ACUDES.forEach(function(a){ (a.glosas||[]).forEach(function(g){ items.push({ok:false,w:a.n+' · '+g.code,t:g.txt}); }); });
  items.push({ok:true,w:'Mandacaru',t:'Fichas com evidência mínima. Sem glosas.'});
  panel(npc('rastro',A.gl===0?'Suas notas têm lastro. Nenhuma glosa no Jandaia.':'Encontrei '+A.gl+(A.gl===1?' problema':' problemas')+' na sua ficha. Nota sem lastro não entra na conta.')+
    '<ul class="alist">'+items.map(function(x,i){ return '<li style="animation-delay:'+(i*0.09)+'s"><span class="st '+(x.ok?'ok':'gl')+'">'+(x.ok?'ok':'glosa')+'</span><span><b>'+x.w+'.</b> '+x.t+'</span></li>'; }).join('')+'</ul>'+
    cont('Ver o ranking auditado',showRank),'full');
  var ng=items.filter(function(x){ return !x.ok; }).length; for(var i=0;i<ng;i++) setTimeout(SFX.stamp,300+i*380);
}
function showRank(){
  closePanel();
  ACUDES.forEach(function(a,i){ var v=ivAud(a); setPillar(i,v,faixa(v),'auditado'); }); orderPillars(ACUDES.map(ivAud));
  var bef=G.before.slice().sort(function(x,y){ return y.v-x.v; }).map(function(r){ return r.a.id; });
  var aft=ACUDES.slice().sort(function(x,y){ return ivAud(y)-ivAud(x); }).map(function(a){ return a.id; });
  var flip='';
  for(var i=0;i<aft.length&&!flip;i++) for(var j=i+1;j<aft.length;j++) if(bef.indexOf(aft[i])>bef.indexOf(aft[j])){ flip='A auditoria mudou a ordem: <b>'+acude(aft[i]).n+'</b> passou o <b>'+acude(aft[j]).n+'</b>.'; break; }
  if(!flip) flip='A ordem não mudou, mas agora cada número tem lastro.';
  SFX.soft();
  setTimeout(function(){
    var rows=aft.map(function(id,k){ var a=acude(id), b=G.before.filter(function(r){ return r.a===a; })[0].v, v=ivAud(a), fx=faixa(v);
      return '<tr><td>'+(k+1)+'º · '+a.n+'</td><td>'+fmt(b)+'</td><td><b>'+fmt(v)+'</b></td><td><span class="fx '+fx.k+'">'+fx.n+'</span></td></tr>'; }).join('');
    panel('<span class="k">Ranking auditado</span><p>'+flip+'</p><div style="overflow-x:auto"><table class="cmp"><thead><tr><th>Açude</th><th>Registrado</th><th>Auditado</th><th>Faixa</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      (G.meta['D2.5']&&G.meta['D2.5'].flag==='relato'?'<p class="note">No Jandaia, o D2.5 lançado por relato saiu da conta: sem a foto, o valor real ficou desconhecido.</p>':'')+cont('Distribuir o orçamento',budget)); },1300);
}

/* orçamento */
function key(c,a){ return c.id+':'+a.id; }
function cellInfo(card,a){ var sc=scAud(a), after=clone(sc), nul=[], zero=[], eff=0;
  card.t.forEach(function(t){ var v=sc[t]; if(v==null) nul.push(t); else if(v===0) zero.push(t); else { after[t]=v-1; eff++; } });
  return {d:calc(sc).ivsh-calc(after).ivsh,nul:nul,zero:zero,eff:eff}; }
function projected(a){ var sc=scAud(a), after=clone(sc); CARDS.forEach(function(c){ if(G.alloc[key(c,a)]) c.t.forEach(function(t){ if(after[t]!=null&&after[t]>0) after[t]-=1; }); }); return {b:calc(sc),a:calc(after)}; }
function spent(){ var s=0; CARDS.forEach(function(c){ ACUDES.forEach(function(a){ if(G.alloc[key(c,a)]) s+=c.c; }); }); return s; }
function weighted(){ var W=0; ACUDES.forEach(function(a){ var p=projected(a); W+=(p.b.ivsh-p.a.ivsh)*p.b.fx.w; }); return W; }
function funded(a){ return CARDS.some(function(c){ return G.alloc[key(c,a)]; }); }
function optimum(){ var U=50, cap=BUDGET/U, best=new Array(cap+1).fill(0);
  CARDS.forEach(function(c){ ACUDES.forEach(function(a){ var d=cellInfo(c,a).d; if(d<=1e-9) return; var w=d*faixa(ivAud(a)).w, k=c.c/U; for(var x=cap;x>=k;x--) best[x]=Math.max(best[x],best[x-k]+w); }); });
  return best[cap]; }
function budget(){
  var keepY=dlg.hidden?0:dlg.scrollTop, bs=dlg.querySelector('.bscroll'), keepX=bs?bs.scrollLeft:0;
  var acs=ACUDES.slice().sort(function(x,y){ return ivAud(y)-ivAud(x); }), sp=spent(), over=sp>BUDGET;
  var head='<tr><th>Ação</th><th>Custo</th>'+acs.map(function(a){ var v=ivAud(a), fx=faixa(v); return '<th class="a">'+a.n+'<br><span class="fx '+fx.k+'" style="font-size:11px">'+fx.n+' '+fmt(v)+'</span></th>'; }).join('')+'</tr>';
  var body=CARDS.map(function(c){ return '<tr><td class="cname"><b>'+c.n+'</b><small>'+c.t.join(' e ')+' · −1 ponto</small></td><td class="cost">'+brl(c.c)+'</td>'+acs.map(function(a){
    var inf=cellInfo(c,a), k=key(c,a), on=!!G.alloc[k];
    if(inf.eff===0){ var why=inf.nul.length?'sem registro':'já em 0'; return '<td class="c"><button type="button" class="bt nil" disabled title="'+(inf.nul.length?inf.nul.join(', ')+' sem registro: sem efeito mensurável. Registre a evidência primeiro.':'Indicador já na nota 0.')+'">'+why+'</button></td>'; }
    var part=inf.nul.length?'*':'';
    return '<td class="c">'+btn('−'+fmt(inf.d)+part,function(){ toggle(c,a); },'bt').replace('<button ','<button aria-pressed="'+on+'" title="'+(part?inf.nul.join(', ')+' sem registro: parte do efeito não é mensurável. ':'')+'Reduz o IVSH do '+a.n+' em '+fmt(inf.d)+'" ')+'</td>'; }).join('')+'</tr>'; }).join('');
  var proj=acs.map(function(a){ var p=projected(a), fx=p.a.fx; return '<div>'+a.n+'<b>'+fmt(p.b.ivsh)+' → '+fmt(p.a.ivsh)+'</b><span class="fx '+fx.k+'" style="font-size:11px">'+fx.n+'</span></div>'; }).join('');
  panel('<span class="k">Mesa da Controladoria · orçamento</span><h3>Onde cada real reduz mais vulnerabilidade?</h3>'+
    '<p>Cada ação tira 1 ponto dos indicadores-alvo no açude escolhido (o mínimo é 0). A célula mostra quanto o IVSH daquele açude cairia. A mesma ação pode ir para mais de um açude.</p>'+
    '<div class="bbar"><span>'+brl(sp)+' de '+brl(BUDGET)+'</span><span class="meter"><b class="'+(over?'over':'')+'" style="width:'+Math.min(100,sp/BUDGET*100)+'%"></b></span><span>restam '+brl(Math.max(0,BUDGET-sp))+'</span></div>'+
    '<div class="bscroll"><table class="budget"><thead>'+head+'</thead><tbody>'+body+'</tbody></table></div>'+
    '<p class="note">* Parte dos indicadores-alvo está sem registro: esse pedaço do efeito não é mensurável. Custos e efeitos são ilustrativos, criados para o jogo.</p>'+
    '<b style="font-family:var(--font-cond);font-size:15px">IVSH projetado (ilustrativo)</b><div class="proj">'+proj+'</div>'+
    chs([['Confirmar a alocação',function(){ if(!sp){ toast('Escolha ao menos uma ação'); SFX.bad(); return; } audiencia(); },true]]),'full');
  dlg.scrollTop=keepY; var nb=dlg.querySelector('.bscroll'); if(nb) nb.scrollLeft=keepX;
}
function toggle(c,a){ var k=key(c,a);
  if(!G.alloc[k]&&spent()+c.c>BUDGET){ toast('Orçamento insuficiente para esta ação'); SFX.bad(); return; }
  G.alloc[k]=!G.alloc[k]; if(!G.alloc[k]) delete G.alloc[k]; SFX.coin(); budget(); }

/* audiência pública */
function audiencia(){
  var W=weighted(), Wm=optimum(); G.eff=Wm>0?Math.round(100*W/Wm):0; G.W=W;
  var unf=ACUDES.filter(function(a){ return !funded(a); }).sort(function(x,y){ return ivAud(y)-ivAud(x); }), q, tg;
  if(unf.length&&faixa(ivAud(unf[0])).w>=2){ tg=unf[0]; q='Sou do '+tg.n+'. Nosso açude está na faixa '+faixa(ivAud(tg)).n.toLowerCase()+' e não recebeu nada. Por quê?'; }
  else if(unf.length){ tg=unf[0]; q='Sou do '+tg.n+'. Ficamos de fora do orçamento. Como vocês decidiram isso?'; }
  else { q='Todo açude recebeu alguma coisa. Mas como vocês decidiram quanto vai para cada um?'; }
  placeNPC('morador',MESA.x+2.6,MESA.z-2.4,MESA.x,MESA.z);
  panel('<span class="k">Audiência pública</span>'+npc('morador',q)+chs([
    ['É uma decisão técnica; não cabe detalhar.',function(){ bump({social:-15}); SFX.bad(); after(npc('rastro','Decisão que não se explica não tem controle social. O índice existe justamente para que ela possa ser explicada.')); }],
    ['Mostrar o ranking auditado, as notas com as evidências e quanto cada ação reduz em cada açude.',function(){ bump({social:20,xp:20}); SFX.good(); after(npc('morador','Agora eu entendi. Não concordo com tudo, mas sei onde cobrar.')+npc('rastro','Isso é prestação de contas: critério escrito, evidência guardada e conta aberta.')); }],
    ['Prometer que, no ano que vem, será a vez de vocês.',function(){ bump({social:-5}); SFX.soft(); after(npc('rastro','Promessa sem critério é o mesmo julgamento situado de antes, só que adiado.')); }]]));
  function after(h){ panel(h+cont('Ver o relatório de prestação de contas',relatorio)); }
}

/* relatório final */
function relatorio(){
  closePanel(); G.mode='cine'; setDusk(true); SFX.scene('fim'); toast('Fim de tarde no açude: hora da prestação de contas');
  flyTo([[-4,15,MESA.z-8],[-17,12,9],[-4,16,-21],[17,14,-4],[16,13,20]],[[0,4,MESA.z],[0,4,0],[0,6,0],[0,6,0],[0,5,0]],8,relatorio2,{hold:true,hint:true});
}
function relatorio2(){
  G.mode='end'; setTimeout(function(){ SFX.fanfare(true); },300);
  var xpb=Math.round(G.eff*0.8); bump({xp:xpb});
  var rp=reguaPct()||0, j=calc(G.audJ);
  var title=(G.glosas===0&&rp>=80&&G.eff>=85&&G.social>=60)?'Régua de Ouro':((G.glosas<=1&&rp>=50)?'Aplicador(a) Rastreável':'Aprendiz do Achismo');
  var why={'Régua de Ouro':'Notas com lastro, régua seguida e orçamento onde a vulnerabilidade é maior.','Aplicador(a) Rastreável':'A maior parte das notas se sustentou. Falta pouco para a régua de ouro.','Aprendiz do Achismo':'Muitas notas sem lastro ou fora do descritor. Jogue de novo: as regras estão no painel ao lado.'}[title];
  var used=spent();
  var lessons=[['A régua',G.dec[1]],['Evidência mínima',!!G.rule.c2],['Regra de ausência',!!G.rule.c3],['Mecanismo principal',!!G.rule.c4],['Concordância',G.dec[G.dec.length-4]]];
  panel('<span class="k">Relatório de prestação de contas · campanha 1</span><h3>Seu título</h3><div class="title-badge">'+title+'</div><p>'+why+'</p>'+
    '<div class="sum"><span>IVSH Jandaia (auditado)<b>'+fmt(j.ivsh)+' · '+j.fx.n+'</b></span><span>Glosas na sua ficha<b>'+G.glosas+'</b></span><span>Régua (decisões certas de primeira)<b>'+rp+'%</b></span><span>Rastreabilidade<b>'+cl(G.rast)+'</b></span><span>Controle social<b>'+cl(G.social)+'</b></span>'+
    '<span>Orçamento usado<b>'+brl(used)+'</b></span><span>Eficiência da alocação<b>'+G.eff+'%</b></span><span>XP<b>'+G.xp+'</b></span></div>'+
    '<p class="note">Eficiência: redução de IVSH ponderada pela faixa (crítica 3, alta 2, moderada 1, baixa 0,5), comparada com a melhor combinação possível dentro de '+brl(BUDGET)+'. Critério do jogo; na vida real entram também prazos, viabilidade e custo de manutenção.</p>'+
    '<p class="note">Repare na tabela do orçamento: um ponto a menos em D3 ou D4 derruba mais o IVSH do que em D1 ou D2. Com pesos iguais por dimensão, cada item de D4 (3 indicadores) vale 1/12 do índice; cada item de D2 (6 indicadores), 1/24. É o tema do laboratório de pesos da entrega 2.</p>'+
    '<p><b>As cinco regras da campanha:</b> '+lessons.map(function(l){ return (l[1]?'✓ ':'✗ ')+l[0]; }).join(' · ')+'</p>'+
    '<div class="res">Continua na <b>entrega 2</b>: os outros açudes em campo, o próximo trimestre (o mundo responde às suas escolhas) e o laboratório de pesos.</div>'+
    chs([['Jogar de novo',restart,true],['Ver a régua completa',function(){ openRegua(); }]],true),'full');
}
function restart(){
  farol.visible=false; radar.visible=false; regua.visible=false; regua.position.y=-9; regua.userData.glow.visible=false; setDusk(false,true);
  PIL.forEach(function(p){ p.goal=0.01; p.h=0.01; p.m.scale.y=0.01; p.m.material.color.setHex(0x9aa4b2); p.txt=''; p.lb.userData.set(p.a.n); p.lb.position.y=1; });
  Object.keys(NPC).forEach(hideNPC); showMarkers(false); hideBeam(); releaseCam(); CAM.boost=0; CAM.user=0;
  otto.visible=true; otto.material.opacity=1; serras.visible=false; player.position.set(0,0,18);
  resetState(); renderDash(); CAM.orbit=true; scene.fog.near=600; scene.fog.far=1400; startGame();
}
