// Kiểm thử tường thành, cổng, vọng lâu, công thành, sửa chữa; thủy quân: đánh cá, vận binh, thủy chiến; AI dùng tường và thủy xưởng.
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('./navy.js');const {Game,U,W,WALLS,wallLine}=L;
const run=(g,sec,dt=.1)=>{for(let t=0;t<sec;t+=dt){g.pending=null;g.tick(dt);}};
// Open test field: flat grass, no buildings except halls far away.
function field(){const g=new Game(0);g.map.fill(0);g.nodes=[];g.units=g.units.filter(u=>false);g.stock={food:9999,wood:9999,stone:9999,gold:9999,iron:9999};const hall=g.hall();for(const b of g.buildings)if(b!==hall)b.hp=0;hall.x=10;hall.y=30;hall.tier=2;g.buildings=g.buildings.filter(b=>b.hp>0);g.states=g.states.map((s,i)=>i?'enemy':'home');g._occDirty=true;return g;}
function finish(g){for(const b of g.buildings)if(b.constructing){b.constructing=false;b.job=null;b.hp=b.maxHP;}g._occDirty=true;}
test('kéo tường: bám ô, nối đoạn, tính tiền theo ô',()=>{
 const l=wallLine({x:20.2,y:20.7},{x:29.9,y:22.1});assert.equal(l.length,10);assert.ok(l.every(t=>t.y===20),'gần ngang → thẳng theo trục');
 const d=wallLine({x:20,y:20},{x:25,y:26});assert.ok(d.every((t,i)=>t.x===20+i&&t.y===20+i),'chéo 45°');
 const g=field(),before=g.stock.wood;const placed=g.buildWall('palisade',{x:20,y:24},{x:20,y:34});assert.equal(placed.length,11);assert.equal(before-g.stock.wood,11*WALLS.palisade.cost.wood);
 assert.ok(placed.every(b=>b.wall&&b.constructing));finish(g);assert.ok(g.blocked(20,28,'militia'),'tường chặn ô');
 assert.match(g.buildError('stonewall'),/^$/);g.hall().tier=1;assert.match(g.buildError('stonewall'),/cấp 2/);
});
test('cổng mở cho quân mình, chặn quân địch; khóa cổng chặn tất cả',()=>{
 const g=field();for(const y of[12,48]){const h=g.addBuilding('house',25,y,0);h.constructing=false;h.hp=h.maxHP;}assert.equal(g.wallPlan('stonewall',{x:22,y:0},{x:22,y:29},0).count,30);g.buildWall('stonewall',{x:22,y:0},{x:22,y:29});g.buildWall('stonewall',{x:22,y:30},{x:22,y:59});finish(g);const gate=g.buildWall('gate',{x:22,y:30})[0];finish(g);assert.equal(gate.kind,'gate');
 const mine=g.spawn('militia',18.5,30.5,0),foe=g.spawn('militia',26.5,30.5,1);
 const p1=g.path('militia',mine,{x:27.5,y:30.5});assert.ok(p1.length>0,'quân mình đi qua cổng');assert.ok(p1.some(p=>Math.floor(p.x)===22));
 assert.equal(g.path('militia',foe,{x:18.5,y:30.5}).length,0,'quân địch bị chặn');
 g.order([mine.id],{x:27.5,y:30.5});run(g,10);assert.ok(mine.x>23,'quân mình thực sự đi qua cổng: x='+mine.x.toFixed(1));
 g.toggleGate(gate);assert.equal(g.path('militia',{x:27.5,y:30.5,owner:0},{x:18.5,y:30.5}).length,0,'cổng khóa');g.toggleGate(gate);
});
test('quân địch bị tường chặn sẽ tự đánh tường; máy bắn đá phá tường nhanh hơn cung',()=>{
 const g=field();const hall=g.hall();g.buildWall('palisade',{x:16,y:24},{x:16,y:36});g.buildWall('palisade',{x:4,y:24},{x:16,y:24});g.buildWall('palisade',{x:4,y:36},{x:16,y:36});g.buildWall('palisade',{x:4,y:24},{x:4,y:36});finish(g);
 const foes=[0,1,2].map(i=>g.spawn('swordsman',22.5,29.5+i,1));for(const f of foes)f.target=hall.id;run(g,25);
 assert.ok(foes.some(f=>g.entity(f.target)?.wall||f.siegeOf),'địch chuyển sang đánh tường');const broken=g.buildings.filter(b=>b.wall&&b.hp<=0).length+g.buildings.filter(b=>b.wall&&b.hp<b.maxHP).length;assert.ok(broken>0,'tường bị đánh');
 const wall=g.buildings.find(b=>b.wall&&b.hp>0);const cat=g.spawn('catapult',30,30,1),arc=g.spawn('archer',30,31,1);assert.ok(g.combatDamage(cat,wall)>g.combatDamage(arc,wall)*10,'công thành');
});
test('vọng lâu trên tường tự bắn; dân phu sửa tường tốn tài nguyên',()=>{
 const g=field();g.buildWall('stonewall',{x:20,y:28},{x:20,y:32});finish(g);const tw=g.buildWall('walltower',{x:20,y:30})[0];assert.equal(tw.material,'stonewall','vọng lâu đặt lên đoạn tường');finish(g);
 const foe=g.spawn('militia',24.5,30.5,1);foe.hold=true;const hp=foe.hp;run(g,3);assert.ok(foe.hp<hp,'bị bắn');
 const seg=g.buildings.find(b=>b.wall&&b.kind==='stonewall'&&b.hp>0);seg.hp=200;const w=g.spawn('worker',18.5,28.5,0);const stone=g.stock.stone;g.repair([w.id],seg.id);run(g,20);assert.ok(seg.hp>400,'đã sửa: '+seg.hp);assert.ok(g.stock.stone<stone,'tốn đá');
});
test('thuyền vận binh: đón quân, chở qua sông, đổ quân lên bờ bên kia',()=>{
 const g=new Game(0);g.stock={food:9999,wood:9999,stone:9999,gold:9999,iron:9999};const dock=g.buildings.find(b=>b.kind==='dock'&&b.owner===0);const p=g.findOpen('transport',dock,4);const boat=g.spawn('transport',p.x,p.y,0);
 const land=g.findOpen('militia',{x:dock.x,y:dock.y+3},4,true);const men=[0,1,2,3].map(i=>g.spawn('pike',land.x+(i%2)*.6,land.y+.8+Math.floor(i/2)*.6,0));
 assert.equal(g.board(men.map(u=>u.id),boat.id),4);run(g,15);assert.equal(boat.cargo.length,4,'đã lên thuyền');assert.ok(men.every(u=>u.embarked===boat.id));
 const far={x:dock.x+4,y:dock.y-6};assert.ok(g.unloadAt(boat,far),'nhận lệnh đổ quân');run(g,40);assert.equal(boat.cargo.length,0,'đã đổ quân');assert.ok(men.every(u=>!u.embarked&&u.y<dock.y-1.5),'quân sang bờ bắc: '+men.map(u=>u.y.toFixed(1)).join(','));
});
test('thủy chiến: thuyền húc ×2,2 lên thuyền, soái hạm tăng sát thương, thuyền tự giao chiến',()=>{
 const g=new Game(0);const ram=g.spawn('ramBoat',12.5,20.5,0),foe=g.spawn('archerBoat',14.5,20.5,1),men=g.spawn('militia',10,30,1);
 assert.ok(g.combatDamage(ram,foe)>g.stats(ram).dmg*1.5,'húc thuyền');const base=g.combatDamage(foe,ram);g.spawn('flagship',15.5,20.5,1);assert.ok(g.combatDamage(foe,ram)>base,'soái hạm');
 const a=g.spawn('archerBoat',30.5,19.5,0),b=g.spawn('serpent',33.5,19.5,1);const ha=a.hp,hb=b.hp;run(g,6);assert.ok(a.hp<ha&&b.hp<hb,'hai bên bắn nhau');
});
test('đánh cá: thuyền chài mang Lương về Thủy Xưởng; Trần Lãm đóng thuyền rẻ hơn',()=>{
 const g=new Game(0);const dock=g.buildings.find(b=>b.kind==='dock'&&b.owner===0);const n=g.nodes.filter(v=>v.fish).sort((a,b)=>Math.hypot(a.x-dock.x,a.y-dock.y)-Math.hypot(b.x-dock.x,b.y-dock.y))[0];assert.ok(n,'có bãi cá');const p=g.findOpen('fishingBoat',dock,4);const fb=g.spawn('fishingBoat',p.x,p.y,0);const food=g.stock.food;g.fish([fb.id],n.id);run(g,60);assert.ok(g.stock.food>food+20,'thêm Lương: '+(g.stock.food-food).toFixed(0));
 const t=new Game(3);assert.ok(t.unitCost(0,'serpent').wood<U.serpent.cost.wood);t.stock={food:0,wood:68,stone:0,gold:34,iron:0};const d3=t.buildings.find(b=>b.kind==='dock'&&b.owner===0);d3.tier=2;assert.equal(t.trainError(d3,'serpent'),'','đủ tiền nhờ giảm giá');assert.ok(t.train(d3,'serpent'));assert.equal(t.stock.wood,0);
 const s=t.spawn('archerBoat',12,20,0),s2=new Game(0).spawn('archerBoat',12,20,0);assert.ok(t.stats(s).speed>new Game(0).stats(s2).speed,'thuyền Bố Hải nhanh hơn');
});
test('AI dựng thủy xưởng, đóng thuyền; dựng tường + cổng + vọng lâu quanh căn cứ',()=>{
 const g=new Game(0);for(let o=1;o<12;o++){g.ai[o].stock={food:9999,wood:9999,stone:9999,gold:9999,iron:9999};}
 let docks=0;for(let o=1;o<12;o++){const before=g.buildings.filter(b=>b.owner===o&&b.kind==='dock').length;g.time=400;for(const b of g.buildings.filter(b=>b.owner===o))b.constructing=false;if(!g.buildings.some(b=>b.owner===o&&b.kind==='barracks')){const bk=g.addBuilding('barracks',1,1,o);bk.constructing=false;bk.hp=bk.maxHP;}g.aiNavy(o);if(g.buildings.filter(b=>b.owner===o&&b.kind==='dock').length>before)docks++;}
 assert.ok(docks>=2,'AI có nước dựng thủy xưởng: '+docks);
 const owner=g.buildings.find(b=>b.kind==='dock'&&b.owner>0).owner;assert.ok(['fishingBoat','archerBoat'].includes(g.aiUnit(owner,'dock',1)));assert.ok(g.aiUnit(owner,'dock',3)!==null);
 const o2=4,h=g.buildings.find(b=>b.owner===o2&&b.kind==='hall');h.tier=2;g.time=900;for(let i=0;i<20;i++)g.aiFortify(o2);const walls=g.buildings.filter(b=>b.owner===o2&&b.wall&&b.hp>0);assert.ok(walls.length>=10,'AI xây tường: '+walls.length);assert.ok(walls.some(b=>b.kind==='gate'),'có cổng');assert.ok(walls.some(b=>b.kind==='walltower'),'có vọng lâu');
 const worker=g.units.find(u=>u.owner===o2&&u.kind==='worker');const gate=walls.find(b=>b.kind==='gate');finish(g);assert.ok(!g.blocked(Math.floor(gate.x),Math.floor(gate.y),'worker',undefined,o2),'cổng mở cho AI');assert.ok(g.blocked(Math.floor(gate.x),Math.floor(gate.y),'militia',undefined,0),'cổng chặn người chơi');
});
test('mô phỏng 6 phút với tường + thủy quân không lỗi, đường đi không hỏng',()=>{
 for(const map of['riverlands','delta','coast']){const g=new Game(3,(()=>{let s=9;return()=>(s=(s*16807)%2147483647)/2147483647;})(),map);run(g,360,.15);assert.ok(g.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));}
});
