// Coast Camp opens on Home (Build 46p): a page load with a save ends on Home, and the board is reached by
// its main button (Play, Continue), as a player does; the first-play story that Play shows once (Build 46q)
// is skipped. A new player goes to the board by itself (First Session 2.0). Board tests call
// throughHome(page) once: after each goto or reload of the game page it presses that button.
// Pages that are not the game (no #home) are left alone.
// First Session 2.0 (2026-11-13): a genuinely new player (no save, storage settled) goes to the board by
// itself; then there is nothing to press. Anyone else still meets Play or Continue.
async function enterHome(page){
 if(!await page.locator('#home').count())return;
 await page.waitForFunction(()=>{const h=document.querySelector('#home'),p=document.querySelector('#homePlay');return h.hidden||!document.body.classList.contains('homeOpen')||!p.hidden&&!p.disabled&&!h.classList.contains('isWaiting');},null,{timeout:20000});
 if(await page.evaluate(()=>document.querySelector('#home').hidden||!document.body.classList.contains('homeOpen')))return;
 await page.locator('#homePlay').click();
 // The first new camp's Play shows the story first (Build 46q): board tests skip it.
 await page.waitForFunction(()=>document.querySelector('#home').hidden||!document.querySelector('#story')?.hidden,null,{timeout:20000});
 if(await page.locator('#story:not([hidden])').count())await page.locator('#storySkip').click();
 await page.waitForSelector('#home',{state:'hidden',timeout:20000});
}
function throughHome(page){
 for(const k of ['goto','reload']){const f=page[k].bind(page);page[k]=async(...a)=>{const r=await f(...a);await enterHome(page);return r;};}
 return page;
}
module.exports={enterHome,throughHome};
