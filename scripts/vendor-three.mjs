// Optional local/offline Three.js dependency packaging, run after npm install.
// This avoids runtime CDN requests when deploying static files to Vercel or File Manager.
// Copies a lean loader dependency tree and the Three.js core into /vendor.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const from=path.join(root,'node_modules/three');
if(!fs.existsSync(from))throw new Error('Install dependencies first: npm install');
const dest=path.join(root,'vendor');
fs.mkdirSync(dest,{recursive:true});
for(const file of ['build/three.module.js','build/three.core.js']) {
 const src=path.join(from,file),out=path.join(dest,file);
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(src,out);
}
const done=new Set();
function copyRelative(file){
 if(done.has(file))return;
 done.add(file);
 const src=path.join(from,file);if(!fs.existsSync(src))throw new Error('Missing '+file);
 const output=path.join(dest,file);fs.mkdirSync(path.dirname(output),{recursive:true});
 const content=fs.readFileSync(src,'utf8');fs.writeFileSync(output,content);
 for(const match of content.matchAll(/(?:from\s*|import\s*\()\s*['"](\.{1,2}\/[^'"\)]+)['"]/g)) {
  const full=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
  copyRelative(full);
 }
}
copyRelative('examples/jsm/loaders/GLTFLoader.js');
const html=path.join(root,'index.html');let text=fs.readFileSync(html,'utf8');
text=text.replace('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','./vendor/build/three.module.js');
text=text.replace('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/','./vendor/examples/jsm/');
fs.writeFileSync(html,text);
console.log('Vendored Three.js locally: '+done.size+' addon module(s).');
