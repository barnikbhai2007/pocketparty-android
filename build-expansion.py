from pathlib import Path
p=Path(__file__).parent
s=(p/'core-source.js').read_text()
s=s.replace('Math.max(2,prefs.humans)','seatCount(g)')
s=s.replace("$('play').dataset.game=id;","$('play').dataset.game=id;$('play').dataset.prototype=String(!!g.prototype);inputPoints.clear();")
s=s.replace('fit();engines[id].init();hud();render();',"fit();S.mapIndex=pickMap(id);S.mapName=g.maps[S.mapIndex];engines[id].init();applyMap();if(g.prototype)S.message=g.short; $('tag').textContent=g.tag+' · '+S.mapName;hud();render();")
s=s.replace('function finish(winners){if(!S||S.ended)return;','function finish(winners){if(!S||S.ended)return;if(cup){cupFinish(winners);return;}')
s=s.replace('Pocket Party Deluxe 2.0 · Offline','Pocket Party 6.0 Arcade · Offline')
s=s.replace('if(window.Deluxe)Deluxe.background','if(window.Deluxe&&!S.g.prototype)Deluxe.background').replace('if(window.Deluxe)Deluxe.overlay','if(window.Deluxe&&!S.g.prototype)Deluxe.overlay')
s=s.replace('// Small stable inspection surface', (p/'expansion-source.js').read_text()+'\n'+(p/'arcade-source.js').read_text()+'\n'+(p/'studio-source.js').read_text()+'\n// Small stable inspection surface')
(p/'app/src/main/assets/game.js').write_text(s)
print('Built 20-game Arcade runtime')
