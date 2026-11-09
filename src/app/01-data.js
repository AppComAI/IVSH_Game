/* ===================== DADOS: régua do IVSH (da apresentação do artigo) ===================== */
var $=function(id){ return document.getElementById(id); };
var DIMS=[
 {c:'D1',n:'Proteção física',cap:'Integridade das barreiras naturais e construídas do entorno'},
 {c:'D2',n:'Pressão antrópica',cap:'Intensidade do uso humano sobre o corpo hídrico'},
 {c:'D3',n:'Governança',cap:'Existência e funcionamento das instâncias de cogestão'},
 {c:'D4',n:'Conflito de uso',cap:'Disputa entre usos concorrentes e informalidade'}];
var IND=[
['D1.1','Mata ciliar','Cobertura vegetal nativa na faixa marginal do espelho d’água, avaliada por continuidade e densidade.','Descrição textual da ficha + fotografia da margem',['contínua e densa','contínua com clareiras','escassa/fragmentada','ausente ou suprimida'],'D'],
['D1.2','Ocupação de APP','Uso do solo dentro da faixa de APP por cultivo, edificação ou pastagem.','Registro de ocupação na ficha; foto',['inexistente','pontual','parcial (trechos)','generalizada'],'D'],
['D1.3','Controle de acesso','Existência e integridade de cercas, portões e mata-burro na área patrimonial.','Campo “cercas/portões” da ficha',['íntegro e funcional','presente com falhas pontuais','parcialmente rompido','inexistente'],'D'],
['D1.4','Estado da parede e do sangradouro','Conservação aparente das estruturas de barramento e vertimento.','Campo “estado da parede/sangradouro”; foto',['conservado','desgaste superficial','erosão/obstrução localizada','dano estrutural ou ocupação'],'D'],
['D1.5','Degradação e erosão marginal','Solo exposto, ravinamento ou assoreamento nas margens; presença de recuperação.','Descrição + foto',['sem erosão / revegetação ativa','pontual','extensa','generalizada com assoreamento'],'D'],
['D2.1','Balneários','Uso recreativo das margens, por número e intensidade de pontos e estruturas permanentes.','Campo “balneários”; foto',['ausente','um ponto, eventual','múltiplos pontos ou uso frequente','intenso com estruturas permanentes'],'D'],
['D2.2','Construções irregulares','Edificações, barracas ou loteamentos na faixa marginal sem autorização.','Registro na ficha; foto',['ausentes','isolada','várias dispersas','aglomerado/loteamento'],'D'],
['D2.3','Criação de animais','Presença de rebanhos, currais e acesso de animais à margem ou à água.','Campo “criação de animais”; indícios de dejetos',['ausente','presente sem acesso à água','acesso à margem','acesso direto à água com dejetos'],'D'],
['D2.4','Vazantes e agricultura marginal','Cultivo na faixa de deplecionamento ou na margem, por extensão e mecanização.','Campo “vazantes”; foto',['ausente','pontual manual','extensa manual','extensa mecanizada ou com agroquímicos'],'D'],
['D2.5','Resíduos e efluentes','Disposição de lixo, entulho ou lançamento de águas servidas/esgoto no entorno.','Campo “resíduos”; foto',['ausente','lixo disperso','acúmulo ou entulho','lançamento de efluente identificado'],'D'],
['D2.6','Outros usos intensivos','Lavagem de veículos, piscicultura em gaiolas, embarcações motorizadas, queimadas.','Registro na ficha',['nenhum','um uso eventual','um uso frequente ou dois eventuais','dois ou mais usos frequentes'],'D'],
['D3.1','Comissão gestora','Existência, formalização e atividade da comissão do sistema.','Ata, portaria, data da última reunião',['formalizada e ativa (reunião ≤ 12 meses)','formalizada, pouco ativa','informal/inativa','inexistente'],'I'],
['D3.2','Fiscalização e inspeção','Presença de agente de guarda e inspeção (AGIR, quando confirmado) e periodicidade de visitas.','Campo da ficha; registros de ocorrência',['agente presente com rotina','presente sem rotina','visitas esporádicas externas','sem fiscalização'],'I'],
['D3.3','Educação ambiental','Ações educativas na comunidade do entorno e sua recorrência.','Registro na ficha; relatórios da regional',['recorrente','eventual','única/antiga','inexistente'],'I'],
['D3.4','Articulação e resposta institucional','Canal de comunicação e capacidade de converter ocorrência em providência (COGERH, CBH, município, órgãos ambientais).','Encaminhamentos registrados',['canal ativo com providências documentadas','canal ativo sem providências','canal informal','sem canal'],'I'],
['D4.1','Irregularidade de uso','Captação ou irrigação sem outorga conhecida, pesca predatória, piscicultura irregular.','Registro na ficha; base de outorgas',['nenhuma','indício isolado','irregularidade confirmada','irregularidade múltipla ou reincidente'],'D'],
['D4.2','Conflito declarado','Reclamações, denúncias ou disputas registradas entre usuários.','Ficha; atas; ocorrências',['nenhum','relato isolado','conflito registrado','conflito recorrente'],'D'],
['D4.3','Incompatibilidade e mediação','Coexistência de usos efetivamente conflitantes (abastecimento × irrigação, lazer × abastecimento) e necessidade de mediação.','Usos declarados; registro de mediação por comissão/CBH',['usos compatíveis','incompatibilidade potencial','incompatibilidade ativa resolvida','incompatibilidade ativa sem resolução'],'D']
];
var CODES=IND.map(function(r){ return r[0]; });
var IX={}; IND.forEach(function(r,i){ IX[r[0]]=r; });
function dimOf(code){ return code.slice(0,2); }

/* Faixas: intervalos iguais da escala 0–3 (convenção do jogo) */
var FAIXAS=[
 {k:'baixa',n:'Baixa',lo:0,hi:0.75,w:0.5,hex:0x00949A},
 {k:'mod',n:'Moderada',lo:0.75,hi:1.5,w:1,hex:0xC99A00},
 {k:'alta',n:'Alta',lo:1.5,hi:2.25,w:2,hex:0xE06A1B},
 {k:'crit',n:'Crítica',lo:2.25,hi:3,w:3,hex:0xC62E24}];
function faixa(v){ if(v==null||isNaN(v)) return null; for(var i=0;i<3;i++) if(v<FAIXAS[i].hi-1e-9) return FAIXAS[i]; return FAIXAS[3]; }
function fmt(v,d){ if(v==null||isNaN(v)) return '—'; return v.toFixed(d==null?2:d).replace('.',','); }
function brl(k){ /* k em milhares */ return k>=1000 ? 'R$ '+(k/1000).toFixed(k%1000===0?1:2).replace('.',',')+' mi' : 'R$ '+k+' mil'; }

/* sc: {código: 0..3 | null (sem registro) | undefined (pendente)} */
function dimStats(sc,dc){
  var it=CODES.filter(function(c){ return dimOf(c)===dc; }), vals=[], pend=0, na=0;
  it.forEach(function(c){ var v=sc[c]; if(v===undefined) pend++; else if(v===null) na++; else vals.push(v); });
  var m=vals.length? vals.reduce(function(a,b){return a+b;},0)/vals.length : null;
  return {mean:m,vals:vals,n:it.length,pend:pend,na:na};
}
function calc(sc){
  var ds=DIMS.map(function(d){ return dimStats(sc,d.c); }), ok=ds.filter(function(d){ return d.mean!=null; });
  var iv=ok.length? ok.reduce(function(a,d){ return a+d.mean; },0)/ok.length : null;
  var pend=ds.reduce(function(a,d){ return a+d.pend; },0);
  return {dims:ds,ivsh:iv,pend:pend,fx:faixa(iv),partial:pend>0||ok.length<4};
}
function mk(arr){ var o={}; CODES.forEach(function(c,i){ o[c]=arr[i]; }); return o; }
function clone(o){ var r={}; for(var k in o) r[k]=o[k]; return r; }

/* Classes de estado trófico usadas no jogo (cores ilustrativas) */
var IET_CL=[{n:'oligotrófico',c:'#4C8DDB'},{n:'mesotrófico',c:'#3FA36B'},{n:'eutrófico',c:'#E1B42C'},{n:'supereutrófico',c:'#E07A2B'},{n:'hipereutrófico',c:'#B8442E'}];

/* ===================== AÇUDES: nomes reais, dados fictícios ===================== */
var N=null;
var PACAJUS_GAB=mk([2,1,2,1,2, 3,1,3,2,1,1, N,2,2,1, 2,1,2]);
var CASE_CODES=['D1.1','D2.5','D3.1','D2.3','D2.1'];
var ACUDES=[
 {id:'pacajus',n:'Pacajus',reg:'sua campanha',me:true,iet:2},
 {id:'pacoti',n:'Pacoti',reg:'Regional Norte (fictícia)',iet:3,
  nom:{'Mata ciliar':'Escassa','Balneário':'Tem, bastante','Comissão':'Não tem','Gado':'Muito, na beira'},
  regd:mk([3,2,3,1,3, 2,2,3,3,2,1, 3,3,2,2, 2,2,3]), glosas:[]},
 {id:'gaviao',n:'Gavião',reg:'Regional Sul (fictícia)',iet:1,
  nom:{'Mata ciliar':'Moderada','Esgoto':'Morador disse que tem','Comissão':'Existe','Irrigação':'Briga com o abastecimento'},
  regd:mk([2,1,2,1,1, 2,1,2,2,3,1, 2,2,N,1, 2,2,2]),
  glosas:[{code:'D2.5',txt:'D2.5 = 3 lançada só com relato de morador, sem foto nem registro no campo “resíduos”. Glosada: sai da média.'}]},
 {id:'riachao',n:'Riachão',reg:'Regional Leste (fictícia)',iet:2,
  nom:{'Mata ciliar':'Bem preservada em parte','Lixo':'Pouco','Comissão':'Ativa','Vazante':'Alguma'},
  regd:mk([0,1,0,1,0, 1,0,1,1,0,0, 0,1,1,0, 1,0,2]), glosas:[]}
];
ACUDES.forEach(function(a){ a.aud=a.regd?clone(a.regd):null; if(a.glosas) a.glosas.forEach(function(g){ a.aud[g.code]=null; }); });
function acude(id){ for(var i=0;i<ACUDES.length;i++) if(ACUDES[i].id===id) return ACUDES[i]; }

/* Fichas já registradas no Pacajus (13 indicadores fora dos casos) */
var PRE={
 'D1.2':{v:1,obs:'Roçado de milho pequeno dentro da faixa de APP, na margem sudoeste.',ev:'Registro de ocupação + foto nº 07'},
 'D1.3':{v:2,obs:'Cerca de arame com trechos rompidos e porteira caída no acesso norte.',ev:'Campo “cercas/portões”'},
 'D1.4':{v:1,obs:'Talude da parede com desgaste superficial; sangradouro desobstruído.',ev:'Campo “estado da parede/sangradouro” + foto nº 02'},
 'D1.5':{v:2,obs:'Ravinas e solo exposto em trecho contínuo da margem norte, sem revegetação.',ev:'Descrição + foto nº 11'},
 'D2.2':{v:1,obs:'Uma casa de alvenaria isolada na faixa marginal, sem autorização conhecida.',ev:'Registro na ficha + foto nº 05'},
 'D2.4':{v:2,obs:'Vazantes de feijão e capim em trecho extenso da faixa de deplecionamento, manejo manual.',ev:'Campo “vazantes” + foto nº 09'},
 'D2.6':{v:1,obs:'Gaiolas de piscicultura com uso eventual. Só entram aqui: o mesmo fato não vai para a D4.1.',ev:'Registro na ficha'},
 'D3.2':{v:2,obs:'Sem agente local; visitas esporádicas da equipe regional.',ev:'Campo da ficha + livro de ocorrências'},
 'D3.3':{v:2,obs:'Uma única ação educativa na escola, registrada em relatório antigo da regional.',ev:'Relatório da regional'},
 'D3.4':{v:1,obs:'Canal ativo com a regional (telefone e mensagens), sem providências documentadas.',ev:'Encaminhamentos registrados'},
 'D4.1':{v:2,obs:'Bomba de captação sem outorga conhecida, confirmada na consulta à base de outorgas.',ev:'Ficha + base de outorgas'},
 'D4.2':{v:1,obs:'Um relato de desentendimento entre vazanteiros e o pessoal do balneário.',ev:'Ficha; ata da associação'},
 'D4.3':{v:2,obs:'Irrigação × abastecimento: incompatibilidade ativa, com acordo de horário mediado pelo CBH.',ev:'Usos declarados + registro de mediação'}
};

/* Orçamento da Mesa (valores e efeitos ilustrativos) */
var BUDGET=1200;
var CARDS=[
 {id:'mata',n:'Recompor mata ciliar',t:['D1.1','D1.5'],c:500},
 {id:'cerca',n:'Cercar a área patrimonial',t:['D1.3'],c:300},
 {id:'balne',n:'Ordenar balneário e construções',t:['D2.1','D2.2'],c:250},
 {id:'bebe',n:'Bebedouros fora da APP',t:['D2.3'],c:200},
 {id:'comis',n:'Ativar a comissão gestora',t:['D3.1','D3.4'],c:150},
 {id:'agir',n:'Rotina de fiscalização (AGIR)',t:['D3.2'],c:200},
 {id:'edu',n:'Educação ambiental',t:['D3.3'],c:100},
 {id:'cbh',n:'Mediação de conflitos com o CBH',t:['D4.2','D4.3'],c:150}
];

/* ===================== ESTADO ===================== */
var G={
  mode:'idle', act:0, caseI:0, sc:{}, meta:{}, evid:[], xp:0, rast:50, social:40, dec:[], glosas:0,
  prolog:{order:[]}, reguaOn:false, closed:false, audited:false, alloc:{}, target:null, rule:{}
};
function resetState(){
  G.mode='idle'; G.act=0; G.caseI=0; G.sc={}; G.meta={}; G.evid=[]; G.xp=0; G.rast=50; G.social=40; G.dec=[]; G.glosas=0;
  G.prolog={order:[]}; G.reguaOn=false; G.closed=false; G.audited=false; G.alloc={}; G.target=null; G.cur=null; G.audJ=null; G.rule={}; G.ruleDone=false;
}
function cl(v){ return Math.max(0,Math.min(100,Math.round(v))); }
function reguaPct(){ if(!G.dec.length) return null; return Math.round(100*G.dec.filter(function(d){return d;}).length/G.dec.length); }
