/* ===================== SOM (Web Audio, sintetizado, sem arquivos) ===================== */
var SFX=(function(){
  var AC=window.AudioContext||window.webkitAudioContext, ctx=null, master, mus, fx, noiseBuf;
  var on=true; try{ if(localStorage.getItem('regua_som')==='0') on=false; }catch(e){}
  var sala=false; try{ sala=localStorage.getItem('regua_sala')==='1'; }catch(e){}
  var stepN=0, walking=false;
  var scene=null, timer=null, nextT=0, step=0, act=true;
  // baião em sol mixolídio no "campo"; pads calmos na abertura e na mesa
  var SC={
    abertura:{bpm:56, sub:2, root:57, scale:[0,2,4,7,9], chords:[[0,4,7,11],[5,9,12,16],[2,5,9,12],[7,11,14,17]], dens:.22, wave:'sine', drone:true},
    campo:   {bpm:92, sub:4, root:55, scale:[0,2,4,5,7,9,10], chords:[[0,4,7,10],[5,9,12],[0,4,7,10],[7,11,14,17]], dens:.42, wave:'square', baiao:true},
    mesa:    {bpm:70, sub:2, root:60, scale:[0,2,4,7,9], chords:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]], dens:.32, wave:'triangle'},
    fim:     {bpm:84, sub:2, root:60, scale:[0,2,4,7,9], chords:[[0,4,7,11],[5,9,12,16],[7,11,14,17],[0,4,7,11]], dens:.5, wave:'triangle'}
  };
  function hz(m){ return 440*Math.pow(2,(m-69)/12); }
  function init(){
    if(ctx||!AC) return !!ctx;
    try{ ctx=new AC(); }catch(e){ return false; }
    var comp=ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
    master=ctx.createGain(); master.gain.value=on?0.9:0; master.connect(comp);
    mus=ctx.createGain(); mus.gain.value=sala?0:0.15; mus.connect(master);
    fx=ctx.createGain(); fx.gain.value=sala?0.22:0.45; fx.connect(master);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate); var d=noiseBuf.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    return true;
  }
  function tone(f,t,dur,o){ o=o||{}; var osc=ctx.createOscillator(), g=ctx.createGain(), v=o.vol||0.3;
    osc.type=o.type||'sine'; osc.frequency.setValueAtTime(f,t); if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to,t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+(o.att||0.01)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    var out=g; if(o.lp){ var f2=ctx.createBiquadFilter(); f2.type='lowpass'; f2.frequency.value=o.lp; g.connect(f2); out=f2; }
    osc.connect(g); out.connect(o.bus||fx); osc.start(t); osc.stop(t+dur+0.05); }
  function noise(t,dur,o){ o=o||{}; var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    s.buffer=noiseBuf; f.type=o.ft||'bandpass'; f.frequency.value=o.f||1200; f.Q.value=o.q||1;
    g.gain.setValueAtTime(o.vol||0.2,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(o.bus||fx); s.start(t,Math.random()); s.stop(t+dur+0.05); }
  function ready(){ return on&&act&&ctx&&ctx.state==='running'; }
  /* pífano sintetizado: senoide + harmônico, "sopro" no ataque, vibrato que entra devagar */
  function pife(m,t,dur,vol,o){ o=o||{}; vol=vol||0.16; var f=hz(m), a=ctx.createOscillator(), b=ctx.createOscillator(), g=ctx.createGain(), g2=ctx.createGain(), lp=ctx.createBiquadFilter();
    a.type='sine'; b.type='triangle'; var f0=o.from?hz(o.from):f*0.965;
    a.frequency.setValueAtTime(f0,t); a.frequency.exponentialRampToValueAtTime(f,t+(o.from?0.12:0.05)); b.frequency.setValueAtTime(f0*2,t); b.frequency.exponentialRampToValueAtTime(f*2,t+(o.from?0.12:0.05));
    var lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=5.6; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*0.009,t+Math.min(0.3,dur*0.6)); lfo.connect(lg); lg.connect(a.frequency);
    g2.gain.value=o.whistle?0.03:0.2; b.connect(g2); g2.connect(g); a.connect(g);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.03); g.gain.setValueAtTime(vol*0.85,t+dur*0.7); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    lp.type='lowpass'; lp.frequency.value=o.whistle?3800:5600; g.connect(lp); lp.connect(o.bus||fx);
    noise(t,o.whistle?0.12:0.07,{ft:o.whistle?'highpass':'bandpass',f:o.whistle?3000:f*2.2,q:3,vol:vol*(o.whistle?0.35:0.9),bus:o.bus});
    a.start(t); b.start(t); lfo.start(t); a.stop(t+dur+.05); b.stop(t+dur+.05); lfo.stop(t+dur+.05); }
  var MOT={ /* tema da Régua: sol, lá, si, ré (0-1-2-3) */
    chegada:[[79,.12],[81,.12],[83,.12],[86,.5]],
    acerto:[[79,.1],[81,.1],[83,.1],[86,.16],[91,.55]],
    regua:[[79,.38],[81,.38],[83,.38],[86,1.1]],
    erro:[[86,.16],[83,.16],[81,.5]],
    fim:[[79,.14],[81,.14],[83,.14],[86,.32],[83,.14],[86,.14],[91,.32],[88,.14],[91,.7]] };
  function playMot(k,vol,o){ if(!ready()) return; var t=ctx.currentTime+0.02; MOT[k].forEach(function(n){ pife(n[0],t,n[1]*1.25,vol||0.16,o); t+=n[1]; }); }
  function tick(){
    if(!ctx||!scene) return;
    var c=SC[scene], spb=60/c.bpm/c.sub;
    while(nextT<ctx.currentTime+0.25){
      var t=nextT, bar=Math.floor(step/8)%4, pos=step%8, ch=c.chords[bar];
      if(on&&act){
        if(pos===0) ch.forEach(function(n){ tone(hz(c.root+n-12),t,spb*8.2,{type:'sine',vol:c.baiao?0.05:0.09,att:0.3,bus:mus,lp:900}); });
        if(c.baiao){
          // zabumba: grave no 1 e no "a" do 1; bacalhau no contratempo; triângulo nas semicolcheias
          if(pos===0||pos===3) { tone(pos===0?92:84,t,0.26,{type:'sine',vol:pos===0?0.55:0.42,to:48,bus:mus}); tone(hz(c.root+ch[0]-24),t,spb*2.6,{type:'triangle',vol:0.2,bus:mus,lp:520}); }
          if(pos===6) tone(78,t,0.14,{type:'sine',vol:0.22,to:52,bus:mus});
          if(pos===2||pos===6) noise(t,0.05,{ft:'bandpass',f:2600,q:3,vol:0.22,bus:mus});
          noise(t,(pos%4===2)?0.14:0.03,{ft:'highpass',f:6500,q:0.7,vol:(pos%4===2)?0.16:0.07,bus:mus});
          if(pos%2===0&&Math.random()<c.dens){ var n=c.scale[Math.floor(Math.random()*c.scale.length)]+(Math.random()<.35?12:0);
            tone(hz(c.root+n),t,spb*1.7,{type:'square',vol:0.045,bus:mus,lp:1900}); tone(hz(c.root+n+12),t,spb*1.5,{type:'sawtooth',vol:0.012,bus:mus,lp:2600}); }
        } else {
          if(pos===0||pos===4) tone(hz(c.root+ch[0]-24),t,spb*3.6,{type:'triangle',vol:0.2,bus:mus,lp:500});
          if(c.drone&&pos===0&&bar===0) tone(hz(c.root-24),t,spb*32,{type:'sawtooth',vol:0.035,att:1.5,bus:mus,lp:300});
          if(Math.random()<c.dens){ var m=c.scale[Math.floor(Math.random()*c.scale.length)]+(Math.random()<.3?12:0);
            tone(hz(c.root+m),t,spb*1.8,{type:c.wave,vol:0.12,bus:mus,lp:2400}); }
        }
      }
      nextT+=spb; step++;
    }
  }
  var api={
    start:function(){ if(!init()) return; if(ctx.state!=='running') ctx.resume(); },
    scene:function(k){ if(!ctx) return; if(scene===k) return; scene=k; step=0; nextT=ctx.currentTime+0.1; if(!timer) timer=setInterval(tick,90); },
    stop:function(){ scene=null; },
    click:function(){ if(ready()) tone(660,ctx.currentTime,0.07,{type:'triangle',vol:0.18}); },
    chip:function(){ if(ready()) tone(1040,ctx.currentTime,0.05,{type:'square',vol:0.06,lp:3000}); },
    blip:function(){ if(ready()){ var t=ctx.currentTime; tone(784,t,0.1,{vol:0.15}); tone(1046,t+0.08,0.14,{vol:0.15}); } },
    arrive:function(){ playMot('chegada',0.15); },
    motif:function(k){ playMot(k); },
    reguaNote:function(i){ if(ready()){ var t=ctx.currentTime; pife([79,81,83,86][i],t,0.6,0.2); tone(hz([67,69,71,74][i]),t,1.2,{type:'sine',vol:0.08}); } },
    whistle:function(){ if(ready()){ var t=ctx.currentTime+0.02; [[79,.16,null],[83,.16,79],[86,.22,83],[91,.5,86]].forEach(function(n){ pife(n[0],t,n[1]*1.3,0.11,{whistle:true,from:n[2]}); t+=n[1]; }); } },
    good:function(){ playMot('acerto',0.15); },
    soft:function(){ if(ready()){ var t=ctx.currentTime; tone(587,t,0.18,{type:'triangle',vol:0.15}); tone(659,t+0.1,0.22,{type:'triangle',vol:0.15}); } },
    bad:function(){ if(ready()){ var t=ctx.currentTime; tone(330,t,0.35,{type:'sawtooth',vol:0.12,lp:900,to:220}); tone(247,t+0.18,0.45,{type:'sawtooth',vol:0.12,lp:900,to:160}); } },
    shutter:function(){ if(ready()){ var t=ctx.currentTime; noise(t,0.04,{ft:'highpass',f:3000,vol:0.5}); noise(t+0.07,0.09,{ft:'bandpass',f:1800,q:2,vol:0.4}); tone(1900,t+0.16,0.05,{type:'square',vol:0.05}); } },
    stamp:function(){ if(ready()){ var t=ctx.currentTime; tone(120,t,0.25,{type:'sine',vol:0.5,to:60}); noise(t,0.12,{ft:'lowpass',f:700,vol:0.5}); } },
    gota:function(){ if(ready()){ var t=ctx.currentTime; tone(1100,t,0.14,{type:'sine',vol:0.22,to:420}); tone(1650,t+0.05,0.1,{type:'sine',vol:0.08,to:700}); } },
    brilho:function(){ if(ready()){ var t=ctx.currentTime; [1568,1976,2349,3136].forEach(function(f,i){ tone(f,t+i*0.06,0.18,{type:'sine',vol:0.07}); }); } },
    garca:function(){ if(ready()){ var t=ctx.currentTime; tone(420,t,0.22,{type:'sawtooth',vol:0.06,lp:1400,to:300}); tone(380,t+0.2,0.26,{type:'sawtooth',vol:0.05,lp:1200,to:240}); } },
    coin:function(){ if(ready()){ var t=ctx.currentTime; tone(1318,t,0.09,{type:'square',vol:0.06,lp:4000}); tone(1760,t+0.07,0.16,{type:'square',vol:0.06,lp:4000}); } },
    regua:function(){ if(ready()){ var t=ctx.currentTime; tone(hz(43),t,3.2,{type:'triangle',vol:0.18,att:0.4,lp:400}); tone(hz(55),t,3.2,{type:'sine',vol:0.08,att:0.6}); noise(t,2.6,{ft:'highpass',f:5000,vol:0.07}); [0,4,7,12,16,19,24].forEach(function(n,i){ tone(hz(79+n),t+1.9+i*0.06,0.8,{type:'sine',vol:0.05}); }); } playMot('regua',0.2); },
    whoosh:function(){ if(ready()){ var t=ctx.currentTime; var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noiseBuf; f.type='bandpass'; f.Q.value=1.2; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2400,t+1.4); f.frequency.exponentialRampToValueAtTime(400,t+2.6);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.35,t+1.2); g.gain.exponentialRampToValueAtTime(0.0001,t+2.8); s.connect(f); f.connect(g); g.connect(fx); s.start(t); s.stop(t+3); } },
    fanfare:function(final){ if(!ready()) return; var t=ctx.currentTime; [55,62,67].forEach(function(m){ tone(hz(m),t,final?2.6:1.4,{type:'triangle',vol:0.1,att:0.05}); }); tone(92,t,0.3,{type:'sine',vol:0.5,to:48}); playMot(final?'fim':'acerto',0.17); },
    step:function(){ if(!ready()) return; var t=ctx.currentTime; stepN++;
      tone(stepN%2?82:96,t,0.2,{type:'sine',vol:stepN%2?0.2:0.28,to:46}); noise(t,0.05,{f:520,q:1.5,vol:0.07});
      if(stepN%2===0) noise(t+0.005,0.035,{ft:'highpass',f:7000,vol:0.05}); else noise(t+0.005,0.09,{ft:'highpass',f:6500,vol:0.06});
      if(stepN%8===0){ var fr=[[79,81],[81,83],[83,86],[86,83,81]][Math.floor(Math.random()*4)], tt=t+0.04; fr.forEach(function(m){ pife(m,tt,0.16,0.07); tt+=0.13; }); } },
    walkVoice:function(w){ if(!ctx) return; if(!w&&walking&&ready()) noise(ctx.currentTime+0.03,0.05,{ft:'bandpass',f:2600,q:3,vol:0.2}); if(w&&!walking) stepN=0; walking=w; },
    duck:function(v){ if(ctx) mus.gain.setTargetAtTime(v?0.02:(sala?0:0.15),ctx.currentTime,0.25); },
    sala:function(v){ if(v!==undefined){ sala=!!v; try{ localStorage.setItem('regua_sala',sala?'1':'0'); }catch(e){} if(ctx){ mus.gain.setTargetAtTime(sala?0:0.15,ctx.currentTime,0.1); fx.gain.setTargetAtTime(sala?0.22:0.45,ctx.currentTime,0.1); } } return sala; },
    active:function(a){ if(a===act) return; act=a; if(ctx){ if(a&&on) ctx.resume(); else if(!a) ctx.suspend(); } },
    toggle:function(){ on=!on; try{ localStorage.setItem('regua_som',on?'1':'0'); }catch(e){}
      if(init()){ if(on) ctx.resume(); master.gain.setTargetAtTime(on?0.9:0,ctx.currentTime,0.05); } return on; },
    isOn:function(){ return on; }
  };
  return api;
})();
function syncSoundBtn(){ var b=$('gsound'); var o=SFX.isOn(); b.textContent=o?'🔊':'🔇'; b.setAttribute('aria-pressed',o?'true':'false'); b.title=o?'Desligar o som':'Ligar o som'; }
$('gsound').addEventListener('click',function(){ SFX.toggle(); syncSoundBtn(); });
syncSoundBtn();
window.SFXduck=function(v){ SFX.duck(v); };
function syncSala(){ var b=$('gsala'); if(!b) return; var v=SFX.sala(); b.setAttribute('aria-pressed',v?'true':'false'); b.title=v?'Modo sala de aula ligado: sem música, efeitos baixos':'Modo sala de aula: sem música, efeitos baixos'; }
if($('gsala')){ $('gsala').addEventListener('click',function(){ SFX.sala(!SFX.sala()); syncSala(); }); syncSala(); }
