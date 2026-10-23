const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('pocket-party-v1',JSON.stringify({humans:2,sound:false,music:false,haptics:false,wins:[0,0,0,0]})));
 await p.goto('file://'+path.resolve(__dirname,'../app/src/main/assets/index.html'));await p.waitForFunction(()=>window.Party&&window.Deluxe);await p.evaluate(()=>Promise.all([...document.images].map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;}))));
 const out=path.resolve(__dirname,'../preview');fs.mkdirSync(out,{recursive:true});
 await p.screenshot({path:out+'/01-home.png',fullPage:true});
 for(let id of ['rally','sumo','hockey','draw','color','target','rhythm','memory','connect','boxes']){
  await p.evaluate(id=>{Party.prefs.humans=2;Party.start(id);for(let i=0;i<100;i++)Party.step(1/60);Party.state.paused=true;Party.render();},id);
  await p.screenshot({path:out+'/02-'+id+'-2p.png'});
 }
 for(let id of ['hockey','sumo','rally']){await p.evaluate(id=>{Party.prefs.humans=4;Party.start(id);for(let i=0;i<100;i++)Party.step(1/60);Party.state.paused=true;Party.render();},id);await p.screenshot({path:out+'/03-'+id+'-4p.png'});}
 // Real Chromium touch dispatch generates independent Pointer Events.
 const cd=await p.context().newCDPSession(p);
 await p.evaluate(()=>{Party.prefs.humans=2;Party.start('rally');});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:210,id:1},{x:195,y:634,id:2}]});
 let lanes=await p.evaluate(()=>Party.state.d.lane.slice());checks.push({name:'two simultaneous track taps',passed:lanes[0]===1&&lanes[1]===1,actual:lanes});
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.evaluate(()=>Party.start('sumo'));
 let thumbs=await p.evaluate(()=>{let r=document.getElementById('board').getBoundingClientRect();return [0,1].map(i=>{let t=Deluxe.thumb(i);return{x:t.x/Party.size.W*r.width,y:t.y/Party.size.H*r.height,id:i+1};});});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:thumbs});
 let held=await p.evaluate(()=>Party.state.held.slice(0,2));checks.push({name:'two simultaneous sumo holds',passed:held.every(Boolean),actual:held});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 held=await p.evaluate(()=>Party.state.held.slice(0,2));checks.push({name:'sumo release clears both inputs',passed:held.every(x=>!x)});
 await p.evaluate(()=>{Party.prefs.humans=4;Party.start('color');Party.state.d.color=1;Party.state.d.next=100;});
 let four=[{x:95,y:180,id:1},{x:295,y:180,id:2},{x:95,y:660,id:3},{x:295,y:660,id:4}];await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:four});let fourState=await p.evaluate(()=>({held:Party.state.held.slice(),scores:Party.state.scores.slice()}));checks.push({name:'four independent touches reach all players',passed:fourState.held.every(Boolean)&&fourState.scores.join(',')==='-1,1,-1,-1',actual:fourState});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.evaluate(()=>{Party.prefs.humans=2;Party.start('hockey');});
 let striker=await p.evaluate(()=>{let pt=Deluxe.sidePoint(0,.5),r=document.getElementById('board').getBoundingClientRect();return{x:pt.x/Party.size.W*r.width,y:pt.y/Party.size.H*r.height,id:1};});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[striker]});await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...striker,x:290}]});let paddle=await p.evaluate(()=>Party.state.d.paddles[0]);checks.push({name:'direct striker drag',passed:paddle>.65,actual:paddle});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.locator('#pause').click();let elapsed=await p.evaluate(()=>Party.state.elapsed);await p.waitForTimeout(150);let paused=await p.evaluate(()=>({paused:Party.state.paused,elapsed:Party.state.elapsed}));checks.push({name:'pause freezes simulation',passed:paused.paused&&paused.elapsed===elapsed});await p.screenshot({path:out+'/04-pause.png'});await p.locator('#resume').click();
 await p.evaluate(()=>{Party.state.scores=[0,-2];Party.finish([0]);});await p.screenshot({path:out+'/05-results.png'});
 await p.evaluate(()=>Party.goHome());await p.locator('#settings').click();await p.screenshot({path:out+'/06-settings.png'});await p.locator('#done').click();
 await p.locator('.card[data-game="hockey"]').click();await p.screenshot({path:out+'/07-rules.png'});await p.locator('#cancel').click();
 await p.setViewportSize({width:844,height:390});await p.evaluate(()=>{Party.prefs.humans=4;Party.start('sumo');Party.state.paused=true;Party.fit();Party.render();});await p.screenshot({path:out+'/08-landscape-sumo-4p.png'});
 await p.setViewportSize({width:360,height:640});await p.evaluate(()=>{Party.prefs.humans=4;Party.start('connect');Party.state.paused=true;Party.fit();Party.render();});await p.screenshot({path:out+'/09-small-phone-connect.png'});
 let overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);checks.push({name:'small phone no horizontal overflow',passed:!overflow});
 const report={scope:'Chromium rendered UI and CDP touch emulation, NOT physical Android testing',checks,errors,passed:checks.every(x=>x.passed)&&!errors.length};fs.writeFileSync(path.resolve(__dirname,'VISUAL_INPUT_RESULTS.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await b.close();if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
