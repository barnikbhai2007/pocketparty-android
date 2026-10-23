/* Run npm install, then npx playwright install chromium, then npm test.
   CHROMIUM_PATH=/path/to/chromium may select a preinstalled Chromium. */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('file://'+path.resolve(__dirname,'../app/src/main/assets/index.html'));await page.waitForFunction(()=>window.Party);
const results=await page.evaluate(()=>{let out=[];Party.prefs.sound=false;Party.prefs.haptics=false;
for(let humans=1;humans<=4;humans++)for(let g of Party.games){Party.prefs.humans=humans;Party.start(g.id);for(let i=0;i<240;i++)Party.step(1/60);Party.render();let s=Party.state;out.push({game:g.id,humans,players:s.n,finite:s.scores.every(Number.isFinite),elapsed:s.elapsed,ok:s.n===(g.prototype?humans:Math.max(2,humans))&&s.scores.every(Number.isFinite)});}
// Four directional win checks and a nonwin.
let wins=[];for(let [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let b=Array.from({length:6},()=>Array(7).fill(-1));let r=dy<0?3:1,col=1;for(let k=0;k<3;k++)b[r+dy*k][col+dx*k]=0;wins.push(Party.connects(b,r,col,0));}
let blank=Array.from({length:6},()=>Array(7).fill(-1));let rules={directionalWins:wins.every(Boolean),emptyNotWin:!Party.connects(blank,2,2,0),gravity:Party.rowFor(blank,0)===5,boxEdges:Party.boxEdges(0,0).length===4};
// Memory match retains turn and awards one point.
Party.prefs.humans=4;Party.start('memory');let d=Party.state.d;d.cards=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7];Party.engines.memory.choose(0);Party.engines.memory.choose(1);for(let k=0;k<60;k++)Party.step(1/60);rules.memoryMatch=Party.state.scores[0]===1&&Party.state.d.turn===0;
// Duplicate colour taps must not score twice.
Party.start('color');Party.state.d.color=0;Party.engines.color.tap(0);Party.engines.color.tap(0);rules.colourSingleTap=Party.state.scores[0]===1;
// Connect legal moves alternate turns and obey gravity.
Party.start('connect');Party.engines.connect.choose(0);Party.engines.connect.choose(0);rules.connectGravity=Party.state.d.board[5][0]===0&&Party.state.d.board[4][0]===1;
// A box capture awards a point and an extra turn.
Party.start('boxes');d=Party.state.d;d.edges={'h0,0':1,'h1,0':1,'v0,0':1};Party.engines.boxes.choose('v0,1');rules.boxCapture=Party.state.scores[0]===1&&Party.state.d.turn===0;
// Timed games terminate and produce a results modal.
let timed=[];for(let g of Party.games.filter(g=>g.time)){Party.start(g.id);for(let k=0;k<g.time*60+2;k++)Party.step(1/60);timed.push(Party.state.ended);document.getElementById('modal').classList.add('hidden');}
Party.goHome();return{cases:out,rules,timedGamesComplete:timed.every(Boolean)};});
results.browserErrors=errors;results.scope='Browser smoke/rule checks only, not Android/device/full gameplay QA';results.passed=results.cases.every(x=>x.ok)&&Object.values(results.rules).every(Boolean)&&results.timedGamesComplete&&!errors.length;
fs.writeFileSync(path.join(__dirname,'RESULTS.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.passed,gamePlayerCases:results.cases.length,rules:results.rules,timedGamesComplete:results.timedGamesComplete,errors}));
assert(results.passed,'Smoke tests failed: inspect tests/RESULTS.json');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
