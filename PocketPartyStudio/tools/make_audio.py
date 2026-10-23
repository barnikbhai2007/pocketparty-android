"""Reproducible original instrumental arcade loops and effects. No sampled music."""
from pathlib import Path
import numpy as np, wave, subprocess, json
ROOT=Path(__file__).resolve().parents[1]; MASTER=ROOT/'asset-source/audio'; LIVE=ROOT/'app/src/main/assets/assets/music'; MASTER.mkdir(parents=True,exist_ok=True); LIVE.mkdir(parents=True,exist_ok=True)
SR=44100; specs=[('menu',112,60),('rally',128,57),('sumo',108,50),('hockey',120,62),('draw',116,55),('color',124,65),('target',110,53),('rhythm',128,60),('memory',104,64),('connect',112,58),('boxes',108,62)]
report=[]
def hz(m): return 440*2**((m-69)/12)
def write(path,a):
 pcm=np.round(np.clip(a,-1,1)*32767).astype('<i2')
 with wave.open(str(path),'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
for idx,(name,bpm,root) in enumerate(specs):
 rng=np.random.default_rng(7731+idx); beat=60/bpm; dur=96*beat; n=int(dur*SR); mix=np.zeros((n,2),dtype=np.float32)
 def add(when,secs,midi,amp,voice='pluck',pan=0):
  start=int(when*SR); length=min(int(secs*SR),n-start)
  if length<=0:return
  t=np.arange(length,dtype=np.float32)/SR; f=hz(midi)
  if voice=='bass': sig=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t); env=np.minimum(t/.012,1)*np.exp(-t*2.8)
  elif voice=='bell': sig=np.sin(2*np.pi*f*t)+.25*np.sin(2*np.pi*f*2.003*t)+.12*np.sin(2*np.pi*f*3.99*t); env=np.minimum(t/.005,1)*np.exp(-t*4)
  else: sig=np.sin(2*np.pi*f*t)+.32*np.sin(2*np.pi*f*2*t)+.12*np.sin(2*np.pi*f*3*t); env=np.minimum(t/.008,1)*np.exp(-t*5.2)
  sig=(sig*env*amp).astype(np.float32); end=start+length
  mix[start:end,0]+=sig*np.sqrt((1-pan)/2);mix[start:end,1]+=sig*np.sqrt((1+pan)/2)
 progression=[0,5,9,7];scale=[0,2,4,7,9,12,14,16]
 for bar in range(24):
  chord=progression[(bar//2+idx)%4]; start=bar*4*beat
  for b in range(4):
   add(start+b*beat,beat*.88,root-12+chord,.14,'bass',-.05)
   # Soft kick with smooth pitch decay.
   pos=int((start+b*beat)*SR); count=min(int(.23*SR),n-pos);t=np.arange(count,dtype=np.float32)/SR
   sig=np.sin(2*np.pi*(48*t+2*(1-np.exp(-t*38))))*np.exp(-t*20)*.14
   mix[pos:pos+count]+=sig[:,None]
   if b%2==1:
    count=min(int(.16*SR),n-pos);t=np.arange(count,dtype=np.float32)/SR;noise=rng.normal(0,1,count).astype(np.float32); sig=(noise*.024+np.sin(2*np.pi*170*t)*.04)*np.exp(-t*24);mix[pos:pos+count]+=sig[:,None]
  # Syncopated mallet pattern, unique melody and inversions per theme.
  pattern=[0,2,4,6,5,3,1,4] if idx%2==0 else [0,3,2,5,4,1,6,2]
  for k in range(8):
   when=start+k*beat/2
   add(when,beat*1.2,root+12+scale[(pattern[k]+bar%3+idx)%8],.057 if k%2 else .072,'bell' if idx in [0,7,10] else 'pluck',(-.45 if k%2 else .45))
   if k%2==0:add(when,beat*.9,root+chord+[0,4,7][(k//2)%3],.038,'pluck',-.25)
   pos=int(when*SR);count=min(int(.055*SR),n-pos);t=np.arange(count,dtype=np.float32)/SR;noise=rng.normal(0,1,count).astype(np.float32); noise=np.concatenate(([0],np.diff(noise))).astype(np.float32);sig=noise*np.exp(-t*85)*.009;mix[pos:pos+count,1 if k%2 else 0]+=sig
 # Stereo musical echo wraps at the loop point for continuity.
 dry=mix.copy()
 for delay,gain in [(beat*.75,.15),(beat*1.5,.07)]:mix+=np.roll(dry,int(delay*SR),axis=0)[:,::-1]*gain
 peak=float(np.max(np.abs(mix)));mix*=.68/max(peak,.68); fade=min(int(.012*SR),n//2);mix[:fade]*=np.linspace(0,1,fade)[:,None];mix[-fade:]*=np.linspace(1,0,fade)[:,None]
 path=MASTER/(name+'.wav');write(path,mix)
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(path),'-c:a','libvorbis','-q:a','4',str(LIVE/(name+'.ogg'))],check=True)
 report.append({'track':name,'bpm':bpm,'seconds':round(dur,3),'sampleRate':SR,'channels':2,'peak':round(float(np.max(np.abs(mix))),4),'rms':round(float(np.sqrt(np.mean(mix**2))),4),'masterBytes':path.stat().st_size})
 print(name,round(dur,1),'seconds',flush=True)
# Short UI effects, useful separate production assets.
SFX=ROOT/'app/src/main/assets/assets/sfx';SFX.mkdir(exist_ok=True)
for name,freq in [('tap',520),('goal',880),('hit',180),('win',1047),('ready',660)]:
 duration=.15 if name!='win' else .65;t=np.arange(int(SR*duration),dtype=np.float32)/SR
 sig=(np.sin(2*np.pi*freq*t)+.25*np.sin(2*np.pi*freq*1.5*t))*np.minimum(t/.005,1)*np.exp(-t*8)*.2
 write(SFX/(name+'.wav'),np.column_stack([sig,sig]))
(ROOT/'asset-source/audio/MANIFEST.json').write_text(json.dumps(report,indent=2))
print('TOTAL MASTER BYTES',sum(r['masterBytes'] for r in report),flush=True)
