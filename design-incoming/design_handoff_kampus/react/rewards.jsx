// ===== rewards.jsx (locked 9a, 2026-10-20) =====
// Real-money rewards. All amounts are integer cents; always render with usd() (two decimals).
const usd = c => '$' + (c / 100).toFixed(2);
const rInk = '#23252B', rRule = '#EEECE7', rMono = "'IBM Plex Mono', ui-monospace, monospace";

/** Left-column money receipt. Props: owner, receiptNo, dateLine, earned [{day, desc, cents}], weekCap (cents),
 *  held [{name, cents}], total (cents in bank), goal {name, cents}. Available = total − held. */
function MoneyReceipt({ owner = 'Talia', receiptNo = '0042', dateLine, earned = [], weekCap = 500, held = [], total = 0, goal }) {
  const sub = earned.reduce((a, r) => a + r.cents, 0), hold = held.reduce((a, r) => a + r.cents, 0), avail = total - hold;
  const dash = <div style={{ borderTop: '1.5px dashed rgba(35,37,43,.3)' }} />;
  const head = t => <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em' }}>{t}</div>;
  const line = (l, r, st) => <div style={{ display: 'flex', gap: 10, ...st }}><span style={{ flex: 1 }}>{l}</span><span>{r}</span></div>;
  const n = goal ? Math.min(10, Math.round(avail / goal.cents * 10)) : 0;
  return <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: '#fff', padding: '28px 26px 22px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: rMono, fontSize: 13, lineHeight: 1.45, color: rInk }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.14em' }}>KAMPUS BANK</div>
        <div>{owner}'s money · receipt #{receiptNo}</div>
        {dateLine && <div style={{ color: 'rgba(35,37,43,.6)' }}>{dateLine}</div>}
      </div>
      {dash}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {head('EARNED THIS WEEK')}
        {earned.map((r, i) => <div key={i} style={{ display: 'flex', gap: 10 }}><span style={{ color: 'rgba(35,37,43,.55)' }}>{r.day}</span><span style={{ flex: 1 }}>{r.desc}</span><span>+{usd(r.cents)}</span></div>)}
        {line('Subtotal', '+' + usd(sub), { fontWeight: 700, paddingTop: 4 })}
        {line('Weekly limit ' + usd(weekCap), usd(Math.max(0, weekCap - sub)) + ' left', { color: 'rgba(35,37,43,.6)' })}
      </div>
      {dash}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {head('HELD FOR ASKS')}
        {held.length ? held.map((r, i) => <React.Fragment key={i}>{line(r.name, '−' + usd(r.cents))}</React.Fragment>) : <div style={{ color: 'rgba(35,37,43,.6)' }}>Nothing held</div>}
      </div>
      {dash}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><span style={{ flex: 1, fontWeight: 700, letterSpacing: '.08em' }}>AVAILABLE</span><span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-.02em' }}>{usd(avail)}</span></div>
      {line('Total in the bank', usd(total), { color: 'rgba(35,37,43,.6)' })}
      {goal && <>{dash}<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {head('SAVING FOR')}<div>{goal.name}</div>
        {line('■'.repeat(n) + '□'.repeat(10 - n), goal.cents > avail ? usd(goal.cents - avail) + ' to go' : 'You can ask for it', { letterSpacing: '.02em' })}
      </div></>}
      <div style={{ textAlign: 'center', color: 'rgba(35,37,43,.6)', paddingTop: 6 }}>Keep it up, {owner}.</div>
    </div>
    <div style={{ height: 10, background: 'linear-gradient(135deg,#fff 7px,transparent 0) 0 0/14px 10px repeat-x,linear-gradient(225deg,#fff 7px,transparent 0) 0 0/14px 10px repeat-x' }} />
  </div>;
}

/** Pill button with the three reward states. state: 'ask' | 'asked' | 'saving' | 'save' | 'need'. */
function RewardButton({ state, label, onClick, minWidth = 128 }) {
  const s = { ask: [rInk, '#fff'], asked: ['#FBF6E4', '#8A6D1C'], saving: ['#E3F3E6', '#2E7C46'], save: ['#F5F7F9', rInk], need: ['#F5F7F9', 'rgba(35,37,43,.45)'] }[state];
  const live = state === 'ask' || state === 'save';
  return <button onClick={live ? onClick : undefined} style={{ minWidth, padding: '12px 18px', borderRadius: 999, border: 0, background: s[0], color: s[1], fontFamily: 'inherit', fontSize: 14, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', cursor: live ? 'pointer' : 'default' }}>{label}</button>;
}

/** Paste-a-link field: kid pastes a store URL; grown-up sees it on the wishlist. */
function StoreLinkPaste({ onAdd = () => {} }) {
  const [v, setV] = React.useState('');
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 8px 22px', borderRadius: 999, background: '#F5F7F9' }}>
    <input value={v} onChange={e => setV(e.target.value)} placeholder="Paste a link from Amazon, Target or any store" style={{ flex: 1, border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 15, outline: 'none', color: rInk }} />
    <RewardButton state="ask" label="Add to wishlist" minWidth={0} onClick={() => { if (v) { onAdd(v); setV(''); } }} />
  </div>;
}

/** Store wishlist row. Props: name, store, cents, available (cents), isGoal, asked, image (url), onAsk, onGoal. */
function WishlistRow({ name, store, cents, available, isGoal, asked, image, onAsk, onGoal }) {
  const can = cents <= available;
  const st = asked ? 'asked' : can ? 'ask' : isGoal ? 'saving' : 'save';
  const label = { asked: 'Asked ✓', ask: 'Ask for it', saving: 'Saving ✓', save: 'Save for it' }[st];
  return <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) 120px auto', alignItems: 'center', gap: 16, padding: '16px 28px', borderTop: '1px solid ' + rRule }}>
    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F5F7F9' + (image ? ' center/cover url(' + image + ')' : '') }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.015em' }}>{name}</div>
      <div style={{ fontSize: 13.5, color: 'rgba(35,37,43,.6)' }}>{store} · {usd(cents)}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 6, borderRadius: 999, background: '#EEF1F4', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 999, background: '#2E7C46', width: Math.min(100, available / cents * 100) + '%' }} /></div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(35,37,43,.6)' }}>{asked ? 'Asked' : can ? 'You have enough' : usd(cents - available) + ' to go'}</div>
    </div>
    <RewardButton state={st} label={label} onClick={can ? onAsk : onGoal} />
  </div>;
}

/** At-home reward row (set by a grown-up). Props: name, sub, blob, cents, available, asked, onAsk, blobDir. */
function HomeRewardRow({ name, sub, blob, cents, available, asked, onAsk, blobDir = 'blobs/' }) {
  const can = cents <= available, st = asked ? 'asked' : can ? 'ask' : 'need';
  return <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 32px', borderTop: '1px solid ' + rRule }}>
    <div style={{ width: 52, height: 52, flex: 'none', borderRadius: 999, background: '#F5F7F9 center/40px 40px no-repeat url(' + blobDir + blob + '.svg)' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.015em' }}>{name}</div>
      <div style={{ fontSize: 13.5, color: 'rgba(35,37,43,.6)' }}>{sub}</div>
    </div>
    <div style={{ fontWeight: 300, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums', fontSize: 28 }}>{usd(cents)}</div>
    <RewardButton state={st} label={asked ? 'Asked ✓' : can ? 'Ask for it' : 'Need ' + usd(cents - available) + ' more'} onClick={onAsk} />
  </div>;
}

/** Full Rewards screen body (9a): receipt left, one white sheet right (headline · paste · From stores · At home · Waiting). */
function RewardsScreen({ owner = 'Talia', total = 450, earned, store = [], home = [], blobDir = 'blobs/' }) {
  const [asked, setAsked] = React.useState([]), [goal, setGoal] = React.useState(store.length ? store[store.length - 1].id : null);
  const all = store.concat(home), held = all.filter(x => asked.includes(x.id)).map(x => ({ name: x.name, cents: x.cents, id: x.id }));
  const avail = total - held.reduce((a, x) => a + x.cents, 0), g = store.find(x => x.id === goal);
  const ask = id => () => setAsked(a => a.concat(id));
  const h2 = t => <div style={{ padding: '24px 32px 12px', borderTop: '1px solid ' + rRule, fontSize: 15, fontWeight: 700 }}>{t}</div>;
  return <div style={{ fontFamily: "'Inter Tight', sans-serif", color: rInk, background: '#F5F7F9', display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', columnGap: 32, padding: '32px 32px 40px', alignItems: 'start' }}>
    <MoneyReceipt owner={owner} dateLine="Mon Oct 20 2026 · 4:12 PM" earned={earned} total={total} held={held} goal={g} />
    <div style={{ background: '#fff', borderRadius: 28, overflow: 'hidden' }}>
      <div style={{ padding: '32px 32px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-.025em', color: 'rgba(35,37,43,.55)', maxWidth: 620 }}>Real rewards, <span style={{ color: rInk }}>picked by you,</span> okayed by a grown-up.</div>
        <StoreLinkPaste />
      </div>
      <div style={{ padding: '0 32px 12px', fontSize: 15, fontWeight: 700 }}>From stores</div>
      {store.map(s => <WishlistRow key={s.id} {...s} available={avail} isGoal={goal === s.id} asked={asked.includes(s.id)} onAsk={ask(s.id)} onGoal={() => setGoal(s.id)} />)}
      {h2('At home')}
      {home.map(m => <HomeRewardRow key={m.id} {...m} available={avail} asked={asked.includes(m.id)} onAsk={ask(m.id)} blobDir={blobDir} />)}
      {h2('Waiting on a grown-up')}
      {held.length === 0 ? <div style={{ padding: '6px 32px 26px', fontSize: 15, color: 'rgba(35,37,43,.55)' }}>Nothing pending. Ask for something above.</div>
        : held.map(x => <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 32px', borderTop: '1px solid ' + rRule, background: '#FBF6E4' }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#E8C94F' }} />
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{x.name}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8A6D1C' }}>{usd(x.cents)} held</div>
          <button onClick={() => setAsked(a => a.filter(i => i !== x.id))} style={{ padding: '9px 14px', borderRadius: 999, border: 0, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        </div>)}
    </div>
  </div>;
}

const DEMO_REWARDS = {
  earned: [{ day: 'Mon', desc: 'Lesson done', cents: 50 }, { day: 'Tue', desc: 'Lesson done', cents: 50 }, { day: 'Wed', desc: 'Took unit quiz', cents: 100 }, { day: 'Thu', desc: 'Lesson done', cents: 50 }, { day: 'Fri', desc: '5-day streak', cents: 50 }],
  store: [
    { id: 'slime', name: 'Glow-in-the-dark slime kit', store: 'Amazon', cents: 399 },
    { id: 'rope', name: 'Speed jump rope', store: 'Target', cents: 699 },
    { id: 'book', name: 'Wings of Fire, Book 1', store: 'Amazon', cents: 799 },
    { id: 'sketch', name: 'Sketchbook and 24 markers', store: 'Walmart', cents: 950 },
    { id: 'lego', name: 'LEGO Classic creative box', store: 'Amazon', cents: 1499 }],
  home: [
    { id: 'screen', name: '30 min of screen time', sub: 'Any day after math', blob: 'Laptop', cents: 150 },
    { id: 'movie', name: 'Pick the family movie', sub: 'Friday or Saturday night', blob: 'Photography', cents: 200 },
    { id: 'late', name: 'Stay up 30 min later', sub: 'Weekends only', blob: 'Vision', cents: 250 },
    { id: 'dinner', name: "Pick what's for dinner", sub: 'Within reason', blob: 'Eating', cents: 300 },
    { id: 'trip', name: 'Store trip', sub: 'Pick something out', blob: 'Cash', cents: 500 },
    { id: 'sleep', name: 'Friend sleepover', sub: 'Plan it with a grown-up', blob: 'Party', cents: 500 }],
};

export { usd, MoneyReceipt, RewardButton, StoreLinkPaste, WishlistRow, HomeRewardRow, RewardsScreen, DEMO_REWARDS };
