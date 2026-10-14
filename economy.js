(function(root,factory){if(typeof module==='object')module.exports=factory(require('./progression.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:BaseGame,U,B,BUILD,TECH,RESOURCE,W,H,dist}=api;
const NODE_NAMES={wood:'Rừng gỗ',stone:'Mỏ đá',gold:'Mỏ vàng',iron:'Mỏ sắt',food:'Ruộng lương'};
U.worker={name:'Dân Phu',cost:{food:40},hp:45,dmg:0,armor:0,arrow:0,range:0,speed:1.65,delay:1,tier:1,building:'hall'};
B.storehouse={name:'Kho Tài Nguyên',hp:350};
BUILD.storehouse={cost:{wood:80,stone:40},seconds:14,description:'Điểm nộp hàng gần mỏ. Dân phu phải mang hàng tới kho, nhà dân hoặc nhà chính mới tăng tài nguyên.'};
BUILD.house.description='Mỗi Nhà Dân cho 10 dân số (tính cả lính); tuyển Dân Phu, nhận hàng và phân công thợ ở gần tới rừng/mỏ. Muốn tăng giới hạn quân phải xây thêm nhà mới. Không tự tạo tài nguyên.';
BUILD.farm.description='Ruộng hữu hạn 1.000/1.500/2.000 Lương theo cấp. Cần Dân Phu làm ruộng rồi chở lương về kho.';
TECH.logistics.description='+10% tốc độ khai thác mỗi bậc, không tự cộng tài nguyên.';
class Game extends BaseGame {
 constructor(){super();this.manualEconomy=true;this.nodes=[];this.deliveries=[];this.delivered=Object.fromEntries(RESOURCE.map(k=>[k,0]));this.addBuilding('house',3,35,0);this.addBuilding('farm',6,38,0);
  // Dense forests with individually exhaustible trees; mineral nodes retain a depleted marker.
  for(const [cx,cy,lord] of [[3,24,0],[14,26,0],[30,26,2],[43,31,3],[11,3,5],[33,12,7]])for(let dy=0;dy<2;dy++)for(let dx=0;dx<3;dx++)this.addNode('wood',cx+dx+.5,cy+dy+.5,160,lord);
  for(const[k,x,y,amount,lord]of [['stone',13,29,1400,0],['gold',3,30,1000,0],['iron',14,32,1000,0],['stone',24,36,1600,1],['gold',29,35,1400,2],['iron',40,34,1400,3],['stone',11,11,1400,5],['gold',31,10,1400,7],['iron',45,12,1400,8]])this.addNode(k,x+.5,y+.5,amount,lord);
  // Turn the existing scattered tree tiles into real resource sources as well.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(this.tile(x,y)===6&&!this.nodes.some(n=>Math.floor(n.x)===x&&Math.floor(n.y)===y)&&!this.buildings.some(b=>b.hp>0&&Math.abs(b.x-(x+.5))<1.5&&Math.abs(b.y-(y+.5))<1.5))this.addNode('wood',x+.5,y+.5,120,0);
  this.syncFarms();for(const [x,y]of [[2.5,32.5],[3.5,32.5],[2.5,33.5],[3.5,33.5]])this.spawn('worker',x,y,0);
 }
 addNode(kind,x,y,amount,lord=0){if([3,4,7].includes(this.tile(x,y))||this.buildings.some(b=>b.hp>0&&Math.abs(b.x-x)<1.1&&Math.abs(b.y-y)<1.1))return null;const n={id:this.nextId++,entity:'resource',kind,x,y,amount,maxAmount:amount,lord};this.nodes.push(n);if(kind==='wood')this.map[Math.floor(y)*W+Math.floor(x)]=6;return n;}
 node(id){return this.nodes.find(n=>n.id===id);}
 syncFarms(){for(const b of this.buildings)if(b.kind==='farm'&&b.owner===0&&this.ready(b)){let n=this.nodes.find(n=>n.farm===b.id);if(!n){n={id:this.nextId++,entity:'resource',kind:'food',x:b.x,y:b.y,amount:1000,maxAmount:1000,lord:0,farm:b.id,tier:1};this.nodes.push(n);}if(b.tier>n.tier){const extra=(b.tier-n.tier)*500;n.amount+=extra;n.maxAmount+=extra;n.tier=b.tier;}}}
 nodeActive(n){return n&&n.amount>1e-7&&(!n.farm||this.buildings.some(b=>b.id===n.farm&&b.owner===0&&this.ready(b)));}
 blocked(x,y,kind,ignore){if(super.blocked(x,y,kind,ignore))return true;return !!this.nodes?.some(n=>!n.farm&&n.amount>1e-7&&Math.floor(n.x)===x&&Math.floor(n.y)===y);}
 buildError(kind,p){const error=super.buildError(kind,p);if(error)return error;if(p&&this.nodes.some(n=>!n.farm&&n.amount>0&&Math.abs(n.x-p.x)<1.5&&Math.abs(n.y-p.y)<1.5))return 'Không xây chồng lên rừng/mỏ chưa khai thác';return '';}
 income(){const r=Object.fromEntries(RESOURCE.map(k=>[k,0]));for(const d of this.deliveries||[])if(d.time>this.time-30)r[d.kind]+=d.amount/30;return r;}
 capacity(){return 20;}
 reachableApproach(u,target){const r=target.entity==='building'||target.farm?2:1,candidates=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){let p={x:Math.floor(target.x)+dx+.5,y:Math.floor(target.y)+dy+.5};if(this.blocked(Math.floor(p.x),Math.floor(p.y),'worker')||dist(p,target)>(r===2?2.3:1.55))continue;candidates.push(p);}candidates.sort((a,b)=>dist(u,a)-dist(u,b));for(const p of candidates){if(dist(u,p)<.1)return {point:p,path:[]};const route=this.path('worker',u,p);if(route.length)return {point:p,path:route};}return null;}
 pickSource(u,kind,exclude=null){const choices=this.nodes.filter(n=>n.id!==exclude&&n.kind===kind&&this.nodeActive(n)).sort((a,b)=>dist(u,a)-dist(u,b));for(const n of choices)if(this.reachableApproach(u,n))return n;return null;}
 assign(ids,nodeId){const n=this.node(nodeId);if(!this.nodeActive(n)){this.say('Nguồn tài nguyên đã cạn hoặc ruộng chưa hoạt động.');return false;}let count=0;for(const u of this.units)if(ids.includes(u.id)&&u.hp>0&&u.owner===0&&u.kind==='worker'&&!u.embarked){if(!this.reachableApproach(u,n)){this.say('Dân phu không tìm được đường tới '+NODE_NAMES[n.kind]);continue;}u.target=null;u.path=[];u.work={node:n.id,kind:n.kind,phase:u.load?.amount>0?'deposit':'travel',retry:0};count++;}if(count)this.say(count+' dân phu được giao '+NODE_NAMES[n.kind]);else this.say('Chọn Dân Phu để giao khai thác.');return count>0;}
 assignNear(b,kind){const workers=this.units.filter(u=>u.hp>0&&u.owner===0&&u.kind==='worker'&&!u.embarked&&dist(u,b)<=10);let count=0;for(const u of workers){const n=this.pickSource(u,kind);if(n&&this.assign([u.id],n.id))count++;}this.say(count?'Đã phân công '+count+' dân phu tới '+NODE_NAMES[kind]:'Không có thợ trong 10 ô hoặc nguồn tài nguyên tiếp cận được.');return count;}
 stopWorkers(ids){for(const u of this.units)if(ids.includes(u.id)&&u.kind==='worker'){u.work=null;u.path=[];u.target=null;u.moving=false;}}
 returnCargo(ids){for(const u of this.units)if(ids.includes(u.id)&&u.kind==='worker'&&u.hp>0&&!u.embarked&&u.load?.amount>0){u.work={node:null,kind:u.load.kind,phase:'deposit',retry:0};u.path=[];u.target=null;}}
 order(ids,point,targetId=null,attackMove=false){this.stopWorkers(ids);return super.order(ids,point,targetId,attackMove);}
 unload(boat){super.unload(boat);for(const u of this.units)if(u.kind==='worker'&&!u.embarked&&u.work){u.path=[];u.work.retry=0;u.work.phase=u.load?.amount>0?'deposit':'travel';}}
 nearestDepot(u){const depots=this.buildings.filter(b=>b.owner===u.owner&&this.ready(b)&&['hall','house','storehouse'].includes(b.kind)).sort((a,b)=>dist(u,a)-dist(u,b));for(const b of depots){const approach=this.reachableApproach(u,b);if(approach)return {building:b,...approach};}return null;}
 moveWorker(u,dt){u.moving=false;if(!u.path.length)return true;const p=u.path[0];if(this.blocked(Math.floor(p.x),Math.floor(p.y),'worker',undefined,u.owner)){u.path=[];u.work.retry=0;u.work.point=null;return false;}const d=dist(u,p),t=api.terrainEffect('worker',this.tile(u.x,u.y));const step=U.worker.speed*t.speed*(u.slowUntil>this.time?.5:1)*dt;if(d<=step){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=(p.x-u.x)*step/d;u.y+=(p.y-u.y)*step/d;}u.moving=true;return !u.path.length;}
 workTick(u,dt){const w=u.work;if(!w||u.hp<=0||u.embarked)return;u.moving=false;if(u.stunUntil>this.time)return;w.retry=Math.max(0,(w.retry||0)-dt);
  if(w.phase==='deposit'){
   if(!u.load?.amount){w.phase='travel';u.path=[];w.point=null;return;}
   const depot=this.buildings.find(b=>b.id===w.depot&&b.owner===u.owner&&this.ready(b));
   if(!depot||!w.point){if(w.retry>0)return;const next=this.nearestDepot(u);if(!next){w.retry=2;w.depot=null;u.path=[];return;}w.depot=next.building.id;w.point=next.point;u.path=next.path;}
   if(!this.moveWorker(u,dt)||!w.point||dist(u,w.point)>.15)return;
   const live=this.buildings.find(b=>b.id===w.depot&&b.owner===u.owner&&this.ready(b));if(!live||dist(u,live)>2.3){w.point=null;return;}
   const {kind,amount,value}=u.load;const delivered=value??amount;if(this.creditCargo)this.creditCargo(u,kind,delivered);else{this.stock[kind]+=delivered;this.delivered[kind]+=delivered;this.deliveries.push({kind,amount:delivered,time:this.time});}this.effects.push({type:'delivery',x:live.x,y:live.y,kind,amount:delivered,life:1,max:1});u.load=null;u.path=[];w.point=null;w.depot=null;
   if(!w.node){u.work=null;return;}w.phase='travel';return;
  }
  let n=this.node(w.node);
  if(!this.nodeActive(n)){if(u.load?.amount>0){w.phase='deposit';w.point=null;u.path=[];return;}if(w.retry>0)return;n=this.pickSource(u,w.kind,w.node);if(!n){u.path=[];w.phase='waiting';w.retry=3;return;}w.node=n.id;w.point=null;u.path=[];w.phase='travel';}
  if(!w.point){if(w.retry>0)return;const route=this.reachableApproach(u,n);if(!route){w.phase='waiting';w.retry=3;return;}w.point=route.point;u.path=route.path;w.phase='travel';}
  if(!this.moveWorker(u,dt)||!w.point||dist(u,w.point)>.15)return;
  if(!this.nodeActive(n))return;w.phase='harvest';
  if(u.load&&u.load.kind!==n.kind){w.phase='deposit';w.point=null;return;}
  if(!u.load)u.load={kind:n.kind,amount:0,value:0};const rate=(n.kind==='wood'?3:n.kind==='food'?3.2:2.5)*(1+(u.owner===0?this.tech.logistics||0:0)*.1)*(this.gatherBonus?this.gatherBonus(u,n.kind):1);
  const amount=Math.max(0,Math.min(rate*dt,n.amount,this.capacity(u)-u.load.amount));n.amount=Math.max(0,n.amount-amount);u.load.amount+=amount;u.load.value+=amount*(u.owner===0&&n.lord>0&&this.states[n.lord]==='ally'?.7:1);
  if(n.amount<1e-7){n.amount=0;if(n.kind==='wood')this.map[Math.floor(n.y)*W+Math.floor(n.x)]=0;}
  if(u.load.amount>=this.capacity(u)-1e-7||n.amount===0){w.phase='deposit';w.point=null;u.path=[];}
 }
 tick(dt){if(this.paused||this.pending!==null||this.result)return;super.tick(dt);if(this.pending!==null||this.result)return;this.syncFarms();for(const u of this.units)if(u.kind==='worker'&&u.hp>0&&!u.embarked&&u.work)this.workTick(u,Math.min(dt,.15));this.deliveries=this.deliveries.filter(d=>d.time>this.time-30);}
 resolve(choice){const lord=this.pending,result=super.resolve(choice);if(!result)return result;this.say(choice==='ally'?'Thu phục '+api.LORDS[lord]+': mỏ vùng này giữ lại 30% hàng khai thác; không có thu nhập thụ động.':'Nhận chiến lợi phẩm một lần; 6 dân phu chờ bạn phân công ở Hoa Lư.');if(choice==='fallen'){const h=this.hall();if(h)for(let i=0;i<6;i++){const p=this.findOpen('worker',h,6,true);if(p)this.spawn('worker',p.x,p.y,0);}}return result;}
}
Object.assign(api,{Game,NODE_NAMES});return api;
});
