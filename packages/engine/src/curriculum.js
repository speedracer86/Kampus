/* Grade 3-8 curriculum: named generator refs (R), grade-parameterized factories,
   per-grade world identities, and the grade x topic x tier problem pools.
   Extracted verbatim from the v1 single-file app — behavior-preserving. */
import { ri, pick, shuffle, gcd, simp, frH, sfrH, fmt, numLineSVG, fracBar, vizRow, Q, dspN, dspP, pctSteps } from './util.js';
import { GEN } from './generators.js';

/* named refs into the generator library above */
const R = {
  eqFrac:GEN.frac[1][0], cmpFrac:GEN.frac[1][1], addSameDen:GEN.frac[1][2],
  addUnlikeDen:GEN.frac[2][0], subFrac:GEN.frac[2][1], frac2dec:GEN.frac[2][2], dec2frac:GEN.frac[2][3],
  mulFrac:GEN.frac[3][0], divFrac:GEN.frac[3][1], decMul:GEN.frac[3][2], frac2pct:GEN.frac[3][3],
  unitRate:GEN.ratio[1][0], simplifyRatio:GEN.ratio[1][1], easyPct:GEN.ratio[1][2],
  pctOf:GEN.ratio[2][0], propSolve:GEN.ratio[2][1], ratioShare:GEN.ratio[2][2],
  pctChange:GEN.ratio[3][0], findWhole:GEN.ratio[3][1], scaleRecipe:GEN.ratio[3][2],
  addInt:GEN.int[1][0], subToNeg:GEN.int[1][1], cmpInt:GEN.int[1][2], absVal:GEN.int[1][3],
  subNeg:GEN.int[2][0], mulInt:GEN.int[2][1], addLarger:GEN.int[2][2],
  divInt:GEN.int[3][0], mixedInt:GEN.int[3][1], doubleSub:GEN.int[3][2],
  orderOps:GEN.alg[1][0], evalX:GEN.alg[1][1], oneStepAdd:GEN.alg[1][2],
  oneStepMul:GEN.alg[2][0], twoStep:GEN.alg[2][1], orderOpsParen:GEN.alg[2][2],
  twoStepNeg:GEN.alg[3][0], distrib:GEN.alg[3][1], evalTwoVar:GEN.alg[3][2]
};

/* ---- elementary + grade-8 generators ---- */
const addBigG = (lo,hi) => function addBig(){
  const a=ri(lo,hi), b=ri(lo,hi), o=b%10, t=b-o, ans=a+b;
  let steps;
  if(o===0 && a%10===0) steps = [
    `Both numbers end in 0, so just add the tens: ${a/10} tens + ${b/10} tens = ${(a+b)/10} tens.`,
    `${(a+b)/10} tens = <b>${ans}</b>.`];
  else if(o===0) steps = [
    `${b} is all tens. Add the tens parts first: ${a-a%10} + ${b} = ${a-a%10+b}.`,
    `Put back the ${a%10} ones: ${a-a%10+b} + ${a%10} = <b>${ans}</b>.`];
  else steps = [
    `Add ${b} in two easy jumps — the tens first, then the ones.`,
    `${b} = ${t} + ${o}. &nbsp;Jump 1: ${a} + ${t} = ${a+t}.`,
    `Jump 2: ${a+t} + ${o} = <b>${ans}</b>.`];
  return Q('Add', `${a} + ${b}`, ans, [ans+10, ans-10, ans+pick([-1,1,100])].filter(x=>x!==ans), 'Multi-digit addition', steps);
};
const subBigG = (lo,hi) => function subBig(){
  let a=ri(lo,hi), b=ri(lo,hi); if(b>a){const t=a;a=b;b=t;} if(a===b)a+=7;
  const o=b%10, t=b-o, ans=a-b;
  let steps;
  if(o===0 && a%10===0) steps = [
    `Both numbers end in 0, so just subtract the tens: ${a/10} tens − ${b/10} tens = ${(a-b)/10} tens.`,
    `${(a-b)/10} tens = <b>${ans}</b>.`];
  else if(o===0) steps = [
    `${b} is all tens. Subtract it from the tens part: ${a-a%10} − ${b} = ${a-a%10-b}.`,
    `Put back the ${a%10} ones: ${a-a%10-b} + ${a%10} = <b>${ans}</b>.`];
  else steps = [
    `Take away ${b} in two easy jumps — the tens first, then the ones.`,
    `${b} = ${t} + ${o}. &nbsp;Jump 1: ${a} − ${t} = ${a-t}.`,
    `Jump 2: ${a-t} − ${o} = <b>${ans}</b>.`];
  return Q('Subtract', `${a} − ${b}`, ans, [ans+10, ans-10>0?ans-10:ans+20, ans+pick([-2,2])].filter(x=>x!==ans), 'Multi-digit subtraction', steps);
};
const multFactG = max => function multFact(){
  const a=ri(2,max), b=ri(2,9), ans=a*b;
  return Q('Multiply', `${a} × ${b}`, ans, [a*(b+1), a*(b-1), a+b].filter(x=>x!==ans), 'Multiplication facts', [
    `${a} × ${b} means ${b} groups of ${a}.`,
    `Build it up: ${a} × ${b-1} = ${a*(b-1)}, then one more group: ${a*(b-1)} + ${a} = <b>${ans}</b>.`]);
};
const divFactG = max => function divFact(){
  const q=ri(2,max), b=ri(2,9);
  return Q('Divide', `${q*b} ÷ ${b}`, q, [q+1, q-1||q+2, b===q?b+2:b].filter(x=>x!==q), 'Division facts', [
    `Division asks: what × ${b} makes ${q*b}?`,
    `${q} × ${b} = ${q*b}, so ${q*b} ÷ ${b} = <b>${q}</b>.`]);
};
function mulDigit(){
  let a; do{ a=ri(12,49); }while(a%10===0);   // round numbers make the split explanation degenerate
  const b=ri(3,9), t=Math.floor(a/10)*10, o=a%10, ans=a*b;
  return Q('Multiply', `${a} × ${b}`, ans, [ans+b, ans-b, t*b+o].filter(x=>x!==ans), 'Multi-digit multiplication', [
    `Too big to know by heart? Split ${a} into ${t} + ${o} and multiply each piece.`,
    `${t} × ${b} = ${t*b} &nbsp;and&nbsp; ${o} × ${b} = ${o*b}.`,
    `Add the pieces: ${t*b} + ${o*b} = <b>${ans}</b>.`]);
}
function divRem(){
  const b=ri(3,9), q=ri(4,9), r=ri(1,b-1), a=b*q+r;
  const ans=`${q} r ${r}`;
  return Q('Divide (with remainder)', `${a} ÷ ${b}`, ans, [`${q+1} r ${r}`, `${q} r ${r+1===b?1:r+1}`, `${q-1} r ${r}`].filter(x=>x!==ans), 'Division with remainders', [
    `How many ${b}s fit in ${a}? ${b} × ${q} = ${b*q} fits; ${b} × ${q+1} = ${b*(q+1)} is too big.`,
    `Left over: ${a} − ${b*q} = ${r}.`,
    `Answer: <b>${q} remainder ${r}</b>.`]);
}
function roundNumG(){
  const place = pick([10,100]);
  let n = ri(111,989); if(n%place===0) n += 7;
  const digit = place===10 ? n%10 : Math.floor(n/10)%10;
  const ans = Math.round(n/place)*place;
  const w = [ans+place, ans-place, place===10? Math.round(n/100)*100 : Math.round(n/10)*10].filter(x=>x!==ans && x>0);
  return Q(`Round to the nearest ${place}`, `${n}`, ans, w, 'Rounding', [
    `Look one spot to the right of the ${place===10?'tens':'hundreds'} place: that digit is ${digit}.`,
    digit>=5 ? `${digit} is 5 or more → round UP.` : `${digit} is less than 5 → round DOWN.`,
    `<b>${ans}</b>.`]);
}
function decAddG(){
  const A=ri(11,89), B=ri(11,89);
  if(Math.random()<0.5){
    const ans=fmt((A+B)/10);
    return Q('Add', `${fmt(A/10)} + ${fmt(B/10)}`, ans, [fmt((A+B)/100), fmt((A+B+10)/10), fmt((A+B-10)/10)].filter(x=>x!==ans), 'Adding decimals', [
      `Line up the decimal points, then add like whole numbers.`,
      `Think in tenths: ${A} tenths + ${B} tenths = ${A+B} tenths.`,
      `${A+B} tenths = <b>${ans}</b>.`]);
  }
  let hi=Math.max(A,B), lo=Math.min(A,B); if(hi===lo) lo=hi-13;
  const ans=fmt((hi-lo)/10);
  return Q('Subtract', `${fmt(hi/10)} − ${fmt(lo/10)}`, ans, [fmt((hi-lo)/100), fmt((hi-lo+10)/10), fmt((hi+lo)/10)].filter(x=>x!==ans), 'Subtracting decimals', [
    `Line up the decimal points, then subtract like whole numbers.`,
    `Think in tenths: ${hi} tenths − ${lo} tenths = ${hi-lo} tenths.`,
    `${hi-lo} tenths = <b>${ans}</b>.`]);
}
function unitFracCmp(){
  const opts=[2,3,4,5,6,8,10,12];
  let b=pick(opts), d=pick(opts); while(d===b) d=pick(opts);
  const sm=Math.min(b,d), lg=Math.max(b,d), ans=frH(1,sm);
  return Q('Which is bigger?', `${frH(1,b)} &nbsp;or&nbsp; ${frH(1,d)}`, ans, [frH(1,lg), "they're equal"], 'Comparing unit fractions', [
    `Imagine one pizza. More slices = smaller slices.`,
    `Cut into ${sm} → big pieces. Cut into ${lg} → small pieces. ${vizRow(fracBar(1,sm), '<b>vs</b>', fracBar(1,lg,'#2db56c'))}`,
    `So ${frH(1,sm)} is bigger.`]);
}
const fracOfSetG = unitOnly => function fracOfSet(){
  const b=pick([2,3,4,5,6]), n=b*ri(2,6), a=unitOnly?1:ri(1,b-1);
  const ans=a*(n/b);
  return Q('Fraction of a number', `${frH(a,b)} of ${n}`, ans, [n/b===ans?ans+b:n/b, ans+a, n-ans===ans?ans-1:n-ans].filter(x=>x!==ans), 'Fraction of a number', [
    `Split ${n} into ${b} equal groups: ${n} ÷ ${b} = ${n/b}.`,
    a===1? `One group is <b>${ans}</b>.` : `Take ${a} groups: ${a} × ${n/b} = <b>${ans}</b>.`]);
};
function mixedImp(){
  const w=ri(1,3), b=pick([2,3,4,5]), a=ri(1,b-1);
  const ans=frH(w*b+a,b);
  return Q('Make it improper', `${w} ${frH(a,b)} = ?`, ans, [frH(w+a,b), frH(w*b-a,b), frH(a*b+w,b)].filter(x=>x!==ans), 'Mixed ↔ improper fractions', [
    `${w} whole${w>1?'s':''} = ${w} × ${b} = ${w*b} pieces of size ${frH(1,b)}.`,
    `Add the extra ${a} pieces: ${w*b} + ${a} = ${w*b+a}.`,
    `= <b>${frH(w*b+a,b)}</b>.`]);
}
function patternNext(){
  const s=ri(1,12), st=ri(2,9), t=[s,s+st,s+2*st,s+3*st], ans=s+4*st;
  return Q('What comes next?', `${t.join(', ')}, ?`, ans, [ans+1, ans-1, ans+st], 'Number patterns', [
    `Find the jump: ${t[1]} − ${t[0]} = ${st}.`,
    `Every number goes up by ${st}.`,
    `${t[3]} + ${st} = <b>${ans}</b>.`]);
}
function boxAdd(){
  const x=ri(2,20), a=ri(2,15);
  return Q('Find the mystery number', `▢ + ${a} = ${x+a}`, x, [x+a, x+1, x-1||x+2].filter(v=>v!==x), 'Missing numbers (+)', [
    `The box hides a number. Something + ${a} makes ${x+a}.`,
    `Work backwards: ${x+a} − ${a} = <b>${x}</b>.`,
    `Check: ${x} + ${a} = ${x+a} ✓`]);
}
function boxMul(){
  const x=ri(2,9), a=ri(2,9);
  return Q('Find the mystery number', `▢ × ${a} = ${a*x}`, x, [a*x-a, x+1, a===x?a+2:a].filter(v=>v!==x), 'Missing numbers (×)', [
    `Something × ${a} makes ${a*x}.`,
    `Work backwards with division: ${a*x} ÷ ${a} = <b>${x}</b>.`,
    `Check: ${x} × ${a} = ${a*x} ✓`]);
}
function powersG(){
  const kind=pick([1,1,2,3]);
  if(kind===1){ const n=ri(2,12); return Q('Exponents', `${n}<sup>2</sup> = ?`, n*n, [n*2, n*n+n, (n+1)*(n+1)].filter(x=>x!==n*n), 'Exponents', [
    `${n}<sup>2</sup> means ${n} × ${n} — NOT ${n} × 2.`,
    `${n} × ${n} = <b>${n*n}</b>.`]); }
  if(kind===2){ const n=ri(2,5); return Q('Exponents', `${n}<sup>3</sup> = ?`, n*n*n, [n*3, n*n, n*n*n+n].filter(x=>x!==n*n*n), 'Exponents', [
    `${n}<sup>3</sup> means ${n} × ${n} × ${n}.`,
    `${n} × ${n} = ${n*n}, then × ${n} again = <b>${n*n*n}</b>.`]); }
  const k=ri(3,6), ans=Math.pow(2,k);
  return Q('Exponents', `2<sup>${k}</sup> = ?`, ans, [2*k, ans/2, ans*2].filter(x=>x!==ans), 'Exponents', [
    `2<sup>${k}</sup> means multiply 2 by itself ${k} times.`,
    `Keep doubling: ${Array.from({length:k},(_,i)=>Math.pow(2,i+1)).join(' → ')}.`,
    `<b>${ans}</b>.`]);
}
function sqrootG(){
  const n=ri(2,15);
  return Q('Square roots', `√${n*n} = ?`, n, [n+1, n-1||n+2, Math.round(n*n/2)].filter(x=>x!==n), 'Square roots', [
    `√ asks: what number × itself makes ${n*n}?`,
    `${n} × ${n} = ${n*n}.`,
    `So √${n*n} = <b>${n}</b>.`]);
}
function sciNotG(){
  const M=ri(11,89), k=ri(2,5), N=M*Math.pow(10,k-1);
  return Q('Scientific notation', `${N} = ${fmt(M/10)} × 10<sup>?</sup>`, k, [k-1, k+1, k+2], 'Scientific notation', [
    `Count how many places the decimal moves from ${fmt(M/10)} to reach ${N}.`,
    `${fmt(M/10)} → ${N}: it moves ${k} places right.`,
    `So the power is <b>${k}</b>.`]);
}
function combineLikeG(){
  const a=ri(2,9), b=ri(2,9), c=ri(1,a+b-2), v=a+b-c;
  const dx = n => n===1? 'x' : n+'x';
  return Q('Combine like terms', `${a}x + ${b}x − ${c}x = ?`, dx(v), [dx(v+1), dx(v-1), (a+b+c)+'x'].filter(x=>x!==dx(v)), 'Combining like terms', [
    `They're all "x" terms, so just combine the numbers in front.`,
    `${a} + ${b} − ${c} = ${v}.`,
    `Answer: <b>${dx(v)}</b>.`]);
}
function multiStepG(){
  let x; do{ x=ri(-6,9); }while(x===0);
  const a=ri(3,7), c=ri(1,a-2), b=ri(1,9), d=(a-c)*x+b;
  return Q('Solve for x', `${a}x + ${b} = ${c}x ${d<0?'−':'+'} ${Math.abs(d)}`, 'x = '+x,
    ['x = '+(-x), 'x = '+(x+1), 'x = '+(d-b)].filter(s=>s!=='x = '+x), 'Equations with x on both sides', [
    `Get the x's together: subtract ${c}x from both sides → ${a-c}x + ${b} = ${dspN(d)}.`,
    `Subtract ${b}: ${a-c}x = ${dspN(d-b)}.`,
    `Divide by ${a-c}: x = <b>${dspN(x)}</b>.`]);
}
function slope2G(){
  let m; do{ m=ri(-4,4); }while(m===0);
  const x1=ri(-5,5), dx=ri(1,4), y1=ri(-5,5), x2=x1+dx, y2=y1+m*dx;
  return Q('Find the slope', `(${x1}, ${y1}) and (${x2}, ${y2})`, m, [-m, m+1, dx===m?m-1:dx].filter(v=>v!==m), 'Slope', [
    `Slope = rise ÷ run (how far UP per step RIGHT).`,
    `Rise: ${dspN(y2)} − ${dspP(y1)} = ${dspN(y2-y1)}. &nbsp;Run: ${x2} − ${dspP(x1)} = ${dx}.`,
    `${dspN(y2-y1)} ÷ ${dx} = <b>${dspN(m)}</b>.`]);
}

/* ---- per-grade worlds & problem pools ---- */
const GRADE_WORLDS = {
  3:{int:{name:'Number Mine',icon:'⛏️',desc:'adding & subtracting big numbers'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'first fractions: pieces & shares'},
     ratio:{name:'Trade Tycoon',icon:'💰',desc:'times tables & fair trades'},
     alg:{name:'Puzzle Lab',icon:'🧩',desc:'mystery numbers & patterns'}},
  4:{int:{name:'Number Mine',icon:'⛏️',desc:'big ×, ÷ and rounding'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'equivalent fractions & comparing'},
     ratio:{name:'Trade Tycoon',icon:'💰',desc:'fact fluency & money problems'},
     alg:{name:'Puzzle Lab',icon:'🧩',desc:'mystery numbers & patterns'}},
  5:{int:{name:'Decimal Depths',icon:'🌊',desc:'decimals & order of operations'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'adding & multiplying fractions'},
     ratio:{name:'Trade Tycoon',icon:'💰',desc:'unit rates & scaling up'},
     alg:{name:'Equation Lab',icon:'🧪',desc:'order of operations & variables'}},
  6:{int:{name:'Frozen Obby',icon:'❄️',desc:'negative numbers (below zero!)'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'fractions ↔ decimals & percents'},
     ratio:{name:'Trade Tycoon',icon:'💰',desc:'ratios, percents & proportions'},
     alg:{name:'Equation Lab',icon:'🧪',desc:'one & two-step equations'}},
  7:{int:{name:'Frozen Obby',icon:'❄️',desc:'all four operations with negatives'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'multiply & divide fractions'},
     ratio:{name:'Trade Tycoon',icon:'💰',desc:'proportions & percent change'},
     alg:{name:'Equation Lab',icon:'🧪',desc:'two-step equations & distributing'}},
  8:{int:{name:'Power Plant',icon:'⚡',desc:'exponents, roots & scientific notation'},
     frac:{name:'Fraction Factory',icon:'🏭',desc:'fraction · decimal · percent fluency'},
     ratio:{name:'Slope City',icon:'📈',desc:'slope & heavy-duty percents'},
     alg:{name:'Equation Lab',icon:'🧪',desc:'x on both sides & combining terms'}}
};
const CURRICULUM = {
  3:{int:{1:[addBigG(20,99), subBigG(20,99)], 2:[addBigG(100,999), subBigG(100,999)], 3:[addBigG(100,999), subBigG(100,999), multFactG(9)]},
     ratio:{1:[multFactG(5), divFactG(5)], 2:[multFactG(9), divFactG(9)], 3:[R.unitRate, divFactG(9)]},
     frac:{1:[unitFracCmp, fracOfSetG(true)], 2:[fracOfSetG(false), R.eqFrac], 3:[R.addSameDen, R.cmpFrac]},
     alg:{1:[boxAdd, patternNext], 2:[boxMul, patternNext], 3:[boxMul, boxAdd, patternNext]}},
  4:{int:{1:[addBigG(100,999), roundNumG], 2:[mulDigit, subBigG(100,999)], 3:[divRem, mulDigit]},
     ratio:{1:[multFactG(9), divFactG(9)], 2:[R.unitRate, mulDigit], 3:[divRem, R.unitRate]},
     frac:{1:[R.eqFrac, unitFracCmp], 2:[R.cmpFrac, R.addSameDen], 3:[mixedImp, fracOfSetG(false)]},
     alg:{1:[boxAdd, patternNext], 2:[boxMul, R.oneStepAdd], 3:[R.orderOps, R.oneStepMul]}},
  5:{int:{1:[decAddG, roundNumG], 2:[R.decMul, divRem], 3:[R.orderOpsParen, R.decMul]},
     ratio:{1:[R.unitRate, R.scaleRecipe], 2:[fracOfSetG(false), R.scaleRecipe], 3:[R.easyPct, R.simplifyRatio]},
     frac:{1:[R.addSameDen, R.eqFrac], 2:[R.addUnlikeDen, R.subFrac], 3:[R.mulFrac, mixedImp]},
     alg:{1:[R.orderOps, R.evalX], 2:[R.orderOpsParen, R.oneStepAdd], 3:[R.oneStepMul, R.evalX]}},
  6:{int:{1:[R.addInt, R.cmpInt, R.absVal], 2:[R.subToNeg, R.subNeg], 3:[R.mulInt, R.addLarger]},
     ratio:{1:[R.unitRate, R.simplifyRatio, R.easyPct], 2:[R.pctOf, R.ratioShare], 3:[R.propSolve, R.findWhole]},
     frac:{1:[R.frac2dec, R.dec2frac], 2:[R.addUnlikeDen, R.subFrac], 3:[R.divFrac, R.frac2pct]},
     alg:{1:[R.evalX, R.oneStepAdd], 2:[R.oneStepMul, R.twoStep], 3:[R.twoStep, R.evalTwoVar]}},
  7:{int:{1:[R.subNeg, R.mulInt], 2:[R.divInt, R.addLarger], 3:[R.mixedInt, R.doubleSub]},
     ratio:{1:[R.pctOf, R.propSolve], 2:[R.ratioShare, R.findWhole], 3:[R.pctChange, R.scaleRecipe]},
     frac:{1:[R.mulFrac, R.frac2pct], 2:[R.divFrac, R.decMul], 3:[R.divFrac, R.mulFrac, R.frac2pct]},
     alg:{1:[R.twoStep, R.orderOpsParen], 2:[R.twoStepNeg, R.distrib], 3:[R.twoStepNeg, R.evalTwoVar]}},
  8:{int:{1:[powersG, sqrootG], 2:[sciNotG, powersG], 3:[sciNotG, sqrootG]},
     ratio:{1:[R.pctChange, R.findWhole], 2:[slope2G, R.propSolve], 3:[slope2G, R.pctChange]},
     frac:{1:[R.decMul, R.frac2pct], 2:[R.divFrac, R.dec2frac], 3:[R.mulFrac, R.divFrac]},
     alg:{1:[combineLikeG, R.distrib], 2:[multiStepG, R.twoStepNeg], 3:[multiStepG, combineLikeG]}}
};


export { R, GRADE_WORLDS, CURRICULUM };
