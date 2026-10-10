(function(root,factory){if(typeof module==='object')module.exports=factory(require('./tactics.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const Base=api.Game;
const FACTION_DATA=[
 ['Đinh Bộ Lĩnh','Hoa Lư','Cờ lau tụ nghĩa','Dân Binh Cờ Lau +20% HP.'],
 ['Ngô Nhật Khánh','Đường Lâm','Liên châu thiện xạ','Nỏ Thủ Liên Châu +20% sát thương.'],
 ['Kiều Thuận','Hồi Hồ','Tượng binh tiên phong','Chiến Tượng +20% HP.'],
 ['Trần Lãm','Bố Hải Khẩu','Thủy quân lướt sóng','Thuyền di chuyển nhanh hơn 20%.'],
 ['Kiều Công Hãn','Phong Châu','Trường trận','Kích Binh +20% sát thương.'],
 ['Đỗ Cảnh Thạc','Đỗ Động Giang','Thiết giáp phòng thành','Giáp Sĩ +2 giáp chém.'],
 ['Nguyễn Khoan','Tam Đái','Quân chế','Thời gian tuyển quân và dân giảm 15%.'],
 ['Nguyễn Thủ Tiệp','Tiên Du','Cung thủ cao điểm','Cung Thủ Làng +1 ô tầm bắn.'],
 ['Nguyễn Siêu','Tây Phù Liệt','Đao trận','Đao Binh +20% sát thương.'],
 ['Lữ Đường','Tế Giang','Dân cường','Dân Phu +25% HP.'],
 ['Lý Khuê','Siêu Loại','Kho vận','Dân Phu mang 25 hàng mỗi chuyến thay vì 20.'],
 ['Phạm Bạch Hổ','Đằng Châu','Bạch hổ xung trận','Quân cận chiến +15% sát thương.']
];
const FACTION_VISUALS=[
 {coat:'#244f75',secondary:'#a77a32',accent:'#f0d58a',skin:'#d9a477',hat:'crown',weapon:'spear',beard:'short',emblem:'丁'},
 {coat:'#6d2f35',secondary:'#263e56',accent:'#e0b86a',skin:'#ddb083',hat:'winged',weapon:'bow',beard:'long',emblem:'弩'},
 {coat:'#5c713d',secondary:'#a86737',accent:'#e4d18e',skin:'#c98f67',hat:'turban',weapon:'axe',beard:'none',emblem:'象'},
 {coat:'#176d78',secondary:'#23465d',accent:'#d5c17e',skin:'#d4a276',hat:'headband',weapon:'staff',beard:'short',emblem:'水'},
 {coat:'#70467f',secondary:'#8a5635',accent:'#e8ca79',skin:'#dba77c',hat:'plume',weapon:'spear',beard:'long',emblem:'戟'},
 {coat:'#3d5869',secondary:'#444b4a',accent:'#d7c27f',skin:'#c99069',hat:'helmet',weapon:'sword',beard:'square',emblem:'盾'},
 {coat:'#9a6b26',secondary:'#374f5b',accent:'#f0d486',skin:'#e0b086',hat:'scholar',weapon:'fan',beard:'thin',emblem:'令'},
 {coat:'#34776f',secondary:'#6b4937',accent:'#d9ca86',skin:'#d39c70',hat:'headband',weapon:'bow',beard:'none',emblem:'弓'},
 {coat:'#863c4b',secondary:'#303f51',accent:'#e9c46f',skin:'#d8a075',hat:'plume',weapon:'sword',beard:'short',emblem:'刀'},
 {coat:'#5d7735',secondary:'#8d5b38',accent:'#ddcb89',skin:'#c78f67',hat:'conical',weapon:'staff',beard:'none',emblem:'民'},
 {coat:'#455f91',secondary:'#765038',accent:'#e4cc7d',skin:'#dcaa7e',hat:'scholar',weapon:'scroll',beard:'thin',emblem:'倉'},
 {coat:'#8a4d2f',secondary:'#252f3b',accent:'#f0d27c',skin:'#cf966c',hat:'tiger',weapon:'axe',beard:'square',emblem:'虎'}
];
const FACTIONS=FACTION_DATA.map(([name,region,title,description],id)=>({id,name,region,title,description,visual:FACTION_VISUALS[id]}));
function rollFaction(random=Math.random){return Math.min(11,Math.max(0,Math.floor(random()*12)));}
class Game extends Base{
 constructor(choice=0,random=Math.random){super();this.playerFaction=choice==='random'?rollFaction(random):Number(choice);if(!Number.isInteger(this.playerFaction)||this.playerFaction<0||this.playerFaction>11)this.playerFaction=0;this.factionSlots=FACTIONS.map(f=>f.id);[this.factionSlots[0],this.factionSlots[this.playerFaction]]=[this.factionSlots[this.playerFaction],this.factionSlots[0]];for(const u of this.units)this.syncStats(u);}
 faction(owner=0){return FACTIONS[this.factionSlots?.[owner]??owner];}
 hasUnlock(id){const owner=this.factionSlots?this.factionSlots.indexOf(id):id;return owner===0||this.states[owner]==='ally';}
 stats(u){const s=super.stats(u);if(!this.factionSlots)return s;const f=this.faction(u.owner).id,k=u.kind;if(f===0&&k==='militia'||f===2&&k==='elephant')s.hp=Math.round(s.hp*1.2);if(f===9&&k==='worker')s.hp=Math.round(s.hp*1.25);if(f===1&&(k==='crossbow'||k==='divineCrossbow')||f===4&&k==='pike'||f===8&&k==='swordsman')s.dmg=+(s.dmg*1.2).toFixed(2);if(f===3&&s.naval)s.speed*=1.2;if(f===5&&k==='guard')s.armor+=2;if(f===7&&k==='archer')s.range+=1;if(f===11&&s.dmg>0&&s.range<3)s.dmg=+(s.dmg*1.15).toFixed(2);return s;}
 trainDuration(b,kind){return super.trainDuration(b,kind)*(this.factionSlots&&this.faction(b.owner).id===6?.85:1);}
 capacity(){return this.factionSlots&&this.faction().id===10?25:20;}
}
Object.assign(api,{Game,FACTIONS,rollFaction});return api;
});
