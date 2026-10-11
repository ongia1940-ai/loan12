'use strict';
/* =====================================================================
   Loạn 12 Sứ Quân — Gói nâng cấp đồ họa & phong cách v2
   Không sửa core.js / game.js: chỉ bọc (wrap) prototype + render.
   - Số sát thương bay khi giao tranh (trắng: ta gây / đỏ: ta chịu)
   - Ping đỏ + chuông báo động trên bản đồ nhỏ khi bị tập kích
   - Bóng mây trôi và bụi lơ lửng tạo chiều sâu không khí
   ===================================================================== */
(function(){
const TAU = Math.PI*2;

/* ---------- 1. Móc vào Game.prototype.hit (sống sót qua restart) ---------- */
const _hit = Loan12.Game.prototype.hit;
const pings = [];
let lastBeep = 0, actx = null;

function ensureAudio(){
  if(!actx){ try{ actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(actx && actx.state==='suspended') actx.resume();
}
window.addEventListener('pointerdown', ensureAudio, {passive:true});

function beep(){
  const now = performance.now();
  if(now - lastBeep < 4000 || !actx) return;
  lastBeep = now;
  try{
    const t = actx.currentTime;
    [523, 392].forEach((f,i)=>{
      const o = actx.createOscillator(), g = actx.createGain();
      o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001, t+i*0.24);
      g.gain.exponentialRampToValueAtTime(0.22, t+i*0.24+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t+i*0.24+0.22);
      o.connect(g); g.connect(actx.destination);
      o.start(t+i*0.24); o.stop(t+i*0.24+0.26);
    });
  }catch(e){}
}

Loan12.Game.prototype.hit = function(target, amount, source){
  if(target && target.hp>0 && amount>0 && this.effects.length<420){
    const shown = Math.max(1, Math.min(Math.round(amount), Math.ceil(target.hp)));
    // Địch chưa bị phát hiện (sương mù bản đồ nhỏ): không hiện số sát thương
    if(target.owner===0 || enemySeen(target))
      this.effects.push({type:'dmg', x:target.x+(Math.random()-.5)*.6, y:target.y-.5,
        amount:shown, life:.9, max:.9, mine:target.owner===0});
    if(target.owner===0 && (target.entity==='building' || target.entity==='unit')){
      if(pings.length>14) pings.shift();
      pings.push({x:target.x, y:target.y, t0:performance.now()});
      beep();
    }
  }
  return _hit.call(this, target, amount, source);
};

/* ---------- 6. Sương mù chiến tranh trên bản đồ nhỏ ----------
   Quân/nhà địch chỉ hiện khi nằm trong tầm nhìn (6 ô) của đơn vị/công trình ta.
   Nhờ đó đầu trận không bị lộ vị trí địch, có thêm thời gian phát triển. */
function enemySeen(e){
  if(!e || e.owner===0 || game.states[e.owner]!=='enemy') return true;
  const R2 = 36;
  for(const u of game.units){
    if(u.owner!==0 || u.hp<=0) continue;
    const dx=u.x-e.x, dy=u.y-e.y;
    if(dx*dx+dy*dy < R2) return true;
  }
  for(const b of game.buildings){
    if(b.owner!==0 || b.hp<=0) continue;
    const dx=b.x-e.x, dy=b.y-e.y;
    if(dx*dx+dy*dy < R2) return true;
  }
  return false;
}
drawMini = function(){
  const pal=['#576b49','#6c6241','#83905d','#558379','#38655b','#92916d','#304e33','#ac9470'],sx=mini.width/W,sy=mini.height/H;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){mc.fillStyle=pal[game.map[y*W+x]];mc.fillRect(x*sx,y*sy,sx+1,sy+1);}
  for(let b of game.buildings){
    if(b.owner!==0 && !enemySeen(b)) continue;
    if(b.wall){if(b.hp>0){mc.fillStyle=colors[b.owner];mc.fillRect(b.x*sx-1,b.y*sy-1,2.5,2.5);}continue;}
    mc.fillStyle=b.hp>0?colors[b.owner]:game.states[b.owner]==='ally'?'#96c7a6':'#5f4a36';
    mc.fillRect(b.x*sx-2,b.y*sy-2,5,5);
  }
  for(const n of game.nodes)if(n.amount>0&&!n.farm){mc.fillStyle=n.fish?'#d8eef0':{wood:'#263f26',gold:'#ebcd65',stone:'#c2c2a9',iron:'#b0c9d5'}[n.kind];mc.fillRect(n.x*sx,n.y*sy,2,2);}
  mc.fillStyle='#f2dd92';for(let u of game.units)if(u.hp>0&&u.owner===0&&!u.embarked)mc.fillRect(u.x*sx,u.y*sy,2,2);
};

/* ---------- 7. Dân phu rảnh quá 5 giây tự kiếm việc ----------
   Bỏ qua: thợ đang giữ vị trí (G), đang được chọn, đang mang hàng (sẽ tự nộp). */
const _tick = Loan12.Game.prototype.tick;
let idleScan = 0;
const IDLE_KINDS = ['food','wood','food','wood','stone','gold','iron'];
Loan12.Game.prototype.tick = function(dt){
  _tick.call(this, dt);
  if(this.paused || this.pending!==null || this.result) return;
  idleScan += dt;
  if(idleScan < .5) return;
  idleScan = 0;
  const sel = (typeof selected!=='undefined') ? selected : [];
  for(const u of this.units){
    if(u.owner!==0 || u.kind!=='worker' || u.hp<=0 || u.embarked) continue;
    if(u.hold || sel.includes(u.id)){ u.idleT = 0; continue; }
    if(u.work || u.repairing || u.target!=null || (u.path && u.path.length)){ u.idleT = 0; continue; }
    if(u.load && u.load.amount>0){ this.returnCargo([u.id]); u.idleT = 0; continue; }
    u.idleT = (u.idleT||0) + .5;
    if(u.idleT < 5) continue;
    u.idleT = 0;
    const n = this.pickSource(u, IDLE_KINDS[u.id % IDLE_KINDS.length]);
    if(n){ u.target=null; u.path=[]; u.work={node:n.id, kind:n.kind, phase:'travel', retry:0}; }
  }
};

// Debug/test handle
window.LoanDebug = { enemySeen };

/* ---------- 2. Bóng mây trôi ---------- */
function drawClouds(){
  const t = game.time || 0;
  ctx.save();
  for(let i=0;i<5;i++){
    const wx = ((t*1.15 + i*47) % (W+70)) - 35;
    const wy = ((t*.55 + i*29) % (H+70)) - 35;
    const p = screen({x:wx, y:wy}), r = scale*12;
    if(p.x < -r || p.y < -r || p.x > width+r || p.y > height+r) continue;
    const g = ctx.createRadialGradient(p.x, p.y, r*.15, p.x, p.y, r);
    g.addColorStop(0, 'rgba(24,38,32,.20)');
    g.addColorStop(1, 'rgba(24,38,32,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------- 3. Bụi / đom đóm lơ lửng ---------- */
const dust = [];
for(let i=0;i<44;i++) dust.push({x:Math.random(), y:Math.random(), r:.8+Math.random()*1.7,
  sp:.006+Math.random()*.018, ph:Math.random()*TAU});
function drawDust(){
  const t = performance.now()/1000;
  ctx.save();
  for(const d of dust){
    const x = ((d.x + t*d.sp) % 1) * width;
    const y = ((d.y + Math.sin(t*.35 + d.ph)*.025) % 1 + 1) % 1 * height;
    ctx.fillStyle = 'rgba(255,238,196,'+(0.07+0.05*Math.sin(t*1.8+d.ph)).toFixed(3)+')';
    ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------- 4. Bọc render: sương mù chiến tranh + vẽ thêm sau lớp gốc ----------
   Quân/nhà địch ngoài tầm nhìn (6 ô) của ta bị tạm ẩn khỏi game.units /
   game.buildings khi vẽ, nên cả bản đồ chính lẫn hiệu ứng đều không
   "thể hiện" chúng. */
function withVisibleEntities(fn){
  const us = game.units, bs = game.buildings, hu = [], hb = [];
  for(let i=us.length-1; i>=0; i--){
    const u = us[i];
    if(u.owner!==0 && u.hp>0 && !enemySeen(u)){ hu.push([i,u]); us.splice(i,1); }
  }
  for(let i=bs.length-1; i>=0; i--){
    const b = bs[i];
    if(b.owner!==0 && b.hp>0 && !enemySeen(b)){ hb.push([i,b]); bs.splice(i,1); }
  }
  try{ return fn(); }
  finally{
    for(let k=hu.length-1; k>=0; k--) us.splice(hu[k][0], 0, hu[k][1]);
    for(let k=hb.length-1; k>=0; k--) bs.splice(hb[k][0], 0, hb[k][1]);
  }
}
const _render = render;
render = function(){
withVisibleEntities(()=>{
  // Tách hiệu ứng số sát thương ra để vòng vẽ gốc không vẽ nhầm thành vòng tròn
  const dmg = [];
  for(let i=game.effects.length-1; i>=0; i--){
    if(game.effects[i].type==='dmg'){ dmg.push(game.effects[i]); game.effects.splice(i,1); }
  }
  _render();

  // Số sát thương bay lên
  ctx.save();
  ctx.textAlign='center';
  ctx.font='bold 13px "Segoe UI",Arial,sans-serif';
  for(const e of dmg){
    const p = screen(e), k = 1 - e.life/e.max;
    ctx.globalAlpha = Math.max(0, Math.min(1, e.life/.35));
    const y = p.y - k*30;
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillText('-'+e.amount, p.x+1, y+1);
    ctx.fillStyle = e.mine ? '#ff8a76' : '#ffe9a8';
    ctx.fillText('-'+e.amount, p.x, y);
  }
  ctx.restore();

  drawClouds();
  drawDust();

  // Ping báo động trên bản đồ nhỏ
  const now = performance.now(), sx = mini.width/W, sy = mini.height/H;
  for(let i=pings.length-1; i>=0; i--){
    const pg = pings[i], age = (now - pg.t0)/1000;
    if(age > 2.4){ pings.splice(i,1); continue; }
    mc.save();
    mc.globalAlpha = Math.max(0, 1 - age/2.4);
    mc.strokeStyle = '#ff5a4a'; mc.lineWidth = 2;
    mc.beginPath(); mc.arc(pg.x*sx, pg.y*sy, 2 + age*10, 0, TAU); mc.stroke();
    mc.fillStyle = '#ff5a4a';
    mc.beginPath(); mc.arc(pg.x*sx, pg.y*sy, 2.4, 0, TAU); mc.fill();
    mc.restore();
  }

  // Công trình đang cháy/dở (dưới 50% HP): chấm cam nhấp nháy trên bản đồ nhỏ
  // (địch chưa bị phát hiện thì ẩn theo sương mù)
  const flick = .55 + .45*Math.sin(now/130);
  mc.save();
  for(const b of game.buildings){
    if(b.hp<=0 || b.hp>=b.maxHP*.5) continue;
    if(b.owner!==0 && !enemySeen(b)) continue;
    mc.globalAlpha = .45 + .55*flick;
    mc.fillStyle = '#ff9a3c';
    mc.beginPath(); mc.arc(b.x*sx, b.y*sy, 3, 0, TAU); mc.fill();
  }
  mc.restore();

  for(const e of dmg) game.effects.push(e);
});
};

// Ẩn cả hiệu ứng bám theo quân địch (bụi hành quân, xác, đạn bay)
if(typeof fx!=='undefined' && fx){
  const _fxUpdate = fx.update.bind(fx);
  fx.update = function(g, dt){ withVisibleEntities(()=>_fxUpdate(g, dt)); };
}
/* ---------- 5. Tiếng "tách" xác nhận lệnh kiểu AoE II ---------- */
const _order = Loan12.Game.prototype.order;
let lastTick = 0;
function tick(){
  const now = performance.now();
  if(now - lastTick < 150 || !actx) return;
  lastTick = now;
  try{
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type='square'; o.frequency.value=880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.07);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t+0.09);
  }catch(e){}
}
Loan12.Game.prototype.order = function(ids, point, targetId, attackMove){
  if(ids && ids.length) tick();
  return _order.call(this, ids, point, targetId, attackMove);
};

})();
