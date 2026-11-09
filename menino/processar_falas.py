#!/usr/bin/env python3
"""Trata as falas gravadas do menino e deixa prontas para o build.

Uso:  python3 menino/processar_falas.py <zip-ou-pasta> [--tom SEMITONS]
      python3 menino/processar_falas.py <falas.mp3> --dividir     (um arquivo só, falas separadas por pausas de 2 s, como no SSML da Letícia)
      python3 menino/processar_falas.py <narracao.mp3> --narracao (vira a fala 00)

- Aceita o .zip da página gravar.html ou uma pasta com arquivos (fala_01.webm, 01.m4a, menino_01.mp3…).
- Para cada fala: mono, corta silêncio do começo e do fim, filtro de graves, volume igualado
  (EBU R128, -16 LUFS), MP3 mono. Opcional: --tom 3 sobe 3 semitons (voz mais infantil).
- Fala 00 (narração de boas-vindas) vai para narracao/narracao.mp3, sem mudar o tom.
- As demais vão para menino/<id>.mp3, e menino/env.json guarda a duração e o envelope
  (volume a cada 50 ms, de 0 a 9) que mexe a boca do menino no jogo.
Precisa de ffmpeg (com rubberband, se usar --tom). Depois rode: python3 build.py
"""
import sys, os, re, json, zipfile, tempfile, subprocess, shutil, struct, math

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = ('.mp3', '.m4a', '.mp4', '.aac', '.ogg', '.oga', '.opus', '.wav', '.webm', '.flac')

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(' '.join(cmd[:6]) + '…\n' + r.stderr[-800:])
    return r

def fala_id(nome):
    m = re.search(r'(\d{1,2})(?!.*\d)', os.path.splitext(os.path.basename(nome))[0])
    return m.group(1).zfill(2) if m else None

def tratar(src, dst, tom=0.0, kbps=56):
    filtros = ['aformat=channel_layouts=mono', 'highpass=f=80',
               'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
               'areverse', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08', 'areverse']
    if tom:
        filtros.append('rubberband=pitch=%.5f:formant=shifted' % (2 ** (tom / 12.0)))
    filtros += ['loudnorm=I=-16:TP=-1.5:LRA=11', 'adelay=80', 'apad=pad_dur=0.12', 'aresample=44100']
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', ','.join(filtros), '-ac', '1',
         '-c:a', 'libmp3lame', '-b:a', '%dk' % kbps, dst])

def envelope(mp3):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True)
    pcm = r.stdout
    n = len(pcm) // 2
    s = struct.unpack('<%dh' % n, pcm[:n * 2])
    win = 400  # 50 ms a 8 kHz
    rms = [math.sqrt(sum(v * v for v in s[i:i + win]) / max(1, len(s[i:i + win]))) for i in range(0, n, win)]
    ref = sorted(rms)[int(len(rms) * 0.95)] if rms else 1
    ref = ref or 1
    env = ''.join(str(min(9, int(round(9 * min(1.0, v / ref) ** 0.8)))) for v in rms)
    return env, round(n / 8000.0, 2)

def ids_das_falas():
    js = open(os.path.join(B, 'src', 'app', 'menino-falas.js'), encoding='utf-8').read()
    return [k for k in re.findall(r"\{id:'(\d\d)'", js) if k != '00']

def dividir(fonte, pasta):
    """Corta um arquivo único nas pausas longas (>= 1,2 s) e nomeia na ordem do roteiro."""
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', fonte, '-af', 'silencedetect=noise=-42dB:d=1.2', '-f', 'null', '-'], capture_output=True, text=True)
    ini = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', r.stderr)]
    fim = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fonte], capture_output=True, text=True)
    dur = float(p.stdout.strip())
    cortes, t = [], 0.0
    for a, b in zip(ini, fim + [dur] * (len(ini) - len(fim))):
        if a - t > 0.15: cortes.append((t, a))
        t = b
    if dur - t > 0.15: cortes.append((t, dur))
    ids = ids_das_falas()
    print('falas encontradas no arquivo: %d (o roteiro tem %d)' % (len(cortes), len(ids)))
    if len(cortes) != len(ids) and '--forcar' not in sys.argv:
        for i, (a, b) in enumerate(cortes): print('  trecho %2d: %6.2f s a %6.2f s (%.2f s)' % (i + 1, a, b, b - a))
        raise SystemExit('A contagem não bate: confira se alguma fala saiu emendada ou com pausa longa no meio. (--forcar usa a ordem assim mesmo.)')
    for k, (a, b) in zip(ids, cortes):
        run(['ffmpeg', '-v', 'error', '-y', '-i', fonte, '-ss', '%.3f' % max(0, a - 0.05), '-to', '%.3f' % (b + 0.05), '-ac', '1', os.path.join(pasta, 'fala_%s.wav' % k)])

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    fonte = sys.argv[1]
    tom = float(sys.argv[sys.argv.index('--tom') + 1]) if '--tom' in sys.argv else 0.0
    tmp = tempfile.mkdtemp()
    if '--narracao' in sys.argv:
        os.makedirs(os.path.join(B, 'narracao'), exist_ok=True)
        tratar(fonte, os.path.join(B, 'narracao', 'narracao.mp3'), 0.0, 64); print('00 → narracao/narracao.mp3'); return
    if '--dividir' in sys.argv:
        dividir(fonte, tmp); pasta = tmp
    elif zipfile.is_zipfile(fonte):
        with zipfile.ZipFile(fonte) as z:
            for i in z.infolist():
                nome = os.path.basename(i.filename)
                if nome and nome.lower().endswith(EXT) and '..' not in i.filename:
                    with z.open(i) as a, open(os.path.join(tmp, nome), 'wb') as b:
                        shutil.copyfileobj(a, b)
        pasta = tmp
    else:
        pasta = fonte
    arqs = {}
    for f in sorted(os.listdir(pasta)):
        if f.lower().endswith(EXT):
            k = fala_id(f)
            if k: arqs[k] = os.path.join(pasta, f)
    os.makedirs(os.path.join(B, 'menino'), exist_ok=True)
    envp = os.path.join(B, 'menino', 'env.json')
    envj = json.load(open(envp, encoding='utf-8')) if os.path.exists(envp) else {}
    for k, src in sorted(arqs.items()):
        if k == '00':
            os.makedirs(os.path.join(B, 'narracao'), exist_ok=True)
            dst = os.path.join(B, 'narracao', 'narracao.mp3'); tratar(src, dst, 0.0, 64)
            print('00 → narracao/narracao.mp3'); continue
        dst = os.path.join(B, 'menino', k + '.mp3'); tratar(src, dst, tom)
        e, d = envelope(dst); envj[k] = {'e': e, 'd': d}
        print('%s → menino/%s.mp3  %.1f s  %d KB' % (k, k, d, os.path.getsize(dst) // 1024))
    json.dump(envj, open(envp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    shutil.rmtree(tmp, ignore_errors=True)
    print('Pronto. Agora rode: python3 build.py')

if __name__ == '__main__':
    main()
