// Demo camp for the release gameplay preview (tools/release-gameplay-video.cjs). Usage: node tools/release-video-save.mjs > save.json
// A Chapter 1 camp a few minutes in: two stages built, the tent's second stage has its gold parts and
// waits for coins (70 of 100); Ivo's order wants a Pocket winch and a Crawler jack: two Split spanners
// merge into a winch, two winches into a jack, and the order pays the 45 coins the stage still needs.
const g=await import(new URL('../v5/next/game.mjs',import.meta.url));
const now=Date.now(),s=g.fresh(now);
s.built={'beach-path':2,'beach-tent':1};s.materials={'beach-path':2,'beach-tent':2};
s.seen={...s.seen};s.moves=60;s.merges=30;s.ordersDone=6;s.orderSeq=12;
const R=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');
// open a play area round the Rover: rows 2-4 cleared, a few twins on them
for(const i of [14,15,16,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,34,35])s.board[i]=null;
const put=(i,f,t)=>{s.board[i]=g.item(f,t);};
// twins to merge: two Split spanners (-> a Pocket winch), then two Pocket winches (-> a Crawler jack);
// Bram's order keeps its own two spanners, the second Ivo order its three Grip tools
for(const i of [16,18])put(i,'rig',2);for(const i of [29,30])put(i,'rig',2);
for(const i of [24,32])put(i,'rig',3);for(const i of [23,25,33])put(i,'rig',1);for(const i of [31,34])put(i,'rig',0);
const u=g.upgrades(s).find(u=>u.id==='beach-tent');
s.orders=[{id:'o12',who:'ivo',needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:4,count:1}],coins:45,born:now},
 {id:'o13',who:'bram',needs:[{family:'rig',tier:2,count:2}],coins:20,born:now},
 {id:'o14',who:'ivo',needs:[{family:'rig',tier:1,count:3}],coins:15,born:now}];
s.pending=[];s.daily={day:9e6,count:1};s.coins=u.cost-30;s.energy=60;s.energyAt=now;
console.error('tent stage',u.stage,'cost',u.cost,'materials',u.materials,'coins',s.coins,'board',s.board.length);
const t=g.load(JSON.stringify(s),now);console.error("load:",t&&{coins:t.coins,built:t.built,orders:t.orders?.length,err:t.error});
process.stdout.write(JSON.stringify(s));
