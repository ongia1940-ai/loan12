const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Game,W,H}=require('./setup.js');

function fresh(){const g=new Game('0',()=>.5,'riverlands');g.raidAt=Infinity;g.stock={food:10000,wood:10000,stone:10000,gold:10000,iron:10000};return g;}
function site(g,kind){const w=g.units.find(u=>u.owner===0&&u.kind==='worker'),sites=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(!g.buildError(kind,{x,y}))sites.push({x,y,d:Math.hypot(x-w.x,y-w.y)});sites.sort((a,b)=>a.d-b.d);if(sites.length)return sites[0];throw new Error('Không tìm thấy vị trí xây hợp lệ');}

test('player foundations wait for a selected worker, then complete through physical construction',()=>{const g=fresh(),p=site(g,'house'),b=g.build('house',p),w=g.units.find(u=>u.owner===0&&u.kind==='worker'&&u.hp>0);assert.ok(b&&w);for(let i=0;i<200;i++)g.tick(.1);assert.equal(b.constructing,true);assert.equal(b.job.elapsed,0);assert.equal(g.construct([w.id],[b.id]),1);for(let i=0;i<1200&&b.constructing;i++)g.tick(.1);assert.equal(b.constructing,false);assert.equal(w.repair,null);});

test('right mouse drag is wired as camera pan and suppresses the contextual click',()=>{const src=fs.readFileSync(path.join(__dirname,'input.js'),'utf8'),game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');assert.match(src,/e\.button===1\|\|e\.button===2/);assert.match(src,/camMotion\.suppressContext/);assert.match(src,/if\(camMotion\.suppressContext\)/);assert.match(game,/pan\.moved=true/);});
