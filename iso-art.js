(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LoanArt=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const project=(p,cam,scale,w,h)=>({x:(p.x-p.y-cam.x+cam.y)*scale+w/2,y:(p.x+p.y-cam.x-cam.y)*scale*.5+h/2});
const unproject=(p,cam,scale,w,h)=>{const x=(p.x-w/2)/scale,y=(p.y-h/2)/scale;return{x:cam.x+y+x/2,y:cam.y+y-x/2};};
function polygon(c,pts,fill,stroke){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function line(c,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
function cell(c,S,x,y,size,fill,stroke){polygon(c,[S({x,y}),S({x:x+size,y}),S({x:x+size,y:y+size}),S({x,y:y+size})],fill,stroke);}
const noise=(x,y,i=0)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+29,668265263)^Math.imul(i+1,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
function terrainDetail(c,g,S,s,x,y,t){
 const water=t===3||t===4;
 if(water){for(const [dx,dy,a,b]of [[0,-1,[x,y],[x+1,y]],[1,0,[x+1,y],[x+1,y+1]],[0,1,[x+1,y+1],[x,y+1]],[-1,0,[x,y+1],[x,y]]]){const next=g.tile(x+dx,y+dy);if(next!==3&&next!==4&&next!==7){const p=S({x:a[0],y:a[1]}),q=S({x:b[0],y:b[1]});line(c,p,q,'#a5a674',s*.17);line(c,{x:p.x,y:p.y+1},{x:q.x,y:q.y+1},'#dae0b58a',Math.max(1,s*.035));}}return;}
 if(t===7)return;
 for(let i=0;i<5;i++){const a=noise(x,y,i),b=noise(y,x,i+7),p=S({x:x+a,y:y+b});
  if(t===1){ellipse(c,p.x,p.y,s*(.1+a*.11),s*.035,'#a2926340');if(i===0)ellipse(c,p.x,p.y,s*.15,s*.055,'#58736688');}
  else if(t===5){polygon(c,[{x:p.x-s*.12,y:p.y},{x:p.x-s*.035,y:p.y-s*.12},{x:p.x+s*.12,y:p.y+s*.015}],i%2?'#bab79b':'#898c72');line(c,{x:p.x-s*.035,y:p.y-s*.12},{x:p.x+s*.12,y:p.y+s*.015},'#d3cdb08a',.7);}
  else {const col=t===2?'#d4c88a':t===6?'#94a36675':'#b6c58080';line(c,p,{x:p.x-s*.04,y:p.y-s*(.05+a*.08)},col,.8);line(c,p,{x:p.x+s*.06,y:p.y-s*.07},'#3d64365c',.8);if(t===2)ellipse(c,p.x-s*.04,p.y-s*(.05+a*.08),s*.02,s*.035,'#b6a36a');if(a>.93)ellipse(c,p.x,p.y,s*.025,s*.018,'#e5d39d');}
 }
}
function ground(c,g,S,scale,w,h){
 const palette=['#91ad58','#8b744f','#a9aa61','#72aaa2','#398a86','#aaa77a','#638349','#999889'];
 for(let y=0;y<(g.height||60);y++)for(let x=0;x<(g.width||84);x++){const p=S({x:x+.5,y:y+.5});if(p.x<-scale||p.y<-scale||p.x>w+scale||p.y>h+scale)continue;const t=g.tile(x,y),seed=(x*137+y*53)%101;cell(c,S,x,y,1,palette[t],palette[t]);
  cell(c,S,x,y,1,`rgba(40,55,27,${(seed%5)*.012})`,palette[t]);
  if(t===3||t===4){const wave=Math.sin(g.time*1.3+x*.7+y)*.12;line(c,S({x:x+.2+wave,y:y+.35}),S({x:x+.65+wave,y:y+.35}),t===3?'#c2d4b473':'#95c8bd66');if(seed%4===0)ellipse(c,p.x+scale*.1,p.y+scale*.15,scale*.13,scale*.04,'#d6e0bd44');}
  else if(t===7){const a=S({x,y}),b=S({x:x+1,y}),d=S({x,y:y+1}),f=S({x:x+1,y:y+1}),up=p=>({x:p.x,y:p.y-scale*.55});polygon(c,[a,b,up(b),up(a)],'#a3a08a','#555e4a');polygon(c,[b,f,up(f),up(b)],'#747765','#555e4a');polygon(c,[up(a),up(b),up(f),up(d)],'#b1b098','#59684b');}
  else {c.strokeStyle=t===2?'#dad6a777':'#c0ce8d44';for(let i=0;i<(t===2?5:2);i++){const q=S({x:x+((seed+i*19)%89)/100,y:y+((seed+i*31)%91)/100});line(c,q,{x:q.x+1,y:q.y-(t===2?scale*.24:scale*.06)},c.strokeStyle);}}
  if(g.visualDetail!==false&&scale>=16)terrainDetail(c,g,S,scale,x,y,t);
 }
 groundOverlays(c,g,S,scale,w,h);
}
// Roads, village courts and props: drawn live every frame on top of the (cached) terrain.
function groundOverlays(c,g,S,scale,w,h){
 // Organic village roads connect each local compound to its stronghold. Two
 // layered strokes keep the routes readable without exposing the tile grid.
 if(g.visualDetail!==false&&scale>=15){const halls=new Map(g.buildings.filter(b=>b.hp>0&&b.kind==='hall').map(b=>[b.owner,b]));c.save();c.lineCap='round';c.lineJoin='round';for(const b of g.buildings){const h=halls.get(b.owner);if(!h||b===h||b.hp<=0||b.kind==='dock'||b.kind==='farm'||Math.hypot(b.x-h.x,b.y-h.y)>18)continue;const a=S(h),z=S(b),bend={x:(a.x+z.x)/2+((b.id%5)-2)*scale*.18,y:(a.y+z.y)/2+((b.id%3)-1)*scale*.12};c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(bend.x,bend.y,z.x,z.y);c.strokeStyle='#554b3038';c.lineWidth=scale*.62;c.stroke();c.strokeStyle='#c2ad784d';c.lineWidth=scale*.43;c.stroke();c.setLineDash([scale*.09,scale*.2]);c.strokeStyle='#e0cc9460';c.lineWidth=Math.max(1,scale*.025);c.stroke();c.setLineDash([]);}c.restore();}
 // Compact dirt village courts, drawn on the same ground plane as the buildings.
 for(const b of g.buildings)if(b.hp>0&&b.kind!=='dock'&&b.kind!=='farm'){const p=S(b);if(p.x<-scale*4||p.x>w+scale*4||p.y<-scale*4||p.y>h+scale*4)continue;cell(c,S,b.x-1.25,b.y-1.25,2.5,'#b6a97a55');if(g.visualDetail!==false&&scale>=16){for(let i=0;i<14;i++){const q=S({x:b.x-1.3+noise(b.id,3,i)*2.6,y:b.y-1.3+noise(b.id,4,i)*2.6});ellipse(c,q.x,q.y,scale*.08,scale*.035,i%2?'#d0bf9366':'#675d3933');}const end={x:b.x,y:b.y+2.2};if(![3,4,7].includes(g.tile(end.x,end.y))){line(c,S({x:b.x,y:b.y+.8}),S(end),'#b5a07180',scale*.35);line(c,S({x:b.x+.12,y:b.y+.8}),S({x:end.x+.12,y:end.y}),'#706a4338',scale*.025);}}}
 // Pots, baskets, flower beds and clipped shrubs make compounds feel inhabited.
 if(g.visualDetail!==false&&scale>=17)for(const b of g.buildings)if(b.hp>0&&!['dock','farm','well'].includes(b.kind)){for(let i=0;i<3;i++){const side=i%2?-1:1,q=S({x:b.x+side*(1.12+noise(b.id,31,i)*.22),y:b.y-.75+i*.68});if(i===0){ellipse(c,q.x,q.y-scale*.08,scale*.12,scale*.13,'#9c7048');ellipse(c,q.x,q.y-scale*.19,scale*.065,scale*.025,'#3c3a2b');}else{ellipse(c,q.x,q.y,scale*.19,scale*.065,'#29462f55');for(let j=0;j<5;j++)ellipse(c,q.x+(j-2)*scale*.055,q.y-scale*(.08+(j%2)*.05),scale*.045,scale*.035,j%2?'#d9bd67':'#a55d4e');}}}
}
function box(c,S,x,y,dx,dy,height,colors){const a=S({x,y}),b=S({x:x+dx,y}),d=S({x,y:y+dy}),f=S({x:x+dx,y:y+dy}),lift=p=>({x:p.x,y:p.y-height});polygon(c,[d,f,lift(f),lift(d)],colors[0],'#483d2b88');polygon(c,[b,f,lift(f),lift(b)],colors[1],'#483d2b88');polygon(c,[lift(a),lift(b),lift(f),lift(d)],colors[2]);return {a:lift(a),b:lift(b),d:lift(d),f:lift(f)};}
function raisedBox(c,S,x,y,dx,dy,bottom,top,colors){const a=S({x,y}),b=S({x:x+dx,y}),d=S({x,y:y+dy}),f=S({x:x+dx,y:y+dy}),lift=(p,h)=>({x:p.x,y:p.y-h}),A=lift(a,top),B=lift(b,top),D=lift(d,top),F=lift(f,top),lb=lift(b,bottom),ld=lift(d,bottom),lf=lift(f,bottom);polygon(c,[ld,lf,F,D],colors[0],'#483d2b88');polygon(c,[lb,lf,F,B],colors[1],'#483d2b88');polygon(c,[A,B,F,D],colors[2]);return{a:A,b:B,d:D,f:F};}
function roof(c,S,x,y,dx,dy,height,rise,scale,thatch=false){const a=S({x,y}),b=S({x:x+dx,y}),d=S({x,y:y+dy}),f=S({x:x+dx,y:y+dy});for(const p of [a,b,d,f])p.y-=height;const r1=S({x:x+dx*.5,y}),r2=S({x:x+dx*.5,y:y+dy});r1.y-=height+rise;r2.y-=height+rise;
 polygon(c,[a,r1,r2,d],thatch?'#c7ac67':'#c85f3d','#4b3327');polygon(c,[r1,b,f,r2],thatch?'#9d8248':'#91442f','#4b3327');
 for(let i=1;i<7;i++){const t=i/7;line(c,{x:r1.x+(b.x-r1.x)*t,y:r1.y+(b.y-r1.y)*t},{x:r2.x+(f.x-r2.x)*t,y:r2.y+(f.y-r2.y)*t},thatch?'#e0c47d66':'#f19a695f',.8);}
 if(scale>=20){for(let j=1;j<10;j++){const t=j/10,A={x:a.x+(d.x-a.x)*t,y:a.y+(d.y-a.y)*t},R={x:r1.x+(r2.x-r1.x)*t,y:r1.y+(r2.y-r1.y)*t},B={x:b.x+(f.x-b.x)*t,y:b.y+(f.y-b.y)*t};line(c,A,R,thatch?'#e0c88844':'#b48b6244',.7);line(c,R,B,thatch?'#ddbc7d44':'#2f30264a',.7);}line(c,{x:d.x,y:d.y+2},{x:f.x,y:f.y+2},'#2a2c2666',2);}
 line(c,r1,r2,thatch?'#e3cc8e':'#eeb16e',2.5);line(c,d,r2,'#f0b06d99',1.4);
}
function stonePlinth(c,S,b,w,d,s,tier){box(c,S,b.x-w/2-.1,b.y-d/2-.08,w+.2,d+.16,s*(.16+.035*tier),['#aeb3a7','#7e8b80','#d5d2bb']);if(s>=17){const a=S({x:b.x-w/2-.1,y:b.y+d/2+.08}),z=S({x:b.x+w/2+.1,y:b.y+d/2+.08});for(let i=0;i<7;i++){const t=i/7,q={x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t};line(c,q,{x:q.x+s*.06,y:q.y-s*.12},'#66756b99',.8);}}}
function roofFinials(c,S,b,w,d,s,height){for(const [dx,dy] of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){const q=S({x:b.x+dx,y:b.y+dy});q.y-=height;polygon(c,[{x:q.x,y:q.y-s*.13},{x:q.x+s*.1,y:q.y},{x:q.x,y:q.y+s*.07},{x:q.x-s*.1,y:q.y}],'#d8b057','#6d4d31');}}
function courtyardProps(c,b,g,S,s){if(g.visualDetail===false||s<17)return;const prop=(dx,dy)=>S({x:b.x+dx,y:b.y+dy});
 if(b.kind==='carpenter'){for(let i=0;i<4;i++){const q=prop(-1.05+i*.22,.88+i*.04);line(c,{x:q.x-s*.25,y:q.y-s*.12},{x:q.x+s*.25,y:q.y+s*.12},i%2?'#8d5a31':'#ba7943',s*.09);}const q=prop(-.55,1.05);polygon(c,[{x:q.x-s*.22,y:q.y},{x:q.x+s*.22,y:q.y+s*.05},{x:q.x+s*.12,y:q.y-s*.22},{x:q.x-s*.14,y:q.y-s*.26}],'#d6d4c4','#59645d');}
 if(b.kind==='range'){const q=prop(-1.05,.7);for(let i=0;i<2;i++)line(c,{x:q.x+i*s*.18,y:q.y},{x:q.x+i*s*.18,y:q.y-s*.8},'#7a5331',3);line(c,{x:q.x,y:q.y-s*.72},{x:q.x+s*.2,y:q.y-s*.62},'#d2ae68',3);ellipse(c,q.x+s*.46,q.y-s*.24,s*.18,s*.22,'#a97a45');ellipse(c,q.x+s*.46,q.y-s*.24,s*.1,s*.13,'#e5d4a2');ellipse(c,q.x+s*.46,q.y-s*.24,s*.035,s*.045,'#8c4934');}
 if(b.kind==='forge'){const q=prop(-.9,.85);polygon(c,[{x:q.x-s*.32,y:q.y},{x:q.x+s*.28,y:q.y+s*.05},{x:q.x+s*.2,y:q.y-s*.28},{x:q.x-s*.2,y:q.y-s*.3}],'#75573e','#343a35');ellipse(c,q.x,q.y-s*.22,s*.13,s*.08,'#ffb04b');for(let i=0;i<3;i++)ellipse(c,q.x+i*4,q.y-s*(.45+i*.18),s*(.08+i*.025),s*.07,'#5c625c55');}
 if(b.kind==='command'){const q=prop(-1,.8);line(c,q,{x:q.x,y:q.y-s*1.2},'#715137',3);polygon(c,[{x:q.x,y:q.y-s*1.2},{x:q.x+s*.55,y:q.y-s*1.02},{x:q.x,y:q.y-s*.8}],'#cfac58','#64422c');for(let i=0;i<3;i++){const p=prop(-.5+i*.35,1.08);line(c,p,{x:p.x+s*.28,y:p.y-s*.6},'#d5c494',2);}}
 if(b.kind==='house'){for(let i=0;i<3;i++){const q=prop(-.7+i*.28,.92);ellipse(c,q.x,q.y-s*.12,s*.11,s*.16,i%2?'#b7794a':'#8f6948');ellipse(c,q.x,q.y-s*.26,s*.065,s*.03,'#4d4433');}}
 if(b.kind==='storehouse'){for(let i=0;i<4;i++){const q=prop(-.85+i*.28,.95);polygon(c,[{x:q.x-s*.12,y:q.y},{x:q.x+s*.13,y:q.y},{x:q.x+s*.09,y:q.y-s*.32},{x:q.x-s*.08,y:q.y-s*.3}],i%2?'#c6a764':'#9d7b48','#5d5037');}}
}
function building(c,b,g,S,s,selected,faction){const p=S(b),unit=s*.9,thatch=b.tier===1&&['house','barracks','storehouse','command'].includes(b.kind);
 ellipse(c,p.x+s*.35,p.y+s*.23,s*1.9,s*.65,'#20351c35');if(selected){c.lineWidth=2;cell(c,S,b.x-1.25,b.y-1.25,2.5,null,'#f6e6a0');}
 if(b.constructing)c.globalAlpha=.58;
 if(b.kind==='farm'){cell(c,S,b.x-1,b.y-1,2,'#695b32','#b3a374');const n=g.nodes.find(n=>n.farm===b.id),full=(n?.amount||0)/(n?.maxAmount||1);for(let i=0;i<8;i++){line(c,S({x:b.x-.85+i*.23,y:b.y-.9}),S({x:b.x-.85+i*.23,y:b.y+.9}),i/8<full?'#bdba64':'#807347',Math.max(2,s*.12));}const fence=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,y])=>S({x:b.x+x,y:b.y+y}));for(let i=0;i<4;i++){const q=fence[i],z=fence[(i+1)%4];line(c,q,{x:q.x,y:q.y-s*.28},'#7c5733',2.4);line(c,{x:q.x,y:q.y-s*.18},{x:z.x,y:z.y-s*.18},'#bd8a4f',2.2);line(c,{x:q.x,y:q.y-s*.08},{x:z.x,y:z.y-s*.08},'#8c643b',1.5);}roof(c,S,b.x-.35,b.y-.25,.6,.5,s*.25,s*.23,s,true);const hay=S({x:b.x+.68,y:b.y+.56});ellipse(c,hay.x,hay.y-s*.13,s*.2,s*.2,'#c9aa58');for(let i=0;i<5;i++)line(c,{x:hay.x-s*.16+i*s*.07,y:hay.y-s*.23},{x:hay.x-s*.1+i*s*.06,y:hay.y-s*.05},'#e0c67699',.8);}
 else if(b.kind==='dock'){box(c,S,b.x-1,b.y-1,2,2,s*.16,['#8c7045','#554735','#ac905b']);for(let i=0;i<10;i++)line(c,S({x:b.x-.9+i*.2,y:b.y-1}),S({x:b.x-.9+i*.2,y:b.y+1}),'#d7bd8066',1);box(c,S,b.x-.9,b.y-.9,.8,.8,s*.6,['#bfac7c','#887551','#b69b65']);roof(c,S,b.x-1,b.y-1,1,1,s*.62,s*.3,s,true);}
 else if(b.kind==='watchtower'){
  const h=s*(1.5+(b.tier-1)*.28),w=1.18;stonePlinth(c,S,b,w,w,s,b.tier);box(c,S,b.x-w/2,b.y-w/2,w,w,h,['#9b764b','#6f563b','#c49a60']);
  for(const face of [1,-1])for(let i=0;i<3;i++){const y=s*(.34+i*.38),a=S({x:b.x+face*w*.48,y:b.y-w*.46}),z=S({x:b.x+face*w*.48,y:b.y+w*.46});line(c,{x:a.x,y:a.y-y},{x:z.x,y:z.y-y-s*.28},'#513d2c',s*.07);line(c,{x:a.x,y:a.y-y-s*.28},{x:z.x,y:z.y-y},'#d0a568',s*.045);}
  raisedBox(c,S,b.x-.78,b.y-.78,1.56,1.56,h-s*.34,h+s*.2,['#d8d1b9','#929d90','#eee1bd']);for(const [dx,dy]of [[-.55,.79],[.05,.79],[.79,-.45]]){const q=S({x:b.x+dx,y:b.y+dy});polygon(c,[{x:q.x-s*.07,y:q.y-h-s*.04},{x:q.x+s*.08,y:q.y-h+s*.04},{x:q.x+s*.08,y:q.y-h-s*.24},{x:q.x-s*.07,y:q.y-h-s*.32}],'#283c3b','#d6be82');}
  roof(c,S,b.x-.92,b.y-.92,1.84,1.84,h+s*.24,s*.48,s,b.tier===1);roofFinials(c,S,b,1.8,1.8,s,h+s*.26);for(const dx of [-.48,0,.48]){const q=S({x:b.x+dx,y:b.y+.79});ellipse(c,q.x,q.y-h+s*.08,s*.13,s*.18,b.tier===3?'#d1ad51':'#695d47');ellipse(c,q.x,q.y-h+s*.08,s*.055,s*.08,faction);}
 }
 else if(b.kind==='well'){
  cell(c,S,b.x-1,b.y-1,2,'#d7ccb0','#596b61');cell(c,S,b.x-.72,b.y-.72,1.44,'#4f9a9a','#e3c87c');cell(c,S,b.x-.48,b.y-.48,.96,'#70b9ae','#ddedd0');for(const [dx,dy]of [[-.82,-.82],[.82,-.82],[-.82,.82],[.82,.82]])box(c,S,b.x+dx-.12,b.y+dy-.12,.24,.24,s*.28,['#ddd5ba','#88968a','#efe0ba']);
  const q=S(b);ellipse(c,q.x,q.y-s*.1,s*.22,s*.1,'#426e67');box(c,S,b.x-.13,b.y-.13,.26,.26,s*(.75+(b.tier-1)*.15),['#d9cfad','#8d998a','#f0dda9']);polygon(c,[{x:q.x,y:q.y-s*(1.1+(b.tier-1)*.15)},{x:q.x+s*.17,y:q.y-s*(.88+(b.tier-1)*.15)},{x:q.x,y:q.y-s*(.7+(b.tier-1)*.15)},{x:q.x-s*.17,y:q.y-s*(.88+(b.tier-1)*.15)}],'#cdaa53','#73593a');for(let i=0;i<5;i++){const a=i*Math.PI*.4,x=q.x+Math.cos(a)*s*.42,y=q.y+Math.sin(a)*s*.16;ellipse(c,x,y-s*.08,s*.07,s*.035,i%2?'#f0d09a':'#d5e4bb');}
 }
 else{
  const wide=b.kind==='hall'?2.15:b.kind==='house'?1.45:1.82,deep=b.kind==='range'?2.05:b.kind==='hall'?1.75:1.52,height=(b.kind==='hall'?unit*1.12:unit*.76)*(1+(b.tier-1)*.12);
  stonePlinth(c,S,b,wide,deep,s,b.tier);
  box(c,S,b.x-wide/2,b.y-deep/2,wide,deep,height,b.tier>=2?['#eee4cb','#b8b5a4','#fff0cc']:['#e6d5ae','#bca57d','#f0d7a5']);
  roof(c,S,b.x-wide/2-.15,b.y-deep/2-.16,wide+.3,deep+.32,height,s*.55,s,thatch);
  if(!thatch)roofFinials(c,S,b,wide+.25,deep+.27,s,height+s*.04);
  // Door and exposed timber beams on the front-facing wall.
  for(let i=0;i<4;i++){const q=S({x:b.x-wide*.45+i*wide*.3,y:b.y+deep/2});line(c,q,{x:q.x,y:q.y-height*.9},b.tier>=2?'#656551':'#6b5138',2);}
  const door=S({x:b.x+wide*.12,y:b.y+deep/2+.01});polygon(c,[door,{x:door.x+s*.19,y:door.y+s*.1},{x:door.x+s*.19,y:door.y-height*.5},{x:door.x,y:door.y-height*.6}],'#3e3728');
  if(g.visualDetail!==false&&s>=18){
   // Window lattices on the exposed front wall; foundations distinguish stone tiers.
   for(const dx of [-.3,.55]){const q=S({x:b.x+dx*wide,y:b.y+deep/2+.015});q.y-=height*.4;polygon(c,[{x:q.x-s*.12,y:q.y-s*.06},{x:q.x+s*.12,y:q.y+s*.06},{x:q.x+s*.12,y:q.y-s*.19},{x:q.x-s*.12,y:q.y-s*.31}],'#384237','#d0b581');for(let i=0;i<3;i++)line(c,{x:q.x+s*(-.08+i*.08),y:q.y-s*(.04-i*.04)},{x:q.x+s*(-.08+i*.08),y:q.y-s*(.26-i*.04)},'#b7a276',.8);}
   const a=S({x:b.x-wide/2,y:b.y+deep/2}),z=S({x:b.x+wide/2,y:b.y+deep/2});line(c,a,z,b.tier>=2?'#929988':'#786342',s*.11);if(b.tier>=2)for(let i=0;i<8;i++){const t=i/8,q={x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t};line(c,q,{x:q.x,y:q.y-s*.1},'#4a5a4d',.8);}
   // A doorstep, ceramic water jar and warm lantern mark the entrance.
   box(c,S,b.x+.1,b.y+deep/2,.4,.25,s*.06,['#a6a087','#727e6c','#c5b795']);const jar=S({x:b.x-wide*.45,y:b.y+deep/2+.22});ellipse(c,jar.x,jar.y-s*.12,s*.12,s*.16,'#90744d');ellipse(c,jar.x,jar.y-s*.25,s*.07,s*.035,'#333c2a');ellipse(c,door.x-s*.12,door.y-height*.67,s*.04,s*.065,'#e7c779');
  }
  if(b.tier>=2&&b.kind!=='house'&&b.kind!=='storehouse'){for(const dx of [-1,1]){box(c,S,b.x+dx*(wide*.48)-.28,b.y-deep*.38,.56,.62,height+s*(b.tier===3?.38:.18),['#e7dfc8','#9ea69a','#f7e8c8']);roof(c,S,b.x+dx*(wide*.48)-.34,b.y-deep*.43,.68,.72,height+s*(b.tier===3?.4:.2),s*.28,s,false);}}
  if(b.tier===3&&b.kind!=='hall'){box(c,S,b.x-.48,b.y-.42,.96,.84,height+s*.38,['#eee5ce','#aeb0a3','#fff0d0']);roof(c,S,b.x-.58,b.y-.52,1.16,1.04,height+s*.4,s*.36,s,false);}
  if(b.kind==='hall'){roof(c,S,b.x-.66,b.y-.5,1.32,1.02,height+s*.5,s*.44,s,false);for(const dx of [-1,1]){box(c,S,b.x+dx*1.04-.24,b.y+.5,.48,.52,s*(.68+b.tier*.11),['#d9d8c5','#88958c','#f0e5c4']);roof(c,S,b.x+dx*1.04-.31,b.y+.43,.62,.65,s*(.7+b.tier*.11),s*.25,s,false);}if(b.tier>=2){box(c,S,b.x-.58,b.y-.48,1.16,.96,height+s*.63,['#eae3cf','#a9ada4','#fff0d1']);roof(c,S,b.x-.67,b.y-.58,1.34,1.15,height+s*.65,s*.38,s,false);}if(b.tier===3){for(const dx of [-.72,-.36,0,.36,.72]){const q=S({x:b.x+dx,y:b.y+deep*.5});box(c,S,b.x+dx-.11,b.y+deep*.42,.22,.22,height+s*.1,['#ddd9c5','#8a948a','#eee8d0']);}}}
  if(b.kind==='forge'){box(c,S,b.x+.5,b.y-.3,.36,.42,s*1.3,['#818577','#555f57','#aaa18c']);const q=S({x:b.x+.65,y:b.y-.12});for(let i=0;i<3;i++)ellipse(c,q.x+i*3+Math.sin(g.time+i)*3,q.y-s*(1.45+i*.2),s*(.13+i*.04),s*.12,'#c7c3ad44');ellipse(c,door.x,door.y-s*.25,s*.12,s*.08,'#efa24f');}
  if(b.kind==='range'){for(let i=0;i<2;i++){const q=S({x:b.x+.9,y:b.y-.3+i*.7});ellipse(c,q.x,q.y-s*.25,s*.14,s*.18,'#bfa26d');ellipse(c,q.x,q.y-s*.25,s*.08,s*.11,'#844f39');ellipse(c,q.x,q.y-s*.25,s*.03,s*.04,'#e5d69e');}}
  if(b.kind==='barracks'){for(let i=0;i<3;i++){const q=S({x:b.x+.8,y:b.y+i*.23});line(c,q,{x:q.x-5,y:q.y-s*.7},'#dcc799',2);polygon(c,[{x:q.x-5,y:q.y-s*.85},{x:q.x-9,y:q.y-s*.65},{x:q.x-2,y:q.y-s*.67}],'#ccd1c0');}}
  if(b.kind==='storehouse'){for(let i=0;i<3;i++){const q=S({x:b.x-.4+i*.38,y:b.y+.9});ellipse(c,q.x,q.y-3,s*.14,s*.2,'#a08a55');line(c,{x:q.x-s*.13,y:q.y-3},{x:q.x+s*.13,y:q.y-3},'#5d5435',2);}}
  if(b.tier===3){for(const dx of [-1,1])box(c,S,b.x+dx*.9-.15,b.y+.5,.3,.35,s*.8,['#bec1a8','#808b78','#dbd0a4']);}
  courtyardProps(c,b,g,S,s);
 }
 c.globalAlpha=1;if(b.constructing){for(const dx of [-1,1]){const q=S({x:b.x+dx,y:b.y});line(c,q,{x:q.x,y:q.y-s*1.3},'#a38956',3);}line(c,{x:p.x-s,y:p.y-s},{x:p.x+s,y:p.y-s*.2},'#cab47b',2);}
 if(!b.constructing&&b.hp<b.maxHP*.5&&g.visualDetail!==false){line(c,{x:p.x-s*.3,y:p.y-s*.35},{x:p.x-s*.18,y:p.y-s*.15},'#3b3c2e',1.5);line(c,{x:p.x-s*.18,y:p.y-s*.15},{x:p.x-s*.28,y:p.y},'#3b3c2e',1.5);for(let i=0;i<3;i++)ellipse(c,p.x+s*(.2+i*.08)+Math.sin(g.time+i)*3,p.y-s*(1+i*.22),s*(.09+i*.025),s*.09,'#655e5266');}
 if(b.kind!=='well'){const flag=S({x:b.x+.9,y:b.y-.7});line(c,flag,{x:flag.x,y:flag.y-s*1.7},'#675638',2);polygon(c,[{x:flag.x,y:flag.y-s*1.7},{x:flag.x+s*.5,y:flag.y-s*1.57+Math.sin(g.time*3)*2},{x:flag.x,y:flag.y-s*1.3}],faction);}
}
function baseTree(c,n,g,S,s){const p=S(n);if(n.amount<=0){ellipse(c,p.x,p.y,s*.15,s*.08,'#816141');line(c,p,{x:p.x,y:p.y-s*.4},'#604c30',s*.1);return;}
 const v=n.id%3;
 ellipse(c,p.x+s*.24,p.y+s*.08,s*.5,s*.22,'#29432633');
 line(c,p,{x:p.x,y:p.y-s*.85},'#604c30',s*.12);
 line(c,{x:p.x,y:p.y-s*.2},{x:p.x-s*.16,y:p.y-s*.7},'#66513a',2);
 const pal=[['#2c5339','#3f6840','#527c45','#6a904c'],['#27502f','#3a6a3a','#4d8148','#79a35a'],['#2f5a4a','#41705c','#5a8a6a','#7fae7f']][v];
 const blobs=v===2?[[-.2,-.7,.4],[.18,-.85,.36],[-.05,-1.05,.34],[.12,-1.25,.26],[-.14,-1.42,.2]]:v===1?[[-.16,-.68,.36],[.16,-.9,.34],[-.1,-1.12,.32],[.1,-1.32,.24],[0,-1.52,.17]]:[[.14,-.65,.38],[-.19,-.87,.36],[.14,-1.05,.32],[-.12,-1.18,.24],[.05,-1.34,.18]];
 blobs.forEach((b,i)=>ellipse(c,p.x+b[0]*s,p.y+b[1]*s,s*b[2],s*b[2]*.77,pal[i%4]));
 ellipse(c,p.x-s*.08,p.y-s*.95,s*.2,s*.13,pal[3]+'aa');
 ellipse(c,p.x+s*.12,p.y-s*.5,s*.22,s*.14,'#1e3a2666');
 line(c,{x:p.x+s*.02,y:p.y-s*.55},{x:p.x-s*.2,y:p.y-s*.85},'#5d4a30',s*.04);
 line(c,{x:p.x-s*.02,y:p.y-s*.7},{x:p.x+s*.18,y:p.y-s*.95},'#5d4a30',s*.04);}
function goldMine(c,n,g,S,s){const p=S(n);
 ellipse(c,p.x,p.y+s*.08,s*.7,s*.24,'#33422d33');
 polygon(c,[{x:p.x-s*.7,y:p.y},{x:p.x-s*.45,y:p.y-s*.55},{x:p.x+s*.45,y:p.y-s*.55},{x:p.x+s*.7,y:p.y}],'#8a7a5e','#5d5340');
 polygon(c,[{x:p.x-s*.45,y:p.y-s*.55},{x:p.x-s*.2,y:p.y-s*.75},{x:p.x+s*.2,y:p.y-s*.75},{x:p.x+s*.45,y:p.y-s*.55}],'#9c8d6d','#5d534077');
 const fw=s*.34,fh=s*.42;
 line(c,{x:p.x-fw,y:p.y},{x:p.x-fw,y:p.y-fh},'#5d4426',s*.07);
 line(c,{x:p.x+fw,y:p.y},{x:p.x+fw,y:p.y-fh},'#5d4426',s*.07);
 line(c,{x:p.x-fw-s*.06,y:p.y-fh},{x:p.x+fw+s*.06,y:p.y-fh},'#6b4e2c',s*.08);
 line(c,{x:p.x-fw,y:p.y-fh*.55},{x:p.x+fw,y:p.y-fh*.15},'#4e3a2055',s*.03);
 ellipse(c,p.x,p.y-fh*.45,fw*.8,fh*.42,'#14100a');
 ellipse(c,p.x-fw*.3,p.y-fh*.5,fw*.25,fh*.14,'#edcb6455');
 for(let i=0;i<6;i++)ellipse(c,p.x+(noise(n.id,7,i)-.5)*s*1.2,p.y-s*(.1+noise(n.id,8,i)*.4),s*.045,s*.06,'#edcb64');}
function baseRock(c,n,g,S,s){if(n.kind==='gold'&&n.amount>0){goldMine(c,n,g,S,s);return;}
 const p=S(n),big=n.kind==='stone'&&n.amount>0?1.35:1,ss=s*big,base=n.amount>0?{stone:'#acb0a0',iron:'#84999d'}[n.kind]:'#6d7560';
 ellipse(c,p.x+ss*.15,p.y+ss*.05,ss*.62,ss*.2,'#33422d33');
 polygon(c,[{x:p.x-ss*.6,y:p.y},{x:p.x-ss*.28,y:p.y-ss*.48},{x:p.x+ss*.15,y:p.y-ss*.67},{x:p.x+ss*.65,y:p.y-ss*.14},{x:p.x+ss*.36,y:p.y+ss*.2}],base,'#465344');
 polygon(c,[{x:p.x+ss*.15,y:p.y-ss*.67},{x:p.x+ss*.05,y:p.y-ss*.1},{x:p.x+ss*.36,y:p.y+ss*.2},{x:p.x+ss*.65,y:p.y-ss*.14}],'#50645e77');
 if(n.amount>0){for(let i=0;i<4;i++)ellipse(c,p.x+ss*(-.3+i*.2),p.y-ss*(.12+(i%2)*.15),ss*.06,ss*.09,n.kind==='iron'?'#bdcbd0':'#e0dfc8');
  if(n.kind==='stone')for(let i=0;i<3;i++){const qx=p.x+ss*(.05+i*.2);line(c,{x:qx,y:p.y-ss*.2},{x:qx+ss*.1,y:p.y+ss*.08},'#7d8474',ss*.05);}}}
function tree(c,n,g,S,s){baseTree(c,n,g,S,s);if(n.amount<=0||g.visualDetail===false||s<18)return;const p=S(n),wind=Math.sin(g.time*1.5+n.id)*s*.018;for(let i=0;i<19;i++){const a=noise(n.id,4,i),b=noise(n.id,9,i),x=p.x+(a-.5)*s*.72+wind,y=p.y-s*(.62+b*.62);ellipse(c,x,y,s*(.065+a*.03),s*.043,i%3===0?'#9dab598a':i%3===1?'#294f3999':'#80a35199');}line(c,{x:p.x-s*.035,y:p.y},{x:p.x-s*.035,y:p.y-s*.45},'#a48c56',.8);for(let i=0;i<4;i++){const q=S({x:n.x+(noise(n.id,2,i)-.5)*.6,y:n.y+(noise(n.id,3,i)-.5)*.6});ellipse(c,q.x,q.y,s*.035,s*.018,'#a3a36677');}}
function rock(c,n,g,S,s){baseRock(c,n,g,S,s);if(g.visualDetail===false||s<18)return;const p=S(n);for(let i=0;i<5;i++){const x=p.x+s*(noise(n.id,1,i)-.5),y=p.y-s*(.1+noise(n.id,2,i)*.28);line(c,{x,y},{x:x+s*.1,y:y+s*.06},'#354d495e',.8);line(c,{x:x+s*.1,y:y+s*.06},{x:x+s*.05,y:y+s*.13},'#354d495e',.8);}for(let i=0;i<7;i++){const a=noise(n.id,4,i),q={x:p.x+(a-.5)*s*1.35,y:p.y+s*(.08+noise(n.id,5,i)*.18)};polygon(c,[{x:q.x-s*.05,y:q.y},{x:q.x,y:q.y-s*.07},{x:q.x+s*.07,y:q.y+s*.01}],n.amount>0&&n.kind==='gold'?'#cabb78':'#a5af99','#596b5766');}}
function historicalPerson(c,u,g,S,s,color){
 const p=S(u),worker=u.kind==='worker',scholar=u.kind==='scholar',hero=['dinh','tran'].includes(u.kind),armored=['guard','swordsman'].includes(u.kind)||hero,rank=u.rank||1;
 const heroLook=hero&&typeof g.faction==='function'?g.faction(u.owner)?.visual:null,heroCoat=heroLook?.coat||color,heroAccent=heroLook?.accent||'#c9b375',heroSecond=heroLook?.secondary||'#536a6b';
 const working=worker&&u.work?.phase==='harvest',step=u.moving?Math.sin(g.time*12+u.id):0,breath=!u.moving&&!working?Math.sin(g.time*2.4+u.id)*.012:0,swing=working?Math.sin(g.time*9+u.id)*.2:0;
 const attackT=Math.max(0,Math.min(1,1-(u.attackAnim||0)/.38)),strike=u.attackAnim>0?Math.sin(attackT*Math.PI):0,hurt=(u.hurtAnim||0)>0,command=(u.gestureAnim||0)>0;
 if(scholar&&u.healing){const patient=g.units.find(v=>v.id===u.healing&&v.hp>0);if(patient){const q=S(patient);c.save();c.setLineDash([3,6]);line(c,{x:p.x,y:p.y-s*.45},{x:q.x,y:q.y-s*.4},'#d3e7ae99',1.5);c.restore();}}
 c.save();c.translate(p.x,p.y+s*breath);s*=1.13;c.scale(Math.cos(u.angle||0)+Math.sin(u.angle||0)<0?-1:1,1);if(hurt)c.rotate(-.08*Math.sin((u.hurtAnim||0)*28));
 const cloth=worker?['#aa8157','#9f9575','#8e7056'][u.id%3]:scholar?'#647886':hero?heroCoat:armored?'#778e91':'#927448';
 // Sandals, trousers, split tunic and contrasting cloth belt.
 for(const side of [-1,1]){const gait=step*side;line(c,{x:side*s*.09,y:-s*.2},{x:side*s*.13+gait*s*.045,y:-s*.02+Math.max(0,gait)*s*.065},'#494537',s*.1);ellipse(c,side*s*.13+s*.02+gait*s*.055,-s*.01+Math.max(0,gait)*s*.065,s*.085,s*.035,'#ba9b68');}
 polygon(c,[{x:-s*.17,y:-s*.63},{x:s*.17,y:-s*.63},{x:s*.24,y:-s*.19},{x:s*.03,y:-s*.15},{x:0,y:-s*.27},{x:-s*.04,y:-s*.15},{x:-s*.23,y:-s*.19}],cloth,'#3c413788');
 polygon(c,[{x:-s*.12,y:-s*.61},{x:0,y:-s*.45},{x:s*.1,y:-s*.62},{x:0,y:-s*.55}],'#dbccb0');
 line(c,{x:-s*.19,y:-s*.3},{x:s*.19,y:-s*.3},worker?'#665239':color,s*.055);
 if(armored){for(let row=0;row<4;row++)for(let col=0;col<3;col++){c.fillStyle=hero?((row+col)%2?heroAccent:heroSecond):((row+col)%2?'#adb6a5':'#536a6b');c.fillRect((- .12+col*.09)*s,(-.54+row*.055)*s,s*.06,s*.04);}if(hero){polygon(c,[{x:-s*.17,y:-s*.61},{x:-s*.34,y:-s*.08},{x:-s*.08,y:-s*.2}],heroSecond,heroAccent);c.fillStyle=heroAccent;c.font=`${Math.max(7,s*.17)}px serif`;c.textAlign='center';c.fillText(heroLook?.emblem||'將',0,-s*.4);}}
 for(const side of [-1,1]){const march=u.moving?-step*side*.08:0,attack=side===1?strike*.26:(hero&&command ? .22 : 0);line(c,{x:side*s*.16,y:-s*.56},{x:side*s*(.26+march+attack),y:-s*(.37+attack*.9)+(side===1?swing*s:0)},cloth,s*.085);}
 ellipse(c,0,-s*.72,s*.11,s*.14,'#d8b38a');
 if(worker){polygon(c,[{x:-s*.29,y:-s*.76},{x:0,y:-s*.99},{x:s*.29,y:-s*.76}],rank>=2?'#d7c991':'#c8b97d','#77653e');line(c,{x:-s*.14,y:-s*.72},{x:0,y:-s*.6},'#735e37',.7);}
 else if(scholar){polygon(c,[{x:-s*.14,y:-s*.8},{x:-s*.12,y:-s*.99},{x:s*.12,y:-s*.99},{x:s*.14,y:-s*.8}],'#333f42','#b5bba0');c.fillStyle='#e1d2a6';c.fillRect(-s*.22,-s*.44,s*.36,s*.2);line(c,{x:-s*.04,y:-s*.44},{x:-s*.04,y:-s*.24},'#9d8960');for(let i=0;i<3;i++)line(c,{x:s*.01,y:s*(-.4+i*.04)},{x:s*.1,y:s*(-.4+i*.04)},'#8a7958',.6);}
 else if(armored){polygon(c,[{x:-s*.17,y:-s*.76},{x:-s*.14,y:-s*.89},{x:0,y:-s*.97},{x:s*.14,y:-s*.89},{x:s*.17,y:-s*.76}],hero?heroAccent:'#8b9f9c',hero?heroSecond:'#3d514e');line(c,{x:0,y:-s*.94},{x:0,y:-s*1.08},heroCoat,2);if(heroLook?.hat==='winged'){polygon(c,[{x:-s*.12,y:-s*.9},{x:-s*.38,y:-s*1.02},{x:-s*.2,y:-s*.82}],heroCoat,heroAccent);polygon(c,[{x:s*.12,y:-s*.9},{x:s*.38,y:-s*1.02},{x:s*.2,y:-s*.82}],heroCoat,heroAccent);}if(heroLook?.hat==='turban')for(let i=0;i<3;i++)line(c,{x:-s*(.13-i*.02),y:-s*(.83+i*.04)},{x:s*(.13-i*.02),y:-s*(.83+i*.04)},heroSecond,2);if(['plume','tiger'].includes(heroLook?.hat)){polygon(c,[{x:-s*.04,y:-s*.96},{x:s*.02,y:-s*1.25},{x:s*.11,y:-s*.96}],heroCoat,heroAccent);}if(heroLook?.hat==='conical')polygon(c,[{x:-s*.32,y:-s*.82},{x:0,y:-s*1.17},{x:s*.32,y:-s*.82}],heroAccent,heroSecond);if(heroLook?.hat==='scholar')polygon(c,[{x:-s*.2,y:-s*.9},{x:-s*.14,y:-s*1.06},{x:s*.14,y:-s*1.06},{x:s*.2,y:-s*.9}],heroSecond,heroAccent);}
 else{line(c,{x:-s*.13,y:-s*.83},{x:s*.13,y:-s*.83},color,s*.085);line(c,{x:s*.1,y:-s*.83},{x:s*.23,y:-s*.67},color,2);}
 if(worker){const kind=u.work?.kind||u.load?.kind||'food',x=s*(.3+swing),y=s*(-.38+swing);line(c,{x:x-s*.1,y:y+s*.18},{x:x+s*.1,y:y-s*.24},'#b89b63',2);if(kind==='wood')polygon(c,[{x:x+s*.06,y:y-s*.25},{x:x+s*.24,y:y-s*.24},{x:x+s*.19,y:y-s*.1},{x:x+s*.08,y:y-s*.12}],'#b7c4bb');else line(c,{x:x-s*.03,y:y-s*.28},{x:x+s*.22,y:y-s*.17},kind==='food'?'#927a4d':'#b9c5c0',3);if(u.load?.amount){ellipse(c,-s*.25,-s*.43,s*.13,s*.18,'#99774c');line(c,{x:-s*.34,y:-s*.44},{x:-s*.16,y:-s*.44},'#dac289',1);}}
 else if(!scholar){
  if(u.kind==='archer'){const draw=strike*s*.2;c.strokeStyle='#cfad73';c.lineWidth=2;c.beginPath();c.arc(s*.3,-s*.48,s*.27,-Math.PI/2,Math.PI/2);c.stroke();line(c,{x:s*.3,y:-s*.75},{x:s*(.18-strike*.13),y:-s*.48},{x:s*.3,y:-s*.21},'#efdbab',.8);line(c,{x:s*(.02-draw/s),y:-s*.48},{x:s*(.66+strike*.12),y:-s*.48},'#c6d6c0',1.2);}
  else if(u.kind==='crossbow'||u.kind==='divineCrossbow'){const divine=u.kind==='divineCrossbow',recoil=strike*s*(divine?.18:.12),end=divine?s*.62:s*.4;line(c,{x:-s*.28-recoil,y:-s*.48},{x:end-recoil,y:-s*.39},divine?'#7b512b':'#bd9861',divine?5:3);line(c,{x:-s*.28-recoil,y:-s*.48},{x:(divine?s*.56:s*.34)-recoil,y:-s*.28},'#e5d4a0',divine?1.5:.9);line(c,{x:s*.08-recoil,y:-s*.43},{x:(divine?s*.82:s*.64)-recoil,y:-s*.41},'#cbd7cf',divine?1.8:1.2);if(divine)line(c,{x:s*.48-recoil,y:-s*.7},{x:s*.48-recoil,y:-s*.12},'#d8b64f',3);}
  else if(u.kind==='pike'||u.kind==='skirmisher'){const thrust=strike*s*.5,base={x:s*.18,y:-s*.35},tip={x:s*(.42)+thrust,y:-s*(1.13-strike*.48)};line(c,base,tip,'#ceb684',2.2);polygon(c,[{x:tip.x+s*.05,y:tip.y-s*.13},{x:tip.x-s*.06,y:tip.y+s*.04},{x:tip.x+s*.08,y:tip.y+s*.06}],'#c6d6c0');if(u.kind==='skirmisher'){ellipse(c,-s*.23,-s*.4,s*.17,s*.2,'#a28953');line(c,{x:-s*.34,y:-s*.4},{x:-s*.12,y:-s*.4},'#5f5638',2);}}
  else{const blade=strike*.65,grip={x:s*.23,y:-s*.34},tip={x:s*(.36+blade*.45),y:-s*(.82-blade*.47)},heroWeapon=heroLook?.weapon;if(hero&&['spear','staff'].includes(heroWeapon)){line(c,{x:s*.18,y:-s*.25},{x:s*(.5+strike*.4),y:-s*(1.08-strike*.45)},heroWeapon==='staff'?heroSecond:'#c7b58c',3);if(heroWeapon==='spear')polygon(c,[{x:s*(.5+strike*.4),y:-s*(1.2-strike*.45)},{x:s*(.44+strike*.4),y:-s*(1.04-strike*.45)},{x:s*(.56+strike*.4),y:-s*(1.04-strike*.45)}],'#d5ded1',heroAccent);else ellipse(c,s*(.5+strike*.4),-s*(1.12-strike*.45),s*.07,s*.07,heroAccent);}else if(hero&&heroWeapon==='bow'){c.strokeStyle=heroAccent;c.lineWidth=2;c.beginPath();c.arc(s*.28,-s*.49,s*.28,-Math.PI/2,Math.PI/2);c.stroke();line(c,{x:s*.28,y:-s*.77},{x:s*(.12-strike*.12),y:-s*.49},{x:s*.28,y:-s*.21},heroSecond,1);}else if(hero&&heroWeapon==='axe'){line(c,grip,tip,heroSecond,3);polygon(c,[{x:tip.x-s*.13,y:tip.y-s*.12},{x:tip.x+s*.15,y:tip.y-s*.05},{x:tip.x+s*.06,y:tip.y+s*.16},{x:tip.x-s*.08,y:tip.y+s*.1}],'#cbd4d0',heroAccent);}else if(hero&&['fan','scroll'].includes(heroWeapon)){polygon(c,[grip,{x:s*.55,y:-s*.66},{x:s*.7,y:-s*.35}],heroWeapon==='fan'?'#e7ddbb':'#d7c896',heroAccent);for(let i=0;i<3;i++)line(c,{x:s*.3,y:-s*(.38+i*.04)},{x:s*.56,y:-s*(.4+i*.06)},heroSecond,1);}else if(u.kind==='swordsman'||u.kind==='guard'||hero){polygon(c,[grip,{x:tip.x-s*.035,y:tip.y+s*.08},{x:tip.x,y:tip.y-s*.13},{x:tip.x+s*.06,y:tip.y+s*.06}],hero?heroAccent:'#d5ded1','#6e8780');line(c,{x:s*.15,y:-s*.36},{x:s*.36,y:-s*.3},hero?heroSecond:'#c5ae6e',2);}else line(c,{x:s*.24,y:-s*.2},tip,'#c7b58c',2.2);if(u.kind==='guard'){ellipse(c,-s*.25-strike*s*.08,-s*.4,s*.16,s*.23,'#7b6450');ellipse(c,-s*.25-strike*s*.08,-s*.4,s*.12,s*.18,'#b2b6a0');ellipse(c,-s*.25-strike*s*.08,-s*.4,s*.045,s*.05,'#676f69');}}
 }
 if(rank>=2&&!hero){c.fillStyle='#efcf79';for(let i=1;i<rank;i++)c.fillRect(s*(-.08+(i-1)*.09),-s*.34,s*.05,s*.04);}
 if(hero){if(command){const pulse=.55+.45*Math.sin(g.time*14);c.strokeStyle=`rgba(242,212,135,${pulse})`;c.lineWidth=1.6;for(let i=0;i<5;i++){const a=-Math.PI*.9+i*Math.PI*.2;line(c,{x:Math.cos(a)*s*.43,y:-s*.76+Math.sin(a)*s*.43},{x:Math.cos(a)*s*.62,y:-s*.76+Math.sin(a)*s*.62},c.strokeStyle,1.6);}}c.fillStyle='#f2d487';c.font='11px Georgia';c.textAlign='center';c.fillText('★',0,-s*1.15);}
 if(hurt){c.globalCompositeOperation='source-atop';c.fillStyle='#ff9a7a55';c.fillRect(-s*.45,-s*1.15,s*.95,s*1.2);c.globalCompositeOperation='source-over';}
 c.restore();
}
function vessel(c,u,g,s,color){const kind=u.kind,large=['warbarge','towerShip'].includes(kind),fire=kind==='fireboat'||kind==='raft',wave=Math.sin(g.time*3+u.id)*s*.02;c.translate(0,wave);ellipse(c,0,s*.12,s*(large?.92:.7),s*.19,'#173c4355');if(u.moving){line(c,{x:-s*.78,y:s*.08},{x:-s*1.12,y:s*.2},'#d4ecdc88',1.5);line(c,{x:-s*.62,y:s*.16},{x:-s*.98,y:s*.31},'#b8dcd088',1);}
 polygon(c,[{x:-s*(large?.92:.7),y:-s*.12},{x:-s*(large?.62:.43),y:-s*.3},{x:s*(large?.88:.7),y:-s*.18},{x:s*(large?.63:.42),y:s*.22},{x:-s*(large?.58:.4),y:s*.2}],kind==='raft'?'#a17a45':'#5b3927','#e1bd7b');polygon(c,[{x:-s*(large?.62:.44),y:-s*.2},{x:s*(large?.66:.5),y:-s*.12},{x:s*(large?.48:.34),y:s*.08},{x:-s*(large?.48:.32),y:s*.07}],'#a67845','#3f3023');
 for(let i=0;i<(large?5:3);i++)line(c,{x:s*(-.42+i*(large?.21:.28)),y:-s*.19},{x:s*(-.35+i*(large?.21:.28)),y:s*.08},'#d8b77e88',1);
 const mastX=large?s*.06:0;line(c,{x:mastX,y:-s*.13},{x:mastX,y:-s*(large?1.25:.95)},'#553b26',Math.max(2,s*.045));polygon(c,[{x:mastX+s*.03,y:-s*(large?1.18:.9)},{x:mastX+s*(large?.55:.43),y:-s*(large?.58:.37)},{x:mastX+s*.03,y:-s*(large?.42:.2)}],fire?'#a42e25':color,'#f0d59a');line(c,{x:mastX+s*.08,y:-s*(large?1.08:.8)},{x:mastX+s*(large?.47:.37),y:-s*(large?.59:.38)},'#f4e0b1aa',1);
 if(kind==='transport'||kind==='warbarge'){const w=large?.72:.48,h=large?.42:.3;polygon(c,[{x:-s*w/2,y:-s*.42},{x:s*w/2,y:-s*.39},{x:s*w*.58,y:-s*.15},{x:-s*w*.58,y:-s*.18}],'#d4b67a','#684a2d');for(let i=-2;i<=2;i++)line(c,{x:i*s*w/5,y:-s*.4},{x:i*s*w/5,y:-s*.16},'#755234',1);}
 if(kind==='serpent'||kind==='fireboat'){ellipse(c,s*.72,-s*.16,s*.13,s*.12,'#b28a4e');polygon(c,[{x:s*.78,y:-s*.27},{x:s*.98,y:-s*.18},{x:s*.78,y:-s*.08}],'#d3b46b','#5d432d');ellipse(c,s*.8,-s*.2,s*.025,s*.025,'#291f18');}
 if(kind==='towerShip'){polygon(c,[{x:-s*.44,y:-s*.67},{x:s*.38,y:-s*.62},{x:s*.32,y:-s*.22},{x:-s*.38,y:-s*.25}],'#8b633a','#e1c282');polygon(c,[{x:-s*.52,y:-s*.69},{x:-s*.08,y:-s*.91},{x:s*.48,y:-s*.65},{x:s*.06,y:-s*.51}],'#4d6570','#e2c577');for(let i=-2;i<3;i++)ellipse(c,i*s*.16,-s*.45,s*.035,s*.045,'#1d2929');line(c,{x:-s*.72,y:-s*.35},{x:-s*.98,y:-s*.82},'#c5a76c',3);polygon(c,[{x:-s*1.02,y:-s*.86},{x:-s*.86,y:-s*.79},{x:-s*.95,y:-s*.68}],'#cbd2c1');}
 if(fire){for(let i=0;i<3;i++){const x=s*(-.24+i*.23),f=.12+Math.sin(g.time*12+i)*.04;ellipse(c,x,-s*.27,s*.09,s*f,'#e8562c');ellipse(c,x,-s*.32,s*.05,s*f*.7,'#ffd064');}}
 if(kind==='scout'){line(c,{x:-s*.48,y:-s*.13},{x:-s*.72,y:-s*.63},'#b99761',2);line(c,{x:s*.38,y:-s*.1},{x:s*.68,y:-s*.57},'#b99761',2);}
}
function unit(c,u,g,S,s,selected,color){const p=S(u),bob=u.moving?Math.sin(g.time*17+u.id)*1.2:0,hero=['dinh','tran','lehoan','nguyenbac'].includes(u.kind);ellipse(c,p.x+3,p.y+2,s*.28,s*.12,'#24332355');if(selected){c.strokeStyle=u.hold?'#9ed8e7':'#e6e8ad';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,s*.37,s*.19,0,0,Math.PI*2);c.stroke();}if(['worker','scholar','militia','pike','guard','crossbow','divineCrossbow','dinh','tran','lehoan','nguyenbac','archer','swordsman','skirmisher'].includes(u.kind)){historicalPerson(c,u,g,S,s,color);return;}c.save();c.translate(p.x,p.y);
 if(['scout','serpent','transport','raft','fireboat','warbarge','towerShip'].includes(u.kind))vessel(c,u,g,s,color);
 else if(u.kind==='elephant'){
  const gait=u.moving?Math.sin(g.time*8+u.id)*.08:0;c.scale(Math.cos(u.angle||0)+Math.sin(u.angle||0)<0?-1:1,1);
  ellipse(c,0,s*.08,s*.84,s*.23,'#23352744');
  for(const [x,y]of [[-.48,-.12],[.25,-.12],[-.38,.03],[.38,.03]]){line(c,{x:x*s,y:-s*.5},{x:s*(x+(x<0?gait:-gait)),y:y*s},y<0?'#586963':'#7d8d81',s*.19);ellipse(c,s*(x+(x<0?gait:-gait)),y*s,s*.12,s*.055,'#a6ab96');}
  ellipse(c,-s*.08,-s*.65,s*.64,s*.43,'#8a9889');ellipse(c,s*.52,-s*.74,s*.34,s*.37,'#a1aa98');ellipse(c,s*.28,-s*.65,s*.25,s*.31,'#798c80');
  c.strokeStyle='#a6af9b';c.lineWidth=s*.15;c.lineCap='round';c.beginPath();c.moveTo(s*.77,-s*.72);c.quadraticCurveTo(s*.92,-s*.26,s*1.01,-s*.32);c.stroke();c.lineCap='butt';
  c.strokeStyle='#e2d9b9';c.lineWidth=s*.055;c.beginPath();c.moveTo(s*.64,-s*.56);c.quadraticCurveTo(s*.91,-s*.48,s*.94,-s*.66);c.stroke();ellipse(c,s*.64,-s*.84,s*.028,s*.025,'#202e28');
  polygon(c,[{x:-s*.5,y:-s*.99},{x:s*.23,y:-s*1.02},{x:s*.24,y:-s*.48},{x:-s*.43,y:-s*.43}],color,'#e4cd8a');
  for(let i=0;i<4;i++)line(c,{x:s*(-.39+i*.16),y:-s*.46},{x:s*(-.39+i*.16),y:-s*.35},'#d6b977',2);
  polygon(c,[{x:-s*.41,y:-s*1.1},{x:s*.23,y:-s*1.11},{x:s*.12,y:-s*.9},{x:-s*.4,y:-s*.9}],'#8b6540','#d1ac70');
  line(c,{x:-s*.35,y:-s*.94},{x:-s*.35,y:-s*1.24},'#d0b67c',2);line(c,{x:s*.13,y:-s*.98},{x:s*.13,y:-s*1.24},'#d0b67c',2);
  c.fillStyle='#526b69';c.fillRect(-s*.19,-s*1.35,s*.19,s*.27);ellipse(c,-s*.09,-s*1.43,s*.095,s*.11,'#d2ad80');polygon(c,[{x:-s*.24,y:-s*1.49},{x:-s*.09,y:-s*1.63},{x:s*.06,y:-s*1.49}],'#c0ad70');line(c,{x:s*.06,y:-s*1.1},{x:s*.25,y:-s*1.77},'#d9c99b',1.8);
 }
 else if(u.kind==='catapult'){
  c.scale(Math.cos(u.angle||0)+Math.sin(u.angle||0)<0?-1:1,1);ellipse(c,s*.03,s*.09,s*.95,s*.3,'#2335274f');
  const wheel=(x,y,r=.23)=>{ellipse(c,x*s,y*s,s*r,s*(r*1.08),'#3d3527');ellipse(c,x*s,y*s,s*(r*.82),s*(r*.88),'#a67943');ellipse(c,x*s,y*s,s*(r*.64),s*(r*.7),'#684d32');for(let i=0;i<8;i++){const a=i*Math.PI/4+(u.moving?g.time*4:0);line(c,{x:x*s,y:y*s},{x:(x+Math.cos(a)*r*.62)*s,y:(y+Math.sin(a)*r*.68)*s},'#d0a566',1.4);}ellipse(c,x*s,y*s,s*.055,s*.06,'#b9c1b4');};
  wheel(-.58,-.15);wheel(.56,-.15);polygon(c,[{x:-s*.78,y:-s*.42},{x:s*.61,y:-s*.43},{x:s*.79,y:-s*.12},{x:-s*.58,y:-s*.08}],'#a9763f','#443526');for(const x of [-.52,.48])line(c,{x:x*s,y:-s*.38},{x:x*s,y:-s*.88},'#d2a35f',s*.11);line(c,{x:-s*.52,y:-s*.86},{x:s*.49,y:-s*.86},'#65442b',s*.1);
  for(const side of [-1,1]){line(c,{x:side*s*.48,y:-s*.46},{x:side*s*.1,y:-s*1.04},side<0?'#bd8b4d':'#8c6339',s*.1);polygon(c,[{x:side*s*.57,y:-s*.5},{x:side*s*.31,y:-s*.78},{x:side*s*.12,y:-s*.5}],color,'#61462f');}
  const recoil=u.cooldown>0?Math.max(0,1-u.cooldown/4)*.18:0,arm={x:s*(.56-recoil),y:-s*1.34};line(c,{x:-s*.35,y:-s*.48},arm,'#ddb06b',s*.11);line(c,{x:-s*.43,y:-s*.34},{x:arm.x-s*.08,y:arm.y+s*.12},'#e5d4a0',1.4);for(let i=0;i<3;i++)line(c,{x:-s*.35+i*2,y:-s*.48},{x:arm.x-s*.08+i*2,y:arm.y+s*.12},'#71533a99',.8);
  ellipse(c,arm.x,arm.y-s*.03,s*.19,s*.1,'#4a3c2c');polygon(c,[{x:arm.x-s*.17,y:arm.y-s*.08},{x:arm.x+s*.18,y:arm.y-s*.06},{x:arm.x+s*.13,y:arm.y-s*.24},{x:arm.x-s*.11,y:arm.y-s*.26}],'#9f7545','#4e402c');ellipse(c,arm.x,arm.y-s*.2,s*.11,s*.09,'#aeb9af');
  polygon(c,[{x:-s*.5,y:-s*.47},{x:-s*.19,y:-s*.58},{x:-s*.13,y:-s*.86},{x:-s*.46,y:-s*.74}],'#77715c','#443a2d');for(let i=0;i<4;i++)ellipse(c,-s*(.7+i*.12),-s*(.13+(i%2)*.13),s*.09,s*.08,'#939d91');line(c,{x:-s*.72,y:-s*.42},{x:-s*.72,y:-s*1.05},'#806039',2);polygon(c,[{x:-s*.72,y:-s*1.05},{x:-s*.31,y:-s*.91},{x:-s*.72,y:-s*.78}],color,'#55402d');wheel(-.58,.06);wheel(.56,.06);
 }
 else {const face=(u.angle||0)>1.5?-1:1;c.translate(0,bob);line(c,{x:-s*.09,y:-s*.16},{x:-s*.12,y:0+bob},'#4c4935',2);line(c,{x:s*.09,y:-s*.16},{x:s*.12,y:0-bob},'#4c4935',2);polygon(c,[{x:-s*.15,y:-s*.49},{x:s*.15,y:-s*.49},{x:s*.19,y:-s*.12},{x:-s*.17,y:-s*.12}],u.kind==='worker'?'#bfab7c':color,'#5c564088');ellipse(c,0,-s*.58,s*.105,s*.13,'#d8bc91');polygon(c,[{x:-s*.2,y:-s*.58},{x:0,y:-s*.79},{x:s*.2,y:-s*.58}],hero?'#d2bd74':'#bcb089','#66613d');
  const anim=u.work?.phase==='harvest'?Math.sin(g.time*12)*s*.2:0;line(c,{x:s*.15,y:-s*.33},{x:s*.3+anim,y:u.kind==='pike'?-s*.95:-s*.55},'#c4bda0',1.7);if(u.kind==='worker'){line(c,{x:s*.22+anim,y:-s*.58},{x:s*.42+anim,y:-s*.47},'#bcc5b9',3);if(u.load?.amount){c.fillStyle={wood:'#a47642',stone:'#b2b6a5',gold:'#e3c666',iron:'#a0b4b9',food:'#d1c27b'}[u.load.kind];c.fillRect(-s*.26,-s*.42,s*.14,s*.22);}}
  if(u.kind==='guard')ellipse(c,-s*.19,-s*.31,s*.11,s*.18,'#a2a68d');if(u.kind==='crossbow')line(c,{x:-s*.22,y:-s*.33},{x:s*.35,y:-s*.34},'#ead59a',2);if(hero){c.fillStyle='#f5dc87';c.font='11px Georgia';c.textAlign='center';c.fillText('★',0,-s*.9);}}
 c.restore();}
return {project,unproject,ground,groundOverlays,terrainDetail,building,tree,rock,unit,cell,line,polygon};
});
