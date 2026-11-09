/* ===================== FALAS DO MENINO (roteiro numerado) =====================
   txt: legenda que aparece no jogo · fal (opcional): como a voz sintética deve falar (pronúncia).
   Este arquivo alimenta o jogo (balões e áudio) e a página de gravação (gravar.html).
   {nome} vira o nome do menino. Para trocar o nome, mude só MENINO.nome. */
var MENINO={nome:'Juninho', papel:'menino da beira do açude'};
var FALAS=[
 {id:'00',grupo:'Boas-vindas (narração)',quem:'narrador',momento:'Botão “Ouvir” da janela de boas-vindas. Pode ser adulto.',tom:'Conversa, sorrindo na voz, sem pressa. Uns 60 segundos.',
  txt:'Olá! Seja bem-vindo à Régua das Águas. Este é um jogo sobre os açudes do Ceará e sobre uma pergunta simples: quão vulnerável está um açude, e tudo o que existe em volta dele? Para responder, existe o IVSH, um índice que a gente está propondo para a COGERH. Ele transforma o que a equipe vê em campo em notas de zero a três. Sempre com prova. No jogo, é você quem aplica a régua. Você desce até o açude, conversa com quem vive ali, fotografa o que encontra e dá a nota de cada problema. Depois, leva a ficha para a Mesa da Controladoria, onde tudo é auditado e vira decisão de investimento. Para jogar, é só clicar no chão para andar, ou usar o botão “Ir até lá”. Uma dica: nota sem evidência não vale. Os nomes dos açudes são reais, mas o cenário e os dados deste jogo são fictícios, para treino. Agora é com você. Boa campanha!',
  fal:'Olá! Seja bem-vindo à Régua das Águas. Este é um jogo sobre os açudes do Ceará e sobre uma pergunta simples: quão vulnerável está um açude, e tudo o que existe em volta dele? Para responder, existe o indice de vulnerabilidade socioambiental , um índice que a gente está propondo para a COGERH. Ele transforma o que a equipe vê em campo em notas de zero a três. Sempre com prova. No jogo, é você quem aplica a régua. Você desce até o açude, conversa com quem vive ali, fotografa o que encontra e dá a nota de cada problema. Depois, leva a ficha para a Mesa da Controladoria, onde tudo é auditado e vira decisão de investimento. Para jogar, é só clicar no chão para andar, ou usar o botão “Ir até lá”. Uma dica: nota sem evidência não vale. Os nomes dos açudes são reais, mas o cenário e os dados deste jogo são fictícios, para treino. Agora é com você. Boa campanha!'},

 {id:'01',grupo:'Chegada',momento:'Lá no alto da régua, no meio do açude, acenando.',tom:'Gritando lá de cima, animado.',txt:'Ôôô de casa! Olha eu aqui em cima!',fal:'OO de casa! Olha eu aqui em cima!'},
 {id:'02',grupo:'Chegada',momento:'Pula da régua e leva um tombo.',tom:'Grito de susto, caindo.',txt:'Eitaaa!',fal:'Eitaa!'},
 {id:'03',grupo:'Chegada',momento:'Levantando e batendo a poeira da roupa.',tom:'Sem graça, rindo de si mesmo.',txt:'Opss… tô bem, tô bem! Foi só um tombinho.',fal:'Ops… tô bem, tô bem! Foi só um tombinho.'},
 {id:'04',grupo:'Chegada',momento:'Se apresenta.',tom:'Simpático, cheio de energia.',txt:'Eu sou o {nome}, moro aqui na beira do Pacajus. Vem cá, deixa eu te explicar a regra dessa parada!'},

 {id:'05',grupo:'Regras',momento:'Explicando.',tom:'Explicando com as mãos, rápido mas claro.',txt:'É assim: tem cinco casos em volta do açude. A luz azul mostra qual é o próximo.'},
 {id:'06',grupo:'Regras',momento:'Explicando.',tom:'Prestativo.',txt:'Pra andar, é só tocar no chão. Ou aperta “Ir até lá”, que vai direitinho.'},
 {id:'07',grupo:'Regras',momento:'Explicando.',tom:'Contando nos dedos.',txt:'Em cada caso, você conversa com o povo, tira foto e dá a nota na régua: zero é tudo bem, três é coisa séria.'},
 {id:'08',grupo:'Regras',momento:'Explicando.',tom:'Sério de brincadeira, dedo pra cima.',txt:'Mas presta atenção: não viu, não chuta! Se não tem prova, marca “sem registro”.'},
 {id:'09',grupo:'Regras',momento:'Apontando os balões azuis.',tom:'Curioso.',txt:'Esses balõezinhos azuis são fichas que o pessoal já fez. Toca neles pra espiar.'},
 {id:'10',grupo:'Regras',momento:'Explicando o final do jogo.',tom:'Cochichando o segredo, depois normal.',txt:'No fim, a gente leva tudo pra Mesa da Controladoria. Lá a doutora confere nota por nota. E nota sem prova ela corta, viu?'},
 {id:'11',grupo:'Regras',momento:'Fecho da apresentação.',tom:'Empolgado, chamando.',txt:'Entendeu? Então bora! Vamos juntos!'},

 {id:'12',grupo:'Cantoria',momento:'De vez em quando, andando ou parado.',tom:'Cantando, melodia inventada e alegre.',txt:'Ô água boa, ô água limpa, cuida do açude que o açude cuida da gente!',canto:true},
 {id:'13',grupo:'Cantoria',momento:'De vez em quando, andando ou parado.',tom:'Cantando e pulando, ritmo de brincadeira de roda.',txt:'Pula, pula, pé de juá, quem cuida da margem não deixa a terra escorregar!',canto:true},
 {id:'14',grupo:'Cantoria',momento:'De vez em quando, sem letra.',tom:'Cantarolando à toa.',txt:'Lá-rá-rá-rá… tchu-ru-ru…',fal:'Lá rá rá rá… tchu ru ru…',canto:true},

 {id:'15',grupo:'Caminho',momento:'Ao chegar num caso.',tom:'Animado, baixinho no fim.',txt:'Chegamos! Vai lá, que eu fico aqui olhando.'},
 {id:'16',grupo:'Caminho',momento:'Quando você fica parada muito tempo.',tom:'Chamando, impaciente de brincadeira.',txt:'Ei, bora! A luz azul tá chamando a gente!'},
 {id:'17',grupo:'Caminho',momento:'Depois de uma foto de campo.',tom:'Admirado.',txt:'Que foto massa! Prova boa é assim.'},
 {id:'18',grupo:'Caminho',momento:'Dando um pulo alto.',tom:'Gritinho de alegria.',txt:'Uhuuu! Olha o pulo!',fal:'Uhuu! Olha o pulo!'},
 {id:'19',grupo:'Caminho',momento:'Tropeçando.',tom:'Susto e risada.',txt:'Eita, quase caio de novo!'},
 {id:'20',grupo:'Caminho',momento:'Quando os cinco casos terminam.',tom:'Orgulhoso.',txt:'Pronto, ficha completa! Agora é a doutora da Mesa que confere.'},
 {id:'21',grupo:'Mesa',momento:'Chegando à Mesa da Controladoria.',tom:'Encorajando, confiante.',txt:'Fica tranquila: nota com prova passa!'},
 {id:'22',grupo:'Mesa',momento:'No relatório final.',tom:'Feliz, se despedindo.',txt:'Foi massa andar contigo! Até a próxima campanha!'}
];
function falaFalada(f){ return (f.fal||f.txt).replace(/\{nome\}/g,MENINO.nome); }
function falaTxt(id){ for(var i=0;i<FALAS.length;i++) if(FALAS[i].id===id) return FALAS[i].txt.replace(/\{nome\}/g,MENINO.nome); return ''; }
