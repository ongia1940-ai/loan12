// Loạn 12 Sứ Quân — 2.5D walls, gates and wall towers (Canvas 2D). Visual only.
// Pieces sit on single tiles and auto-connect to neighbouring pieces of the same owner (orthogonal; diagonal when no orthogonal link).
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanFort=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAT={
 palisade:{h:.95,t:.3,wall:'#8a6a3e',dark:'#4a3520',top:'#b8935a'},
 earthwall:{h:.85,t:.46,wall:'#b47a4c',dark:'#6a4128',top:'#7a6a40'},
 stonewall:{h:1.15,t:.48,wall:'#a3a296',dark:'#55564e',top:'#c4c3b4'}};
const ORTHO=[[1,0],[0,1],[-1,0],[0,-1]],DIAG=[[1,1],[-1,1],[-1,-1],[1,-1]];
let index=null,indexKey='';
function buildIndex(g){const key=(g.buildings||[]).length+':'+(g._occVersion||0)+':'+Math.floor((g.time||0)*4);if(index&&indexKey===key&&index.g===g)return index;const m=new Map();for(const b of g.buildings||[])if(b.wall&&b.hp>0)m.set(Math.floor(b.x)+','+Math.floor(b.y),b);index={g,m};indexKey=key;return index;}
function pieceAt(g,x,y,owner){const b=buildIndex(g).m.get(x+','+y);return b&&b.owner===owner?b:null;}
function links(g,b){const x=Math.floor(b.x),y=Math.floor(b.y),out=[];const o=ORTHO.map(([dx,dy])=>!!pieceAt(g,x+dx,y+dy,b.owner));ORTHO.forEach(([dx,dy],i)=>{if(o[i])out.push([dx,dy]);});
 DIAG.forEach(([dx,dy])=>{if(pieceAt(g,x+dx,y+dy,b.owner)&&!pieceAt(g,x+dx,y,b.owner)&&!pieceAt(g,x,y+dy,b.owner))out.push([dx,dy]);});return out;}
const mat=b=>MAT[b.kind]||MAT[b.material]||MAT.palisade;
function shade(hex,k){const n=parseInt(hex.slice(1,7),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return`rgb(${f(n>>16&255)},${f(n>>8&255)},${f(n&255)})`;}
function poly(c,pts,fill,stroke,w=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function line(c,a,b,col,w){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
// Projector: world (x,y,z) -> screen; z in tile units of height (1 = one `scale`).
const proj=(S,scale)=>(x,y,z=0)=>{const p=S({x,y});return{x:p.x,y:p.y-z*scale};};
// Draws a prism from A to B (ground points) with thickness t and height h; returns the 4 top corners.
function prism(c,W,ax,ay,bx,by,t,h0,h1,m,opt={}){const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,nx=-dy/len*t/2,ny=dx/len*t/2;
 const q=[[ax+nx,ay+ny],[bx+nx,by+ny],[bx-nx,by-ny],[ax-nx,ay-ny]];const faces=[];
 for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],ex=b[0]-a[0],ey=b[1]-a[1],fnx=ey,fny=-ex;// outward normal for CW order
  const cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2,mx=(a[0]+b[0])/2-cx,my=(a[1]+b[1])/2-cy,sgn=(fnx*mx+fny*my)>0?1:-1,nX=fnx*sgn,nY=fny*sgn;if(nX+nY<=1e-6)continue;
  const light=nY>nX?1.04:.78;faces.push({a,b,light,side:i%2===0,d:(a[0]+b[0]+a[1]+b[1])/2});}
 faces.sort((u,v)=>u.d-v.d);for(const f of faces){const pts=[W(f.a[0],f.a[1],h0),W(f.b[0],f.b[1],h0),W(f.b[0],f.b[1],h1),W(f.a[0],f.a[1],h1)];if(opt.seamless&&f.side){poly(c,pts,shade(m.wall,f.light*(opt.tint||1)));line(c,pts[0],pts[1],m.dark,.9);line(c,pts[3],pts[2],m.dark,.9);}else poly(c,pts,shade(m.wall,f.light*(opt.tint||1)),m.dark,.8);if(opt.texture)opt.texture(f,pts);}
 const top=q.map(p=>W(p[0],p[1],h1));if(opt.seamless){poly(c,top,opt.topColor||m.top);line(c,top[0],top[1],m.dark,.8);line(c,top[2],top[3],m.dark,.8);}else poly(c,top,opt.topColor||m.top,m.dark,.8);return{q,top,faces};}
// Wall textures on a front face (pts = bottom-a, bottom-b, top-b, top-a)
const lerp=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
function earthLayers(c,pts,m){for(let i=1;i<4;i++){const t=i/4;line(c,lerp(pts[0],pts[3],t),lerp(pts[1],pts[2],t),shade(m.wall,.72),1);}}
function bricks(c,pts,m){for(let i=1;i<4;i++){const t=i/4,a=lerp(pts[0],pts[3],t),b=lerp(pts[1],pts[2],t);line(c,a,b,shade(m.wall,.66),.8);for(let k=1;k<4;k++){const u=(k+(i%2)*.5)/4;if(u>=1)continue;const p=lerp(a,b,u),q=lerp(lerp(pts[0],pts[3],t-.25),lerp(pts[1],pts[2],t-.25),u);line(c,p,q,shade(m.wall,.66),.8);}}}
function cracks(c,pts,hp){if(hp>.6)return;const n=hp<.3?3:1.5;for(let i=0;i<n;i++){const s=lerp(lerp(pts[3],pts[2],.25+i*.25),lerp(pts[0],pts[1],.25+i*.25),.1);let p=s;c.strokeStyle='rgba(30,20,10,.75)';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x,p.y);for(let k=0;k<4;k++){p={x:p.x+(k%2?3:-3),y:p.y+5};c.lineTo(p.x,p.y);}c.stroke();}}
// Palisade: row of sharpened bamboo/timber stakes.
function stakes(c,W,ax,ay,bx,by,h,m,scale,seed){const n=Math.max(2,Math.round(Math.hypot(bx-ax,by-ay)/.085));const pts=[];for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,hh=h*(.86+.14*((i*7+seed)%5)/4);pts.push({x,y,hh,d:x+y});}pts.sort((a,b)=>a.d-b.d);
 const w=Math.max(2,scale*.06);
 for(const p of pts){const a=W(p.x,p.y,0),b=W(p.x,p.y,p.hh);line(c,a,b,m.dark,w+1.6);line(c,a,b,m.wall,w);line(c,{x:a.x+w*.25,y:a.y},{x:b.x+w*.25,y:b.y},shade(m.wall,1.2),Math.max(.8,w*.3));const tip=W(p.x,p.y,p.hh+.12);poly(c,[{x:b.x-w/2,y:b.y},{x:b.x+w/2,y:b.y},tip],m.top,m.dark,.6);}
 // lashing bands
 for(const z of[.28,.68]){line(c,W(ax,ay,h*z),W(bx,by,h*z),'#5a4326',Math.max(1.2,scale*.03));}}
function segHeight(b,m){let h=m.h;if(b.constructing){const job=b.job;h*=Math.max(.15,job&&job.total?job.elapsed/job.total:.5);}else if(b.hp<b.maxHP*.3)h*=.82;return h;}
function drawSegment(c,W,b,m,cx,cy,dx,dy,h,scale,len=.5){const bx=cx+dx*len,by=cy+dy*len;const hp=b.hp/b.maxHP;
 if((b.material||b.kind)==='palisade'||m===MAT.palisade){// earth mound + stakes
  prism(c,W,cx,cy,bx,by,m.t*1.25,0,.08,{wall:'#7a6440',dark:'#4a3b26',top:'#8c7448'});stakes(c,W,cx,cy,bx,by,h,m,scale,Math.floor(cx*3+cy*5));return;}
 const isStone=m===MAT.stonewall;prism(c,W,cx,cy,bx,by,m.t,0,h,m,{seamless:true,texture:(f,pts)=>{isStone?bricks(c,pts,m):earthLayers(c,pts,m);cracks(c,pts,hp);}});
 if(isStone){// merlons (răng cưa)
  const n=Math.max(1,Math.round(len*Math.hypot(dx,dy)*5));const sides=[-1,1].sort((a,b)=>(-dy*a+dx*a)-(-dy*b+dx*b));for(const sd of sides)for(let i=0;i<n;i++){const t0=(i+.2)/n,t1=(i+.7)/n;const x0=cx+(bx-cx)*t0,y0=cy+(by-cy)*t0,x1=cx+(bx-cx)*t1,y1=cy+(by-cy)*t1;const l=Math.hypot(dx,dy),ox=-dy/l*m.t*.38*sd,oy=dx/l*m.t*.38*sd;prism(c,W,x0+ox,y0+oy,x1+ox,y1+oy,m.t*.2,h,h+.15,m);}}
 else{// thatch cap on rammed earth
  prism(c,W,cx,cy,bx,by,m.t*1.18,h,h+.07,{wall:'#8a7444',dark:'#4a3a20',top:'#a88d55'});}}
function post(c,W,b,m,cx,cy,h,scale,big){const r=(m===MAT.palisade?.2:m.t*.62)*(big?1.15:1);if(m===MAT.palisade){prism(c,W,cx-.16,cy,cx+.16,cy,.32,0,.08,{wall:'#7a6440',dark:'#4a3b26',top:'#8c7448'});stakes(c,W,cx-.07,cy+.07,cx+.07,cy-.07,h+.12,m,scale,3);return;}
 prism(c,W,cx-r,cy,cx+r,cy,r*2,0,h+(big?.2:.08),m,{texture:(f,pts)=>m===MAT.stonewall?bricks(c,pts,m):earthLayers(c,pts,m)});}
function scaffold(c,W,cx,cy,h){c.save();c.globalAlpha=.85;for(const[dx,dy]of[[-.4,-.4],[.4,-.4],[.4,.4],[-.4,.4]])line(c,W(cx+dx,cy+dy,0),W(cx+dx,cy+dy,h+.35),'#c8a36a',1.4);line(c,W(cx-.4,cy+.4,h*.6),W(cx+.4,cy+.4,h*.6),'#c8a36a',1.2);line(c,W(cx+.4,cy-.4,h*.6),W(cx+.4,cy+.4,h*.6),'#c8a36a',1.2);c.restore();}
function roof(c,W,cx,cy,r,z,hgt,col){const e=[W(cx-r,cy-r,z),W(cx+r,cy-r,z),W(cx+r,cy+r,z),W(cx-r,cy+r,z)],apex=W(cx,cy,z+hgt);poly(c,[e[0],e[1],apex],shade(col,.8),shade(col,.45),.8);poly(c,[e[3],e[0],apex],shade(col,.9),shade(col,.45),.8);poly(c,[e[1],e[2],apex],shade(col,.95),shade(col,.45),.8);poly(c,[e[2],e[3],apex],shade(col,1.15),shade(col,.45),.8);for(const p of e){c.fillStyle=shade(col,1.3);c.beginPath();c.arc(p.x,p.y-2,1.6,0,Math.PI*2);c.fill();}}
function flag(c,W,x,y,z,team,time,scale){if(!FLAGS)return;const a=W(x,y,z),b=W(x,y,z+.55);line(c,a,b,'#3a2a18',Math.max(1,scale*.03));const wv=Math.sin(time*5+x)*scale*.04;poly(c,[b,{x:b.x+scale*.32,y:b.y+scale*.05+wv},{x:b.x+scale*.28,y:b.y+scale*.17+wv},{x:b.x,y:b.y+scale*.2}],team,'#2a1c10',.7);}
let FLAGS=true;
function body(c,b,g,W,scale,team,time,L){const cx=b.x,cy=b.y,m=mat(b),h=segHeight(b,m);c.save();if(b.constructing)c.globalAlpha=.72;
 if(b.kind==='gate')drawGate(c,W,b,g,m,L,h,scale,team,time);
 else if(b.kind==='walltower')drawTower(c,W,b,g,m,L,h,scale,team,time);
 else{const segs=L.map(([dx,dy])=>({dx,dy,d:dx+dy})).sort((a,z)=>a.d-z.d),back=segs.filter(s=>s.d<0||s.d===0&&s.dx<0),front=segs.filter(s=>!back.includes(s));
  for(const s of back)drawSegment(c,W,b,m,cx,cy,s.dx,s.dy,h,scale,Math.abs(s.dx)&&Math.abs(s.dy)?.5:.5);
  const straight=L.length===2&&L[0][0]===-L[1][0]&&L[0][1]===-L[1][1];post(c,W,b,m,cx,cy,h,scale,!straight);
  for(const s of front)drawSegment(c,W,b,m,cx,cy,s.dx,s.dy,h,scale,.5);
  if(!straight&&!b.constructing&&m!==MAT.palisade&&(Math.floor(cx)+Math.floor(cy))%3===0)flag(c,W,cx,cy,h+.2,team,time,scale);}
 if(b.constructing)scaffold(c,W,cx,cy,h);
 c.restore();return true;}
// Flag positions per piece (drawn live so they keep waving when the piece is cached).
function flagSpot(b,g,L){const m=mat(b),h=segHeight(b,m);if(b.constructing)return null;if(b.kind==='gate')return{z:Math.max(h,m.h)+.45+.3};if(b.kind==='walltower')return{z:h+.75+1.0};const straight=L.length===2&&L[0][0]===-L[1][0]&&L[0][1]===-L[1][1];if(!straight&&m!==MAT.palisade&&(Math.floor(b.x)+Math.floor(b.y))%3===0)return{z:h+.2};return null;}
const cache=new Map();let makeCanvas=null;
function canMake(){if(makeCanvas)return true;if(typeof OffscreenCanvas!=='undefined'){makeCanvas=(w,h)=>new OffscreenCanvas(w,h);return true;}if(typeof document!=='undefined'&&document.createElement){makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};return true;}return false;}
const bucket=px=>Math.max(6,Math.round(2**(Math.round(Math.log2(Math.max(6,px))*8)/8)));
function draw(c,b,g,S,scale,selected,team,time=0,o={}){const W=proj(S,scale),cx=b.x,cy=b.y,L=links(g,b);
 if(selected){const d=[W(cx-.5,cy-.5),W(cx+.5,cy-.5),W(cx+.5,cy+.5),W(cx-.5,cy+.5)];poly(c,d,'rgba(240,220,140,.18)','#f3dc89',1.6);}
 const dpr=o.dpr||1,live=o.live||!canMake();
 if(live){FLAGS=true;body(c,b,g,W,scale,team,time,L);return true;}
 const bs=bucket(scale*dpr),hpB=b.hp>=b.maxHP*.6?0:b.hp>=b.maxHP*.3?1:2,prog=b.constructing?Math.round((b.job&&b.job.total?b.job.elapsed/b.job.total:.5)*6):-1,open=b.kind==='gate'&&g.gateOpen?(g.gateOpen(b)?1:0):0;
 const key=[b.kind,b.material||'',L.map(v=>v.join(',')).join(';'),hpB,prog,team,bs,open,b.locked?1:0,b.kind==='walltower'&&(b.shotAnim||0)>0?1:0].join('|');let e=cache.get(key);
 if(!e){if(cache.size>1600)cache.clear();const w=Math.ceil(bs*2.6),h=Math.ceil(bs*4.4),ox=w/2,oy=h-bs*1.1,cv=makeCanvas(w,h),cc=cv.getContext('2d');const Wl=(x,y,z=0)=>{const dx=x-cx,dy=y-cy;return{x:ox+(dx-dy)*bs,y:oy+(dx+dy)*bs*.5-z*bs};};FLAGS=false;body(cc,b,g,Wl,bs,team,time,L);FLAGS=true;e={cv,ox,oy,bs};cache.set(key,e);}
 const p=S({x:cx,y:cy}),k=scale/e.bs;c.drawImage(e.cv,p.x-e.ox*k,p.y-e.oy*k,e.cv.width*k,e.cv.height*k);
 const f=flagSpot(b,g,L);if(f)flag(c,W,cx,cy,f.z,team,time,scale);return true;}
function axisOf(L){const ex=L.some(([dx,dy])=>dx!==0&&dy===0),ey=L.some(([dx,dy])=>dy!==0&&dx===0);return ey&&!ex?'y':'x';}
function drawGate(c,W,b,g,m,L,h,scale,team,time){const cx=b.x,cy=b.y,ax=axisOf(L),ux=ax==='x'?1:0,uy=ax==='y'?1:0,pm=m===MAT.palisade?{wall:'#7b5c34',dark:'#3e2c18',top:'#a6834f'}:m,ph=Math.max(h,m.h)+.45;
 const open=g&&typeof g.gateOpen==='function'?g.gateOpen(b):false,locked=!!b.locked,r=.17;
 const pillar=s=>{const px=cx+ux*.4*s,py=cy+uy*.4*s;prism(c,W,px-r,py,px+r,py,r*2,0,ph,pm,{texture:(f,pts)=>m===MAT.stonewall?bricks(c,pts,m):null});};
 const doors=()=>{const wood='#6e4a26';if(open){for(const s of[-1,1]){const hx=cx+ux*.27*s,hy=cy+uy*.27*s,tx=hx+uy*.32,ty=hy+ux*.32;poly(c,[W(hx,hy,0),W(tx,ty,0),W(tx,ty,ph-.4),W(hx,hy,ph-.4)],shade(wood,.85),'#2c1c0c',.8);}}
  else{const a=W(cx-ux*.27,cy-uy*.27,0),bb=W(cx+ux*.27,cy+uy*.27,0),c2=W(cx+ux*.27,cy+uy*.27,ph-.4),d=W(cx-ux*.27,cy-uy*.27,ph-.4);poly(c,[a,bb,c2,d],wood,'#2c1c0c',1);line(c,lerp(a,bb,.5),lerp(d,c2,.5),'#2c1c0c',1.2);for(const t of[.3,.7])line(c,lerp(a,d,t),lerp(bb,c2,t),'#3c2a14',1.4);
   for(let i=0;i<3;i++)for(const t of[.25,.75]){const p=lerp(lerp(a,d,.25+i*.25),lerp(bb,c2,.25+i*.25),t);c.fillStyle='#c8a85a';c.beginPath();c.arc(p.x,p.y,1.3,0,Math.PI*2);c.fill();}
   if(locked){line(c,lerp(lerp(a,d,.45),lerp(bb,c2,.45),-.05),lerp(lerp(a,d,.45),lerp(bb,c2,.45),1.05),'#9a9a8a',2.4);}}};
 // short wall stubs to neighbours outside the pillars
 for(const[dx,dy]of L){if(dx&&dy)continue;drawSegment(c,W,b,m,cx+dx*.4,cy+dy*.4,dx,dy,h,scale,.1);}
 const backFirst=(ux+uy)>0;pillar(-1);doors();pillar(1);
 // lintel roof over the gate
 const z=ph,lx=.62*ux+.22*uy,ly=.62*uy+.22*ux;prism(c,W,cx-ux*.55,cy-uy*.55,cx+ux*.55,cy+uy*.55,.36,z-.12,z,{wall:'#6a4426',dark:'#2c1c0c',top:'#7a5030'});
 const e=[W(cx-lx,cy-ly,z),W(cx+lx-(ux?0:0),cy-ly+(uy?2*ly:0)-(uy?0:0),z)];const corners=[W(cx-ux*.66-uy*.28,cy-uy*.66-ux*.28,z),W(cx+ux*.66-uy*.28,cy+uy*.66-ux*.28,z),W(cx+ux*.66+uy*.28,cy+uy*.66+ux*.28,z),W(cx-ux*.66+uy*.28,cy-uy*.66+ux*.28,z)],r1=W(cx-ux*.45,cy-uy*.45,z+.32),r2=W(cx+ux*.45,cy+uy*.45,z+.32);
 poly(c,[corners[0],corners[1],r2,r1],'#7e3426','#3a160e',.8);poly(c,[corners[3],corners[2],r2,r1],'#9c4430','#3a160e',.8);poly(c,[corners[0],r1,corners[3]],'#6c2c20','#3a160e',.8);poly(c,[corners[1],r2,corners[2]],'#8a3a2a','#3a160e',.8);line(c,r1,r2,'#3a160e',1.6);
 for(const p of corners){c.fillStyle='#c4643e';c.beginPath();c.arc(p.x,p.y-2,1.7,0,Math.PI*2);c.fill();}
 flag(c,W,cx,cy,z+.3,team,time,scale);void e;void backFirst;}
function drawTower(c,W,b,g,m,L,h,scale,team,time){const cx=b.x,cy=b.y;
 for(const[dx,dy]of L.slice().sort((a,z)=>(a[0]+a[1])-(z[0]+z[1]))){if(dx+dy<0)drawSegment(c,W,b,m,cx+dx*.3,cy+dy*.3,dx,dy,h,scale,.2);}
 const r=.36,body=m===MAT.palisade?{wall:'#7b5c34',dark:'#3e2c18',top:'#a6834f'}:m,H=h+.75;prism(c,W,cx-r,cy,cx+r,cy,r*2,0,H,body,{texture:(f,pts)=>{if(m===MAT.stonewall)bricks(c,pts,m);else if(m===MAT.earthwall)earthLayers(c,pts,m);cracks(c,pts,b.hp/b.maxHP);}});
 // timber gallery with railing
 prism(c,W,cx-.46,cy,cx+.46,cy,.92,H,H+.08,{wall:'#6a4426',dark:'#2c1c0c',top:'#8a6438'});
 for(const[dx,dy]of[[-.44,-.44],[.44,-.44],[.44,.44],[-.44,.44]])line(c,W(cx+dx,cy+dy,H+.08),W(cx+dx,cy+dy,H+.55),'#4a3018',Math.max(1.2,scale*.04));
 for(const[a,z]of[[[-.44,.44],[.44,.44]],[[.44,-.44],[.44,.44]]])line(c,W(cx+a[0],cy+a[1],H+.28),W(cx+z[0],cy+z[1],H+.28),'#5a3a1c',1.2);
 // archer on the gallery
 const ap=W(cx+.1,cy+.15,H+.08),shoot=(b.shotAnim||0)>0;line(c,ap,{x:ap.x,y:ap.y-scale*.28},'#5a5a40',Math.max(2,scale*.09));c.fillStyle='#d2ab80';c.beginPath();c.arc(ap.x,ap.y-scale*.34,Math.max(1.5,scale*.06),0,Math.PI*2);c.fill();
 c.strokeStyle='#5a3a1c';c.lineWidth=1.2;c.beginPath();c.arc(ap.x+scale*.1,ap.y-scale*.2,scale*.16,-1.2,1.2);c.stroke();if(shoot){c.fillStyle='rgba(255,240,180,.8)';c.beginPath();c.arc(ap.x+scale*.22,ap.y-scale*.22,2.2,0,Math.PI*2);c.fill();}
 roof(c,W,cx,cy,.6,H+.55,.5,'#7e3426');flag(c,W,cx,cy,H+1.0,team,time,scale);
 for(const[dx,dy]of L){if(dx+dy>=0)drawSegment(c,W,b,m,cx+dx*.3,cy+dy*.3,dx,dy,h,scale,.2);}}
// Shadow pass (drawn on the ground before entities).
function shadows(c,g,S,scale,w,h){c.save();c.fillStyle='rgba(18,30,14,.24)';for(const b of g.buildings||[]){if(!b.wall||!(b.hp>0))continue;const p=S(b);if(p.x<-scale*3||p.y<-scale*3||p.x>w+scale*3||p.y>h+scale*3)continue;
  const m=mat(b),hh=(b.kind==='walltower'?m.h+1.6:b.kind==='gate'?m.h+.8:segHeight(b,m))*.6,cx=b.x,cy=b.y,t=b.kind==='walltower'?.4:m.t*.55,P=(x,y)=>S({x,y});
  const L=b.kind==='walltower'||b.kind==='gate'?[[0,0]]:links(g,b);if(!L.length)L.push([0,0]);
  for(const[dx,dy]of L){const ax=cx,ay=cy,bx=cx+dx*.5,by=cy+dy*.5,len=Math.hypot(dx,dy)||1,nx=-dy/len*t,ny=dx/len*t,sx=hh,sy=-hh;
   const r=dx||dy?0:t;const q=[[ax+nx-r,ay+ny-r],[bx+nx+r,by+ny-r],[bx+nx+sx+r,by+ny+sy-r],[bx-nx+sx+r,by-ny+sy+r],[ax-nx+sx-r,ay-ny+sy+r],[ax-nx-r,ay-ny+r]].map(v=>P(v[0],v[1]));
   c.beginPath();q.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();}}
 c.restore();}
return{MAT,links,draw,shadows,pieceAt,cache};
});
