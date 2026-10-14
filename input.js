// Loạn 12 Sứ Quân — gắn điều khiển chuột/phím kiểu AoE2 vào chiến trường (dùng LoanControls).
'use strict';
const inputPrefs=(()=>{let v={leftCommand:false};try{const raw=localStorage.getItem('loan12.input');if(raw)v={...v,...JSON.parse(raw)};}catch(e){}return v;})();
function saveInputPrefs(){try{localStorage.setItem('loan12.input',JSON.stringify(inputPrefs));}catch(e){}}
const CTL=LoanControls;
const svgCursor=(body,hx,hy,fallback)=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>${body}</svg>`)}") ${hx} ${hy}, ${fallback}`;
const OUT="stroke='#1b140b' stroke-width='1.6' stroke-linejoin='round'";
const CURSORS={
 default:'default',select:'pointer',move:'default',
 attack:svgCursor(`<path d='M3 3 L9 3 L23 17 L20 20 L6 6 Z' fill='#e9e4d4' ${OUT}/><path d='M18 22 L22 18 L26 22 L22 26 Z' fill='#b8862f' ${OUT}/><path d='M22 26 L28 29 L29 28 L26 22' fill='#6b3d1f' ${OUT}/><path d='M16 24 L24 16' stroke='#d6a742' stroke-width='3'/>`,3,3,'crosshair'),
 axe:svgCursor(`<path d='M6 26 L22 10' stroke='#7a4a22' stroke-width='3.4' stroke-linecap='round'/><path d='M16 4 C22 3 28 8 27 14 L20 13 L17 10 Z' fill='#cfd3d6' ${OUT}/>`,6,26,'pointer'),
 pick:svgCursor(`<path d='M7 27 L21 11' stroke='#7a4a22' stroke-width='3.4' stroke-linecap='round'/><path d='M8 8 C14 3 24 4 29 11 C23 8 17 8 12 12 Z' fill='#c9cdd2' ${OUT}/>`,7,27,'pointer'),
 sickle:svgCursor(`<path d='M8 27 L13 21' stroke='#7a4a22' stroke-width='3.4' stroke-linecap='round'/><path d='M13 21 C6 12 14 3 24 5 C17 7 13 13 16 19 Z' fill='#d7dadc' ${OUT}/>`,8,27,'pointer'),
 hammer:svgCursor(`<path d='M7 27 L19 13' stroke='#7a4a22' stroke-width='3.6' stroke-linecap='round'/><path d='M14 6 L22 3 L28 10 L21 14 Z' fill='#aab0b5' ${OUT}/>`,7,27,'pointer'),
 board:svgCursor(`<circle cx='16' cy='7' r='3' fill='none' stroke='#f2e2b0' stroke-width='2.4'/><path d='M16 10 L16 27 M9 15 L23 15 M6 21 C8 27 24 27 26 21' fill='none' stroke='#f2e2b0' stroke-width='2.6' stroke-linecap='round'/>`,16,16,'pointer'),
 build:'crosshair'
};
let lastClick={t:0,id:null,x:0,y:0},lastGroupKey={n:0,t:0},cursorClock=0,miniDrag=false;
function visibleOnScreen(e){const s=screen(e);return s.x>=0&&s.y>=0&&s.x<=width&&s.y<=height;}
function canCommand(){return started&&game.pending===null&&!game.result;}
function ownUnits(){return selected.map(id=>game.entity(id)).filter(u=>u&&u.entity==='unit'&&u.owner===0&&u.hp>0&&!u.embarked);}
function issueCommand(p,target){if(!selected.length)return null;const c=CTL.executeCommand(game,selected,p,target,{U,attackMove:attackMode});if(c.type==='gather'||c.type==='fish')selectedNode=c.node.id;if(c.type!=='none'&&c.type!=='rally'&&!['attack','move','attackMove'].includes(c.type))toast(CTL.COMMAND_NAMES[c.type]);attackMode=false;updateUI();return c;}
function selectEntity(target,e){const additive=e.shiftKey,toggle=e.ctrlKey||e.metaKey;panelMode='orders';selectedNode=null;
 if(target?.entity==='resource'){if(!additive&&!toggle)selected=[];selectedNode=target.id;panelMode='resource';return;}
 if(!target||target.owner!==0){if(!additive&&!toggle)selected=[];if(target&&target.owner!==0&&target.hp>0)toast((target.entity==='unit'?U[target.kind]?.name:B[target.kind]?.name||'Công trình')+' · '+(LORDS[target.owner]||'Đối phương'));return;}
 const now=performance.now(),dbl=lastClick.id!=null&&now-lastClick.t<380&&Math.hypot(lastClick.x-e.clientX,lastClick.y-e.clientY)<12&&game.entity(lastClick.id)?.kind===target.kind;lastClick={t:now,id:target.id,x:e.clientX,y:e.clientY};
 if(dbl){const same=CTL.sameTypeOnScreen(game,target,visibleOnScreen);selected=additive||toggle?CTL.addSelection(selected,same):same;lastClick.id=null;return;}
 if(toggle)selected=CTL.toggleSelection(selected,target.id);else if(additive)selected=CTL.addSelection(selected,[target.id]);else selected=[target.id];}
canvas.addEventListener('pointerdown',e=>{
 if(e.button===1||e.button===2){e.preventDefault();const p=pos(e);camMotion.pan={x:p.x,y:p.y,cam:{x:cam.x,y:cam.y},button:e.button,moved:false,pointerId:e.pointerId};camMotion.suppressContext=false;try{canvas.setPointerCapture(e.pointerId);}catch(err){}return;}
 if(e.button!==0||!canCommand())return;pointer=pos(e);drag={...pointer,shift:e.shiftKey,ctrl:e.ctrlKey||e.metaKey};if(buildMode&&isWall(buildMode))wallDrag={...pointer};try{canvas.setPointerCapture(e.pointerId);}catch(err){}});
canvas.addEventListener('pointerup',e=>{
 if((e.button===1||e.button===2)&&camMotion.pan?.button===e.button){camMotion.suppressContext=e.button===2&&camMotion.pan.moved;camMotion.pan=null;try{canvas.releasePointerCapture(e.pointerId);}catch(err){}return;}
 if(e.button!==0||!drag)return;const p=pos(e),w=world(p);const d=drag;drag=null;
 if(!canCommand()){wallDrag=null;return;}
 if(buildMode&&isWall(buildMode)){const builders=ownUnits().filter(u=>u.kind==='worker').map(u=>u.id);if(!builders.length){toast('Phải chọn Dân Phu trước khi xây');buildMode=null;updateUI();return;}const a=tileOf(world(wallDrag||p)),placed=game.buildWall(buildMode,a,tileOf(w),0);wallDrag=null;if(placed&&placed.length){game.construct(builders,placed.map(b=>b.id),true,e.shiftKey);if(!e.shiftKey){buildMode=null;panelMode='orders';}}else toast((game.wallPlan&&game.wallPlan(buildMode,a,tileOf(w),0).error)||'Không xây được ở đây · Esc / chuột phải để hủy');updateUI();return;}
 if(buildMode){const builders=ownUnits().filter(u=>u.kind==='worker').map(u=>u.id);if(!builders.length){toast('Phải chọn Dân Phu trước khi xây');buildMode=null;updateUI();return;}const err=game.buildError(buildMode,{x:Math.round(w.x),y:Math.round(w.y)});const b=err?null:game.build(buildMode,w);if(b){game.construct(builders,[b.id],false,e.shiftKey);if(!e.shiftKey){buildMode=null;panelMode='orders';}}else toast((err||'Không xây được ở đây')+' · Esc / chuột phải để hủy');updateUI();return;}
 if(trapMode){const b=game.entity(trapMode);if(b&&b.hp>0&&U[b.kind]?.fisher){if(game.deployTrap([trapMode],w)&&!e.shiftKey)trapMode=null;}else trapMode=null;updateUI();return;}
 if(attackMode){const target=pick(w);issueCommand(w,target&&CTL.hostile(game,target)?target:null);return;}
 if(dist(d,p)>6){const list=CTL.boxSelect(game.units.filter(u=>u.hp>0&&u.owner===0&&!u.embarked),d,p,screen);let ids=list;if(!ids.length){const bs=CTL.boxSelect(game.buildings.filter(b=>b.hp>0&&b.owner===0&&!b.wall),d,p,screen);ids=bs.slice(0,1);}panelMode='orders';selectedNode=null;selected=d.shift||d.ctrl?CTL.addSelection(selected,ids):ids;updateUI();return;}
 const target=pick(w);
 if(CTL.leftClickIssues(game,selected,target,inputPrefs.leftCommand)&&!e.shiftKey&&!(e.ctrlKey||e.metaKey)){issueCommand(w,target);return;}
 selectEntity(target,e);updateUI();});
canvas.addEventListener('pointercancel',()=>{drag=null;wallDrag=null;camMotion.pan=null;});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(camMotion.suppressContext){camMotion.suppressContext=false;return;}if(buildMode||attackMode||trapMode){buildMode=null;attackMode=false;trapMode=null;wallDrag=null;updateUI();return;}if(!canCommand())return;const w=world(pos(e));issueCommand(w,pick(w));});
// minimap: left = camera (drag to pan), right = send selected units
function miniPoint(e){const b=mini.getBoundingClientRect();return {x:Math.max(0,Math.min(W,(e.clientX-b.left)/b.width*W)),y:Math.max(0,Math.min(H,(e.clientY-b.top)/b.height*H))};}
mini.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();miniDrag=true;try{mini.setPointerCapture(e.pointerId);}catch(err){}const p=miniPoint(e);cam.x=p.x;cam.y=p.y;camMotion.anchor=null;});
mini.addEventListener('pointermove',e=>{if(!miniDrag)return;const p=miniPoint(e);cam.x=p.x;cam.y=p.y;});
mini.addEventListener('pointerup',()=>{miniDrag=false;});mini.addEventListener('pointercancel',()=>{miniDrag=false;});
mini.addEventListener('contextmenu',e=>{e.preventDefault();if(!canCommand()||!ownUnits().length)return;const p=miniPoint(e);issueCommand(p,null);game.effects.push({type:'order',x:p.x,y:p.y,life:.6,max:.6});});
// cursor feedback
canvas.addEventListener('pointermove',e=>{const now=performance.now();if(now-cursorClock<70)return;cursorClock=now;let kind='default';if(camMotion.pan)kind='move';else if(started){const target=drag?null:pick(world(pos(e)));kind=CTL.cursorFor(game,selected,target,{buildMode,attackMove:attackMode});}canvas.style.cursor=CURSORS[kind]||'default';canvas.dataset.cursor=kind;});
// edge scroll also at the real window edges (header/side panel)
window.addEventListener('pointermove',e=>{if(e.target===canvas)return;const m=4;if(started&&(e.clientX<=m||e.clientY<=m||e.clientX>=innerWidth-1-m||e.clientY>=innerHeight-1-m)){camMotion.inside=true;pointer=pos(e);}else if(!drag)camMotion.inside=false;});
document.addEventListener('mouseleave',()=>{camMotion.inside=false;});
// side panel: never rebuild while a button is being pressed
{const d=document.querySelector('#details');d.addEventListener('pointerdown',()=>{panelPress=true;});d.addEventListener('pointerenter',()=>{panelHover=true;});d.addEventListener('pointerleave',()=>{panelHover=false;});}window.addEventListener('pointerup',()=>{if(panelPress){panelPress=false;setTimeout(updateUI,0);}});window.addEventListener('pointercancel',()=>{panelPress=false;});
function centerOn(list){const e=list.map(id=>game.entity(id)).filter(Boolean);if(!e.length)return;cam.x=e.reduce((s,v)=>s+v.x,0)/e.length;cam.y=e.reduce((s,v)=>s+v.y,0)/e.length;camMotion.anchor=null;}
function goHome(){const h=game.hall&&game.hall();if(!h){toast('Không còn Đại Bản Doanh');return;}selected=[h.id];selectedNode=null;panelMode='orders';buildMode=null;trapMode=null;centerOn([h.id]);updateUI();}
function nextIdleWorker(){const idle=game.units.filter(u=>u.hp>0&&u.owner===0&&u.kind==='worker'&&!u.embarked&&!u.work&&!u.target&&!(u.path&&u.path.length)&&!u.repair);if(!idle.length){toast('Không có dân phu rảnh');return;}const cur=idle.findIndex(u=>u.id===selected[0]),u=idle[(cur+1)%idle.length];selected=[u.id];panelMode='orders';selectedNode=null;centerOn([u.id]);updateUI();}
window.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]'))return;const tag=(e.target&&e.target.tagName)||'';if(/INPUT|SELECT|TEXTAREA/.test(tag))return;
 if(e.code==='F1'){e.preventDefault();toggleHelp();return;}
 const digit=/^(Digit|Numpad)([1-9])$/.exec(e.code);
 if(digit){e.preventDefault();if(e.repeat)return;const n=Number(digit[2]);if(e.ctrlKey||e.metaKey){game.saveGroup(n,selected);toast('Đã lưu đạo quân '+n);}else{const ids=game.getGroup(n);if(e.shiftKey)selected=CTL.addSelection(selected,ids);else selected=ids;panelMode='orders';buildMode=null;trapMode=null;selectedNode=null;const now=performance.now();if(lastGroupKey.n===n&&now-lastGroupKey.t<400)centerOn(ids);lastGroupKey={n,t:now};if(!ids.length)toast('Đạo quân '+n+' trống · Ctrl+'+n+' để lưu');}updateUI();return;}
 if(e.code==='Escape'){if(buildMode||attackMode||wallDrag||trapMode){buildMode=null;wallDrag=null;attackMode=false;trapMode=null;}else{selected=[];selectedNode=null;panelMode='orders';}updateUI();return;}
 if(e.code==='Delete'){if(!started||e.repeat)return;const n=game.destroyOwn(selected);toast(n?'Đã giải tán '+n+' đối tượng':'Không thể giải tán (Đại Bản Doanh / thuyền đang chở quân)');selected=selected.filter(id=>{const v=game.entity(id);return v&&v.hp>0;});updateUI();return;}
 if(e.code==='KeyH'&&!e.repeat){goHome();return;}
 if(e.code==='Period'&&!e.repeat){nextIdleWorker();return;}
 if(e.code==='KeyX'){game.stop(selected,false);updateUI();return;}
 if(e.code==='KeyG'&&!e.repeat){if(selected.length===1){const b=game.entity(selected[0]);if(b&&b.kind==='gate'&&b.owner===0){game.toggleGate(b);updateUI();return;}}if(ownUnits().length){game.stop(selected,true);toast('Giữ vị trí');updateUI();}return;}
 if(e.code==='KeyU'&&!e.repeat){let n=0;for(const id of selected){const u=game.entity(id);if(u&&u.cargo&&u.cargo.length){n+=game.unload(u).length||0;}}toast(n?'Đã đổ '+n+' quân lên bờ':'Thuyền cần đứng sát bờ đất trống');updateUI();return;}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(e.code==='Space')selectArmy();if(e.code==='KeyP'){game.paused=!game.paused;updateUI();}if(e.code==='KeyA'&&ownUnits().length){attackMode=!attackMode;updateUI();}});
// help panel (Vietnamese) with the left-command option
const helpPanel=document.createElement('section');helpPanel.id='controlsHelp';helpPanel.className='controls-help';helpPanel.hidden=true;
helpPanel.innerHTML='<div class="help-head"><b>PHÍM TẮT · ĐIỀU KHIỂN KIỂU AoE II</b><button type="button" id="closeHelp" title="Đóng (F1)">×</button></div><label class="left-command"><input type="checkbox" id="leftCommand"> <span><b>Lệnh bằng chuột trái</b><small>Khi đang chọn quân, nhấp trái lên đất / địch / tài nguyên cũng ra lệnh (mặc định: chuột phải như AoE II)</small></span></label><dl></dl>';
const dl=helpPanel.querySelector('dl');for(const [k,v] of CTL.HELP){const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;dl.append(dt,dd);}
{const row=document.createElement('div');row.className='cursor-legend';row.append('Con trỏ: ');for(const [k,label] of [['attack','tấn công'],['axe','đốn gỗ'],['pick','đào mỏ'],['sickle','lương thực'],['hammer','xây / sửa'],['board','lên thuyền']]){const m=/url\("([^"]+)"\)/.exec(CURSORS[k]);const span=document.createElement('span');if(m){const img=document.createElement('img');img.src=m[1];img.alt='';span.append(img);}span.append(label);row.append(span);}helpPanel.querySelector('dl').after(row);}
document.querySelector('#battle').append(helpPanel);
const leftBox=helpPanel.querySelector('#leftCommand');leftBox.checked=!!inputPrefs.leftCommand;leftBox.onchange=()=>{inputPrefs.leftCommand=leftBox.checked;saveInputPrefs();toast(leftBox.checked?'Đã bật: chuột trái cũng ra lệnh':'Chuột phải ra lệnh (chuẩn AoE II)');updateUI();};
function toggleHelp(force){helpPanel.hidden=force===undefined?!helpPanel.hidden:!force;helpButton.classList.toggle('active',!helpPanel.hidden);}
helpPanel.querySelector('#closeHelp').onclick=()=>toggleHelp(false);
const helpButton=document.createElement('button');helpButton.id='keysButton';helpButton.title='Phím tắt và điều khiển (F1)';helpButton.innerHTML='<span>⌨</span><small>Phím tắt</small>';helpButton.onclick=()=>toggleHelp();document.querySelector('.utility-dock').append(helpButton);
document.querySelector('#home').title='Về Đại Bản Doanh (H)';
document.querySelector('footer span:last-child').textContent='Trái: chọn · Phải: lệnh · Giữ + kéo phải: camera · F1: phím tắt';
const introTips=document.querySelector('#intro .instructions div p');if(introTips)introTips.textContent='Chọn Dân Phu trước khi kiến thiết; thợ phải tới công trường mới tăng tiến độ. Nhấp chuột phải để ra lệnh, giữ và kéo chuột phải để di chuyển camera bốn hướng. F1 xem phím tắt.';
// AoE2-style corner minimap: always visible on the battlefield (it used to sit below the fold of the hidden side panel)
mini.classList.add('floating-minimap');document.querySelector('#battle').append(mini);
const legend=document.querySelector('aside .legend');if(legend)legend.classList.add('legend-under-panel');
