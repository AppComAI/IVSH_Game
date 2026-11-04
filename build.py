import re,sys,os
B=os.path.dirname(os.path.abspath(__file__))
page=open(B+'/src/page.html',encoding='utf-8').read()
fonts=open(B+'/src/fonts.css',encoding='utf-8').read()
three=open(B+'/node_modules/three/build/three.min.js',encoding='utf-8').read()
three=re.sub(r"^console\.warn\([^;]*\);\s*","",three)
A=lambda n: open(B+'/src/app/'+n,encoding='utf-8').read()
qrlib=open(B+'/node_modules/qrcode-generator/qrcode.js',encoding='utf-8').read()
top=qrlib+'\n'+A('vote-data.js')+'\n'+A('01-data.js')+'\n'+A('02-ui.js')+'\n'+A('02b-vote.js')+'\n'+A('03-sfx.js')
d3=A('04-world.js')+'\n'+A('04b-fx.js')+'\n'+A('04c-fx2.js')+'\n'+A('05-engine.js')+'\n'+A('06-game.js')+'\n'+A('07-mesa.js')+'\n'+A('09-kids.js')+'\n'+A('08-start.js')
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
app=app.replace('(function(){\n','(function(){\nvar NARR_SRC='+repr(narr).replace("'",'"')+';\n',1)
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
