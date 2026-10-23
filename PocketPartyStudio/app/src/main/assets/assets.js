/* Original artwork, sprite and audio loader. No remote URLs at runtime. */
(function(){
 const images={},names=['rally','sumo','hockey','draw','color','target','rhythm','memory','connect','boxes'];
 function load(key,url){const im=new Image();im.src=url;images[key]=im;}
 names.forEach(n=>load('art-'+n,'assets/art/'+n+'.webp'));
 ['asphalt','tatami','ice','paper'].forEach(n=>load(n,'assets/textures/'+n+'.webp'));
 for(let i=0;i<4;i++)for(let kind of ['car','striker','counter'])load(kind+'-'+i,'assets/sprites/'+kind+'-'+i+'.png');load('puck','assets/sprites/puck.png');for(let i=0;i<4;i++)load('card-back-'+i,'assets/sprites/card-back-'+i+'.png');['wait','go','result'].forEach(s=>load('signal-'+s,'assets/sprites/signal-'+s+'.png'));
 let music=new Audio(),current='';music.loop=true;music.volume=.16;music.preload='none';
 function enabled(){return window.Party&&Party.prefs.music!==false;}
 const audio={play(id){id=['menu','rally','sumo','hockey','draw','color','target','rhythm','memory','connect','boxes'].includes(id)?id:'menu';if(!enabled())return;if(current!==id){music.pause();music.src='assets/music/'+id+'.ogg';current=id;music.load();}const p=music.play();if(p&&p.catch)p.catch(()=>{});},pause(){music.pause();},resume(){if(enabled()&&current){const p=music.play();if(p&&p.catch)p.catch(()=>{});}},stop(){music.pause();current='';music.removeAttribute('src');},setEnabled(on){if(!on)music.pause();else this.play(window.Party&&Party.state?Party.state.g.id:'menu');}};
 window.GameAssets={images,music:audio,ready(key){return images[key]&&images[key].complete&&images[key].naturalWidth>0;},draw(c,key,x,y,w,h){if(this.ready(key)){c.drawImage(images[key],x,y,w,h);return true;}return false;}};
})();
