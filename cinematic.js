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

  });
  hero.addEventListener('pointermove', event => {
    if (paused || !fine.matches) return;
    const box = hero.getBoundingClientRect();
    mx = (event.clientX - box.left) / box.width - .5;
    my = (event.clientY - box.top) / box.height - .5;
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { mx = my = 0; });

  // Ray-intersected gallery architecture. Photographs stay front-facing and untouched.
  const canvas = document.getElementById('light-field');
  let gl = null, program = null, meshCount = 0, timeUniform, aspectUniform, viewUniform;
  function initGL() {
    try {
      gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, antialias:false, powerPreference:'low-power'});
      if (!gl) { canvas.dataset.renderer='static'; return; }
      const vertex = `
        attribute vec2 aPosition; varying vec2 vUv;
        void main(){vUv=aPosition;gl_Position=vec4(aPosition,0.,1.);}`;
      const fragment = `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime; uniform float uAspect; uniform vec2 uView;
        vec3 normal; float material;
        float boxHit(vec3 ro,vec3 rd,vec3 center,vec3 size){
          vec3 a=(center-size-ro)/rd,b=(center+size-ro)/rd;
          vec3 lo=min(a,b),hi=max(a,b);
          float near=max(max(lo.x,lo.y),lo.z),far=min(min(hi.x,hi.y),hi.z);
          return far>max(near,0.)?near:1000.;
        }
        void main(){
          vec3 ro=vec3(uView.x*.65+sin(uTime*.13)*.16, .8+uView.y*.25, 7.2);
          vec3 forward=normalize(vec3(0.,.65,-7.)-ro);
          vec3 right=normalize(cross(forward,vec3(0.,1.,0.)));
          vec3 up=cross(right,forward);
          vec3 rd=normalize(forward*1.6+right*vUv.x*uAspect+up*vUv.y);
          float t=1000.; material=0.; normal=vec3(0.,0.,1.);
          float q=(-2.-ro.y)/rd.y;
          if(q>0.&&q<t){t=q;material=1.;normal=vec3(0.,1.,0.);}
          q=(4.5-ro.y)/rd.y;
          if(q>0.&&q<t){t=q;material=2.;normal=vec3(0.,-1.,0.);}
          q=(-10.-ro.z)/rd.z;
          if(q>0.&&q<t){t=q;material=3.;normal=vec3(0.,0.,1.);}
          q=(sign(rd.x)*8.-ro.x)/rd.x;
          if(q>0.&&q<t){t=q;material=3.;normal=vec3(-sign(rd.x),0.,0.);}
          // Receding architectural portals are actual intersected volumes.
          for(int i=0;i<5;i++){
            float z=3.-float(i)*2.8;
            for(int side=0;side<2;side++){
              float x=side==0?-6.5:6.5;
              vec3 c=vec3(x,1.2,z),h=vec3(.16,3.2,.18);
              float d=boxHit(ro,rd,c,h);
              if(d>0.&&d<t){t=d;material=4.;vec3 p=(ro+rd*t-c)/h;normal=abs(p.x)>abs(p.z)?vec3(sign(p.x),0.,0.):vec3(0.,0.,sign(p.z));}
            }
            float d=boxHit(ro,rd,vec3(0.,4.25,z),vec3(6.6,.13,.18));
            if(d>0.&&d<t){t=d;material=4.;normal=vec3(0.,-1.,0.);}
          }
          vec3 p=ro+rd*t;
          vec3 light=vec3(2.+sin(uTime*.16)*2.,3.5,-3.);
          float diffuse=max(dot(normal,normalize(light-p)),0.);
          vec3 base=vec3(.24,.21,.16);
          if(material==1.)base=vec3(.17,.20,.19);
          if(material==2.)base=vec3(.13,.14,.14);
          if(material==4.)base=vec3(.32,.25,.16);
          vec3 color=base*(.38+diffuse*.75);
          if(material==1.){
            vec2 tile=abs(fract((p.xz+vec2(0.,.5))/2.)-.5);
            float grout=smoothstep(.48,.495,max(tile.x,tile.y));
            color*=1.-grout*.35;
            float pools=exp(-pow(p.x-3.4,2.)*.3)*(.5+.5*cos(p.z*1.5));
            color+=vec3(.27,.19,.09)*pools*.65;
            float flow=sin(p.x*2.+sin(p.z*1.4+uTime*.28)) + sin(p.z*2.2-uTime*.17);
            color+=vec3(.09,.19,.18)*pow(max(flow*.5,0.),12.)*.45;
          }
          if(material==2.){
            float strip=exp(-pow(abs(p.x)-3.8,2.)*85.);
            color+=vec3(1.,.78,.44)*strip*.9;
          }
          if(material==3.){
            float panel=exp(-pow(abs(p.x)-4.6,2.)*16.);
            float wash=exp(-pow(p.y-1.4,2.)*.22);
            color+=vec3(.32,.42,.38)*panel*wash;
            color+=vec3(.32,.22,.11)*exp(-pow(p.y+1.7,2.)*70.);
          }
          color=mix(color,vec3(.055,.065,.063),1.-exp(-t*.027));
          color*=1.-.24*length(vUv);
          gl_FragColor=vec4(pow(max(color,vec3(0.)),vec3(.8)),1.);
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
      const vertices = [-1,-1,1,-1,-1,1,-1,1,1,-1,1,1];
      meshCount=vertices.length/2;
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'aPosition');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      viewUniform=gl.getUniformLocation(program,'uView');
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
    gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform2f(viewUniform,px,py); gl.uniform1f(timeUniform,elapsed); gl.drawArrays(gl.TRIANGLES,0,meshCount);
  }
  function tick(now) {
    frame=0;
    if(paused || !visible || document.hidden) {previous=0;return;}
    // Cap GPU work to about 30 frames per second, independent of display refresh.
    if (!previous || now-previous>=32) {
      if(previous) elapsed+=Math.min((now-previous)/1000,.1);
      previous=now; px+=(mx-px)*.075; py+=(my-py)*.075;

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
