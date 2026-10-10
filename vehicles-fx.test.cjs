// Kiểm thử đồ họa mới: thuyền & máy bắn đá trong atlas 8 hướng, tường 2.5D, hiệu ứng chiến trận (không cần trình duyệt).
const test=require('node:test'),assert=require('node:assert/strict');
const LS=require('./unit-sprites.js'),V=require('./vehicle-sprites.js'),F=require('./fort-art.js'),FX=require('./fx.js');const L=require('./navy.js');
function mockCtx(){const pts=[];let ops=0;const chk=(...a)=>{for(const v of a)if(typeof v==='number'&&!Number.isFinite(v))throw Error('NaN geometry');};const c={pts,get ops(){return ops;},save(){},restore(){},translate:chk,rotate:chk,scale:chk,beginPath(){},closePath(){},moveTo(x,y){chk(x,y);pts.push([x,y]);ops++;},lineTo(x,y){chk(x,y);pts.push([x,y]);ops++;},quadraticCurveTo(a,b,x,y){chk(a,b,x,y);ops++;},bezierCurveTo(a,b,c2,d,x,y){chk(a,b,c2,d,x,y);ops++;},arc(x,y,r){chk(x,y,r);ops++;},ellipse(x,y,a,b){chk(x,y,a,b);ops++;},rect:chk,fill(){},stroke(){},fillRect:chk,strokeRect:chk,clearRect(){},clip(){},setLineDash(){},fillText(){},drawImage(){},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})};return c;}
test('thuyền và máy bắn đá đã đăng ký vào atlas 8 hướng, hình học hữu hạn',()=>{const kinds=['scout','fishingBoat','transport','archerBoat','ramBoat','serpent','fireboat','warbarge','towerShip','flagship','raft','catapult'];
 for(const k of kinds){assert.ok(LS.SPRITED.has(k),k+' dùng hệ sprite');const cs=LS.cellSize(k,40);assert.ok(cs.w>40&&cs.h>40&&cs.ox>0&&cs.oy>0);
  for(let d=0;d<8;d++)for(const a of['idle','walk','attack','work']){const c=mockCtx();const n=LS.drawFigure(c,k,d,a,2,'#c9473a',40,{style:L.STYLES[3],variant:3});assert.ok(n>0);const xs=c.pts.map(p=>p[0]),ys=c.pts.map(p=>p[1]);assert.ok(Math.max(...xs)-Math.min(...xs)<cs.w*1.05&&Math.min(...ys)>-cs.oy-2,k+' nằm trong ô atlas');}}
 // hướng khác nhau cho hình khác nhau
 const a=mockCtx(),b=mockCtx();LS.drawFigure(a,'flagship',0,'idle',0,'#c00',40,{});LS.drawFigure(b,'flagship',2,'idle',0,'#c00',40,{});assert.notDeepEqual(a.pts.slice(0,20),b.pts.slice(0,20));
 const w1=mockCtx(),w2=mockCtx();LS.drawFigure(w1,'archerBoat',0,'walk',0,'#c00',40,{});LS.drawFigure(w2,'archerBoat',0,'walk',4,'#c00',40,{});assert.notDeepEqual(w1.pts,w2.pts,'mái chèo chuyển động');
 const c1=mockCtx(),c2=mockCtx();LS.drawFigure(c1,'catapult',0,'attack',0,'#c00',40,{});LS.drawFigure(c2,'catapult',0,'attack',5,'#c00',40,{});assert.notDeepEqual(c1.pts,c2.pts,'cần bắn đá quay khi bắn');});
test('tướng cưỡi voi được phóng to; vùng atlas đủ chứa',()=>{const c=mockCtx();LS.drawFigure(c,'dinh',1,'idle',0,'#c00',40,{mount:'elephant',style:L.STYLES[2]});const ys=c.pts.map(p=>p[1]),cs=LS.cellSize('mountedElephant',40);assert.ok(-Math.min(...ys)>40*3.2,'cao hơn 3.2 ô: '+(-Math.min(...ys)/40).toFixed(2));assert.ok(-Math.min(...ys)<cs.oy);});
test('tường tự nối: thẳng, góc, chéo; cổng & vọng lâu vẽ được',()=>{const g=new L.Game(0);g.stock={food:9e3,wood:9e3,stone:9e3,gold:9e3,iron:9e3};const h=g.hall();h.tier=2;const x=Math.floor(h.x)+5,y=Math.floor(h.y);
 for(let yy=y-6;yy<=y+6;yy++)for(let xx=x-1;xx<=x+6;xx++)g.map[yy*L.W+xx]=0;g.nodes=g.nodes.filter(n=>Math.abs(n.x-x-2)>5||Math.abs(n.y-y)>8);g.buildings=g.buildings.filter(b=>b===h||Math.abs(b.x-x-2)>5||Math.abs(b.y-y)>8);g._occDirty=true;
 const line=g.buildWall('stonewall',{x,y:y-3},{x,y:y+3});const arm=g.buildWall('stonewall',{x:x+1,y:y+3},{x:x+4,y:y+3});assert.equal(line.length,7);assert.equal(arm.length,4);
 const mid=line[3],corner=line[6];assert.equal(F.links(g,mid).length,2);assert.equal(F.links(g,corner).length,2);assert.equal(F.links(g,line[0]).length,1);
 const diag=g.buildWall('palisade',{x:x+2,y:y-5},{x:x+5,y:y-2});assert.ok(diag.length>=3);assert.ok(diag.slice(1,-1).every(b=>F.links(g,b).length===2),'đường chéo nối 45°');
 for(const b of g.buildings)if(b.wall&&b.constructing){b.constructing=false;b.job=null;b.hp=b.maxHP;}g._occDirty=true;const gate=g.buildWall('gate',{x,y})[0],tower=g.buildWall('walltower',{x,y:y-2})[0];assert.ok(gate&&tower);
 const S=p=>({x:(p.x-p.y)*40+800,y:(p.x+p.y)*20});for(const b of g.buildings.filter(b=>b.wall)){const c=mockCtx();assert.ok(F.draw(c,b,g,S,40,true,'#c9473a',1));assert.ok(c.ops>8);}
 const c=mockCtx();F.shadows(c,g,S,40,4000,4000);assert.ok(c.ops>0);});
test('hiệu ứng: tên/nỏ/lao/đá bay vòng cung, bụi, khói lửa, xác ngã, gạch vụn, sóng sau thuyền',()=>{
 assert.equal(FX.projectileType('crossbow'),'bolt');assert.equal(FX.projectileType('divineCrossbow'),'bolt');assert.equal(FX.projectileType('catapult'),'stone');assert.equal(FX.projectileType('skirmisher'),'javelin');assert.equal(FX.projectileType('archer'),'arrow');assert.equal(FX.projectileType('fireboat'),'firepot');
 globalThis.Loan12=L;globalThis.LoanSprites=LS;const g=new L.Game(0),fx=FX.create();const h=g.hall();
 g.effects.push({type:'shot',x:h.x,y:h.y,tx:h.x+6,ty:h.y,life:.3,max:.3,src:'catapult'},{type:'shot',x:h.x,y:h.y,tx:h.x+5,ty:h.y+1,life:.3,max:.3,src:'archer',shots:2});
 fx.update(g,.05);assert.equal(fx.state.proj.length,3);for(let i=0;i<4;i++)fx.update(g,.05);const p=fx.state.proj.find(q=>q.type==='stone');assert.ok(p.arc>1,'đá bay cao');
 for(let i=0;i<30;i++)fx.update(g,.05);assert.ok(fx.state.decals.some(d=>d.k==='crater'),'hố đá');
 const u=g.spawn('swordsman',h.x+3,h.y+3,0);u.moving=true;u.target=null;fx.update(g,.05);let dust=0;for(let i=0;i<80;i++){u.x+=.05;fx.update(g,.05);if(fx.state.parts.some(q=>q.k==='dust'))dust++;}assert.ok(dust>0,'bụi khi hành quân');
 u.hp=0;g.units=g.units.filter(v=>v!==u);fx.update(g,.05);assert.equal(fx.state.corpses.length,1,'xác ngã rồi mờ dần');
 h.hp=h.maxHP*.2;for(let i=0;i<60;i++)fx.update(g,.05);assert.ok(fx.state.parts.some(q=>q.k==='smoke'),'khói khi nhà hư hại');
 g.effects.push({type:'rubble',x:h.x+2,y:h.y,kind:'stonewall',life:1,max:1});fx.update(g,.05);assert.ok(fx.state.decals.some(d=>d.k==='rubble'),'gạch vụn tường');
 const boat=g.spawn('archerBoat',12.5,20.5,0);boat.moving=true;fx.update(g,.05);for(let i=0;i<10;i++){boat.x+=.08;fx.update(g,.05);}assert.ok(fx.state.parts.some(q=>q.k==='wake'),'sóng sau thuyền');
 const c=mockCtx(),S=p=>({x:(p.x-p.y)*40+4000,y:(p.x+p.y)*20});fx.drawGround(c,g,S,40,1e5,1e5);fx.drawCorpses(c,g,S,40,['#c00','#00c','#0c0','#cc0','#c0c','#0cc','#888','#c00','#00c','#0c0','#cc0','#c0c'],null);fx.drawAir(c,g,S,40,1e5,1e5);assert.ok(c.ops>20,'ops '+c.ops+' parts '+fx.state.parts.length+' decals '+fx.state.decals.length);
 delete globalThis.Loan12;delete globalThis.LoanSprites;});
