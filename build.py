import re,sys,os
B=os.path.dirname(os.path.abspath(__file__))
page=open(B+'/src/page.html',encoding='utf-8').read()
fonts=open(B+'/src/fonts.css',encoding='utf-8').read()
three=open(B+'/node_modules/three/build/three.min.js',encoding='utf-8').read()
three=re.sub(r"^console\.warn\([^;]*\);\s*","",three)
A=lambda n: open(B+'/src/app/'+n,encoding='utf-8').read()
qrlib=open(B+'/node_modules/qrcode-generator/qrcode.js',encoding='utf-8').read()
top=qrlib+'\n'+A('vote-data.js')+'\n'+A('01-data.js')+'\n'+A('menino-falas.js')+'\n'+A('02-ui.js')+'\n'+A('02b-vote.js')+'\n'+A('03-sfx.js')
d3=A('04-world.js')+'\n'+A('04b-fx.js')+'\n'+A('04c-fx2.js')+'\n'+A('04d-kid.js')+'\n'+A('05-engine.js')+'\n'+A('06-game.js')+'\n'+A('07-mesa.js')+'\n'+A('09-kids.js')+'\n'+A('10-menino.js')+'\n'+A('08-start.js')
app_tpl="""<script>
(function(){
%s
function webglOK(){ try{ var c=document.createElement('canvas'); return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl'))); }catch(e){ return false; } }
function boot3D(){
%s
}
if(!window.THREE||!webglOK()){
  $('gload').hidden=true; var d=$('dlg'); d.hidden=false; d.className='dlg center';
  d.innerHTML='<h3>O 3D não abriu neste aparelho</h3><p>O navegador não conseguiu iniciar os gráficos 3D (WebGL). O painel ao lado e a régua completa continuam funcionando.</p>';
} else {
  var go=false; function start(){ if(go) return; go=true; try{ boot3D(); }catch(e){ console.error(e); $('gload').textContent='Erro ao iniciar o 3D: '+e.message; } }
  if(document.fonts&&document.fonts.load){ Promise.all([document.fonts.load('800 36px "Barlow Condensed"'),document.fonts.load('700 36px "Barlow Condensed"'),document.fonts.load('600 16px Barlow')]).then(start,start); setTimeout(start,2500); }
  else start();
}
})();
</script>"""
app=app_tpl % (top,d3)
import glob,base64
na=sorted(glob.glob(B+'/narracao/narracao.*'))
MT={'.mp3':'audio/mpeg','.m4a':'audio/mp4','.aac':'audio/aac','.ogg':'audio/ogg','.opus':'audio/ogg','.wav':'audio/wav','.webm':'audio/webm'}
narr=''
if na:
    ext=os.path.splitext(na[0])[1].lower(); narr='data:'+MT.get(ext,'audio/mpeg')+';base64,'+base64.b64encode(open(na[0],'rb').read()).decode()
    print('narracao embutida:',os.path.basename(na[0]),len(narr)//1024,'KB')
else: print('sem narracao (pasta narracao/ vazia)')
# falas gravadas do menino: menino/<id>.mp3 (já tratadas) + menino/env.json (envelope da boca e duração)
import json
men={}
envj=json.load(open(B+'/menino/env.json',encoding='utf-8')) if os.path.exists(B+'/menino/env.json') else {}
for f in sorted(glob.glob(B+'/menino/*.mp3')):
    k=os.path.splitext(os.path.basename(f))[0]
    men[k]={'s':'data:audio/mpeg;base64,'+base64.b64encode(open(f,'rb').read()).decode(),'e':envj.get(k,{}).get('e',''),'d':envj.get(k,{}).get('d',0)}
print('falas do menino embutidas:',len(men))
foto=''
if os.path.exists(B+'/menino/retrato.jpg'):
    foto='data:image/jpeg;base64,'+base64.b64encode(open(B+'/menino/retrato.jpg','rb').read()).decode()
app=app.replace('(function(){\n','(function(){\nvar NARR_SRC='+repr(narr).replace("'",'"')+';\nvar MEN_AUDIO='+json.dumps(men)+';\nvar MEN_FOTO='+json.dumps(foto)+';\n',1)
out=page.replace('/*__FONTS__*/',fonts).replace('<!--__THREE__-->','<script>'+three+'</script>').replace('<!--__APP__-->',app)
open(B+'/index.html','w',encoding='utf-8').write(out)
print('ok',len(out))
# demo de RV
vpage=open(B+'/src/vr-page.html',encoding='utf-8').read()
vtop=A('01-data.js')+'\n'+A('03-sfx.js')
vd3=A('04-world.js')+'\n'+A('04b-fx.js')+'\n'+A('04c-fx2.js')+'\n'+A('vr-engine.js')
vapp=app_tpl % (vtop,vd3)
vout=vpage.replace('/*__FONTS__*/',fonts).replace('<!--__THREE__-->','<script>'+three+'</script>').replace('<!--__APP__-->',vapp)
open(B+'/vr.html','w',encoding='utf-8').write(vout)
print('vr ok',len(vout))

# página de votação (celular)
vt=open(B+'/src/votar-page.html',encoding='utf-8').read()
vjs=A('vote-data.js')+'\n'+A('votar.js')
vtout=vt.replace('/*__FONTS__*/',fonts).replace('<!--__APP__-->','<script>\n'+vjs+'\n</script>')
open(B+'/votar.html','w',encoding='utf-8').write(vtout)
print('votar ok',len(vtout))

# página de gravação das falas do menino
gp=open(B+'/src/gravar-page.html',encoding='utf-8').read()
gjs=A('menino-falas.js')+'\n'+A('gravar.js')
gout=gp.replace('/*__FONTS__*/',fonts).replace('<!--__APP__-->','<script>\n'+gjs+'\n</script>')
open(B+'/gravar.html','w',encoding='utf-8').write(gout)
print('gravar ok',len(gout))

# gerador da voz do menino (voz Piper no navegador + transformação em voz de criança)
gvp=open(B+'/src/gerador-voz-page.html',encoding='utf-8').read()
gvjs=A('menino-falas.js')+'\n'+A('voz-infantil.js')+'\n'+A('gerador-voz.js')
gvout=gvp.replace('/*__FONTS__*/',fonts).replace('<!--__APP__-->','<script>\n'+gvjs+'\n</script>')
open(B+'/gerador_voz.html','w',encoding='utf-8').write(gvout)
print('gerador_voz ok',len(gvout))
