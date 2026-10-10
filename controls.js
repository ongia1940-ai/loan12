// Loạn 12 Sứ Quân — lớp điều khiển kiểu AoE2 (thuần logic, không phụ thuộc DOM để kiểm thử được).
// Chuột trái: chọn / kéo khung chọn. Chuột phải: lệnh theo ngữ cảnh. Tùy chọn "Lệnh bằng chuột trái".
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanControls=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STORE=['hall','house','storehouse'];
const MINE=['stone','gold','iron'];
function ents(game,ids){return (ids||[]).map(id=>game.entity(id)).filter(Boolean);}
function hostile(game,t){return !!t&&t.entity!=='resource'&&t.owner!==0&&t.hp>0&&(!game.states||game.states[t.owner]!=='ally');}
function nodeFor(game,t){if(!t)return null;if(t.entity==='resource')return t;if(t.kind==='farm'&&t.owner===0)return (game.nodes||[]).find(n=>n.farm===t.id)||null;return null;}
// Decide what a contextual order means for the current selection, AoE2-style. Pure: does not change the game.
function resolveCommand(game,ids,p,target,opts={}){
 const U=opts.U||{},all=ents(game,ids).filter(e=>e.owner===0&&(e.hp>0)),units=all.filter(e=>e.entity==='unit'&&!e.embarked),producers=all.filter(e=>e.entity==='building'&&!e.wall);
 const naval=u=>!!(U[u.kind]&&U[u.kind].naval),land=units.filter(u=>!naval(u)),boats=units.filter(naval),fishers=boats.filter(u=>U[u.kind]&&U[u.kind].fisher),loaded=boats.filter(u=>u.cargo&&u.cargo.length),workers=units.filter(u=>u.kind==='worker');
 const n=nodeFor(game,target),onWater=[3,4].includes(game.tile(Math.floor(p.x),Math.floor(p.y)));
 if(!units.length){if(producers.length)return {type:'rally',producers,node:n};return {type:'none'};}
 if(target&&target.entity==='unit'&&target.owner===0&&land.length&&game.cargoCapacity&&game.cargoCapacity(target)&&!units.includes(target))return {type:'board',units:land,boat:target};
 if(n&&n.fish&&fishers.length)return {type:'fish',units:fishers,node:n};
 if(loaded.length&&!onWater&&!hostile(game,target))return {type:'unload',boats:loaded,rest:units.filter(u=>!loaded.includes(u))};
 if(workers.length&&target&&target.entity==='building'&&target.owner===0&&target.hp>0&&(target.constructing||target.hp<target.maxHP))return {type:target.constructing?'build':'repair',units:workers,building:target,rest:units.filter(u=>u.kind!=='worker')};
 if(n&&!n.fish&&workers.length)return {type:'gather',units:workers,node:n,rest:units.filter(u=>u.kind!=='worker')};
 if(target&&target.entity==='building'&&target.owner===0&&STORE.includes(target.kind)&&workers.some(u=>u.load&&u.load.amount>0))return {type:'return',units:workers};
 if(hostile(game,target))return {type:'attack',units,target};
 return {type:opts.attackMove?'attackMove':'move',units};
}
// Carry out a command through the regular (multiplayer-synchronised) game methods.
function executeCommand(game,ids,p,target,opts={}){const c=resolveCommand(game,ids,p,target,opts),idsOf=a=>a.map(u=>u.id);
 switch(c.type){
  case 'rally':for(const b of c.producers)game.setRally(b,c.node||p,c.node?c.node.id:undefined);break;
  case 'board':game.board(idsOf(c.units),c.boat.id);break;
  case 'fish':game.fish(idsOf(c.units),c.node.id);break;
  case 'unload':for(const b of c.boats)game.unloadAt(b,p);if(c.rest.length)game.order(idsOf(c.rest),p,null,false);break;
  case 'build':case 'repair':game.repair(idsOf(c.units),c.building.id);if(c.rest.length)game.order(idsOf(c.rest),p,null,false);break;
  case 'gather':game.assign(idsOf(c.units),c.node.id);if(c.rest.length)game.order(idsOf(c.rest),{x:c.node.x,y:c.node.y},null,false);break;
  case 'return':game.returnCargo(idsOf(c.units));break;
  case 'attack':game.order(idsOf(c.units),p,c.target.id,!!opts.attackMove);break;
  case 'attackMove':game.order(idsOf(c.units),p,null,true);break;
  case 'move':game.order(idsOf(c.units),p,null,false);break;
 }
 return c;}
// Cursor shown while hovering: sword over enemies, axe/pick/sickle over resources, hammer over damaged buildings.
function cursorFor(game,ids,target,opts={}){
 if(opts.buildMode)return 'build';if(opts.attackMove)return 'attack';
 const units=ents(game,ids).filter(e=>e.entity==='unit'&&e.owner===0&&e.hp>0&&!e.embarked),workers=units.filter(u=>u.kind==='worker');
 if(!units.length){if(target&&(target.owner===0||target.entity==='resource'))return 'select';return 'default';}
 if(hostile(game,target))return 'attack';
 const n=nodeFor(game,target);
 if(n&&workers.length)return n.kind==='wood'?'axe':MINE.includes(n.kind)?'pick':'sickle';
 if(n&&n.fish&&units.length)return 'sickle';
 if(target&&target.entity==='building'&&target.owner===0&&target.hp>0&&workers.length&&(target.constructing||target.hp<target.maxHP))return 'hammer';
 if(target&&target.entity==='unit'&&target.owner===0&&game.cargoCapacity&&game.cargoCapacity(target)&&!units.includes(target))return 'board';
 if(target&&target.owner===0)return 'select';
 return 'move';}
function toggleSelection(selected,id){return selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];}
function addSelection(selected,ids){return [...new Set([...selected,...ids])];}
function sameTypeOnScreen(game,e,visible){if(!e||e.owner!==0)return e?[e.id]:[];const list=e.entity==='unit'?game.units.filter(u=>u.hp>0&&u.owner===0&&!u.embarked&&u.kind===e.kind):game.buildings.filter(b=>b.hp>0&&b.owner===0&&b.kind===e.kind);return list.filter(x=>x.id===e.id||visible(x)).map(x=>x.id);}
// Left-command option: a left click issues the order only for own units clicking ground, enemies or resources.
function leftClickIssues(game,ids,target,leftCommand){if(!leftCommand)return false;const units=ents(game,ids).filter(e=>e.entity==='unit'&&e.owner===0&&e.hp>0&&!e.embarked);if(!units.length)return false;if(!target)return true;if(target.entity==='resource')return true;if(hostile(game,target))return true;return false;}
function boxSelect(list,a,b,toScreen){const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);return list.filter(e=>{const s=toScreen(e);return s.x>=x0&&s.x<=x1&&s.y>=y0&&s.y<=y1;}).map(e=>e.id);}
const COMMAND_NAMES={move:'Di chuyển',attack:'Tấn công',attackMove:'Tiến công',gather:'Khai thác',build:'Xây dựng',repair:'Sửa chữa',board:'Lên thuyền',unload:'Đổ quân',fish:'Đánh cá',return:'Mang hàng về',rally:'Điểm tập kết',none:''};
const HELP=[
 ['Chuột trái','Chọn quân / công trình'],['Kéo chuột trái','Khung chọn nhiều quân'],['Nhấp chuột phải','Lệnh theo ngữ cảnh: đi, đánh, khai thác, xây, sửa, lên thuyền'],['Giữ + kéo chuột phải','Kéo bản đồ tự do lên / xuống / trái / phải'],
 ['Nhấp đúp','Chọn mọi quân cùng loại trên màn hình'],['Ctrl + nhấp','Thêm / bớt khỏi nhóm đang chọn'],['Shift + nhấp/kéo','Chọn thêm'],
 ['Ctrl + 1…9','Lưu đạo quân'],['1…9','Gọi đạo quân (nhấn 2 lần: đưa camera tới)'],['H','Về Đại Bản Doanh'],['.','Chọn dân phu đang rảnh'],
 ['A','Tiến công (rồi nhấp đất/địch)'],['G','Giữ vị trí (hoặc mở/đóng cổng)'],['X','Dừng'],['Delete','Giải tán quân/công trình đang chọn'],
 ['Esc','Bỏ chọn / hủy lệnh đang đặt'],['Space','Chọn toàn quân'],['WASD, mũi tên, mép màn hình','Di chuyển camera'],['Lăn chuột / chuột giữa / kéo chuột phải','Phóng to / kéo bản đồ'],
 ['Bản đồ nhỏ','Trái: đưa camera · Phải: điều quân tới'],['F1','Bật/tắt bảng phím tắt']];
return {resolveCommand,executeCommand,cursorFor,toggleSelection,addSelection,sameTypeOnScreen,leftClickIssues,boxSelect,hostile,COMMAND_NAMES,HELP};
});
