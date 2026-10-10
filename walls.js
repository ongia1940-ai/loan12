// Loạn 12 Sứ Quân — tường thành kiểu AoE: hàng rào cọc, tường đất nện, tường đá, cổng thành, vọng lâu trên tường.
// Kéo chuột để xây cả đoạn tường bám theo ô; cổng mở cho quân mình, chặn quân địch; quân bị chặn sẽ tự phá tường.
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./warlords.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:Base,U,B,BUILD,RESOURCE,W,H,dist,terrainEffect}=api;
const WALLS={
 palisade:{name:'Hàng Rào Cọc Tre',cost:{wood:6},hp:220,armor:1,seconds:3,tier:1,material:'palisade',description:'Rẻ, dựng nhanh bằng gỗ. Chặn bộ binh nhẹ; dễ bị đốt và phá.'},
 earthwall:{name:'Tường Đất Nện',cost:{wood:3,stone:8},hp:460,armor:3,seconds:5,tier:1,material:'earthwall',description:'Đất nện trộn đá, bền gấp đôi hàng rào. Thành đá ong +25% HP.'},
 stonewall:{name:'Tường Đá',cost:{stone:16},hp:850,armor:5,seconds:8,tier:2,material:'stonewall',description:'Bền nhất; cung tên gần như vô hại, cần voi hoặc máy bắn đá. Cần Đại Bản Doanh II.'},
 gate:{name:'Cổng Thành',cost:{wood:30,stone:30},hp:700,armor:4,seconds:10,tier:1,gate:true,description:'Đặt lên đoạn tường có sẵn hoặc ô trống. Tự mở cho quân mình, đóng trước quân địch. Có thể khóa.'},
 walltower:{name:'Vọng Lâu Trên Tường',cost:{wood:40,stone:60},hp:620,armor:4,seconds:14,tier:1,tower:true,range:7,dmg:7,delay:1.7,description:'Đặt lên đoạn tường hoặc ô trống; tự bắn tên quân địch trong 7 ô.'}
};
// Hệ số công thành: máy bắn đá, voi, thuyền húc phá tường nhanh; tên bắn gần như vô hại.
const SIEGE={catapult:4,elephant:2.5,armoredElephant:3,ramBoat:3,fireboat:1.5,raft:1.5,towerShip:1.2,flagship:1.2};
for(const [k,v] of Object.entries(WALLS)){B[k]={name:v.name,hp:v.hp};BUILD[k]={cost:v.cost,seconds:v.seconds,description:v.description,wall:true,perTile:!v.gate&&!v.tower};}
const isWallKind=k=>!!WALLS[k];
// Tiles of a straight line snapped to tile axes or 45° (screen: iso diagonals / horizontal / vertical).
function wallLine(a,b,max=40){const ax=Math.floor(a.x),ay=Math.floor(a.y);let bx=Math.floor(b.x),by=Math.floor(b.y);let dx=bx-ax,dy=by-ay;
 if(Math.abs(dx)>=2*Math.abs(dy))dy=0;else if(Math.abs(dy)>=2*Math.abs(dx))dx=0;else{const n=Math.max(Math.abs(dx),Math.abs(dy));dx=Math.sign(dx)*n;dy=Math.sign(dy)*n;}
 const n=Math.min(max,Math.max(Math.abs(dx),Math.abs(dy))),sx=Math.sign(dx),sy=Math.sign(dy),out=[];for(let i=0;i<=n;i++)out.push({x:ax+sx*i,y:ay+sy*i});return out;}
// Binary heap for A*.
function heapPush(h,f,n){h.push([f,n]);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p;}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;}}return top;}
class Game extends Base{
 constructor(...args){super(...args);this._occDirty=true;}
 isWall(b){return !!(b&&b.wall);}
 wallSpec(kind){return WALLS[kind];}
 wallHP(kind,owner){const s=WALLS[kind];return Math.round(s.hp*((owner===0&&this.laterite&&(kind==='earthwall'||kind==='stonewall'||kind==='gate'||kind==='walltower'))?1.25:1));}
 addBuilding(kind,x,y,owner){const b=super.addBuilding(kind,x,y,owner);if(WALLS[kind]){b.wall=true;b.maxHP=b.hp=this.wallHP(kind,owner);}this._occDirty=true;return b;}
 // ---------- occupancy grid (fast blocked() for many wall pieces) ----------
 occupancy(){const nb=this.buildings.length,nn=this.nodes?this.nodes.length:0;if(!this._occ||this._occDirty||this._occNB!==nb||this._occNN!==nn){const g=this._occ||new Int32Array(W*H);g.fill(0);const gates=new Map(),wallAt=new Map();
   for(const b of this.buildings){if(!(b.hp>0))continue;if(b.wall){const x=Math.floor(b.x),y=Math.floor(b.y);if(x<0||y<0||x>=W||y>=H)continue;wallAt.set(y*W+x,b);if(b.kind==='gate'&&!b.locked){g[y*W+x]=b.id;gates.set(b.id,b);}else g[y*W+x]=-1;continue;}
    for(let ty=Math.floor(b.y-1.5);ty<=Math.ceil(b.y-.5);ty++)for(let tx=Math.floor(b.x-1.5);tx<=Math.ceil(b.x-.5);tx++){if(tx<0||ty<0||tx>=W||ty>=H)continue;if(Math.abs(b.x-(tx+.5))<1&&Math.abs(b.y-(ty+.5))<1)g[ty*W+tx]=-1;}}
   if(this.nodes)for(const n of this.nodes)if(!n.farm&&n.amount>1e-7){const x=Math.floor(n.x),y=Math.floor(n.y);if(x>=0&&y>=0&&x<W&&y<H&&g[y*W+x]===0)g[y*W+x]=-1;}
   this._occ=g;this._gates=gates;this._wallAt=wallAt;this._occDirty=false;this._occNB=nb;this._occNN=nn;}return this._occ;}
 blocked(x,y,kind,ignore,owner){if(ignore!=null)return super.blocked(x,y,kind,ignore);x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=W||y>=H)return true;if(!terrainEffect(kind,this.map[y*W+x]).pass)return true;const v=this.occupancy()[y*W+x];if(v===0)return false;if(v<0)return true;const gate=this._gates.get(v);return !(gate&&owner!==undefined&&owner===gate.owner);}
 gateAt(x,y){this.occupancy();const v=this._occ[Math.floor(y)*W+Math.floor(x)];return v>0?this._gates.get(v):null;}
 // A* with a binary heap; gates are open only for their owner (from.owner).
 path(kind,from,to,opts={}){const owner=from&&from.owner!==undefined?from.owner:opts.owner;let sx=Math.floor(from.x),sy=Math.floor(from.y),tx=Math.floor(to.x),ty=Math.floor(to.y);
  if(sx<0||sy<0||sx>=W||sy>=H)return [];const breach=opts.breach||null;const blk=(x,y)=>{if(breach){const w=breach(x,y);if(w===1)return false;}return this.blocked(x,y,kind,undefined,owner);};if(blk(tx,ty))return [];
  const start=sy*W+sx,goal=ty*W+tx,g=new Float64Array(W*H).fill(Infinity),prev=new Int32Array(W*H).fill(-1),closed=new Uint8Array(W*H),open=[];g[start]=0;const hfun=(x,y)=>{const dx=Math.abs(x-tx),dy=Math.abs(y-ty);return Math.max(dx,dy)+.414*Math.min(dx,dy);};heapPush(open,hfun(sx,sy),start);let expanded=0;
  while(open.length){const [,n]=heapPop(open);if(closed[n])continue;if(n===goal){const out=[];for(let p=goal;p!==start;p=prev[p])out.push({x:p%W+.5,y:Math.floor(p/W)+.5});return out.reverse();}closed[n]=1;if(++expanded>W*H)break;const x=n%W,y=(n-x)/W;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const ni=ny*W+nx;if(closed[ni]||blk(nx,ny))continue;if(dx&&dy&&(blk(x+dx,y)||blk(x,y+dy)))continue;
    let cost=g[n]+(dx&&dy?1.414:1)/terrainEffect(kind,this.map[ni]).speed;if(breach&&breach(nx,ny)===1)cost+=8;if(cost<g[ni]){g[ni]=cost;prev[ni]=n;heapPush(open,cost+hfun(nx,ny),ni);}}}
  return [];}
 // ---------- wall placement ----------
 wallLine(a,b){return wallLine(a,b);}
 coverBuilding(x,y){return this.buildings.find(b=>b.hp>0&&Math.abs(b.x-(x+.5))<1&&Math.abs(b.y-(y+.5))<1)||null;}
 wallGeneralError(kind,owner=0){const s=WALLS[kind];if(!s)return 'Không phải tường';const hall=this.buildings.find(b=>b.owner===owner&&b.kind==='hall'&&this.ready(b));if(!hall)return 'Cần Đại Bản Doanh';if(hall.tier<s.tier)return s.name+' cần Đại Bản Doanh cấp '+s.tier;return '';}
 wallTileError(kind,x,y,owner=0){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=W||y>=H)return 'Ngoài bản đồ';const t=this.tile(x,y);if([3,4,6,7].includes(t))return 'Không xây trên nước, rừng hay vách đá';
  if(this.nodes&&this.nodes.some(n=>!n.farm&&n.amount>1e-7&&Math.floor(n.x)===x&&Math.floor(n.y)===y))return 'Vướng rừng/mỏ';
  const b=this.coverBuilding(x,y);if(b){if(b.wall&&b.owner===owner&&(WALLS[kind].gate||WALLS[kind].tower)&&b.kind!==kind&&!b.constructing&&!WALLS[b.kind].gate&&!WALLS[b.kind].tower)return '';return b.wall?'Đã có tường':'Vướng công trình';}
  if(!this.buildings.some(v=>v.owner===owner&&v.hp>0&&!v.wall&&this.ready(v)&&dist(v,{x:x+.5,y:y+.5})<=14))return 'Xây trong 14 ô quanh công trình của bạn';return '';}
 wallPlan(kind,a,b,owner=0){const general=this.wallGeneralError(kind,owner),spec=WALLS[kind];const tiles=(spec&&(spec.gate||spec.tower))?[{x:Math.floor(a.x),y:Math.floor(a.y)}]:wallLine(a,b);const out=tiles.map(t=>({...t,error:general||this.wallTileError(kind,t.x,t.y,owner)}));const ok=out.filter(t=>!t.error).length,cost={};if(spec)for(const k of RESOURCE)if(spec.cost[k])cost[k]=spec.cost[k]*ok;return {tiles:out,count:ok,cost,error:general};}
 placeWall(kind,x,y,owner){const old=this.coverBuilding(x,y);let material=null;if(old&&old.wall){material=old.kind;old.hp=0;old.replaced=true;}
  if(!material){const near=this.buildings.find(v=>v.hp>0&&v.wall&&v.owner===owner&&!WALLS[v.kind].gate&&!WALLS[v.kind].tower&&Math.abs(v.x-(x+.5))<=1.01&&Math.abs(v.y-(y+.5))<=1.01);material=near?near.kind:(WALLS[kind].gate||WALLS[kind].tower)?'stonewall':kind;}
  const b=this.addBuilding(kind,x+.5,y+.5,owner);b.material=material;b.constructing=true;b.hp=Math.max(1,b.maxHP*.25);b.job={type:'build',cost:{...WALLS[kind].cost},total:WALLS[kind].seconds,elapsed:0};
  for(const u of this.units)if(u.hp>0&&!u.embarked&&Math.floor(u.x)===x&&Math.floor(u.y)===y&&!U[u.kind].naval){const p=this.findOpen(u.kind,u,3);if(p){u.x=p.x;u.y=p.y;}}
  this._occDirty=true;return b;}
 buildWall(kind,a,b,owner=0){const plan=this.wallPlan(kind,a,b||a,owner);if(plan.error){this.say(plan.error);return [];}const spec=WALLS[kind],placed=[];let short=false;
  for(const t of plan.tiles){if(t.error)continue;if(owner===0){if(!this.pay(spec.cost)){short=true;break;}}else if(this.ai&&this.ai[owner]){if(!this.aiPay(owner,spec.cost)){short=true;break;}}placed.push(this.placeWall(kind,t.x,t.y,owner));}
  if(placed.length)this.units.forEach(u=>{if(u.owner===owner||placed.some(p=>dist(p,u)<20))u.path=[];});
  if(owner===0){if(placed.length)this.say('Khởi công '+placed.length+' ô '+spec.name+(short?' · hết tài nguyên giữa chừng':'')+(plan.tiles.length>plan.count?' · bỏ qua ô vướng':''));else this.say(short?'Thiếu tài nguyên':(plan.tiles.find(t=>t.error)?.error||'Không thể xây ở đây'));}
  return placed;}
 buildError(kind,p){if(WALLS[kind]){const e=this.wallGeneralError(kind,0);if(e)return e;if(p){const te=this.wallTileError(kind,p.x,p.y,0);if(te)return te;}return this.canPay(WALLS[kind].cost)?'':'Thiếu tài nguyên';}return super.buildError(kind,p);}
 build(kind,point){if(WALLS[kind])return this.buildWall(kind,point,point,0)[0]||null;const b=super.build(kind,point);this._occDirty=true;return b;}
 upgradeError(b){if(b&&b.wall)return 'Tường không nâng cấp; xây tường đá đè lên khi phá dỡ';return super.upgradeError(b);}
 cancelJob(b){const r=super.cancelJob(b);this._occDirty=true;return r;}
 demolish(b){if(!b||!b.wall||b.owner!==0||b.hp<=0)return false;b.hp=0;b.demolished=true;this._occDirty=true;this.effects.push({type:'rubble',x:b.x,y:b.y,kind:b.material||b.kind,life:1,max:1});this.units.forEach(u=>u.path=[]);this.say('Đã phá dỡ '+B[b.kind].name);return true;}
 toggleGate(b){if(!b||b.kind!=='gate'||b.owner!==0||b.hp<=0)return false;b.locked=!b.locked;this._occDirty=true;this.say(b.locked?'Đã khóa cổng · không ai qua được':'Đã mở khóa cổng · quân mình tự do qua lại');return true;}
 gateOpen(b){if(!b||b.kind!=='gate'||b.locked||b.constructing)return false;return this.units.some(u=>u.hp>0&&!u.embarked&&u.owner===b.owner&&Math.abs(u.x-b.x)<1.7&&Math.abs(u.y-b.y)<1.7);}
 hit(target,amount,source){const alive=target.hp>0;super.hit(target,amount,source);if(alive&&target.hp<=0&&target.entity==='building'){this._occDirty=true;if(target.wall){this.effects.push({type:'rubble',x:target.x,y:target.y,kind:target.material||target.kind,life:1,max:1});this.units.forEach(u=>{if(dist(u,target)<25)u.path=[];});}}}
 resolve(choice){const r=super.resolve(choice);this._occDirty=true;return r;}
 combatDamage(u,target){if(target&&target.entity==='building'&&target.wall){const s=this.stats(u),spec=WALLS[target.kind]||WALLS.palisade;let mult=SIEGE[u.kind]??(s.range>=3?.25:1);if(target.kind==='palisade'&&(u.kind==='fireboat'||u.kind==='raft'))mult*=1.5;if(target.constructing)mult*=1.5;return Math.max(1,s.dmg*mult-spec.armor)*(s.shots||1);}return super.combatDamage(u,target);}
 // ---------- repair & construction help by workers ----------
 repair(ids,buildingId){const b=this.buildings.find(v=>v.id===buildingId&&v.hp>0);if(!b){this.say('Không có công trình để sửa');return 0;}let n=0;for(const u of this.units)if(ids.includes(u.id)&&u.hp>0&&!u.embarked&&u.kind==='worker'&&u.owner===b.owner){if(!b.constructing&&b.hp>=b.maxHP)continue;u.work=null;u.target=null;u.path=[];u.buildQueue=[];u.repair=b.id;u.repairRetry=0;n++;}if(n)this.say(n+' dân phu đi '+(b.constructing?'kiến thiết ':'sửa ')+B[b.kind].name);else this.say(b.hp>=b.maxHP?'Công trình còn nguyên vẹn':'Chọn Dân Phu để sửa chữa');return n;}
 construct(ids,buildingIds,spread=false,append=false){const workers=this.units.filter(u=>ids.includes(u.id)&&u.hp>0&&!u.embarked&&u.kind==='worker'&&u.owner===0),targets=buildingIds.map(id=>this.buildings.find(b=>b.id===id&&b.hp>0&&b.owner===0&&b.constructing)).filter(Boolean);if(!workers.length||!targets.length)return 0;
  for(const u of workers){u.work=null;u.target=null;if(!append){u.path=[];u.repair=null;u.buildQueue=[];}else if(!u.buildQueue)u.buildQueue=[];}
  if(spread){targets.forEach((b,i)=>{const u=workers[i%workers.length];if(!u.repair)u.repair=b.id;else if(u.repair!==b.id&&!u.buildQueue.includes(b.id))u.buildQueue.push(b.id);});}
  else for(const u of workers)for(const b of targets){if(!u.repair)u.repair=b.id;else if(u.repair!==b.id&&!u.buildQueue.includes(b.id))u.buildQueue.push(b.id);}
  for(const u of workers)u.repairRetry=0;this.say(workers.length+' dân phu bắt đầu kiến thiết '+targets.length+' hạng mục');return workers.length;}
 repairCost(b,hp){const c=(WALLS[b.kind]||BUILD[b.kind]||{}).cost||{};const out={};for(const k of RESOURCE)if(c[k])out[k]=c[k]*.5*hp/b.maxHP;return out;}
 repairTick(dt){for(const u of this.units){if(u.hp<=0||u.embarked)continue;u.repairing=false;let b=this.buildings.find(v=>v.id===u.repair&&v.hp>0);if(!b||(!b.constructing&&b.hp>=b.maxHP)){u.repair=null;while(u.buildQueue?.length&&!u.repair){const id=u.buildQueue.shift(),next=this.buildings.find(v=>v.id===id&&v.hp>0&&v.constructing);if(next){u.repair=id;b=next;u.repairRetry=0;}}if(!u.repair)continue;}
   const reach=b.wall?1.6:2.4;if(dist(u,b)>reach){if(!u.path.length){u.repairRetry=(u.repairRetry||0)-dt;if(u.repairRetry<=0){u.repairRetry=1.5;const r=b.wall?this.wallApproach(u,b):this.reachableApproach(u,b);if(r)u.path=r.path.length?r.path:[r.point];else{u.repair=null;if(u.owner===0)this.say('Dân phu không tới được công trình');}}}continue;}
   u.path=[];u.repairing=true;u.angle=Math.atan2(b.y-u.y,b.x-u.x);
   if(b.constructing&&b.job){b.job.elapsed+=dt*.9;continue;}
   const hp=Math.min(b.maxHP-b.hp,(b.wall?16:10)*dt),cost=this.repairCost(b,hp);const stock=u.owner===0?this.stock:this.ai?.[u.owner]?.stock;if(stock){if(RESOURCE.some(k=>(stock[k]||0)<(cost[k]||0))){u.repair=null;if(u.owner===0)this.say('Thiếu tài nguyên để sửa chữa');continue;}for(const k of RESOURCE)stock[k]-=cost[k]||0;}b.hp+=hp;}}
 order(ids,point,targetId=null,attackMove=false){for(const u of this.units)if(ids.includes(u.id)){u.repair=null;u.repairing=false;u.buildQueue=[];u.siegeOf=null;}return super.order(ids,point,targetId,attackMove);}
 stop(ids,hold=false){for(const u of this.units)if(ids.includes(u.id)){u.repair=null;u.repairing=false;u.buildQueue=[];u.siegeOf=null;}return super.stop(ids,hold);}
 wallApproach(u,b){const c=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=Math.floor(b.x)+dx,y=Math.floor(b.y)+dy;if(this.blocked(x,y,u.kind,undefined,u.owner))continue;c.push({x:x+.5,y:y+.5});}
  c.sort((a,z)=>dist(u,a)-dist(u,z));for(const p of c.slice(0,6)){if(dist(u,p)<.1)return {point:p,path:[]};const route=this.path(u.kind,u,p);if(route.length)return {point:p,path:route};}return null;}
 // ---------- siege: blocked units pick the wall in their way ----------
 breachTarget(u,target){const spot=this.findOpen(u.kind,target,4)||target;this.occupancy();const wa=this._wallAt;const hostileWall=(x,y)=>{const b=wa.get(y*W+x);return b&&b.hp>0&&this.hostile(u,b)?b:null;};
  const route=this.path(u.kind,u,spot,{breach:(x,y)=>hostileWall(x,y)?1:0});for(const p of route){const b=hostileWall(Math.floor(p.x),Math.floor(p.y));if(b)return b;}
  return this.buildings.filter(b=>b.hp>0&&b.wall&&this.hostile(u,b)&&dist(b,u)<10).sort((a,b)=>dist(a,u)+dist(a,target)*.5-dist(b,u)-dist(b,target)*.5)[0]||null;}
 siegeTick(dt){for(const u of this.units){if(u.hp<=0||u.embarked||U[u.kind].naval||u.kind==='worker')continue;
   if(u.siegeOf&&!this.entity(u.target)){const t=this.entity(u.siegeOf);u.siegeOf=null;if(t&&this.hostile(u,t)){u.target=t.id;u.repath=0;}continue;}
   const t=this.entity(u.target);
   if(t&&t.wall&&this.hostile(u,t)&&!u.hold&&!u.path.length&&dist(u,t)>this.stats(u).range+.8&&(u.wallRoute||0)<=this.time){u.wallRoute=this.time+1.2;const r=this.wallApproach(u,t);if(r){u.path=r.path.length?r.path:[r.point];u.repath=1.2;}}
   if(!t||t.wall||u.hold||!this.hostile(u,t)){u.stuck=0;continue;}const s=this.stats(u);if(!(s.dmg>0))continue;
   if(u.path.length||dist(u,t)<=s.range+(t.entity==='building'?1.3:0)+.2){u.stuck=0;continue;}u.stuck=(u.stuck||0)+dt;if(u.stuck<1.4)continue;u.stuck=-2;
   const w=this.breachTarget(u,t);if(w){u.siegeOf=t.id;u.target=w.id;u.repath=0;u.path=[];}else u.stuck=-8;}}
 towerTick(dt){for(const b of this.buildings){if(b.kind!=='walltower'||!(b.hp>0)||b.constructing)continue;b.cooldown=Math.max(0,(b.cooldown||0)-dt);if(b.cooldown>0)continue;const spec=WALLS.walltower,target=this.units.filter(u=>u.hp>0&&!u.embarked&&this.hostile(b,u)&&dist(b,u)<=spec.range&&this.line(b,u)).sort((a,z)=>dist(b,a)-dist(b,z))[0];
   if(target){const ts=this.stats(target);this.hit(target,Math.max(1,spec.dmg-(ts.arrow||0)*.5),b);b.cooldown=spec.delay;b.shotAnim=.3;this.effects.push({type:'shot',x:b.x,y:b.y,tx:target.x,ty:target.y,life:.3,max:.3,src:'walltower',z0:1.9});}}}
 // ---------- AI fortification ----------
 aiWallPlan(owner){const h=this.buildings.find(b=>b.owner===owner&&b.kind==='hall'&&b.hp>0),me=this.hall();if(!h)return [];const cx=Math.floor(h.x),cy=Math.floor(h.y),R=7,dir=me?{x:me.x-h.x,y:me.y-h.y}:{x:-1,y:0},dl=Math.hypot(dir.x,dir.y)||1;const ring=[];
  for(let i=-R;i<=R;i++){ring.push({x:cx+i,y:cy-R});ring.push({x:cx+i,y:cy+R});if(Math.abs(i)<R){ring.push({x:cx-R,y:cy+i});ring.push({x:cx+R,y:cy+i});}}
  const front=ring.filter(t=>((t.x-cx)*dir.x+(t.y-cy)*dir.y)/(Math.hypot(t.x-cx,t.y-cy)*dl)>-.25);
  const mids=[{x:cx,y:cy-R},{x:cx,y:cy+R},{x:cx-R,y:cy},{x:cx+R,y:cy}].filter(m=>front.some(t=>t.x===m.x&&t.y===m.y));const corners=[{x:cx-R,y:cy-R},{x:cx+R,y:cy-R},{x:cx-R,y:cy+R},{x:cx+R,y:cy+R}].filter(m=>front.some(t=>t.x===m.x&&t.y===m.y));
  const key=t=>t.x+','+t.y,special=new Set([...mids,...corners].map(key));return [...mids.map(t=>({...t,kind:'gate'})),...corners.slice(0,3).map(t=>({...t,kind:'walltower'})),...front.filter(t=>!special.has(key(t))).sort((a,b)=>Math.hypot(a.x-cx-dir.x/dl*R,a.y-cy-dir.y/dl*R)-Math.hypot(b.x-cx-dir.x/dl*R,b.y-cy-dir.y/dl*R)).map(t=>({...t,kind:'wall'}))];}
 aiFortify(owner){const a=this.ai?.[owner];if(!a||this.states[owner]!=='enemy')return;const h=this.buildings.find(b=>b.owner===owner&&b.kind==='hall'&&b.hp>0);if(!h)return;if(this.time<(a.fortifyAt??(420+owner*15))||h.tier<2&&this.time<700)return;
  if(!a.wallPlan){a.wallPlan=this.aiWallPlan(owner);a.wallIndex=0;}const stone=a.stock.stone>140&&h.tier>=2;let placed=0;
  while(a.wallIndex<a.wallPlan.length&&placed<6){const t=a.wallPlan[a.wallIndex],kind=t.kind==='wall'?(stone?'stonewall':'palisade'):t.kind;if(this.wallGeneralError(kind,owner)||this.wallTileError(kind,t.x,t.y,owner)){a.wallIndex++;continue;}if(this.units.some(u=>u.hp>0&&!u.embarked&&Math.floor(u.x)===t.x&&Math.floor(u.y)===t.y&&u.owner!==owner))break;if(!this.aiPay(owner,WALLS[kind].cost))break;this.placeWall(kind,t.x,t.y,owner);a.wallIndex++;placed++;a.walls=(a.walls||0)+1;}
  if(placed){a.status='Đắp tường thành';for(const u of this.units)if(u.owner===owner)u.path=[];}}
 aiThink(owner){super.aiThink(owner);this.aiFortify(owner);}
 tick(dt){if(this.paused||this.pending!==null||this.result)return;this._occDirty=true;super.tick(dt);if(this.pending!==null||this.result)return;const d=Math.min(dt,.15);this.repairTick(d);this.towerTick(d);this.siegeTick(d);for(const b of this.buildings)if(b.shotAnim)b.shotAnim=Math.max(0,b.shotAnim-d);}
}
Object.assign(api,{Game,WALLS,SIEGE,wallLine,isWallKind});return api;
});
