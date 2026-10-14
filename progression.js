(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game,U,B,RESOURCE,dist}=api;
const BUILD={
 hall:{cost:{},seconds:0,description:'Trung tâm phát triển. Cấp II/III mở cấp tương ứng cho mọi công trình, tăng sức chứa quân.'},
 house:{cost:{wood:70,stone:20},seconds:12,description:'Mỗi Nhà Dân cho 10 dân số (tính cả lính). Muốn tăng giới hạn quân phải xây thêm nhà mới.'},
 barracks:{cost:{wood:120,stone:60},seconds:18,description:'Tuyển dân binh, kích binh, giáp sĩ và chiến tượng. Cấp cao huấn luyện quân mạnh hơn.'},
 range:{cost:{wood:150,stone:80,iron:30},seconds:22,description:'Tuyển nỏ và chế tạo máy bắn đá. Nghiên cứu đầu tên; cần thu phục Đường Lâm để mở nỏ.'},
 dock:{cost:{wood:150,stone:50},seconds:20,description:'Xây trên vùng nước gần bờ. Đóng tàu trinh sát, vận tải và chiến đấu.'},
 command:{cost:{wood:100,stone:60,gold:40},seconds:22,description:'Gọi và tái tuyển danh tướng. Tối đa 2 tướng sống/đang tuyển trên toàn phe.'},
 carpenter:{cost:{wood:100,stone:50},seconds:16,description:'Nghiên cứu hậu cần và thành đá ong. Thu phục Đường Lâm để mở công nghệ đá ong.'},
 forge:{cost:{wood:130,stone:100,iron:40},seconds:24,description:'Nghiên cứu vũ khí và giáp cho toàn quân. Yêu cầu Đại Bản Doanh cấp II.'},
 farm:{cost:{wood:60,stone:20},seconds:12,description:'Ruộng lương hữu hạn. Dân Phu phải canh tác và mang lương về kho.'},
 watchtower:{cost:{wood:120,stone:140,iron:20},seconds:24,description:'Tháp phòng thủ tự bắn quân địch trong 8 ô. Cấp cao tăng sát thương và tốc độ bắn; cần Đại Bản Doanh II.'},
 well:{cost:{wood:40,stone:80},seconds:14,description:'Giếng làng hồi 1/1,5/2 HP mỗi giây cho tối đa 3 bộ binh gần đó sau khi rời giao tranh.'}
};
Object.assign(B,{house:{name:'Nhà Dân',hp:260},forge:{name:'Lò Rèn',hp:550},farm:{name:'Nông Trang',hp:240},watchtower:{name:'Tháp Canh',hp:620},well:{name:'Giếng Làng',hp:320}});
const TECH={
 weapons:{name:'Rèn binh khí',building:'forge',cost:{gold:90,iron:60},seconds:22,max:2,description:'+2 sát thương cận chiến mỗi bậc; áp dụng cả quân đã tuyển.'},
 armor:{name:'Giáp vảy sắt',building:'forge',cost:{gold:80,iron:80},seconds:24,max:2,description:'+1 giáp chém và tên mỗi bậc cho toàn quân.'},
 arrows:{name:'Đầu tên thép',building:'range',cost:{wood:80,iron:60},seconds:20,max:2,description:'+1 sát thương mỗi tia/viên đạn tầm xa mỗi bậc.'},
 divineCrossbow:{name:'Bí pháp Nỏ Thần',building:'range',cost:{wood:220,gold:180,iron:180},seconds:45,max:1,description:'Công nghệ tối hậu của mỗi triều đại. Mở Vệ Nỏ Thần xuyên giáp, công thành; binh đoàn đặc biệt tối đa 6 quân.'},
 logistics:{name:'Hậu cần quân lương',building:'carpenter',cost:{food:120,wood:100,gold:40},seconds:20,max:2,description:'+10% tổng sản lượng tài nguyên mỗi bậc.'},
 drill:{name:'Quân chế tinh nhuệ',building:'barracks',cost:{food:150,gold:80},seconds:24,max:2,description:'Giảm 10% thời gian tuyển mỗi bậc, cộng với thưởng cấp công trình.'},
 laterite:{name:'Thành đá ong',building:'carpenter',cost:{wood:100,stone:120},seconds:25,max:1,description:'Mở xây tường phòng thủ đá ong. Cần thu phục Đường Lâm.'}
};
const TALENTS={command:{name:'Thống lĩnh',max:3,description:'Mỗi điểm: aura +1 ô; Đinh +3% tốc độ, +0,5 hồi HP/s; Trần +5% tốc độ bắn.'},valor:{name:'Dũng lược',max:3,description:'Mỗi điểm: tướng +2 sát thương và +1 giáp chém.'},strategy:{name:'Mưu lược',max:3,description:'Mỗi điểm: kỹ năng chủ động giảm 5 giây hồi chiêu.'}};
const XP=[0,100,250,450,700];
function pop(kind){return U[kind].pop??(U[kind].hero?3:kind==='elephant'?4:['catapult','serpent','transport'].includes(kind)?3:kind==='raft'?0:1);}
function setup(g){if(!g.tech)g.tech={};if(!g.heroRecords)g.heroRecords={};}
Game.prototype.ready=function(b){return !!b&&b.hp>0&&!b.constructing;};
Game.prototype.population=function(){const used=this.units.filter(u=>u.owner===0&&u.hp>0).reduce((n,u)=>n+pop(u.kind),0);const queued=this.buildings.filter(b=>b.owner===0&&b.hp>0).reduce((n,b)=>n+b.queue.reduce((p,k)=>p+pop(k),0),0);const cap=this.buildings.filter(b=>b.owner===0&&this.ready(b)).reduce((n,b)=>n+(b.kind==='hall'?20+(b.tier-1)*10:b.kind==='house'?10:0),0);return {used,queued,cap};};
Game.prototype.upgradeSpec=function(b){return {cost:b.tier===1?{wood:100,stone:100}:{wood:200,stone:220,gold:100,iron:60},seconds:b.tier===1?18:32};};
Game.prototype.upgradeError=function(b){if(!b||b.hp<=0||b.owner!==0)return 'Không sở hữu công trình';if(b.constructing||b.job)return 'Công trình đang thi công/nghiên cứu';if(b.tier>=3)return 'Đã đạt cấp tối đa III';if(b.queue.length)return 'Hoàn tất hoặc hủy hàng chờ trước';if(b.kind!=='hall'&&(!this.hall()||this.hall().tier<=b.tier))return 'Cần Đại Bản Doanh cấp '+(b.tier+1);return this.canPay(this.upgradeSpec(b).cost)?'':'Thiếu tài nguyên';};
Game.prototype.upgrade=function(b){const error=this.upgradeError(b);if(error){this.say(error);return false;}const spec=this.upgradeSpec(b);this.pay(spec.cost);b.job={type:'upgrade',cost:spec.cost,total:spec.seconds,elapsed:0};this.say('Khởi công nâng cấp '+B[b.kind].name);return true;};
Game.prototype.buildError=function(kind,p){const spec=BUILD[kind];if(!spec||kind==='hall')return 'Không thể xây loại công trình này';if(!this.hall()||!this.ready(this.hall()))return 'Cần Đại Bản Doanh';if(['forge','watchtower'].includes(kind)&&this.hall().tier<2)return B[kind].name+' cần Đại Bản Doanh II';if(p){if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return 'Vị trí không hợp lệ';if(!this.buildings.some(b=>b.owner===0&&this.ready(b)&&dist(b,p)<=8))return 'Xây trong 8 ô quanh công trình của bạn';for(let y=Math.floor(p.y)-1;y<=Math.floor(p.y);y++)for(let x=Math.floor(p.x)-1;x<=Math.floor(p.x);x++){const t=this.tile(x,y);if(kind==='dock'?![3,4].includes(t):[3,4,6,7].includes(t))return kind==='dock'?'Thủy Xưởng cần vùng nước trống 2×2':'Cần đất trống 2×2, không rừng/nước/tường';}if(kind==='dock'){let shore=false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if([0,1,2,5].includes(this.tile(p.x+dx,p.y+dy)))shore=true;if(!shore)return 'Thủy Xưởng cần gần bờ';}if(this.buildings.some(b=>b.hp>0&&Math.abs(b.x-p.x)<2.3&&Math.abs(b.y-p.y)<2.3))return 'Quá sát công trình khác';if(this.units.some(u=>u.hp>0&&!u.embarked&&Math.abs(u.x-p.x)<1.4&&Math.abs(u.y-p.y)<1.4))return 'Quân đang chiếm vị trí';}return this.canPay(spec.cost)?'':'Thiếu tài nguyên';};
Game.prototype.build=function(kind,point){const p={x:Math.round(point.x),y:Math.round(point.y)},error=this.buildError(kind,p);if(error){this.say(error);return null;}const s=BUILD[kind];this.pay(s.cost);const b=this.addBuilding(kind,p.x,p.y,0);b.constructing=true;b.hp=b.maxHP*.25;b.job={type:'build',cost:s.cost,total:s.seconds,elapsed:0};b.focus='food';this.units.forEach(u=>u.path=[]);this.say('Đang xây '+B[kind].name);return b;};
Game.prototype.cancelJob=function(b){if(!b||b.owner!==0||b.hp<=0||!b.job)return false;RESOURCE.forEach(k=>this.stock[k]+=(b.job.cost[k]||0)*.75);if(b.job.type==='build'){b.hp=0;this.units.forEach(u=>u.path=[]);}b.job=null;this.say('Đã hủy công việc · hoàn 75% chi phí');return true;};
Game.prototype.researchError=function(b,key){setup(this);const spec=TECH[key];if(!spec||!b||b.hp<=0||b.owner!==0||b.kind!==spec.building)return 'Sai công trình nghiên cứu';if(!this.ready(b)||b.job||b.queue.length)return 'Công trình phải rảnh';const level=this.tech[key]||0;if(level>=spec.max)return 'Đã nghiên cứu tối đa';const requiredTier=key==='laterite'?1:key==='divineCrossbow'?3:level+2;if(b.tier<requiredTier)return 'Cần công trình cấp '+requiredTier;if(key==='laterite'&&!(this.hasUnlock?this.hasUnlock(1):this.states[1]==='ally'))return 'Cần thu phục Đường Lâm';if(key==='divineCrossbow'&&(!this.hall()||this.hall().tier<3))return 'Cần Đại Bản Doanh cấp III';if(key==='divineCrossbow'&&(this.tech.arrows||0)<2)return 'Cần Đầu tên thép II';if(this.buildings.some(v=>v.hp>0&&v.owner===0&&v.job?.key===key))return 'Đang nghiên cứu ở công trình khác';return this.canPay(this.researchCost(key))?'':'Thiếu tài nguyên';};
Game.prototype.researchCost=function(key){setup(this);const level=this.tech[key]||0;return Object.fromEntries(Object.entries(TECH[key].cost).map(([k,v])=>[k,v*(level+1)]));};
Game.prototype.startResearch=function(b,key){const error=this.researchError(b,key);if(error){this.say(error);return false;}const cost=this.researchCost(key);this.pay(cost);b.job={type:'research',key,cost,elapsed:0,total:TECH[key].seconds*(1+(this.tech[key]||0)*.5)};return true;};
Game.prototype.research=function(){return this.startResearch(this.buildings.find(b=>b.owner===0&&b.kind==='carpenter'&&this.ready(b)),'laterite');};
Game.prototype.trainDuration=function(b,kind){setup(this);return (U[kind].hero?20:8+U[kind].tier*4)*(1-(b.tier-1)*.15)*(1-(this.tech.drill||0)*.1);};
const baseTrainError=Game.prototype.trainError;
Game.prototype.trainError=function(b,kind){setup(this);const spec=U[kind];if(!spec)return 'Không có binh chủng này';const error=baseTrainError.call(this,b,kind);if(error)return error;if(spec.requiresTech&&!(this.tech[spec.requiresTech]||0))return 'Cần nghiên cứu '+TECH[spec.requiresTech].name;if(spec.eliteCap){const living=this.units.filter(u=>u.owner===0&&u.hp>0&&u.kind===kind).length,queued=this.buildings.filter(v=>v.owner===0&&v.hp>0).reduce((n,v)=>n+v.queue.filter(k=>k===kind).length,0);if(living+queued>=spec.eliteCap)return 'Binh đoàn đặc biệt tối đa '+spec.eliteCap+' quân';}if(!this.ready(b)||b.job)return 'Công trình đang thi công/nghiên cứu';const p=this.population();if(p.used+p.queued+pop(kind)>p.cap)return 'Thiếu dân số · xây thêm Nhà Dân (mỗi nhà +10)';return '';};
Game.prototype.stats=function(u){setup(this);const s=U[u.kind],hero=s.hero,level=u.level||1,rank=hero?0:(u.rank||1)-1,t=u.talents||{},own=u.owner===0,tech=own?this.tech:{};return {...s,hp:Math.round(s.hp*(1+(hero?(level-1)*.12:rank*.1))),dmg:s.dmg>0?+(s.dmg*(1+(hero?(level-1)*.08:rank*.1))+(s.range>=3?(tech.arrows||0):(tech.weapons||0)*2)+(t.valor||0)*2).toFixed(1):0,armor:s.armor+(tech.armor||0)+(t.valor||0),arrow:s.arrow+(tech.armor||0)};};
Game.prototype.syncStats=function(u){const s=this.stats(u);if(u.maxHP!==s.hp){u.hp=Math.max(1,u.hp+s.hp-u.maxHP);u.maxHP=s.hp;}};
Game.prototype.awardXP=function(u,amount){if(!u||u.hp<=0||!U[u.kind].hero||u.embarked||amount<=0)return;u.xp=(u.xp||0)+amount;u.level=u.level||1;u.points=u.points||0;while(u.level<5&&u.xp>=XP[u.level]){u.level++;u.points++;this.syncStats(u);this.say(U[u.kind].name+' đạt cấp '+u.level+' · +1 điểm thiên phú');}};
Game.prototype.learn=function(u,key){const talent=TALENTS[key];if(!talent||!u||u.hp<=0||u.owner!==0||!U[u.kind].hero||!(u.points>0))return false;u.talents=u.talents||{};if((u.talents[key]||0)>=talent.max)return false;u.talents[key]=(u.talents[key]||0)+1;u.points--;return true;};
Game.prototype.auraPower=function(u,kind){const heroes=this.units.filter(v=>v.hp>0&&!v.embarked&&v.owner===u.owner&&v.kind===kind&&dist(u,v)<=6+(v.talents?.command||0));return heroes.length?Math.max(...heroes.map(v=>v.talents?.command||0)):-1;};
Game.prototype.aura=function(u,kind){return this.auraPower(u,kind)>=0;};
Game.prototype.combatDamage=function(u,target){const a=this.stats(u);let mult=1;if(u.kind==='pike'&&target.kind==='elephant')mult=2.5;if(u.kind==='crossbow'&&this.tile(u.x,u.y)===5)mult*=1.15;if(target.entity==='building')return a.dmg*(u.kind==='catapult'||u.kind==='elephant'&&this.tile(u.x,u.y)!==1?2:1)*(a.siegeBonus||1);const d=this.stats(target),defense=a.range>=3?Math.max(0,d.arrow-(a.armorPierce||0)):d.armor+(target.armorUntil>this.time?4:0);return Math.max(1,a.dmg*mult-defense)*(a.shots||1);};
const baseSpawn=Game.prototype.spawn;
Game.prototype.spawn=function(kind,x,y,owner){setup(this);const u=baseSpawn.call(this,kind,x,y,owner);u.rank=1;u.level=1;u.xp=0;u.points=0;u.talents={command:0,valor:0,strategy:0};if(U[kind].hero&&owner===0&&this.heroRecords[kind]){Object.assign(u,JSON.parse(JSON.stringify(this.heroRecords[kind])));u.skill=30;this.syncStats(u);}return u;};
const baseHit=Game.prototype.hit;
Game.prototype.hit=function(target,amount,source){const alive=target.hp>0;baseHit.call(this,target,amount,source);if(!alive||target.hp>0)return;setup(this);if(U[target.kind]?.hero&&target.owner===0)this.heroRecords[target.kind]={level:target.level,xp:target.xp,points:target.points,talents:{...target.talents}};if(!source||source.owner===target.owner)return;const heroes=this.units.filter(u=>u.hp>0&&!u.embarked&&U[u.kind].hero&&u.owner===source.owner&&dist(u,target)<=8);for(const h of heroes)this.awardXP(h,(target.entity==='building'?120:40)/Math.max(1,heroes.length));};
const baseSkill=Game.prototype.skill;
Game.prototype.skill=function(u){if(u?.embarked)return false;const success=baseSkill.call(this,u);if(success)u.skill=Math.max(10,u.skill-(u.talents?.strategy||0)*5);return success;};
const baseTick=Game.prototype.tick;
Game.prototype.tick=function(dt){if(this.paused||this.pending!==null||this.result)return;setup(this);dt=Math.min(dt,.15);
 for(const b of this.buildings){if(b.hp<=0||!b.job)continue;const j=b.job;
  // Công trình của người chơi chỉ tăng tiến độ khi Dân Phu đứng cạnh và thi công.
  // AI vẫn dùng tiến độ tự động để các thế lực đối địch tiếp tục phát triển độc lập.
  if(!(j.type==='build'&&b.owner===0))j.elapsed+=dt;
  if(j.elapsed<j.total)continue;b.job=null;if(j.type==='build'){b.constructing=false;b.hp=Math.min(b.maxHP,b.hp+b.maxHP*.75);if(b.owner===0)this.say(B[b.kind].name+' đã hoàn thành');}else if(j.type==='upgrade'){b.tier++;b.maxHP+=Math.round(B[b.kind].hp*.35);b.hp+=Math.round(B[b.kind].hp*.35);if(b.owner===0)this.say(B[b.kind].name+' đạt cấp '+b.tier);}else{this.tech[j.key]=(this.tech[j.key]||0)+1;if(j.key==='laterite')this.laterite=true;if(b.owner===0)this.say('Hoàn tất '+TECH[j.key].name);}}
 for(const u of this.units)if(u.hp>0)this.syncStats(u);
 baseTick.call(this,dt);
 if(this.manualEconomy)return;
 // Apply bonus to income only, not refunds or other stock changes inside the simulation.
 const allies=this.states.filter(s=>s==='ally').length,fallen=this.states.filter(s=>s==='fallen').length;
 const base={food:5+allies*2.8,wood:3+allies*1.4,stone:2+allies*.7+fallen*1.5,gold:1.5+allies*.7,iron:1+allies*.35};
 for(const b of this.buildings)if(b.owner===0&&this.ready(b)){if(b.kind==='farm')base.food+=b.tier+1;if(b.kind==='house')base[b.focus||'food']+=b.tier*.6;}
 const original={food:5+allies*2.8,wood:3+allies*1.4,stone:2+allies*.7+fallen*1.5,gold:1.5+allies*.7,iron:1+allies*.35};
 RESOURCE.forEach(k=>this.stock[k]+=(base[k]*(1+(this.tech.logistics||0)*.1)-original[k])*dt);
};
Game.prototype.income=function(){setup(this);let a=this.states.filter(s=>s==='ally').length,f=this.states.filter(s=>s==='fallen').length;const r={food:5+a*2.8,wood:3+a*1.4,stone:2+a*.7+f*1.5,gold:1.5+a*.7,iron:1+a*.35};for(const b of this.buildings)if(b.owner===0&&this.ready(b)){if(b.kind==='farm')r.food+=b.tier+1;if(b.kind==='house')r[b.focus||'food']+=b.tier*.6;}RESOURCE.forEach(k=>r[k]*=1+(this.tech.logistics||0)*.1);return r;};
Object.assign(api,{BUILD,TECH,TALENTS,XP,pop});return api;
});
