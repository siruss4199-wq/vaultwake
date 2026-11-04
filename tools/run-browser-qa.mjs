// Retain the browser test's exit status and expose a compact failure in check
// annotations, even when an Actions log archive cannot be downloaded.
import {spawnSync} from 'node:child_process';
const [file,...args]=process.argv.slice(2);
if(!file)throw new Error('Usage: node tools/run-browser-qa.mjs <test> [args]');
const result=spawnSync(process.execPath,[file,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
const status=result.status??1;
if(status!==0){
 const output=[result.stderr,result.stdout,result.error?.message,result.signal&&`Signal: ${result.signal}`].filter(Boolean).join('\n');
 const detail=output.length>10000?output.slice(0,6000)+'\n...[truncated]...\n'+output.slice(-4000):output;
 const escape=s=>s.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');
 console.log(`::error title=Browser QA failure::${escape(file+'\n'+detail)}`);
}
process.exitCode=status;
