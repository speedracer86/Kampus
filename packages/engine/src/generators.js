/* The generator library: every function returns {prompt, q, ans, wrongs, skill, steps}.
   Registered by topic and tier in GEN; the curriculum maps grades onto this registry.
   Extracted verbatim from the v1 single-file app — behavior-preserving. */
import { ri, pick, shuffle, gcd, simp, frH, sfrH, fmt, numLineSVG, fracBar, vizRow, Q, dspN, dspP, pctSteps } from './util.js';

const GEN = {frac:{1:[],2:[],3:[]}, ratio:{1:[],2:[],3:[]}, int:{1:[],2:[],3:[]}, alg:{1:[],2:[],3:[]}};

/* ---------- FRACTIONS & DECIMALS ---------- */
GEN.frac[1].push(
  function eqFrac(){
    const b = ri(2,6), a = ri(1,b-1), k = ri(2,5);
    return Q('Finish the pair', `${frH(a,b)} &nbsp;=&nbsp; ${frH('?', b*k)}`,
      a*k, [a+k, a*k+ri(1,3), a*(k+1)], 'Equivalent fractions', [
        `The bottom went from ${b} to ${b*k} — it was multiplied by ${k}.`,
        `Whatever happens to the bottom must happen to the top too.`,
        `Top: ${a} × ${k} = <b>${a*k}</b>. Same amount, just cut into smaller pieces: ${vizRow(fracBar(a,b), '<b>=</b>', fracBar(a*k, b*k, '#2db56c'))}`]);
  },
  function cmpFrac(){
    let a,b,c,d;
    do{ b=ri(2,8); a=ri(1,b-1); d=ri(2,8); c=ri(1,d-1); }while(a*d===c*b);
    const bigFirst = a*d>c*b;
    const ans = bigFirst?frH(a,b):frH(c,d);
    return Q('Which is bigger?', `${frH(a,b)} &nbsp;or&nbsp; ${frH(c,d)}`,
      ans, [bigFirst?frH(c,d):frH(a,b), "they're equal"], 'Comparing fractions', [
        `First LOOK at them side by side: ${vizRow(fracBar(a,b), '<b>vs</b>', fracBar(c,d,'#2db56c'))}`,
        `To be sure, cross-multiply: ${a} × ${d} = ${a*d} &nbsp;and&nbsp; ${c} × ${b} = ${c*b}.`,
        `${Math.max(a*d,c*b)} is bigger, so <b>${ans}</b> is the bigger fraction.`]);
  },
  function addSameDen(){
    const d = ri(4,9), a = ri(1,d-2), c = ri(1,d-1-a);
    const ans = sfrH(a+c,d);
    const g = gcd(a+c,d);
    const third = (a*c===a+c || a*c===0) ? a+c+2 : a*c;   // never equal in value to the answer
    const w = [frH(a+c, d*2), frH(a+c+1, d), frH(third, d)].filter(x=>x!==ans);
    const steps = [
      `The bottoms match (both ${d}), so keep the bottom and just add the tops. ${vizRow(fracBar(a,d), '<b>+</b>', fracBar(c,d,'#2db56c'))}`,
      `Tops: ${a} + ${c} = ${a+c}, giving ${frH(a+c,d)}. ${vizRow(fracBar(a+c,d,'#ffc12e'))}`];
    if(g>1) steps.push(`Simplify: divide top and bottom by ${g} → <b>${ans}</b>.`);
    return Q('Add', `${frH(a,d)} + ${frH(c,d)}`, ans, w, 'Adding fractions (same denominator)', steps);
  }
);
GEN.frac[2].push(
  function addUnlikeDen(){
    const dens = shuffle([2,3,4,5,6,8]); const b=dens[0], d=dens[1];
    const a=ri(1,b-1), c=ri(1,d-1);
    const n = a*d + c*b, den = b*d;
    const ans = sfrH(n,den);
    const w = [frH(a+c, b+d), sfrH(n+b, den), frH(a*c, b*d)].filter(x=>x!==ans);
    const steps = [
      `The bottoms are different — make them match. ${b} × ${d} = ${den} works.`,
      `${frH(a,b)} = ${frH(a*d,den)} &nbsp;and&nbsp; ${frH(c,d)} = ${frH(c*b,den)}.`,
      `Now add the tops: ${a*d} + ${c*b} = ${n} → ${frH(n,den)}${sfrH(n,den)!==frH(n,den)? ' = <b>'+ans+'</b>' : ''}.`];
    return Q('Add', `${frH(a,b)} + ${frH(c,d)}`, ans, w, 'Adding fractions (unlike denominators)', steps);
  },
  function subFrac(){
    const dens = shuffle([2,3,4,6,8]); let b=dens[0], d=dens[1];
    let a=ri(1,b-1), c=ri(1,d-1);
    if(a*d < c*b){ const ta=a, tb=b; a=c; b=d; c=ta; d=tb; }   // keep first fraction the bigger one
    const n = a*d - c*b, den = b*d;
    const ans = sfrH(n,den);
    const w = [frH(Math.abs(a-c)||1, Math.abs(b-d)||2), sfrH(n+b, den), frH(a*c, b*d)].filter(x=>x!==ans);
    const steps = [
      `The bottoms are different — make them match. ${b} × ${d} = ${den} works.`,
      `${frH(a,b)} = ${frH(a*d,den)} &nbsp;and&nbsp; ${frH(c,d)} = ${frH(c*b,den)}.`,
      `Subtract the tops: ${a*d} − ${c*b} = ${n} → ${frH(n,den)}${sfrH(n,den)!==frH(n,den)? ' = <b>'+ans+'</b>' : ''}.`];
    return Q('Subtract', `${frH(a,b)} − ${frH(c,d)}`, ans, w, 'Subtracting fractions', steps);
  },
  function frac2dec(){
    const opts = [[1,2,'0.5',5],[1,4,'0.25',25],[3,4,'0.75',25],[1,5,'0.2',2],[2,5,'0.4',2],[3,5,'0.6',2],[4,5,'0.8',2],[1,8,'0.125',125],[3,8,'0.375',125],[5,8,'0.625',125],[7,8,'0.875',125],[7,10,'0.7',1],[9,20,'0.45',5],[3,25,'0.12',4]];
    const [n,d,ans,mult] = pick(opts);
    const v = n/d;
    const w = [fmt(v*10), fmt(Math.round((v+0.1)*100)/100), fmt(d/ (n*10))].filter(x=>x!==ans);
    w.push(fmt(Math.round((v-0.05)*100)/100));
    const steps = mult===1
      ? [`The bottom is already 10, so ${frH(n,d)} means ${n} tenths.`, `${n} tenths = <b>${ans}</b>.`]
      : [`Make the bottom a power of ten: multiply top and bottom by ${mult}.`,
         `${frH(n,d)} = ${frH(n*mult, d*mult)}.`,
         `${n*mult} over ${d*mult} = <b>${ans}</b>.`];
    return Q('As a decimal', `${frH(n,d)} = ?`, ans, w.filter(x=>x!==ans), 'Fractions → decimals', steps);
  },
  function dec2frac(){
    const opts = [['0.5',1,2],['0.25',1,4],['0.75',3,4],['0.2',1,5],['0.6',3,5],['0.4',2,5],['0.8',4,5],['0.1',1,10],['0.3',3,10],['0.7',7,10],['0.9',9,10]];
    const [dec,n,d] = pick(opts);
    const base = dec.length===4 ? 100 : 10;
    const t = Math.round(parseFloat(dec)*base);
    const g = gcd(t,base);
    const ans = frH(n,d);
    const w = [frH(n, d*10), frH(d, n===d?n+1:n), frH(n+1, d)].filter(x=>x!==ans);
    const steps = [`${dec} means ${t} ${base===100?'hundredths':'tenths'}: ${frH(t,base)}.`];
    if(g>1) steps.push(`Simplify: divide top and bottom by ${g} → <b>${ans}</b>.`);
    else steps.push(`${t} and ${base} share no common factor, so it's already in simplest form: <b>${ans}</b>.`);
    return Q('As a fraction', `${dec} = ?`, ans, w, 'Decimals → fractions', steps);
  }
);
GEN.frac[3].push(
  function mulFrac(){
    const b=ri(2,6), a=ri(1,b-1), d=ri(2,6), c=ri(1,d-1);
    const ans = sfrH(a*c, b*d);
    const w = [sfrH(a*d + c*b, b*d), frH(a+c, b+d), sfrH(Math.max(1,a*d), Math.max(2,b*c))].filter(x=>x!==ans);
    const steps = [
      `Multiply straight across — tops together, bottoms together.`,
      `Tops: ${a} × ${c} = ${a*c}. Bottoms: ${b} × ${d} = ${b*d}.`,
      `${frH(a*c,b*d)}${sfrH(a*c,b*d)!==frH(a*c,b*d)? ' = <b>'+ans+'</b>' : ''}.`];
    return Q('Multiply', `${frH(a,b)} × ${frH(c,d)}`, ans, w, 'Multiplying fractions', steps);
  },
  function divFrac(){
    const b=ri(2,5), a=ri(1,b), d=ri(2,5), c=ri(1,d-1);
    const ans = sfrH(a*d, b*c);
    const w = [sfrH(a*c, b*d), sfrH(b*c, Math.max(1,a*d)), frH(a, b*c)].filter(x=>x!==ans);
    const steps = [
      `Dividing by a fraction = multiplying by its flip (the reciprocal).`,
      `Flip ${frH(c,d)} into ${frH(d,c)}, then multiply: ${frH(a,b)} × ${frH(d,c)}.`,
      `${frH(a*d,b*c)}${sfrH(a*d,b*c)!==frH(a*d,b*c)? ' = <b>'+ans+'</b>' : ''}.`];
    return Q('Divide', `${frH(a,b)} ÷ ${frH(c,d)}`, ans, w, 'Dividing fractions', steps);
  },
  function decMul(){
    const A = ri(2,9), B = ri(2,9);
    const ans = fmt(A*B/100);
    const w = [fmt(A*B/10), fmt((A+B)/10), fmt(A*B)].filter(x=>x!==ans);
    const steps = [
      `Ignore the decimal points first: ${A} × ${B} = ${A*B}.`,
      `Count decimal digits in the question: 1 + 1 = 2.`,
      `Move the point 2 places left: <b>${ans}</b>.`];
    return Q('Multiply', `${fmt(A/10)} × ${fmt(B/10)}`, ans, w, 'Multiplying decimals', steps);
  },
  function frac2pct(){
    const opts = [[1,2,50],[1,4,25],[3,4,75],[1,5,20],[2,5,40],[3,5,60],[4,5,80],[1,10,10],[7,10,70],[9,10,90],[1,8,12.5],[3,8,37.5]];
    const [n,d,p] = pick(opts);
    const ans = fmt(p)+'%';
    const w = [`${n}${d}%`, fmt(p/10)+'%', fmt(100-p)+'%'].filter(x=>x!==ans);
    const steps = [
      `Percent means "out of 100" — make the bottom 100.`,
      `Multiply top and bottom by ${fmt(100/d)}: ${frH(n,d)} = ${frH(fmt(p),100)}.`,
      `So it's <b>${ans}</b>.`];
    return Q('As a percent', `${frH(n,d)} = ?`, ans, w, 'Fractions → percents', steps);
  }
);

/* ---------- RATIOS / PERCENTS / PROPORTIONS ---------- */
GEN.ratio[1].push(
  function unitRate(){
    const n = pick([2,3,4,5,6]), p = ri(2,9);
    const item = pick(['pets','power-ups','skins','pizza slices','speed coils']);
    return Q('Unit rate', `${n} ${item} cost $${n*p}.<br>How much is 1?`,
      '$'+p, ['$'+(p+1), '$'+(p-1||p+2), '$'+(p+n)], 'Unit rates', [
        `"Unit rate" = the price of ONE. Share the total equally.`,
        `$${n*p} ÷ ${n} = ${p}.`,
        `One costs <b>$${p}</b>.`]);
  },
  function simplifyRatio(){
    let a,b; do{ a=ri(2,9); b=ri(2,9); }while(a===b || gcd(a,b)>1);
    const g = ri(2,6);
    return Q('Simplify the ratio', `${a*g} : ${b*g}`,
      `${a} : ${b}`, [`${b} : ${a}`, `${a+1} : ${b}`, `${a*g} : ${b}`], 'Simplifying ratios', [
        `Find the biggest number that divides into both ${a*g} and ${b*g}: it's ${g}.`,
        `${a*g} ÷ ${g} = ${a} &nbsp;and&nbsp; ${b*g} ÷ ${g} = ${b}.`,
        `So the ratio is <b>${a} : ${b}</b>.`]);
  },
  function easyPct(){
    const p = pick([10,25,50]), base = pick([20,40,60,80,120,200]);
    const ans = base*p/100;
    return Q('Percent', `${p}% of ${base}`, ans, [ans*10, ans/2||ans+5, ans+p/5], 'Easy percents',
      pctSteps(p, base, ans));
  }
);
GEN.ratio[2].push(
  function pctOf(){
    const p = pick([5,15,20,30,40,60,75]), base = pick([20,40,60,80,120,140,160,180,200]);
    const ans = base*p/100;
    return Q('Percent', `${p}% of ${base}`, fmt(ans), [fmt(ans*10), fmt(ans+base/20), fmt(Math.max(1,ans-base/20))].filter(x=>x!==fmt(ans)), 'Percent of a number',
      pctSteps(p, base, ans));
  },
  function propSolve(){
    const b=ri(2,6), a=ri(1,b), k=ri(2,6);
    return Q('Solve for x', `${frH(a,b)} = ${frH('x', b*k)}`,
      'x = '+(a*k), ['x = '+(a+k), 'x = '+(a*k+b), 'x = '+(b*k-a)], 'Proportions', [
        `Look at the bottoms: ${b} → ${b*k}. That's × ${k}.`,
        `The top must do the same: ${a} × ${k} = ${a*k}.`,
        `<b>x = ${a*k}</b>.`]);
  },
  function ratioShare(){
    let a,b; do{ a=ri(1,5); b=ri(2,6); }while(a>=b);
    const u = ri(2,8), total = (a+b)*u;
    return Q('Ratio share', `You and a friend split ${total} gems in the ratio ${a}:${b}.<br>How many is the <b>smaller</b> share?`,
      a*u, [b*u, Math.round(total/2), u], 'Sharing in a ratio', [
        `Ratio ${a}:${b} means ${a} + ${b} = ${a+b} equal parts.`,
        `One part: ${total} ÷ ${a+b} = ${u}.`,
        `The smaller share gets ${a} parts: ${a} × ${u} = <b>${a*u}</b>.`]);
  }
);
GEN.ratio[3].push(
  function pctChange(){
    const pct = pick([10,20,25,50]), A = pick([20,40,60,80,120]);
    const up = Math.random()<0.6;
    const B = up ? A*(100+pct)/100 : A*(100-pct)/100;
    const ans = pct+'%';
    const diff = Math.abs(B-A);
    const wrongAlt = Math.round(diff/B*100);
    return Q('Percent change', `A trade went from ${A} to ${fmt(B)} coins.<br>What's the percent ${up?'increase':'decrease'}?`,
      ans, [wrongAlt+'%', (pct+10)+'%', diff+'%'].filter(x=>x!==ans), 'Percent change', [
        `Find the change: ${fmt(Math.max(A,B))} − ${fmt(Math.min(A,B))} = ${fmt(diff)}.`,
        `Divide by the ORIGINAL number (${A}, where it started): ${fmt(diff)} ÷ ${A} = ${fmt(diff/A)}.`,
        `${fmt(diff/A)} as a percent = <b>${ans}</b>.`]);
  },
  function findWhole(){
    const p = pick([20,25,30,40,50,60,75]), W = pick([20,40,60,80,120,200]);
    const part = W*p/100;
    return Q('Find the whole', `${fmt(part)} is ${p}% of what number?`,
      W, [fmt(part*p/100)===String(W)?W+10:fmt(part*p/100), W+10, fmt(part*2)].filter(x=>String(x)!==String(W)), 'Finding the whole from a percent', [
        `${fmt(part)} is ${p}%. First find 1%: ${fmt(part)} ÷ ${p} = ${fmt(part/p)}.`,
        `The whole thing is 100%: ${fmt(part/p)} × 100 = <b>${W}</b>.`,
        `Check: ${p}% of ${W} = ${fmt(part)} ✓`]);
  },
  function scaleRecipe(){
    const c = ri(2,6), target = pick([6,8,10]);
    const ans = c*target/4;
    return Q('Scale it up', `A potion for 4 players needs ${c} magic berries.<br>How many for ${target} players?`,
      fmt(ans), [fmt(c + (target-4)), fmt(c*2)===fmt(ans)?fmt(c*3):fmt(c*2), fmt(ans+1)].filter(x=>x!==fmt(ans)), 'Scaling recipes', [
        `Find the amount for ONE player: ${c} ÷ 4 = ${fmt(c/4)}.`,
        `Then multiply by ${target} players: ${fmt(c/4)} × ${target} = <b>${fmt(ans)}</b>.`]);
  }
);
/* ---------- INTEGERS (Frozen Depths) ---------- */
GEN.int[1].push(
  function addInt(){
    const a = -ri(1,12), b = ri(1,12);
    const ans = a+b;
    return Q('Add', `${a} + ${b}`, ans, [Math.abs(a)+b, -(Math.abs(a)+b), ans+pick([-2,2])], 'Adding negatives', [
      `Picture a number line. Start at ${dspN(a)}.`,
      `Adding ${b} means walking ${b} steps to the RIGHT.`,
      `You land on <b>${dspN(ans)}</b>. ${numLineSVG(a, ans)}`]);
  },
  function subToNeg(){
    const b = ri(4,15), a = ri(1,b-1);
    const ans = a-b;
    return Q('Subtract', `${a} − ${b}`, ans, [b-a, -(a+b), ans-1], 'Subtracting into negatives', [
      `You're taking away MORE than you have — the answer dips below zero.`,
      `From ${a}, walk ${b} steps left: ${a} steps get you to 0, then ${b-a} more.`,
      `You land on <b>${dspN(ans)}</b>. ${numLineSVG(a, ans)}`]);
  },
  function cmpInt(){
    const vals = shuffle([-ri(8,15), -ri(1,7), ri(0,5), ri(6,15)]);
    const ans = Math.min(...vals);
    return Q('Which is smallest?', `${vals.join(' &nbsp; ')}`, ans, vals.filter(v=>v!==ans), 'Ordering negatives', [
      `On a number line, smaller = farther LEFT.`,
      `Negative numbers are all left of 0, and the one with the biggest size is the farthest left.`,
      `So the smallest is <b>${dspN(ans)}</b>.`]);
  },
  function absVal(){
    const n = ri(2,20);
    return Q('Distance from zero', `|−${n}| = ?`, n, [-n, n+1, 0], 'Absolute value', [
      `The bars |&nbsp;| ask: how FAR is this number from 0?`,
      `${dspN(-n)} is ${n} steps from 0 — distance is never negative.`,
      `|−${n}| = <b>${n}</b>.`]);
  }
);
GEN.int[2].push(
  function subNeg(){
    const a = ri(-9,9), b = ri(1,12);
    const ans = a+b;
    return Q('Careful with signs…', `${dspN(a)} − (−${b})`, ans, [a-b, -(a+b), b-a].filter(x=>x!==ans), 'Subtracting a negative', [
      `Two minus signs back-to-back cancel out: subtracting a negative = ADDING.`,
      `${dspN(a)} − (−${b}) becomes ${dspN(a)} + ${b}.`,
      `${dspN(a)} + ${b} = <b>${dspN(ans)}</b>. ${numLineSVG(a, ans)}`]);
  },
  function mulInt(){
    const a = ri(2,9)*pick([-1,1]), b = ri(2,9)*pick([-1,1]);
    const ans = a*b;
    const same = (a>0)===(b>0);
    return Q('Multiply', `${dspP(a)} × ${dspP(b)}`, ans, [-ans, Math.abs(a)+Math.abs(b), -(Math.abs(a)+Math.abs(b))].filter(x=>x!==ans), 'Multiplying integers', [
      `First multiply the sizes: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(ans)}.`,
      `Then the sign rule: ${same? 'the signs MATCH, so the answer is positive' : 'the signs are DIFFERENT, so the answer is negative'}.`,
      `Answer: <b>${dspN(ans)}</b>.`]);
  },
  function addLarger(){
    const a = ri(15,45)*pick([-1,1]);
    let bm; do{ bm = ri(15,45); }while(bm===Math.abs(a));
    const b = a>0 ? -bm : bm;
    const ans = a+b;
    const bigM = Math.max(Math.abs(a),Math.abs(b)), smallM = Math.min(Math.abs(a),Math.abs(b));
    return Q('Add', `${dspN(a)} + ${dspP(b)}`, ans, [-ans, Math.abs(a)+Math.abs(b), ans+pick([-3,3])].filter(x=>x!==ans), 'Adding bigger integers', [
      `Opposite signs? It's secretly a subtraction of sizes: ${bigM} − ${smallM} = ${bigM-smallM}.`,
      `The answer takes the sign of the BIGGER size (${bigM} is ${ans<0?'negative':'positive'} here).`,
      `Answer: <b>${dspN(ans)}</b>.`]);
  }
);
GEN.int[3].push(
  function divInt(){
    const q = ri(2,9)*pick([-1,1]), b = ri(2,9)*pick([-1,1]);
    const a = q*b, ans = q;
    const same = (a>0)===(b>0);
    return Q('Divide', `${dspN(a)} ÷ ${dspP(b)}`, ans, [-ans, ans+pick([-2,2]), a*b].filter(x=>x!==ans), 'Dividing integers', [
      `First divide the sizes: ${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(ans)}.`,
      `Sign rule (same as multiplying): ${same? 'signs MATCH → positive' : 'signs DIFFER → negative'}.`,
      `Answer: <b>${dspN(ans)}</b>.`]);
  },
  function mixedInt(){
    const a = ri(-9,9), b = ri(2,6)*pick([-1,1]), c = ri(2,6)*pick([-1,1]);
    const ans = a + b*c;
    return Q('Order of operations', `${dspN(a)} + ${dspP(b)} × ${dspP(c)}`,
      ans, [(a+b)*c, a + b*Math.abs(c), -ans].filter(x=>x!==ans), 'Signed order of operations', [
      `Multiplication comes FIRST: ${dspP(b)} × ${dspP(c)} = ${dspN(b*c)}.`,
      `Now add: ${dspN(a)} + ${dspP(b*c)}.`,
      `Answer: <b>${dspN(ans)}</b>.`]);
  },
  function doubleSub(){
    const a = ri(-10,10), b = ri(1,8), c = ri(1,8);
    const ans = a - b - c;
    return Q('Keep the signs straight', `${dspN(a)} − ${b} − ${c}`, ans, [a-b+c, a+(b+c), ans+pick([-2,2])].filter(x=>x!==ans), 'Chained subtraction', [
      `Work left to right — two trips down the number line.`,
      `${dspN(a)} − ${b} = ${dspN(a-b)}.`,
      `${dspN(a-b)} − ${c} = <b>${dspN(ans)}</b>.`]);
  }
);

/* ---------- PRE-ALGEBRA (Redstone Lab) ---------- */
GEN.alg[1].push(
  function orderOps(){
    const a=ri(2,9), b=ri(2,9), c=ri(2,9);
    const ans = a + b*c;
    return Q('Order of operations', `${a} + ${b} × ${c}`, ans, [(a+b)*c, a*b+c, ans+pick([-1,1])].filter(x=>x!==ans), 'Order of operations', [
      `PEMDAS: multiplication before addition — even though the + comes first.`,
      `${b} × ${c} = ${b*c}.`,
      `${a} + ${b*c} = <b>${ans}</b>.`]);
  },
  function evalX(){
    const x = ri(2,9), m = ri(2,5), a = ri(1,9);
    const ans = m*x+a;
    return Q(`If x = ${x}`, `${m}x + ${a} = ?`, ans, [m+x+a, m*(x+a), ans+pick([-2,2])].filter(v=>v!==ans), 'Evaluating expressions', [
      `${m}x means ${m} × x. Swap in x = ${x}: ${m} × ${x} + ${a}.`,
      `${m} × ${x} = ${m*x}.`,
      `${m*x} + ${a} = <b>${ans}</b>.`]);
  },
  function oneStepAdd(){
    const x = ri(2,20), a = ri(2,15);
    return Q('Solve for x', `x + ${a} = ${x+a}`, 'x = '+x, ['x = '+(x+2*a), 'x = '+(x+a), 'x = '+(x+1)], 'One-step equations (+/−)', [
      `x has "+ ${a}" stuck to it. Undo it with the OPPOSITE: subtract ${a} from both sides.`,
      `x = ${x+a} − ${a}.`,
      `<b>x = ${x}</b>. Check: ${x} + ${a} = ${x+a} ✓`]);
  }
);
GEN.alg[2].push(
  function oneStepMul(){
    const x = ri(2,12), a = ri(2,9);
    return Q('Solve for x', `${a}x = ${a*x}`, 'x = '+x, ['x = '+(a*x-a), 'x = '+(x+a), 'x = '+(x+1)], 'One-step equations (×/÷)', [
      `${a}x means ${a} × x. Undo "× ${a}" with the opposite: divide both sides by ${a}.`,
      `x = ${a*x} ÷ ${a}.`,
      `<b>x = ${x}</b>. Check: ${a} × ${x} = ${a*x} ✓`]);
  },
  function twoStep(){
    const x = ri(2,9), a = ri(2,5), b = ri(1,9);
    const c = a*x+b;
    return Q('Solve for x', `${a}x + ${b} = ${c}`, 'x = '+x, ['x = '+(c-b), 'x = '+fmt(Math.round((c+b)/a*10)/10), 'x = '+(x+1)].filter(s=>s!=='x = '+x), 'Two-step equations', [
      `Peel it like an onion — undo the + first, then the ×.`,
      `Subtract ${b} from both sides: ${a}x = ${c} − ${b} = ${c-b}.`,
      `Divide by ${a}: x = ${c-b} ÷ ${a} = <b>${x}</b>.`]);
  },
  function orderOpsParen(){
    const a=ri(2,8), b=ri(2,8), c=ri(2,5), d=ri(1,10);
    const ans = (a+b)*c - d;
    return Q('Order of operations', `(${a} + ${b}) × ${c} − ${d}`, ans, [a + b*c - d, (a+b)*(c-d), ans+pick([-2,2])].filter(x=>x!==ans), 'Order of operations (parentheses)', [
      `Parentheses FIRST: ${a} + ${b} = ${a+b}.`,
      `Then multiply: ${a+b} × ${c} = ${(a+b)*c}.`,
      `Then subtract: ${(a+b)*c} − ${d} = <b>${ans}</b>.`]);
  }
);
GEN.alg[3].push(
  function twoStepNeg(){
    let x; do{ x = ri(-9,9); }while(x===0);
    const a = ri(2,6), b = ri(1,12);
    const c = a*x - b;
    return Q('Solve for x', `${a}x − ${b} = ${dspN(c)}`, 'x = '+x, ['x = '+(c+b), 'x = '+(-x), 'x = '+(x+pick([-2,2]))].filter(s=>s!=='x = '+x), 'Two-step equations (negatives)', [
      `Undo the "− ${b}" first: add ${b} to both sides.`,
      `${a}x = ${dspN(c)} + ${b} = ${dspN(a*x)}.`,
      `Divide by ${a}: x = ${dspN(a*x)} ÷ ${a} = <b>${dspN(x)}</b>.`]);
  },
  function distrib(){
    const x = ri(1,9), a = ri(2,5), b = ri(1,6);
    const c = a*(x+b);
    return Q('Solve for x', `${a}(x + ${b}) = ${c}`, 'x = '+x, ['x = '+(c-b), 'x = '+(x+b), 'x = '+fmt(Math.round((c-b)/a*10)/10)].filter(s=>s!=='x = '+x), 'Distributing', [
      `The whole group (x + ${b}) is multiplied by ${a}. Divide both sides by ${a} first.`,
      `x + ${b} = ${c} ÷ ${a} = ${x+b}.`,
      `Subtract ${b}: x = ${x+b} − ${b} = <b>${x}</b>.`]);
  },
  function evalTwoVar(){
    const x=ri(2,7), y=ri(2,7), a=ri(2,5), b=ri(2,5);
    const ans = a*x + b*y;
    return Q(`If x = ${x} and y = ${y}`, `${a}x + ${b}y = ?`, ans, [a*x*b*y, (a+b)*(x+y), ans+pick([-2,2])].filter(v=>v!==ans), 'Two-variable expressions', [
      `Handle each piece separately.`,
      `${a}x = ${a} × ${x} = ${a*x} &nbsp;and&nbsp; ${b}y = ${b} × ${y} = ${b*y}.`,
      `Add them: ${a*x} + ${b*y} = <b>${ans}</b>.`]);
  }
);


export { GEN };
