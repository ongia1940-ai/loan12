'use strict';
const clean=(v,n=24)=>String(v||'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,n)||'Khách';
const token=()=>Math.random().toString(36).slice(2,10);const roomCode=()=>Math.random().toString(36).slice(2,6).toUpperCase();
function createHub(){const rooms=new Map();
 function create({name,map='riverlands',faction='0'}={}){let code;do code=roomCode();while(rooms.has(code));const id=token(),room={code,map:clean(map,16),faction:clean(faction,8),seq:0,events:[],players:new Map([[id,{id,name:clean(name),host:true,lastSeen:Date.now()}]])};rooms.set(code,room);return {code,id,host:true,map:room.map,faction:room.faction};}
 function join({code,name}={}){const room=rooms.get(String(code||'').toUpperCase());if(!room)throw Error('Phòng không tồn tại');if(room.players.size>=4)throw Error('Phòng đã đủ 4 người');const id=token();room.players.set(id,{id,name:clean(name),host:false,lastSeen:Date.now()});return {code:room.code,id,host:false,map:room.map,faction:room.faction};}
 function view(code,since=0,id){const room=rooms.get(String(code||'').toUpperCase());if(!room)throw Error('Phòng không tồn tại');const p=room.players.get(id);if(p)p.lastSeen=Date.now();return {code:room.code,map:room.map,faction:room.faction,players:[...room.players.values()].map(({id,name,host})=>({id,name,host})),events:room.events.filter(e=>e.seq>since).slice(-100),seq:room.seq};}
 function event(code,id,type,data){const room=rooms.get(String(code||'').toUpperCase()),player=room?.players.get(id);if(!room||!player)throw Error('Phiên multiplayer không hợp lệ');const e={seq:++room.seq,player:id,type:clean(type,24),data:data&&typeof data==='object'?data:{},at:Date.now()};room.events.push(e);if(room.events.length>300)room.events.splice(0,room.events.length-300);player.lastSeen=Date.now();return e;}
 function leave(code,id){const room=rooms.get(String(code||'').toUpperCase());if(!room)return;room.players.delete(id);if(!room.players.size)rooms.delete(room.code);else if(![...room.players.values()].some(p=>p.host))[...room.players.values()][0].host=true;}
 return {rooms,create,join,view,event,leave};}
module.exports={createHub};
