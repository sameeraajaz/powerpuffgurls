/* An additive 3D layer. All page functionality remains available if WebGL or the CDN is unavailable. */
(async()=>{
 const canvas=document.getElementById('character-canvas'),world=document.getElementById('character-world');
 if(!canvas||!world)return;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const debug=new URLSearchParams(location.search).has('debug3d');
 const state={engine:null,loaded:[],errors:[],reducedMotion,modelUrls:{}};
 window.PPG_3D_DEBUG=state;
 const report=(message)=>{window.dispatchEvent(new CustomEvent('ppg-model-status',{detail:{message}})); if(debug)console.info('[PPG 3D]',message)};
 if(location.protocol==='file:'){
   report('3D REQUIRES HTTP/HTTPS — USE VERCEL OR LOCAL SERVER');
   state.errors.push('file:// cannot load ES modules and GLBs reliably');
   return;
 }
 report('CONNECTING 3D ENGINE...');
 let THREE,GLTFLoader;
 const sources=[
   {name:'jsDelivr',three:()=>import('three'),loader:()=>import('three/addons/loaders/GLTFLoader.js')},
   {name:'esm.sh backup',three:()=>import('https://esm.sh/three@0.180.0'),loader:()=>import('https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js')}
 ];
 for (const source of sources){
   try{
     THREE=await source.three();
     ({GLTFLoader}=await source.loader());
     if(!THREE?.WebGLRenderer || !GLTFLoader)throw new Error('Three.js modules incomplete');
     state.engine=source.name;
     report('3D ENGINE ONLINE / '+source.name.toUpperCase());
     break;
   }catch(e){
     const msg=source.name+': '+(e?.message||String(e));
     state.errors.push(msg);
     console.warn('[PPG 3D] Module source failed:',msg);
   }
 }
 if(!THREE?.WebGLRenderer || !GLTFLoader){
   report('3D LIBRARIES BLOCKED — CHECK NETWORK / AD BLOCKER');
   return;
 }
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65}catch(e){const msg='WebGL initialization: '+(e?.message||e);state.errors.push(msg);console.error('[PPG 3D]',msg);report('WEBGL UNAVAILABLE — ENABLE HARDWARE ACCELERATION');return}
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.05,100);
 camera.position.set(0,.15,8.2);camera.lookAt(0,.05,0);
 scene.add(new THREE.AmbientLight('#ffffff',2.3));
 const key=new THREE.DirectionalLight('#fff3f8',4.2);key.position.set(-3,6,5);scene.add(key);
 const fill=new THREE.DirectionalLight('#73ccff',3.2);fill.position.set(4,2,-2);scene.add(fill);
 const rim=new THREE.DirectionalLight('#ff48a6',3.6);rim.position.set(0,3,-5);scene.add(rim);
 const floor=new THREE.Group();scene.add(floor);
 const matLine=new THREE.MeshBasicMaterial({color:'#ff63bf',transparent:true,opacity:.24,side:THREE.DoubleSide});
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.78+i*.33,.003,4,100),matLine.clone());ring.rotation.x=Math.PI/2;ring.position.y=-1.18-i*.002;floor.add(ring)}
 const sparkGeo=new THREE.BufferGeometry(),pos=new Float32Array(110*3);for(let i=0;i<110;i++){pos[i*3]=(Math.random()-.5)*8;pos[i*3+1]=(Math.random()-.5)*4;pos[i*3+2]=-1-Math.random()*4}
 sparkGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));const particles=new THREE.Points(sparkGeo,new THREE.PointsMaterial({color:'#c895ff',size:.017,transparent:true,opacity:.6}));scene.add(particles);
 const loader=new GLTFLoader(),charConfig=[['bubbles',-1.95],['blossom',0],['buttercup',1.95]];
 const members=[];let requested=window.PPG_ACTIVE_CHARACTER||'blossom',hovered=null,scrollProgress=0,docked=false;
 function emit(s){window.dispatchEvent(new CustomEvent('ppg-model-status',{detail:{message:s}}))}
 await Promise.allSettled(charConfig.map(async ([name,x])=>{
  try{
   const modelUrl=new URL(`./assets/models/${name}.glb`,import.meta.url).href;
   state.modelUrls[name]=modelUrl;
   const gltf=await loader.loadAsync(modelUrl);
   const holder=new THREE.Group();holder.position.set(x,-1.18,0);
   const root=gltf.scene;root.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(root),sz=new THREE.Vector3();box.getSize(sz);
   if(sz.y>0){const scale=2.35/sz.y;root.scale.multiplyScalar(scale);root.position.set(-(box.min.x+box.max.x)*.5*scale,-box.min.y*scale,0)}
   root.traverse(node=>{if(node.isMesh||node.isSkinnedMesh){node.frustumCulled=false;if(node.material){node.material.side=THREE.DoubleSide;node.material.needsUpdate=true}}});
   holder.add(root);scene.add(holder);
   const mixer=new THREE.AnimationMixer(root),actions={};
   gltf.animations.forEach(clip=>{actions[clip.name.toLowerCase()]=mixer.clipAction(clip).setLoop(THREE.LoopRepeat)});
   const head=root.getObjectByName('mixamorig:Head')||null;
   members.push({name,x,holder,root,mixer,actions,head,current:null,phase:Math.random()*4,baseScale:1});
   state.loaded.push(name);
   report(`${members.length} / 3 CYBER SPECIALISTS LOADED`);
  }catch(e){const msg=name+': '+(e?.message||String(e));state.errors.push(msg);console.error('[PPG 3D] MODEL LOAD FAILED',msg, state.modelUrls[name]);report('FAILED TO LOAD '+name.toUpperCase()+' — CHECK /ASSETS/MODELS/');}
 }));
 if(members.length===0){report('3D FILES FAILED — CHECK MODEL PATHS AND HOSTING');return}
 if(members.length===3){world.classList.add('model-ready');report('3 / 3 CYBER SPECIALISTS ONLINE')}else{report('PARTIAL 3D — '+members.length+' OF 3 LOADED');world.classList.add('model-ready')}
 function playAnimation(m,name){const a=m.actions[name];if(m.current===name||!a)return;if(m.current&&m.actions[m.current])m.actions[m.current].fadeOut(.32);a.reset().fadeIn(.3).play();m.current=name}
 function stopAnimation(m){if(m.current&&m.actions[m.current]){m.actions[m.current].fadeOut(.35)}m.current=null}
 window.addEventListener('ppg-character',e=>{requested=e.detail.character||'blossom';members.forEach(m=>{if(m.name===requested)playAnimation(m,'walking');else stopAnimation(m)})});
 window.addEventListener('ppg-scroll',e=>{scrollProgress=e.detail.progress;docked=e.detail.docked});
 window.addEventListener('pointermove',e=>{const r=world.getBoundingClientRect();if(e.clientX>r.left && e.clientX<r.right && e.clientY>r.top&&e.clientY<r.bottom){const norm=(e.clientX-r.left)/r.width;hovered=docked?requested:norm<.36?'bubbles':norm>.67?'buttercup':'blossom'}else hovered=null},{passive:true});
 world.addEventListener('click',()=>{if(hovered&&hovered!==requested)window.PPG_SITE?.setCharacter(hovered)});
 function resize(){const w=world.clientWidth||550,h=world.clientHeight||650;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=docked?41:39;camera.position.z=docked?6.15:8.5;camera.updateProjectionMatrix()}
 const ro=new ResizeObserver(resize);ro.observe(world);resize();
 const clock=new THREE.Clock();let raf=0;
 function loop(){raf=requestAnimationFrame(loop);if(document.hidden)return;const delta=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;
  const pointer=window.PPG_POINTER||{x:0,y:0};
  const mobile=window.innerWidth<700;
  const spread=mobile?1.55:1.95;
  members.forEach(m=>{
   if(!reducedMotion) m.mixer.update(delta);
   const isSelected=m.name===requested,isHovered=m.name===hovered;
   const targetX=docked?0:(m.name==='bubbles'?-spread:m.name==='buttercup'?spread:0);
   const targetScale=docked?(isSelected?1.02:.001):(isSelected?1.1:1);
   const scrollFlight=(docked||reducedMotion)?0:Math.sin(Math.min(1,scrollProgress*5.8)*Math.PI);
   const lerp=Math.min(1,delta*4.7);
   m.holder.position.x=THREE.MathUtils.lerp(m.holder.position.x,targetX,lerp);
   m.holder.position.y=THREE.MathUtils.lerp(m.holder.position.y,-1.18+(isSelected?.10:0)+scrollFlight*(isSelected?.31:.16)+(reducedMotion?0:Math.sin(t*1.5+m.phase)*.02),lerp);
   const s=THREE.MathUtils.lerp(m.holder.scale.x,targetScale,lerp);m.holder.scale.setScalar(s);
   m.holder.rotation.y=THREE.MathUtils.lerp(m.holder.rotation.y,(isHovered?.16:0)+pointer.x*.065,lerp);
   m.holder.rotation.z=THREE.MathUtils.lerp(m.holder.rotation.z,(reducedMotion?0:Math.sin(t*1.1+m.phase)*.014)+scrollFlight*(m.name==='bubbles'?.09:m.name==='buttercup'?-.08:.045),lerp);
   if(m.head && !m.current){m.head.rotation.y=THREE.MathUtils.lerp(m.head.rotation.y,THREE.MathUtils.clamp(pointer.x*.18,-.17,.17),delta*1.3);m.head.rotation.x=THREE.MathUtils.lerp(m.head.rotation.x,THREE.MathUtils.clamp(-pointer.y*.09,-.09,.09),delta*1.3)}
   // A restrained walk cycle is triggered on selection; every other state idles naturally.
   if(m.current==='walking'&&m.actions.walking && m.actions.walking.time>1.2)stopAnimation(m);
  });
  particles.rotation.y=t*.007;floor.rotation.z=t*.028;
  if(docked)camera.position.z=THREE.MathUtils.lerp(camera.position.z,6.9,delta*2);else camera.position.z=THREE.MathUtils.lerp(camera.position.z,mobile?10.2:8.5,delta*2);
  camera.lookAt(0,0,0);renderer.render(scene,camera)
 }
 loop();window.addEventListener('beforeunload',()=>{cancelAnimationFrame(raf);ro.disconnect();renderer.dispose()},{once:true});
})();
