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
const GUN = { 1: 150, 2: 200, 3: 250 };
const realV = nominal => Math.round(nominal * (1 + (Math.random() * 2 - 1) * 0.004));   // a real supply never sits exactly on the dial value; voltmeter reads to 1 V          // Station C beams (hidden until the end)

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
const mtext = s => `<mtext>${s}</mtext>`, mi = s => `<mi>${s}</mi>`, mn = s => `<mn>${s}</mn>`, mo = s => `<mo>${s}</mo>`;
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
  processor: { ic: '🧮', name: 'Data processor', job: () => 'You <b>process</b> the readings in the coloured columns.' },
  leader: { ic: '⭐', name: 'Team leader + processor', job: () => 'Lead the team and the prediction, and <b>process</b> the data with the processor.' }
};
const STN = {
  A: {
    title: 'Why does the beam bend?', icon: '⚡', img: 'img/filament.webp',
    goal: 'Why does a beam of electrons bend, and why does a faster beam bend less?',
    readHint: 'Drag the <b>cyan marker</b> onto the glowing trace at the 8 cm line, then tap <b>Record</b>.',
    proc: [{ k: 'iV', h: '1 ÷ V', u: 'kV⁻¹', plain: true, f: r => 1 / r.kV }, { k: 'yV', h: 'y × V', u: 'cm kV', plain: true, f: r => r.y * r.kV }],
    scene: [
      { img: 'img/filament.webp', cap: 'Hot metal boils off electrons.', sub: 'The electron gun turns them into a fast, steady beam.' },
      { anim: 'gun', cap: 'The gun voltage V sets how fast they go.', sub: 'Higher V, faster electrons.' },
      { anim: 'bendA', cap: 'Find out why the beam bends.', sub: 'Charged plates push the beam towards +. It glows where it grazes the screen.' }],
    pred: { q: 'You turn the gun voltage UP, so the electrons are faster. Between the plates the beam bends…', o: ['less', 'more', 'the same'] },
    cols: [{ k: 'kV', label: 'V / kV', dp: 3, tol: v => 0.01 }, { k: 'y', label: 'y / cm', dp: 1, tol: v => 0.01 }],
    steps: [
      { m: EQ.EVd, w: 'In the gun, the voltage V across the gap makes a uniform field that speeds the electrons up.' },
      { m: EQ.KE, w: 'The field does work qV, which becomes kinetic energy. Higher V, faster electrons.', gap: true, opts: [EQ.KE, M(mi('q') + mi('V') + mo('=') + mi('m') + mi('v')), M(mi('q') + mi('V') + mo('=') + mi('m') + mi('g') + mi('h'))] },
      { m: EQ.FqE, w: 'Between the plates the field pushes each negative electron towards +, with the same force all the way.' },
      { m: '<b>a steady forward speed and a constant sideways force give a curved path</b>', w: 'It is like a ball thrown sideways while gravity pulls it down.' },
      { m: M(mi('y') + mo('∝') + frac(mn(1), mi('V'))), w: 'A faster electron is between the plates for less time, so the force has less time to push it sideways.' }],
    concept: { p: 'Why does a faster beam bend less?', o: ['It spends less time between the plates, so the same force pushes it sideways for less time', 'The force on a fast electron is smaller', 'Fast electrons lose their charge'], a: 0, hint: 'Is the force different? Or the time it acts for?', why: 'The force qE is the same, but it acts for less time, so the beam gains less sideways velocity. That gives y ∝ 1/V.' },
    hist: { yr: '1897', t: 'Earlier experimenters could not bend cathode rays with charged plates, because leftover gas in their tubes carried a current. Thomson pumped his tube to a much better vacuum, and the rays bent towards the positive plate: they had to be negatively charged.', q: { p: 'The beam bends towards the + plate. So cathode rays…', o: ['carry negative charge', 'are a kind of light', 'have no mass'], a: 0, hint: 'Opposite charges attract.', why: 'Attracted to + means negative.' } },
    find: { eq: EQ.KE, t: 'The gun gives the beam its energy qV. A faster beam bends less.' }
  },
  B: {
    title: 'The circle in a magnetic field', icon: '🧲', img: 'img/finebeam.webp',
    goal: 'What sets the size of the circle?',
    scene: [
      { img: 'img/finebeam.webp', cap: 'This is a real fine-beam tube.', sub: 'A glass bulb with an electron gun inside, between two large coils.' },
      { anim: 'fbStraight', cap: 'Switch on the electron gun.', sub: 'With the coils off, the beam shoots straight across the bulb.' },
      { anim: 'fbCircle', cap: 'Now switch on the coils.', sub: 'Their magnetic force always points to the centre, so the beam curls into a circle.' },
      { img: 'img/coil.webp', cap: 'Measure the circle.', sub: 'A bigger current makes a stronger field B. Read the diameter on the ruler.' }],
    pred: { q: 'You make the magnetic field STRONGER. The circle gets…', o: ['smaller', 'bigger', 'no change'] },
    cols: [{ k: 'V', label: 'V / V', dp: 0, tol: v => 0.6 }, { k: 'I', label: 'I / A', dp: 2, tol: v => 0.051 }, { k: 'd', label: 'd / cm', dp: 1, tol: v => 0.21 }],
    proc: [{ k: 'r', h: 'r = d ÷ 2', u: 'cm', plain: true, f: r => r.d / 2 }, { k: 'B', h: 'B = 0.78 × I', u: 'mT', plain: true, f: r => 0.78 * r.I }, { k: 'rB', h: 'r × B', u: 'cm mT', plain: true, f: r => r.d / 2 * 0.78 * r.I }],
    steps: [
      { m: EQ.FqvB, w: 'A moving charge feels a force at right angles to its velocity.' },
      { m: '<b>a sideways force does no work, so the speed stays constant</b>', w: 'The force is always sideways, so it changes the electron\'s direction but not its speed. The path becomes a circle.' },
      { m: EQ.cent, w: 'The magnetic force is the centripetal force.', gap: true, opts: [EQ.cent, M(mi('q') + mi('v') + mi('B') + mo('=') + frac(mn(1), mn(2)) + mi('m') + sq(mi('v'))), M(mi('q') + mi('v') + mi('B') + mo('=') + mi('m') + mi('g'))] },
      { m: EQ.r, w: 'Cancel one v to get r = mv/(qB). A stronger field gives a tighter circle, and a faster electron gives a wider one.' }],
    concept: { p: 'B gets twice as strong (same beam). The radius becomes…', o: ['half as big', 'twice as big', 'the same'], a: 0, hint: 'r = mv/(qB): B is on the bottom.', why: 'r ∝ 1/B.' },
    hist: { yr: '1897', t: 'Thomson got the same result whatever metal the cathode was made of, and whatever gas was left in the tube. So the same tiny particle must be inside every kind of atom.', q: { p: 'Why did the same result for every metal matter?', o: ['The particle must be part of every atom', 'All metals are the same element', 'The magnets were identical'], a: 0, hint: 'If it came from one special metal, the result would change.', why: 'The same particle comes out of every metal, so it must be part of every atom.' } },
    find: { eq: EQ.r, t: 'The size of the circle is given by r = mv/(qB).' }
  },
  C: {
    title: 'Balancing the fields', icon: '⚖️', img: 'img/scope.webp',
    goal: 'How do you measure a speed nobody can time?',
    scene: [
      { img: 'img/scope.webp', cap: 'Electron beams draw on screens.', sub: 'Where the beam lands, the screen glows.' },
      { anim: 'push', cap: 'E pushes up. B pushes down.', sub: 'Plates make the electric field, coils make the magnetic field.' },
      { anim: 'straight', cap: 'Balance the two forces.', sub: 'Spot on the centre line means the forces cancel.' }],
    pred: { q: 'A FASTER beam, same B. To keep it straight you need…', o: ['a bigger E', 'a smaller E', 'the same E'] },
    cols: [{ k: 'beam', label: 'beam', dp: 0, tol: v => 0.01 }, { k: 'Vp', label: 'plate V / V', dp: 0, tol: v => 1.5 }, { k: 'I', label: 'I / A', dp: 2, tol: v => 0.011 }],
    proc: [{ k: 'E', h: 'E = V ÷ 0.040 m', u: 'V m⁻¹', plain: true, f: r => r.Vp / 0.04 }, { k: 'B', h: 'B = 0.78 × I', u: 'mT', plain: true, f: r => 0.78 * r.I }, { k: 'v', h: 'v = E ÷ B', u: '× 10⁶ m s⁻¹ · B in tesla!', plain: true, pow: 6, f: r => r.Vp / 0.04 / (KCOIL * r.I) }],
    steps: [
      { m: EQ.FqE, w: 'The electric field pushes the electron up, towards the positive plate.' },
      { m: EQ.FqvB, w: 'The magnetic field pushes it down.' },
      { m: EQ.bal, w: 'The beam goes straight, so there is no overall force and the two forces are equal.', gap: true, opts: [EQ.bal, M(mi('q') + mi('E') + mo('=') + frac(mi('m') + sq(mi('v')), mi('r'))), M(mi('E') + mo('=') + mi('v') + sq(mi('B')))] },
      { m: EQ.vEB, w: 'The charge q cancels, so the speed depends only on E and B.' }],
    concept: { p: 'You double B for the same beam. To keep it straight you must…', o: ['double E', 'halve E', 'keep E the same'], a: 0, hint: 'v = E/B and v has not changed.', why: 'v = E/B has not changed, so if B doubles, E must double too.' },
    hist: { yr: '1897', t: 'Balancing the two fields let Thomson measure the speed of cathode rays. They were much slower than light, which ruled out light waves and pointed to particles.', q: { p: 'Balancing the fields let Thomson find…', o: ['the speed, without knowing q or m', 'the charge e', 'the mass m'], a: 0, hint: 'What is left in v = E/B?', why: 'The equation v = E/B contains neither q nor m, so the speed can be found without them.' } },
    find: { eq: EQ.vEB, t: 'When the fields balance, the speed is v = E/B.' }
  }
};

/* personal analysis: columns by level, computed from the RECORDED values */
const AN = {
  A: {
    tasks: true,
    formula: `${M(mi('y') + mo('∝') + frac(mn(1), mi('V')))} &nbsp; so &nbsp; ${M(mi('y') + mo('×') + mi('V') + mo('=') + mtext('constant'))} &nbsp;&nbsp; ${EQ.KE}`,
    list: (lvl, rows) => { const r = rows[0], Vn = r.kV >= 4 ? 1.5 : 4.0, out = [
      { id: 'y', p: `Trial 1 bent y = ${fx(r.y, 1)} cm at ${fx(r.kV, 3)} kV. Predict the bend at ${fx(Vn, 3)} kV.`, unit: 'cm', plain: true, exp: r.y * r.kV / Vn, tol: 0.06, hint: `y × V stays the same: ${fx(r.y, 1)} × ${fx(r.kV, 3)} = ? × ${fx(Vn, 3)}` }];
      if (lvl >= 2) out.push({ id: 'V', p: `What gun voltage would make the beam bend exactly 1.0 cm?`, unit: 'kV', plain: true, exp: r.y * r.kV / 1.0, tol: 0.06, hint: 'y × V stays the same, so V = (y × V) ÷ 1.0' });
      if (lvl >= 3) out.push({ id: 'W', p: `Each electron in trial 1 gains W = qV. Give W in electronvolts (1 eV = the energy one electron gains through 1 V).`, unit: 'eV', plain: true, exp: r.kV * 1000, tol: 0.01, hint: 'One electron through V volts gains V electronvolts. Watch the kilo.' });
      return out; },
    graph: rows => ({ pts: rows.map(r => [1 / r.kV, r.y]), xl: '1/V / kV⁻¹', yl: 'y / cm', fit: 'origin', note: 'The points lie on a straight line through the origin, so y ∝ 1/V. A faster beam bends less.' })
  },
  B: {
    tasks: true,
    formula: `${M(mi('B') + mo('=') + mn('0.78 mT') + mo('×') + mi('I'))} &nbsp;&nbsp; ${EQ.r} &nbsp;&nbsp; ${M(mi('r') + mi('B') + mo('=') + frac(mi('m') + mi('v'), mi('q')))}`,
    list: (lvl, rows) => { const r = rows[0], out = [
      { id: 'B', p: `Trial 1: the ammeter reads I = ${fx(r.I, 2)} A. For these coils B = 0.78 mT × I. What is B?`, unit: 'mT', plain: true, exp: 0.78 * r.I, tol: 0.03, hint: `0.78 × ${fx(r.I, 2)}` }];
      if (lvl >= 2) out.push({ id: 'r2', p: `Same beam, but B made twice as strong. Predict the new radius from trial 1.`, unit: 'cm', plain: true, exp: r.d / 4, tol: 0.05, hint: `r ∝ 1/B. Trial 1 radius = ${fx(r.d / 2, 2)} cm.` });
      if (lvl >= 3) out.push({ id: 'I2', p: `Same beam. What coil current would make the diameter ${fx(r.d * 0.8, 1)} cm?`, unit: 'A', plain: true, exp: r.I / 0.8, tol: 0.04, hint: 'r × B stays the same, so I × d stays the same.' });
      return out; },
    graph: rows => { const V0 = rows[0].V, same = rows.filter(r => r.V === V0); return { pts: same.map(r => [1 / (KCOIL * r.I * 1e3), r.d / 2]), xl: `1/B / mT⁻¹ (beam at ${V0} V)`, yl: 'r / cm', fit: 'origin', note: 'For one beam the points lie on a straight line through the origin, so r ∝ 1/B and r × B stays the same.' }; }
  },
  C: {
    tasks: true,
    formula: `${M(mi('E') + mo('=') + frac(mi('V'), mi('d')))} &nbsp;&nbsp; ${M(mi('B') + mo('=') + mn('0.78 mT') + mo('×') + mi('I'))} &nbsp;&nbsp; ${EQ.vEB}`,
    list: (lvl, rows) => { const r = rows[0], E = r.Vp / 0.04, B = KCOIL * r.I, v = E / B, out = [
      { id: 'v', p: `Beam ${r.beam} balanced at E = ${sci(E, 3)} V m⁻¹ and B = ${sci(B, 3)} T. How fast is it?`, unit: 'm s⁻¹', ph: '7e6', exp: v, tol: 0.03, hint: 'Balanced: qE = qvB, so v = E ÷ B. B must be in tesla.' }];
      if (lvl >= 2 && rows[1]) { const r2 = rows[1]; out.push({ id: 'E2', p: `Beam ${r2.beam} has the speed in your table. If B were doubled, what E would balance it?`, unit: 'V m⁻¹', plain: true, exp: 2 * r2.Vp / 0.04, tol: 0.03, hint: 'v = E/B must stay the same, so E doubles too.' }); }
      if (lvl >= 3) out.push({ id: 'qm', p: `Beam ${r.beam} came from a ${GUN[r.beam]} V gun. Use qV = ½mv² to find q/m.`, unit: 'C kg⁻¹', ph: '1.8e11', exp: v * v / (2 * GUN[r.beam]), tol: 0.05, hint: 'q/m = v² ÷ (2V)' });
      return out; },
    graph: rows => ({ pts: rows.map(r => [r.beam, (r.Vp / 0.04) / (KCOIL * r.I) / 1e6]), xl: 'beam', yl: 'v / 10⁶ m s⁻¹', fit: null, xint: true, note: 'Each beam has a different speed, v = E/B, found without knowing q or m.' })
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
function postProgress() { if (!S.name || S.preview) return; apiPost({ op: 'progress', cls: S.cls, name: S.name, data: summary() }).catch(() => { netFail(); }); }

/* ============ TOP BAR ============ */
function paintTop() {
  const alias = { route: 'start', millikan: 'final', done: 'reflect' };
  let idx = STAGES.findIndex(x => x[0] === (alias[S.stage] || S.stage)); if (S.stage === 'done') idx = STAGES.length;
  S.maxIdx = Math.max(S.maxIdx || 0, idx);
  $('#rail').innerHTML = STAGES.map((s, i) => { const can = i >= 2 && i <= S.maxIdx && i !== idx; return `<span class="${i < idx || (i <= S.maxIdx && i !== idx) ? 'on' : i === idx ? 'now' : ''}${can ? ' click' : ''}" data-i="${i}" title="${s[1]}${can ? ' (tap to go back)' : ''}"></span>`; }).join('');
  $('#rail').querySelectorAll('span.click').forEach(sp => sp.onclick = () => { const st = STAGES[+sp.dataset.i][0]; if (st === 'lab' && S.step > 4) S.step = 4; go(st); });
  const latest = i => [S.scEnd[i], S.scMid[i], S.scStart[i]].find(x => x != null);
  $('#scbar').innerHTML = SC.map((c, i) => { const v = latest(i); return `<span class="scchip ${v == null ? '' : 'r' + v}" title="SC${i + 1} ${c.short}: ${v == null ? 'not rated yet' : RATE[v]}"><i></i>SC${i + 1}</span>`; }).join('') +
    `<span class="net ${!ONLINE ? '' : netOK ? 'on' : 'off'}" title="connection to your group">${!ONLINE ? 'solo mode' : netOK ? '● live' : '● reconnecting'}</span>`;
}

/* ============ HELPERS ============ */
const $ = s => document.querySelector(s);
const app = () => $('#app');
function toast(t, ms = 2600) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = t; (document.fullscreenElement || document.body).appendChild(d); setTimeout(() => d.remove(), ms); }
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
const sciHTML = (attr = '', plain = false) => plain ? `<span class="sci plain" ${attr}><input class="m" inputmode="decimal" placeholder="?" aria-label="number"></span>` : `<span class="sci" ${attr}><input class="m" inputmode="decimal" placeholder="?" aria-label="number"><span class="t">× 10</span><input class="x" inputmode="numeric" placeholder="0" aria-label="power of ten"></span>`;
const sciGet = box => { const m = box.querySelector('.m').value.trim(), xe = box.querySelector('.x'), x = xe ? xe.value.trim().replace(/[−–]/g, '-') : ''; return m === '' ? '' : x === '' ? m : m + 'e' + x; };
const sciSet = (box, str) => { str = String(str || ''); const xe = box.querySelector('.x'); if (!xe) { box.querySelector('.m').value = str; return; } const i = str.toLowerCase().indexOf('e'); box.querySelector('.m').value = i < 0 ? str : str.slice(0, i); xe.value = i < 0 ? '' : str.slice(i + 1); };
function numTask(host, cfg, id, onDone) {
  let pow = 0; if (!cfg.plain && cfg.exp) { pow = cfg.pow != null ? cfg.pow : Math.floor(Math.log10(Math.abs(cfg.exp))); if (pow >= -2 && pow <= 3) pow = 0; }
  const unitTxt = (pow ? '× 10' + supify(pow) + ' ' : '') + (cfg.unit || ''), chk0 = cfg.check; cfg = { ...cfg, plain: true, unit: unitTxt, check: v => chk0(v * 10 ** pow) };
  const d = document.createElement('div');
  d.innerHTML = `<div class="q">${cfg.p}</div>${cfg.help ? `<div class="muted small" style="margin:2px 0 8px">${cfg.help}</div>` : ''}
   <div class="row">${sciHTML(`data-pow="${pow}"`, true)}<span>${cfg.unit || ''}</span><button class="btn primary">Check</button></div><div class="fbx"></div>`;
  host.appendChild(d);
  const box = d.querySelector('.sci'), fbx = d.querySelector('.fbx'), btn = d.querySelector('button'); let tries = 0;
  const inp = { get value() { return sciGet(box); }, set disabled(v) { box.querySelectorAll('input').forEach(i => i.disabled = v); }, addEventListener: (ev, fn) => box.querySelectorAll('input').forEach(i => i.addEventListener(ev, fn)) };
  btn.onclick = () => {
    const v = parseNum(inp.value); if (!isFinite(v)) { fbx.innerHTML = `<div class="fb hint">Type a number.</div>`; return; }
    tries++; const ok = cfg.check(v);
    if (!(id in S.first)) { S.first[id] = ok; save(); }
    box.classList.toggle('ok', ok); box.classList.toggle('chk', !ok);
    if (ok) { inp.disabled = true; btn.disabled = true; fbx.innerHTML = `<div class="fb good"><b>Correct.</b> ${cfg.why ? cfg.why(v * 10 ** pow) : ''}</div>`; onDone && onDone(v * 10 ** pow); }
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
let coachReplay = false;
function coach(steps, key, done) { if (S.seen[key] && !coachReplay) { done && done(); return; } S.seen[key] = 1; save(false); coachQ = coachReplay ? steps.map(x => ({ ...x, until: null })) : steps.slice(); coachReplay = false; coachDone = done; coachNext(); }
function coachLock(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; document.body.style.overflow = on ? 'hidden' : ''; }
function coachStop() { clearInterval(coachTimer); const c = $('#coach'); clearInterval(c._iv); c.hidden = true; coachQ = []; coachEl = null; coachLock(false); }
function coachPlace() {   // positions ring, hand and bubble from the target's CURRENT position
  const c = $('#coach'); if (c.hidden || !coachEl || !document.body.contains(coachEl)) return;
  const st = coachSt, r = coachEl.getBoundingClientRect(), ring = c.querySelector('.ring'), hand = c.querySelector('.hand'), bub = c.querySelector('.bubble');
  Object.assign(ring.style, { left: (r.left - 6) + 'px', top: (r.top - 6) + 'px', width: (r.width + 12) + 'px', height: (r.height + 12) + 'px' });
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (st.drag) { hand.style.left = (coachFlip ? r.left + r.width * .8 : r.left + r.width * .2) + 'px'; hand.style.top = (cy - 4) + 'px'; }
  else if (st.vdrag) { hand.style.left = (cx - 8) + 'px'; hand.style.top = (coachFlip ? r.top + r.height * .22 : r.top + r.height * .78) + 'px'; }
  else { hand.style.left = (cx - 8) + 'px'; hand.style.top = (cy - 4) + 'px'; }
  hand.style.display = (st.until || st.drag || st.vdrag) ? '' : 'none';
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
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  coachEl = el; coachSt = st; coachFlip = false; c.hidden = false;
  const ring = c.querySelector('.ring'), hand = c.querySelector('.hand'), bub = c.querySelector('.bubble');
  hand.classList.toggle('tap', !st.drag && !st.vdrag);
  bub.innerHTML = `<button class="cx" title="close the tips">✕</button><div style="padding-right:18px">${st.t}</div><div class="row between"><span class="tiny muted">Tip ${st.n} of ${st.of}</span><button class="btn primary nx" style="padding:5px 14px">${coachQ.length ? 'Next' : 'Done'}</button></div>`;
  bub.querySelector('.nx').onclick = () => coachNext(); bub.querySelector('.cx').onclick = () => { coachQ = []; coachNext(); };
  requestAnimationFrame(coachPlace);
  if (st.drag || st.vdrag) c._iv = setInterval(() => { coachFlip = !coachFlip; coachPlace(); }, st.drag ? 750 : 850);
  if (st.until) { ring.style.pointerEvents = 'none'; coachTimer = setInterval(() => { if (st.until()) { clearInterval(coachTimer); setTimeout(coachNext, 350); } }, 300); }
}

/* ============ ROUTER ============ */
/* ---------- teacher preview: jump to any station, tab or stage; nothing is saved to the class ---------- */
function demoRows() {
  const k = S.station, st = STN[k];
  const raws = k === 'A' ? [1.5, 2.5, 4.0].map(kV => ({ kV, y: Math.round(20 / kV) / 10 }))
    : k === 'B' ? [1.2, 1.6, 2.2].map(I => ({ V: 250, I, d: Math.round(2 * speed(250) / (QM * KCOIL * I) * 1000) / 10 }))
    : [1, 2, 3].map(beam => ({ beam, Vp: Math.round(speed(GUN[beam]) * KCOIL * 0.04), I: 1 }));
  R.rows = raws.map((raw, i) => { const rec = {}; st.proc.forEach(p => rec['p_' + p.k] = { v: String(+(p.f(raw) / 10 ** (p.pow || 0)).toPrecision(4)), by: 'demo' }); return { id: 'demo' + i, by: 'Demo', raw, rec }; });
}
function startPreview() {
  const keep = S.preview ? S : null;
  S = Object.assign(blank(), { name: 'Teacher preview', cls: 'Test group', preview: true, unlocked: true, level: 2, scStart: [1, 1, 1], scMid: [1, 1, 1], diag: DIAG.map(d => d.a), stage: 'lab', station: 'A', step: 0 });
  if (keep) S.seen = keep.seen || {};
  R = null; seenRows = new Set(); save(false); history.replaceState(null, '', location.pathname); render();
}
function paintPreview() {
  let bar = document.getElementById('pvbar'); if (!S.preview) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'pvbar'; document.body.appendChild(bar); }
  const b = (lab, on, act) => `<button class="${on ? 'on' : ''}" data-a="${act}">${lab}</button>`, lab = S.stage === 'lab';
  bar.innerHTML = `<span class="pt">Preview</span>${['A', 'B', 'C'].map(k => b(k, S.station === k, 'st:' + k)).join('')}<i></i>
    ${LABSTEPS.map((x, i) => b(x, lab && S.step === i, 'step:' + i)).join('')}<i></i>
    ${[['check', 'Check'], ['final', 'Final tube'], ['millikan', 'Millikan'], ['reflect', 'Reflect']].map(([g, t]) => b(t, S.stage === g, 'go:' + g)).join('')}<i></i>
    <button data-a="intro" title="show the intro and tips again">↺ Tips</button><button data-a="exit">Exit</button>`;
  bar.querySelectorAll('button').forEach(x => x.onclick = () => { const [a, v] = x.dataset.a.split(':');
    if (a === 'st') { S.station = v; R = null; seenRows = new Set(); S.doneStation = true; S.stage = 'lab'; S.step = 0; }
    if (a === 'step') { S.stage = 'lab'; S.step = +v; S.doneStation = true; }
    if (a === 'go') { S.stage = v; S.doneStation = true; }
    if (a === 'intro') S.seen = {};
    if (a === 'exit') { S = blank(); R = null; }
    save(false); render(); });
}
function render() {
  paintTop(); coachStop(); paintPreview();
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
const LABSTEPS = ['Predict', 'Explore', 'Experiment', 'Process', 'Explain'];

let lastLabStep = null;
async function rLab() {
  const k = S.station; if (lastLabStep !== S.step) { lastLabStep = S.step; scrollTo(0, 0); }
  if (S.step >= LABSTEPS.length) { S.doneStation = true; S.step = 4; save(); go('check'); return; }
  app().innerHTML = `<div class="card" style="padding:12px 16px"><div class="labhead"><div><span class="tag">${STN[k].icon} Station ${k}</span> <b>${STN[k].title}</b></div>
    <div class="steps4">${LABSTEPS.map((x, i) => `<button data-st="${i}" class="${i === S.step ? 'now' : (S.visited || {})[i] ? 'done' : ''}">${x}</button>`).join('')}<button data-st="5" class="${S.doneStation ? 'done' : ''}">Progress check</button></div></div></div><div id="body"></div>`;
  S.visited = S.visited || {}; S.visited[S.step] = 1;
  app().querySelectorAll('.steps4 button').forEach(b => b.onclick = () => { const i = +b.dataset.st; if (i === 5) { if (!S.doneStation) { toast('Finish Explain first, then do the progress check.'); return; } go('check'); return; } S.step = i; save(); render(); });
  // join room (once)
  if (!R && S.preview) { R = { ver: 0, members: [{ name: S.name, role: 'trial', trial: 1 }], rows: [], sim: {}, pred: {} }; S.role = 'trial'; S.trial = 1; }
  if (S.preview && S.step >= 3 && R.rows.filter(rowDone).length < 3) demoRows();
  if (!R) {
    try { const res = await apiPost({ op: 'join', cls: S.cls, st: k, name: S.name, level: S.level }); R = res.room; S.role = res.me.role; S.trial = res.me.trial; }
    catch (e) { netFail(); R = R || { ver: 0, members: [{ name: S.name, role: 'trial', trial: 1 }], rows: [], sim: {}, pred: {} }; S.role = S.role || 'trial'; S.trial = S.trial || 1; }
    R.rows.forEach(r => seenRows.add(r.id)); save();
  }
  [labPredict, labExplore, labExperiment, labProcess, labExplain][S.step]($('#body'));
}
function startPoll(onUpdate) {
  stopPoll(); if (!ONLINE || S.preview) return;
  pollT = setInterval(async () => {
    try { const r = await apiGet({ op: 'room', cls: S.cls, st: S.station }); netGood();
      if (!R || r.ver !== R.ver) { R = r; onUpdate && onUpdate(); } }
    catch (e) { if (netOK) { netFail(); } }
  }, 2500);
}
function roomOp(op, payload) {   // optimistic local apply + server
  if (!R) return;
  if (op === 'sim') R.sim = { ...payload.sim, by: S.name, t: Date.now() };
  if (op === 'pred') R.pred[S.name] = payload.value;
  if (op === 'run') { if (!R.rows.some(x => x.id === payload.row.id)) R.rows.push({ ...payload.row, by: S.name, t: Date.now(), rec: {} }); }
  if (op === 'cell') { const row = R.rows.find(x => x.id === payload.id); if (row) row.rec[payload.col] = { v: payload.value, by: S.name }; }
  if (op === 'delrow') R.rows = R.rows.filter(x => x.id !== payload.id);
  if (S.preview) return;
  apiPost({ op, cls: S.cls, st: S.station, name: S.name, ...payload }).then(res => { if (res && res.room && res.room.ver >= (R.ver || 0)) R = res.room; }).catch(() => { netFail(); });
}
function recVals(row) {   // readings come straight from the instruments
  if (STN[S.station].proc) { const o = {}; for (const c of STN[S.station].cols) { if (!isFinite(row.raw[c.k])) return null; o[c.k] = row.raw[c.k]; } return o; }
  const out = {}; for (const c of STN[S.station].cols) { const v = parseNum(row.rec[c.k] && row.rec[c.k].v); if (!isFinite(v)) return null; out[c.k] = v; } return out;
}
const completeRows = () => R.rows.map(recVals).filter(Boolean);

/* ----- Predict (its own slide, shared picks) ----- */
const PREDFIG = {
  A: `<svg viewBox="0 0 420 170"><rect x="110" y="22" width="220" height="8" fill="#9fe3c0"/><rect x="110" y="140" width="220" height="8" fill="#c9d3e8"/>
    <text x="100" y="31" fill="#1D8F5F" font-size="18" font-weight="800" text-anchor="end">+</text><text x="100" y="149" fill="#C8463E" font-size="18" font-weight="800" text-anchor="end">−</text>
    <path d="M20 85 L110 85 Q240 85 330 40 L400 8" fill="none" stroke="#1D8F5F" stroke-width="3"/>
    <circle cx="220" cy="78" r="7" fill="#2F6FB5"/><line x1="220" y1="70" x2="220" y2="42" stroke="#E6A413" stroke-width="3" marker-end="url(#pf)"/><text x="212" y="52" fill="#B07A00" font-size="13" font-weight="800" text-anchor="end">push towards +</text>
    <defs><marker id="pf" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#E6A413"/></marker></defs>
    <text x="20" y="110" fill="#5E6470" font-size="12">beam from the gun</text></svg>`,
  B: FIG.circle, C: FIG.crossed
};
const PREDTXT = {
  A: 'The gun speeds electrons up, and <b>a higher voltage V means faster electrons</b>. Between two charged plates, each negative electron is <b>pushed towards the + plate</b>, so the beam bends.',
  B: 'A magnetic field pushes a moving electron <b>sideways, at right angles</b> to its motion. The push turns with it, so the beam curls into a <b>circle</b>.',
  C: 'The plates push the beam <b>up</b> and the magnetic field pushes it <b>down</b>. When the two pushes are <b>equal</b>, the beam goes <b>straight</b>.'
};
function labPredict(body) {
  const k = S.station, st = STN[k];
  body.innerHTML = `<div class="card" style="max-width:820px;margin:auto"><span class="tag acc">Step 1 · Predict</span>
    <div class="figbox" style="margin-top:10px">${PREDFIG[k]}</div><p style="font-size:1.08rem;margin:10px 0">${PREDTXT[k]}</p>
    <div class="q">${st.pred.q}</div><div class="pred" id="pred"></div><div class="tiny muted" style="margin-top:6px">Your team's picks show live. Next you can try the apparatus, then test your prediction.</div><div id="pgo"></div><button class="linkbtn" id="rintro" style="margin-top:10px">▶ Watch the intro again</button></div>`;
  const refresh = () => { paintPred(); if (R.pred[S.name] != null && !$('#pgo').dataset.on) { $('#pgo').dataset.on = 1; nextBtn($('#pgo'), () => { S.step = 1; save(); render(); }, 'Try the apparatus'); } };
  refresh(); startPoll(refresh);
  $('#pred').addEventListener('click', () => setTimeout(refresh, 50));
  const intro = () => { const cd = body.querySelector('.card'); cd.style.position = 'relative'; cd.style.minHeight = '400px'; cd.style.overflow = 'hidden'; playScene(cd, st.scene, () => { S.seen['scene' + k] = 1; save(false); }); };
  $('#rintro').onclick = intro;
  if (!S.seen['scene' + k]) intro();
}

/* ----- Explore (own copy, nothing recorded) ----- */
const EXPLORE = {
  A: 'Switch the plates on and off, then move both sliders: the gun voltage and the plate voltage. Watch the yellow force arrow and how far the beam bends.',
  B: 'Switch on the gun and the coils. Try different gun voltages and coil currents and watch how the circle changes.',
  C: 'Pick a beam and move both sliders. The plates push the beam up and the coils push it down. Find a setting where the beam goes straight.'
};
const VARS = {
  A: { iv: 'the gun voltage V', dv: 'the deflection y at the 8 cm line', cv: 'the plates: 750 V, 6.0 cm apart, always on',
       t: 'The plates are set to 750 V as the control. Change the gun voltage and measure the deflection y for at least 3 different voltages.' },
  B: { iv: 'the coil current I', dv: 'the diameter d of the circle', cv: 'the gun voltage: 250 V',
       t: 'The gun voltage is set to 250 V as the control. Change the current in the coils and measure the diameter for at least 3 different currents.' },
  C: { iv: 'the beam (beams 1, 2 and 3 come from 150 V, 200 V and 250 V guns)', dv: 'the plate voltage that makes the beam go straight', cv: 'the coil current: 1.00 A, and the plates 4.0 cm apart',
       t: 'The coil current is set to 1.00 A as the control. For each beam, change the plate voltage until the beam goes straight, then record that voltage.' }
};
const PROCNOTE = {
  A: 'The voltmeter reads the gun voltage V in kV. Work out 1 ÷ V, then y × V. If y × V stays about the same, then y ∝ 1/V.',
  B: 'The ammeter measures the coil current I. For these coils the magnetic field at the centre is <b>B = 0.78 mT × I</b> (the 0.78 comes from the size of the coils and their number of turns). Work out r = d ÷ 2, then B, then r × B.',
  C: 'The plates are 0.040 m apart, so <b>E = V ÷ 0.040 m</b>. The ammeter measures the coil current I, and for these coils <b>B = 0.78 mT × I</b>. Then v = E ÷ B, with B in tesla (1 mT = 0.001 T).'
};
function fsHook() {
  const sc = $('#simcard'), fsb = $('#fsbtn');
  fsb.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (sc.requestFullscreen) sc.requestFullscreen().catch(() => toast('Full screen is not available on this device.')); else toast('Full screen is not available on this device.'); };
  document.onfullscreenchange = () => { if ($('#fsbtn')) $('#fsbtn').textContent = document.fullscreenElement ? '✕ Exit full screen' : '⛶ Full screen'; };
}
function labExplore(body) {
  const k = S.station; stopPoll();
  body.innerHTML = `<div class="card simcard" id="simcard" style="max-width:900px;margin:auto"><div class="mbox"><div class="row between"><span class="st">Step 2 · Explore the apparatus</span></div>
    <div>${EXPLORE[k]}</div><div class="tiny muted">This is your own copy. Nothing is recorded, and your team's experiment is not changed.</div></div>
    <div class="row between fsrow"><span class="tiny muted">Go full screen for a bigger view.</span><button class="btn" id="fsbtn">⛶ Full screen</button></div><div class="simwrap" id="simwrap"><div id="sim"></div></div><div id="exgo"></div></div>`;
  const s = ({ A: simA, B: simB, C: simC })[k]($('#sim'), { mode: 'explore' });
  if (k === 'A') s.onObserve = o => { if (o.plates && !S.seenPlates) { S.seenPlates = 1; save(false); } };
  fsHook();
  nextBtn($('#exgo'), () => { S.step = 2; save(); render(); }, 'Start the experiment');
}

/* ----- Experiment (shared) ----- */
function labExperiment(body) {
  const k = S.station, st = STN[k], role = ROLES[S.role] || ROLES.trial;
  const vb = VARS[k];
  body.innerHTML = `<div class="card" id="varcard" style="padding:12px 16px"><div class="vars"><div><span>Change</span>${vb.iv}</div><div><span>Measure</span>${vb.dv}</div><div><span>Keep fixed</span>${vb.cv}</div></div>
    <div class="small" style="margin-top:8px">${vb.t} In an experiment everything is kept the same except the one thing you change, and you measure what happens.</div></div>
    <div class="grid2">
    <div class="card simcard" id="simcard"><div class="mbox" id="mbox"></div><div class="row between fsrow"><span class="tiny muted">Taking readings? Go full screen.</span><button class="btn" id="fsbtn">⛶ Full screen</button></div><div class="simwrap" id="simwrap"><div id="sim"></div></div><div class="remote" id="remote"></div></div>
    <div>
      <div class="card"><div class="role" id="rolecard"><span class="ic">${role.ic}</span><div><b>${role.name}${S.role === 'trial' ? ' ' + S.trial : ''}</b><div class="small muted">${role.job(S.trial)} Anyone can help with any job.</div></div></div>
        <div class="team" id="team" style="margin-top:10px"></div></div>
      <div class="card small" id="predcard">Your prediction: <b>${R.pred[S.name] != null ? st.pred.o[R.pred[S.name]] : '–'}</b> <button class="linkbtn" id="chgp">change</button><div class="tiny muted">${st.pred.q}</div></div>
    </div></div>
    <div class="card" id="reccard"><div class="row between"><h3 style="margin:0">Table of record</h3><span class="tiny muted" id="cnt"></span></div>
      <div class="small procnote">${PROCNOTE[k]}</div><div class="tiny muted" style="margin:2px 0 8px">Processors fill in the <b style="color:var(--accent-ink)">coloured columns</b> using the formula in each header. A cell turns green when it is right. Take 3 to 5 readings.</div>
      <div id="rectbl"></div><div id="recnext"></div></div>`;
  sim = ({ A: simA, B: simB, C: simC })[k]($('#sim'), { mode: 'exp' });
  fsHook();
  sim.onChange = s => { localEditT = Date.now(); clearTimeout(sim._t); sim._t = setTimeout(() => roomOp('sim', { sim: s }), 220); };
  sim.onRun = (raw, rec) => {
    if (R.rows.length >= 5) { toast('The table is full (5 readings). Delete one with × to add another.'); return false; }
    const same = R.rows.find(r => st.cols.every(c => c.k === 'y' || r.raw[c.k] === raw[c.k]));
    if (same) { toast('You already have a reading with these settings. Change something first.'); return false; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); seenRows.add(id); roomOp('run', { row: { id, raw, rec: rec || {} } }); paintTable(); return true; };
  $('#chgp').onclick = () => { S.step = 0; save(); render(); };
  if (k === 'A') { sim.onObserve = o => { if (o.plates && !S.seenPlates) { S.seenPlates = 1; save(false); } }; sim.setState({}); }
  if (R.sim && R.sim.t) { sim.setState(R.sim); lastSimT = R.sim.t; }
  const refresh = () => {
    paintTeam(); paintTable(); paintMission();
    if (R.sim && R.sim.t > lastSimT && R.sim.by !== S.name && Date.now() - localEditT > 1200) { lastSimT = R.sim.t; sim.setState(R.sim); $('#remote').textContent = `${R.sim.by} changed the settings`; }
    for (const row of R.rows) if (!seenRows.has(row.id)) { seenRows.add(row.id); if (row.by !== S.name) { sim.playRow(row); $('#remote').textContent = `${row.by} ran a trial`; } }
  };
  refresh(); startPoll(refresh);
  // intro scene, then role coach
  roleCoach();
}
/* Station A discovery: why does the beam bend? */
function paintQuest(obs) {
  const host = $('#quest'); if (!host) return;
  if (obs && obs.plates && !S.seenPlates) { S.seenPlates = 1; save(false); }
  if (S.questDone) { host.innerHTML = `<div class="fb good" style="margin:0 0 10px">✓ Negative electrons feel a constant push towards +, while they keep moving forward: a curve.</div>`; return; }
  if (!S.seenPlates) { if (host.dataset.m !== '0') { host.dataset.m = '0'; host.innerHTML = `<h3>Why does the beam bend?</h3><div class="muted small">Switch the <b>deflecting plates</b> on and off. Watch the beam, and the two arrows on the electron.</div>`; } return; }
  if (host.dataset.m === '1') return; host.dataset.m = '1';
  host.innerHTML = `<h3>Why does the beam bend?</h3><div id="qq"></div>`;
  mcq(host.querySelector('#qq'), { p: 'The beam curves towards the + plate. Why?', o: ['Electrons are negative: the field pushes them towards + with the same force all the way, while they keep moving forward', 'The + plate is hotter', 'Gravity pulls the beam'], a: 0, hint: 'Watch the yellow force arrow. Which way does it point? Does it change size?', why: 'A constant sideways force on something moving forward gives a curve, like a ball thrown sideways under gravity.' }, 'A·bend', () => {
    setTimeout(() => { S.questDone = true; save(); paintQuest(); $('#predwrap').hidden = false; paintPred(); if (sim && sim.unlock) sim.unlock(); paintMission(); roleCoachA2(); }, 1100); });
}
/* mission panel: why + what, 2–3 lines, changes with progress */
const MISSION = {
  A: [['Bend the beam', 'The beam is a stream of electrons. Why does it curve when the plates are on?', 'Switch the deflecting plates on and off. Watch the yellow force arrow and the green velocity arrow.'],
      ['Test your prediction', 'A higher gun voltage gives faster electrons. Do they bend more or less? The plates stay at 750 V, so only the speed changes.', 'Trial leads: 3 to 5 readings at different gun voltages. Processors: fill the coloured columns.'],
      ['Check your prediction', 'Is y × V the same for every reading? If so, y ∝ 1/V, and doubling the voltage halves the bend. Can you explain why?', 'Agree on an answer as a team, then tap Process the data.']],
  B: [['Predict', 'A magnetic field bends a moving electron into a circle. What sets the size of the circle?', 'Make your prediction first. Your team\'s picks show live.'],
      ['Test your prediction', 'The gun voltage stays at 250 V, so every reading uses the same beam. What does a stronger field B do to the circle?', 'Trial leads: change the coil current, marker on top of the ring, Record. Processors: fill the coloured columns.'],
      ['Check your prediction', 'Is r × B the same for every reading? If so, r ∝ 1/B.', 'Agree on an answer as a team, then tap Process the data.']],
  C: [['Predict', 'The electric field pushes the beam up, the magnetic field pushes it down. Balanced, the beam goes straight.', 'Make your prediction first. Your team\'s picks show live.'],
      ['Test your prediction', 'The coil current stays at 1.00 A, so B is the same for every beam. When the forces qE and qvB are equal the beam goes straight, and v = E ÷ B.', 'Trial leads: for each beam, change the plate voltage until it goes straight, then Record. Processors: work out E, B and the speed v = E ÷ B.'],
      ['Check your prediction', 'Look at the v column. Each beam has a different speed, and you found it without knowing q or m.', 'Agree on an answer as a team, then tap Process the data.']]
};
function paintMission() {
  const host = $('#mbox'); if (!host || !R) return;
  const k = S.station, n = completeRows().length;
  const stage = n < 3 ? 1 : 2;
  if (host.dataset.stage === String(stage)) return; host.dataset.stage = stage;
  const m = MISSION[k][stage];
  host.innerHTML = `<div class="row between"><span class="st">${m[0]}</span><button class="linkbtn" id="replay">↺ Show me again</button></div>
    <div><b>Why:</b> ${m[1]}</div><div><b>Do:</b> ${m[2]}</div>`;
  host.classList.remove('pulse'); void host.offsetWidth; host.classList.add('pulse');
  host.querySelector('#replay').onclick = () => { coachReplay = true; roleCoach(true); };
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
function procOK(row, p) { const v = parseNum(row.rec['p_' + p.k] && row.rec['p_' + p.k].v) * 10 ** (p.pow || 0); return within(v, p.f(row.raw), 0.03); }
const rowDone = row => STN[S.station].proc.every(p => procOK(row, p));
const fmtRaw = (v, dp) => typeof v !== 'number' ? v : dp != null ? v.toFixed(dp) : (Number.isInteger(v) ? v : +v.toFixed(2));
function paintTable() {
  const st = STN[S.station], host = $('#rectbl'); if (!host) return;
  const focus = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.cell;
  const key = R.rows.map(r => r.id).join(',');
  if (host.dataset.key !== key) {
    host.dataset.key = key;
    host.innerHTML = R.rows.length ? `<div style="overflow-x:auto"><table class="rec"><tr><th>#</th>${st.cols.map(c => `<th>${c.label}</th>`).join('')}${st.proc.map(p => `<th class="pc">${p.h}<small>${p.u}</small></th>`).join('')}<th></th></tr>
      ${R.rows.map((r, i) => `<tr><td><b>${i + 1}</b><span class="by">${esc(r.by.split(' ')[0])}</span></td>${st.cols.map(c => `<td class="rv">${fmtRaw(r.raw[c.k], c.dp)}</td>`).join('')}${st.proc.map(p => `<td>${sciHTML(`data-cell="${r.id}|p_${p.k}" data-pow="${p.pow || 0}"`, !!p.plain)}</td>`).join('')}<td><button class="x" data-del="${r.id}" title="delete this reading">×</button></td></tr>`).join('')}</table></div>`
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
    const val = sciGet(box), ok = within(parseNum(val) * 10 ** (p.pow || 0), p.f(row.raw), 0.03); box.classList.toggle('ok', val !== '' && ok); box.classList.toggle('chk', val !== '' && !ok);
    box.title = cur ? `by ${cur.by}` : p.h;
  });
  const n = R.rows.filter(rowDone).length; $('#cnt').textContent = `${R.rows.length} reading${R.rows.length === 1 ? '' : 's'} · ${n} processed · need 3`;
  const nx = $('#recnext');
  if (n >= 3 && !nx.dataset.on) { nx.dataset.on = 1; nx.innerHTML = `<div class="fb good">Three readings processed. Everyone: make sense of the data on your own.</div>`; nextBtn(nx, () => { S.step = 3; save(); render(); }, 'Make sense of it'); }
  if (n < 3 && nx.dataset.on) { nx.dataset.on = ''; nx.innerHTML = ''; }
}
function roleCoachA2() {
  const predicted = () => R.pred[S.name] != null, ranMine = () => R.rows.some(r => r.by === S.name);
  const steps = [...(S.role === 'trial' ? [{ el: sim.ctrlEl, drag: true, t: 'Change the <b>gun voltage</b> for your reading. The plates stay at 750 V.' },
      { el: sim.runEl, t: STN.A.readHint + ' Take 3 to 5 readings at different voltages.', until: ranMine }]
    : [{ el: '#reccard', t: '<b>You process the readings</b>, using the formula in each coloured header. Watch the <b>y × V</b> column. What do you notice?', until: () => R.rows.some(r => Object.entries(r.rec).some(([c, x]) => c.startsWith('p_') && x.by === S.name)) }])];
  steps.forEach((x, i) => { x.n = i + 1; x.of = steps.length; }); coach(steps, 'roleA2');
}
function roleCoach() {
  const k = S.station, n = () => S.trial;
  if (k === 'A') { roleCoachA2(); return; }
  const startState = JSON.stringify(sim.getState());
  const changed = () => JSON.stringify(sim.getState()) !== startState;
  const ranMine = () => R.rows.some(r => r.by === S.name);
  const typed = () => R.rows.some(r => Object.values(r.rec).some(c => c.by === S.name));
  const predicted = () => R.pred[S.name] != null;
  const steps = [];
  if (k === 'B' && S.role === 'trial') steps.push({ el: sim.swEl, t: 'Switch on the <b>electron gun</b>: the beam shoots straight. Then switch on the <b>coils</b> and watch it curl.', until: () => { const g = sim.getState(); return g.gun && g.coils; } });
  if (S.role === 'trial') {
    steps.push({ el: sim.ctrlEl, drag: true, t: k === 'B' ? 'Change the <b>coil current</b> to change the field B. The gun voltage stays at 250 V. Notice that the yellow force arrow always points to the centre.' : 'Pick a beam, then adjust the <b>plate voltage</b> until the yellow and pink arrows are equal and the spot sits on 0. The coil current stays at 1.00 A.', until: changed });
    steps.push({ el: sim.runEl, t: k === 'B' ? 'Drag the cyan marker to the <b>top of the ring</b>, then tap <b>Record</b>.' : 'When the two forces are equal the beam goes straight. Tap <b>Record</b>.', until: ranMine });
  } else {
    steps.push({ el: '#reccard', t: `<b>You process the readings</b>, using the formula in each coloured header. ${k === 'C' ? 'The last column is the <b>speed</b>.' : 'Watch the <b>r × B</b> column. What do you notice?'}`, until: () => R.rows.some(r => Object.entries(r.rec).some(([c, x]) => c.startsWith('p_') && x.by === S.name)) });
    if (S.role === 'leader') steps.push({ el: '#predcard', t: 'Team leader: when 3 rows are processed, ask the team: <b>was our prediction right?</b>' });
  }
  steps.forEach((s, i) => { s.n = i + 1; s.of = steps.length; });
  coach(steps, 'role' + k);
}

/* ----- intro scene: photos + animated diagrams, few words ----- */
function sceneAnim(kind) {
  const e = `<circle r="7" fill="#8DB8EA"/>`;
  if (kind === 'gun') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="110" y="60" width="12" height="170" fill="#c9d3e8"/><rect x="420" y="60" width="12" height="70" fill="#c9d3e8"/><rect x="420" y="160" width="12" height="70" fill="#c9d3e8"/>
    <text x="116" y="50" fill="#F07A71" font-size="26" font-weight="900" text-anchor="middle">−</text><text x="426" y="50" fill="#45C58C" font-size="26" font-weight="900" text-anchor="middle">+</text>
    <path d="M100 100 q-14 22 0 44 q14 22 0 44" stroke="#FDBA4D" stroke-width="4" fill="none"/>
    ${[0, 1, 2, 3].map(i => `<circle r="7" fill="#8DB8EA"><animate attributeName="cx" values="128;128;420;640" keyTimes="0;.12;.82;1" calcMode="spline" keySplines=".6 0 1 1;.6 0 1 1;0 0 1 1" dur="2.4s" begin="${i * .6}s" repeatCount="indefinite"/><animate attributeName="cy" values="${130 + i * 10};${130 + i * 10};145;145" keyTimes="0;.12;.82;1" dur="2.4s" begin="${i * .6}s" repeatCount="indefinite"/></circle>`).join('')}
    <text x="270" y="270" fill="#F2BD45" font-size="18" text-anchor="middle">← electric field E</text></svg>`;
  if (kind === 'strobe') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="110" y="70" width="10" height="160" fill="#c9d3e8"/><rect x="300" y="70" width="10" height="66" fill="#c9d3e8"/><rect x="300" y="164" width="10" height="66" fill="#c9d3e8"/>
    <rect x="640" y="60" width="0" height="0"/><text x="115" y="58" fill="#F07A71" font-size="24" font-weight="900" text-anchor="middle">−</text><text x="305" y="58" fill="#45C58C" font-size="24" font-weight="900" text-anchor="middle">+</text>
    <circle cx="127" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.00s" dur=".2s" fill="freeze"/></circle><circle cx="149" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.25s" dur=".2s" fill="freeze"/></circle><circle cx="185" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.50s" dur=".2s" fill="freeze"/></circle><circle cx="235" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="0.75s" dur=".2s" fill="freeze"/></circle><circle cx="300" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.00s" dur=".2s" fill="freeze"/></circle><circle cx="372" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.25s" dur=".2s" fill="freeze"/></circle><circle cx="444" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.50s" dur=".2s" fill="freeze"/></circle><circle cx="516" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="1.75s" dur=".2s" fill="freeze"/></circle><circle cx="588" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="2.00s" dur=".2s" fill="freeze"/></circle><circle cx="660" cy="150" r="7" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="2.25s" dur=".2s" fill="freeze"/></circle>
    <text x="210" y="265" fill="#F2BD45" font-size="17" text-anchor="middle">speeds up in the gap</text><text x="480" y="265" fill="#7CFFB2" font-size="17" text-anchor="middle">equal steps: constant speed</text></svg>`;
  if (kind === 'bendA') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="80" y="110" width="8" height="80" fill="#c9d3e8"/><rect x="140" y="110" width="8" height="30" fill="#c9d3e8"/><rect x="140" y="160" width="8" height="30" fill="#c9d3e8"/>
    <text x="84" y="100" fill="#F07A71" font-size="14" font-weight="800" text-anchor="middle">−</text><text x="144" y="100" fill="#45C58C" font-size="14" font-weight="800" text-anchor="middle">+</text>
    <rect x="200" y="60" width="380" height="180" fill="#13324a" opacity=".55"/>${Array.from({ length: 11 }, (_, i) => `<line x1="${200 + i * 38}" y1="60" x2="${200 + i * 38}" y2="240" stroke="#4d7f9c" stroke-width=".6"/>`).join('')}
    <rect x="200" y="48" width="380" height="8" fill="#9fe3c0"/><rect x="200" y="244" width="380" height="8" fill="#c9d3e8"/><text x="590" y="56" fill="#45C58C" font-size="16" font-weight="800">+</text>
    <line x1="88" y1="150" x2="200" y2="150" stroke="#7CFFB2" stroke-width="2" stroke-dasharray="3 4" opacity=".5"/>
    <path d="M200 150 Q390 150 580 70" fill="none" stroke="#7CFFB2" stroke-width="4"><animate attributeName="stroke-dasharray" values="0 420;420 0" dur="2s" repeatCount="indefinite"/></path>
    <line x1="380" y1="128" x2="380" y2="96" stroke="#F2BD45" stroke-width="3"/><polygon points="380,90 373,102 387,102" fill="#F2BD45"/><text x="390" y="104" fill="#F2BD45" font-size="14" font-weight="800">push towards +</text></svg>`;
  if (kind === 'fbStraight' || kind === 'fbCircle') { const on = kind === 'fbCircle', X = 220, Y = 150, gy = 214;
    const pill = (y, txt, lit) => `<rect x="410" y="${y - 20}" width="190" height="30" rx="15" fill="${lit ? '#3b3420' : '#1b2335'}" stroke="${lit ? '#FDE68A' : '#3a4a70'}"/><text x="505" y="${y}" fill="${lit ? '#FDE68A' : '#9AA4B8'}" font-size="15" font-weight="800" text-anchor="middle">${txt}</text>`;
    return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <circle cx="${X}" cy="${Y}" r="112" fill="none" stroke="#7a5230" stroke-width="14"/><circle cx="${X}" cy="${Y}" r="112" fill="none" stroke="#c08a52" stroke-width="14" stroke-dasharray="1.5 3" opacity=".6"/>
    ${on ? `<circle cx="${X}" cy="${Y}" r="112" fill="none" stroke="#FDE68A" stroke-width="2" stroke-dasharray="8 12"><animate attributeName="stroke-dashoffset" values="0;-40" dur="1s" repeatCount="indefinite"/></circle>` : ''}
    <circle cx="${X}" cy="${Y}" r="92" fill="#1b1530" stroke="#6a5a90" stroke-width="2"/>
    <rect x="${X - 34}" y="${gy - 7}" width="30" height="14" rx="3" fill="#8a96b3"/><circle cx="${X - 30}" cy="${gy}" r="4" fill="#FDBA4D"/>
    ${on ? `<path d="M${X - 4} ${gy} A52 52 0 1 0 ${X - 4} ${gy - 104} A52 52 0 1 0 ${X - 4} ${gy}" fill="none" stroke="#C4A5FF" stroke-width="4"><animate attributeName="stroke-dasharray" values="0 340;340 0" dur="2s" repeatCount="indefinite"/></path>
      <line x1="${X + 48}" y1="${gy - 52}" x2="${X + 20}" y2="${gy - 52}" stroke="#F2BD45" stroke-width="3"/><polygon points="${X + 14},${gy - 52} ${X + 24},${gy - 58} ${X + 24},${gy - 46}" fill="#F2BD45"/>
      <line x1="${X + 52}" y1="${gy - 52}" x2="400" y2="200" stroke="#F2BD45" stroke-width="1" stroke-dasharray="3 3"/><text x="410" y="205" fill="#F2BD45" font-size="15" font-weight="800">force points to the centre</text>`
      : `<line x1="${X - 4}" y1="${gy}" x2="${X + 84}" y2="${gy}" stroke="#C4A5FF" stroke-width="4"><animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.2s" repeatCount="indefinite"/></line>
      <text x="410" y="205" fill="#C4A5FF" font-size="15" font-weight="800">beam goes straight</text>`}
    ${pill(80, 'electron gun: ON', true)}${pill(124, 'coils: ' + (on ? 'ON' : 'OFF'), on)}</svg>`; }
  if (kind === 'mFall' || kind === 'mHold') { const on = kind === 'mHold';
    return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="160" y="40" width="320" height="10" fill="${on ? '#9fe3c0' : '#c9d3e8'}"/><rect x="160" y="250" width="320" height="10" fill="${on ? '#f2b0aa' : '#c9d3e8'}"/>
    <text x="150" y="50" fill="${on ? '#45C58C' : '#9AA4B8'}" font-size="18" font-weight="800" text-anchor="end">${on ? '+' : '0 V'}</text><text x="150" y="260" fill="${on ? '#F07A71' : '#9AA4B8'}" font-size="18" font-weight="800" text-anchor="end">${on ? '−' : '0 V'}</text>
    ${on ? `<circle cx="320" cy="150" r="9" fill="#FDE68A"><animate attributeName="cy" values="148;152;148" dur="2s" repeatCount="indefinite"/></circle>
      <line x1="320" y1="138" x2="320" y2="100" stroke="#45C58C" stroke-width="4"/><polygon points="320,94 312,108 328,108" fill="#45C58C"/><text x="332" y="112" fill="#45C58C" font-size="15" font-weight="800">electric force qE</text>
      <line x1="320" y1="162" x2="320" y2="200" stroke="#F472B6" stroke-width="4"/><polygon points="320,206 312,192 328,192" fill="#F472B6"/><text x="332" y="198" fill="#F472B6" font-size="15" font-weight="800">weight mg</text>`
      : [220, 300, 380, 440].map((x, i) => `<circle cx="${x}" r="7" fill="#FDE68A"><animate attributeName="cy" values="60;240" dur="${2.2 + i * .4}s" begin="${i * .3}s" repeatCount="indefinite"/></circle>`).join('')}
    </svg>`; }
  if (kind === 'curl') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    ${Array.from({ length: 40 }, (_, i) => `<text x="${30 + (i % 10) * 62}" y="${40 + Math.floor(i / 10) * 70}" fill="#F472B6" font-size="16" opacity=".35">⊙</text>`).join('')}
    <path d="M320 260 A95 95 0 1 0 320 70 A95 95 0 1 0 320 260" fill="none" stroke="#7CFFB2" stroke-width="4" opacity=".9"><animate attributeName="stroke-dasharray" values="0 700;700 0" dur="2.2s" repeatCount="indefinite"/></path>
    <line x1="320" y1="260" x2="320" y2="70" stroke="#cfd8ea" stroke-dasharray="5 5"/><text x="334" y="170" fill="#cfd8ea" font-size="18">diameter</text></svg>`;
  if (kind === 'push') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="170" y="70" width="300" height="10" fill="#c9d3e8"/><rect x="170" y="220" width="300" height="10" fill="#c9d3e8"/><text x="150" y="82" fill="#45C58C" font-size="24" font-weight="900">+</text><text x="150" y="232" fill="#F07A71" font-size="24" font-weight="900">−</text>
    <circle cx="320" cy="150" r="10" fill="#8DB8EA"/>
    <line x1="320" y1="138" x2="320" y2="92" stroke="#45C58C" stroke-width="5"/><polygon points="320,86 311,102 329,102" fill="#45C58C"/><text x="336" y="104" fill="#45C58C" font-size="18">electric force qE</text>
    <line x1="320" y1="162" x2="320" y2="208" stroke="#F472B6" stroke-width="5"/><polygon points="320,214 311,198 329,198" fill="#F472B6"/><text x="336" y="206" fill="#F472B6" font-size="18">magnetic force qvB</text></svg>`;
  if (kind === 'straight') return `<svg class="anim" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet"><rect width="640" height="300" fill="#0E1424"/>
    <rect x="170" y="70" width="300" height="10" fill="#c9d3e8"/><rect x="170" y="220" width="300" height="10" fill="#c9d3e8"/>
    <rect x="560" y="60" width="14" height="180" fill="#2c6b55"/><line x1="40" y1="150" x2="560" y2="150" stroke="#7CFFB2" stroke-width="4"><animate attributeName="stroke-dasharray" values="0 600;600 0" dur="1.8s" repeatCount="indefinite"/></line>
    <circle cx="567" cy="150" r="9" fill="#b6ffd6"/><text x="320" y="270" fill="#cfd8ea" font-size="18" text-anchor="middle">qE = qvB</text></svg>`;
  return '';
}
function playScene(host, frames, done) {
  const el = document.createElement('div'); el.className = 'scene';
  el.innerHTML = `<div class="dots">${frames.map((_, j) => `<i data-j="${j}"></i>`).join('')}</div><button class="skip">Skip ›</button>` +
    frames.map(f => `<div class="fr">${f.img ? `<div class="bg" style="background-image:url(${f.img})"></div>` : sceneAnim(f.anim)}<div class="cap">${f.cap}<small>${f.sub || ''}</small></div></div>`).join('') +
    `<div class="nav"><button class="btn" id="sb">‹ Back</button><button class="btn primary" id="sn">Next ›</button></div>`;
  const sv = host.querySelector('svg.sim'); if (sv) { el.style.bottom = 'auto'; el.style.height = sv.getBoundingClientRect().height + 'px'; }
  host.appendChild(el);
  let i = 0;
  const show = () => { el.querySelectorAll('.fr').forEach((f, j) => f.classList.toggle('on', j === i)); el.querySelectorAll('.dots i').forEach((d, j) => d.classList.toggle('on', j <= i));
    el.querySelector('#sb').style.visibility = i === 0 ? 'hidden' : 'visible'; el.querySelector('#sn').textContent = i === frames.length - 1 ? 'Start ›' : 'Next ›'; };
  const finish = () => { el.style.transition = 'opacity .5s'; el.style.opacity = 0; setTimeout(() => { el.remove(); done && done(); }, 500); };
  el.querySelector('.skip').onclick = finish;
  el.querySelector('#sn').onclick = () => { if (i >= frames.length - 1) finish(); else { i++; show(); } };
  el.querySelector('#sb').onclick = () => { if (i > 0) { i--; show(); } };
  el.querySelectorAll('.dots i').forEach(d => d.onclick = () => { i = +d.dataset.j; show(); });
  show();
}

/* ===== SIM A: deflection tube. Steady beam (invisible in vacuum, glows on the screen) + live force and velocity arrows ===== */
function simA(host, cfg = {}) {
  const EXP = cfg.mode === 'exp', EXPL = cfg.mode === 'explore'; let VP = 750; const DP = 0.06, SX = 220, PXC = 34, CY = 160, XR = 8, CX = 64, AX = 144;
  let kV = 2.0, Vr = realV(2000) / 1000, plates = EXP, mark = 0, unlocked = true;
  host.innerHTML = `<svg class="sim" viewBox="0 0 640 320">
   <defs><filter id="glA"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <radialGradient id="bulbA" cx=".5" cy=".5"><stop offset="0" stop-color="#18223b"/><stop offset="1" stop-color="#0f1628"/></radialGradient>
   <marker id="arY" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#F2BD45"/></marker>
   <marker id="arG" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#45C58C"/></marker></defs>
   <rect x="14" y="30" width="612" height="262" rx="120" fill="url(#bulbA)" stroke="#3a4a70" stroke-width="2"/>
   <path d="M${CX - 9} 140 q-8 10 0 20 q8 10 0 20" stroke="#FDBA4D" stroke-width="3" fill="none" filter="url(#glA)"/>
   <rect x="${CX}" y="118" width="9" height="84" fill="#c9d3e8"/><text x="${CX + 4}" y="110" fill="#F07A71" font-size="12" font-weight="800" text-anchor="middle">− cathode</text>
   <rect x="${AX}" y="118" width="8" height="34" fill="#c9d3e8"/><rect x="${AX}" y="168" width="8" height="34" fill="#c9d3e8"/><text x="${AX + 4}" y="110" fill="#45C58C" font-size="12" font-weight="800" text-anchor="middle">+ anode</text>
   <text x="${(CX + AX) / 2 + 4}" y="226" fill="#9AA4B8" font-size="11" text-anchor="middle">electron gun</text>
   <text x="${(CX + AX) / 2 + 4}" y="242" fill="#6f7a92" font-size="9" text-anchor="middle">dashed = beam path</text><text x="${(CX + AX) / 2 + 4}" y="253" fill="#6f7a92" font-size="9" text-anchor="middle">(invisible in a real tube)</text>
   <line x1="${CX + 9}" y1="${CY}" x2="${SX}" y2="${CY}" stroke="#7CFFB2" stroke-width="2" stroke-dasharray="3 4" opacity=".45"/>
   <g id="gunE">${[0, 1, 2, 3, 4].map(() => '<circle r="3.2" fill="#8DB8EA"/>').join('')}</g>
   <rect x="${SX}" y="${CY - 3 * PXC}" width="${10 * PXC}" height="${6 * PXC}" fill="#13324a" opacity=".55"/>
   <g id="grid"></g>
   <rect id="pt" x="${SX}" y="${CY - 3 * PXC - 12}" width="${10 * PXC}" height="7" fill="#c9d3e8"/><rect x="${SX}" y="${CY + 3 * PXC + 5}" width="${10 * PXC}" height="7" fill="#c9d3e8"/>
   <text id="ptop" x="${SX + 10 * PXC + 6}" y="${CY - 3 * PXC - 4}" font-size="12" font-weight="800"></text><text id="pbot" x="${SX + 10 * PXC + 6}" y="${CY + 3 * PXC + 13}" fill="#9AA4B8" font-size="11">0 V</text>
   <text x="${SX + 5 * PXC}" y="${CY - 3 * PXC - 18}" fill="#9AA4B8" font-size="11" text-anchor="middle">deflecting plates · gridded fluorescent screen</text>
   <path id="trace" fill="none" stroke="#7CFFB2" stroke-width="3" filter="url(#glA)"/>
   <line x1="${SX + XR * PXC}" y1="${CY - 3 * PXC}" x2="${SX + XR * PXC}" y2="${CY + 3 * PXC}" stroke="#22D3EE" stroke-width="1.5" stroke-dasharray="4 3" opacity=".8"/>
   <text x="${SX + XR * PXC + 5}" y="${CY - 3 * PXC + 13}" fill="#22D3EE" font-size="11">read here</text>
   <g id="eFV"><line id="aV" stroke="#45C58C" stroke-width="3" marker-end="url(#arG)"/><line id="aF" stroke="#F2BD45" stroke-width="3" marker-end="url(#arY)"/>
     <circle id="eD" r="6" fill="#8DB8EA" stroke="#fff" stroke-width="1.5"/><text id="tV" fill="#45C58C" font-size="12" font-weight="800">v</text><text id="tF" fill="#F2BD45" font-size="12" font-weight="800">F = qE</text></g>
   <g id="mk" style="cursor:ns-resize"><line x1="${SX + XR * PXC - 16}" x2="${SX + XR * PXC + 16}" stroke="#22D3EE" stroke-width="3"/><polygon points="${SX + XR * PXC + 18},0 ${SX + XR * PXC + 30},-7 ${SX + XR * PXC + 30},7" fill="#22D3EE"/><rect x="${SX + XR * PXC - 30}" y="-14" width="70" height="28" fill="transparent"/></g>
   <text id="msgA" x="320" y="312" fill="#9AA4B8" font-size="12" text-anchor="middle"></text>
  </svg>
  <div class="ctrl" id="cA"><label>Gun voltage V (sets the speed) <output id="oV"></output></label><input type="range" id="sV" min="1" max="5" step="0.5" value="${kV}"></div>
  ${EXPL ? '<div class="ctrl" id="cP"><label>Plate voltage <output id="oP"></output></label><input type="range" id="sP" min="250" max="1000" step="50" value="750"></div>' : ''}
  <div class="row" id="platesRow"><button class="btn" id="bD" ${EXP ? 'disabled' : ''}>Deflecting plates: OFF</button><button class="btn primary" id="recA" disabled ${EXPL ? 'style="display:none"' : ''}>📏 Record</button><div class="inst" id="inst"><div>voltmeter: <b id="iV"></b> kV</div><div>y = <b id="iY">–</b> cm</div></div></div>`;
  const q = x => host.querySelector(x), svg = q('svg');
  let gr = ''; for (let c = 0; c <= 10; c++) { const x = SX + c * PXC; gr += `<line x1="${x}" y1="${CY - 3 * PXC}" x2="${x}" y2="${CY + 3 * PXC}" stroke="#4d7f9c" stroke-width="${c % 5 ? .6 : 1.1}" opacity=".7"/><text x="${x}" y="${CY + 3 * PXC + 24}" fill="#9AA4B8" font-size="10" text-anchor="middle">${c}</text>`; }
  for (let c = -3; c <= 3; c++) { const y = CY - c * PXC; gr += `<line x1="${SX}" y1="${y}" x2="${SX + 10 * PXC}" y2="${y}" stroke="#4d7f9c" stroke-width="${c ? .6 : 1.1}" opacity=".7"/><text x="${SX - 5}" y="${y + 4}" fill="#9AA4B8" font-size="10" text-anchor="end">${c > 0 ? '+' : ''}${c}</text>`;
    if (c < 3) for (let m = 1; m < 10; m++) { const yy = y - m * PXC / 10; gr += `<line x1="${SX + XR * PXC - 4}" y1="${yy}" x2="${SX + XR * PXC + 4}" y2="${yy}" stroke="#22D3EE" stroke-width=".6" opacity=".6"/>`; } }
  q('#grid').innerHTML = gr + `<text x="${SX + 5 * PXC}" y="${CY + 3 * PXC + 38}" fill="#9AA4B8" font-size="10" text-anchor="middle">distance into the plates / cm</text>`;
  const o = { ctrlEl: q('#cA'), runEl: q('#recA'), instEl: q('#inst'), platesEl: q('#bD') };
  const K = () => plates ? (VP / DP) / (4 * Vr * 1000) / 100 : 0;          // y(cm) = K x(cm)²
  const xEnd = () => { const k = K(); return k ? Math.min(10, Math.sqrt(2.95 / k)) : 10; };
  const draw = () => {
    const k = K(), xe = xEnd(); let pts = []; for (let i = 0; i <= 60; i++) { const x = xe * i / 60; pts.push(`${(SX + x * PXC).toFixed(1)} ${(CY - k * x * x * PXC).toFixed(1)}`); }
    q('#trace').setAttribute('d', 'M' + pts.join(' L'));
    q('#mk').setAttribute('transform', `translate(0,${CY - mark * PXC})`);
    q('#oV').textContent = fx(Vr, 3) + ' kV'; q('#iV').textContent = fx(Vr, 3); q('#iY').textContent = fx(mark, 1);
    q('#ptop').textContent = plates ? `+ ${VP} V` : '0 V'; q('#ptop').setAttribute('fill', plates ? '#45C58C' : '#9AA4B8'); q('#pt').setAttribute('fill', plates ? '#9fe3c0' : '#c9d3e8');
    q('#bD').textContent = EXP ? 'Plates: ON at 750 V (control)' : 'Deflecting plates: ' + (plates ? 'ON' : 'OFF'); if (q('#oP')) q('#oP').textContent = VP + ' V'; q('#bD').classList.toggle('primary', plates);
    q('#recA').disabled = !(unlocked && plates);
    q('#msgA').textContent = !plates ? 'With the plates off there is no force, so the beam goes straight.' : EXPL ? 'Change the voltages and watch how far the beam bends.' : !unlocked ? 'The plates push the beam towards +, with the same force all the way.' : 'Line up the marker with the trace at 8 cm, then Record.';
    o.onObserve && o.onObserve({ plates });
  };
  // live electron riding the trace, with velocity (green) and force (yellow) arrows
  let t0 = performance.now();
  const ride = now => { if (!document.body.contains(svg)) return;
    const per = 2600 * Math.sqrt(2 / kV), f = ((now - t0) % per) / per, xe = xEnd(), x = f * xe, k = K(), y = k * x * x, sx = SX + x * PXC, sy = CY - y * PXC, slope = 2 * k * x;
    q('#eD').setAttribute('cx', sx); q('#eD').setAttribute('cy', sy);
    const L = 30 * Math.sqrt(kV / 2); q('#aV').setAttribute('x1', sx); q('#aV').setAttribute('y1', sy); q('#aV').setAttribute('x2', sx + L); q('#aV').setAttribute('y2', sy - L * slope);
    q('#tV').setAttribute('x', sx + L + 4); q('#tV').setAttribute('y', sy - L * slope + 14);
    q('#aF').setAttribute('opacity', plates ? 1 : 0); q('#tF').setAttribute('opacity', plates ? 1 : 0);
    q('#aF').setAttribute('x1', sx); q('#aF').setAttribute('y1', sy - 7); q('#aF').setAttribute('x2', sx); q('#aF').setAttribute('y2', sy - 34);
    q('#tF').setAttribute('x', sx + 8); q('#tF').setAttribute('y', sy - 26);
    // electrons accelerating across the gun gap (x ∝ t²), then coasting to the screen at constant speed
    const gx0 = CX + 9, gw = AX - gx0, D = SX - AX - 8, a = 2 * gw / (2 * gw + D), per2 = 1500 * Math.sqrt(2 / kV);
    q('#gunE').querySelectorAll('circle').forEach((c, i) => { const u = ((now / per2) + i / 5) % 1; const x = u < a ? gx0 + gw * (u / a) ** 2 : AX + 8 + D * (u - a) / (1 - a); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', CY); });
    requestAnimationFrame(ride); };
  requestAnimationFrame(ride);
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  q('#bD').onclick = () => { if (EXP) return; plates = !plates; changed(); };
  if (q('#sP')) q('#sP').oninput = () => { VP = +q('#sP').value; changed(); };
  q('#sV').oninput = () => { kV = +q('#sV').value; Vr = realV(kV * 1000) / 1000; changed(); };
  const mk = q('#mk'); let drag = false;
  const toCm = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const z = p.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(-3, Math.min(3, (CY - z.y) / PXC)); };
  mk.addEventListener('pointerdown', e => { drag = true; mk.setPointerCapture(e.pointerId); });
  mk.addEventListener('pointermove', e => { if (!drag) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  mk.addEventListener('pointerup', () => drag = false);
  svg.addEventListener('click', e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const z = p.matrixTransform(svg.getScreenCTM().inverse()); if (Math.abs(z.x - (SX + XR * PXC)) < 40 && !e.target.closest('#mk')) { mark = Math.round(toCm(e) * 10) / 10; changed(); } });
  q('#recA').onclick = () => { const yt = K() * XR * XR;
    if (Math.abs(mark - yt) > 0.15) { toast('Not lined up yet: put the marker exactly on the glowing trace at the 8 cm line.'); return; }
    o.onRun && o.onRun({ kV: Vr, y: mark, yTrue: +yt.toFixed(3) }); };
  o.getState = () => ({ kV, Vr, plates, mark });
  o.setState = s => { if (s.kV != null) { kV = Math.round(s.kV * 2) / 2; q('#sV').value = kV; Vr = s.Vr != null ? s.Vr : s.kV; } if (s.plates != null && !EXP) plates = s.plates; if (s.mark != null) mark = s.mark; draw(); };
  o.unlock = () => { if (!unlocked) { unlocked = true; draw(); } };
  o.playRow = row => { o.setState({ kV: row.raw.kV, plates: true, mark: row.raw.y }); q('#trace').animate([{ opacity: .3 }, { opacity: 1 }], { duration: 600 }); };
  draw(); return o;
}

/* ===== SIM B: fine-beam tube (also the final Thomson tube) ===== */
function simB(host, cfg = {}) {
  const PX = 21, cx = 260, cy = 222, Rb = 8.6 * PX, gx = cx, gy = cy + Rb - 14, EXP = cfg.mode === 'exp', EXPL = cfg.mode === 'explore';
  if (EXP) cfg.lockV = 250;
  let V = cfg.fixedV || cfg.lockV || 200, Vr = cfg.fixedV || cfg.lockV || realV(200), I = cfg.fixedI || 1.5, mark = 6, gun = false, coils = false;
  host.innerHTML = `<svg class="sim" viewBox="0 0 520 470">
   <defs><radialGradient id="bgB" cx=".5" cy=".42"><stop offset="0" stop-color="#161c2c"/><stop offset="1" stop-color="#06080e"/></radialGradient>
   <radialGradient id="bulb" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#2b2244"/><stop offset=".72" stop-color="#140f25"/><stop offset="1" stop-color="#0b0915"/></radialGradient>
   <radialGradient id="glassB" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
   <linearGradient id="copB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d39a60"/><stop offset=".45" stop-color="#8c5a2c"/><stop offset=".75" stop-color="#c58a4f"/><stop offset="1" stop-color="#7a4d24"/></linearGradient>
   <linearGradient id="metB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd6e4"/><stop offset=".5" stop-color="#8a93a8"/><stop offset="1" stop-color="#5d6578"/></linearGradient>
   <filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <filter id="glS"><feGaussianBlur stdDeviation="2"/></filter></defs>
   <rect width="520" height="470" fill="url(#bgB)"/>
   <rect x="140" y="446" width="240" height="18" rx="6" fill="#1c202a" stroke="#2c3240"/><rect x="226" y="410" width="68" height="40" rx="8" fill="#262b37" stroke="#343b4b"/>
   <circle cx="${cx + 9}" cy="${cy - 7}" r="${Rb + 34}" fill="none" stroke="#4a3018" stroke-width="20"/><circle cx="${cx + 9}" cy="${cy - 7}" r="${Rb + 34}" fill="none" stroke="#2a1a0b" stroke-width="20" stroke-dasharray="1 2.4" opacity=".5"/>
   <path d="M${cx - 18} ${cy + Rb - 2} L${cx - 22} 414 L${cx + 22} 414 L${cx + 18} ${cy + Rb - 2}" fill="#2b2440" stroke="#8f86b8" stroke-opacity=".45"/>
   <circle cx="${cx}" cy="${cy}" r="${Rb}" fill="url(#bulb)" stroke="#a49cd0" stroke-opacity=".45" stroke-width="2"/>
   <g id="ruler"></g>
   <path id="beam" fill="none" stroke="#a78bfa" stroke-width="5" filter="url(#gl)" opacity=".75"/>
   <path id="beamC" fill="none" stroke="#efe7ff" stroke-width="1.4" opacity=".9"/>
   <rect x="${gx - 50}" y="${gy - 9}" width="38" height="18" rx="3" fill="url(#metB)" stroke="#3b4150"/><rect x="${gx - 12}" y="${gy - 11}" width="6" height="22" rx="1.5" fill="url(#metB)" stroke="#3b4150"/>
   <circle id="cath" cx="${gx - 44}" cy="${gy}" r="4" fill="#5b6478"/>
   <ellipse cx="${cx - 70}" cy="${cy - 82}" rx="72" ry="40" fill="url(#glassB)" transform="rotate(-28 ${cx - 70} ${cy - 82})"/>
   <circle cx="${cx}" cy="${cy}" r="${Rb + 34}" fill="none" stroke="#1d130a" stroke-width="24"/>
   <circle cx="${cx}" cy="${cy}" r="${Rb + 34}" fill="none" stroke="url(#copB)" stroke-width="18"/>
   <circle cx="${cx}" cy="${cy}" r="${Rb + 34}" fill="none" stroke="#3a2410" stroke-width="18" stroke-dasharray="1 2.2" opacity=".45"/>
   <circle id="coilI" cx="${cx}" cy="${cy}" r="${Rb + 34}" fill="none" stroke="#FDE68A" stroke-width="1.6" stroke-dasharray="6 14" opacity="0"/>
   <text x="508" y="20" fill="#F472B6" font-size="12" text-anchor="end">Helmholtz coils</text>
   <g id="mk" style="cursor:ns-resize"><line x1="${gx - 24}" x2="${gx + 24}" stroke="#22D3EE" stroke-width="3"/><polygon points="${gx + 26},0 ${gx + 38},-8 ${gx + 38},8" fill="#22D3EE"/><rect x="${gx - 44}" y="-16" width="100" height="32" fill="transparent"/></g>
   <text x="14" y="20" fill="#9AA4B8" font-size="12">B out of the screen ⊙</text>
   <defs><marker id="mBv" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#45C58C"/></marker><marker id="mBf" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#F2BD45"/></marker></defs>
   <g id="eB"><line id="bV" stroke="#45C58C" stroke-width="2.5" marker-end="url(#mBv)"/><line id="bF" stroke="#F2BD45" stroke-width="2.5" marker-end="url(#mBf)"/><circle id="bDot" r="5" fill="#cfe0ff" stroke="#fff" stroke-width="1.2"/><text id="tbV" fill="#45C58C" font-size="12" font-weight="800">v</text><text id="tbF" fill="#F2BD45" font-size="12" font-weight="800">F = qvB</text></g>
  </svg>
  ${cfg.fixedV ? '' : cfg.lockV ? `<div class="ctrl"><label>Electron gun voltage <output>${cfg.lockV} V (control)</output></label></div>
  <div class="ctrl" id="cI"><label>Coil current I <output id="oI"></output></label><input type="range" id="sI" min="1" max="3" step="0.05" value="${I}"></div>` : `<div class="ctrl"><label>Electron gun voltage <output id="oV2"></output></label><div class="seg" id="segV">${[150, 200, 250, 300].map(v => `<button data-v="${v}">${v} V</button>`).join('')}</div></div>
  <div class="ctrl" id="cI"><label>Coil current I <output id="oI"></output></label><input type="range" id="sI" min="1" max="3" step="0.05" value="${I}"></div>`}
  <div class="row" id="swB"><button class="btn" id="bGun">⚡ Electron gun: OFF</button><button class="btn" id="bCoil">🧲 Coils: OFF</button><button class="btn primary" id="rec" ${EXPL ? 'style="display:none"' : ''}>📏 Record</button></div>
  <div class="row"><div class="inst" id="inst"><div>V = <b id="iV"></b> V</div><div>I = <b id="iI"></b> A</div></div></div>
  <div class="tiny muted" id="rmsg" style="margin-top:4px">Drag the cyan marker to the top of the glowing ring.</div><div class="tiny muted">The ring glows because the tube holds a little hydrogen gas.</div>`;
  const svg = host.querySelector('svg'), beam = host.querySelector('#beam'), mk = host.querySelector('#mk');
  let rul = ''; for (let c = 0; c <= 16; c++) { const y = gy - c * PX; rul += `<line x1="${gx - (c % 5 === 0 ? 12 : 7)}" y1="${y}" x2="${gx}" y2="${y}" stroke="#e6dcff" stroke-width="${c % 5 === 0 ? 1.6 : 1}"/>${c % 2 === 0 ? `<text x="${gx - 16}" y="${y + 4}" fill="#e6dcff" font-size="11" text-anchor="end">${c}</text>` : ''}`;
    if (c < 16) for (let m = 1; m < 10; m++) { const yy = y - m * PX / 10; rul += `<line x1="${gx - 3}" y1="${yy}" x2="${gx}" y2="${yy}" stroke="#9a8fc0" stroke-width=".6"/>`; } }
  host.querySelector('#ruler').innerHTML = `<line x1="${gx}" y1="${gy}" x2="${gx}" y2="${gy - 16 * PX}" stroke="#e6dcff"/>` + rul + `<text x="${gx - 20}" y="${gy - 16 * PX - 8}" fill="#e6dcff" font-size="11">cm</text>`;
  const rOf = () => speed(Vr) / (QM * KCOIL * I);
  const o = { ctrlEl: host.querySelector('#cI') || host.querySelector('#mk'), runEl: host.querySelector('#rec'), instEl: host.querySelector('#inst'), swEl: host.querySelector('#swB') };
  const xEdge = cx + Math.sqrt(Rb * Rb - (gy - cy) ** 2) - 4;
  const draw = () => { const rp = rOf() * 100 * PX;
    const bpath = !gun ? '' : coils ? `M ${gx} ${gy} A ${rp} ${rp} 0 1 0 ${gx} ${gy - 2 * rp} A ${rp} ${rp} 0 1 0 ${gx} ${gy}` : `M ${gx} ${gy} L ${xEdge} ${gy}`;
    beam.setAttribute('d', bpath); host.querySelector('#beamC').setAttribute('d', bpath);
    host.querySelector('#cath').setAttribute('fill', gun ? '#FDBA4D' : '#5b6478');
    const ci = host.querySelector('#coilI'); ci.setAttribute('opacity', coils ? .9 : 0);
    host.querySelector('#bGun').textContent = '⚡ Electron gun: ' + (gun ? 'ON' : 'OFF'); host.querySelector('#bGun').classList.toggle('primary', gun);
    host.querySelector('#bCoil').textContent = '🧲 Coils: ' + (coils ? 'ON' : 'OFF'); host.querySelector('#bCoil').classList.toggle('primary', coils);
    host.querySelector('#rec').disabled = !(gun && coils);
    host.querySelector('#rmsg').textContent = !gun ? 'Switch on the electron gun.' : !coils ? 'No magnetic field: the beam goes straight. Switch on the coils.' : EXPL ? 'Try a different gun voltage or coil current and watch the circle change.' : 'Drag the cyan marker to the top of the glowing ring, then read the diameter on the scale.';
    host.querySelector('#iV').textContent = Vr; host.querySelector('#iI').textContent = fx(I, 2);
    if (host.querySelector('#oI')) host.querySelector('#oI').textContent = fx(I, 2) + ' A';
    if (host.querySelector('#oV2')) { host.querySelector('#oV2').textContent = 'about ' + V + ' V'; host.querySelectorAll('#segV button').forEach(b => b.classList.toggle('on', +b.dataset.v === V)); }
    mk.setAttribute('transform', `translate(0,${gy - mark * PX})`); };
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  host.querySelectorAll('#segV button').forEach(b => b.onclick = () => { V = +b.dataset.v; Vr = realV(V); changed(); });
  const sI = host.querySelector('#sI'); if (sI) sI.oninput = () => { I = +sI.value; changed(); };
  let drag = false; const toCm = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return Math.max(0, Math.min(16, (gy - q.y) / PX)); };
  mk.addEventListener('pointerdown', e => { drag = true; mk.setPointerCapture(e.pointerId); });
  mk.addEventListener('pointermove', e => { if (!drag) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  mk.addEventListener('pointerup', () => drag = false);
  svg.addEventListener('click', e => { if (e.target.closest('#mk')) return; mark = Math.round(toCm(e) * 10) / 10; changed(); });
  host.querySelector('#bGun').onclick = () => { gun = !gun; changed(); }; host.querySelector('#bCoil').onclick = () => { coils = !coils; changed(); };
  o.getState = () => ({ V, Vr, I, mark, gun, coils }); o.setState = s => { if (s.gun != null) gun = s.gun; if (s.coils != null) coils = s.coils; if (s.V && !cfg.lockV && !cfg.fixedV) { V = [150, 200, 250, 300].reduce((a, b) => Math.abs(b - s.V) < Math.abs(a - s.V) ? b : a); Vr = s.Vr || s.V; } if (s.I) { I = s.I; if (sI) sI.value = I; } if (s.mark != null) mark = s.mark; draw(); };
  host.querySelector('#rec').onclick = () => { const d = 2 * rOf() * 100, msg = host.querySelector('#rmsg');
    if (Math.abs(mark - d) > 0.2) { msg.innerHTML = '<b style="color:var(--bad)">Not lined up.</b> Put the marker exactly on the top of the ring.'; return; }
    msg.innerHTML = cfg.fixedV ? `You measured <b>d = ${fx(mark, 1)} cm</b>.` : `Recorded <b>d = ${fx(mark, 1)} cm</b>. Change the current for the next trial.`;
    o.onRun && o.onRun({ V: Vr, I, d: mark }); };
  o.playRow = row => { o.setState({ V: row.raw.V, Vr: row.raw.V, I: row.raw.I, mark: row.raw.d, gun: true, coils: true }); beam.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 700 }); };
  const t0B = performance.now();
  const rideB = now => { if (!document.body.contains(svg)) return;
    host.querySelector('#eB').style.display = gun ? '' : 'none';
    host.querySelector('#coilI').setAttribute('stroke-dashoffset', -((now / 25) % 40));
    if (gun && !coils) { const per = 1400 * Math.sqrt(200 / Vr), f = ((now - t0B) % per) / per, x = gx + (xEdge - gx) * f, y = gy;
      const set = (id, a) => { const e = host.querySelector(id); for (const k in a) e.setAttribute(k, a[k]); };
      set('#bDot', { cx: x, cy: y }); set('#bV', { x1: x, y1: y, x2: x + 34, y2: y }); set('#bF', { x1: x, y1: y, x2: x, y2: y }); set('#tbV', { x: x + 40, y: y + 4 }); set('#tbF', { x: -99, y: -99 }); }
    if (gun && coils) {
      const rp = rOf() * 100 * PX, cyc = gy - rp, per = 3600 * (1.5 / I), phi = 2 * Math.PI * (((now - t0B) % per) / per);
      const x = gx + rp * Math.sin(phi), y = cyc + rp * Math.cos(phi), vx = Math.cos(phi), vy = -Math.sin(phi), fxu = -Math.sin(phi), fyu = -Math.cos(phi);
      const set = (id, a) => { const e = host.querySelector(id); for (const k in a) e.setAttribute(k, a[k]); };
      set('#bDot', { cx: x, cy: y }); set('#bV', { x1: x, y1: y, x2: x + 26 * vx, y2: y + 26 * vy }); set('#bF', { x1: x, y1: y, x2: x + 24 * fxu, y2: y + 24 * fyu });
      set('#tbV', { x: x + 32 * vx - 4, y: y + 32 * vy + 4 }); set('#tbF', { x: x + 36 * fxu + (fxu < 0 ? -50 : 4), y: y + 36 * fyu + 4 }); }
    requestAnimationFrame(rideB); };
  requestAnimationFrame(rideB);
  draw(); return o;
}

/* ===== SIM C: crossed fields ===== */
function simC(host, cfg = {}) {
  const EXP = cfg.mode === 'exp', EXPL = cfg.mode === 'explore';
  let beam = 1, Vp = 0, I = 1.0, PTS = [], FEl = 0, FBl = 0; const d = 0.040, Lp = 0.08, D = 0.10;
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
   <path id="bp" fill="none" stroke="#7CFFB2" stroke-width="2" stroke-dasharray="4 4" opacity=".55"/><circle id="spot" r="7" fill="#b6ffd6" filter="url(#gl2)"/>
   <text x="470" y="274" fill="#6f7a92" font-size="9" text-anchor="middle">dashed = beam path (invisible in a real tube)</text>
   <defs><marker id="mCv" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#45C58C"/></marker><marker id="mCe" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#F2BD45"/></marker><marker id="mCb" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#F472B6"/></marker></defs>
   <g id="eC"><line id="cV" stroke="#45C58C" stroke-width="3" marker-end="url(#mCv)"/><line id="cE" stroke="#F2BD45" stroke-width="3" marker-end="url(#mCe)"/><line id="cB" stroke="#F472B6" stroke-width="3" marker-end="url(#mCb)"/>
     <circle id="cDot" r="6" fill="#8DB8EA" stroke="#fff" stroke-width="1.5"/><text id="tcE" fill="#F2BD45" font-size="12" font-weight="800">qE</text><text id="tcB" fill="#F472B6" font-size="12" font-weight="800">qvB</text></g>
   <text x="300" y="45" fill="#7CFFB2" font-size="15" text-anchor="middle" font-weight="700" id="stt"></text></svg>
  <div class="ctrl"><div class="seg" id="segB">${[1, 2, 3].map(b => `<button data-b="${b}">Beam ${b}</button>`).join('')}</div></div>
  <div class="ctrl" id="cE"><label>Plate voltage <output id="oE"></output></label><div class="row" style="flex-wrap:nowrap"><button class="btn" data-d="-1" style="padding:4px 10px">−</button><input type="range" id="sE" min="0" max="1000" step="1" value="0"><button class="btn" data-d="1" style="padding:4px 10px">+</button></div></div>
  ${EXP ? '<div class="ctrl"><label>Coil current <output>1.00 A (control)</output></label></div>' : ''}<div class="ctrl" id="cB" ${EXP ? 'style="display:none"' : ''}><label>Coil current <output id="oB"></output></label><div class="row" style="flex-wrap:nowrap"><button class="btn" data-d="-0.01" style="padding:4px 10px">−</button><input type="range" id="sB" min="0" max="3" step="0.01" value="1"><button class="btn" data-d="0.01" style="padding:4px 10px">+</button></div></div>
  <div class="row"><button class="btn primary" id="recC" disabled ${EXPL ? 'style="display:none"' : ''}>✅ Record</button><div class="inst" id="inst"><div>beam <b id="iBm">1</b></div><div>plate V = <b id="iVp">0</b> V</div><div>I = <b id="iI">1.00</b> A</div></div></div>`;
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
    PTS = pts; FEl = E > 0 ? 6 + 28 * E / Math.max(E, v * B) : 0; FBl = B > 0 ? 6 + 28 * v * B / Math.max(E, v * B, 1e-9) : 0;
    q('#oE').textContent = Vp + ' V'; q('#oB').textContent = fx(I, 2) + ' A';
    q('#iBm').textContent = beam; q('#iVp').textContent = Vp; q('#iI').textContent = fx(I, 2);
    host.querySelectorAll('#segB button').forEach(b => b.classList.toggle('on', +b.dataset.b === beam));
    const ok = ys != null && Math.abs(ys) < 0.2 && E > 0; q('#recC').disabled = !ok;
    q('#stt').textContent = hit ? 'The beam hits a plate' : ok ? 'Balanced, so the beam goes straight through' : (ys > 0 ? 'The spot is high, so the electric force is bigger' : 'The spot is low, so the magnetic force is bigger');
  };
  const changed = () => { draw(); o.onChange && o.onChange(o.getState()); };
  q('#sE').oninput = () => { Vp = +q('#sE').value; changed(); }; q('#sB').oninput = () => { I = +q('#sB').value; changed(); };
  host.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const dd = +b.dataset.d; if (Math.abs(dd) >= 1) { Vp = Math.max(0, Math.min(1000, Vp + dd)); q('#sE').value = Vp; } else { I = Math.max(0, Math.min(3, Math.round((I + dd) * 100) / 100)); q('#sB').value = I; } changed(); });
  host.querySelectorAll('#segB button').forEach(b => b.onclick = () => { beam = +b.dataset.b; changed(); });
  o.getState = () => ({ beam, Vp, I }); o.setState = s => { if (s.beam) beam = s.beam; if (s.Vp != null) { Vp = s.Vp; q('#sE').value = Vp; } if (s.I != null && !EXP) { I = s.I; q('#sB').value = I; } draw(); };
  q('#recC').onclick = () => { if (R && R.rows.some(r => r.raw.beam === beam)) { toast('Beam ' + beam + ' is already in the table. Try another beam.'); return; } o.onRun && o.onRun({ beam, Vp, I }); toast('Recorded beam ' + beam); };
  o.playRow = row => o.setState(row.raw);
  const svgC = q('svg'), t0C = performance.now();
  const rideC = now => { if (!document.body.contains(svgC)) return;
    if (PTS.length > 1) { const segs = []; let tot = 0; for (let i = 1; i < PTS.length; i++) { const l = Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]); segs.push(l); tot += l; }
      let s2 = (((now - t0C) % 2400) / 2400) * tot, i = 0; while (i < segs.length - 1 && s2 > segs[i]) { s2 -= segs[i]; i++; }
      const A = PTS[i], Bp = PTS[i + 1], f = segs[i] ? s2 / segs[i] : 0, x = A[0] + (Bp[0] - A[0]) * f, y = A[1] + (Bp[1] - A[1]) * f, ux = (Bp[0] - A[0]) / (segs[i] || 1), uy = (Bp[1] - A[1]) / (segs[i] || 1);
      const inF = x >= 200 && x <= 360, set = (id, a) => { const e = q(id); for (const k in a) e.setAttribute(k, a[k]); };
      set('#cDot', { cx: x, cy: y }); set('#cV', { x1: x, y1: y, x2: x + 30 * ux, y2: y + 30 * uy });
      set('#cE', { x1: x, y1: y - 7, x2: x, y2: y - 7 - FEl, opacity: inF && FEl ? 1 : 0 }); set('#tcE', { x: x + 6, y: y - 10 - FEl * .6, opacity: inF && FEl ? 1 : 0 });
      set('#cB', { x1: x, y1: y + 7, x2: x, y2: y + 7 + FBl, opacity: inF && FBl ? 1 : 0 }); set('#tcB', { x: x + 6, y: y + 14 + FBl * .6, opacity: inF && FBl ? 1 : 0 }); }
    requestAnimationFrame(rideC); };
  requestAnimationFrame(rideC);
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
    if (!c.querySelector('#gonext')) { const nb = nextBtn(c, () => { S.step = 4; save(); render(); }, 'Explain it'); nb.id = 'gonext'; }
  }
  if (!rows.length) T.innerHTML = '<div class="fb hint">Your table of record has no complete rows. Go back and finish it with your team.</div>';
  const back = document.createElement('button'); back.className = 'btn ghost small'; back.textContent = '← back to the experiment'; back.style.marginTop = '8px';
  back.onclick = () => { S.step = 2; save(); render(); }; c.appendChild(back);
}

function labProcessTasks(body) {
  const k = S.station, A = AN[k], rows = completeRows(); startPoll(null);
  const c = card(body, `<div class="row between"><div><span class="tag acc">Make sense of your team's data</span> <span class="tiny muted">on your own</span></div><span id="mk"></span></div>
    <div class="grid2" style="margin-top:8px"><div id="gr"></div><div><h3>What does the graph show?</h3><p id="gnote" class="muted">Look at the pattern first.</p><div class="formula">${A.formula}</div></div></div><div id="tasks"></div>`);
  if (rows.length < 3 || R.rows.filter(rowDone).length < 3) { c.querySelector('#tasks').innerHTML = `<div class="fb hint">Your team needs 3 processed readings first (${R.rows.filter(rowDone).length} so far). Pop back to the Experiment tab to help.</div>`; return; }
  const st = STN[k]; c.insertAdjacentHTML('afterbegin', '');
  const tb = document.createElement('div'); tb.style.cssText = 'overflow-x:auto;margin:8px 0 4px';
  tb.innerHTML = `<table class="rec"><tr><th>#</th>${st.cols.map(x => `<th>${x.label}</th>`).join('')}${st.proc.map(p => `<th class="pc">${p.h}<small>${p.u}</small></th>`).join('')}</tr>
    ${R.rows.map((r, i) => `<tr><td><b>${i + 1}</b></td>${st.cols.map(x => `<td class="rv">${fmtRaw(r.raw[x.k], x.dp)}</td>`).join('')}${st.proc.map(p => { const v = r.rec['p_' + p.k] && r.rec['p_' + p.k].v; return `<td class="rv" style="color:${procOK(r, p) ? 'var(--good)' : 'var(--muted)'}">${v ? esc(v) : '–'}</td>`; }).join('')}</tr>`).join('')}</table>`;
  c.querySelector('.grid2').before(tb);
  const g = A.graph(rows); c.querySelector('#gr').innerHTML = graph(g.pts, g).svg; c.querySelector('#gnote').textContent = g.note;
  const list = A.list(S.level, rows), host = c.querySelector('#tasks');
  const fin = () => { const got = list.filter(t => S.first[k + '·p·' + t.id]).length; if (S.mark == null) { S.mark = `${got}/${list.length}`; save(); }
    c.querySelector('#mk').innerHTML = `<span class="mark">${S.mark}</span> <span class="tiny muted">right first time</span>`;
    if (!c.querySelector('#gonext')) { const nb = nextBtn(c, () => { S.step = 4; save(); render(); }, 'Explain it'); nb.id = 'gonext'; } };
  const run = i => { if (i >= list.length) { fin(); return; } const t = list[i];
    numTask(host, { p: t.p, unit: t.unit, ph: t.ph, plain: !!t.plain, exp: t.exp, check: v => within(v, t.exp, t.tol), hint: t.hint, why: () => `${sci(t.exp, 3)} ${t.unit}` }, k + '·p·' + t.id, () => run(i + 1)); };
  run(0);
  const back = document.createElement('button'); back.className = 'btn ghost small'; back.textContent = '← back to the experiment'; back.style.marginTop = '8px';
  back.onclick = () => { S.step = 2; save(); render(); }; c.appendChild(back);
}

/* ----- Explain (POE explain + theory) ----- */
function labExplain(body) {
  const k = S.station, st = STN[k];
  const preds = Object.values(R.pred || {}); const cnt = st.pred.o.map((_, i) => preds.filter(p => p === i).length);
  const top = cnt.indexOf(Math.max(...cnt)); const right = 0;
  const c = card(body, `<span class="tag teal">Explain</span>
   <div class="fb ${top === right ? 'good' : 'hint'}" style="margin-top:8px">Your team predicted <b>${preds.length ? st.pred.o[top] : '–'}</b>, and the data shows <b>${st.pred.o[right]}</b>.</div><div id="cq"></div>`);
  mcq(c.querySelector('#cq'), st.concept, k + '·concept', () => {
    const t = card(body, `<span class="tag teal">Where does the equation come from?</span><ol class="steps" id="stp"></ol><div id="gapq"></div>`);
    const gapMode = S.level >= 2;
    const draw = filled => { t.querySelector('#stp').innerHTML = st.steps.map(s => { const hide = s.gap && gapMode && !filled; return `<li class="${hide ? 'gap' : ''}"><div class="eqbig">${hide ? '<b>?</b>' : s.m}</div><div class="why">${hide ? 'Which line goes here?' : s.w}</div></li>`; }).join(''); };
    draw(!gapMode);
    if (gapMode) { const g = st.steps.find(s => s.gap); mcq(t.querySelector('#gapq'), { p: 'Which line fills the gap?', o: g.opts, a: 0, hint: g.w, why: g.w }, k + '·theory', () => { draw(true); nextBtn(t, () => { S.step = 5; save(); render(); }, 'Finish the station'); }); }
    else nextBtn(t, () => { S.step = 5; save(); render(); }, 'Finish the station');
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
  c.insertAdjacentHTML('beforeend', `<p class="tiny muted">At the start you said: ${SC.map((x, i) => `SC${i + 1} <b>${S.scStart[i] == null ? '–' : RATE[S.scStart[i]]}</b>`).join(' · ')}</p><div class="row"><button class="btn ghost" id="back">← Back to my station</button><button class="btn primary" id="nx" ${S.scMid.every(x => x != null) ? '' : 'disabled'}>Share our discovery →</button></div>`);
  $('#back').onclick = () => { S.step = 2; go('lab'); };
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
    const data = rows.length ? (k === 'A' ? 'Deflections: ' + rows.slice(0, 3).map(r => fx(r.raw.y, 1) + ' cm at ' + fx(r.raw.kV, 3) + ' kV').join(', ') : k === 'B' ? 'Diameters: ' + rows.slice(0, 3).map(r => r.raw.d + ' cm').join(', ') : 'Speeds: ' + rows.slice(0, 3).map(r => sci(r.raw.Vp / 0.04 / (KCOIL * r.raw.I), 2)).join(', ') + ' m/s') : '';
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
  app().innerHTML = `<div class="stcard reveal"><div class="ph" style="background-image:url(img/finebeam.webp)"></div><div class="tx"><span class="pill">🔓 The Thomson tube</span><h2>Put the three pieces together.</h2><div><button class="btn ondark" id="fback">← Back to my station</button></div></div></div>
   <div class="card" style="margin-top:14px"><div class="disc">${disc}</div></div>
   <div class="card"><h3>Combine A and B: make the speed disappear</h3><ol class="steps" id="cmb"></ol><button class="btn" id="more">Show the next line ↓</button></div>
   <div class="grid2"><div class="card"><h3>Measure it</h3><div class="tiny muted">V = 250 V · coil current 1.50 A, so B = ${fx(KCOIL * 1.5 * 1e3, 2)} mT</div><div id="tube" style="margin-top:6px"></div></div>
   <div class="card" id="calc"><h3>Find q/m</h3><p class="muted">Line up the marker and tap Record first.</p></div></div>`;
  $('#fback').onclick = () => { S.step = 2; go('lab'); };
  const lines = [
    { m: M(mi('q') + mi('V') + mo('=') + frac(mn(1), mn(2)) + mi('m') + sq(mi('v')) + mo('⇒') + sq(mi('v')) + mo('=') + frac(mn(2) + mi('q') + mi('V'), mi('m'))), w: '⚡ Station A: the speed the gun gives.' },
    { m: M(mi('r') + mo('=') + frac(mi('m') + mi('v'), mi('q') + mi('B')) + mo('⇒') + mi('v') + mo('=') + frac(mi('q') + mi('B') + mi('r'), mi('m'))), w: '🧲 Station B: rearrange for v.' },
    { m: M(sq(mi('v')) + mo('=') + frac(sq(mi('q')) + sq(mi('B')) + sq(mi('r')), sq(mi('m')))), w: 'Square it.' },
    { m: M(frac(mn(2) + mi('q') + mi('V'), mi('m')) + mo('=') + frac(sq(mi('q')) + sq(mi('B')) + sq(mi('r')), sq(mi('m')))), w: 'Both equations describe the same electrons at the same speed, so set them equal.' },
    { m: EQ.qm, w: 'Multiply by m²/q and rearrange. The speed has dropped out of the equation.' },
    { m: EQ.qmT, w: '⚖️ Station C gives Thomson\'s own method: put v = E/B into v = qBr/m.' }];
  let shown = F.lines || 1; const paintL = () => { $('#cmb').innerHTML = lines.slice(0, shown).map(l => `<li class="reveal"><div class="eqbig">${l.m}</div><div class="why">${l.w}</div></li>`).join(''); $('#more').hidden = shown >= lines.length; };
  paintL(); $('#more').onclick = () => { shown++; F.lines = shown; save(false); paintL(); };
  const tube = simB($('#tube'), { fixedV: 250, fixedI: 1.5 });
  tube.onRun = raw => { F.dRead = raw.d; save(); calcStage(); };
  const FINTRO = [{ img: 'img/finebeam.webp', cap: 'Thomson\'s idea in one tube.', sub: 'An electron gun at 250 V inside a glass bulb, between two coils.' },
    { anim: 'fbStraight', cap: 'Switch on the electron gun.', sub: 'With the coils off, the beam shoots straight across the bulb.' },
    { anim: 'fbCircle', cap: 'Switch on the coils (1.50 A).', sub: 'The magnetic force always points to the centre, so the beam curls into a circle.' },
    { img: 'img/coil.webp', cap: 'Measure the diameter of the circle.', sub: 'Then use your three discoveries to find q/m.' }];
  const tcard = $('#tube').closest('.card'); tcard.insertAdjacentHTML('beforeend', '<button class="linkbtn" id="tintro" style="margin-top:8px">▶ Watch the intro again</button>');
  const fintro = done => { tcard.style.position = 'relative'; tcard.style.minHeight = '440px'; tcard.style.overflow = 'hidden'; playScene(tcard, FINTRO, () => { S.seen.fscene = 1; save(false); done && done(); }); };
  $('#tintro').onclick = () => fintro();
  const fcoach = () => coach([{ el: '#tube #swB', t: 'Switch on the <b>electron gun</b>, then the <b>coils</b>. Watch the arrows.', n: 1, of: 2, until: () => { const g = tube.getState(); return g.gun && g.coils; } },
    { el: '#tube #mk', vdrag: true, t: 'Drag the marker to the top of the ring, then tap <b>Record</b>.', n: 2, of: 2, until: () => !!S.final.dRead }], 'final');
  if (!S.seen.fscene) fintro(fcoach); else fcoach();
  if (F.dRead) calcStage();
  function calcStage() {
    const r = F.dRead / 200, B = KCOIL * 1.5, V = 250, qmT = 2 * V / (B * B * r * r), c = $('#calc');
    c.innerHTML = `<h3>Find q/m</h3><p>d = <b>${fx(F.dRead, 1)} cm</b> → r = <b>${fx(r, 4)} m</b> · B = ${sci(B, 3)} T · V = 250 V</p><div class="eqbig">${EQ.qm}</div>`;
    const finish = v => { F.qm = v; save(); nextBtn(c, () => go('millikan'), 'Who found the charge?'); };
    if (S.level === 1) {
      numTask(c, { p: 'Step 1: B²', unit: 'T²', exp: B * B, check: v => within(v, B * B, 0.03), hint: `${sci(B, 3)} × ${sci(B, 3)}` }, 'F·B2', () =>
        numTask(c, { p: 'Step 2: r²', unit: 'm²', exp: r * r, check: v => within(v, r * r, 0.03), hint: `${fx(r, 4)} × ${fx(r, 4)}` }, 'F·r2', () =>
          numTask(c, { p: 'Step 3: 2V ÷ (B² × r²)', unit: 'C kg⁻¹', exp: qmT, check: v => within(v, qmT, 0.04), hint: '2 × 250 = 500, then divide.', why: v => `q/m = ${sci(qmT, 3)} C kg⁻¹` }, 'F·qm', finish)));
    } else numTask(c, { p: `Calculate ${EQ.qmFrac}.`, unit: 'C kg⁻¹', exp: qmT, check: v => within(v, qmT, 0.04), hint: 'B in tesla, r in metres.', hint2: `500 ÷ (${sci(B * B, 3)} × ${sci(r * r, 3)})`, why: v => `q/m = ${sci(qmT, 3)} C kg⁻¹. Accepted value: 1.76 × 10¹¹ C kg⁻¹.` }, 'F·qm', finish);
  }
}

/* ---------- Millikan + the mass ---------- */
/* ===== Millikan chamber: drops seen through a microscope; hold one still with the plate voltage ===== */
const MDROPS = [{ n: 1, m: 4.89e-16 }, { n: 3, m: 1.96e-15 }, { n: 2, m: 1.47e-15 }];
const MD = 0.010, MG = 9.81;
function simM(host) {
  let drop = 0, on = false, V = 0, y = 0, last = performance.now();   // y: cm-ish screen units, 0 = centre
  host.innerHTML = `<svg class="sim" viewBox="0 0 640 330">
   <defs><radialGradient id="eye" cx=".5" cy=".5"><stop offset=".85" stop-color="#0b1220"/><stop offset="1" stop-color="#000"/></radialGradient>
   <radialGradient id="dg" cx=".35" cy=".35"><stop offset="0" stop-color="#fff7cc"/><stop offset="1" stop-color="#E6A413"/></radialGradient>
   <clipPath id="eyec"><circle cx="420" cy="165" r="140"/></clipPath>
   <marker id="mq" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#45C58C"/></marker><marker id="mw" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#F472B6"/></marker></defs>
   <rect x="20" y="40" width="190" height="250" rx="16" fill="#141c30" stroke="#3a4a70"/>
   <text x="115" y="30" fill="#9AA4B8" font-size="11" text-anchor="middle">the chamber</text>
   <rect id="pTop" x="40" y="90" width="150" height="9" fill="#c9d3e8"/><rect id="pBot" x="40" y="231" width="150" height="9" fill="#c9d3e8"/>
   <text id="lTop" x="196" y="99" font-size="14" font-weight="800"></text><text id="lBot" x="196" y="240" font-size="14" font-weight="800"></text>
   <text x="115" y="262" fill="#9AA4B8" font-size="10" text-anchor="middle">plates 1.0 cm apart</text>
   <path d="M60 60 q20 -14 40 0" stroke="#9AA4B8" fill="none"/><text x="104" y="62" fill="#9AA4B8" font-size="10">oil spray</text>
   <circle id="mini" cx="115" cy="165" r="3" fill="#FDE68A"/>
   <line x1="190" y1="165" x2="280" y2="165" stroke="#3a4a70" stroke-dasharray="3 3"/><text x="236" y="158" fill="#6f7a92" font-size="10" text-anchor="middle">microscope</text>
   <circle cx="420" cy="165" r="140" fill="url(#eye)" stroke="#3a4a70" stroke-width="3"/>
   <g clip-path="url(#eyec)">${Array.from({ length: 11 }, (_, k) => `<line x1="300" y1="${45 + k * 24}" x2="540" y2="${45 + k * 24}" stroke="#2a3a5a" stroke-width="${k === 5 ? 1.4 : .7}"/>`).join('')}
     <line x1="420" y1="25" x2="420" y2="305" stroke="#2a3a5a"/>
     <circle id="dr" cx="420" cy="165" r="10" fill="url(#dg)"/>
     <line id="aq" stroke="#45C58C" stroke-width="3" marker-end="url(#mq)"/><line id="aw" stroke="#F472B6" stroke-width="3" marker-end="url(#mw)"/>
     <text id="tq" fill="#45C58C" font-size="12" font-weight="800">qE</text><text id="tw" fill="#F472B6" font-size="12" font-weight="800">mg</text></g>
   <text id="mmsg" x="420" y="322" fill="#9AA4B8" font-size="12" text-anchor="middle"></text>
  </svg>
  <div class="ctrl"><div class="seg" id="segD">${MDROPS.map((d, k) => `<button data-k="${k}">Drop ${k + 1}</button>`).join('')}</div><div class="tiny muted" id="mass" style="margin-top:4px"></div></div>
  <div class="ctrl" id="cMV"><label>Plate voltage V <output id="oMV"></output></label><div class="row" style="flex-wrap:nowrap"><button class="btn" data-dv="-1" style="padding:4px 10px">−</button><input type="range" id="sMV" min="0" max="800" step="1" value="0"><button class="btn" data-dv="1" style="padding:4px 10px">+</button></div></div>
  <div class="row" id="swM"><button class="btn" id="bPl">Plates: OFF</button><button class="btn primary" id="recM" disabled>📏 Record this drop</button><div class="inst"><div>V = <b id="iMV">0</b> V</div></div></div>`;
  const q = x => host.querySelector(x), o = { swEl: q('#swM'), ctrlEl: q('#cMV'), runEl: q('#recM') };
  const Vb = () => MDROPS[drop].m * MG * MD / (MDROPS[drop].n * QE);
  const net = () => { const d = MDROPS[drop], W = d.m * MG, F = on ? d.n * QE * V / MD : 0; return { W, F, r: (F - W) / W }; };
  const draw = () => { const { W, F } = net(), held = on && Math.abs(V - Vb()) <= 2;
    q('#lTop').textContent = on ? '+' : '0 V'; q('#lTop').setAttribute('fill', on ? '#45C58C' : '#9AA4B8'); q('#lBot').textContent = on ? '−' : '0 V'; q('#lBot').setAttribute('fill', on ? '#F07A71' : '#9AA4B8');
    q('#pTop').setAttribute('fill', on ? '#9fe3c0' : '#c9d3e8'); q('#pBot').setAttribute('fill', on ? '#f2b0aa' : '#c9d3e8');
    q('#bPl').textContent = 'Plates: ' + (on ? 'ON' : 'OFF'); q('#bPl').classList.toggle('primary', on);
    q('#oMV').textContent = V + ' V'; q('#iMV').textContent = V; q('#recM').disabled = !held;
    q('#mass').innerHTML = `Mass of drop ${drop + 1} (from how fast it falls): <b>${sci(MDROPS[drop].m, 3)} kg</b>`;
    host.querySelectorAll('#segD button').forEach(b => b.classList.toggle('on', +b.dataset.k === drop));
    q('#mmsg').textContent = !on ? 'Plates off: the drop falls.' : held ? 'Held still: the electric force balances the weight.' : (F > W ? 'Rising: qE is bigger than mg. Lower the voltage.' : 'Falling: mg is bigger than qE. Raise the voltage.'); };
  const loop = now => { if (!document.body.contains(host)) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
    const { W, F, r } = net(), held = on && Math.abs(V - Vb()) <= 2;
    y += (held ? 0 : Math.max(-1.5, Math.min(1.5, r))) * 60 * dt;            // px/s, up is positive
    if (y > 125 || y < -125) { y = 0; }
    const cy = 165 - y; q('#dr').setAttribute('cy', cy); q('#mini').setAttribute('cy', 165 - y * 0.5);
    const Lw = 30, Lq = on ? Math.min(60, 30 * F / W) : 0;
    q('#aw').setAttribute('x1', 420); q('#aw').setAttribute('y1', cy + 12); q('#aw').setAttribute('x2', 420); q('#aw').setAttribute('y2', cy + 12 + Lw); q('#tw').setAttribute('x', 428); q('#tw').setAttribute('y', cy + 34);
    q('#aq').setAttribute('opacity', Lq ? 1 : 0); q('#tq').setAttribute('opacity', Lq ? 1 : 0);
    q('#aq').setAttribute('x1', 420); q('#aq').setAttribute('y1', cy - 12); q('#aq').setAttribute('x2', 420); q('#aq').setAttribute('y2', cy - 12 - Lq); q('#tq').setAttribute('x', 428); q('#tq').setAttribute('y', cy - 20);
    requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  q('#bPl').onclick = () => { on = !on; draw(); };
  q('#sMV').oninput = () => { V = +q('#sMV').value; draw(); };
  host.querySelectorAll('[data-dv]').forEach(b => b.onclick = () => { V = Math.max(0, Math.min(800, V + +b.dataset.dv)); q('#sMV').value = V; draw(); });
  host.querySelectorAll('#segD button').forEach(b => b.onclick = () => { drop = +b.dataset.k; y = 0; draw(); });
  q('#recM').onclick = () => o.onRecord && o.onRecord({ drop, m: MDROPS[drop].m, V });
  draw(); return o;
}
function rMillikan() {
  const qm = S.final.qm || QM; S.final.drops = S.final.drops || {};
  app().innerHTML = `<div class="card"><span class="tag gold">1909 · twelve years later</span><h2 style="margin:6px 0">Millikan's oil drops</h2>
    <p>Thomson knew <b>q/m</b> but not q or m on their own. Millikan found the charge by holding tiny charged oil drops still between two plates.</p></div>
    <div class="card" id="mcard"><div id="msim"></div><button class="linkbtn" id="mintro" style="margin-top:8px">▶ Watch the intro again</button></div>
    <div class="card" id="mres"></div><div id="m1"></div><div id="m2"></div>`;
  const MINTRO = [{ img: 'img/drop.webp', cap: 'Millikan sprayed a fine mist of oil.', sub: 'Some drops picked up a few extra electrons as they were sprayed.' },
    { anim: 'mFall', cap: 'Plates off: the drops fall.', sub: 'Each drop is pulled down by its weight, mg.' },
    { anim: 'mHold', cap: 'Plates on: a drop can hover.', sub: 'When the electric force qE equals the weight mg, the drop stays still.' },
    { img: 'img/microscope.webp', cap: 'He watched the drops through a microscope.', sub: 'Your task: hold a drop still, and the voltage tells you its charge.' }];
  const sim = simM($('#msim')), mc = $('#mcard');
  const intro = done => { mc.style.position = 'relative'; mc.style.minHeight = '420px'; mc.style.overflow = 'hidden'; playScene(mc, MINTRO, () => { S.seen.mscene = 1; save(false); done && done(); }); };
  $('#mintro').onclick = () => intro();
  const paint = () => { const ks = Object.keys(S.final.drops);
    $('#mres').innerHTML = `<h3>Your drops</h3><div class="tiny muted">q = mgd ÷ V, with d = 0.010 m and g = 9.81 N kg⁻¹</div>
      ${ks.length ? `<div style="overflow-x:auto"><table class="rec"><tr><th>drop</th><th>m / kg</th><th>V / V</th><th class="pc">q / C</th><th class="pc">q ÷ e</th></tr>${ks.map(k => { const d = S.final.drops[k], qq = d.m * MG * MD / d.V; return `<tr><td class="rv">${+k + 1}</td><td class="rv">${sci(d.m, 3)}</td><td class="rv">${d.V}</td><td class="rv">${sci(qq, 3)}</td><td class="rv"><b>${fx(qq / QE, 2)}</b></td></tr>`; }).join('')}</table></div>` : '<p class="muted small">No drops recorded yet. Switch the plates on and find the voltage that holds a drop still.</p>'}
      ${ks.length >= 2 ? '<div class="fb good">Look at q ÷ e: every charge is a whole number of e = 1.60 × 10⁻¹⁹ C.</div>' : ''}`;
    if (ks.length >= 2 && !$('#m1').dataset.on) { $('#m1').dataset.on = 1; ask(); } };
  sim.onRecord = d => { S.final.drops[d.drop] = { m: d.m, V: d.V }; save(); paint(); toast('Recorded drop ' + (d.drop + 1)); };
  const mc2 = () => coach([{ el: sim.swEl, t: 'Switch the <b>plates</b> on, then change the voltage until the drop <b>stops moving</b>.', n: 1, of: 2, until: () => Object.keys(S.final.drops).length > 0 },
    { el: '#mres', t: 'Hold <b>two different drops</b> still. What do you notice about q ÷ e?', n: 2, of: 2 }], 'mcoach');
  if (!S.seen.mscene) intro(mc2); else mc2();
  function ask() {
    const c1 = card($('#m1'), '');
    mcq(c1, { p: 'Millikan knew the mass of each oil drop. Did that give him the electron\'s mass?', o: ['No. That is the mass of the oil drop, which let him find the charge e.', 'Yes, the drop\'s mass is the electron\'s mass', 'Yes, he weighed a single electron'], a: 0, hint: 'Whose mass did he measure, the drop\'s or the electron\'s?', why: 'The weight of the drop balanced the electric force, which gave the charge. The electron\'s mass comes from combining e with q/m.' }, 'F·millikan', () => {
      const c = card($('#m2'), `<h3>Find the electron</h3><div class="eqbig">${EQ.me}</div><p class="muted small">Your q/m: <b>${sci(qm, 3)} C kg⁻¹</b></p>`);
      numTask(c, { p: 'Mass of the electron:', unit: 'kg', exp: QE / qm, check: v => within(v, QE / qm, 0.04), hint: '1.60 × 10⁻¹⁹ ÷ your q/m', why: v => `m ≈ ${sci(QE / qm, 3)} kg` }, 'F·me', v => {
        S.final.m = v; save();
        c.insertAdjacentHTML('beforeend', `<div class="card mission reveal" style="margin-top:12px"><div class="row" style="gap:18px;flex-wrap:nowrap">
          <svg viewBox="0 0 160 160" style="width:140px;flex:none"><circle cx="80" cy="80" r="60" fill="#E6A413" opacity=".9"><animate attributeName="opacity" values=".9;.25" dur="2.5s" fill="freeze"/></circle>
          <circle cx="80" cy="80" r="60" fill="none" stroke="#A5B4FC" stroke-width="2" stroke-dasharray="6 6"/>${[[50, 60], [105, 70], [75, 110], [95, 45], [60, 95]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#8DB8EA" opacity="0"><animate attributeName="opacity" values="0;1" begin="${1 + i * .2}s" dur=".4s" fill="freeze"/></circle>`).join('')}</svg>
          <div><h2>You found the electron.</h2><div class="eqbig" style="color:#fff;text-align:left">m<sub>e</sub> = 9.11 × 10⁻³¹ kg</div>
          <p>That is about 1/1840 of the mass of a hydrogen atom, and the electron is found in every atom. So atoms have smaller parts inside, and Dalton's idea of solid, indivisible atoms no longer works.</p></div></div></div>`);
        nextBtn(c, () => go('reflect'), 'Reflect');
      });
    });
  }
  paint();
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
    const a = prompt('Type: preview (see every part), unlock, A / B / C (move this student), dash (teacher page), or reset (clear this device)'); if (!a) return; const x = a.trim().toLowerCase();
    if (x === 'preview') { startPreview(); return; }
    if (x === 'unlock') { S.unlocked = true; save(); render(); }
    else if (['a', 'b', 'c'].includes(x)) { const K = x.toUpperCase(); S.station = K; S.step = 0; S.visited = {}; S.doneStation = false; S.mark = null; S.maxIdx = 2; S.seenPlates = 0;
      ['scene' + K, 'role' + K, 'roleA2', 'questA'].forEach(k => delete S.seen[k]); Object.keys(S.first).filter(k => k.startsWith(K)).forEach(k => delete S.first[k]);
      R = null; seenRows = new Set(); if (!S.level) S.level = 2; go('lab'); }
    else if (x === 'dash') location.href = 'teacher.html';
    else if (x === 'reset') { localStorage.removeItem(KEY); S = blank(); R = null; render(); } } };

if (new URLSearchParams(location.search).get('preview') === TEACHER_CODE) startPreview(); else render();
setInterval(() => { if (S.name) postProgress(); }, 45000);
