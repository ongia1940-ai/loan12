// Kiểm thử bản sắc 12 sứ quân: tạo hình riêng, quân độc quyền, đặc tính, kỹ năng chủ tướng, AI.
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('./warlords.js'),S=require('./unit-sprites.js');
const {Game,U,FACTIONS,UNIQUE,UNIQUE_BY_FACTION,ABILITIES,STYLES,GENERALS}=L;
const flat=g=>g.map.fill(0),setT=(g,x,y,t)=>{g.map[y*L.W+x]=t;};
const unit=(g,kind,x,y,owner=0)=>{const u=g.spawn(kind,x,y,owner);u.hp=u.maxHP;return u;};
function mockCtx(){const calls={n:0,bad:0};const chk=(...a)=>{calls.n++;for(const v of a)if(typeof v==='number'&&!Number.isFinite(v))calls.bad++;};return{calls,beginPath(){},moveTo:chk,lineTo:chk,closePath(){},fill(){},stroke(){},ellipse:chk,quadraticCurveTo:chk,bezierCurveTo:chk,fillText:chk,fillRect:chk,save(){},restore(){},translate:chk,scale:chk,rect:chk,clip(){},drawImage(){},measureText:()=>({width:10}),set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set lineCap(v){},set font(v){},set textAlign(v){},set textBaseline(v){},set globalCompositeOperation(v){},set globalAlpha(v){}};}

test('mỗi sứ quân có tham số tạo hình riêng (quân phục, mũ, khiên, cờ, chủ tướng)',()=>{
 assert.equal(FACTIONS.length,12);
 const uniq=(arr,name)=>assert.equal(new Set(arr).size,arr.length,name+' phải khác nhau');
 uniq(FACTIONS.map(f=>f.style.tunic),'màu áo');uniq(FACTIONS.map(f=>f.style.helm),'kiểu mũ');uniq(FACTIONS.map(f=>f.style.armor.join()),'màu giáp');
 uniq(FACTIONS.map(f=>f.style.banner.shape+f.style.banner.color),'cờ');uniq(FACTIONS.map(f=>f.style.shield.pattern+f.style.shield.colors.join()),'khiên');
 uniq(FACTIONS.map(f=>f.general.headgear),'mũ chủ tướng');uniq(FACTIONS.map(f=>[f.general.headgear,f.general.weapon,f.general.beard,f.general.hair,f.general.mount,f.general.mountColor].join()),'chủ tướng');
 for(const f of FACTIONS){assert.ok(['swallow','square','triangle','long'].includes(f.style.banner.shape));assert.ok(f.style.region.length>3);}
 assert.ok(FACTIONS.some(f=>f.general.mount==='elephant')&&FACTIONS.some(f=>f.general.mount==='horse')&&FACTIONS.some(f=>f.general.mount==='buffalo')&&FACTIONS.some(f=>!f.general.mount));
});
test('mỗi phe có đúng một quân độc quyền, chỉ phe đó (hoặc đồng minh) tuyển được',()=>{
 assert.equal(Object.keys(UNIQUE).length,12);
 for(const f of FACTIONS){const k=UNIQUE_BY_FACTION[f.id];assert.ok(U[k]&&U[k].unique&&U[k].faction===f.id);assert.equal(S.ARCH[k],U[k].art,'ARCH khớp U.art cho '+k);assert.ok(U[U[k].art],'archetype tồn tại');
  for(const field of['hp','dmg','speed','delay','range'])assert.ok(Number.isFinite(U[k][field]),k+'.'+field);}
 const g=new Game(4);const b=g.buildings.find(v=>v.owner===0&&v.kind==='barracks')||g.buildings.find(v=>v.owner===0);
 const bar={...b,kind:'barracks',tier:3,queue:[],hp:100,owner:0};g.res={food:9999,wood:9999,stone:9999,gold:9999,iron:9999};
 assert.equal(g.trainError(bar,'halberdier'),'');
 assert.match(g.trainError(bar,'greatsword'),/độc quyền/);
 assert.match(g.trainError(bar,'reedBanner'),/độc quyền/);
 // đồng minh mở khóa quân độc quyền của họ
 const owner8=g.factionSlots.indexOf(8);g.states[owner8]='ally';assert.equal(g.trainError(bar,'greatsword'),'');
 const g3=new Game(3);assert.match(g3.trainError({...bar},'tran'),/chủ tướng/);
});
test('quân độc quyền cân bằng: mạnh hơn lính gốc nhưng đắt hơn hoặc cần cấp cao hơn',()=>{
 const val=c=>Object.values(c).reduce((a,b)=>a+b,0);
 for(const [k,s] of Object.entries(UNIQUE)){const b=U[s.art],power=s.hp*s.dmg*(s.shots||1)/s.delay,basePower=b.hp*b.dmg*(b.shots||1)/b.delay;
  assert.ok(power<basePower*2.4,k+' không quá mạnh');assert.ok(val(s.cost)>=val(b.cost)*.75||s.tier>(b.tier||1),k+' có giá');}
});
test('đặc tính thứ hai của từng phe có tác dụng',()=>{
 const mk=f=>{const g=new Game(f);flat(g);return g;};
 {const g=mk(0),u=unit(g,'militia',10,10);const a=g.stats(u).armor;setT(g,10,10,5);assert.equal(g.stats(u).armor,a+2);}
 {const g=mk(1),u=unit(g,'crossbow',10,10),baseHP=Object.getPrototypeOf(Game.prototype).stats.call(g,u).hp;assert.equal(g.stats(u).hp,Math.round(baseHP*1.1));}
 {const g=mk(2),u=unit(g,'pike',10,10);const sp=g.stats(u).speed;setT(g,10,10,6);assert.ok(g.stats(u).speed>sp*1.1);}
 {const g=mk(3),h=mk(0);for(const gg of[g,h])setT(gg,10,10,3);const a=g.stats(unit(g,'militia',10,10)).speed,b=h.stats(unit(h,'militia',10,10)).speed;assert.ok(a>b*1.5);}
 {const g=mk(4),h=mk(0);assert.equal(g.stats(unit(g,'pike',10,10)).armor,h.stats(unit(h,'pike',10,10)).armor+1);}
 {const g=mk(5),hall=g.buildings.find(b=>b.owner===0&&b.kind==='hall');const u=unit(g,'guard',hall.x+2,hall.y),e=unit(g,'militia',hall.x+3,hall.y,1);const far=unit(g,'guard',hall.x+20,hall.y),e2=unit(g,'militia',hall.x+21,hall.y,1);assert.ok(g.combatDamage(u,e)>g.combatDamage(far,e2));}
 {const g=mk(6),h=mk(0);const w=unit(g,'worker',5,5),w2=unit(h,'worker',5,5);assert.ok(g.gatherBonus(w,'wood')>h.gatherBonus(w2,'wood'));}
 {const g=mk(7),u=unit(g,'archer',10,10),e=unit(g,'militia',12,10,1);const d=g.combatDamage(u,e);setT(g,10,10,5);assert.ok(g.combatDamage(u,e)>d);}
 {const g=mk(8),h=mk(0);assert.ok(g.stats(unit(g,'swordsman',10,10)).speed>h.stats(unit(h,'swordsman',10,10)).speed);}
 {const g=mk(9);const w=unit(g,'worker',5,5);assert.equal(g.gatherBonus(w,'food'),1.2);assert.equal(g.gatherBonus(w,'wood'),1);}
 {const g=mk(10);const w=unit(g,'worker',5,5);assert.equal(g.gatherBonus(w,'gold'),1.15);assert.equal(g.gatherBonus(w,'food'),1);}
 {const g=mk(11),u=unit(g,'swordsman',10,10),e=unit(g,'militia',11,10,1);const d=g.combatDamage(u,e);u.hp=u.maxHP*.4;assert.ok(g.combatDamage(u,e)>d);}
 // kích binh khắc chế voi giáp
 {const g=mk(4),p=unit(g,'halberdier',10,10),el=unit(g,'armoredElephant',11,10,1),m=unit(g,'militia',11,11,1);assert.ok(g.combatDamage(p,el)>g.combatDamage(p,m)*1.8);}
 // kinh tế: tốc độ khai thác thực sự nhanh hơn trong vòng lặp khai thác
 {const run=f=>{const g=new Game(f);const n=g.nodes?g.nodes.find(v=>v.kind==='food'&&v.amount>50):null;if(!n)return null;const w=g.units.find(u=>u.owner===0&&u.kind==='worker');w.x=n.x+.6;w.y=n.y+.6;w.load=null;g.assign([w.id],n.id);let got=0;for(let i=0;i<40;i++){g.pending=null;g.tick(.1);got=Math.max(got,w.load?.amount||0);}return got;};
  const a=run(9),b=run(0);assert.ok(b>0,'có khai thác');assert.ok(a>b,'Tế Giang thu Lương nhanh hơn ('+a+' > '+b+')');}
});
test('kỹ năng chủ tướng: có hồi chiêu, không dùng lại khi đang hồi, buff hết hạn',()=>{
 for(const f of FACTIONS){const g=new Game(f.id);flat(g);const d=g.units.find(u=>u.owner===0&&u.kind==='dinh')||unit(g,'dinh',20,20);d.x=20;d.y=20;d.skill=0;d.embarked=false;
  const ally=unit(g,f.id===4?'pike':f.id===2?'elephant':[1,7].includes(f.id)?'archer':'swordsman',21,20);ally.hp=Math.max(1,ally.maxHP-70);const enemy=unit(g,'militia',22,20,1);
  const before=g.stats(ally),hp0=ally.hp;
  assert.equal(g.skill(d),true,'dùng kỹ năng '+f.ability.name);
  assert.ok(d.skill>=10&&d.skill<=ABILITIES[f.id].cooldown,'đặt hồi chiêu');
  assert.equal(g.skill(d),false,'không dùng lại khi đang hồi');
  const after=g.stats(ally),changed=after.dmg!==before.dmg||after.speed!==before.speed||after.armor!==before.armor||after.delay!==before.delay||after.range!==before.range||ally.hp>hp0||(enemy.stunUntil||0)>g.time;
  assert.ok(changed,'kỹ năng có tác dụng: '+f.ability.name);
  assert.equal(after.hp,before.hp,'buff không đổi HP tối đa');
  g.time+=12;const later=g.stats(ally);assert.equal(later.dmg,before.dmg);assert.equal(later.speed,before.speed);assert.equal(later.armor,before.armor);
  d.skill=0;assert.equal(g.skill(d),true,'dùng lại sau khi hồi');}
});
test('AI tuyển quân độc quyền, tuyển chủ tướng và dùng kỹ năng',()=>{
 const g=new Game(0);const owner=g.factionSlots.indexOf(11);g.ai[owner].trained=0;
 assert.equal(g.aiUnit(owner,'barracks',2),'tigerGuard');
 g.ai[owner].trained=1;assert.notEqual(g.aiUnit(owner,'barracks',2),'tigerGuard');
 const hall=g.buildings.find(b=>b.owner===owner&&b.kind==='hall');hall.tier=2;g.time=400;g.states[owner]='enemy';g.ai[owner].stock={food:5000,wood:5000,stone:5000,gold:5000,iron:5000};
 g.aiThink(owner);const gen=g.units.find(u=>u.owner===owner&&u.kind==='dinh'&&u.hp>0);assert.ok(gen,'AI có chủ tướng');
 assert.equal(g.unitName(gen),FACTIONS[11].name);
 gen.skill=0;const foe=unit(g,'militia',gen.x+2,gen.y,0);g.aiThink(owner);assert.ok(gen.skill>0,'AI đã dùng kỹ năng');assert.ok((foe.stunUntil||0)>g.time,'Hổ Gầm làm choáng');
});
test('mô phỏng 5 phút với 3 phe khác nhau không lỗi',()=>{
 for(const f of[2,5,10]){const g=new Game(f,(()=>{let s=f+1;return()=>(s=(s*16807)%2147483647)/2147483647;})());for(let i=0;i<2000;i++){g.pending=null;if(g.result)break;g.tick(.15);}
  assert.ok(g.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)&&Number.isFinite(u.hp)),'toạ độ hợp lệ');}
});
test('sprite: quân độc quyền, quân phục theo phe và chủ tướng cưỡi thú vẽ được ở mọi hướng',()=>{
 for(const f of FACTIONS){for(const kind of['militia','guard','archer',f.unique,'dinh'])for(const dir of[0,1,2,3,4])for(const act of['idle','walk','attack','cmd']){const c=mockCtx(),hero=kind==='dinh';const n=S.drawFigure(c,kind,dir,act,1,'#d9b75f',40,{style:f.style,general:hero?f.general:null,look:hero?f.visual:null,flag:true,mount:hero?f.general.mount:null,mountColor:hero?f.general.mountColor:null});assert.ok(n>5,kind);assert.equal(c.calls.bad,0,'toạ độ hữu hạn '+kind+' '+f.id);}}
 const k1=S.spriteKey('militia',1,'idle',0,'#fff',32,{style:FACTIONS[0].style}),k2=S.spriteKey('militia',1,'idle',0,'#fff',32,{style:FACTIONS[1].style});assert.notEqual(k1,k2,'atlas phân theo phe');
 assert.equal(S.cellKind('dinh',{mount:'horse'}),'mounted');assert.equal(S.cellKind('dinh',{mount:'elephant'}),'mountedElephant');
 const kitA=S.kit('pike','#fff',null,0,FACTIONS[0].style),kitB=S.kit('pike','#fff',null,0,FACTIONS[5].style);assert.notEqual(kitA.hat,kitB.hat);assert.notEqual(kitA.tunic,kitB.tunic);
 const hero=S.kit('dinh','#fff',FACTIONS[2].visual,0,FACTIONS[2].style,FACTIONS[2].general);assert.ok(hero.scale>=1.25,'chủ tướng to hơn');
 for(const k of Object.keys(UNIQUE))assert.ok(S.SPRITED.has(k),k+' có sprite');
});
test('renderer: nhận diện phe, cờ hiệu và thú cưỡi cho chủ tướng',()=>{
 const r=S.createRenderer({makeCanvas:()=>({width:1,height:1,getContext:()=>mockCtx()})});const g=new Game(7);
 const d=g.units.find(u=>u.owner===0&&u.kind==='dinh');const id=r.identity(d,g);assert.equal(id.mount,'horse');assert.equal(id.general.headgear,'feather');
 const lb=unit(g,'longbow',5,5);assert.equal(r.identity(lb,g).flag,true);assert.equal(r.identity(lb,g).style.helm,'hood');
 assert.ok(r.headHeight(d,g)>r.headHeight(lb,g)+.5,'chủ tướng cưỡi ngựa cao hơn');
});
