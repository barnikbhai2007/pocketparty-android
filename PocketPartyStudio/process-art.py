from pathlib import Path
from PIL import Image,ImageEnhance,ImageFilter
import numpy as np,cv2,re,shutil,json
p=Path(__file__).parent;out=p/'app/src/main/assets/assets/studio';raw=p/'asset-source/studio'
ids=['skyhook','fossil','elevator','wobble','unravel','kite','gravity','tumble','moss','choir','potion','mole','tailor','sea','golem','suitcase','tongue','room','ghost','spaghetti','planet','candle','octopus','sunshine','gift','tide','orchard','heat','parcel','echo']
bg=['d885c2e9-415a-4a15-a033-1263d2ac6886','e24f97eb-2f4e-45a4-91e0-16b3c2d1aa4b','be14be01-41f6-4ca1-a577-ce58d30b756f','c990aa50-3d09-403d-8dbd-d3e783dc49d3','2114650a-1206-4f1f-af92-73610626a052']
sp=['9eb694a8-f77f-4918-a2af-d3318755bf39','09432ec5-1362-43fe-a35c-b01cbf622088','19f1d20a-b042-4a6d-aada-1b9307a8cf95','a5eb78d8-0a63-4007-ad82-5375f9d9fe9a','ac238014-cd48-4864-b547-c47af4f9064a']
def cell(im,k,ncol=3,nrow=2):
 w,h=im.size;return im.crop((int(k%ncol*w/ncol)+6,int(k//ncol*h/nrow)+6,int((k%ncol+1)*w/ncol)-6,int((k//ncol+1)*h/nrow)-6))
def isolate(im):
 ar=np.array(im.convert('RGB'));mask=(ar.min(2)<=232).astype('uint8')
 n,labels,st,_=cv2.connectedComponentsWithStats(mask,8)
 best=1+np.argmax(st[1:,cv2.CC_STAT_AREA]);alpha=(labels==best).astype('uint8')*255
 contours,_=cv2.findContours(alpha,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);cv2.drawContours(alpha,contours,-1,255,cv2.FILLED)
 im=Image.fromarray(np.dstack([ar,alpha]));im=im.crop(im.getbbox());im=im.resize((round(im.width*450/max(im.size)),round(im.height*450/max(im.size))),Image.Resampling.LANCZOS);result=Image.new('RGBA',(512,512));result.alpha_composite(im,((512-im.width)//2,(512-im.height)//2));return result
for group,uuid in enumerate(bg):
 im=Image.open(raw/f'boards-{group+1}.jpg')
 for j in range(6):cell(im,j).resize((600,600),Image.Resampling.LANCZOS).save(out/'boards'/f'{ids[group*6+j]}.webp',quality=92)
for group,uuid in enumerate(sp):
 im=Image.open(raw/f'sprites-{group+1}.jpg')
 for j in range(6):
  k=[0,1,2,4,5,7][j] if group==3 else j
  isolate(cell(im,k,4 if group==3 else 3)).save(out/'sprites'/f'{ids[group*6+j]}.png')
for uuid,names in [('7831af05-ce45-413e-947f-750382dc30e7',['bug','wasp','cloud','ribbon','coin','plate']),('751dd7ad-bdff-4c07-b4e1-5c416c140b68',['marble','leaf','ramp','herb','fire','water'])]:
 im=Image.open(raw/(names[0]+'-props.jpg'))
 for j,name in enumerate(names):isolate(cell(im,j)).save(out/'sprites'/f'{name}.png')
isolate(Image.open(raw/'sun.jpg')).save(out/'sprites/sun.png')
for id in ids:
 bgim=Image.open(out/'boards'/f'{id}.webp').convert('RGBA').resize((600,400));sprite=Image.open(out/'sprites'/f'{id}.png');sprite.thumbnail((320,320));shadow=Image.new('RGBA',bgim.size);shadow.paste(sprite.getchannel('A'),(0,0)) if False else None
 bgim.alpha_composite(sprite,((600-sprite.width)//2,(400-sprite.height)//2));bgim.convert('RGB').save(out/'cards'/f'{id}.webp',quality=92)
json.dump({'backgrounds':30,'mainSprites':30,'propSprites':13,'style':'Original AI-generated hand-painted tabletop materials and sprites','sourceAtlases':12,'singleSprites':1},open(raw/'MANIFEST.json','w'),indent=2)
print('Created 30 textured boards, 43 transparent sprites and 30 illustrated cards.')
