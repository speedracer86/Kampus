import { color } from './tokens.js';
import { Button, Card, Kicker, Chip, ProgressBar, Toggle, Segmented, TierDots, KreditCoin, TicketIcon, Logo, Blob, TextField, RadioGroup, Checkbox, Select, Stepper } from './primitives.jsx';
import { NavBar, GradeCard, WorldTile, KreditsWeekCard, TeachConfirm } from './app.jsx';
import { QuizRound, EndOfRound, TeachPanel, NumberLine, FractionPieces, MoneyCounter, Thermometer } from './quiz.jsx';
import { ParentAnalytics, TicketAdmin, ParentSettings, ParentOnboarding } from './parent.jsx';
import { StudentOnboarding, RewardsPanel, ShopGrid } from './flows.jsx';
import { HomeScreen, PinGate } from './home.jsx';
import { DailyQuests, QuestChip, CampusMap, CampusPage } from './gamify.jsx';

function Row({ title, children }) {
  return <div style={{ marginBottom: 40 }}>
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A8578', marginBottom: 14 }}>{title}</div>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>{children}</div></div>;
}
function Frame({ w = 720, h, children }) {
  return <div style={{ width: w, height: h, flex: 'none', border: '1px solid #E5E2DA', borderRadius: 10, overflow: 'hidden', background: '#F7F5F1' }}>{children}</div>;
}

const DEMO_QUESTS = [
  { id: 'q1', label: 'Fix 2 on the second look', progress: 1, target: 2, reward: 30 },
  { id: 'q2', label: 'One round with no help', progress: 1, target: 1, reward: 40, done: true }];
const DEMO_DISTRICTS = [
  { grade: 3, name: 'The Bakery', unlocked: true },
  { grade: 4, name: 'The Arcade', unlocked: false },
  { grade: 5, name: 'The Pet Shop', unlocked: false },
  { grade: 6, name: 'The Bus Line', unlocked: false },
  { grade: 7, name: 'The Cinema', unlocked: false },
  { grade: 8, name: 'The Skate Park', unlocked: false }];
const DEMO_HOME = {
  headline: 'You earned 210 Kredits this week.',
  grades: [
    { grade: 3, status: 'passed', detail: 'test passed' }, { grade: 4, status: 'current', pct: 42, detail: '2/4 worlds ready' },
    { grade: 5, status: 'locked', detail: 'after grade 4' }, { grade: 6, status: 'locked', detail: 'after grade 5' },
    { grade: 7, status: 'locked', detail: 'after grade 6' }, { grade: 8, status: 'locked', detail: 'after grade 7' }],
  jumpBack: { world: 'The Kitchen', tier: 2, skill: 'recipes & slices', blob: 'Ice_cream', color: '#F0AFCE' },
  worlds: [
    { name: 'The Kitchen', skill: 'recipes, slices & percents', worldColor: '#F0AFCE', blob: 'Ice_cream', tierLabel: '01 · Tier 2', tier: 2 },
    { name: 'The Store', skill: 'deals, change & money', worldColor: '#F4BE93', blob: 'Cash', tierLabel: '02 · Tier 3', tier: 3 },
    { name: 'The Trip', skill: 'weather, time & negatives', worldColor: '#5E9FE0', blob: 'Rain', tierLabel: '03 · Tier 1', tier: 1 },
    { name: 'The Build', skill: 'measuring & balancing', worldColor: '#8F97DE', blob: 'Learning', tierLabel: '04 · Tier 2', tier: 2 }],
  testReady: { grade: 4, note: 'All four worlds at tier 2+. 20 questions, 16 to pass. +3 tickets.' },
  tickets: 6, nextReward: { name: '$5 treat / 500 Kredits', cost: 10 },
  weekEarned: 210, weekSpent: 90, weekHint: 'Spent = help + shop. Thinking is free.',
  recentRuns: [
    { world: 'The Store', color: '#F4BE93', meta: '11/12 · +96 Kredits' },
    { world: 'The Kitchen', color: '#F0AFCE', meta: '9/12 · +64 Kredits' }],
};

const DEMO_QS = [
  { text: 'Pizza party for 6 kids. Each kid eats 3 slices. How many slices do you need?', mode: 'choice', choices: ['15', '18', '21', '12'], answerIndex: 1,
    teach: ['6 kids, 3 slices each.', 'That is 6 groups of 3.', '6 × 3 = 18 slices.'] },
  { text: 'A pizza has 8 slices. Shade how much of one pizza 6 slices is.', mode: 'fraction', vis: { parts: 8, target: 6 },
    teach: ['One pizza = 8 equal slices.', 'You are taking 6 of the 8.', 'Shade 6 pieces: that is 6/8, or 3/4.'] },
  { text: 'Pizzas cost $9 each and you need 3. You have $30. Pay with coins and bills: how much is left?', mode: 'money', vis: { target: 300 },
    teach: ['3 pizzas × $9 = $27.', 'You started with $30.', '$30 − $27 = $3. Make $3.00.'] },
  { text: 'The party starts at 4. Pizza takes 25 min to arrive. Order at 3:35 — how many minutes early is it?', mode: 'numline', vis: { from: 0, to: 10, start: 0, end: 0 },
    teach: ['3:35 plus 25 minutes is 4:00.', 'It lands exactly at start time.', 'That is 0 minutes early — cutting it close!'] },
  { text: 'Dessert: the freezer is at 18° and needs to drop to −4° for ice cream. Set it.', mode: 'thermo', vis: { min: -10, max: 20, target: -4 },
    teach: ['Start at 18 above zero.', 'Drop 18 to reach 0.', 'Keep going 4 more: negative 4.'] },
];

export function Gallery() {
  const [on, setOn] = React.useState(true);
  const [seg, setSeg] = React.useState(15);
  const [nav, setNav] = React.useState('play');
  const [tab, setTab] = React.useState('Upgrades');
  const [quizKey, setQuizKey] = React.useState(0);
  const [txt, setTxt] = React.useState('');
  const [radio, setRadio] = React.useState('b');
  const [chk, setChk] = React.useState(true);
  const [sel, setSel] = React.useState('4');
  const [num, setNum] = React.useState(4);
  return <div style={{ fontFamily: "'Inter Tight', sans-serif", background: '#F7F5F1', minHeight: '100vh' }}>
    <NavBar items={[
      { id: 'play', label: 'Play', dot: color.green },
      { id: 'stand', label: 'My Stand', dot: color.lime },
      { id: 'shop', label: 'Shop', dot: '#8F97DE' },
      { id: 'rewards', label: 'Rewards', dot: color.gold },
      { id: 'parents', label: 'Grown-ups', dot: color.textFaint }]}
      active={nav} onNav={setNav} weekLabel="Week 1 · 3 days" kredits="128" avatar="Thinker" blobDir="blobs/" />
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 32px 60px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 6px' }}>Component library</h1>
      <p style={{ fontSize: 15, color: '#5D5A52', margin: '0 0 34px' }}>Live render of react/ — kid side in Kampus style, Grown-ups surfaces in Modernist structure. Everything is working code: play the quiz, poke the settings.</p>

      <Row title="Home screen — composed, responsive (desktop + phone)">
        <Frame w={960}><HomeScreen data={DEMO_HOME} blobDir="blobs/" /></Frame>
        <Frame w={390}><HomeScreen data={DEMO_HOME} blobDir="blobs/" /></Frame>
      </Row>
      <Row title="Daily quests (Home card + Play HUD chip) · Campus map (teaser + full page)">
        <div style={{ width: 340 }}><DailyQuests quests={DEMO_QUESTS} /></div>
        <QuestChip quest={DEMO_QUESTS[0]} />
        <QuestChip quest={DEMO_QUESTS[1]} />
        <div style={{ width: 560 }}><Card padding={20}><Kicker style={{ marginBottom: 10 }}>your campus</Kicker><CampusMap districts={DEMO_DISTRICTS} teaser /></Card></div>
      </Row>
      <Row title="Campus page — full">
        <Frame w={960}><CampusPage districts={DEMO_DISTRICTS} /></Frame>
      </Row>
      <Row title="Parent PIN gate">
        <Frame w={420}><PinGate pin="1234" blobDir="blobs/" /></Frame>
      </Row>
      <Row title="Quiz round — a worked MISSION: throw the pizza party (5 chained real-world questions)">
        <Frame w={860} h={780}><QuizRound key={quizKey} questions={DEMO_QS} grade={4} tier={2} worldColor="#F0AFCE" mascot="Ice_cream" blobDir="blobs/" onQuit={() => setQuizKey(k => k + 1)} /></Frame>
      </Row>
      <Row title="Student onboarding — working">
        <Frame w={720} h={480}><StudentOnboarding blobDir="blobs/" onEvent={() => {}} /></Frame>
      </Row>
      <Row title="Parent onboarding — Modernist structure">
        <Frame w={720} h={520}><ParentOnboarding kidGrade={4} blobDir="blobs/" onEvent={() => {}} /></Frame>
      </Row>
      <Row title="Rewards (kid)">
        <div style={{ width: 860 }}><RewardsPanel tickets={6} nextReward={{ name: '$5 treat / 500 Kredits', cost: 10 }}
          menu={[{ name: '30 min screen time', cost: 3 }, { name: 'Pick the movie', cost: 4 }, { name: '$5 treat / 500 Kredits', cost: 10 }]}
          pending={[{ name: 'Pick the movie' }]} blobDir="blobs/" /></div>
      </Row>
      <Row title="Shop">
        <div style={{ width: 640 }}><ShopGrid activeTab={tab} onTab={setTab} kredits={128}
          items={[{ id: 'jar', name: 'Kredit Jar', icon: '🫙', cost: 100, bonus: 10, owned: true },
            { id: 'stall', name: 'Market Stall', icon: '🏪', cost: 250, bonus: 20, owned: false },
            { id: 'truck', name: 'Food Truck', icon: '🚚', cost: 600, bonus: 35, owned: false }]} /></div>
      </Row>
      <Row title="Grown-ups: analytics (Modernist structure, Kampus colors)">
        <div style={{ width: 560 }}><ParentAnalytics
          worlds={[{ name: 'The Kitchen', pct: 84, color: '#F0AFCE' }, { name: 'The Store', pct: 91, color: '#F4BE93' }, { name: 'The Trip', pct: 62, color: '#5E9FE0' }, { name: 'The Build', pct: 77, color: '#8F97DE' }]}
          focus={[{ skill: 'Reading negative temperatures', note: '58% over 12 tries' }]}
          skills={[{ skill: 'Equivalent fractions', tries: 24, hints: 3, acc: 88 }, { skill: 'Making change', tries: 18, hints: 1, acc: 94 }, { skill: 'Negative numbers', tries: 12, hints: 6, acc: 58 }]} /></div>
      </Row>
      <Row title="Grown-ups: ticket admin">
        <div style={{ width: 560 }}><TicketAdmin tickets={6} weekTickets={4} pending={[{ name: 'Pick the movie', cost: 4 }]}
          menu={[{ name: '30 min screen time', cost: 3 }, { name: 'Pick the movie', cost: 4 }, { name: '$5 treat / 500 Kredits', cost: 10 }]} /></div>
      </Row>
      <Row title="Grown-ups: settings">
        <div style={{ width: 560 }}><ParentSettings grade={4} sessionMins={15} focusMode={true} sound={true} /></div>
      </Row>

      <Row title="Buttons">
        <Button variant="primary" size="lg">Run it back</Button>
        <Button variant="primary">Bet</Button>
        <Button variant="ink">I'll try first</Button>
        <Button variant="outline">Home</Button>
        <Button variant="gold" size="sm">Teach me · costs half</Button>
        <Button variant="ghost" size="sm">Grown-ups →</Button>
        <Button variant="destructive" size="sm">Full reset</Button>
        <Button disabled>120 Kredits</Button>
      </Row>
      <Row title="Chips, icons, dots">
        <Chip dot={color.orange}>Week 1 · 3 days</Chip>
        <Chip><KreditCoin /> 128</Chip>
        <Chip><TicketIcon size={15} /> 6 tickets</Chip>
        <Logo />
        <TierDots earned={2} />
      </Row>
      <Row title="Form elements">
        <div style={{ width: 260, display: 'grid', gap: 14 }}>
          <TextField label="Reward name" placeholder="e.g. Pick the movie" value={txt} onChange={setTxt} />
          <Select label="Grade" value={sel} onChange={setSel} options={[3, 4, 5, 6, 7, 8].map(g => ({ value: String(g), label: 'Grade ' + g }))} />
          <Checkbox checked={chk} onChange={setChk} label="Read questions out loud" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>Ticket cost</span><Stepper value={num} onChange={setNum} min={1} /></div>
        </div>
        <div style={{ width: 320 }}><RadioGroup value={radio} onChange={setRadio} options={[
          { value: 'a', label: 'Standard round', hint: '12 questions, ticket for a sharp run' },
          { value: 'b', label: 'Quick 6', hint: 'Half-size round, no ticket' }]} /></div>
      </Row>
      <Row title="Controls & progress">
        <Toggle on={on} onChange={setOn} />
        <Segmented value={seg} onChange={setSeg} options={[{ value: 0, label: 'Off' }, { value: 10, label: '10m' }, { value: 15, label: '15m' }, { value: 20, label: '20m' }]} />
        <div style={{ width: 240 }}><ProgressBar value={64} /></div>
        <div style={{ width: 240 }}><ProgressBar height={10} segments={[{ pct: 70, color: color.green }, { pct: 30, color: color.red }]} /></div>
      </Row>
      <Row title="Grade cards">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 172px)', gap: 10 }}>
          <GradeCard grade={3} status="passed" detail="test passed" />
          <GradeCard grade={4} status="current" pct={42} detail="2/4 worlds ready" />
          <GradeCard grade={5} status="locked" detail="after grade 4" />
        </div>
      </Row>
      <Row title="World tile · Kredits week · Teach confirm">
        <div style={{ width: 300 }}><WorldTile name="The Kitchen" skill="recipes & slices" worldColor="#F0AFCE" blob="Ice_cream" tierLabel="01 · Tier 2" tier={2} blobDir="blobs/" /></div>
        <div style={{ width: 300 }}><KreditsWeekCard earned={210} spent={90} hint="Spent = help + shop. Thinking is free." /></div>
        <div style={{ width: 380 }}><TeachConfirm solo={24} withHelp={12} /></div>
      </Row>
      <Row title="Cards & blobs">
        <Card style={{ width: 220 }}><Kicker style={{ marginBottom: 8 }}>white card</Kicker><div style={{ fontSize: 15 }}>Default surface with 1px border and the one allowed shadow.</div></Card>
        <Card dashed style={{ width: 220, textAlign: 'center' }}><Blob name="Coffee" size={64} dir="blobs/" opacity={0.85} /><div style={{ fontSize: 13, color: '#8A8578', marginTop: 8 }}>Empty state</div></Card>
        <Blob name="Party" size={96} dir="blobs/" />
        <Blob name="Startup" size={96} dir="blobs/" />
      </Row>
    </div></div>;
}

