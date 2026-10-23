'use strict';
(function(){
const $=id=>document.getElementById(id),COL=['#315be8','#d84d37','#24815f','#9063c7'],TINT=['#e4eafa','#f7e3db','#e0eee3','#ece4f6'],INK='#202c36';
const games=[
['rally','Pocket Rally','DODGE · RACE','Tap your part of the track to switch lanes. Your car drives itself. Dodge yellow roadblocks: +1 per clean pass, −2 for a crash.','Most points after 30 seconds wins.',30,'SWITCH','#e2ebe2'],
['sumo','Orbit Sumo','PUSH · SURVIVE','Your disc rotates when released. Hold your circular thumb zone to thrust in the arrow direction. Push rivals out of the ring. You respawn after falling out.','Most knockouts after 40 seconds wins.',40,'THRUST','#e7e7f5'],
['hockey','Pocket Hockey','DRAG · DEFEND','Drag your striker directly along your coloured edge. Defend your goal. A goal against you costs 1 point. Unused sides are walls.','Fewest goals conceded after 45 seconds wins.',45,'DRAG','#dcecee'],
['draw','Quick Draw','WAIT · REACT','Wait for green, then tap your colour. First tap wins the point. An early tap costs a point and locks you out of that round.','Most points after 7 rounds wins.',0,'TAP!','#f8e8d9'],
['color','Colour Catch','WATCH · MATCH','Tap your colour only when the centre card matches it. Correct: +1. Wrong: −1. Only one tap per card.','Most points after 30 seconds wins.',30,'CATCH','#f5e9ca'],
['target','Bullseye Club','AIM · TAP','A sight sweeps across your lane. Tap when it lines up with the target. Bullseye: +3. Outer ring: +1. A short cooldown follows each shot.','Most points after 30 seconds wins.',30,'SHOOT','#f4e0da'],
['rhythm','Beat Street','LISTEN · TIME','Tap when the shrinking coloured ring meets the dark circle. Perfect: +3. Close: +1. One tap per beat.','Most points after 30 seconds wins.',30,'BEAT','#e7e3f2'],
['memory','Match Mates','FLIP · REMEMBER','Take turns flipping two cards. Match the symbols to score and play again. If they differ, remember them for later.','Most pairs after all 8 pairs are found wins.',0,'YOUR TURN','#e4eddf'],
['connect','Three’s a Line','DROP · CONNECT','Take turns tapping a column to drop a counter. Make a line of three horizontally, vertically, or diagonally. Block your rivals.','First to connect three wins. A full board is a draw.',0,'YOUR TURN','#e2e9f6'],
['boxes','Box Buddies','LINK · CLAIM','Tap between neighbouring dots to draw a line. Complete the fourth side of a box to claim it and take another turn.','Most boxes after all 16 are claimed wins.',0,'YOUR TURN','#f3ebd5']
].map(a=>({id:a[0],name:a[1],tag:a[2],rule:a[3],goal:a[4],time:a[5],action:a[6],bg:a[7],turn:['memory','connect','boxes'].includes(a[0])}));
let prefs={humans:2,sound:true,music:true,haptics:true,difficulty:'normal',wins:[0,0,0,0]};try{Object.assign(prefs,JSON.parse(localStorage.getItem('pocket-party-v1')||'{}'));}catch(e){}if(![1,2,3,4].includes(prefs.humans))prefs.humans=1;if(!Array.isArray(prefs.wins)||prefs.wins.length!==4)prefs.wins=[0,0,0,0];
function save(){try{localStorage.setItem('pocket-party-v1',JSON.stringify(prefs));}catch(e){}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),level=()=>({easy:.65,normal:1,hard:1.5}[prefs.difficulty]||1)*(S?.botForm||1);
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
let audio;function tone(f=500,t=.06){if(!prefs.sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+t);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+t);}catch(e){}}
function vibration(){if(!prefs.haptics)return;try{if(window.Android)window.Android.vibrate();else if(navigator.vibrate)navigator.vibrate(18);}catch(e){}}
let S=null,W=600,H=700,last=0,hudTime=0;const canvas=$('board'),c=canvas.getContext('2d'),engines={};
const pname=i=>i>=prefs.humans?'BOT '+(i+1):'P'+(i+1);
function rr(g,x,y,w,h,r,fill,stroke){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
function circ(g,x,y,r,fill,stroke,width=2){g.beginPath();g.arc(x,y,Math.max(.1,r),0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function line(g,x,y,xx,yy,col,width=3){g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.strokeStyle=col;g.lineWidth=width;g.lineCap='round';g.stroke();}
function txt(g,t,x,y,size=16,col=INK,align='center'){g.font='700 '+size+'px Arial';g.textBaseline='middle';g.textAlign=align;g.fillStyle=col;g.fillText(String(t),x,y);}
function disc(g,x,y,r,col,label){let pi=COL.indexOf(col),key=pi>=0?'striker-'+pi:'puck';if(window.GameAssets&&GameAssets.ready(key)){GameAssets.draw(g,key,x-r,y-r,r*2,r*2);if(label)txt(g,label,x,y,r*.65,'white');return;}circ(g,x,y+4,r,'#202c3618');circ(g,x,y,r,col);circ(g,x-r*.25,y-r*.25,r*.23,'#ffffff38');if(label)txt(g,label,x,y,r*.65,'white');}
function symbol(g,n,x,y,r,col){g.save();g.translate(x,y);g.fillStyle=col;if(n===0)circ(g,0,0,r,col);else if(n===1){g.beginPath();g.moveTo(0,-r);g.lineTo(r,r);g.lineTo(-r,r);g.closePath();g.fill();}else if(n===2)rr(g,-r,-r,r*2,r*2,3,col);else if(n===3){g.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4-Math.PI/2,s=i%2?r*.3:r;g.lineTo(Math.cos(a)*s,Math.sin(a)*s);}g.closePath();g.fill();}else if(n===4){g.beginPath();g.moveTo(0,r);g.bezierCurveTo(-r*2,0,-r*.8,-r*1.8,0,-r*.5);g.bezierCurveTo(r*.8,-r*1.8,r*2,0,0,r);g.fill();}else if(n===5){rr(g,-r*.3,-r,r*.6,r*2,1,col);rr(g,-r,-r*.3,r*2,r*.6,1,col);}else if(n===6){g.beginPath();g.moveTo(0,-r*1.2);g.lineTo(r,0);g.lineTo(0,r*1.2);g.lineTo(-r,0);g.closePath();g.fill();}else{circ(g,0,0,r*.5,col);for(let i=0;i<8;i++){let a=i*Math.PI/4;line(g,Math.cos(a)*r*.8,Math.sin(a)*r*.8,Math.cos(a)*r*1.1,Math.sin(a)*r*1.1,col,2);}}g.restore();}
function car(g,x,y,col,scale=1){let pi=COL.indexOf(col);if(window.GameAssets&&GameAssets.ready('car-'+pi)){g.save();g.translate(x,y);g.scale(scale,scale);GameAssets.draw(g,'car-'+pi,-24,-42,48,84);g.restore();return;}g.save();g.translate(x,y);g.scale(scale,scale);rr(g,-19,-20,8,15,3,INK);rr(g,11,-20,8,15,3,INK);rr(g,-19,9,8,15,3,INK);rr(g,11,9,8,15,3,INK);rr(g,-15,-29,30,58,9,col);rr(g,-10,-14,20,14,4,'#eff5f1');rr(g,-10,11,20,8,3,'#ffffff70');g.restore();}
function art(g,id,w,h){const game=games.find(v=>v.id===id);g.fillStyle=game.bg;g.fillRect(0,0,w,h);g.save();g.translate(w/2,h/2);let scale=Math.min(w/180,h/120);g.scale(scale,scale);
if(id==='rally'){rr(g,-58,-80,116,160,0,'#bcc8bd');for(let y=-80;y<100;y+=27)line(g,0,y,0,y+12,'#f7f5ef',3);car(g,-25,14,COL[0],.7);car(g,26,-15,COL[1],.7);rr(g,14,38,24,12,3,'#f4d564');}
if(id==='sumo'){circ(g,0,0,49,'#f7f5ef','#bac1d7');circ(g,0,0,38,null,'#d7dbea');disc(g,-18,7,17,COL[0]);disc(g,17,-8,17,COL[1]);line(g,-40,25,-31,20,COL[0],4);line(g,39,-25,30,-20,COL[1],4);}
if(id==='hockey'){rr(g,-61,-44,122,88,15,'#f7f5ef','#a3c2c5');circ(g,0,0,23,null,'#bbd4d5');line(g,0,-42,0,42,'#bbd4d5',2);disc(g,-35,13,15,COL[0]);disc(g,35,-13,15,COL[1]);disc(g,9,13,8,INK);}
if(id==='draw'){rr(g,-28,-48,56,96,26,INK);circ(g,0,-23,15,'#65716d');circ(g,0,22,16,'#71bb79');line(g,39,-13,51,-20,'#24815f',4);line(g,40,11,55,11,'#24815f',4);}
if(id==='color'){g.rotate(-.13);rr(g,-42,-34,56,65,12,COL[0]);g.rotate(.3);rr(g,-9,-27,56,65,12,COL[1]);line(g,5,5,14,14,'white',4);line(g,14,14,31,-6,'white',4);}
if(id==='target'){for(let r=44;r>0;r-=11)circ(g,0,0,r,((r/11)%2===0)?'#f7f5ef':COL[1]);line(g,-62,13,22,-6,INK,3);line(g,-58,12,-50,2,INK,3);}
if(id==='rhythm'){circ(g,0,0,42,null,'#b5a6ce');circ(g,0,0,29,null,COL[3],6);txt(g,'♪',0,1,37,COL[3]);circ(g,-49,-30,6,'#e7bd4b');}
if(id==='memory'){for(let i=0;i<4;i++){let x=i%2*48-43,y=Math.floor(i/2)*48-44;rr(g,x,y,40,40,8,i===1?COL[2]:'#f7f5ef');if(i===1)txt(g,'?',x+20,y+21,25,'white');else symbol(g,i===2?3:0,x+20,y+20,9,COL[i]);}}
if(id==='connect'){rr(g,-58,-43,116,86,12,COL[0]);for(let r=0;r<3;r++)for(let x=0;x<4;x++)circ(g,-40+x*27,-25+r*25,9,r===2&&x<3?'#f4d564':r===1&&x===2?'#f38b72':'#bfcdf7');}
if(id==='boxes'){rr(g,-34,-34,34,34,0,'#315be82a');rr(g,0,0,34,34,0,'#d84d372a');line(g,-34,-34,0,-34,COL[0],5);line(g,-34,0,0,0,COL[0],5);line(g,-34,-34,-34,0,COL[0],5);line(g,0,-34,0,0,COL[0],5);line(g,0,34,34,34,COL[1],5);line(g,34,0,34,34,COL[1],5);for(let r=0;r<3;r++)for(let x=0;x<3;x++)circ(g,-34+x*34,-34+r*34,4,INK);}
g.restore();}
function homeUI(){document.querySelectorAll('[data-n]').forEach(b=>b.classList.toggle('selected',+b.dataset.n===prefs.humans));$('hint').textContent=prefs.humans===1?'You + a friendly bot':prefs.humans+' friends. One screen.';}
$('grid').innerHTML=games.map((g,i)=>'<button class="card" data-game="'+g.id+'"><span class="card-num">'+String(i+1).padStart(2,'0')+'</span><img src="assets/art/'+g.id+'.webp" alt="" loading="lazy"><div><strong>'+g.name+'</strong><small>'+g.tag+'</small></div></button>').join('');
document.querySelectorAll('.card').forEach(b=>{b.onclick=()=>rules(b.dataset.game);});document.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{prefs.humans=+b.dataset.n;save();homeUI();tone();});homeUI();
function modal(html){$('modal-body').innerHTML=html;$('modal').classList.remove('hidden');}function close(){$('modal').classList.add('hidden');}
function rules(id){let g=games.find(v=>v.id===id);modal('<canvas class="modal-art" id="rule-art" width="640" height="240"></canvas><div class="modal-tag">'+g.tag+' · '+prefs.humans+' PLAYER'+(prefs.humans===1?' + BOT':'S')+'</div><h2 id="modal-title">'+g.name+'</h2><p>'+g.rule+'</p><p class="note">'+g.goal+'</p><button class="primary" id="start">Let’s play →</button><button class="secondary" id="cancel">Back to games</button>');art($('rule-art').getContext('2d'),id,640,240);$('start').onclick=()=>{close();start(id);};$('cancel').onclick=close;}
$('random').onclick=()=>rules(games[Math.floor(Math.random()*10)].id);
function settings(){modal('<div class="modal-tag">MAKE YOURSELF AT HOME</div><h2 id="modal-title">Party settings</h2><div class="row">Sound effects<button class="toggle" id="sound">'+(prefs.sound?'On':'Off')+'</button></div><div class="row">Background music<button class="toggle" id="music">'+(prefs.music!==false?'On':'Off')+'</button></div><div class="row">Touch feedback<button class="toggle" id="haptics">'+(prefs.haptics?'On':'Off')+'</button></div><div class="row">Solo bot<div class="levels">'+['easy','normal','hard'].map(v=>'<button data-level="'+v+'" class="'+(prefs.difficulty===v?'selected':'')+'">'+v+'</button>').join('')+'</div></div><button class="primary" id="done">All set</button><p style="text-align:center;font-size:11px">Pocket Party 5.0 Strategy · Offline · No tracking</p>');$('sound').onclick=()=>{prefs.sound=!prefs.sound;save();settings();};$('music').onclick=()=>{prefs.music=prefs.music===false;save();if(window.GameAssets)GameAssets.music.setEnabled(prefs.music);settings();};$('haptics').onclick=()=>{prefs.haptics=!prefs.haptics;save();settings();vibration();};document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{prefs.difficulty=b.dataset.level;save();settings();});$('done').onclick=close;}
$('settings').onclick=settings;
$('wins').onclick=()=>{modal('<div class="modal-tag">THE BRAGGING BOARD</div><h2 id="modal-title">Party scores</h2><p>Match wins on this device. Ties between all players award no wins.</p>'+prefs.wins.map((v,i)=>'<div class="row"><span style="color:'+COL[i]+'">Player '+(i+1)+'</span><b>'+v+'</b></div>').join('')+'<button class="primary" id="done">Keep playing</button><button class="secondary" id="reset">Reset scores</button>');$('done').onclick=close;$('reset').onclick=()=>{modal('<h2 id="modal-title">Reset all scores?</h2><p>This clears saved match wins on this device.</p><button class="primary" id="confirm">Reset scores</button><button class="secondary" id="cancel">Keep scores</button>');$('confirm').onclick=()=>{prefs.wins=[0,0,0,0];save();close();};$('cancel').onclick=close;};};
function active(){return S&&!S.paused&&!S.ended;}
function fit(){let r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;let d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);W=600;H=600*r.height/r.width;c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);}
window.addEventListener('resize',fit);
function start(id){let g=games.find(v=>v.id===id);$('play').dataset.game=id;$('play').dataset.prototype=String(!!g.prototype);S={g,n:seatCount(g),scores:Array(seatCount(g)).fill(0),held:Array(4).fill(false),elapsed:0,paused:false,ended:false,message:g.turn?'P1 · your turn':g.action+' · '+(g.id==='sumo'?'Hold to move':g.id==='hockey'?'Drag on your pad':'Tap your colour'),d:{}};$('home').classList.add('hidden');$('play').classList.remove('hidden');$('title').textContent=g.name;$('tag').textContent=g.tag;$('top').innerHTML='';$('bottom').innerHTML='';for(let i=0;i<S.n;i++){let b=document.createElement('button');b.className='pad'+(i>=prefs.humans?' bot':'')+(g.turn?' turn':'');b.dataset.p=i;b.style.setProperty('--c',COL[i]);b.innerHTML=pname(i)+' · '+g.action+'<small>'+(i>=prefs.humans?'Computer':g.turn?'Tap the board':g.id==='hockey'?'Slide finger here':g.id==='sumo'?'Hold & release':'Tap here')+'</small>';b.onpointerdown=e=>{e.preventDefault();if(!active()||i>=prefs.humans||g.turn)return;b.setPointerCapture(e.pointerId);S.held[i]=true;b.classList.add('pressed');if(g.id==='hockey')drag(i,e,b);else if(engines[g.id].tap)engines[g.id].tap(i);};b.onpointermove=e=>{if(active()&&S.held[i]&&g.id==='hockey')drag(i,e,b);};const release=()=>{if(S)S.held[i]=false;b.classList.remove('pressed');};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;$(i<2?'bottom':'top').appendChild(b);}$('play').dataset.count=S.n;fit();S.mapIndex=pickMap(id);S.mapName=g.maps[S.mapIndex];engines[id].init();applyMap();S.botForm=prefs.consistency==='variable'?chosen([.65,.85,1,1.15,1.35]):1;if(g.prototype)S.message=g.tag.toLowerCase()+' · Touch your coloured side. Pause for full rules.';$('tag').textContent=g.tag+' · '+S.mapName;hud();render();tone(650);if(window.GameAssets)GameAssets.music.play(id);}
function drag(i,e,b){let r=b.getBoundingClientRect();S.d.paddles[i]=clamp((e.clientX-r.left)/r.width,.13,.87);}
canvas.onpointerdown=e=>{if(!active()||!S.g.turn||S.d.turn>=prefs.humans)return;e.preventDefault();let r=canvas.getBoundingClientRect();engines[S.g.id].board((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);};
function hud(){if(!S)return;$('scores').innerHTML=S.scores.map((v,i)=>'<div class="score"><small><span class="dot" style="background:'+COL[i]+'"></span>'+pname(i)+'</small><b style="color:'+COL[i]+'">'+v+'</b></div>').join('');$('clock').textContent=S.g.time?Math.max(0,Math.ceil(S.g.time-S.elapsed))+'s':'';$('message').textContent=S.message;document.querySelectorAll('.pad.turn').forEach(b=>b.classList.toggle('active',+b.dataset.p===S.d.turn));}
function score(i,v){S.scores[i]+=v;if(window.Deluxe)Deluxe.burst(i,v>0);tone(v>0?600+i*80:170);if(i<prefs.humans)vibration();hud();}
function next(){S.d.turn=(S.d.turn+1)%S.n;S.d.wait=0;S.message=pname(S.d.turn)+' · your turn';hud();}
function goHome(){S=null;if(window.GameAssets)GameAssets.music.play('menu');close();$('play').classList.add('hidden');$('home').classList.remove('hidden');homeUI();}
function pause(){if(!active())return;S.paused=true;if(window.GameAssets)GameAssets.music.pause();S.held.fill(false);document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));modal('<div class="modal-tag">TAKE A BREATHER</div><h2 id="modal-title">Party paused.</h2><p>'+S.g.rule+'</p><button class="primary" id="resume">Resume</button><button class="secondary" id="restart">Restart round</button><button class="secondary" id="leave">Back to games</button>');$('resume').onclick=()=>{close();S.paused=false;if(window.GameAssets)GameAssets.music.resume();};$('restart').onclick=()=>{let id=S.g.id;close();start(id);};$('leave').onclick=goHome;}
$('back').onclick=pause;$('pause').onclick=pause;window.partyPause=pause;window.partyBack=()=>{if(S){if(S.ended)goHome();else if(S.paused){close();S.paused=false;if(window.GameAssets)GameAssets.music.resume();}else pause();return true;}if(!$('modal').classList.contains('hidden')){close();return true;}return false;};document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function finish(winners){if(!S||S.ended)return;if(cup){cupFinish(winners);return;}if(S.g.prototype&&S.n===1){let key='record-'+S.g.id;let prev=+localStorage.getItem(key)||0;if(S.scores[0]>prev)localStorage.setItem(key,S.scores[0]);S.message='Score '+S.scores[0]+' · Record '+Math.max(prev,S.scores[0]);}S.ended=true;if(window.GameAssets)GameAssets.music.pause();S.held.fill(false);let best=Math.max(...S.scores);winners=winners||S.scores.map((v,i)=>v===best?i:-1).filter(i=>i>=0);if(winners.length<S.n)winners.forEach(i=>prefs.wins[i]++);save();let heading=S.g.prototype&&S.n===1?(S.g.strategic?'Solo run complete!':(S.scores[0]>=(S.g.target||12)?'Challenge cleared!':'Keep practising!')):winners.length===S.n?'Honours even.':winners.length>1?'A shared victory!':pname(winners[0])+' takes it!';modal('<div class="large-star">★</div><div class="modal-tag">THAT’S A WRAP</div><h2 id="modal-title">'+heading+'</h2><p>'+S.g.name+(S.g.id==='hockey'?' · Score = negative goals conceded':' · Final scores')+'</p>'+S.scores.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).map(r=>'<div class="row"><span style="color:'+COL[r.i]+'">'+pname(r.i)+'</span><b>'+r.v+'</b></div>').join('')+'<button class="primary" id="again">Rematch</button><button class="secondary" id="another">Random game</button><button class="secondary" id="all">All games</button>');$('again').onclick=()=>{let id=S.g.id;close();start(id);};$('another').onclick=()=>{let choices=games.filter(g=>g.id!==S.g.id);close();start(choices[Math.floor(Math.random()*choices.length)].id);};$('all').onclick=goHome;tone(850,.2);}
function lanes(i){let gap=10,h=(H-60-gap*(S.n-1))/S.n;return{y:30+i*(h+gap),h};}
engines.rally={init(){S.d={lane:Array(S.n).fill(0),obs:Array.from({length:S.n},()=>[]),spawn:Array(S.n).fill(.7),crash:Array(S.n).fill(0)};},tap(i){S.d.lane[i]=1-S.d.lane[i];tone(300,.02);},update(dt){let d=S.d;for(let i=0;i<S.n;i++){d.spawn[i]-=dt;d.crash[i]=Math.max(0,d.crash[i]-dt);if(d.spawn[i]<=0){d.obs[i].push({x:W-40,l:Math.random()<.5?0:1,done:false});d.spawn[i]=rand(1.1,1.6);}for(let o of d.obs[i]){o.x-=(170+S.elapsed)*dt;if(i>=prefs.humans&&o.x>125&&o.x<125+70*level()&&d.lane[i]===o.l)d.lane[i]=1-o.l;if(!o.done&&Math.abs(o.x-100)<26){o.done=true;if(o.l===d.lane[i]){score(i,-2);d.crash[i]=.4;}else score(i,1);}}d.obs[i]=d.obs[i].filter(o=>o.x>0);}},draw(){for(let i=0;i<S.n;i++){let l=lanes(i),d=S.d;rr(c,30,l.y,W-60,l.h,14,'#d4ddd1');for(let x=40-(S.elapsed*110)%45;x<W-30;x+=45)line(c,x,l.y+l.h/2,x+20,l.y+l.h/2,'#f7f5ef',3);for(let o of d.obs[i]){let y=l.y+l.h*(o.l?.73:.27);rr(c,o.x-13,y-12,26,24,4,'#e7b74a');line(c,o.x-7,y-7,o.x+6,y+7,'#80642a',3);}c.save();c.translate(100,l.y+l.h*(d.lane[i]?.73:.27));c.rotate(Math.PI/2);if(d.crash[i])c.globalAlpha=.4;car(c,0,0,COL[i],Math.min(1,l.h/100));c.restore();txt(c,pname(i),W-48,l.y+14,11,COL[i],'right');}}};
engines.sumo={init(){S.d={p:Array.from({length:S.n},(_,i)=>({x:.5+Math.cos(i*2*Math.PI/S.n)*.2,y:.5+Math.sin(i*2*Math.PI/S.n)*.2,vx:0,vy:0,a:i*2*Math.PI/S.n+Math.PI,last:-1,at:-9}))};},update(dt){let p=S.d.p;for(let i=0;i<S.n;i++){let a=p[i];if(i>=prefs.humans){let rivals=p.filter((_,j)=>j!==i),t=rivals.reduce((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)<Math.hypot(y.x-a.x,y.y-a.y)?x:y),angle=Math.atan2(t.y-a.y,t.x-a.x),diff=Math.atan2(Math.sin(angle-a.a),Math.cos(angle-a.a));S.held[i]=Math.abs(diff)<.4;if(!S.held[i])a.a+=Math.sign(diff)*dt*2.4*level();}else if(!S.held[i])a.a+=dt*2.7;if(S.held[i]){a.vx+=Math.cos(a.a)*dt*.65;a.vy+=Math.sin(a.a)*dt*.65;}a.vx*=Math.pow(.3,dt);a.vy*=Math.pow(.3,dt);let speed=Math.hypot(a.vx,a.vy);if(speed>.58){a.vx*=.58/speed;a.vy*=.58/speed;}a.x+=a.vx*dt;a.y+=a.vy*dt;}
for(let i=0;i<S.n;i++)for(let j=i+1;j<S.n;j++){let a=p[i],b=p[j],dx=b.x-a.x,dy=b.y-a.y,dd=Math.hypot(dx,dy)||.001;if(dd<.115){let nx=dx/dd,ny=dy/dd,over=.115-dd;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;let v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){let imp=-v*.95+.035;a.vx-=nx*imp;a.vy-=ny*imp;b.vx+=nx*imp;b.vy+=ny*imp;a.last=j;b.last=i;a.at=b.at=S.elapsed;}}}
for(let i=0;i<S.n;i++){let a=p[i];if(Math.hypot(a.x-.5,a.y-.5)>.42){if(a.last>=0&&S.elapsed-a.at<4)score(a.last,1);a.x=.5+Math.cos(i*2*Math.PI/S.n)*.17;a.y=.5+Math.sin(i*2*Math.PI/S.n)*.17;a.vx=a.vy=0;a.a=Math.atan2(.5-a.y,.5-a.x);a.last=-1;}}},draw(){let r=Math.min(W*.43,H*.41);circ(c,W/2,H/2,r+8,'#c8cfce');circ(c,W/2,H/2,r,'#f7f5ef','#bec8c5');circ(c,W/2,H/2,r*.65,null,'#e0e4db');circ(c,W/2,H/2,5,'#d5dcd2');S.d.p.forEach((p,i)=>{let x=W/2+(p.x-.5)*r/.42,y=H/2+(p.y-.5)*r/.42,sz=r*.115/.84;disc(c,x,y,sz,COL[i],i+1);line(c,x+Math.cos(p.a)*sz*1.25,y+Math.sin(p.a)*sz*1.25,x+Math.cos(p.a)*sz*1.8,y+Math.sin(p.a)*sz*1.8,COL[i],5);if(S.held[i])line(c,x-Math.cos(p.a)*sz*1.3,y-Math.sin(p.a)*sz*1.3,x-Math.cos(p.a)*sz*1.8,y-Math.sin(p.a)*sz*1.8,'#e9b74e',5);});}};
engines.hockey={init(){S.d={paddles:Array(S.n).fill(.5),ball:{x:.5,y:.5,vx:.25,vy:.52},serve:.6};},update(dt){let d=S.d,b=d.ball;for(let i=prefs.humans;i<S.n;i++){let target=i<2?b.x:b.y;d.paddles[i]+=(clamp(target,.13,.87)-d.paddles[i])*Math.min(1,dt*5*level());}if(d.serve>0){d.serve-=dt;return;}b.x+=b.vx*dt;b.y+=b.vy*dt;let side=b.y>.97?0:b.y<.03?1:b.x<.03?2:b.x>.97?3:-1;if(side<0)return;let coord=side<2?b.x:b.y;if(side>=S.n){if(side<2)b.vy*=-1;else b.vx*=-1;}else if(Math.abs(coord-d.paddles[side])<.145){let off=(coord-d.paddles[side])/.145;if(side<2){b.vy=(side===0?-1:1)*.56;b.vx=off*.55;}else{b.vx=(side===2?1:-1)*.56;b.vy=off*.55;}tone(430,.03);}else{score(side,-1);b.x=b.y=.5;let a=rand(0,Math.PI*2);b.vx=Math.cos(a)*.63;b.vy=Math.sin(a)*.63;d.serve=.8;S.message=pname(side)+' conceded';hud();}b.x=clamp(b.x,.031,.969);b.y=clamp(b.y,.031,.969);},draw(){let sz=Math.min(W-70,H-90),x=(W-sz)/2,y=(H-sz)/2,d=S.d;rr(c,x,y,sz,sz,22,'#f8faf5','#b8cfcd');line(c,x,y+sz/2,x+sz,y+sz/2,'#d4e2dc',2);circ(c,W/2,H/2,sz*.16,null,'#d4e2dc');for(let i=0;i<S.n;i++){let p=d.paddles[i];if(i<2){line(c,x+15,y+(i===0?sz:0),x+sz-15,y+(i===0?sz:0),COL[i]+'40',7);rr(c,x+p*sz-sz*.13,y+(i===0?sz-14:4),sz*.26,10,5,COL[i]);}else{line(c,x+(i===2?0:sz),y+15,x+(i===2?0:sz),y+sz-15,COL[i]+'40',7);rr(c,x+(i===2?4:sz-14),y+p*sz-sz*.13,10,sz*.26,5,COL[i]);}}disc(c,x+d.ball.x*sz,y+d.ball.y*sz,10,INK);if(d.serve>0)txt(c,'SERVE',W/2,H/2+38,13,'#66727b');}};
function drawRound(){let d=S.d;d.round++;if(d.round>7){finish();return;}d.stage='wait';d.at=S.elapsed+rand(1.6,4.2);d.disabled=Array(S.n).fill(false);d.end=0;S.message='Round '+d.round+' / 7 · wait for green';hud();}
engines.draw={init(){S.d={round:0,stage:'wait',at:0,disabled:[],winner:-1};drawRound();},tap(i){let d=S.d;if(d.disabled[i]||d.stage==='result')return;if(d.stage==='wait'){d.disabled[i]=true;score(i,-1);S.message=pname(i)+' jumped early';}else{d.stage='result';d.winner=i;score(i,1);d.end=S.elapsed+1.5;S.message=pname(i)+' · '+Math.round((S.elapsed-d.at)*1000)+' ms';}hud();},update(){let d=S.d;if(d.stage==='wait'&&S.elapsed>=d.at){d.stage='go';S.message='GO! GO! GO!';tone(950,.13);hud();}if(d.stage==='go'){for(let i=prefs.humans;i<S.n;i++)if(S.elapsed>d.at+.25/level()+i*.03&&!d.disabled[i]){engines.draw.tap(i);break;}if(d.stage==='go'&&S.elapsed-d.at>3){d.stage='result';d.winner=-1;d.end=S.elapsed+1;}}if(d.stage==='result'&&S.elapsed>=d.end)drawRound();},draw(){let d=S.d,r=Math.min(95,H*.16);rr(c,W/2-r*.65,H/2-r*1.45,r*1.3,r*2.9,r*.65,INK);circ(c,W/2,H/2-r*.66,r*.43,d.stage==='wait'?'#e56d54':'#54625f');circ(c,W/2,H/2+r*.66,r*.43,d.stage==='go'?'#6fca86':'#54625f');txt(c,d.stage==='go'?'GO!':d.stage==='wait'?'WAIT FOR IT…':d.winner>=0?pname(d.winner)+' WINS':'NEXT ROUND',W/2,H/2+r*2.1,20,d.stage==='go'?'#24815f':INK);}};
engines.color={init(){S.d={color:Math.floor(Math.random()*S.n),next:1.2,tapped:Array(S.n).fill(false)};},tap(i){let d=S.d;if(d.tapped[i])return;d.tapped[i]=true;score(i,d.color===i?1:-1);},update(){let d=S.d;if(S.elapsed>d.next){d.color=(d.color+1+Math.floor(Math.random()*(S.n-1)))%S.n;d.next=S.elapsed+rand(.7,1.35);d.tapped.fill(false);}for(let i=prefs.humans;i<S.n;i++)if(d.color===i&&!d.tapped[i]&&d.next-S.elapsed<.6*level())engines.color.tap(i);},draw(){let sz=Math.min(W*.48,H*.48),d=S.d;for(let i=0;i<S.n;i++)circ(c,W/2+Math.cos(i*2*Math.PI/S.n-Math.PI/2)*sz*.8,H/2+Math.sin(i*2*Math.PI/S.n-Math.PI/2)*sz*.8,12,COL[i]);c.save();c.translate(W/2,H/2);c.rotate(Math.sin(S.elapsed*1.8)*.035);rr(c,-sz/2,-sz/2+6,sz,sz,28,'#202c3616');rr(c,-sz/2,-sz/2,sz,sz,28,COL[d.color]);txt(c,d.color+1,0,-6,sz*.4,'white');txt(c,pname(d.color),0,sz*.28,17,'#ffffffcc');c.restore();txt(c,'IS IT YOUR COLOUR?',W/2,H/2+sz*.85,14,'#66727b');}};
engines.target={init(){S.d={target:Array.from({length:S.n},()=>rand(.25,.75)),phase:Array.from({length:S.n},()=>rand(0,6.28)),cool:Array(S.n).fill(0),hit:Array(S.n).fill(null)};},tap(i){let d=S.d;if(d.cool[i]>0)return;let x=.5+.39*Math.sin(S.elapsed*2.2+d.phase[i]),error=Math.abs(x-d.target[i]),v=error<.035?3:error<.09?1:0;d.hit[i]={x,v,life:.45};d.cool[i]=.45;if(v){score(i,v);d.target[i]=rand(.25,.75);}else tone(170,.04);},update(dt){let d=S.d;for(let i=0;i<S.n;i++){d.cool[i]=Math.max(0,d.cool[i]-dt);if(d.hit[i]){d.hit[i].life-=dt;if(d.hit[i].life<=0)d.hit[i]=null;}if(i>=prefs.humans&&Math.abs(.5+.39*Math.sin(S.elapsed*2.2+d.phase[i])-d.target[i])<.035*level())engines.target.tap(i);}},draw(){let d=S.d;for(let i=0;i<S.n;i++){let l=lanes(i),y=l.y+l.h/2,r=Math.min(l.h*.3,36),width=W-110;rr(c,30,l.y,W-60,l.h,14,TINT[i]);line(c,55,y,W-55,y,'#202c3620',3);for(let k=3;k>=1;k--)circ(c,55+d.target[i]*width,y,r*k/3,k%2?COL[i]:'#f7f5ef');let x=55+(.5+.39*Math.sin(S.elapsed*2.2+d.phase[i]))*width;line(c,x,y-r-10,x,y+r+10,INK,2);line(c,x-8,y,x+8,y,INK,2);txt(c,pname(i),45,l.y+14,11,COL[i],'left');if(d.hit[i])txt(c,d.hit[i].v?'+'+d.hit[i].v:'MISS',55+d.hit[i].x*width,y-r-18,15,COL[i]);}}};
engines.rhythm={init(){S.d={beat:-1,tapped:Array(S.n).fill(false),labels:Array(S.n).fill(''),life:Array(S.n).fill(0),sound:false};},tap(i){let d=S.d;if(d.tapped[i])return;d.tapped[i]=true;let p=(S.elapsed%1.2)/1.2,e=Math.abs(p-.8),v=e<.055?3:e<.14?1:0;d.labels[i]=v===3?'PERFECT +3':v===1?'NICE +1':'OFF BEAT';d.life[i]=.4;if(v)score(i,v);else tone(170,.03);},update(dt){let d=S.d,b=Math.floor(S.elapsed/1.2),p=(S.elapsed%1.2)/1.2;if(d.beat!==b){d.beat=b;d.tapped.fill(false);d.sound=false;}for(let i=0;i<S.n;i++){d.life[i]=Math.max(0,d.life[i]-dt);if(i>=prefs.humans&&!d.tapped[i]&&p>.8+(1/level()-1)*.07)engines.rhythm.tap(i);}if(p>.79&&!d.sound){d.sound=true;tone(470,.04);}},draw(){let d=S.d,p=(S.elapsed%1.2)/1.2,cols=S.n<=2?1:2,rows=Math.ceil(S.n/cols),cw=W/cols,ch=(H-60)/rows;for(let i=0;i<S.n;i++){let x=cw*(i%cols)+cw/2,y=30+ch*Math.floor(i/cols)+ch/2,r=Math.min(cw*.22,ch*.24,58);circ(c,x,y,r,null,'#202c3680',3);circ(c,x,y,r*(2.2-p*1.5),null,COL[i],6);disc(c,x,y,r*.3,COL[i],i+1);txt(c,d.life[i]>0?d.labels[i]:pname(i),x,y+r*2+18,13,COL[i]);}}};
function memGeom(){let cell=Math.min((W-64)/4,(H-80)/4);return{x:(W-cell*4)/2,y:(H-cell*4)/2,cell};}
engines.memory={init(){S.d={cards:shuffle([...Array(8).keys(),...Array(8).keys()]),claimed:Array(16).fill(-1),open:[],known:{},turn:0,reveal:0,wait:0};},choose(i){let d=S.d;if(d.reveal||d.claimed[i]>=0||d.open.includes(i))return;d.open.push(i);d.known[i]=d.cards[i];tone(440,.03);if(d.open.length===2)d.reveal=S.elapsed+.8;},board(x,y){let g=memGeom(),col=Math.floor((x-g.x)/g.cell),row=Math.floor((y-g.y)/g.cell);if(col>=0&&col<4&&row>=0&&row<4)engines.memory.choose(row*4+col);},update(dt){let d=S.d;if(d.reveal&&S.elapsed>=d.reveal){let [a,b]=d.open;if(d.cards[a]===d.cards[b]){d.claimed[a]=d.claimed[b]=d.turn;score(d.turn,1);if(d.claimed.every(v=>v>=0)){finish();return;}}else next();d.open=[];d.reveal=0;d.wait=0;}if(d.turn>=prefs.humans&&!d.reveal){d.wait+=dt;if(d.wait>.65/level()){d.wait=0;let avail=d.cards.map((_,i)=>i).filter(i=>d.claimed[i]<0&&!d.open.includes(i)),pick=-1;if(d.open.length){let value=d.cards[d.open[0]],found=avail.find(i=>d.known[i]===value);if(found!==undefined)pick=found;}else if(prefs.difficulty!=='easy'){for(let a of avail)if(avail.some(b=>a!==b&&d.known[a]!==undefined&&d.known[a]===d.known[b])){pick=a;break;}}if(pick<0)pick=avail[Math.floor(Math.random()*avail.length)];if(pick!==undefined)engines.memory.choose(pick);}}},draw(){let d=S.d,g=memGeom();for(let i=0;i<16;i++){let x=g.x+i%4*g.cell+5,y=g.y+Math.floor(i/4)*g.cell+5,sz=g.cell-10,p=d.claimed[i],open=d.open.includes(i);rr(c,x,y+3,sz,sz,11,'#202c3615');rr(c,x,y,sz,sz,11,p>=0?TINT[p]:open?'white':COL[d.turn]);if(p>=0||open){symbol(c,d.cards[i],x+sz/2,y+sz/2,sz*.18,p>=0?COL[p]:INK);if(p>=0)txt(c,p+1,x+sz-13,y+13,11,COL[p]);}else txt(c,'?',x+sz/2,y+sz/2,sz*.34,'#ffffffaa');}}};
function connectGeom(){let cell=Math.min((W-65)/7,(H-80)/6);return{x:(W-cell*7)/2,y:(H-cell*6)/2,cell};}
function rowFor(board,col){for(let r=5;r>=0;r--)if(board[r][col]<0)return r;return -1;}
function connects(board,r,col,p){for(let [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let count=1;for(let sign of [-1,1])for(let k=1;k<3;k++){let rr=r+dy*k*sign,cc=col+dx*k*sign;if(rr<0||rr>5||cc<0||cc>6||board[rr][cc]!==p)break;count++;}if(count>=3)return true;}return false;}
engines.connect={init(){S.d={board:Array.from({length:6},()=>Array(7).fill(-1)),turn:0,wait:0,last:null};},choose(col){let d=S.d,r=rowFor(d.board,col);if(r<0)return;d.board[r][col]=d.turn;d.last={r,col};tone(460,.04);if(connects(d.board,r,col,d.turn)){score(d.turn,1);finish([d.turn]);return;}if(d.board[0].every(v=>v>=0)){finish(Array.from({length:S.n},(_,i)=>i));return;}next();},board(x,y){let g=connectGeom(),col=Math.floor((x-g.x)/g.cell);if(col>=0&&col<7&&y>g.y-25&&y<g.y+6*g.cell+20)engines.connect.choose(col);},update(dt){let d=S.d;if(d.turn<prefs.humans)return;d.wait+=dt;if(d.wait<.7/level())return;d.wait=0;let avail=Array.from({length:7},(_,i)=>i).filter(i=>rowFor(d.board,i)>=0),pick=-1;for(let p of [d.turn,...Array.from({length:S.n},(_,i)=>i).filter(i=>i!==d.turn)]){if(prefs.difficulty==='easy'&&Math.random()<.45)continue;for(let col of avail){let r=rowFor(d.board,col);d.board[r][col]=p;let win=connects(d.board,r,col,p);d.board[r][col]=-1;if(win){pick=col;break;}}if(pick>=0)break;}if(pick<0)pick=avail.sort((a,b)=>Math.abs(a-3)-Math.abs(b-3))[Math.floor(Math.random()*Math.min(3,avail.length))];engines.connect.choose(pick);},draw(){let d=S.d,g=connectGeom();rr(c,g.x-8,g.y-8,g.cell*7+16,g.cell*6+16,18,'#b6c7ed');for(let r=0;r<6;r++)for(let col=0;col<7;col++){let x=g.x+(col+.5)*g.cell,y=g.y+(r+.5)*g.cell,p=d.board[r][col];circ(c,x,y,g.cell*.37,p<0?'#f7f5ef':COL[p]);if(p>=0)txt(c,p+1,x,y,g.cell*.3,'white');if(d.last&&d.last.r===r&&d.last.col===col)circ(c,x,y,g.cell*.42,null,INK,2);}for(let col=0;col<7;col++)txt(c,'v',g.x+(col+.5)*g.cell,g.y-22,15,COL[d.turn]);}};
function boxGeom(){let cell=Math.min((W-110)/4,(H-110)/4);return{x:(W-cell*4)/2,y:(H-cell*4)/2,cell};}
function boxEdges(r,col){return ['h'+r+','+col,'h'+(r+1)+','+col,'v'+r+','+col,'v'+r+','+(col+1)];}
engines.boxes={init(){S.d={edges:{},owners:Array(16).fill(-1),turn:0,wait:0};},choose(key){let d=S.d;if(d.edges[key]!==undefined)return;d.edges[key]=d.turn;let count=0;for(let r=0;r<4;r++)for(let col=0;col<4;col++)if(d.owners[r*4+col]<0&&boxEdges(r,col).every(e=>d.edges[e]!==undefined)){d.owners[r*4+col]=d.turn;count++;}tone(420,.03);if(count)score(d.turn,count);if(d.owners.every(v=>v>=0)){finish();return;}if(!count)next();else{d.wait=0;S.message=pname(d.turn)+' · box claimed! Go again';hud();}},board(x,y){let g=boxGeom(),gx=(x-g.x)/g.cell,gy=(y-g.y)/g.cell,key=null;if(Math.abs(gy-Math.round(gy))<.25&&gx>=0&&gx<4&&Math.round(gy)>=0&&Math.round(gy)<=4)key='h'+Math.round(gy)+','+Math.floor(gx);else if(Math.abs(gx-Math.round(gx))<.25&&gy>=0&&gy<4&&Math.round(gx)>=0&&Math.round(gx)<=4)key='v'+Math.floor(gy)+','+Math.round(gx);if(key)engines.boxes.choose(key);},update(dt){let d=S.d;if(d.turn<prefs.humans)return;d.wait+=dt;if(d.wait<.6/level())return;d.wait=0;let all=[];for(let r=0;r<5;r++)for(let col=0;col<4;col++)all.push('h'+r+','+col);for(let r=0;r<4;r++)for(let col=0;col<5;col++)all.push('v'+r+','+col);let avail=all.filter(e=>d.edges[e]===undefined),pick=avail[Math.floor(Math.random()*avail.length)];if(prefs.difficulty!=='easy'){let best=-1e9;for(let e of shuffle(avail.slice())){let value=0;for(let r=0;r<4;r++)for(let col=0;col<4;col++){let edges=boxEdges(r,col);if(edges.includes(e)){let n=edges.filter(k=>d.edges[k]!==undefined).length;value+=n===3?10:n===2?-4:0;}}if(value>best){best=value;pick=e;}}}if(pick)engines.boxes.choose(pick);},draw(){let d=S.d,g=boxGeom();for(let r=0;r<4;r++)for(let col=0;col<4;col++){let p=d.owners[r*4+col];if(p>=0){rr(c,g.x+col*g.cell+7,g.y+r*g.cell+7,g.cell-14,g.cell-14,8,TINT[p]);txt(c,p+1,g.x+(col+.5)*g.cell,g.y+(r+.5)*g.cell,25,COL[p]);}}for(let r=0;r<5;r++)for(let col=0;col<4;col++){let p=d.edges['h'+r+','+col];line(c,g.x+col*g.cell,g.y+r*g.cell,g.x+(col+1)*g.cell,g.y+r*g.cell,p===undefined?'#c6cec0':COL[p],p===undefined?2:6);}for(let r=0;r<4;r++)for(let col=0;col<5;col++){let p=d.edges['v'+r+','+col];line(c,g.x+col*g.cell,g.y+r*g.cell,g.x+col*g.cell,g.y+(r+1)*g.cell,p===undefined?'#c6cec0':COL[p],p===undefined?2:6);}for(let r=0;r<5;r++)for(let col=0;col<5;col++)circ(c,g.x+col*g.cell,g.y+r*g.cell,5,INK);}};
function render(){if(!S)return;c.clearRect(0,0,W,H);c.fillStyle=S.g.bg;c.fillRect(0,0,W,H);if(window.Deluxe)Deluxe.background(c,W,H,S);engines[S.g.id].draw();if(window.Deluxe&&!S.g.prototype)Deluxe.overlay(c,W,H,S);}
function step(dt){if(!active())return;S.elapsed+=dt;engines[S.g.id].update(dt);if(S.ended)return;if(S.g.time&&S.elapsed>=S.g.time)finish();hudTime+=dt;if(hudTime>.15){hudTime=0;hud();}}
function loop(t){let dt=last?Math.min((t-last)/1000,.05):0;last=t;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
/* 3.0 expansion. Included inside the core closure by build-expansion.py. */
const catalog=[
['skyhook','Skyhook Scramble','AIM · REEL','🪝','Drag on your control zone to aim, release to hook scrap. Hold again to reel it home. Rivals can hook the same scrap.','Scrapyard|Asteroid Drift|Crosswind Dock'],
['fossil','Fossil Frenzy','CHIP · PRESERVE','🦴','Tap rock tiles to excavate. Bones need gentle taps: do not tap exposed bones. Complete a specimen for a bonus.','Dinosaur Bed|Crystal Cavern|Fragile Shale'],
['elevator','Goblin Elevator','LOAD · DELIVER','🛗','Tap the left side of your zone to board a passenger; tap the right side to move the shared lift. Deliver your colours without exceeding capacity.','Goblin Tower|Deep Mine|Sky Hotel'],
['wobble','Wobble Works','BUILD · TEST','⚙️','Tap your zone to place a ramp. Drag to change its slope. Tap RUN to release a ball. Route it into the golden basket; each test costs one point.','Workshop|Fan Factory|Split Levels'],
['unravel','The Unravelers','DRAG · UNTANGLE','🕸️','Drag nodes in your web. Remove every crossing for a bonus and a new web. Straighten the web with as few moves as possible.','Silk Square|Hex Web|Long Threads'],
['kite','Kite Keepers','STEER · COLLECT','🪁','Drag across your zone to steer your kite. Collect golden ribbons and avoid storm clouds. Wind changes with the map.','Meadow Breeze|Storm Alley|Mountain Draft'],
['gravity','Gravity Locksmiths','SWIPE · ROLL','🗝️','Swipe in your zone to change the shared gravity. Roll your coloured key into its matching lock. Everyone affects the same room.','Lock Chamber|Twin Pillars|Pinwheel Hall'],
['tumble','Tumble Table','PLACE · BALANCE','⚖️','Tap across your zone to place a weighted piece on the shared rocking table. Keep your pieces aboard. Fallen pieces lose points.','Long Table|Narrow Plank|Heavy Cargo'],
['moss','Mossball Garden','BEND · GUIDE','🌿','Drag horizontally in your zone to tilt your leaf. Bounce the shared seed toward your coloured goal and collect dew on the way.','Dew Garden|Snail Grove|Bouncy Canopy'],
['choir','Critter Choir','LISTEN · REPEAT','🎶','Watch the note sequence at the top of your zone. Repeat it using the four note pads below. A wrong note resets your progress.','Woodland Trio|Moon Chorus|Quick Quartet'],
['potion','Potion Panic','SORT · MIX','🧪','Tap one of three valves in your zone to add the next recipe ingredient. Wrong ingredients cost points and reset your brew.','Apothecary|Fast Ferment|Long Recipe'],
['mole','Mole Mail','DIG · DELIVER','📦','Tap adjacent soil squares to dig from the mole to the parcel. Completed routes collapse and a new parcel appears. Avoid bedrock.','Soft Soil|Rocky Burrow|Long Delivery'],
['tailor','Dream Tailors','ROTATE · FIT','🧵','Tap a patch in your zone to rotate it. Match every patch orientation to the silhouette shown above it.','Four Patches|Six Patches|Eight Patches'],
['sea','Quiet Sea','PULSE · LURE','🐠','Tap your sonar pad to lure nearby creatures toward your sanctuary. Rapid pulses frighten them away; wait for the noise ring to fade.','Open Trench|Reef Walls|Thermal Drift'],
['golem','Golem Gambit','QUEUE · EXECUTE','🗿','Queue three commands with the arrow pads, then tap GO. Your golem executes them in sequence. Collect runes, avoid walls and predict rivals.','Rune Court|Pillar Maze|Shifting Ruins'],
['suitcase','Suspicious Suitcase','PACK · SNEAK','🧳','Tap left to pack the offered item; tap right to send it to the next suitcase. Stay under the weight limit at each inspection.','Airport Check|Golden Cargo|Tight Allowance'],
['tongue','Tongue Tangle','AIM · SNAP','🦎','Drag to aim your chameleon tongue, release to catch a bug. Rival tongues can knock your catch away. Avoid red wasps.','Bug Pond|Wasp Nest|Fast Flies'],
['room','Room for Trouble','FIT · SHOVE','🛋️','Tap an empty cell in your room to place the next piece. Filling a row expands your room and squeezes the next player. Leave room for more furniture.','Studio Block|Skinny House|Heavy Furniture'],
['ghost','Ghost Photographer','WATCH · FLASH','👻','Ghosts appear briefly when any camera flashes. Tap a visible ghost in your zone to photograph it. A blind shot costs a point.','Haunted Hall|Fast Spirits|Crowded Attic'],
['spaghetti','Spaghetti Heist','TWIRL · RELEASE','🍝','Hold your fork pad to pull a noodle. Release before tension reaches red to bank your serving. Rivals pull the same plate.','Dinner Plate|Sticky Sauce|Rotating Platter'],
['planet','Planet Movers','DRAG · ORBIT','🪐','Drag your gravity moon around your zone. Bend the shared space creature toward your coloured edge gate. Avoid the central star.','Gentle Orbit|Twin Stars|Meteor Drift'],
['candle','Candle Criminals','CHARGE · BLOW','🕯️','Hold your gust pad to charge, release to blow toward the next candle. Overcharging burns your own candle; wax walls alter the wind.','Still Room|Cross Breeze|Wax Maze'],
['octopus','One Octopus, Four Jobs','REACH · DELIVER','🐙','Drag your tentacle tip onto your coloured dish, then into your coloured delivery tray. Long reaches pull the shared body and other dishes.','Dinner Service|Long Reach|Slippery Kitchen'],
['sunshine','Borrowed Sunshine','GROW · BEND','🌻','Hold to grow your plant. Drag to bend toward the moving sun. Tall plants cast shadows on neighbours but can fall in the wind.','Sunny Yard|Windy Balcony|Low Sun'],
['gift','Definitely Not a Trap','BUILD · PICK','🎁','Choose a treat or trap, then choose a wrapping colour. When all gifts are ready, pick a box. Score treats and earn points when rivals choose your trap.','Gift Exchange|Double Trouble|Return Policy'],
['tide','Tide Thieves','TIME · RAID','🌊','Tap to send your crab across the beach for treasure. Tap again to return. Bank treasure before the tide reaches your crab.','Gentle Shore|Fast Tide|Deep Sand'],
['orchard','Shadow Orchard','LIGHT · HARVEST','🍎','Drag your lantern to ripen fruit within its light. Tap ripe fruit to harvest. Unlit fruit slowly withers.','Apple Grove|Dense Canopy|Fleeting Light'],
['heat','Heat Dividend','HEAT · BANK','🌡️','Hold your furnace pad to heat a shared boiler. Release to bank your contribution in the safe heat band. Overheating empties unbanked energy.','Copper Boiler|Small Furnace|Leaky Pipes'],
['parcel','Parcel Parliament','VOTE · ROUTE','📮','Tap a route to vote where the shared conveyor sends the next parcel. Majority wins; ties rotate priority. Match parcel colours to destinations for points.','Three Routes|Quick Dispatch|Weighted Cargo'],
['echo','Echo Couriers','PING · REMEMBER','🔔','Tap PING to reveal hidden delivery beacons briefly. Then tap the remembered beacon location in your zone. Pings cost one point; correct deliveries earn four.','Mist Courtyard|Moving Beacons|Short Echo']
];
const baseCount=games.length;
catalog.forEach((a,i)=>games.push({id:a[0],name:a[1],tag:a[2],emoji:a[3],rule:a[4],goal:'Most points after 45 seconds wins. Solo: reach 12 points and beat your record.',time:45,action:'PLAY',bg:['#e6eee5','#e7e9f6','#f5e8d9','#e1edf0','#f0e6ed'][i%5],prototype:true,maps:a[5].split('|')}));
const originalMaps={rally:['Coastal Circuit','Traffic Chicane'],sumo:['Open Orbit','Solar Current'],hockey:['Classic Rink','Centre Bumper'],draw:['Signal Station','False Alarm Alley'],color:['Colour Studio','Quick-change Gallery'],target:['Target Hall','Moving Bullseyes'],rhythm:['Steady Street','Tempo Steps'],memory:['Garden Table','Quick Peek Table'],connect:['Open Grid','Seeded Grid'],boxes:['Blank Notebook','Linked Corners']};
games.slice(0,10).forEach(g=>g.maps=originalMaps[g.id]);
let forcedMap=null, mapHistory={}, cup=null, inputPoints=new Map();
const mod=(n,m)=>((n%m)+m)%m, dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), C2=['#315be8','#d84d37','#24815f','#9063c7'];
function mi(){return S.mapIndex||0;}function arena(i){if(S.n===1)return{x:20,y:65,w:560,h:470};if(S.n===2)return{x:20,y:i===0?315:70,w:560,h:215};return{x:20+(i%2)*290,y:i<2?315:70,w:270,h:215};}
function isTop(i){return S.n===2?i===1:S.n>2&&i>=2;}
function anchor(i){return S.n===1?{x:300,y:560}:S.n===2?{x:300,y:i===0?560:35}:{x:i%2?455:145,y:i<2?560:35};}
function nearestPlayer(p){let best=0,dd=1e9;for(let i=0;i<S.n;i++){let a=anchor(i),d=dist(a,p);if(d<dd){dd=d;best=i;}}return best;}
function panel(i){let a=arena(i);rr(c,a.x,a.y,a.w,a.h,12,'#ffffffb0','#cbd4d1');return a;}
function label(t,x,y,s=18,col=INK){s=Math.max(s,20);let text=String(t),limit=S.n>=3&&(x<200||x>400)?245:535;c.font='700 '+s+'px Arial';if(c.measureText(text).width>limit&&text.includes(' ')){let words=text.split(' '),rows=[''];for(let w of words){let k=rows.length-1;if(c.measureText(rows[k]+' '+w).width>limit&&rows[k])rows.push(w);else rows[k]+=(rows[k]?' ':'')+w;}rows.forEach((v,k)=>txt(c,v,x,y+(k-(rows.length-1)/2)*23,s,col));}else txt(c,text,x,y,s,col);}function dot(x,y,r,col){circ(c,x,y,r,col);}function path(a,b,col,w=3){line(c,a.x,a.y,b.x,b.y,col,w);}function localPoint(i,p){let a=arena(i);return{x:clamp((p.x-a.x)/a.w,0,.999),y:clamp((p.y-a.y)/a.h,0,.999)};}
function gain(i,v){score(i,v);}function many(fn){return Array.from({length:S.n},(_,i)=>fn(i));}function chosen(a){return a[Math.floor(Math.random()*a.length)];}
function register(id,engine){engines[id]={init(){S.d={cool:many(()=>0),aim:many(()=>({x:.5,y:.5})),p:[]};engine.init?.();},update(dt){S.d.cool=S.d.cool.map(v=>Math.max(0,v-dt));engine.update?.(dt);},tap(i,p){if(S.d.cool[i]>0)return;engine.tap?.(i,p||anchor(i));},move(i,p){engine.move?.(i,p);},up(i,p){engine.up?.(i,p);},draw(){c.save();c.scale(W/600,H/600);engine.draw();for(let i=0;i<S.n;i++){let a=anchor(i);rr(c,a.x-64,a.y-20,128,40,12,COL[i]);label('P'+(i+1)+' · '+(S.held[i]?'HOLD':'TOUCH'),a.x,a.y,15,'white');}c.restore();}};}
function itemDraw(o,emoji,size=28){label(emoji,o.x,o.y,size);}
// Shared-object grappling: each hook keeps its own target and reeling direction.
register('skyhook',{init(){S.d.scrap=[[135,155],[300,170],[465,155],[200,285],[410,300],[140,405],[340,430]].map((p,k)=>({x:p[0],y:p[1],v:k%3+1}));S.d.hook=many(()=>-1);},tap(i,p){S.d.aim[i]=p;},move(i,p){S.d.aim[i]=p;},up(i,p){let d=S.d,a=anchor(i),vx=p.x-a.x,vy=p.y-a.y,l=Math.hypot(vx,vy)||1;let candidates=d.scrap.map((o,k)=>({k,v:Math.abs((o.x-a.x)*vy-(o.y-a.y)*vx)/l,front:(o.x-a.x)*vx+(o.y-a.y)*vy})).filter(o=>o.front>0&&o.v<65);d.hook[i]=candidates.sort((a,b)=>a.v-b.v)[0]?.k??-1;},update(dt){let d=S.d;d.scrap.forEach((o,k)=>{o.x+=Math.sin(S.elapsed+k)*mi()*dt*16;for(let i=0;i<S.n;i++)if(d.hook[i]===k&&S.held[i]){let a=anchor(i),l=dist(o,a);o.x+=(a.x-o.x)/(l||1)*dt*125;o.y+=(a.y-o.y)/(l||1)*dt*125;if(l<45){gain(i,o.v);o.x=rand(80,520);o.y=rand(180,420);d.hook=d.hook.map(h=>h===k?-1:h);}}});},draw(){S.d.scrap.forEach(o=>{itemDraw(o,'⚙',30+o.v*4);label(o.v,o.x,o.y+25,12);});S.d.hook.forEach((k,i)=>{if(k>=0)path(anchor(i),S.d.scrap[k],COL[i],4);});}});
register('fossil',{init(){S.d.tiles=many(()=>Array(25).fill(0));S.d.bones=many(()=>new Set(shuffle(Array.from({length:25},(_,k)=>k)).slice(0,5+mi())));},tap(i,p){let q=localPoint(i,p),k=Math.floor(q.x*5)+Math.floor(q.y*5)*5,d=S.d;if(d.tiles[i][k]>=2){gain(i,-1);return;}d.tiles[i][k]++;if(d.tiles[i][k]===2){gain(i,d.bones[i].has(k)?2:0);if([...d.bones[i]].every(b=>d.tiles[i][b]===2)){gain(i,6);d.tiles[i].fill(0);}}d.cool[i]=.15+mi()*.08;},draw(){many(i=>{let a=panel(i);for(let k=0;k<25;k++){let x=a.x+k%5*a.w/5,y=a.y+Math.floor(k/5)*a.h/5,v=S.d.tiles[i][k];rr(c,x+3,y+3,a.w/5-6,a.h/5-6,5,v===2?'#e5dcc0':v?'#b5a48b':'#8f8070');if(v===2&&S.d.bones[i].has(k))label('🦴',x+a.w/10,y+a.h/10,24);}});}});
register('elevator',{init(){S.d.floor=0;S.d.load=[];S.d.wait=many(()=>({to:1+Math.floor(rand(0,4+mi())),w:chosen([1,2,3])}));S.d.auto=0;},tap(i,p){let d=S.d,q=localPoint(i,p);if(q.x<.5){let o=d.wait[i];d.load.push({...o,i});d.wait[i]={to:Math.floor(rand(0,5+mi())),w:chosen([1,2,3])};if(d.load.reduce((s,o)=>s+o.w,0)>8-mi()){d.load.forEach(o=>gain(o.i,-2));d.load=[];S.message='OVERLOAD! Passengers escaped.';}}else{d.floor=(d.floor+1)%(5+mi());d.load=d.load.filter(o=>{if(o.to===d.floor){gain(o.i,3);return false;}return true;});}d.cool[i]=.4;},draw(){let d=S.d;for(let f=0;f<5+mi();f++){let y=480-f*55;path({x:90,y},{x:510,y},'#aebabe');label('F'+f,55,y,20);}rr(c,240,450-d.floor*55,120,45,8,'#344d5b');label('🛗 '+d.load.reduce((s,o)=>s+o.w,0)+'/'+(8-mi()),300,472-d.floor*55,22,'white');many(i=>{let a=anchor(i),o=d.wait[i];label('BOARD '+o.w+'kg → F'+o.to+'   |   MOVE ↑',a.x,a.y+(isTop(i)?35:-34),13,COL[i]);});}});
register('wobble',{init(){S.d.ramps=many(()=>[]);S.d.ball=many(()=>null);},tap(i,p){let a=arena(i),q=localPoint(i,p);if(q.y>.8){S.d.ball[i]={x:a.x+22,y:a.y+20,vx:(a.w-70)/Math.sqrt(2*(a.h-55)/180),vy:0};gain(i,-1);}else if(S.d.ramps[i].length<8){S.d.ramps[i].push({x:p.x,y:p.y,slope:0});}else S.d.ramps[i]=[];},move(i,p){let r=S.d.ramps[i].at(-1);if(r)r.slope=clamp((p.y-r.y)/45,-1,1);},update(dt){many(i=>{let b=S.d.ball[i],a=arena(i);if(!b)return;b.vy+=dt*(mi()===2?250:180);b.vx+=mi()===1?dt*45:0;b.x+=b.vx*dt;b.y+=b.vy*dt;for(let r of S.d.ramps[i])if(Math.abs(b.x-r.x)<50&&Math.abs(b.y-r.y-r.slope*(b.x-r.x))<10&&b.vy>0){b.vy=-Math.abs(b.vy)*.6-20;b.vx+=r.slope*80+20;}if(b.x>a.x+a.w-60&&b.y>a.y+a.h-65){gain(i,7);S.d.ball[i]=null;}else if(b.y>a.y+a.h||b.x>a.x+a.w)S.d.ball[i]=null;});},draw(){many(i=>{let a=panel(i);label('● START',a.x+38,a.y+20,12,COL[i]);for(let r of S.d.ramps[i])path({x:r.x-45,y:r.y-r.slope*45},{x:r.x+45,y:r.y+r.slope*45},COL[i],7);rr(c,a.x+a.w-60,a.y+a.h-60,46,36,5,'#e3ad43');label('RUN / CLEAR AT 8 RAMPS',a.x+a.w/2,a.y+a.h-22,12);if(S.d.ball[i])dot(S.d.ball[i].x,S.d.ball[i].y,9,COL[i]);});}});
function crossing(a,b,c1,d){const orient=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return orient(a,b,c1)*orient(a,b,d)<0&&orient(c1,d,a)*orient(c1,d,b)<0;}
function webReset(i){let n=4+mi()*2;S.d.p[i]=Array.from({length:n},(_,k)=>({x:.5+Math.cos(k/n*Math.PI*2)*.38,y:.5+Math.sin(k/n*Math.PI*2)*.34}));S.d.order[i]=[...Array(n).keys()];[S.d.order[i][1],S.d.order[i][2]]=[S.d.order[i][2],S.d.order[i][1]];}
function crosses(i){let p=S.d.p[i],o=S.d.order[i],n=o.length,t=0;for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){if(b===a+1||(a===0&&b===n-1))continue;if(crossing(p[o[a]],p[o[(a+1)%n]],p[o[b]],p[o[(b+1)%n]]))t++;}return t;}
register('unravel',{init(){S.d.order=[];S.d.drag=[];many(webReset);},tap(i,p){let q=localPoint(i,p);S.d.drag[i]=S.d.p[i].map((o,k)=>({k,d:dist(o,q)})).sort((a,b)=>a.d-b.d)[0].k;},move(i,p){if(S.d.drag[i]!==undefined)S.d.p[i][S.d.drag[i]]=localPoint(i,p);},up(i){if(crosses(i)===0){gain(i,8);webReset(i);}S.d.drag[i]=undefined;},draw(){many(i=>{let a=panel(i),p=S.d.p[i],o=S.d.order[i],pt=k=>({x:a.x+p[k].x*a.w,y:a.y+p[k].y*a.h});for(let k=0;k<o.length;k++)path(pt(o[k]),pt(o[(k+1)%o.length]),COL[i],4);p.forEach((v,k)=>{let t=pt(k);dot(t.x,t.y,13,COL[i]);label(k+1,t.x,t.y,12,'white');});label(crosses(i)+' CROSSINGS',a.x+a.w/2,a.y+18,12);});}});
register('kite',{init(){S.d.p=many((i)=>({x:110+i*110,y:300}));S.d.ribbon={x:rand(80,520),y:rand(150,450)};S.d.cloud={x:300,y:220};},move(i,p){S.d.aim[i]=p;},tap(i,p){S.d.aim[i]=p;},update(dt){let d=S.d;d.cloud.x=300+Math.sin(S.elapsed*.6)*150;many(i=>{let p=d.p[i],a=d.aim[i];if(a.x>1){p.x+=(a.x-p.x)*dt*2;p.y+=(a.y-p.y)*dt*2;}p.x+=Math.sin(S.elapsed*(1+mi())+i)*dt*(20+mi()*15);p.x=clamp(p.x,40,560);p.y=clamp(p.y,100,500);if(dist(p,d.ribbon)<32){gain(i,2);d.ribbon={x:rand(60,540),y:rand(130,470)};}if(dist(p,d.cloud)<40&&d.cool[i]<=0){gain(i,-1);d.cool[i]=1;}});},draw(){itemDraw(S.d.ribbon,'🎗',32);itemDraw(S.d.cloud,'☁️',60);S.d.p.forEach((p,i)=>{path(anchor(i),p,COL[i],2);itemDraw(p,'🪁',38);dot(p.x,p.y+20,5,COL[i]);});}});
function keyMaze(){return mi()===0?[]:mi()===1?[{x:210,y:240,w:25,h:130},{x:370,y:230,w:25,h:130}]:[{x:200,y:290,w:200,h:20},{x:290,y:190,w:20,h:200}];}
register('gravity',{init(){S.d.p=many((i)=>({x:160+i*80,y:270,vx:0,vy:0}));S.d.gravity={x:0,y:100};S.d.start=[];},tap(i,p){S.d.start[i]=p;},up(i,p){let a=S.d.start[i]||anchor(i),dx=p.x-a.x,dy=p.y-a.y;if(Math.abs(dx)>Math.abs(dy))S.d.gravity={x:Math.sign(dx)*140,y:0};else S.d.gravity={x:0,y:Math.sign(dy||1)*140};},update(dt){many(i=>{let p=S.d.p[i],g=S.d.gravity,old={x:p.x,y:p.y};p.vx=(p.vx+g.x*dt)*.99;p.vy=(p.vy+g.y*dt)*.99;p.x=clamp(p.x+p.vx*dt,65,535);p.y=clamp(p.y+p.vy*dt,110,490);for(let r of keyMaze())if(p.x>r.x-12&&p.x<r.x+r.w+12&&p.y>r.y-12&&p.y<r.y+r.h+12){p.x=old.x;p.y=old.y;p.vx*=-.5;p.vy*=-.5;}let goal={x:100+i*400/Math.max(1,S.n-1),y:i%2?130:470};if(dist(p,goal)<25){gain(i,4);p.x=rand(180,420);p.y=300;p.vx=p.vy=0;}});},draw(){rr(c,50,95,500,410,15,'#fcfcf8','#9cabb2');keyMaze().forEach(r=>rr(c,r.x,r.y,r.w,r.h,6,'#94a3a8'));many(i=>{let g={x:100+i*400/Math.max(1,S.n-1),y:i%2?130:470};circ(c,g.x,g.y,22,null,COL[i],5);itemDraw(S.d.p[i],'🗝',32);dot(S.d.p[i].x,S.d.p[i].y+20,5,COL[i]);});label('GRAVITY '+(S.d.gravity.x?'↔':'↕'),300,80,16);}});
register('tumble',{init(){S.d.p=[];S.d.angle=0;},tap(i,p){S.d.p.push({x:clamp(p.x,100,500),owner:i,w:mi()===2?chosen([1,3,5]):chosen([1,2,3])});gain(i,1);S.d.cool[i]=.6;},update(dt){let d=S.d,torque=d.p.reduce((s,o)=>s+(o.x-300)*o.w,0)/5000;d.angle+=(clamp(torque,-.55,.55)-d.angle)*dt*2;d.p=d.p.filter(o=>{o.x+=Math.sin(d.angle)*dt*(50+mi()*15);if(Math.abs(o.x-300)>(mi()===1?130:210)){gain(o.owner,-2);return false;}return true;});},draw(){let d=S.d;c.save();c.translate(300,310);c.rotate(d.angle);rr(c,mi()===1?-140:-220,-5,mi()===1?280:440,15,4,'#977651');d.p.forEach((o,k)=>{rr(c,o.x-300-12,-20-Math.floor(k/12)*23,24,24,4,COL[o.owner]);label(o.w,o.x-300,-8-Math.floor(k/12)*23,13,'white');});c.restore();label('▲',300,360,70,'#53656b');label('KEEP YOUR CARGO ON THE TABLE',300,435,16);}});
register('moss',{init(){S.d.ball={x:300,y:150,vx:55,vy:0};S.d.tilt=many(()=>0);},move(i,p){S.d.tilt[i]=(localPoint(i,p).x-.5)*2;},tap(i,p){S.d.tilt[i]=(localPoint(i,p).x-.5)*2;},update(dt){let b=S.d.ball;b.vy+=dt*90;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<45||b.x>555)b.vx*=-1;many(i=>{let x=90+(i+.5)*420/S.n,y=260+(i%2)*80+mi()*15;if(Math.abs(b.x-x)<65&&Math.abs(b.y-y)<12&&b.vy>0){b.vy=-80-mi()*20;b.vx+=S.d.tilt[i]*100;}});if(b.y>500){let i=clamp(Math.floor((b.x-40)/520*S.n),0,S.n-1);gain(i,3);b.x=300;b.y=110;b.vx=rand(-90,90);b.vy=0;}},draw(){many(i=>{let x=90+(i+.5)*420/S.n,y=260+(i%2)*80+mi()*15,t=S.d.tilt[i];path({x:x-55,y:y-t*22},{x:x+55,y:y+t*22},COL[i],12);rr(c,40+i*520/S.n,500,520/S.n-4,20,5,COL[i]);});itemDraw(S.d.ball,'🌰',30);}});
register('choir',{init(){S.d.seq=many(()=>Array.from({length:3+mi()},()=>Math.floor(rand(0,4))));S.d.progress=many(()=>0);},tap(i,p){let q=localPoint(i,p),note=Math.floor(q.x*4),d=S.d,idx=d.progress[i];if(note===d.seq[i][idx]){d.progress[i]++;tone(260+note*100,.13);if(d.progress[i]===d.seq[i].length){gain(i,5);d.progress[i]=0;d.seq[i]=Array.from({length:3+mi()},()=>Math.floor(rand(0,4)));}}else{gain(i,-1);d.progress[i]=0;}d.cool[i]=.16;},draw(){many(i=>{let a=panel(i),d=S.d,visible=S.elapsed%7<2.8;label(visible?d.seq[i].map(n=>['DO','RE','MI','FA'][n]).join(' · '):'REMEMBER THE SONG',a.x+a.w/2,a.y+35,17);label(d.progress[i]+'/'+d.seq[i].length,a.x+a.w/2,a.y+65,14,COL[i]);for(let k=0;k<4;k++){rr(c,a.x+k*a.w/4+5,a.y+a.h*.5,a.w/4-10,a.h*.4,8,COL[k]);label(['DO','RE','MI','FA'][k],a.x+(k+.5)*a.w/4,a.y+a.h*.7,18,'white');}});}});
register('potion',{init(){S.d.recipe=many(()=>Array.from({length:3+mi()},()=>Math.floor(rand(0,3))));S.d.progress=many(()=>0);},tap(i,p){let d=S.d,k=Math.floor(localPoint(i,p).x*3);if(k===d.recipe[i][d.progress[i]]){d.progress[i]++;if(d.progress[i]===d.recipe[i].length){gain(i,5);d.progress[i]=0;d.recipe[i]=d.recipe[i].map(()=>Math.floor(rand(0,3)));}}else{gain(i,-1);d.progress[i]=0;}d.cool[i]=mi()===1?.12:.3;},draw(){many(i=>{let a=panel(i),d=S.d;label('RECIPE '+d.recipe[i].map((k,j)=>j<d.progress[i]?'✓':['🔴','🔵','🟢'][k]).join(' '),a.x+a.w/2,a.y+38,22);for(let k=0;k<3;k++){rr(c,a.x+k*a.w/3+8,a.y+a.h*.46,a.w/3-16,a.h*.42,8,[COL[1],COL[0],COL[2]][k]);label(['FIRE','WATER','HERB'][k],a.x+(k+.5)*a.w/3,a.y+a.h*.68,15,'white');}});}});
function moleNew(i){S.d.p[i]=mi()===2?2:0;S.d.target[i]=mi()===2?22:24;S.d.rocks[i]=mi()===2?new Set([7,12,17]):mi()===1?new Set([7,8,12,17]):new Set([12]);S.d.route[i]=new Set([S.d.p[i]]);}
register('mole',{init(){S.d.target=[];S.d.rocks=[];S.d.route=[];many(moleNew);},tap(i,p){let q=localPoint(i,p),k=Math.floor(q.x*5)+Math.floor(q.y*5)*5,d=S.d,prev=d.p[i];if(Math.abs(k%5-prev%5)+Math.abs(Math.floor(k/5)-Math.floor(prev/5))!==1||d.rocks[i].has(k))return;d.p[i]=k;d.route[i].add(k);if(k===d.target[i]){gain(i,5);moleNew(i);}d.cool[i]=.12;},draw(){many(i=>{let a=panel(i),d=S.d;for(let k=0;k<25;k++){let x=a.x+k%5*a.w/5,y=a.y+Math.floor(k/5)*a.h/5;rr(c,x+2,y+2,a.w/5-4,a.h/5-4,4,d.rocks[i].has(k)?'#56636a':d.route[i].has(k)?'#d6be86':'#ad906e');if(k===d.p[i]||k===d.target[i])label(k===d.p[i]?'🐹':'📦',x+a.w/10,y+a.h/10,25);}});}});
register('tailor',{init(){S.d.target=many(()=>Array.from({length:4+mi()*2},()=>Math.floor(rand(0,4))));S.d.p=many(()=>Array(4+mi()*2).fill(0));},tap(i,p){let q=localPoint(i,p),n=S.d.p[i].length,k=clamp(Math.floor(q.x*n),0,n-1);S.d.p[i][k]=(S.d.p[i][k]+1)%4;if(S.d.p[i].every((v,k)=>v===S.d.target[i][k])){gain(i,6);S.d.target[i]=S.d.target[i].map(()=>Math.floor(rand(0,4)));}S.d.cool[i]=.15;},draw(){many(i=>{let a=panel(i),n=S.d.p[i].length;for(let k=0;k<n;k++){let x=a.x+(k+.5)*a.w/n;label(['↑','→','↓','←'][S.d.target[i][k]],x,a.y+a.h*.3,28,'#849299');rr(c,x-a.w/n*.4,a.y+a.h*.5,a.w/n*.8,a.h*.36,6,S.d.p[i][k]===S.d.target[i][k]?'#24815f':COL[i]);label(['↑','→','↓','←'][S.d.p[i][k]],x,a.y+a.h*.68,28,'white');}});}});
register('sea',{init(){S.d.p=[[130,160],[300,190],[460,160],[180,310],[420,320],[300,430]].map(p=>({x:p[0],y:p[1]}));S.d.noise=many(()=>0);},tap(i){let d=S.d;if(d.noise[i]>.2){gain(i,-1);d.noise[i]=1;return;}d.noise[i]=1;let a=anchor(i);d.p.forEach(o=>{if(dist(o,a)<420){o.x+=(a.x-o.x)*.15;o.y+=(a.y-o.y)*.15;}});},update(dt){S.d.noise=S.d.noise.map(v=>Math.max(0,v-dt*.55));S.d.p.forEach((p,k)=>{p.x+=Math.sin(S.elapsed+k)*dt*(mi()===2?24:6);if(mi()===1&&p.y>220&&p.y<370){if(p.x>165&&p.x<220)p.x=160;if(p.x>380&&p.x<430)p.x=435;}many(i=>{let a=anchor(i);if(dist(p,a)<90){gain(i,3);p.x=rand(180,420);p.y=300;}});});},draw(){rr(c,40,90,520,420,20,'#163b50');S.d.p.forEach(p=>itemDraw(p,'🐠',32));many(i=>{let a=anchor(i),n=S.d.noise[i];if(n>0)circ(c,a.x,a.y,20+(1-n)*350,null,COL[i],3);});if(mi()===1){rr(c,180,230,30,130,9,'#456e72');rr(c,390,230,30,130,9,'#456e72');}label('QUIET PULSES BRING THEM HOME',300,120,15,'#c0e5e9');}});
function golemWalls(){return mi()===0?[12]:mi()===1?[6,8,16,18]:[7,11,13,17];}
register('golem',{init(){S.d.p=many(i=>[0,4,20,24][i]);S.d.queue=many(()=>[]);S.d.tick=0;S.d.rune=chosen([...Array(25).keys()].filter(k=>!golemWalls().includes(k)));},tap(i,p){let q=localPoint(i,p),k=clamp(Math.floor(q.x*5),0,4),d=S.d;if(k===4){d.queue[i]=d.queue[i].slice(0,3);if(!d.queue[i].length)return;d.run=true;}else if(d.queue[i].length<3)d.queue[i].push(k);d.cool[i]=.16;},update(dt){let d=S.d;if(!d.run)return;d.tick+=dt;if(d.tick<.45)return;d.tick=0;let proposals=d.p.map((v,i)=>{let k=d.queue[i].shift();if(k===undefined)return v;let x=v%5+[0,1,0,-1][k],y=Math.floor(v/5)+[-1,0,1,0][k],n=y*5+x;return x<0||x>4||y<0||y>4||golemWalls().includes(n)?v:n;});d.p=proposals.map((v,i)=>proposals.filter(n=>n===v).length>1?d.p[i]:v);d.p.forEach((v,i)=>{if(v===d.rune){gain(i,4);d.rune=chosen([...Array(25).keys()].filter(k=>!golemWalls().includes(k)));}});if(d.queue.every(q=>!q.length))d.run=false;},draw(){let d=S.d;for(let k=0;k<25;k++){let x=180+k%5*48,y=170+Math.floor(k/5)*48;rr(c,x,y,44,44,5,golemWalls().includes(k)?'#65777c':'#fffdf5');if(k===d.rune)label('R',x+22,y+22,26,'#b88a20');d.p.forEach((v,i)=>{if(v===k){dot(x+22,y+22,15,COL[i]);label(i+1,x+22,y+22,14,'white');}});}many(i=>{let a=arena(i),top=isTop(i),y=top?90:485;for(let k=0;k<5;k++){rr(c,a.x+k*a.w/5+4,y,a.w/5-8,40,6,COL[i]);label(['↑','→','↓','←','GO'][k],a.x+(k+.5)*a.w/5,y+20,22,'white');}label(d.queue[i].map(k=>['↑','→','↓','←'][k]).join(' ')||'QUEUE 3',a.x+a.w/2,top?68:460,20,COL[i]);});}});
register('suitcase',{init(){S.d.p=many(()=>({w:0,v:0}));S.d.offer=many(()=>({w:chosen([1,2,4]),v:chosen([1,3,5])}));S.d.inspect=8;},tap(i,p){let d=S.d,o=d.offer[i],left=localPoint(i,p).x<.5,j=left?i:(i+1)%S.n;if(S.n>1||left){d.p[j].w+=o.w;d.p[j].v+=o.v;}d.offer[i]={w:chosen([1,2,4]),v:chosen([1,3,5])};d.cool[i]=.4;},update(dt){let d=S.d;d.inspect-=dt;if(d.inspect<=0){d.p.forEach((o,i)=>{gain(i,o.w<=10-mi()*2?o.v:-4);o.w=o.v=0;});d.inspect=8;}},draw(){many(i=>{let a=panel(i),p=S.d.p[i],o=S.d.offer[i];label('🧳 '+p.w+'/'+(10-mi()*2)+' kg',a.x+a.w/2,a.y+40,26,COL[i]);label('VALUE '+p.v+' · INSPECTION '+Math.ceil(S.d.inspect)+'s',a.x+a.w/2,a.y+a.h*.4,14);label('OFFER: '+o.w+' kg / '+o.v+' pts',a.x+a.w/2,a.y+a.h*.6,17);label(S.n===1?'← PACK     DISCARD →':'← PACK     SNEAK →',a.x+a.w/2,a.y+a.h*.82,17);});}});
register('tongue',{init(){S.d.p=Array.from({length:8},(_,k)=>({x:rand(80,520),y:rand(160,440),bad:k<mi()+1}));S.d.tongues=many(()=>null);},tap(i,p){S.d.aim[i]=p;},move(i,p){S.d.aim[i]=p;},up(i,p){let a=anchor(i),t={x:p.x,y:p.y,time:.45};S.d.tongues[i]=t;let hit=S.d.p.find(o=>dist(o,p)<55);if(hit){let blocked=S.d.tongues.some((v,j)=>j!==i&&v&&dist(v,t)<50);gain(i,blocked?0:hit.bad?-2:2);hit.x=rand(80,520);hit.y=rand(140,460);}S.d.cool[i]=.3;},update(dt){S.d.p.forEach((p,k)=>p.x=clamp(p.x+Math.sin(S.elapsed*(2+mi())+k)*dt*40,60,540));S.d.tongues=S.d.tongues.map(t=>t&&t.time>dt?({...t,time:t.time-dt}):null);},draw(){S.d.p.forEach(p=>itemDraw(p,p.bad?'🐝':'🪰',30));S.d.tongues.forEach((t,i)=>{if(t)path(anchor(i),t,COL[i],7);});}});
register('room',{init(){S.d.p=many(()=>Array(20).fill(false));S.d.width=many(()=>5);},tap(i,p){let q=localPoint(i,p),d=S.d,w=d.width[i],k=Math.floor(q.x*w)+Math.floor(q.y*4)*w;if(d.p[i][k])return;d.p[i][k]=true;gain(i,1);let row=Math.floor(k/w);if(Array.from({length:w},(_,j)=>d.p[i][row*w+j]).every(Boolean)){gain(i,3);d.p[i]=Array(20).fill(false);d.width[(i+1)%S.n]=Math.max(3,d.width[(i+1)%S.n]-1);d.width[i]=Math.min(5,w+1);}if(mi()===2){let next=k+1;if(next<w*4)d.p[i][next]=true;}d.cool[i]=.3;},draw(){many(i=>{let a=panel(i),w=S.d.width[i];for(let k=0;k<w*4;k++){let x=a.x+k%w*a.w/w,y=a.y+Math.floor(k/w)*a.h/4;rr(c,x+3,y+3,a.w/w-6,a.h/4-6,6,S.d.p[i][k]?COL[i]:'#dbe3df');if(S.d.p[i][k])rr(c,x+a.w/w*.25,y+a.h/4*.3,a.w/w*.5,a.h/4*.4,3,'#ffffffbb');}});}});
register('ghost',{init(){S.d.p=many(()=>Array.from({length:3+mi()},()=>({x:rand(.15,.85),y:rand(.2,.8),caught:false})));S.d.flash=0;},tap(i,p){let d=S.d,q=localPoint(i,p),visible=d.flash>.05||S.elapsed%5<.7;let o=d.p[i].find(o=>dist(o,q)<.16&&!o.caught);if(visible&&o){gain(i,3);o.x=rand(.1,.9);o.y=rand(.2,.8);}else gain(i,-1);d.flash=.65;d.cool[i]=.45;},update(dt){S.d.flash=Math.max(0,S.d.flash-dt);S.d.p.forEach((arr,i)=>arr.forEach((o,k)=>o.x=clamp(o.x+Math.sin(S.elapsed+k)*dt*(mi()===1?.14:.04),.1,.9)));},draw(){many(i=>{let a=panel(i),v=S.d.flash>.05||S.elapsed%5<.7;rr(c,a.x+4,a.y+4,a.w-8,a.h-8,10,v?'#dce4ef':'#253240');label(v?'QUICK! PHOTOGRAPH THEM':'WAIT FOR A FLASH',a.x+a.w/2,a.y+22,12,v?INK:'#b5c4d4');if(v)S.d.p[i].forEach(o=>label('👻',a.x+o.x*a.w,a.y+o.y*a.h,34));});}});
register('spaghetti',{init(){S.d.p=many(()=>({length:0,tension:0}));},up(i){let p=S.d.p[i];if(p.tension<.85&&p.length>0)gain(i,Math.floor(p.length));else if(p.tension>=.85)gain(i,-2);p.length=p.tension=0;},update(dt){many(i=>{let p=S.d.p[i];if(S.held[i]){p.length+=dt*(2+mi());p.tension+=dt*(.18+S.held.filter(Boolean).length*.04+mi()*.04);if(p.tension>1.1){gain(i,-2);p.length=p.tension=0;S.held[i]=false;}}else p.tension=Math.max(0,p.tension-dt*.3);});},draw(){dot(300,300,140,'#e9d3aa');for(let k=0;k<12;k++){c.beginPath();c.ellipse(300+Math.sin(k)*40,300+Math.cos(k)*40,75,30,k,0,7);c.strokeStyle='#c49138';c.lineWidth=5;c.stroke();}many(i=>{let a=anchor(i),p=S.d.p[i];path(a,{x:300+Math.sin(i)*40,y:300},COL[i],3+p.length);label(Math.floor(p.length)+' BITES · '+Math.round(p.tension*100)+'% TENSION',a.x,a.y+(isTop(i)?40:-40),14,p.tension>.8?'#b82825':COL[i]);});}});
register('planet',{init(){S.d.p=many(i=>({x:150+i*90,y:220+i*25}));S.d.ball={x:300,y:180,vx:65,vy:20};},move(i,p){S.d.p[i]={x:clamp(p.x,60,540),y:clamp(p.y,100,500)};},tap(i,p){this.move(i,p);},update(dt){let d=S.d,b=d.ball;d.p.forEach(o=>{let l=Math.max(50,dist(b,o)),f=220000/(l*l);b.vx+=(o.x-b.x)/l*f*dt;b.vy+=(o.y-b.y)/l*f*dt;});b.vx=clamp(b.vx,-180,180);b.vy=clamp(b.vy,-180,180);b.x+=b.vx*dt;b.y+=b.vy*dt;if(dist(b,{x:300,y:300})<30+mi()*7){b.vx*=-1;b.vy*=-1;}if(b.x<40||b.x>560||b.y<90||b.y>510){let i=nearestPlayer(b);gain(i,4);b.x=300;b.y=180;b.vx=rand(-90,90);b.vy=30;}},draw(){rr(c,35,85,530,430,18,'#182b47');itemDraw({x:300,y:300},'☀️',50+mi()*10);S.d.p.forEach((p,i)=>{circ(c,p.x,p.y,34,null,COL[i],2);dot(p.x,p.y,18,COL[i]);label(i+1,p.x,p.y,16,'white');});itemDraw(S.d.ball,'🛸',30);}});
register('candle',{init(){S.d.p=many(()=>({flame:100,charge:0}));S.d.wind=0;},up(i){let d=S.d,p=d.p[i],j=(i+1)%S.n;if(S.n===1){if(p.charge>.25&&p.charge<.85)gain(i,Math.round(p.charge*5));else gain(i,-1);}else{d.p[j].flame-=p.charge*(mi()===2?17:28);if(d.p[j].flame<=0){gain(i,5);gain(j,-2);d.p[j].flame=100;}}p.charge=0;},update(dt){many(i=>{let p=S.d.p[i];if(S.held[i]){p.charge+=dt*(mi()===1?.85:.6);if(p.charge>1){gain(i,-1);p.flame-=10;p.charge=0;}}p.flame=Math.min(100,p.flame+dt*2);});},draw(){many(i=>{let a=panel(i),p=S.d.p[i];label('🕯️',a.x+a.w/2,a.y+a.h*.4,60);label('FLAME '+Math.ceil(p.flame)+'% · GUST '+Math.round(p.charge*100)+'%',a.x+a.w/2,a.y+a.h*.72,16,COL[i]);rr(c,a.x+20,a.y+a.h-30,(a.w-40)*clamp(p.charge,0,1),12,5,p.charge>.85?COL[1]:COL[i]);});}});
register('octopus',{init(){S.d.body={x:300,y:300};S.d.p=many(()=>({x:rand(180,420),y:rand(200,400)}));S.d.tips=many(i=>anchor(i));S.d.carry=many(()=>false);},tap(i,p){S.d.tips[i]=p;},move(i,p){let d=S.d;d.tips[i]=p;if(dist(p,d.p[i])<45)d.carry[i]=true;if(d.carry[i]){d.p[i]={...p};if(dist(p,anchor(i))<70){gain(i,4);d.carry[i]=false;d.p[i]={x:rand(180,420),y:rand(200,400)};}}let b=d.body,l=dist(p,b);if(l>160+mi()*20){b.x+=(p.x-b.x)*.02;b.y+=(p.y-b.y)*.02;d.p.forEach((o,j)=>{if(j!==i&&!d.carry[j]){o.x=clamp(o.x+(p.x-b.x)*.006,65,535);o.y=clamp(o.y+(p.y-b.y)*.006,110,490);}});}},up(i){S.d.carry[i]=false;},draw(){itemDraw(S.d.body,'🐙',80);many(i=>{path(S.d.body,S.d.tips[i],COL[i],14);dot(S.d.tips[i].x,S.d.tips[i].y,13,COL[i]);itemDraw(S.d.p[i],'🍽️',32);dot(S.d.p[i].x,S.d.p[i].y+20,7,COL[i]);let a=anchor(i);circ(c,a.x,a.y,33,null,COL[i],3);});}});
register('sunshine',{init(){S.d.p=many(()=>({h:30,bend:0,energy:0}));S.d.sun=100;},move(i,p){S.d.p[i].bend=(localPoint(i,p).x-.5)*100;},tap(i,p){this.move(i,p);},update(dt){S.d.sun=300+Math.sin(S.elapsed*.28)*(200-mi()*40);many(i=>{let p=S.d.p[i];if(S.held[i])p.h+=dt*14;let x=80+(i+.5)*440/S.n+p.bend,lit=Math.abs(x-S.d.sun)<120,shadow=S.d.p.some((o,j)=>j!==i&&o.h>p.h&&Math.abs((80+(j+.5)*440/S.n+o.bend)-x)<65);if(lit&&!shadow){p.energy+=dt;if(p.energy>1){gain(i,1);p.energy=0;}}if(p.h>180-mi()*25){gain(i,-2);p.h=30;}});},draw(){itemDraw({x:S.d.sun,y:135},'☀️',65);path({x:40,y:500},{x:560,y:500},'#73946b',12);many(i=>{let p=S.d.p[i],x=80+(i+.5)*440/S.n;path({x,y:500},{x:x+p.bend,y:500-p.h},COL[i],10);itemDraw({x:x+p.bend,y:500-p.h},'🌻',40);label('P'+(i+1),x,525,15,COL[i]);});}});
register('gift',{init(){S.d.phase='build';S.d.p=many(()=>null);S.d.wrap=many(()=>null);S.d.picked=new Set();S.d.round=0;},tap(i,p){let d=S.d,q=localPoint(i,p);if(d.phase==='build'){if(d.p[i]===null)d.p[i]=q.x<.5?'treat':'trap';else d.wrap[i]=Math.floor(q.x*4);if(d.wrap.every(v=>v!==null))d.phase='pick';}else{if(d.picked.has(i))return;let j=clamp(Math.floor(q.x*S.n),0,S.n-1);if(S.n>1&&j===i)return;if(d.p[j]==='treat')gain(i,3);else{gain(i,-1);gain(j,2+mi());}d.picked.add(i);if(d.picked.size===S.n){d.phase='build';d.p=many(()=>null);d.wrap=many(()=>null);d.picked.clear();d.round++;}}d.cool[i]=.35;},draw(){many(i=>{let a=panel(i),d=S.d;label(d.phase==='build'?(d.p[i]===null?'CHOOSE: TREAT | TRAP':'CHOOSE WRAPPING COLOUR'):'PICK ANOTHER PLAYER’S GIFT',a.x+a.w/2,a.y+30,13);if(d.phase==='pick'){many(j=>{let x=a.x+(j+.5)*a.w/S.n;rr(c,x-22,a.y+a.h/2-25,44,50,7,COL[d.wrap[j]]);label('P'+(j+1),x,a.y+a.h/2+42,15);});}else{let count=d.p[i]===null?2:4;for(let j=0;j<count;j++){rr(c,a.x+j*a.w/count+5,a.y+a.h*.45,a.w/count-10,a.h*.4,8,count===4?COL[j]:'#e3d1b3');if(count===2)label(j?'💥':'🍬',a.x+(j+.5)*a.w/count,a.y+a.h*.65,30);}}});}});
register('tide',{init(){S.d.p=many(()=>({x:0,going:0,loot:0}));S.d.tide=0;},tap(i){let p=S.d.p[i];p.going=p.going===1?-1:1;S.d.cool[i]=.25;},update(dt){let d=S.d;d.tide=(Math.sin(S.elapsed*(.55+mi()*.15))+1)/2;many(i=>{let p=d.p[i];p.x+=p.going*dt*(.25-mi()*.025);if(p.x>.65&&p.going===1){p.loot=5;p.going=-1;}if(p.x<=0){if(p.loot){gain(i,p.loot);p.loot=0;}p.x=0;p.going=0;}if(p.x>1-d.tide*.7){gain(i,-2);p.x=0;p.loot=0;p.going=0;}});},draw(){many(i=>{let a=panel(i),p=S.d.p[i];rr(c,a.x,a.y,a.w,a.h,10,'#ead8af');rr(c,a.x+a.w*(1-S.d.tide*.7),a.y,a.w*S.d.tide*.7,a.h,5,'#82c6d0');label('💰',a.x+a.w*.7,a.y+a.h/2,32);label('🦀',a.x+20+p.x*(a.w-40),a.y+a.h/2,35);label(p.loot?'RETURN WITH '+p.loot:'TAP TO RAID / RETURN',a.x+a.w/2,a.y+25,14);});}});
register('orchard',{init(){S.d.p=many(()=>Array.from({length:5+mi()},()=>({x:rand(.1,.9),y:rand(.2,.85),ripe:0})));S.d.lamp=many(()=>({x:.5,y:.5}));},move(i,p){S.d.lamp[i]=localPoint(i,p);},tap(i,p){let q=localPoint(i,p);S.d.lamp[i]=q;let fruit=S.d.p[i].find(o=>dist(o,q)<.16&&o.ripe>=1);if(fruit){gain(i,3);fruit.ripe=0;fruit.x=rand(.1,.9);fruit.y=rand(.2,.85);}},update(dt){many(i=>S.d.p[i].forEach(o=>{o.ripe=clamp(o.ripe+(dist(o,S.d.lamp[i])<.24-mi()*.03?dt*.8:-dt*.1),0,1);}));},draw(){many(i=>{let a=panel(i),l=S.d.lamp[i];rr(c,a.x,a.y,a.w,a.h,10,'#233e36');c.save();c.beginPath();c.rect(a.x+2,a.y+2,a.w-4,a.h-4);c.clip();dot(a.x+l.x*a.w,a.y+l.y*a.h,a.w*(.24-mi()*.03),'#c9ba6455');c.restore();S.d.p[i].forEach(o=>{let x=a.x+o.x*a.w,y=a.y+o.y*a.h;label(o.ripe>=1?'🍎':'●',x,y,o.ripe>=1?28:20,o.ripe>=1?'#ce563a':'#729267');});label('LIGHT TO RIPEN · TAP TO PICK',a.x+a.w/2,a.y+20,12,'#dde8db');});}});
register('heat',{init(){S.d.heat=20;S.d.p=many(()=>0);},up(i){let d=S.d;if(d.heat>=45&&d.heat<=80){gain(i,Math.floor(d.p[i]));d.heat-=8;}else if(d.p[i]>1)gain(i,-1);d.p[i]=0;},update(dt){let d=S.d;d.heat-=dt*(5+mi()*2);many(i=>{if(S.held[i]){d.heat+=dt*(14+mi()*4);d.p[i]+=dt*2;}});d.heat=Math.max(0,d.heat);if(d.heat>100){many(i=>{if(d.p[i]>0)gain(i,-2);});d.p=many(()=>0);d.heat=20;}},draw(){rr(c,200,135,200,330,20,'#d4d8d8');rr(c,225,435-S.d.heat*2.7,150,S.d.heat*2.7,10,S.d.heat>80?COL[1]:S.d.heat>=45?COL[2]:'#e3ae43');label(Math.round(S.d.heat)+'°',300,175,36);label('BANK AT 45–80°',300,480,20);many(i=>{let a=anchor(i);label('UNBANKED '+Math.floor(S.d.p[i]),a.x,a.y+(isTop(i)?40:-40),15,COL[i]);});}});
register('parcel',{init(){S.d.votes=many(()=>-1);S.d.parcel=Math.floor(rand(0,S.n));S.d.countdown=4-mi()*.5;S.d.round=0;},tap(i,p){S.d.votes[i]=Math.floor(localPoint(i,p).x*3);},update(dt){let d=S.d;d.countdown-=dt;if(d.countdown<=0){let counts=[0,0,0];d.votes.forEach(v=>{if(v>=0)counts[v]++;});let max=Math.max(...counts),ties=[0,1,2].filter(k=>counts[k]===max),win=ties[d.round%ties.length];many(i=>{if(d.votes[i]===win&&win===d.parcel%3)gain(i,mi()===2?4:2);});d.round++;d.votes=many(()=>-1);d.parcel=Math.floor(rand(0,3));d.countdown=4-mi()*.5;}},draw(){label('📦 ROUTE '+(S.d.parcel%3+1)+' · VOTE IN '+Math.ceil(S.d.countdown)+'s',300,290,25);many(i=>{let a=arena(i);for(let k=0;k<3;k++){let x=a.x+(k+.5)*a.w/3,y=a.y+a.h*.65;rr(c,x-a.w/6+5,y-30,a.w/3-10,60,8,S.d.votes[i]===k?COL[i]:'#d6ddd8');label(k+1,x,y,25,S.d.votes[i]===k?'white':INK);}});}});
register('echo',{init(){S.d.p=many(()=>({x:rand(.15,.85),y:rand(.25,.75)}));S.d.visible=many(()=>2);},tap(i,p){let a=arena(i),q=localPoint(i,p);if(q.y>.8){S.d.visible[i]=mi()===2?.6:1.3;gain(i,-1);}else if(dist(q,S.d.p[i])<.13){gain(i,4);S.d.p[i]={x:rand(.15,.85),y:rand(.25,.75)};S.d.visible[i]=0;}else gain(i,-1);S.d.cool[i]=.25;},update(dt){S.d.visible=S.d.visible.map(v=>Math.max(0,v-dt));if(mi()===1)many(i=>{S.d.p[i].x=clamp(S.d.p[i].x+Math.sin(S.elapsed+i)*dt*.03,.1,.9);});},draw(){many(i=>{let a=panel(i),p=S.d.p[i];rr(c,a.x+6,a.y+6,a.w-12,a.h-12,8,'#d7e1e7');if(S.d.visible[i]>0)label('🔔',a.x+p.x*a.w,a.y+p.y*a.h,35);label('PING −1',a.x+a.w/2,a.y+a.h*.9,17,COL[i]);});}});
// Maps and shared tournament lifecycle.
function pickMap(id){let g=games.find(g=>g.id===id),k=forcedMap;forcedMap=null;if(k===null||k===undefined||k<0){let eligible=g.maps.map((_,i)=>i).filter(i=>i!==mapHistory[id]);k=chosen(eligible.length?eligible:[0]);}k=clamp(k,0,g.maps.length-1);mapHistory[id]=k;return k;}
function applyMap(){let id=S.g.id,k=mi(),d=S.d;if(S.g.prototype){if(id==='room'&&k===1)d.width=many(()=>4);return;}if(!k)return;
if(id==='rally')d.spawn=d.spawn.map(()=>.3);
if(id==='memory'){d.peek=1.6;}
if(id==='connect'){// Two neutral-position opening counters, never a completed line.
 d.board[5][1]=0;d.board[5][5]=Math.min(1,S.n-1);
}
if(id==='boxes'){d.edges['h0,0']=0;d.edges['v0,0']=0;}
}
// Base map gameplay modifications keep the original ten engines intact.
const baseStep=step;step=function(dt){if(S&&active()&&mi()===1&&!S.g.prototype){let d=S.d,id=S.g.id;
if(id==='sumo')d.p.forEach((p,i)=>{p.vx+=Math.sin(S.elapsed*.7+i)*dt*.035;p.vy+=Math.cos(S.elapsed*.7+i)*dt*.035;});
if(id==='hockey'&&d.ball){let b=d.ball,dx=b.x-.5,dy=b.y-.5,l=Math.hypot(dx,dy);if(l<.09){let nx=dx/(l||1),ny=dy/(l||1),v=b.vx*nx+b.vy*ny;b.x=.5+nx*.095;b.y=.5+ny*.095;if(v<0){b.vx-=2*v*nx;b.vy-=2*v*ny;}}}
if(id==='rally'){d.spawn=d.spawn.map(v=>v-dt*.35);}if(id==='target'){d.target=d.target.map((v,i)=>.5+Math.sin(S.elapsed*.9+i)*.25);}
if(id==='memory')d.peek=Math.max(0,(d.peek||0)-dt);
if(['draw','color','target','rhythm'].includes(id))dt*=id==='rhythm'?1.18:1.3;
}baseStep(dt);};
const baseRender=render;render=function(){baseRender();if(!S)return;if(!S.g.prototype&&mi()===1){if(S.g.id==='hockey'){circ(c,W/2,H/2,Math.min(W,H)*.07,'#526d80','#d9e9eb',4);}if(S.g.id==='memory'&&S.d.peek>0){let g=memGeom();S.d.cards.forEach((v,k)=>{let x=g.x+(k%4+.5)*g.cell,y=g.y+(Math.floor(k/4)+.5)*g.cell;symbol(c,typeof v==='object'?v.v??v.n??0:v,x,y,g.cell*.2,COL[0]);});}}};
const originalHomeUI=homeUI;homeUI=function(){originalHomeUI();if(prefs.humans===1)$('hint').textContent='Solo challenges · classics include a bot';};homeUI();
const oldGoHome=goHome;goHome=function(){if(cup){modal('<h2 id="modal-title">Leave this tournament?</h2><p>Current tournament progress will be discarded.</p><button class="primary" id="cup-leave-confirm">Leave tournament</button><button class="secondary" id="cup-leave-cancel">Keep playing</button>');$('cup-leave-confirm').onclick=()=>{cup=null;oldGoHome();};$('cup-leave-cancel').onclick=()=>{if(S&&!S.ended){S.paused=false;pause();}else cupIntro();};return;}oldGoHome();};
function htmlSafe(s){return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function mapOptions(g,random=true){return(random?'<option value="-1">Random · no immediate repeats</option>':'')+g.maps.map((m,i)=>'<option value="'+i+'">'+m+'</option>').join('');}
rules=function(id){let g=games.find(v=>v.id===id);modal('<div class="game-symbol" style="background:'+g.bg+'">'+(g.emoji||'✦')+'</div><div class="modal-tag">'+g.tag+' · '+prefs.humans+' PLAYER'+(prefs.humans===1?'':'S')+'</div><h2 id="modal-title">'+g.name+'</h2><p>'+g.rule+'</p><p class="note">'+g.goal+'</p><label class="field">Map<select id="map-choice">'+mapOptions(g)+'</select></label>'+(g.prototype?'<p class="proto-note">Playable prototype · mechanics and tuning are still in development.</p>':'')+'<button class="primary" id="start">Let’s play →</button><button class="secondary" id="cancel">Back to games</button>');$('start').onclick=()=>{forcedMap=+$('map-choice').value;close();start(id);};$('cancel').onclick=close;};
function drawLibrary(filter=''){let f=filter.toLowerCase();$('grid').innerHTML=games.filter(g=>(g.name+' '+g.tag).toLowerCase().includes(f)).map(g=>{let i=games.indexOf(g);return '<button class="card '+(g.prototype?'new-card':'')+'" data-game="'+g.id+'">'+(g.prototype?'<div class="concept-art" style="background:'+g.bg+'"><span>'+g.emoji+'</span><b>'+String(i+1).padStart(2,'0')+'</b><small>LAB COLLECTION</small></div>':'<img src="assets/art/'+g.id+'.webp" alt="" loading="lazy">')+'<div><strong>'+g.name+'</strong><small>'+g.tag+' · '+g.maps.length+' MAPS</small></div></button>';}).join('');document.querySelectorAll('.card[data-game]').forEach(b=>b.onclick=()=>rules(b.dataset.game));}
drawLibrary();$('random').onclick=()=>rules(chosen(games).id);
$('home').querySelector('.party-banner p').textContent='40 games. One screen. Your party.';
$('home').querySelector('.section-title small').textContent='40 GAMES · 110 MAPS';
const libraryTools=document.createElement('div');libraryTools.className='library-tools';libraryTools.innerHTML='<label class="search-field">Find your next favourite<input id="library-search" placeholder="Search games or mechanics…" type="search"></label><span class="lab-label">10 CLASSICS + 30 PLAYABLE PROTOTYPES</span>';$('grid').before(libraryTools);$('library-search').oninput=e=>drawLibrary(e.target.value);
const cupButton=document.createElement('button');cupButton.id='tournament';cupButton.className='cup-banner';cupButton.innerHTML='<span class="cup-icon">🏆</span><span><b>Make it a tournament.</b><small>Your games. Your rounds. One trophy.</small></span><span>↗</span>';$('random').after(cupButton);cupButton.onclick=()=>cupSetup();
function cupSetup(){modal('<div class="modal-tag">THE POCKET PARTY CUP</div><h2 id="modal-title">Build your tournament.</h2><p>'+seatCount()+' player'+(seatCount()===1?' · solo score challenge':'s · placement scoring')+'</p><label class="field">Round count<select id="round-preset"><option>3</option><option selected>5</option><option>10</option><option value="custom">Custom</option></select></label><label class="field hidden" id="custom-wrap">Custom rounds (1–40)<input id="custom-rounds" type="number" min="1" max="40" value="7"></label><label class="field">Game selection<select id="cup-mode"><option value="random">Random mix · all 40 games</option><option value="pool">Random from my selected pool</option><option value="playlist">Build a round-by-round playlist</option></select></label><div id="cup-picks"></div><button class="primary" id="cup-begin">Create tournament →</button><button class="secondary" id="cup-cancel">Back</button>');
const count=()=>$('round-preset').value==='custom'?clamp(Math.round(+$('custom-rounds').value)||1,1,40):+$('round-preset').value;
function picks(){let mode=$('cup-mode').value,box=$('cup-picks');if(mode==='playlist'&&box.querySelectorAll('.playlist-row').length===count())return;if(mode==='pool'&&box.querySelector('.pool-list'))return;if(mode==='pool'){box.innerHTML='<p>Choose at least one game. Maps are random.</p><div class="pool-list">'+games.map(g=>'<label><input type="checkbox" value="'+g.id+'" checked>'+g.name+'</label>').join('')+'</div>';}else if(mode==='playlist'){box.innerHTML='<p>Choose each game and map.</p>'+Array.from({length:count()},(_,i)=>'<div class="playlist-row"><b>'+(i+1)+'</b><select aria-label="Round '+(i+1)+' game" class="playlist-game">'+games.map(g=>'<option value="'+g.id+'">'+g.name+'</option>').join('')+'</select><select aria-label="Round '+(i+1)+' map" class="playlist-map">'+mapOptions(games[0])+'</select></div>').join('');box.querySelectorAll('.playlist-game').forEach(sel=>sel.onchange=()=>{sel.nextElementSibling.innerHTML=mapOptions(games.find(g=>g.id===sel.value));});}else box.innerHTML='<p class="note">Games are drawn without repeats until the library has been used. Each round gets a random map.</p>';}
$('round-preset').onchange=()=>{$('custom-wrap').classList.toggle('hidden',$('round-preset').value!=='custom');picks();};$('custom-rounds').onchange=picks;$('cup-mode').onchange=picks;picks();$('cup-cancel').onclick=close;
$('cup-begin').onclick=()=>{let mode=$('cup-mode').value,ids=games.map(g=>g.id),rounds=[];if(mode==='pool'){ids=[...document.querySelectorAll('.pool-list input:checked')].map(e=>e.value);if(!ids.length){let note=$('pool-error');if(!note){note=document.createElement('p');note.id='pool-error';note.setAttribute('role','alert');$('cup-picks').appendChild(note);}note.textContent='Select at least one game.';return;}}if(mode==='playlist'){rounds=[...document.querySelectorAll('.playlist-game')].map(sel=>({id:sel.value,map:+sel.nextElementSibling.value}));}else{let bag=[];for(let i=0;i<count();i++){if(!bag.length)bag=shuffle(ids.slice());if(bag.length>1&&bag.at(-1)===rounds.at(-1)?.id)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];rounds.push({id:bag.pop(),map:-1});}}cup={rounds,index:0,scores:Array(seatCount()).fill(0),history:[]};cupIntro();};}
function cupIntro(){let r=cup.rounds[cup.index],g=games.find(g=>g.id===r.id);if(r.map<0)r.map=pickMap(r.id);modal('<div class="large-star">🏆</div><div class="modal-tag">ROUND '+(cup.index+1)+' OF '+cup.rounds.length+'</div><h2 id="modal-title">'+g.name+'</h2><p><b>'+g.maps[r.map]+'</b></p><p>'+g.rule+'</p><p class="note">'+g.goal+'</p><button class="primary" id="cup-play">Play round →</button>');$('cup-play').onclick=()=>{forcedMap=r.map;close();start(r.id);};}
function cupFinish(winners){S.ended=true;S.held.fill(false);if(window.GameAssets)GameAssets.music.pause();let s=S.scores.slice(0,seatCount());if(seatCount()===1)cup.scores[0]+=s[0];else{s.forEach((v,i)=>{let rank=s.filter(n=>n>v).length;cup.scores[i]+=Math.max(0,seatCount()-1-rank);});}cup.history.push({game:S.g.id,map:S.mapName,scores:s});cup.index++;let final=cup.index>=cup.rounds.length;let standings=cup.scores.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v);modal('<div class="large-star">'+(final?'🏆':'★')+'</div><div class="modal-tag">'+(final?'FINAL PODIUM':'ROUND COMPLETE · '+cup.index+'/'+cup.rounds.length)+'</div><h2 id="modal-title">'+(final?(seatCount()===1?'Challenge complete!':standings.filter(r=>r.v===standings[0].v).length>1?'Shared champions!':pname(standings[0].i)+' takes the cup!'):'The standings.')+'</h2><p>'+S.g.name+' · '+S.mapName+'</p>'+standings.map((r,k)=>'<div class="row"><span style="color:'+COL[r.i]+'">'+(final&&k===0?'★ ':'')+pname(r.i)+'</span><b>'+r.v+' '+(seatCount()===1?'score':'pts')+'</b></div>').join('')+'<button class="primary" id="cup-next">'+(final?'Replay this tournament':'Next round →')+'</button><button class="secondary" id="cup-exit">Back to library</button>');$('cup-next').onclick=()=>{if(final){cup.index=0;cup.scores.fill(0);cup.history=[];}cupIntro();};$('cup-exit').onclick=()=>{cup=null;oldGoHome();};}
function extensionInput(){const orig={down:canvas.onpointerdown,move:canvas.onpointermove,up:canvas.onpointerup,cancel:canvas.onpointercancel,lost:canvas.onlostpointercapture};function pt(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*600};}canvas.onpointerdown=e=>{if(!S?.g.prototype)return orig.down?.(e);if(!active())return;e.preventDefault();let p=pt(e),i=nearestPlayer(p);if(i>=prefs.humans)return;if([...inputPoints.values()].some(v=>v.i===i))return;canvas.setPointerCapture(e.pointerId);inputPoints.set(e.pointerId,{i,p});S.held[i]=true;engines[S.g.id].tap(i,p);window.StudioAudio?.effect('tap');};canvas.onpointermove=e=>{if(!S?.g.prototype)return orig.move?.(e);let v=inputPoints.get(e.pointerId);if(!active()||!v)return;e.preventDefault();v.p=pt(e);engines[S.g.id].move(v.i,v.p);};function release(e){if(!S?.g.prototype){orig.up?.(e);return;}let v=inputPoints.get(e.pointerId);if(v&&active()){engines[S.g.id].up(v.i,pt(e));window.StudioAudio?.effect(['candle','tongue','kite'].includes(S.g.id)?'wind':['sea','potion','octopus'].includes(S.g.id)?'water':'metal');}if(v&&S)S.held[v.i]=false;inputPoints.delete(e.pointerId);}canvas.onpointerup=release;canvas.onpointercancel=e=>{let v=inputPoints.get(e.pointerId);if(v&&S)S.held[v.i]=false;inputPoints.delete(e.pointerId);if(!S?.g.prototype)orig.cancel?.(e);};canvas.onlostpointercapture=e=>{if(inputPoints.has(e.pointerId))canvas.onpointercancel(e);};window.addEventListener('blur',()=>{inputPoints.clear();S?.held.fill(false);});document.addEventListener('visibilitychange',()=>{if(document.hidden){inputPoints.clear();S?.held.fill(false);}});}
window.addEventListener('load',extensionInput);
// Test hooks contain no time manipulation or production-only shortcuts.
window.Expansion={get cup(){return cup;},cupSetup,selectMap(k){forcedMap=k;},get mapHistory(){return mapHistory;},catalog};

/* Painted Studio pass: authored scene composition and human/bot controls. */
prefs.bots=clamp(Math.round(prefs.bots||0),0,4-prefs.humans);prefs.consistency=prefs.consistency||'steady';prefs.musicVolume=prefs.musicVolume??.25;prefs.effectsVolume=prefs.effectsVolume??.55;
function seatCount(g){let n=prefs.humans+(prefs.bots||0);return g&&!g.prototype?Math.max(2,n):Math.max(1,n);}
function actualBotCount(){return S?Math.max(0,S.n-prefs.humans):prefs.bots||0;}
function ratio(){return H/W;}const A4=()=>window.StudioArt;
function artImage(id,x,y,w,h){return A4()?.draw(c,id,x,y,w,h);}
const mapLooks={skyhook:['skyhook','planet','wobble'],fossil:['fossil','gravity','mole'],elevator:['elevator','mole','heat'],wobble:['wobble','heat','gravity'],unravel:['unravel','tailor','gift'],kite:['kite','echo','sunshine'],gravity:['gravity','golem','planet'],tumble:['tumble','wobble','room'],moss:['moss','tongue','sunshine'],choir:['choir','orchard','kite'],potion:['potion','heat','sea'],mole:['mole','fossil','elevator'],tailor:['tailor','unravel','gift'],sea:['sea','tongue','planet'],golem:['golem','gravity','fossil'],suitcase:['suitcase','parcel','room'],tongue:['tongue','moss','kite'],room:['room','suitcase','tumble'],ghost:['ghost','orchard','golem'],spaghetti:['spaghetti','room','tumble'],planet:['planet','sea','gravity'],candle:['candle','ghost','gift'],octopus:['octopus','sea','spaghetti'],sunshine:['sunshine','kite','moss'],gift:['gift','tailor','suitcase'],tide:['tide','tongue','fossil'],orchard:['orchard','choir','ghost'],heat:['heat','elevator','wobble'],parcel:['parcel','suitcase','elevator'],echo:['echo','golem','sea']};
const darkWorld=new Set(['sea','planet','ghost','orchard','potion','unravel','gift','tumble']);
function themed(id=S.g.id){return(mapLooks[id]||[id])[mi()]||id;}
function text4(t,x,y,size=22,col='#203543',max=520){c.save();c.scale(1,1/ratio());c.font='700 '+size+'px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(String(t),x,y*ratio(),max);c.restore();}
function plaque(t,x,y,w=230,col='#203543',bg='#fff8e9',size=20){let hh=40/ratio();rr(c,x-w/2,y-hh/2,w,hh,9,bg,'#9b8b6a66');text4(t,x,y,size,col,w-14);}
function sprite(id,x,y,size=65,owner=null,angle=0){c.save();c.translate(x,y);c.scale(1,1/ratio());c.rotate(angle);c.shadowColor='#172e3933';c.shadowBlur=5;c.shadowOffsetY=3;artImage('sprite-'+id,-size/2,-size/2,size,size);c.shadowBlur=0;if(owner!==null){circ(c,size*.31,size*.31,11,COL[owner],'#fff7e9',2);txt(c,owner+1,size*.31,size*.31,15,'white');}c.restore();}
function surface(id=S.g.id,a={x:20,y:62,w:560,h:476},veil=0){let theme=(mapLooks[id]||[id])[mi()]||id;c.save();rr(c,a.x,a.y,a.w,a.h,14,null);c.clip();artImage('board-'+theme,a.x,a.y,a.w,a.h);if(veil){c.fillStyle='#fff8e8';c.globalAlpha=veil;c.fillRect(a.x+18,a.y+18,a.w-36,a.h-36);}c.restore();return a;}
function playerPanel(i,veil=.15){let a=arena(i);surface(S.g.id,a,veil);return a;}
const feedback4=[];const priorScore4=score;score=function(i,v){if(v===0){tone(430);return;}priorScore4(i,v);if(S?.g.prototype)feedback4.push({i,v,at:S.elapsed,state:S});};
function stage(fn){return function(){c.save();c.scale(W/600,H/600);surface(S.g.id,{x:0,y:0,w:600,h:600});fn();for(let f of feedback4.filter(f=>f.state===S&&S.elapsed-f.at<.85)){let a=anchor(f.i),t=S.elapsed-f.at;text4((f.v>0?'+':'')+f.v,a.x,a.y+(isTop(f.i)?1:-1)*(45+t*25),30,f.v>0?'#fff5c0':'#ffbbb0',100);}while(feedback4.length>60)feedback4.shift();c.restore();};}
function station(i,action='TOUCH'){let a=anchor(i),hh=43/ratio();rr(c,a.x-91,a.y-hh/2,182,hh,10,COL[i],'#fff8e9aa');text4(pname(i)+' · '+action,a.x,a.y,21,'#ffffff',169);}
function allStations(action='TOUCH'){many(i=>station(i,action));}
function ring(x,y,r,color){circ(c,x,y,r,null,color,4);}
function uiTile(x,y,w,h,active=false,i=0){rr(c,x,y,w,h,7,active?COL[i]:'#fff7e7e8',active?'#fff8e9':'#b8a68a');}
function physicalLine(a,b,col,w=3){path(a,b,col,w);}
// Every new scene is individually composed. Labels remain outside the live play area.
engines.skyhook.draw=stage(()=>{let d=S.d;d.hook.forEach((k,i)=>{if(k>=0)path(anchor(i),d.scrap[k],COL[i],4);});d.scrap.forEach((o,k)=>{sprite('skyhook',o.x,o.y,88);plaque(o.v,o.x+29,o.y+27/ratio(),32,'#443218','#fff1c7',18);});allStations('REEL');});
engines.fossil.draw=stage(()=>{many(i=>{let a=playerPanel(i,0);for(let k=0;k<25;k++){let x=a.x+(k%5)*a.w/5,y=a.y+Math.floor(k/5)*a.h/5,v=S.d.tiles[i][k];c.save();c.beginPath();c.rect(x+3,y+3,a.w/5-6,a.h/5-6);c.clip();if(v===2){c.fillStyle='#e8d7a6';c.fillRect(x,y,a.w/5,a.h/5);if(S.d.bones[i].has(k))sprite('fossil',x+a.w/10,y+a.h/10,Math.min(a.w/5-10,a.h/5*ratio()-5));}else{artImage('board-fossil',x-a.w*.3,y-a.h*.3,a.w*1.8,a.h*1.8);if(v){c.strokeStyle='#665035';c.lineWidth=3;c.beginPath();c.moveTo(x+8,y+8);c.lineTo(x+a.w/10,y+a.h/10);c.lineTo(x+a.w/5-10,y+a.h/5-8);c.stroke();}}c.restore();rr(c,x+3,y+3,a.w/5-6,a.h/5-6,5,null,'#735b3a88');}});allStations('EXCAVATE');});
engines.elevator.draw=stage(()=>{let d=S.d,floors=5+mi();for(let f=0;f<floors;f++){let y=480-f*55;rr(c,80,y-16,440,31,5,'#dcc395bb','#634a2d');plaque('F'+f,58,y,48);if(f!==d.floor)rr(c,270,y-14,60,28,5,'#392e2399');}let cy=472-d.floor*55;rr(c,215,cy-30,170,60,8,'#dab879','#503a25');for(let k=0;k<d.load.length;k++)sprite('elevator',245+k%3*48,cy+(Math.floor(k/3)-.5)*20,37,d.load[k].i);many(i=>{let a=anchor(i),q=d.wait[i];sprite('elevator',a.x+(isTop(i)?-120:120),isTop(i)?110:485,75,i);plaque('BOARD '+q.w+'kg → F'+q.to+'  |  NEXT FLOOR',a.x,a.y+(isTop(i)?34:-34),S.n>2?260:390,COL[i]);});allStations('BOARD / MOVE');});
engines.wobble.draw=stage(()=>{many(i=>{let a=playerPanel(i,0);sprite('wobble',a.x+35,a.y+29,53,i);S.d.ramps[i].forEach(r=>{c.save();c.translate(r.x,r.y);c.scale(1,1/ratio());c.rotate(Math.atan(r.slope*ratio()));artImage('sprite-ramp',-55,-17,110,34);c.restore();});sprite('plate',a.x+a.w-37,a.y+a.h-43,58);if(S.d.ball[i])sprite('marble',S.d.ball[i].x,S.d.ball[i].y,25);plaque('RUN TEST',a.x+a.w/2,a.y+a.h-21,160,COL[i]);});allStations('BUILD');});
engines.unravel.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),p=S.d.p[i],o=S.d.order[i],pos=k=>({x:a.x+p[k].x*a.w,y:a.y+p[k].y*a.h});for(let k=0;k<o.length;k++){path(pos(o[k]),pos(o[(k+1)%o.length]),'#fff4d8',6);path(pos(o[k]),pos(o[(k+1)%o.length]),COL[i],2);}p.forEach((v,k)=>{let p=pos(k);c.save();c.scale(1,1/ratio());circ(c,p.x,p.y*ratio(),17,'#d5ad58','#fff0bd',3);c.restore();text4(k+1,p.x,p.y,18,'#382e20');});plaque(crosses(i)+' crossings',a.x+a.w/2,a.y+16,180);});allStations('UNTANGLE');});
engines.kite.draw=stage(()=>{sprite('cloud',S.d.cloud.x,S.d.cloud.y,88);sprite('ribbon',S.d.ribbon.x,S.d.ribbon.y,48);S.d.p.forEach((p,i)=>{path(anchor(i),p,'#fff6d1',3);sprite('kite',p.x,p.y,80,i,Math.sin(S.elapsed+i)*.12);});allStations('STEER');});
engines.gravity.draw=stage(()=>{keyMaze().forEach(r=>{rr(c,r.x,r.y,r.w,r.h,6,'#334f54','#d2d4ad');artImage('board-golem',r.x,r.y,r.w,r.h);});many(i=>{let g={x:100+i*400/Math.max(1,S.n-1),y:i%2?130:470};c.save();c.scale(1,1/ratio());circ(c,g.x,g.y*ratio(),30,'#263e40',COL[i],5);c.restore();text4(i+1,g.x,g.y,23,'#ffffff');sprite('gravity',S.d.p[i].x,S.d.p[i].y,66,i);});allStations('SWIPE');});
engines.tumble.draw=stage(()=>{let d=S.d;c.save();c.translate(300,310);c.rotate(d.angle);let width=mi()===1?280:440;artImage('sprite-ramp',-width/2,-25,width,50);d.p.forEach((o,k)=>{sprite('tumble',o.x-300,-30-Math.floor(k/12)*35,48,o.owner);});c.restore();sprite('tumble',300,366,85);plaque('BALANCE '+(d.angle*180/Math.PI).toFixed(0)+'°',300,440,225);allStations('PLACE');});
engines.moss.draw=stage(()=>{many(i=>{let x=90+(i+.5)*420/S.n,y=260+(i%2)*80+mi()*15,t=S.d.tilt[i];c.save();c.translate(x,y);c.scale(1,1/ratio());c.rotate(Math.atan(t*.4*ratio()));artImage('sprite-leaf',-68,-24,136,48);c.restore();rr(c,40+i*520/S.n,500,520/S.n-4,25,5,COL[i],'#fff6df');});sprite('moss',S.d.ball.x,S.d.ball.y,48);allStations('TILT LEAF');});
engines.choir.draw=stage(()=>{many(i=>{let a=playerPanel(i,.1),d=S.d,v=S.elapsed%7<2.8;plaque(v?d.seq[i].map(n=>['DO','RE','MI','FA'][n]).join(' · '):'REPEAT THE SONG',a.x+a.w/2,a.y+28,Math.min(a.w-22,400));for(let k=0;k<4;k++){let x=a.x+(k+.5)*a.w/4,y=a.y+a.h*.68;uiTile(a.x+k*a.w/4+5,a.y+a.h*.48,a.w/4-10,a.h*.41,false);sprite('choir',x,y-8,Math.min(55,a.w/4-15));text4(['DO','RE','MI','FA'][k],x,y+28/ratio(),20,COL[k]);}plaque(d.progress[i]+'/'+d.seq[i].length,a.x+a.w/2,a.y+65,90,COL[i]);});allStations('SING');});
engines.potion.draw=stage(()=>{many(i=>{let a=playerPanel(i,.05),d=S.d,n=d.recipe[i].length;for(let j=0;j<n;j++){let k=d.recipe[i][j],x=a.x+a.w/2+(j-(n-1)/2)*48;sprite(j<d.progress[i]?'potion':['fire','water','herb'][k],x,a.y+35,39);}for(let k=0;k<3;k++){let x=a.x+(k+.5)*a.w/3,y=a.y+a.h*.68;uiTile(a.x+k*a.w/3+7,a.y+a.h*.45,a.w/3-14,a.h*.43,false);sprite(['fire','water','herb'][k],x,y-9,64);text4(['FIRE','WATER','HERB'][k],x,y+34/ratio(),20);}});allStations('BREW');});
engines.mole.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),d=S.d;for(let k=0;k<25;k++){let x=a.x+k%5*a.w/5,y=a.y+Math.floor(k/5)*a.h/5;rr(c,x+2,y+2,a.w/5-4,a.h/5-4,5,d.rocks[i].has(k)?'#42505b':d.route[i].has(k)?'#d8bb7e':'#97724b','#624c36');c.save();c.beginPath();c.rect(x+3,y+3,a.w/5-6,a.h/5-6);c.clip();if(d.rocks[i].has(k))artImage('board-golem',x-15,y-15,a.w/5+30,a.h/5+30);else{artImage('board-mole',x-a.w*.3,y-a.h*.3,a.w*1.8,a.h*1.8);if(d.route[i].has(k)){c.fillStyle='#e8c88a99';c.fillRect(x,y,a.w/5,a.h/5);}}c.restore();if(k===d.p[i]||k===d.target[i])sprite(k===d.p[i]?'mole':'parcel',x+a.w/10,y+a.h/10,Math.min(a.w/5-9,a.h/5*ratio()-4));}});allStations('DIG');});
engines.tailor.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),n=S.d.p[i].length;for(let k=0;k<n;k++){let x=a.x+(k+.5)*a.w/n;plaque(['↑','→','↓','←'][S.d.target[i][k]],x,a.y+a.h*.25,a.w/n-8);uiTile(x-a.w/n*.43,a.y+a.h*.48,a.w/n*.86,a.h*.42,S.d.p[i][k]===S.d.target[i][k],i);sprite('tailor',x,a.y+a.h*.68,Math.min(72,a.w/n-5),null,S.d.p[i][k]*Math.PI/2);text4(['↑','→','↓','←'][S.d.p[i][k]],x,a.y+a.h*.88,22,S.d.p[i][k]===S.d.target[i][k]?'white':'#203543');}});allStations('ROTATE');});
engines.sea.draw=stage(()=>{if(mi()===1){rr(c,180,230,30,130,9,'#3d7270');rr(c,390,230,30,130,9,'#3d7270');}many(i=>{let a=anchor(i),noise=S.d.noise[i];if(noise>0){c.save();c.beginPath();c.rect(20,62,560,476);c.clip();circ(c,a.x,a.y,20+(1-noise)*350,null,COL[i]+'99',4);c.restore();}});S.d.p.forEach((p,k)=>{sprite('sea',p.x,p.y+Math.sin(S.elapsed*1.3+k)*3,88);});allStations('SONAR');});
engines.golem.draw=stage(()=>{let d=S.d;for(let k=0;k<25;k++){let x=155+k%5*58,y=145+Math.floor(k/5)*58;rr(c,x,y,54,54,4,golemWalls().includes(k)?'#283c43':'#c8d0b0','#657a6a');c.drawImage(A4().images['board-golem'],150,150,250,250,x,y,54,54);if(golemWalls().includes(k)){c.fillStyle='#18313bdd';c.fillRect(x,y,54,54);}if(k===d.rune)sprite('coin',x+27,y+27,38);d.p.forEach((v,i)=>{if(v===k)sprite('golem',x+27,y+27,48,i);});}many(i=>{let a=arena(i),top=isTop(i),y=top?90:485;for(let k=0;k<5;k++){uiTile(a.x+k*a.w/5+4,y,a.w/5-8,40,true,i);text4(['↑','→','↓','←','GO'][k],a.x+(k+.5)*a.w/5,y+20,24,'white');}plaque(d.queue[i].map(k=>['↑','→','↓','←'][k]).join(' ')||'QUEUE 3',a.x+a.w/2,top?68:460,160,COL[i]);});allStations('PROGRAM');});
engines.suitcase.draw=stage(()=>{many(i=>{let a=playerPanel(i,.12),p=S.d.p[i],o=S.d.offer[i];sprite('suitcase',a.x+a.w*.2,a.y+a.h*.4,Math.min(100,a.w*.3));plaque(p.w+'/'+(10-mi()*2)+'kg · '+p.v+' pts',a.x+a.w*.63,a.y+a.h*.3,Math.min(a.w*.65,280),COL[i]);plaque('Next '+o.w+'kg / '+o.v+' pts',a.x+a.w*.63,a.y+a.h*.55,Math.min(a.w*.65,280));plaque('PACK  |  '+(S.n===1?'DISCARD':'SNEAK'),a.x+a.w/2,a.y+a.h*.82,Math.min(a.w-20,300));});allStations('INSPECT '+Math.ceil(S.d.inspect));});
engines.tongue.draw=stage(()=>{S.d.tongues.forEach((t,i)=>{if(t)path(anchor(i),t,COL[i],7);});S.d.p.forEach(p=>sprite(p.bad?'wasp':'bug',p.x,p.y,50));many(i=>{let a=anchor(i);sprite('tongue',a.x,a.y+(isTop(i)?45:-45),62,i);station(i,'AIM / SNAP');});});
engines.room.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),w=S.d.width[i];for(let k=0;k<w*4;k++){let x=a.x+k%w*a.w/w,y=a.y+Math.floor(k/w)*a.h/4;rr(c,x+3,y+3,a.w/w-6,a.h/4-6,5,S.d.p[i][k]?'#e4d8badd':'#fff9edbb','#796743');if(S.d.p[i][k])sprite('room',x+a.w/w/2,y+a.h/8,Math.min(a.w/w-8,a.h/4*ratio()-7),i);}});allStations('FURNISH');});
engines.ghost.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),visible=S.d.flash>.05||S.elapsed%5<.7;if(!visible){c.fillStyle='#0d1834b0';c.fillRect(a.x+10,a.y+10,a.w-20,a.h-20);}else S.d.p[i].forEach(o=>sprite('ghost',a.x+o.x*a.w,a.y+o.y*a.h,65));plaque(visible?'SHOOT!':'WAIT FOR A FLASH',a.x+a.w/2,a.y+19,Math.min(270,a.w-25));});allStations('CAMERA');});
engines.spaghetti.draw=stage(()=>{sprite('spaghetti',300,300,290);many(i=>{let a=anchor(i),p=S.d.p[i];path(a,{x:300+Math.sin(i)*40,y:300},COL[i],3+p.length);plaque(Math.floor(p.length)+' bites · '+Math.round(p.tension*100)+'%',a.x,a.y+(isTop(i)?38:-38),S.n>2?245:300,p.tension>.8?'#c43e2b':COL[i]);station(i,'TWIRL');});});
engines.planet.draw=stage(()=>{sprite('sun',300,300,78+mi()*12);S.d.p.forEach((p,i)=>{c.save();c.scale(1,1/ratio());circ(c,p.x,p.y*ratio(),30,COL[i]+'55',COL[i],3);circ(c,p.x,p.y*ratio(),18,'#c4d2d9','#f4e2b1',3);c.restore();text4(i+1,p.x,p.y,20,COL[i]);});sprite('planet',S.d.ball.x,S.d.ball.y,63);allStations('GRAVITY MOON');});
engines.candle.draw=stage(()=>{many(i=>{let a=playerPanel(i,.12),p=S.d.p[i];sprite('candle',a.x+a.w/2,a.y+a.h*.38,105);plaque('Flame '+Math.ceil(p.flame)+'%',a.x+a.w/2,a.y+a.h*.7,190,COL[i]);rr(c,a.x+22,a.y+a.h-28,a.w-44,14,6,'#483d34aa');rr(c,a.x+22,a.y+a.h-28,(a.w-44)*clamp(p.charge,0,1),14,6,p.charge>.85?'#cb512f':'#e8b953');});allStations('HOLD / BLOW');});
engines.octopus.draw=stage(()=>{many(i=>{path(S.d.body,S.d.tips[i],COL[i],12);sprite('plate',S.d.p[i].x,S.d.p[i].y,64,i);});sprite('octopus',S.d.body.x,S.d.body.y,120);allStations('DRAG TO SERVE');});
engines.sunshine.draw=stage(()=>{sprite('sun',S.d.sun,135,84);path({x:40,y:500},{x:560,y:500},'#725e31',14);many(i=>{let p=S.d.p[i],x=80+(i+.5)*440/S.n;path({x,y:500},{x:x+p.bend,y:500-p.h},'#4c8643',10);sprite('sunshine',x+p.bend,500-p.h,72,i);});allStations('GROW / BEND');});
engines.gift.draw=stage(()=>{many(i=>{let a=playerPanel(i,.15),d=S.d;plaque(d.phase==='build'?(d.p[i]===null?'TREAT  |  TRAP':'PICK A RIBBON'):'CHOOSE A GIFT',a.x+a.w/2,a.y+27,Math.min(330,a.w-22));if(d.phase==='pick'){many(j=>{let x=a.x+(j+.5)*a.w/S.n;sprite('gift',x,a.y+a.h*.58,Math.min(90,a.w/S.n-8),j);plaque('P'+(j+1),x,a.y+a.h*.85,70,COL[j]);});}else{let n=d.p[i]===null?2:4;for(let j=0;j<n;j++){let x=a.x+(j+.5)*a.w/n;uiTile(a.x+j*a.w/n+6,a.y+a.h*.43,a.w/n-12,a.h*.46,n===4,j);sprite(n===2?(j?'fire':'coin'):'ribbon',x,a.y+a.h*.67,Math.min(78,a.w/n-14));}}});allStations('CHOOSE');});
engines.tide.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),p=S.d.p[i];c.save();c.beginPath();c.rect(a.x+10,a.y+12,a.w-20,a.h-24);c.clip();c.globalAlpha=.75;let x=a.x+a.w*(1-S.d.tide*.7);artImage('board-sea',x,a.y,a.w*S.d.tide*.7,a.h);c.restore();sprite('coin',a.x+a.w*.7,a.y+a.h/2,45);sprite('tide',a.x+25+p.x*(a.w-50),a.y+a.h/2,65,i);plaque(p.loot?'RETURN: '+p.loot+' pts':'WAIT FOR LOW TIDE',a.x+a.w/2,a.y+23,Math.min(300,a.w-25));});allStations('RAID / RETURN');});
engines.orchard.draw=stage(()=>{many(i=>{let a=playerPanel(i,0),l=S.d.lamp[i];c.save();c.beginPath();c.rect(a.x+10,a.y+12,a.w-20,a.h-24);c.clip();c.fillStyle='#071e1a77';c.fillRect(a.x,a.y,a.w,a.h);let x=a.x+l.x*a.w,y=a.y+l.y*a.h,gr=c.createRadialGradient(x,y,5,x,y,a.w*.24);gr.addColorStop(0,'#ffdc8988');gr.addColorStop(1,'#f9cf6300');c.fillStyle=gr;c.fillRect(a.x,a.y,a.w,a.h);S.d.p[i].forEach(o=>{let xx=a.x+o.x*a.w,yy=a.y+o.y*a.h;c.globalAlpha=o.ripe>=1?1:.3+o.ripe*.5;sprite('orchard',xx,yy,48);});c.restore();});allStations('LIGHT / PICK');});
engines.heat.draw=stage(()=>{sprite('heat',300,300,250);let yy=440-S.d.heat*2.7;rr(c,464,165,24,275,9,'#2b3939');rr(c,466,yy,20,S.d.heat*2.7,7,S.d.heat>80?'#c43f2a':'#e5ac3e');plaque(Math.round(S.d.heat)+'° · bank at 45–80°',300,465,330);many(i=>{let a=anchor(i);plaque('Unbanked '+Math.floor(S.d.p[i]),a.x,a.y+(isTop(i)?38:-38),S.n>2?235:280,COL[i]);station(i,'HOLD / BANK');});});
engines.parcel.draw=stage(()=>{sprite('parcel',300,278,100);plaque('ROUTE '+(S.d.parcel%3+1)+' · '+Math.ceil(S.d.countdown)+'s',300,350,275);many(i=>{let a=arena(i);for(let k=0;k<3;k++){let x=a.x+(k+.5)*a.w/3,y=a.y+a.h*.65;uiTile(x-a.w/6+6,y-22,a.w/3-12,44,S.d.votes[i]===k,i);text4(k+1,x,y,27,S.d.votes[i]===k?'white':'#263845');}});allStations('VOTE');});
engines.echo.draw=stage(()=>{many(i=>{let a=playerPanel(i,.08),p=S.d.p[i];if(S.d.visible[i]>0){sprite('echo',a.x+p.x*a.w,a.y+p.y*a.h,70);c.save();c.globalAlpha=.4;circ(c,a.x+p.x*a.w,a.y+p.y*a.h,30+Math.sin(S.elapsed*5)*10,null,'#f1d087',3);c.restore();}plaque('PING · −1',a.x+a.w/2,a.y+a.h*.9,160,COL[i]);});allStations('DELIVER');});
// Deliberate bot policies: normal bots react with latency and mistakes, never auto-award points.
function botSkill(){let b={easy:{delay:.9,error:.28,jitter:30},normal:{delay:.48,error:.10,jitter:13},hard:{delay:.24,error:.025,jitter:4}}[prefs.difficulty]||{delay:.48,error:.10,jitter:13};let form=prefs.consistency==='variable'?(S.botForm||1):1;return{delay:b.delay/form,error:clamp(b.error/form,.01,.45),jitter:b.jitter/form};}
function bfsCells(start,target,blocked,cols=5,rows=5){let q=[[start,[]]],seen=new Set([start]);while(q.length){let [v,path0]=q.shift();if(v===target)return path0;for(let [dx,dy,k] of [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]]){let x=v%cols+dx,y=Math.floor(v/cols)+dy,n=y*cols+x;if(x<0||x>=cols||y<0||y>=rows||seen.has(n)||blocked.has(n))continue;seen.add(n);q.push([n,path0.concat([{cell:n,cmd:k}])]);}}return[];}
function botPolicy(i,b,skill){let e=engines[S.g.id],d=S.d,a=arena(i),anc=anchor(i),id=S.g.id;const pos=(x,y)=>({x:a.x+x*a.w,y:a.y+y*a.h}),noise=p=>({x:p.x+rand(-skill.jitter,skill.jitter),y:p.y+rand(-skill.jitter,skill.jitter)/ratio()}),tap=p=>e.tap?.(i,p),move=p=>e.move?.(i,p),up=p=>e.up?.(i,p),press=(p,seconds=.1)=>{tap(p);S.held[i]=true;b.release=S.elapsed+seconds;b.point=p;},drag=p=>{let q=noise(p);tap(q);move(q);up(q);};
let mistake=Math.random()<skill.error;
if(mistake&&!['skyhook','spaghetti','candle','heat'].includes(id)){if(Math.random()<.6)return;}
switch(id){
case'skyhook':if(d.hook[i]>=0){S.held[i]=true;b.release=0;}else{S.held[i]=false;let targets=d.scrap.map((o,k)=>({o,k,dist:dist(o,anc)})).sort((a,b)=>a.dist-b.dist);up(noise(targets[mistake?Math.floor(rand(0,targets.length)):0].o));}break;
case'fossil':{let opts=d.tiles[i].map((v,k)=>({v,k})).filter(o=>o.v<2);if(opts.length){let k=chosen(opts).k;tap(pos((k%5+.5)/5,(Math.floor(k/5)+.5)/5));}}break;
case'elevator':{let w=d.load.reduce((s,o)=>s+o.w,0),owned=d.load.filter(o=>o.i===i).length;if(w+d.wait[i].w<=8-mi()&&owned<2&&!mistake)tap(pos(.2,.5));else tap(pos(.8,.5));}break;
case'wobble':{if(d.ball[i])break;let r=d.ramps[i];if(!b.plan){let best=-1,plan=[];for(let t=0;t<70;t++){let trial=t===0?[]:Array.from({length:t%3+1},()=>({x:a.x+rand(.18,.8)*a.w,y:a.y+rand(.18,.65)*a.h,slope:rand(-.25,1)}));let ball={x:a.x+22,y:a.y+20,vx:(a.w-70)/Math.sqrt(2*(a.h-55)/180),vy:0},v=0;for(let f=0;f<360;f++){let dt=1/60;ball.vy+=dt*(mi()===2?250:180);ball.vx+=mi()===1?dt*45:0;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;for(let rr of trial)if(Math.abs(ball.x-rr.x)<50&&Math.abs(ball.y-rr.y-rr.slope*(ball.x-rr.x))<10&&ball.vy>0){ball.vy=-Math.abs(ball.vy)*.6-20;ball.vx+=rr.slope*80+20;}if(ball.x>a.x+a.w-60&&ball.y>a.y+a.h-65){v=1;break;}if(ball.y>a.y+a.h||ball.x>a.x+a.w)break;}if(v>best){best=v;plan=trial;}if(v===1)break;}b.plan=plan;b.part=0;}if(b.part<b.plan.length){let q=b.plan[b.part++];tap(q);move({x:q.x+25,y:q.y+q.slope*45});}else{tap(pos(.5,.92));b.plan=null;}}break;
case'unravel':{let order=d.order[i],n=order.length,k=b.node||0,who=order[k%n],q={x:a.x+(.5+Math.cos(k/n*Math.PI*2)*.37)*a.w,y:a.y+(.5+Math.sin(k/n*Math.PI*2)*.32)*a.h};let prev=d.p[i][who];tap({x:a.x+prev.x*a.w,y:a.y+prev.y*a.h});move(mistake?noise(q):q);up(q);b.node=(k+1)%n;}break;
case'kite':{let p=d.ribbon;if(dist(p,d.cloud)<70)p={x:p.x+70,y:p.y+45};move(noise(p));}break;
case'gravity':{let p=d.p[i],goal={x:100+i*400/Math.max(1,S.n-1),y:i%2?130:470},dx=goal.x-p.x,dy=goal.y-p.y;let block=keyMaze().find(r=>Math.abs(p.x-goal.x)<r.w+35&&p.y<r.y+r.h&&p.y>r.y-40);if(block&&Math.abs(dx)<50)dx=p.x<300?-130:130;let start={x:300,y:300},end=Math.abs(dx)>Math.abs(dy)?{x:300+Math.sign(dx)*(mistake?-100:100),y:300}:{x:300,y:300+Math.sign(dy)*(mistake?-100:100)};tap(start);up(end);}break;
case'tumble':{let torque=d.p.reduce((s,o)=>s+(o.x-300)*o.w,0),x=300-clamp(torque/2,-180,180)+rand(-skill.jitter*.18,skill.jitter*.18);tap({x,y:350});}break;
case'moss':{let goal=40+(i+.5)*520/S.n,t=(goal-d.ball.x)/130;move(pos(clamp(.5+t*.5,0,1),.5));}break;
case'choir':if(S.elapsed%7<2.8)b.memory=d.seq[i].slice();if(b.memory){let k=b.memory[d.progress[i]]??0;if(mistake)k=Math.floor(rand(0,4));tap(pos((k+.5)/4,.7));}break;
case'potion':{let k=d.recipe[i][d.progress[i]];if(mistake)k=(k+1)%3;tap(pos((k+.5)/3,.7));}break;
case'mole':{let route=bfsCells(d.p[i],d.target[i],d.rocks[i]),cell=route[0]?.cell;if(cell!==undefined)tap(pos((cell%5+.5)/5,(Math.floor(cell/5)+.5)/5));}break;
case'tailor':{let k=d.p[i].findIndex((v,k)=>v!==d.target[i][k]);if(k>=0)tap(pos((k+.5)/d.p[i].length,.65));}break;
case'sea':if(d.noise[i]<(mistake?.55:.12))tap(anc);break;
case'golem':if(!d.run){if(d.queue[i].length){tap(pos(.9,.6));break;}let route=bfsCells(d.p[i],d.rune,new Set(golemWalls()));if(route.length){for(let action of route.slice(0,3)){if(d.cool[i]>0)break;tap(pos((action.cmd+.5)/5,.7));}}}break;
case'suitcase':tap(pos(d.p[i].w+d.offer[i].w<=10-mi()*2&&!mistake?.2:.8,.5));break;
case'tongue':{let candidates=d.p.filter(p=>mistake||!p.bad);if(candidates.length)drag(chosen(candidates));}break;
case'room':{let w=d.width[i],k=d.p[i].slice(0,w*4).findIndex(v=>!v);if(k>=0)tap(pos((k%w+.5)/w,(Math.floor(k/w)+.5)/4));}break;
case'ghost':if(d.flash>.05||S.elapsed%5<.7){let o=chosen(d.p[i]);tap(noise(pos(o.x,o.y)));}else if(Math.random()<.3)tap(pos(.5,.5));break;
case'spaghetti':if(!S.held[i])press(anc,mistake?3.6:rand(.9,1.7));break;
case'planet':{let p=d.ball,goal=anc;move({x:clamp(p.x+(goal.x-p.x)*.45,70,530),y:clamp(p.y+(goal.y-p.y)*.45,110,490)});}break;
case'candle':if(!S.held[i])press(anc,mistake?1.9:rand(.65,1.05));break;
case'octopus':if(!d.carry[i]){tap({...d.p[i]});move({...d.p[i]});}else move(anc);break;
case'sunshine':{let base=80+(i+.5)*440/S.n,target=clamp((d.sun-base)/100,-.5,.5);move(pos(.5+target,.5));S.held[i]=d.p[i].h<(mi()===0?145:mi()===1?120:95);b.release=0;}break;
case'gift':if(d.phase==='build'){if(d.p[i]===null)tap(pos(Math.random()<.5?.2:.8,.6));else tap(pos(rand(0,.999),.6));}else if(!d.picked.has(i)){let options=[...Array(S.n).keys()].filter(j=>j!==i||S.n===1);let j=chosen(options);tap(pos((j+.5)/S.n,.6));}break;
case'tide':{let p=d.p[i];if(p.going===0&&d.tide<(mistake?.85:.6)&&Math.cos(S.elapsed*(.55+mi()*.15))<0)tap(anc);else if(p.going===1&&d.tide>.78)tap(anc);}break;
case'orchard':{let ripe=d.p[i].find(o=>o.ripe>=1);if(ripe)tap(pos(ripe.x,ripe.y));else{let o=d.p[i].reduce((a,b)=>a.ripe>b.ripe?a:b);move(pos(o.x,o.y));}}break;
case'heat':if(S.held[i]){if(d.heat>=(mistake?95:rand(58,77))){up(anc);S.held[i]=false;b.wait=skill.delay*2;}}else if(d.heat<75){S.held[i]=true;tap(anc);}break;
case'parcel':tap(pos(((mistake?(d.parcel+1)%3:d.parcel)+.5)/3,.65));break;
case'echo':if(d.visible[i]>0){b.echo={...d.p[i]};}if(b.echo){tap(noise(pos(b.echo.x,b.echo.y)));b.echo=null;}else tap(pos(.5,.91));break;
}}
function studioBots(dt){if(!S||!S.g.prototype)return;if(!S.ai)S.ai=Array.from({length:S.n},()=>({wait:rand(.2,.9),release:0}));let skill=botSkill();for(let i=prefs.humans;i<S.n;i++){let b=S.ai[i];if(b.release&&S.elapsed>=b.release){engines[S.g.id].up?.(i,b.point||anchor(i));S.held[i]=false;b.release=0;}b.wait-=dt;if(b.wait<=0){b.wait=skill.delay*rand(.85,1.15);botPolicy(i,b,skill);}}}
const beforeStudioStep=step;step=function(dt){if(active())studioBots(dt);beforeStudioStep(dt);};
const oldTone4=tone;tone=function(f=500,t=.06){if(!window.StudioAudio)return oldTone4(f,t);let themes={skyhook:'metal',fossil:'wood',elevator:'wood',wobble:'metal',unravel:'cloth',kite:'wind',gravity:'metal',tumble:'wood',moss:'water',choir:'magic',potion:'water',mole:'wood',tailor:'cloth',sea:'water',golem:'wood',suitcase:'cloth',tongue:'wind',room:'wood',ghost:'magic',spaghetti:'cloth',planet:'magic',candle:'wind',octopus:'water',sunshine:'magic',gift:'cloth',tide:'water',orchard:'magic',heat:'metal',parcel:'route',echo:'magic'};StudioAudio.effect(f<250?'miss':f>=800?'win':themes[S?.g.id]||'tap',clamp(f/550,.8,1.25));};
// A clear human/bot count setup. Seats are human first, then explicitly added bots.
const setup4=document.createElement('section');setup4.className='studio-party';setup4.innerHTML='<div class="studio-party-title"><b>Complete your party</b><span id="seat-total"></span></div><div class="studio-party-fields"><label>Bots<select id="bot-count"></select></label><label>Bot skill<select id="bot-skill"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></label><label>Consistency<select id="bot-consistency"><option value="steady">Steady</option><option value="variable">Variable form</option></select></label></div><p id="bot-explain"></p>';$('home').querySelector('.setup').after(setup4);
const previousHome4=homeUI;homeUI=function(){previousHome4();prefs.bots=clamp(prefs.bots||0,0,4-prefs.humans);let sel=$('bot-count');if(sel){sel.innerHTML=Array.from({length:5-prefs.humans},(_,k)=>'<option value="'+k+'">'+k+(k===1?' bot':' bots')+'</option>').join('');sel.value=prefs.bots;$('bot-skill').value=prefs.difficulty;$('bot-consistency').value=prefs.consistency;$('seat-total').textContent=seatCount()+' / 4 seats';$('hint').textContent=prefs.humans+' human'+(prefs.humans>1?'s':'')+' · '+prefs.bots+' bot'+(prefs.bots===1?'':'s');$('bot-explain').textContent=seatCount()===1?'Solo challenges. The classic games add one sparring bot.':prefs.consistency==='steady'?'Steady reaction times and skill. Bots still make believable mistakes.':'Bot form varies by round, not randomly between every move.';}};homeUI();$('bot-count').onchange=e=>{prefs.bots=+e.target.value;save();homeUI();};$('bot-skill').onchange=e=>{prefs.difficulty=e.target.value;save();};$('bot-consistency').onchange=e=>{prefs.consistency=e.target.value;save();homeUI();};
$('home').querySelector('.setup h2').textContent='Human players';$('home').querySelector('.party-banner p').textContent='40 worlds. Your friends. A proper party.';
function studioLibrary(filter=''){let f=filter.toLowerCase();$('grid').innerHTML=games.filter(g=>(g.name+' '+g.tag).toLowerCase().includes(f)).map((g)=>'<button class="card studio-card" data-game="'+g.id+'"><img src="'+(g.prototype?'assets/studio/cards/':'assets/art/')+g.id+'.webp" alt="" loading="lazy"><div><strong>'+g.name+'</strong><small>'+g.tag+' · '+g.maps.length+' MAPS</small></div></button>').join('');document.querySelectorAll('.card[data-game]').forEach(b=>b.onclick=()=>rules(b.dataset.game));}
drawLibrary=studioLibrary;studioLibrary();$('library-search').oninput=e=>studioLibrary(e.target.value);document.querySelector('.lab-label').textContent='40 GAMES · HUMAN + BOT PARTIES';
const preRules4=rules;rules=function(id){preRules4(id);let g=games.find(g=>g.id===id),pic=document.querySelector('.game-symbol');if(pic)pic.outerHTML='<img class="studio-rule-art" src="'+(g.prototype?'assets/studio/cards/':'assets/art/')+id+'.webp" alt="">';let p=document.querySelector('.proto-note');if(p)p.textContent='Painted Studio edition · gameplay tuning is still in development.';let tag=document.querySelector('.modal-tag');if(tag)tag.textContent=g.tag+' · '+prefs.humans+' HUMAN'+(prefs.humans>1?'S':'')+' + '+(seatCount(g)-prefs.humans)+' BOT'+(seatCount(g)-prefs.humans===1?'':'S');};
const initialSettings4=settings;settings=function(){initialSettings4();let extra=document.createElement('div');extra.className='studio-volumes';extra.innerHTML='<label>Music volume<input id="music-volume" type="range" min="0" max="1" step="0.05" value="'+prefs.musicVolume+'"></label><label>Effects volume<input id="effects-volume" type="range" min="0" max="1" step="0.05" value="'+prefs.effectsVolume+'"></label>';$('done').before(extra);for(let id of ['music-volume','effects-volume'])$(id).oninput=()=>{prefs.musicVolume=+$('music-volume').value;prefs.effectsVolume=+$('effects-volume').value;StudioAudio.setVolumes(prefs.musicVolume,prefs.effectsVolume);save();};};$('settings').onclick=settings;
window.Studio={seatCount,get mapLooks(){return mapLooks;},get art(){return window.StudioArt;},botSkill};

/* Pocket Party 5 — Strategy rebuild. Authored rules; no copied commercial game code. */
const strategyDefs = {};
const STR = { bg: "#f6f0e3", ink: "#24333b", muted: "#66716f", gold: "#ac7426" };
const ST = {
  text(t, x, y, size = 24, col = STR.ink, align = "center") {
    c.save();
    size = Math.max(23, size);
    c.font = "700 " + size + "px Arial";
    c.fillStyle = col;
    c.textAlign = align;
    c.textBaseline = "middle";
    let rows = [String(t)];
    if (c.measureText(rows[0]).width > 550 && String(t).includes(" ")) {
      rows = [""];
      for (let w of String(t).split(" ")) {
        let k = rows.length - 1;
        if (c.measureText(rows[k] + " " + w).width > 550 && rows[k]) rows.push(w);
        else rows[k] += (rows[k] ? " " : "") + w;
      }
    }
    rows.forEach((row, k) => c.fillText(row, x, y + (k - (rows.length - 1) / 2) * (size + 3)));
    c.restore();
  },
  box(x, y, w, h, fill = "#fffaf0", border = "#c7c2b2", r = 10) {
    rr(c, x, y, w, h, r, fill, border, 2);
  },
  circle(x, y, r, col, border) {
    circ(c, x, y, r, col, border, 3);
  },
  line(a, b, col = "#6e7974", w = 4) {
    line(c, a.x, a.y, b.x, b.y, col, w);
  },
  bg() {
    c.fillStyle = STR.bg;
    c.fillRect(0, 0, 600, 600);
    c.save();
    c.globalAlpha = 0.16;
    artImage("board-" + themed(), 0, 0, 600, 600);
    c.restore();
  },
  grid(cols = 6, rows = cols, y = 90, size = 480) {
    return { cols, rows, x: (600 - size) / 2, y, size, cell: size / cols };
  },
  xy(k, g) {
    return {
      x: g.x + ((k % g.cols) + 0.5) * g.cell,
      y: g.y + (Math.floor(k / g.cols) + 0.5) * g.cell,
    };
  },
  index(p, g) {
    let x = Math.floor((p.x - g.x) / g.cell),
      y = Math.floor((p.y - g.y) / g.cell);
    return x >= 0 && x < g.cols && y >= 0 && y < g.rows ? y * g.cols + x : -1;
  },
  cells(g, fn) {
    for (let k = 0; k < g.cols * g.rows; k++) {
      let p = this.xy(k, g);
      this.box(p.x - g.cell / 2 + 2, p.y - g.cell / 2 + 2, g.cell - 4, g.cell - 4, "#fffaf0c9");
      fn?.(k, p, g.cell);
    }
  },
  banner(t, sub) {
    this.text(t, 300, 27, 25);
    if (sub) this.text(sub, 300, 58, 21, STR.muted);
  },
  select(k, g) {
    if (k < 0) return;
    let p = this.xy(k, g);
    this.box(
      p.x - g.cell / 2 + 4,
      p.y - g.cell / 2 + 4,
      g.cell - 8,
      g.cell - 8,
      null,
      COL[S.d.turn],
      5,
    );
  },
  cards(items, selected = -1, y = 380) {
    let w = 540 / items.length;
    items.forEach((item, k) => {
      let x = 30 + k * w;
      this.box(
        x + 4,
        y,
        w - 8,
        100,
        k === selected ? TINT[S.d.turn] : "#fffcf2",
        k === selected ? COL[S.d.turn] : "#b8b8a7",
      );
      let a = Array.isArray(item) ? item : [item];
      a.forEach((v, j) => this.text(v, x + w / 2, y + 28 + j * 28, j ? 21 : 25));
    });
  },
  cardAt(p, n, y = 380) {
    return p.y >= y && p.y <= y + 100 && p.x >= 30 && p.x < 570
      ? Math.min(n - 1, Math.floor((p.x - 30) / (540 / n)))
      : -1;
  },
  note(t) {
    S.d.note = t;
    S.d.noteAt = S.elapsed;
    S.message = t;
  },
  add(i, v) {
    if (v) score(i, v);
  },
  neighbors(k, n = 6) {
    let x = k % n,
      y = Math.floor(k / n);
    return [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]
      .filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n)
      .map(([a, b]) => b * n + a);
  },
  cellsNear(k, n = 6) {
    let x = k % n,
      y = Math.floor(k / n),
      a = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        if ((dx || dy) && x + dx >= 0 && x + dx < n && y + dy >= 0 && y + dy < n)
          a.push((y + dy) * n + x + dx);
    return a;
  },
  rng(k) {
    return (((k * 1103515245 + 12345) >>> 0) % 997) / 997;
  },
};
function strategyRegister(id, def) {
  strategyDefs[id] = def;
  let g = games.find((v) => v.id === id);
  Object.assign(g, {
    tag: def.tag,
    rule: def.rule,
    goal:
      def.goal ||
      (def.kind === "arena"
        ? "60 seconds."
        : (def.rounds || 8) + " rounds; one deliberate action per turn.") +
        " Highest banked score wins. Solo: beat your record.",
    time: def.kind === "arena" ? 60 : 0,
    strategic: true,
    target: def.target || 12,
    action: "PLAY",
  });
  engines[id] = {
    init() {
      S.d = {
        strategy: true,
        kind: def.kind,
        turn: 0,
        first: 0,
        turns: 0,
        round: 1,
        mode: 0,
        sel: -1,
        note: "",
        noteAt: -99,
        botWait: 0,
        controls: many(() => ({ x: 0, y: 0, held: false })),
        p: [],
      };
      def.init();
      strategyControls();
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (S.d.kind === "arena") {
        def.update(dt);
        strategyArenaBots(def, dt);
      } else {
        def.update?.(dt);
        if (!S.ended && S.d.turn >= prefs.humans && !S.d.busy) {
          S.d.botWait -= dt;
          if (S.d.botWait <= 0) {
            S.d.botWait = botSkill().delay * 1.8;
            def.bot(S.d.turn);
            strategyControlLabels();
          }
        }
      }
      if (S.elapsed - S.d.noteAt > 2.8) S.message = strategyStatus();
    },
    tap(i, p) {
      if (!active() || !p) return;
      if (def.kind !== "arena" && i !== S.d.turn) return;
      def.tap?.(i, p);
      strategyControlLabels();
    },
    move(i, p) {
      def.move?.(i, p);
    },
    up(i, p) {
      def.up?.(i, p);
    },
    action(i, k) {
      if (!active() || i >= S.n) return;
      if (def.kind !== "arena" && (i !== S.d.turn || S.d.busy)) return;
      if (def.kind === "arena") def.action(i, k);
      else if (k === 0) {
        if (def.act(i, S.d.sel) === true) strategyNext();
      } else if (k === 1) {
        S.d.mode = (S.d.mode + 1) % (def.modes?.length || 1);
        ST.note((def.modes || ["Select"])[S.d.mode] + " — select a target, then Confirm.");
      } else {
        def.pass?.(i);
        strategyNext();
      }
      strategyControlLabels();
    },
    draw() {
      c.save();
      c.scale(W / 600, H / 600);
      ST.bg();
      def.draw();
      c.restore();
    },
  };
}
function strategyStatus() {
  let def = strategyDefs[S.g.id],
    d = S.d;
  if (d.kind === "arena") return def.hint;
  return (
    pname(d.turn) +
    " · " +
    (def.modes?.[d.mode] || "Choose") +
    " · select, then Confirm · round " +
    d.round +
    "/" +
    (def.rounds || 8)
  );
}
function strategyNext() {
  let d = S.d,
    def = strategyDefs[S.g.id];
  d.turns++;
  d.sel = -1;
  d.mode = 0;
  def.afterTurn?.();
  if (d.turns % S.n === 0) {
    def.round?.();
    if (d.turns / S.n >= (def.rounds || 8)) {
      def.end?.();
      finish();
      return;
    }
    d.round++;
    d.first = (d.first + 1) % S.n;
  }
  d.turn = (d.first + (d.turns % S.n)) % S.n;
  d.botWait = botSkill().delay * 1.8;
  strategyControlLabels();
  hud();
}
function strategyControls() {
  const d = S.d,
    def = strategyDefs[S.g.id];
  $("play").dataset.strategy = def.kind;
  $("top").innerHTML = "";
  $("bottom").innerHTML = "";
  for (let i = 0; i < S.n; i++) {
    let node = document.createElement("div");
    node.className = "strategy-pad";
    node.dataset.seat = i;
    node.style.setProperty("--seat", COL[i]);
    let human = i < prefs.humans,
      arenaMode = def.kind === "arena";
    if (!arenaMode && def.modes?.length === 1) node.classList.add("single-mode");
    node.innerHTML =
      '<div class="seat-label">' +
      pname(i) +
      '<span class="seat-resource"></span></div><div class="seat-actions">' +
      (arenaMode
        ? '<div class="stick" role="application" aria-label="' +
          pname(i) +
          ' movement"><span></span></div>'
        : "") +
      '<button class="str-action" data-action="0">' +
      (arenaMode ? def.buttons[0] : "Confirm") +
      '</button><button class="str-action" data-action="1">' +
      (arenaMode ? def.buttons[1] : "Mode") +
      "</button>" +
      (!arenaMode ? '<button class="str-action pass-action" data-action="2">Pass</button>' : "") +
      "</div>";
    node.querySelectorAll("button").forEach((btn) => {
      btn.disabled = !human;
      btn.onclick = () => engines[S.g.id].action(i, +btn.dataset.action);
    });
    if (!arenaMode && def.modes?.length === 1)
      node.querySelector('[data-action="1"]').hidden = true;
    let stick = node.querySelector(".stick");
    if (stick) {
      let pointer = null;
      const stop = () => {
        pointer = null;
        if (S?.d.controls?.[i]) {
          S.d.controls[i].x = 0;
          S.d.controls[i].y = 0;
          S.d.controls[i].held = false;
        }
        stick.querySelector("span").style.transform = "translate(0,0)";
      };
      let steer = (e) => {
        let r = stick.getBoundingClientRect(),
          x = (e.clientX - r.left - r.width / 2) / (r.width * 0.36),
          y = (e.clientY - r.top - r.height / 2) / (r.height * 0.36),
          l = Math.hypot(x, y);
        if (l > 1) {
          x /= l;
          y /= l;
        }
        d.controls[i] = { x, y, held: true };
        stick.querySelector("span").style.transform =
          "translate(" + x * 16 + "px," + y * 16 + "px)";
      };
      stick.onpointerdown = (e) => {
        if (!human || !active()) return;
        e.preventDefault();
        pointer = e.pointerId;
        stick.setPointerCapture(pointer);
        steer(e);
      };
      stick.onpointermove = (e) => {
        if (pointer === e.pointerId && active()) steer(e);
      };
      stick.onpointerup = stop;
      stick.onpointercancel = stop;
      stick.onlostpointercapture = stop;
    }
    $(i < 2 ? "bottom" : "top").appendChild(node);
  }
  strategyControlLabels();
  requestAnimationFrame(() => {
    if (S?.d === d) {
      fit();
      render();
    }
  });
}
function strategyShortMode(t) {
  return (
    {
      Clockwise: "CW",
      Counterclockwise: "CCW",
      "Rotate rail": "Rail",
      "Run marble": "Run",
      Excavate: "Dig",
      "Cash out": "Bank",
      "Build toll": "Toll",
      Dispatch: "Ship",
      Harvest: "Pick",
      Breathe: "Rest",
      Medium: "Med",
      "Play note": "Note",
      Bank: "Bank",
      Normal: "Fwd",
      Reverse: "Rev",
    }[t] || t
  );
}
function strategyControlLabels() {
  if (!S?.d.strategy) return;
  let d = S.d,
    def = strategyDefs[S.g.id];
  document.querySelectorAll(".strategy-pad").forEach((node) => {
    let i = +node.dataset.seat,
      isTurn = d.kind === "arena" || d.turn === i;
    node.classList.toggle("waiting", !isTurn);
    node
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = i >= prefs.humans || !isTurn || !!d.busy));
    let resource = def.resource?.(i) || "";
    node.querySelector(".seat-resource").textContent = resource;
    if (d.kind !== "arena") {
      node.querySelector('[data-action="1"]').textContent = strategyShortMode(
        def.modes?.[d.mode] || "Mode",
      );
      node.querySelector('[data-action="0"]').textContent = isTurn ? "Confirm" : "Wait";
    }
  });
}
// The older studio policy is deliberately bypassed for rebuilt engines. Each new bot uses legal inputs.
const legacyStudioBots = studioBots;
studioBots = function (dt) {
  if (S?.g.strategic) return;
  legacyStudioBots(dt);
};
const strategyOldStart = start;
start = function (id) {
  delete $("play").dataset.strategy;
  strategyOldStart(id);
  if (S.g.strategic) {
    S.message = strategyStatus();
    hud();
  }
};
const strategyOldHome = goHome;
goHome = function () {
  strategyOldHome();
  if ($("play").classList.contains("hidden")) delete $("play").dataset.strategy;
};
function strategyCanvasInput() {
  const old = {
    down: canvas.onpointerdown,
    move: canvas.onpointermove,
    up: canvas.onpointerup,
    cancel: canvas.onpointercancel,
  };
  let touch = null;
  function point(e) {
    let r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 600, y: ((e.clientY - r.top) / r.height) * 600 };
  }
  canvas.onpointerdown = (e) => {
    if (!S?.g.strategic) return old.down?.(e);
    if (!active() || S.d.kind === "arena" || S.d.turn >= prefs.humans) return;
    e.preventDefault();
    touch = e.pointerId;
    canvas.setPointerCapture(touch);
    engines[S.g.id].tap(S.d.turn, point(e));
  };
  canvas.onpointermove = (e) => {
    if (!S?.g.strategic) return old.move?.(e);
    if (active() && touch === e.pointerId) engines[S.g.id].move(S.d.turn, point(e));
  };
  canvas.onpointerup = (e) => {
    if (!S?.g.strategic) return old.up?.(e);
    if (active() && touch === e.pointerId) engines[S.g.id].up(S.d.turn, point(e));
    touch = null;
  };
  canvas.onpointercancel = (e) => {
    touch = null;
    if (!S?.g.strategic) old.cancel?.(e);
  };
}
window.addEventListener("load", strategyCanvasInput);
const strategyClearInput = () => {
  if (S?.d.controls)
    S.d.controls.forEach((p) => {
      p.x = 0;
      p.y = 0;
      p.held = false;
    });
  document.querySelectorAll(".stick span").forEach((n) => (n.style.transform = "translate(0,0)"));
};
window.addEventListener("blur", strategyClearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) strategyClearInput();
});
// Keyboard controls are a genuine alternative, not a tap-score shortcut.
const strategyKeys = [
    ["KeyW", "KeyD", "KeyS", "KeyA", "KeyF", "KeyG"],
    ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Enter", "ShiftRight"],
    ["KeyI", "KeyL", "KeyK", "KeyJ", "KeyO", "KeyP"],
    ["Numpad8", "Numpad6", "Numpad5", "Numpad4", "Numpad1", "Numpad2"],
  ],
  strategyDown = new Set();
window.addEventListener("keydown", (e) => {
  if (!active() || !S?.g.strategic || S.d.kind !== "arena") return;
  for (let i = 0; i < prefs.humans; i++) {
    let keys = strategyKeys[i],
      k = keys.indexOf(e.code);
    if (k < 0) continue;
    e.preventDefault();
    if (k >= 4 && !e.repeat) engines[S.g.id].action(i, k - 4);
    strategyDown.add(e.code);
    S.d.controls[i] = {
      x: +strategyDown.has(keys[1]) - +strategyDown.has(keys[3]),
      y: +strategyDown.has(keys[2]) - +strategyDown.has(keys[0]),
      held: true,
    };
  }
});
window.addEventListener("keyup", (e) => {
  strategyDown.delete(e.code);
  if (!S?.g.strategic || S.d.kind !== "arena") return;
  for (let i = 0; i < prefs.humans; i++) {
    let keys = strategyKeys[i];
    if (keys.includes(e.code))
      S.d.controls[i] = {
        x: +strategyDown.has(keys[1]) - +strategyDown.has(keys[3]),
        y: +strategyDown.has(keys[2]) - +strategyDown.has(keys[0]),
        held: false,
      };
  }
});
window.addEventListener("blur", () => strategyDown.clear());

// TEN TACTICAL ARENAS. Steering, facing, collision, cargo and banking are shared foundations;
// powers and objectives are intentionally different. An action alone never creates points.
const ARENA_IDS = [
  "skyhook",
  "kite",
  "gravity",
  "sea",
  "tongue",
  "ghost",
  "planet",
  "octopus",
  "tide",
  "echo",
];
const arenaSpecs = {
  skyhook: {
    tag: "HARPOON · STEAL · BANK",
    buttons: ["Hook", "Dash"],
    hint: "Steer to aim. Harpoon pulls scrap or steals cargo. Bank at your numbered dock.",
    rule: "Move with your stick; your arrow is your aim. Harpoon scrap toward you, or hit a rival to steal one carried piece. Dash costs energy. Only cargo returned to your own numbered dock scores.",
  },
  kite: {
    tag: "FLY · GUST · DEFEND",
    buttons: ["Gust", "Shield"],
    hint: "Carry ribbons home. Gust rivals away from ribbons; shield blocks gusts.",
    rule: "Steer through the wind, collect up to five ribbons and return to your numbered dock. Cargo slows you. Gust pushes nearby rivals and knocks out cargo; shield counters it. Both consume energy, so choose when to fight.",
  },
  gravity: {
    tag: "ATTRACT · REPEL · DELIVER",
    buttons: ["Attract", "Repel"],
    hint: "Magnet keys into your dock. Attract objects; repel rivals and contest their haul.",
    rule: "Steer your magnet. Attract moves nearby keys toward you; repel pushes keys and rivals away. Up to five keys fit in your hold. Deliver them to your own dock. Fighting drains the same energy needed to escape.",
  },
  sea: {
    tag: "TORPEDO · SILENCE · SALVAGE",
    buttons: ["Fire", "Silent"],
    hint: "Salvage and bank. Torpedoes knock out cargo; Silent evades targeting but slows you.",
    rule: "Steer the submarine and face a rival before firing. Torpedoes spill cargo; a silent shield blocks a hit but slows your movement. Take salvage to your numbered dock to score. Reefs block both boats and shots.",
  },
  tongue: {
    tag: "AIM · SNAP · COUNTER",
    buttons: ["Snap", "Guard"],
    hint: "Face bugs and snap from range. Guard blocks tongue hits; avoid the moving wasp.",
    rule: "Steer to aim your tongue at bugs or rivals. A hit pulls a bug toward you or steals one carried bug from a rival. Guard blocks a hit. The wasp makes you drop your haul. Bank bugs at your own dock.",
  },
  ghost: {
    tag: "FACE · FLASH · EXTRACT",
    buttons: ["Flash", "Ward"],
    hint: "Flash a spirit inside your facing cone, then extract it at your own dock.",
    rule: "Spirits cannot be picked up by walking over them. Aim your arrow and flash inside the cone to capture them. A flash can also stun an unwarded rival and spill cargo. Ward counters it. Bank captured spirits at your numbered dock.",
  },
  planet: {
    tag: "POSITION · KICK · PULL",
    buttons: ["Kick", "Pull"],
    hint: "Face the ball and kick into a rival goal. Your own numbered goal needs defending.",
    rule: "Move around the solar pitch. Kick only works close to the ball and sends it along your arrow. Pull bends the ball toward you at an energy cost. Score in any rival goal; an own goal awards nobody. Solo: attack the opposite practice goal.",
  },
  octopus: {
    tag: "TETHER · TUG · CONTEST",
    buttons: ["Tether", "Tug"],
    hint: "Attach to a nearby crate, steer home, and tug. Rival tethers pull in opposition.",
    rule: "Move near a crate and use Tether to attach or release. Your tether pulls it as you move; rivals can attach to the same crate. Tug gives a brief stronger pull but drains energy. A crate delivered to your own dock scores its printed value.",
  },
  tide: {
    tag: "RAID · READ TIDE · ESCAPE",
    buttons: ["Sprint", "Raft"],
    hint: "The central flood expands. Watch oxygen, raid at low tide, and bank before the surge.",
    rule: "Treasure is inside the tidal basin. Read the expanding flood ring: underwater oxygen drains, and running out drops cargo. Sprint crosses gaps; Raft protects you briefly. Return treasure to your numbered dock rather than staying in the basin.",
  },
  echo: {
    tag: "SONAR · REMEMBER · DELIVER",
    buttons: ["Ping", "Burst"],
    hint: "Ping reveals parcels briefly. Remember locations, collect them and return home.",
    rule: "Parcels are only drawn during your sonar reveal. Ping costs energy, so remember the layout and steer to unseen parcels between pings. Burst trades energy for speed. Only returning parcels to your own numbered dock scores. Bots also need sonar.",
  },
};
function arenaBase(i, n = S.n) {
  return n === 1
    ? { x: 80, y: 520 }
    : [
        { x: 80, y: 520 },
        { x: 520, y: 520 },
        { x: 80, y: 80 },
        { x: 520, y: 80 },
      ][i];
}
function arenaBlock(p, r = 16) {
  return S.d.walls.some(
    (o) => p.x > o.x - r && p.x < o.x + o.w + r && p.y > o.y - r && p.y < o.y + o.h + r,
  );
}
function arenaSpend(i, cost, cd = 0.8) {
  let p = S.d.players[i];
  if (p.cd > 0 || p.energy < cost || p.stun > 0) return false;
  p.energy -= cost;
  p.cd = cd;
  return true;
}
function arenaDrop(p, amount = 99) {
  let d = S.d,
    n = Math.min(p.carry, amount);
  for (let k = 0; k < n; k++) {
    let o = d.loot.find((v) => v.sleep > 0);
    if (!o) break;
    Object.assign(o, {
      x: clamp(p.x + rand(-25, 25), 35, 565),
      y: clamp(p.y + rand(-25, 25), 35, 565),
      sleep: 0,
      v: 1,
    });
  }
  p.carry -= n;
}
function arenaShot(i, type) {
  let p = S.d.players[i];
  S.d.shots.push({
    x: p.x + p.dx * 20,
    y: p.y + p.dy * 20,
    vx: p.dx * 290,
    vy: p.dy * 290,
    owner: i,
    type,
    life: 1.6,
  });
}
function arenaPush(i, power, radius) {
  let d = S.d,
    p = d.players[i];
  d.players.forEach((q, j) => {
    let l = dist(p, q);
    if (j !== i && l < radius && q.shield <= 0) {
      let dx = (q.x - p.x) / (l || 1),
        dy = (q.y - p.y) / (l || 1);
      q.x = clamp(q.x + dx * power, 24, 576);
      q.y = clamp(q.y + dy * power, 24, 576);
      if (arenaBlock(q)) {
        q.x = q.safeX;
        q.y = q.safeY;
      }
      q.stun = 0.35;
      arenaDrop(q, 1);
    }
  });
}
for (const id of ARENA_IDS) {
  let spec = arenaSpecs[id];
  strategyRegister(id, {
    kind: "arena",
    ...spec,
    init() {
      let d = S.d;
      d.players = many((i) => {
        let a = arenaBase(i);
        return {
          ...a,
          safeX: a.x,
          safeY: a.y,
          dx: (300 - a.x) / Math.hypot(300 - a.x, 300 - a.y),
          dy: (300 - a.y) / Math.hypot(300 - a.x, 300 - a.y),
          energy: 100,
          cd: 0,
          shield: 0,
          stun: 0,
          boost: 0,
          carry: 0,
          oxygen: 100,
          reveal: 2,
          tether: -1,
          bot: 0,
        };
      });
      d.walls =
        mi() === 0
          ? [
              { x: 155, y: 245, w: 80, h: 24 },
              { x: 365, y: 331, w: 80, h: 24 },
            ]
          : mi() === 1
            ? [
                { x: 260, y: 150, w: 30, h: 115 },
                { x: 310, y: 335, w: 30, h: 115 },
              ]
            : [
                { x: 160, y: 210, w: 95, h: 24 },
                { x: 345, y: 366, w: 95, h: 24 },
                { x: 280, y: 277, w: 40, h: 46 },
              ];
      if (id === "planet") d.walls = [];
      d.loot = Array.from({ length: 12 }, (_, k) => {
        let a = (k / 12) * Math.PI * 2;
        let r = 90 + (k % 3) * 38;
        return { x: 300 + Math.cos(a) * r, y: 300 + Math.sin(a) * r, v: 1 + (k % 2), sleep: 0 };
      });
      d.shots = [];
      d.ball = { x: 300, y: 300, vx: 0, vy: 0, last: -1 };
      d.crates = [
        { x: 260, y: 290, v: 3 },
        { x: 380, y: 280, v: 4 },
        { x: 300, y: 180, v: 2 },
      ];
      for (let o of [...d.loot, ...d.crates])
        if (arenaBlock(o, 20)) {
          let choices = [];
          for (let x = 100; x <= 500; x += 80)
            for (let y = 100; y <= 500; y += 80)
              if (
                !arenaBlock({ x, y }, 24) &&
                many((i) => arenaBase(i)).every((b) => dist(b, { x, y }) > 130)
              )
                choices.push({ x, y });
          let best = choices.sort((a, b) => dist(a, o) - dist(b, o))[0];
          if (best) {
            o.x = best.x;
            o.y = best.y;
          }
        }
      d.wasp = { x: 300, y: 300 };
      d.flood = 80;
    },
    resource(i) {
      let p = S.d.players[i];
      return (
        Math.round(p.energy) +
        "⚡ " +
        (id === "planet"
          ? ""
          : id === "octopus"
            ? p.tether >= 0
              ? "tether " + (p.tether + 1)
              : "free"
            : id === "tide"
              ? Math.round(p.oxygen) + "% O₂"
              : p.carry + "/5")
      );
    },
    action(i, k) {
      let d = S.d,
        p = d.players[i];
      if (id === "octopus") {
        if (k === 0) {
          if (p.tether >= 0) p.tether = -1;
          else {
            let best = d.crates.map((q, j) => ({ j, l: dist(p, q) })).sort((a, b) => a.l - b.l)[0];
            if (best.l < 100) p.tether = best.j;
            else ST.note("Move within the dotted tether range.");
          }
          return;
        }
        if (arenaSpend(i, 22, 0.9)) p.boost = 0.65;
        return;
      }
      if (id === "planet") {
        if (k === 0) {
          if (dist(p, d.ball) > 57) {
            ST.note("Get closer to the ball before kicking.");
            return;
          }
          if (arenaSpend(i, 18, 0.55)) {
            d.ball.vx = p.dx * 480;
            d.ball.vy = p.dy * 480;
            d.ball.last = i;
          }
        } else if (arenaSpend(i, 32, 1.1)) {
          let b = d.ball,
            l = dist(p, b);
          if (l < 180) {
            b.vx += ((p.x - b.x) / (l || 1)) * 190;
            b.vy += ((p.y - b.y) / (l || 1)) * 190;
            b.last = i;
          }
        }
        return;
      }
      if (id === "echo") {
        if (arenaSpend(i, k === 0 ? 28 : 35, k === 0 ? 1.4 : 1)) {
          if (k === 0) p.reveal = 2.4 - mi() * 0.35;
          else p.boost = 0.65;
        }
        return;
      }
      if (id === "tide") {
        if (arenaSpend(i, k === 0 ? 28 : 40, k === 0 ? 1 : 2)) {
          if (k === 0) p.boost = 0.75;
          else p.shield = 2.5;
        }
        return;
      }
      if (k === 1 && id !== "gravity" && id !== "skyhook") {
        if (arenaSpend(i, 30, 1.3)) p.shield = 1.8;
        return;
      }
      if (id === "gravity") {
        if (!arenaSpend(i, 24, 0.8)) return;
        let sign = k === 0 ? 1 : -1;
        d.loot.forEach((o) => {
          let l = dist(p, o);
          if (o.sleep <= 0 && l < 140) {
            o.x = clamp(o.x + ((p.x - o.x) / (l || 1)) * 55 * sign, 30, 570);
            o.y = clamp(o.y + ((p.y - o.y) / (l || 1)) * 55 * sign, 30, 570);
          }
        });
        if (k === 1) arenaPush(i, 60, 130);
        return;
      }
      if (id === "kite") {
        if (arenaSpend(i, 32, 1)) arenaPush(i, 100, 135);
        return;
      }
      if (id === "ghost") {
        if (!arenaSpend(i, 30, 0.9)) return;
        p.flash = 0.25;
        d.loot.forEach((o) => {
          let dx = o.x - p.x,
            dy = o.y - p.y,
            l = Math.hypot(dx, dy);
          if (o.sleep <= 0 && l < 145 && (dx * p.dx + dy * p.dy) / (l || 1) > 0.65 && p.carry < 5) {
            p.carry = Math.min(5, p.carry + o.v);
            o.sleep = 4;
          }
        });
        d.players.forEach((q, j) => {
          let l = dist(p, q);
          if (
            j !== i &&
            l < 145 &&
            q.shield <= 0 &&
            ((q.x - p.x) * p.dx + (q.y - p.y) * p.dy) / (l || 1) > 0.65
          ) {
            q.stun = 0.65;
            arenaDrop(q, 2);
          }
        });
        return;
      }
      if (id === "skyhook" && k === 1) {
        if (arenaSpend(i, 30, 1)) p.boost = 0.7;
        return;
      }
      if (arenaSpend(i, id === "sea" ? 32 : 24, id === "sea" ? 1.1 : 0.8)) arenaShot(i, id);
    },
    update(dt) {
      let d = S.d;
      d.flood = 100 + (Math.sin(S.elapsed * (0.35 + mi() * 0.06)) * 0.5 + 0.5) * 110;
      d.wasp = {
        x: 300 + Math.cos(S.elapsed * 0.8) * 150,
        y: 300 + Math.sin(S.elapsed * 1.1) * 140,
      };
      d.players.forEach((p, i) => {
        let u = d.controls[i],
          n = Math.hypot(u.x, u.y),
          speed =
            (p.boost > 0 ? 235 : 125) *
            (1 - p.carry * 0.055) *
            (id === "sea" && p.shield > 0 ? 0.6 : 1);
        p.energy = Math.min(100, p.energy + dt * (p.shield > 0 ? 4 : 12));
        p.cd = Math.max(0, p.cd - dt);
        p.stun = Math.max(0, p.stun - dt);
        p.shield = Math.max(0, p.shield - dt);
        p.boost = Math.max(0, p.boost - dt);
        p.flash = Math.max(0, (p.flash || 0) - dt);
        p.reveal = Math.max(0, p.reveal - dt);
        if (n > 0.05 && p.stun <= 0) {
          p.dx = u.x / n;
          p.dy = u.y / n;
          let ox = p.x,
            oy = p.y;
          p.x = clamp(p.x + p.dx * speed * dt * Math.min(n, 1), 24, 576);
          if (arenaBlock(p)) p.x = ox;
          p.y = clamp(p.y + p.dy * speed * dt * Math.min(n, 1), 24, 576);
          if (arenaBlock(p)) p.y = oy;
        }
        p.safeX = p.x;
        p.safeY = p.y;
        if (id === "kite") {
          let ox = p.x;
          p.x = clamp(p.x + Math.sin(S.elapsed * 0.7) * dt * (20 + mi() * 10), 24, 576);
          if (arenaBlock(p)) p.x = ox;
        }
        if (id === "tide") {
          if (dist(p, { x: 300, y: 300 }) < d.flood && p.shield <= 0) {
            p.oxygen -= dt * (25 + mi() * 5);
            if (p.oxygen <= 0) {
              arenaDrop(p);
              Object.assign(p, arenaBase(i), { oxygen: 100, stun: 1 });
              ST.note(pname(i) + " washed back to shore. Cargo dropped.");
            }
          } else p.oxygen = Math.min(100, p.oxygen + dt * 45);
        }
        if (id === "tongue" && dist(p, d.wasp) < 35 && p.shield <= 0 && p.stun <= 0) {
          arenaDrop(p, 2);
          p.stun = 0.7;
        }
        if (!["planet", "octopus", "ghost"].includes(id))
          d.loot.forEach((o) => {
            if (o.sleep <= 0 && p.carry < 5 && dist(p, o) < 25) {
              p.carry = Math.min(5, p.carry + o.v);
              o.sleep = 4 + mi();
            }
          });
        if (!["planet", "octopus"].includes(id) && p.carry && dist(p, arenaBase(i)) < 49) {
          ST.add(i, p.carry);
          p.carry = 0;
        }
      });
      // Body collision makes positioning and blocking meaningful.
      for (let i = 0; i < S.n; i++)
        for (let j = i + 1; j < S.n; j++) {
          let a = d.players[i],
            b = d.players[j],
            l = dist(a, b);
          if (l < 33) {
            let dx = (b.x - a.x) / (l || 1),
              dy = (b.y - a.y) / (l || 1);
            if (!l) dx = 1;
            let push = (33 - l) * 0.5;
            a.x = clamp(a.x - dx * push, 24, 576);
            a.y = clamp(a.y - dy * push, 24, 576);
            b.x = clamp(b.x + dx * push, 24, 576);
            b.y = clamp(b.y + dy * push, 24, 576);
            if (arenaBlock(a)) {
              a.x = a.safeX;
              a.y = a.safeY;
            }
            if (arenaBlock(b)) {
              b.x = b.safeX;
              b.y = b.safeY;
            }
          }
        }
      d.loot.forEach((o, k) => {
        if (o.sleep > 0) {
          o.sleep -= dt;
          if (o.sleep <= 0) {
            let a = k * 2.4 + S.elapsed * 0.1;
            o.x = 300 + Math.cos(a) * (80 + (k % 3) * 38);
            o.y = 300 + Math.sin(a) * (80 + (k % 3) * 38);
            if (arenaBlock(o, 5)) {
              o.x = 300;
              o.y = 300;
            }
          }
        }
      });
      d.shots.forEach((b) => {
        b.life -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 15 || b.x > 585 || b.y < 15 || b.y > 585 || arenaBlock(b, 2)) {
          b.life = 0;
          return;
        }
        let p = d.players[b.owner];
        for (let j = 0; j < S.n; j++) {
          let q = d.players[j];
          if (j === b.owner || dist(b, q) > 23 || b.life <= 0) continue;
          b.life = 0;
          if (q.shield > 0) {
            q.shield = 0;
            continue;
          }
          q.stun = 0.5;
          if ((b.type === "skyhook" || b.type === "tongue") && q.carry > 0 && p.carry < 5) {
            q.carry--;
            p.carry++;
          } else arenaDrop(q, 2);
        }
        if (b.type !== "sea")
          for (let o of d.loot)
            if (o.sleep <= 0 && dist(b, o) < 22 && b.life > 0) {
              o.x = p.x + p.dx * 24;
              o.y = p.y + p.dy * 24;
              b.life = 0;
            }
      });
      d.shots = d.shots.filter((b) => b.life > 0);
      if (id === "octopus")
        d.crates.forEach((o, k) => {
          let vx = 0,
            vy = 0;
          d.players.forEach((p) => {
            if (p.tether === k) {
              let l = dist(o, p);
              if (l > 230) {
                p.tether = -1;
                return;
              }
              let force = (p.boost > 0 ? 150 : 65) / o.v;
              vx += ((p.x - o.x) / (l || 1)) * force;
              vy += ((p.y - o.y) / (l || 1)) * force;
            }
          });
          let ox = o.x,
            oy = o.y;
          o.x = clamp(o.x + vx * dt, 30, 570);
          o.y = clamp(o.y + vy * dt, 30, 570);
          if (arenaBlock(o, 17)) {
            o.x = ox;
            o.y = oy;
          }
          d.players.forEach((p, i) => {
            if (dist(o, arenaBase(i)) < 50) {
              ST.add(i, o.v);
              o.x = 270 + k * 25;
              o.y = 270 + k * 25;
              d.players.forEach((q) => {
                if (q.tether === k) q.tether = -1;
              });
            }
          });
        });
      if (id === "planet") {
        let b = d.ball;
        b.vx *= Math.pow(0.975, dt * 60);
        b.vy *= Math.pow(0.975, dt * 60);
        if (mi() > 0) {
          let dx = 300 - b.x,
            dy = 300 - b.y,
            l = Math.hypot(dx, dy);
          b.vx += (dx / (l || 1)) * dt * (mi() === 2 ? 55 : 28);
          b.vy += (dy / (l || 1)) * dt * (mi() === 2 ? 55 : 28);
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 17 || b.x > 583) {
          b.x = clamp(b.x, 17, 583);
          b.vx *= -0.8;
        }
        if (b.y < 17 || b.y > 583) {
          b.y = clamp(b.y, 17, 583);
          b.vy *= -0.8;
        }
        d.players.forEach((p, i) => {
          let l = dist(b, p);
          if (l < 32) {
            b.x = p.x + ((b.x - p.x) / (l || 1)) * 33;
            b.y = p.y + ((b.y - p.y) / (l || 1)) * 33;
            b.vx += (b.x - p.x) * 2;
            b.vy += (b.y - p.y) * 2;
            b.last = i;
          }
        });
        let goals = S.n === 1 ? [{ x: 520, y: 80 }] : many((i) => arenaBase(i));
        goals.forEach((g, k) => {
          if (dist(b, g) < 55) {
            if (b.last >= 0 && (S.n === 1 || b.last !== k)) ST.add(b.last, 3);
            Object.assign(b, { x: 300, y: 300, vx: 0, vy: 0, last: -1 });
          }
        });
      }
      strategyControlLabels();
    },
    draw() {
      let d = S.d;
      ST.box(13, 13, 574, 574, "#fff9eb88", "#8e9e96", 14);
      if (id === "tide") {
        ST.circle(300, 300, d.flood, "#3b95b32c", "#43859f");
        ST.text("FLOOD", 300, 300, 24, "#39758e");
      }
      d.walls.forEach((o) => ST.box(o.x, o.y, o.w, o.h, "#6b7d73", "#40594f", 4));
      many((i) => {
        let b = arenaBase(i);
        ST.circle(b.x, b.y, id === "planet" ? 55 : 48, TINT[i], COL[i]);
        ST.text(
          (id === "planet" ? "GOAL " : "BANK ") + (i + 1),
          b.x,
          b.y + (b.y > 300 ? 62 : -62),
          20,
          COL[i],
        );
      });
      if (id === "planet" && S.n === 1) {
        ST.circle(520, 80, 55, "#e9d0aa", "#8f602a");
        ST.text("GOAL", 520, 80, 21);
      }
      if (id === "planet") {
        let b = d.ball;
        ST.circle(b.x, b.y, 15, "#fffef3", "#273f4b");
        ST.line({ x: 290, y: 300 }, { x: 310, y: 300 }, "#d1c5a4", 2);
      } else if (id === "octopus") {
        d.crates.forEach((o) => {
          sprite("parcel", o.x, o.y, 56);
          ST.circle(o.x + 24, o.y - 22, 17, "#fff7dd", "#8b7654");
          ST.text(o.v, o.x + 24, o.y - 22, 23);
        });
        d.players.forEach((p) => {
          if (p.tether >= 0) ST.line(p, d.crates[p.tether], "#765131", 4);
        });
      } else {
        let reveal = id !== "echo" || d.players.slice(0, prefs.humans).some((p) => p.reveal > 0);
        d.loot.forEach((o) => {
          if (o.sleep <= 0 && reveal) {
            sprite(
              id === "ghost"
                ? "ghost"
                : id === "tongue"
                  ? "bug"
                  : id === "gravity"
                    ? "gravity"
                    : id === "kite"
                      ? "ribbon"
                      : "coin",
              o.x,
              o.y,
              35,
            );
            if (o.v > 1) ST.text(o.v, o.x + 18, o.y - 16, 20);
          }
        });
      }
      if (id === "tongue") sprite("wasp", d.wasp.x, d.wasp.y, 47);
      d.shots.forEach((b) => {
        ST.line({ x: b.x - b.vx * 0.04, y: b.y - b.vy * 0.04 }, b, COL[b.owner], 6);
      });
      d.players.forEach((p, i) => {
        if (p.flash > 0) {
          c.save();
          c.globalAlpha = 0.3;
          c.fillStyle = "#e9b32c";
          c.beginPath();
          c.moveTo(p.x, p.y);
          let a = Math.atan2(p.dy, p.dx);
          c.arc(p.x, p.y, 145, a - 0.86, a + 0.86);
          c.fill();
          c.restore();
        }
        if (id === "octopus" && i < prefs.humans && p.tether < 0) {
          c.setLineDash([7, 7]);
          ST.circle(p.x, p.y, 100, null, COL[i] + "66");
          c.setLineDash([]);
        }
        if (p.shield > 0) ST.circle(p.x, p.y, 29, null, COL[i]);
        ST.circle(p.x, p.y, 18, COL[i], "#fffaf0");
        ST.text(i + 1, p.x, p.y, 22, "#fff");
        ST.line(
          { x: p.x + p.dx * 21, y: p.y + p.dy * 21 },
          { x: p.x + p.dx * 37, y: p.y + p.dy * 37 },
          COL[i],
          6,
        );
        if (p.carry) ST.text(p.carry, p.x, p.y + 36, 22, COL[i]);
        if (p.stun > 0) ST.text("!", p.x, p.y - 34, 26, "#b7432d");
        if (id === "tide") {
          ST.box(p.x - 21, p.y - 31, 42, 6, "#d6dcce", null, 2);
          ST.box(
            p.x - 21,
            p.y - 31,
            (42 * p.oxygen) / 100,
            6,
            p.oxygen < 30 ? "#b7432d" : "#3f7f91",
            null,
            2,
          );
        }
      });
    },
  });
}

function arenaWaypoint(from, goal) {
  let clear = true;
  for (let t = 0; t <= 20; t++)
    if (
      arenaBlock(
        { x: from.x + ((goal.x - from.x) * t) / 20, y: from.y + ((goal.y - from.y) * t) / 20 },
        24,
      )
    ) {
      clear = false;
      break;
    }
  if (clear) return goal;
  let points = Array.from({ length: 100 }, (_, k) => ({
      x: 30 + (k % 10) * 60,
      y: 30 + Math.floor(k / 10) * 60,
    })),
    free = points.map((p, k) => ({ p, k })).filter((o) => !arenaBlock(o.p, 25)),
    start = free.slice().sort((a, b) => dist(a.p, from) - dist(b.p, from))[0]?.k,
    end = free.slice().sort((a, b) => dist(a.p, goal) - dist(b.p, goal))[0]?.k;
  if (start === undefined || end === undefined) return goal;
  let q = [[start, []]],
    seen = new Set([start]);
  while (q.length) {
    let [k, path0] = q.shift();
    if (k === end) {
      let route = [start, ...path0];
      let pick = route.find((k) => dist(points[k], from) > 50);
      return points[pick ?? end];
    }
    for (let n of ST.neighbors(k, 10))
      if (!seen.has(n) && !arenaBlock(points[n], 25)) {
        seen.add(n);
        q.push([n, path0.concat(n)]);
      }
  }
  return goal;
}

function strategyArenaBots(def, dt) {
  let d = S.d,
    id = S.g.id;
  for (let i = prefs.humans; i < S.n; i++) {
    let p = d.players[i];
    p.bot -= dt;
    if (p.bot > 0) continue;
    let skill = botSkill();
    p.bot = skill.delay;
    let target = arenaBase(i),
      nearestEnemy = d.players
        .map((q, j) => ({ q, j, l: j === i ? 9999 : dist(p, q) }))
        .sort((a, b) => a.l - b.l)[0];
    if (id === "planet") {
      let b = d.ball,
        goal = S.n === 1 ? { x: 520, y: 80 } : arenaBase((i + 1) % S.n),
        l = dist(b, goal);
      target = {
        x: b.x + ((b.x - goal.x) / (l || 1)) * 35,
        y: b.y + ((b.y - goal.y) / (l || 1)) * 35,
      };
      if (dist(p, b) < 60) {
        let dx = goal.x - p.x,
          dy = goal.y - p.y,
          n = Math.hypot(dx, dy);
        p.dx = dx / n;
        p.dy = dy / n;
        def.action(i, 0);
      } else if (dist(p, b) < 130 && p.energy > 60) def.action(i, 1);
    } else if (id === "octopus") {
      if (p.tether < 0) {
        let o = d.crates.map((q, j) => ({ q, j, l: dist(p, q) })).sort((a, b) => a.l - b.l)[0];
        target = o.q;
        if (o.l < 95) def.action(i, 0);
      } else {
        let crate = d.crates[p.tether],
          waypoint = arenaWaypoint(crate, arenaBase(i)),
          vx = waypoint.x - crate.x,
          vy = waypoint.y - crate.y,
          l = Math.hypot(vx, vy);
        target = {
          x: clamp(crate.x + (vx / (l || 1)) * Math.min(l, 130), 24, 576),
          y: clamp(crate.y + (vy / (l || 1)) * Math.min(l, 130), 24, 576),
        };
        if (p.energy > 35) def.action(i, 1);
      }
    } else {
      let visible = id !== "echo" || p.reveal > 0;
      if (p.carry < 3 && !(id === "tide" && p.oxygen < 45)) {
        let options = d.loot.filter((o) => o.sleep <= 0 && visible);
        if (options.length) {
          let o = options.sort((a, b) => dist(a, p) / a.v - dist(b, p) / b.v)[0];
          target = o;
          p.memory = { x: o.x, y: o.y };
        } else if (id === "echo") {
          target = p.memory || { x: 300, y: 300 };
          if (p.energy > 35) def.action(i, 0);
        }
      }
      if (id === "tide" && p.oxygen < 40) {
        target = arenaBase(i);
        if (p.energy > 42) def.action(i, 1);
      }
      if (id === "ghost" && dist(p, target) < 140) {
        let dx = target.x - p.x,
          dy = target.y - p.y,
          l = Math.hypot(dx, dy);
        p.dx = dx / (l || 1);
        p.dy = dy / (l || 1);
        def.action(i, 0);
      }
      if (["skyhook", "tongue"].includes(id) && dist(p, target) < 160 && p.carry < 3)
        def.action(i, 0);
      if (id === "gravity" && p.carry < 4) def.action(i, 0);
      if (nearestEnemy.l < 100 && nearestEnemy.q.carry > 0 && p.energy > 50) {
        if (["sea", "tongue", "skyhook"].includes(id)) {
          let q = nearestEnemy.q,
            l = nearestEnemy.l;
          p.dx = (q.x - p.x) / (l || 1);
          p.dy = (q.y - p.y) / (l || 1);
        }
        def.action(i, 0);
      }
      if (nearestEnemy.l < 100 && p.carry >= 3 && p.energy > 40) def.action(i, 1);
    }
    let dx = target.x - p.x,
      dy = target.y - p.y,
      l = Math.hypot(dx, dy),
      x = dx / (l || 1),
      y = dy / (l || 1);
    let probe = { x: p.x + x * 48, y: p.y + y * 48 };
    if (arenaBlock(probe, 20)) {
      let left = { x: p.x - y * 50, y: p.y + x * 50 },
        right = { x: p.x + y * 50, y: p.y - x * 50 };
      if (!arenaBlock(left, 20) && left.x > 25 && left.x < 575 && left.y > 25 && left.y < 575) {
        let t = x;
        x = -y;
        y = t;
      } else if (!arenaBlock(right, 20)) {
        let t = x;
        x = y;
        y = -t;
      } else {
        x = -x;
        y = -y;
      }
    }
    if (Math.random() < skill.error) {
      x += rand(-0.7, 0.7);
      y += rand(-0.7, 0.7);
    }
    d.controls[i] = { x: l < 12 ? 0 : x, y: l < 12 ? 0 : y, held: true };
  }
}
// TWELVE PLANNING / BOARD SYSTEMS. Public legal previews and fixed rounds replace tap races.
function tableRegister(id, def) {
  let init = def.init;
  strategyRegister(id, {
    kind: "table",
    ...def,
    init() {
      init();
      S.d.botWait = botSkill().delay * 1.8;
    },
    bot(i) {
      let list = def.choices(i);
      if (!list.length) {
        engines[id].action(i, 2);
        return;
      }
      list.sort((a, b) => b.v - a.v);
      let pick = Math.random() < botSkill().error ? chosen(list) : list[0];
      S.d.sel = pick.sel;
      S.d.mode = pick.mode || 0;
      def.botSelect?.(pick);
      engines[id].action(i, 0);
    },
  });
}
function gridTap(g) {
  return (i, p) => {
    S.d.sel = ST.index(p, g);
  };
}
function invalid(t) {
  ST.note(t);
  return false;
}
function miniCards(items, selected, y = 510) {
  let w = 540 / items.length;
  items.forEach((a, k) => {
    ST.box(
      34 + k * w,
      y,
      w - 8,
      76,
      k === selected ? TINT[S.d.turn] : "#fffbef",
      k === selected ? COL[S.d.turn] : "#b9bba7",
    );
    (Array.isArray(a) ? a : [a]).forEach((v, j) =>
      ST.text(v, 30 + (k + 0.5) * w, y + 22 + j * 28, 22),
    );
  });
}
function miniAt(p, n, y = 510) {
  return p.y >= y && p.y < y + 76 ? ST.cardAt({ ...p, y: y + 10 }, n, y) : -1;
}

function moleDistance(start, targets, rocks, occupied) {
  if (!targets.length) return 30;
  let q = [{ k: start, v: 0 }],
    seen = new Map();
  while (q.length) {
    q.sort((a, b) => a.v - b.v);
    let o = q.shift();
    if (seen.has(o.k)) continue;
    seen.set(o.k, o.v);
    if (targets.includes(o.k)) return o.v;
    for (let k of ST.neighbors(o.k))
      if (!occupied.has(k) && !seen.has(k)) q.push({ k, v: o.v + (rocks.has(k) ? 2 : 1) });
  }
  return 50;
}
function golemDistance(start, rune) {
  let q = [{ k: start, v: 0 }],
    seen = new Set();
  while (q.length) {
    let o = q.shift();
    if (seen.has(o.k)) continue;
    seen.add(o.k);
    for (let p of PROGRAMS)
      for (let a of [p, p.slice().reverse()]) {
        let k = o.k;
        for (let cmd of a) {
          let x = (k % 5) + [0, 1, 0, -1][cmd],
            y = Math.floor(k / 5) + [-1, 0, 1, 0][cmd],
            n = y * 5 + x;
          if (x < 0 || x > 4 || y < 0 || y > 4 || S.d.walls.has(n)) continue;
          k = n;
          if (k === rune) return o.v + 1;
        }
        if (!seen.has(k)) q.push({ k, v: o.v + 1 });
      }
  }
  return 40;
}

const G6 = ST.grid(6, 6, 88, 480);
tableRegister("fossil", {
  tag: "DEDUCE · SCAN · EXCAVATE",
  modes: ["Scan", "Excavate"],
  rule: "Select a square, then Confirm. Scan costs 1 tool and reveals the number of fossils in its eight neighbours—not whether the square itself contains one. Excavate costs 2 tools: a fossil earns 4, an empty hole costs 1 point. Everyone shares clues. You regain 2 tools each round. Plan from the numbers instead of digging blindly.",
  init() {
    let d = S.d;
    d.bones = new Set(shuffle([...Array(36).keys()]).slice(0, 8 + mi()));
    d.revealed = Array(36).fill(false);
    d.clues = Array(36).fill(-1);
    d.tools = many(() => 6);
  },
  resource(i) {
    return S.d.tools[i] + " tools";
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (k < 0 || d.revealed[k]) return invalid("Choose an unexcavated square.");
    let cost = d.mode === 0 ? 1 : 2;
    if (d.tools[i] < cost) return invalid("Not enough tools. Pass to wait for the next round.");
    if (d.mode === 0 && d.clues[k] >= 0) return invalid("That clue is already visible.");
    d.tools[i] -= cost;
    if (d.mode === 0) {
      d.clues[k] = ST.cellsNear(k).filter((n) => d.bones.has(n)).length;
      ST.note("Clue: " + d.clues[k] + " fossils around this square.");
    } else {
      d.revealed[k] = true;
      ST.add(i, d.bones.has(k) ? 4 : -1);
      d.clues[k] = ST.cellsNear(k).filter((n) => d.bones.has(n)).length;
      ST.note(d.bones.has(k) ? "Fossil preserved: +4." : "Empty excavation: −1.");
    }
    return true;
  },
  round() {
    S.d.tools = S.d.tools.map((n) => Math.min(8, n + 2));
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 36; k++)
      if (!d.revealed[k]) {
        let known = ST.cellsNear(k).filter((n) => d.clues[n] >= 0),
          risk =
            known.reduce(
              (v, n) =>
                v +
                (d.clues[n] -
                  ST.cellsNear(n).filter((q) => d.revealed[q] && d.bones.has(q)).length) /
                  Math.max(1, ST.cellsNear(n).filter((q) => !d.revealed[q]).length),
              0,
            ) / (known.length || 1);
        if (d.tools[i] >= 1 && d.clues[k] < 0)
          a.push({ sel: k, mode: 0, v: 0.7 + known.length * 0.05 });
        if (d.tools[i] >= 2)
          a.push({ sel: k, mode: 1, v: risk * 5 - 1 + (known.length ? 0 : -0.2) });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Shared dig site",
      d.bones.size -
        d.revealed.filter((v, k) => v && d.bones.has(k)).length +
        " fossils still buried · numbers count neighbours",
    );
    ST.cells(G6, (k, p) => {
      if (d.revealed[k]) {
        ST.box(p.x - 37, p.y - 37, 74, 74, d.bones.has(k) ? "#e9d295" : "#d8d5c8");
        if (d.bones.has(k)) sprite("fossil", p.x, p.y, 50);
        else ST.text("·", p.x, p.y, 25);
      } else if (d.clues[k] >= 0)
        ST.text(d.clues[k], p.x, p.y, 32, d.clues[k] ? "#315e79" : "#83968b");
      else ST.text("?", p.x, p.y, 27, "#9a927d");
    });
    ST.select(d.sel, G6);
  },
});
tableRegister("mole", {
  tag: "TUNNEL · ROUTE · RETURN",
  modes: ["Move", "Dig"],
  rounds: 20,
  rule: "Your numbered mole starts at its coloured postbox. Select an adjacent square: Move walks onto clear soil; Dig removes a rock but does not move you. Rocks cost 2 energy; walking costs 1. Collect a shared parcel, then return to your own postbox for 5 points. Everyone can use a tunnel after it is dug. Regain 1 energy each turn.",
  init() {
    let d = S.d;
    d.pos = [30, 35, 0, 5].slice(0, S.n);
    d.bases = d.pos.slice();
    d.rocks = new Set(
      (mi() === 1 ? [8, 9, 13, 14, 20, 22, 26, 27] : [7, 9, 13, 16, 19, 22, 26, 28]).filter(
        (k) => !d.pos.includes(k),
      ),
    );
    if (mi() === 2) [8, 14, 21, 27].forEach((k) => d.rocks.add(k));
    d.mail = new Set([14, 20, 15].filter((k) => !d.rocks.has(k)));
    if (!d.mail.size) d.mail.add(18);
    d.carry = many(() => false);
    d.energy = many(() => 6);
  },
  resource(i) {
    return S.d.energy[i] + "⚡ " + (S.d.carry[i] ? "MAIL" : "empty");
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (!ST.neighbors(d.pos[i]).includes(k)) return invalid("Choose a square beside your mole.");
    if (d.mode === 1) {
      if (!d.rocks.has(k) || d.energy[i] < 2)
        return invalid("Dig an adjacent rock; it costs 2 energy.");
      d.energy[i] -= 2;
      d.rocks.delete(k);
    } else {
      if (d.rocks.has(k) || d.energy[i] < 1 || d.pos.some((p, j) => j !== i && p === k))
        return invalid("Clear soil only. A rival mole blocks that square.");
      d.energy[i]--;
      d.pos[i] = k;
      if (d.mail.has(k) && !d.carry[i]) {
        d.mail.delete(k);
        d.carry[i] = true;
      }
      if (k === d.bases[i] && d.carry[i]) {
        ST.add(i, 5);
        d.carry[i] = false;
        let empty = [...Array(36).keys()].filter(
          (q) => !d.rocks.has(q) && !d.bases.includes(q) && !d.mail.has(q),
        );
        if (empty.length) d.mail.add(chosen(empty));
      }
    }
    return true;
  },
  afterTurn() {
    S.d.energy = S.d.energy.map((n) => Math.min(7, n + 1));
  },
  choices(i) {
    let d = S.d,
      target = d.carry[i] ? [d.bases[i]] : [...d.mail],
      a = [];
    for (let k of ST.neighbors(d.pos[i])) {
      let occupied = new Set(d.pos.filter((_, j) => j !== i));
      if (occupied.has(k)) continue;
      let route = moleDistance(k, target, d.rocks, occupied);
      if (d.rocks.has(k) && d.energy[i] >= 2) a.push({ sel: k, mode: 1, v: 20 - route - 1 });
      else if (!d.rocks.has(k) && d.energy[i] > 0) a.push({ sel: k, mode: 0, v: 20 - route });
    }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Carry one parcel. Find a route.",
      "Shared tunnels · blocked squares need a Dig turn",
    );
    ST.cells(G6, (k, p) => {
      if (d.rocks.has(k)) {
        ST.box(p.x - 37, p.y - 37, 74, 74, "#6a786e");
        ST.text("ROCK", p.x, p.y, 20, "#fff");
      }
      d.bases.forEach((v, i) => {
        if (v === k) {
          ST.box(p.x - 36, p.y - 36, 72, 72, TINT[i], COL[i]);
          ST.text("P" + (i + 1), p.x, p.y - 21, 21, COL[i]);
        }
      });
      if (d.mail.has(k)) sprite("parcel", p.x, p.y, 43);
      d.pos.forEach((v, i) => {
        if (v === k) {
          ST.circle(p.x, p.y + 6, 23, COL[i]);
          ST.text(i + 1, p.x, p.y + 6, 25, "#fff");
        }
      });
    });
    ST.select(d.sel, G6);
  },
});
const GG = ST.grid(5, 5, 84, 400);
const PROGRAMS = [
  [0, 0, 1],
  [1, 1, 2],
  [2, 2, 3],
  [3, 3, 0],
];
function golemRun(i, program, award = false) {
  let d = S.d,
    k = d.pos[i],
    route = [];
  for (let cmd of program) {
    let x = (k % 5) + [0, 1, 0, -1][cmd],
      y = Math.floor(k / 5) + [-1, 0, 1, 0][cmd],
      next = y * 5 + x;
    if (x < 0 || x > 4 || y < 0 || y > 4 || d.walls.has(next)) continue;
    k = next;
    route.push(k);
    if (award && k === d.rune) {
      ST.add(i, 4);
      d.rune = chosen(
        [...Array(25).keys()].filter((n) => !d.walls.has(n) && !d.pos.includes(n) && n !== k),
      );
    }
  }
  return { k, route };
}
tableRegister("golem", {
  tag: "PROGRAM · PREDICT · BLOCK",
  modes: ["Normal", "Reverse"],
  rounds: 10,
  rule: "Select a three-step program below the grid. The highlighted landing is a legal preview; walls cancel individual steps. Reverse flips the order of the three commands. Confirm runs your program. A rune crossed earns 4 points. Landing on a rival sends it back to its start, so positioning can deny their next route.",
  init() {
    S.d.pos = [20, 24, 0, 4].slice(0, S.n);
    S.d.starts = S.d.pos.slice();
    S.d.rune = 12;
    S.d.walls = new Set(mi() === 0 ? [6, 18] : mi() === 1 ? [6, 8, 16, 18] : [7, 11, 18]);
    S.d.programs = PROGRAMS;
  },
  resource(i) {
    return "cell " + (S.d.pos[i] + 1);
  },
  tap(i, p) {
    S.d.sel = miniAt(p, 4);
  },
  act(i, k) {
    if (k < 0 || k > 3) return invalid("Choose one of the four programs.");
    let a = PROGRAMS[k].slice();
    if (S.d.mode) a.reverse();
    let out = golemRun(i, a, true);
    S.d.pos.forEach((p, j) => {
      if (j !== i && p === out.k) S.d.pos[j] = S.d.starts[j];
    });
    S.d.pos[i] = out.k;
    return true;
  },
  choices(i) {
    return PROGRAMS.flatMap((p, k) =>
      [0, 1].map((mode) => {
        let a = mode ? p.slice().reverse() : p,
          o = golemRun(i, a),
          r = S.d.rune;
        return { sel: k, mode, v: o.route.includes(r) ? 100 : 20 - golemDistance(o.k, r) };
      }),
    );
  },
  draw() {
    let d = S.d;
    ST.banner("Program three steps", "Rune +4 · landing on a rival resets it");
    ST.cells(GG, (k, p) => {
      if (d.walls.has(k)) ST.box(p.x - 37, p.y - 37, 74, 74, "#586c60");
      if (d.rune === k) sprite("coin", p.x, p.y, 42);
      d.pos.forEach((q, i) => {
        if (k === q) {
          ST.circle(p.x, p.y, 24, COL[i]);
          ST.text(i + 1, p.x, p.y, 25, "#fff");
        }
      });
    });
    if (d.sel >= 0) {
      let a = PROGRAMS[d.sel].slice();
      if (d.mode) a.reverse();
      let out = golemRun(d.turn, a),
        last = ST.xy(d.pos[d.turn], GG);
      out.route.forEach((k) => {
        let p = ST.xy(k, GG);
        ST.line(last, p, COL[d.turn], 5);
        last = p;
      });
      ST.select(out.k, GG);
    }
    d.pos.forEach((k, i) => {
      let p = ST.xy(k, GG);
      ST.circle(p.x, p.y, 24, COL[i]);
      ST.text(i + 1, p.x, p.y, 25, "#fff");
    });
    miniCards(
      PROGRAMS.map((p) =>
        (d.mode ? p.slice().reverse() : p).map((k) => ["↑", "→", "↓", "←"][k]).join(" "),
      ),
      d.sel,
    );
  },
});
tableRegister("sunshine", {
  tag: "PLANT · GROW · SHADE",
  modes: ["Plant", "Grow", "Uproot"],
  rule: "Plant beside one of your plants for 2 water, or grow a selected plant for 2 water. Your first seed may go anywhere. Maximum height is 3. A taller neighbouring rival shades you and prevents growth. Uproot one of your plants to recover 2 water. Water refills by 1 / 2 / 3 per round on variants 1 / 2 / 3. After eight rounds, each plant scores its height, plus 3 for an uncontested tallest plant in a row.",
  init() {
    S.d.tiles = Array(36).fill(null);
    S.d.water = many(() => 5);
  },
  resource(i) {
    return S.d.water[i] + " water";
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (k < 0) return invalid("Select a garden square.");
    let o = d.tiles[k];
    if (d.mode === 2) {
      if (o?.owner !== i) return invalid("Only your own plants can be uprooted.");
      d.tiles[k] = null;
      d.water[i] += 2;
      return true;
    }
    if (d.water[i] < 2) return invalid("You need 2 water. Pass to replenish.");
    if (d.mode === 0) {
      if (o) return invalid("Plant on empty soil.");
      if (
        d.tiles.some((o) => o?.owner === i) &&
        !ST.neighbors(k).some((n) => d.tiles[n]?.owner === i)
      )
        return invalid("New plants must touch your own roots.");
      d.tiles[k] = { owner: i, h: 1 };
    } else {
      if (!o || o.owner !== i || o.h >= 3) return invalid("Grow your own plant, up to height 3.");
      if (ST.neighbors(k).some((n) => d.tiles[n] && d.tiles[n].owner !== i && d.tiles[n].h > o.h))
        return invalid("A taller rival shades this plant. Grow elsewhere or reroute.");
      o.h++;
    }
    d.water[i] -= 2;
    return true;
  },
  round() {
    S.d.water = S.d.water.map((n) => Math.min(9, n + mi() + 1));
  },
  end() {
    let d = S.d;
    d.tiles.forEach((o) => {
      if (o) ST.add(o.owner, o.h);
    });
    for (let row = 0; row < 6; row++) {
      let a = d.tiles.slice(row * 6, row * 6 + 6).filter(Boolean),
        max = Math.max(0, ...a.map((o) => o.h)),
        leaders = a.filter((o) => o.h === max);
      if (leaders.length === 1) ST.add(leaders[0].owner, 3);
    }
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 36; k++) {
      let o = d.tiles[k];
      if (d.water[i] >= 2) {
        if (
          !o &&
          (!d.tiles.some((t) => t?.owner === i) ||
            ST.neighbors(k).some((n) => d.tiles[n]?.owner === i))
        )
          a.push({ sel: k, mode: 0, v: 4 + ST.neighbors(k).filter((n) => !d.tiles[n]).length });
        if (
          o?.owner === i &&
          o.h < 3 &&
          !ST.neighbors(k).some((n) => d.tiles[n] && d.tiles[n].owner !== i && d.tiles[n].h > o.h)
        )
          a.push({ sel: k, mode: 1, v: 7 + o.h });
      }
    }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Grow into the light",
      "Water +" + (mi() + 1) + "/round · heights + row bonuses at end",
    );
    ST.cells(G6, (k, p) => {
      let o = d.tiles[k];
      if (o) {
        ST.box(p.x - 35, p.y - 35, 70, 70, TINT[o.owner], COL[o.owner]);
        sprite("sunshine", p.x, p.y - 3, 46);
        ST.text("P" + (o.owner + 1) + " · " + o.h, p.x, p.y + 25, 21, COL[o.owner]);
      }
    });
    ST.select(d.sel, G6);
  },
});
tableRegister("orchard", {
  tag: "GROW · WAIT · HARVEST",
  modes: ["Harvest", "Lamp"],
  rule: "Fruit ripens by one stage in the sunlit column each round. Select and harvest fruit at stage 2–4 for its stage in points; stage 5 rots to zero. Lamp costs a turn to ripen a square and its neighbours by one stage—use it to set up a harvest or spoil a rival’s opportunity. After a harvest, a new stage-0 fruit grows there.",
  init() {
    S.d.fruit = Array.from({ length: 25 }, (_, k) => (k + mi()) % 4);
    S.d.sun = mi() % 5;
  },
  tap: gridTap(ST.grid(5, 5, 88, 480)),
  act(i, k) {
    if (k < 0 || k >= 25) return invalid("Select a fruit square.");
    let d = S.d;
    if (d.mode === 0) {
      if (d.fruit[k] < 2) return invalid("Fruit needs stage 2 before harvesting.");
      ST.add(i, d.fruit[k]);
      d.fruit[k] = 0;
    } else {
      for (let n of [k, ...ST.neighbors(k, 5)]) d.fruit[n] = (d.fruit[n] + 1) % 5;
    }
    return true;
  },
  round() {
    let d = S.d;
    for (let k = 0; k < 25; k++) if (k % 5 === d.sun) d.fruit[k] = (d.fruit[k] + 1) % 5;
    d.sun = (d.sun + 1) % 5;
  },
  choices() {
    return S.d.fruit.flatMap((v, k) =>
      v >= 2
        ? [{ sel: k, mode: 0, v: v * 3 }]
        : [{ sel: k, mode: 1, v: ST.neighbors(k, 5).filter((n) => S.d.fruit[n] === 1).length - 1 }],
    );
  },
  draw() {
    let d = S.d,
      g = ST.grid(5, 5, 88, 480);
    ST.banner(
      "Wait for ripe. Do not wait too long.",
      "Next sunlight: column " + (d.sun + 1) + " · stage 5 rots",
    );
    ST.cells(g, (k, p) => {
      if (k % 5 === d.sun)
        ST.box(p.x - g.cell / 2 + 3, p.y - g.cell / 2 + 3, g.cell - 6, g.cell - 6, "#f2df9e66");
      sprite("orchard", p.x, p.y - 7, 46);
      ST.text(d.fruit[k] + " / 4", p.x, p.y + 29, 23, d.fruit[k] >= 2 ? "#377146" : "#827a6b");
    });
    ST.select(d.sel, g);
  },
});
tableRegister("parcel", {
  tag: "DISPATCH · TOLL · CONGESTION",
  modes: ["Dispatch", "Build toll"],
  rounds: 10,
  rule: "Choose one of three routes. Dispatch spends 1 coin; routes pay 3 / 5 / 8 after 1 / 2 / 3 rounds. Every shipment already on the route adds one round of congestion. A rival toll transfers 1 of your eventual payout to its owner. Build toll costs 3 coins and claims an unowned route. Gain 1 coin each round. Undelivered parcels are lost at the end, so watch the deadline.",
  init() {
    S.d.coins = many(() => 5 - mi());
    S.d.tolls = [-1, -1, -1];
    S.d.shipments = [];
  },
  resource(i) {
    return S.d.coins[i] + " coins";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 160);
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 2) return invalid("Select a route card.");
    if (d.mode === 1) {
      if (d.tolls[k] >= 0 || d.coins[i] < 3)
        return invalid("A toll costs 3 coins on an unowned route.");
      d.coins[i] -= 3;
      d.tolls[k] = i;
    } else {
      if (d.coins[i] < 1) return invalid("Dispatch costs 1 coin.");
      d.coins[i]--;
      d.shipments.push({
        owner: i,
        route: k,
        eta: k + 1 + d.shipments.filter((o) => o.route === k).length,
        value: [3, 5, 8][k],
      });
    }
    return true;
  },
  round() {
    let d = S.d;
    d.coins = d.coins.map((n) => n + 1);
    d.shipments.forEach((o) => o.eta--);
    let done = d.shipments.filter((o) => o.eta <= 0);
    done.forEach((o) => parcelPay(o));
    d.shipments = d.shipments.filter((o) => o.eta > 0);
  },
  end() {
    S.d.shipments = [];
  },
  choices(i) {
    let d = S.d;
    return [0, 1, 2].flatMap((k) => {
      let a = [];
      if (d.coins[i] >= 1)
        a.push({
          sel: k,
          mode: 0,
          v:
            [3, 5, 8][k] / (k + 1 + d.shipments.filter((o) => o.route === k).length) -
            +(d.tolls[k] >= 0 && d.tolls[k] !== i),
        });
      if (d.coins[i] >= 3 && d.tolls[k] < 0 && d.round < 5 && S.n > 1)
        a.push({ sel: k, mode: 1, v: 3.4 - k * 0.25 });
      return a;
    });
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Public routes. Real congestion.",
      "Tolls transfer points · queued parcels add delay",
    );
    ST.cards(
      [0, 1, 2].map((k) => [
        "ROUTE " + (k + 1),
        [3, 5, 8][k] + "pt / " + (k + 1 + d.shipments.filter((o) => o.route === k).length) + "rd",
      ]),
      d.sel,
      160,
    );
    [0, 1, 2].forEach((k) => {
      let x = 120 + k * 180;
      ST.text(
        d.tolls[k] < 0 ? "No toll" : "Toll P" + (d.tolls[k] + 1),
        x,
        294,
        23,
        d.tolls[k] < 0 ? STR.muted : COL[d.tolls[k]],
      );
      let q = d.shipments.filter((o) => o.route === k);
      q.slice(0, 6).forEach((o, j) => {
        ST.box(x - 78, 330 + j * 36, 156, 31, TINT[o.owner], COL[o.owner]);
        ST.text("P" + (o.owner + 1) + " · ETA " + o.eta, x, 346 + j * 36, 21, COL[o.owner]);
      });
    });
  },
});
function parcelPay(o) {
  let toll = S.d.tolls[o.route],
    tax = toll >= 0 && toll !== o.owner ? 1 : 0;
  ST.add(o.owner, o.value - tax);
  if (tax) ST.add(toll, 1);
}
const RECIPES = [
  { need: [2, 1, 0], v: 5, heat: 2 },
  { need: [0, 2, 2], v: 7, heat: 3 },
  { need: [2, 0, 3], v: 9, heat: 4 },
];
tableRegister("potion", {
  tag: "DRAFT · BREW · STABILISE",
  modes: ["Gather", "Brew", "Cool"],
  rounds: 10,
  rule: "Gather one ingredient from the limited shared stock, or select a recipe and Brew it from your inventory. Brewing increases shared instability; at 10 it explodes and everyone loses one of every ingredient. Cool spends your turn reducing instability by 4. Recipes pay 5 / 7 / 9. Stock refills by one of each ingredient each round.",
  init() {
    S.d.stock = [2 + mi(), 4 - mi(), 3];
    S.d.inv = many(() => [1, 1, 1]);
    S.d.heat = mi() * 2;
  },
  resource(i) {
    return S.d.inv[i].join(" / ");
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, p.y < 300 ? 160 : 365) + (p.y < 300 ? 0 : 3);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      if (d.heat <= 0) return invalid("The cauldron is already stable.");
      d.heat = Math.max(0, d.heat - 4);
      return true;
    }
    if (d.mode === 0) {
      if (k < 0 || k > 2 || d.stock[k] <= 0)
        return invalid("Select an ingredient with remaining stock.");
      d.stock[k]--;
      d.inv[i][k]++;
    } else {
      if (k < 3 || k > 5) return invalid("Select a recipe in the lower row.");
      let r = RECIPES[k - 3];
      if (r.need.some((n, j) => d.inv[i][j] < n))
        return invalid("Missing ingredients. Inventory order: Fire / Water / Herb.");
      r.need.forEach((n, j) => (d.inv[i][j] -= n));
      ST.add(i, r.v);
      d.heat += r.heat;
      if (d.heat >= 10) {
        d.inv = d.inv.map((a) => a.map((n) => Math.max(0, n - 1)));
        d.heat = 0;
        ST.note("Cauldron burst: everyone lost one of each ingredient.");
      }
    }
    return true;
  },
  round() {
    S.d.stock = S.d.stock.map((n) => Math.min(5, n + 1));
  },
  choices(i) {
    let d = S.d,
      a = [];
    RECIPES.forEach((r, k) => {
      if (r.need.every((n, j) => d.inv[i][j] >= n)) a.push({ sel: k + 3, mode: 1, v: r.v + 3 });
    });
    for (let k = 0; k < 3; k++)
      if (d.stock[k] > 0) a.push({ sel: k, mode: 0, v: 4 - d.inv[i][k] + (k === 2 ? 0.3 : 0) });
    if (d.heat >= 7) a.push({ sel: 0, mode: 2, v: 3 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Ingredient market",
      "Instability " + d.heat + "/10 · your bag: " + d.inv[d.turn].join(" / "),
    );
    ST.cards(
      ["FIRE", "WATER", "HERB"].map((s, k) => [s, "Stock " + d.stock[k]]),
      d.sel,
      160,
    );
    ST.text("RECIPES · Fire / Water / Herb", 300, 325, 23);
    ST.cards(
      RECIPES.map((r) => [r.need.join(" / "), r.v + " pts · +" + r.heat + " risk"]),
      d.sel - 3,
      365,
    );
    ST.text("Cool = −4 instability, no ingredients", 300, 526, 22, STR.muted);
  },
});
const SHAPES = [
  [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
];
function roomShape(k, rot) {
  let a = SHAPES[k].map((p) => p.slice());
  for (let n = 0; n < rot; n++) a = a.map(([x, y]) => [-y, x]);
  let mx = Math.min(...a.map((p) => p[0])),
    my = Math.min(...a.map((p) => p[1]));
  return a.map(([x, y]) => [x - mx, y - my]);
}
function roomCells(sel, shape) {
  let x = sel % 6,
    y = Math.floor(sel / 6),
    a = shape.map(([dx, dy]) => [x + dx, y + dy]);
  return a.some(([x, y]) => x < 0 || x >= 6 || y < 0 || y >= 6) ? [] : a.map(([x, y]) => y * 6 + x);
}
tableRegister("room", {
  tag: "DRAFT · ROTATE · PACK",
  modes: ["0°", "90°", "180°", "270°"],
  rule: "Choose one of three pieces below the shared floor, then select the top-left placement square. Mode rotates the piece; the outlined footprint is the placement preview. Confirm fits it without overlap. Each new tile scores 1. Completing a row or column earns 4 extra for the placer, then that line clears. Deny rivals easy completions.",
  init() {
    S.d.floor = Array(36).fill(-1);
    S.d.offer = [mi() % 4, (mi() + 1) % 4, (mi() + 2) % 4];
    S.d.piece = 0;
  },
  tap(i, p) {
    let k = miniAt(p, 3);
    if (k >= 0) S.d.piece = k;
    else S.d.sel = ST.index(p, ST.grid(6, 6, 76, 420));
  },
  act(i, k) {
    let d = S.d;
    if (k < 0) return invalid("Choose a piece and a placement square.");
    let cells = roomCells(k, roomShape(d.offer[d.piece], d.mode));
    if (!cells.length || cells.some((n) => d.floor[n] >= 0))
      return invalid("That shape overlaps or runs off the floor.");
    cells.forEach((n) => (d.floor[n] = i));
    ST.add(i, cells.length);
    let clear = new Set();
    for (let n = 0; n < 6; n++) {
      let row = [0, 1, 2, 3, 4, 5].map((x) => n * 6 + x),
        col = [0, 1, 2, 3, 4, 5].map((y) => y * 6 + n);
      for (let a of [row, col])
        if (a.every((q) => d.floor[q] >= 0)) {
          a.forEach((q) => clear.add(q));
          ST.add(i, 4);
        }
    }
    clear.forEach((n) => (d.floor[n] = -1));
    d.offer[d.piece] = (d.offer[d.piece] + 1 + mi()) % 4;
    return true;
  },
  choices() {
    let d = S.d,
      a = [];
    d.offer.forEach((shape, piece) => {
      for (let mode = 0; mode < 4; mode++)
        for (let sel = 0; sel < 36; sel++) {
          let cells = roomCells(sel, roomShape(shape, mode));
          if (cells.length && cells.every((n) => d.floor[n] < 0)) {
            let complete = 0;
            for (let r = 0; r < 6; r++) {
              for (let row of [
                [0, 1, 2, 3, 4, 5].map((k) => r * 6 + k),
                [0, 1, 2, 3, 4, 5].map((k) => k * 6 + r),
              ])
                if (row.every((k) => d.floor[k] >= 0 || cells.includes(k))) complete++;
            }
            a.push({
              sel,
              mode,
              piece,
              v:
                cells.length +
                complete * 4 -
                ST.neighbors(sel).filter((k) => d.floor[k] < 0).length * 0.05,
            });
          }
        }
    });
    return a;
  },
  botSelect(p) {
    S.d.piece = p.piece;
  },
  draw() {
    let d = S.d,
      g = ST.grid(6, 6, 76, 420);
    g.x = 90;
    ST.banner("Fit the whole piece", "Tiles +1 · completed line +4, then clears");
    ST.cells(g, (k, p) => {
      if (d.floor[k] >= 0) {
        ST.box(
          p.x - g.cell / 2 + 3,
          p.y - g.cell / 2 + 3,
          g.cell - 6,
          g.cell - 6,
          TINT[d.floor[k]],
          COL[d.floor[k]],
        );
        ST.text(d.floor[k] + 1, p.x, p.y, 24, COL[d.floor[k]]);
      }
    });
    if (d.sel >= 0)
      roomCells(d.sel, roomShape(d.offer[d.piece], d.mode)).forEach((k) => ST.select(k, g));
    miniCards(
      d.offer.map((s) => [["L corner", "Bar", "Z bend", "Square"][s]]),
      d.piece,
    );
    d.offer.forEach((s, k) => {
      let shape = roomShape(s, d.mode),
        max = Math.max(...shape.map((p) => p[0])) + 1;
      shape.forEach(([x, y]) =>
        ST.box(30 + (k + 0.5) * 180 - max * 9 + x * 18, 548 + y * 18, 16, 16, COL[d.turn], null, 2),
      );
    });
  },
});
function tailorBoard(seed) {
  let answer = Array(16).fill(0); // All tiles are elbows; a serpentine elbow path is planted before scrambling.
  let path = [4, 5, 1, 2, 6, 7, 11];
  let rot = [0, 0, 2, 3, 1, 3, 1];
  path.forEach((k, j) => (answer[k] = rot[j]));
  return {
    rot: answer.map((n, k) => (n + Math.floor(ST.rng(seed + k) * 4)) % 4),
    answer,
    solves: 0,
  };
}
const PIPE_DIRS = [
  [3, 0],
  [0, 1],
  [1, 2],
  [2, 3],
];
function pipeDirs(board, k) {
  return k === 4 ? (board.rot[k] % 2 ? [0, 2] : [1, 3]) : PIPE_DIRS[board.rot[k]];
}
function tailorFlow(board) {
  let seen = new Set(),
    q = [];
  if (pipeDirs(board, 4).includes(3)) q.push(4);
  while (q.length) {
    let k = q.shift();
    if (seen.has(k)) continue;
    seen.add(k);
    for (let dir of pipeDirs(board, k)) {
      let x = (k % 4) + [0, 1, 0, -1][dir],
        y = Math.floor(k / 4) + [-1, 0, 1, 0][dir],
        n = y * 4 + x;
      if (
        x >= 0 &&
        x < 4 &&
        y >= 0 &&
        y < 4 &&
        pipeDirs(board, n).includes((dir + 2) % 4) &&
        !seen.has(n)
      )
        q.push(n);
    }
  }
  return { seen, win: seen.has(11) && pipeDirs(board, 11).includes(1) };
}
tableRegister("tailor", {
  tag: "ROTATE · CONNECT · PLAN",
  modes: ["Clockwise", "Counterclockwise"],
  rounds: 12,
  rule: "This is a thread circuit, not a matching-tap race. Connect the left source at row 2 to the right sink at row 3 by rotating thread tiles. Select one tile and Confirm a quarter turn. Flowing thread is highlighted. Completing your circuit earns 10, then gives a fresh circuit. Each player has an independent board and gets one rotation per turn.",
  init() {
    S.d.boards = many((i) => tailorBoard(41 + mi() * 20 + i * 7));
  },
  tap: gridTap(ST.grid(4, 4, 106, 440)),
  act(i, k) {
    if (k < 0 || k >= 16) return invalid("Select a thread tile.");
    let b = S.d.boards[i];
    b.rot[k] = (b.rot[k] + (S.d.mode ? 3 : 1)) % 4;
    if (tailorFlow(b).win) {
      ST.add(i, 10);
      S.d.boards[i] = tailorBoard(77 + S.d.turns + i + mi() * 12);
      ST.note("Circuit connected: +10. Fresh board.");
    }
    return true;
  },
  choices(i) {
    let b = S.d.boards[i],
      a = [];
    for (let k = 0; k < 16; k++)
      for (let mode = 0; mode < 2; mode++) {
        let prev = b.rot[k];
        b.rot[k] = (prev + (mode ? 3 : 1)) % 4;
        let f = tailorFlow(b);
        let distance = b.rot.reduce(
          (v, n, j) => v + Math.min((n - b.answer[j] + 4) % 4, (b.answer[j] - n + 4) % 4),
          0,
        );
        a.push({ sel: k, mode, v: (f.win ? 100 : 0) + f.seen.size * 0.15 - distance });
        b.rot[k] = prev;
      }
    return a;
  },
  draw() {
    let d = S.d,
      g = ST.grid(4, 4, 106, 440);
    g.x = 80;
    let b = d.boards[d.turn],
      f = tailorFlow(b);
    ST.banner(pname(d.turn) + " thread circuit", "Source left R2 → sink right R3");
    ST.cells(g, (k, p) => {
      for (let dir of pipeDirs(b, k))
        ST.line(
          p,
          {
            x: p.x + [0, 1, 0, -1][dir] * g.cell * 0.43,
            y: p.y + [-1, 0, 1, 0][dir] * g.cell * 0.43,
          },
          f.seen.has(k) ? COL[d.turn] : "#858d80",
          10,
        );
      ST.circle(p.x, p.y, 7, f.seen.has(k) ? COL[d.turn] : "#858d80");
    });
    ST.text("→", 48, ST.xy(4, g).y, 34, COL[d.turn]);
    ST.text("→", 552, ST.xy(11, g).y, 34, COL[d.turn]);
    ST.select(d.sel, g);
  },
});
function unravelEdges() {
  return [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
  ];
}
function unravelPoint(slot) {
  let a = (slot / 8) * Math.PI * 2 - Math.PI / 2;
  return { x: 300 + Math.cos(a) * 205, y: 320 + Math.sin(a) * 205 };
}
function unravelCross(order) {
  let e = unravelEdges(),
    out = 0;
  for (let a = 0; a < e.length; a++)
    for (let b = a + 1; b < e.length; b++) {
      if (e[a].some((k) => e[b].includes(k))) continue;
      if (
        crossing(
          unravelPoint(order.indexOf(e[a][0])),
          unravelPoint(order.indexOf(e[a][1])),
          unravelPoint(order.indexOf(e[b][0])),
          unravelPoint(order.indexOf(e[b][1])),
        )
      )
        out++;
    }
  return out;
}
tableRegister("unravel", {
  tag: "SWAP · UNTANGLE · FINISH",
  modes: ["Swap"],
  rounds: 10,
  rule: "Select two numbered knots, then Confirm to swap their fixed positions. Knots cannot collapse onto one point. No points for repeated partial improvements: only the player removing the final crossing earns 8. Everyone shares this web, so avoid handing an easy finish to the next player. A solved web is replaced.",
  init() {
    S.d.order =
      mi() === 0
        ? [0, 2, 1, 3, 5, 4, 6, 7]
        : mi() === 1
          ? [0, 3, 1, 5, 2, 6, 4, 7]
          : [0, 4, 2, 6, 1, 5, 3, 7];
    S.d.pair = [];
  },
  tap(i, p) {
    let best = [...Array(8).keys()]
      .map((k) => ({ k, l: dist(p, unravelPoint(k)) }))
      .sort((a, b) => a.l - b.l)[0];
    if (best.l < 45) {
      if (S.d.pair.length >= 2) S.d.pair = [];
      if (!S.d.pair.includes(best.k)) S.d.pair.push(best.k);
      S.d.sel = best.k;
    }
  },
  act() {
    let d = S.d;
    if (d.pair.length !== 2) return invalid("Choose two different knots.");
    let [a, b] = d.pair;
    [d.order[a], d.order[b]] = [d.order[b], d.order[a]];
    if (unravelCross(d.order) === 0) {
      ST.add(d.turn, 8);
      d.order = [0, 2, 4, 1, 6, 3, 5, 7];
    }
    d.pair = [];
    return true;
  },
  choices() {
    let d = S.d,
      a = [];
    for (let x = 0; x < 8; x++)
      for (let y = x + 1; y < 8; y++) {
        let arr = d.order.slice();
        [arr[x], arr[y]] = [arr[y], arr[x]];
        let cross = unravelCross(arr);
        a.push({ sel: x, pair: [x, y], v: cross === 0 ? 100 : -cross });
      }
    return a;
  },
  botSelect(p) {
    S.d.pair = p.pair;
  },
  draw() {
    let d = S.d;
    ST.banner("Untangle the shared web", unravelCross(d.order) + " crossings · final swap earns 8");
    for (let [a, b] of unravelEdges())
      ST.line(unravelPoint(d.order.indexOf(a)), unravelPoint(d.order.indexOf(b)), "#566e75", 5);
    d.order.forEach((v, k) => {
      let p = unravelPoint(k);
      ST.circle(p.x, p.y, 31, d.pair.includes(k) ? COL[d.turn] : "#fff4d2", "#546959");
      ST.text(v + 1, p.x, p.y, 28, d.pair.includes(k) ? "#fff" : STR.ink);
    });
  },
});
function wobbleNew(seed) {
  let tiles = Array(25).fill(0),
    answer = Array(25).fill(0); // 0 empty, 1 slash, 2 backslash.
  // Guaranteed route: enter left row 2, turn up at (2,2), right at (2,0), down at (4,0), exit right row 3.
  for (let [k, v] of [
    [12, 1],
    [2, 1],
    [4, 2],
    [19, 2],
  ])
    answer[k] = v;
  tiles = answer.slice();
  let changes = [2, 4, 12, 19];
  changes.slice(0, 2 + mi()).forEach((k, j) => (tiles[k] = (tiles[k] + 1 + ((seed + j) % 2)) % 3));
  return { tiles, answer };
}
function wobbleTrace(b) {
  let x = -1,
    y = 2,
    dir = 1,
    route = [],
    seen = new Set();
  for (let t = 0; t < 70; t++) {
    x += [0, 1, 0, -1][dir];
    y += [-1, 0, 1, 0][dir];
    if (x < 0 || x >= 5 || y < 0 || y >= 5)
      return { win: x === 5 && y === 3, route, exit: { x, y } };
    let k = y * 5 + x,
      key = k + ":" + dir;
    if (seen.has(key)) break;
    seen.add(key);
    route.push(k);
    if (b.tiles[k] === 1) dir = [1, 0, 3, 2][dir];
    else if (b.tiles[k] === 2) dir = [3, 2, 1, 0][dir];
  }
  return { win: false, route, exit: { x, y } };
}
tableRegister("wobble", {
  tag: "BUILD · TRACE · TEST",
  modes: ["Rotate rail", "Run marble"],
  rounds: 12,
  rule: "Route a marble from the left inlet on row 3 to the right basket on row 4. Select a tile and Rotate rail to cycle empty / slash / backslash. Run marble spends a turn: success earns 8, failure loses 1. The first three cells are previewed, not the whole solution. Each player has a separate board; successful boards reset.",
  init() {
    S.d.boards = many((i) => wobbleNew(i + mi() * 9));
    S.d.trace = [];
  },
  tap: gridTap(ST.grid(5, 5, 106, 440)),
  act(i, k) {
    let b = S.d.boards[i];
    if (S.d.mode === 1) {
      let trace = wobbleTrace(b);
      ST.add(i, trace.win ? 8 : -1);
      S.d.trace = trace.route;
      S.d.traceAt = S.elapsed;
      if (trace.win) S.d.boards[i] = wobbleNew(S.d.turns + i);
      return true;
    }
    if (k < 0 || k >= 25) return invalid("Choose a rail square.");
    b.tiles[k] = (b.tiles[k] + 1) % 3;
    S.d.trace = [];
    return true;
  },
  choices(i) {
    let b = S.d.boards[i];
    if (wobbleTrace(b).win) return [{ sel: 0, mode: 1, v: 100 }];
    let a = [];
    for (let k = 0; k < 25; k++) {
      let cur = b.tiles[k];
      b.tiles[k] = (cur + 1) % 3;
      let mismatch = b.tiles.reduce((s, v, j) => s + (v !== b.answer[j]), 0);
      a.push({ sel: k, mode: 0, v: (wobbleTrace(b).win ? 100 : 0) - mismatch });
      b.tiles[k] = cur;
    }
    return a;
  },
  draw() {
    let d = S.d,
      g = ST.grid(5, 5, 106, 440);
    g.x = 80;
    let b = d.boards[d.turn];
    ST.banner(pname(d.turn) + " marble workshop", "Inlet ← row 3 · basket → row 4");
    ST.cells(g, (k, p) => {
      if (b.tiles[k])
        ST.line(
          { x: p.x - 28, y: p.y + (b.tiles[k] === 1 ? 28 : -28) },
          { x: p.x + 28, y: p.y + (b.tiles[k] === 1 ? -28 : 28) },
          "#8a5f34",
          9,
        );
    });
    let route = wobbleTrace(b).route.slice(0, 3);
    route.forEach((k) => {
      let p = ST.xy(k, g);
      ST.circle(p.x, p.y, 9, "#b88229");
    });
    ST.text("→", 48, ST.xy(10, g).y, 34);
    sprite("plate", 552, ST.xy(19, g).y, 40);
    ST.select(d.sel, g);
  },
});
const CHOIR_MOTIFS = [
  [0, 1, 2],
  [2, 1, 0],
  [1, 3, 1],
];
tableRegister("choir", {
  tag: "COMPOSE · DENY · REST",
  modes: ["Play note", "Rest"],
  rounds: 10,
  rule: "Compose a shared melody. Choose DO / RE / MI / FA; the last two notes plus your note may complete one of the three public motifs for 5 points. A step of one note also earns 1. Repeating the last note loses 1. Notes cost breath (1, 1, 2, 2); Rest restores 3. Set up your own score without gifting the next player an obvious motif.",
  init() {
    S.d.melody = mi() === 0 ? [0, 3] : mi() === 1 ? [0, 1] : [2, 1];
    S.d.breath = many(() => 5 - mi());
  },
  resource(i) {
    return S.d.breath[i] + " breath";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 4, 370);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      d.breath[i] = Math.min(7, d.breath[i] + 3);
      return true;
    }
    if (k < 0 || k > 3) return invalid("Choose a note.");
    let cost = k < 2 ? 1 : 2;
    if (d.breath[i] < cost) return invalid("Not enough breath. Switch to Rest.");
    d.breath[i] -= cost;
    let last = d.melody.at(-1),
      tail = d.melody.slice(-2).concat(k);
    ST.add(
      i,
      (last === k ? -1 : Math.abs(last - k) === 1 ? 1 : 0) +
        CHOIR_MOTIFS.filter((a) => a.every((v, j) => v === tail[j])).length * 5,
    );
    d.melody.push(k);
    tone(260 * Math.pow(2, k / 5));
    return true;
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 4; k++)
      if (d.breath[i] >= (k < 2 ? 1 : 2)) {
        let tail = d.melody.slice(-2).concat(k),
          last = d.melody.at(-1),
          value =
            (last === k ? -1 : Math.abs(last - k) === 1 ? 1 : 0) +
            CHOIR_MOTIFS.filter((m) => m.every((n, j) => n === tail[j])).length * 5;
        let gifts = CHOIR_MOTIFS.some((m) => m[0] === tail[1] && m[1] === tail[2]);
        a.push({ sel: k, mode: 0, v: value * 3 - (gifts ? 2 : 0) - k * 0.03 });
      }
    if (d.breath[i] < 3) a.push({ sel: 0, mode: 1, v: 4 });
    return a;
  },
  draw() {
    let d = S.d,
      notes = ["DO", "RE", "MI", "FA"];
    ST.banner("Compose, do not just repeat", "Motif +5 · adjacent note +1 · repeat −1");
    CHOIR_MOTIFS.forEach((m, k) =>
      ST.text(m.map((n) => notes[n]).join(" → "), 300, 128 + k * 42, 27, COL[k]),
    );
    ST.box(40, 270, 520, 70, "#e2e9de");
    ST.text(
      "Last two: " +
        d.melody
          .slice(-2)
          .map((n) => notes[n])
          .join(" → "),
      300,
      305,
      28,
    );
    ST.cards(
      notes.map((n, k) => [n, (k < 2 ? 1 : 2) + " breath"]),
      d.sel,
      370,
    );
    ST.text("Next player inherits the melody you leave.", 300, 530, 23, STR.muted);
  },
});
// EIGHT INTERACTIVE ECONOMY / PHYSICS DUELS. No holding a button to manufacture score.
function elevatorRequest(i, k) {
  let floors = 4 + mi(),
    from = S.d?.floor ?? 0,
    to = (from + 1 + ((i + k) % Math.max(1, floors - 1))) % floors;
  return { from, to, w: 1 + ((i + k) % 3), fare: 3 + ((i + k) % 3) };
}
tableRegister("elevator", {
  tag: "LOAD · ROUTE · COMPETE",
  modes: ["Choose"],
  rounds: 10,
  rule: "The lift is shared. Select one of your three passenger cards to board it—but only at its pickup floor and within the 7 kg capacity. Or select a floor to move the lift up to two floors. Arrivals pay the printed fare to the passenger’s owner. Rivals can move your passengers away, use spare capacity, or accidentally help your route.",
  init() {
    let d = S.d;
    d.floor = 0;
    d.load = [];
    d.requests = many((i) => [0, 1, 2].map((k) => elevatorRequest(i, k)));
    d.serial = 0;
  },
  resource(i) {
    return S.d.load.filter((o) => o.owner === i).length + " aboard";
  },
  tap(i, p) {
    if (p.y >= 475) {
      let k = ST.cardAt(p, 3, 475);
      S.d.sel = k < 0 ? -1 : 100 + k;
    } else {
      let f = Math.floor((p.y - 100) / 55);
      S.d.sel = f >= 0 && f < 4 + mi() ? f : -1;
    }
  },
  act(i, k) {
    let d = S.d;
    if (k >= 100 && k <= 102) {
      let j = k - 100,
        o = d.requests[i][j],
        load = d.load.reduce((a, o) => a + o.w, 0);
      if (o.from !== d.floor)
        return invalid("This passenger waits at F" + o.from + ". Move the lift first.");
      if (load + o.w > 7) return invalid("Lift full. Deliver passengers before boarding more.");
      d.load.push({ ...o, owner: i });
      d.serial++;
      let floors = 4 + mi(),
        from = (d.serial + i) % floors,
        to = (from + 1 + (d.serial % (floors - 1))) % floors;
      d.requests[i][j] = { from, to, w: 1 + (d.serial % 3), fare: 3 + (d.serial % 3) };
      return true;
    }
    if (k < 0 || k >= 4 + mi() || k === d.floor || Math.abs(k - d.floor) > 2)
      return invalid("Select a different floor, at most two floors away.");
    d.floor = k;
    d.load = d.load.filter((o) => {
      if (o.to === k) {
        ST.add(o.owner, o.fare);
        return false;
      }
      return true;
    });
    return true;
  },
  choices(i) {
    let d = S.d,
      a = [];
    d.requests[i].forEach((o, k) => {
      if (o.from === d.floor && d.load.reduce((a, q) => a + q.w, 0) + o.w <= 7)
        a.push({ sel: 100 + k, v: o.fare / o.w + 2 });
    });
    for (let f = 0; f < 4 + mi(); f++)
      if (f !== d.floor && Math.abs(f - d.floor) <= 2) {
        let delivery = d.load
            .filter((o) => o.owner === i && o.to === f)
            .reduce((v, o) => v + o.fare, 0),
          distReq = Math.min(...d.requests[i].map((o) => Math.abs(f - o.from))),
          distLoad = d.load.filter((o) => o.owner === i).map((o) => Math.abs(f - o.to));
        a.push({
          sel: f,
          v: delivery * 3 + (distLoad.length ? 4 - Math.min(...distLoad) : 2 - distReq),
        });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "One lift. Competing routes.",
      d.load.reduce((v, o) => v + o.w, 0) + "/7 kg · current floor F" + d.floor,
    );
    for (let f = 0; f < 4 + mi(); f++) {
      let y = 100 + f * 55;
      ST.box(
        55,
        y,
        490,
        48,
        f === d.floor ? "#dce7dd" : "#fffaf0",
        d.sel === f ? COL[d.turn] : "#b4b7a7",
      );
      ST.text("F" + f, 87, y + 24, 24);
      ST.text(
        f === d.floor ? "LIFT HERE" : Math.abs(f - d.floor) <= 2 ? "MOVE HERE" : "too far",
        365,
        y + 24,
        23,
        f === d.floor ? "#366650" : STR.muted,
      );
    }
    d.load.forEach((o, k) => {
      ST.text("P" + (o.owner + 1) + "→" + o.to, 155 + k * 65, 438, 21, COL[o.owner]);
    });
    ST.cards(
      d.requests[d.turn].map((o) => [
        "F" + o.from + " → F" + o.to,
        o.w + "kg · " + o.fare + " pts",
      ]),
      d.sel - 100,
      475,
    );
  },
});
tableRegister("tumble", {
  tag: "WEIGHT · TORQUE · COUNTER",
  modes: ["Light 1", "Heavy 2"],
  rounds: 10,
  rule: "Select a position on the shared plank and choose Light or Heavy. Outer placements earn more points but create torque. Stay within the printed torque limit. A collapse removes all unbanked piece points and penalises the placer 2 more. Each position holds two pieces; filling all positions safely banks the table and resets it. Heavy pieces are limited to three per player.",
  init() {
    S.d.pieces = [];
    S.d.heavy = many(() => 3);
    S.d.limit = mi() === 0 ? 14 : mi() === 1 ? 11 : 9;
  },
  resource(i) {
    return S.d.heavy[i] + " heavy";
  },
  tap(i, p) {
    S.d.sel =
      p.y > 140 && p.y < 420 && p.x >= 30 && p.x < 570
        ? Math.min(8, Math.floor((p.x - 30) / 60))
        : -1;
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 8 || d.pieces.filter((p) => p.slot === k).length >= 2)
      return invalid("Choose a position with fewer than two pieces.");
    let w = d.mode + 1;
    if (w === 2 && d.heavy[i] <= 0) return invalid("No heavy pieces left. Use Light.");
    if (w === 2) d.heavy[i]--;
    let v = 1 + Math.floor(Math.abs(k - 4) / 2) * w,
      o = { slot: k, w, owner: i, v };
    d.pieces.push(o);
    let torque = d.pieces.reduce((n, p) => n + (p.slot - 4) * p.w, 0);
    if (Math.abs(torque) > d.limit) {
      d.pieces.slice(0, -1).forEach((p) => ST.add(p.owner, -p.v));
      ST.add(i, -2);
      d.pieces = [];
      ST.note("COLLAPSE: all table points removed; placer −2.");
    } else {
      ST.add(i, v);
      if (d.pieces.length >= 18) {
        d.pieces = [];
        ST.note("Full table banked safely. Fresh plank.");
      }
    }
    return true;
  },
  choices(i) {
    let d = S.d,
      torque = d.pieces.reduce((v, p) => v + (p.slot - 4) * p.w, 0),
      a = [];
    for (let k = 0; k < 9; k++)
      for (let mode = 0; mode < 2; mode++)
        if ((!mode || d.heavy[i] > 0) && d.pieces.filter((p) => p.slot === k).length < 2) {
          let t = torque + (k - 4) * (mode + 1),
            v = 1 + Math.floor(Math.abs(k - 4) / 2) * (mode + 1);
          a.push({ sel: k, mode, v: Math.abs(t) <= d.limit ? v * 3 - Math.abs(t) * 0.12 : -100 });
        }
    return a;
  },
  draw() {
    let d = S.d,
      t = d.pieces.reduce((n, p) => n + (p.slot - 4) * p.w, 0);
    ST.banner(
      "Balance is a shared problem",
      "Torque " + t + " · safe range −" + d.limit + " to +" + d.limit,
    );
    ST.box(30, 320, 540, 26, "#a47c4a", "#745634");
    ST.text("▲", 300, 378, 58, "#695c43");
    for (let k = 0; k < 9; k++) {
      let x = 60 + k * 60;
      ST.text(k - 4, x, 420, 23);
      ST.box(
        x - 25,
        150,
        50,
        150,
        d.sel === k ? TINT[d.turn] : "#fffaf044",
        d.sel === k ? COL[d.turn] : "#c3b59a",
      );
      d.pieces
        .filter((p) => p.slot === k)
        .forEach((o, j) => {
          ST.box(x - 21, 270 - j * 51, 42, 43, COL[o.owner], null);
          ST.text(o.w, x, 292 - j * 51, 25, "#fff");
        });
    }
    ST.text("Outer slots pay more. Collapse removes their points.", 300, 505, 22, STR.muted);
    ST.text("Select a vertical slot, then Confirm.", 300, 550, 23);
  },
});
tableRegister("moss", {
  tag: "AIM · POWER · BANK SHOT",
  modes: ["Soft", "Medium", "Hard"],
  rounds: 12,
  rule: "Select an aim point on the green. Mode chooses shot power; Confirm flicks your numbered ball toward it. Bumpers and rival balls affect the route. Sink your ball in a hole for its 2 / 4 / 6 points, then return to your tee. You may need several position-building shots. The next turn waits for the physics to settle.",
  init() {
    S.d.balls = many((i) => ({
      x: 75 + (i * 450) / Math.max(1, S.n - 1),
      y: 530,
      vx: 0,
      vy: 0,
      tee: 75 + (i * 450) / Math.max(1, S.n - 1),
    }));
    S.d.holes = [
      { x: 110, y: 65, r: 29, v: 2 },
      { x: 300, y: 65, r: 24, v: 4 },
      { x: 490, y: 65, r: 19, v: 6 },
    ];
    S.d.bumps =
      mi() === 0
        ? [
            { x: 220, y: 250, r: 43 },
            { x: 390, y: 360, r: 42 },
          ]
        : mi() === 1
          ? [
              { x: 180, y: 200, r: 50 },
              { x: 420, y: 200, r: 50 },
              { x: 300, y: 370, r: 40 },
            ]
          : [
              { x: 160, y: 320, r: 45 },
              { x: 300, y: 250, r: 55 },
              { x: 440, y: 320, r: 45 },
            ];
    S.d.aim = { x: 300, y: 80 };
  },
  tap(i, p) {
    S.d.aim = p;
    S.d.sel = 0;
  },
  act(i, k) {
    if (k < 0) return invalid("Select an aim point on the green.");
    let d = S.d,
      b = d.balls[i],
      l = dist(b, d.aim);
    if (l < 10) return invalid("Aim farther away from your ball.");
    let speed = [200, 325, 460][d.mode];
    b.vx = ((d.aim.x - b.x) / l) * speed;
    b.vy = ((d.aim.y - b.y) / l) * speed;
    d.busy = true;
    d.motion = 0;
    return false;
  },
  update(dt) {
    let d = S.d;
    if (!d.busy) return;
    d.motion += dt;
    d.balls.forEach((b, i) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let drag = Math.pow(0.982, dt * 60);
      b.vx *= drag;
      b.vy *= drag;
      if (b.x < 19 || b.x > 581) {
        b.x = clamp(b.x, 19, 581);
        b.vx *= -0.78;
      }
      if (b.y < 20 || b.y > 580) {
        b.y = clamp(b.y, 20, 580);
        b.vy *= -0.78;
      }
      for (let o of d.bumps) {
        let l = dist(b, o),
          nx = (b.x - o.x) / (l || 1),
          ny = (b.y - o.y) / (l || 1);
        if (l < o.r + 13) {
          b.x = o.x + nx * (o.r + 14);
          b.y = o.y + ny * (o.r + 14);
          let v = b.vx * nx + b.vy * ny;
          if (v < 0) {
            b.vx -= 1.8 * v * nx;
            b.vy -= 1.8 * v * ny;
          }
        }
      }
      for (let h of d.holes)
        if (dist(b, h) < h.r) {
          ST.add(i, h.v);
          Object.assign(b, { x: b.tee, y: 530, vx: 0, vy: 0 });
        }
    });
    for (let i = 0; i < S.n; i++)
      for (let j = i + 1; j < S.n; j++) {
        let a = d.balls[i],
          b = d.balls[j],
          l = dist(a, b);
        if (l < 27) {
          let nx = (a.x - b.x) / (l || 1),
            ny = (a.y - b.y) / (l || 1),
            v = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          a.x += (nx * (28 - l)) / 2;
          a.y += (ny * (28 - l)) / 2;
          b.x -= (nx * (28 - l)) / 2;
          b.y -= (ny * (28 - l)) / 2;
          if (v < 0) {
            a.vx -= v * nx;
            a.vy -= v * ny;
            b.vx += v * nx;
            b.vy += v * ny;
          }
        }
      }
    if (d.motion > 4 || (d.motion > 0.6 && d.balls.every((b) => Math.hypot(b.vx, b.vy) < 15))) {
      d.balls.forEach((b) => {
        b.vx = 0;
        b.vy = 0;
      });
      d.busy = false;
      strategyNext();
    }
  },
  choices(i) {
    let d = S.d,
      b = d.balls[i],
      h = d.holes.slice().sort((a, c) => dist(b, a) / a.v - dist(b, c) / c.v)[0];
    return [
      {
        sel: 0,
        mode: dist(b, h) > 250 ? 2 : dist(b, h) > 130 ? 1 : 0,
        aim: { x: h.x, y: h.y },
        v: 1,
      },
    ];
  },
  botSelect(p) {
    S.d.aim = p.aim;
  },
  draw() {
    let d = S.d;
    ST.box(15, 15, 570, 570, "#dbe8cbcc", "#879d78");
    d.holes.forEach((h) => {
      ST.circle(h.x, h.y, h.r, "#354b38", "#dde5d3");
      ST.text(h.v, h.x, h.y, 26, "#fff");
    });
    d.bumps.forEach((b) => ST.circle(b.x, b.y, b.r, "#91ac7e", "#566e4c"));
    if (!d.busy) {
      let b = d.balls[d.turn];
      ST.line(b, d.aim, COL[d.turn], 3);
      ST.circle(d.aim.x, d.aim.y, 9, null, COL[d.turn]);
    }
    d.balls.forEach((b, i) => {
      ST.circle(b.x, b.y, 14, COL[i], "#fff");
      ST.text(i + 1, b.x, b.y, 20, "#fff");
    });
    if (d.busy) ST.text("LET IT ROLL", 300, 565, 22, STR.muted);
  },
});
function suitcaseOffer(k) {
  let w = 1 + (k % 4),
    bad = k % 4 === 2;
  return { w, v: w + 1 + (k % 3) + (bad ? 3 : 0), bad };
}
tableRegister("suitcase", {
  tag: "DRAFT · CAPACITY · CASH OUT",
  modes: ["Pack", "Cash out", "Permit"],
  rule: "Draft items into your limited bag. Each card shows weight and value; RED cargo is contraband. Cash out banks the whole bag and empties it, using a turn. Customs checks after rounds 3 and 6 confiscate all unpermitted contraband. Permit costs 2 coins and protects one audit. The final bag cashes out after the last audit. Greedy cargo blocks future space.",
  init() {
    S.d.bags = many(() => []);
    S.d.offers = Array.from({ length: 5 }, (_, k) => suitcaseOffer(k + mi() * 2));
    S.d.permit = many(() => false);
    S.d.coins = many(() => 3);
    S.d.serial = 10;
    S.d.capacity = 10 - mi();
  },
  resource(i) {
    return (
      S.d.bags[i].reduce((v, o) => v + o.w, 0) + "/" + S.d.capacity + "kg · " + S.d.coins[i] + "c"
    );
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 5, 170);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      if (!d.bags[i].length) return invalid("Your bag is empty.");
      ST.add(
        i,
        d.bags[i].reduce((v, o) => v + o.v, 0),
      );
      d.bags[i] = [];
      return true;
    }
    if (d.mode === 2) {
      if (d.coins[i] < 2 || d.permit[i])
        return invalid("A permit costs 2 coins; only one can be held.");
      d.coins[i] -= 2;
      d.permit[i] = true;
      return true;
    }
    if (k < 0 || k > 4) return invalid("Select an item to pack.");
    let o = d.offers[k];
    if (d.bags[i].reduce((v, o) => v + o.w, 0) + o.w > d.capacity)
      return invalid("Too heavy. Cash out before adding this item.");
    d.bags[i].push(o);
    d.offers[k] = suitcaseOffer(d.serial++);
    return true;
  },
  round() {
    let d = S.d;
    d.coins = d.coins.map((n) => n + 1);
    if (d.round % 3 === 0) {
      d.bags = d.bags.map((bag, i) => bag.filter((o) => !o.bad || d.permit[i]));
      d.permit.fill(false);
      ST.note("Customs audit complete. Unpermitted red cargo confiscated.");
    }
  },
  end() {
    S.d.bags.forEach((bag, i) =>
      ST.add(
        i,
        bag.reduce((v, o) => v + o.v, 0),
      ),
    );
  },
  choices(i) {
    let d = S.d,
      bag = d.bags[i],
      weight = bag.reduce((v, o) => v + o.w, 0),
      a = [];
    d.offers.forEach((o, k) => {
      if (weight + o.w <= d.capacity)
        a.push({
          sel: k,
          mode: 0,
          v: o.v / o.w + 2 - (o.bad && d.round % 3 === 0 && !d.permit[i] ? 5 : 0),
        });
    });
    if (bag.length)
      a.push({
        sel: 0,
        mode: 1,
        v:
          weight >= d.capacity - 2
            ? 10
            : d.round % 3 === 0 && bag.some((o) => o.bad) && !d.permit[i]
              ? 9
              : 1,
      });
    if (bag.some((o) => o.bad) && !d.permit[i] && d.round % 3 === 0 && d.coins[i] >= 2)
      a.push({ sel: 0, mode: 2, v: 7 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Pack value, not just weight",
      "Next audit: " +
        (d.round <= 3 ? "round 3" : d.round <= 6 ? "round 6" : "none") +
        " · capacity " +
        d.capacity +
        "kg",
    );
    ST.cards(
      d.offers.map((o) => [(o.bad ? "RED " : "") + o.w + "kg", o.v + " pts"]),
      d.sel,
      170,
    );
    ST.text(pname(d.turn) + " BAG", 300, 330, 27, COL[d.turn]);
    let bag = d.bags[d.turn];
    ST.text(
      bag.length
        ? bag.length + " items · " + bag.filter((o) => o.bad).length + " RED cargo"
        : "Empty — draft from the market",
      300,
      380,
      22,
    );
    ST.text(
      "Value " +
        bag.reduce((v, o) => v + o.v, 0) +
        " · RED value " +
        bag.filter((o) => o.bad).reduce((v, o) => v + o.v, 0),
      300,
      430,
      25,
    );
    ST.text(d.permit[d.turn] ? "PERMITTED" : "NO PERMIT", 300, 470, 23);
    ST.text("Cash out trades a turn for safety and space.", 300, 520, 23, STR.muted);
  },
});
tableRegister("spaghetti", {
  tag: "PULL · READ TENSION · BANK",
  modes: ["Pull", "Bank", "Relax"],
  rule: "Three shared noodles have separate tension meters. Pull adds 2 unbanked bites and increases tension by 2, plus 1 for every other attached player. At tension 10 or more the noodle snaps: all attached cargo is lost and the puller loses 1 point. Bank scores your bites and releases the noodle. Relax reduces selected tension by 3 but earns nothing. You cannot switch noodles while carrying bites. Unbanked bites are lost at match end.",
  init() {
    S.d.lanes = [
      { t: mi() * 2, left: 14 - mi() },
      { t: mi() * 2, left: 12 - mi() },
      { t: mi() * 2, left: 16 - mi() },
    ];
    S.d.pending = many(() => 0);
    S.d.attached = many(() => -1);
  },
  resource(i) {
    return S.d.pending[i] + " unbanked";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 180);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      if (!d.pending[i]) return invalid("No bites to bank.");
      let lane = d.attached[i];
      ST.add(i, d.pending[i]);
      d.pending[i] = 0;
      d.attached[i] = -1;
      d.lanes[lane].t = Math.max(0, d.lanes[lane].t - 2);
      return true;
    }
    if (k < 0 || k > 2) return invalid("Select a noodle.");
    let o = d.lanes[k];
    if (d.mode === 2) {
      o.t = Math.max(0, o.t - 3);
      return true;
    }
    if (d.attached[i] >= 0 && d.attached[i] !== k)
      return invalid("Bank your current bites before switching noodles.");
    if (o.left <= 0) return invalid("This noodle is empty. Bank or choose another.");
    let extra = d.attached.filter((n, j) => n === k && j !== i).length;
    d.attached[i] = k;
    d.pending[i] += Math.min(2, o.left);
    o.left = Math.max(0, o.left - 2);
    o.t += 2 + extra;
    if (o.t >= 10) {
      d.attached.forEach((n, j) => {
        if (n === k) {
          d.pending[j] = 0;
          d.attached[j] = -1;
        }
      });
      ST.add(i, -1);
      o.t = 0;
      ST.note("SNAP! Everyone attached lost unbanked bites.");
    }
    return true;
  },
  round() {
    let d = S.d;
    d.lanes.forEach((o, k) => {
      o.t = Math.max(0, o.t - 1);
      if (o.left === 0 && !d.attached.includes(k)) o.left = 14;
    });
  },
  end() {
    S.d.pending.fill(0);
  },
  choices(i) {
    let d = S.d,
      a = [];
    if (d.pending[i]) a.push({ sel: d.attached[i], mode: 1, v: d.pending[i] >= 4 ? 12 : 4 });
    d.lanes.forEach((o, k) => {
      if ((d.attached[i] < 0 || d.attached[i] === k) && o.left > 0) {
        let extra = d.attached.filter((n, j) => n === k && j !== i).length;
        a.push({ sel: k, mode: 0, v: o.t + 2 + extra < 10 ? 8 - o.t * 0.35 : -20 });
      }
      if (o.t > 3) a.push({ sel: k, mode: 2, v: 1 });
    });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "The whole table shares the tension",
      "At 10: SNAP · bank before rivals pull too hard",
    );
    ST.cards(
      d.lanes.map((o, k) => ["NOODLE " + (k + 1), o.left + " bites left"]),
      d.sel,
      180,
    );
    d.lanes.forEach((o, k) => {
      let x = 120 + k * 180;
      ST.box(x - 65, 320, 130, 22, "#ddd8c7");
      if (o.t) ST.box(x - 65, 320, (130 * o.t) / 10, 22, o.t >= 7 ? "#b94c36" : "#af8b3f");
      ST.text(o.t + "/10", x, 375, 29, o.t >= 7 ? "#a33c2c" : STR.ink);
      ST.text(
        d.attached
          .map((n, j) => (n === k ? "P" + (j + 1) : ""))
          .filter(Boolean)
          .join(" + ") || "Unclaimed",
        x,
        427,
        23,
      );
    });
    ST.text("Bank = secure bites · Relax = −3 tension", 300, 520, 23, STR.muted);
  },
});
tableRegister("candle", {
  tag: "BLOW · GUARD · RECOVER",
  modes: ["Blow", "Guard", "Breathe"],
  rounds: 10,
  rule: "Choose a rival candle to Blow: spend 2 breath for 2 damage, or 3 if the forecast wind favours its numbered position. Guard spends 1 breath to block the next 3 damage. Breathe restores 3 breath. Each damage earns 1; extinguishing earns 3 more, then the candle relights. Wind advances after each round. Solo includes a training candle that responds after each turn.",
  init() {
    let n = Math.max(2, S.n);
    S.d.flames = Array(n).fill(6);
    S.d.guards = Array(n).fill(0);
    S.d.breath = Array(n).fill(5);
    S.d.wind = mi() % n;
  },
  resource(i) {
    return S.d.flames[i] + " flame · " + S.d.breath[i] + " breath";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, S.d.flames.length, 210);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      d.breath[i] = Math.min(7, d.breath[i] + 3);
    } else if (d.mode === 1) {
      if (d.breath[i] < 1) return invalid("Guard costs 1 breath.");
      d.breath[i]--;
      d.guards[i] = 3;
    } else {
      if (k < 0 || k >= d.flames.length || k === i)
        return invalid("Choose a different candle to attack.");
      if (d.breath[i] < 2) return invalid("Blow costs 2 breath. Switch to Breathe.");
      d.breath[i] -= 2;
      candleHit(i, k, 2 + (k === d.wind ? 1 : 0));
    }
    if (S.n === 1) {
      if (d.breath[1] < 2) d.breath[1] += 3;
      else if (d.flames[1] <= 3 && d.guards[1] === 0) {
        d.guards[1] = 3;
        d.breath[1]--;
      } else {
        d.breath[1] -= 2;
        candleHit(1, 0, 2);
      }
    }
    return true;
  },
  round() {
    S.d.wind = (S.d.wind + 1) % S.d.flames.length;
  },
  choices(i) {
    let d = S.d,
      a = [];
    if (d.breath[i] >= 2)
      d.flames.forEach((v, k) => {
        if (k !== i)
          a.push({
            sel: k,
            mode: 0,
            v: Math.max(0, 2 + (k === d.wind ? 1 : 0) - d.guards[k]) + (v <= 3 ? 3 : 0),
          });
      });
    if (d.flames[i] <= 3 && d.breath[i] > 0 && d.guards[i] === 0) a.push({ sel: i, mode: 1, v: 5 });
    if (d.breath[i] < 3) a.push({ sel: i, mode: 2, v: 4 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner("Read the next gust", "Wind favours attacks on candle " + (d.wind + 1));
    ST.cards(
      d.flames.map((v, i) => ["CANDLE " + (i + 1), v + " flame"]),
      d.sel,
      210,
    );
    let w = 540 / d.flames.length;
    d.flames.forEach((v, i) => {
      let x = 30 + (i + 0.5) * w;
      sprite("candle", x, 390, 75);
      ST.text("Shield " + d.guards[i], x, 455, 22, i < S.n ? COL[i] : STR.muted);
      ST.text("Breath " + d.breath[i], x, 493, 22);
    });
  },
});
function candleHit(i, k, power) {
  let d = S.d,
    absorbed = Math.min(power, d.guards[k]);
  d.guards[k] -= absorbed;
  let damage = Math.min(d.flames[k], power - absorbed);
  d.flames[k] -= damage;
  if (i < S.n) ST.add(i, damage);
  if (d.flames[k] <= 0) {
    if (i < S.n) ST.add(i, 3);
    d.flames[k] = 6;
    d.guards[k] = 0;
  }
}
tableRegister("heat", {
  tag: "STOKE · CASH OUT · VENT",
  modes: ["Stoke", "Bank", "Vent"],
  rule: "Choose 1 / 2 / 3 fuel to Stoke: each fuel adds 2 unbanked shares and 12 pressure. At 100 pressure the boiler bursts: everyone loses unbanked shares and the stoker loses 2 points. Bank secures shares; at pressure 65+ it pays a 50% bonus, then lowers pressure by 10. Vent lowers pressure by 22 and restores 2 fuel. Gain 1 fuel each round. Unbanked shares are lost at match end. Read what the next player could do.",
  init() {
    S.d.pressure = 20 + mi() * 5;
    S.d.pending = many(() => 0);
    S.d.fuel = many(() => 5);
  },
  resource(i) {
    return S.d.pending[i] + " shares · " + S.d.fuel[i] + " fuel";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 380);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      d.pressure = Math.max(0, d.pressure - 22);
      d.fuel[i] = Math.min(7, d.fuel[i] + 2);
      return true;
    }
    if (d.mode === 1) {
      if (!d.pending[i]) return invalid("No shares to bank.");
      ST.add(i, Math.floor(d.pending[i] * (d.pressure >= 65 ? 1.5 : 1)));
      d.pending[i] = 0;
      d.pressure = Math.max(0, d.pressure - 10);
      return true;
    }
    if (k < 0 || k > 2) return invalid("Select a fuel amount.");
    let n = k + 1;
    if (d.fuel[i] < n) return invalid("Not enough fuel. Vent to recover.");
    d.fuel[i] -= n;
    d.pending[i] += n * 2;
    d.pressure += n * (12 + mi());
    if (d.pressure >= 100) {
      d.pending.fill(0);
      d.pressure = 20;
      ST.add(i, -2);
      ST.note("BOILER BURST. All unbanked shares lost; stoker −2.");
    }
    return true;
  },
  round() {
    S.d.fuel = S.d.fuel.map((v) => Math.min(7, v + 1));
    S.d.pressure = Math.max(0, S.d.pressure - 5);
  },
  end() {
    S.d.pending.fill(0);
  },
  choices(i) {
    let d = S.d,
      a = [{ sel: 0, mode: 2, v: d.fuel[i] < 2 ? 8 : 1 }];
    if (d.pending[i])
      a.push({
        sel: 0,
        mode: 1,
        v: d.pressure >= 65 ? 15 : d.pending[i] >= 6 ? 10 : d.pressure > 55 ? 7 : 2,
      });
    for (let k = 0; k < 3; k++)
      if (d.fuel[i] >= k + 1)
        a.push({
          sel: k,
          mode: 0,
          v:
            d.pressure + (k + 1) * (12 + mi()) >= 100
              ? -50
              : (k + 1) * 2 + 2 - (d.pressure > 70 ? 8 : 0),
        });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner("Everyone owns the risk", "Banking at 65+ pays ×1.5 · 100 bursts");
    ST.box(65, 130, 470, 85, "#d9ded2");
    ST.box(
      65,
      130,
      (470 * d.pressure) / 100,
      85,
      d.pressure >= 80 ? "#b94c36" : d.pressure >= 65 ? "#3c7d57" : "#b18b3e",
    );
    ST.text(d.pressure + " pressure", 300, 173, 32, STR.ink);
    ST.text(
      "Unbanked: " + d.pending.map((n, i) => "P" + (i + 1) + " " + n).join(" · "),
      300,
      285,
      24,
    );
    ST.cards(
      ["1 fuel", "2 fuel", "3 fuel"].map((s, k) => [s, "+" + (k + 1) * 2 + " shares"]),
      d.sel,
      380,
    );
    ST.text("Bank reduces 10 · Vent reduces 22", 300, 535, 23, STR.muted);
  },
});
tableRegister("gift", {
  tag: "BID · READ RIVALS · COMMIT",
  modes: ["Bid 0", "Bid 1", "Bid 2", "Bid 3"],
  rule: "Choose a gift lane and a coin bid. Lane 1 has two winners at 3 points each; lanes 2 and 3 have one winner at 5 and 8. If overcrowded, highest bids win; ties follow the printed round priority. Bids cost coins even when you lose. All choices are public, not falsely “secret” on one screen. Starting priority rotates each round; regain 2 coins per round.",
  init() {
    S.d.coins = many(() => 5 - mi() * 2);
    S.d.bids = many(() => null);
  },
  resource(i) {
    return S.d.coins[i] + " coins";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 180);
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 2) return invalid("Choose one of the three lanes.");
    let bid = d.mode;
    if (d.coins[i] < bid) return invalid("You cannot afford that bid.");
    d.coins[i] -= bid;
    d.bids[i] = { lane: k, bid };
    return true;
  },
  round() {
    let d = S.d;
    for (let lane = 0; lane < 3; lane++) {
      let bids = d.bids
        .map((o, i) => (o && o.lane === lane ? { ...o, i } : null))
        .filter(Boolean)
        .sort(
          (a, b) => b.bid - a.bid || ((a.i - d.first + S.n) % S.n) - ((b.i - d.first + S.n) % S.n),
        );
      bids.slice(0, [2, 1, 1][lane]).forEach((o) => ST.add(o.i, [3, 5, 8][lane]));
    }
    d.bids = many(() => null);
    d.coins = d.coins.map((n) => Math.min(9, n + 2));
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let lane = 0; lane < 3; lane++)
      for (let bid = 0; bid <= Math.min(3, d.coins[i]); bid++) {
        let rivals = d.bids.filter((o) => o?.lane === lane),
          beaten = rivals.filter((o) => o.bid >= bid).length,
          cap = [2, 1, 1][lane];
        a.push({
          sel: lane,
          mode: bid,
          v: beaten < cap ? [3, 5, 8][lane] - bid * 0.7 : -(bid + 1),
        });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Public commitment. Limited coins.",
      "Tie priority: " + many((k) => "P" + (((d.first + k) % S.n) + 1)).join(" → "),
    );
    ST.cards(
      [
        ["LANE 1", "2 winners · +3"],
        ["LANE 2", "1 winner · +5"],
        ["LANE 3", "1 winner · +8"],
      ],
      d.sel,
      180,
    );
    d.bids.forEach((o, i) => {
      ST.box(70, 330 + i * 52, 460, 44, TINT[i], COL[i]);
      ST.text(
        "P" + (i + 1) + " · " + (o ? "Lane " + (o.lane + 1) + " / bid " + o.bid : "not committed"),
        300,
        352 + i * 52,
        24,
        COL[i],
      );
    });
    ST.text("Bids are spent even if the lane rejects you.", 300, 570, 22, STR.muted);
  },
});
// Expose normal input paths for integration tests and accessibility tooling; no score injection.
window.Strategy = {
  definitions: strategyDefs,
  get state() {
    return S?.d;
  },
  action(i, k) {
    engines[S.g.id].action(i, k);
  },
  steer(i, x, y) {
    if (S?.d.kind === "arena")
      S.d.controls[i] = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), held: true };
  },
  get version() {
    return "5.0.0-strategy";
  },
};
const strategyRules = rules;
rules = function (id) {
  strategyRules(id);
  let g = games.find((v) => v.id === id);
  if (!g.strategic) return;
  let note = document.querySelector(".proto-note");
  if (note)
    note.textContent =
      "Strategy rebuild · " +
      (strategyDefs[id].kind === "arena"
        ? "Stick + two abilities; only objectives score."
        : "Turn-based planning; no speed tapping.");
};
$("home").querySelector(".party-banner p").textContent =
  "10 classics. 30 rebuilt strategy games. No tap farming.";
document.querySelector(".lab-label").textContent = "STRATEGY REBUILD · LOCAL 1–4 PLAYERS";
document.querySelector(".section-title small").textContent = "40 GAMES · 30 REBUILT RULESETS";
studioLibrary();

const strategyOriginalLibrary = studioLibrary;
let strategyShelf = "all";
studioLibrary = function (filter = "") {
  strategyOriginalLibrary(filter);
  document.querySelectorAll(".card[data-game]").forEach((card) => {
    let g = games.find((v) => v.id === card.dataset.game),
      show =
        strategyShelf === "all" ||
        (strategyShelf === "classic" && !g.strategic) ||
        strategyShelf === strategyDefs[g.id]?.kind;
    card.style.display = show ? "" : "none";
  });
};
const strategyTabs = document.createElement("div");
strategyTabs.className = "strategy-filters";
strategyTabs.setAttribute("role", "group");
strategyTabs.setAttribute("aria-label", "Game type");
strategyTabs.innerHTML = [
  ["all", "All 40"],
  ["classic", "Classics 10"],
  ["arena", "Arenas 10"],
  ["table", "Planning 20"],
]
  .map(
    ([id, t]) =>
      '<button data-shelf="' + id + '" aria-pressed="' + (id === "all") + '">' + t + "</button>",
  )
  .join("");
$("grid").before(strategyTabs);
strategyTabs.querySelectorAll("button").forEach(
  (b) =>
    (b.onclick = () => {
      strategyShelf = b.dataset.shelf;
      strategyTabs
        .querySelectorAll("button")
        .forEach((q) => q.setAttribute("aria-pressed", q === b));
      studioLibrary($("library-search").value);
    }),
);
studioLibrary();

// Small stable inspection surface for regression tests and future development.
window.Party={games,engines,start,step,render,fit,finish,goHome,pause,connects,rowFor,boxEdges,get state(){return S;},get prefs(){return prefs;},get size(){return{W,H};}};
})();
