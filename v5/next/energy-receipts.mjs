import {SHOP} from './game.mjs';
// Browser-local high-water receipts survive kept-save restoration. No energy is
// awarded here: completed milestones and daily purchases only move forwards.
export function createEnergyReceipts(storage,key,id=()=>globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)){
 const read=()=>{try{const r=JSON.parse(storage.get(key)||'null');if(!r?.camps||typeof r.camps!=='object'||Array.isArray(r.camps)||!Number.isInteger(r.daily?.day)||r.daily.day< -1||r.daily.day>1e7||!r.daily.bought||typeof r.daily.bought!=='object')return {camps:{},daily:{day:-1,bought:{}}};
 for(const [k,n] of Object.entries(r.daily.bought))if(!Object.hasOwn(SHOP,k)||!Number.isInteger(n)||n<0||n>(k==='adEnergy'?3:SHOP[k].limit))delete r.daily.bought[k];return r;}catch{return {camps:{},daily:{day:-1,bought:{}}};}};
 function apply(s){
  const r=read();s.energyRewards??={id:'legacy',stages:Math.min(3,Object.values(s.built).reduce((a,b)=>a+b,0))};
  s.energyRewards.id??=id();const paid=Object.hasOwn(r.camps,s.energyRewards.id)?r.camps[s.energyRewards.id]:null;
  if(paid){s.energyRewards.stages=Math.max(s.energyRewards.stages,Number.isInteger(paid.stages)&&paid.stages>=0&&paid.stages<=3?paid.stages:0);s.boost.order ||= !!paid.order;s.boost.stage ||= !!paid.stage;}
  // Daily stock is shared across camps in this browser and cannot roll backwards.
  if(r.daily.day>s.shop.day)s.shop={day:r.daily.day,bought:{...r.daily.bought}};
  else if(r.daily.day===s.shop.day)for(const [offer,n] of Object.entries(r.daily.bought))s.shop.bought[offer]=Math.max(n,s.shop.bought[offer]||0);
 }
 function remember(s){
  apply(s);const r=read(),old=r.camps[s.energyRewards.id]||{};
  r.camps={...r.camps,[s.energyRewards.id]:{stages:s.energyRewards.stages,order:!!(old.order||s.boost.order),stage:!!(old.stage||s.boost.stage)}};
  if(s.shop.day>r.daily.day)r.daily={day:s.shop.day,bought:{...s.shop.bought}};
  else if(s.shop.day===r.daily.day)for(const [offer,n] of Object.entries(s.shop.bought))r.daily.bought[offer]=Math.max(n,r.daily.bought[offer]||0);
  storage.set(key,JSON.stringify(r));
 }
 return {apply,remember};
}
