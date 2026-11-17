/* 几何动作示意：每种绘制方法对应一个动作概念，统一调度只绘制屏幕内的画布。 */
window.MotionAtlas = (() => {
  const scenes = new Map();
  const imageBuffers = new WeakMap();
  let frame = 0;
  let previous = 0;
  const TAU = Math.PI * 2;
  const ink = '#3e5874', mid = '#91a9c1', light = '#c8d5e2', pale = '#e8eef4';
  const smooth = n => { n = Math.max(0, Math.min(1, n)); return n*n*(3-2*n); };
  const wave = t => (1-Math.cos(t*TAU))/2;
  function rect(c,x,y,w,h,color=ink) { c.fillStyle=color; c.fillRect(x,y,w,h); }
  function circle(c,x,y,r,color=ink) { c.beginPath(); c.arc(x,y,r,0,TAU); c.fillStyle=color; c.fill(); }
  function line(c,points,color=ink,width=2) { c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.strokeStyle=color; c.lineWidth=width; c.stroke(); }
  function text(c,s,x,y,size=11,color=ink,align='center') { c.fillStyle=color; c.font=`${size}px -apple-system, "PingFang SC", sans-serif`; c.textAlign=align; c.fillText(s,x,y); }
  function tile(c,x,y,w=54,h=65,angle=0,alpha=1,label='') { c.save(); c.translate(x,y); c.rotate(angle); c.globalAlpha*=alpha; rect(c,-w/2,-h/2,w,h,'#fff'); c.strokeStyle=mid; c.lineWidth=1; c.strokeRect(-w/2,-h/2,w,h); circle(c,w*.13,-h*.08,w*.16,light); line(c,[[-w*.36,h*.30],[-w*.1,0],[w*.3,h*.30]],mid,2); if(label)text(c,label,-w*.27,-h*.27,7,mid); c.restore(); }
  function figure(c,x,y,phase=0,color=ink,scale=1) { c.save(); c.translate(x,y); c.scale(scale,scale); const k=Math.sin(phase*TAU)*12; circle(c,0,-34,8,color); line(c,[[0,-25],[0,0]],color,4); line(c,[[-17,-6+k*.3],[0,-20],[17,-6-k*.3]],color,3); line(c,[[-14+k,25],[0,0],[14-k,25]],color,3); c.restore(); }
  function corridor(c,z=0) { c.strokeStyle=light; c.lineWidth=1; for(let i=0;i<6;i++){let s=((i/6+z)%1);const w=34+280*s*s,h=22+140*s*s;c.strokeRect(200-w/2,121-h/2,w,h);} line(c,[[40,54],[200,121],[360,54]],light,1); line(c,[[40,196],[200,121],[360,196]],light,1); }
  function arrow(c,x1,y1,x2,y2,color=mid) { const a=Math.atan2(y2-y1,x2-x1);line(c,[[x1,y1],[x2,y2],[x2-6*Math.cos(a-.5),y2-6*Math.sin(a-.5)]],color,1.5);line(c,[[x2,y2],[x2-6*Math.cos(a+.5),y2-6*Math.sin(a+.5)]],color,1.5); }
  function imageScene(c,variant=0) { rect(c,62,63,276,134,variant?pale:'#d8e4ee');circle(c,variant?140:270,103,26,variant?mid:light);c.beginPath();c.moveTo(62,197);c.lineTo(variant?240:150,95);c.lineTo(338,197);c.fillStyle=variant?light:mid;c.fill(); }
  const painters = {
    'spin-disc'(c,t) { const a=t*TAU*3; c.save();c.translate(200,122);c.scale(Math.max(.04,Math.abs(Math.cos(a))),1);circle(c,0,0,63,'#fff');c.strokeStyle=light;c.lineWidth=2;c.stroke();if(Math.cos(a)>0){circle(c,-5,1,12,ink);line(c,[[-9,4],[-26,12],[-20,-3]],ink,3);text(c,'鸟',0,40);}else{for(let x=-29;x<=29;x+=14)line(c,[[x,-31],[x,31]],mid,2);line(c,[[-35,-32],[35,-32],[35,32],[-35,32],[-35,-32]],mid,2);text(c,'笼',0,48);}c.restore();line(c,[[66,122],[133,122]],mid);line(c,[[267,122],[334,122]],mid); },
    flipbook(c,t) { for(let i=6;i>=0;i--)tile(c,171+i*5,124-i*3,102,111,-.06);const p=Math.floor(wave(t)*18)/18;circle(c,148+55*wave(p),120,12,ink); },
    'light-fade'(c,t) { const n=wave(t);rect(c,58,54,284,144,'#35485e');rect(c,58,54,284,144,`rgba(213,229,244,${n*.7})`);for(let i=0;i<5;i++){rect(c,80+i*52,100-i%2*20,24,98,`rgba(47,67,86,${.45+n*.4})`);}circle(c,275,81,16,`rgba(249,250,244,${.1+n*.9})`); },
    crossfade(c,t) { imageScene(c);c.save();c.globalAlpha=wave(t);imageScene(c,1);c.restore(); },
    wipe(c,t) { imageScene(c);const x=62+276*wave(t);c.save();c.beginPath();c.rect(62,63,x-62,134);c.clip();imageScene(c,1);c.restore();line(c,[[x,63],[x,197]],ink,2); },
    reverse(c,t) { const p=wave(t);line(c,[[65,165],[335,165]],light);circle(c,75+250*p,148-65*Math.sin(p*Math.PI),16,ink);arrow(c,110,188,290,188);text(c,t<.5?'正向运动':'反向运动',200,77); },
    'stop-motion'(c,t) { const p=Math.floor(wave(t)*9)/9;line(c,[[60,170],[340,170]],light);rect(c,70+230*p,124-26*Math.sin(p*Math.PI*2),34,34,ink);for(let i=0;i<9;i++)circle(c,77+i*29,190,2,light);text(c,'位置一格一格地改变',200,78); },
    rotoscope(c,t) { figure(c,125,135,t,light,1.3);figure(c,270,135,t,ink,1.3);arrow(c,174,120,219,120);text(c,'实拍动作',125,191);text(c,'逐帧描线',270,191); },
    iris(c,t) { imageScene(c);c.save();c.beginPath();c.rect(62,63,276,134);c.arc(200,130,8+152*wave(t),0,TAU,true);c.fillStyle=pale;c.fill('evenodd');c.restore(); },
    'split-screen'(c,t) { rect(c,61,63,135,134,'#d8e3ed');rect(c,204,63,135,134,'#e3e9ef');circle(c,126+22*Math.sin(t*TAU),130,21,ink);rect(c,248,101+20*Math.sin(t*TAU),34,34,mid);line(c,[[200,60],[200,200]],'#fff',4); },
    speed(c,t) { line(c,[[58,108],[342,108]],light);line(c,[[58,167],[342,167]],light);circle(c,70+260*wave(t),108,11,mid);const p=wave(t);circle(c,70+260*(p<.5?p*p*2:1-2*(1-p)*(1-p)),167,11,ink);text(c,'匀速',48,111,8,mid);text(c,'变速',48,170,8,ink); },
    silhouette(c,t) { rect(c,55,55,290,146,'#d6e2ed');figure(c,195+55*Math.sin(t*TAU),137,t,'#25384d',1.25); },
    parallax(c,t) { const n=Math.sin(t*TAU);rect(c,55,58,290,142,'#e4ebf2');circle(c,265+n*7,92,17,light);for(let i=0;i<4;i++)rect(c,82+i*72+n*15,103,37,97,mid);rect(c,65+n*34,145,88,55,ink);rect(c,274+n*34,155,48,45,ink); },
    strobe(c,t) { line(c,[[60,175],[340,175]],light);for(let i=0;i<6;i++){const a=(Math.floor(t*6)===i)?1:.19;figure(c,80+i*48,139,.1*i,`rgba(62,88,116,${a})`,.75);}text(c,'分段曝光，留下多个位置',200,78); },
    'dolly-zoom'(c,t) { corridor(c,wave(t)*.2);const n=wave(t);for(let i=0;i<3;i++)tile(c,90+i*110,120,26+42*n,45+60*n,0,.65);figure(c,200,147,0,ink,1.1); },
    'whip-pan'(c,t) { const p=wave(t);c.save();c.beginPath();c.rect(55,60,290,140);c.clip();for(let i=0;i<8;i++){const x=70+i*85-p*360;rect(c,x,87+i%2*20,45,115,i%2?mid:light);if(p>.25&&p<.75)for(let j=0;j<5;j++)rect(c,x-j*12,100,50,2,'#b7c9d9');}c.restore();arrow(c,145,208,260,208); },
    type(c,t) { const p=wave(t);c.save();c.translate(200,128);c.rotate(Math.sin(t*TAU)*.10);c.scale(.7+p*.4,.7+p*.4);text(c,'MOVE',Math.sin(t*TAU)*48,0,40,ink);c.restore();text(c,'字也可以成为主角',200,198); },
    freeze(c,t) { let p=t<.27?t/.27*.45:t<.67?.45:.45+(t-.67)/.33*.55;figure(c,74+p*250,137,p,ink,1);line(c,[[60,175],[340,175]],light);if(t>.27&&t<.67){rect(c,177,64,6,14,mid);rect(c,188,64,6,14,mid);} },
    particles(c,t) { for(let i=0;i<45;i++){const a=i*2.4,r=((t+i/45)%1)*95;circle(c,200+Math.cos(a)*r,128+Math.sin(a)*r*.62,2+(i%3),i%3?mid:ink);}circle(c,200,128,5,ink); },
    'rack-focus'(c,t) { const p=wave(t);c.save();c.filter=`blur(${p*5}px)`;tile(c,136,135,77,93);c.restore();c.save();c.filter=`blur(${(1-p)*5}px)`;tile(c,270,102,48,60);c.restore(); },
    'jump-cut'(c,t) { const p=Math.min(3,Math.floor(wave(t)*4));figure(c,95+[0,65,135,200][p],135,.1*p,ink,1);for(let i=0;i<4;i++){rect(c,94+i*57,190,43,4,i===p?ink:light);}text(c,'省掉中间过程，直接跳到下一刻',200,75); },
    'crash-zoom'(c,t) { const z=1+smooth(Math.sin(t*Math.PI))*2; c.save();c.beginPath();c.rect(55,60,290,140);c.clip();c.translate(200,132);c.scale(z,z);tile(c,0,0,70,85);c.restore(); },
    'match-cut'(c,t) { const p=wave(t);rect(c,60,60,280,140,p>.5?'#d7e2ec':'#e8edf2');circle(c,200,125,35,p>.5?mid:ink);if(p>.5){line(c,[[200,160],[200,191]],ink,3);line(c,[[200,174],[175,166]],ink,2);}else{line(c,[[167,125],[233,125]],light,2);line(c,[[200,92],[200,158]],light,2);} },
    sand(c,t) { const p=wave(t);for(let i=0;i<105;i++){const a=i*2.399,r=4*Math.sqrt(i),x=200+Math.cos(a)*r*(1+p),y=128+Math.sin(a)*r*(1-p*.6);circle(c,x,y,1.5,mid);} },
    wave(c,t) { for(let row=0;row<7;row++){const points=[];for(let x=55;x<=345;x+=3)points.push([x,75+row*17+Math.sin(x/30+t*TAU+row*.5)*13]);line(c,points,row%2?light:mid,2);} },
    feedback(c,t) { c.save();c.translate(200,128);for(let i=0;i<9;i++){c.rotate(.045+wave(t)*.035);c.strokeStyle=i%2?mid:light;c.lineWidth=2;const w=250*Math.pow(.76,i),h=137*Math.pow(.76,i);c.strokeRect(-w/2,-h/2,w,h);}c.restore(); },
    'camera-orbit'(c,t) { const a=t*TAU;line(c,[[85,153],[200,190],[315,153],[200,112],[85,153]],light,1);const objects=[{x:200+Math.cos(a)*95,y:126+Math.sin(a)*25,s:1+Math.sin(a)*.25},{x:200+Math.cos(a+Math.PI)*95,y:126+Math.sin(a+Math.PI)*25,s:1+Math.sin(a+Math.PI)*.25}].sort((a,b)=>a.y-b.y);objects.forEach(o=>tile(c,o.x,o.y,48*o.s,60*o.s,0,1));figure(c,200,140,0,ink,.8); },
    morph(c,t) { const p=wave(t),points=[];for(let i=0;i<=80;i++){const a=i/80*TAU,rr=43/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));const r=43*(1-p)+rr*p;points.push([200+Math.cos(a)*r,126+Math.sin(a)*r]);}c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=mid;c.fill(); },
    timelapse(c,t) { rect(c,55,58,290,144,'#e3ebf3');circle(c,75+t*250,170-Math.sin(t*Math.PI)*85,18,mid);for(let i=0;i<4;i++)rect(c,92+i*65,145-i%2*30,36,57+i%2*30,ink); },
    glitch(c,t) { imageScene(c);for(let i=0;i<9;i++){const x=62+(i*37+Math.floor(t*14)*11)%245,y=75+i*13;rect(c,x,y,20+i%4*13,6,i%2?light:ink);}line(c,[[75+wave(t)*230,63],[85+wave(t)*230,197]],'#839cb4',5); },
    crt(c,t) { imageScene(c);for(let y=63;y<197;y+=4)rect(c,62,y,276,1,'#475e7435');rect(c,62,63+(t*134)%134,276,5,'#f6f9fc90');c.strokeStyle=ink;c.strokeRect(58,59,284,142); },
    fractal(c,t) { const n=.65+wave(t)*.35;for(let i=0;i<5;i++){const r=68*Math.pow(n*.7,i);for(let j=0;j<5;j++)circle(c,200+Math.cos(j*TAU/5)*r,128+Math.sin(j*TAU/5)*r,r*.26,i%2?light:mid);} },
    noise(c,t) { for(let row=0;row<14;row++)for(let col=0;col<30;col++){const n=Math.sin(row*47+col*19+Math.floor(wave(t)*15)*13)*10000;const v=Math.floor((n-Math.floor(n))*120)+110;rect(c,60+col*9.4,64+row*9.4,9,9,`rgb(${v-12},${v},${v+12})`);} },
    pixel(c,t) { const n=4+Math.floor(wave(t)*13),size=260/n;for(let x=0;x<n;x++)for(let y=0;y<Math.ceil(130/size);y++){const inside=Math.hypot(x-n*.6,y-n*.2)<n*.25;rect(c,70+x*size,64+y*size,size-1,size-1,inside?ink:(x+y)%3?light:mid);} },
    palette(c,t) { const colors=['#dce5ee','#aebfd0','#7693b0','#3e5874'];for(let i=0;i<12;i++)for(let j=0;j<6;j++)rect(c,80+i*20,65+j*20,20,20,colors[(i+j+Math.floor(t*8))%4]); },
    'spinning-sprite'(c,t) { const p=wave(t);tile(c,80+240*p,134,30+55*p,36+66*p,0,1); },
    'bullet-time'(c,t) { figure(c,200,132,.2,ink,1.2);const a=t*TAU;for(let i=0;i<10;i++){const angle=i/10*TAU,x=200+Math.cos(angle)*115,y=142+Math.sin(angle)*35;circle(c,x,y,4,i===Math.floor(t*10)?ink:light);}arrow(c,200+Math.cos(a)*115,142+Math.sin(a)*35,200,132); },
    fluid(c,t) { c.beginPath();c.moveTo(55,196);for(let x=55;x<=345;x+=3)c.lineTo(x,130+Math.sin(x/32+t*TAU)*14+Math.sin(x/57-t*TAU)*8);c.lineTo(345,196);c.closePath();c.fillStyle=mid;c.fill();for(let i=0;i<6;i++){const a=t*TAU+i;circle(c,80+i*43,119+Math.sin(a)*18,3,light);} },
    'motion-capture'(c,t) { figure(c,200,132,t,mid,1.2);const k=Math.sin(t*TAU)*12;[[200,91],[200,108],[200,132],[180,125+k*.3],[220,125-k*.3],[184+k,162],[216-k,162]].forEach(p=>circle(c,...p,3,ink)); },
    echo(c,t) { for(let i=6;i>=0;i--){const a=t*TAU-i*.16;circle(c,200+Math.sin(a)*105,128+Math.cos(a)*26,16,`rgba(62,88,116,${1-i*.12})`);} },
    flow(c,t) { for(let y=75;y<=170;y+=24)for(let x=75;x<=320;x+=32){const a=t*TAU+x/130;arrow(c,x,y,x+Math.cos(a)*17,y+Math.sin(a)*9,mid);}circle(c,200+Math.sin(t*TAU)*58,130,18,ink); },
    rain(c,t) { for(let x=0;x<16;x++)for(let y=0;y<8;y++){const a=(y*19+t*145+x*11)%140;text(c,String((x*7+y*3)%10),75+x*17,62+a,9,y%3?mid:ink);} },
    diffusion(c,t) { const p=wave(t);imageScene(c);c.save();c.globalAlpha=p;for(let i=0;i<320;i++){const x=62+(Math.sin(i*17)*.5+.5)*276,y=63+(Math.cos(i*31)*.5+.5)*134;rect(c,x,y,7,7,i%3?light:ink);}c.restore(); },
    grow(c,t) { const p=wave(t);line(c,[[200,194],[200,175-p*80]],ink,3);for(let i=0;i<5;i++){const q=smooth((p-i*.13)*3),y=174-i*17;line(c,[[200,y],[200+(i%2?-1:1)*35*q,y-22*q]],mid,2);circle(c,200+(i%2?-1:1)*35*q,y-22*q,5*q,light);} },
    scroll(c,t) { c.save();c.beginPath();c.rect(90,60,220,140);c.clip();for(let i=0;i<8;i++)rect(c,107,63+((i*24+t*90)%170)-24,170-i%3*25,7,i%2?light:mid);c.restore();c.strokeStyle=mid;c.strokeRect(90,60,220,140); },
    'mask-reveal'(c,t) { imageScene(c);c.save();c.beginPath();c.arc(70+260*wave(t),130,43,0,TAU);c.clip();imageScene(c,1);c.restore();c.strokeStyle=ink;c.beginPath();c.arc(70+260*wave(t),130,43,0,TAU);c.stroke(); },
    track(c,t) { const x=200+Math.sin(t*TAU)*95,y=125+Math.cos(t*TAU)*20;circle(c,x,y,20,mid);c.setLineDash([4,3]);c.strokeStyle=ink;c.strokeRect(x-31,y-31,62,62);c.setLineDash([]);text(c,'跟踪对象',x,y-39,9); },
    'generative-morph'(c,t) { const p=wave(t);c.save();c.translate(200,130);c.rotate(p*.5);for(let i=0;i<6;i++){const a=i*TAU/6,r=20+p*25;circle(c,Math.cos(a)*r,Math.sin(a)*r,12+p*4,i%2?mid:light);}circle(c,0,0,19-p*10,ink);c.restore(); },
    'deal-in'(c,t) { for(let i=0;i<4;i++){const p=smooth((t-i*.06+1)%1),e=p<.8?smooth(p/.5):1-smooth((p-.8)/.2);const x=22+(100+i*68-22)*e,y=38+(135-38)*e-Math.sin(e*Math.PI)*65;tile(c,x,y,49,62,(1-e)*-.8+(i-1.5)*.06,e,String(i+1));} },
    'drop-gather'(c,t) { const p=wave(t);for(let i=0;i<7;i++){const keep=i>=2&&i<=4;const fall=smooth(p*3);const gather=smooth((p-.4)*2);const x=(64+i*44)*(1-gather)+(200+(i-3)*44)*gather;const y=20+fall*107+(!keep?gather*150:0);tile(c,x,y,43,55,(i-3)*.06,gather&& !keep?1-gather:1);} },
    'fly-through'(c,t) { corridor(c,t);const cards=[];for(let i=0;i<7;i++){const z=(i/7+t)%1;cards.push({z,x:200+(i%2?1:-1)*z*z*150,y:125+(z-.5)*16});}cards.sort((a,b)=>a.z-b.z).forEach(o=>tile(c,o.x,o.y,10+o.z*75,14+o.z*97,0,Math.sin(o.z*Math.PI))); },
    'flip-panels'(c,t) { const n=t*TAU;for(let i=0;i<4;i++){const a=n+i*Math.PI/2,y=130+Math.sin(a)*64,h=Math.max(3,Math.abs(Math.cos(a))*60);tile(c,200,y,130,h,0,.3+.7*Math.max(0,Math.cos(a)),String(i+1));} },
    lift(c,t) { const p=wave(t);for(let i=0;i<5;i++){if(i===2)continue;tile(c,200+(i-2)*(46+p*10),141,50,65,(i-2)*.09,1);}tile(c,200,141-28*p,50*(1+p*.3),65*(1+p*.3)); },
    'color-swap'(c,t) { const p=wave(t);rect(c,60,58,280,143,`rgb(${Math.round(218-60*p)},${Math.round(228-44*p)},${Math.round(237-30*p)})`);tile(c,200,130,65,90,0,1,p>.5?'02':'01'); }
  };
  const specific = {
    'rgb-split'(c,t) { const shift=3+wave(t)*10;for(const [dx,color] of [[-shift,'#ad6771'],[0,'#6b927e'],[shift,'#5f82a7']]){c.beginPath();c.arc(200+dx,124,43,0,TAU);c.strokeStyle=color;c.lineWidth=4;c.stroke();} },
    'digital-video-effects'(c,t) { const p=wave(t),yaw=p*Math.PI,w=Math.max(3,Math.abs(Math.cos(yaw))*164);tile(c,200,128,w,105,0,1,p>.5?'B':'A'); },
    'conways-game-of-life'(c,t) { const w=18,h=9;let grid=Array.from({length:h},()=>Array(w).fill(0));[[3,4],[4,4],[5,4],[10,3],[11,3],[10,4],[11,4],[13,6],[14,6],[15,6]].forEach(([x,y])=>grid[y][x]=1);const generation=Math.floor(t*8);for(let g=0;g<generation;g++)grid=grid.map((row,y)=>row.map((alive,x)=>{let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)n+=grid[(y+dy+h)%h][(x+dx+w)%w];return n===3||(alive&&n===2)?1:0;}));for(let y=0;y<h;y++)for(let x=0;x<w;x++)rect(c,66+x*15,61+y*15,13,13,grid[y][x]?ink:'#dce5ee'); },
    'crowd-simulation'(c,t) { circle(c,200,128,24,light);for(let i=0;i<22;i++){const p=(t+i/22)%1,x=45+p*310,side=i%2?1:-1,avoid=Math.exp(-Math.pow((x-200)/55,2))*37;const y=128+side*(12+(i%4)*6+avoid);circle(c,x,y,4,i%3?mid:ink);} },
    'frame-interpolation'(c,t) { const p=wave(t),q=Math.round(p*5)/5;line(c,[[70,107],[330,107]],light);line(c,[[70,162],[330,162]],light);circle(c,75+250*q,107,12,mid);circle(c,75+250*p,162,12,ink);text(c,'原帧',42,111,9,mid);text(c,'补帧',42,166,9,ink); },
    'cel-animation'(c,t) { imageScene(c);c.save();c.translate(200,130);const a=Math.floor(t*8)%4/4;circle(c,0,-30,9,'#fff');c.strokeStyle=ink;c.stroke();rect(c,-12,-18,24,41,mid);line(c,[[-10,20],[-18,45]],ink,4);line(c,[[10,20],[18,45]],ink,4);line(c,[[12,-13],[30,-25-a*25]],ink,4);c.restore(); },
    'direct-animation-on-film'(c,t) { rect(c,66,52,268,145,'#2c3b4c');for(let i=0;i<7;i++){rect(c,70+i*37,55,8,8,light);rect(c,70+i*37,185,8,8,light);}const f=Math.floor(t*12);for(let i=0;i<9;i++){let x=85+i*27;line(c,[[x,77+(f+i)%4*8],[x+13,159-(f*7+i*3)%54]],i%2?'#8faecb':'#d4dfeb',2+i%2);} },
    'block-glitch'(c,t) { imageScene(c);let off=imageBuffers.get(c);if(!off){off=document.createElement('canvas');off.width=400;off.height=250;imageScene(off.getContext('2d'));imageBuffers.set(c,off);}for(let i=0;i<7;i++){const y=70+i*16,shift=Math.sin(Math.floor(t*16)+i*2)*22;c.drawImage(off,75,y,240,12,75+shift,y,240,12);} },
    datamoshing(c,t) { const p=wave(t);imageScene(c);const x=90+p*220;for(let i=10;i>=0;i--){const dx=x-i*12;rect(c,dx,95+i%3*12,24,13,i%2?mid:light);}circle(c,x,129,19,ink); },
    'flicker-film'(c,t) { const on=Math.floor(t*8)%2;rect(c,60,58,280,142,on?'#b8c7d7':'#8097ae');text(c,on?'浅色画格':'深色画格',200,135,16,on?ink:'#edf3f7'); },
    cymatics(c,t) { const p=wave(t);for(let i=0;i<150;i++){const a=i/150*TAU;const gx=60+(Math.sin(i*17)*.5+.5)*280,gy=65+(Math.cos(i*31)*.5+.5)*130;const r=48+19*Math.cos(a*4),tx=200+Math.cos(a)*r,ty=130+Math.sin(a)*r*.75;circle(c,gx*(1-p)+tx*p,gy*(1-p)+ty*p,1.5,mid);} },
    animatronics(c,t) { const p=wave(t);line(c,[[200,192],[200,158]],mid,4);circle(c,200,160,5,ink);c.save();c.translate(200,123);c.rotate(Math.sin(t*TAU)*.18);rect(c,-40,-38,80,73,'#d4e0eb');const blink=1-smooth((Math.sin(t*TAU*2)-.75)*4);rect(c,-24,-12,13,Math.max(2,8*blink),ink);rect(c,11,-12,13,Math.max(2,8*blink),ink);c.save();c.translate(0,18);c.rotate(p*.25);rect(c,-30,0,60,12+10*p,mid);c.restore();circle(c,-37,24,3,ink);circle(c,37,24,3,ink);c.restore(); },
    'pulfrich-effect'(c,t) { const p=t*TAU,x=200+Math.sin(p)*95,delayed=200+Math.sin(p-.23)*95;circle(c,x,105,13,ink);circle(c,delayed,161,13,mid);text(c,'左眼',64,109,9);text(c,'右眼延迟',64,165,9);line(c,[[x,122],[delayed,144]],light,1); },
    'sprite-scaling'(c,t) { const p=wave(t),s=.25+p;tile(c,200,129,50*s,65*s);for(let i of [-1,1])tile(c,200+i*(40+p*130),135,24+p*55,32+p*70,0,1-p*.55); }
  };

  function cameraScene(c,t,mode) {
    c.save();
    if(mode==='shake'){c.translate(Math.sin(t*TAU*7)*5+Math.sin(t*TAU*3)*3,Math.cos(t*TAU*9)*4);c.translate(200,125);c.rotate(Math.sin(t*TAU*5)*.025);c.translate(-200,-125);}
    if(mode==='snorri')c.translate(Math.sin(t*TAU*2)*14,Math.cos(t*TAU*2)*6);
    if(mode==='steady')c.translate(Math.sin(t*TAU)*18,0);
    corridor(c,t);c.restore();
    if(mode==='snorri'){circle(c,200,114,25,mid);rect(c,173,140,54,45,ink);circle(c,190,110,2,ink);circle(c,210,110,2,ink);}else figure(c,200,143,t,ink,.85);
    
  }
  function speedCompare(c,t,mode) {
    const p=t;let q=mode==='slow'?t*.25:mode==='fast'?(Math.floor(t*36)%12)/12:t<.25?t*1.6:t<.75?.4+(t-.25)*.4:.6+(t-.75)*1.6;
    line(c,[[70,100],[337,100]],light);line(c,[[70,162],[337,162]],light);
    c.save();c.globalAlpha=Math.min(1,t*20,(1-t)*20);circle(c,75+250*p,100,12,mid);circle(c,75+250*q,162,12,ink);c.restore();
    text(c,'正常',44,104,9,mid);text(c,mode==='slow'?'慢放':mode==='fast'?'快放':'变速',44,166,9,ink);
    
  }
  function opticalWheel(c,t,mode) {
    const cx=148,cy=127,r=65;
    circle(c,cx,cy,r,'#d6e1eb');
    for(let i=0;i<10;i++){const a=i*TAU/10+t*TAU;const x=cx+Math.cos(a)*46,y=cy+Math.sin(a)*46;circle(c,x,y,3+i%3,mid);if(mode==='mirror'){line(c,[[cx+Math.cos(a)*20,cy+Math.sin(a)*20],[cx+Math.cos(a)*37,cy+Math.sin(a)*37]],ink,2);}else{line(c,[[cx+Math.cos(a)*57,cy+Math.sin(a)*57],[cx+Math.cos(a)*64,cy+Math.sin(a)*64]],ink,3);}}
    rect(c,251,78,74,99,'#fff');c.strokeStyle=mid;c.strokeRect(251,78,74,99);
    const phase=Math.floor(t*12)/12;figure(c,288,137,phase,ink,.65);
    if(mode==='drum'&&Math.sin(t*TAU*12)<-.3)rect(c,251,78,74,99,mid);
    text(c,mode==='mirror'?'中心镜环反射':'沿圆周排列动作',148,207,10);text(c,'观看窗',288,197,10);
  }
  Object.assign(specific, {
    'phenakistiscope-loop':(c,t)=>opticalWheel(c,t,'disc'),
    zoetrope:(c,t)=>opticalWheel(c,t,'drum'),
    praxinoscope:(c,t)=>opticalWheel(c,t,'mirror'),
    kinemacolor(c,t) { const redX=200+Math.sin((t-.025)*TAU)*65,greenX=200+Math.sin((t+.025)*TAU)*65;rect(c,60,60,280,138,'#e6ebef');c.save();c.globalAlpha=.7;circle(c,redX,127,31,'#a36669');circle(c,greenX,127,31,'#71947d');c.restore(); },
    'mode-7'(c,t) { rect(c,55,65,290,130,'#e0e8f0');line(c,[[55,84],[345,84]],mid,2);for(let i=-7;i<=7;i++){const shift=Math.sin(t*TAU)*25;line(c,[[200+i*4,86],[200+i*34+shift,195]],mid,1);}for(let i=0;i<10;i++){const z=(i/10+t)%1,y=87+z*z*108;line(c,[[55,y],[345,y]],light,2);} },
    hyperlapse(c,t) { corridor(c,t);rect(c,184,83,32,58,mid);for(let i=0;i<6;i++){const z=(i/6+t)%1;for(let s of [-1,1])rect(c,200+s*(26+z*z*140),85+z*30,4+z*5,28+z*70,ink);} },
    'go-motion'(c,t) { const p=Math.floor(wave(t)*10)/10;for(let side=0;side<2;side++){const base=110+side*180;rect(c,base-39,165,78,3,light);const x=base-30+p*60;if(side)for(let j=4;j>=1;j--)circle(c,x-j*5,125,14,`rgba(62,88,116,${.12*j})`);circle(c,x,125,14,ink);text(c,side?'曝光内留下短拖影':'普通定格',base,192,10);} },
    'optical-flow-frame-interpolation'(c,t) { specific['frame-interpolation'](c,t);for(let i=0;i<5;i++)arrow(c,85+i*50,127,110+i*50,127,light); },
    'shaky-cam':(c,t)=>cameraScene(c,t,'shake'),
    snorricam:(c,t)=>cameraScene(c,t,'snorri'),
    'steadicam-float':(c,t)=>cameraScene(c,t,'steady'),
    'rolling-shutter-wobble'(c,t) { for(let y=62;y<196;y+=4){const offset=Math.sin(y/24+t*TAU)*14;rect(c,118+offset,y,164,4,light);for(let x=130;x<273;x+=31)rect(c,x+offset,y,5,4,ink);} },
    'raster-bars'(c,t) { rect(c,60,61,280,137,'#35495f');for(let i=0;i<5;i++){const y=85+Math.sin(t*TAU+i*.7)*39+i*8;rect(c,60,y,280,11,['#c5d7e6','#8faac3','#647f9b'][i%3]);} },
    'plasma-effect'(c,t) { for(let y=0;y<18;y++)for(let x=0;x<36;x++){const n=(Math.sin(x*.24+t*TAU)+Math.sin(y*.3-t*TAU)+Math.sin((x+y)*.17+t*TAU))/6+.5;const v=Math.floor(105+n*105);rect(c,60+x*7.8,61+y*7.6,8,8,`rgb(${v-24},${v-8},${v+12})`);} },
    'pinscreen-animation'(c,t) { const p=Math.floor(wave(t)*8)/8;for(let y=0;y<15;y++)for(let x=0;x<30;x++){const a=Math.exp(-((x-15)*(x-15)+(y-7)*(y-7))/70);const shadow=1+(Math.sin(x*.3+p*TAU)*.5+.5)*a*8;circle(c,70+x*9,64+y*9,1,mid);line(c,[[70+x*9,64+y*9],[70+x*9+shadow,64+y*9+shadow*.4]],ink,.7);} },
    pixilation(c,t) { const p=Math.floor(wave(t)*10)/10;line(c,[[60,178],[340,178]],light);figure(c,78+p*244,137,0,ink,1); },
    'slow-motion':(c,t)=>speedCompare(c,t,'slow'),
    undercranking:(c,t)=>speedCompare(c,t,'fast'),
    'speed-ramping':(c,t)=>speedCompare(c,t,'ramp'),
    'stop-trick'(c,t) { rect(c,70,168,260,8,mid);if(Math.floor(t*2)%2===0){circle(c,200,143,24,ink);line(c,[[200,120],[206,109]],mid,3);}else{line(c,[[200,168],[200,121]],ink,3);for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,200+Math.cos(a)*15,116+Math.sin(a)*15,10,mid);}} }
  });

  function draw(scene) {
    const c=scene.canvas.getContext('2d');
    c.setTransform(scene.scale,0,0,scene.scale,0,0);
    rect(c,0,0,400,250,'#edf1f5');
    const painter=specific[scene.id] || painters[scene.spec.type];
    if(painter)painter(c,(scene.elapsed%4800)/4800);
    text(c,scene.spec.caption,200,235,10,'#6d7e91');
  }
  function tick(now) {
    const delta=previous?Math.min(now-previous,60):0;previous=now;
    let any=false;
    for(const scene of scenes.values())if(scene.active){scene.elapsed+=delta;draw(scene);any=true;}
    frame=any?requestAnimationFrame(tick):0;
    if(!any)previous=0;
  }
  return {
    types:Object.keys(painters),
    mount(root,items) {
      for(const canvas of root.querySelectorAll('canvas[data-motion-id]')){
        const item=items.find(x=>x.id===canvas.dataset.motionId);
        if(!item?.demoSpec)continue;
        const scale=Math.min(devicePixelRatio||1,2);canvas.width=400*scale;canvas.height=250*scale;
        const scene={canvas,id:item.id,spec:item.demoSpec,scale,elapsed:item.id==='deal-in'?2400:0,active:false};scenes.set(canvas,scene);draw(scene);
      }
    },
    activate(canvas,active) {
      const scene=scenes.get(canvas);if(!scene)return;scene.active=active;
      if(active&&!frame)frame=requestAnimationFrame(tick);
    },
    clear() { if(frame)cancelAnimationFrame(frame);frame=0;previous=0;scenes.clear(); }
  };
})();
