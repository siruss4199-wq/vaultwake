// First Session 2.0 (2026-11-13): who counts as a genuinely new player, the one case that opens straight onto
// the playable board (no Home click, no three story pages). Decided once, after openSaveStore has settled (the
// SDK initialised and the CrazyGames cloud data read, or this browser's storage elsewhere). Pure, so the rule
// is tested on its own (tests/v5-next-newcomer.test.mjs).
//  rawSave:    what the save key held (null when nothing)        readStatus: readSave()'s status
//  startNew:   ?new=1 (the playtest link: keeps Home)            keptCount:  camps kept in this browser
//  onCrazyGames: the page is served by CrazyGames                storeKind:  'data' (the cloud) or 'local'
// Never new: any save under the key (readable or not), a kept camp, ?new=1, or a CrazyGames page whose cloud
// data could not be read (the SDK timed out, failed or refused: that player may have a cloud save, so Home
// stays exactly as before and nothing is decided for them).
export function isNewPlayer({rawSave,readStatus,startNew=false,keptCount=0,onCrazyGames=false,storeKind='local'}){
 if(startNew||rawSave!=null&&rawSave!==''||readStatus!=='empty'||keptCount>0)return false;
 if(onCrazyGames&&storeKind!=='data')return false;
 return true;
}
