/* PowerpuffGurls V4 — Cinematic Director
   One transparent, persistent 3D scene across the entire page.
   Scroll moves the characters through a choreographed story. No animation control UI or widget.
   GLB assets and original rigs preserved. No destructive mesh changes.
*/
(async () => {
'use strict';
const world = document.getElementById('character-world');
const canvas = document.getElementById('character-canvas');
const status = document.getElementById('character-status');
if (!world || !canvas) return;
const debug = new URLSearchParams(location.search).has('debug3d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const info = {engine:null,loaded:[],clips:{},errors:[],scene:'origin'};
window.PPG_3D_DEBUG = info;
function report(message,level='info') { if(status)status.textContent=message; if(debug||level==='error')console[level]('[PPG]',message);window.dispatchEvent(new CustomEvent('ppg-model-status',{detail:{message}})); }
if(location.protocol==='file:') {report('Use HTTPS or a local HTTP server for 3D','error');return;}
let THREE,GLTFLoader;
for(const provider of [
 {name:'local',get:async()=>[await import('three'),(await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader]},
 {name:'esm.sh',get:async()=>[await import('https://esm.sh/three@0.180.0'),(await import('https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader]}
]) {try{[THREE,GLTFLoader]=await provider.get();info.engine=provider.name;break}catch(e){info.errors.push(provider.name+': '+e.message)}}
if(!THREE) { report('3D ENGINE UNAVAILABLE · CHECK NETWORK','error');return; }
let renderer;
try {
 renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.07;
} catch(e) {report('WEBGL NOT AVAILABLE','error');return;}
const scene = new THREE.Scene();
let scaleUnit = 180;
const camera = new THREE.OrthographicCamera(-4.5,4.5,2.5,-2.5,.01,60);
camera.position.set(0,0,15); camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x292143,2.1));
function light(hex,intensity,x,y,z) {const l=new THREE.DirectionalLight(hex,intensity);l.position.set(x,y,z);scene.add(l);}
light(0xfff3e9,2.2,-4,5,8);light(0x7dbfff,1.6,5,2,4);light(0xff4aa8,1.4,0,5,-4);
const loader = new GLTFLoader();
const colors = {blossom:0xff4b99,bubbles:0x55bbfa,buttercup:0x9cf65b};
const roles = ['blossom','bubbles','buttercup'];
const squad = {};
const minmax=(v,min,max)=>Math.min(max,Math.max(min,v));
const smooth=t=>{t=minmax(t,0,1);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const clock=new THREE.Clock();
let sceneIndex=0, sceneFraction=0, sceneName='origin', interactiveFocus='blossom';
let viewportWidth=window.innerWidth, viewportHeight=window.innerHeight;
let pointer={x:0,y:0}, mouse={x:-999,y:-999}, lastHover='',hoverTs=0;
const onstage=['top','what-we-do','the-squad','how-it-works','diagnosis'];
const scenes = [
 // Positions are normalized browser-screen coordinates, not inside a UI container.
 {id:'top',name:'origin',layout:{blossom:[.78,.59,405],bubbles:[.61,.65,345],buttercup:[.92,.65,335]},accent:'#ff4b99'},
 {id:'what-we-do',name:'strategy',layout:{blossom:[.78,.53,490],bubbles:[1.18,.45,340],buttercup:[1.27,.80,340]},accent:'#ff4b99'},
 {id:'the-squad',name:'squad',layout:{blossom:[.24,.52,470],bubbles:[.50,.52,460],buttercup:[.76,.52,465]},accent:'#b880ff'},
 {id:'how-it-works',name:'method',layout:{blossom:[-.25,.65,340],bubbles:[.27,.59,490],buttercup:[1.20,.75,330]},accent:'#55bbfa'},
 {id:'diagnosis',name:'diagnosis',layout:{blossom:[-.3,.52,320],bubbles:[-.25,.45,320],buttercup:[.26,.53,465]},accent:'#9cf65b'}
];
// Elsewhere on the page, the nearest scene is used with fluid interpolation.
function getSceneLocation(){
 const scroll=window.scrollY;
 const anchors=onstage.map((id,i)=>{const node=document.getElementById(id);return i===0?0:node?node.getBoundingClientRect().top+window.scrollY-window.innerHeight*.18:0});
 let idx=0; for(let i=0;i<anchors.length;i++){if(scroll>=anchors[i])idx=i;}
 const next=Math.min(idx+1,anchors.length-1);
 const frac=next===idx?0:smooth((scroll-anchors[idx]) / Math.max(1,anchors[next]-anchors[idx]));
 return {idx,frac,next,abs:idx+frac};
}
function poseClip(clip,t=0.20){
 // Stable sampled pose from a real rig animation, rather than dropping into bind/T pose.
 const tracks=clip.tracks.map(track=>{
   const value=Array.from(track.createInterpolant().evaluate(Math.min(t,clip.duration)));
   return new track.constructor(track.name,[0,1],value.concat(value),track.getInterpolation());
 });
 return new THREE.AnimationClip('RestPose',1,tracks);
}
function play(m,name,{loop=false,speed=1,blend=.38}={}){
 if(!m)return;
 const act=m.actions[name]; if(!act)return;
 if(m.current===act && loop)return;
 act.reset();act.enabled=true;act.paused=false;act.setEffectiveTimeScale(speed);act.setEffectiveWeight(1);
 act.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
 act.clampWhenFinished=!loop;
 act.play();
 if(m.current && m.current!==act)m.current.fadeOut(blend);
 act.fadeIn(blend);
 m.current=act;m.mode=name;
}
function choreography(name){
 if(name==='origin') {play(squad.blossom,'Wave_One_Hand',{speed:1.2});play(squad.bubbles,'RestPose',{loop:true});play(squad.buttercup,'RestPose',{loop:true});}
 if(name==='strategy'){play(squad.blossom,'Dive_Down_and_Land_2',{speed:1.45});}
 if(name==='squad'){roles.forEach((n,i)=>setTimeout(()=>play(squad[n],'Dive_Down_and_Land_2',{speed:1.25+i*.09}),i*190));}
 if(name==='method'){play(squad.bubbles,'Leap_of_Faith',{speed:1.15});}
 if(name==='diagnosis'){play(squad.buttercup,'Dive_Down_and_Land_2',{speed:1.25});}
 window.dispatchEvent(new CustomEvent('ppg-action-sfx',{detail:{action:['squad','strategy','diagnosis'].includes(name)?'land':'fly',character: name==='method'?'bubbles':name==='diagnosis'?'buttercup':'blossom'}}));
}
for (const n of roles){
 try {
  const gltf = await loader.loadAsync(new URL(`./assets/models/${n}.glb`,import.meta.url).href);
  const rig = gltf.scene;
  rig.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(rig);
  const size=new THREE.Vector3();box.getSize(size);
  const origin=new THREE.Vector3();box.getCenter(origin);
  const normalized=new THREE.Group();normalized.add(rig);
  rig.position.set(-origin.x,-box.min.y,-origin.z);
  // Do not mutate original vertex data, bone weights, normals or textures.
  rig.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;}
    if(o.isMesh&&o.material){const materials=Array.isArray(o.material)?o.material:[o.material];
     for(const mat of materials){mat.needsUpdate=true;}}
  });
  const carrier=new THREE.Group();carrier.add(normalized);scene.add(carrier);
  const clips=[...gltf.animations];
  const wave=clips.find(c=>c.name==='Wave_One_Hand');if(wave)clips.push(poseClip(wave));
  const mixer=new THREE.AnimationMixer(rig);
  const actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));
  const m={name:n,carrier,normalized,rig,size,mixer,actions,clips,mode:'RestPose',current:null,originalScale:1,displayHeight:350,
   px:{x:0,y:0},prevX:0,prevY:0,roll:0,flyOffset:0,idlePhase:roles.indexOf(n)*2.1,lastClip:0};
  squad[n]=m;
  if(actions.RestPose)play(m,'RestPose',{loop:true,blend:0});
  mixer.addEventListener('finished',e=>{
    if(e.action===m.current){
      if(m.mode==='Leap_of_Faith'){
       // Hold a real airborne rig pose, never reset to the skeleton bind pose.
       e.action.paused=true;e.action.time=Math.min(e.action.getClip().duration*.35,1.4);m.mode='hovering';
      }else play(m,'RestPose',{loop:true,blend:.65});
    }
  });
  info.loaded.push(n);info.clips[n]=clips.map(c=>c.name);
 } catch(e){ info.errors.push(n+': '+e.message);console.error('[PPG]',n,e);report('FAILED TO LOAD '+n.toUpperCase(),'error');}
}
if(!info.loaded.length)return;
world.classList.add('model-ready');report('SQUAD ONLINE — FOLLOW THE STORY');
const glow=new THREE.Group();scene.add(glow);
const stageHalos={};
for(const n of roles){
 const mat=new THREE.MeshBasicMaterial({color:colors[n],transparent:true,opacity:.43,depthWrite:false});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.83,.008,6,80),mat);
 ring.rotation.x=-Math.PI/2;
 scene.add(ring);stageHalos[n]=ring;
}
function resize(){
 viewportWidth=innerWidth;viewportHeight=innerHeight;
 scaleUnit=innerWidth<670?155:180;
 const w=viewportWidth/scaleUnit,h=viewportHeight/scaleUnit;
 camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
 renderer.setSize(viewportWidth,viewportHeight,false);
}
addEventListener('resize',resize,{passive:true});resize();
function screenToWorld(x,y){return [(x-.5)*viewportWidth/scaleUnit,(.5-y)*viewportHeight/scaleUnit];}
function pickCharacter(x,y){
 const ndc=new THREE.Vector2(x/viewportWidth*2-1,-(y/viewportHeight*2-1));
 const caster=new THREE.Raycaster();caster.setFromCamera(ndc,camera);
 const targets=roles.filter(n=>squad[n]).map(n=>squad[n].rig);
 const hits=caster.intersectObjects(targets,true);
 for(const hit of hits){let obj=hit.object;while(obj){const found=roles.find(n=>squad[n]?.rig===obj);if(found)return found;obj=obj.parent;}}
 return null;
}
addEventListener('pointermove',e=>{
 mouse.x=e.clientX;mouse.y=e.clientY;
 pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2;
 // Do not steal page scrolling or buttons. Cursor-based recognition only.
 const n=pickCharacter(mouse.x,mouse.y);
 if(n&&n!==lastHover&&performance.now()-hoverTs>2900){lastHover=n;hoverTs=performance.now();if(!reduced){play(squad[n],'Wave_One_Hand',{speed:1.4});window.dispatchEvent(new CustomEvent('ppg-action-sfx',{detail:{action:'wave',character:n}}));}}
 if(!n)lastHover='';
},{passive:true});
addEventListener('click',e=>{
 if(e.target.closest('a,button,input,textarea,select,label'))return;
 const n=pickCharacter(e.clientX,e.clientY);
 if(!n)return;
 interactiveFocus=n;
 if(!reduced)play(squad[n],'Wave_One_Hand',{speed:1.35});
 if(window.PPG_SITE?.setCharacter)window.PPG_SITE.setCharacter(n);
 // Clicking a character is a meaningful action: opens the matching business consultation.
 const goal={blossom:'strategy',bubbles:'automation',buttercup:'growth'}[n];
 const el=document.querySelector(`input[name="goals"][value="${goal}"]`);if(el)el.checked=true;
 document.getElementById('diagnosis')?.scrollIntoView({behavior:reduced?'auto':'smooth'});
});
addEventListener('ppg-character',e=>{interactiveFocus=e.detail?.character||'blossom';const m=squad[interactiveFocus];if(m&&!reduced)play(m,'Wave_One_Hand',{speed:1.3});});
addEventListener('ppg-action',e=>{const m=squad[e.detail?.character||interactiveFocus];if(!m)return;const action={wave:'Wave_One_Hand',run:'Running',land:'Dive_Down_and_Land_2',fly:'Leap_of_Faith'}[e.detail?.action];if(action)play(m,action,{loop:action==='Running',speed:1.25});});
window.PPG_3D={choose:n=>{interactiveFocus=n;if(squad[n])play(squad[n],'Wave_One_Hand');},status:()=>({...info})};
let active='origin',lastScrollY=0;
const tmp=new THREE.Vector3();
const damping=(a,b,k,dt)=>mix(a,b,1-Math.exp(-k*dt));
function frame(){
 requestAnimationFrame(frame);
 const delta=Math.min(clock.getDelta(),.06), t=clock.elapsedTime;
 if(document.hidden)return;
 const loc=getSceneLocation();sceneIndex=loc.idx;sceneFraction=loc.frac;
 const key=scenes[loc.idx];const next=scenes[loc.next];
 if(active!==key.name){active=key.name;info.scene=active;if(!reduced)choreography(active);}
 for(const n of roles){const m=squad[n];if(!m)continue;
  if(!reduced)m.mixer.update(delta);
  if(m.mode==='Leap_of_Faith'&&m.current?.time>1.45){m.current.time=1.4;m.current.paused=true;m.mode='hovering';}
  const a=key.layout[n],b=next.layout[n];
  let x=mix(a[0],b[0],loc.frac),y=mix(a[1],b[1],loc.frac),height=mix(a[2],b[2],loc.frac);
  if(innerWidth<700){
    const mobile={
      top:{blossom:[.50,.70,345],bubbles:[.18,.75,235],buttercup:[.82,.75,235]},
      'what-we-do':{blossom:[.64,.64,345],bubbles:[1.5,.8,220],buttercup:[1.5,.75,220]},
      'the-squad':{blossom:[.19,.50,285],bubbles:[.5,.50,285],buttercup:[.81,.50,285]},
      'how-it-works':{blossom:[-1,.7,270],bubbles:[.50,.63,345],buttercup:[2,.7,270]},
      diagnosis:{blossom:[-1,.7,270],bubbles:[2,.7,270],buttercup:[.5,.63,345]}
    };
    const ca=mobile[key.id]?.[n]||a,cb=mobile[next.id]?.[n]||b;
    x=mix(ca[0],cb[0],loc.frac);y=mix(ca[1],cb[1],loc.frac);height=mix(ca[2],cb[2],loc.frac);
  }
  const s=height/scaleUnit/Math.max(.01,m.size.y);
  const pos=screenToWorld(x,y);
  const drift=reduced?0:Math.sin(t*1.13+m.idlePhase)*.045;
  const flight=(loc.frac>0&&loc.frac<1)?Math.sin(loc.frac*Math.PI)*(.35+.10*(n==='bubbles'?1:0)):0;
  const normalizedY=pos[1]+flight+drift;
  m.carrier.position.x=damping(m.carrier.position.x,pos[0],3.6,delta);
  m.carrier.position.y=damping(m.carrier.position.y,normalizedY,3.4,delta);
  m.carrier.position.z=0;
  m.normalized.scale.setScalar(damping(m.normalized.scale.x,s,4.0,delta));
  // Very small world-space turns preserve the stylized face and avoid exaggerated distortions.
  const turn=minmax(pointer.x,-1,1)*.075;
  const inFlight=flight>.1;
  m.carrier.rotation.y=damping(m.carrier.rotation.y,turn,2.7,delta);
  m.carrier.rotation.z=damping(m.carrier.rotation.z,inFlight?-.055*Math.sin(Math.PI*loc.frac):0,2.8,delta);
  const h=stageHalos[n];h.position.set(m.carrier.position.x,m.carrier.position.y-height/scaleUnit*.34,-.5);
  const opacity=n==='blossom'?.33:n==='bubbles'?.24:.30;
  h.material.opacity=damping(h.material.opacity,loc.idx===2?opacity:opacity*.38,3,delta);
  h.scale.setScalar(damping(h.scale.x,loc.idx===2?1.05:.8,3,delta));
 }
 const px=window.scrollY;
 const speed=px-lastScrollY;lastScrollY=px;
 world.style.setProperty('--scroll-energy',String(minmax(Math.abs(speed)/70,0,1)));
 renderer.render(scene,camera);
}
frame();
if(debug)console.table(info.clips);
})();
