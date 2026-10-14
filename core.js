(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Loan12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REF_W=84,REF_H=60,SIZES={standard:{w:84,h:60,name:'Tiêu chuẩn'},large:{w:105,h:75,name:'Lớn'},huge:{w:126,h:90,name:'Rất lớn'},epic:{w:188,h:134,name:'Sử thi · 5x'}};
const MAP_SIZE=(()=>{try{const v=typeof globalThis!=='undefined'?globalThis.LOAN12_MAP_SIZE:null;return v&&SIZES[v]?v:'standard';}catch(e){return 'standard';}})();
const W=SIZES[MAP_SIZE].w,H=SIZES[MAP_SIZE].h,RESOURCE=['food','wood','stone','gold','iron'];
const LORDS=['Hoa Lư','Đường Lâm','Kiều Thuận','Bố Hải Khẩu','Kiều Công Hãn','Đỗ Cảnh Thạc','Nguyễn Khoan','Nguyễn Thủ Tiệp','Nguyễn Siêu','Lữ Đường','Lý Khuê','Phạm Bạch Hổ'];
const B={hall:{name:'Đại Bản Doanh',hp:800},barracks:{name:'Võ Doanh',hp:500},range:{name:'Trường Bắn & Cơ Khí',hp:450},dock:{name:'Thủy Xưởng',hp:450},command:{name:'Soái Phủ',hp:500},carpenter:{name:'Xưởng Mộc',hp:400}};
const U={
 militia:{name:'Dân Binh Cờ Lau',cost:{food:45},hp:55,dmg:5,armor:0,arrow:0,range:.8,speed:1.45,delay:1.3,tier:1,building:'barracks'},
 pike:{name:'Kích Binh Trường Trận',cost:{food:60,wood:20},hp:90,dmg:9,armor:1,arrow:1,range:1.5,speed:1.15,delay:1.5,tier:1,building:'barracks'},
 guard:{name:'Giáp Sĩ Hoa Lư',cost:{food:75,stone:35},hp:145,dmg:12,armor:3,arrow:4,range:.8,speed:1.05,delay:1.5,tier:2,building:'barracks'},
 crossbow:{name:'Nỏ Thủ Liên Châu',cost:{food:50,wood:45},hp:60,dmg:4,shots:3,armor:0,arrow:1,range:6,speed:1.1,delay:2,tier:2,building:'range',unlock:1},
 divineCrossbow:{name:'Vệ Nỏ Thần',cost:{food:110,wood:90,gold:50,iron:70},hp:110,dmg:11,shots:4,armor:2,arrow:5,range:8,speed:.82,delay:2.8,tier:3,building:'range',pop:3,requiresTech:'divineCrossbow',eliteCap:6,armorPierce:2,siegeBonus:1.35},
 elephant:{name:'Chiến Tượng',cost:{food:180,gold:120},hp:450,dmg:28,armor:4,arrow:2,range:1.2,speed:.9,delay:2.5,tier:2,building:'barracks',unlock:2,splash:1.4},
 serpent:{name:'Thuyền Mãng Xà',cost:{wood:80,gold:40},hp:220,dmg:14,armor:2,arrow:3,range:7,speed:1.6,delay:2,tier:2,building:'dock',naval:true},
 scout:{name:'Thuyền Nan',cost:{wood:40},hp:70,dmg:0,armor:0,arrow:0,range:0,speed:2,delay:1,tier:1,building:'dock',naval:true},
 transport:{name:'Thuyền Mui',cost:{wood:100,gold:20},hp:180,dmg:0,armor:1,arrow:2,range:0,speed:1.2,delay:1,tier:1,building:'dock',naval:true},
 fireboat:{name:'Hỏa Thuyền Hổ',cost:{wood:110,gold:55},hp:165,dmg:20,armor:1,arrow:2,range:6.5,speed:1.75,delay:2.4,tier:2,building:'dock',naval:true,splash:1.2,pop:3,fireShot:true},
 warbarge:{name:'Thuyền Lầu Vận Binh',cost:{wood:150,stone:30,gold:30},hp:300,dmg:0,armor:3,arrow:5,range:0,speed:1.05,delay:1,tier:2,building:'dock',naval:true,cargoCapacity:10,pop:4},
 towerShip:{name:'Chiến Hạm Lâu Thuyền',cost:{wood:220,gold:90,iron:80},hp:430,dmg:13,shots:2,armor:4,arrow:6,range:8.5,speed:1.15,delay:2.8,tier:3,building:'dock',naval:true,splash:.7,pop:5},
 catapult:{name:'Máy Bắn Đá',cost:{wood:100,stone:40,iron:60},hp:120,dmg:35,armor:1,arrow:1,range:9,speed:.7,delay:4,tier:2,building:'range',splash:1.5},
 dinh:{name:'Đinh Bộ Lĩnh',cost:{food:200,gold:150},hp:350,dmg:18,armor:4,arrow:4,range:1,speed:1.4,delay:1.5,tier:2,building:'command',hero:true},
 tran:{name:'Trần Lãm',cost:{food:180,gold:150},hp:300,dmg:12,armor:3,arrow:3,range:5,speed:1.3,delay:1.6,tier:2,building:'command',hero:true,unlock:3},
 lehoan:{name:'Lê Hoàn',cost:{food:220,gold:160},hp:400,dmg:22,armor:5,arrow:4,range:1,speed:1.35,delay:1.6,tier:2,building:'command',hero:true},
 nguyenbac:{name:'Nguyễn Bặc',cost:{food:200,gold:160,iron:40},hp:320,dmg:12,armor:3,arrow:3,range:6,speed:1.3,delay:1.8,tier:2,building:'command',hero:true},
 raft:{name:'Bè Hỏa Công',cost:{},hp:50,dmg:100,armor:0,arrow:0,range:1,speed:2.2,delay:1,tier:1,building:'none',naval:true,splash:1.6}
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function terrainEffect(kind,t){const s=U[kind];return {pass:t!==7&&(s.naval?t===3||t===4:t!==4),speed:t===1?({militia:1,pike:.8,guard:.65,elephant:.5}[kind]||.75):t===3&&!s.naval?.6:1,attack:!(t===3&&!s.naval),hidden:kind==='militia'&&t===2};}
function damage(kind,target,t=0,bonusArmor=0){let a=U[kind],d=U[target];let mult=kind==='pike'&&target==='elephant'?2.5:1;if(kind==='crossbow'&&t===5)mult*=1.15;const defense=a.range>=3?Math.max(0,d.arrow-(a.armorPierce||0)):d.armor+bonusArmor;return Math.max(1,a.dmg*mult-defense)*(a.shots||1);}
class Game{
 constructor(){this.time=0;this.nextId=1;this.units=[];this.buildings=[];this.effects=[];this.selection=[];this.stock={food:1300,wood:1000,stone:650,gold:550,iron:240};this.states=Array(12).fill('enemy');this.states[0]='home';this.pending=null;this.paused=false;this.result=null;this.messages=[];this.laterite=false;this.raidAt=100;this.map=Array(W*H).fill(0);
  for(let y=0;y<REF_H;y++)for(let x=0;x<REF_W;x++){let t=0;const river=18+Math.round(Math.sin(x*.14)*1.5);if(y>=river&&y<=river+3)t=(y===river||y===river+3||x>=24&&x<=27||x>=45&&x<=47)?3:4;else if(x>18&&x<26&&y>25&&y<32)t=1;else if(x>10&&x<17&&y>21&&y<26)t=2;else if(x>36&&x<42&&y>3&&y<15)t=5;else if((x*13+y*19)%71<3&&y<17)t=6;this.map[y*W+x]=t;}
  const home=[['hall',6,32],['barracks',11,33],['range',6,27],['command',10,28],['carpenter',3,28],['dock',8,21.5]];home.forEach(([k,x,y])=>this.addBuilding(k,x,y,0));
  const sites=[[18,34],[33,32],[47,28],[52,35],[6,8],[16,8],[28,7],[48,7],[7,14],[21,14],[51,14]];
  sites.forEach(([x,y],i)=>{this.addBuilding('hall',x,y,i+1);for(let j=0;j<3;j++)this.spawn(i===1?'pike':'militia',x-1+j,y+2,i+1);});
  for(let i=0;i<10;i++)this.spawn(i<6?'militia':'pike',8+i%5*.8,36+Math.floor(i/5)*.8,0);
  this.spawn('dinh',6.7,36,0);this.spawn('scout',11,20.7,0);this.spawn('serpent',44,19,3);
 }
 say(msg){this.messages.push(msg);if(this.messages.length>20)this.messages.shift();}
 tile(x,y){x=Math.floor(x);y=Math.floor(y);return x<0||y<0||x>=W||y>=H?7:this.map[y*W+x];}
 addBuilding(kind,x,y,owner){let b={id:this.nextId++,entity:'building',kind,x,y,owner,hp:owner?380:B[kind].hp,maxHP:owner?380:B[kind].hp,tier:1,queue:[],progress:0};this.buildings.push(b);return b;}
 spawn(kind,x,y,owner){const s=U[kind];let u={id:this.nextId++,entity:'unit',kind,x,y,owner,hp:s.hp,maxHP:s.hp,path:[],target:null,attackMove:false,cooldown:0,skill:0,attackAnim:0,hurtAnim:0,gestureAnim:0,armorUntil:0,lastHit:-100,moving:false,repath:0,slowUntil:0,stunUntil:0,cargo:[]};this.units.push(u);return u;}
 entity(id){return this.units.find(u=>u.id===id&&u.hp>0)||this.buildings.find(b=>b.id===id&&b.hp>0);}
 hostile(a,b){return a.owner!==b.owner&&(a.owner===0||b.owner===0);}
 blocked(x,y,kind,ignore){if(!terrainEffect(kind,this.tile(x,y)).pass)return true;return this.buildings.some(b=>b.hp>0&&b.id!==ignore&&Math.abs(b.x-(x+.5))<1&&Math.abs(b.y-(y+.5))<1);}
 path(kind,from,to){let sx=Math.floor(from.x),sy=Math.floor(from.y),tx=Math.floor(to.x),ty=Math.floor(to.y);if(this.blocked(tx,ty,kind)||sx<0||sy<0||sx>=W||sy>=H)return [];
  const start=sy*W+sx,goal=ty*W+tx,g=Array(W*H).fill(Infinity),prev=new Int32Array(W*H).fill(-1),closed=new Set(),open=[start];g[start]=0;
  while(open.length){let best=0;for(let i=1;i<open.length;i++){const n=open[i],p=open[best];if(g[n]+Math.hypot(n%W-tx,Math.floor(n/W)-ty)<g[p]+Math.hypot(p%W-tx,Math.floor(p/W)-ty))best=i;}const n=open.splice(best,1)[0];if(n===goal){let out=[];for(let p=goal;p!==start;p=prev[p])out.push({x:p%W+.5,y:Math.floor(p/W)+.5});return out.reverse();}closed.add(n);let x=n%W,y=Math.floor(n/W);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||this.blocked(nx,ny,kind))continue;if(dx&&dy&&(this.blocked(x+dx,y,kind)||this.blocked(x,y+dy,kind)))continue;let ni=ny*W+nx;if(closed.has(ni))continue;let cost=g[n]+(dx&&dy?1.414:1)/terrainEffect(kind,this.tile(nx,ny)).speed;if(cost<g[ni]){g[ni]=cost;prev[ni]=n;if(!open.includes(ni))open.push(ni);}}
  }return [];
 }
 findOpen(kind,point,radius=5,dry=false){for(let r=0;r<=radius;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){let x=Math.floor(point.x)+dx,y=Math.floor(point.y)+dy;if(this.blocked(x,y,kind)||dry&&[3,4].includes(this.tile(x,y)))continue;let p={x:x+.5,y:y+.5};if(this.units.some(u=>u.hp>0&&!u.embarked&&dist(u,p)<.5))continue;return p;}return null;}
 canPay(c){return RESOURCE.every(k=>this.stock[k]>=(c[k]||0));}
 pay(c){if(!this.canPay(c))return false;RESOURCE.forEach(k=>this.stock[k]-=c[k]||0);return true;}
 hall(){return this.buildings.find(b=>b.owner===0&&b.kind==='hall'&&b.hp>0);}
 trainError(b,kind){const s=U[kind];if(!b||b.hp<=0||b.owner!==0||s.building!==b.kind)return 'Mất công trình';if(s.unlock&&!(this.hasUnlock?this.hasUnlock(s.unlock):this.states[s.unlock]==='ally'))return 'Cần thu phục '+LORDS[s.unlock];if(b.tier<s.tier)return 'Cần công trình cấp '+s.tier;if(b.queue.length>=5)return 'Hàng chờ đã đầy';if(s.hero){const heroes=this.units.filter(u=>u.owner===0&&u.hp>0&&U[u.kind].hero).map(u=>u.kind).concat(this.buildings.filter(v=>v.hp>0&&v.owner===0).flatMap(v=>v.queue.filter(k=>U[k].hero)));if(heroes.length>=4)return 'Tối đa 4 Danh Tướng';if(heroes.includes(kind))return 'Tướng đã có / đang tuyển';}return this.canPay(s.cost)?'':'Thiếu tài nguyên';}
 train(b,kind){let error=this.trainError(b,kind);if(error){this.say(error);return false;}this.pay(U[kind].cost);b.queue.push(kind);this.say('Đang tuyển '+U[kind].name);return true;}
 cancel(b){if(!b.queue.length)return;let kind=b.queue.shift();RESOURCE.forEach(k=>this.stock[k]+=U[kind].cost[k]||0);b.progress=0;}
 upgrade(b){if(b.owner!==0||b.hp<=0||b.tier>=2)return false;if(b.kind!=='hall'&&(!this.hall()||this.hall().tier<2)){this.say('Nâng Đại Bản Doanh lên cấp 2 trước.');return false;}if(!this.pay({wood:100,stone:100})){this.say('Cần 100 Gỗ và 100 Đá.');return false;}b.tier=2;b.maxHP+=200;b.hp+=200;this.say(B[b.kind].name+' đã lên cấp 2');return true;}
 order(ids,point,targetId=null,attackMove=false){let list=this.units.filter(u=>ids.includes(u.id)&&u.owner===0&&u.hp>0&&!u.embarked);let cols=Math.ceil(Math.sqrt(list.length));list.forEach((u,i)=>{u.target=targetId;u.attackMove=attackMove;u.repath=0;let goal={x:point.x+(i%cols-(cols-1)/2)*.7,y:point.y+Math.floor(i/cols)*.7};if(targetId){u.path=[];return;}let p=this.findOpen(u.kind,goal,3);u.path=p?this.path(u.kind,u,p):[];});this.effects.push({type:'order',x:point.x,y:point.y,life:1,max:1});}
 line(a,b){const n=Math.ceil(dist(a,b)*3);for(let i=1;i<n;i++){let t=this.tile(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n);if(t===6||t===7)return false;}return true;}
 aura(u,kind){return this.units.some(v=>v.hp>0&&!v.embarked&&v.owner===u.owner&&v.kind===kind&&dist(u,v)<=6);}
 hit(target,amount,source){if(target.hp<=0)return;target.hp-=amount;target.lastHit=this.time;if(target.entity==='unit')target.hurtAnim=.24;if(target.hp>0)return;target.hp=0;this.effects.push({type:'fall',x:target.x,y:target.y,life:1,max:1});
  if(target.entity==='building'){while(target.queue.length)this.cancel(target);if(target.kind==='hall'){if(target.owner===0){this.result='defeat';this.say('Đại Bản Doanh Hoa Lư đã thất thủ.');}else if(this.states[target.owner]==='enemy'&&this.pending===null){this.pending=target.owner;this.say(LORDS[target.owner]+' đã thất thủ');}}}
  if(target.cargo)for(let id of target.cargo){let v=this.entity(id);if(v)this.hit(v,99999,source);}
 }
 resolve(choice){let lord=this.pending;if(lord===null||!['ally','fallen'].includes(choice)||this.states[lord]!=='enemy')return false;this.states[lord]=choice;if(choice==='fallen'){this.stock.food+=1000;this.stock.gold+=600;for(let u of this.units)if(u.owner===lord)this.hit(u,99999,null);}else{for(let u of this.units)if(u.owner===lord&&u.hp>0){u.owner=0;u.path=[];u.target=null;}for(let b of this.buildings)if(b.owner===lord&&b.hp>0)b.owner=0;}this.pending=null;if(this.states.every(s=>s!=='enemy'))this.result='victory';this.say(choice==='ally'?'Đã thu phục '+LORDS[lord]+' · nhận 70% sản lượng':'Đã nhận chiến lợi phẩm · 6 phu đá mới');return true;}
 skill(u){if(!u||u.owner!==0||u.hp<=0||u.skill>0)return false;if(u.kind==='dinh'){for(let v of this.units)if(v.owner===0&&v.hp>0&&v.kind==='guard'&&dist(u,v)<=6){v.armorUntil=this.time+10;v.slowUntil=v.stunUntil=0;}u.skill=60;u.gestureAnim=1.15;this.effects.push({type:'aura',x:u.x,y:u.y,life:1.4,max:1.4});this.say('Tiếng Gầm Hang Động · giải khống chế, +4 giáp/10s');return true;}
  if(u.kind==='tran'){let p=this.findOpen('raft',u,6);if(!p){this.say('Trần Lãm cần đứng gần nước.');return false;}let targets=this.units.filter(v=>v.hp>0&&v.owner!==0&&U[v.kind].naval).sort((a,b)=>dist(p,a)-dist(p,b));const target=targets.find(v=>this.path('raft',p,v).length);if(!target){this.say('Không có thuyền địch tiếp cận được.');return false;}let raft=this.spawn('raft',p.x,p.y,0);raft.target=target.id;u.skill=90;u.gestureAnim=1.15;this.say('Bè hỏa công đã xuất phát');return true;}
  if(u.kind==='lehoan'){for(let v of this.units)if(v.owner===0&&v.hp>0&&!v.embarked&&!U[v.kind].naval&&dist(u,v)<=6){v.hasteUntil=this.time+8;v.slowUntil=v.stunUntil=0;}u.skill=60;u.gestureAnim=1.15;this.effects.push({type:'aura',x:u.x,y:u.y,life:1.4,max:1.4});this.say('Trống Xung Trận · quân quanh Lê Hoàn +35% tốc độ trong 8s');return true;}
  if(u.kind==='nguyenbac'){let n=0;for(let v of this.units)if(v.hp>0&&!v.embarked&&this.hostile(u,v)&&dist(u,v)<=5){this.hit(v,30,u);n++;}u.skill=75;u.gestureAnim=1.15;this.effects.push({type:'aura',x:u.x,y:u.y,life:1,max:1});this.say('Mưa Tên Phủ Đầu · '+n+' địch trúng tên');return true;}
  return false;
 }
 load(boat){const capacity=U[boat.kind]?.cargoCapacity||(boat.kind==='transport'?6:0);if(!capacity)return;for(let u of this.units)if(boat.cargo.length<capacity&&u.hp>0&&u.owner===boat.owner&&!u.embarked&&!U[u.kind].naval&&!['elephant','catapult'].includes(u.kind)&&dist(u,boat)<3){u.embarked=boat.id;u.path=[];u.target=null;boat.cargo.push(u.id);}this.say('Thuyền đang chở '+boat.cargo.length+'/'+capacity+' quân');}
 unload(boat){for(let id of [...boat.cargo]){let u=this.entity(id),p=u&&this.findOpen(u.kind,boat,3,true);if(p){u.embarked=null;u.x=p.x;u.y=p.y;boat.cargo=boat.cargo.filter(n=>n!==id);}}this.say(boat.cargo.length?'Cần đến gần bờ trống hơn.':'Đã đổ quân.');}
 research(){if(this.states[1]!=='ally'||this.laterite)return false;if(!this.pay({wood:100,stone:120}))return false;this.laterite=true;this.say('Đã nghiên cứu thành đá ong');return true;}
 wall(){if(!this.laterite)return false;for(let x=2;x<14;x++){if(x===7||x===8||[6,7].includes(this.tile(x,25))||this.nodes?.some(n=>n.amount>0&&Math.floor(n.x)===x&&Math.floor(n.y)===25))continue;if(this.units.some(u=>u.hp>0&&!u.embarked&&dist(u,{x:x+.5,y:25.5})<1))continue;if(!this.pay({wood:20,stone:40}))return false;this.map[25*W+x]=7;this._miniDirty=true;this.units.forEach(u=>u.path=[]);this.say('Đã xây tường đá ong; cổng giữa được chừa trống.');return true;}return false;}
 tick(dt){if(this.paused||this.pending!==null||this.result)return;dt=Math.min(dt,.15);this.time+=dt;let allies=this.states.filter(s=>s==='ally').length,fallen=this.states.filter(s=>s==='fallen').length;let rates={food:5+allies*2.8,wood:3+allies*1.4,stone:2+allies*.7+fallen*1.5,gold:1.5+allies*.7,iron:1+allies*.35};if(!this.manualEconomy)RESOURCE.forEach(k=>this.stock[k]+=rates[k]*dt);
  for(let b of this.buildings){if(b.hp<=0||b.constructing||b.job||!b.queue.length)continue;b.progress+=dt;let kind=b.queue[0],duration=this.trainDuration?this.trainDuration(b,kind):U[kind].hero?14:6+U[kind].tier*2;if(b.progress>=duration){let p=this.findOpen(kind,b,5);if(p){let unit=this.spawn(kind,p.x,p.y,b.owner);if(!U[kind].hero)unit.rank=b.tier;if(this.syncStats)this.syncStats(unit);if(this.onTrained)this.onTrained(unit,b);b.queue.shift();b.progress=0;if(b.owner===0)this.say(U[kind].name+' đã sẵn sàng');}}}
  for(let u of this.units){u.attackAnim=Math.max(0,(u.attackAnim||0)-dt);u.hurtAnim=Math.max(0,(u.hurtAnim||0)-dt);u.gestureAnim=Math.max(0,(u.gestureAnim||0)-dt);if(u.hp<=0||u.embarked||u.kind==='worker'&&u.work)continue;let s=this.stats?this.stats(u):U[u.kind],te=terrainEffect(u.kind,this.tile(u.x,u.y));u.cooldown-=dt;u.skill=Math.max(0,u.skill-dt);u.repath-=dt;u.moving=false;
   const auraRank=this.auraPower?this.auraPower(u,'dinh'):0;
   const buff=['militia','pike','guard'].includes(u.kind)&&this.aura(u,'dinh');if(buff&&this.time-u.lastHit>5)u.hp=Math.min(u.maxHP,u.hp+(2+Math.max(0,auraRank)*.5)*dt);if(u.stunUntil>this.time)continue;
   let target=this.entity(u.target);if(target&&!this.hostile(u,target)){target=null;u.target=null;}
   if(!target&&s.dmg>0&&(!u.path.length||u.attackMove)){target=this.units.filter(v=>v.hp>0&&!v.embarked&&this.hostile(u,v)&&(!terrainEffect(v.kind,this.tile(v.x,v.y)).hidden||dist(u,v)<1.5)&&dist(u,v)<s.range+(u.hold?0:2)&&this.line(u,v)).sort((a,b)=>dist(u,a)-dist(u,b))[0];if(target)u.target=target.id;}
   if(target){const range=s.range+(target.entity==='building'?(target.wall?.8:1.3):0);if(dist(u,target)<=range&&te.attack&&(s.range<3||this.line(u,target))){u.path=[];if(u.cooldown<=0&&s.dmg>0){let amount=this.combatDamage?this.combatDamage(u,target):target.entity==='unit'?damage(u.kind,target.kind,this.tile(u.x,u.y),target.armorUntil>this.time?4:0):s.dmg*(u.kind==='catapult'||u.kind==='elephant'&&this.tile(u.x,u.y)!==1?2:1);u.attackAnim=.38;this.hit(target,amount,u);u.lastHit=this.time;u.cooldown=s.delay/((s.naval&&this.aura(u,'tran'))?1.2+(this.auraPower?Math.max(0,this.auraPower(u,'tran'))*.05:0):1);this.effects.push({type:s.range>=3?'shot':'slash',x:u.x,y:u.y,tx:target.x,ty:target.y,life:.25,max:.25,fire:s.naval,src:u.kind,shots:s.shots||1,target:target.id});if(s.splash)for(let v of this.units)if(v.hp>0&&v!==target&&this.hostile(u,v)&&dist(v,target)<s.splash)this.hit(v,amount*.5,u);if(u.kind==='raft')this.hit(u,99999,u);}}
    else if(!u.hold&&u.repath<=0){u.repath=1.2;let p=this.findOpen(u.kind,target,4);u.path=p?this.path(u.kind,u,p):[];}}
   else u.target=null;
   if(u.path.length){let p=u.path[0],d=dist(u,p);if(this.blocked(Math.floor(p.x),Math.floor(p.y),u.kind,undefined,u.owner)){u.path=[];continue;}let step=s.speed*te.speed*(buff?1.15+Math.max(0,auraRank)*.03:1)*(u.slowUntil>this.time?.5:1)*(u.hasteUntil>this.time?1.35:1)*dt;if(d<=step){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=(p.x-u.x)/d*step;u.y+=(p.y-u.y)/d*step;}u.moving=true;u.angle=Math.atan2(p.y-u.y,p.x-u.x);}
   if(this.pending!==null||this.result)break;
  }
  if(this.time>=this.raidAt){this.raidAt+=90;let enemy=this.buildings.find(b=>b.hp>0&&b.owner>0&&this.states[b.owner]==='enemy');if(enemy&&this.hall()){for(let i=0;i<2;i++){let p=this.findOpen('militia',enemy);if(p){let u=this.spawn('militia',p.x,p.y,enemy.owner);u.target=this.hall().id;}}this.say('Trinh sát báo: quân địch đang tiến về Hoa Lư!');}}
  this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
 }
}
return {Game,U,B,LORDS,RESOURCE,W,H,REF_W,REF_H,SIZES,MAP_SIZE,dist,damage,terrainEffect};
});
