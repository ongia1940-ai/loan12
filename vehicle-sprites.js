// Loạn 12 Sứ Quân — 8-direction ship and catapult puppets for the sprite atlas (unit-sprites.js).
// Drawn in the same 2.5D rig as soldiers: P(forward, side, up). Visual only.
(function(root,factory){const S=typeof module==='object'?require('./unit-sprites.js'):root.LoanSprites;const api=factory(S);if(typeof module==='object')module.exports=api;else root.LoanVehicles=api;})(typeof globalThis!=='undefined'?globalThis:this,function(LS){
'use strict';
const TAU=Math.PI*2,{rig,hull,fillPoly,seg,blob,shadeHex}=LS;
const hex=c=>{if(typeof c!=='string')return'#888888';if(c[0]==='#'&&c.length>=7)return c.slice(0,7);if(c[0]==='#'&&c.length===4)return'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return'#888888';};
const sh=(c,k)=>shadeHex(hex(c),k);
// Hull shapes: L half length, W half beam, D deck height, sheer = rise of bow/stern, oars per side, mast heights, crew.
const SHIPS={
 scout:{L:.85,W:.19,D:.12,sheer:.12,oars:2,masts:[{f:.05,h:.85,w:.42}],crew:[[.35,0],[-.45,0]],head:1.2},
 fishingBoat:{L:.8,W:.23,D:.12,sheer:.14,oars:0,masts:[{f:.1,h:.8,w:.4}],crew:[[-.45,0],[.4,.05]],net:true,basket:true,head:1.2},
 transport:{L:1.1,W:.33,D:.15,sheer:.16,oars:2,masts:[],canopy:[-.55,.35],crew:[[-.85,0]],head:1.3,cargo:6},
 archerBoat:{L:1.0,W:.25,D:.14,sheer:.16,oars:3,masts:[{f:.2,h:.95,w:.45}],crew:[[.55,-.08,'bow'],[-.15,.08,'bow'],[-.7,0]],head:1.4},
 ramBoat:{L:1.15,W:.3,D:.17,sheer:.12,oars:4,masts:[],ram:true,shields:true,crew:[[.55,0],[-.8,0]],head:1.2},
 serpent:{L:1.2,W:.27,D:.16,sheer:.24,oars:5,masts:[{f:.1,h:1.05,w:.5}],dragon:true,crew:[[.6,0,'bow'],[-.8,0]],head:1.5},
 fireboat:{L:.95,W:.25,D:.14,sheer:.18,oars:3,masts:[{f:-.05,h:.85,w:.4}],pots:true,crew:[[-.65,0]],head:1.3},
 warbarge:{L:1.3,W:.4,D:.18,sheer:.14,oars:4,masts:[{f:.55,h:1.0,w:.45}],cabin:{f0:-.75,f1:.25,w:.3,h:.36,roof:'#7a4a2c'},crew:[[.85,0]],head:1.6,cargo:10},
 towerShip:{L:1.35,W:.42,D:.2,sheer:.16,oars:4,masts:[{f:.75,h:1.15,w:.42}],tower:true,crew:[[.95,0,'bow'],[-1.0,0]],head:2.1},
 flagship:{L:1.6,W:.46,D:.22,sheer:.28,oars:6,masts:[{f:.55,h:1.6,w:.7},{f:-.25,h:1.25,w:.55}],dragon:true,cabin:{f0:-1.15,f1:-.45,w:.34,h:.42,roof:'#8c2f25',tiers:2},crew:[[1.05,0,'bow'],[.05,-.2,'bow'],[.05,.2,'bow']],head:2.4},
 raft:{L:.6,W:.32,D:.06,sheer:0,oars:0,masts:[],raft:true,head:.9}
};
function profile(sp){const{L,W,D,sheer}=sp,raft=sp.raft;return f=>{const t=f/L;let w;if(raft)w=W;else if(t<0)w=W*Math.sqrt(Math.max(0,1-Math.pow(-t,4)))*.92+W*.08*(1+t);else w=W*Math.pow(Math.max(0,1-Math.pow(t,1.7)),.62);if(t<-.98&&!raft)w=Math.max(w,W*.5);return{w,h:D+sheer*t*t};};}
function figure(c,P,s,f,sd,h,team,style,tool,frame,action){const coat=style&&style.tunic?style.tunic:'#7b6a48',hb=h;seg(c,P(f,sd,hb),P(f,sd,hb+.25),coat,Math.max(2,s*.09));seg(c,P(f,sd,hb+.18),P(f,sd,hb+.21),hex(team),Math.max(1.5,s*.06));blob(c,P(f,sd,hb+.32),s*.055,s*.06,'#d2ab80');
 fillPoly(c,[P(f-.13,sd,hb+.33),P(f,sd-.13,hb+.33),P(f+.13,sd,hb+.33),P(f,sd+.13,hb+.33)].length?hull([P(f-.13,sd,hb+.34),P(f,sd-.13,hb+.34),P(f+.13,sd,hb+.34),P(f,sd+.13,hb+.34),P(f,sd,hb+.45)]):[],'#d8c58a','#7a6a3e',.8);
 if(tool==='bow'){const pull=action==='attack'?Math.min(1,frame/3):0;seg(c,P(f+.12,sd,hb+.08),P(f+.14,sd,hb+.42),'#6b4a26',Math.max(1,s*.025));if(pull)seg(c,P(f+.13,sd,hb+.25),P(f+.13-pull*.15,sd,hb+.25),'#efe3b8',1);}
 else if(tool==='oar'){}}
function sail(c,P,s,m,deckH,team,style,action,frame){const col=style&&style.banner?style.banner.color:hex(team),edge=style&&style.banner?style.banner.edge:'#3b2d1c',top=deckH+m.h,base=deckH+m.h*.22,bulge=(action==='walk'?.08:.04)+Math.sin(frame*.8)*.012,w=m.w;
 const pts=[];const cols=[[m.f+w*.18,base],[m.f-w*.82,base+.02],[m.f-w*.7,top-.08],[m.f+w*.08,top]];for(const[ff,uu]of cols)pts.push(P(ff,0,uu));
 const mid=P(m.f-w*.32,bulge,(base+top)/2);fillPoly(c,hull([...pts,mid]),col,sh(edge,1),1);
 // battens (bamboo ribs of a junk sail)
 for(let i=1;i<5;i++){const t=i/5,u=base+(top-base)*t,a=m.f+w*.18+(w*.08-w*.18)*t,b=m.f-w*.82+(w*.12)*t;seg(c,P(a,bulge*.4,u),P(b,bulge*.4,u),sh(col,.62),Math.max(.8,s*.018));}
 const e=P(m.f-w*.34,bulge*.7,(base+top)/2);blob(c,e,s*w*.16,s*w*.14,hex(team),sh(edge,1));blob(c,e,s*w*.07,s*w*.06,sh(edge,1.1));}
function box(c,P,f0,f1,w,h0,h1,wall,roof,roofH,sa,ca){const C=(f,sd,u)=>P(f,sd,u);const faces=[];
 if(sa>0)faces.push([[f1,-w],[f1,w]]);if(sa<0)faces.push([[f0,-w],[f0,w]]);if(ca>0)faces.push([[f0,w],[f1,w]]);if(ca<0)faces.push([[f0,-w],[f1,-w]]);
 for(const fc of faces){const[[a1,b1],[a2,b2]]=fc,lit=(a1===a2)?.85:1.05;fillPoly(c,[C(a1,b1,h0),C(a2,b2,h0),C(a2,b2,h1),C(a1,b1,h1)],sh(wall,lit),sh(wall,.45),.8);
  // lattice windows
  for(let i=1;i<3;i++){const t=i/3;const pa=C(a1+(a2-a1)*t,b1+(b2-b1)*t,h0+(h1-h0)*.3),pb=C(a1+(a2-a1)*t,b1+(b2-b1)*t,h0+(h1-h0)*.8);seg(c,pa,pb,sh(wall,.5),1);}}
 const e=.08,rh=roofH||.22,eave=[C(f0-e,-w-e,h1),C(f1+e,-w-e,h1),C(f1+e,w+e,h1),C(f0-e,w+e,h1)],ridge=[C(f0+.05,0,h1+rh),C(f1-.05,0,h1+rh)];
 fillPoly(c,hull([...eave,...ridge]),roof,sh(roof,.5),1);const near=ca>0?w+e:-w-e;fillPoly(c,[C(f0-e,near,h1),C(f1+e,near,h1),ridge[1],ridge[0]],sh(roof,1.18),sh(roof,.5),.8);seg(c,ridge[0],ridge[1],sh(roof,.55),Math.max(1.2,(ridge[1].x-ridge[0].x)*0+1.6));
 // upturned eave tips (đầu đao)
 for(const p of[eave[0],eave[1],eave[2],eave[3]])blob(c,{x:p.x,y:p.y-1.5},1.5,1.5,sh(roof,1.35));}
function drawShip(kind){const sp=SHIPS[kind];const prof=profile(sp);return function(c,dir,action,frame,team,s,opts={}){const{P,sa,ca}=rig(dir,s),style=opts.style||null,L=sp.L,N=16;team=hex(team);let n=0;
 const fs=[];for(let i=0;i<=N;i++)fs.push(-L+2*L*i/N);const pr=fs.map(prof);
 const gun=side=>fs.map((f,i)=>P(f,side*pr[i].w,pr[i].h)),wat=side=>fs.map((f,i)=>P(f,side*pr[i].w*.82,0));
 const hullCol=sp.raft?'#a37a45':kind==='flagship'?'#5e3522':kind==='ramBoat'?'#4f4034':'#6d4b2c',deckCol=sp.raft?'#c49a5c':'#a8814f';
 // water shadow + foam lip under the hull
 fillPoly(c,hull(fs.map((f,i)=>P(f*1.08,pr[i].w*1.25,-.02)).concat(fs.map((f,i)=>P(f*1.08,-pr[i].w*1.25,-.02)))),'rgba(8,28,40,.28)');
 const nearSide=ca>=0?1:-1,swing=action==='walk'?Math.sin(frame/8*TAU):0,lift=action==='walk'?Math.cos(frame/8*TAU):0;
 const oarF=i=>sp.oars<2?0:-L*.5+L*1.0*i/(sp.oars-1);
 const oars=side=>{for(let i=0;i<sp.oars;i++){const f=oarF(i),q=prof(f),a=P(f,side*q.w,q.h),b=P(f-.18-swing*.22,side*(q.w+.55),lift>0?.1*lift:-.02);seg(c,a,b,'#5b4026',Math.max(1,s*.03));blob(c,b,s*.045,s*.025,'#7a5733');n++;}};
 oars(-nearSide);
 // far band
 const band=side=>[...gun(side),...wat(side).reverse()];
 fillPoly(c,band(-nearSide),sh(hullCol,.7),sh(hullCol,.4),1);
 // stern transom when it faces away
 const tr=[P(-L,-pr[0].w,pr[0].h),P(-L,pr[0].w,pr[0].h),P(-L,pr[0].w*.82,0),P(-L,-pr[0].w*.82,0)];
 if(sa>0)fillPoly(c,tr,sh(hullCol,.6),sh(hullCol,.35),1);
 // deck
 fillPoly(c,[...gun(1),...gun(-1).reverse()],deckCol,sh(deckCol,.55),1);n++;
 if(sp.raft){for(let i=-3;i<=3;i++)seg(c,P(-L,i*.09,pr[0].h+.01),P(L,i*.09,pr[0].h+.01),sh(deckCol,.72),1);}
 else for(let i=1;i<6;i++){const f=-L*.8+L*1.6*i/6,q=prof(f);seg(c,P(f,-q.w*.9,q.h+.005),P(f,q.w*.9,q.h+.005),sh(deckCol,.8),.8);}
 if(sa<=0)fillPoly(c,tr,sh(hullCol,.85),sh(hullCol,.4),1);
 // near band with team trim and painted eye
 fillPoly(c,band(nearSide),hullCol,sh(hullCol,.4),1);n++;
 const gn=gun(nearSide);c.strokeStyle=team;c.lineWidth=Math.max(1.4,s*.05);c.beginPath();gn.forEach((p,i)=>{const q={x:p.x,y:p.y+s*.035};i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.stroke();
 if(!sp.raft){const ef=L*.72,q=prof(ef),eye=P(ef,nearSide*q.w*.98,q.h*.55);blob(c,eye,s*.055,s*.04,'#f2ead0','#2a1c12');blob(c,eye,s*.024,s*.024,'#1c120c');
  if(sp.shields){for(let i=0;i<5;i++){const f=-L*.55+L*1.1*i/4,q2=prof(f);const p=P(f,nearSide*q2.w*1.01,q2.h+.02);blob(c,p,s*.07,s*.07,i%2?team:(style&&style.shield?style.shield.colors[1]:'#d9c48a'),'#2a1c12');}}}
 oars(nearSide);
 // superstructure, sorted by depth
 const ops=[],add=(z,fn)=>ops.push({z,fn});
 if(sp.ram){const q=prof(L);add(P(L,0,0).z+.5,()=>{fillPoly(c,hull([P(L-.12,-.13,.04),P(L-.12,.13,.04),P(L+.42,0,.06),P(L-.1,0,q.h+.02),P(L-.12,0,-.02)]),'#4c5458','#22282a',1);seg(c,P(L-.05,0,q.h),P(L+.4,0,.07),'#9aa6a8',1.2);});}
 if(sp.dragon){const q=prof(L);add(P(L,0,0).z+.4,()=>{const base=P(L-.05,0,q.h),neck=P(L+.12,0,q.h+.35),head=P(L+.22,0,q.h+.5);c.strokeStyle='#b8862e';c.lineWidth=Math.max(2,s*.08);c.beginPath();c.moveTo(base.x,base.y);c.quadraticCurveTo(neck.x,neck.y,head.x,head.y);c.stroke();blob(c,head,s*.1,s*.075,'#d4a63c','#5a3a12');const jaw=P(L+.36,0,q.h+.47);seg(c,head,jaw,'#c23a22',Math.max(1.2,s*.035));blob(c,P(L+.2,nearSide*.04,q.h+.55),s*.02,s*.02,'#1a0d06');for(let i=0;i<3;i++)seg(c,P(L+.1-i*.06,0,q.h+.4+i*.05),P(L+.02-i*.06,0,q.h+.56+i*.05),'#7a2a18',1.2);});
  const st=-L;add(P(st,0,0).z,()=>{const q2=prof(st+.05);c.strokeStyle='#b8862e';c.lineWidth=Math.max(1.6,s*.05);const a=P(st+.05,0,q2.h),b=P(st-.15,0,q2.h+.45);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(P(st-.2,0,q2.h+.1).x,P(st-.2,0,q2.h+.1).y,b.x,b.y);c.stroke();});}
 if(sp.canopy){const[f0,f1]=sp.canopy;add(P((f0+f1)/2,0,0).z,()=>{const pts=[];const ribs=[];for(let i=0;i<=5;i++){const f=f0+(f1-f0)*i/5,q=prof(f),R=q.w*.95,arc=[];for(let k=0;k<=8;k++){const t=k/8*Math.PI;const p=P(f,Math.cos(t)*R,q.h+Math.sin(t)*R*1.05);pts.push(p);arc.push(p);}ribs.push(arc);}
   fillPoly(c,hull(pts),'#9c8656','#4c3e22',1);for(const arc of ribs){c.strokeStyle='#5c4c2c';c.lineWidth=1;c.beginPath();arc.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
   const cnt=opts.variant||0;for(let i=0;i<Math.min(cnt,6);i++){const f=f1+.08+(i%2)*.12,sd=(i<2?-1:i<4?1:0)*.12+(i>=4?(i-4.5)*.2:0);blob(c,P(Math.min(L*.7,f+Math.floor(i/2)*.05),sd,prof(f1).h+.12),s*.05,s*.05,'#d2ab80');fillPoly(c,hull([P(f+.1,sd,prof(f1).h+.16),P(f-.1,sd,prof(f1).h+.16),P(f,sd+.1,prof(f1).h+.16),P(f,sd-.1,prof(f1).h+.16),P(f,sd,prof(f1).h+.26)]),team,'#2a2016',.6);}});}
 if(sp.cabin){const cb=sp.cabin,q=prof((cb.f0+cb.f1)/2);add(P((cb.f0+cb.f1)/2,0,0).z,()=>{box(c,P,cb.f0,cb.f1,cb.w,q.h,q.h+cb.h,'#8a6038',cb.roof,.24,sa,ca);if(cb.tiers===2)box(c,P,cb.f0+.12,cb.f1-.12,cb.w*.72,q.h+cb.h+.12,q.h+cb.h*1.75+.12,'#94683c',cb.roof,.2,sa,ca);});}
 if(sp.tower){const q=prof(-.2);add(P(-.2,0,0).z,()=>{box(c,P,-.75,.35,.32,q.h,q.h+.4,'#7f5a35','#5b3a24',.16,sa,ca);box(c,P,-.6,.2,.26,q.h+.52,q.h+.9,'#8a6238','#6e3626',.24,sa,ca);for(let i=0;i<4;i++){const f=-.55+i*.25;blob(c,P(f,(ca>0?1:-1)*.27,q.h+.7),s*.05,s*.05,'#d2ab80');}});}
 if(sp.pots){for(let i=0;i<3;i++){const f=-.35+i*.32,q=prof(f);add(P(f,0,0).z+.01,()=>{blob(c,P(f,0,q.h+.08),s*.08,s*.07,'#3a2a1c','#1a120a');const fl=.06+.03*Math.sin(frame*2+i);blob(c,P(f,0,q.h+.2),s*fl,s*(fl+.04),'rgba(255,160,50,.85)');blob(c,P(f,0,q.h+.24),s*fl*.5,s*fl*.7,'rgba(255,236,150,.9)');});}}
 if(sp.raft){add(1,()=>{for(let i=0;i<3;i++){const f=-.2+i*.2,fl=.12+.04*Math.sin(frame*2.3+i*2);blob(c,P(f,0,.25),s*fl,s*(fl+.1),'rgba(240,120,40,.85)');blob(c,P(f,0,.3),s*fl*.55,s*fl,'rgba(255,230,140,.9)');}blob(c,P(0,0,.12),s*.22,s*.1,'#5a4128');});}
 if(sp.basket){const q=prof(-.15);add(P(-.15,0,0).z,()=>{blob(c,P(-.15,.05,q.h+.06),s*.09,s*.06,'#8f7443','#4a3a20');if(opts.variant)blob(c,P(-.15,.05,q.h+.1),s*.06,s*.03,'#b9c0c4');});}
 if(sp.net&&action==='work'){const q=prof(.25);add(P(.25,nearSide*.6,0).z+1,()=>{const a=P(.25,nearSide*q.w,q.h+.1),drop=.3+.1*Math.sin(frame);c.strokeStyle='rgba(225,215,180,.75)';c.lineWidth=.8;for(let k=-3;k<=3;k++){const b=P(.25+k*.08,nearSide*(q.w+.45),-.02-drop*.1);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}c.beginPath();for(let k=-3;k<=3;k++){const b=P(.25+k*.08,nearSide*(q.w+.45),-.02);k===-3?c.moveTo(b.x,b.y):c.lineTo(b.x,b.y);}c.stroke();});}
 for(const m of sp.masts){const q=prof(m.f);add(P(m.f,0,0).z+.02,()=>{seg(c,P(m.f,0,q.h),P(m.f,0,q.h+m.h+.05),'#4f3820',Math.max(1.4,s*.045));sail(c,P,s,m,q.h,team,style,action,frame);});}
 for(const cr of sp.crew||[]){const[f,sd,tool]=cr,q=prof(f);add(P(f,sd,0).z+.03,()=>figure(c,P,s,f,sd,q.h,team,style,tool,frame,action));}
 // stern flag in team colour
 if(!sp.raft){const fl=-L+.12,q=prof(fl),hgt=kind==='flagship'?.95:.6;add(P(fl,0,0).z+.05,()=>{seg(c,P(fl,0,q.h),P(fl,0,q.h+hgt),'#4a3420',Math.max(1,s*.03));const wv=Math.sin(frame*1.1)*.04;fillPoly(c,[P(fl,0,q.h+hgt),P(fl-.34,wv,q.h+hgt-.06),P(fl-.3,-wv,q.h+hgt-.16),P(fl,0,q.h+hgt-.2)],team,sh(team,.5),.8);});}
 if(kind==='flagship'){for(const sd of[-1,1]){const f=.6,q=prof(f);add(P(f,sd*.3,0).z,()=>{seg(c,P(f,sd*q.w*.9,q.h),P(f,sd*q.w*.9,q.h+.55),'#4a3420',1);fillPoly(c,[P(f,sd*q.w*.9,q.h+.55),P(f-.22,sd*q.w*.9,q.h+.5),P(f-.2,sd*q.w*.9,q.h+.36),P(f,sd*q.w*.9,q.h+.38)],style&&style.banner?style.banner.color:team,'#2b1d10',.6);});}}
 ops.sort((a,b)=>a.z-b.z);for(const o of ops){o.fn();n++;}
 if(opts.hurt){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,120,90,.18)';c.fillRect(-s*3,-s*3,s*6,s*4);c.restore();}
 return n;};}
// ---------- catapult (traction trebuchet on a wheeled frame) ----------
function drawCatapult(c,dir,action,frame,team,s,opts={}){const{P,sa,ca}=rig(dir,s);team=hex(team);let n=0;const wood='#8b6a3e',dark='#5a4128';
 const wheel=(f,sd)=>{const pts=[];for(let i=0;i<14;i++){const t=i/14*TAU;pts.push(P(f+Math.cos(t)*.16,sd,.16+Math.sin(t)*.16));}fillPoly(c,pts,'#4a3520','#22170c',1);const hub=P(f,sd,.16);for(let i=0;i<4;i++){const t=i/4*Math.PI+(action==='walk'?frame/8*Math.PI:0);seg(c,P(f+Math.cos(t)*.15,sd,.16+Math.sin(t)*.15),P(f-Math.cos(t)*.15,sd,.16-Math.sin(t)*.15),'#7a5a34',1);}blob(c,hub,s*.03,s*.03,'#c8b88a');};
 const near=ca>=0?1:-1;wheel(.42,-near*.34);wheel(-.42,-near*.34);
 // base frame
 const base=[P(-.62,-.3,.22),P(.62,-.3,.22),P(.62,.3,.22),P(-.62,.3,.22)];fillPoly(c,base,wood,dark,1);for(const sd of[-.3,.3])fillPoly(c,[P(-.62,sd,.22),P(.62,sd,.22),P(.62,sd,.14),P(-.62,sd,.14)],sh(wood,.75),dark,1);
 const t=action==='attack'?Math.min(1,frame/5):0,a=-2.53-2.56*t,pv={f:-.05,u:1.05},Lg=1.15,Ls=.42;
 const armOps=()=>{const le=P(pv.f+Math.cos(a)*Lg,0,pv.u+Math.sin(a)*Lg),se=P(pv.f-Math.cos(a)*Ls,0,pv.u-Math.sin(a)*Ls),pvP=P(pv.f,0,pv.u);seg(c,le,se,'#6e5030',Math.max(2,s*.07));seg(c,le,pvP,'#9a7a48',Math.max(1,s*.03));
  const cw=pv.u-Math.sin(a)*Ls;fillPoly(c,hull([P(pv.f-Math.cos(a)*Ls-.14,-.14,cw-.05),P(pv.f-Math.cos(a)*Ls+.14,-.14,cw-.05),P(pv.f-Math.cos(a)*Ls+.14,.14,cw-.05),P(pv.f-Math.cos(a)*Ls-.14,.14,cw-.05),P(pv.f-Math.cos(a)*Ls-.14,-.14,cw-.33),P(pv.f-Math.cos(a)*Ls+.14,.14,cw-.33)]),'#5c5a50','#2a2a24',1);
  if(t<.8){const sl=P(pv.f+Math.cos(a)*Lg,0,pv.u+Math.sin(a)*Lg-.28);seg(c,le,sl,'#cbb98a',1);blob(c,sl,s*.06,s*.06,'#8f8c80','#3a3830');}};
 // A-frame uprights: draw far one, arm, near one
 const upright=sd=>{seg(c,P(-.3,sd,.22),P(pv.f,sd,pv.u),wood,Math.max(2,s*.07));seg(c,P(.25,sd,.22),P(pv.f,sd,pv.u),sh(wood,.85),Math.max(2,s*.07));};
 upright(-near*.24);seg(c,P(pv.f,-.26,pv.u),P(pv.f,.26,pv.u),'#4a3520',Math.max(2,s*.06));armOps();upright(near*.24);
 wheel(.42,near*.34);wheel(-.42,near*.34);
 // team pennant
 seg(c,P(.55,near*.28,.22),P(.55,near*.28,.85),'#4a3420',1);fillPoly(c,[P(.55,near*.28,.85),P(.3,near*.28,.8),P(.32,near*.28,.68),P(.55,near*.28,.7)],team,sh(team,.5),.8);n+=8;
 if(opts.hurt){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,120,90,.18)';c.fillRect(-s*2,-s*3,s*4,s*4);c.restore();}
 return n;}
const cellFor=(L,top)=>b=>({w:Math.ceil(b*(2*L+1.6)),h:Math.ceil(b*(top+L*.6+.9)),ox:Math.ceil(b*(L+.8)),oy:Math.ceil(b*(top+.45))});
for(const k of Object.keys(SHIPS)){const sp=SHIPS[k],top=Math.max(sp.raft?.9:sp.D+sp.sheer+(k==='flagship'?1.1:.8),sp.D+sp.sheer+Math.max(0,...sp.masts.map(m=>m.h+.15)),sp.dragon?1:0,sp.tower?1.4:0,sp.cabin?(sp.cabin.tiers===2?1.3:.85):0);LS.register(k,{draw:drawShip(k),cell:cellFor(sp.L+(sp.ram||sp.dragon?.45:0),top),shadow:false,ring:Math.max(.5,sp.L*.75),head:sp.head,stride:.9,cargo:sp.cargo||(sp.basket?1:0)});}
LS.register('catapult',{draw:drawCatapult,cell:b=>({w:Math.ceil(b*3.4),h:Math.ceil(b*3.6),ox:Math.ceil(b*1.7),oy:Math.ceil(b*2.7)}),shadow:.62,ring:.75,head:1.9,stride:1.2});
return{SHIPS,drawShip,drawCatapult};
});
