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

/* ---------- 4. Bọc render: vẽ thêm sau lớp gốc ---------- */
const _render = render;
render = function(){
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

  for(const e of dmg) game.effects.push(e);
};
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
