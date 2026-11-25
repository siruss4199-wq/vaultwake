// Coast Camp sounds (2026-11-25, release/playgama): recorded sound files and background music, replacing the
// sounds that Build 44 synthesised in code (Playgama Game Requirements 3.3.1 and 3.3.2: the game has background
// music and sound effects, produced with audio tools and shipped as compressed files). Every file is CC0 and
// listed in v5/assets/audio/LICENSES.md (source page, author, licence, the original file and how it was made
// into the shipped one).
//
// The surface is the one the game already used, so nothing else changes:
//   sfx.play(kind, tier, {muted})   one cue; false when it did not play (muted, sound off, hidden page, the
//                                   same cue a moment ago, more than six cues in a quarter second, or the
//                                   files still loading)
//   sfx.enabled(), sfx.toggle()     the player's own Sound setting ('vaultwake-sound', feedback.mjs)
//   sfx.music(allowed)              keeps the background music playing only while `allowed` (the app passes
//                                   false while an ad plays, the platform mutes or pauses the game, or the
//                                   page is hidden); the Sound setting turns it off too
// Browsers let a page make sound only after a tap or key: the first one unlocks the sound effects and starts
// loading the music (nothing is fetched before that, so loading the game is not slowed by audio).
import {sound} from '../feedback.mjs';

const BASE=new URL('../assets/audio/',import.meta.url);
const SFX_FILES=['tap','produce','merge','discovery','crack','shatter','shatter-tail','coins','deliver','milestone','build','build-jingle','sparkle','unseal','error','reward'];
// A cue is one or more files: [file, delay (s), gain, playback rate].
// Merges keep Build 44's idea: the finishing note steps up a pentatonic scale with the merged part's tier, so
// no two merges clash and nothing climbs shrill (rates for C D E G A).
const PENTA=[1,1.125,1.25,1.5,1.667];
const CUES={
 merge:(tier)=>[['merge',0,.9,PENTA[Math.max(0,Math.min(PENTA.length-1,tier-1))]]],
 discovery:(tier)=>[...CUES.merge(tier),['discovery',.06,.7,1]],
 produce:()=>[['produce',0,.8,1]],
 crack:()=>[['crack',0,.8,1]],
 shatter:()=>[['shatter',0,.9,1],['shatter-tail',.05,.5,1]],
 deliver:()=>[['coins',0,.9,1],['deliver',.08,.45,1]],
 milestone:()=>[['milestone',0,.7,1]],
 build:()=>[['build',0,.9,1],['build-jingle',.18,.7,1]],
 sparkle:()=>[['sparkle',0,.55,1]],
 unseal:()=>[['unseal',0,.8,1]],
 reward:()=>[['reward',0,.7,1],['coins',.06,.45,1]],
 tap:()=>[['tap',0,.6,1]],
 error:()=>[['error',0,.6,1]]
};
// The game's old kinds keep working: rare → sparkle, contract → deliver.
const ALIAS={rare:'sparkle',contract:'deliver'};
// Shortest gap between two of the same cue (ms); repeats inside it are dropped, not stacked.
const GAP={merge:45,discovery:120,produce:50,crack:35,shatter:80,deliver:90,milestone:300,build:300,sparkle:90,unseal:60,reward:200,tap:40,error:120};

let ctx=null,bus=null,loading=null;const buffers=new Map(),last={};let lastMerge=0,mergeRun=0,recent=[];
function context(){
 if(ctx)return ctx;
 const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return null;
 try{ctx=new AC();}catch{return null;}
 // One bus: a master gain into a soft clipper, so a quick run of cues is never louder than one cue
 // (a clipper has no memory, unlike a compressor's make-up gain).
 const master=ctx.createGain();master.gain.value=.8;
 const clip=ctx.createWaveShaper(),n=1024,curve=new Float32Array(n);
 for(let i=0;i<n;i++){const x=i/(n-1)*2-1;curve[i]=Math.tanh(1.4*x)/Math.tanh(1.4);}
 clip.curve=curve;master.connect(clip);clip.connect(ctx.destination);bus=master;
 return ctx;
}
// The sound effect files (about 130 KB together), fetched and decoded once.
function load(){
 const c=context();if(!c)return Promise.resolve();
 loading??=Promise.all(SFX_FILES.map(name=>fetch(new URL(`sfx/${name}.mp3`,BASE)).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();})
  .then(b=>new Promise((ok,no)=>{const p=c.decodeAudioData(b,ok,no);p?.then?.(ok,no);})).then(buf=>buffers.set(name,buf)).catch(()=>{})));
 return loading;
}
function start(name,at,gain,rate){
 const buf=buffers.get(name);if(!buf)return false;
 const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=gain;
 s.connect(g);g.connect(bus);s.onended=()=>{s.disconnect();g.disconnect();};s.start(at);return true;
}
// Browsers start audio only from a user gesture (iOS Safari also suspends it when the page is hidden or a call
// comes in): the first touch unlocks it and loads the files; it is resumed on the way back.
let unlocked=false;
export function unlock(){
 const c=context();if(!c)return;unlocked=true;
 if(c.state!=='running')c.resume?.().catch(()=>{});
 try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch{}
 load();music.update();
}
if(typeof document!=='undefined'){
 const once=()=>{unlock();removeEventListener('pointerdown',once,true);removeEventListener('keydown',once,true);};
 addEventListener('pointerdown',once,true);addEventListener('keydown',once,true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx&&ctx.state!=='running')ctx.resume?.().catch(()=>{});music.update();});
}

// ---- background music ----
// Two calm CC0 pieces, one after the other: "Sea side Village" (KarateStudios) and "Meadow Thoughts" (Écrivain,
// solo harp). A plain <audio> element streams them (no decoded copy in memory), quietly, from the first tap. It
// is paused, never just turned down, whenever music is not allowed, and resumes where it was.
const TRACKS=['music/seaside-village.mp3','music/meadow-thoughts.mp3'];
const music={
 el:null,track:0,allowed:true,gap:0,waiting:false,
 want(){return unlocked&&this.allowed&&sound.enabled()&&!(typeof document!=='undefined'&&document.hidden);},
 element(){
  if(this.el||typeof Audio==='undefined')return this.el;
  const el=new Audio();el.preload='auto';el.volume=.45;el.src=new URL(TRACKS[this.track],BASE).href;
  // The next piece after a short pause, so the two never run into each other.
  el.addEventListener('ended',()=>{this.track=(this.track+1)%TRACKS.length;el.src=new URL(TRACKS[this.track],BASE).href;this.waiting=true;clearTimeout(this.gap);this.gap=setTimeout(()=>{this.waiting=false;this.update();},2500);});
  el.addEventListener('error',()=>{});
  return this.el=el;
 },
 update(){
  if(!this.want()){if(this.el&&!this.el.paused)this.el.pause();return;}
  if(this.waiting)return;
  const el=this.element();if(el&&el.paused)el.play()?.catch?.(()=>{});
 },
 get playing(){return !!this.el&&!this.el.paused;}
};

export const sfx={
 enabled:()=>sound.enabled(),
 toggle(){const v=sound.toggle();music.update();return v;},
 // play(kind, tier): tier is the merged part's tier (merge, discovery).
 play(kind,tier=0,{muted=false}={}){
  kind=ALIAS[kind]??kind;if(!CUES[kind]||muted||!sound.enabled()||(typeof document!=='undefined'&&document.hidden))return false;
  const now=performance.now();if(now-(last[kind]??-1e9)<(GAP[kind]??40))return false;
  // Never more than six cues in a quarter second: rapid play thins out instead of piling up.
  recent=recent.filter(x=>now-x<250);if(recent.length>=6&&kind!=='milestone'&&kind!=='build')return false;
  const c=context();if(!c)return false;if(c.state==='suspended')c.resume?.().catch(()=>{});
  load();
  // Merges in a quick run get a little softer each time (down to 40 %), never louder.
  let gain=1;if(kind==='merge'||kind==='discovery'){mergeRun=now-lastMerge<400?Math.min(4,mergeRun+1):0;lastMerge=now;gain=1-.15*mergeRun;}
  let any=false;
  try{for(const [name,dt,g,rate] of CUES[kind](tier))any=start(name,c.currentTime+.005+dt,g*gain,rate)||any;}catch{return false;}
  if(any){last[kind]=now;recent.push(now);}
  return any;
 },
 // Background music on or off as the game allows (see music above); the Sound setting is checked too.
 music(allowed){music.allowed=!!allowed;music.update();return music.playing;},
 get musicPlaying(){return music.playing;},
 // For tests: what the music should be doing and what it is doing; how many effect files are decoded.
 get state(){return {unlocked,wanted:music.want(),allowed:music.allowed,playing:music.playing,track:music.track,decoded:buffers.size,files:SFX_FILES.length};},
 // For tests and the sound check page: resolves once the sound effect files are decoded.
 ready:()=>load(),
 KINDS:Object.keys(CUES),
 FILES:SFX_FILES
};
