/* ===================== VOZ INFANTIL: transforma uma voz adulta em voz de criança =====================
   Criança tem a voz bem mais aguda (frequência fundamental ~2x a de um homem) e o "tubo" da voz menor
   (formantes ~20–30% mais altos). Por isso: (1) TD-PSOLA sobe só o tom, mantendo o timbre;
   (2) reamostragem sobe tom e timbre juntos; (3) a duração final é ajustada pela velocidade pedida.
   VozInfantil.transformar(pcm Float32Array, sr, {tom:semitons, timbre:semitons, velocidade:1.0}) -> Float32Array */
var VozInfantil=(function(){
  function hann(n){ var w=new Float32Array(n); for(var i=0;i<n;i++) w[i]=0.5-0.5*Math.cos(2*Math.PI*(i+0.5)/n); return w; }
  /* ---- tom fundamental (YIN simplificado, sinal decimado por 2) ---- */
  function pitchTrack(x,sr,hopS){
    var d=new Float32Array(Math.floor(x.length/2)); for(var i=0;i<d.length;i++) d[i]=0.5*(x[2*i]+x[2*i+1]);
    var s2=sr/2, W=Math.round(s2*0.03), tMin=Math.floor(s2/450), tMax=Math.ceil(s2/60), hop=Math.round(hopS/2), nF=Math.ceil(d.length/hop);
    var f0=new Float32Array(nF), df=new Float32Array(tMax+1), peak=0; for(i=0;i<x.length;i++){ var a=Math.abs(x[i]); if(a>peak) peak=a; }
    for(var f=0;f<nF;f++){ var c=f*hop; if(c+W+tMax>=d.length){ f0[f]=0; continue; }
      var e=0; for(i=0;i<W;i++) e+=d[c+i]*d[c+i]; if(Math.sqrt(e/W)<peak*0.025){ f0[f]=0; continue; }
      var run=0, best=-1; df[0]=1;
      for(var t=1;t<=tMax;t++){ var s=0; for(i=0;i<W;i++){ var q=d[c+i]-d[c+i+t]; s+=q*q; } run+=s; df[t]=run>0?s*t/run:1; }
      for(t=tMin;t<tMax;t++){ if(df[t]<0.18){ while(t+1<tMax&&df[t+1]<df[t]) t++; best=t; break; } }
      if(best<0){ f0[f]=0; continue; }
      var a1=df[best-1], b1=df[best], c1=df[best+1], den=a1-2*b1+c1, tt=best+(den!==0?0.5*(a1-c1)/den:0); f0[f]=s2/tt; }
    // mediana de 5 e preenchimento de buracos curtos
    var m=new Float32Array(nF); for(f=0;f<nF;f++){ var v=[]; for(var k=-2;k<=2;k++){ var g=f0[Math.min(nF-1,Math.max(0,f+k))]; if(g>0) v.push(g); } m[f]=v.length>=3?v.sort(function(p,q){ return p-q; })[v.length>>1]:0; }
    for(f=1;f<nF-1;f++) if(!m[f]&&m[f-1]&&m[f+1]) m[f]=0.5*(m[f-1]+m[f+1]);
    return {f0:m,hop:hop*2}; }
  /* ---- marcas de período (picos) ---- */
  function marks(x,sr,P){
    var lp=new Float32Array(x.length), y=0, al=Math.exp(-2*Math.PI*900/sr); for(var i=0;i<x.length;i++){ y=al*y+(1-al)*x[i]; lp[i]=y; }
    var M=[], t=0, uv=Math.round(sr*0.008);
    function f0At(s){ var k=Math.min(P.f0.length-1,Math.floor(s/P.hop)); return P.f0[k]; }
    while(t<x.length){ var f=f0At(t);
      if(f>0){ var T=sr/f, a=Math.round(t+0.75*T), b=Math.min(x.length-1,Math.round(t+1.25*T)), bi=-1, bv=-1e9;
        if(!M.length||!M[M.length-1].v){ a=Math.round(t); b=Math.min(x.length-1,Math.round(t+T)); }
        for(var j=a;j<=b;j++) if(lp[j]>bv){ bv=lp[j]; bi=j; }
        if(bi<0) break; M.push({p:bi,T:Math.round(T),v:true}); t=bi; }
      else { t+=uv; if(t<x.length) M.push({p:t,T:uv,v:false}); } }
    return M; }
  /* ---- TD-PSOLA: tom x a, duração x D ---- */
  function psola(x,sr,a,D){
    var P=pitchTrack(x,sr,Math.round(sr*0.005)), M=marks(x,sr,P); if(M.length<2) return x.slice();
    var L=Math.ceil(x.length*D)+sr, y=new Float32Array(L), ws=new Float32Array(L), ts=M[0].p*D, k=0, wc={};
    while(ts<L-1){ var ta=ts/D; while(k+1<M.length&&Math.abs(M[k+1].p-ta)<=Math.abs(M[k].p-ta)) k++; var m=M[k]; if(ta>x.length) break;
      var T=Math.max(16,m.T), n=2*T, w=wc[n]||(wc[n]=hann(n)), c=Math.round(ts);
      for(var i=0;i<n;i++){ var si=m.p-T+i, di=c-T+i; if(si<0||si>=x.length||di<0||di>=L) continue; y[di]+=x[si]*w[i]; ws[di]+=w[i]; }
      ts+=m.v?T/a:T; }
    var out=new Float32Array(Math.ceil(x.length*D)); for(var j=0;j<out.length;j++) out[j]=y[j]/Math.max(ws[j],0.5);
    return out; }
  /* ---- reamostragem (sobe tom e timbre juntos), com filtro anti-alias ---- */
  function resample(x,r){
    var fc=Math.min(0.5,0.5/r)*0.92, N=63, h=new Float32Array(N), s=0;
    for(var i=0;i<N;i++){ var n=i-(N-1)/2, sinc=n===0?2*fc:Math.sin(2*Math.PI*fc*n)/(Math.PI*n), bw=0.42-0.5*Math.cos(2*Math.PI*i/(N-1))+0.08*Math.cos(4*Math.PI*i/(N-1)); h[i]=sinc*bw; s+=h[i]; }
    for(i=0;i<N;i++) h[i]/=s;
    var f=new Float32Array(x.length); for(i=0;i<x.length;i++){ var a=0; for(var j=0;j<N;j++){ var q=i+j-(N-1)/2; if(q>=0&&q<x.length) a+=x[q]*h[j]; } f[i]=a; }
    var out=new Float32Array(Math.floor((x.length-1)/r));
    for(var k=0;k<out.length;k++){ var p=k*r, i0=Math.floor(p), u=p-i0, xm=f[Math.max(0,i0-1)], x0=f[i0], x1=f[Math.min(f.length-1,i0+1)], x2=f[Math.min(f.length-1,i0+2)];
      out[k]=x0+0.5*u*(x1-xm+u*(2*xm-5*x0+4*x1-x2+u*(3*(x0-x1)+x2-xm))); }
    return out; }
  function transformar(x,sr,o){ o=o||{}; var P=Math.pow(2,(o.tom||0)/12), F=Math.pow(2,(o.timbre||0)/12), S=o.velocidade||1;
    var y=psola(x,sr,P/F,F/S); if(F!==1) y=resample(y,F);
    var pk=0; for(var i=0;i<y.length;i++){ var a=Math.abs(y[i]); if(a>pk) pk=a; } if(pk>0) for(i=0;i<y.length;i++) y[i]*=0.89/pk;
    return y; }
  /* ---- WAV ---- */
  function decodeWav(buf){ var dv=new DataView(buf), p=12, sr=22050, ch=1, bits=16, data=null;
    while(p+8<=dv.byteLength){ var id=String.fromCharCode(dv.getUint8(p),dv.getUint8(p+1),dv.getUint8(p+2),dv.getUint8(p+3)), sz=dv.getUint32(p+4,true);
      if(id==='fmt '){ ch=dv.getUint16(p+10,true); sr=dv.getUint32(p+12,true); bits=dv.getUint16(p+22,true); }
      else if(id==='data'){ data={o:p+8,n:Math.min(sz,dv.byteLength-p-8)}; break; } p+=8+sz+(sz&1); }
    if(!data||bits!==16) throw new Error('WAV não suportado'); var n=data.n/2/ch, x=new Float32Array(n);
    for(var i=0;i<n;i++) x[i]=dv.getInt16(data.o+i*2*ch,true)/32768; return {pcm:x,sr:sr}; }
  function encodeWav(x,sr){ var b=new ArrayBuffer(44+x.length*2), v=new DataView(b);
    function s(o,t){ for(var i=0;i<t.length;i++) v.setUint8(o+i,t.charCodeAt(i)); }
    s(0,'RIFF'); v.setUint32(4,36+x.length*2,true); s(8,'WAVE'); s(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); s(36,'data'); v.setUint32(40,x.length*2,true);
    for(var i=0;i<x.length;i++){ var q=Math.max(-1,Math.min(1,x[i])); v.setInt16(44+i*2,q<0?q*32768:q*32767,true); } return b; }
  return {transformar:transformar,psola:psola,resample:resample,pitchTrack:pitchTrack,decodeWav:decodeWav,encodeWav:encodeWav};
})();
if(typeof module!=='undefined') module.exports=VozInfantil;
