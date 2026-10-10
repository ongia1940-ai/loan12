// Loạn 12 Sứ Quân — giao diện bản sắc sứ quân: thẻ chọn phe (quân, quân độc quyền, chủ tướng),
// bảng 12 sứ quân trong Cẩm nang. Chỉ dùng Canvas 2D + DOM, không phụ thuộc thư viện.
(function(){'use strict';
const L=window.Loan12,S=window.LoanSprites;if(!L||!S||!L.FACTIONS[0].style)return;
const F=L.FACTIONS,U=L.U,COLORS=['#d9b75f','#b15d49','#a380b3','#5596a3','#b7764a','#929257','#657fa5','#b67289','#838aa4','#649574','#a3825e','#7d9a9d'];
const css=document.createElement('style');css.textContent=`
.warlord-card{margin:8px 0 6px;padding:8px 10px;border:1px solid #c9a96a66;border-radius:8px;background:linear-gradient(180deg,#1d2a20e6,#141c16e6);color:#efe3c2;font-size:12.5px;line-height:1.38}
.warlord-card canvas{display:block;width:100%;height:auto;border-radius:6px;background:radial-gradient(ellipse at 50% 80%,#5d7448,#2c3b28 70%)}
.warlord-card h4{margin:6px 0 3px;font-size:13.5px;color:#f3d38d}
.warlord-card ul{margin:2px 0 0 16px;padding:0}.warlord-card li{margin:1px 0}
.warlord-card b{color:#f6dc9c}.warlord-card .tag{display:inline-block;padding:0 6px;margin-right:4px;border-radius:4px;background:#3a4a35;color:#e9d9a8;font-size:11px}
.warlord-book table{width:100%;border-collapse:collapse;font-size:12.5px}.warlord-book td,.warlord-book th{border-bottom:1px solid #8a7a5844;padding:4px 6px;vertical-align:top;text-align:left}
.warlord-book canvas{width:132px;height:66px;border-radius:5px;background:#3e5534}`;document.head.append(css);
function figOpts(f,kind){const hero=kind==='dinh',arch=S.archOf(kind);return{style:f.style,general:hero?f.general:null,look:hero?f.visual:null,flag:!hero&&(!!U[kind]?.unique||kind==='guard'),mount:hero?f.general.mount:null,mountColor:hero?f.general.mountColor:null,rank:1,lookKey:''};}
// Vẽ đội hình: lính thường, quân độc quyền, chủ tướng (to nhất, có thú cưỡi).
function lineup(cv,f,{compact=false}={}){const c=cv.getContext('2d'),W=cv.width,H=cv.height,team=COLORS[f.id]||'#d9b75f';c.clearRect(0,0,W,H);const base=H*(compact?.86:.9),s=H*(compact?.3:.33);
 const uk=f.unique,soldiers=compact?[]:[['militia',.08],['pike',.18],[S.archOf(uk)==='elephant'?'guard':'archer',.28]];
 const uniqueX=compact?.3:.5,genX=compact?.74:.8;
 c.save();c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(W/2,base+2,W*.46,H*.07,0,0,Math.PI*2);c.fill();c.restore();
 for(const [k,x] of soldiers){c.save();c.translate(W*x,base);S.drawFigure(c,k,1,'idle',0,team,s,figOpts(f,k));c.restore();}
 c.save();c.translate(W*uniqueX,base);S.drawFigure(c,uk,1,'idle',1,team,S.archOf(uk)==='elephant'?s*.82:s,figOpts(f,uk));c.restore();
 c.save();c.translate(W*genX,base);S.drawFigure(c,'dinh',1,'idle',0,team,f.general.mount==='elephant'?s*.66:s*.9,figOpts(f,'dinh'));c.restore();
 if(!compact){c.font='bold 11px "Segoe UI",Arial';c.textAlign='center';c.fillStyle='#f6e7bd';c.shadowColor='#000';c.shadowBlur=3;c.fillText('Quân thường',W*.18,H*.1);c.fillText(U[uk].name,W*uniqueX,H*.1);c.fillText('Chủ tướng',W*genX,H*.1);c.shadowBlur=0;}}
function cost(c){const n={food:'Lương',wood:'Gỗ',stone:'Đá',gold:'Vàng',iron:'Sắt'};return Object.entries(c).map(([k,v])=>v+' '+(n[k]||k)).join(', ');}
function describe(f){const u=U[f.unique],a=f.ability,g=f.general;return`<h4>${f.name} · ${f.region}</h4>
<div><span class="tag">${f.style.region}</span><span class="tag">Cờ ${({swallow:'đuôi nheo',square:'vuông',triangle:'tam giác',long:'dọc'})[f.style.banner.shape]}</span></div>
<ul><li><b>Quân độc quyền — ${u.name}:</b> ${u.note} <i>(${cost(u.cost)}; ${u.building==='range'?'Xạ Trường':'Võ Doanh'} cấp ${u.tier})</i></li>
<li><b>Đặc tính 1:</b> ${f.description}</li><li><b>Đặc tính 2:</b> ${f.bonus2}</li>
<li><b>Kỹ năng chủ tướng — ${a.name}</b> (hồi ${a.cooldown}s): ${a.text}</li>
<li><b>Chủ tướng:</b> ${f.name} (hiệu ${g.epithet})${g.mount?(' · cưỡi '+({horse:'ngựa',buffalo:'trâu',elephant:'voi'})[g.mount]):' · đi bộ'}</li></ul>`;}
// ---------- thẻ ở màn hình chọn phe ----------
const panel=document.querySelector('.civilization-panel'),setup=document.querySelector('.civilization-panel')||document.querySelector('#start')?.parentElement;
let card=null,cv=null,info=null;
if(setup){card=document.createElement('div');card.className='warlord-card';cv=document.createElement('canvas');cv.width=600;cv.height=250;info=document.createElement('div');card.append(cv,info);const tp=document.querySelector('#traitPreview'),start=document.querySelector('#start');if(tp)tp.after(card);else if(panel&&panel.contains(start))start.before(card);else if(panel)panel.append(card);else start.before(card);}
function refresh(){if(!card)return;const sel=document.querySelector('#factionSelect')||window.factionSelect;const v=sel?sel.value:'0';if(v==='random'||v===''||v==null){const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);c.fillStyle='#efe3c2';c.font='16px serif';c.textAlign='center';c.fillText('Ngẫu nhiên: một trong 12 sứ quân',cv.width/2,cv.height/2);info.innerHTML='<p>Mỗi sứ quân có quân phục, quân độc quyền, đặc tính và kỹ năng chủ tướng riêng.</p>';return;}const f=F[Number(v)];if(!f)return;lineup(cv,f);info.innerHTML=describe(f);}
if(typeof window.showFactionCard==='function'){const prev=window.showFactionCard;window.showFactionCard=function(){prev.apply(this,arguments);refresh();};try{showFactionCard=window.showFactionCard;}catch(e){}}
const sel=document.querySelector('#factionSelect');if(sel)sel.addEventListener('change',refresh);
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.faction-roster'))setTimeout(refresh,0);});
// Danh sách 12 sứ quân trong hộp chọn: thêm quân độc quyền + kỹ năng
const guide=[...document.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent.includes('12 sứ quân'));
if(guide){guide.querySelectorAll('p').forEach(p=>p.remove());for(const f of F){const p=document.createElement('p');p.innerHTML=`<b>${f.name}</b> — ${f.title}: ${f.description} ${f.bonus2} <br>Quân độc quyền: <b>${U[f.unique].name}</b> · Kỹ năng: <b>${f.ability.name}</b> (${f.ability.cooldown}s).`;guide.append(p);}}
refresh();
// ---------- Cẩm nang ----------
const btn=document.querySelector('#handbookButton');
if(btn){const prev=btn.onclick;btn.onclick=function(ev){if(prev)prev.call(this,ev);const book=document.querySelector('#bookContent');if(!book||book.querySelector('.warlord-book'))return;const sec=document.createElement('section');sec.className='warlord-book';
 sec.innerHTML='<h3>Mười hai sứ quân · bản sắc riêng</h3><p>Mỗi sứ quân có quân phục (màu giáp, kiểu mũ, hoa văn khiên, hình cờ), một quân độc quyền, hai đặc tính và kỹ năng chủ tướng có thời gian hồi. AI cũng tuyển quân độc quyền, tuyển chủ tướng khi Đại Bản Doanh lên cấp II và dùng kỹ năng khi giao chiến. Đây là thiết kế trò chơi giả tưởng, phỏng theo vùng đất của từng sứ quân, không phải khảo cứu lịch sử.</p>';
 const t=document.createElement('table');t.innerHTML='<tr><th></th><th>Sứ quân</th><th>Quân độc quyền</th><th>Đặc tính</th><th>Kỹ năng chủ tướng</th></tr>';
 for(const f of F){const tr=document.createElement('tr'),td0=document.createElement('td'),c=document.createElement('canvas');c.width=264;c.height=132;td0.append(c);tr.append(td0);const u=U[f.unique];tr.insertAdjacentHTML('beforeend',`<td><b>${f.name}</b><br>${f.region}<br><i>${f.style.region}</i></td><td><b>${u.name}</b><br>${u.note}<br><small>${cost(u.cost)}</small></td><td>${f.description}<br>${f.bonus2}</td><td><b>${f.ability.name}</b> · ${f.ability.cooldown}s<br>${f.ability.text}</td>`);t.append(tr);try{lineup(c,f,{compact:true});}catch(e){}}
 sec.append(t);book.append(sec);};}
window.LoanWarlordsUI={lineup,describe,refresh};
})();
