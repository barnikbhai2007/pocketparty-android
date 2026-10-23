from pathlib import Path
import numpy as np,subprocess,wave,json,tempfile
p=Path(__file__).parent;out=p/'app/src/main/assets/assets/studio';sr=22050
ids=['skyhook','fossil','elevator','wobble','unravel','kite','gravity','tumble','moss','choir','potion','mole','tailor','sea','golem','suitcase','tongue','room','ghost','spaghetti','planet','candle','octopus','sunshine','gift','tide','orchard','heat','parcel','echo']
def export(x,path):
 x=np.clip(x,-.97,.97);pcm=(x*32767).astype('<i2');tmp=Path(tempfile.mkstemp(suffix='.wav')[1])
 with wave.open(str(tmp),'wb') as f:f.setnchannels(2 if x.ndim==2 else 1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','4',str(path)],check=True);tmp.unlink()
def note(freq,dur,kind):
 t=np.arange(int(sr*dur))/sr
 if kind==0:y=(np.sin(2*np.pi*freq*t)+.35*np.sin(2*np.pi*freq*2*t)+.15*np.sin(2*np.pi*freq*3*t))*np.exp(-t*6/dur)
 elif kind==1:y=(np.sin(2*np.pi*freq*t)*np.exp(-t*3/dur)+.2*np.sin(2*np.pi*freq*2.76*t)*np.exp(-t*8/dur))
 elif kind==2:y=np.sin(2*np.pi*freq*t+1.8*np.sin(2*np.pi*freq*2*t)*np.exp(-t*10))*np.exp(-t*4/dur)
 else:y=(np.sin(2*np.pi*freq*t)+.15*np.sin(2*np.pi*freq*2*t))*np.sin(np.pi*np.minimum(t/dur,1))**.7
 fade=np.minimum(1,t/.008)*np.minimum(1,(dur-t)/.025);return y*fade
manifest=[]
for idx,id in enumerate(ids):
 rng=np.random.default_rng(7901+idx);bpm=[100,82,108,116,86,104,92,106,80,112,98,102,84,72,96,110,118,104,78,114,76,80,120,100,112,108,74,116,106,88][idx];beat=60/bpm;length=beat*32;n=int(length*sr);mix=np.zeros((n,2));root=45+[0,2,5,7,9][idx%5];minor=idx in [4,6,10,13,14,18,20,26,29];scale=[0,2,3,5,7,8,10] if minor else [0,2,4,5,7,9,11];prog=[0,3,5,4] if minor else [0,4,5,3]
 def put(at,y,vol,pan=0):
  start=int(at*sr);end=min(n,start+len(y));seg=y[:end-start]*vol
  if end>start:mix[start:end,0]+=seg*np.sqrt((1-pan)/2);mix[start:end,1]+=seg*np.sqrt((1+pan)/2)
 for b in range(32):
  chord=prog[(b//4)%4];base=root+scale[chord];freq=440*2**((base-69)/12)
  if b%2==0:put(b*beat,note(freq,beat*1.7,0),.14,-.1)
  if b%4==0:
   for st in [0,4 if not minor else 3,7]:put(b*beat,note(freq*2**((st+12)/12),beat*3.9,3),.048,st/14-.4)
  for sub in range(2):
   if rng.random()<.14:continue
   pos=b*beat+sub*beat/2;k=int(rng.choice([0,2,4,6]));m=root+12+scale[(chord+k)%7]+(12 if (chord+k)>=7 else 0);f=440*2**((m-69)/12);put(pos,note(f,beat*(.7 if idx%3==0 else 1.1),idx%3),.12 if sub==0 else .07,float(rng.uniform(-.45,.45)))
  if bpm>88:
   tt=np.arange(int(sr*.10))/sr;noise=rng.normal(0,1,len(tt));hat=np.convolve(noise,[1,-1],mode='same')*np.exp(-tt*65)*.018;put(b*beat+beat*.5,hat,1,.3)
   if b%2==0:
    t=np.arange(int(sr*.22))/sr;kick=np.sin(2*np.pi*(55*t+7*(1-np.exp(-t*30))))*np.exp(-t*25);put(b*beat,kick,.1,0)
 # Gentle stereo echo, circular for loop continuity.
 for delay,amount in [(beat*.75,.14),(beat*1.5,.07)]:mix+=np.roll(mix,int(delay*sr),axis=0)[:,::-1]*amount
 peak=np.max(np.abs(mix));mix=mix/(peak or 1)*.68;export(mix,out/'music'/f'{id}.ogg');manifest.append({'id':id,'bpm':bpm,'seconds':round(length,3),'type':'original procedural instrumental loop'})
rng=np.random.default_rng(591);effects={}
for k,name in enumerate(['tap','wood','metal','water','wind','magic','cloth','success','miss','win','warning','route']):
 dur=[.10,.18,.35,.32,.6,.6,.26,.55,.25,1.65,.4,.28][k];t=np.arange(int(sr*dur))/sr;noise=rng.normal(0,1,len(t));env=np.exp(-t*(8/dur))
 if name in ['wood','tap','cloth']:y=noise*env*.12+np.sin(2*np.pi*(220 if name=='wood' else 480)*t)*env*.15
 elif name=='metal':y=sum(np.sin(2*np.pi*f*t)*np.exp(-t*14) for f in [430,777,1230])*.10
 elif name=='water':y=np.sin(2*np.pi*(360*t-220*t*t))*np.sin(np.pi*t/dur)*.3
 elif name=='wind':y=np.convolve(noise,np.ones(100)/100,mode='same')*np.sin(np.pi*t/dur)*.9
 elif name in ['magic','success','win']:
  y=np.zeros(len(t));notes=[0,4,7,12] if name=='win' else [0,7,12]
  for j,st in enumerate(notes):
   start=int(j*dur/(len(notes)+1)*sr);v=note(523*2**(st/12),dur-j*dur/(len(notes)+1),1);y[start:start+len(v)]+=v[:len(y)-start]*.18
 elif name=='miss':y=np.sin(2*np.pi*(210*t-200*t*t))*env*.4
 else:y=note(660 if name=='warning' else 370,dur,0)*.25
 export(y,out/'sfx'/f'{name}.ogg');effects[name]=round(dur,3)
json.dump({'themes':manifest,'effects':effects,'sampleRate':sr,'note':'Original synthesized compositions and Foley-like effects. Loop masters generated reproducibly by this script; no third-party samples.'},open(p/'asset-source/studio/AUDIO_MANIFEST.json','w'),indent=2)
print('Rendered 30 instrumental themes and 12 sound effects.')
