// Loạn 12 Sứ Quân — thủy quân: thuyền chài đánh cá, thuyền vận binh (đón/đổ quân), thuyền cung, thuyền húc, soái hạm.
// AI dựng Thủy Xưởng và đóng thuyền khi bản đồ có nước. Trần Lãm (Bố Hải) đóng thuyền rẻ hơn 15%.
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./walls.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:Base,U,B,BUILD,RESOURCE,W,H,dist}=api;
Object.assign(U,{
 fishingBoat:{name:'Thuyền Chài',cost:{wood:60},hp:90,dmg:0,armor:0,arrow:1,range:0,speed:1.5,delay:1,tier:1,building:'dock',naval:true,pop:1,fisher:true},
 archerBoat:{name:'Thuyền Cung Thủ',cost:{wood:70,gold:20},hp:140,dmg:6,shots:2,armor:0,arrow:2,range:5.5,speed:1.9,delay:1.9,tier:1,building:'dock',naval:true,pop:2},
 ramBoat:{name:'Thuyền Húc Mũi Sắt',cost:{wood:90,iron:30},hp:260,dmg:20,armor:3,arrow:2,range:1,speed:1.7,delay:2.2,tier:2,building:'dock',naval:true,pop:3,ram:true},
 flagship:{name:'Soái Hạm Rồng',cost:{wood:260,gold:120,iron:90},hp:700,dmg:15,shots:2,armor:5,arrow:7,range:7.5,speed:1,delay:2.6,tier:3,building:'dock',naval:true,splash:.6,pop:6,command:true}
});
const SHIP_INFO={scout:'Trinh sát nhanh, không đánh.',fishingBoat:'Đánh cá ở bãi cá (vùng nước có cá), chở 30 Lương về Thủy Xưởng.',transport:'Chở 6 bộ binh. Chọn quân rồi chuột phải lên thuyền để lên; chọn thuyền rồi chuột phải lên bờ để đổ quân.',archerBoat:'Nhanh, bắn 2 tên tầm 5,5; giỏi quấy rối thuyền nhỏ và quân trên bờ.',ramBoat:'Mũi sắt húc thuyền địch ×2,2 sát thương; phá tường ven sông ×3.',serpent:'Chiến thuyền tầm xa cân bằng.',fireboat:'Ném hũ lửa đánh lan.',warbarge:'Chở 10 quân, giáp dày.',towerShip:'Lâu thuyền nhiều tầng, tầm 8,5.',flagship:'Soái hạm: thuyền mình trong 7 ô +15% sát thương.'};
const NAVAL_FISH=450;
class Game extends Base{
 constructor(...args){super(...args);this.spawnFish();}
 spawnFish(){if(!this.nodes)return;const fish=[];for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(this.map[y*W+x]!==4)continue;let deep=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if([3,4].includes(this.map[(y+dy)*W+x+dx]))deep++;if(deep<9||(x*7+y*13)%17!==0)continue;const p={x:x+.5,y:y+.5};if(fish.some(f=>dist(f,p)<7)||this.buildings.some(b=>dist(b,p)<3))continue;fish.push(p);}
  for(const p of fish.slice(0,24))this.nodes.push({id:this.nextId++,entity:'resource',kind:'food',fish:true,x:p.x,y:p.y,amount:NAVAL_FISH,maxAmount:NAVAL_FISH,lord:0});this._occDirty=true;}
 shipInfo(kind){return SHIP_INFO[kind]||'';}
 cargoCapacity(boat){return U[boat?.kind]?.cargoCapacity||(boat?.kind==='transport'?6:0);}
 // Trần Lãm: thuyền rẻ hơn 15%.
 unitCost(owner,kind){const c=U[kind].cost;if(U[kind].naval&&this.faction&&this.faction(owner)?.id===3){const o={};for(const k of Object.keys(c))o[k]=Math.round(c[k]*.85);return o;}return c;}
 trainError(b,kind){const e=super.trainError(b,kind);if(e==='Thiếu tài nguyên'&&U[kind]?.naval&&this.canPay(this.unitCost(0,kind)))return '';return e;}
 train(b,kind){if(!U[kind]?.naval||this.unitCost(0,kind)===U[kind].cost)return super.train(b,kind);const error=this.trainError(b,kind);if(error){this.say(error);return false;}this.pay(this.unitCost(0,kind));b.queue.push(kind);this.say('Đang đóng '+U[kind].name+' (Bố Hải −15%)');return true;}
 cancel(b){const kind=b.queue[0];if(kind&&U[kind]?.naval&&this.unitCost(b.owner,kind)!==U[kind].cost&&b.owner===0){b.queue.shift();const c=this.unitCost(0,kind);RESOURCE.forEach(k=>this.stock[k]+=c[k]||0);b.progress=0;return;}return super.cancel(b);}
 combatDamage(u,target){let d=super.combatDamage(u,target);if(target.entity==='unit'&&U[u.kind]?.ram&&U[target.kind]?.naval){const s=this.stats(u),t=this.stats(target);d=Math.max(d,s.dmg*2.2-t.armor);}
  if(U[u.kind]?.naval&&this.units.some(v=>v.hp>0&&v!==u&&v.owner===u.owner&&U[v.kind].command&&dist(u,v)<=7))d*=1.15;return d;}
 // ---------- fishing ----------
 fish(ids,nodeId){const n=this.node(nodeId);if(!n||!n.fish||!(n.amount>0)){this.say('Không có bãi cá');return 0;}let c=0;for(const u of this.units)if(ids.includes(u.id)&&u.hp>0&&U[u.kind].fisher){u.target=null;u.path=[];u.fishing={node:n.id,phase:'travel',retry:0};c++;}if(c&&ids.length)this.say(c+' thuyền chài ra bãi cá');return c;}
 fishSpot(u,n){const pts=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=Math.floor(n.x)+dx,y=Math.floor(n.y)+dy;if(!this.blocked(x,y,u.kind,undefined,u.owner))pts.push({x:x+.5,y:y+.5});}pts.sort((a,b)=>dist(u,a)-dist(u,b));for(const p of pts){if(dist(u,p)<.2)return{point:p,path:[]};const r=this.path(u.kind,u,p);if(r.length)return{point:p,path:r};}return null;}
 fishTick(dt){for(const u of this.units){const f=u.fishing;if(!f||u.hp<=0||!U[u.kind].fisher)continue;f.retry=Math.max(0,(f.retry||0)-dt);
   if(f.phase==='return'){const dock=this.buildings.filter(b=>b.owner===u.owner&&b.kind==='dock'&&this.ready(b)).sort((a,b)=>dist(u,a)-dist(u,b))[0];if(!dock){f.phase='wait';continue;}
    if(dist(u,dock)<=2.4){const amt=u.load?.amount||0;if(amt>0){if(this.creditCargo)this.creditCargo(u,'food',amt);else this.stock.food+=amt;this.effects.push({type:'delivery',x:dock.x,y:dock.y,kind:'food',amount:amt,life:1,max:1});}u.load=null;u.path=[];f.phase='travel';f.point=null;continue;}
    if(!u.path.length&&f.retry<=0){f.retry=1.5;const p=this.findOpen(u.kind,dock,3);u.path=p?this.path(u.kind,u,p):[];}continue;}
   let n=this.node(f.node);if(!n||!(n.amount>0)){if(u.load?.amount>0){f.phase='return';continue;}const next=this.nodes.filter(v=>v.fish&&v.amount>0).sort((a,b)=>dist(u,a)-dist(u,b))[0];if(!next){u.fishing=null;continue;}f.node=next.id;f.point=null;n=next;}
   if(f.phase==='travel'||f.phase==='wait'){if(!f.point){if(f.retry>0)continue;const r=this.fishSpot(u,n);if(!r){f.retry=3;f.phase='wait';continue;}f.point=r.point;u.path=r.path;f.phase='travel';}if(u.path.length||dist(u,f.point)>.3){if(!u.path.length&&f.retry<=0){f.retry=2;f.point=null;}continue;}f.phase='fish';}
   if(f.phase==='fish'){u.angle=Math.atan2(n.y-u.y,n.x-u.x);if(!u.load)u.load={kind:'food',amount:0};const amt=Math.min(2.6*dt,n.amount,30-u.load.amount);n.amount-=amt;u.load.amount+=amt;if(n.amount<=1e-7){n.amount=0;this._occDirty=true;}if(u.load.amount>=30-1e-7||n.amount<=0){f.phase='return';u.path=[];}}}}
 // ---------- boarding / unloading transports ----------
 board(ids,boatId){const boat=this.units.find(v=>v.id===boatId&&v.hp>0);const cap=this.cargoCapacity(boat);if(!boat||!cap){this.say('Chọn thuyền chở quân');return 0;}let n=0;for(const u of this.units)if(ids.includes(u.id)&&u.hp>0&&!u.embarked&&u.owner===boat.owner&&!U[u.kind].naval&&!['elephant','armoredElephant','catapult'].includes(u.kind)){if(boat.cargo.length+n>=cap)break;u.work=null;u.repair=null;u.target=null;u.attackMove=false;u.destination=null;u.boarding=boat.id;u.boardRetry=0;u.path=[];n++;}
  this.say(n?n+' quân đang xuống thuyền '+U[boat.kind].name:'Thuyền đã đầy hoặc không có bộ binh phù hợp');return n;}
 boardSpot(u,boat){const c=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=Math.floor(boat.x)+dx,y=Math.floor(boat.y)+dy,p={x:x+.5,y:y+.5};if(dist(p,boat)>2.2||this.blocked(x,y,u.kind,undefined,u.owner))continue;c.push(p);}
  c.sort((a,z)=>dist(u,a)-dist(u,z));for(const p of c.slice(0,8)){if(dist(u,p)<.15)return {point:p,path:[]};const route=this.path(u.kind,u,p);if(route.length&&route.length<dist(u,p)*2.2+6)return {point:p,path:route};}return null;}
 embark(u,boat){if(boat.cargo.length>=this.cargoCapacity(boat))return false;u.embarked=boat.id;u.boarding=null;u.path=[];u.target=null;boat.cargo.push(u.id);return true;}
 shoreSpot(boat,point){let best=null;for(let r=0;r<=5&&!best;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=Math.floor(point.x)+dx,y=Math.floor(point.y)+dy;if(this.blocked(x,y,boat.kind,undefined,boat.owner))continue;let land=false;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(!this.blocked(x+i,y+j,'militia')&&![3,4].includes(this.tile(x+i,y+j)))land=true;if(!land)continue;const p={x:x+.5,y:y+.5},d=dist(p,point);if(!best||d<best.d)best={...p,d};}return best;}
 unloadAt(boat,point){if(!boat||boat.hp<=0||!boat.cargo?.length){this.say('Thuyền chưa chở quân');return false;}const spot=this.shoreSpot(boat,point);if(!spot){this.say('Không tìm được bến gần điểm đổ quân');return false;}boat.unloadAt={x:point.x,y:point.y,spot:{x:spot.x,y:spot.y}};boat.target=null;boat.path=dist(boat,spot)<.3?[]:this.path(boat.kind,boat,spot);if(!boat.path.length&&dist(boat,spot)>1.5){boat.unloadAt=null;this.say('Thuyền không tới được bờ đó');return false;}this.say('Thuyền đang chở quân tới bờ');return true;}
 unload(boat){const ids=[...(boat.cargo||[])];super.unload(boat);const landed=ids.filter(id=>!boat.cargo.includes(id));for(const id of landed){const u=this.units.find(v=>v.id===id);if(u){u.boarding=null;}}return landed;}
 navalTick(dt){for(const u of this.units){if(!u.boarding||u.hp<=0||u.embarked)continue;const boat=this.units.find(v=>v.id===u.boarding&&v.hp>0);if(!boat||boat.cargo.length>=this.cargoCapacity(boat)){u.boarding=null;continue;}
   if(dist(u,boat)<=2.3){this.embark(u,boat);if(u.owner===0&&boat.cargo.length>=this.cargoCapacity(boat))this.say(U[boat.kind].name+' đã đầy quân');continue;}
   if(!u.path.length){u.boardRetry=(u.boardRetry||0)-dt;if(u.boardRetry<=0){u.boardRetry=1.2;const r=this.boardSpot(u,boat);if(r)u.path=r.path.length?r.path:[r.point];else{u.boardFail=(u.boardFail||0)+1;if(!boat.path.length&&!boat.unloadAt&&!boat.target){const sp=this.shoreSpot(boat,u);if(sp&&dist(sp,boat)>.5)boat.path=this.path(boat.kind,boat,sp);}if(u.boardFail>8){u.boarding=null;u.boardFail=0;if(u.owner===0)this.say('Quân không tới được thuyền');}}}}}
  for(const b of this.units){if(!b.unloadAt||b.hp<=0)continue;const s=b.unloadAt.spot;if(b.path.length&&dist(b,s)>1.2)continue;if(dist(b,s)>1.6){b.path=this.path(b.kind,b,s);if(!b.path.length)b.unloadAt=null;continue;}
   const goal={x:b.unloadAt.x,y:b.unloadAt.y};b.path=[];const landed=this.unload(b);b.unloadAt=null;if(landed.length&&b.owner===0){const ids=landed.filter(id=>this.entity(id));if(ids.length)super.order.call(this,ids,goal,null,false);}}}
 order(ids,point,targetId=null,attackMove=false){for(const u of this.units)if(ids.includes(u.id)){u.boarding=null;u.unloadAt=null;if(U[u.kind]?.fisher)u.fishing=null;}return super.order(ids,point,targetId,attackMove);}
 stop(ids,hold=false){for(const u of this.units)if(ids.includes(u.id)){u.boarding=null;u.unloadAt=null;if(U[u.kind]?.fisher)u.fishing=null;}return super.stop(ids,hold);}
 // ---------- AI navy ----------
 aiHasWater(owner){const h=this.buildings.find(b=>b.owner===owner&&b.kind==='hall'&&b.hp>0);return !!(h&&this.aiDockPlot(owner));}
 aiUnit(owner,building,tier){if(building!=='dock')return super.aiUnit(owner,building,tier);const ships=this.units.filter(u=>u.hp>0&&u.owner===owner&&U[u.kind].naval&&u.kind!=='raft'),fishers=ships.filter(u=>U[u.kind].fisher).length,war=ships.filter(u=>U[u.kind].dmg>0).length;const dock=this.buildings.find(b=>b.owner===owner&&b.kind==='dock'&&b.hp>0);
  if(fishers<2&&dock&&this.nodes.some(n=>n.fish&&n.amount>0&&dist(n,dock)<22))return 'fishingBoat';if(war>=5)return null;const f=this.faction(owner).id;
  if(tier>=3&&!ships.some(u=>u.kind==='flagship'))return 'flagship';if(tier>=2)return ['ramBoat','archerBoat',f===3?'fireboat':'serpent'][war%3];return 'archerBoat';}
 aiNavy(owner){const a=this.ai?.[owner];if(!a||this.states[owner]!=='enemy')return;const bs=this.buildings.filter(b=>b.hp>0&&b.owner===owner),h=bs.find(b=>b.kind==='hall');if(!h)return;
  if(!bs.some(b=>b.kind==='dock')&&!bs.some(b=>b.constructing)&&this.time>(this.faction(owner).id===3?60:200)&&bs.some(b=>b.kind==='barracks')&&this.aiHasWater(owner)){if(this.aiBuild(owner,'dock'))a.status='Dựng Thủy Xưởng';}
  const ships=this.units.filter(u=>u.hp>0&&u.owner===owner&&U[u.kind].naval);const dock=bs.find(b=>b.kind==='dock');
  for(const s of ships){if(U[s.kind].fisher){if(!s.fishing){const n=this.nodes.filter(v=>v.fish&&v.amount>0).sort((x,y)=>dist(s,x)-dist(s,y))[0];if(n)s.fishing={node:n.id,phase:'travel',retry:0};}continue;}
   if(!(U[s.kind].dmg>0))continue;const t=this.entity(s.target);if(t&&(U[t.kind]?.naval||t.kind==='dock'||dist(s,t)<9))continue;
   const home=dock||h,foe=[...this.units.filter(v=>v.hp>0&&!v.embarked&&v.owner===0&&U[v.kind].naval),...this.buildings.filter(b=>b.hp>0&&b.owner===0&&b.kind==='dock')].filter(v=>dist(v,home)<24).sort((x,y)=>dist(s,x)-dist(s,y))[0];
   if(foe){s.target=foe.id;s.repath=0;s.path=[];}else if(t){s.target=null;s.path=[];}}}
 aiThink(owner){super.aiThink(owner);this.aiNavy(owner);}
 tick(dt){if(this.paused||this.pending!==null||this.result)return;super.tick(dt);if(this.pending!==null||this.result)return;const d=Math.min(dt,.15);this.fishTick(d);this.navalTick(d);}
}
Object.assign(api,{Game,SHIP_INFO});return api;
});
