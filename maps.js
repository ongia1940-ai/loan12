(function(root,factory){if(typeof module==='object')module.exports=factory(require('./ai.js'));else factory(root.Loan12);})(typeof globalThis!=='undefined'?globalThis:this,function(api){
'use strict';
const {Game:Base,W,H}=api;
const MAPS=[
 {id:'riverlands',name:'Đồng Bằng Hoa Lư',style:'Cân bằng',description:'Sông chính, đồng ruộng rộng và đường bộ thuận lợi cho trận hỗn hợp.'},
 {id:'delta',name:'Châu Thổ Tam Giang',style:'Thủy chiến',description:'Nhiều nhánh sông nông, bến nước và lối vượt hẹp; thuyền giữ vai trò chủ lực.'},
 {id:'highlands',name:'Sơn Cước Phong Châu',style:'Đột kích',description:'Đồi đá, rừng dày và các hành lang hẹp thuận lợi cho mai phục bộ binh.'},
 {id:'coast',name:'Duyên Hải Bố Hải',style:'Đổ bộ',description:'Vịnh nước lớn chia chiến trường, khuyến khích vận binh và hạm đội tầm xa.'},
 {id:'pass',name:'Ải Đèo Tam Điệp',style:'Cửa ải',description:'Hai dãy núi đá chắn ngang chiến trường, chỉ chừa vài cửa đèo hẹp; ai giữ được đèo sẽ giữ thế trận.'},
 {id:'islands',name:'Quần Đảo Vân Đồn',style:'Đảo ven biển',description:'Biển và lạch nước chia đất thành nhiều cù lao, nối nhau bằng bãi cạn lội được; thuyền và vận binh rất quan trọng.'},
 {id:'plains',name:'Bình Nguyên Gia Viễn',style:'Đồng trống',description:'Đồng bằng khô, sông có nhiều bãi cạn dễ vượt, ít chướng ngại; hợp đánh nhanh và kỵ tượng.'},
 {id:'random',name:'Ngẫu nhiên',style:'Bất ngờ',description:'Bốc thăm một trong các bản đồ trên khi bắt đầu trận.'}
];
const PLAYABLE=MAPS.filter(m=>m.id!=='random').map(m=>m.id);
function resolveMapId(id,random=Math.random){if(id==='random')return PLAYABLE[Math.min(PLAYABLE.length-1,Math.floor(random()*PLAYABLE.length))];return PLAYABLE.includes(id)?id:'riverlands';}
function protectedCell(g,x,y,r=3){return [...g.buildings,...g.units,...(g.nodes||[])].some(e=>e.hp!==0&&Math.hypot(e.x-(x+.5),e.y-(y+.5))<r);}
function paint(g,x,y,t){if(x<1||y<1||x>=W-1||y>=H-1||protectedCell(g,x,y))return;g.map[y*W+x]=t;}
// tighter protection for the ridge/channel maps: keep building footprints and approaches, units and resource tiles clear
function softProtected(g,x,y){const c={x:x+.5,y:y+.5},d=e=>Math.hypot(e.x-c.x,e.y-c.y);return g.buildings.some(b=>b.hp!==0&&d(b)<3)||g.units.some(u=>u.hp>0&&d(u)<1.6)||(g.nodes||[]).some(n=>d(n)<1.05);}
function paintSoft(g,x,y,t){if(x<1||y<1||x>=W-1||y>=H-1||softProtected(g,x,y))return;g.map[y*W+x]=t;}
function applyMap(g,id){const profile=MAPS.find(m=>m.id===id&&id!=='random')||MAPS[0];g.mapProfile=profile;if(profile.id==='riverlands')return;
 if(profile.id==='delta')for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const tributary=Math.abs(y-(43+Math.sin(x*.2)*3))<1.15||Math.abs(x-(63+Math.sin(y*.25)*4))<1.05;if(tributary)paint(g,x,y,(x+y)%5?3:4);else if((x*17+y*11)%149<2)paint(g,x,y,2);}
 if(profile.id==='highlands')for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const ridge=Math.sin(x*.19)+Math.cos(y*.24)>.95;if(ridge)paint(g,x,y,(x+y)%4?5:7);else if((x*7+y*13)%43<4)paint(g,x,y,6);}
 if(profile.id==='coast')for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const bay=x>56&&y>18||x>35&&y>47||Math.hypot(x-68,y-43)<13;if(bay)paint(g,x,y,(x+y)%6?4:3);else if(Math.abs(y-(18+Math.sin(x*.14)*1.5))<5)paint(g,x,y,(x+y)%4?4:3);}
 if(profile.id==='pass')for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){// two north-south ridges with narrow passes
  for(const [cx,passes] of [[40,[[8,10],[36,39]]],[60,[[12,14],[27,29],[50,52]]]]){const rx=cx+Math.round(Math.sin(y*.3)*1.5),d=Math.abs(x-rx);if(d>2||y>=18&&y<=21)continue;if(passes.some(([a,b])=>y>=a&&y<=b)){if(d<=1)paintSoft(g,x,y,0);continue;}paintSoft(g,x,y,d<=1?7:5);}}
 if(profile.id==='islands')for(let y=2;y<H-1;y++)for(let x=2;x<W-1;x++){// sea channels with wadeable shoals between islands
  const ch1=y>22&&Math.abs(x-(31+Math.sin(y*.35)*1.2))<1.8,ch2=y>22&&Math.abs(x-(56+Math.sin(y*.3)*1.4))<1.8,ch3=x>33&&Math.abs(y-(45+Math.sin(x*.25)*1.2))<1.6,sea=x>=W-6||y>=H-5;
  const ford=ch1&&(Math.abs(y-31)<2||Math.abs(y-53)<2)||ch2&&(Math.abs(y-33)<2||Math.abs(y-50)<2)||ch3&&(Math.abs(x-44)<2||Math.abs(x-68)<2);
  if(sea)paintSoft(g,x,y,x>=W-3||y>=H-3?4:3);else if(ch1||ch2||ch3)paintSoft(g,x,y,ford?3:((x+y)%3?4:3));else if((x*11+y*7)%97<2)paintSoft(g,x,y,2);}
 if(profile.id==='plains')for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const t=g.map[y*W+x];if(t===1||t===2||t===5)paint(g,x,y,0);else if(t===4&&[[8,16],[33,40],[56,63],[70,78]].some(([a,b])=>x>=a&&x<=b))paint(g,x,y,3);}
 for(const u of g.units)u.path=[];
}
class Game extends Base{constructor(choice=0,random=Math.random,mapId='riverlands'){super(choice,random);this.mapChoice=mapId;applyMap(this,resolveMapId(mapId,random));}}
Object.assign(api,{Game,MAPS,applyMap,resolveMapId,PLAYABLE_MAPS:PLAYABLE});return api;
});
