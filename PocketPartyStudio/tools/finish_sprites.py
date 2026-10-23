from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math
R=Path(__file__).resolve().parents[1]/'app/src/main/assets/assets/sprites';colors=['#315be8','#e85c48','#29936d','#9868cc']
for idx,col in enumerate(colors):
 im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im);d.rounded_rectangle((12,18,500,508),42,fill='#26344138');d.rounded_rectangle((12,7,500,495),42,fill='#fef8e8');d.rounded_rectangle((26,21,486,481),32,fill=col);d.rounded_rectangle((42,37,470,465),25,outline='#ffffff77',width=5)
 # Fine repeatable diamond engraving; a symmetric design reads from either end.
 for y in range(72,465,55):
  for x in range(72,465,55):d.polygon([(x,y-13),(x+13,y),(x,y+13),(x-13,y)],outline='#ffffff3b',width=2)
 d.ellipse((145,145,367,367),fill=col,outline='#fff3dc',width=8);d.ellipse((159,159,353,353),outline='#ffffff55',width=3)
 # Four-point burst, not font-dependent.
 d.polygon([(256,186),(277,235),(326,256),(277,277),(256,326),(235,277),(186,256),(235,235)],fill='#fff3dc')
 im.resize((256,256),Image.Resampling.LANCZOS).save(R/f'card-back-{idx}.png')
for state in ['wait','go','result']:
 im=Image.new('RGBA',(360,720));d=ImageDraw.Draw(im);d.rounded_rectangle((66,22,306,706),56,fill='#15243140');d.rounded_rectangle((57,10,297,690),55,fill='#132330');d.rounded_rectangle((69,22,285,678),45,fill='#384854');d.rounded_rectangle((81,34,273,666),34,outline='#788995',width=4)
 for x in [90,264]:
  for y in [50,650]:d.ellipse((x-6,y-6,x+6,y+6),fill='#a2adb3');d.line((x-4,y,x+4,y),fill='#273845',width=3)
 for j,y in enumerate([160,348,536]):
  col=['#e85c48','#eabb52','#6bc783'][j]; lit=(state=='wait' and j==0)or(state=='go'and j==2)or(state=='result'and j==1)
  d.ellipse((88,y-86,272,y+98),fill='#102330');d.ellipse((94,y-87,266,y+85),outline='#83919a',width=4)
  for r in range(78,0,-1):
   if lit:
    base=tuple(int(col[k:k+2],16) for k in [1,3,5]);t=(1-r/78)*.25;cc=tuple(min(255,int(v+(255-v)*t))for v in base)
   else:cc=tuple(int(v*.20)for v in tuple(int(col[k:k+2],16)for k in [1,3,5]))
   d.ellipse((180-r,y-r,180+r,y+r),fill=cc)
  for yy in range(y-60,y+61,12):
   half=math.sqrt(max(0,60**2-(yy-y)**2));d.line((180-half,yy,180+half,yy),fill='#ffffff18',width=2)
  d.arc((111,y-69,249,y+69),215,315,fill='#ffffff66'if lit else'#ffffff20',width=6)
 im.save(R/f'signal-{state}.png')
print('Finished card and traffic-light sprites')
