/* Find the Electron · 1897  —  collaborative D.3 lab (EISM Y13) */
'use strict';
const API = '/api';
const TEACHER_CODE = '1897';
const CLASSES = ['Y13 Physics', 'Test group'];

/* ============ PHYSICS ============ */
const QE = 1.602e-19, ME = 9.109e-31, QM = QE / ME;
const KCOIL = 0.78e-3;                         // T per A at the centre of the Helmholtz coils
const speed = V => Math.sqrt(2 * QM * V);
const jitter = (x, p) => x * (1 + (Math.random() * 2 - 1) * p);
const GUN = { 1: 150, 2: 200, 3: 250 };          // Station C beams (hidden until the end)

/* ============ FORMAT ============ */
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const supify = n => String(n).split('').map(c => SUP[c]).join('');
function sci(x, sig = 3) {
  if (!isFinite(x)) return '–'; if (x === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e, s = m.toPrecision(sig);
  if (Math.abs(parseFloat(s)) >= 10) { e++; s = (x / 10 ** e).toPrecision(sig); }
  return e === 0 ? s : s + ' × 10' + supify(e);
}
const fx = (x, d = 2) => (+x).toFixed(d);
function parseNum(s) {
  if (s == null) return NaN;
  s = String(s).trim().replace(/\s/g, '').replace(/×/g, 'x').replace(/\*/g, 'x').replace(/,/g, '.').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => ({ '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' })[c]);
  const m = s.match(/^([-+]?\d*\.?\d+)(?:x10\^?([-+]?\d+)|e([-+]?\d+))?$/i);
  return m ? parseFloat(m[1]) * 10 ** (+(m[2] || m[3] || 0)) : NaN;
}
const within = (a, b, p) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= Math.abs(b) * p;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ============ MATHML ============ */
const mi = s => `<mi>${s}</mi>`, mn = s => `<mn>${s}</mn>`, mo = s => `<mo>${s}</mo>`;
const frac = (a, b) => `<mfrac><mrow>${a}</mrow><mrow>${b}</mrow></mfrac>`, sq = (a, n = '2') => `<msup><mrow>${a}</mrow><mn>${n}</mn></msup>`;
const M = s => `<math>${s}</math>`;
const EQ = {
  EVd: M(mi('E') + mo('=') + frac(mi('V'), mi('d'))),
  FqE: M(mi('F') + mo('=') + mi('q') + mi('E')),
  W: M(mi('W') + mo('=') + mi('q') + mi('E') + mi('d') + mo('=') + mi('q') + mi('V')),
  KE: M(mi('q') + mi('V') + mo('=') + frac(mn(1), mn(2)) + mi('m') + sq(mi('v'))),
  vV: M(mi('v') + mo('=') + `<msqrt>${frac(mn(2) + mi('q') + mi('V'), mi('m'))}</msqrt>`),
  FqvB: M(mi('F') + mo('=') + mi('q') + mi('v') + mi('B')),
  cent: M(mi('q') + mi('v') + mi('B') + mo('=') + frac(mi('m') + sq(mi('v')), mi('r'))),
  r: M(mi('r') + mo('=') + frac(mi('m') + mi('v'), mi('q') + mi('B'))),
  bal: M(mi('q') + mi('E') + mo('=') + mi('q') + mi('v') + mi('B')),
  vEB: M(mi('v') + mo('=') + frac(mi('E'), mi('B'))),
  qm: M(frac(mi('q'), mi('m')) + mo('=') + frac(mn(2) + mi('V'), sq(mi('B')) + sq(mi('r')))),
  qmT: M(frac(mi('q'), mi('m')) + mo('=') + frac(mi('E'), sq(mi('B')) + mi('r'))),
  me: M(mi('m') + mo('=') + mi('e') + mo('÷') + frac(mi('e'), mi('m'))),
  qmFrac: M(frac(mi('q'), mi('m')))
};

/* ============ SUCCESS CRITERIA ============ */
const SC = [
  { short: 'Electric field', text: `I can explain how a uniform electric field accelerates an electron, and use ${EQ.KE}.` },
  { short: 'Magnetic field', text: `I can explain why a magnetic field bends a moving electron into a circle, and use ${EQ.r}.` },
  { short: 'Find the electron', text: `I can combine electric and magnetic fields to find the electron's ${EQ.qmFrac}, and then its mass.` }
];
const RATE = ['Not yet', 'Getting there', 'Confident'];
const STAGES = [['welcome', 'Start'], ['start', 'Starting point'], ['lab', 'Station'], ['check', 'Progress check'], ['final', 'Find the electron'], ['reflect', 'Reflect']];

/* ============ SMALL FIGURES ============ */
const FIG = {
  plates: `<svg viewBox="0 0 420 150"><rect x="40" y="20" width="10" height="110" fill="#c9d3e8"/><rect x="330" y="20" width="10" height="46" fill="#c9d3e8"/><rect x="330" y="84" width="10" height="46" fill="#c9d3e8"/>
   <text x="45" y="15" fill="#F07A71" font-size="18" font-weight="800" text-anchor="middle">−</text><text x="335" y="15" fill="#45C58C" font-size="18" font-weight="800" text-anchor="middle">+</text>
   <circle r="7" fill="#8DB8EA"><animate attributeName="cx" values="56;56;330;400" keyTimes="0;.15;.85;1" keySplines=".5 0 1 1;.5 0 1 1;0 0 1 1" calcMode="spline" dur="2.4s" repeatCount="indefinite"/><animate attributeName="cy" values="75;75;75;75" dur="2.4s" repeatCount="indefinite"/></circle>
   <text x="190" y="145" fill="#9AA4B8" font-size="13" text-anchor="middle">accelerating voltage V</text></svg>`,
  circle: `<svg viewBox="0 0 420 170">${Array.from({ length: 24 }, (_, i) => `<text x="${30 + (i % 8) * 50}" y="${30 + Math.floor(i / 8) * 55}" fill="#F472B6" font-size="14" opacity=".55">⊙</text>`).join('')}
   <circle cx="210" cy="85" r="60" fill="none" stroke="#7CFFB2" stroke-width="2" stroke-dasharray="4 6" opacity=".6"/>
   <circle r="7" fill="#8DB8EA"><animateMotion dur="3s" repeatCount="indefinite" path="M210,145 A60,60 0 1,0 210,25 A60,60 0 1,0 210,145"/></circle>
   <text x="210" y="165" fill="#9AA4B8" font-size="13" text-anchor="middle">uniform magnetic field B</text></svg>`,
  crossed: `<svg viewBox="0 0 420 150"><rect x="120" y="30" width="180" height="7" fill="#c9d3e8"/><rect x="120" y="113" width="180" height="7" fill="#c9d3e8"/>
   <text x="110" y="38" fill="#45C58C" font-size="16" font-weight="800" text-anchor="end">+</text><text x="110" y="121" fill="#F07A71" font-size="16" font-weight="800" text-anchor="end">−</text>
   ${[0, 1, 2, 3].map(i => `<text x="${150 + i * 40}" y="70" fill="#F472B6" font-size="13" opacity=".6">⊗</text><text x="${150 + i * 40}" y="96" fill="#F472B6" font-size="13" opacity=".6">⊗</text>`).join('')}
   <line x1="20" y1="75" x2="400" y2="75" stroke="#7CFFB2" stroke-width="2.5"/><circle r="6" fill="#b6ffd6"><animate attributeName="cx" values="20;400" dur="1.6s" repeatCount="indefinite"/><animate attributeName="cy" values="75;75" dur="1.6s" repeatCount="indefinite"/></circle>
   <text x="210" y="142" fill="#9AA4B8" font-size="13" text-anchor="middle">electric field E and magnetic field B together</text></svg>`
};

/* ============ STARTING QUESTIONS ============ */
const DIAG = [
  { fig: FIG.plates, p: 'The voltage is made 4 times bigger. The electron\'s final speed becomes…', o: ['the same', '2 times bigger', '4 times bigger', '16 times bigger'], a: 1 },
  { fig: FIG.circle, p: 'While the electron goes round in the magnetic field, its speed…', o: ['increases', 'stays the same', 'decreases', 'falls to zero'], a: 1 },
  { fig: FIG.crossed, p: 'The beam goes perfectly straight. What must be true?', o: ['Both fields are switched off', 'The electric and magnetic forces are equal and opposite', 'The electrons have no charge', 'E and B are equal numbers'], a: 1 }
];

/* ============ STATIONS ============ */
const AV_COL = ['#2F6FB5', '#4F46E5', '#0C9C98', '#6D3FC0', '#C8463E', '#1D8F5F', '#E6A413'];
const ROLES = {
  trial: { ic: '🎛️', name: 'Trial lead', job: n => `Run <b>trial ${n}</b> on the shared simulation.` },
  processor: { ic: '🧮', name: 'Data processor', job: () => 'Readings arrive by themselves. You <b>process</b> them in the coloured columns.' },
  leader: { ic: '⭐', name: 'Team leader + processor', job: () => 'Lead the team and the prediction, and <b>process</b> the data with the processor.' }
};
const STN = {
  A: {
    title: 'The electron gun', icon: '⚡', img: 'img/filament.webp',
    goal: 'What does the gun give the electrons? Does the gap matter?',
    readHint: 'Drag the <b>cyan marker</b> onto the glowing trace at the 8 cm line, then tap <b>Record</b>. The reading goes straight into the table.',
    quest: true,
    proc: [{ k: 'E', h: 'E = V ÷ d', u: 'V m⁻¹', ph: '1e5', f: r => r.kV * 1000 / (r.d / 100) }, { k: 'yV', h: 'y × V', u: 'cm kV', ph: '2.0', f: r => r.y * r.kV }],
    scene: [
      { img: 'img/filament.webp', cap: 'Hot metal boils off electrons.', sub: 'The heated cathode is the source.' },
      { anim: 'gun', cap: 'The anode pulls them into a beam.', sub: 'A steady stream shoots through the hole in the anode.' },
      { img: 'img/hero.webp', cap: 'Your mission: make a beam, then test it.', sub: 'In a vacuum the beam is invisible. It only shows where it grazes the screen.' }],
    pred: { q: 'Swap to the NARROW gun: same voltage, half the gap, so twice the field. The trace bends…', o: ['the same', 'less (a stiffer beam)', 'more'] },
    cols: [{ k: 'kV', label: 'V / kV', tol: v => 0.01 }, { k: 'd', label: 'gun gap d / cm', tol: v => 0.01 }, { k: 'y', label: 'y / cm', tol: v => 0.01 }],
    steps: [
      { m: EQ.EVd, w: 'Cathode and anode make a uniform field. Half the gap, twice the field.' },
      { m: EQ.FqE, w: 'The field pushes each (negative) electron towards the positive anode.' },
      { m: EQ.W, w: 'Work = force × distance. Twice the force over half the distance: the gap cancels and the work is qV.', gap: true, opts: [EQ.W, M(mi('W') + mo('=') + frac(mi('q') + mi('V'), mi('d'))), M(mi('W') + mo('=') + frac(mn(1), mn(2)) + mi('q') + mi('V'))] },
      { m: EQ.KE, w: 'It starts from rest, so all that work becomes kinetic energy. Only V sets the energy.' },
      { m: '<b>no field past the anode → no force → constant speed</b>', w: 'A faster beam spends less time between the deflecting plates, so it bends less: y ∝ 1/V.' }],
    concept: { p: 'The narrow gun has twice the field, yet the trace did not change. Why?', o: ['Twice the force acts over half the distance, so the work qV is the same', 'The narrow gun makes fewer electrons', 'The field has no effect on electrons'], a: 0, hint: 'Work = force × distance. What happens to each one?', why: 'Twice the force × half the distance = the same work, qV.' },
    hist: { yr: '1890s', t: 'Physicists argued: were cathode rays waves, or tiny charged particles? Rays that come from the hot cathode, are pulled by a positive anode and bent by charged plates must carry negative charge.', q: { p: 'The beam bends towards the positive plate. So cathode rays…', o: ['carry negative charge', 'are a kind of light', 'have no mass'], a: 0, hint: 'Opposite charges attract.', why: 'Attracted to + means negative.' } },
    find: { eq: EQ.KE, t: 'The gun gives every electron the energy qV, whatever the gap.' }
  },
  B: {
    title: 'The circle in a magnetic field', icon: '🧲', img: 'img/finebeam.webp',
    goal: 'What sets the size of the circle?',
    scene: [
      { img: 'img/finebeam.webp', cap: 'This is a real fine-beam tube.', sub: 'The glowing ring is a beam of electrons.' },
      { img: 'img/coil.webp', cap: 'Coils make the magnetic field.', sub: 'More current in the coils, stronger field B.' },
      { anim: 'curl', cap: 'Your mission: measure the circle.', sub: 'Change B. Read the diameter on the ruler.' }],
    pred: { q: 'You make the magnetic field STRONGER. The circle gets…', o: ['smaller', 'bigger', 'no change'] },
    cols: [{ k: 'V', label: 'V / V', tol: v => 0.6 }, { k: 'I', label: 'I / A', tol: v => 0.051 }, { k: 'd', label: 'd / cm', tol: v => 0.21 }],
    proc: [{ k: 'r', h: 'r = d ÷ 2', u: 'm', ph: '0.04', f: r => r.d / 200 }, { k: 'B', h: 'B = 0.78 mT × I', u: 'T', ph: '1.2e-3', f: r => KCOIL * r.I }, { k: 'rB', h: 'r × B', u: 'T m', ph: '5e-5', f: r => r.d / 200 * KCOIL * r.I }],
    steps: [
      { m: EQ.FqvB, w: 'A moving charge feels a force at right angles to its velocity.' },
      { m: '<b>sideways force → no work → constant speed</b>', w: 'It never speeds the electron up, it only turns it: a circle.' },
      { m: EQ.cent, w: 'The magnetic force is the centripetal force.', gap: true, opts: [EQ.cent, M(mi('q') + mi('v') + mi('B') + mo('=') + frac(mn(1), mn(2)) + mi('m') + sq(mi('v'))), M(mi('q') + mi('v') + mi('B') + mo('=') + mi('m') + mi('g'))] },
      { m: EQ.r, w: 'Cancel one v. Stronger B, tighter circle. Faster electron, wider circle.' }],
    concept: { p: 'B gets twice as strong (same beam). The radius becomes…', o: ['half as big', 'twice as big', 'the same'], a: 0, hint: 'r = mv/(qB): B is on the bottom.', why: 'r ∝ 1/B.' },
    hist: { yr: '1897', t: 'Thomson got the same result whatever metal the cathode was made of, and whatever gas was left in the tube. So the same tiny particle must be inside every kind of atom.', q: { p: 'Why did the same result for every metal matter?', o: ['The particle must be part of every atom', 'All metals are the same element', 'The magnets were identical'], a: 0, hint: 'If it came from one special metal, the result would change.', why: 'Same particle from every atom: atoms have parts inside.' } },
    find: { eq: EQ.r, t: 'The circle\'s size: r = mv/(qB).' }
  },
  C: {
    title: 'Balancing the fields', icon: '⚖️', img: 'img/scope.webp',
    goal: 'How do you measure a speed nobody can time?',
    scene: [
      { img: 'img/scope.webp', cap: 'Electron beams draw on screens.', sub: 'Where the beam lands, the screen glows.' },
      { anim: 'push', cap: 'E pushes up. B pushes down.', sub: 'Plates make the electric field, coils make the magnetic field.' },
      { anim: 'straight', cap: 'Your mission: balance them.', sub: 'Spot on the centre line means the forces cancel.' }],
    pred: { q: 'A FASTER beam, same B. To keep it straight you need…', o: ['a bigger E', 'a smaller E', 'the same E'] },
    cols: [{ k: 'beam', label: 'beam', tol: v => 0.01 }, { k: 'Vp', label: 'plate V / V', tol: v => 1.5 }, { k: 'I', label: 'I / A', tol: v => 0.011 }],
    proc: [{ k: 'E', h: 'E = V ÷ 0.040 m', u: 'V m⁻¹', ph: '5e3', f: r => r.Vp / 0.04 }, { k: 'B', h: 'B = 0.78 mT × I', u: 'T', ph: '7.8e-4', f: r => KCOIL * r.I }, { k: 'v', h: 'v = E ÷ B', u: 'm s⁻¹', ph: '7e6', f: r => r.Vp / 0.04 / (KCOIL * r.I) }],
    steps: [
      { m: EQ.FqE, w: 'The electric field pushes the electron up, towards the positive plate.' },
      { m: EQ.FqvB, w: 'The magnetic field pushes it down.' },
      { m: EQ.bal, w: 'Straight line: no overall force, so the two forces are equal.', gap: true, opts: [EQ.bal, M(mi('q') + mi('E') + mo('=') + frac(mi('m') + sq(mi('v')), mi('r'))), M(mi('E') + mo('=') + mi('v') + sq(mi('B')))] },
      { m: EQ.vEB, w: 'q cancels! The speed depends only on E and B.' }],
    concept: { p: 'You double B for the same beam. To keep it straight you must…', o: ['double E', 'halve E', 'keep E the same'], a: 0, hint: 'v = E/B and v has not changed.', why: 'Keep E/B the same: double E.' },
    hist: { yr: '1897', t: 'Balancing the two fields let Thomson measure the speed of cathode rays. They were far slower than light, so they could not be light waves. They had to be particles.', q: { p: 'Balancing the fields let Thomson find…', o: ['the speed, without knowing q or m', 'the charge e', 'the mass m'], a: 0, hint: 'What is left in v = E/B?', why: 'v = E/B has no q or m in it.' } },
    find: { eq: EQ.vEB, t: 'Balanced fields give the speed: v = E/B.' }
  }
};

/* personal analysis: columns by level, computed from the RECORDED values */
const AN = {
  A: {
    tasks: true,
    formula: `${M(mi('E') + mo('=') + frac(mi('V'), mi('d')))} (V in volts, d in metres) &nbsp;&nbsp; ${M(mi('y') + mo('∝') + frac(mn(1), mi('V')))} &nbsp;&nbsp; ${M(mi('W') + mo('=') + mi('q') + mi('V'))}`,
    list: (lvl, rows) => { const r = rows[0], out = [
      { id: 'E', p: `Trial 1: V = ${r.kV} kV across a gap of ${r.d} cm. What is the field E in the gun?`, unit: 'V m⁻¹', ph: '1.5e5', exp: r.kV * 1000 / (r.d / 100), tol: 0.03, hint: `Change to volts and metres: ${r.kV * 1000} V ÷ ${r.d / 100} m.` }];
      if (lvl >= 2) { const Vn = r.kV >= 4 ? 1.5 : 4.0; out.push({ id: 'y', p: `Use y ∝ 1/V and trial 1 to predict the deflection at ${Vn} kV.`, unit: 'cm', ph: '0.8', exp: r.y * r.kV / Vn, tol: 0.06, hint: `V changes by × ${fx(Vn / r.kV, 2)}, so y changes by ÷ ${fx(Vn / r.kV, 2)}.` }); }
      if (lvl >= 3) out.push({ id: 'W', p: `Each electron in trial 1 gains W = qV. Give W in electronvolts (1 eV = the energy one electron gains through 1 V).`, unit: 'eV', ph: '2000', exp: r.kV * 1000, tol: 0.01, hint: 'One electron through V volts gains V electronvolts.' });
      return out; },
    graph: rows => ({ pts: rows.map(r => [1 / r.kV, r.y]), xl: '1/V / kV⁻¹', yl: 'y / cm', fit: 'origin', note: 'Straight line through the origin: y ∝ 1/V. Readings from both guns sit on the same line, so the gap does not change the energy.' })
  },
  B: {
    tasks: true,
    formula: `${M(mi('B') + mo('=') + mn('0.78 mT') + mo('×') + mi('I'))} &nbsp;&nbsp; ${EQ.r} &nbsp;&nbsp; ${M(mi('r') + mi('B') + mo('=') + frac(mi('m') + mi('v'), mi('q')))}`,
    list: (lvl, rows) => { const r = rows[0], out = [
      { id: 'B', p: `Trial 1: the coil current is ${r.I} A. What is B? (0.78 mT for every amp)`, unit: 'T', ph: '1.2e-3', exp: KCOIL * r.I, tol: 0.03, hint: `0.78 × 10⁻³ × ${r.I}` }];
      if (lvl >= 2) out.push({ id: 'r2', p: `Same beam, but B made twice as strong. Predict the new radius from trial 1.`, unit: 'cm', ph: '2.0', exp: r.d / 4, tol: 0.05, hint: `r ∝ 1/B. Trial 1 radius = ${fx(r.d / 2, 2)} cm.` });
      if (lvl >= 3) out.push({ id: 'I2', p: `Same beam. What coil current would make the diameter ${fx(r.d * 0.8, 1)} cm?`, unit: 'A', ph: '1.9', exp: r.I / 0.8, tol: 0.04, hint: 'r × B stays the same, so I × d stays the same.' });
      return out; },
    graph: rows => { const V0 = rows[0].V, same = rows.filter(r => r.V === V0); return { pts: same.map(r => [1 / (KCOIL * r.I * 1e3), r.d / 2]), xl: `1/B / mT⁻¹ (beam at ${V0} V)`, yl: 'r / cm', fit: 'origin', note: 'Same beam, straight line through the origin: r ∝ 1/B. That is why r × B stays the same.' }; }
  },
  C: {
    tasks: true,
    formula: `${M(mi('E') + mo('=') + frac(mi('V'), mi('d')))} &nbsp;&nbsp; ${M(mi('B') + mo('=') + mn('0.78 mT') + mo('×') + mi('I'))} &nbsp;&nbsp; ${EQ.vEB}`,
    list: (lvl, rows) => { const r = rows[0], E = r.Vp / 0.04, B = KCOIL * r.I, v = E / B, out = [
      { id: 'v', p: `Beam ${r.beam} balanced at E = ${sci(E, 3)} V m⁻¹ and B = ${sci(B, 3)} T. How fast is it?`, unit: 'm s⁻¹', ph: '7e6', exp: v, tol: 0.03, hint: 'Balanced: qE = qvB, so v = E ÷ B.' }];
      if (lvl >= 2 && rows[1]) { const r2 = rows[1]; out.push({ id: 'E2', p: `Beam ${r2.beam} has the speed in your table. If B were doubled, what E would balance it?`, unit: 'V m⁻¹', ph: '1e4', exp: 2 * r2.Vp / 0.04, tol: 0.03, hint: 'v = E/B must stay the same, so E doubles too.' }); }
      if (lvl >= 3) out.push({ id: 'qm', p: `Beam ${r.beam} came from a ${GUN[r.beam]} V gun. Use qV = ½mv² to find q/m.`, unit: 'C kg⁻¹', ph: '1.8e11', exp: v * v / (2 * GUN[r.beam]), tol: 0.05, hint: 'q/m = v² ÷ (2V)' });
      return out; },
    graph: rows => ({ pts: rows.map(r => [r.beam, (r.Vp / 0.04) / (KCOIL * r.I) / 1e6]), xl: 'beam', yl: 'v / 10⁶ m s⁻¹', fit: null, xint: true, note: 'Each beam has its own speed, v = E/B, found without knowing q or m.' })
  }
};
function fitOrigin(pts) { let a = 0, b = 0; pts.forEach(p => { a += p[0] * p[1]; b += p[0] * p[0]; }); return a / b; }

/* ============ STATE ============ */
const KEY = 'fte1897.v2';
let S = load();
function blank() { return { name: '', cls: CLASSES[0], stage: 'welcome', scStart: [null, null, null], scMid: [null, null, null], scEnd: [null, null, null], diag: [null, null, null], station: null, level: null, role: null, trial: null, step: 0, an: {}, mark: null, first: {}, final: {}, seen: {}, exit: null, doneStation: false, t0: Date.now() }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.stage) return s; } catch (e) { } return blank(); }
let pT = null;
function save(push = true) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } paintTop(); if (push) { clearTimeout(pT); pT = setTimeout(postProgress, 700); } }
const ONLINE = location.protocol.startsWith('http');
let netOK = ONLINE, netFails = 0;
function netFail() { if (++netFails >= 3 && netOK) { netOK = false; paintTop(); } }
function netGood() { netFails = 0; if (!netOK) { netOK = true; paintTop(); } }
async function apiGet(params) { if (!ONLINE) throw new Error('offline'); const r = await fetch(API + '?' + new URLSearchParams(params), { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); netOK = true; return r.json(); }
async function apiPost(body) { if (!ONLINE) throw new Error('offline'); const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error(r.status); netOK = true; return r.json(); }
function summary() {
  const r = a => a.map(x => x == null ? '' : RATE[x]);
  return { station: S.station, level: S.level, role: S.role, stage: S.stage, step: S.step, scStart: r(S.scStart), scMid: r(S.scMid), scEnd: r(S.scEnd),
    diag: S.diag.map((d, i) => d == null ? '' : d === DIAG[i].a ? '✓' : '✗'), mark: S.mark, first: S.first, doneStation: S.doneStation,
    qm: S.final.qm || null, m: S.final.m || null, dRead: S.final.dRead || null, exit: S.exit == null ? '' : (S.exit === EXIT.a ? '✓' : '✗'), minutes: Math.round((Date.now() - S.t0) / 60000) };
}
function postProgress() { if (!S.name) return; apiPost({ op: 'progress', cls: S.cls, name: S.name, data: summary() }).catch(() => { netFail(); }); }

/* ============ TOP BAR ============ */
function paintTop() {
  const alias = { route: 'start', millikan: 'final', done: 'reflect' };
  let idx = STAGES.findIndex(x => x[0] === (alias[S.stage] || S.stage)); if (S.stage === 'done') idx = STAGES.length;
  $('#rail').innerHTML = STAGES.map((s, i) => `<span class="${i < idx ? 'on' : i === idx ? 'now' : ''}" title="${s[1]}"></span>`).join('');
  const latest = i => [S.scEnd[i], S.scMid[i], S.scStart[i]].find(x => x != null);
  $('#scbar').innerHTML = SC.map((c, i) => { const v = latest(i); return `<span class="scchip ${v == null ? '' : 'r' + v}" title="SC${i + 1} ${c.short}: ${v == null ? 'not rated yet' : RATE[v]}"><i></i>SC${i + 1}</span>`; }).join('') +
    `<span class="net ${!ONLINE ? '' : netOK ? 'on' : 'off'}" title="connection to your group">${!ONLINE ? 'solo mode' : netOK ? '● live' : '● reconnecting'}</span>`;
}

/* ============ HELPERS ============ */
const $ = s => document.querySelector(s);
const app = () => $('#app');
function toast(t, ms = 2400) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(() => d.remove(), ms); }
function go(stage) { stopPoll(); S.stage = stage; S.ts = S.ts || {}; if (!S.ts[stage]) S.ts[stage] = Date.now(); save(); render(); scrollTo({ top: 0, behavior: 'smooth' }); }
function card(host, html, cls = '') { const c = document.createElement('div'); c.className = 'card ' + cls; c.innerHTML = html; host.appendChild(c); return c; }
function nextBtn(c, fn, txt = 'Next') { const d = document.createElement('div'); d.style.marginTop = '10px'; d.innerHTML = `<button class="btn primary">${txt} →</button>`; d.querySelector('button').onclick = fn; c.appendChild(d); return d; }
function avatar(name, i) { return `<span class="av" style="background:${AV_COL[i % AV_COL.length]}">${esc(name.trim()[0] || '?').toUpperCase()}</span>`; }

function scRater(arr, onChange, title) {
  const box = document.createElement('div');
  box.innerHTML = `<h3>${title}</h3>` + SC.map((c, i) => `<div class="scrow"><div class="num">SC${i + 1}</div><div>${c.text}</div>
    <div class="opts">${RATE.map((r, j) => `<button data-i="${i}" data-j="${j}" class="${arr[i] === j ? 'sel' + j : ''}">${r}</button>`).join('')}</div></div>`).join('');
  box.querySelectorAll('.opts button').forEach(b => b.onclick = () => { arr[+b.dataset.i] = +b.dataset.j; box.querySelectorAll(`.opts button[data-i="${b.dataset.i}"]`).forEach(x => x.className = ''); b.className = 'sel' + b.dataset.j; save(false); onChange && onChange(); });
  return box;
}
function mcq(host, q, id, onDone) {
  const d = document.createElement('div');
  d.innerHTML = `${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}<div class="q">${q.p}</div><div class="opts1">${q.o.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div><div class="fbx"></div>`;
  host.appendChild(d); let tries = 0;
  d.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; tries++;
    if (!(id in S.first)) { S.first[id] = (i === q.a); save(); }
    const fbx = d.querySelector('.fbx');
    if (i === q.a) { b.classList.add('right'); d.querySelectorAll('.opt').forEach(x => x.disabled = true); fbx.innerHTML = `<div class="fb good"><b>${tries === 1 ? 'Spot on.' : 'Got it.'}</b> ${q.why || ''}</div>`; onDone && onDone(tries === 1); }
    else { b.classList.add('wrong'); b.disabled = true; fbx.innerHTML = `<div class="fb hint"><b>Not quite.</b> ${tries >= 2 && q.hint2 ? q.hint2 : q.hint || 'Look again.'}</div>`; }
  });
}
/* scientific-notation box: [mantissa] × 10^[power]; value string "m" or "m e p" */
const sciHTML = (attr = '') => `<span class="sci" ${attr}><input class="m" inputmode="decimal" placeholder="?" aria-label="number"><span class="t">× 10</span><input class="x" inputmode="numeric" placeholder="0" aria-label="power of ten"></span>`;
const sciGet = box => { const m = box.querySelector('.m').value.trim(), x = box.querySelector('.x').value.trim().replace(/[−–]/g, '-'); return m === '' ? '' : x === '' ? m : m + 'e' + x; };
const sciSet = (box, str) => { str = String(str || ''); const i = str.toLowerCase().indexOf('e'); box.querySelector('.m').value = i < 0 ? str : str.slice(0, i); box.querySelector('.x').value = i < 0 ? '' : str.slice(i + 1); };
function numTask(host, cfg, id, onDone) {
  const d = document.createElement('div');
  d.innerHTML = `<div class="q">${cfg.p}</div>${cfg.help ? `<div class="muted small" style="margin:2px 0 8px">${cfg.help}</div>` : ''}
   <div class="row">${sciHTML()}<span>${cfg.unit || ''}</span><button class="btn primary">Check</button></div><div class="fbx"></div>`;
  host.appendChild(d);
  const box = d.querySelector('.sci'), fbx = d.querySelector('.fbx'), btn = d.querySelector('button'); let tries = 0;
  const inp = { get value() { return sciGet(box); }, set disabled(v) { box.querySelectorAll('input').forEach(i => i.disabled = v); }, addEventListener: (ev, fn) => box.querySelectorAll('input').forEach(i => i.addEventListener(ev, fn)) };
  btn.onclick = () => {
    const v = parseNum(inp.value); if (!isFinite(v)) { fbx.innerHTML = `<div class="fb hint">Type a number. For 8.4 × 10⁶, type 8.4 in the first box and 6 in the small box.</div>`; return; }
    tries++; const ok = cfg.check(v);
    if (!(id in S.first)) { S.first[id] = ok; save(); }
    box.classList.toggle('ok', ok); box.classList.toggle('chk', !ok);
    if (ok) { inp.disabled = true; btn.disabled = true; fbx.innerHTML = `<div class="fb good"><b>Correct.</b> ${cfg.why ? cfg.why(v) : ''}</div>`; onDone && onDone(v); }
    else fbx.innerHTML = `<div class="fb hint"><b>Check again.</b> ${tries >= 2 && cfg.hint2 ? cfg.hint2 : cfg.hint || ''}</div>`;
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}
function graph(pts, o) {
  if (!pts.length) return { m: 0, svg: '' };
  const W = 420, H = 250, L = 58, B = 44, T = 14, R = 14;
  const xmax = o.xint ? Math.max(...pts.map(p => p[0])) + 1 : Math.max(...pts.map(p => p[0])) * 1.15 || 1, ymax = Math.max(...pts.map(p => p[1])) * 1.15 || 1;
  const X = x => L + (W - L - R) * x / xmax, Y = y => H - B - (H - B - T) * y / ymax;
  const m = o.fit === 'origin' ? fitOrigin(pts) : 0;
  const nice = v => Math.abs(v) >= 100 ? Math.round(v) : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1);
  let t = ''; for (let i = 0; i <= 4; i++) { const xv = xmax * i / 4, yv = ymax * i / 4;
    t += `<line x1="${X(xv)}" y1="${H - B}" x2="${X(xv)}" y2="${T}" stroke="#E8ECF3"/><text x="${X(xv)}" y="${H - B + 16}" font-size="11" text-anchor="middle" fill="#5E6470">${nice(xv)}</text>
    <line x1="${L}" y1="${Y(yv)}" x2="${W - R}" y2="${Y(yv)}" stroke="#E8ECF3"/><text x="${L - 6}" y="${Y(yv) + 4}" font-size="11" text-anchor="end" fill="#5E6470">${nice(yv)}</text>`; }
  return { m, svg: `<svg viewBox="0 0 ${W} ${H}" style="width:100%;background:#fff;border:1px solid var(--line);border-radius:12px">${t}
   <line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#15171C"/><line x1="${L}" y1="${H - B}" x2="${L}" y2="${T}" stroke="#15171C"/>
   ${o.fit ? `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(m * xmax)}" stroke="#4F46E5" stroke-width="2" stroke-dasharray="6 4"/>` : ''}
   ${pts.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="6" fill="#2F6FB5" stroke="#fff" stroke-width="1.5"/>`).join('')}
   <text x="${(L + W - R) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" font-weight="600">${o.xl}</text>
   <text x="14" y="${(T + H - B) / 2}" font-size="12" text-anchor="middle" font-weight="600" transform="rotate(-90 14 ${(T + H - B) / 2})">${o.yl}</text></svg>` };
}

/* ============ COACH: animated hand that waits for the real action ============ */
let coachQ = [], coachDone = null, coachTimer = null, coachEl = null, coachSt = null, coachFlip = false;
function coach(steps, key, done) { if (S.seen[key]) { done && done(); return; } S.seen[key] = 1; save(false); coachQ = steps.slice(); coachDone = done; coachNext(); }
function coachLock(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; document.body.style.overflow = on ? 'hidden' : ''; }
function coachStop() { clearInterval(coachTimer); const c = $('#coach'); clearInterval(c._iv); c.hidden = true; coachQ = []; coachEl = null; coachLock(false); }
function coachPlace() {   // positions ring, hand and bubble from the target's CURRENT position
  const c = $('#coach'); if (c.hidden || !coachEl || !document.body.contains(coachEl)) return;
  const st = coachSt, r = coachEl.getBoundingClientRect(), ring = c.querySelector('.ring'), hand = c.querySelector('.hand'), bub = c.querySelector('.bubble');
  Object.assign(ring.style, { left: (r.left - 6) + 'px', top: (r.top - 6) + 'px', width: (r.width + 12) + 'px', height: (r.height + 12) + 'px' });
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (st.drag) { hand.style.left = (coachFlip ? r.left + r.width * .8 : r.left + r.width * .2) + 'px'; hand.style.top = (cy - 4) + 'px'; }
  else if (st.vdrag) { hand.style.left = (cx - 8) + 'px'; hand.style.top = (coachFlip ? r.top + r.height * .22 : r.top + r.height * .78) + 'px'; }
  else if (!st.until) { hand.style.left = (r.right - 34) + 'px'; hand.style.top = (r.bottom - 22) + 'px'; }
  else { hand.style.left = (cx - 8) + 'px'; hand.style.top = (cy - 4) + 'px'; }
  const bw = Math.min(300, innerWidth - 20), bh = bub.offsetHeight || 130;
  let bx = Math.min(Math.max(10, r.left), innerWidth - bw - 10), by = r.bottom + 16;
  if (by + bh > innerHeight - 8) by = r.top - bh - 16;
  if (by < 8) by = Math.min(innerHeight - bh - 8, Math.max(8, cy + 30));
  Object.assign(bub.style, { left: bx + 'px', top: by + 'px' });
}
addEventListener('scroll', coachPlace, { passive: true }); addEventListener('resize', coachPlace);
function coachNext() {
  const c = $('#coach'); clearInterval(c._iv); clearInterval(coachTimer);
  if (!coachQ.length) { c.hidden = true; coachEl = null; coachLock(false); const d = coachDone; coachDone = null; d && d(); return; }
  const st = coachQ.shift(); const el = typeof st.el === 'string' ? document.querySelector(st.el) : st.el;
  if (!el) { coachNext(); return; }
  coachLock(false); el.scrollIntoView({ block: 'center', behavior: 'instant' }); coachLock(true);
  coachEl = el; coachSt = st; coachFlip = false; c.hidden = false;
  const ring = c.querySelector('.ring'), hand = c.querySelector('.hand'), bub = c.querySelector('.bubble');
  hand.classList.toggle('tap', !st.drag && !st.vdrag);
  bub.innerHTML = `<div>${st.t}</div><div class="row between"><span class="tiny muted">${st.n} of ${st.of}</span>${st.until ? '<span class="wait">waiting for you…</span>' : ''}<button class="btn ${st.until ? '' : 'primary'}" style="padding:5px 12px">${st.until ? 'Skip' : coachQ.length ? 'Next' : 'Got it'}</button></div>`;
  bub.querySelector('button').onclick = () => coachNext();
  requestAnimationFrame(coachPlace);
  if (st.drag || st.vdrag) c._iv = setInterval(() => { coachFlip = !coachFlip; coachPlace(); }, st.drag ? 750 : 850);
  if (st.until) { ring.style.pointerEvents = 'none'; coachTimer = setInterval(() => { if (st.until()) { clearInterval(coachTimer); setTimeout(coachNext, 350); } }, 300); }
}

/* ============ ROUTER ============ */
function render() {
  paintTop(); coachStop();
  ({ welcome: rWelcome, start: rStart, route: rRoute, lab: rLab, check: rCheck, final: rFinal, millikan: rMillikan, reflect: rReflect, done: rDone }[S.stage] || rWelcome)();
}

/* ---------- welcome ---------- */
function rWelcome() {
  app().innerHTML = `<div class="hero reveal"><div class="ph" style="background-image:url(img/hero.webp)"></div>
   <div class="tx"><div class="kick">Year 13 · D.3 · Cambridge, 1897</div><h1>Find the electron.</h1>
   <div class="lead">Nobody has ever seen one. Your class will measure it anyway.</div>
   <div class="row" style="margin-top:10px"><input id="nm" type="text" placeholder="First name and surname" style="flex:1;min-width:200px" value="${esc(S.name || '')}">
   <select id="cl">${CLASSES.map(c => `<option ${S.cls === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
   <div><button class="btn primary big" id="go">Start →</button></div></div></div>`;
  $('#go').onclick = () => { const n = $('#nm').value.trim(); if (n.length < 2) { toast('Type your name first'); return; } S.name = n; S.cls = $('#cl').value; go('start'); };
  $('#nm').addEventListener('keydown', e => { if (e.key === 'Enter') $('#go').click(); });
}

/* ---------- starting point ---------- */
function rStart() {
  if (!S.scStart.every(x => x != null)) {
    app().innerHTML = `<div class="card"><span class="tag acc">Starting point</span><p class="muted" style="margin:8px 0 0">Be honest: this shows how far you travel today.</p></div>`;
    const c = card(app(), '');
    c.appendChild(scRater(S.scStart, () => { $('#nx').disabled = !S.scStart.every(x => x != null); }, 'Right now, how confident are you?'));
    c.insertAdjacentHTML('beforeend', `<button class="btn primary" id="nx" disabled>Three quick questions →</button>`);
    $('#nx').onclick = () => { save(); render(); };
    return;
  }
  const step = S.diag.findIndex(x => x == null);
  if (step === -1) { go('route'); return; }
  const q = DIAG[step];
  app().innerHTML = `<div class="card reveal" style="max-width:760px;margin:auto"><div class="row between"><span class="tag acc">Question ${step + 1} of 3</span><span class="tiny muted">one try · no marks</span></div>
   <div class="figbox" style="margin-top:10px">${q.fig}</div><div class="q" style="margin-top:8px">${q.p}</div>
   <div class="opts1">${q.o.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div></div>`;
  app().querySelectorAll('.opt').forEach(b => b.onclick = () => { b.classList.add('pick'); S.diag[step] = +b.dataset.i; save(); setTimeout(render, 280); });
}

/* ---------- route ---------- */
async function rRoute() {
  if (!S.station) {
    app().innerHTML = `<div class="card center"><h2>Finding your team…</h2></div>`;
    let counts = { A: 0, B: 0, C: 0 };
    try { const b = await apiGet({ op: 'board', cls: S.cls }); counts = b.assigned || counts; } catch (e) { }
    const correct = S.diag.map((d, i) => d === DIAG[i].a);
    const ov = (new URLSearchParams(location.search).get('st') || '').toUpperCase();
    let pool = ['A', 'B', 'C'].filter((k, i) => !correct[i]); if (!pool.length) pool = ['A', 'B', 'C'];
    let cand = pool.filter(k => (counts[k] || 0) < 5); if (!cand.length) cand = ['A', 'B', 'C'].filter(k => (counts[k] || 0) < 5); if (!cand.length) cand = pool;
    cand.sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || hash(S.name + a) - hash(S.name + b));
    S.station = STN[ov] ? ov : cand[0];
    const nc = correct.filter(Boolean).length; S.level = nc <= 1 ? 1 : nc === 2 ? 2 : 3; save();
  }
  const st = STN[S.station];
  app().innerHTML = `<div class="stcard reveal"><div class="ph" style="background-image:url(${st.img})"></div>
   <div class="tx"><span class="pill">${st.icon} Station ${S.station}</span><h1 style="font-size:2rem">${st.title}</h1>
   <div style="font-size:1.15rem">${st.goal}</div>
   <div class="row">${DIAG.map((q, i) => `<span class="scchip ${S.diag[i] === q.a ? 'r2' : 'r0'}" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2)"><i></i>Q${i + 1}</span>`).join('')}<span class="muted small">your starting point</span></div>
   <div class="muted small">Your team shares one live experiment. The whole class needs your answer at the end.</div>
   <div><button class="btn primary big" id="go">Join my team →</button></div></div></div>`;
  $('#go').onclick = () => go('lab');
}
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 997; }

/* ======================================================================
   LAB (shared room)
   ====================================================================== */
let R = null, pollT = null, sim = null, lastSimT = 0, localEditT = 0, seenRows = new Set(), labStep = null;
function stopPoll() { clearInterval(pollT); pollT = null; }
const LABSTEPS = ['Experiment', 'Process', 'Explain'];

async function rLab() {
  const k = S.station;
  if (S.step >= LABSTEPS.length) { S.doneStation = true; save(); go('check'); return; }
  app().innerHTML = `<div class="card" style="padding:12px 16px"><div class="labhead"><div><span class="tag">${STN[k].icon} Station ${k}</span> <b>${STN[k].title}</b></div>
    <div class="steps4">${LABSTEPS.map((x, i) => `<span class="${i < S.step ? 'done' : i === S.step ? 'now' : ''}">${i < S.step ? '✓ ' : ''}${x}</span>`).join('')}</div></div></div><div id="body"></div>`;
  // join room (once)
  if (!R) {
    try { const res = await apiPost({ op: 'join', cls: S.cls, st: k, name: S.name, level: S.level }); R = res.room; S.role = res.me.role; S.trial = res.me.trial; }
    catch (e) { netFail(); R = R || { ver: 0, members: [{ name: S.name, role: 'trial', trial: 1 }], rows: [], sim: {}, pred: {} }; S.role = S.role || 'trial'; S.trial = S.trial || 1; }
    R.rows.forEach(r => seenRows.add(r.id)); save();
  }
  [labExperiment, labProcess, labExplain][S.step]($('#body'));
}
function startPoll(onUpdate) {
  stopPoll(); if (!ONLINE) return;
  pollT = setInterval(async () => {
    try { const r = await apiGet({ op: 'room', cls: S.cls, st: S.station }); netGood();
      if (!R || r.ver !== R.ver) { R = r; onUpdate && onUpdate(); } }
    catch (e) { if (netOK) { netFail(); } }
  }, 1500);
}
function roomOp(op, payload) {   // optimistic local apply + server
  if (!R) return;
  if (op === 'sim') R.sim = { ...payload.sim, by: S.name, t: Date.now() };
  if (op === 'pred') R.pred[S.name] = payload.value;
  if (op === 'run') { if (!R.rows.some(x => x.id === payload.row.id)) R.rows.push({ ...payload.row, by: S.name, t: Date.now(), rec: {} }); }
  if (op === 'cell') { const row = R.rows.find(x => x.id === payload.id); if (row) row.rec[payload.col] = { v: payload.value, by: S.name }; }
  if (op === 'delrow') R.rows = R.rows.filter(x => x.id !== payload.id);
  apiPost({ op, cls: S.cls, st: S.station, name: S.name, ...payload }).then(res => { if (res && res.room && res.room.ver >= (R.ver || 0)) R = res.room; }).catch(() => { netFail(); });
}
function recVals(row) {   // readings come straight from the instruments
  if (STN[S.station].proc) { const o = {}; for (const c of STN[S.station].cols) { if (!isFinite(row.raw[c.k])) return null; o[c.k] = row.raw[c.k]; } return o; }
  const out = {}; for (const c of STN[S.station].cols) { const v = parseNum(row.rec[c.k] && row.rec[c.k].v); if (!isFinite(v)) return null; out[c.k] = v; } return out;
}
const completeRows = () => R.rows.map(recVals).filter(Boolean);

/* ----- Experiment (shared) ----- */
function labExperiment(body) {
  const k = S.station, st = STN[k], role = ROLES[S.role] || ROLES.trial;
  body.innerHTML = `<div class="grid2">
    <div class="card"><div class="mbox" id="mbox"></div><div class="simwrap" id="simwrap"><div id="sim"></div></div><div class="remote" id="remote"></div></div>
    <div>
      <div class="card"><div class="role" id="rolecard"><span class="ic">${role.ic}</span><div><b>${role.name}${S.role === 'trial' ? ' ' + S.trial : ''}</b><div class="small muted">${role.job(S.trial)} Anyone can help with any job.</div></div></div>
        <div class="team" id="team" style="margin-top:10px"></div></div>
      <div class="card" id="predcard">${st.quest ? '<div id="quest"></div>' : ''}<div id="predwrap" ${st.quest && !S.questDone ? 'hidden' : ''}><h3>Predict first</h3><div class="q" style="font-size:1rem">${st.pred.q}</div><div class="pred" id="pred"></div></div></div>
      <div class="card" id="reccard"><div class="row between"><h3 style="margin:0">Table of record</h3><span class="tiny muted" id="cnt"></span></div>
        <div class="tiny muted" style="margin:2px 0 8px">Readings arrive by themselves. Processors fill the <b style="color:var(--accent-ink)">coloured columns</b>: the header says how. Green = right. 3 to 5 readings.</div>
        <div id="rectbl"></div><div id="recnext"></div></div>
    </div></div>`;
  sim = ({ A: simA, B: simB, C: simC })[k]($('#sim'));
  sim.onChange = s => { localEditT = Date.now(); clearTimeout(sim._t); sim._t = setTimeout(() => roomOp('sim', { sim: s }), 220); };
  sim.onRun = (raw, rec) => {
    if (R.rows.length >= 5) { toast('The table is full (5 readings). Delete one with × to add another.'); return false; }
    const same = R.rows.find(r => st.cols.every(c => c.k === 'y' || r.raw[c.k] === raw[c.k]));
    if (same) { toast('You already have a reading with these settings. Change something first.'); return false; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); seenRows.add(id); roomOp('run', { row: { id, raw, rec: rec || {} } }); paintTable(); return true; };
  if (st.quest) { sim.onObserve = paintQuest; sim.setState({}); }
  if (R.sim && R.sim.t) { sim.setState(R.sim); lastSimT = R.sim.t; }
  const refresh = () => {
    paintTeam(); paintPred(); paintTable(); if (st.quest) paintQuest(); paintMission();
    if (R.sim && R.sim.t > lastSimT && R.sim.by !== S.name && Date.now() - localEditT > 1200) { lastSimT = R.sim.t; sim.setState(R.sim); $('#remote').textContent = `${R.sim.by} changed the settings`; }
    for (const row of R.rows) if (!seenRows.has(row.id)) { seenRows.add(row.id); if (row.by !== S.name) { sim.playRow(row); $('#remote').textContent = `${row.by} ran a trial`; } }
  };
  refresh(); startPoll(refresh);
  // intro scene, then role coach
  if (!S.seen['scene' + k]) playScene($('#simwrap'), st.scene, () => { S.seen['scene' + k] = 1; save(false); roleCoach(); });
  else roleCoach();
}
/* Station A discovery: make a beam (observations of the shared tube) */
function paintQuest(obs) {
  const host = $('#quest'); if (!host) return;
  S.quest = S.quest || {};
  if (obs) { let ch = false; for (const k of ['off', 'on', 'rev']) if (obs[k] && !S.quest[k]) { S.quest[k] = 1; ch = true; } if (ch) save(false); }
  if (S.questDone) { host.innerHTML = `<div class="fb good" style="margin:0 0 10px">✓ Beam made: negative particles from the hot cathode, pulled through the anode.</div>`; return; }
  const items = [['off', 'Heater OFF, anode +: is there a beam?'], ['on', 'Heater ON, anode +: get a beam on the screen'], ['rev', 'Now switch the anode to −. What happens?']];
  const all = items.every(x => S.quest[x[0]]);
  if (host.dataset.all === String(all) && host.dataset.sig === JSON.stringify(S.quest)) return;
  host.dataset.all = String(all); host.dataset.sig = JSON.stringify(S.quest);
  host.innerHTML = `<h3>Make a beam</h3><div class="tiny muted" style="margin-bottom:6px">Use the heater, the voltage and the anode switch. Anyone in the team can do it.</div>
    ${items.map(x => `<div class="row" style="gap:8px;margin:4px 0"><span style="font-size:1.1rem">${S.quest[x[0]] ? '✅' : '⬜'}</span><span class="${S.quest[x[0]] ? '' : 'muted'}">${x[1]}</span></div>`).join('')}<div id="qq"></div>`;
  if (all) mcq(host.querySelector('#qq'), { p: 'So what are cathode rays?', o: ['Negative particles that leave the hot cathode and are pulled towards the + anode', 'Light given out by the hot filament', 'Positive particles pushed out by the anode'], a: 0, hint: 'No heat, no beam. Anode −, no beam. What does that say about where they come from and their charge?', why: 'They need the hot cathode, and they are attracted to +, so they are negative.' }, 'A·beam', () => {
    setTimeout(() => { S.questDone = true; save(); paintQuest(); $('#predwrap').hidden = false; paintPred(); if (sim && sim.unlock) sim.unlock(); roleCoachA2(); }, 900); });
}
/* mission panel: why + what, 2–3 lines, changes with progress */
const MISSION = {
  A: [['Make a beam', 'In 1897 nobody knew what cathode rays were. What makes the beam appear, and what makes it vanish?', 'Try the heater, the voltage and the anode switch. Watch the screen each time.'],
      ['Test the gun', 'Does a stronger field in the gun give the electrons more energy? More energy means a stiffer beam that bends less.', 'Predict first. Trial leads: 3 to 5 readings (change V, try both guns). Processors: fill the coloured columns.'],
      ['Check your prediction', 'Look at y × V: is it the same every time? Did swapping guns change anything?', 'Agree on an answer as a team, then tap Process the data.']],
  B: [['Predict', 'A magnetic field bends a moving electron into a circle. What sets the size of the circle?', 'Make your prediction first. Your team\'s picks show live.'],
      ['Measure the circle', 'If B controls the circle, changing the coil current should change the diameter.', 'Trial leads: change the current, marker on top of the ring, Record. Processors: fill the coloured columns.'],
      ['Check your prediction', 'Look at r × B: the same for one beam? So r ∝ 1/B.', 'Agree on an answer as a team, then tap Process the data.']],
  C: [['Predict', 'The electric field pushes the beam up, the magnetic field pushes it down. Balanced, the beam goes straight.', 'Make your prediction first. Your team\'s picks show live.'],
      ['Balance each beam', 'At balance qE = qvB, so you get the speed without knowing q or m.', 'Trial leads: balance each beam and Record. Processors: work out E, B and the speed v = E ÷ B.'],
      ['Check your prediction', 'Look at the v column: each beam has its own speed, found without q or m.', 'Agree on an answer as a team, then tap Process the data.']]
};
function paintMission() {
  const host = $('#mbox'); if (!host || !R) return;
  const k = S.station, n = completeRows().length;
  const stage = STN[k].quest ? (!S.questDone ? 0 : n < 3 ? 1 : 2) : (R.pred[S.name] == null ? 0 : n < 3 ? 1 : 2);
  if (host.dataset.stage === String(stage)) return; host.dataset.stage = stage;
  const m = MISSION[k][stage];
  host.innerHTML = `<div class="row between"><span class="st">Step ${stage + 1} of 3 · ${m[0]}</span><button class="linkbtn" id="replay">↺ Show me again</button></div>
    <div><b>Why:</b> ${m[1]}</div><div><b>Do:</b> ${m[2]}</div>`;
  host.classList.remove('pulse'); void host.offsetWidth; host.classList.add('pulse');
  host.querySelector('#replay').onclick = () => { ['questA', 'roleA2', 'role' + k].forEach(x => delete S.seen[x]); save(false); roleCoach(); };
}
function paintTeam() {
  $('#team').innerHTML = R.members.map((m, i) => `<span class="mem ${m.name === S.name ? 'me' : ''}">${avatar(m.name, i)}${esc(m.name.split(' ')[0])} <span class="tiny muted">${ROLES[m.role] ? ROLES[m.role].ic : ''}${m.trial || ''}</span></span>`).join('') || '<span class="muted small">Waiting for your team…</span>';
}
function paintPred() {
  const st = STN[S.station], mine = R.pred[S.name]; if (!$('#pred')) return;
  $('#pred').innerHTML = st.pred.o.map((o, i) => { const who = R.members.map((m, j) => R.pred[m.name] === i ? `<i style="background:${AV_COL[j % AV_COL.length]}">${esc(m.name[0]).toUpperCase()}</i>` : '').join('');
    return `<button data-i="${i}" class="${mine === i ? 'mine' : ''}"><span>${o}</span><span class="who">${who}</span></button>`; }).join('');
  $('#pred').querySelectorAll('button').forEach(b => b.onclick = () => { roomOp('pred', { value: +b.dataset.i }); paintPred(); });
}
function cellOK(col, row, v) { const raw = row.raw[col.k]; return isFinite(v) && Math.abs(v - raw) <= col.tol(raw); }
function procOK(row, p) { const v = parseNum(row.rec['p_' + p.k] && row.rec['p_' + p.k].v); return within(v, p.f(row.raw), 0.03); }
const rowDone = row => STN[S.station].proc.every(p => procOK(row, p));
const fmtRaw = v => typeof v === 'number' ? (Number.isInteger(v) ? v : +v.toFixed(2)) : v;
function paintTable() {
  const st = STN[S.station], host = $('#rectbl'); if (!host) return;
  const focus = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.cell;
  const key = R.rows.map(r => r.id).join(',');
  if (host.dataset.key !== key) {
    host.dataset.key = key;
    host.innerHTML = R.rows.length ? `<div style="overflow-x:auto"><table class="rec"><tr><th>#</th>${st.cols.map(c => `<th>${c.label}</th>`).join('')}${st.proc.map(p => `<th class="pc">${p.h}<small>${p.u}</small></th>`).join('')}<th></th></tr>
      ${R.rows.map((r, i) => `<tr><td><b>${i + 1}</b><span class="by">${esc(r.by.split(' ')[0])}</span></td>${st.cols.map(c => `<td class="rv">${fmtRaw(r.raw[c.k])}</td>`).join('')}${st.proc.map(p => `<td>${sciHTML(`data-cell="${r.id}|p_${p.k}"`)}</td>`).join('')}<td><button class="x" data-del="${r.id}" title="delete this reading">×</button></td></tr>`).join('')}</table></div>`
      : `<div class="muted small">No readings yet. Trial leads: run the first trial.</div>`;
    host.querySelectorAll('.sci[data-cell]').forEach(box => {
      const commit = () => { const [id, col] = box.dataset.cell.split('|'); const v = sciGet(box); const row = R.rows.find(x => x.id === id); if (!row) return; if ((row.rec[col] && row.rec[col].v) === v) return; roomOp('cell', { id, col, value: v }); paintTable(); };
      box.querySelectorAll('input').forEach(i => { i.addEventListener('change', commit); i.addEventListener('keydown', e => { if (e.key === 'Enter') { commit(); i.blur(); } }); });
    });
    host.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Delete this reading for the whole team?')) { roomOp('delrow', { id: b.dataset.del }); paintTable(); } });
  }
  const focusBox = document.activeElement && document.activeElement.closest && document.activeElement.closest('.sci[data-cell]');
  host.querySelectorAll('.sci[data-cell]').forEach(box => {
    const [id, col] = box.dataset.cell.split('|'); const row = R.rows.find(x => x.id === id); if (!row) return; const p = st.proc.find(x => 'p_' + x.k === col);
    const cur = row.rec[col]; if (box !== focusBox && cur && sciGet(box) !== cur.v) { sciSet(box, cur.v); box.classList.add('flash'); setTimeout(() => box.classList.remove('flash'), 1200); }
    const val = sciGet(box), ok = within(parseNum(val), p.f(row.raw), 0.03); box.classList.toggle('ok', val !== '' && ok); box.classList.toggle('chk', val !== '' && !ok);
    box.title = cur ? `by ${cur.by}` : p.h;
  });
  const n = R.rows.filter(rowDone).length; $('#cnt').textContent = `${R.rows.length} reading${R.rows.length === 1 ? '' : 's'} · ${n} processed · need 3`;
  const nx = $('#recnext');
  if (n >= 3 && !nx.dataset.on) { nx.dataset.on = 1; nx.innerHTML = `<div class="fb good">Three readings processed. Everyone: make sense of the data on your own.</div>`; nextBtn(nx, () => { S.step = 1; save(); render(); }, 'Make sense of it'); }
  if (n < 3 && nx.dataset.on) { nx.dataset.on = ''; nx.innerHTML = ''; }
}
function roleCoachA2() {
  const predicted = () => R.pred[S.name] != null, ranMine = () => R.rows.some(r => r.by === S.name);
  const steps = [{ el: '#predcard', t: 'Now <b>predict</b>: does twice the field in the gun make a stiffer beam? Your team\'s picks show live.', until: predicted },
    ...(S.role === 'trial' ? [{ el: sim.platesEl, t: 'The plates bend the beam. <b>Less bend = more energy.</b> Set a voltage and pick a gun.' },
      { el: sim.runEl, t: STN.A.readHint, until: ranMine },
      { el: '#reccard', t: '<b>3 to 5</b> readings: change the voltage AND swap guns. Watch whether the trace moves.' }]
    : [{ el: '#reccard', t: 'Readings arrive by themselves. <b>You process them</b>: the coloured headers show the formula. Watch the <b>y × V</b> column: what do you notice?', until: () => R.rows.some(r => Object.entries(r.rec).some(([c, x]) => c.startsWith('p_') && x.by === S.name)) }])];
  steps.forEach((x, i) => { x.n = i + 1; x.of = steps.length; }); coach(steps, 'roleA2');
}
function roleCoach() {
  const k = S.station, n = () => S.trial;
  if (k === 'A') { if (S.questDone) { sim.unlock && sim.unlock(); roleCoachA2(); } else coach([{ el: '#mbox', t: 'This panel always tells you <b>why</b> and <b>what</b>. It changes as you go.', n: 1, of: 3 }, { el: '#predcard', t: 'Thomson started here: find out what the rays <b>need</b>. Each box ticks when your team sees it happen.', n: 2, of: 3 }, { el: sim.ctrlEl, t: 'Switch the <b>heater</b> on and off, and flip the <b>anode</b> between + and −. Watch the screen each time.', n: 3, of: 3, until: () => S.questDone }], 'questA'); return; }
  const startState = JSON.stringify(sim.getState());
  const changed = () => JSON.stringify(sim.getState()) !== startState;
  const ranMine = () => R.rows.some(r => r.by === S.name);
  const typed = () => R.rows.some(r => Object.values(r.rec).some(c => c.by === S.name));
  const predicted = () => R.pred[S.name] != null;
  const steps = [{ el: '#predcard', t: 'First, <b>predict</b>. Your team\'s picks show up live.', until: predicted }];
  if (S.role === 'trial') {
    steps.push({ el: sim.ctrlEl, drag: true, t: k === 'A' ? 'Set the <b>voltage</b>, then move the <b>anode</b> to choose a gap. Try two gaps at the same voltage.' : k === 'B' ? 'Set the <b>coil current</b> for your trial.' : 'Pick a beam, then move the sliders to <b>balance</b> it.', until: changed });
    steps.push({ el: sim.runEl, t: k === 'B' ? 'Drag the cyan marker to the <b>top of the ring</b>, then tap <b>Record</b>.' : k === 'C' ? 'When the spot sits on 0, tap <b>Record</b>.' : 'Tap <b>Fire</b>. Watch the trail of equal time steps: where does the electron speed up?', until: ranMine });
  } else {
    steps.push({ el: '#reccard', t: `Readings arrive by themselves. <b>You process them</b>: the coloured headers show the formula. ${k === 'C' ? 'The last column is the <b>speed</b>.' : 'Watch the <b>r × B</b> column: what do you notice?'}`, until: () => R.rows.some(r => Object.entries(r.rec).some(([c, x]) => c.startsWith('p_') && x.by === S.name)) });
    if (S.role === 'leader') steps.push({ el: '#predcard', t: 'Team leader: when 3 rows are processed, ask the team: <b>was our prediction right?</b>' });
  }
  steps.forEach((s, i) => { s.n = i + 1; s.of = steps.length; });
  coach(steps, 'role' + k);
}

/* ----- intro scene: photos + animated diagrams, few words ----- */
function sceneAnim(kind) {
  const e = `<circle r="7" fill="#8DB8EA"/>`;
  if (kind === 'gun') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="110" y="60" width="12" height="170" fill="#c9d3e8"/><rect x="420" y="60" width="12" height="70" fill="#c9d3e8"/><rect x="420" y="160" width="12" height="70" fill="#c9d3e8"/>
    <text x="116" y="50" fill="#F07A71" font-size="26" font-weight="900" text-anchor="middle">−</text><text x="426" y="50" fill="#45C58C" font-size="26" font-weight="900" text-anchor="middle">+</text>
    <path d="M100 100 q-14 22 0 44 q14 22 0 44" stroke="#FDBA4D" stroke-width="4" fill="none"/>
    ${[0, 1, 2, 3].map(i => `<circle r="7" fill="#8DB8EA"><animate attributeName="cx" values="128;128;420;640" keyTimes="0;.12;.82;1" calcMode="spline" keySplines=".6 0 1 1;.6 0 1 1;0 0 1 1" dur="2.4s" begin="${i * .6}s" repeatCount="indefinite"/><animate attributeName="cy" values="${130 + i * 10};${130 + i * 10};145;145" keyTimes="0;.12;.82;1" dur="2.4s" begin="${i * .6}s" repeatCount="indefinite"/></circle>`).join('')}
    <text x="270" y="270" fill="#F2BD45" font-size="18" text-anchor="middle">← electric field E</text></svg>`;
  if (kind === 'strobe') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="110" y="70" width="10" height="160" fill="#c9d3e8"/><rect x="300" y="70" width="10" height="66" fill="#c9d3e8"/><rect x="300" y="164" width="10" height="66" fill="#c9d3e8"/>
    <rect x="640" y="60" width="0" height="0"/><text x="115" y="58" fill="#F07A71" font-size="24" font-weight="900" text-anchor="middle">−</text><text x="305" y="58" fill="#45C58C" font-size="24" font-weight="900" text-anchor="middle">+</text>
    <circle cx="127" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.00s" dur=".2s" fill="freeze"/></circle><circle cx="149" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.25s" dur=".2s" fill="freeze"/></circle><circle cx="185" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.50s" dur=".2s" fill="freeze"/></circle><circle cx="235" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.75s" dur=".2s" fill="freeze"/></circle><circle cx="300" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.00s" dur=".2s" fill="freeze"/></circle><circle cx="372" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.25s" dur=".2s" fill="freeze"/></circle><circle cx="444" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.50s" dur=".2s" fill="freeze"/></circle><circle cx="516" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.75s" dur=".2s" fill="freeze"/></circle><circle cx="588" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="2.00s" dur=".2s" fill="freeze"/></circle><circle cx="660" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="2.25s" dur=".2s" fill="freeze"/></circle>
    <text x="210" y="265" fill="#F2BD45" font-size="17" text-anchor="middle">speeds up in the gap</text><text x="480" y="265" fill="#7CFFB2" font-size="17" text-anchor="middle">equal steps: constant speed</text></svg>`;
  if (kind === 'curl') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice"><rect width="640" height="300" fill="#0E1424"/>
    ${Array.from({ length: 40 }, (_, i) => `<text x="${30 + (i % 10) * 62}" y="${40 + Math.floor(i / 10) * 70}" fill="#F472B6" font-size="16" opacity=".35">⊙</text>`).join('')}
    <path d="M320 260 A95 95 0 1 0 320 70 A95 95 0 1 0 320 260" fill="none" stroke="#7CFFB2" stroke-width="4" opacity=".9"><animate attributeName="stroke-dasharray" values="0 700;700 0" dur="2.2s" repeatCount="indefinite"/></path>
    <line x1="320" y1="260" x2="320" y2="70" stroke="#cfd8ea" stroke-dasharray="5 5"/><text x="334" y="170" fill="#cfd8ea" font-size="18">diameter</text></svg>`;
  if (kind === 'push') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="170" y="70" width="300" height="10" fill="#c9d3e8"/><rect x="170" y="220" width="300" height="10" fill="#c9d3e8"/><text x="150" y="82" fill="#45C58C" font-size="24" font-weight="900">+</text><text x="150" y="232" fill="#F07A71" font-size="24" font-weight="900">−</text>
    <circle cx="320" cy="150" r="10" fill="#8DB8EA"/>
    <line x1="320" y1="138" x2="320" y2="92" stroke="#45C58C" stroke-width="5"/><polygon points="320,86 311,102 329,102" fill="#45C58C"/><text x="336" y="104" fill="#45C58C" font-size="18">electric force qE</text>
    <line x1="320" y1="162" x2="320" y2="208" stroke="#F472B6" stroke-width="5"/><polygon points="320,214 311,198 329,198" fill="#F472B6"/><text x="336" y="206" fill="#F472B6" font-size="18">magnetic force qvB</text></svg>`;
  if (kind === 'straight') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="170" y="70" width="300" height="10" fill="#c9d3e8"/><rect x="170" y="220" width="300" height="10" fill="#c9d3e8"/>
    <rect x="560" y="60" width="14" height="180" fill="#2c6b55"/><line x1="40" y1="150" x2="560" y2="150" stroke="#7CFFB2" stroke-width="4"><animate attributeName="stroke-dasharray" values="0 600;600 0" dur="1.8s" repeatCount="indefinite"/></line>
    <circle cx="567" cy="150" r="9" fill="#b6ffd6"/><text x="320" y="270" fill="#cfd8ea" font-size="18" text-anchor="middle">qE = qvB</text></svg>`;
  return '';
}
function playScene(host, frames, done) {
  const el = document.createElement('div'); el.className = 'scene';
  el.innerHTML = `<div class="dots">${frames.map(() => '<i></i>').join('')}</div><button class="skip">Skip ›</button>` +
    frames.map(f => `<div class="fr">${f.img ? `<div class="bg" style="background-image:url(${f.img})"></div>` : sceneAnim(f.anim)}<div class="cap">${f.cap}<small>${f.sub || ''}</small></div></div>`).join('');
  const sv = host.querySelector('svg.sim'); if (sv) { el.style.bottom = 'auto'; el.style.height = sv.getBoundingClientRect().height + 'px'; }
  host.appendChild(el);
  let i = -1, t = null;
  const show = () => { i++; if (i >= frames.length) { finish(); return; } el.querySelectorAll('.fr').forEach((f, j) => f.classList.toggle('on', j === i)); el.querySelectorAll('.dots i').forEach((d, j) => d.classList.toggle('on', j <= i)); t = setTimeout(show, 3600); };
  const finish = () => { clearTimeout(t); el.style.transition = 'opacity .5s'; el.style.opacity = 0; setTimeout(() => { el.remove(); done && done(); }, 500); };
  el.querySelector('.skip').onclick = finish; el.onclick = e => { if (e.target.classList.contains('skip')) return; clearTimeout(t); show(); };
  show();
}

/* ===== SIM A: Teltron-style deflection tube. Steady beam, invisible except where it grazes the gridded screen ===== */
function simA(host) {
  const GUN = { 1: { d: 2.0, name: 'Gun 1 · wide gap' }, 2: { d: 1.0, name: 'Gun 2 · narrow gap' } };
  const VP = 750, DP = 0.06;                                   // deflecting plates: 750 V across 6.0 cm
  const SX = 220, PXC = 34, CY = 160, XR = 8;                  // screen left edge, px per cm, axis, reading line (cm)
  const CX = 64, GPX = 40;                                     // cathode x, gun ruler px per cm
  let kV = 2.0, gun = 1, heater = false, pol = 1, plates = false, mark = 0, unlocked = false;
  host.innerHTML = `<svg class="sim" viewBox="0 0 640 330">
   <defs><filter id="glA"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <radialGradient id="bulbA" cx=".5" cy=".5"><stop offset="0" stop-color="#18223b"/><stop offset="1" stop-color="#0f1628"/></radialGradient>
   <marker id="arA" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#F2BD45"/></marker></defs>
   <rect x="14" y="30" width="612" height="272" rx="120" fill="url(#bulbA)" stroke="#3a4a70" stroke-width="2"/>
   <text x="30" y="24" fill="#9AA4B8" font-size="11">vacuum tube</text>
   <g id="gun"></g>
   <rect x="${SX}" y="${CY - 3 * PXC}" width="${10 * PXC}" height="${6 * PXC}" fill="#13324a" opacity=".55"/>
   <g id="grid"></g>
   <rect x="${SX}" y="${CY - 3 * PXC - 12}" width="${10 * PXC}" height="7" fill="#c9d3e8"/><rect x="${SX}" y="${CY + 3 * PXC + 5}" width="${10 * PXC}" height="7" fill="#c9d3e8"/>
   <text id="ptop" x="${SX + 10 * PXC + 6}" y="${CY - 3 * PXC - 4}" fill="#9AA4B8" font-size="11"></text><text x="${SX + 10 * PXC + 6}" y="${CY + 3 * PXC + 13}" fill="#9AA4B8" font-size="11">0 V</text>
   <text x="${SX + 5 * PXC}" y="${CY - 3 * PXC - 18}" fill="#9AA4B8" font-size="11" text-anchor="middle">deflecting plates · gridded fluorescent screen</text>
   <path id="trace" fill="none" stroke="#7CFFB2" stroke-width="3" filter="url(#glA)" opacity="0"/>
   <line x1="${SX + XR * PXC}" y1="${CY - 3 * PXC}" x2="${SX + XR * PXC}" y2="${CY + 3 * PXC}" stroke="#22D3EE" stroke-width="1.5" stroke-dasharray="4 3" opacity=".8"/>
   <text x="${SX + XR * PXC + 5}" y="${CY - 3 * PXC + 13}" fill="#22D3EE" font-size="11">read here</text>
   <g id="mk" style="cursor:ns-resize"><line x1="${SX + XR * PXC - 16}" x2="${SX + XR * PXC + 16}" stroke="#22D3EE" stroke-width="3"/><polygon points="${SX + XR * PXC + 18},0 ${SX + XR * PXC + 30},-7 ${SX + XR * PXC + 30},7" fill="#22D3EE"/><rect x="${SX + XR * PXC - 30}" y="-14" width="70" height="28" fill="transparent"/></g>
   <text id="msgA" x="320" y="322" fill="#9AA4B8" font-size="12" text-anchor="middle"></text>
  </svg>
  <div class="ctrl" id="cA">
   <div class="row" style="gap:8px"><button class="btn" id="bH">🔥 Heater: OFF</button><button class="btn" id="bP">Anode: +</button><span class="seg" id="segG">${[1, 2].map(g => `<button data-g="${g}">${GUN[g].name}</button>`).join('')}</span></div>
   <label style="margin-top:8px">Anode voltage V <output id="oV"></output></label><input type="range" id="sV" min="0" max="5" step="0.5" value="${kV}">
  </div>
  <div class="row" id="platesRow"><button class="btn" id="bD" disabled>Deflecting plates: OFF 🔒</button><button class="btn primary big" id="recA" disabled>📏 Record</button><div class="inst" id="inst"><div>voltmeter: <b id="iV"></b> kV</div><div>y = <b id="iY">–</b> cm</div></div></div>`;
  const q = x => host.querySelector(x), svg = q('svg');
  // screen grid
  let gr = ''; for (let c = 0; c <= 10; c++) { const x = SX + c * PXC; gr += `<line x1="${x}" y1="${CY - 3 * PXC}" x2="${x}" y2="${CY + 3 * PXC}" stroke="#4d7f9c" stroke-width="${c % 5 ? .6 : 1.1}" opacity=".7"/><text x="${x}" y="${CY + 3 * PXC + 24}" fill="#9AA4B8" font-size="10" text-anchor="middle">${c}</text>`; }
  for (let c = -3; c <= 3; c++) { const y = CY - c * PXC; gr += `<line x1="${SX}" y1="${y}" x2="${SX + 10 * PXC}" y2="${y}" stroke="#4d7f9c" stroke-width="${c ? .6 : 1.1}" opacity=".7"/><text x="${SX - 5}" y="${y + 4}" fill="#9AA4B8" font-size="10" text-anchor="end">${c > 0 ? '+' : ''}${c}</text>`;
    if (c < 3) for (let m = 1; m < 10; m++) { const yy = y - m * PXC / 10; gr += `<line x1="${SX + XR * PXC - 4}" y1="${yy}" x2="${SX + XR * PXC + 4}" y2="${yy}" stroke="#22D3EE" stroke-width=".6" opacity=".6"/>`; } }
  q('#grid').innerHTML = gr;
  const o = { ctrlEl: q('#cA'), runEl: q('#recA'), instEl: q('#inst'), platesEl: q('#platesRow') };
  const beamOn = () => heater && pol > 0 && kV > 0;
  const yAt = xcm => plates ? (VP / DP) * (xcm / 100) ** 2 / (4 * kV * 1000) * 100 : 0;     // cm, towards the + plate
  const drawGun = () => {
    const d = GUN[gun].d, AX = CX + 9 + d * GPX, E = kV * 1000 / (d / 100), n = kV > 0 ? Math.max(1, Math.min(9, Math.round(E / 3e4))) : 0;
    let g = `<path d="M${CX - 9} 140 q-8 10 0 20 q8 10 0 20" stroke="${heater ? '#FDBA4D' : '#5b6478'}" stroke-width="3" fill="none" ${heater ? 'filter="url(#glA)"' : ''}/>
      <rect x="${CX}" y="118" width="9" height="84" fill="#c9d3e8"/><text x="${CX + 4}" y="110" fill="${pol > 0 ? '#F07A71' : '#45C58C'}" font-size="12" font-weight="800" text-anchor="middle">${pol > 0 ? '−' : '+'} cathode</text>
      <rect x="${AX}" y="118" width="8" height="34" fill="#c9d3e8"/><rect x="${AX}" y="168" width="8" height="34" fill="#c9d3e8"/>
      <text x="${AX + 4}" y="110" fill="${pol > 0 ? '#45C58C' : '#F07A71'}" font-size="12" font-weight="800" text-anchor="middle">${pol > 0 ? '+' : '−'} anode</text>
      <line x1="${AX + 4}" y1="202" x2="${AX + 4}" y2="236" stroke="#A5B4FC" stroke-dasharray="3 2"/>`;
    for (let i = 0; i < n; i++) { const y = 124 + (i + .5) * 72 / n; if (Math.abs(y - CY) < 5) continue;
      g += pol > 0 ? `<line x1="${AX - 2}" y1="${y}" x2="${CX + 14}" y2="${y}" stroke="#F2BD45" stroke-width="1.3" marker-end="url(#arA)" opacity=".85"/>` : `<line x1="${CX + 12}" y1="${y}" x2="${AX - 4}" y2="${y}" stroke="#F2BD45" stroke-width="1.3" marker-end="url(#arA)" opacity=".85"/>`; }
    let rl = `<line x1="${CX + 9}" y1="236" x2="${CX + 9 + 2.5 * GPX}" y2="236" stroke="#e6dcff"/>`;
    for (let mm = 0; mm <= 25; mm++) { const x = CX + 9 + mm * GPX / 10, big = mm % 10 === 0, mid = mm % 5 === 0; rl += `<line x1="${x}" y1="236" x2="${x}" y2="${236 + (big ? 9 : mid ? 7 : 4)}" stroke="#e6dcff" stroke-width="${big ? 1.2 : .7}"/>` + (mid ? `<text x="${x}" y="256" fill="#e6dcff" font-size="9" text-anchor="middle">${mm / 10}</text>` : ''); }
    g += rl + `<text x="${CX + 9 + 1.25 * GPX}" y="270" fill="#e6dcff" font-size="9" text-anchor="middle">gap / cm</text>`;
    // the beam: invisible in vacuum, a faint hint only in the gun's anode hole
    if (beamOn()) g += `<circle cx="${AX + 4}" cy="${CY}" r="3" fill="#7CFFB2" opacity=".6" filter="url(#glA)"/>`;
    q('#gun').innerHTML = g;
  };
  const draw = () => {
    drawGun();
    const tr = q('#trace');
    if (beamOn()) { let pts = []; for (let i = 0; i <= 50; i++) { const x = i / 5, y = yAt(x); if (y > 2.95) break; pts.push(`${(SX + x * PXC).toFixed(1)} ${(CY - y * PXC).toFixed(1)}`); }
      tr.setAttribute('d', 'M' + pts.join(' L')); tr.setAttribute('opacity', .55 + Math.random() * .2 + Math.min(.25, kV / 20)); }
    else tr.setAttribute('opacity', 0);
    q('#mk').setAttribute('transform', `translate(0,${CY - mark * PXC})`);
    q('#oV').textContent = fx(kV, 1) + ' kV'; q('#iV').textContent = fx(kV, 1); q('#iY').textContent = fx(mark, 1);
    q('#bH').textContent = '🔥 Heater: ' + (heater ? 'ON' : 'OFF'); q('#bH').classList.toggle('primary', heater);
    q('#bP').textContent = 'Anode: ' + (pol > 0 ? '+' : '−');
    q('#ptop').textContent = plates ? `+${VP} V` : '0 V';
    host.querySelectorAll('#segG button').forEach(b => b.classList.toggle('on', +b.dataset.g === gun));
    q('#bD').disabled = !unlocked; q('#bD').textContent = 'Deflecting plates: ' + (plates ? 'ON' : 'OFF') + (unlocked ? '' : ' 🔒'); q('#bD').classList.toggle('primary', plates);
    q('#recA').disabled = !(unlocked && plates && beamOn());
    q('#msgA').textContent = !heater ? 'Heater off: the cathode is cold.' : kV === 0 ? 'No voltage on the anode.' : pol < 0 ? 'Anode is negative.' : plates ? 'Line up the marker with the trace at 8 cm.' : 'The beam grazes the screen and glows.';
    o.onObserve && o.onObserve({ off: !heater && kV > 0 && pol > 0, on: beamOn(), rev: heater && kV > 0 && pol < 0 });
  };
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  q('#bH').onclick = () => { heater = !heater; changed(); }; q('#bP').onclick = () => { pol = -pol; changed(); };
  q('#bD').onclick = () => { if (!unlocked) return; plates = !plates; changed(); };
  host.querySelectorAll('#segG button').forEach(b => b.onclick = () => { gun = +b.dataset.g; changed(); });
  q('#sV').oninput = () => { kV = +q('#sV').value; changed(); };
  const mk = q('#mk'); let drag = false;
  const toCm = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const z = p.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(-3, Math.min(3, (CY - z.y) / PXC)); };
  mk.addEventListener('pointerdown', e => { drag = true; mk.setPointerCapture(e.pointerId); });
  mk.addEventListener('pointermove', e => { if (!drag) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  mk.addEventListener('pointerup', () => drag = false);
  svg.addEventListener('click', e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const z = p.matrixTransform(svg.getScreenCTM().inverse()); if (Math.abs(z.x - (SX + XR * PXC)) < 40 && !e.target.closest('#mk')) { mark = Math.round(toCm(e) * 10) / 10; changed(); } });
  q('#recA').onclick = () => { const yt = yAt(XR);
    if (Math.abs(mark - yt) > 0.15) { toast('Not lined up yet: put the marker exactly on the glowing trace at the 8 cm line.'); return; }
    o.onRun && o.onRun({ kV, d: GUN[gun].d, y: mark, yTrue: +yt.toFixed(3) }, { kV: String(kV), d: String(GUN[gun].d), y: String(mark) }); };
  o.getState = () => ({ kV, gun, heater, pol, plates, mark });
  o.setState = s => { if (s.kV != null) { kV = s.kV; q('#sV').value = kV; } if (s.gun) gun = s.gun; if (s.heater != null) heater = s.heater; if (s.pol) pol = s.pol; if (s.plates != null && unlocked) plates = s.plates; if (s.mark != null) mark = s.mark; draw(); };
  o.unlock = () => { if (!unlocked) { unlocked = true; plates = true; changed(); } };
  o.playRow = row => { o.setState({ kV: row.raw.kV, gun: row.raw.d === 1 ? 2 : 1, mark: row.raw.y }); q('#trace').animate([{ opacity: .3 }, { opacity: 1 }], { duration: 600 }); };
  setInterval(() => { if (beamOn() && document.body.contains(svg)) q('#trace').setAttribute('opacity', .6 + Math.random() * .25); }, 220);   // gentle flicker of a real trace
  draw(); return o;
}

/* ===== SIM B: fine-beam tube (also the final Thomson tube) ===== */
function simB(host, cfg = {}) {
  const PX = 21, cx = 240, cy = 210, Rb = 8.6 * PX, gx = cx, gy = cy + Rb - 12;
  let V = cfg.fixedV || 200, I = cfg.fixedI || 1.5, mark = 6;
  host.innerHTML = `<svg class="sim" viewBox="0 0 480 420">
   <defs><radialGradient id="bulb" cx=".45" cy=".4"><stop offset="0" stop-color="#2d2144"/><stop offset="1" stop-color="#120f22"/></radialGradient>
   <filter id="gl"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <circle cx="${cx}" cy="${cy}" r="${Rb + 30}" fill="none" stroke="#B5763B" stroke-width="12" opacity=".75"/>
   <text x="${cx + Rb - 4}" y="22" fill="#F472B6" font-size="11" text-anchor="end">Helmholtz coils</text>
   <circle cx="${cx}" cy="${cy}" r="${Rb}" fill="url(#bulb)" stroke="#6a5a90" stroke-width="2"/>
   <g id="ruler"></g>
   <path id="beam" fill="none" stroke="#E07BFF" stroke-width="4" filter="url(#gl)" opacity=".85"/>
   <rect x="${gx - 34}" y="${gy - 8}" width="34" height="16" rx="3" fill="#8a96b3"/><circle cx="${gx - 30}" cy="${gy}" r="4" fill="#22D3EE"/>
   <g id="mk" style="cursor:ns-resize"><line x1="${gx - 26}" x2="${gx + 26}" stroke="#22D3EE" stroke-width="3"/><polygon points="${gx + 28},0 ${gx + 42},-9 ${gx + 42},9" fill="#22D3EE"/><rect x="${gx - 44}" y="-16" width="104" height="32" fill="transparent"/></g>
   <text x="18" y="404" fill="#9AA4B8" font-size="12">B out of the screen ⊙</text>
  </svg>
  ${cfg.fixedV ? '' : `<div class="ctrl"><label>Electron gun voltage <output id="oV2"></output></label><div class="seg" id="segV">${[150, 200, 250, 300].map(v => `<button data-v="${v}">${v} V</button>`).join('')}</div></div>
  <div class="ctrl" id="cI"><label>Coil current I <output id="oI"></output></label><input type="range" id="sI" min="1" max="3" step="0.1" value="${I}"></div>`}
  <div class="row"><button class="btn primary big" id="rec">📏 Record</button><div class="inst" id="inst"><div>V = <b id="iV"></b> V</div><div>I = <b id="iI"></b> A</div><div>d = <b id="iD"></b> cm</div></div></div>
  <div class="tiny muted" id="rmsg" style="margin-top:4px">Drag the orange marker to the top of the glowing ring.</div>`;
  const svg = host.querySelector('svg'), beam = host.querySelector('#beam'), mk = host.querySelector('#mk');
  let rul = ''; for (let c = 0; c <= 16; c++) { const y = gy - c * PX; rul += `<line x1="${gx - (c % 5 === 0 ? 12 : 7)}" y1="${y}" x2="${gx}" y2="${y}" stroke="#e6dcff" stroke-width="${c % 5 === 0 ? 1.6 : 1}"/>${c % 2 === 0 ? `<text x="${gx - 16}" y="${y + 4}" fill="#e6dcff" font-size="11" text-anchor="end">${c}</text>` : ''}`;
    if (c < 16) for (let m = 1; m < 10; m++) { const yy = y - m * PX / 10; rul += `<line x1="${gx - 3}" y1="${yy}" x2="${gx}" y2="${yy}" stroke="#9a8fc0" stroke-width=".6"/>`; } }
  host.querySelector('#ruler').innerHTML = `<line x1="${gx}" y1="${gy}" x2="${gx}" y2="${gy - 16 * PX}" stroke="#e6dcff"/>` + rul + `<text x="${gx - 20}" y="${gy - 16 * PX - 8}" fill="#e6dcff" font-size="11">cm</text>`;
  const rOf = () => speed(V) / (QM * KCOIL * I);
  const o = { ctrlEl: host.querySelector('#cI') || host.querySelector('#mk'), runEl: host.querySelector('#rec'), instEl: host.querySelector('#inst') };
  const draw = () => { const rp = rOf() * 100 * PX;
    beam.setAttribute('d', `M ${gx} ${gy} A ${rp} ${rp} 0 1 0 ${gx} ${gy - 2 * rp} A ${rp} ${rp} 0 1 0 ${gx} ${gy}`);
    host.querySelector('#iV').textContent = V; host.querySelector('#iI').textContent = fx(I, 1); host.querySelector('#iD').textContent = fx(mark, 1);
    if (host.querySelector('#oI')) host.querySelector('#oI').textContent = fx(I, 1) + ' A  →  B = ' + fx(KCOIL * I * 1e3, 2) + ' mT';
    if (host.querySelector('#oV2')) { host.querySelector('#oV2').textContent = V + ' V'; host.querySelectorAll('#segV button').forEach(b => b.classList.toggle('on', +b.dataset.v === V)); }
    mk.setAttribute('transform', `translate(0,${gy - mark * PX})`); };
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  host.querySelectorAll('#segV button').forEach(b => b.onclick = () => { V = +b.dataset.v; changed(); });
  const sI = host.querySelector('#sI'); if (sI) sI.oninput = () => { I = +sI.value; changed(); };
  let drag = false; const toCm = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(0, Math.min(16, (gy - q.y) / PX)); };
  mk.addEventListener('pointerdown', e => { drag = true; mk.setPointerCapture(e.pointerId); });
  mk.addEventListener('pointermove', e => { if (!drag) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  mk.addEventListener('pointerup', () => drag = false);
  svg.addEventListener('click', e => { if (e.target.closest('#mk')) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  o.getState = () => ({ V, I, mark }); o.setState = s => { if (s.V) V = s.V; if (s.I) { I = s.I; if (sI) sI.value = I; } if (s.mark != null) mark = s.mark; draw(); };
  host.querySelector('#rec').onclick = () => { const d = 2 * rOf() * 100, msg = host.querySelector('#rmsg');
    if (Math.abs(mark - d) > 0.2) { msg.innerHTML = '<b style="color:var(--bad)">Not lined up.</b> Put the marker exactly on the top of the ring.'; return; }
    msg.textContent = cfg.fixedV ? 'Recorded.' : 'Recorded. Change the current for the next trial.';
    o.onRun && o.onRun({ V, I, d: mark }); };
  o.playRow = row => { o.setState({ V: row.raw.V, I: row.raw.I, mark: row.raw.d }); beam.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 700 }); };
  draw(); return o;
}

/* ===== SIM C: crossed fields ===== */
function simC(host) {
  let beam = 1, Vp = 0, I = 1.0; const d = 0.040, Lp = 0.08, D = 0.10;
  host.innerHTML = `<svg class="sim" viewBox="0 0 640 300">
   <defs><filter id="gl2"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <rect x="10" y="20" width="620" height="260" rx="40" fill="#141c30" stroke="#3a4a70"/>
   <rect x="30" y="140" width="50" height="20" rx="4" fill="#8a96b3"/><circle cx="36" cy="150" r="4" fill="#22D3EE"/>
   <circle cx="280" cy="150" r="92" fill="#B5763B" opacity=".14"/><text x="280" y="262" fill="#F472B6" font-size="11" text-anchor="middle">coils: B into screen ⊗</text>
   ${[0, 1, 2, 3].map(i => [0, 1, 2].map(j => `<text x="${222 + i * 38}" y="${126 + j * 24}" fill="#F472B6" font-size="13" opacity=".55" text-anchor="middle">⊗</text>`).join('')).join('')}
   <rect x="200" y="100" width="160" height="7" fill="#c9d3e8"/><text x="190" y="108" fill="#45C58C" font-size="18" font-weight="800" text-anchor="end">+</text>
   <rect x="200" y="193" width="160" height="7" fill="#c9d3e8"/><text x="190" y="202" fill="#F07A71" font-size="18" font-weight="800" text-anchor="end">−</text>
   <text x="280" y="92" fill="#9AA4B8" font-size="11" text-anchor="middle">plates 4.0 cm apart</text>
   <rect x="556" y="60" width="10" height="180" fill="#2c6b55"/><line x1="548" y1="150" x2="574" y2="150" stroke="#cfd8ea" stroke-dasharray="3 3"/>
   ${[-4, -2, 0, 2, 4].map(c => `<text x="584" y="${150 - c * 20 + 4}" fill="#9AA4B8" font-size="10">${c > 0 ? '+' : ''}${c}</text>`).join('')}<text x="590" y="52" fill="#9AA4B8" font-size="10" text-anchor="middle">cm</text>
   <g id="arE" opacity="0"><line x1="280" y1="150" x2="280" y2="118" stroke="#45C58C" stroke-width="4"/><polygon points="280,112 273,124 287,124" fill="#45C58C"/></g>
   <g id="arB" opacity="0"><line x1="280" y1="150" x2="280" y2="182" stroke="#F472B6" stroke-width="4"/><polygon points="280,188 273,176 287,176" fill="#F472B6"/></g>
   <path id="bp" fill="none" stroke="#7CFFB2" stroke-width="2.5" filter="url(#gl2)"/><circle id="spot" r="6" fill="#b6ffd6" filter="url(#gl2)"/>
   <text x="300" y="45" fill="#7CFFB2" font-size="15" text-anchor="middle" font-weight="700" id="stt"></text></svg>
  <div class="ctrl"><div class="seg" id="segB">${[1, 2, 3].map(b => `<button data-b="${b}">Beam ${b}</button>`).join('')}</div></div>
  <div class="ctrl" id="cE"><label>Plate voltage (sets E) <output id="oE"></output></label><div class="row" style="flex-wrap:nowrap"><button class="btn" data-d="-1" style="padding:4px 10px">−</button><input type="range" id="sE" min="0" max="1000" step="1" value="0"><button class="btn" data-d="1" style="padding:4px 10px">+</button></div></div>
  <div class="ctrl" id="cB"><label>Coil current (sets B) <output id="oB"></output></label><div class="row" style="flex-wrap:nowrap"><button class="btn" data-d="-0.01" style="padding:4px 10px">−</button><input type="range" id="sB" min="0" max="3" step="0.01" value="1"><button class="btn" data-d="0.01" style="padding:4px 10px">+</button></div></div>
  <div class="row"><button class="btn primary big" id="recC" disabled>✅ Record</button><div class="inst" id="inst"><div>beam <b id="iBm">1</b></div><div>plate V = <b id="iVp">0</b> V</div><div>I = <b id="iI">1.00</b> A</div></div></div>`;
  const q = s => host.querySelector(s), toY = cm => 150 - cm * 20;
  const o = { ctrlEl: q('#cE'), runEl: q('#recC'), instEl: q('#inst') };
  const draw = () => {
    const v = speed(GUN[beam]), E = Vp / d, B = KCOIL * I, a = QM * (E - v * B);
    const pts = [[80, 150], [200, 150]]; let hit = null;
    for (let i = 1; i <= 40; i++) { const x = Lp * i / 40, t = x / v, y = 0.5 * a * t * t; if (Math.abs(y) >= d / 2 - 0.0018) { hit = [200 + x * 2000, toY(Math.sign(y) * (d / 2 - 0.0018) * 100)]; break; } pts.push([200 + x * 2000, toY(y * 100)]); }
    let ys = null;
    if (!hit) { const t = Lp / v, y1 = 0.5 * a * t * t, vy = a * t; ys = (y1 + vy * D / v) * 100; pts.push([561, toY(Math.max(-4.5, Math.min(4.5, ys)))]);
      q('#spot').setAttribute('opacity', Math.abs(ys) <= 4.5 ? 1 : 0); q('#spot').setAttribute('cx', 561); q('#spot').setAttribute('cy', toY(ys)); }
    else { pts.push(hit); q('#spot').setAttribute('opacity', 0); }
    q('#bp').setAttribute('d', pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '));
    q('#arE').setAttribute('opacity', E > 0 ? 1 : 0); q('#arE').querySelector('line').setAttribute('y2', 150 - Math.min(38, 6 + 32 * E / Math.max(E, v * B, 1)));
    q('#arB').setAttribute('opacity', B > 0 ? 1 : 0); q('#arB').querySelector('line').setAttribute('y2', 150 + Math.min(38, 6 + 32 * v * B / Math.max(E, v * B, 1)));
    q('#oE').textContent = Vp + ' V  →  E = ' + sci(E, 3) + ' V/m'; q('#oB').textContent = fx(I, 2) + ' A  →  B = ' + fx(B * 1e3, 3) + ' mT';
    q('#iBm').textContent = beam; q('#iVp').textContent = Vp; q('#iI').textContent = fx(I, 2);
    host.querySelectorAll('#segB button').forEach(b => b.classList.toggle('on', +b.dataset.b === beam));
    const ok = ys != null && Math.abs(ys) < 0.2 && E > 0; q('#recC').disabled = !ok;
    q('#stt').textContent = hit ? 'beam hits a plate' : ok ? 'balanced: straight through!' : (ys > 0 ? 'spot high: electric force wins' : 'spot low: magnetic force wins');
  };
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  q('#sE').oninput = () => { Vp = +q('#sE').value; changed(); }; q('#sB').oninput = () => { I = +q('#sB').value; changed(); };
  host.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const dd = +b.dataset.d; if (Math.abs(dd) >= 1) { Vp = Math.max(0, Math.min(1000, Vp + dd)); q('#sE').value = Vp; } else { I = Math.max(0, Math.min(3, Math.round((I + dd) * 100) / 100)); q('#sB').value = I; } changed(); });
  host.querySelectorAll('#segB button').forEach(b => b.onclick = () => { beam = +b.dataset.b; changed(); });
  o.getState = () => ({ beam, Vp, I }); o.setState = s => { if (s.beam) beam = s.beam; if (s.Vp != null) { Vp = s.Vp; q('#sE').value = Vp; } if (s.I != null) { I = s.I; q('#sB').value = I; } draw(); };
  q('#recC').onclick = () => { if (R && R.rows.some(r => r.raw.beam === beam)) { toast('Beam ' + beam + ' is already in the table. Try another beam.'); return; } o.onRun && o.onRun({ beam, Vp, I }); toast('Recorded beam ' + beam); };
  o.playRow = row => o.setState(row.raw);
  draw(); return o;
}

/* ----- Process (individual) ----- */
function labProcess(body) {
  if (AN[S.station].tasks) return labProcessTasks(body);
  const k = S.station, A = AN[k], cols = A.cols[S.level], rows = completeRows(), ex = (A.extra[S.level] || []);
  startPoll(null);
  const c = card(body, `<div class="row between"><div><span class="tag acc">Process your team's data</span> <span class="tiny muted">on your own · then check your mark</span></div><span id="mk"></span></div>
   <div class="formula">${A.formula}</div><div id="tbl"></div><div id="ex"></div><div id="after"></div>`);
  if (!S.an[k]) S.an[k] = {};
  const my = S.an[k];
  const T = c.querySelector('#tbl');
  T.innerHTML = `<table class="rec"><tr><th>#</th>${STN[k].cols.map(x => `<th>${x.label}</th>`).join('')}${cols.map(x => `<th>${A.def[x].label}</th>`).join('')}</tr>
   ${rows.map((r, i) => `<tr><td><b>${i + 1}</b></td>${STN[k].cols.map(x => `<td>${r[x.k]}</td>`).join('')}${cols.map(x => `<td><input data-k="${i}|${x}" placeholder="${A.def[x].ph}" value="${esc((my[i + '|' + x]) || '')}" title="${A.def[x].hint ? esc(A.def[x].hint(r)) : ''}"><span class="auto" data-a="${i}|${x}"></span></td>`).join('')}</tr>`).join('')}</table>
   ${cols.some(x => A.def[x].hint) ? `<div class="tiny muted" style="margin-top:4px">Hover over a box for the numbers you need.</div>` : ''}`;
  T.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { my[inp.dataset.k] = inp.value; save(false); }));
  const X = c.querySelector('#ex');
  ex.forEach(e => X.insertAdjacentHTML('beforeend', `<div class="row" style="margin-top:10px"><div style="flex:1;min-width:220px">${e.p}</div><input data-x="${e.k}" placeholder="e.g. 3.5e11" style="width:170px" value="${esc(my['x|' + e.k] || '')}"><span class="small">${e.unit}</span><span class="auto" data-ax="${e.k}"></span></div>`));
  X.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { my['x|' + inp.dataset.x] = inp.value; save(false); }));
  if (ex.length) X.insertAdjacentHTML('afterbegin', `<div class="tiny muted" style="margin-top:8px">Use your own W values. Picture W against V for all your trials.</div>`);
  const chk = nextBtn(c, () => check(), 'Check my work'); chk.querySelector('button').className = 'btn dark';
  function check() {
    let got = 0, tot = 0;
    T.querySelectorAll('input').forEach(inp => { const [i, x] = inp.dataset.k.split('|'); const exp = A.def[x].f(rows[+i]); const v = parseNum(inp.value); const ok = within(v, exp, 0.03); tot++; if (ok) got++;
      inp.classList.toggle('ok', ok); inp.classList.toggle('chk', !ok); T.querySelector(`[data-a="${i}|${x}"]`).textContent = sci(exp, 3); });
    ex.forEach(e => { const inp = X.querySelector(`[data-x="${e.k}"]`); const exp = e.f(rows); const v = parseNum(inp.value); const ok = within(v, exp, e.tol); tot++; if (ok) got++;
      inp.classList.toggle('ok', ok); inp.classList.toggle('chk', !ok); X.querySelector(`[data-ax="${e.k}"]`).textContent = ' auto: ' + sci(exp, 3); inp.style.borderColor = ok ? 'var(--good)' : 'var(--gold)'; });
    if (S.mark == null) { S.mark = `${got}/${tot}`; save(); }
    c.querySelector('#mk').innerHTML = `<span class="mark">${got}/${tot}</span> <span class="tiny muted">${S.mark !== `${got}/${tot}` ? '(first check ' + S.mark + ')' : ''}</span>`;
    const g = A.graph(rows); const gr = graph(g.pts, g);
    c.querySelector('#after').innerHTML = `<div class="fb ${got === tot ? 'good' : 'hint'}">${got === tot ? 'All correct.' : 'Grey numbers under each box are the auto-processed values. Fix any amber boxes and check again.'}</div>
      <div class="grid2" style="margin-top:10px"><div>${gr.svg}</div><div><h3>What does the graph show?</h3><p>${g.note}</p></div></div>`;
    if (!c.querySelector('#gonext')) { const nb = nextBtn(c, () => { S.step = 2; save(); render(); }, 'Explain it'); nb.id = 'gonext'; }
  }
  if (!rows.length) T.innerHTML = '<div class="fb hint">Your table of record has no complete rows. Go back and finish it with your team.</div>';
  const back = document.createElement('button'); back.className = 'btn ghost small'; back.textContent = '← back to the experiment'; back.style.marginTop = '8px';
  back.onclick = () => { S.step = 0; save(); render(); }; c.appendChild(back);
}

function labProcessTasks(body) {
  const k = S.station, A = AN[k], rows = completeRows(); startPoll(null);
  const c = card(body, `<div class="row between"><div><span class="tag acc">Make sense of your team's data</span> <span class="tiny muted">on your own</span></div><span id="mk"></span></div>
    <div class="grid2" style="margin-top:8px"><div id="gr"></div><div><h3>What does the graph show?</h3><p id="gnote" class="muted">Look at the pattern first.</p><div class="formula">${A.formula}</div></div></div><div id="tasks"></div>`);
  if (!rows.length) { c.querySelector('#tasks').innerHTML = '<div class="fb hint">No complete readings yet. Go back to the experiment.</div>'; return; }
  const g = A.graph(rows); c.querySelector('#gr').innerHTML = graph(g.pts, g).svg; c.querySelector('#gnote').textContent = g.note;
  const list = A.list(S.level, rows), host = c.querySelector('#tasks');
  const fin = () => { const got = list.filter(t => S.first[k + '·p·' + t.id]).length; if (S.mark == null) { S.mark = `${got}/${list.length}`; save(); }
    c.querySelector('#mk').innerHTML = `<span class="mark">${S.mark}</span> <span class="tiny muted">right first time</span>`;
    if (!c.querySelector('#gonext')) { const nb = nextBtn(c, () => { S.step = 2; save(); render(); }, 'Explain it'); nb.id = 'gonext'; } };
  const run = i => { if (i >= list.length) { fin(); return; } const t = list[i];
    numTask(host, { p: t.p, unit: t.unit, ph: t.ph, check: v => within(v, t.exp, t.tol), hint: t.hint, why: () => `${sci(t.exp, 3)} ${t.unit}` }, k + '·p·' + t.id, () => run(i + 1)); };
  run(0);
  const back = document.createElement('button'); back.className = 'btn ghost small'; back.textContent = '← back to the experiment'; back.style.marginTop = '8px';
  back.onclick = () => { S.step = 0; save(); render(); }; c.appendChild(back);
}

/* ----- Explain (POE explain + theory) ----- */
function labExplain(body) {
  const k = S.station, st = STN[k];
  const preds = Object.values(R.pred || {}); const cnt = st.pred.o.map((_, i) => preds.filter(p => p === i).length);
  const top = cnt.indexOf(Math.max(...cnt)); const right = 0;
  const c = card(body, `<span class="tag teal">Explain</span>
   <div class="fb ${top === right ? 'good' : 'hint'}" style="margin-top:8px">Your team predicted <b>${preds.length ? st.pred.o[top] : '–'}</b>. The data says: <b>${st.pred.o[right]}</b>.</div><div id="cq"></div>`);
  mcq(c.querySelector('#cq'), st.concept, k + '·concept', () => {
    const t = card(body, `<span class="tag teal">Where does the equation come from?</span><ol class="steps" id="stp"></ol><div id="gapq"></div>`);
    const gapMode = S.level >= 2;
    const draw = filled => { t.querySelector('#stp').innerHTML = st.steps.map(s => { const hide = s.gap && gapMode && !filled; return `<li class="${hide ? 'gap' : ''}"><div class="eqbig">${hide ? '<b>?</b>' : s.m}</div><div class="why">${hide ? 'Which line goes here?' : s.w}</div></li>`; }).join(''); };
    draw(!gapMode);
    if (gapMode) { const g = st.steps.find(s => s.gap); mcq(t.querySelector('#gapq'), { p: 'Which line fills the gap?', o: g.opts, a: 0, hint: g.w, why: g.w }, k + '·theory', () => { draw(true); nextBtn(t, () => { S.step = 3; save(); render(); }, 'Finish the station'); }); }
    else nextBtn(t, () => { S.step = 3; save(); render(); }, 'Finish the station');
  });
}
/* ---------- progress check ---------- */
function rCheck() {
  const st = STN[S.station];
  app().innerHTML = `<div class="stcard reveal"><div class="ph" style="background-image:url(${st.img})"></div><div class="tx"><span class="pill">✅ Station ${S.station} done</span><h2>Progress check</h2>
    <div>Your team's piece of the puzzle:</div><div class="eqbig" style="color:#fff;font-size:1.6rem">${st.find.eq}</div><div class="muted">${st.find.t}</div></div></div>
    <div class="hist" style="margin-top:14px"><div class="yr">${st.hist.yr} · why it mattered</div>${st.hist.t}</div>`;
  const c = card(app(), '');
  c.appendChild(scRater(S.scMid, () => { $('#nx').disabled = !S.scMid.every(x => x != null); }, 'Rate yourself again'));
  c.insertAdjacentHTML('beforeend', `<p class="tiny muted">At the start you said: ${SC.map((x, i) => `SC${i + 1} <b>${S.scStart[i] == null ? '–' : RATE[S.scStart[i]]}</b>`).join(' · ')}</p><button class="btn primary" id="nx" ${S.scMid.every(x => x != null) ? '' : 'disabled'}>Share our discovery →</button>`);
  $('#nx').onclick = () => { save(); go('final'); };
}

/* ---------- final: the Thomson tube ---------- */
const EXIT = { p: 'The accelerating voltage is made four times bigger. B does not change. The radius of the circle becomes…', o: ['2 times bigger', '4 times bigger', 'half as big', 'the same'], a: 0, why: 'r = mv/(qB) and v ∝ √V, so r goes up by √4 = 2.' };
let finalPoll = null;
async function rFinal() {
  clearInterval(finalPoll);
  let board = null; try { board = await apiGet({ op: 'board', cls: S.cls }); } catch (e) { }
  const done = (board && board.done) || { [S.station]: 1 };
  const open = S.unlocked || (board && (board.unlock || ['A', 'B', 'C'].every(k => (done[k] || 0) > 0)));
  if (open && !S.unlocked) { S.unlocked = true; save(); }
  const disc = ['A', 'B', 'C'].map(k => { const rows = board && board.rooms && board.rooms[k] ? board.rooms[k].rows : [];
    const data = rows.length ? (k === 'A' ? 'Deflections: ' + rows.slice(0, 3).map(r => r.raw.y + ' cm at ' + r.raw.kV + ' kV').join(', ') : k === 'B' ? 'Diameters: ' + rows.slice(0, 3).map(r => r.raw.d + ' cm').join(', ') : 'Speeds: ' + rows.slice(0, 3).map(r => sci(r.raw.Vp / 0.04 / (KCOIL * r.raw.I), 2)).join(', ') + ' m/s') : '';
    return `<div class="d ${k === S.station ? 'mine' : ''}"><div class="ph" style="background-image:url(${STN[k].img})"></div><b>${STN[k].icon} ${STN[k].title}</b><div class="eqbig">${STN[k].find.eq}</div><div class="small">${STN[k].find.t}</div>
      <div class="tiny muted" style="margin-top:4px">${(done[k] || 0) > 0 ? '✅ ' + (done[k] || 0) + ' finished' : '⏳ still working'}${data ? ' · ' + data : ''}</div></div>`; }).join('');
  if (!open) {
    app().innerHTML = `<div class="card center"><div class="lock">🔒</div><h2>The Thomson tube opens when every team has posted.</h2><p class="muted">Meanwhile: explain your team's equation to someone from another station.</p></div>
      <div class="card"><div class="disc">${disc}</div></div><div class="center"><input id="tc" type="text" placeholder="teacher code" style="width:140px"> <button class="btn" id="tu">Unlock</button></div>`;
    $('#tu').onclick = () => { if ($('#tc').value.trim() === TEACHER_CODE) { S.unlocked = true; save(); render(); } else toast('That code is not right'); };
    finalPoll = setInterval(() => { if (S.stage === 'final') rFinal(); else clearInterval(finalPoll); }, 8000);
    return;
  }
  const F = S.final;
  app().innerHTML = `<div class="stcard reveal"><div class="ph" style="background-image:url(img/finebeam.webp)"></div><div class="tx"><span class="pill">🔓 The Thomson tube</span><h2>Put the three pieces together.</h2><div class="muted">Everyone, the same task. Use all three discoveries.</div></div></div>
   <div class="card" style="margin-top:14px"><div class="disc">${disc}</div></div>
   <div class="card"><h3>Combine A and B: make the speed disappear</h3><ol class="steps" id="cmb"></ol><button class="btn" id="more">Show the next line ↓</button></div>
   <div class="grid2"><div class="card"><h3>Measure it</h3><div class="tiny muted">V = 250 V · coil current 1.50 A, so B = ${fx(KCOIL * 1.5 * 1e3, 2)} mT</div><div id="tube" style="margin-top:6px"></div></div>
   <div class="card" id="calc"><h3>Find q/m</h3><p class="muted">Line up the marker and tap Record first.</p></div></div>`;
  const lines = [
    { m: M(mi('q') + mi('V') + mo('=') + frac(mn(1), mn(2)) + mi('m') + sq(mi('v')) + mo('⇒') + sq(mi('v')) + mo('=') + frac(mn(2) + mi('q') + mi('V'), mi('m'))), w: '⚡ Station A: the speed the gun gives.' },
    { m: M(mi('r') + mo('=') + frac(mi('m') + mi('v'), mi('q') + mi('B')) + mo('⇒') + mi('v') + mo('=') + frac(mi('q') + mi('B') + mi('r'), mi('m'))), w: '🧲 Station B: rearrange for v.' },
    { m: M(sq(mi('v')) + mo('=') + frac(sq(mi('q')) + sq(mi('B')) + sq(mi('r')), sq(mi('m')))), w: 'Square it.' },
    { m: M(frac(mn(2) + mi('q') + mi('V'), mi('m')) + mo('=') + frac(sq(mi('q')) + sq(mi('B')) + sq(mi('r')), sq(mi('m')))), w: 'Same electrons, same speed: set them equal.' },
    { m: EQ.qm, w: 'Multiply by m²/q and rearrange. No speed needed!' },
    { m: EQ.qmT, w: '⚖️ Station C gives Thomson\'s own route: put v = E/B into v = qBr/m.' }];
  let shown = F.lines || 1; const paintL = () => { $('#cmb').innerHTML = lines.slice(0, shown).map(l => `<li class="reveal"><div class="eqbig">${l.m}</div><div class="why">${l.w}</div></li>`).join(''); $('#more').hidden = shown >= lines.length; };
  paintL(); $('#more').onclick = () => { shown++; F.lines = shown; save(false); paintL(); };
  const tube = simB($('#tube'), { fixedV: 250, fixedI: 1.5 });
  tube.onRun = raw => { F.dRead = raw.d; save(); calcStage(); };
  coach([{ el: '#tube #mk', vdrag: true, t: 'Drag the marker to the top of the ring, then tap <b>Record</b>.', n: 1, of: 1, until: () => !!S.final.dRead }], 'final');
  if (F.dRead) calcStage();
  function calcStage() {
    const r = F.dRead / 200, B = KCOIL * 1.5, V = 250, qmT = 2 * V / (B * B * r * r), c = $('#calc');
    c.innerHTML = `<h3>Find q/m</h3><p>d = <b>${fx(F.dRead, 1)} cm</b> → r = <b>${fx(r, 4)} m</b> · B = ${sci(B, 3)} T · V = 250 V</p><div class="eqbig">${EQ.qm}</div>`;
    const finish = v => { F.qm = v; save(); nextBtn(c, () => go('millikan'), 'Who found the charge?'); };
    if (S.level === 1) {
      numTask(c, { p: 'Step 1: B²', unit: 'T²', ph: '1.4e-6', check: v => within(v, B * B, 0.03), hint: `${sci(B, 3)} × ${sci(B, 3)}` }, 'F·B2', () =>
        numTask(c, { p: 'Step 2: r²', unit: 'm²', ph: '2.1e-3', check: v => within(v, r * r, 0.03), hint: `${fx(r, 4)} × ${fx(r, 4)}` }, 'F·r2', () =>
          numTask(c, { p: 'Step 3: 2V ÷ (B² × r²)', unit: 'C kg⁻¹', ph: '1.8e11', check: v => within(v, qmT, 0.04), hint: '2 × 250 = 500, then divide.', why: v => `q/m = ${sci(qmT, 3)} C kg⁻¹` }, 'F·qm', finish)));
    } else numTask(c, { p: `Calculate ${EQ.qmFrac}.`, unit: 'C kg⁻¹', ph: '1.8e11', check: v => within(v, qmT, 0.04), hint: 'B in tesla, r in metres.', hint2: `500 ÷ (${sci(B * B, 3)} × ${sci(r * r, 3)})`, why: v => `q/m = ${sci(qmT, 3)} C kg⁻¹. Accepted value: 1.76 × 10¹¹ C kg⁻¹.` }, 'F·qm', finish);
  }
}

/* ---------- Millikan + the mass ---------- */
function rMillikan() {
  const qm = S.final.qm || QM;
  app().innerHTML = `<div class="stcard reveal"><div class="ph" style="background-image:url(img/drop.webp)"></div><div class="tx"><span class="pill">📜 1909 · twelve years later</span><h2>Millikan's oil drops</h2>
    <div>Thomson knew <b>q/m</b>, not q or m alone. Millikan balanced tiny charged oil drops between plates (D.2).</div>
    <div class="muted">Every drop's charge was a whole number of one smallest charge: <b style="color:#fff">e = 1.60 × 10⁻¹⁹ C</b>.</div></div></div><div id="m1" class="card" style="margin-top:14px"></div><div id="m2"></div>`;
  mcq($('#m1'), { p: 'Millikan weighed each oil drop. Did that give him the electron\'s mass?', o: ['No: that is the mass of the oil drop. He found the charge e.', 'Yes: the drop\'s mass is the electron\'s mass', 'Yes: he weighed one electron'], a: 0, hint: 'Whose mass is it: the drop, or the electron?', why: 'The weight balanced the electric force, giving the charge. The mass comes from combining e with q/m.' }, 'F·millikan', () => {
    const c = card($('#m2'), `<h3>Find the electron</h3><div class="eqbig">${EQ.me}</div><p class="muted small">Your q/m: <b>${sci(qm, 3)} C kg⁻¹</b></p>`);
    numTask(c, { p: 'Mass of the electron:', unit: 'kg', ph: '9.1e-31', check: v => within(v, QE / qm, 0.04), hint: '1.60 × 10⁻¹⁹ ÷ your q/m', why: v => `m ≈ ${sci(QE / qm, 3)} kg` }, 'F·me', v => {
      S.final.m = v; save();
      c.insertAdjacentHTML('beforeend', `<div class="card mission reveal" style="margin-top:12px"><div class="row" style="gap:18px;flex-wrap:nowrap">
        <svg viewBox="0 0 160 160" style="width:140px;flex:none"><circle cx="80" cy="80" r="60" fill="#E6A413" opacity=".9"><animate attributeName="opacity" values=".9;.25" dur="2.5s" fill="freeze"/></circle>
        <circle cx="80" cy="80" r="60" fill="none" stroke="#A5B4FC" stroke-width="2" stroke-dasharray="6 6"/>${[[50, 60], [105, 70], [75, 110], [95, 45], [60, 95]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="${1 + i * .2}s" dur=".4s" fill="freeze"/></circle>`).join('')}</svg>
        <div><h2>You found the electron.</h2><div class="eqbig" style="color:#fff;text-align:left">m<sub>e</sub> = 9.11 × 10⁻³¹ kg</div>
        <p>About 1/1840 of a hydrogen atom, and found inside every atom. Atoms have parts: Dalton's solid spheres are gone.</p></div></div></div>`);
      nextBtn(c, () => go('reflect'), 'Reflect');
    });
  });
}

/* ---------- reflect ---------- */
function rReflect() {
  app().innerHTML = `<div class="card"><span class="tag acc">Reflect</span></div>`;
  const c = card(app(), ''); c.appendChild(scRater(S.scEnd, () => { }, 'Rate yourself one last time'));
  const q = card(app(), `<div class="q">${EXIT.p}</div><div class="opts1">${EXIT.o.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div><div class="fbx"></div>`);
  const lockIn = () => { q.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; if (i === EXIT.a) x.classList.add('right'); else if (i === S.exit) x.classList.add('wrong'); });
    q.querySelector('.fbx').innerHTML = `<div class="fb ${S.exit === EXIT.a ? 'good' : 'hint'}">${EXIT.why}</div>`;
    nextBtn(q, () => { if (!S.scEnd.every(x => x != null)) { toast('Rate all three success criteria first'); return; } go('done'); }, 'See my progress'); };
  q.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (S.exit != null) return; S.exit = +b.dataset.i; save(); lockIn(); });
  if (S.exit != null) lockIn();
}
function rDone() {
  const col = v => v == null ? '#ccc' : ['var(--bad)', 'var(--gold)', 'var(--good)'][v], w = v => v == null ? 0 : (v + 1) * 33.3;
  const n = Object.values(S.first).filter(Boolean).length, tot = Object.keys(S.first).length;
  app().innerHTML = `<div class="hero reveal" style="min-height:260px"><div class="ph" style="background-image:url(img/finebeam.webp);min-height:260px"></div><div class="tx"><div class="kick">Lesson complete</div><h1>Well done, ${esc(S.name.split(' ')[0])}.</h1>
    <div class="lead">q/m = ${S.final.qm ? sci(S.final.qm, 3) : '–'} C kg⁻¹ · m = ${S.final.m ? sci(S.final.m, 3) : '–'} kg</div></div></div>
    <div class="card" style="margin-top:14px"><h3>How far you travelled today</h3><div class="prog"><span></span><span class="tiny muted">start</span><span class="tiny muted">now</span>
    ${[0, 1, 2].map(i => `<b>SC${i + 1}</b><div class="bar"><i style="width:${w(S.scStart[i])}%;background:${col(S.scStart[i])}"></i></div><div class="bar"><i style="width:${w(S.scEnd[i])}%;background:${col(S.scEnd[i])}"></i></div>`).join('')}</div>
    <p class="small muted">${SC.map((x, i) => `<b>SC${i + 1}</b> ${x.text}`).join('<br>')}</p>
    <p>Data processing mark: <b>${S.mark || '–'}</b> · right first time: <b>${n}/${tot}</b></p>
    <p class="muted">In your book: one thing you can now do, and one question you still have.</p></div>`;
  postProgress();
}

/* ---------- teacher shortcut: tap the logo 5 times ---------- */
let taps = 0, tapT = null;
document.getElementById('logo').onclick = () => { taps++; clearTimeout(tapT); tapT = setTimeout(() => taps = 0, 1500);
  if (taps >= 5) { taps = 0; const c = prompt('Teacher code'); if (c !== TEACHER_CODE) return;
    const a = prompt('Type: unlock, A / B / C (move this student), dash (teacher page), or reset (clear this device)'); if (!a) return; const x = a.trim().toLowerCase();
    if (x === 'unlock') { S.unlocked = true; save(); render(); }
    else if (['a', 'b', 'c'].includes(x)) { S.station = x.toUpperCase(); S.step = 0; R = null; if (!S.level) S.level = 2; go('lab'); }
    else if (x === 'dash') location.href = 'teacher.html';
    else if (x === 'reset') { localStorage.removeItem(KEY); S = blank(); R = null; render(); } } };

render();
setInterval(() => { if (S.name) postProgress(); }, 45000);
