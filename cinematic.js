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

  // Slow light currents and floating highlights; photographs stay stationary.
  const canvas = document.getElementById('light-field');
  const ctx = canvas.getContext('2d');
  let width=1,height=1;
  const particles=Array.from({length:32},(_,i)=>({
    x:((i*73+17)%101)/101,y:((i*47+23)%103)/103,
    speed:.008+(i%5)*.002,r:.65+(i%4)*.38,phase:i*1.713
  }));
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    width=hero.clientWidth;height=hero.clientHeight;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function draw(){
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation='screen';
    // A broad, breathing pool of light across the artwork, without image warping.
    const cx=width*(.73+Math.sin(elapsed*.11)*.12+px*.06);
    const cy=height*(.40+Math.cos(elapsed*.13)*.12+py*.04);
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,width*.42);
    glow.addColorStop(0,'rgba(236,201,135,0.10)');
    glow.addColorStop(.45,'rgba(158,208,204,0.035)');
    glow.addColorStop(1,'rgba(158,208,204,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    // Long, gently changing caustic curves skim the lower and right edges.
    for(let i=0;i<7;i++){
      const phase=elapsed*.16+i*.51;
      ctx.beginPath();
      for(let j=0;j<=90;j++){
        const u=j/90;
        const x=width*(.28+u*.84)+px*10;
        const y=height*(.86-u*.38+Math.sin(u*6+phase)*.055+Math.sin(u*3-phase*.7)*.055+i*.012);
        if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      const line=ctx.createLinearGradient(width*.28,0,width,0);
      line.addColorStop(0,'rgba(232,207,158,0)');
      line.addColorStop(.45,'rgba(232,207,158,0.025)');
      line.addColorStop(.8,'rgba(232,207,158,0.15)');
      line.addColorStop(1,'rgba(151,220,211,0)');
      ctx.strokeStyle=line;ctx.lineWidth=1+i*.25;
      ctx.shadowColor='rgba(224,200,149,.35)';ctx.shadowBlur=9;ctx.stroke();
    }
    ctx.shadowBlur=0;
    for(const p of particles){
      const x=width*(p.x+Math.sin(elapsed*.12+p.phase)*.018)+px*12;
      const y=height*(1-((p.y+elapsed*p.speed)%1));
      const envelope=Math.sin(Math.PI*y/height);
      const alpha=(.13+.16*(.5+.5*Math.sin(elapsed*.6+p.phase)))*envelope;
      const halo=ctx.createRadialGradient(x,y,0,x,y,p.r*6);
      halo.addColorStop(0,`rgba(255,229,176,${alpha})`);
      halo.addColorStop(.2,`rgba(255,229,176,${alpha*.45})`);
      halo.addColorStop(1,'rgba(255,229,176,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,p.r*6,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }
  canvas.dataset.renderer=ctx?'light-atmosphere':'static';
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
  resize(); sync();
  addEventListener('resize',resize,{passive:true});
})();
