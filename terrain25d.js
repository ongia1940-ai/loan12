// Loạn 12 Sứ Quân — 2.5D terrain renderer (Age-of-Empires style).
// Visual-only: heights, lighting and cached terrain chunks never change the
// simulation (pathing, combat and economy still read game.map only).
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanTerrain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ELEV=1;            // screen lift per height unit, in multiples of `scale`
const CHUNK=12;          // tiles per cached chunk side
const LEVELS=[16,26,42,68]; // bake scales (px per tile unit)
const HMAX=2.2,HMIN=-.5; // height range reserved in chunk canvases
const MAX_PIXELS=48e6;   // cache budget across all chunk canvases
const WATER=t=>t===3||t===4;
// Target elevation per tile type: 0 grass,1 mud,2 reeds,3 ford,4 deep river,5 hill,6 forest,7 cliff.
const TARGET=[.06,-.03,0,-.2,-.34,.78,.16,1.3];
const PRIORITY=[3,1,2,0,0,5,4,6]; // which tile bleeds over its neighbour at borders
const PALETTE=[['#79a847','#9cbb58'],['#8a6f4a','#a3865c'],['#a9b25f','#8fa050'],['#55b8ae','#3fa39a'],['#207a9e','#146a8d'],['#b3a26e','#97865e'],['#5f9240','#527f36'],['#aaa695','#7f7c6e']];
const SAND='#d6c28a';
const hash=(x,y,i=0)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+29,668265263)^Math.imul(i+1,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
const smooth=t=>t*t*(3-2*t);
function value(x,y,i){const xi=Math.floor(x),yi=Math.floor(y),fx=smooth(x-xi),fy=smooth(y-yi),a=hash(xi,yi,i),b=hash(xi+1,yi,i),c=hash(xi,yi+1,i),d=hash(xi+1,yi+1,i);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
const fbm=(x,y,i=0)=>value(x*.13,y*.13,i)*.6+value(x*.31,y*.31,i+3)*.3+value(x*.7,y*.7,i+5)*.1;
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const css=(c,k=1,a=1)=>`rgba(${Math.max(0,Math.min(255,c[0]*k))|0},${Math.max(0,Math.min(255,c[1]*k))|0},${Math.max(0,Math.min(255,c[2]*k))|0},${a})`;
const PAL=PALETTE.map(p=>p.map(rgb)),SANDC=rgb(SAND);
const dims=g=>({W:g.width||84,H:g.height||60});
const cache=new WeakMap();
const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
function state(g){let s=cache.get(g);if(!s||s.map!==g.map){s={map:g.map,heights:null,chunks:new Map(),pixels:0,tick:0};cache.set(g,s);}return s;}

// Corner height field, (W+1)*(H+1) vertices. Vertex (vx,vy) sits at world point (vx,vy).
// Per-tile target height. Hills/cliffs become rounded mounds: height grows with distance from their edge.
function tileTargets(g){const {W,H}=dims(g),t=new Float32Array(W*H),d=new Int16Array(W*H).fill(-1),q=[];
 for(let i=0;i<W*H;i++){const k=g.map[i];t[i]=TARGET[k]??0;if(k!==5&&k!==7){d[i]=0;q.push(i);}}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(d[j]<0){d[j]=d[i]+1;q.push(j);}}}
 for(let i=0;i<W*H;i++){const k=g.map[i];if(k===5||k===7){const dist=d[i]<0?6:d[i];t[i]=(k===7?.5:.18)+Math.min(dist,5)*(k===7?.26:.17)+(fbm(i%W,(i/W)|0,23)-.5)*.25;}}
 return t;}
function heightField(g){const s=state(g);if(s.heights)return s.heights;const {W,H}=dims(g),VW=W+1,raw=new Float32Array(VW*(H+1)),wet=new Uint8Array(VW*(H+1)),targets=tileTargets(g);
 for(let vy=0;vy<=H;vy++)for(let vx=0;vx<=W;vx++){let sum=0,n=0,water=0,maxT=0;for(const [dx,dy] of [[-1,-1],[0,-1],[-1,0],[0,0]]){const x=vx+dx,y=vy+dy;if(x<0||y<0||x>=W||y>=H)continue;const t=g.map[y*W+x],tv=targets[y*W+x];sum+=tv;n++;if(WATER(t))water++;maxT=Math.max(maxT,tv);}
  let h=n?sum/n:0;const i=vy*VW+vx;wet[i]=water;
  if(!water){const amp=maxT>.4?.3:.13;h+=(fbm(vx,vy,11)-.45)*amp;}else if(water<n)h=Math.min(h,-.07);
  raw[i]=h;}
 // One relaxation pass on dry land softens hill rims without moving the shoreline.
 const out=new Float32Array(raw);for(let vy=1;vy<H;vy++)for(let vx=1;vx<W;vx++){const i=vy*VW+vx;if(wet[i])continue;out[i]=raw[i]*.5+(raw[i-1]+raw[i+1]+raw[i-VW]+raw[i+VW])*.125;}
 // Flatten pads under the starting buildings so their plinths sit on level ground.
 for(const b of g.buildings||[]){const h=out[Math.round(b.y)*VW+Math.round(b.x)]||0;for(let vy=Math.floor(b.y-1.5);vy<=Math.ceil(b.y+1.5);vy++)for(let vx=Math.floor(b.x-1.5);vx<=Math.ceil(b.x+1.5);vx++){if(vx<0||vy<0||vx>W||vy>H)continue;const i=vy*VW+vx;if(!wet[i])out[i]=out[i]*.25+h*.75;}}
 s.heights=out;return out;}
function corner(g,vx,vy){const {W,H}=dims(g);vx=Math.max(0,Math.min(W,vx));vy=Math.max(0,Math.min(H,vy));return heightField(g)[vy*(W+1)+vx];}
function heightAt(g,x,y){if(!g||!g.map||!Number.isFinite(x)||!Number.isFinite(y))return 0;const {W,H}=dims(g);x=Math.max(0,Math.min(W,x));y=Math.max(0,Math.min(H,y));const xi=Math.min(W-1,Math.floor(x)),yi=Math.min(H-1,Math.floor(y)),fx=x-xi,fy=y-yi,a=corner(g,xi,yi),b=corner(g,xi+1,yi),c=corner(g,xi,yi+1),d=corner(g,xi+1,yi+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}

const flat=(p,cam,scale,w,h)=>({x:(p.x-p.y-cam.x+cam.y)*scale+w/2,y:(p.x+p.y-cam.x-cam.y)*scale*.5+h/2});
const flatInv=(p,cam,scale,w,h)=>{const x=(p.x-w/2)/scale,y=(p.y-h/2)/scale;return{x:cam.x+y+x/2,y:cam.y+y-x/2};};
// Elevation-aware projection and its inverse (fixed-point iteration over the height field).
function project(p,g,cam,scale,w,h,lift){const q=flat(p,cam,scale,w,h);q.y-=(lift??heightAt(g,p.x,p.y))*scale*ELEV;return q;}
function unproject(p,g,cam,scale,w,h){let q=flatInv(p,cam,scale,w,h);for(let i=0;i<6;i++){const z=heightAt(g,q.x,q.y);q=flatInv({x:p.x,y:p.y+z*scale*ELEV},cam,scale,w,h);}return q;}

// Lambert shading from a light low in the screen-left (world -x,+y), matching the lighter +y wall faces in iso-art.
const LIGHT=(()=>{const v=[-.55,.5,.67],m=Math.hypot(...v);return v.map(a=>a/m);})();
function shade(g,x,y){const a=corner(g,x,y),b=corner(g,x+1,y),c=corner(g,x,y+1),d=corner(g,x+1,y+1),k=2.3,dx=((b+d)-(a+c))*.5*k,dy=((c+d)-(a+b))*.5*k,m=Math.hypot(dx,dy,1),lam=(-dx*LIGHT[0]-dy*LIGHT[1]+LIGHT[2])/m/LIGHT[2];
 const centre=(a+b+c+d)/4,around=(heightAt(g,x-.5,y+.5)+heightAt(g,x+1.5,y+.5)+heightAt(g,x+.5,y-.5)+heightAt(g,x+.5,y+1.5))/4,ao=Math.max(-.12,Math.min(.06,(centre-around)*.6));
 return Math.max(.62,Math.min(1.28,lam*.85+.15+ao));}
function tileColor(g,x,y,t){const p=PAL[t]||PAL[0];let c=mix(p[0],p[1],fbm(x,y,t*7+1));if(!WATER(t)&&t!==7){const {W}=dims(g);let shore=false;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(WATER(g.tile?g.tile(x+dx,y+dy):g.map[(y+dy)*W+x+dx]))shore=true;if(shore&&t!==5)c=mix(c,SANDC,.35);}return c;}
function tileAt(g,x,y){if(g.tile)return g.tile(x,y);const {W,H}=dims(g);return x<0||y<0||x>=W||y>=H?7:g.map[y*W+x];}

function quad(c,P,g,x,y){const pts=[P(x,y,corner(g,x,y)),P(x+1,y,corner(g,x+1,y)),P(x+1,y+1,corner(g,x+1,y+1)),P(x,y+1,corner(g,x,y+1))];c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<4;i++)c.lineTo(pts[i].x,pts[i].y);c.closePath();return pts;}
// Draw one tile (base colour, lighting, border blending, details) with chunk projection P(x,y,h).
function drawTile(c,g,P,L,x,y,detail,art){const t=tileAt(g,x,y),k=shade(g,x,y),base=tileColor(g,x,y,t),water=WATER(t);
 const pts=quad(c,P,g,x,y);c.fillStyle=css(base,k);c.fill();c.lineWidth=1;c.strokeStyle=css(base,k);c.stroke();
 // Soft border blending: higher-priority neighbours bleed a gradient into this tile.
 const edges=[[0,-1,0,1],[1,0,1,2],[0,1,2,3],[-1,0,3,0]];let clipped=false;
 for(const [dx,dy,i,j] of edges){const n=tileAt(g,x+dx,y+dy);if(n===t||n===undefined)continue;let col=null,alpha=.55;
  if(water&&!WATER(n)){col=mix(PAL[3][0],[226,232,200],.35);alpha=.6;}
  else if(water&&WATER(n)&&n===3){col=tileColor(g,x+dx,y+dy,n);alpha=.5;}
  else if(!water&&(PRIORITY[n]>PRIORITY[t])&&!WATER(n)&&x+dx>=0&&y+dy>=0&&x+dx<dims(g).W&&y+dy<dims(g).H)col=tileColor(g,x+dx,y+dy,n);
  if(!col)continue;if(!clipped){c.save();quad(c,P,g,x,y);c.clip();clipped=true;}
  const m={x:(pts[i].x+pts[j].x)/2,y:(pts[i].y+pts[j].y)/2},ctr={x:(pts[0].x+pts[2].x)/2,y:(pts[1].y+pts[3].y)/2},gr=c.createLinearGradient(m.x,m.y,m.x+(ctr.x-m.x)*.9,m.y+(ctr.y-m.y)*.9);
  gr.addColorStop(0,css(col,water?1:k,alpha));gr.addColorStop(1,css(col,k,0));c.fillStyle=gr;c.fillRect(Math.min(...pts.map(p=>p.x))-2,Math.min(...pts.map(p=>p.y))-2,L*2+4,L*2+4);}
 if(clipped)c.restore();
 if(!detail||L<14)return;
 const S=p=>P(p.x,p.y,heightAt(g,p.x,p.y));
 if(water){// depth ripples (static); animated glints are drawn per frame
  for(let i=0;i<2;i++){const a=hash(x,y,i+40),b=hash(y,x,i+41);if(a<.45)continue;const q=S({x:x+a*.8,y:y+b*.8});c.strokeStyle=t===3?'rgba(214,232,206,.28)':'rgba(170,215,210,.22)';c.lineWidth=Math.max(1,L*.03);c.beginPath();c.moveTo(q.x-L*.18,q.y);c.quadraticCurveTo(q.x,q.y-L*.05,q.x+L*.18,q.y);c.stroke();}}
 else if(t===7){// cliff strata
  for(let i=0;i<3;i++){const a=S({x:x+.1,y:y+.25+i*.25}),b=S({x:x+.9,y:y+.2+i*.27});c.strokeStyle=i%2?'rgba(60,62,52,.35)':'rgba(220,214,190,.3)';c.lineWidth=Math.max(1,L*.04);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}
 else{// grass clumps / flowers / pebbles for richer ground
  const n=t===6?5:t===5?3:4;for(let i=0;i<n;i++){const a=hash(x,y,i+60),b=hash(x,y,i+70),q=S({x:x+a,y:y+b});
   if(t===5){c.fillStyle=i%2?'rgba(205,200,170,.7)':'rgba(110,108,90,.55)';c.beginPath();c.ellipse(q.x,q.y,L*.07,L*.04,0,0,Math.PI*2);c.fill();}
   else if(t===1){c.fillStyle='rgba(70,56,38,.25)';c.beginPath();c.ellipse(q.x,q.y,L*.14,L*.05,0,0,Math.PI*2);c.fill();}
   else{c.fillStyle=css(base,k*.78,.55);c.beginPath();c.ellipse(q.x,q.y,L*(.08+a*.06),L*.04,0,0,Math.PI*2);c.fill();if(t===0&&a>.9){c.fillStyle=b>.5?'#efe1a0':'#e9b9a8';c.beginPath();c.ellipse(q.x,q.y-L*.03,L*.025,L*.018,0,0,Math.PI*2);c.fill();}}}
  if(art&&art.terrainDetail)art.terrainDetail(c,g,S,L,x,y,t);}}

function chunkGeometry(cx,cy,L){const x0=cx*CHUNK,y0=cy*CHUNK,offX=-(x0-y0-CHUNK-2)*L,offY=-(x0+y0-2)*L*.5+HMAX*L*ELEV;return{x0,y0,offX,offY,width:Math.ceil((2*CHUNK+4)*L),height:Math.ceil((CHUNK+2)*L+(HMAX-HMIN)*L*ELEV)};}
// Bake a chunk into context c. Draws a one-tile ring of neighbours to hide seams.
function bakeChunk(c,g,cx,cy,L,detail=true,art=null){const G=chunkGeometry(cx,cy,L),{W,H}=dims(g),P=(x,y,h)=>({x:(x-y)*L+G.offX,y:(x+y)*L*.5-h*L*ELEV+G.offY});
 const xs=Math.max(0,G.x0-1),xe=Math.min(W-1,G.x0+CHUNK),ys=Math.max(0,G.y0-1),ye=Math.min(H-1,G.y0+CHUNK);let tiles=0;
 for(let s=xs+ys;s<=xe+ye;s++)for(let x=xs;x<=xe;x++){const y=s-x;if(y<ys||y>ye)continue;drawTile(c,g,P,L,x,y,detail,art);tiles++;}
 return{...G,tiles};}

function createRenderer(opts={}){const makeCanvas=opts.makeCanvas||((w,h)=>{const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});cv.width=w;cv.height=h;return cv;});const art=opts.art||null;
 function evict(s){if(s.pixels<=MAX_PIXELS)return;const list=[...s.chunks.entries()].sort((a,b)=>a[1].used-b[1].used);for(const [key,v] of list){if(s.pixels<=MAX_PIXELS*.75)break;s.chunks.delete(key);s.pixels-=v.width*v.height;}}
 // settled=true (zoom not animating) bakes chunks at the exact screen scale so they blit 1:1 (fast path);
 // while zooming, cached chunks of the nearest level are stretched instead of re-baking every frame.
 function draw(c,g,cam,scale,w,h,dpr=1,budgetMs=8,settled=true){const s=state(g),{W,H}=dims(g),detail=g.visualDetail!==false,want=scale*dpr;const exact=Math.max(8,Math.min(160,Math.round(want)));let L=settled?exact:(LEVELS.find(l=>l>=want*.92)||LEVELS[LEVELS.length-1]);s.tick++;
  const sx0=(-cam.x+cam.y)*scale+w/2,sy0=(-cam.x-cam.y)*scale*.5+h/2,k=scale/L,start=now();let baked=0,missing=0;
  const list=[];for(let cy=0;cy*CHUNK<H;cy++)for(let cx=0;cx*CHUNK<W;cx++)list.push([cx,cy]);list.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  for(const [cx,cy] of list){const G=chunkGeometry(cx,cy,L),dx=sx0-G.offX*k,dy=sy0-G.offY*k,dw=G.width*k,dh=G.height*k;if(dx>w||dy>h||dx+dw<0||dy+dh<0)continue;
   const key=`${L}:${cx},${cy}:${detail?1:0}`;let entry=s.chunks.get(key);const hasAny=entry||[...s.chunks.values()].some(v=>v.cx===cx&&v.cy===cy);
   if(!entry&&(settled||!hasAny)&&(baked===0||(now()-start)<budgetMs)){const cv=makeCanvas(G.width,G.height),cc=cv.getContext('2d');bakeChunk(cc,g,cx,cy,L,detail,art);entry={canvas:cv,width:G.width,height:G.height,L,cx,cy,used:0};s.chunks.set(key,entry);s.pixels+=G.width*G.height;baked++;}
   if(!entry){// fall back to the closest cached level for this chunk, else a coarse live draw
    let best=null;for(const [k2,v] of s.chunks){if(v.cx===cx&&v.cy===cy&&(!best||Math.abs(v.L-want)<Math.abs(best.L-want)))best=v;}entry=best;missing++;}
   if(entry){entry.used=s.tick;const A=chunkGeometry(cx,cy,entry.L),kk=scale/entry.L;if(Math.abs(kk*dpr-1)<1e-6&&dpr===1)c.drawImage(entry.canvas,Math.round(sx0-A.offX),Math.round(sy0-A.offY));else c.drawImage(entry.canvas,sx0-A.offX*kk,sy0-A.offY*kk,entry.width*kk,entry.height*kk);}
   else{const P=(x,y,z)=>({x:(x-y-cam.x+cam.y)*scale+w/2,y:(x+y-cam.x-cam.y)*scale*.5+h/2-z*scale*ELEV});for(let y=G.y0;y<Math.min(H,G.y0+CHUNK);y++)for(let x=G.x0;x<Math.min(W,G.x0+CHUNK);x++){const t=tileAt(g,x,y),col=css(tileColor(g,x,y,t),shade(g,x,y));quad(c,P,g,x,y);c.fillStyle=col;c.fill();c.strokeStyle=col;c.stroke();}}}
  evict(s);return{level:L,baked,missing};}
 return{draw,clear:g=>cache.delete(g)};}

// Animated water glints, drawn live on top of the cached terrain.
function water(c,g,S,scale,w,h,time){if(g.visualDetail===false)return;const {W,H}=dims(g);c.save();c.lineCap='round';c.lineWidth=Math.max(1,scale*.04);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=tileAt(g,x,y);if(!WATER(t))continue;const a=hash(x,y,90);if(a<.5)continue;const p=S({x:x+.5,y:y+.5});if(p.x<-scale*2||p.y<-scale*2||p.x>w+scale*2||p.y>h+scale*2)continue;
  const ph=time*1.2+a*6.28,wave=Math.sin(ph)*.18,al=.15+.2*Math.max(0,Math.sin(ph*1.7));c.strokeStyle=`rgba(236,244,222,${al.toFixed(3)})`;const q=S({x:x+.25+wave,y:y+.4+hash(y,x,91)*.3});c.beginPath();c.moveTo(q.x-scale*.16,q.y);c.lineTo(q.x+scale*.16,q.y);c.stroke();}
 c.restore();}

const SHADOW_HEIGHT={hall:1.7,watchtower:2.4,house:1.05,barracks:1.25,range:1.25,command:1.4,forge:1.15,storehouse:1.05,dock:.55,well:.45,farm:.18,wall:1};
// Directional cast shadows for buildings (drawn after terrain, before any entity).
function shadows(c,g,S,scale,w,h){c.save();c.fillStyle='rgba(18,30,14,.26)';for(const b of g.buildings||[]){if(!(b.hp>0)||b.wall)continue;const p=S(b);if(p.x<-scale*6||p.y<-scale*6||p.x>w+scale*6||p.y>h+scale*6)continue;
  const r=b.kind==='farm'?1:.95,o=(SHADOW_HEIGHT[b.kind]||1.1)*(1+.18*((b.tier||1)-1))*.62,ox=o,oy=-o,x0=b.x-r,x1=b.x+r,y0=b.y-r,y1=b.y+r,z=heightAt(g,b.x,b.y),P=q=>{const v=S({x:q[0],y:q[1]});v.y-=(z-heightAt(g,q[0],q[1]))*scale*ELEV;return v;};
  const pts=[[x0,y0],[x0+ox,y0+oy],[x1+ox,y0+oy],[x1+ox,y1+oy],[x1,y1],[x0,y1]].map(P);c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.fill();}
 c.restore();}

return{ELEV,CHUNK,LEVELS,TARGET,heightField,heightAt,project,unproject,shade,tileColor,bakeChunk,chunkGeometry,createRenderer,water,shadows,fbm};
});
