(function(root,factory){if(typeof module==='object')module.exports=factory(require('./economy.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:EconomyGame,U,dist}=api;
const AGES=['Làng Việt','Quân Trấn','Thành Lũy'];
U.scholar={name:'Sĩ Phu',cost:{food:80,gold:50},hp:65,dmg:0,armor:0,arrow:1,range:0,speed:1.15,delay:1,tier:1,building:'command'};
U.archer={name:'Cung Thủ Làng',cost:{food:40,wood:35},hp:45,dmg:6,armor:0,arrow:0,range:5,speed:1.2,delay:1.7,tier:1,building:'range'};
U.swordsman={name:'Đao Binh',cost:{food:65,iron:20},hp:110,dmg:11,armor:2,arrow:1,range:.9,speed:1.2,delay:1.4,tier:2,building:'barracks'};
U.skirmisher={name:'Lính Lao',cost:{food:35,wood:25},hp:65,dmg:5,armor:0,arrow:3,range:4,speed:1.3,delay:1.9,tier:1,building:'barracks'};
class Game extends EconomyGame {
 constructor(){super();this.groups={};this.width=api.W;this.height=api.H;
  // Keep Hoa Lu and the first objective familiar; expand later provinces east and south.
  for(const [lord,x,y]of [[2,34,49],[3,63,30],[4,76,48],[7,48,9],[8,73,9],[11,76,35]]){const b=this.buildings.find(b=>b.owner===lord&&b.kind==='hall'),dx=x-b.x,dy=y-b.y;b.x=x;b.y=y;for(const u of this.units.filter(u=>u.owner===lord&&!U[u.kind].naval)){u.x+=dx;u.y+=dy;}for(let yy=y-2;yy<=y+3;yy++)for(let xx=x-2;xx<=x+3;xx++)this.map[yy*api.W+xx]=0;this.nodes=this.nodes.filter(n=>Math.abs(n.x-x)>3||Math.abs(n.y-y)>3);}
  for(let y=42;y<57;y++)for(let x=18;x<28;x++)this.map[y*api.W+x]=y<47?1:2;
  for(let y=32;y<47;y++)for(let x=65;x<71;x++)this.map[y*api.W+x]=5;
  for(const [x,y,lord]of [[13,44,0],[35,43,2],[48,52,2],[60,35,3],[75,53,4],[63,8,8]]){for(let dy=0;dy<3;dy++)for(let dx=0;dx<4;dx++){const px=x+dx+.5,py=y+dy+.5;if(!this.nodes.some(n=>Math.floor(n.x)===Math.floor(px)&&Math.floor(n.y)===Math.floor(py)))this.addNode('wood',px,py,220,lord);}for(const [k,dx,dy]of [['stone',6,0],['gold',6,3],['iron',0,5]]){const px=x+dx+.5,py=y+dy+.5;if(!this.nodes.some(n=>Math.floor(n.x)===Math.floor(px)&&Math.floor(n.y)===Math.floor(py)))this.addNode(k,px,py,1800,lord);}}
  for(const lord of [2,3,4,7,8,11]){const b=this.buildings.find(b=>b.owner===lord&&b.kind==='hall');for(const [kind,dx]of [['archer',-2],['skirmisher',0],['swordsman',2]]){const p=this.findOpen(kind,{x:b.x+dx,y:b.y+3},4);if(p)this.spawn(kind,p.x,p.y,lord);}}
 }
 stats(u){const s=super.stats(u);return u.kind==='worker'?s:{...s,speed:s.speed*1.35,delay:s.delay*.8};}
 saveGroup(number,ids){if(number<1||number>5)return;this.groups[number]=[...new Set(ids)].filter(id=>{const u=this.entity(id);return u&&u.owner===0;});}
 getGroup(number){return (this.groups[number]||[]).filter(id=>{const u=this.entity(id);return u&&u.owner===0&&!u.embarked;});}
 stop(ids,hold=false){this.stopWorkers(ids);for(const id of ids){const u=this.entity(id);if(u?.entity==='unit'&&u.owner===0){u.target=null;u.path=[];u.attackMove=false;u.destination=null;u.hold=hold;u.moving=false;}}}
 assign(ids,nodeId){const result=super.assign(ids,nodeId);for(const id of ids){const u=this.entity(id);if(u?.kind==='worker'&&u.work){u.hold=false;u.destination=null;}}return result;}
 order(ids,point,targetId=null,attackMove=false){const list=ids.filter(id=>this.entity(id)?.entity==='unit');super.order(list,point,targetId,attackMove);for(const id of list){const u=this.entity(id);if(!u||u.owner!==0)continue;u.hold=false;u.destination=attackMove&&u.kind!=='worker'?{...point}:null;}}
 setRally(b,point,nodeId=null){if(!b||b.owner!==0||b.hp<=0||!Object.values(U).some(u=>u.building===b.kind))return false;if(nodeId&&!this.nodeActive(this.node(nodeId)))return false;b.rally={x:point.x,y:point.y,node:nodeId};this.say('Đã đặt điểm tập kết. Quân mới sẽ nhận lệnh khi ra doanh trại.');return true;}
 onTrained(u,b){if(!b.rally)return;if(u.kind==='worker'&&b.rally.node&&this.nodeActive(this.node(b.rally.node))){this.assign([u.id],b.rally.node);return;}this.order([u.id],b.rally,null,false);}
 tick(dt){if(this.paused||this.pending!==null||this.result)return;
  // Hold-position units are allowed to shoot but never pursue beyond their current range.
  for(const u of this.units)if(u.hold&&u.hp>0){u.path=[];const t=this.entity(u.target);if(t&&dist(u,t)>this.stats(u).range+(t.entity==='building'?1.3:0))u.target=null;}
 super.tick(dt);
  if(this.pending!==null||this.result)return;
  // Defensive and support buildings participate in the battle instead of being cosmetic props.
  for(const b of this.buildings)if(b.hp>0&&!b.constructing&&!b.job){
   if(b.kind==='watchtower'){
    b.cooldown=Math.max(0,(b.cooldown||0)-dt);const range=8+(b.tier-1)*.6,target=this.units.filter(u=>u.hp>0&&!u.embarked&&this.hostile(b,u)&&dist(b,u)<=range&&this.line(b,u)).sort((a,z)=>dist(b,a)-dist(b,z))[0];
    if(target&&b.cooldown<=0){const damage=10+b.tier*4;this.hit(target,damage,b);b.cooldown=Math.max(.85,1.85-(b.tier-1)*.25);this.effects.push({type:'shot',x:b.x,y:b.y-.35,tx:target.x,ty:target.y,life:.3,max:.3,src:'watchtower'});}
   }
   if(b.kind==='well'){
    const rate=.5+b.tier*.5,patients=this.units.filter(u=>u.hp>0&&!u.embarked&&u.owner===b.owner&&!U[u.kind].naval&&u.kind!=='catapult'&&u.hp<u.maxHP&&this.time-u.lastHit>5&&dist(b,u)<=4).sort((a,z)=>a.hp/a.maxHP-z.hp/z.maxHP).slice(0,3);
    for(const u of patients)u.hp=Math.min(u.maxHP,u.hp+rate*dt);
   }
  }
  // A patient receives at most one scholar's healing; no stacking crowds of healers.
  const scholars=this.units.filter(u=>u.kind==='scholar'&&u.hp>0&&!u.embarked&&!u.moving&&u.stunUntil<=this.time);
  for(const s of scholars)s.healing=null;
  const treated=new Set();
  for(const s of scholars){const patient=this.units.filter(u=>u!==s&&u.hp>0&&u.hp<u.maxHP&&u.owner===s.owner&&!u.embarked&&!U[u.kind].naval&&u.kind!=='catapult'&&this.time-u.lastHit>5&&dist(u,s)<=4&&this.line(s,u)&&!treated.has(u.id)).sort((a,b)=>a.hp/a.maxHP-b.hp/b.maxHP)[0];if(patient){patient.hp=Math.min(patient.maxHP,patient.hp+2*Math.min(dt,.15));s.healing=patient.id;treated.add(patient.id);}}
  for(const u of this.units)if(u.hp>0&&!u.embarked&&u.destination&&!u.hold&&!this.entity(u.target)&&!u.path.length){const goal=u.destination;if(dist(u,goal)<1.2){u.destination=null;u.attackMove=false;continue;}const p=this.findOpen(u.kind,goal,3);if(p)u.path=this.path(u.kind,u,p);if(!u.path.length)u.destination=null;}
 }
}
Object.assign(api,{Game,AGES});return api;
});
