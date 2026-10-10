// Loạn 12 Sứ Quân — thiết lập trận đấu (màn hình chính): kích thước bản đồ, số đối thủ AI, phe và độ khó AI, tài nguyên khởi đầu.
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./navy.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:Base,W,H,REF_W,REF_H,RESOURCE,FACTIONS}=api;
const RESOURCE_PRESETS={
 low:{name:'Thấp',stock:{food:400,wood:400,stone:200,gold:150,iron:60},ai:.6},
 standard:{name:'Tiêu chuẩn',stock:{food:1300,wood:1000,stone:650,gold:550,iron:240},ai:1},
 high:{name:'Cao',stock:{food:2600,wood:2000,stone:1300,gold:1100,iron:480},ai:2},
 rich:{name:'Giàu có',stock:{food:8000,wood:8000,stone:5000,gold:5000,iron:2000},ai:6}
};
const DIFFICULTY={easy:{name:'Dễ',gather:.7,stock:.7,attack:+70},normal:{name:'Thường',gather:1,stock:1,attack:0},hard:{name:'Khó',gather:1.35,stock:1.6,attack:-45}};
const MAX_AI=11;
function defaultSetup(){return {map:'riverlands',size:'standard',faction:'0',aiCount:MAX_AI,ai:Array.from({length:MAX_AI},()=>({faction:'auto',difficulty:'normal'})),resources:'standard'};}
function normalizeSetup(s){const d=defaultSetup();s=s&&typeof s==='object'?s:{};const out={...d,...s};out.map=typeof out.map==='string'?out.map.slice(0,16):'riverlands';out.size=api.SIZES&&api.SIZES[out.size]?out.size:'standard';out.faction=out.faction==='random'?'random':String(Math.max(0,Math.min(11,Number.parseInt(out.faction,10)||0)));{const n=Number.parseInt(out.aiCount,10);out.aiCount=Number.isFinite(n)?Math.max(1,Math.min(MAX_AI,n)):MAX_AI;}out.resources=RESOURCE_PRESETS[out.resources]?out.resources:'standard';const ai=Array.isArray(s.ai)?s.ai:[];out.ai=d.ai.map((x,i)=>{const a=ai[i]||{};const f=a.faction==='random'||a.faction==='auto'?a.faction:Number.isInteger(Number(a.faction))&&a.faction!==''&&Number(a.faction)>=0&&Number(a.faction)<=11?String(Number(a.faction)):'auto';return {faction:f,difficulty:DIFFICULTY[a.difficulty]?a.difficulty:'normal'};});return out;}
// The campaign layout is authored on an 84×60 reference grid; larger maps stretch terrain and spread every base/unit/resource proportionally.
function rescaleWorld(g){if(W===REF_W&&H===REF_H)return false;const sx=W/REF_W,sy=H/REF_H,old=g.map.slice();
 // fish and anything authored outside the reference area are regenerated after stretching
 if(g.nodes)g.nodes=g.nodes.filter(n=>!n.fish&&n.x<REF_W&&n.y<REF_H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)g.map[y*W+x]=old[Math.min(REF_H-1,Math.floor(y/sy))*W+Math.min(REF_W-1,Math.floor(x/sx))];
 const grid=(v,s)=>Math.floor(v*s)+(v-Math.floor(v));
 for(const b of g.buildings){b.x=grid(b.x,sx);b.y=grid(b.y,sy);if(b.rally){b.rally.x*=sx;b.rally.y*=sy;}}
 for(const n of g.nodes||[]){const f=n.farm&&g.buildings.find(b=>b.id===n.farm);if(f){n.x=f.x;n.y=f.y;}else{n.x=grid(n.x,sx);n.y=grid(n.y,sy);}}
 for(const u of g.units){u.x*=sx;u.y*=sy;u.path=[];u.target=null;}
 // stretched forests get real wood on every tree tile, as on the standard map
 if(g.nodes&&g.addNode)for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g.map[y*W+x]===6&&!g.nodes.some(n=>Math.floor(n.x)===x&&Math.floor(n.y)===y)&&!g.buildings.some(b=>b.hp>0&&Math.abs(b.x-(x+.5))<1.5&&Math.abs(b.y-(y+.5))<1.5))g.addNode('wood',x+.5,y+.5,120,0);
 if(g.spawnFish)g.spawnFish();
 g.width=W;g.height=H;g._occDirty=true;g.mapScale={x:sx,y:sy};return true;}
function applySetup(g,setup,random=Math.random){const s=normalizeSetup(setup);g.setup=s;
 const res=RESOURCE_PRESETS[s.resources];g.stock={...res.stock};g.aiDifficulty={};
 for(let owner=1;owner<=MAX_AI;owner++){const slot=s.ai[owner-1];
  if(owner>s.aiCount){// sứ quân vắng mặt: không có căn cứ, không tính vào chiến thắng
   g.buildings=g.buildings.filter(b=>b.owner!==owner);g.units=g.units.filter(u=>u.owner!==owner);if(g.nodes){const alive=new Set(g.buildings.map(b=>b.id));g.nodes=g.nodes.filter(n=>!n.farm||alive.has(n.farm));for(const n of g.nodes)if(n.lord===owner)n.lord=0;}g.states[owner]='absent';if(g.ai&&g.ai[owner])g.ai[owner].status='Vắng mặt';continue;}
  if(slot.faction!=='auto'&&g.factionSlots){const id=slot.faction==='random'?Math.min(11,Math.floor(random()*12)):Number(slot.faction);g.factionSlots[owner]=id;}
  g.aiDifficulty[owner]=slot.difficulty;const d=DIFFICULTY[slot.difficulty];
  if(g.ai&&g.ai[owner])for(const k of RESOURCE)g.ai[owner].stock[k]=Math.round(g.ai[owner].stock[k]*res.ai*d.stock);}
 if(g.syncStats)for(const u of g.units)g.syncStats(u);g._occDirty=true;return g;}
class Game extends Base{
 constructor(choice=0,random=Math.random,mapId='riverlands',setup=null){super(choice,random,mapId);rescaleWorld(this);if(setup)applySetup(this,setup,random);}
 saveGroup(number,ids){if(number<1||number>9)return;this.groups[number]=[...new Set(ids)].filter(id=>{const u=this.entity(id);return u&&u.owner===0;});}
 // Delete key: disband own units / buildings (the Đại Bản Doanh is protected from accidental deletion).
 destroyOwn(ids){let n=0;for(const id of ids||[]){const e=this.entity(id);if(!e||e.owner!==0||!(e.hp>0)||e.embarked||e.kind==='hall')continue;if(e.cargo&&e.cargo.length)continue;this.hit(e,e.hp+1e6,null);if(e.hp>0)e.hp=0;n++;}if(n){this._occDirty=true;this.say('Đã giải tán '+n+' đối tượng');}return n;}
 creditCargo(u,kind,amount){const d=u&&u.owner>0&&this.aiDifficulty&&DIFFICULTY[this.aiDifficulty[u.owner]];return super.creditCargo(u,kind,d?amount*d.gather:amount);}
 aiThink(owner){const a=this.ai&&this.ai[owner],before=a?a.lastAttack:0;const r=super.aiThink(owner);const d=this.aiDifficulty&&DIFFICULTY[this.aiDifficulty[owner]];if(a&&d&&d.attack&&a.lastAttack!==before)a.lastAttack+=d.attack;return r;}
}
Object.assign(api,{Game,RESOURCE_PRESETS,DIFFICULTY,MAX_AI,defaultSetup,normalizeSetup,applySetup,rescaleWorld});return api;
});
