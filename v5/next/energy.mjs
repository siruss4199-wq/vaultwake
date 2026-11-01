// Coast Camp energy (energy pass, build 47v, 2026-11-01; docs/V5_ENERGY_CAPACITY_2026-11-01.md).
// Classic V5 keeps v5/energy.mjs and its fixed refill cap of 50; nothing here changes it. Coast Camp
// uses this module instead: the same refill interval (+1 every 2 minutes, REFILL_EVERY), but the
// natural-refill capacity grows with the player level (trial values), and bonus energy may be stored
// above it up to STORE_ENERGY. Above the capacity the refill clock rests: no credit builds up while
// above it, and energy already there is never reduced.
import {REFILL_EVERY,RATION_ENERGY,RATION_EVERY,rationWait,clock} from '../energy.mjs';
export {REFILL_EVERY,RATION_ENERGY,RATION_EVERY,rationWait,clock};

// [first player level, natural-refill capacity] (trial balance values)
export const CAPACITY=[[1,50],[3,60],[5,70],[8,80],[12,90],[17,100],[23,110],[30,120]];
export const START_CAPACITY=CAPACITY[0][1],MAX_CAPACITY=CAPACITY.at(-1)[1];
// The most energy a camp may hold (refill, bonuses, shop and gifts together).
export const STORE_ENERGY=200;
// The one capacity function: the refill, the FULL state and its countdown, the HUD, the level panel
// and the simulations all read it.
export function capacityAt(level){let c=START_CAPACITY;for(const [l,v] of CAPACITY)if(level>=l)c=v;return c;}
export const capacityOf=s=>capacityAt(Number.isInteger(s?.level?.level)?s.level.level:1);
// The next capacity milestone above a level: {level, capacity}, or null at the maximum.
export function nextCapacity(level){const m=CAPACITY.find(([l])=>l>level);return m?{level:m[0],capacity:m[1]}:null;}

const valid=t=>Number.isFinite(t)&&t>=0;
// Adds the energy refilled since s.energyAt, up to the capacity; returns how much was added.
// At or above the capacity the clock rests (the save is unchanged); act() restarts it when energy
// falls below the capacity again.
export function settleEnergy(s,now,cap=capacityOf(s)){
 if(!valid(s.energyAt)||s.energyAt>now)s.energyAt=now;
 if(s.energy>=cap)return 0;
 const steps=Math.floor((now-s.energyAt)/REFILL_EVERY);
 if(steps<=0)return 0;
 const gained=Math.min(steps,cap-s.energy);
 s.energy+=gained;
 s.energyAt=s.energy>=cap?now:s.energyAt+steps*REFILL_EVERY;
 return gained;
}
// Milliseconds until the next point and until full; null when at or above the capacity.
export function refillTimes(s,now,cap=capacityOf(s)){
 if(s.energy>=cap)return null;
 const since=Math.max(0,now-(valid(s.energyAt)?s.energyAt:now));
 const next=REFILL_EVERY-(since%REFILL_EVERY);
 return {next,full:next+(cap-s.energy-1)*REFILL_EVERY};
}
// Stored energy: adds n up to STORE_ENERGY and returns how much was added. With keep, the rest waits
// as s.energyOwed (a milestone reward is never cut short) and is paid by payOwed once there is room.
export function storeEnergy(s,n,{keep=false}={}){
 const add=Math.max(0,Math.min(n,STORE_ENERGY-s.energy));s.energy+=add;
 if(keep&&n>add)s.energyOwed=(s.energyOwed??0)+n-add;
 return add;
}
export function payOwed(s){
 if(!(s.energyOwed>0))return 0;
 const add=Math.max(0,Math.min(s.energyOwed,STORE_ENERGY-s.energy));s.energy+=add;s.energyOwed-=add;
 if(!s.energyOwed)delete s.energyOwed;
 return add;
}
