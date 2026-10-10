// Loạn 12 Sứ Quân — battle effects: arcing projectiles, dust, ship wakes, splashes, smoke/fire on damaged buildings,
// falling/fading corpses, sinking ships, rubble. Visual only: reads game state, never changes it.
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanFX=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=Math.PI*2,rnd=Math.random;
const PROJ={crossbow:'bolt',divineCrossbow:'bolt',lateriteBow:'bolt',skirmisher:'javelin',seaRaider:'javelin',escortGuard:'javelin',catapult:'stone',fireboat:'firepot',raft:'firepot'};
const BIG=new Set(['elephant','armoredElephant','catapult']);
function projectileType(src,e){if(PROJ[src])return PROJ[src];if(e&&e.fire&&src==='fireboat')return'firepot';return'arrow';}
function create(){const S={seen:new WeakSet(),proj:[],parts:[],decals:[],corpses:[],flames:new Map(),lastUnits:new Map(),lastBuildings:new Map(),wakeT:new Map(),dustT:new Map(),time:0,game:null};
 const water=(g,x,y)=>{const t=g.tile?g.tile(Math.floor(x),Math.floor(y)):0;return t===3||t===4;};
 let Ucache=null;function U0(g){if(Ucache)return Ucache;const L=globalThis.Loan12;const u=(L&&L.U)||g.U||null;if(u)Ucache=u;return u||{};}
 function part(p){if(S.parts.length>900)S.parts.splice(0,S.parts.length-850);S.parts.push(p);}
 function burst(x,y,kind,n,opts={}){for(let i=0;i<n;i++){const a=rnd()*TAU,sp=(opts.speed||.8)*(.4+rnd()*.8);
   if(kind==='splash')part({k:'drop',x,y,z:.05,vx:Math.cos(a)*sp*.5,vy:Math.sin(a)*sp*.5,vz:1.6+rnd()*1.4,life:0,max:.7+rnd()*.3,r:.04+rnd()*.03});
   else if(kind==='dust')part({k:'dust',x:x+Math.cos(a)*.15,y:y+Math.sin(a)*.15,z:.05,vx:Math.cos(a)*sp*.6,vy:Math.sin(a)*sp*.6,vz:.25+rnd()*.3,life:0,max:.9+rnd()*.7,r:.12+rnd()*.12,col:opts.col||'168,140,96'});
   else if(kind==='debris')part({k:'chip',x,y,z:.2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,vz:1.5+rnd()*1.8,life:0,max:.8,r:.05+rnd()*.05,col:opts.col||'#7a6a50'});
   else if(kind==='spark')part({k:'spark',x,y,z:.6+rnd()*.3,vx:Math.cos(a)*sp*1.5,vy:Math.sin(a)*sp*1.5,vz:.8+rnd(),life:0,max:.25+rnd()*.15,r:.03});
   else if(kind==='smoke')part({k:'smoke',x:x+(rnd()-.5)*.3,y:y+(rnd()-.5)*.3,z:opts.z||1,vx:.12+rnd()*.1,vy:-.1-rnd()*.08,vz:.45+rnd()*.3,life:0,max:2.4+rnd()*1.2,r:.16+rnd()*.12,dark:opts.dark||0});}}
 function ring(x,y,max=1){part({k:'ring',x,y,z:0,vx:0,vy:0,vz:0,life:0,max,r:.1});}
 function update(g,dt){if(S.game!==g){S.game=g;S.proj.length=0;S.parts.length=0;S.decals.length=0;S.corpses.length=0;S.lastUnits.clear();S.lastBuildings.clear();}
  dt=Math.min(dt,.1);if(dt<=0)return;S.time+=dt;const U=U0(g);
  // new shots -> projectiles
  for(const e of g.effects||[]){if(S.seen.has(e))continue;S.seen.add(e);
   if(e.type==='shot'){const type=projectileType(e.src,e),d=Math.hypot(e.tx-e.x,e.ty-e.y),n=Math.min(3,e.shots||1);for(let i=0;i<n;i++){const flight=type==='stone'?.55+d*.07:type==='firepot'?.45+d*.06:type==='javelin'?.3+d*.06:type==='bolt'?.18+d*.035:.25+d*.05,arc=type==='stone'?.8+d*.28:type==='bolt'?.15+d*.05:type==='javelin'?.3+d*.12:.35+d*.14;
     const z0=e.z0!=null?e.z0:U[e.src]?.naval?.8:e.src==='catapult'?1.6:.95,jit=n>1?(i-(n-1)/2)*.25:0;S.proj.push({type,x0:e.x,y0:e.y,x1:e.tx+jit*.6+(rnd()-.5)*.25,y1:e.ty-jit*.4+(rnd()-.5)*.25,z0,z1:.45,arc,t:-i*.08,flight,splash:U[e.src]?.splash||0});}}
   else if(e.type==='slash'){burst(e.tx,e.ty,'spark',3);if(rnd()<.5)burst(e.tx,e.ty,'dust',1);}
   else if(e.type==='rubble'){addRubble(e.x,e.y,e.kind,.7);burst(e.x,e.y,'dust',12,{speed:1.2,col:e.kind==='stonewall'?'170,168,150':'160,120,80'});burst(e.x,e.y,'debris',8,{col:e.kind==='stonewall'?'#8f8e82':e.kind==='earthwall'?'#a2704a':'#7a5a34'});}}
  // projectiles
  for(const p of S.proj){p.t+=dt;if(p.t>=p.flight&&!p.done){p.done=true;const x=p.x1,y=p.y1;if(water(g,x,y)){burst(x,y,'splash',p.type==='stone'?14:6);ring(x,y,p.type==='stone'?1.4:.9);}else if(p.type==='stone'){burst(x,y,'dust',10,{speed:1.1});burst(x,y,'debris',6);S.decals.push({k:'crater',x,y,life:0,max:14,r:.35+p.splash*.15});}else if(p.type==='firepot'){burst(x,y,'spark',8);burst(x,y,'smoke',3,{z:.4,dark:1});}else if(rnd()<.35)S.decals.push({k:'stuck',x,y,life:0,max:4,a:rnd()*TAU,type:p.type});}}
  S.proj=S.proj.filter(p=>!p.done||p.t<p.flight+.02);
  // unit tracking: dust, wakes, deaths
  const live=new Map();for(const u of g.units||[]){if(u.hp>0&&!u.embarked)live.set(u.id,u);}
  for(const[id,u]of S.lastUnits){if(!live.has(id)&&!(u.embarked)){const dead=(g.units||[]).find(v=>v.id===id);if(dead&&dead.embarked)continue;if(dead&&dead.hp>0)continue;addCorpse(g,u);}}
  S.lastUnits=new Map([...live].map(([id,u])=>[id,{id,kind:u.kind,owner:u.owner,x:u.x,y:u.y,embarked:u.embarked,ref:u,naval:!!U[u.kind]?.naval}]));
  for(const u of live.values()){const naval=!!U[u.kind]?.naval;if(!u.moving)continue;
   if(naval){let t=(S.wakeT.get(u.id)||0)-dt;if(t<=0){t=.07;const a=Math.atan2(u.vy??0,u.vx??0);const prev=S.lastPos?.get(u.id);const dx=prev?u.x-prev.x:0,dy=prev?u.y-prev.y:0,l=Math.hypot(dx,dy)||1;const bx=u.x-dx/l*.6,by=u.y-dy/l*.6;for(const s of[-1,1])part({k:'wake',x:bx,y:by,z:0,vx:-dy/l*s*.35,vy:dx/l*s*.35,vz:0,life:0,max:1.4,r:.08});void a;}S.wakeT.set(u.id,t);}
   else if(!water(g,u.x,u.y)){const big=BIG.has(u.kind)||BIG.has(globalThis.LoanSprites?.archOf?.(u.kind));const mounted=globalThis.LoanSprites&&g.faction&&(u.kind==='dinh'||u.kind==='tran')&&g.faction(u.owner)?.general?.mount;const charge=u.target!=null||u.attackMove;const rate=(big?3.5:mounted?3:.7)*(charge?2:1);let t=(S.dustT.get(u.id)||rnd()/rate)-dt;if(t<=0){t=1/rate*(.6+rnd()*.8);burst(u.x-.1,u.y+.1,'dust',big||mounted?2:1,{speed:.5});}S.dustT.set(u.id,t);}}
  S.lastPos=new Map([...live].map(([id,u])=>[id,{x:u.x,y:u.y}]));
  // buildings: smoke and flames, destruction
  const liveB=new Map();for(const b of g.buildings||[])if(b.hp>0)liveB.set(b.id,b);
  for(const[id,b]of S.lastBuildings)if(!liveB.has(id)&&!b.wall){addRubble(b.x,b.y,'building',1.4);burst(b.x,b.y,'dust',18,{speed:1.5});burst(b.x,b.y,'smoke',6,{z:.6,dark:1});}
  S.lastBuildings=new Map([...liveB].map(([id,b])=>[id,{id,x:b.x,y:b.y,wall:b.wall}]));
  for(const b of liveB.values()){if(b.constructing)continue;const r=b.hp/b.maxHP;if(r>=.6)continue;const wall=!!b.wall,rate=(wall?.6:2.2)*(r<.35?2:1);if(rnd()<rate*dt){const z=wall?.9:1.4+((b.tier||1)-1)*.3;burst(b.x+(rnd()-.5)*(wall?.3:1.1),b.y+(rnd()-.5)*(wall?.3:1.1),'smoke',1,{z,dark:r<.35?1:0});}}
  // particles
  for(const p of S.parts){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='drop'||p.k==='chip'){p.vz-=6*dt;if(p.z<0){p.z=0;p.vz=0;p.vx*=.3;p.vy*=.3;}}else if(p.k==='dust'){p.vx*=.96;p.vy*=.96;p.vz*=.94;p.r+=dt*.18;}else if(p.k==='smoke'){p.r+=dt*.22;p.vz*=.995;}else if(p.k==='wake'){p.vx*=.97;p.vy*=.97;p.r+=dt*.18;}else if(p.k==='ring')p.r+=dt*.9;}
  S.parts=S.parts.filter(p=>p.life<p.max);
  for(const d of S.decals)d.life+=dt;S.decals=S.decals.filter(d=>d.life<d.max);if(S.decals.length>260)S.decals.splice(0,S.decals.length-240);
  for(const c of S.corpses)c.life+=dt;S.corpses=S.corpses.filter(c=>c.life<c.max);}
 function addRubble(x,y,kind,size){const stones=[];const n=Math.round(10*size);for(let i=0;i<n;i++)stones.push({dx:(rnd()-.5)*size*1.1,dy:(rnd()-.5)*size*1.1,r:.05+rnd()*.09*size,s:.7+rnd()*.5});S.decals.push({k:'rubble',x,y,kind,stones,life:0,max:40,size});}
 function addCorpse(g,u){const ls=globalThis.LoanSprites,st=ls&&u.ref?ls.visualState(u.ref,g):null;S.corpses.push({kind:u.kind,owner:u.owner,x:u.x,y:u.y,ref:u.ref,dir:st?st.dir:1,life:0,max:u.naval?3:2.4,side:rnd()<.5?-1:1,naval:u.naval});if(u.naval){burst(u.x,u.y,'splash',16);ring(u.x,u.y,1.6);}else if(!water(g,u.x,u.y))burst(u.x,u.y,'dust',BIG.has(u.kind)?6:2);}
 const P=(Sfn,scale,x,y,z=0)=>{const q=Sfn({x,y});return{x:q.x,y:q.y-z*scale};};
 // ---------- drawing ----------
 function drawGround(c,g,Sfn,scale,w,h){c.save();
  for(const d of S.decals){const q=P(Sfn,scale,d.x,d.y);if(q.x<-80||q.y<-80||q.x>w+80||q.y>h+80)continue;const fade=Math.min(1,(d.max-d.life)/3);
   if(d.k==='rubble'){c.globalAlpha=fade;const col=d.kind==='stonewall'?['#8c8b80','#6d6c62','#b0aea0']:d.kind==='earthwall'?['#a06c44','#7a4f30','#c08a5a']:d.kind==='palisade'?['#7a5a34','#5a4024','#a07a48']:['#7d6a52','#5d4c3a','#a28e70'];c.fillStyle='rgba(40,30,20,.22)';c.beginPath();c.ellipse(q.x,q.y,scale*.55*d.size,scale*.28*d.size,0,0,TAU);c.fill();
    for(const s of d.stones){const p=P(Sfn,scale,d.x+s.dx,d.y+s.dy);c.fillStyle=col[Math.floor(s.s*3)%3];c.beginPath();if(d.kind==='palisade'){c.save();c.translate(p.x,p.y);c.rotate(s.s*3);c.fillRect(-scale*s.r*2,-scale*.03,scale*s.r*4,scale*.06);c.restore();}else{c.ellipse(p.x,p.y,scale*s.r,scale*s.r*.6,0,0,TAU);c.fill();}}}
   else if(d.k==='crater'){c.globalAlpha=fade*.7;c.fillStyle='rgba(60,46,30,.5)';c.beginPath();c.ellipse(q.x,q.y,scale*d.r,scale*d.r*.5,0,0,TAU);c.fill();}
   else if(d.k==='stuck'){c.globalAlpha=fade;c.strokeStyle=d.type==='javelin'?'#6a4a28':'#5a4428';c.lineWidth=1.2;const l=scale*(d.type==='javelin'?.3:.18);c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+Math.cos(d.a)*l*.5,q.y-l);c.stroke();}}
  c.globalAlpha=1;
  for(const p of S.parts){if(p.k!=='wake'&&p.k!=='ring')continue;const q=P(Sfn,scale,p.x,p.y);if(q.x<-50||q.y<-50||q.x>w+50||q.y>h+50)continue;const a=1-p.life/p.max;c.strokeStyle=`rgba(235,245,240,${(a*(p.k==='ring'?.7:.55)).toFixed(3)})`;c.lineWidth=p.k==='ring'?1.6:1.3;c.beginPath();c.ellipse(q.x,q.y,scale*p.r,scale*p.r*.5,0,0,TAU);c.stroke();}
  c.restore();}
 function drawCorpses(c,g,Sfn,scale,colors,sprites){const ls=globalThis.LoanSprites;if(!ls)return;for(const k of S.corpses){const q=P(Sfn,scale,k.x,k.y),t=k.life/k.max,fall=Math.min(1,k.life/.45);c.save();
   if(k.naval){const sink=Math.min(1,k.life/k.max);c.globalAlpha=1-sink*.9;c.beginPath();c.rect(q.x-scale*3,q.y-scale*4,scale*6,scale*4+scale*.1);c.clip();c.translate(q.x,q.y+sink*scale*1.1);c.rotate(k.side*sink*.35);}
   else{c.globalAlpha=t<.55?1:Math.max(0,1-(t-.55)/.45);c.translate(q.x,q.y);const big=BIG.has(ls.archOf(k.kind));c.rotate(k.side*fall*fall*(big?.5:1.35));c.scale(1,1-fall*.15);}
   const flip=ls.MIRROR[k.dir]>=0,dir=flip?ls.MIRROR[k.dir]:k.dir;if(flip)c.scale(-1,1);let opts={};try{opts=sprites&&k.ref?{...sprites.identity(k.ref,g),rank:k.ref.rank||1}:{};}catch(e){}
   try{ls.drawFigure(c,k.kind,dir,'idle',0,colors[k.owner]||'#888',scale,opts);}catch(e){}c.restore();}}
 function drawAir(c,g,Sfn,scale,w,h){c.save();const time=S.time;
  // flames on badly damaged buildings
  for(const b of g.buildings||[]){if(!(b.hp>0)||b.constructing||b.hp/b.maxHP>=.35)continue;const q=P(Sfn,scale,b.x,b.y);if(q.x<-100||q.y<-100||q.x>w+100||q.y>h+100)continue;const n=b.wall?1:3;for(let i=0;i<n;i++){const ox=b.wall?0:((b.id*7+i*13)%10/10-.5)*1.2,oy=b.wall?0:((b.id*3+i*17)%10/10-.5)*1.2,z=b.wall?.9:1+((b.id+i)%3)*.3,p=P(Sfn,scale,b.x+ox,b.y+oy,z),f=.7+.3*Math.sin(time*13+i*2+b.id),s=scale*(b.wall?.16:.24)*f;
    const gr=c.createRadialGradient(p.x,p.y-s*.6,1,p.x,p.y-s*.6,s*2);gr.addColorStop(0,'rgba(255,190,90,.35)');gr.addColorStop(1,'rgba(255,120,40,0)');c.fillStyle=gr;c.fillRect(p.x-s*2,p.y-s*2.6,s*4,s*4);
    c.fillStyle='rgba(235,96,30,.9)';c.beginPath();c.moveTo(p.x-s*.6,p.y);c.quadraticCurveTo(p.x-s*.7,p.y-s,p.x+Math.sin(time*9+i)*s*.2,p.y-s*1.9);c.quadraticCurveTo(p.x+s*.7,p.y-s,p.x+s*.6,p.y);c.fill();
    c.fillStyle='rgba(255,218,120,.95)';c.beginPath();c.moveTo(p.x-s*.3,p.y);c.quadraticCurveTo(p.x-s*.35,p.y-s*.6,p.x,p.y-s*1.15);c.quadraticCurveTo(p.x+s*.35,p.y-s*.6,p.x+s*.3,p.y);c.fill();}}
  // particles
  for(const p of S.parts){if(p.k==='wake'||p.k==='ring')continue;const q=P(Sfn,scale,p.x,p.y,p.z);if(q.x<-60||q.y<-60||q.x>w+60||q.y>h+60)continue;const a=1-p.life/p.max;
   if(p.k==='dust'){c.fillStyle=`rgba(${p.col},${(a*.42).toFixed(3)})`;c.beginPath();c.ellipse(q.x,q.y,scale*p.r,scale*p.r*.7,0,0,TAU);c.fill();}
   else if(p.k==='smoke'){const v=p.dark?52:118;c.fillStyle=`rgba(${v},${v-4},${v-10},${(a*.5).toFixed(3)})`;c.beginPath();c.arc(q.x,q.y,scale*p.r,0,TAU);c.fill();}
   else if(p.k==='drop'){c.fillStyle=`rgba(225,240,245,${(a*.9).toFixed(3)})`;c.beginPath();c.arc(q.x,q.y,Math.max(1,scale*p.r),0,TAU);c.fill();}
   else if(p.k==='chip'){c.fillStyle=p.col;c.fillRect(q.x-scale*p.r,q.y-scale*p.r,scale*p.r*2,scale*p.r*2);}
   else if(p.k==='spark'){c.fillStyle=`rgba(255,226,150,${a.toFixed(3)})`;c.fillRect(q.x-1,q.y-1,2.2,2.2);}}
  // projectiles (with ground shadow)
  for(const p of S.proj){if(p.t<0||p.done)continue;const t=Math.min(1,p.t/p.flight),x=p.x0+(p.x1-p.x0)*t,y=p.y0+(p.y1-p.y0)*t,z=p.z0+(p.z1-p.z0)*t+p.arc*4*t*(1-t);const q=P(Sfn,scale,x,y,z),gq=P(Sfn,scale,x,y,0);if(q.x<-60||q.y<-60||q.x>w+60||q.y>h+60)continue;
   const t2=Math.min(1,t+.03),x2=p.x0+(p.x1-p.x0)*t2,y2=p.y0+(p.y1-p.y0)*t2,z2=p.z0+(p.z1-p.z0)*t2+p.arc*4*t2*(1-t2),q2=P(Sfn,scale,x2,y2,z2),ang=Math.atan2(q2.y-q.y,q2.x-q.x);
   c.fillStyle='rgba(20,26,16,.28)';c.beginPath();c.ellipse(gq.x,gq.y,p.type==='stone'?scale*.13:scale*.08,p.type==='stone'?scale*.06:scale*.025,0,0,TAU);c.fill();
   c.save();c.translate(q.x,q.y);c.rotate(ang);
   if(p.type==='stone'){c.rotate(-ang);const r=Math.max(2.5,scale*.12);const gr=c.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r);gr.addColorStop(0,'#c9c6b6');gr.addColorStop(1,'#55534a');c.fillStyle=gr;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='#2a2a24';c.lineWidth=.8;c.stroke();}
   else if(p.type==='firepot'){const r=Math.max(2,scale*.09);c.fillStyle='rgba(255,150,40,.35)';c.beginPath();c.arc(0,0,r*2.2,0,TAU);c.fill();c.fillStyle='#3a2a1c';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.fillStyle='#ffcf6a';c.beginPath();c.arc(-r*.6,0,r*.6,0,TAU);c.fill();}
   else{const L=scale*(p.type==='javelin'?.5:p.type==='bolt'?.26:.38),wd=p.type==='javelin'?2:p.type==='bolt'?1.8:1.5;c.strokeStyle='#2c2416';c.lineWidth=wd+1.2;c.beginPath();c.moveTo(-L/2,0);c.lineTo(L/2,0);c.stroke();c.strokeStyle=p.type==='javelin'?'#a07a48':'#cbb07a';c.lineWidth=wd;c.beginPath();c.moveTo(-L/2,0);c.lineTo(L/2,0);c.stroke();
    c.fillStyle='#d8d8cc';c.beginPath();c.moveTo(L/2+3,0);c.lineTo(L/2-1,-2);c.lineTo(L/2-1,2);c.fill();if(p.type==='arrow'){c.fillStyle='#e8e0c8';c.beginPath();c.moveTo(-L/2,0);c.lineTo(-L/2-3,-2.2);c.lineTo(-L/2+2,0);c.lineTo(-L/2-3,2.2);c.fill();}}
   c.restore();}
  c.restore();}
 return{update,drawGround,drawCorpses,drawAir,state:S,projectileType};}
return{create,projectileType,PROJ};
});
