/* PowerpuffGurls / Character Director v3
   Three separate Mixamo GLBs, six animation clips each.
   Root motion was stripped at export so flight, land and run remain on stage.
   Action-driven state machine: idle / wave / run / leap / float / land / dance.
*/
(async () => {
  'use strict';
  const world = document.getElementById('character-world');
  const canvas = document.getElementById('character-canvas');
  const label = document.getElementById('character-status');
  if (!world || !canvas) return;
  const debug = new URLSearchParams(location.search).has('debug3d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const report = (message, level = 'info') => {
    if (label) label.textContent = message;
    if (debug || level === 'error') console[level]('[PPG 3D]', message);
    window.dispatchEvent(new CustomEvent('ppg-model-status', {detail:{message}}));
  };
  const state = {loaded:[], errors:[], clips:{}, engine:null, selected:'blossom', reducedMotion:reduced};
  window.PPG_3D_DEBUG = state;
  if (location.protocol === 'file:') {
    report('OPEN WITH LOCAL SERVER OR HTTPS FOR 3D', 'warn');
    return;
  }
  let THREE, GLTFLoader;
  const sources = [
    {name:'jsdelivr', load:async() => {const core=await import('three'); const loader=await import('three/addons/loaders/GLTFLoader.js'); return [core,loader.GLTFLoader];}},
    {name:'esm.sh', load:async() => {const core=await import('https://esm.sh/three@0.180.0'); const loader=await import('https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js'); return [core,loader.GLTFLoader];}}
  ];
  for (const source of sources) {
    try { [THREE, GLTFLoader] = await source.load();state.engine=source.name;break; }
    catch (e) {state.errors.push(source.name+': '+e.message);console.warn('[PPG 3D] Engine import failed:',source.name,e.message);}
  }
  if(!THREE || !GLTFLoader){report('3D ENGINE BLOCKED · CHECK INTERNET OR DEV CONSOLE','error');return;}
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.7));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.35;
  } catch(e) {report('WEBGL UNAVAILABLE · ENABLE GRAPHICS ACCELERATION','error');return;}
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37,1,.03,100);
  camera.position.set(0,.2,8.2);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#fff8fb','#444064',3.05));
  const makeLight=(color,intensity,x,y,z) => {const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);return l};
  makeLight('#fff6fb',3.7,-3,5,7);
  makeLight('#74bfff',3.1,4,2,-3);
  makeLight('#ff4cbd',3.0,0,3,-5);
  const color={blossom:0xff5ca7,bubbles:0x5ccaff,buttercup:0x91ff75};
  const neon=new THREE.PointLight(color.blossom,20,7,2); neon.position.set(0,0.2,1.3);scene.add(neon);
  const floor = new THREE.Group();scene.add(floor);
  for (let i=0;i<4;i++) {
    const r=new THREE.Mesh(new THREE.TorusGeometry(.7+i*.31,.005,4,104),new THREE.MeshBasicMaterial({color:i%2?0x88d4ff:0xff78c7,transparent:true,opacity:.35-i*.065}));
    r.rotation.x=Math.PI/2;r.position.y=-1.18;floor.add(r);
  }
  const rings=[];
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.19,.012,8,140),new THREE.MeshBasicMaterial({color:0xff6aa8,transparent:true,opacity:.48}));halo.position.set(0,.14,-1.1);scene.add(halo);
  const starGeo=new THREE.BufferGeometry(),points=new Float32Array(160*3);
  for(let i=0;i<160;i++){points[i*3]=(Math.random()-.5)*9;points[i*3+1]=(Math.random()-.5)*5;points[i*3+2]=-1-Math.random()*3}
  starGeo.setAttribute('position',new THREE.BufferAttribute(points,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffb4ee,size:.018,transparent:true,opacity:.62}));scene.add(stars);
  const configs=[['bubbles',-1.88],['blossom',0],['buttercup',1.88]];
  const members=[];
  const loader=new GLTFLoader();
  function idleClipFrom(wave) {
    // Freeze the first frame of a real animated pose rather than exposing the bind T-pose.
    const tracks=wave.tracks.map(track=>{
      const size=track.getValueSize(),sample=Array.from(track.values.slice(0,size));
      return new track.constructor(track.name,[0,1],sample.concat(sample),track.getInterpolation());
    });
    return new THREE.AnimationClip('IdleBase',1,tracks);
  }
  function getClip(m,key){
    const match={idle:'IdleBase',wave:'Wave_One_Hand',walk:'Walking',run:'Running',land:'Dive_Down_and_Land_2',leap:'Leap_of_Faith',dance:'Jump_Rope'}[key]||key;
    return m.clips.find(c=>c.name===match);
  }
  await Promise.all(configs.map(async ([name,x],i)=>{
    try {
      const gltf=await loader.loadAsync(new URL(`./assets/models/${name}.glb`,import.meta.url).href);
      const model=gltf.scene;model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model);
      const size=new THREE.Vector3();bounds.getSize(size);
      const scale=size.y>0?2.3/size.y:1;
      const center=bounds.getCenter(new THREE.Vector3());
      model.scale.multiplyScalar(scale);
      model.position.set(-center.x*scale,-bounds.min.y*scale, -center.z*scale);
      model.traverse(obj=>{
        if(obj.isMesh||obj.isSkinnedMesh){obj.frustumCulled=false;obj.castShadow=false;if(obj.material){obj.material.side=THREE.DoubleSide;obj.material.needsUpdate=true;}}
      });
      const holder=new THREE.Group();holder.position.set(x,-1.21,0);holder.add(model);scene.add(holder);
      const wave=gltf.animations.find(c=>c.name==='Wave_One_Hand');
      const clips=[...gltf.animations];if(wave)clips.push(idleClipFrom(wave));
      const mixer=new THREE.AnimationMixer(model),actions={};
      clips.forEach(c=>{actions[c.name]=mixer.clipAction(c);});
      const head=model.getObjectByName('mixamorig:Head');
      const member={name,x,holder,model,mixer,actions,clips,head,originalHead:head?.quaternion.clone(),mode:'idle',active:null,hoverAt:0,lastAutoWave:0,start:performance.now()/1000,flight:0,landFrom:0,runUntil:0,pending:null,phase:i*1.7};
      members.push(member);state.loaded.push(name);state.clips[name]=clips.map(c=>c.name);
      if(actions.IdleBase){actions.IdleBase.play();member.active=actions.IdleBase;}
      mixer.addEventListener('finished',e=>{
        if(e.action===member.active){
          if(member.mode==='land') {member.flight=0;member.mode='idle';startAction(member,'idle');}
          else if(member.mode==='wave'||member.mode==='dance') {member.mode=member.flight?'float':'idle';if(member.mode==='idle')startAction(member,'idle');else freezeFlightPose(member);}
          else if(member.mode==='run') {member.mode='idle';startAction(member,'idle');}
          else if(member.mode==='leap') freezeFlightPose(member);
        }
      });
      report(`${members.length} / 3 MODELS ONLINE`);
    }catch(e){state.errors.push(name+': '+e.message);console.error('[PPG 3D]',name,e);report('MODEL FAILED: '+name.toUpperCase(),'error');}
  }));
  if(!members.length){report('NO MODELS LOADED · CHECK /assets/models','error');return;}
  world.classList.add('model-ready');
  state.selected=window.PPG_ACTIVE_CHARACTER||'blossom';
  report(`${members.length} / 3 ONLINE · SELECT A SPECIALIST`);
  const memberByName=name=>members.find(m=>m.name===name);
  let docked=false, scrollProgress=0, currentlyHovered=null, section='top',isMobile=window.innerWidth<700;
  const pointer=new THREE.Vector2(10,10),raycaster=new THREE.Raycaster();
  const getAction=(m,key)=>{const c=getClip(m,key);return c?m.actions[c.name]:null};
  function startAction(m,key,options={}){
    if(reduced && key!=='idle')return;
    const act=getAction(m,key);if(!act)return;
    if(m.active===act && key==='idle')return;
    const duration=options.crossFade??.35;
    const prev=m.active;
    act.enabled=true;act.paused=false;act.reset();act.setEffectiveTimeScale(options.speed||1);act.setEffectiveWeight(1);
    if(['idle','walk','run','dance'].includes(key)){act.setLoop(THREE.LoopRepeat,Infinity);act.clampWhenFinished=false;}
    else {act.setLoop(THREE.LoopOnce,1);act.clampWhenFinished=true;}
    act.play();if(prev && prev!==act)prev.fadeOut(duration);act.fadeIn(duration);m.active=act;
  }
  function freezeFlightPose(m){
    const a=getAction(m,'leap');if(!a)return;
    if(m.active!==a){startAction(m,'leap',{crossFade:.28});}
    a.time=Math.min(1.45,a.getClip().duration*.32);
    // Keep the action active but stop clip time so the rig remains in its flying pose.
    a.paused=true;m.mode='float';m.flight=1;
  }
  function makeAction(member,kind){
    const m=member||memberByName(state.selected);if(!m)return;
    const now=performance.now()/1000;
    if(kind==='wave'){m.mode='wave';startAction(m,'wave',{speed:1.25});}
    else if(kind==='fly'){m.mode='leap';m.start=now;m.flight=1;startAction(m,'leap',{speed:1.35});}
    else if(kind==='land'){m.mode='land';m.start=now;m.landFrom=m.flight||0.9;m.flight=m.landFrom;startAction(m,'land',{speed:1.3});}
    else if(kind==='run'){m.mode='run';m.runUntil=now+2.3;startAction(m,'run');}
    else if(kind==='dance'){m.mode='dance';startAction(m,'dance',{speed:1.1});}
    else if(kind==='idle'){m.mode='idle';m.flight=0;startAction(m,'idle');}
    world.dataset.motion=kind;
    window.dispatchEvent(new CustomEvent('ppg-action-sfx',{detail:{action:kind,character:m.name}}));
    if(kind==='land')world.classList.remove('airborne');
    if(kind==='fly')world.classList.add('airborne');
  }
  function choose(name,action='wave'){
    if(!memberByName(name))return;
    state.selected=name;window.PPG_ACTIVE_CHARACTER=name;world.dataset.specialist=name;
    world.querySelectorAll('[data-stage-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stageCharacter===name)));
    neon.color.setHex(color[name]);
    halo.material.color.setHex(color[name]);
    world.style.setProperty('--stage-accent','#'+color[name].toString(16).padStart(6,'0'));
    makeAction(memberByName(name),action);
  }
  choose(state.selected,'idle');
  // Browser-consumable integration API. The existing inquiry wizard also uses ppg-character.
  window.PPG_3D={choose,act:(action,character)=>makeAction(memberByName(character||state.selected),action),status:()=>({...state})};
  window.addEventListener('ppg-character',e=>choose(e.detail?.character||'blossom','wave'));
  window.addEventListener('ppg-action',e=>makeAction(memberByName(e.detail?.character||state.selected),e.detail?.action||'wave'));
  window.addEventListener('ppg-scroll',e=>{scrollProgress=e.detail.progress;docked=e.detail.docked});
  world.querySelectorAll('[data-motion]').forEach(button=>button.addEventListener('click',e=>{
    e.stopPropagation();makeAction(memberByName(state.selected),button.dataset.motion);
    world.querySelectorAll('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  world.querySelectorAll('[data-stage-character]').forEach(button=>button.addEventListener('click',e=>{
    e.stopPropagation();const name=button.dataset.stageCharacter;
    if(window.PPG_SITE?.setCharacter) window.PPG_SITE.setCharacter(name);
    else choose(name,'wave');
    world.querySelectorAll('[data-stage-character]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  const sections=[['what-we-do','blossom','fly'],['the-squad','bubbles','wave'],['how-it-works','bubbles','run'],['diagnosis','buttercup','land']];
  const lastTriggered=new Map();
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting && e.intersectionRatio>.25){
        const found=sections.find(x=>x[0]===e.target.id);
        if(!found)return;
        const now=Date.now();if(now-(lastTriggered.get(found[0])||0)<18000)return;
        lastTriggered.set(found[0],now);
        if(memberByName(found[1])){
          const action=()=>{if(window.PPG_SITE?.setCharacter)window.PPG_SITE.setCharacter(found[1],false);else choose(found[1],'idle');makeAction(memberByName(found[1]),found[2]);};
          // Keep character selection tied to the actual page content.
          action();
        }
      }
    });
  },{threshold:[.25,.55]});
  sections.forEach(s=>{const el=document.getElementById(s[0]);if(el)observer.observe(el)});
  function getPick(e){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(members.map(m=>m.model),true);
    for(const hit of hits){const target=members.find(m=>{let node=hit.object;while(node){if(node===m.model)return true;node=node.parent;}return false;});if(target)return target;}
    return null;
  }
  canvas.addEventListener('pointermove',e=>{
    const selected=getPick(e);canvas.style.cursor=selected?'pointer':'default';
    if(selected && currentlyHovered!==selected.name){
      currentlyHovered=selected.name;
      if(!reduced && performance.now()/1000-selected.lastAutoWave>5.5){selected.lastAutoWave=performance.now()/1000;makeAction(selected,'wave');}
    }
    if(!selected)currentlyHovered=null;
  });
  canvas.addEventListener('pointerleave',()=>{currentlyHovered=null;canvas.style.cursor='default'});
  canvas.addEventListener('click',e=>{
    const picked=getPick(e);if(!picked)return;
    if(window.PPG_SITE?.setCharacter)window.PPG_SITE.setCharacter(picked.name);
    else choose(picked.name);
  });
  const ro=new ResizeObserver(()=>resize());ro.observe(world);
  function resize(){
    const w=world.clientWidth||600,h=world.clientHeight||550;renderer.setSize(w,h,false);
    isMobile=window.innerWidth<700;
    camera.aspect=w/h;camera.fov=docked?40:(isMobile?43:37);camera.updateProjectionMatrix();
  }
  resize();
  const clock=new THREE.Clock();let running=true;
  function tick(){
    if(!running)return;
    requestAnimationFrame(tick);
    const dt=Math.min(clock.getDelta(),.045);if(document.hidden)return;
    const t=clock.elapsedTime,p=window.PPG_POINTER||{x:0,y:0};
    const lerp=(a,b,s)=>THREE.MathUtils.lerp(a,b,1-Math.exp(-s*dt));
    docked=document.body.classList.contains('docked');
    const spread=isMobile?1.35:1.88;
    for(const m of members){
      if(!reduced)m.mixer.update(dt);
      if(m.mode==='run' && t>m.runUntil && performance.now()/1000>m.runUntil){m.mode='idle';startAction(m,'idle');}
      if(m.mode==='leap' && m.active && m.active.time>=1.45)freezeFlightPose(m);
      const selected=m.name===state.selected;
      let lift=0;
      if(m.mode==='leap'||m.mode==='float'){
        const elapsed=performance.now()/1000-m.start;
        lift=1.0*Math.min(1,Math.max(0,elapsed)/1.2);
      }else if(m.mode==='land'){
        const elapsed=performance.now()/1000-m.start;
        lift=m.landFrom*(1-Math.min(1,elapsed/1.85));
      }
      m.flight=lift;
      const bob=reduced?0:Math.sin(t*1.26+m.phase)*.025;
      const floatBob=(m.mode==='float'&&!reduced)?Math.sin(t*2.05+m.phase)*.09:0;
      const positionX=docked?0:(m.name==='bubbles'?-spread:m.name==='buttercup'?spread:0);
      const s=docked?(selected?1.02:.001):(selected?1.04:.95);
      m.holder.position.x=lerp(m.holder.position.x,positionX,3.1);
      m.holder.position.y=lerp(m.holder.position.y,-1.2+lift+bob+floatBob,3.8);
      const targetRotation=(m.mode==='float'||m.mode==='leap')?Math.sin(t*1.5+m.phase)*.07:(selected?p.x*.09:p.x*.045);
      m.holder.rotation.y=lerp(m.holder.rotation.y,targetRotation,2.8);
      m.holder.rotation.z=lerp(m.holder.rotation.z,(lift?.065*Math.sin(t*1.9+m.phase):.01*Math.sin(t*.95+m.phase)),3.6);
      const scale=lerp(m.holder.scale.x,s,4);m.holder.scale.setScalar(scale);
      if(m.head && m.originalHead && m.mode==='idle' && !reduced){
        // Facial direction is additive to a stable idle pose.
        const q=m.originalHead.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-p.y*.055,p.x*.065,0)));
        m.head.quaternion.slerp(q,Math.min(1,dt*1.5));
      }
    }
    const focus=members.find(m=>m.name===state.selected);
    const anyFlight=focus?.flight||0;
    camera.position.z=lerp(camera.position.z,docked?(isMobile?7.8:6.7):(isMobile?9.5:8.25),2.9);
    camera.position.y=lerp(camera.position.y,anyFlight*.13,.8);
    camera.lookAt(0,anyFlight*.13,0);
    stars.rotation.y=t*.011;
    floor.rotation.z=t*.025;
    halo.rotation.z=t*.05;
    halo.position.y=.1+Math.sin(t*.7)*.1;
    neon.intensity=20+Math.sin(t*2.3)*4;
    renderer.render(scene,camera);
  }
  tick();
  window.addEventListener('pagehide',()=>{running=false;ro.disconnect();observer.disconnect();renderer.dispose();},{once:true});
  if(debug) console.table(state.clips);
})();
