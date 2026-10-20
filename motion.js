"use strict";
(() => {
  const root=document.documentElement;
  const finePointer=matchMedia("(hover: hover) and (pointer: fine)");
  const scenes=[];
  const glyphs=" .,:;=+*#%@";
  let clock=0,lastTime=0,animationId=0,scrollDirty=true;

  // Shared character renderer: all illustrations are made from glyphs, not paths or images.
  class AsciiScene {
    constructor(canvas) {
      this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:false});
      this.kind=canvas.dataset.ascii;this.visible=false;this.pointer={x:0,y:0};
      this.width=0;this.height=0;this.columns=0;this.rows=0;this.cellX=7;this.cellY=10;
      this.palette=this.kind==="radar"?[218,129,83]:[167,192,129];
      this.background={monogram:"#111210",shield:"#1b2116",network:"#1f241b",radar:"#291e18",sphere:"#171d13"}[this.kind];
      this.points=this.kind==="monogram"?makeMonogram():this.kind==="shield"?makeShield():this.kind==="sphere"?makeSphere():[];
      if(!this.ctx)return;
      new ResizeObserver(()=>this.resize()).observe(canvas);
      canvas.parentElement.addEventListener("pointermove",event=>{
        if(reducedMotion||!finePointer.matches)return;
        const rect=canvas.getBoundingClientRect();
        this.pointer.x=(event.clientX-rect.left)/rect.width-.5;
        this.pointer.y=(event.clientY-rect.top)/rect.height-.5;
      },{passive:true});
      canvas.parentElement.addEventListener("pointerleave",()=>{this.pointer.x=0;this.pointer.y=0;});
    }
    resize(){
      if(!this.ctx)return;
      const rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;
      const ratio=Math.min(devicePixelRatio||1,1.5);
      this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);
      this.ctx.setTransform(ratio,0,0,ratio,0,0);
      this.cellX=this.kind==="monogram"?7.5:Math.max(5.5,this.width/72);
      this.cellY=this.cellX*1.45;
      this.columns=Math.ceil(this.width/this.cellX);this.rows=Math.ceil(this.height/this.cellY);
      this.depth=new Float32Array(this.columns*this.rows);this.light=new Float32Array(this.columns*this.rows);
      this.codes=new Uint8Array(this.columns*this.rows);
      this.draw(clock);
    }
    clear(){
      const ctx=this.ctx;ctx.fillStyle=this.background;ctx.fillRect(0,0,this.width,this.height);
      ctx.font=`${this.cellY*.84}px "Courier New",monospace`;ctx.textBaseline="middle";
      this.depth.fill(-Infinity);this.light.fill(0);this.codes.fill(0);
      for(let y=1;y<this.rows;y+=3)for(let x=1;x<this.columns;x+=3){
        const random=Math.sin(x*127.1+y*311.7)*43758.5453;
        if(random-Math.floor(random)>.65){
          ctx.fillStyle=this.kind==="radar"?"#453126":"#35412a";
          ctx.fillText(".",x*this.cellX,y*this.cellY);
        }
      }
    }
    put(x,y,light=.6,code=0,depth=1){
      x=Math.round(x/this.cellX);y=Math.round(y/this.cellY);
      if(x<0||x>=this.columns||y<0||y>=this.rows)return;
      const i=y*this.columns+x;
      if(depth<this.depth[i])return;
      this.depth[i]=depth;this.light[i]=Math.max(.06,Math.min(1,light));this.codes[i]=code;
    }
    line(x1,y1,x2,y2,light,code=0){
      const count=Math.ceil(Math.hypot(x2-x1,y2-y1)/3);
      for(let i=0;i<=count;i++){const p=count?i/count:0;this.put(x1+(x2-x1)*p,y1+(y2-y1)*p,light,code);}
    }
    flush(){
      const ctx=this.ctx;
      const special=["","+","*","/","|","-","@"];
      // Quantize the palette, keeping a consistent phosphor-like texture.
      for(let y=0;y<this.rows;y++)for(let x=0;x<this.columns;x++){
        const i=y*this.columns+x;if(!this.light[i])continue;
        const intensity=this.light[i];
        const palette=this.codes[i]===6?[222,231,202]:this.palette;
        const [r,g,b]=palette.map(channel=>Math.round(channel*(.24+.76*intensity)));
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillText(special[this.codes[i]]||glyphs[Math.min(9,Math.max(1,Math.round(intensity*9)))],x*this.cellX,y*this.cellY);
      }
    }
    draw(time){
      if(!this.ctx||!this.width||!this.height)return;
      this.clear();
      if(this.kind==="network")this.network(time);
      else if(this.kind==="radar")this.radar(time);
      else this.sculpture(time);
      this.flush();
    }
    sculpture(time){
      const hero=this.kind==="monogram",shield=this.kind==="shield",sphere=this.kind==="sphere";
      const ay=hero?-.48+Math.sin(time*.00018)*.23:shield?Math.sin(time*.0003)*.34:time*.00013;
      const ax=hero?-.16:shield?-.1:.22;
      const az=hero?-.14:shield?-.06:Math.sin(time*.00008)*.08;
      const cy=Math.cos(ay+this.pointer.x*.18),sy=Math.sin(ay+this.pointer.x*.18);
      const cx=Math.cos(ax+this.pointer.y*.12),sx=Math.sin(ax+this.pointer.y*.12),cz=Math.cos(az),sz=Math.sin(az);
      const scale=hero?Math.min(this.height*.208,this.width*.17):Math.min(this.width,this.height)*(sphere?.34:.29);
      const ox=this.width*(hero?.735:.5),oy=this.height*(hero?.48:.46);
      const float=hero?Math.sin(time*.0006)*5:Math.sin(time*.0008)*4;
      for(let i=0;i<this.points.length;i++){
        const [px,py,pz,nx,ny,nz,kind]=this.points[i];
        let x=px*cy+pz*sy,z=-px*sy+pz*cy,y=py*cx-z*sx;z=py*sx+z*cx;
        const rx=x*cz-y*sz,ry=x*sz+y*cz,perspective=5/(5-z);
        const nnx=nx*cy+nz*sy,nnz=-nx*sy+nz*cy,nny=ny*cx-nnz*sx,rz=ny*sx+nnz*cx;
        let light=Math.max(.16,nnx*-.4+nny*-.5+rz*.7)+.1;
        if(sphere)light=.35+(z+1.2)*.25;
        if(shield&&kind===2)light=.95;
        const scan=shield?Math.max(0,1-Math.abs(py-Math.sin(time*.0006)*1.4)*6)*.3:0;
        this.put(ox+rx*scale*perspective,oy+ry*scale*perspective+float,light+scan,kind===2?6:0,z);
      }
      if(sphere){
        for(let i=0;i<220;i++){const t=i/220*Math.PI*2,angle=time*.00016;
          const x=Math.cos(t)*scale*1.45,y=Math.sin(t)*scale*.35;
          this.put(ox+x*Math.cos(angle)-y*Math.sin(angle),oy+x*Math.sin(angle)+y*Math.cos(angle),.4,1,2);
        }
      }
    }
    network(time){
      const ox=this.width*.5,oy=this.height*.46,s=Math.min(this.width,this.height)*.31;
      const nodes=[[0,0],[-.9,-.65],[.85,-.8],[-1.03,.62],[.95,.65],[0,1.05],[.1,-1.08]];
      const edges=[[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[6,2],[1,3],[3,5],[5,4],[4,2]];
      const rotation=Math.sin(time*.00017)*.14+this.pointer.x*.08;
      const positions=nodes.map(([x,y],index)=>[ox+(x*Math.cos(rotation)-y*Math.sin(rotation))*s,oy+(x*Math.sin(rotation)+y*Math.cos(rotation))*s+Math.sin(time*.0006+index)*3]);
      edges.forEach(([a,b],index)=>{
        const [x1,y1]=positions[a],[x2,y2]=positions[b];
        this.line(x1,y1,x2,y2,.5,index%2?3:1);
        const p=(time*.00015+index*.17)%1;
        this.put(x1+(x2-x1)*p,y1+(y2-y1)*p,.95,2,2);
      });
      positions.forEach(([x,y],index)=>{
        const size=index===0?20:14;
        this.line(x-size,y-size,x+size,y-size,.95,5);this.line(x-size,y+size,x+size,y+size,.95,5);
        this.line(x-size,y-size,x-size,y+size,.95,4);this.line(x+size,y-size,x+size,y+size,.95,4);
        this.put(x,y,index===0?1:.9,6,3);
      });
    }
    radar(time){
      const ox=this.width*.5,oy=this.height*.46,s=Math.min(this.width,this.height)*.34;
      const sweep=time*.00065;
      for(let row=0;row<this.rows;row++)for(let col=0;col<this.columns;col++){
        const x=(col*this.cellX-ox)/s,y=(row*this.cellY-oy)/s,r=Math.hypot(x,y);
        if(r>1.08)continue;
        const angle=(Math.atan2(y,x)+Math.PI*2)%(Math.PI*2);
        const behind=(sweep-angle+Math.PI*12)%(Math.PI*2);
        const onRing=Math.min(...[.3,.6,.9,1.04].map(radius=>Math.abs(r-radius)))<.026;
        const cross=Math.abs(x)<.018||Math.abs(y)<.018;
        if(onRing||cross||behind<.4){
          this.put(col*this.cellX,row*this.cellY,onRing?.65:cross?.4:.3+(.4-behind)*1.4,onRing?0:1);
        }
      }
      [[.45,-.3],[-.5,-.48],[-.12,.64]].forEach(([x,y])=>{
        const angle=Math.atan2(y,x),pulse=(Math.cos(sweep-angle)+1)/2;
        this.put(ox+x*s,oy+y*s,.7+pulse*.3,6,3);
      });
      this.put(ox,oy,1,1,4);
    }
  }
  function makeMonogram(){
    const points=[];
    function box(cx,cy,cz,sx,sy,sz){
      const step=.058;
      for(let a=-1;a<=1;a+=2){
        for(let u=-sy/2;u<=sy/2;u+=step)for(let v=-sz/2;v<=sz/2;v+=step)points.push([cx+a*sx/2,cy+u,cz+v,a,0,0,0]);
        for(let u=-sx/2;u<=sx/2;u+=step)for(let v=-sz/2;v<=sz/2;v+=step)points.push([cx+u,cy+a*sy/2,cz+v,0,a,0,0]);
        for(let u=-sx/2;u<=sx/2;u+=step)for(let v=-sy/2;v<=sy/2;v+=step)points.push([cx+u,cy+v,cz+a*sz/2,0,0,a,0]);
      }
    }
    box(-.85,0,0,.64,3.15,.85);box(.85,0,0,.64,3.15,.85);box(0,0,0,1.1,.65,.85);return points;
  }
  function makeShield(){
    const points=[];
    // Curved face tapering to a point, with a raised character checkmark.
    for(let y=-1.25;y<=1.25;y+=.045){
      const edge=y<.1?.94:.94*Math.pow(Math.max(0,(1.25-y)/1.15),.6);
      for(let x=-edge;x<=edge;x+=.04){
        const z=.18+Math.max(0,1-(x/.95)**2)*.22;
        const border=Math.abs(x)>edge-.09||y< -1.16||y>1.16;
        if(border||Math.round((x+1)*25)%2===0)points.push([x,y,z,x*.3,-.2,1,0]);
      }
    }
    const segments=[[-.42,.05,-.12,.35],[-.12,.35,.46,-.38]];
    segments.forEach(([x1,y1,x2,y2])=>{for(let t=0;t<=1;t+=.025)for(let offset=-.04;offset<=.04;offset+=.04)points.push([x1+(x2-x1)*t,y1+(y2-y1)*t+offset,.5,0,0,1,2]);});
    return points;
  }
  function makeSphere(){
    const points=[];
    for(let latitude=-Math.PI/2;latitude<=Math.PI/2;latitude+=.15)
      for(let longitude=0;longitude<Math.PI*2;longitude+=.035){
        const x=Math.cos(latitude)*Math.cos(longitude),y=Math.sin(latitude),z=Math.cos(latitude)*Math.sin(longitude);
        points.push([x,y,z,x,y,z,0]);
      }
    for(let longitude=0;longitude<Math.PI*2;longitude+=Math.PI/8)
      for(let latitude=-Math.PI/2;latitude<=Math.PI/2;latitude+=.035){
        const x=Math.cos(latitude)*Math.cos(longitude),y=Math.sin(latitude),z=Math.cos(latitude)*Math.sin(longitude);
        points.push([x,y,z,x,y,z,0]);
      }
    return points;
  }
  const visibility=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const scene=scenes.find(item=>item.canvas===entry.target);if(scene){scene.visible=entry.isIntersecting;if(entry.isIntersecting)scene.draw(clock);}});
    schedule();
  },{rootMargin:"50px",threshold:0});
  $$("[data-ascii]").forEach(canvas=>{const scene=new AsciiScene(canvas);scenes.push(scene);visibility.observe(canvas);});

  // Only one animation loop; off-screen canvases, hidden tabs, dialogs and reduced motion do no rendering work.
  function canAnimate(){return !reducedMotion&&!document.hidden&&!dialog.open&&scenes.some(scene=>scene.visible);}
  function schedule(){if(!animationId&&canAnimate())animationId=requestAnimationFrame(tick);}
  function tick(time){
    animationId=0;if(!canAnimate())return;
    if(time-lastTime>=65){
      clock+=Math.min(time-lastTime,100);lastTime=time;
      scenes.forEach(scene=>{if(scene.visible)scene.draw(clock);});
    }
    schedule();
  }
  document.addEventListener("visibilitychange",schedule);
  document.addEventListener("hugeware:motion",()=>{
    if(reducedMotion&&animationId){cancelAnimationFrame(animationId);animationId=0;}
    if(reducedMotion)$$(".reveal").forEach(element=>element.classList.add("is-visible"));
    schedule();
  });
  new MutationObserver(schedule).observe(dialog,{attributes:true,attributeFilter:["open"]});
  dialog.addEventListener("close",schedule);
  schedule();

  // Content remains visible if scripting fails; reveal enhancement activates only after setup succeeds.
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("is-visible");revealObserver.unobserve(entry.target);}
    });
  },{threshold:.1});
  $$(".service-grid, .journal-grid, .process-steps").forEach(group=>{
    $$(".reveal",group).forEach((element,index)=>element.style.setProperty("--reveal-delay",`${Math.min(index*110,220)}ms`));
  });
  $$(".reveal").forEach(element=>revealObserver.observe(element));
  document.addEventListener("focusin",event=>{
    const reveal=event.target.closest?.(".reveal");if(reveal)reveal.classList.add("is-visible");
  });
  root.classList.add("motion-ready");
  if(reducedMotion)$$(".reveal").forEach(element=>element.classList.add("is-visible"));

  $$(".service-card").forEach(card=>{
    const art=$(".service-art",card);
    card.addEventListener("pointermove",event=>{
      if(reducedMotion||!finePointer.matches)return;
      const rect=art.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
      art.style.setProperty("--tilt-x",`${-y*5}deg`);art.style.setProperty("--tilt-y",`${x*5}deg`);
      art.style.setProperty("--light-x",`${(x+.5)*100}%`);art.style.setProperty("--light-y",`${(y+.5)*100}%`);
    },{passive:true});
    card.addEventListener("pointerleave",()=>{art.style.setProperty("--tilt-x","0deg");art.style.setProperty("--tilt-y","0deg");});
  });
  $$(".button").forEach(button=>{
    button.addEventListener("pointermove",event=>{
      if(reducedMotion||!finePointer.matches)return;
      const rect=button.getBoundingClientRect();
      button.style.setProperty("--magnet-x",`${((event.clientX-rect.left)/rect.width-.5)*7}px`);
      button.style.setProperty("--magnet-y",`${((event.clientY-rect.top)/rect.height-.5)*5}px`);
    },{passive:true});
    button.addEventListener("pointerleave",()=>{button.style.setProperty("--magnet-x","0px");button.style.setProperty("--magnet-y","0px");});
  });
  function updateScroll(){
    scrollDirty=false;
    const max=document.documentElement.scrollHeight-innerHeight;
    $(".reading-progress").style.transform=`scaleX(${max>0?Math.max(0,Math.min(1,scrollY/max)):0})`;
  }
  addEventListener("scroll",()=>{if(!scrollDirty){scrollDirty=true;requestAnimationFrame(updateScroll);}},{passive:true});
  addEventListener("resize",updateScroll,{passive:true});updateScroll();
})();
