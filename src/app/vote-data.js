/* ===================== VOTAÇÃO: perguntas e protocolo (compartilhado entre o jogo e votar.html) ===================== */
var VOTE_CFG=window.VOTE_CFG||{endpoint:''};
var VOTE={
  perfis:[['aluno','Aluno ou aluna'],['professor','Professor ou professora'],['outro','Outra pessoa (visita, família, gestão)']],
  rosto:{
    conf:['Quase nada','Um pouco','Bastante','Dá para explicar'],
    nota:['Nada','Mais ou menos','Bem','Muito bem']
  },
  r1:{nome:'Rodada 1 · Eu entendi?',
    intro:'Isto não é prova e não vale nota. Serve para o projeto saber se o jogo explicou bem.',
    itens:[
      {id:'conf',tipo:'rosto',esc:'conf',q:'Até aqui, quanto você entendeu do jogo?'},
      {id:'q1',tipo:'quiz',q:'Na régua do jogo, o número 0 (carinha verde) quer dizer…',
        o:[['a','Perigo grave'],['b','Tudo bem: a margem está bem cuidada'],['c','Não deu para ver']],ok:'b',
        why:'O 0 é a situação mais favorável e o 3 a mais vulnerável. “Não deu para ver” não é nota: fica sem número.'},
      {id:'q2',tipo:'quiz',q:'Você achou lixo na margem, mas não conseguiu ver a cerca. O que fazer com a cerca?',
        o:[['a','Chutar uma nota para não deixar em branco'],['b','Marcar “não vi” e não dar nota'],['c','Dar nota 3 por garantia']],ok:'b',
        why:'Sem evidência, o item fica fora da conta. Não vale chutar para cima nem para baixo. É a regra de ausência do artigo.'},
      {id:'q3',tipo:'quiz',q:'Uma foto mostra gado dentro da água. Essa foto vale para…',
        o:[['a','Um problema só: o do gado'],['b','Todos os problemas da margem'],['c','Nenhum problema']],ok:'a',
        why:'Cada fato vale para um indicador só (mecanismo principal). No jogo: um problema, uma carta.'},
      {id:'q4',tipo:'quiz',q:'O IVSH, proposto no artigo, olha principalmente…',
        o:[['a','A cor da água na hora da coleta'],['b','O que acontece em volta do açude e pode deixá-lo mais frágil'],['c','Quantos peixes existem']],ok:'b',
        why:'A qualidade da água é acompanhada pela rede de monitoramento da COGERH (RMQA). O IVSH olha a margem e o entorno.'},
      {id:'q5',tipo:'quiz',q:'No plano de cuidado, por que escolhemos só algumas ações?',
        o:[['a','Porque as outras não importam'],['b','Porque dinheiro e tempo são limitados: é preciso priorizar'],['c','Porque o jogo é curto']],ok:'b',
        why:'No jogo são 8 gotas: não dá para fazer tudo. A turma conversa e escolhe o que mais cuida.'}
    ]},
  r2:{nome:'Rodada 2 · O que melhorar?',
    intro:'Sua opinião ajuda a melhorar o projeto. Não pedimos nome nem dado pessoal.',
    itens:[
      {id:'s_entendi',tipo:'rosto',esc:'nota',q:'Eu entendi o que era para fazer no jogo.'},
      {id:'s_diverte',tipo:'rosto',esc:'nota',q:'Foi divertido.'},
      {id:'s_efeito',tipo:'rosto',esc:'nota',q:'Os efeitos, os voos da câmera e os sons me ajudaram a entender.'},
      {id:'s_facil',tipo:'rosto',esc:'nota',q:'Foi fácil mexer (tocar, clicar, ler).'},
      {id:'like',tipo:'escolha',q:'O que você mais gostou?',o:[['garca','A garça-guia'],['voo','Os voos da câmera'],['regua','A régua com carinhas'],['cartas','As cartas e o plano de cuidado'],['som','Os sons e a música'],['outro','Outra coisa']]},
      {id:'fix',tipo:'escolha',q:'O que mais precisa melhorar?',o:[['letra','Letras e botões'],['expl','As explicações'],['desafio','Mais desafios'],['espera','Tem muita espera'],['som','Os sons'],['nada','Nada, está bom']]},
      {id:'tempo',tipo:'escolha',q:'O tempo da atividade foi…',o:[['curto','Curto'],['certo','Na medida'],['longo','Longo']]},
      {id:'c',tipo:'texto',q:'Quer deixar uma sugestão? Não escreva nomes de pessoas.',soAdulto:true}
    ]}
};
function voteUrl(r,t){ var u=new URL('votar.html',location.href); u.search=''; u.hash=''; u.searchParams.set('r',r); if(t) u.searchParams.set('t',t); return u.toString(); }
function voteJsonp(params,cb,ms){
  var ep=VOTE_CFG.endpoint; if(!ep){ cb(null,'sem-endpoint'); return; }
  var name='__v'+Math.random().toString(36).slice(2), s=document.createElement('script'), done=false;
  function fim(r,e){ if(done) return; done=true; try{ delete window[name]; }catch(x){ window[name]=undefined; } if(s.parentNode) s.parentNode.removeChild(s); cb(r,e); }
  window[name]=function(r){ fim(r,null); };
  var q=Object.keys(params).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&');
  s.src=ep+(ep.indexOf('?')<0?'?':'&')+q+'&callback='+name; s.onerror=function(){ fim(null,'rede'); };
  setTimeout(function(){ fim(null,'tempo'); },ms||9000); document.head.appendChild(s);
}
/* carinhas vetoriais (não dependem de fonte de emoji). e: 0 sorriso aberto, 1 sorriso, 2 preocupada, 3 aflita */
function faceSVG(e,color,size,label){
  var m=['<path d="M27 55 Q50 86 73 55 Z" fill="#fff" stroke="#0A1B4D" stroke-width="4" stroke-linejoin="round"/>',
    '<path d="M31 60 Q50 76 69 60" fill="none" stroke="#0A1B4D" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M34 68 L66 68" fill="none" stroke="#0A1B4D" stroke-width="5" stroke-linecap="round"/><path d="M25 34 L39 29 M75 34 L61 29" stroke="#0A1B4D" stroke-width="4" stroke-linecap="round"/>',
    '<path d="M31 74 Q50 55 69 74" fill="none" stroke="#0A1B4D" stroke-width="5" stroke-linecap="round"/><path d="M24 31 L40 37 M76 31 L60 37" stroke="#0A1B4D" stroke-width="4.5" stroke-linecap="round"/>'][e];
  return '<svg viewBox="0 0 100 100" width="'+size+'" height="'+size+'" role="img" aria-label="'+(label||'')+'" focusable="false"><circle cx="50" cy="50" r="46" fill="'+color+'" stroke="#0A1B4D" stroke-width="4"/><circle cx="35" cy="42" r="6" fill="#0A1B4D"/><circle cx="65" cy="42" r="6" fill="#0A1B4D"/>'+m+'</svg>';
}
var FACE_NOTA_COL=['#C9D7F3','#A9C0FF','#6F93F0','#2D5FE0'];
