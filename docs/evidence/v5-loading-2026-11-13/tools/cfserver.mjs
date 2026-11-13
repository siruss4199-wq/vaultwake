// A stand-in for Cloudflare Pages: HTTP/2 + TLS, brotli for text, ETag, "public, max-age=0, must-revalidate"
// (Pages' default for static assets), 304 on If-None-Match. usage: node cfserver.mjs <root> <port>
import http2 from 'node:http2';import {readFileSync} from 'node:fs';import {stat,readFile} from 'node:fs/promises';
import {resolve,extname,join,sep,dirname} from 'node:path';import {brotliCompressSync,constants} from 'node:zlib';import {createHash} from 'node:crypto';
const [dir,port]=process.argv.slice(2),root=resolve(dir),here=dirname(new URL(import.meta.url).pathname);
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
const text=new Set(['.html','.js','.mjs','.css','.json','.svg']);const cache=new Map();
http2.createSecureServer({key:readFileSync(join(here,'key.pem')),cert:readFileSync(join(here,'cert.pem')),allowHTTP1:true},async(req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'https://x').pathname);let file=resolve(root,'.'+path);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  let s=await stat(file).catch(()=>null);if(s?.isDirectory()){file=join(file,'index.html');s=await stat(file).catch(()=>null);}
  if(!s?.isFile()){res.writeHead(404);res.end('nf');return;}
  const ext=extname(file).toLowerCase();let e=cache.get(file);
  if(!e||e.m!==s.mtimeMs){const raw=await readFile(file);e={m:s.mtimeMs,raw,etag:'"'+createHash('sha1').update(raw).digest('hex').slice(0,16)+'"',br:text.has(ext)?brotliCompressSync(raw,{params:{[constants.BROTLI_PARAM_QUALITY]:9}}):null};cache.set(file,e);}
  const h={'content-type':T[ext]??'application/octet-stream','etag':e.etag,'cache-control':'public, max-age=0, must-revalidate'};
  if(req.headers['if-none-match']===e.etag){res.writeHead(304,h);res.end();return;}
  const br=e.br&&/\bbr\b/.test(req.headers['accept-encoding']||'');const body=br?e.br:e.raw;if(br)h['content-encoding']='br';h['content-length']=body.length;
  res.writeHead(200,h);res.end(body);
 }catch(err){res.writeHead(500);res.end(String(err));}
}).listen(+port,()=>console.log('cf-like on',port));
