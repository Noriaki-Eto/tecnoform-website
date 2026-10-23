/* No external rendering dependency. Photography remains visible without WebGL. */
(function () {
  'use strict';
  const root = document.documentElement;
  const hero = document.getElementById('hero');
  const stage = hero.querySelector('.hero-bg-slides');
  const slides = Array.from(stage.children);
  const toggle = document.getElementById('motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let paused = reduced.matches;
  let visible = true, frame = 0, timer = 0, current = 0, elapsed = 0, previous = 0;
  let mx = 0, my = 0, px = 0, py = 0;
  const en = () => root.lang === 'en';
  const imagePath = slide => (slide.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [,''])[1];
  const projects = slides.map(slide => typeof PROJECTS === 'undefined' ? null : PROJECTS.find(p => (p.slides || []).includes(imagePath(slide))));
  function labels() {
    toggle.textContent = paused ? (en() ? 'Motion: off' : '動き：停止中') : (en() ? 'Pause motion' : '動きを止める');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.disabled = reduced.matches;
    toggle.title = reduced.matches ? (en() ? 'Reduced motion follows your device setting' : '端末の視差効果を減らす設定に従っています') : '';
    document.getElementById('scene-prev').setAttribute('aria-label', en() ? 'Previous photograph' : '前の作品写真');
    document.getElementById('scene-next').setAttribute('aria-label', en() ? 'Next photograph' : '次の作品写真');
    document.querySelector('.scene-controls').setAttribute('aria-label', en() ? 'Photographs and motion' : '作品写真と動きの操作');
    document.querySelectorAll('[data-cinema-ja]').forEach(el => { el.textContent = en() ? el.dataset.cinemaEn : el.dataset.cinemaJa; });
    const project = projects[current];
    const fields = project && typeof tfFields === 'function' ? tfFields(project) : null;
    document.getElementById('scene-title').textContent = fields ? fields.title.split(/<br\s*\/?>/i)[0].replace(/<[^>]*>/g, '') : 'atelier TECNOFORM';
    document.getElementById('scene-number').textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    document.querySelectorAll('.work-card:not(.is-coming)').forEach(card => {
      card.setAttribute('aria-label', (en() ? 'View: ' : '作品を開く：') + card.querySelector('.work-name').textContent);
    });
  }
  function show(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    labels();
  }
  function restartTimer() {
    clearInterval(timer); timer = 0;
    if (!paused && visible && !document.hidden && slides.length > 1) timer = setInterval(() => show(current + 1), 8500);
  }
  document.getElementById('scene-prev').addEventListener('click', () => { show(current - 1); restartTimer(); });
  document.getElementById('scene-next').addEventListener('click', () => { show(current + 1); restartTimer(); });
  new MutationObserver(labels).observe(root, { attributes:true, attributeFilter:['lang'] });
  document.querySelectorAll('.work-card:not(.is-coming)').forEach(card => {
    card.tabIndex = 0; card.setAttribute('role', 'button');
    card.addEventListener('keydown', event => {
      if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); card.click(); }
    });
    const photo = card.querySelector('.work-frame');
    card.addEventListener('pointermove', event => {
      if (paused || !fine.matches) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      photo.style.transform = `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg) translateZ(12px)`;
      photo.style.setProperty('--shine-x', `${(x+.5)*100}%`);
      photo.style.setProperty('--shine-y', `${(y+.5)*100}%`);
    }, {passive:true});
    card.addEventListener('pointerleave', () => { photo.style.transform = ''; });
  });
  hero.addEventListener('pointermove', event => {
    if (paused || !fine.matches) return;
    const box = hero.getBoundingClientRect();
    mx = (event.clientX - box.left) / box.width - .5;
    my = (event.clientY - box.top) / box.height - .5;
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { mx = my = 0; });

  // A projected, lit three-dimensional wave mesh; no images are distorted.
  const canvas = document.getElementById('light-field');
  let gl = null, program = null, meshCount = 0, timeUniform, aspectUniform;
  function initGL() {
    try {
      gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, antialias:false, powerPreference:'low-power'});
      if (!gl) { canvas.dataset.renderer='static'; return; }
      const vertex = `
        precision mediump float;
        attribute vec2 aPosition;
        uniform float uTime; uniform float uAspect;
        varying vec3 vNormal; varying vec2 vUv; varying float vDepth;
        void main(){
          float x=aPosition.x, z=aPosition.y;
          float p=x*1.25+z*.7+uTime*.24;
          float q=z*1.8-x*.45-uTime*.18;
          float y=.22*sin(p)+.11*cos(q);
          float dx=.275*cos(p)+.0495*sin(q);
          float dz=.154*cos(p)-.198*sin(q);
          vNormal=normalize(vec3(-dx,1.,-dz)); vUv=aPosition; vDepth=z;
          float depth=z+5.8;
          gl_Position=vec4((x+1.7)*1.8/uAspect,(y-1.75-z*.18)*1.8,0.,depth);
        }`;
      const fragment = `
        precision mediump float;
        varying vec3 vNormal; varying vec2 vUv; varying float vDepth;
        uniform float uTime;
        void main(){
          vec3 n=normalize(vNormal);
          float spec=pow(max(dot(n,normalize(vec3(.1,.94,.24))),0.),45.);
          float wave=sin(vUv.x*4.+sin(vUv.y*1.5+uTime*.22)*1.6);
          float line=pow(abs(wave),22.);
          float edge=smoothstep(0.,1.,(vUv.x+7.)/2.)*(1.-smoothstep(5.,7.,vUv.x));
          float fade=smoothstep(-1.,.5,vDepth)*(1.-smoothstep(4.,11.,vDepth))*edge;
          vec3 gold=vec3(.79,.65,.43), blue=vec3(.17,.38,.39);
          vec3 color=mix(blue,gold,spec);
          float alpha=fade*(.025+line*.17+spec*.2);
          gl_FragColor=vec4(color,alpha);
        }`;
      function shader(type, code) {
        const s = gl.createShader(type); gl.shaderSource(s,code); gl.compileShader(s);
        if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) { gl.deleteShader(s); throw new Error('shader compilation'); }
        return s;
      }
      program = gl.createProgram();
      const vs = shader(gl.VERTEX_SHADER,vertex), fs = shader(gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('program');
      gl.useProgram(program);
      const vertices = [], nx=80, nz=50;
      for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) {
        const x=-7+i*14/nx, z=-1+j*12/nz, dx=14/nx, dz=12/nz;
        vertices.push(x,z,x+dx,z,x,z+dz,x,z+dz,x+dx,z,x+dx,z+dz);
      }
      meshCount=vertices.length/2;
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'aPosition');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      timeUniform=gl.getUniformLocation(program,'uTime'); aspectUniform=gl.getUniformLocation(program,'uAspect');
      gl.clearColor(0,0,0,0);
      canvas.dataset.renderer='webgl';
    } catch (error) { console.warn('Light field fallback:',error.message); gl=null; canvas.dataset.renderer='static'; }
  }
  function resize() {
    if (!gl) return;
    const dpr=Math.min(devicePixelRatio||1,1.25);
    canvas.width=Math.round(hero.clientWidth*dpr); canvas.height=Math.round(hero.clientHeight*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(aspectUniform,canvas.width/canvas.height);
    draw();
  }
  function draw() {
    if (!gl || gl.isContextLost()) return;
    gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(timeUniform,elapsed); gl.drawArrays(gl.TRIANGLES,0,meshCount);
  }
  function tick(now) {
    frame=0;
    if(paused || !visible || document.hidden) {previous=0;return;}
    // Cap GPU work to about 30 frames per second, independent of display refresh.
    if (!previous || now-previous>=32) {
      if(previous) elapsed+=Math.min((now-previous)/1000,.1);
      previous=now; px+=(mx-px)*.075; py+=(my-py)*.075;
      if(fine.matches && innerWidth>768) {
        const scroll=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.clientHeight));
        stage.style.transform=`translate3d(${px*16}px,${py*10-scroll*32}px,0) rotateY(${-11+px*7+scroll*7}deg) rotateX(${3-py*5}deg) rotateZ(${-2+scroll}deg)`;
      }
      draw();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    root.dataset.motion=paused?'paused':'running'; labels(); restartTimer();
    cancelAnimationFrame(frame); frame=0; previous=0;
    if (!paused && visible && !document.hidden) frame=requestAnimationFrame(tick);
    else { stage.style.transform=''; draw(); }
  }
  toggle.addEventListener('click', () => { if(!reduced.matches) {paused=!paused;sync();} });
  reduced.addEventListener('change', () => {paused=reduced.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries => {visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(hero);
  canvas.addEventListener('webglcontextlost',event => {event.preventDefault();gl=null;canvas.dataset.renderer='static';});
  canvas.addEventListener('webglcontextrestored',() => {initGL();resize();});
  initGL(); resize(); sync();
  addEventListener('resize',resize,{passive:true});
})();
