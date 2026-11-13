// CI helper (no dependencies): extract a ZIP made by tools/coast-crazygames.mjs (stored and deflated entries) into
// a directory, for CI containers that have Node but no unzip. Usage: node tools/ci-unzip.mjs <zip> <dir>
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import {inflateRawSync} from 'node:zlib';import {join,dirname,resolve,sep} from 'node:path';
const [zip,dir]=process.argv.slice(2);if(!zip||!dir){console.error('usage: node tools/ci-unzip.mjs <zip> <dir>');process.exit(2);}
const b=readFileSync(zip),root=resolve(dir);let e=b.length-22;while(e>=0&&b.readUInt32LE(e)!==0x06054b50)e--;if(e<0)throw new Error('not a ZIP (no end of central directory)');
const count=b.readUInt16LE(e+10);let p=b.readUInt32LE(e+16),files=0,bytes=0;
for(let k=0;k<count;k++){
 if(b.readUInt32LE(p)!==0x02014b50)throw new Error('bad central directory entry '+k);
 const method=b.readUInt16LE(p+10),size=b.readUInt32LE(p+20),usize=b.readUInt32LE(p+24),n=b.readUInt16LE(p+28),x=b.readUInt16LE(p+30),c=b.readUInt16LE(p+32),off=b.readUInt32LE(p+42);
 const name=b.toString('utf8',p+46,p+46+n);p+=46+n+x+c;
 const out=resolve(root,name);if(out!==root&&!out.startsWith(root+sep))throw new Error('unsafe path '+name);
 if(name.endsWith('/')){mkdirSync(out,{recursive:true});continue;}
 if(b.readUInt32LE(off)!==0x04034b50)throw new Error('bad local header '+name);
 const start=off+30+b.readUInt16LE(off+26)+b.readUInt16LE(off+28),raw=b.subarray(start,start+size);
 const data=method===0?raw:method===8?inflateRawSync(raw):(()=>{throw new Error(`unsupported method ${method} for ${name}`);})();
 if(data.length!==usize)throw new Error(`size mismatch for ${name}`);
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,data);files++;bytes+=data.length;}
console.log(`extracted ${files} files, ${bytes} bytes into ${dir}`);
