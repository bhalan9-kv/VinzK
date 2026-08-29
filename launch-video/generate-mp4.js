const { createCanvas } = require('canvas');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFMPEG = '/usr/lib/node_modules/ffmpeg-static/ffmpeg';
const W = 1280, H = 720, FPS = 24;
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT = path.join(__dirname, 'caseflow-launch.mp4');

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const CYAN = '#00f0ff', MAGENTA = '#ff2daa', WHITE = '#ffffff', GRAY = '#888888', BLACK = '#000000';

function drawBg() {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W*0.3, H*0.4, 0, W*0.3, H*0.4, 300);
  g.addColorStop(0, 'rgba(0,240,255,0.07)'); g.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W*0.7, H*0.6, 0, W*0.7, H*0.6, 300);
  g2.addColorStop(0, 'rgba(255,45,170,0.05)'); g2.addColorStop(1, 'rgba(255,45,170,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
}

function txt(text, x, y, { color=WHITE, size=36, bold=false, align='center', alpha=1 }={}) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${bold?'bold ':''} ${size}px Arial,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

function gradTxt(text, x, y, size=56) {
  ctx.font = `bold ${size}px Arial,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const g = ctx.createLinearGradient(x-150, y, x+150, y);
  g.addColorStop(0, CYAN); g.addColorStop(0.5, MAGENTA); g.addColorStop(1, CYAN);
  ctx.fillStyle = g; ctx.fillText(text, x, y);
}

function box(x, y, w, h, border=CYAN, bg='rgba(0,240,255,0.04)') {
  ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x,y,w,h,8); ctx.fill(); ctx.stroke();
}

function bar(x, y, w, h, pct, color) {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x,y,w,h);
  ctx.fillStyle = color; ctx.fillRect(x,y,w*pct,h);
}

function ease(t) { return t<0.5?2*t*t:-1+(4-2*t)*t; }
function clamp(v) { return Math.max(0,Math.min(1,v)); }

let frame = 0;
function save() {
  fs.writeFileSync(path.join(FRAMES_DIR, `f${String(frame).padStart(4,'0')}.png`), canvas.toBuffer('image/png'));
  frame++;
}

const FPS_DUR = (d) => Math.round(FPS * d);

// SLIDE 1: Logo (2s)
console.log('Slide 1...');
for (let f=0;f<FPS_DUR(2);f++) {
  const t=f/FPS_DUR(2), a=ease(Math.min(t*2,1)), s=0.5+ease(Math.min(t*1.5,1))*0.5;
  drawBg();
  txt('⚡', W/2, H/2-40, { size:Math.floor(80*s), alpha:a });
  gradTxt('CaseFlow', W/2, H/2+30, Math.floor(64*s));
  txt('AI-Powered Case Interview Prep', W/2, H/2+90, { size:Math.floor(22*s), color:GRAY, alpha:ease(clamp((t-0.3)*3)) });
  save();
}

// SLIDE 2: Stats (2.5s)
console.log('Slide 2...');
const stats=[{n:'95+',l:'Cases',c:CYAN},{n:'6',l:'Types',c:MAGENTA},{n:'5',l:'Dimensions',c:'#a855f7'},{n:'∞',l:'Practice',c:'#22c55e'}];
for (let f=0;f<FPS_DUR(2.5);f++) {
  const t=f/FPS_DUR(2.5);
  drawBg();
  txt('Built for Consulting', W/2, 100, { size:28, color:GRAY, alpha:ease(t*3) });
  stats.forEach((s,i)=>{
    const st=clamp((t-i*0.12)*2.5), a=ease(st);
    const x=W*(0.18+i*0.2);
    box(x-80,200,160,200,s.c+'60',s.c+'08');
    txt(s.n,x,280,{ size:48,color:s.c,alpha:a,bold:true });
    txt(s.l,x,340,{ size:18,color:GRAY,alpha:a });
  });
  save();
}

// SLIDE 3: Features (3s)
console.log('Slide 3...');
const feats=['🤖 Socratic AI','⏱️ Timed Mode','📊 5-D Scoring','🧭 Framework Hints','⭐ XP & Levels','📈 Analytics'];
for (let f=0;f<FPS_DUR(3);f++) {
  const t=f/FPS_DUR(3);
  drawBg();
  gradTxt('What Makes CaseFlow Different', W/2, 80, 38);
  feats.forEach((feat,i)=>{
    const row=Math.floor(i/3), col=i%3;
    const a=ease(clamp((t-i*0.08)*2.5));
    const x=W*(0.2+col*0.3), y=200+row*180;
    ctx.globalAlpha=a;
    box(x-110,y,220,140,CYAN+'40','rgba(0,240,255,0.03)');
    txt(feat,x,y+50,{ size:20,color:WHITE,bold:true });
    ctx.globalAlpha=1;
  });
  save();
}

// SLIDE 4: Interview Demo (3s)
console.log('Slide 4...');
const chats=[
  {r:'ai',t:'Welcome to your case interview.'},
  {r:'ai',t:'Case: Declining Profits at GreenGrocer'},
  {r:'user',t:'What are the main revenue drivers?'},
  {r:'ai',t:'Revenue is split across 45 stores...'},
  {r:'user',t:'Revenue = Price × Volume × Mix'},
  {r:'ai',t:'Strong framework. Walk me through.'},
];
for (let f=0;f<FPS_DUR(3);f++) {
  const t=f/FPS_DUR(3);
  drawBg();
  txt('Live Interview Simulation', W/2, 50, { size:28, color:CYAN });
  box(W*0.1,90,W*0.8,H-120,'#222','rgba(10,10,30,0.8)');
  const vis=Math.floor(t*chats.length*1.5)+1;
  chats.slice(0,Math.min(vis,chats.length)).forEach((c,i)=>{
    const a=clamp((t-i/(chats.length*1.5))*4);
    const isU=c.r==='user', y=120+i*65;
    ctx.globalAlpha=ease(a);
    if(isU){box(W*0.5,y,W*0.35,40,MAGENTA+'60','rgba(255,45,170,0.08)');}
    else{box(W*0.12,y,W*0.42,40,CYAN+'40','rgba(0,240,255,0.05)');}
    txt(c.t, isU?W*0.72:W*250/W*W, y+12, { size:15,color:isU?MAGENTA:WHITE,align:isU?'right':'left' });
    ctx.globalAlpha=1;
  });
  save();
}

// SLIDE 5: Scoring (3s)
console.log('Slide 5...');
const dims=[{l:'Structure',s:82,c:CYAN},{l:'Hypothesis',s:75,c:MAGENTA},{l:'Quantitative',s:68,c:'#22c55e'},{l:'Communication',s:88,c:'#a855f7'},{l:'Insight',s:71,c:'#f59e0b'}];
for (let f=0;f<FPS_DUR(3);f++) {
  const t=f/FPS_DUR(3);
  drawBg();
  gradTxt('5-Dimension Scorecard', W/2, 70, 42);
  dims.forEach((d,i)=>{
    const pct=ease(clamp((t-i*0.1)*2))*d.s/100;
    const y=160+i*80;
    txt(d.l,W*0.22,y+10,{ size:18,color:d.c,align:'right' });
    bar(W*0.28,y,W*0.42,22,pct,d.c);
    txt(`${Math.round(pct*100)}`,W*0.73,y+10,{ size:18,color:d.c,align:'left' });
  });
  txt('Overall: 77 — HIRE', W/2, H-100, { size:36, color:'#22c55e', bold:true });
  save();
}

// SLIDE 6: CTA (2.5s)
console.log('Slide 6...');
for (let f=0;f<FPS_DUR(2.5);f++) {
  const t=f/FPS_DUR(2.5);
  drawBg();
  const pulse=0.9+Math.sin(t*Math.PI*4)*0.1;
  gradTxt('Ready to Level Up?', W/2, H*0.32, 52);
  txt('Start practicing with CaseFlow today', W/2, H*0.48, { size:24, color:GRAY });
  ctx.globalAlpha=ease(clamp(t*3));
  const bw=340*pulse, bx=W/2-bw/2, by=H*0.58;
  const bg=ctx.createLinearGradient(bx,by,bx+bw,by);
  bg.addColorStop(0,CYAN); bg.addColorStop(1,MAGENTA);
  ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(bx,by,bw,56,28); ctx.fill();
  txt('⚡ Get Started Free', W/2, by+28, { size:22,color:BLACK,bold:true });
  ctx.globalAlpha=1;
  txt('caseflow.app', W/2, H*0.8, { size:18,color:GRAY });
  save();
}

console.log(`Frames: ${frame}`);

// Encode
console.log('Encoding MP4...');
try {
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${path.join(FRAMES_DIR,'f%04d.png')}" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset ultrafast "${OUTPUT}"`, { stdio:'pipe', timeout:60000 });
  const st = fs.statSync(OUTPUT);
  console.log(`✅ MP4: ${(st.size/1024).toFixed(0)}KB, ${(frame/FPS).toFixed(1)}s, ${W}x${H}`);
} catch(e) {
  console.error('FFmpeg error:', e.stderr?.toString()?.slice(-300));
}

// Cleanup
fs.readdirSync(FRAMES_DIR).forEach(f=>fs.unlinkSync(path.join(FRAMES_DIR,f)));
fs.rmdirSync(FRAMES_DIR);
console.log('Done!');
