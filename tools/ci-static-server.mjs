// CI helper (no dependencies): a static file server with Content-Length and the MIME types the game needs (module
// scripts must be served as JavaScript), for CI containers without python3. Like `python3 -m http.server`, it serves
// index.html for a directory. Usage: node tools/ci-static-server.mjs <dir> <port>
import {createServer} from 'node:http';import {stat,readFile} from 'node:fs/promises';import {resolve,extname,join,sep} from 'node:path';
const [dir='.',port='8080']=process.argv.slice(2),root=resolve(dir);
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.ico':'image/x-icon','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp4':'video/mp4','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};
createServer(async(req,res)=>{
 try{let path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(root,'.'+path);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  let s=await stat(file).catch(()=>null);
  if(s?.isDirectory()){if(!path.endsWith('/')){res.writeHead(301,{Location:path+'/'}).end();return;}file=join(file,'index.html');s=await stat(file).catch(()=>null);}
  if(!s?.isFile()){res.writeHead(404,{'Content-Type':'text/plain','Content-Length':9}).end('Not found');return;}
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':TYPES[extname(file).toLowerCase()]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch(e){res.writeHead(500).end(String(e));}
}).listen(+port,'0.0.0.0',()=>console.log(`serving ${root} on ${port}`));
