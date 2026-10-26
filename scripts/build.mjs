import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const three=path.join(root,'node_modules','three');
if(!fs.existsSync(three))throw Error('Three.js missing. Run npm install before npm run build.');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
for(const filename of ['index.html','styles.css','app.js','three-stage.js','config.js','.htaccess'])fs.copyFileSync(path.join(root,filename),path.join(output,filename));
fs.cpSync(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
const copied=new Set();
for(const filename of ['build/three.module.js','build/three.core.js']){
 const dest=path.join(output,'vendor',filename);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(three,filename),dest);
}
function copy(file){
 file=path.posix.normalize(file);if(copied.has(file))return;copied.add(file);
 const f=path.join(three,file);const body=fs.readFileSync(f,'utf8');
 const dest=path.join(output,'vendor',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,body);
 for(const m of body.matchAll(/(?:from\s*|import\s*\()\s*['"](\.{1,2}\/[^'"\)]+)['"]/g)){
  const p=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1]));copy(p);
 }
}
copy('examples/jsm/loaders/GLTFLoader.js');
let html=fs.readFileSync(path.join(output,'index.html'),'utf8');
html=html.replace('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','./vendor/build/three.module.js');
html=html.replace('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/','./vendor/examples/jsm/');
fs.writeFileSync(path.join(output,'index.html'),html);
console.log('Built dist/ with all assets and '+copied.size+' local Three.js addons. Ready for Vercel or File Manager.');
