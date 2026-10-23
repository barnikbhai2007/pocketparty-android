"""Build a one-file offline browser edition from the app's actual tested runtime."""
from pathlib import Path
import base64,json,mimetypes,re,argparse
root=Path(__file__).parent
parser=argparse.ArgumentParser();parser.add_argument('--output',default='PocketParty-5.0-Strategy.html');args=parser.parse_args()
a=root/'app/src/main/assets'
assets={}
for p in sorted((a/'assets').rglob('*')):
 if p.is_file():
  mime={'.ogg':'audio/ogg','.wav':'audio/wav','.webp':'image/webp','.png':'image/png'}.get(p.suffix.lower()) or mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
  assets[p.relative_to(a).as_posix()]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
bootstrap='''(function(){
const bank=ASSET_BANK;
const resolve=p=>bank[p]||p;window.PocketAsset=resolve;
for(const [proto,prop] of [[HTMLImageElement.prototype,'src'],[HTMLMediaElement.prototype,'src']]){
 const d=Object.getOwnPropertyDescriptor(proto,prop);Object.defineProperty(proto,prop,{configurable:true,enumerable:d.enumerable,get:d.get,set(v){d.set.call(this,resolve(v));}});
}
for(const prop of ['innerHTML','outerHTML']){const inner=Object.getOwnPropertyDescriptor(Element.prototype,prop);
Object.defineProperty(Element.prototype,prop,{configurable:true,enumerable:inner.enumerable,get:inner.get,set(v){inner.set.call(this,typeof v==='string'?v.replace(/\\bsrc=(["'])(assets\\/[^"']+)\\1/g,(all,q,p)=>'src='+q+resolve(p)+q):v);}});}
const NativeAudio=window.Audio;function OfflineAudio(url){return url==null?new NativeAudio():new NativeAudio(resolve(url));}OfflineAudio.prototype=NativeAudio.prototype;Object.setPrototypeOf(OfflineAudio,NativeAudio);window.Audio=OfflineAudio;
})();'''.replace('ASSET_BANK',json.dumps(assets,separators=(',',':')))
html=(a/'index.html').read_text()
html=re.sub(r'<link[^>]+href="([^\"]+\.css)"[^>]*>',lambda m:'<style>'+ (a/m.group(1)).read_text()+'</style>',html)
html=html.replace('</head>','<script>'+bootstrap+'</script></head>')
html=re.sub(r'<script src="([^\"]+)"></script>',lambda m:'<script>'+ (a/m.group(1)).read_text().replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'src=(["\'])(assets/[^"\']+)\1',lambda m:'src='+m.group(1)+assets.get(m.group(2),m.group(2))+m.group(1),html)
out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html)
print(json.dumps({'output':str(out),'asset_count':len(assets),'bytes':out.stat().st_size}))
