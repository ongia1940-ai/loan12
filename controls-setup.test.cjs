// Kiểm thử điều khiển kiểu AoE2 (LoanControls) và thiết lập trận / bản đồ (setup.js, maps.js).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const L=require('./setup.js'),C=require('./controls.js');const {U,W,H}=L;
const fresh=()=>new L.Game('0',()=>.5,'riverlands');
const own=(g,kind)=>g.units.filter(u=>u.owner===0&&u.hp>0&&u.kind===kind);
const ids=a=>a.map(e=>e.id);
test('right-click command resolves like AoE2: gather, attack, move, attack-move, rally, none',()=>{const g=fresh(),w=own(g,'worker'),army=own(g,'militia');
 const tree=g.nodes.find(n=>n.kind==='wood'),stone=g.nodes.find(n=>n.kind==='stone'),enemy=g.buildings.find(b=>b.owner===1&&b.kind==='hall'),ground={x:20,y:40};
 assert.equal(C.resolveCommand(g,ids(w),tree,tree,{U}).type,'gather');assert.equal(C.resolveCommand(g,ids(w),stone,stone,{U}).type,'gather');
 assert.equal(C.resolveCommand(g,ids(army),enemy,enemy,{U}).type,'attack');assert.equal(C.resolveCommand(g,ids(army),ground,null,{U}).type,'move');
 assert.equal(C.resolveCommand(g,ids(army),ground,null,{U,attackMove:true}).type,'attackMove');
 assert.equal(C.resolveCommand(g,[g.buildings.find(b=>b.owner===0&&b.kind==='barracks').id],ground,null,{U}).type,'rally');
 assert.equal(C.resolveCommand(g,[],ground,null,{U}).type,'none');});
test('workers repair damaged buildings, build foundations and board own transports',()=>{const g=fresh(),w=own(g,'worker');const bar=g.buildings.find(b=>b.owner===0&&b.kind==='barracks');bar.hp=bar.maxHP*.5;
 assert.equal(C.resolveCommand(g,ids(w),bar,bar,{U}).type,'repair');assert.equal(C.cursorFor(g,ids(w),bar),'hammer');bar.constructing=true;assert.equal(C.resolveCommand(g,ids(w),bar,bar,{U}).type,'build');
 const boat=g.spawn('transport',8,20.5,0);assert.equal(C.resolveCommand(g,ids(own(g,'militia')),boat,boat,{U}).type,'board');assert.equal(C.cursorFor(g,ids(own(g,'militia')),boat),'board');});
test('executeCommand drives the real game: workers start gathering, soldiers get a target',()=>{const g=fresh(),w=own(g,'worker'),army=own(g,'militia');const tree=g.nodes.filter(n=>n.kind==='wood'&&!n.farm).sort((a,b)=>Math.hypot(a.x-3,a.y-33)-Math.hypot(b.x-3,b.y-33))[0];
 const c=C.executeCommand(g,ids(w),tree,tree,{U});assert.equal(c.type,'gather');assert.ok(w.every(u=>u.work&&u.work.node===tree.id));
 const enemy=g.units.find(u=>u.owner===1&&u.hp>0);C.executeCommand(g,ids(army),enemy,enemy,{U});assert.ok(army.every(u=>u.target===enemy.id));
 C.executeCommand(g,ids(army),{x:15,y:40},null,{U});assert.ok(army.every(u=>u.target!==enemy.id));});
test('cursor changes: sword over enemy, axe over wood, pick over stone/gold/iron, sickle over food, select when nothing is selected',()=>{const g=fresh(),w=own(g,'worker'),army=own(g,'militia');
 const by=k=>g.nodes.find(n=>n.kind===k&&!n.farm);const enemy=g.units.find(u=>u.owner===1);
 assert.equal(C.cursorFor(g,ids(army),enemy),'attack');assert.equal(C.cursorFor(g,ids(w),by('wood')),'axe');for(const k of ['stone','gold','iron'])assert.equal(C.cursorFor(g,ids(w),by(k)),'pick');
 const farm=g.nodes.find(n=>n.farm);assert.equal(C.cursorFor(g,ids(w),farm),'sickle');assert.equal(C.cursorFor(g,[],w[0]),'select');assert.equal(C.cursorFor(g,[],null),'default');
 assert.equal(C.cursorFor(g,ids(army),null),'move');assert.equal(C.cursorFor(g,ids(army),null,{buildMode:'house'}),'build');assert.equal(C.cursorFor(g,ids(army),null,{attackMove:true}),'attack');});
test('selection helpers: ctrl-toggle, shift-add, box select, double-click same type on screen',()=>{const g=fresh(),army=own(g,'militia');
 assert.deepEqual(C.toggleSelection([1,2],2),[1]);assert.deepEqual(C.toggleSelection([1],3),[1,3]);assert.deepEqual(C.addSelection([1,2],[2,3]),[1,2,3]);
 const toScreen=e=>({x:e.x*10,y:e.y*10});assert.deepEqual(C.boxSelect(army,{x:0,y:0},{x:10000,y:10000},toScreen).sort(),ids(army).sort());assert.deepEqual(C.boxSelect(army,{x:0,y:0},{x:1,y:1},toScreen),[]);
 const visible=e=>e.x<9.5;const same=C.sameTypeOnScreen(g,army[0],visible);assert.ok(same.includes(army[0].id));assert.ok(same.every(id=>g.entity(id).kind==='militia'&&g.entity(id).owner===0));assert.ok(same.length<army.length||army.every(visible));
 assert.ok(!same.some(id=>own(g,'pike').some(p=>p.id===id)));});
test('optional left-click command only fires for own units on ground, enemies or resources',()=>{const g=fresh(),army=own(g,'militia');const enemy=g.units.find(u=>u.owner===1),tree=g.nodes.find(n=>n.kind==='wood');
 assert.equal(C.leftClickIssues(g,ids(army),null,false),false);assert.equal(C.leftClickIssues(g,ids(army),null,true),true);assert.equal(C.leftClickIssues(g,ids(army),enemy,true),true);assert.equal(C.leftClickIssues(g,ids(army),tree,true),true);
 assert.equal(C.leftClickIssues(g,ids(army),army[1],true),false);assert.equal(C.leftClickIssues(g,[],null,true),false);assert.equal(C.leftClickIssues(g,[g.hall().id],null,true),false);});
test('Delete disbands own units but never the Đại Bản Doanh; control groups go up to 9',()=>{const g=fresh(),army=own(g,'militia');assert.equal(g.destroyOwn([army[0].id,g.hall().id,g.units.find(u=>u.owner===1).id]),1);assert.ok(!(army[0].hp>0));assert.ok(g.hall().hp>0);
 g.saveGroup(9,ids(army.slice(1,3)));assert.deepEqual(g.getGroup(9),ids(army.slice(1,3)));g.saveGroup(10,ids(army));assert.equal(g.groups[10],undefined);
 assert.ok(C.HELP.some(([k])=>k==='Ctrl + 1…9'));assert.ok(C.HELP.length>=15);});
test('setup normalises bad input and keeps defaults',()=>{const s=L.normalizeSetup({aiCount:99,resources:'x',faction:'42',ai:[{faction:'7',difficulty:'hard'},{faction:'zz',difficulty:'??'}]});
 assert.equal(s.aiCount,11);assert.equal(s.resources,'standard');assert.equal(s.faction,'11');assert.equal(s.ai[0].faction,'7');assert.equal(s.ai[0].difficulty,'hard');assert.equal(s.ai[1].faction,'auto');assert.equal(s.ai[1].difficulty,'normal');assert.equal(s.ai.length,11);
 assert.equal(L.normalizeSetup({aiCount:0}).aiCount,1);assert.deepEqual(L.normalizeSetup(null),L.defaultSetup());});
test('AI count removes extra lords, which no longer block victory; resources, factions and difficulty apply',()=>{const g=new L.Game('0',()=>.5,'riverlands',{aiCount:2,resources:'high',ai:[{faction:'5',difficulty:'hard'},{faction:'auto',difficulty:'easy'}]});
 assert.deepEqual([...new Set(g.buildings.filter(b=>b.hp>0).map(b=>b.owner))].sort((a,b)=>a-b),[0,1,2]);assert.ok(!g.units.some(u=>u.owner>2));assert.equal(g.states.filter(s=>s==='absent').length,9);
 assert.deepEqual(g.stock,L.RESOURCE_PRESETS.high.stock);assert.equal(g.faction(1).id,5);assert.equal(g.aiDifficulty[1],'hard');
 const s1=g.ai[1].stock.food,s2=g.ai[2].stock.food;assert.ok(s1>s2);const w1=g.units.find(u=>u.owner===1&&u.kind==='worker'),w2=g.units.find(u=>u.owner===2&&u.kind==='worker');const a1=g.ai[1].stock.wood,a2=g.ai[2].stock.wood;g.creditCargo(w1,'wood',100);g.creditCargo(w2,'wood',100);assert.equal(Math.round(g.ai[1].stock.wood-a1),135);assert.equal(Math.round(g.ai[2].stock.wood-a2),70);
 for(const lord of [1,2]){g.pending=lord;g.resolve('fallen');}assert.equal(g.result,'victory');});
test('every playable map keeps all bases connected by land (fords/passes) and random resolves deterministically',()=>{
 for(const id of L.PLAYABLE_MAPS){const g=new L.Game('0',()=>.5,id),hall=g.hall(),seen=new Uint8Array(W*H),q=[],pass=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&![4,7].includes(g.map[y*W+x]);const s=Math.floor(hall.y+2)*W+Math.floor(hall.x);seen[s]=1;q.push(s);
  while(q.length){const i=q.pop(),x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(pass(nx,ny)&&!seen[ny*W+nx]){seen[ny*W+nx]=1;q.push(ny*W+nx);}}}
  for(const b of g.buildings.filter(b=>b.kind==='hall'&&b.owner>0)){let ok=false;for(let dy=-3;dy<=3&&!ok;dy++)for(let dx=-3;dx<=3;dx++){const x=Math.floor(b.x)+dx,y=Math.floor(b.y)+dy;if(x>=0&&y>=0&&x<W&&y<H&&seen[y*W+x]){ok=true;break;}}assert.ok(ok,id+' hall '+b.owner+' unreachable');}}
 assert.equal(L.resolveMapId('random',()=>0),L.PLAYABLE_MAPS[0]);assert.equal(L.resolveMapId('random',()=>.999),L.PLAYABLE_MAPS[L.PLAYABLE_MAPS.length-1]);assert.equal(L.resolveMapId('nope'),'riverlands');
 const g=new L.Game('0',()=>.99,'random');assert.equal(g.mapProfile.id,L.PLAYABLE_MAPS[6]);
 const pass=new L.Game('0',()=>.5,'pass').map.filter(t=>t===7).length,isl=new L.Game('0',()=>.5,'islands').map.filter(t=>t===3||t===4).length,plain=new L.Game('0',()=>.5,'plains'),base=fresh();
 assert.ok(pass>100);assert.ok(isl>base.map.filter(t=>t===3||t===4).length*2);assert.ok(plain.map.filter(t=>t===1||t===2||t===5).length<base.map.filter(t=>t===1||t===2||t===5).length/2);});
test('larger map sizes stretch the whole campaign layout and still simulate',()=>{for(const [size,w,h] of [['large',105,75],['huge',126,90],['epic',188,134]]){
 const out=execFileSync(process.execPath,['-e',`globalThis.LOAN12_MAP_SIZE='${size}';const L=require('./setup.js');const g=new L.Game('0',()=>.5,'coast',{aiCount:4});for(let i=0;i<300;i++)g.tick(.1);
  const halls=g.buildings.filter(b=>b.kind==='hall');const inside=[...g.units,...g.buildings,...g.nodes].every(e=>e.x>=0&&e.y>=0&&e.x<=L.W&&e.y<=L.H);const far=Math.max(...halls.map(b=>b.x));const water=g.map.slice(0).filter(t=>t===3||t===4).length;
  console.log(JSON.stringify({W:L.W,H:L.H,width:g.width,len:g.map.length,inside,far,halls:halls.length,water,landHalls:halls.every(b=>![4,7].includes(g.tile(b.x,b.y))),time:g.time}));`],{cwd:__dirname}).toString();
 const r=JSON.parse(out.trim().split('\n').pop());assert.equal(r.W,w);assert.equal(r.H,h);assert.equal(r.width,w);assert.equal(r.len,w*h);assert.ok(r.inside);assert.ok(r.far>84*.8*w/84);assert.equal(r.halls,5);assert.ok(r.landHalls);assert.ok(r.time>29);}
 assert.equal(L.MAP_SIZE,'standard');assert.equal(W,84);});
test('page wiring: boot before core, setup/controls before game, input after game, menu last; server serves new files',()=>{const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),order=['boot.js','core.js','navy.js','setup.js','controls.js','game.js','input.js','multiplayer.js','menu.js'].map(f=>html.indexOf('src="'+f+'"'));
 assert.ok(order.every(i=>i>0));for(let i=1;i<order.length;i++)assert.ok(order[i]>order[i-1],'order '+i);assert.ok(html.includes('menu.css'));
 const server=fs.readFileSync(path.join(__dirname,'server.cjs'),'utf8');for(const f of ['boot.js','setup.js','controls.js','input.js','menu.js','menu.css'])assert.ok(server.includes("'"+f+"'"));
 const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');assert.ok(game.includes("b.addEventListener('pointerdown'"),'panel buttons fire on pointerdown');assert.ok(game.includes('!panelPress'),'panel is not rebuilt while pressed');assert.ok(!game.includes("canvas.addEventListener('contextmenu'"),'right-click logic lives in input.js');
 const input=fs.readFileSync(path.join(__dirname,'input.js'),'utf8');for(const k of ["'Delete'","'KeyH'","'Escape'","'F1'","contextmenu","Lệnh bằng chuột trái","sameTypeOnScreen"])assert.ok(input.includes(k),k);
 const mp=fs.readFileSync(path.join(__dirname,'multiplayer.js'),'utf8');assert.ok(mp.includes("W2('destroyOwn'")&&mp.includes("e.type==='destroyOwn'"));});
