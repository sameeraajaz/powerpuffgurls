// One shared WebGL canvas follows the narrative: ensemble on the homepage,
// then a focused consultant in the expertise chapter. No orbit controls.
const debug = new URLSearchParams(location.search).has('debug3d');
let debugBox;
function logStatus(message, isError=false){
  console[isError?'warn':'info']('[The Gurls 3D]',message);
  if(debug){if(!debugBox){debugBox=document.createElement('div');Object.assign(debugBox.style,{position:'fixed',right:'8px',top:'115px',maxWidth:'300px',padding:'10px 12px',background:'#10111ef5',color:'#b4ffbe',font:'11px monospace',zIndex:'9999',border:'1px solid #ffffff55',borderRadius:'6px',pointerEvents:'none'});document.body.appendChild(debugBox)}debugBox.textContent=message;debugBox.style.color=isError?'#ff91af':'#b4ffbe'}
  if(isError)window.dispatchEvent(new CustomEvent('gurls:model-error',{detail:message}));
}
function isWebGLSupported(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}}
async function getEngine(){
  try{const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');const mod=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');return {THREE,GLTFLoader:mod.GLTFLoader}}catch(e){logStatus('Primary 3D module source unavailable; retrying backup.');}
  const THREE=await import('https://esm.sh/three@0.160.0');const mod=await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');return{THREE,GLTFLoader:mod.GLTFLoader};
}
const hero=document.getElementById('hero-stage'),consoleTarget=document.getElementById('console-stage');
if(!hero||!consoleTarget||!isWebGLSupported()){logStatus('WebGL unavailable — static character artwork is active.',true)}else init();
async function init(){
  try{
    const {THREE,GLTFLoader}=await getEngine();
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(35,1,.1,80);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.pointerEvents='none';renderer.domElement.style.position='absolute';renderer.domElement.style.inset='0';renderer.domElement.style.zIndex='2';
    const hemi=new THREE.HemisphereLight(0xffffff,0x382e50,2.65);scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-3,7,8);scene.add(key);
    const sideBlue=new THREE.DirectionalLight(0x74ceff,2.5);sideBlue.position.set(6,3,-1);scene.add(sideBlue);
    const sidePink=new THREE.DirectionalLight(0xff8fcb,1.8);sidePink.position.set(-5,1,2);scene.add(sidePink);
    const clock=new THREE.Clock(), loader=new GLTFLoader();
    const resources=[{id:'blossom',role:'strategy',path:'./assets/models/blossom.glb',x:-2.32},{id:'bubbles',role:'systems',path:'./assets/models/bubbles.glb',x:0},{id:'buttercup',role:'growth',path:'./assets/models/buttercup.glb',x:2.32}];
    let activeTarget='hero',activeRole='strategy',mouse={x:0,y:0},lastDims={w:0,h:0},paused=false;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const figures=[];
    for(const cfg of resources){
      try{
        const gltf=await loader.loadAsync(cfg.path);
        const obj=gltf.scene;const box=new THREE.Box3().setFromObject(obj);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());
        if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Character has invalid dimensions');
        const fit=3.25/size.y;
        obj.scale.multiplyScalar(fit);
        obj.position.set(-center.x*fit,-box.min.y*fit,-center.z*fit);
        // Preserve authored bones and action target hierarchy.
        const wrap=new THREE.Group();wrap.add(obj);wrap.position.set(cfg.x,-1.8,0);
        wrap.userData.originalX=cfg.x;wrap.userData.phase=figures.length*2.7;
        obj.traverse(n=>{if(n.isMesh){n.frustumCulled=false;if(n.material){n.material.side=THREE.FrontSide;n.material.needsUpdate=true}}});
        scene.add(wrap);
        const mixer=new THREE.AnimationMixer(obj);
        const idle=gltf.animations.find(a=>/idle/i.test(a.name));
        if(idle){const action=mixer.clipAction(idle);action.play();action.timeScale=.72;}
        figures.push({cfg,wrap,mixer,clips:gltf.animations,role:cfg.role,x:cfg.x,opacity:1,fit,body:obj});
        logStatus(`Loaded ${cfg.id} ✓ — ${gltf.animations.map(a=>a.name).join(', ')}`);
      }catch(err){logStatus(`${cfg.id} failed: ${err.message}`,true)}
    }
    if(figures.length===0){renderer.dispose();return;}
    document.getElementById('hero-fallback').style.opacity='0';
    document.getElementById('hero-fallback').style.transition='opacity .4s';
    hero.appendChild(renderer.domElement);
    function updateTarget(){
      const v=consoleTarget.getBoundingClientRect(), h=hero.getBoundingClientRect();
      const cIs= v.top<innerHeight*.74 && v.bottom>innerHeight*.3;
      const hIs= h.top<innerHeight*.8 && h.bottom>innerHeight*.25;
      const dest=cIs?'console':hIs?'hero':activeTarget;
      if(dest!==activeTarget){activeTarget=dest;const host=dest==='console'?consoleTarget:hero;host.appendChild(renderer.domElement);resize(true)}
    }
    function resize(force=false){const host=activeTarget==='console'?consoleTarget:hero;const w=Math.max(100,host.clientWidth),h=Math.max(150,host.clientHeight);if(force||w!==lastDims.w||h!==lastDims.h){lastDims={w,h};renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=activeTarget==='console'?34:35;camera.updateProjectionMatrix()}}
    function setRole(e){activeRole=e.detail.role;const f=figures.find(x=>x.role===activeRole);if(f){const idle=f.clips.find(x=>/idle/i.test(x.name));if(idle){const act=f.mixer.clipAction(idle);act.reset().fadeIn(.35).play()}}}
    addEventListener('gurls:role',setRole);
    document.addEventListener('pointermove',e=>{const target=(activeTarget==='console'?consoleTarget:hero).getBoundingClientRect();mouse.x=Math.max(-1,Math.min(1,(e.clientX-(target.left+target.width/2))/(target.width/2)));mouse.y=Math.max(-1,Math.min(1,(e.clientY-(target.top+target.height/2))/(target.height/2)))},{passive:true});
    let acc=0,scrollProgress=0;
    addEventListener('scroll',()=>{scrollProgress=Math.max(0,Math.min(1,scrollY/(document.documentElement.scrollHeight-innerHeight||1)));updateTarget()},{passive:true});
    addEventListener('resize',()=>resize(true));
    document.addEventListener('visibilitychange',()=>{paused=document.hidden});
    updateTarget();resize(true);
    function animate(){requestAnimationFrame(animate);if(paused)return;const dt=Math.min(.045,clock.getDelta());acc+=dt;updateTarget();resize();
      const focused=activeTarget==='console';
      const small=innerWidth<680;
      for(const f of figures){
        const selected=f.role===activeRole;
        const targetX=focused?0:f.x*(small?.78:1);
        const show=!focused||selected;
        f.wrap.visible=show;
        if(!show)continue;
        if(!reduced.matches)f.mixer.update(dt);
        const bob=reduced.matches?0:(.08*Math.sin(acc*1.45+f.wrap.userData.phase));
        f.wrap.position.x=THREE.MathUtils.damp(f.wrap.position.x,targetX,4.8,dt);
        f.wrap.position.y=THREE.MathUtils.damp(f.wrap.position.y, (focused?-1.8:-1.85)+bob+(focused?.08:0),4,dt);
        const spin=(!reduced.matches?.09:0)*(Math.sin(acc*.6+f.wrap.userData.phase));
        f.wrap.rotation.y=THREE.MathUtils.damp(f.wrap.rotation.y,-mouse.x*.14+spin,2.3,dt);
        f.wrap.rotation.x=THREE.MathUtils.damp(f.wrap.rotation.x,mouse.y*.045,2.4,dt);
        const scale=(focused?1.1:small?.88:1);
        f.wrap.scale.setScalar(THREE.MathUtils.damp(f.wrap.scale.x,scale,4,dt));
      }
      const desiredZ=focused?9.0:(small?11.7:11.6);
      camera.position.set(THREE.MathUtils.damp(camera.position.x,focused?-mouse.x*.18:mouse.x*.19,2,dt),2.0,THREE.MathUtils.damp(camera.position.z||desiredZ,desiredZ,4,dt));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    camera.position.set(0,2.0,11.6);animate();
    document.getElementById('console-fallback').style.opacity='0';
    document.getElementById('console-fallback').style.transition='opacity .4s';
  }catch(err){logStatus(`Could not start 3D: ${err.message}. Static illustrations remain visible.`,true)}
}
