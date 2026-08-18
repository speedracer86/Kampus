/* Pure helpers shared by the generator library and the adaptive engine.
   Extracted verbatim from the v1 single-file app (index.html) — behavior-preserving.
   Fraction/number-line helpers return HTML/SVG strings so the engine stays renderer-agnostic. */
const ri = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const shuffle = arr => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const gcd = (a,b) => { a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a||1; };
function simp(n,d){ const g=gcd(n,d); return [n/g, d/g]; }
function frH(n,d){
  if(d===1) return String(n);
  return `<span class="fr"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
}
function sfrH(n,d){ const [a,b]=simp(n,d); return frH(a,b); }
function fmt(x){
  if(typeof x!=='number') return String(x);
  return (Math.round(x*1000)/1000).toString();
}
/* CRA visuals: representational pictures for the teach steps */
function numLineSVG(from, to){
  const lo = Math.min(from, to, 0)-1, hi = Math.max(from, to, 0)+1;
  const range = hi-lo, step = range>30?10 : range>14?5 : 1;
  const W=280, H=48, y=30;
  const x = v => 10 + (v-lo)/range*(W-20);
  let marks='';
  for(let v=Math.ceil(lo/step)*step; v<=hi; v+=step){
    marks += `<line x1="${x(v)}" y1="${y-4}" x2="${x(v)}" y2="${y+4}" stroke="currentColor" stroke-width="1" opacity=".45"/>`;
  }
  for(const v of [...new Set([0, from, to])]){
    marks += `<text x="${x(v)}" y="${y+16}" font-size="10" text-anchor="middle" fill="currentColor" font-weight="${v===to?'800':'500'}" opacity="${v===to?'1':'.75'}">${v}</text>`;
  }
  const mid = (x(from)+x(to))/2;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%; max-width:280px; display:block; margin-top:6px;">
    <line x1="6" y1="${y}" x2="${W-6}" y2="${y}" stroke="currentColor" stroke-width="1.5" opacity=".65"/>
    ${marks}
    <path d="M ${x(from)} 16 Q ${mid} 2 ${x(to)} 16" fill="none" stroke="#ffc12e" stroke-width="2"/>
    <path d="M ${x(to)} 16 l ${to>from?-5:5} -4 m ${to>from?5:-5} 4 l ${to>from?-2:2} -6" fill="none" stroke="#ffc12e" stroke-width="2"/>
    <circle cx="${x(from)}" cy="${y}" r="4" fill="#59a7ff"/>
    <circle cx="${x(to)}" cy="${y}" r="4" fill="#2db56c"/>
  </svg>`;
}
function fracBar(n, d, color){
  const W=200, H=24, cw=(W-4)/d;
  let cells='';
  for(let i=0;i<d;i++){
    cells += `<rect x="${2+i*cw+1}" y="2" width="${Math.max(1,cw-2)}" height="${H-4}" rx="3" fill="${i<n?(color||'#59a7ff'):'transparent'}" stroke="currentColor" stroke-width="1" opacity="${i<n?'1':'.35'}"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block;">${cells}</svg>`;
}
const vizRow = (...parts) => `<span class="vizrow">${parts.join('')}</span>`;



function Q(prompt, q, ans, wrongs, skill, steps){ return {prompt, q, ans:String(ans), wrongs:wrongs.map(String), skill, steps:steps||[]}; }
const dspN = n => n<0 ? '−'+Math.abs(n) : String(n);          // −8
const dspP = n => n<0 ? '(−'+Math.abs(n)+')' : String(n);     // (−8)
function valOf(s){   // numeric value of a displayed choice, or null
  const m = String(s).match(/^<span class="fr"><span class="fn">(-?[\d.]+)<\/span><span class="fd">(-?[\d.]+)<\/span><\/span>$/);
  if(m) return parseFloat(m[1])/parseFloat(m[2]);
  const t = String(s).replace('x = ','').replace('$','').replace('%','').replace('−','-');
  if(/^-?[\d.]+$/.test(t)) return parseFloat(t);
  return null;
}
function pctSteps(p, base, ans){
  if(p===50) return [`50% means <b>half</b>.`, `Half of ${base} is <b>${fmt(ans)}</b>.`];
  if(p===25) return [`25% means a <b>quarter</b> — divide by 4.`, `${base} ÷ 4 = <b>${fmt(ans)}</b>.`];
  if(p===75) return [`75% is <b>three quarters</b>.`, `A quarter: ${base} ÷ 4 = ${base/4}.`, `Three of them: ${base/4} × 3 = <b>${fmt(ans)}</b>.`];
  if(p===5)  return [`Start with 10%: slide the decimal → ${fmt(base/10)}.`, `5% is half of that: <b>${fmt(ans)}</b>.`];
  if(p===15) return [`10% of ${base} is ${fmt(base/10)}. 5% is half of that: ${fmt(base/20)}.`, `15% = 10% + 5% = ${fmt(base/10)} + ${fmt(base/20)} = <b>${fmt(ans)}</b>.`];
  if(p%10===0) return [`10% of ${base} is ${fmt(base/10)} — just slide the decimal.`, `${p}% is ${p/10} of those: ${p/10} × ${fmt(base/10)} = <b>${fmt(ans)}</b>.`];
  return [`${p}% means ${p} out of 100.`, `${p} ÷ 100 × ${base} = <b>${fmt(ans)}</b>.`];
}

export { ri, pick, shuffle, gcd, simp, frH, sfrH, fmt, numLineSVG, fracBar, vizRow, Q, dspN, dspP, valOf, pctSteps };
