// Loạn 12 Sứ Quân — 8-direction unit sprites (2.5D puppets baked into a cached atlas).
// Visual only: reads unit state (position, target, attackAnim...) but never writes to it.
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanSprites=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mixN=(a,b,t)=>a+(b-a)*t;
// Faction unique units are drawn from a base archetype (kept in sync with U[kind].art in warlords.js).
const ARCH={divineCrossbow:'crossbow',reedBanner:'militia',lateriteBow:'crossbow',armoredElephant:'elephant',seaRaider:'skirmisher',halberdier:'pike',ironGuard:'guard',drillSpear:'pike',longbow:'archer',greatsword:'swordsman',peasantLevy:'militia',escortGuard:'skirmisher',tigerGuard:'swordsman'};
const archOf=k=>ARCH[k]||k,isElephant=k=>archOf(k)==='elephant';
const HERO_KINDS=new Set(['dinh','tran','lehoan','nguyenbac']),isHero=k=>HERO_KINDS.has(k);
const MILITARY=new Set(['militia','pike','guard','crossbow','archer','swordsman','skirmisher']);
const INFANTRY=['worker','scholar','militia','pike','guard','crossbow','archer','swordsman','skirmisher','dinh','tran','lehoan','nguyenbac',...Object.keys(ARCH).filter(k=>ARCH[k]!=='elephant')];
const SPRITED=new Set([...INFANTRY,'elephant','armoredElephant']);
// Extra sprite kinds (ships, siege engines) registered by other files: {draw(c,dir,action,frame,team,s,opts),cell(b),shadow,ring,head,stride,cargo}.
const REG=new Map();function register(kind,spec){REG.set(kind,spec);SPRITED.add(kind);return spec;}
// Directions that are drawn as a horizontal mirror of another (halves the atlas): SW<-SE, W<-E, NW<-NE.
const MIRROR=[-1,-1,-1,1,0,7,-1,-1];
const FRAMES={walk:8,attack:6,idle:4,work:6,cmd:4};
const DIRS=8;
// ---------- facing ----------
// Screen-space octant: 0=E(right) 1=SE 2=S(toward viewer) 3=SW 4=W 5=NW 6=N(away) 7=NE.
function octant(sx,sy){const a=Math.atan2(sy*2,sx);return((Math.round(a/(Math.PI/4))%DIRS)+DIRS)%DIRS;}
// World delta (tile axes) -> octant, using the same 2:1 isometric projection as iso-art.js.
const facingFromWorld=(dx,dy)=>octant(dx-dy,(dx+dy)/2);
const states=new WeakMap();
function visualState(u,g){let st=states.get(u);
 if(!st){st={x:u.x,y:u.y,ax:0,ay:0,dir:Number.isFinite(u.angle)?facingFromWorld(Math.cos(u.angle),Math.sin(u.angle)):1,phase:((u.id||0)*.37)%1};states.set(u,st);}
 const dx=u.x-st.x,dy=u.y-st.y,d=Math.hypot(dx,dy);st.x=u.x;st.y=u.y;if(d>1.5)return st;// teleports (boarding etc.)
 let target=u.target!=null&&g&&typeof g.entity==='function'?g.entity(u.target):null;if(target&&!(target.hp>0))target=null;
 if(target&&((u.attackAnim||0)>0||(!u.moving&&Math.hypot(target.x-u.x,target.y-u.y)<7))){st.dir=facingFromWorld(target.x-u.x,target.y-u.y);st.ax=st.ay=0;}
 else{st.ax+=dx;st.ay+=dy;if(Math.hypot(st.ax,st.ay)>.05){st.dir=facingFromWorld(st.ax,st.ay);st.ax=st.ay=0;}}
 st.phase=(st.phase+d/(isElephant(u.kind)?1.3:(REG.get(u.kind)?.stride||.72)))%1;return st;}
function poseOf(u,g,st){const hero=isHero(u.kind),time=(g&&g.time)||0,id=u.id||0;
 if((u.attackAnim||0)>0){const t=clamp(1-u.attackAnim/.38,0,.999);return{action:'attack',frame:Math.floor(t*FRAMES.attack)};}
 if(hero&&(u.gestureAnim||0)>0)return{action:'cmd',frame:Math.floor(time*7)%FRAMES.cmd};
 if((u.repairing||u.fishing&&u.fishing.phase==='fish')&&!u.moving)return{action:'work',frame:Math.floor(((time*1.6+id*.13)%1)*FRAMES.work)};
 if(u.kind==='worker'&&u.work&&u.work.phase==='harvest'&&!u.moving)return{action:'work',frame:Math.floor(((time*1.6+id*.13)%1)*FRAMES.work)};
 if(u.moving)return{action:'walk',frame:Math.floor((st?st.phase:((time*1.9+id*.37)%1))*FRAMES.walk)%FRAMES.walk};
 return{action:'idle',frame:Math.floor(((time*.45+id*.29)%1)*FRAMES.idle)};}
// ---------- 2.5D puppet rig ----------
// P(f,side,up): f = forward, side = character's right, up = height (all in body units).
function rig(dir,s){const a=dir*Math.PI/4,ca=Math.cos(a),sa=Math.sin(a);return{sa,ca,P:(f,sd,up)=>({x:(f*ca-sd*sa)*s,y:((f*sa+sd*ca)*.5-up)*s,z:f*sa+sd*ca})};}
function hull(pts){const p=pts.slice().sort((a,b)=>a.x-b.x||a.y-b.y);if(p.length<3)return p;const cr=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lo=[],up=[];for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}up.pop();lo.pop();return lo.concat(up);}
function fillPoly(c,pts,fill,stroke,w=1){if(!pts.length)return;c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function seg(c,a,b,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
function blob(c,p,rx,ry,color,stroke){c.beginPath();c.ellipse(p.x,p.y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
// Ring of points around a vertical axis at height `up` (used for hats, belts, helmets).
const ring=(P,f,sd,up,r,n=12,ry=r)=>Array.from({length:n},(_,i)=>{const t=i/n*TAU;return P(f+Math.cos(t)*r,sd+Math.sin(t)*ry,up);});
// Disc facing forward (shields): circle in the side/up plane.
const disc=(P,f,sd,up,r,n=14)=>Array.from({length:n},(_,i)=>{const t=i/n*TAU;return P(f,sd+Math.cos(t)*r,up+Math.sin(t)*r);});
const shadeHex=(hex,k)=>{const n=parseInt(hex.slice(1,7),16);const r=clamp(((n>>16)&255)*k,0,255)|0,g=clamp(((n>>8)&255)*k,0,255)|0,b=clamp((n&255)*k,0,255)|0;return`rgb(${r},${g},${b})`;};
// Kit per unit type: stylised 10th-century Đại Việt — brown/indigo cloth, nón lá, rattan helmets, lamellar (giáp phiến), round shields.
function kit(kind,team,look,variant,style,gen){const uk=kind;kind=archOf(kind);const k={skin:'#d6ad83',tunic:'#8f7148',pants:'#4d4434',hem:.24,hat:'scarf',hatColor:team,weapon:'machete',armor:null,shield:null,quiver:false,belt:team,cape:null,banner:false,scale:1,beard:null};
 switch(kind){
  case'worker':Object.assign(k,{tunic:['#8f6a45','#9c8a68','#7a5c41'][variant%3],hat:'nonla',hatColor:'#d6c68b',weapon:'tool',belt:'#6a5236'});break;
  case'scholar':Object.assign(k,{tunic:'#4b6276',pants:'#33414d',hem:.04,hat:'khan',hatColor:'#24292b',weapon:'scroll',belt:team});break;
  case'militia':Object.assign(k,{tunic:'#9a7a4a',pants:'#5a4b36',hat:'scarf',weapon:'machete'});break;
  case'pike':Object.assign(k,{tunic:'#86683f',hat:'rattan',hatColor:'#b69a5c',weapon:'halberd'});break;
  case'guard':Object.assign(k,{tunic:'#58686a',pants:'#3f4a48',hat:'helm',hatColor:'#8b9f9c',weapon:'sword',armor:['#b3bba9','#56696a'],shield:'round'});break;
  case'crossbow':Object.assign(k,{tunic:'#76653f',hat:'cap',weapon:'crossbow',quiver:true});break;
  case'archer':Object.assign(k,{tunic:'#7f6a44',hat:'scarf',weapon:'bow',quiver:true});break;
  case'swordsman':Object.assign(k,{tunic:'#6a573a',hat:'rattan',hatColor:'#9e8350',weapon:'saber',armor:['#c09a5c','#6b5636']});break;
  case'skirmisher':Object.assign(k,{tunic:'#8a7550',hat:'scarf',weapon:'javelin',shield:'buckler'});break;
  case'dinh':case'tran':case'lehoan':case'nguyenbac':{const L=look||{},G=gen||{},S=style||{};Object.assign(k,{scale:1.25,skin:L.skin||'#d9a477',tunic:L.coat||team,pants:shadeHex(L.secondary||'#536a6b',.75),hem:.12,hat:'hero:'+(G.headgear||L.hat||'helmet'),hatColor:L.accent||'#d8c07a',hatSecond:L.secondary||'#536a6b',weapon:'hero:'+(G.weapon||L.weapon||'sword'),armor:S.armor?[L.accent||S.armor[0],S.armor[1]]:[L.accent||'#d8c07a',L.secondary||'#536a6b'],cape:(S.banner&&S.banner.color)||L.secondary||'#536a6b',banner:true,beard:G.beard||L.beard||null,hair:G.hair||'topknot',emblem:L.emblem||'將',accent:L.accent||'#d8c07a',hero:true,flagStyle:S.banner||null,shield:G.shieldBearer?'round':null,shieldPattern:G.shieldBearer&&S.shield?S.shield:null,pauldrons:true});
   if(uk==='lehoan'){k.hat='hero:redPlume';k.hatColor='#c8323a';k.weapon='hero:greatsaber';k.emblem='\u4ee4';}
   if(uk==='nguyenbac'){k.hat='hero:conical';k.hatColor='#d8c07a';k.weapon='hero:bow';k.quiver=true;k.emblem='\u5317';}
   break;}
 }
 // faction uniform: tunic/pants palette, headgear, armour plates, shield pattern
 if(style&&MILITARY.has(kind)){k.style=style;k.tunic=style.tunic;k.pants=style.pants;k.hat='f:'+style.helm;k.hatColor=style.helmColor;if(k.armor||kind==='pike'||kind==='crossbow')k.armor=style.armor.slice();if(k.shield)k.shieldPattern=style.shield;k.flagStyle=style.banner;}
 if(MILITARY.has(kind)&&!k.hero){const _v=[.92,1,1.08][variant%3]||1;if(typeof k.tunic==='string'&&k.tunic.startsWith('#'))k.tunic=shadeHex(k.tunic,_v);}
 if(ARCH[uk]){k.unique=true;k.scale=1.06;k.flag=true;k.pauldrons=true;const S=style||{armor:['#c9b273','#4a4a3a']};
  switch(uk){
   case'divineCrossbow':k.scale=1.14;k.weapon='divineCrossbow';k.armor=S.armor.slice();k.hat='f:fullHelm';k.hatColor=S.armor[0];k.cape=S.banner?.color||k.pants;k.quiver=true;break;
   case'reedBanner':k.flag='big';k.hatColor='#e9d58f';break;
   case'lateriteBow':k.armor=['#b5653c','#5a2e22'];k.hat='f:flat';k.hatColor='#7a3b30';break;
   case'seaRaider':k.shield='buckler';k.shieldPattern=S.shield;k.armor=null;break;
   case'halberdier':k.weapon='halberd';k.longWeapon=1.25;k.armor=S.armor.slice();break;
   case'ironGuard':k.shield='tower';k.shieldPattern=S.shield;k.armor=['#a7b1b3','#39454b'];k.hatColor='#9aa6a8';break;
   case'drillSpear':k.armor=S.armor.slice();k.shield='buckler';k.shieldPattern=S.shield;break;
   case'longbow':k.bigBow=true;k.armor=S.armor.slice();break;
   case'greatsword':k.weapon='greatsaber';k.armor=S.armor.slice();break;
   case'peasantLevy':k.weapon='halberd';k.longWeapon=.85;k.shield='buckler';k.shieldPattern=S.shield;break;
   case'escortGuard':k.shield='round';k.shieldPattern=S.shield;k.armor=S.armor.slice();break;
   case'tigerGuard':k.shield='round';k.shieldPattern=S.shield;k.armor=['#e8e2d0','#2a2420'];k.cape='#d98a3a';break;
  }}
 return k;}
// Pose -> joint targets. Returns hand positions, weapon angle (radians above forward), etc.
function pose(kind,action,frame,k){const n=FRAMES[action]||1,t=(frame+.5)/n,walk=action==='walk',idle=action==='idle',atk=action==='attack',work=action==='work';
 // Chu ky buoc kieu AoE: sai chan rong, nhac got ro, nguoi nhun 2 nhip, tay danh nguoc pha.
 const sw=walk?Math.sin(t*TAU):0,bob=walk?Math.abs(Math.sin(t*TAU)):0;
 const o={hip:.44+(walk?(.02+bob*.06):0)+(idle?Math.sin(t*TAU)*.015:0),lean:walk?.08:0,lunge:0,sway:idle?Math.sin(t*TAU)*.022:0,
  headBob:walk?Math.sin(t*TAU*2+1.3)*.022:0,
  footL:{f:sw*.24,up:Math.max(0,-Math.cos(t*TAU))*.11},footR:{f:-sw*.24,up:Math.max(0,Math.cos(t*TAU))*.11},
  handL:{f:-sw*.17+.02,sd:-.2,up:.45-bob*.035},handR:{f:sw*.17+.06,sd:.2,up:.46-bob*.035},
  wAng:walk?1.02:(idle?.95+Math.sin(t*TAU+2)*.06:1.35),strike:0,thrown:false,wind:0,rec:0};
 // Don danh 3 pha: lay da (gio vu khi, nga nguoi) -> bo (lao toi) -> thu ve.
 if(atk){const wind=t<.32?Math.sin(t/.32*Math.PI/2):0,strk=t<.32?0:t<.62?Math.sin((t-.32)/.30*Math.PI):0,rec=t<.62?0:(t-.62)/.38;
  o.wind=wind;o.rec=rec;o.strike=strk;o.lean=-.10*wind+.17*strk;o.lunge=.22*strk;o.hip=.44-.04*wind-.012*strk;o.sway=0;o.headBob=0;}
 const strike=o.strike,wind=o.wind,w=k.weapon;
 if(w==='halberd'||w==='hero:spear'||w==='hero:staff'||w==='hero:halberd'||w==='greatsaber'||w==='hero:greatsaber'){o.handR={f:.1+o.lunge*.9-wind*.14,sd:.15,up:.5+strike*.1+wind*.06};o.handL={f:.04+o.lunge*.6,sd:.04,up:.52+wind*.04};o.wAng=1.35+wind*.4-strike*1.6;}
 else if(w==='machete'||w==='sword'||w==='saber'||w==='hero:sword'||w==='hero:axe'||w==='tool'){o.handR={f:.12+o.lunge*.8-wind*.12,sd:.16,up:.46+wind*.45-strike*.12};o.wAng=1.0+wind*1.05-strike*1.95;
  if(work){const ch=Math.sin(t*TAU);o.handR={f:.2,sd:.1,up:.62+ch*.3};o.handL={f:.18,sd:-.02,up:.56+ch*.24};o.wAng=ch*1.35+.2;o.lean=.1;o.hip=.44-Math.max(0,ch)*.035;}}
 else if(w==='bow'||w==='hero:bow'){const ready=atk||idle,draw=atk?(t<.5?t/.5:(t<.62?1:Math.max(0,1-(t-.62)*5))):0;o.handL={f:ready?.34:.12,sd:ready?.02:-.17,up:ready?.66:.45};o.handR={f:atk?mixN(.28,-.04,draw):.1,sd:.12,up:ready?.66:.46};o.draw=draw;o.lean=atk?-.04*draw:0;}
 else if(w==='crossbow'||w==='divineCrossbow'){o.handL={f:w==='divineCrossbow'?.39:.34,sd:-.03,up:.58};o.handR={f:.12-strike*(w==='divineCrossbow'?.12:.07),sd:.08,up:.58-strike*.03};o.recoil=strike*(w==='divineCrossbow'?.12:.07);o.lean=-strike*.06;o.hip=.44-strike*.015;}
 else if(w==='javelin'){if(atk){o.handR={f:-.26*wind+.4*strike,sd:.17,up:.55+.32*wind-.18*strike};o.wAng=.35+wind*1.25-strike*1.6;o.thrown=t>.6;o.handL={f:.12+o.lunge*.4,sd:-.17,up:.52};}else{o.handR={f:.08,sd:.17,up:.5};o.wAng=1.3;o.handL={f:.12,sd:-.17,up:.52};}}
 else if(w==='scroll'||w==='hero:scroll'||w==='hero:fan'){o.handR={f:.2,sd:.08,up:.56+strike*.15};o.handL={f:.2,sd:-.08,up:.55};}
 if(action==='cmd'){o.handR={f:.18,sd:.2,up:1.0+Math.sin(t*TAU)*.06};o.wAng=1.5;o.lean=.03;}
 return o;}
function headgear(c,P,k,top,r,front){const hat=k.hat,col=k.hatColor,dark=shadeHex(col.startsWith('#')?col:'#888888',.62);
 if(hat==='nonla'){const base=ring(P,0,0,top-.02,.31,16),apex=P(0,0,top+.19);fillPoly(c,hull([...base,apex]),col,'#6d5d36',1);fillPoly(c,base,null,dark,1);}
 else if(hat==='rattan'||hat==='hero:helmet'){const b=ring(P,0,0,top-.04,r*1.18,12),tp=ring(P,0,0,top+.05,r*.75,10);fillPoly(c,hull([...b,...tp,P(0,0,top+.09)]),col,dark,1);for(let i=0;i<3;i++)fillPoly(c,ring(P,0,0,top-.02+i*.035,r*(1.12-i*.12),12),null,dark,.6);}
 else if(hat==='helm'){const b=ring(P,0,0,top-.05,r*1.15,12);fillPoly(c,hull([...b,...ring(P,0,0,top+.06,r*.7,10),P(0,0,top+.1)]),col,dark,1);seg(c,P(0,0,top+.09),P(-.04,0,top+.24),k.belt,2.2);}
 else if(hat==='cap'){fillPoly(c,hull([...ring(P,0,0,top-.03,r*1.1,12),...ring(P,0,0,top+.04,r*.9,12)]),k.belt,'#3a3222',1);}
 else if(hat==='khan'){fillPoly(c,hull([...ring(P,0,0,top-.04,r*1.08,12),...ring(P,0,0,top+.1,r*.95,12)]),col,'#0c0e0f',1);}
 else if(hat==='scarf'){fillPoly(c,ring(P,0,0,top-.02,r*1.08,12),null,col,Math.max(1.5,r*20*.18));const tail=P(-r*1.1,0,top-.02);seg(c,tail,P(-r*1.9,.02,top-.14),col,1.6);}
 else if(hat.startsWith('f:'))factionHelm(c,P,k,hat.slice(2),col,dark,top,r);
 else if(hat.startsWith('hero:')){const h=hat.slice(5),sec=k.hatSecond;const helm=()=>fillPoly(c,hull([...ring(P,0,0,top-.04,r*1.15,12),...ring(P,0,0,top+.06,r*.75,10),P(0,0,top+.1)]),col,sec,1);
  if(h==='crown'){helm();for(let i=0;i<5;i++){const a=(i/5)*TAU;seg(c,P(Math.cos(a)*r,Math.sin(a)*r,top+.05),P(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05,top+.15),col,1.6);}}
  else if(h==='winged'){helm();for(const sd of[-1,1])fillPoly(c,[P(0,sd*r,top+.02),P(-.06,sd*(r+.2),top+.12),P(-.02,sd*(r+.1),top-.04)],k.tunic,col,1);}
  else if(h==='turban'){for(let i=0;i<3;i++)fillPoly(c,ring(P,0,0,top-.02+i*.04,r*(1.15-i*.1),12),i%2?col:sec,shadeHex('#555555',1),.5);}
  else if(h==='plume'){helm();fillPoly(c,[P(-.03,0,top+.08),P(-.12,0,top+.3),P(.03,0,top+.1)],k.tunic,col,1);}
  else if(h==='tiger'){factionHelm(c,P,k,'tigerHood','#d9913a','#6b3a12',top,r*1.08);}
  else if(h==='seaband'){factionHelm(c,P,k,'bandana',col,dark,top,r);seg(c,P(-r,0,top),P(-r*2.6,.05,top-.22),sec,2.2);seg(c,P(-r,0,top),P(-r*2.3,-.06,top-.26),col,1.8);blob(c,P(r*.95,0,top+.01),r*20*.06,r*20*.06,'#f2ecd6');}
  else if(h==='greatHelm'){factionHelm(c,P,k,'fullHelm',col,sec,top,r*1.08);blob(c,P(0,0,top+.13),r*20*.08,r*20*.08,'#c4473a');}
  else if(h==='wingedCap'){factionHelm(c,P,k,'official','#22292d','#0c0e0f',top,r);for(const sd of[-1,1])seg(c,P(-.04,sd*r,top+.06),P(-.04,sd*(r+.26),top+.09),'#22292d',3);}
  else if(h==='feather'){fillPoly(c,ring(P,0,0,top-.02,r*1.08,12),null,col,2.6);for(const sd of[-.03,.03]){const a=P(-.02,sd,top+.04),b=P(-.18,sd*3,top+.42),m=P(.04,sd*2,top+.3);c.strokeStyle='#e7c46b';c.lineWidth=2;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(m.x,m.y,b.x,b.y);c.stroke();}}
  else if(h==='redPlume'){helm();for(let i=-2;i<=2;i++)seg(c,P(0,0,top+.1),P(-.12+i*.02,i*.03,top+.28-Math.abs(i)*.03),'#c8323a',2);}
  else if(h==='conical'){const base=ring(P,0,0,top-.02,.25,16);fillPoly(c,hull([...base,P(0,0,top+.18)]),col,sec,1);}
  else if(h==='scholar'){fillPoly(c,hull([...ring(P,0,0,top-.04,r*1.08,12),...ring(P,0,0,top+.12,r,12)]),sec,col,1);seg(c,P(-.02,-.17,top+.08),P(-.02,.17,top+.08),sec,2);}
  else if(h==='headband'){fillPoly(c,ring(P,0,0,top-.02,r*1.08,12),null,col,2.5);}
  else helm();}}
// Soldier headgear by faction (12 distinct silhouettes).
function factionHelm(c,P,k,h,col,dark,top,r){const cyl=(lo,hi,r1,r2)=>fillPoly(c,hull([...ring(P,0,0,lo,r1,12),...ring(P,0,0,hi,r2,12)]),col,dark,1);
 if(h==='reed'){const base=ring(P,0,0,top-.03,r*1.3,14);fillPoly(c,hull([...base,P(0,0,top+.12)]),col,dark,1);for(const sd of[-.03,.03])seg(c,P(-.01,sd,top+.11),P(-.08,sd*2.5,top+.32),'#efe6b6',1.4);}
 else if(h==='flat')cyl(top-.03,top+.05,r*1.22,r*1.22);
 else if(h==='rattanWide'){const brim=ring(P,0,0,top-.03,.3,16);fillPoly(c,brim,col,dark,1);fillPoly(c,hull([...ring(P,0,0,top-.02,r*1.05,12),P(0,0,top+.1)]),shadeHex(col,1.1),dark,1);for(let i=0;i<3;i++)fillPoly(c,ring(P,0,0,top-.03,.3-i*.06,14),null,dark,.5);}
 else if(h==='bandana'){fillPoly(c,ring(P,0,0,top-.02,r*1.08,12),null,col,2.4);blob(c,P(-.03,0,top+.06),r*20*.07,r*20*.06,'#2b2620');seg(c,P(-r,0,top-.02),P(-r*1.9,.04,top-.12),col,1.5);}
 else if(h==='pointed'){fillPoly(c,hull([...ring(P,0,0,top-.05,r*1.15,12),P(0,0,top+.22)]),col,dark,1);}
 else if(h==='fullHelm'){fillPoly(c,hull([...ring(P,0,0,top-.1,r*1.22,12),...ring(P,0,0,top+.06,r*.8,10),P(0,0,top+.1)]),col,dark,1);fillPoly(c,ring(P,0,0,top-.02,r*1.18,12),null,dark,1);seg(c,P(r*1.05,0,top-.02),P(r*1.1,0,top-.1),dark,1.5);}
 else if(h==='official'){cyl(top-.04,top+.08,r*1.05,r*.95);fillPoly(c,hull([...ring(P,-.03,0,top+.06,r*.55,8),P(-.03,0,top+.13)]),col,dark,1);for(const sd of[-1,1])seg(c,P(-.06,sd*r,top+.02),P(-.08,sd*(r+.08),top-.06),col,2);}
 else if(h==='hood'){fillPoly(c,hull([...ring(P,-.02,0,top+.05,r*.95,12),...ring(P,-.06,0,top-.14,r*1.15,12)]),col,dark,1);}
 else if(h==='crestHelm'){fillPoly(c,hull([...ring(P,0,0,top-.05,r*1.15,12),...ring(P,0,0,top+.06,r*.75,10)]),col,dark,1);seg(c,P(r*.9,0,top+.06),P(-r*1.1,0,top+.08),'#e2b84f',2.6);seg(c,P(r*.6,0,top+.12),P(-r*.9,0,top+.13),'#e2b84f',1.4);}
 else if(h==='nonlaSmall'){const base=ring(P,0,0,top-.02,.24,16);fillPoly(c,hull([...base,P(0,0,top+.15)]),col,'#6d5d36',1);fillPoly(c,base,null,dark,1);}
 else if(h==='turbanCap'){for(let i=0;i<3;i++)fillPoly(c,ring(P,0,0,top-.03+i*.04,r*(1.18-i*.1),12),i%2?shadeHex(col,1.35):col,dark,.6);blob(c,P(0,0,top+.1),r*20*.05,r*20*.05,'#d9c36c');}
 else if(h==='tigerHood'){fillPoly(c,hull([...ring(P,-.02,0,top+.05,r*1.0,12),...ring(P,-.05,0,top-.12,r*1.18,12)]),col,dark,1);for(const sd of[-1,1])fillPoly(c,[P(0,sd*r*.6,top+.06),P(-.02,sd*r*.9,top+.17),P(-.03,sd*r*1.05,top+.04)],col,dark,1);for(let i=0;i<3;i++)seg(c,P(-.06+i*.03,-r*.5,top+.04-i*.02),P(-.06+i*.03,r*.5,top+.04-i*.02),'#2a2420',1.1);}
 else cyl(top-.04,top+.06,r*1.1,r*.8);}
// Shield face patterns.
function shieldFace(c,T,sp,r2,k,s,tower){const pat=k.shieldPattern,col=pat?pat.colors:['#8a6b4b','#c4b48c'],sh=tower?1.45:1,Q=(a,b)=>T(sp.f+.004,sp.sd+a*r2,sp.up+b*r2*sh),lw=Math.max(1.2,s*.03);
 const outline=tower?[Q(-1,-1),Q(1,-1),Q(1,1),Q(-1,1)]:disc(T,sp.f,sp.sd,sp.up,r2);fillPoly(c,outline,col[0],'#2f281c',1);if(!pat){fillPoly(c,disc(T,sp.f+.002,sp.sd,sp.up,r2*.7),null,col[1],1);return;}
 const p=pat.pattern,b=col[1];
 if(p==='cross'){seg(c,Q(-.85,0),Q(.85,0),b,lw*1.4);seg(c,Q(0,-.85),Q(0,.85),b,lw*1.4);}
 else if(p==='split'){fillPoly(c,tower?[Q(0,-1),Q(1,-1),Q(1,1),Q(0,1)]:Array.from({length:8},(_,i)=>{const t=-Math.PI/2+i/7*Math.PI;return Q(Math.cos(t),Math.sin(t));}),b);}
 else if(p==='dots'){for(const [a,d] of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45],[0,0]])blob(c,Q(a,d),s*.022,s*.022,b);}
 else if(p==='wave'){for(const off of[-.35,.25]){c.strokeStyle=b;c.lineWidth=lw;c.beginPath();for(let i=0;i<=8;i++){const q=Q(-.85+i*.2125,off+Math.sin(i*1.4)*.18);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}c.stroke();}}
 else if(p==='diamond')fillPoly(c,[Q(0,.75),Q(.6,0),Q(0,-.75),Q(-.6,0)],b);
 else if(p==='bars'){for(const d of[-.5,0,.5])seg(c,Q(-.8,d),Q(.8,d),b,lw*1.2);}
 else if(p==='ring'){fillPoly(c,Array.from({length:12},(_,i)=>{const t=i/12*TAU;return Q(Math.cos(t)*.58,Math.sin(t)*.58);}),null,b,lw*1.4);}
 else if(p==='sun'){for(let i=0;i<8;i++){const t=i/8*TAU;seg(c,Q(Math.cos(t)*.2,Math.sin(t)*.2),Q(Math.cos(t)*.78,Math.sin(t)*.78),b,lw);}blob(c,Q(0,0),s*.024,s*.024,b);}
 else if(p==='tiger'){for(const d of[-.5,0,.5])seg(c,Q(-.7,d-.2),Q(.6,d+.15),b,lw*1.3);blob(c,Q(0,.05),s*.015,s*.015,'#c8323a');}
 blob(c,Q(0,0),s*.018,s*.018,k.belt);}
// Banner (cờ) — shape, colour, edge and emblem come from the faction style.
function bannerFlag(c,P,base,height,fs,team,k,s,frame,action,big){const sd=-.06,f0=-.13,h0=base,h1=base+height,atk=action==='attack'?1:0,flut=Math.sin(frame*(1.3+atk*2.4)+(action==='walk'?2:0))*(.035+atk*.06),w=big?.36:.26;const st=fs||{shape:'square',color:team,edge:k.accent||'#e0c27a'};
 seg(c,P(f0,sd,h0),P(f0,sd,h1+.04),'#5a4128',Math.max(1.3,s*.028));const top=h1,len=st.shape==='long'?.34:.22;let pts;
 if(st.shape==='swallow')pts=[P(f0,sd,top),P(f0-w,sd+flut,top),P(f0-w*.72,sd,top-len*.5),P(f0-w,sd-flut,top-len),P(f0,sd,top-len)];
 else if(st.shape==='triangle')pts=[P(f0,sd,top),P(f0-w*1.05,sd+flut,top-len*.45),P(f0,sd,top-len)];
 else if(st.shape==='long')pts=[P(f0,sd,top),P(f0-w*.62,sd+flut,top),P(f0-w*.66,sd-flut,top-len),P(f0,sd,top-len)];
 else pts=[P(f0,sd,top),P(f0-w,sd+flut,top),P(f0-w,sd-flut,top-len),P(f0,sd,top-len)];
 fillPoly(c,pts,st.color,st.edge,Math.max(1,s*.02));seg(c,P(f0,sd,top),P(f0,sd,top-len),team,Math.max(1.4,s*.035));
 const em=k.emblem||st.emblem;if(em&&s>=22){const e=P(f0-w*.45,sd,top-len*.48);c.fillStyle=st.edge;c.font=`bold ${Math.max(6,s*(big?.14:.1))|0}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(em,e.x,e.y);}}
// Mounts (horse / water buffalo) as puppets in the same rig, unlifted.
function mountOps(c,P,add,kind,color,team,action,frame,s,sa,ca,style){const n=FRAMES[action]||1,t=(frame+.5)/n,walk=action==='walk',buf=kind==='buffalo',base=color||(buf?'#4b4945':'#8a5a36'),dark=shadeHex(base,.62),lite=shadeHex(base,1.25),Z=z=>-.7+z*.25;
 const bodyUp=buf?.5:.58,br=buf?.21:.17,len=buf?.42:.44,legW=Math.max(2.4,s*(buf?.11:.075));
 for(const [f,sd,ph] of[[len*.8,-.1,0],[len*.8,.1,.5],[-len*.85,-.1,.5],[-len*.85,.1,0]]){const sw=walk?Math.sin((t+ph)*TAU)*.14:0,top=P(f,sd,bodyUp-.05),knee=P(f+sw*.5,sd,bodyUp*.45),foot=P(f+sw,sd,walk?Math.max(0,Math.cos((t+ph)*TAU))*.05:0);add(Z(foot.z)+(foot.z>0?.02:-.2),()=>{seg(c,top,knee,foot.z>0?base:dark,legW);seg(c,knee,foot,foot.z>0?base:dark,legW*.8);blob(c,foot,s*.04,s*.025,'#2a241e');});}
 add(Z(0)-.1,()=>{for(let i=0;i<5;i++){const f=-len+i*len/2,p=P(f,0,bodyUp+Math.sin(i/4*Math.PI)*.02),r=br-(i===0||i===4?.03:0);blob(c,p,s*r,s*r*.9,base,dark);}
  // tail
  const tb=P(-len-.08,0,bodyUp+.04);seg(c,tb,P(-len-.16,0,bodyUp-.2+(walk?Math.sin(t*TAU)*.03:0)),buf?dark:'#2a2018',Math.max(1.6,s*(buf?.03:.05)));
  // saddle cloth in faction colours + owner trim
  const cl=[];for(const f of[-.18,.16])for(const sd of[-1,1]){cl.push(P(f,sd*(br+.01),bodyUp+br*.7));cl.push(P(f,sd*(br+.02),bodyUp-br*.35));}fillPoly(c,hull(cl),(style&&style.banner&&style.banner.color)||team,team,Math.max(1.2,s*.03));});
 const nk=P(len*.95,0,bodyUp+(buf?.04:.12)),hd=P(len+(buf?.2:.26),0,bodyUp+(buf?.02:.3)),hz=Z(P(.6,0,0).z);
 add(hz-.05+(sa<0?-.3:0),()=>{seg(c,nk,hd,base,Math.max(3,s*(buf?.2:.14)));if(!buf)for(let i=0;i<4;i++){const q=P(len*.95+i*.07,0,bodyUp+.18+i*.04);blob(c,q,s*.025,s*.04,'#2a2018');}
  const muzzle=P(len+(buf?.3:.38),0,bodyUp+(buf?-.04:.22));seg(c,hd,muzzle,buf?shadeHex(base,.85):base,Math.max(2.6,s*(buf?.13:.09)));blob(c,hd,s*(buf?.11:.075),s*(buf?.1:.07),lite,dark);
  if(buf){for(const sd of[-1,1]){const a=P(len+.18,sd*.07,bodyUp+.1),m=P(len+.12,sd*.24,bodyUp+.18),b=P(len+.04,sd*.2,bodyUp+.26);c.strokeStyle='#d8cdb0';c.lineWidth=Math.max(1.6,s*.035);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(m.x,m.y,b.x,b.y);c.stroke();}}
  else{for(const sd of[-1,1])seg(c,P(len+.24,sd*.04,bodyUp+.36),P(len+.22,sd*.05,bodyUp+.42),dark,1.4);seg(c,P(len+.3,0,bodyUp+.26),P(len*.4,0,bodyUp+.2),'#3a2a1c',.8);}
  if(sa>-.3){const e=P(len+(buf?.24:.3),ca>0?.05:-.05,bodyUp+(buf?.08:.32));blob(c,e,s*.014,s*.014,'#141210');}});}
function weaponDraw(c,P,k,o,front,s){const w=k.weapon,h=o.handR,ang=o.wAng,dirAt=(len,a,base)=>({f:base.f+Math.cos(a)*len,up:base.up+Math.sin(a)*len});
 const shaft=(len,back,col,width)=>{const a=dirAt(-back,ang,h),b=dirAt(len,ang,h);seg(c,P(a.f,h.sd,a.up),P(b.f,h.sd,b.up),col,width);return P(b.f,h.sd,b.up);};
 if(w==='halberd'||w==='hero:spear'||w==='hero:staff'||w==='hero:halberd'){const len=(w==='halberd'?.95:w==='hero:halberd'?1.0:.8)*(k.longWeapon||1),tip=shaft(len,.42,w==='hero:staff'?k.hatSecond:'#b99a62',Math.max(1.4,s*.035)),tq=dirAt(len,ang,h);
  if(w!=='hero:staff'){const tip2=dirAt(len+.14,ang,h);fillPoly(c,[P(tq.f,h.sd-.03,tq.up),P(tip2.f,h.sd,tip2.up),P(tq.f,h.sd+.03,tq.up)],'#d7ded3','#5f6f6a',.8);if(w==='halberd'||w==='hero:halberd'){const cr=dirAt(len-.08,ang,h);fillPoly(c,[P(cr.f,h.sd,cr.up),P(cr.f-Math.sin(ang)*.12,h.sd,cr.up+Math.cos(ang)*.12),P(cr.f+Math.cos(ang)*.1,h.sd,cr.up+Math.sin(ang)*.1)],'#c9d2c8','#5f6f6a',.8);seg(c,P(cr.f,h.sd,cr.up),P(cr.f+.02,h.sd,cr.up-.06),k.belt,2);}}else blob(c,tip,s*.04,s*.04,k.accent);}
 else if(w==='greatsaber'||w==='hero:greatsaber'){const len=w==='hero:greatsaber'?.62:.55;shaft(len,.3,'#5b3a22',Math.max(1.8,s*.045));const a=dirAt(len,ang,h),b=dirAt(len+.3,ang,h),bk=dirAt(len+.18,ang+.35,h);fillPoly(c,[P(a.f,h.sd,a.up),P(bk.f,h.sd,bk.up),P(b.f,h.sd,b.up),P(dirAt(len+.08,ang-.12,h).f,h.sd,dirAt(len+.08,ang-.12,h).up)],'#e1e7de','#55615c',1);blob(c,P(a.f,h.sd,a.up),s*.03,s*.03,k.accent||'#c8323a');}
 else if(w==='machete'||w==='sword'||w==='saber'||w==='hero:sword'){const len=w==='machete'?.3:w==='saber'?.46:.42;seg(c,P(h.f,h.sd,h.up),P(dirAt(-.07,ang,h).f,h.sd,dirAt(-.07,ang,h).up),'#5b4630',Math.max(2,s*.05));const e=dirAt(len,ang,h),m=dirAt(len*.55,ang+(w==='saber'?.18:0),h);c.strokeStyle='#dfe6dc';c.lineWidth=Math.max(1.6,s*(w==='machete'?.06:.045));c.lineCap='round';const a=P(h.f,h.sd,h.up),mm=P(m.f,h.sd,m.up),b=P(e.f,h.sd,e.up);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(mm.x,mm.y,b.x,b.y);c.stroke();const g1=dirAt(.03,ang+1.57,h),g2=dirAt(.03,ang-1.57,h);seg(c,P(g1.f,h.sd,g1.up),P(g2.f,h.sd,g2.up),k.armor?k.armor[0]:'#b39a62',2);}
 else if(w==='hero:axe'||(w==='tool'&&(k.toolKind==='wood'))){const head=dirAt(.42,ang,h);shaft(.42,.08,'#8c6a40',Math.max(1.6,s*.04));fillPoly(c,[P(head.f,h.sd,head.up),P(head.f-Math.sin(ang)*.14+Math.cos(ang)*.02,h.sd,head.up+Math.cos(ang)*.14),P(head.f-Math.sin(ang)*.12-Math.cos(ang)*.1,h.sd,head.up+Math.cos(ang)*.12-Math.sin(ang)*.1)],'#cfd6d0','#4e5a56',.8);}
 else if(w==='tool'){const head=dirAt(.4,ang,h);shaft(.4,.06,'#8c6a40',Math.max(1.6,s*.04));const tk=k.toolKind;if(tk==='food'){c.strokeStyle='#d5dbd2';c.lineWidth=Math.max(1.4,s*.035);const a=P(head.f,h.sd,head.up),b=P(head.f-Math.sin(ang)*.16,h.sd,head.up+Math.cos(ang)*.16);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(b.x+(b.x-a.x)*.4,a.y,b.x,b.y);c.stroke();}else seg(c,P(head.f-Math.sin(ang)*.12,h.sd,head.up+Math.cos(ang)*.12),P(head.f+Math.sin(ang)*.12,h.sd,head.up-Math.cos(ang)*.12),'#c3ccc6',Math.max(1.8,s*.045));}
 else if(w==='bow'||w==='hero:bow'){const L=o.handL,bl=k.bigBow?.42:.3,top=P(L.f-.04,L.sd,L.up+bl),bot=P(L.f-.04,L.sd,L.up-bl),mid=P(L.f+.08,L.sd,L.up),pull=o.draw?P(o.handR.f,o.handR.sd*.3,o.handR.up):P(L.f-.06,L.sd,L.up);c.strokeStyle=w==='hero:bow'?k.accent:'#9c6f3c';c.lineWidth=Math.max(1.6,s*.04);c.lineCap='round';c.beginPath();c.moveTo(top.x,top.y);c.quadraticCurveTo(mid.x+(mid.x-pull.x)*.4,mid.y,bot.x,bot.y);c.stroke();seg(c,top,pull,'#efe2bd',.8);seg(c,pull,bot,'#efe2bd',.8);if(o.draw)seg(c,pull,P(L.f+.18,L.sd*.6,L.up),'#d9d2b5',1.1);}
 else if(w==='divineCrossbow'){const r=o.recoil||0,wood='#79502c',gold=k.armor?.[0]||'#d6b64c',ivory='#e8dfbf',stockA=P(-.02-r,0,.57),stockB=P(.62-r,0,.61);seg(c,stockA,stockB,wood,Math.max(3.4,s*.085));seg(c,P(.57-r,-.31,.6),P(.57-r,.31,.6),gold,Math.max(2.4,s*.055));for(const sd of[-1,1]){const tip=P(.48-r,sd*.34,.62),mid=P(.66-r,sd*.2,.66),lock=P(.25-r,0,.62);c.strokeStyle=ivory;c.lineWidth=Math.max(2,s*.045);c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mid.x,mid.y,lock.x,lock.y);c.stroke();seg(c,tip,lock,'#f2e7c4',.9);}blob(c,P(.18-r,0,.62),s*.055,s*.055,gold,'#65431f');seg(c,P(.16-r,-.1,.53),P(.16-r,.1,.68),gold,Math.max(1.5,s*.035));seg(c,P(.28-r,0,.62),P(.78-r,0,.63),'#d9ddd4',Math.max(1,s*.022));}
 else if(w==='crossbow'){const r=o.recoil||0,a=P(.06-r,0,.58),b=P(.46-r,-.01,.6);seg(c,a,b,'#9b7646',Math.max(2.4,s*.06));seg(c,P(.42-r,-.2,.6),P(.42-r,.18,.6),'#c09a62',Math.max(1.6,s*.04));seg(c,P(.42-r,-.2,.6),P(.14-r,0,.6),'#eadfbf',.7);seg(c,P(.42-r,.18,.6),P(.14-r,0,.6),'#eadfbf',.7);}
 else if(w==='javelin'){if(!o.thrown){const a=dirAt(-.3,ang,h),b=dirAt(.42,ang,h);seg(c,P(a.f,h.sd,a.up),P(b.f,h.sd,b.up),'#c2a46c',Math.max(1.4,s*.032));blob(c,P(b.f,h.sd,b.up),s*.025,s*.025,'#d6ddd2');}}
 else if(w==='scroll'||w==='hero:scroll'){const a=P(o.handL.f,o.handL.sd,o.handL.up),b=P(o.handR.f,o.handR.sd,o.handR.up);seg(c,a,b,'#e4d6ac',Math.max(3,s*.09));seg(c,a,{x:a.x,y:a.y+s*.05},'#8a6f45',2);seg(c,b,{x:b.x,y:b.y+s*.05},'#8a6f45',2);}
 else if(w==='hero:fan'){const b=P(h.f,h.sd,h.up);fillPoly(c,[b,P(h.f+.12,h.sd-.1,h.up+.22),P(h.f+.2,h.sd+.08,h.up+.2)],'#ebe0bf',k.accent,1);}}
// Draw one infantry figure facing `dir` with feet at (0,0). s = pixels per body unit.
function drawInfantry(c,kind,dir,action,frame,team,s,opts={}){const k=kit(kind,team,opts.look,opts.variant||0,opts.style,opts.general);kind=archOf(kind);k.toolKind=opts.toolKind||'food';if(opts.flag&&MILITARY.has(kind))k.flag=k.flag||true;s*=k.scale*1.1;
 const mount=opts.mount&&opts.mount!=='elephant'?opts.mount:null,riding=!!opts.mount,lift=opts.lift!=null?opts.lift:mount==='buffalo'?.26:mount?.3:0;
 const R=rig(dir,s),sa=R.sa,ca=R.ca,P=lift?(f,sd,up)=>R.P(f,sd,up+lift):R.P,o=pose(kind,riding&&action==='walk'?'idle':action,frame,k),front=sa>-.25,ops=[];if(opts.hurt){o.lean-=.075;o.sway+=(ca>=0?-.035:.035);o.handR.up=Math.max(.36,o.handR.up-.06);}const lean=o.lean,sw=o.sway;
 const add=(z,fn)=>ops.push({z,fn});const hip=o.hip,neck=hip+.3,top=hip+.55+(o.headBob||0),r=.112;
 if(mount)mountOps(c,R.P,add,mount,opts.mountColor,team,action,frame,s,sa,ca,opts.style);
 const T=(f,sd,up)=>P(f+lean*(up-.3)/0.6+(o.lunge||0),sd+sw,up);
 // legs
 if(riding)for(const side of[-1,1]){const near=side*ca>.15,hipP=T(0,side*.09,hip),knee=T(.17,side*.2,hip-.04),foot=T(.1,side*.21,hip-.36);if(opts.mount==='elephant'&&!near&&Math.abs(ca)>.15)continue;add(near?-.2:-1.6,()=>{seg(c,hipP,knee,k.pants,Math.max(2.6,s*.11));seg(c,knee,foot,k.pants,Math.max(2.3,s*.09));blob(c,foot,s*.05,s*.035,'#3a2a1c');});}
 else for(const side of[-1,1]){const ft=side<0?o.footL:o.footR,kneeF=ft.f*.5+.05,hipP=T(0,side*.085,hip),knee=T(kneeF,side*.095,hip*.5+ft.up*.5),foot=P(ft.f,side*.1,ft.up),legCol=kind==='militia'||kind==='worker'?k.skin:k.pants,z=-.1+foot.z*.05;
  add(z,()=>{seg(c,hipP,knee,k.pants,Math.max(2.6,s*.11));seg(c,knee,foot,legCol,Math.max(2.3,s*.09));seg(c,hipP,knee,shadeHex(k.pants,.72),Math.max(.7,s*.022));seg(c,knee,foot,shadeHex(legCol,.76),Math.max(.65,s*.02));const ankle=P(ft.f,side*.1,ft.up+.035);seg(c,ankle,P(ft.f+.035,side*.1,ft.up+.035),'#3b2c20',Math.max(1,s*.028));blob(c,{x:foot.x+P(.04,0,0).x,y:foot.y+P(.04,0,0).y},s*.072,s*.038,'#4c3827','#241d17');});}
 // cape / banner behind body
 if(k.cape)add(T(-.15,0,neck).z,()=>{fillPoly(c,hull([T(-.08,-.14,neck),T(-.08,.14,neck),T(-.2-(action==='walk'?.06:0),-.17,hip-.2),T(-.2-(action==='walk'?.06:0),.17,hip-.2)]),k.cape,shadeHex(k.cape,.6),1);});
 if(k.banner)add(T(-.13,-.06,hip).z-.05,()=>bannerFlag(c,T,hip-.05,top+.62-(hip-.05),k.flagStyle,team,k,s,frame,action,true));
 else if(k.flag&&k.flagStyle)add(T(-.13,-.06,hip).z-.05,()=>bannerFlag(c,T,neck-.1,k.flag==='big'?.85:.62,k.flagStyle,team,{accent:k.flagStyle.edge,emblem:k.flagStyle.emblem},s,frame,action,k.flag==='big'));
 if(k.quiver)add(T(-.1,.05,neck-.1).z-.03,()=>{seg(c,T(-.1,.07,hip+.05),T(-.13,.1,neck+.12),'#7a5532',Math.max(3,s*.09));for(let i=0;i<3;i++)seg(c,T(-.13,.09+i*.015,neck+.12),T(-.14,.08+i*.02,neck+.2),'#e8e0c4',1);});
 if(kind==='skirmisher')add(T(-.1,0,neck).z-.04,()=>{for(let i=0;i<3;i++)seg(c,T(-.12,-.08+i*.04,hip-.05),T(-.12,-.06+i*.04,top+.25),'#c2a46c',1.2);});
 if(kind==='worker'&&opts.load)add(T(-.15,0,neck).z-.02,()=>{blob(c,T(-.17,0,hip+.18),s*.13,s*.16,'#99774c','#5d472d');const col={wood:'#a47642',stone:'#b2b6a5',gold:'#e3c666',iron:'#a0b4b9',food:'#d1c27b'}[opts.load]||'#d1c27b';blob(c,T(-.17,0,hip+.3),s*.08,s*.05,col);});
 // torso + tunic skirt
 const litSide=ca>=0?-1:1,torso=()=>{const sh=[],wa=[],sk=[];for(const f of[-.09,.09])for(const sd of[-1,1]){sh.push(T(f,sd*.165,neck));wa.push(T(f,sd*.14,hip));sk.push(T(f*1.35,sd*.185,k.hem));}
  fillPoly(c,hull([...wa,...sk]),shadeHex(k.tunic,.84),shadeHex(k.tunic,.5),1);fillPoly(c,hull([...sh,...wa]),k.tunic,shadeHex(k.tunic,.48),1);
  // directional light and tailoring make the body read as a volume instead of a flat token
  seg(c,T(.085,litSide*.12,neck-.02),T(.085,litSide*.1,hip+.02),shadeHex(k.tunic,1.18),Math.max(.8,s*.022));seg(c,T(.095,-litSide*.12,neck-.03),T(.095,-litSide*.1,hip+.02),shadeHex(k.tunic,.62),Math.max(.8,s*.024));seg(c,T(.1,-.13,k.hem+.025),T(.1,.13,k.hem+.025),k.belt,Math.max(.8,s*.018));
  // collar (áo giao lĩnh) on the visible face
  const fz=front?.095:-.095;if(front){seg(c,T(fz,-.08,neck),T(fz,.03,neck-.13),'#e3d6b8',Math.max(1.2,s*.03));seg(c,T(fz,.08,neck),T(fz,-.01,neck-.1),'#e3d6b8',Math.max(1,s*.025));}
  if(k.armor){for(let row=0;row<4;row++){const up=neck-.04-row*.06;for(let col=-2;col<=2;col++){const a=T(fz,col*.045-.02,up),b=T(fz,col*.045+.02,up),plate=(row+col)%2?k.armor[0]:k.armor[1];seg(c,a,b,plate,Math.max(1.6,s*.045));if(s>=28)blob(c,T(fz,col*.045,up+.008),s*.007,s*.007,shadeHex(plate,1.25));}}seg(c,T(fz,0,neck-.02),T(fz,0,hip+.04),shadeHex(k.armor[1],.62),Math.max(1,s*.025));fillPoly(c,[T(fz*.9,-.15,neck),T(fz*.9,-.21,neck-.1),T(fz*.9,-.12,neck-.08)],k.armor[1]);fillPoly(c,[T(fz*.9,.15,neck),T(fz*.9,.21,neck-.1),T(fz*.9,.12,neck-.08)],k.armor[1]);}
  if(k.emblem&&front&&s>=24){const e=T(fz,0,hip+.16);c.fillStyle=k.accent;c.font=`${Math.max(6,s*.13)|0}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(k.emblem,e.x,e.y);}
  // belt sash in team colour with hanging tails
  fillPoly(c,ring(T,0,0,hip+.02,.145,12),null,k.belt,Math.max(2,s*.065));const tail=T(front?.09:-.09,.05,hip);seg(c,tail,T(front?.1:-.1,.07,hip-.14),k.belt,Math.max(1.2,s*.035));
  if(k.pauldrons&&k.armor)for(const sd of[-1,1])fillPoly(c,hull([T(-.07,sd*.13,neck+.01),T(.07,sd*.13,neck+.01),T(-.07,sd*.22,neck-.08),T(.07,sd*.22,neck-.08)]),k.armor[0],k.armor[1],1);
  if(opts.rank>=2&&kind!=='dinh'&&kind!=='tran'){for(let i=1;i<opts.rank;i++)blob(c,T(fz,-.06+i*.05,hip+.08),s*.019,s*.019,'#efcf79','#6e5428');if(opts.rank>=3){seg(c,T(fz,-.11,neck-.01),T(fz,.11,neck-.01),'#e8c96f',Math.max(1,s*.027));for(const sd of[-1,1])seg(c,T(fz,sd*.12,neck-.015),T(fz,sd*.17,neck-.045),'#e8c96f',Math.max(1,s*.025));}}};
 add(0,torso);
 // arms (shoulder -> hand)
 for(const side of[-1,1]){const hand=side<0?o.handL:o.handR,sh=T(0,side*.17,neck-.02),el=T((hand.f)*.45,side*.2,(neck+hand.up)*.5-.03),hp=T(hand.f,hand.sd,hand.up);add(hp.z+.005*side,()=>{const sleeve=shadeHex(k.tunic,side===litSide?1.04:.79);seg(c,sh,el,sleeve,Math.max(2.4,s*.095));seg(c,el,hp,sleeve,Math.max(2.1,s*.08));seg(c,el,hp,shadeHex(k.tunic,side===litSide?1.18:.9),Math.max(.7,s*.018));const cuff={x:hp.x+(el.x-hp.x)*.18,y:hp.y+(el.y-hp.y)*.18};seg(c,cuff,hp,k.belt,Math.max(1,s*.028));blob(c,hp,s*.043,s*.043,k.skin,shadeHex(k.skin,.62));});}
 // shield on the left arm
 if(k.shield){const L=o.handL,sp={f:Math.max(.16,L.f+.06),sd:-.17,up:Math.max(.42,L.up)},r2=k.shield==='round'?.16:.11;if(k.shield==='tower'){sp.up=Math.max(.36,L.up-.04);}add(P(sp.f,sp.sd,sp.up).z+.02,()=>{if(k.shieldPattern||k.shield==='tower')shieldFace(c,T,sp,k.shield==='tower'?.15:r2,k,s,k.shield==='tower');else{const d=disc(T,sp.f,sp.sd,sp.up,r2);fillPoly(c,d,k.shield==='round'?'#8a6b4b':'#a28953','#3f3324',1);fillPoly(c,disc(T,sp.f+.002,sp.sd,sp.up,r2*.7),null,k.shield==='round'?'#c4b48c':'#5f5638',1);const b=T(sp.f+.01,sp.sd,sp.up);blob(c,b,s*.03,s*.03,team);}});}
 // weapon follows the right hand
 const hz=P(o.handR.f,o.handR.sd,o.handR.up).z;add(hz+.01,()=>weaponDraw(c,T,k,o,front,s));
 // head
 add(T(0,0,top).z+.001,()=>{const hc=T(0,0,top);blob(c,hc,s*r,s*r*1.1,k.skin,shadeHex(k.skin.startsWith('#')?k.skin:'#d6ad83',.6));const back=T(-.05,0,top+.02);if(!front)blob(c,{x:hc.x,y:hc.y},s*r*.95,s*r*1.02,'#2b2620');else{blob(c,back,s*r*.75,s*r*.8,'#2b2620');const e1=T(.085,-.035,top+.01),e2=T(.085,.035,top+.01);if(s>=26){if(e1.z>-.02){seg(c,T(.09,-.058,top+.035),T(.095,-.02,top+.04),'#3a2a20',Math.max(.65,s*.012));blob(c,e1,s*.012,s*.012,'#211b17');}if(e2.z>-.02){seg(c,T(.095,.018,top+.04),T(.09,.058,top+.035),'#3a2a20',Math.max(.65,s*.012));blob(c,e2,s*.012,s*.012,'#211b17');}seg(c,T(.105,0,top+.015),T(.12,0,top-.015),shadeHex(k.skin,.72),Math.max(.65,s*.013));seg(c,T(.11,-.025,top-.065),T(.11,.025,top-.065),'#754b3b',Math.max(.6,s*.011));blob(c,T(.07,litSide*.055,top+.045),s*.018,s*.025,'rgba(255,226,190,.24)');}if(k.beard&&k.beard!=='none'){const ch=T(.07,0,top-.07),bd=k.beard;if(bd==='square')fillPoly(c,[T(.08,-.06,top-.04),T(.08,.06,top-.04),T(.08,.06,top-.15),T(.08,-.06,top-.15)],'#2b2620');else if(bd==='thin'){seg(c,T(.1,-.04,top-.03),T(.1,-.07,top-.09),'#2b2620',1.1);seg(c,T(.1,.04,top-.03),T(.1,.07,top-.09),'#2b2620',1.1);seg(c,ch,T(.08,0,top-.16),'#2b2620',1);}else seg(c,ch,T(.08,0,top-(bd==='long'?.22:.12)),'#2b2620',Math.max(1.5,s*(bd==='long'?.05:.04)));}}
  if(k.hero){if(k.hair==='long')seg(c,T(-.08,0,top),T(-.12,0,top-.24),'#221d18',Math.max(2,s*.07));else if(k.hair==='loose')for(const sd of[-.06,0,.06])seg(c,T(-.08,sd,top),T(-.1,sd*1.4,top-.16),'#221d18',Math.max(1.2,s*.03));}
  headgear(c,T,k,top+.06,r,front);});
 ops.sort((a,b)=>a.z-b.z);for(const op of ops)op.fn();
 if(opts.hurt){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,120,90,.3)';c.fillRect(-s*1.4,-s*2,s*2.8,s*2.4);c.restore();}
 return ops.length;}
// War elephant (chiến tượng) as a round-bodied puppet: works for all 8 facings.
function drawElephant(c,dir,action,frame,team,s,opts={}){const {P,sa}=rig(dir,s*1.12),n=FRAMES[action]||1,t=(frame+.5)/n,walk=action==='walk',g1=walk?Math.sin(t*TAU)*.1:0,ops=[],add=(z,fn)=>ops.push({z,fn});const strike=action==='attack'?Math.sin(t*Math.PI):0;
 const skin=opts.mountColor||'#8d9a8b',dark=shadeHex(skin,.74),lite=shadeHex(skin,1.18),st=opts.style||null,armored=!!opts.armored;
 for(const [f,sd,ph] of[[.32,-.19,0],[.32,.19,.5],[-.36,-.19,.5],[-.36,.19,0]]){const sw=walk?Math.sin((t+ph)*TAU)*.12:0,top=P(f,sd,.55),foot=P(f+sw,sd,Math.max(0,Math.cos((t+ph)*TAU))*(walk?.05:0));add(foot.z,()=>{seg(c,top,foot,sd*sa>0||foot.z>0?skin:dark,Math.max(3,s*.2));blob(c,foot,s*.1,s*.05,lite);});}
 for(let i=0;i<5;i++){const f=-.45+i*.2,p=P(f,0,.72+Math.sin(i/4*Math.PI)*.05),r=.36-Math.abs(i-2)*.03;add(p.z,()=>{blob(c,p,s*r,s*r*.92,skin,dark);blob(c,{x:p.x-s*r*.25,y:p.y-s*r*.35},s*r*.45,s*r*.3,'rgba(220,226,210,.22)');});}
 const head=P(.62,0,.82+strike*.08+(walk?Math.abs(Math.sin(t*TAU))*.05:0));add(head.z+.01,()=>{for(const sd of[-1,1]){const e=P(.52,sd*.26,.84);fillPoly(c,hull([P(.56,sd*.12,1.02),P(.5,sd*.36,.98),P(.48,sd*.34,.66),P(.56,sd*.14,.66),e]),shadeHex(skin,sd*sa>0?.95:.78),dark,1);}
  blob(c,head,s*.26,s*.27,lite,dark);const tr=[P(.8,0,.78),P(.92+strike*.15,0,.5+strike*.35),P(.95+strike*.2,0,.22+strike*.6),P(1.02+strike*.1,0,.1+strike*.7)];c.strokeStyle=skin;c.lineWidth=Math.max(3,s*.12);c.lineCap='round';c.beginPath();c.moveTo(tr[0].x,tr[0].y);c.bezierCurveTo(tr[1].x,tr[1].y,tr[2].x,tr[2].y,tr[3].x,tr[3].y);c.stroke();
  for(const sd of[-1,1])seg(c,P(.78,sd*.1,.66),P(1.0,sd*.12,.6+strike*.2),'#ece3c4',Math.max(1.6,s*.05));if(sa>-.3){const e=P(.74,sa>0?.14:-.14,.9);blob(c,e,s*.025,s*.025,'#202e28');}});
 // saddle cloth (team colour), howdah, mahout and spearman
 const top=1.05,clothC=armored&&st?st.armor[1]:team,trim=st?st.banner.edge:'#e4cd8a';
 if(armored){add(head.z+.02,()=>{fillPoly(c,hull([P(.66,-.16,1.02),P(.66,.16,1.02),P(.84,-.1,.76),P(.84,.1,.76),P(.6,0,1.08)]),st?st.armor[0]:'#a7b1b3',shadeHex(st?st.armor[1].slice(0,7):'#39454b',1),1);seg(c,P(.75,0,.98),P(.84,0,.78),trim,1.6);});}
 add(P(0,0,top).z+.3,()=>{const cl=[];for(const f of[-.34,.3])for(const sd of[-1,1]){cl.push(P(f,sd*.36,top-.02));cl.push(P(f,sd*.39,top-(armored?.62:.42)));}fillPoly(c,hull(cl),clothC,trim,1);
  if(armored){const side=sa>0?.385:-.385;for(let row=0;row<3;row++)for(let i=0;i<6;i++){const f=-.3+i*.11,up=top-.12-row*.16;fillPoly(c,[P(f,side,up),P(f+.1,side,up),P(f+.1,side,up-.13),P(f,side,up-.13)],(row+i)%2?(st?st.armor[0]:'#a7b1b3'):shadeHex((st?st.armor[0]:'#a7b1b3').slice(0,7),.8),'rgba(20,20,20,.5)',.6);}seg(c,P(-.34,side,top-.03),P(.3,side,top-.03),team,Math.max(2,s*.05));}
  if(opts.noRider)return;for(let i=0;i<4;i++)seg(c,P(-.25+i*.15,(sa>0?.38:-.38),top-.42),P(-.25+i*.15,(sa>0?.38:-.38),top-.5),'#d6b977',1.5);
  const hb=[];for(const f of[-.25,.15])for(const sd of[-.22,.22]){hb.push(P(f,sd,top));hb.push(P(f,sd,top+.22));}fillPoly(c,hull(hb),'#8b6540','#d1ac70',1);fillPoly(c,hull([P(-.28,-.25,top+.3),P(.18,-.25,top+.3),P(-.28,.25,top+.3),P(.18,.25,top+.3),P(-.05,0,top+.45)]),st?st.banner.color:'#a1402c',st?st.banner.edge:'#e2bd75',1);
  if(st&&st.banner){const pole=P(-.24,.2,top+.45);seg(c,pole,P(-.24,.2,top+.95),'#5a4128',Math.max(1.2,s*.03));fillPoly(c,[P(-.24,.2,top+.95),P(-.5,.2,top+.9),P(-.48,.2,top+.72),P(-.24,.2,top+.72)],st.banner.color,st.banner.edge,1);}
  const rider=P(.42,0,top+.08);seg(c,rider,P(.42,0,top+.3),'#526b69',Math.max(3,s*.11));blob(c,P(.42,0,top+.38),s*.08,s*.09,'#d2ad80');if(st)factionHelm(c,P,{},st.helm,st.helmColor,shadeHex(st.helmColor,.62),top+.44,.1);else fillPoly(c,hull([...ring(P,.42,0,top+.42,.13,10),P(.42,0,top+.52)]),'#c0ad70','#6d5d36',1);
  const sp=P(-.05,.1,top+.35);seg(c,sp,P(.25+strike*.4,.1,top+.95-strike*.4),'#d9c99b',Math.max(1.2,s*.03));});
 ops.sort((a,b)=>a.z-b.z);for(const op of ops)op.fn();
 if(opts.hurt){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,120,90,.2)';c.fillRect(-s*2,-s*2.8,s*4,s*3.2);c.restore();}
 return ops.length;}
function drawFigure(c,kind,dir,action,frame,team,s,opts={}){const RS=REG.get(kind);if(RS)return RS.draw(c,dir,action,frame,team,s,opts)||1;if(isElephant(kind))return drawElephant(c,dir,action,frame,team,kind==='armoredElephant'?s*1.08:s,kind==='armoredElephant'?{...opts,armored:true}:opts);
 if(opts.mount==='elephant'&&isHero(kind)){const es=s*1.3,n=drawElephant(c,dir,action,frame,team,es,{style:opts.style,noRider:true,mountColor:opts.mountColor,hurt:opts.hurt});const sr=s*1.3,rs=sr*1.375;return n+drawInfantry(c,kind,dir,action,frame,team,sr,{...opts,lift:1.12*es*1.08/rs-.44,hurt:false});}
 return drawInfantry(c,kind,dir,action,frame,team,s,opts);}
// ---------- atlas ----------
const bucketOf=px=>Math.max(8,Math.round(2**(Math.round(Math.log2(Math.max(8,px))*4)/4)));
function cellSize(kind,b){const RS=REG.get(kind);if(RS&&RS.cell)return RS.cell(b);if(kind==='mounted')return{w:Math.ceil(b*3.8),h:Math.ceil(b*3.5),ox:Math.ceil(b*1.9),oy:Math.ceil(b*3.0)};if(kind==='mountedElephant')return{w:Math.ceil(b*5.6),h:Math.ceil(b*6.4),ox:Math.ceil(b*2.8),oy:Math.ceil(b*5.3)};if(kind==='armoredElephant')return{w:Math.ceil(b*4.2),h:Math.ceil(b*3.8),ox:Math.ceil(b*2.1),oy:Math.ceil(b*3.1)};if(kind==='hero')return{w:Math.ceil(b*3),h:Math.ceil(b*2.9),ox:Math.ceil(b*1.5),oy:Math.ceil(b*2.5)};return kind==='elephant'?{w:Math.ceil(b*3.9),h:Math.ceil(b*3.4),ox:Math.ceil(b*1.95),oy:Math.ceil(b*2.75)}:{w:Math.ceil(b*2.7),h:Math.ceil(b*2.3),ox:Math.ceil(b*1.35),oy:Math.ceil(b*1.95)};}
function createAtlas(opts={}){const page=opts.pageSize||1024,maxPages=opts.maxPages||20,make=opts.makeCanvas;const pages=[],map=new Map();let x=0,y=0,rowH=0,scratch=null,sil=null,stats={baked:0,resets:0};
 function newPage(){const cv=make(page,page);pages.push({canvas:cv,ctx:cv.getContext('2d')});x=y=rowH=0;}
 function reset(){pages.length=0;map.clear();stats.resets++;newPage();}
 function alloc(w,h){if(!pages.length)newPage();if(x+w>page){x=0;y+=rowH+1;rowH=0;}if(y+h>page){if(pages.length>=maxPages)reset();else newPage();}const r={page:pages.length-1,x,y};x+=w+1;rowH=Math.max(rowH,h);return r;}
 function ensureScratch(w,h){if(!scratch||scratch.width<w||scratch.height<h){const W=Math.max(w,scratch?scratch.width:0),H=Math.max(h,scratch?scratch.height:0);scratch=make(W,H);sil=make(W,H);}}
 function get(key,kind,b,draw){let e=map.get(key);if(e)return e;const cs=cellSize(kind,b);
  const W0=Math.min(cs.w,page),H0=Math.min(cs.h,page);ensureScratch(W0,H0);const sc=scratch.getContext('2d',{willReadFrequently:true}),sl=sil.getContext('2d');sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,W0,H0);sc.translate(cs.ox,cs.oy);draw(sc);sc.setTransform(1,0,0,1,0,0);
  // crop to the drawn pixels (+2px for the outline) so cells stay small
  let x0=0,y0=0,x1=W0,y1=H0;const img=typeof sc.getImageData==='function'?sc.getImageData(0,0,W0,H0):null;if(img&&img.data&&img.data.length===W0*H0*4){const d=img.data;let minX=W0,minY=H0,maxX=-1,maxY=-1;for(let yy=0;yy<H0;yy++){const row=yy*W0*4;for(let xx=0;xx<W0;xx++)if(d[row+xx*4+3]>6){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;}}if(maxX>=0){x0=Math.max(0,minX-2);y0=Math.max(0,minY-2);x1=Math.min(W0,maxX+3);y1=Math.min(H0,maxY+3);}else{x1=x0+1;y1=y0+1;}}
  const cw=x1-x0,ch=y1-y0;
  // 1px dark outline for crisp AoE-style silhouettes
  const r=alloc(cw,ch),pg=pages[r.page];
  sl.setTransform(1,0,0,1,0,0);sl.globalCompositeOperation='source-over';sl.clearRect(0,0,cw,ch);sl.drawImage(scratch,x0,y0,cw,ch,0,0,cw,ch);sl.globalCompositeOperation='source-in';sl.fillStyle='rgba(20,22,14,.7)';sl.fillRect(0,0,cw,ch);sl.globalCompositeOperation='source-over';
  const c=pg.ctx;c.save();c.beginPath();c.rect(r.x,r.y,cw,ch);c.clip();c.clearRect(r.x,r.y,cw,ch);for(const [dx,dy] of[[-1,0],[1,0],[0,-1],[0,1]])c.drawImage(sil,0,0,cw,ch,r.x+dx,r.y+dy,cw,ch);c.globalAlpha=.62;for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]])c.drawImage(sil,0,0,cw,ch,r.x+dx,r.y+dy,cw,ch);c.globalAlpha=1;c.drawImage(scratch,x0,y0,cw,ch,r.x,r.y,cw,ch);c.restore();
  e={page:r.page,x:r.x,y:r.y,w:cw,h:ch,ox:cs.ox-x0,oy:cs.oy-y0,b,pageRef:pg};map.set(key,e);stats.baked++;return e;}
 return{pageSize:page,get,has:k=>map.has(k),peek:k=>map.get(k),pages,stats,size:()=>map.size,reset};}
function spriteKey(kind,dir,action,frame,team,b,opts={}){return[kind,dir,action,frame,team,b,opts.rank||1,opts.variant||0,opts.toolKind||'',opts.load||'',opts.hurt?1:0,opts.lookKey||'',opts.style?opts.style.id:'',opts.flag?1:0,opts.mount||''].join('|');}
function cellKind(kind,opts={}){return opts.mount==='elephant'?'mountedElephant':opts.mount?'mounted':isHero(kind)?'hero':kind;}
// ---------- per-frame drawing ----------
function groundRing(S,x,y,rx,ry,n=18){return Array.from({length:n},(_,i)=>{const t=i/n*TAU;return S({x:x+Math.cos(t)*rx,y:y+Math.sin(t)*ry});});}
function createRenderer(opts={}){const make=opts.makeCanvas||((w,h)=>{if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const atlas=createAtlas({makeCanvas:make,pageSize:opts.pageSize||512,maxPages:opts.maxPages||72}),fallback=opts.fallback||null,now=()=>typeof performance!=='undefined'?performance.now():Date.now();let frameStart=0,bakedMs=0,frameId=-1,stats={live:0,cached:0,baked:0};
 function beginFrame(){frameStart=now();bakedMs=0;stats={live:0,cached:0,baked:0};}
 function factionOf(u,g){try{if(u.kind==='tran'){const F=(g&&g.FACTIONS)||(typeof globalThis!=='undefined'&&globalThis.Loan12&&globalThis.Loan12.FACTIONS);const f3=F&&F.find(f=>f.id===3);if(f3)return f3;}return g&&typeof g.faction==='function'?g.faction(u.owner)||null:null;}catch(e){return null;}}
 function lookOf(u,g){if(u.kind!=='dinh'&&u.kind!=='tran')return null;return factionOf(u,g)?.visual||null;}
 function identity(u,g){const f=factionOf(u,g),hero=isHero(u.kind),arch=archOf(u.kind);if(REG.has(u.kind))return{style:f&&f.style||null,general:null,flag:false,mount:null,mountColor:null};return{style:f&&f.style&&(MILITARY.has(arch)||hero||isElephant(u.kind))?f.style:null,general:hero&&f?f.general||null:null,flag:!!(f&&f.style&&MILITARY.has(arch)&&(ARCH[u.kind]||(u.id||0)%5===0)),mount:hero&&f&&f.general?f.general.mount||null:null,mountColor:hero&&f&&f.general?f.general.mountColor:null};}
 function shadow(c,u,g,ground,s,dir,mount){const RS=REG.get(u.kind);if(RS&&RS.shadow===false)return;if(RS&&RS.shadow){c.fillStyle='rgba(16,26,14,.12)';fillPoly(c,groundRing(ground,u.x+.14,u.y-.14,RS.shadow*1.45,RS.shadow*1.1,18));c.fillStyle='rgba(12,20,12,.3)';fillPoly(c,groundRing(ground,u.x+.07,u.y-.07,RS.shadow*1.02,RS.shadow*.76,14));return;}const big=isElephant(u.kind)||mount==='elephant',r=big?.62:mount?.42:.24;c.fillStyle='rgba(18,25,15,.12)';fillPoly(c,groundRing(ground,u.x+.16,u.y-.16,r*(big?1.55:1.46),r*(big?1.08:1.2),18));c.fillStyle='rgba(10,18,11,.32)';fillPoly(c,groundRing(ground,u.x+.06,u.y-.06,r*(big?1.12:1.02),r*(big?.72:.82),14));}
 function selection(c,u,ground,front,color,mount){const big=isElephant(u.kind)||mount==='elephant',r=REG.get(u.kind)?.ring||(big?.8:mount?.5:.33),pts=groundRing(ground,u.x,u.y,r,r,28),cy=ground({x:u.x,y:u.y}).y;c.save();c.lineWidth=front?2:1.4;c.strokeStyle=color;c.globalAlpha=front?1:.55;c.lineCap='round';c.beginPath();let on=false;for(let i=0;i<=pts.length;i++){const p=pts[i%pts.length],keep=front?p.y>=cy:p.y<cy;if(keep){if(!on){c.moveTo(p.x,p.y);on=true;}else c.lineTo(p.x,p.y);}else on=false;}c.stroke();c.restore();}
 // Returns true when handled (sprited unit); false lets the caller fall back to iso-art.
 function drawUnit(c,u,g,S,s,selected,color,o={}){if(!SPRITED.has(u.kind))return false;const ground=o.ground||S,dpr=o.dpr||1,budget=o.budgetMs??6;const st=visualState(u,g),ps=poseOf(u,g,st),flip=MIRROR[st.dir]>=0,dir=flip?MIRROR[st.dir]:st.dir,p=S(u);
  const look=lookOf(u,g),fo={rank:u.rank||1,variant:u.kind==='fishingBoat'?(u.load?.amount>0?1:0):REG.get(u.kind)?.cargo?Math.min(REG.get(u.kind).cargo,(u.cargo||[]).length):(u.id||0)%3,toolKind:u.kind==='worker'?(u.work?.kind||u.load?.kind||'food'):'',load:u.kind==='worker'&&u.load?.amount>0?u.load.kind:'',hurt:(u.hurtAnim||0)>0,look,lookKey:look?[look.coat,look.secondary,look.accent,look.hat,look.weapon,look.beard,look.emblem,look.skin].join(','):'',...identity(u,g)};if(u.kind==='elephant')fo.style=null;const ck=cellKind(u.kind,fo);
  shadow(c,u,g,ground,s,dir,fo.mount);if(selected)selection(c,u,ground,false,u.hold?'#9ed8e7':'#f0eab0',fo.mount);
  if(u.kind==='scholar'&&u.healing&&g.units){const pt=g.units.find(v=>v.id===u.healing&&v.hp>0);if(pt){const q=S(pt);c.save();c.setLineDash([3,6]);seg(c,{x:p.x,y:p.y-s*.45},{x:q.x,y:q.y-s*.4},'#d3e7ae99',1.5);c.restore();}}
  const b=o.settled===false?bucketOf(s*dpr):Math.max(8,Math.round(s*dpr)),key=spriteKey(u.kind,dir,ps.action,ps.frame,color,b,fo);let e=atlas.peek(key);if(!e&&o.settled===false){for(const bb of[bucketOf(s*dpr*.84),bucketOf(s*dpr*1.19)]){e=atlas.peek(spriteKey(u.kind,dir,ps.action,ps.frame,color,bb,fo));if(e)break;}}
  const fits=(()=>{const cs=cellSize(ck,b);return cs.w<=atlas.pageSize&&cs.h<=atlas.pageSize;})();
  if(!e&&fits&&(bakedMs<budget||o.forceBake)){const t0=now();e=atlas.get(key,ck,b,cx=>drawFigure(cx,u.kind,dir,ps.action,ps.frame,color,b,fo));bakedMs+=now()-t0;stats.baked++;}
  if(e){const k=s/e.b;if(flip){c.save();c.translate(Math.round(p.x),Math.round(p.y));c.scale(-1,1);c.drawImage(e.pageRef.canvas,e.x,e.y,e.w,e.h,-e.ox*k,-e.oy*k,e.w*k,e.h*k);c.restore();}else if(dpr===1&&Math.abs(k-1)<.02)c.drawImage(e.pageRef.canvas,e.x,e.y,e.w,e.h,Math.round(p.x-e.ox),Math.round(p.y-e.oy),e.w,e.h);else c.drawImage(e.pageRef.canvas,e.x,e.y,e.w,e.h,p.x-e.ox*k,p.y-e.oy*k,e.w*k,e.h*k);stats.cached++;}
  else{c.save();c.translate(p.x,p.y);if(flip)c.scale(-1,1);drawFigure(c,u.kind,dir,ps.action,ps.frame,color,s,fo);c.restore();stats.live++;}
  if(selected)selection(c,u,ground,true,u.hold?'#9ed8e7':'#f0eab0',fo.mount);
  if(isHero(u.kind)){if((u.gestureAnim||0)>0){const pulse=.55+.45*Math.sin(((g&&g.time)||0)*14);c.strokeStyle=`rgba(242,212,135,${pulse.toFixed(3)})`;c.lineWidth=1.6;for(let i=0;i<5;i++){const a=-Math.PI*.9+i*Math.PI*.2;seg(c,{x:p.x+Math.cos(a)*s*.48,y:p.y-s*.86+Math.sin(a)*s*.48},{x:p.x+Math.cos(a)*s*.68,y:p.y-s*.86+Math.sin(a)*s*.68},c.strokeStyle,1.6);}}}
  return true;}
 // Compact health bar: player units green→amber→red, others red.
 function healthBar(c,x,y,w,ratio,own){ratio=clamp(ratio,0,1);const h=Math.max(3,Math.round(w/11));c.fillStyle='rgba(12,18,12,.8)';c.fillRect(Math.round(x-w/2)-1,Math.round(y)-1,Math.round(w)+2,h+2);c.fillStyle=own?(ratio>.6?'#9fd36b':ratio>.3?'#e2c25a':'#e0674e'):'#e0674e';c.fillRect(Math.round(x-w/2),Math.round(y),Math.round(w*ratio),h);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(Math.round(x-w/2),Math.round(y),Math.round(w*ratio),1);}
 function headHeight(u,g){const RS=REG.get(u.kind);if(RS&&RS.head)return RS.head;if(isElephant(u.kind))return u.kind==='armoredElephant'?2.7:2.5;if(isHero(u.kind)){const m=g?identity(u,g).mount:null;return m==='elephant'?3.6:m?2.05:1.6;}return 1.25;}
 return{drawUnit,beginFrame,healthBar,headHeight,identity,atlas,stats:()=>stats};}
return{REG,register,hull,fillPoly,seg,blob,ring,shadeHex,ARCH,archOf,MILITARY,factionHelm,shieldFace,bannerFlag,cellKind,MIRROR,INFANTRY,SPRITED,FRAMES,DIRS,octant,facingFromWorld,visualState,poseOf,rig,kit,drawFigure,drawInfantry,drawElephant,bucketOf,cellSize,createAtlas,spriteKey,createRenderer};
});
