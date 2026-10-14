// Loạn 12 Sứ Quân — bản sắc 12 sứ quân: quân độc quyền, đặc tính thứ hai, kỹ năng chủ tướng,
// và tham số tạo hình (quân phục, mũ, khiên, cờ, chủ tướng, thú cưỡi). Gameplay giả tưởng, không phải khẳng định lịch sử.
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./maps.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:Base,U,FACTIONS,dist,RESOURCE}=api;
// ---------- quân độc quyền (unique units) ----------
const UNIQUE={
 reedBanner:{faction:0,art:'militia',name:'Thiếu Niên Cờ Lau',cost:{food:50,wood:10},hp:62,dmg:6,armor:1,arrow:1,range:.8,speed:1.5,delay:1.2,tier:1,building:'barracks',note:'Dân binh tinh nhuệ, nhanh và bền hơn Dân Binh.'},
 lateriteBow:{faction:1,art:'crossbow',name:'Nỏ Thủ Đá Ong',cost:{food:60,wood:45,stone:15},hp:70,dmg:4.2,shots:3,armor:1,arrow:2,range:6,speed:1.05,delay:2,tier:2,building:'range',note:'Nỏ liên châu 3 tia, áo giáp đá ong chịu tên tốt.'},
 armoredElephant:{faction:2,art:'elephant',name:'Tượng Giáp Hồi Hồ',cost:{food:220,gold:140,iron:40},hp:520,dmg:30,armor:6,arrow:4,range:1.2,speed:.85,delay:2.5,tier:3,building:'barracks',splash:1.5,pop:4,note:'Voi khoác giáp mây-đồng, đánh lan, phá nhà ×2; vẫn sợ Kích Binh.'},
 seaRaider:{faction:3,art:'skirmisher',name:'Thủy Binh Bố Hải',cost:{food:45,wood:20},hp:76,dmg:6.5,armor:1,arrow:2,range:3.5,speed:1.4,delay:1.8,tier:1,building:'barracks',note:'Phóng lao tầm 3,5; cùng đặc tính lội sông của phe.'},
 halberdier:{faction:4,art:'pike',name:'Kích Binh Phong Châu',cost:{food:70,wood:25,iron:10},hp:115,dmg:11,armor:2,arrow:2,range:1.6,speed:1.1,delay:1.5,tier:2,building:'barracks',note:'Kích dài, sát thương ×2,5 lên voi chiến.'},
 ironGuard:{faction:5,art:'guard',name:'Thiết Giáp Đỗ Động',cost:{food:85,stone:40,iron:20},hp:175,dmg:12,armor:4,arrow:5,range:.8,speed:.95,delay:1.5,tier:2,building:'barracks',note:'Giáp sắt và khiên lớn, chốt chặn cửa thành.'},
 drillSpear:{faction:6,art:'pike',name:'Thương Binh Quân Chế',cost:{food:50,wood:15},hp:80,dmg:7,armor:1,arrow:2,range:1.2,speed:1.25,delay:1.4,tier:1,building:'barracks',note:'Lính chính quy rẻ, nhanh, huấn luyện đều.'},
 longbow:{faction:7,art:'archer',name:'Cung Thủ Tiên Du',cost:{food:45,wood:45,gold:5},hp:60,dmg:8.5,armor:0,arrow:1,range:6.5,speed:1.2,delay:1.7,tier:2,building:'range',note:'Trường cung tầm 6,5 ô.'},
 greatsword:{faction:8,art:'swordsman',name:'Đại Đao Phù Liệt',cost:{food:75,iron:30},hp:135,dmg:15,armor:2,arrow:1,range:1,speed:1.15,delay:1.6,tier:2,building:'barracks',note:'Đại đao chém mạnh nhất bộ binh.'},
 peasantLevy:{faction:9,art:'militia',name:'Hương Binh Tế Giang',cost:{food:40},hp:55,dmg:5,armor:1,arrow:1,range:.8,speed:1.4,delay:1.3,tier:1,building:'barracks',note:'Hương binh rẻ, chỉ tốn Lương.'},
 escortGuard:{faction:10,art:'skirmisher',name:'Tiêu Binh Siêu Loại',cost:{food:40,wood:20,gold:10},hp:75,dmg:6,armor:1,arrow:3,range:4,speed:1.35,delay:1.9,tier:1,building:'barracks',note:'Hộ tống thương đoàn, lao tầm 4, khiên nhỏ.'},
 tigerGuard:{faction:11,art:'swordsman',name:'Hổ Vệ Đằng Châu',cost:{food:70,gold:15,iron:15},hp:132,dmg:13.5,armor:2,arrow:2,range:.9,speed:1.3,delay:1.4,tier:2,building:'barracks',note:'Cận vệ áo hổ, nhanh và hiểm.'}
};
for(const [k,v] of Object.entries(UNIQUE))U[k]={...v,unique:true};
const UNIQUE_BY_FACTION=Object.keys(UNIQUE).reduce((m,k)=>(m[UNIQUE[k].faction]=k,m),{});
// ---------- đặc tính thứ hai + kỹ năng chủ tướng ----------
const BONUS2=[
 'Sơn cước Hoa Lư: bộ binh đứng trên đồi +2 giáp.',
 'Thành đá ong: quân tầm xa +10% HP.',
 'Rừng núi Hồi Hồ: quân bộ trong rừng/đồi +20% tốc độ.',
 'Lội sông: quân bộ không bị chậm khi lội chỗ cạn.',
 'Trường trận: Kích Binh và Kích Binh Phong Châu +1 giáp, +1 giáp tên.',
 'Giữ thành: quân trong 8 ô quanh Đại Bản Doanh +15% sát thương.',
 'Sổ đinh điền: dân phu khai thác nhanh hơn 10%.',
 'Cao điểm Tiên Du: quân tầm xa đứng trên đồi +20% sát thương.',
 'Đao trận: quân cận chiến +10% tốc độ.',
 'Đồng ruộng Tế Giang: thu hoạch Lương nhanh hơn 20%.',
 'Thương lộ: khai thác Vàng, Sắt, Đá nhanh hơn 15%.',
 'Hổ dữ: quân dưới 50% HP +15% sát thương.'
];
const ABILITIES=[
 {name:'Hiệu Lệnh Cờ Lau',cooldown:60,text:'Đồng minh trong 6 ô +20% sát thương, +15% tốc độ trong 10 giây; Giáp Sĩ +4 giáp.'},
 {name:'Mưa Tên Liên Châu',cooldown:70,text:'Quân tầm xa trong 7 ô bắn nhanh hơn 30% trong 8 giây.'},
 {name:'Tượng Trận Xung Phong',cooldown:75,text:'Voi và chủ tướng trong 7 ô +35% tốc độ, +25% sát thương 8 giây; địch sát bên choáng 1 giây.'},
 {name:'Lướt Sóng',cooldown:60,text:'Quân và thuyền trong 8 ô +35% tốc độ 10 giây; thuyền hồi 40 HP.'},
 {name:'Trường Thương Trận',cooldown:60,text:'Kích binh trong 6 ô +4 giáp, +4 giáp tên, +20% sát thương 10 giây.'},
 {name:'Tường Khiên Đỗ Động',cooldown:65,text:'Đồng minh trong 6 ô +5 giáp và +5 giáp tên trong 8 giây.'},
 {name:'Điều Binh Khẩn',cooldown:60,text:'Đồng minh trong 8 ô +30% tốc độ, đánh nhanh hơn 15% trong 10 giây.'},
 {name:'Hỏa Tiễn Tiên Du',cooldown:70,text:'Quân tầm xa trong 7 ô +30% sát thương, +1 tầm bắn 8 giây.'},
 {name:'Đao Phong',cooldown:60,text:'Quân cận chiến trong 6 ô +30% sát thương 8 giây.'},
 {name:'Hô Hào Hương Binh',cooldown:70,text:'Đồng minh trong 7 ô hồi 40 HP và +15% sát thương 8 giây.'},
 {name:'Khao Quân Siêu Loại',cooldown:60,text:'Đồng minh trong 7 ô hồi ngay 60 HP.'},
 {name:'Hổ Gầm Đằng Châu',cooldown:75,text:'Địch trong 5 ô choáng 1,5 giây; đồng minh trong 6 ô +15% sát thương 8 giây.'}
];
// ---------- tạo hình (visual identity) ----------
// soldier: quân phục; helm: kiểu mũ (mỗi phe một kiểu); shield: hoa văn khiên; banner: hình cờ.
const STYLES=[
 {tunic:'#3c5a7a',pants:'#2b3a4a',armor:['#c9b273','#2f4a66'],helm:'reed',helmColor:'#cdb672',shield:{pattern:'cross',colors:['#2f4a66','#e3cf8a']},banner:{shape:'swallow',color:'#e9d58f',edge:'#2f4a66'},region:'Núi đá vôi, đầm lau Hoa Lư'},
 {tunic:'#7a3b30',pants:'#3f2a25',armor:['#b0643f','#4a2a25'],helm:'flat',helmColor:'#5d3a2c',shield:{pattern:'split',colors:['#7a3b30','#263e56']},banner:{shape:'square',color:'#6d2f35',edge:'#e0b86a'},region:'Làng cổ đá ong Đường Lâm'},
 {tunic:'#556b35',pants:'#3a4526',armor:['#8a9a5a','#3e4a2a'],helm:'rattanWide',helmColor:'#a07c45',shield:{pattern:'dots',colors:['#5c713d','#e4d18e']},banner:{shape:'triangle',color:'#5c713d',edge:'#e4d18e'},region:'Rừng đồi Hồi Hồ, xứ voi'},
 {tunic:'#1f6b75',pants:'#1c3c44',armor:['#7fb2b0','#1c4450'],helm:'bandana',helmColor:'#d5c17e',shield:{pattern:'wave',colors:['#176d78','#e8f0d8']},banner:{shape:'long',color:'#176d78',edge:'#d5c17e'},region:'Cửa biển Bố Hải'},
 {tunic:'#5e3f6f',pants:'#352840',armor:['#a98bb8','#3b2a45'],helm:'pointed',helmColor:'#6a5a78',shield:{pattern:'diamond',colors:['#70467f','#e8ca79']},banner:{shape:'swallow',color:'#70467f',edge:'#e8ca79'},region:'Đất tổ Phong Châu'},
 {tunic:'#3b4d58',pants:'#262f35',armor:['#9aa6a8','#2e3a40'],helm:'fullHelm',helmColor:'#7f8b8d',shield:{pattern:'bars',colors:['#3d5869','#d7c27f']},banner:{shape:'square',color:'#3d5869',edge:'#d7c27f'},region:'Thành lũy Đỗ Động Giang'},
 {tunic:'#8a6224',pants:'#4a3a22',armor:['#d1a95a','#5a4320'],helm:'official',helmColor:'#2f3b42',shield:{pattern:'ring',colors:['#9a6b26','#374f5b']},banner:{shape:'long',color:'#9a6b26',edge:'#374f5b'},region:'Phủ trị Tam Đái'},
 {tunic:'#2f6e66',pants:'#244a45',armor:['#8fc0aa','#24504a'],helm:'hood',helmColor:'#3e6a52',shield:{pattern:'sun',colors:['#34776f','#d9ca86']},banner:{shape:'triangle',color:'#34776f',edge:'#d9ca86'},region:'Đồi chùa Tiên Du'},
 {tunic:'#7b3443',pants:'#3c2030',armor:['#c46a6a','#3c2030'],helm:'crestHelm',helmColor:'#8b3a48',shield:{pattern:'cross',colors:['#e9c46f','#863c4b']},banner:{shape:'swallow',color:'#863c4b',edge:'#e9c46f'},region:'Bãi sông Tây Phù Liệt'},
 {tunic:'#5f7a37',pants:'#4a4a2c',armor:['#b8a868','#4a5a2a'],helm:'nonlaSmall',helmColor:'#d6c68b',shield:{pattern:'ring',colors:['#ddcb89','#5d7735']},banner:{shape:'triangle',color:'#5d7735',edge:'#ddcb89'},region:'Đồng lúa Tế Giang'},
 {tunic:'#2e3036',pants:'#22242a',armor:['#d8b85a','#3a3326'],helm:'turbanCap',helmColor:'#b8963c',shield:{pattern:'sun',colors:['#2e3036','#e4cc7d']},banner:{shape:'square',color:'#c9a640',edge:'#2e3036'},region:'Bến chợ Siêu Loại'},
 {tunic:'#7f4a2c',pants:'#3a2a20',armor:['#e8e2d0','#4a3528'],helm:'tigerHood',helmColor:'#efe8d8',shield:{pattern:'tiger',colors:['#efe8d8','#2a2420']},banner:{shape:'long',color:'#8a4d2f',edge:'#f0d27c'},region:'Đầm lầy Đằng Châu'}
];
// Chủ tướng: mũ riêng, vũ khí đặc trưng, tóc/râu, áo choàng, thú cưỡi.
const GENERALS=[
 {headgear:'crown',weapon:'spear',hair:'topknot',beard:'short',mount:'buffalo',mountColor:'#4b4945',epithet:'Vạn Thắng Vương'},
 {headgear:'winged',weapon:'bow',hair:'long',beard:'long',mount:'horse',mountColor:'#8a5a36',epithet:'Ngô Lãm Công'},
 {headgear:'turban',weapon:'axe',hair:'topknot',beard:'none',mount:'elephant',mountColor:'#8d9a8b',epithet:'Kiều Lệnh Công'},
 {headgear:'seaband',weapon:'staff',hair:'loose',beard:'short',mount:null,epithet:'Trần Minh Công'},
 {headgear:'plume',weapon:'halberd',hair:'topknot',beard:'long',mount:'horse',mountColor:'#2e2a28',epithet:'Kiều Tam Chế'},
 {headgear:'greatHelm',weapon:'sword',hair:'topknot',beard:'square',mount:null,shieldBearer:true,epithet:'Đỗ Cảnh Công'},
 {headgear:'wingedCap',weapon:'fan',hair:'topknot',beard:'thin',mount:'horse',mountColor:'#9a9a92',epithet:'Nguyễn Thái Bình'},
 {headgear:'feather',weapon:'bow',hair:'long',beard:'none',mount:'horse',mountColor:'#b08a5a',epithet:'Nguyễn Lệnh Công'},
 {headgear:'redPlume',weapon:'greatsaber',hair:'topknot',beard:'short',mount:'horse',mountColor:'#a0522d',epithet:'Nguyễn Hữu Công'},
 {headgear:'conical',weapon:'staff',hair:'topknot',beard:'none',mount:'buffalo',mountColor:'#5a5650',epithet:'Lữ Tá Công'},
 {headgear:'scholar',weapon:'scroll',hair:'topknot',beard:'thin',mount:'horse',mountColor:'#6b4a33',epithet:'Lý Lãng Công'},
 {headgear:'tiger',weapon:'axe',hair:'loose',beard:'square',mount:'horse',mountColor:'#e6e2d6',epithet:'Phạm Phòng Át'}
];
FACTIONS.forEach((f,i)=>{f.style={id:i,...STYLES[i]};f.general={...GENERALS[i],name:f.name};f.unique=UNIQUE_BY_FACTION[i];f.bonus2=BONUS2[i];f.ability=ABILITIES[i];});
const INFANTRY_LAND=u=>!U[u.kind].naval&&!['catapult','elephant','armoredElephant','worker'].includes(u.kind);
const ELEPHANTS=['elephant','armoredElephant'];
class Game extends Base{
 fid(owner){return this.faction(owner)?.id??owner;}
 unitName(u){if(!u)return'';if(u.kind==='dinh')return this.faction(u.owner).name;return U[u.kind]?.name||u.kind;}
 abilityInfo(u){if(!u)return null;if(u.kind==='dinh')return ABILITIES[this.fid(u.owner)];if(u.kind==='tran')return{name:'Lệnh Tháo Cọc',cooldown:90,text:'Thả bè hỏa công vào thuyền địch.'};if(u.kind==='lehoan')return{name:'Trống Xung Trận',cooldown:60,text:'Quân bộ quanh Lê Hoàn +35% tốc độ trong 8s, giải khống chế.'};if(u.kind==='nguyenbac')return{name:'Mưa Tên Phủ Đầu',cooldown:75,text:'Bắn một loạt tên gây 30 sát thương lên mọi địch trong 5 ô.'};return null;}
 activeBuffs(u){if(!u.buffs||!u.buffs.length)return [];u.buffs=u.buffs.filter(b=>b.until>this.time);return u.buffs;}
 buff(owner,center,radius,filter,buff,duration){let n=0;for(const v of this.units){if(v.owner!==owner||v.hp<=0||v.embarked||dist(v,center)>radius||!filter(v))continue;(v.buffs=this.activeBuffs(v)).push({...buff,until:this.time+duration});n++;}return n;}
 stats(u){const s=super.stats(u);if(!this.factionSlots)return s;const f=this.fid(u.owner),t=this.tile(u.x,u.y),land=!s.naval;
  if(f===0&&land&&t===5&&INFANTRY_LAND(u))s.armor+=2;
  if(f===1&&land&&s.range>=3&&s.dmg>0)s.hp=Math.round(s.hp*1.1);
  if(f===2&&land&&(t===5||t===6))s.speed*=1.2;
  if(f===3&&land&&t===3)s.speed*=1.6;
  if(f===4&&(u.kind==='pike'||u.kind==='halberdier')){s.armor+=1;s.arrow+=1;}
  if(f===8&&land&&s.dmg>0&&s.range<3&&u.kind!=='worker')s.speed*=1.1;
  for(const b of this.activeBuffs(u)){if(b.dmg&&s.dmg>0)s.dmg=+(s.dmg*b.dmg).toFixed(2);if(b.speed)s.speed*=b.speed;if(b.armor)s.armor+=b.armor;if(b.arrow)s.arrow+=b.arrow;if(b.delay)s.delay*=b.delay;if(b.range&&s.range>=3)s.range+=b.range;}
  return s;}
 combatDamage(u,target){let d=super.combatDamage(u,target);const f=this.fid(u.owner),s=this.stats(u);
  // Kích binh khắc chế voi: nhân sát thương trước khi trừ giáp (giống Kích Binh gốc với Chiến Tượng)
  if(target.entity!=='building'&&((u.kind==='halberdier'&&ELEPHANTS.includes(target.kind))||(u.kind==='pike'&&target.kind==='armoredElephant'))){const ts=this.stats(target);d=Math.max(d,(s.dmg*2.5-ts.armor-((target.armorUntil||0)>this.time?4:0))*(s.shots||1));}
  if(target.entity==='building'&&u.kind==='armoredElephant'&&this.tile(u.x,u.y)!==1)d*=2;
  if(f===5){const hall=this.buildings.find(b=>b.owner===u.owner&&b.kind==='hall'&&b.hp>0);if(hall&&dist(u,hall)<=8)d*=1.15;}
  if(f===7&&s.range>=3&&this.tile(u.x,u.y)===5)d*=1.2;
  if(f===11&&u.maxHP&&u.hp<u.maxHP*.5)d*=1.15;
  return d;}
 gatherBonus(u,kind){const f=this.fid(u.owner);let m=1;if(f===6)m*=1.1;if(f===9&&kind==='food')m*=1.2;if(f===10&&['gold','iron','stone'].includes(kind))m*=1.15;return m;}
 trainError(b,kind){const s=U[kind];if(s?.unique&&!this.hasUnlock(s.faction))return 'Quân độc quyền của '+FACTIONS[s.faction].name;if(kind==='tran'&&this.fid(0)===3)return 'Trần Lãm đã là chủ tướng của bạn';return super.trainError(b,kind);}
 skill(u){if(!u||u.kind!=='dinh')return super.skill(u);if(u.hp<=0||u.embarked||u.skill>0)return false;const f=this.fid(u.owner),o=u.owner,a=ABILITIES[f],T=this.time,all=()=>true;
  const hostileNear=r=>this.units.filter(v=>v.hp>0&&!v.embarked&&this.hostile(u,v)&&dist(u,v)<=r);
  switch(f){
   case 0:this.buff(o,u,6,all,{dmg:1.2,speed:1.15},10);for(const v of this.units)if(v.owner===o&&v.hp>0&&v.kind==='guard'&&dist(u,v)<=6){v.armorUntil=T+10;v.slowUntil=v.stunUntil=0;}break;
   case 1:this.buff(o,u,7,v=>U[v.kind].range>=3,{delay:.7},8);break;
   case 2:this.buff(o,u,7,v=>v===u||ELEPHANTS.includes(v.kind),{speed:1.35,dmg:1.25},8);for(const v of hostileNear(2.5))v.stunUntil=Math.max(v.stunUntil||0,T+1);break;
   case 3:this.buff(o,u,8,all,{speed:1.35},10);for(const v of this.units)if(v.owner===o&&v.hp>0&&U[v.kind].naval&&dist(u,v)<=8)v.hp=Math.min(v.maxHP,v.hp+40);break;
   case 4:this.buff(o,u,6,v=>v.kind==='pike'||v.kind==='halberdier'||v===u,{armor:4,arrow:4,dmg:1.2},10);break;
   case 5:this.buff(o,u,6,all,{armor:5,arrow:5},8);break;
   case 6:this.buff(o,u,8,all,{speed:1.3,delay:.85},10);break;
   case 7:this.buff(o,u,7,v=>U[v.kind].range>=3,{dmg:1.3,range:1},8);break;
   case 8:this.buff(o,u,6,v=>U[v.kind].range<3&&U[v.kind].dmg>0,{dmg:1.3},8);break;
   case 9:for(const v of this.units)if(v.owner===o&&v.hp>0&&!v.embarked&&dist(u,v)<=7)v.hp=Math.min(v.maxHP,v.hp+40);this.buff(o,u,7,all,{dmg:1.15},8);break;
   case 10:for(const v of this.units)if(v.owner===o&&v.hp>0&&!v.embarked&&dist(u,v)<=7)v.hp=Math.min(v.maxHP,v.hp+60);break;
   case 11:for(const v of hostileNear(5))v.stunUntil=Math.max(v.stunUntil||0,T+1.5);this.buff(o,u,6,all,{dmg:1.15},8);break;
  }
  u.skill=Math.max(10,a.cooldown-(u.talents?.strategy||0)*5);u.gestureAnim=1.15;this.effects.push({type:'aura',x:u.x,y:u.y,life:1.4,max:1.4});
  if(o===0)this.say(a.name+'!');else if(this.units.some(v=>v.owner===0&&v.hp>0&&dist(u,v)<12))this.say(this.faction(o).name+': '+a.name);
  return true;}
 // AI: dùng quân độc quyền, tuyển chủ tướng khi nhà chính cấp II, tự dùng kỹ năng khi giao chiến.
 aiUnit(owner,building,tier){const base=super.aiUnit(owner,building,tier),uk=UNIQUE_BY_FACTION[this.fid(owner)],s=uk&&U[uk];if(s&&s.building===building&&tier>=s.tier&&((this.ai[owner]?.trained||0)%2===0))return uk;return base;}
 aiThink(owner){super.aiThink(owner);const a=this.ai?.[owner];if(!a||this.states[owner]!=='enemy')return;const h=this.buildings.find(b=>b.owner===owner&&b.kind==='hall'&&b.hp>0);if(!h)return;
  let general=this.units.find(u=>u.owner===owner&&u.kind==='dinh'&&u.hp>0);
  if(!general&&h.tier>=2&&this.time>240&&this.time>=(a.generalAt||0)&&this.aiPay(owner,U.dinh.cost)){const p=this.findOpen('dinh',{x:h.x,y:h.y+2},5,true)||{x:h.x,y:h.y+2};general=this.spawn('dinh',p.x,p.y,owner);a.generalAt=this.time+240;a.status='Chủ tướng xuất trận';}
  if(general&&general.skill<=0&&this.units.some(v=>v.hp>0&&!v.embarked&&this.hostile(general,v)&&dist(general,v)<=6))this.skill(general);}
}
Object.assign(api,{Game,UNIQUE,UNIQUE_BY_FACTION,BONUS2,ABILITIES,STYLES,GENERALS});return api;
});
