// Loạn 12 Sứ Quân — màn hình chính / thiết lập trận trước khi vào chiến trường.
'use strict';
{
const MENU_TILE=['#79a847','#8a6f4a','#a9b25f','#55b8ae','#207a9e','#b3a26e','#5f9240','#aaa695'];
const MENU_STORE='loan12.setup';
const menuState=(()=>{let s=null;try{s=JSON.parse(localStorage.getItem(MENU_STORE)||'null');}catch(e){}s=Loan12.normalizeSetup(s||{});s.size=Loan12.MAP_SIZE;return s;})();
function saveMenuState(){try{localStorage.setItem(MENU_STORE,JSON.stringify(menuState));}catch(e){}}
window.matchSetup=function(){menuState.map=mapSelect.value;menuState.faction=factionSelect.value;saveMenuState();return Loan12.normalizeSetup({...menuState,size:Loan12.MAP_SIZE,seed:(Math.random()*2**31)|0});}
const menuDialog=document.querySelector('#intro');menuDialog.classList.add('main-menu');
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
// ---------- header + tabs ----------
const head=el('div','menu-head','<div class="menu-brand"><span class="seal">丁</span><div><small>ĐẠI CỒ VIỆT · CHIẾN THUẬT THỜI GIAN THỰC</small><b>LOẠN 12 SỨ QUÂN</b></div></div>');
const tabs=el('nav','menu-tabs');const panes={};
const TABS=[['setup','⚑ Thiết lập trận'],['faction','♛ Sứ quân'],['lan','⇄ Nhiều người (LAN)'],['gallery','卷 Binh chủng & hướng dẫn']];
for(const [id,label] of TABS){const b=el('button','menu-tab');b.type='button';b.dataset.tab=id;b.textContent=label;b.onclick=()=>showTab(id);tabs.append(b);panes[id]=el('section','menu-pane pane-'+id);}
head.append(tabs);
function showTab(id){for(const b of tabs.children)b.classList.toggle('active',b.dataset.tab===id);for(const [k,p] of Object.entries(panes))p.hidden=k!==id;menuDialog.scrollTop=0;}
// move existing content into panes (nothing is removed, so other modules keep working)
const q=s=>menuDialog.querySelector(s);
const mpBox=document.querySelector('.multiplayer-box'),instructions=q('.instructions');
const oldEyebrow=q(':scope>.eyebrow'),oldTitle=q(':scope>h2'),oldLead=q(':scope>p:not(.note)');
panes.faction.append(...[oldEyebrow,oldTitle,oldLead,q('.faction-roster'),q('.faction-showcase'),q('.note')].filter(Boolean));
if(mpBox){const lanIntro=el('div','lan-intro','<h3>Chơi cùng đồng đội qua mạng LAN</h3><p>Chạy <code>node server.cjs</code> trên một máy rồi mở <code>http://IP-máy:4180</code> trên các máy khác. Mở bằng file:// chỉ chơi đơn được. Phòng LAN dùng thiết lập mặc định (đủ 11 sứ quân, tài nguyên tiêu chuẩn, kích thước Tiêu chuẩn) để mọi máy giống nhau; bản đồ và sứ quân lấy theo chủ phòng.</p>');panes.lan.append(lanIntro,mpBox);}
if(instructions){instructions.classList.add('menu-instructions');panes.gallery.append(instructions);}
panes.gallery.append(...[q('.fleet-showcase'),q('.architecture-showcase'),q('.siege-showcase')].filter(Boolean));
const mapLabel0=mapSelect.closest('label');if(mapLabel0)mapLabel0.hidden=true;
// ---------- setup pane ----------
const setupPane=panes.setup;
setupPane.innerHTML=`<div class="setup-maps"><h3>Bản đồ chiến dịch</h3><div class="map-cards"></div></div>
<div class="setup-side"><div class="preview-wrap"><canvas class="map-preview" width="420" height="300" aria-label="Xem trước bản đồ"></canvas><div class="preview-caption"><b></b><span></span></div></div>
<div class="setup-form">
 <label>Kích thước bản đồ<select id="menuSize"></select></label>
 <label>Sứ quân của bạn<select id="menuFaction"></select></label>
 <label>Tài nguyên khởi đầu<select id="menuResources"></select></label>
 <label>Số đối thủ AI<select id="menuAiCount"></select></label>
</div><p class="size-note" id="sizeNote"></p>
<div class="ai-table"><div class="ai-row ai-headrow"><span>Vị trí</span><span>Phe đối thủ</span><span>Độ khó</span></div><div class="ai-rows"></div></div>
<p class="setup-lock" id="setupLock" hidden>Đang trong trận — thiết lập bị khóa. Chọn “Chơi lại” khi kết thúc để đổi.</p></div>`;
{const t=setupPane.querySelector('.ai-table'),h=document.createElement('h3');h.textContent='Đối thủ AI';h.className='ai-title';setupPane.querySelector('.setup-maps').append(h,t);const hr=t.querySelector('.ai-headrow');hr.after(hr.cloneNode(true));}
const cards=setupPane.querySelector('.map-cards'),preview=setupPane.querySelector('.map-preview'),pcap=setupPane.querySelector('.preview-caption');
const sizeSel=setupPane.querySelector('#menuSize'),facSel=setupPane.querySelector('#menuFaction'),resSel=setupPane.querySelector('#menuResources'),aiSel=setupPane.querySelector('#menuAiCount'),aiRows=setupPane.querySelector('.ai-rows');
const opt=(sel,v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;sel.append(o);};
for(const [k,s] of Object.entries(Loan12.SIZES))opt(sizeSel,k,s.name+' · '+s.w+'×'+s.h+' ô');
for(const o of factionSelect.options)opt(facSel,o.value,o.textContent);
for(const [k,r] of Object.entries(Loan12.RESOURCE_PRESETS))opt(resSel,k,r.name+' · '+r.stock.food+' lương, '+r.stock.wood+' gỗ');
for(let i=1;i<=Loan12.MAX_AI;i++)opt(aiSel,i,i+' sứ quân'+(i===Loan12.MAX_AI?' (đủ 12 phe)':''));
sizeSel.value=Loan12.MAP_SIZE;resSel.value=menuState.resources;aiSel.value=menuState.aiCount;
if([...factionSelect.options].some(o=>o.value===menuState.faction)){factionSelect.value=menuState.faction;if(typeof updateFactionPreview==='function')updateFactionPreview();}
if(Loan12.MAPS.some(m=>m.id===menuState.map))mapSelect.value=menuState.map;
facSel.value=factionSelect.value;
function siteName(owner){return Loan12.LORDS[owner];}
function buildAiRows(){aiRows.replaceChildren();for(let i=1;i<=Loan12.MAX_AI;i++){const a=menuState.ai[i-1],row=el('div','ai-row'+(i>menuState.aiCount?' absent':''));const name=el('span','ai-site');name.innerHTML='<i>'+String(i+1).padStart(2,'0')+'</i> '+siteName(i);
 const f=document.createElement('select');f.setAttribute('aria-label','Phe đối thủ '+i);opt(f,'auto','Mặc định');opt(f,'random','🎲 Ngẫu nhiên');for(const fa of Loan12.FACTIONS)opt(f,String(fa.id),fa.name);f.value=a.faction;f.onchange=()=>{a.faction=f.value;saveMenuState();};
 const d=document.createElement('select');d.setAttribute('aria-label','Độ khó đối thủ '+i);for(const [k,v] of Object.entries(Loan12.DIFFICULTY))opt(d,k,v.name);d.value=a.difficulty;d.onchange=()=>{a.difficulty=d.value;saveMenuState();};
 if(i>menuState.aiCount){f.disabled=d.disabled=true;}row.append(name,f,d);aiRows.append(row);}}
// ---------- thumbnails ----------
const thumbCache={};
function mapGame(id){if(!thumbCache[id]){const g=new Loan12.Game('0',()=>.5,id);thumbCache[id]={map:g.map.slice(),W:Loan12.W,H:Loan12.H,halls:g.buildings.filter(b=>b.kind==='hall').map(b=>({x:b.x,y:b.y,owner:b.owner}))};}return thumbCache[id];}
function drawMap(cv,id,detail){const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.clearRect(0,0,w,h);if(id==='random'){const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#38513a');g.addColorStop(1,'#1d3443');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#f3dc9a';c.font='bold '+Math.round(h*.45)+'px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('?',w/2,h/2+2);return;}
 const m=mapGame(id),img=c.createImageData(m.W,m.H);for(let i=0;i<m.W*m.H;i++){const col=MENU_TILE[m.map[i]]||MENU_TILE[0],n=parseInt(col.slice(1),16),shade=((i*2654435761)>>>28)/40;img.data[i*4]=((n>>16)&255)*(1-shade);img.data[i*4+1]=((n>>8)&255)*(1-shade);img.data[i*4+2]=(n&255)*(1-shade);img.data[i*4+3]=255;}
 const off=document.createElement('canvas');off.width=m.W;off.height=m.H;off.getContext('2d').putImageData(img,0,0);c.imageSmoothingEnabled=true;c.drawImage(off,0,0,w,h);
 const sx=w/m.W,sy=h/m.H;for(const b of m.halls){const x=b.x*sx,y=b.y*sy,absent=b.owner>0&&b.owner>menuState.aiCount;if(b.owner===0){c.fillStyle='#ffd766';c.strokeStyle='#3b2a10';c.lineWidth=2;c.beginPath();for(let k=0;k<10;k++){const r=k%2?4:9,a=-Math.PI/2+k*Math.PI/5;c.lineTo(x+Math.cos(a)*r*(detail?1.2:.8),y+Math.sin(a)*r*(detail?1.2:.8));}c.closePath();c.fill();c.stroke();continue;}
  c.globalAlpha=absent?.45:1;c.fillStyle=absent?'#77756d':colors[b.owner]||'#b15d49';c.strokeStyle='#1e160c';c.lineWidth=1.5;c.beginPath();c.arc(x,y,detail?7:3.6,0,Math.PI*2);c.fill();c.stroke();if(detail){c.fillStyle='#fff6dc';c.font='bold 9px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(absent?'×':String(b.owner+1),x,y+.5);}c.globalAlpha=1;}}
const cardEls={};
for(const m of Loan12.MAPS){const b=el('button','map-card');b.type='button';b.dataset.map=m.id;const cv=document.createElement('canvas');cv.width=168;cv.height=120;b.append(cv,el('b',null,m.name),el('small',null,m.style));b.onclick=()=>{if(mapSelect.disabled)return;mapSelect.value=m.id;mapSelect.dispatchEvent(new Event('change'));if(mapSelect.onchange)mapSelect.onchange();menuState.map=m.id;saveMenuState();refresh();};cards.append(b);cardEls[m.id]=cv;}
let thumbQueue=Loan12.MAPS.map(m=>m.id);
function pumpThumbs(){const id=thumbQueue.shift();if(!id)return;try{drawMap(cardEls[id],id,false);}catch(e){console.warn(e);}setTimeout(pumpThumbs,30);}
function refresh(){const id=mapSelect.value;for(const b of cards.children)b.classList.toggle('chosen',b.dataset.map===id);try{drawMap(preview,id,true);}catch(e){console.warn(e);}const m=Loan12.MAPS.find(m=>m.id===id)||Loan12.MAPS[0];pcap.querySelector('b').textContent=m.name+' · '+m.style;pcap.querySelector('span').textContent=m.description+' ★ = căn cứ của bạn, số = sứ quân đối thủ.';
 for(const [i,row] of [...aiRows.children].entries()){const absent=i+1>menuState.aiCount;row.classList.toggle('absent',absent);for(const s of row.querySelectorAll('select'))s.disabled=absent||started;}
}
sizeSel.onchange=()=>{if(sizeSel.value===Loan12.MAP_SIZE)return;menuState.size=sizeSel.value;menuState.map=mapSelect.value;menuState.faction=factionSelect.value;saveMenuState();setupPane.querySelector('#sizeNote').textContent='Đang tải lại để dựng bản đồ '+Loan12.SIZES[sizeSel.value].name+'…';setTimeout(()=>location.reload(),60);};
facSel.onchange=()=>{factionSelect.value=facSel.value;factionSelect.dispatchEvent(new Event('change'));if(factionSelect.onchange)factionSelect.onchange();menuState.faction=facSel.value;saveMenuState();};
resSel.onchange=()=>{menuState.resources=resSel.value;saveMenuState();};
aiSel.onchange=()=>{menuState.aiCount=Number(aiSel.value);saveMenuState();refresh();for(const id of Object.keys(cardEls))drawMap(cardEls[id],id,false);};
mapSelect.addEventListener('change',()=>{menuState.map=mapSelect.value;saveMenuState();refresh();});
setupPane.querySelector('#sizeNote').textContent=Loan12.MAP_SIZE==='standard'?'Bản đồ lớn hơn giãn đều địa hình và khoảng cách giữa các căn cứ (đổi kích thước sẽ tải lại trang).':'Đang dùng bản đồ '+Loan12.SIZES[Loan12.MAP_SIZE].name+' '+Loan12.W+'×'+Loan12.H+'. Phòng LAN cần kích thước Tiêu chuẩn.';
// ---------- footer ----------
const foot=el('div','menu-foot');const lanBtn=el('button','menu-lan','⇄ Chơi nhiều người');lanBtn.type='button';lanBtn.onclick=()=>showTab('lan');
const summary=el('span','menu-summary');foot.append(lanBtn,summary,document.querySelector('#start'));
function updateSummary(){const m=Loan12.MAPS.find(m=>m.id===mapSelect.value),f=factionSelect.value==='random'?'Ngẫu nhiên':Loan12.FACTIONS[Number(factionSelect.value)]?.name;summary.textContent=(typeof multi!=='undefined'&&multi.active?'PHÒNG '+multi.code+' · ':'')+(m?m.name:'')+' · '+Loan12.SIZES[Loan12.MAP_SIZE].name+' · '+f+' · '+menuState.aiCount+' đối thủ · tài nguyên '+Loan12.RESOURCE_PRESETS[menuState.resources].name.toLowerCase();}
// assemble: header, panes, footer (any leftover nodes go to the faction pane)
const leftovers=[...menuDialog.children];menuDialog.replaceChildren(head,...Object.values(panes),foot);for(const n of leftovers)if(!n.isConnected&&n.id!=='start')panes.faction.append(n);
buildAiRows();showTab('setup');refresh();const resetScroll=()=>{for(const p of Object.values(panes))p.scrollTop=0;menuDialog.scrollTop=0;};const baseShow=menuDialog.showModal.bind(menuDialog);menuDialog.showModal=function(){baseShow();resetScroll();requestAnimationFrame(resetScroll);};if(menuDialog.open)requestAnimationFrame(resetScroll);setTimeout(pumpThumbs,50);
// multiplayer: random map resolved before the room is created, LAN only at standard size
for(const id of ['createRoom','joinRoom']){const b=document.querySelector('#'+id);if(b)b.addEventListener('click',e=>{if(Loan12.MAP_SIZE!=='standard'){e.stopImmediatePropagation();e.preventDefault();if(typeof multiMessage==='function')multiMessage('Phòng LAN cần kích thước bản đồ Tiêu chuẩn — đổi ở thẻ “Thiết lập trận”.',true);return;}if(id==='createRoom'&&mapSelect.value==='random'){mapSelect.value=Loan12.resolveMapId('random');refresh();}},true);}
// keep the mirrored controls in sync (roster buttons, multiplayer room lock, in-match lock)
setInterval(()=>{if(!menuDialog.open)return;if(facSel.value!==factionSelect.value)facSel.value=factionSelect.value;const lock=started||factionSelect.disabled;facSel.disabled=lock;sizeSel.disabled=started||(typeof multi!=='undefined'&&multi.active);resSel.disabled=aiSel.disabled=lock||(typeof multi!=='undefined'&&multi.active);for(const b of cards.children)b.disabled=mapSelect.disabled;setupPane.querySelector('#setupLock').hidden=!started;for(const [i,row] of [...aiRows.children].entries())for(const s of row.querySelectorAll('select'))s.disabled=i+1>menuState.aiCount||started||(typeof multi!=='undefined'&&multi.active);const id=mapSelect.value;for(const b of cards.children)b.classList.toggle('chosen',b.dataset.map===id);updateSummary();},400);
updateSummary();
}
