from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'app/src/main/assets/assets/sprites';OUT.mkdir(parents=True,exist_ok=True)
COL=['#315be8','#e85c48','#29936d','#9868cc']; names=['blue','coral','mint','violet']
for i,col in enumerate(COL):
 # Every sprite is drawn at 3x and downsampled, with true transparency.
 im=Image.new('RGBA',(480,840));d=ImageDraw.Draw(im)
 for x in [45,345]:
  for y in [180,535]:
   d.rounded_rectangle((x,y,x+90,y+150),25,fill='#18232e');
   for k in range(4):d.line((x+12,y+22+k*29,x+78,y+22+k*29),fill='#36404b',width=6)
 d.rounded_rectangle((110,90,370,760),90,fill='#172835');d.rounded_rectangle((125,90,355,745),82,fill=col)
 d.polygon([(142,170),(338,170),(318,120),(162,120)],fill='#ffffff5f')
 d.rounded_rectangle((150,240,330,505),48,fill='#172e46');d.rounded_rectangle((160,252,320,385),34,fill='#87cae0');d.polygon([(175,267),(291,267),(200,363),(172,363)],fill='#cce9f4');
 d.rounded_rectangle((161,409,319,486),25,fill='#49748d');d.line((167,392,313,392),fill='#e0f4f8',width=7)
 d.rounded_rectangle((147,575,333,690),28,fill='#ffffff32');d.line((174,582,174,676),fill='#ffffff76',width=9);d.line((306,582,306,676),fill='#ffffff76',width=9)
 d.rounded_rectangle((139,141,181,173),10,fill='#fcf4b0');d.rounded_rectangle((299,141,341,173),10,fill='#fcf4b0');d.rounded_rectangle((145,698,184,723),8,fill='#ffbc9a');d.rounded_rectangle((296,698,335,723),8,fill='#ffbc9a')
 im.resize((160,280),Image.Resampling.LANCZOS).save(OUT/f'car-{i}.png')
 # Detailed strikers and sumo discs share their visual player identity.
 im=Image.new('RGBA',(768,768));d=ImageDraw.Draw(im)
 for r,fill in [(353,'#192c3860'),(337,'#1e2d3c'),(322,col),(280,'#ffffff30'),(263,col),(215,'#172c4450'),(195,col),(135,'#ffffff26')]:
  d.ellipse((384-r,384-r+(12 if r==353 else 0),384+r,384+r+(12 if r==353 else 0)),fill=fill)
 d.arc((69,69,699,699),205,310,fill='#ffffff9c',width=14);d.arc((140,140,628,628),20,120,fill='#172c4466',width=12);d.ellipse((252,233,367,322),fill='#ffffff3a')
 im.resize((256,256),Image.Resampling.LANCZOS).save(OUT/f'striker-{i}.png')
 # Glass counters for the shared board.
 im=Image.new('RGBA',(384,384));d=ImageDraw.Draw(im);d.ellipse((12,20,372,380),fill='#11233550');d.ellipse((12,8,372,368),fill=col);d.ellipse((36,32,348,344),outline='#ffffff50',width=10);d.arc((32,28,352,348),210,300,fill='#ffffffa0',width=9);im.resize((128,128),Image.Resampling.LANCZOS).save(OUT/f'counter-{i}.png')
# Shared puck.
im=Image.new('RGBA',(256,256));d=ImageDraw.Draw(im);d.ellipse((12,23,244,255),fill='#18243040');d.ellipse((12,7,244,239),fill='#152331');d.ellipse((29,20,227,218),fill='#344350');d.ellipse((46,37,210,201),outline='#6c7e8c',width=6);d.arc((27,18,229,220),210,300,fill='#a0b8c4',width=7);im.save(OUT/'puck.png')
# Editable SVG logo master.
(ROOT/'asset-source/art/logo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="44" fill="#315be8"/><path d="M44 43h22v8c25-23 59-4 55 28-2 34-34 47-55 28v29H44zm22 37c0 25 32 25 32 0s-32-25-32 0" fill="white" fill-rule="evenodd"/><circle cx="123" cy="35" r="10" fill="#f4d564"/></svg>')
print('Sprites:',len(list(OUT.glob('*.png'))))
