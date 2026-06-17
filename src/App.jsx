import React, { useState, useMemo, useCallback } from 'react';

// ── Lucide icons as inline SVGs ──────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  Building2: () => <Icon d={["M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z","M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2","M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2","M10 6h4","M10 10h4","M10 14h4","M10 18h4"]} />,
  Database: () => <Icon d={["M12 2C6.5 2 2 4.7 2 8s4.5 6 10 6 10-2.7 10-6-4.5-6-10-6Z","M2 8v4c0 3.3 4.5 6 10 6s10-2.7 10-6V8","M2 12v4c0 3.3 4.5 6 10 6s10-2.7 10-6v-4"]} />,
  ChevronDown: () => <Icon d="m6 9 6 6 6-6" />,
  ChevronUp: () => <Icon d="m18 15-6-6-6 6" />,
  Printer: () => <Icon d={["M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2","M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6","M6 14h12v8H6z"]} />,
  RotateCcw: () => <Icon d={["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8","M3 3v5h5"]} />,
  Check: () => <Icon d="M20 6 9 17l-5-5" />,
  Plus: () => <Icon d={["M5 12h14","M12 5v14"]} />,
  Minus: () => <Icon d="M5 12h14" />,
  ArrowRight: () => <Icon d={["M5 12h14","m12 5 7 7-7 7"]} />,
  Calculator: () => <Icon d={["M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z","M8 6h8","M8 10h4","M8 14h2","M14 14h2","M8 18h2","M14 18h2"]} />,
  Gauge: () => <Icon d={["M12 2a10 10 0 1 0 0 20","M12 2a10 10 0 0 1 7.38 16.67","M12 12 8 8","M12 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0"]} />,
  Clock: () => <Icon d={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z","M12 6v6l4 2"]} />,
  Zap: () => <Icon d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  Shield: () => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  Layers: () => <Icon d={["M12 2 2 7l10 5 10-5-10-5Z","M2 17l10 5 10-5","M2 12l10 5 10-5"]} />,
};

// ── Data ─────────────────────────────────────────────────────────────────────
const DEFAULT_ASSUMPTIONS = {
  contingency: 0.20, targetMargin: 0.20, billRate: 180,
  integrationHrsPerInteg: 6, onsiteHrsPerDay: 8, onsiteRatePerDay: 1295,
  minFloor: 20, minFloorE2eVrms: 80,
  alloc: { kickOff: 0.03, trainingConfig: 0.35, digitalProcedures: 0.08, dataWork: 0.15, seWorkflow: 0.10, misc: 0.07, postLaunch: 0.07, projectMgmt: 0.15 },
  hrsPerItem: { kickOff: 1, trainingConfig: 1.5, digitalProcedures: 2, dataWork: 2, seWorkflow: 1.5, integrationSupport: 3, onsite: 8, postLaunch: 1, projectMgmt: 1, misc: 1 },
  uplifts: { e2eDataWork: 40, e2ePM: 10, e2eTraining: 6, vrmsDataWork: 40, vrmsSeWorkflow: 8, vrmsPM: 10, extendedMigration: 10, multiEntity: 8, customWorkflow: 8, compressedPM: 8, compressedMisc: 3 },
  weights: { e2e: 5, vrms: 5, limitedMigration: 1, extendedMigration: 4, integ1to2: 1, integ3plus: 4, multiEntity: 3, customWorkflow: 3, compressedTimeline: 4 },
  tierStandardMax: 2, tierComplexMax: 5,
};

const MIGRATION_SYSTEMS = {
  cloud: [
    { value: 'qbo', name: 'QB Online', fee: 'included' },
    { value: 'rainmaker', name: 'RainMaker', fee: 'included' },
    { value: 'servicefusion', name: 'Service Fusion', fee: 'included' },
    { value: 'shopmonkey', name: 'Shop Monkey', fee: 'included' },
    { value: 'shopkey', name: 'ShopKey Shop Management', fee: 'included' },
    { value: 'techmetric', name: 'Techmetric', fee: 'included', warning: 'Unit data must be manually copied -- plan extra time' },
    { value: 'tmt', name: 'TMT Fleet Maintenance (Trimble)', fee: 'included' },
    { value: 'fiix', name: 'Fiix', fee: 'included' },
    { value: 'im3', name: 'IM3', fee: 'included' },
  ],
  local: [
    { value: 'rowriter', name: 'RO Writer', fee: 'db-fee' },
    { value: 'sage', name: 'Sage', fee: 'db-fee' },
    { value: 'serviceshop', name: 'ServiceShop / GenesisFour', fee: 'not-available' },
    { value: 'shopboss', name: 'Shop Boss Pro', fee: 'db-fee' },
    { value: 'shopfax', name: 'ShopFax', fee: 'db-fee' },
    { value: 'shopstream', name: 'ShopStream', fee: 'db-fee' },
    { value: 'simplygenius', name: 'Simply Genius', fee: 'db-fee' },
    { value: 'tams', name: 'TAMS', fee: 'db-fee' },
    { value: 'winworks', name: 'Winworks AutoShop', fee: 'db-fee' },
    { value: 'tireshop', name: 'Tire Shop CRM', fee: 'db-fee' },
    { value: 'quipware', name: 'Quipware', fee: 'db-fee' },
  ],
};
const ALL_SYSTEMS = [...MIGRATION_SYSTEMS.cloud, ...MIGRATION_SYSTEMS.local];
const findSystem = (val) => ALL_SYSTEMS.find(s => s.value === val);

const SESSION_TOPICS = [
  { id: 'discovery', name: 'Discovery & Brand Alignment', attendees: 'Operations Leadership', category: 'kickOff', workflows: 'Config review, gaps, data clean-up, service/PM requirements' },
  { id: 'generalMgmt', name: 'General Management', attendees: 'Ops Leadership, GMs, Finance', category: 'trainingConfig', workflows: 'Shop profile, roles, service orders, reporting, units settings' },
  { id: 'service', name: 'Service', attendees: 'Service Advisors, Writers, Dispatch', category: 'trainingConfig', workflows: 'Service orders, service home, reporting, digital procedures' },
  { id: 'parts', name: 'Parts', attendees: 'Parts Advisors/Managers', category: 'trainingConfig', workflows: 'Inventory, pricing matrices, POs, counter sales, payments' },
  { id: 'accounting', name: 'Accounting', attendees: 'AR, AP', category: 'trainingConfig', workflows: 'Invoicing, payments, receivables, financial reporting' },
  { id: 'onsiteLaunch', name: 'Onsite Launch Support', attendees: 'All teams', category: 'onsite', workflows: 'Launch monitoring, real-time support' },
  { id: 'endUserTraining', name: 'End User Training', attendees: 'All teams', category: 'trainingConfig', workflows: 'Trainer-led sessions with Fullbay coaching' },
  { id: 'liveLaunch', name: 'Live Launch Support', attendees: 'Internal team', category: 'misc', workflows: 'Launch monitoring, real-time support' },
  { id: 'postLaunch', name: 'Post-Launch Check-In', attendees: 'Ops Leadership, GMs, Finance', category: 'postLaunch', workflows: 'Issue remediation, gap closure' },
];

const TIER_DEFAULTS = {
  standard: { discovery: 1, generalMgmt: 4, service: 2, parts: 4, accounting: 4, onsiteLaunch: 0, endUserTraining: 4, liveLaunch: 2, postLaunch: 4 },
  complex: { discovery: 2, generalMgmt: 8, service: 4, parts: 6, accounting: 6, onsiteLaunch: 1, endUserTraining: 6, liveLaunch: 3, postLaunch: 4 },
  high: { discovery: 2, generalMgmt: 12, service: 5, parts: 10, accounting: 10, onsiteLaunch: 1, endUserTraining: 10, liveLaunch: 4, postLaunch: 4 },
};
const PER_LOC = { discovery: 0, generalMgmt: 1, service: 0, parts: 1, accounting: 1, onsiteLaunch: 0, endUserTraining: 1, liveLaunch: 1, postLaunch: 0 };
const PER_BRAND = { discovery: 0.5, generalMgmt: 1, service: 0, parts: 0, accounting: 0, onsiteLaunch: 0, endUserTraining: 0, liveLaunch: 0, postLaunch: 0 };

function scoreComplexity(inp, w) {
  let p = 0;
  if (inp.e2e) p += w.e2e; if (inp.vrms) p += w.vrms;
  if (inp.migrationScope === 'limited') p += w.limitedMigration;
  if (inp.migrationScope === 'extended') p += w.extendedMigration;
  if (inp.integrationCount >= 3) p += w.integ3plus; else if (inp.integrationCount >= 1) p += w.integ1to2;
  if (inp.multiEntity) p += w.multiEntity; if (inp.customWorkflow) p += w.customWorkflow;
  if (inp.compressedTimeline) p += w.compressedTimeline;
  return p;
}
function getTier(p, inp, a) { if (inp.e2e || inp.vrms || p > a.tierComplexMax) return 'high'; if (p > a.tierStandardMax) return 'complex'; return 'standard'; }

function calcScope(inp, sess, a) {
  const pts = scoreComplexity(inp, a.weights);
  const tier = getTier(pts, inp, a);
  const sH = {};
  SESSION_TOPICS.forEach(t => { const c = sess[t.id] || 0; const r = a.hrsPerItem[t.category] || 1; sH[t.category] = (sH[t.category] || 0) + c * r; });
  let core = Object.values(sH).reduce((s, h) => s + h, 0);
  const intH = inp.integrationCount * a.integrationHrsPerInteg;
  const onsH = inp.onsiteDays * a.onsiteHrsPerDay;
  let base = core + intH + onsH;
  let uD = [], uT = 0;
  if (inp.e2e) { uD.push({ n: 'E2E Data Work', h: a.uplifts.e2eDataWork }, { n: 'E2E PM', h: a.uplifts.e2ePM }, { n: 'E2E Training', h: a.uplifts.e2eTraining }); uT += a.uplifts.e2eDataWork + a.uplifts.e2ePM + a.uplifts.e2eTraining; }
  if (inp.vrms) { uD.push({ n: 'VRMS Data Work', h: a.uplifts.vrmsDataWork }, { n: 'VRMS SE Workflow', h: a.uplifts.vrmsSeWorkflow }, { n: 'VRMS PM', h: a.uplifts.vrmsPM }); uT += a.uplifts.vrmsDataWork + a.uplifts.vrmsSeWorkflow + a.uplifts.vrmsPM; }
  if (inp.migrationScope === 'extended') { uD.push({ n: 'Extended Migration', h: a.uplifts.extendedMigration }); uT += a.uplifts.extendedMigration; }
  if (inp.multiEntity) { uD.push({ n: 'Multi-Entity / Brand', h: a.uplifts.multiEntity }); uT += a.uplifts.multiEntity; }
  if (inp.customWorkflow) { uD.push({ n: 'Custom Workflow', h: a.uplifts.customWorkflow }); uT += a.uplifts.customWorkflow; }
  if (inp.compressedTimeline) { uD.push({ n: 'Compressed PM', h: a.uplifts.compressedPM }, { n: 'Compressed Misc', h: a.uplifts.compressedMisc }); uT += a.uplifts.compressedPM + a.uplifts.compressedMisc; }
  let sub = base + uT;
  const fl = (inp.e2e || inp.vrms) ? a.minFloorE2eVrms : a.minFloor;
  const af = Math.max(sub, fl); const fA = af > sub;
  const cH = Math.round(af * a.contingency * 10) / 10;
  const tH = Math.round((af + cH) * 10) / 10;
  const alloc = Object.entries(a.alloc).map(([k, pct]) => ({ activity: k, pct, hrs: Math.round(core * pct * 10) / 10 }));
  const dL = []; const sys = inp.sourceSystem ? findSystem(inp.sourceSystem) : null;
  if (inp.dataScope.core4 && inp.locations > 0) dL.push({ name: `Core 4 Import (${inp.locations} loc)`, qty: inp.locations, up: 495, total: inp.locations * 495, sku: 'CX-OB-BDI-1000' });
  if (inp.dataScope.historical && inp.histRecs > 0) { const bl = Math.ceil(inp.histRecs / 3000); dL.push({ name: `Historical Import (${inp.histRecs.toLocaleString()} records)`, qty: 1, up: 995, total: 995, sku: 'CX-DS-HRI-1000' }); if (bl > 1) dL.push({ name: `Add'l Historical (${bl-1} x 3K blocks)`, qty: bl-1, up: 495, total: (bl-1)*495, sku: 'CX-DS-AHR-1000' }); }
  if (inp.dataScope.lastPerformed) dL.push({ name: 'Last Performed Import', qty: 1, up: 495, total: 495, sku: 'CX-DS-LPI-1000' });
  if (inp.dataScope.globalServices) dL.push({ name: 'Global Services Import', qty: 1, up: 180, total: 180, sku: 'CX-DS-GSI-1000' });
  if (inp.dataScope.taxLocations) dL.push({ name: 'Tax Locations Import', qty: 1, up: 180, total: 180, sku: 'CX-DS-TLI-1000' });
  const dC = dL.reduce((s, d) => s + d.total, 0);
  const oC = inp.onsiteDays * a.onsiteRatePerDay; const trv = inp.travelEst || 0;
  const bP = Math.round(tH * a.billRate); const mP = Math.round((tH * a.billRate) / (1 - a.targetMargin));
  const gT = bP + dC + oC + trv; const tS = Object.values(sess).reduce((s, v) => s + v, 0);
  return { pts, tier, tS, core: Math.round(core*10)/10, intH, onsH, base: Math.round(base*10)/10, uD, uT, sub: Math.round(sub*10)/10, fl, af: Math.round(af*10)/10, fA, cH, tH, alloc, dL, dC, dbFee: sys?.fee === 'db-fee', noData: sys?.fee === 'not-available', sysWarn: sys?.warning, oC, trv, bP, mP, gT };
}

const AL = { kickOff: 'Kick Off', trainingConfig: 'Training & Config', digitalProcedures: 'Digital Procedures', dataWork: 'Data Work', seWorkflow: 'SE Workflow', misc: 'Misc', postLaunch: 'Post-Launch', projectMgmt: 'Project Mgmt' };
const TL = { standard: 'Standard', complex: 'Complex', high: 'High Complexity' };
const TC = { standard: '#22c55e', complex: '#f59e0b', high: '#CC0000' };

// ── Sub-components ────────────────────────────────────────────────────────────
function Pnl({ title, icon: IconComp, children }) {
  const [o, setO] = useState(true);
  return (
    <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
      <button type="button" onClick={() => setO(!o)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50" style={{background:'none',cursor:'pointer'}}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center"><IconComp /></div>
          <span className="font-bold text-neutral-900 text-sm">{title}</span>
        </div>
        {o ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
      </button>
      {o && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function NI({ label, value, onChange, min = 0, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100" style={{background:'#fff',cursor:'pointer'}}><Icons.Minus /></button>
        <span className="text-lg font-bold text-neutral-900 min-w-[28px] text-center">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100" style={{background:'#fff',cursor:'pointer'}}><Icons.Plus /></button>
      </div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

function DT({ active, onClick, label, pts, desc }) {
  return (
    <button type="button" onClick={onClick} className="p-3 border-2 rounded-lg text-left transition-all" style={{ borderColor: active ? '#ef4444' : '#e5e5e5', backgroundColor: active ? '#fef2f2' : '#fff', cursor: 'pointer', width: '100%' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
        <div className="flex items-center gap-1">
          {active && <span style={{color:'#dc2626'}}><Icons.Check /></span>}
          <span className="text-xs font-bold px-1.5 py-0 rounded-full bg-neutral-100 text-neutral-600">+{pts}</span>
        </div>
      </div>
      <div className="text-xs text-neutral-500">{desc}</div>
    </button>
  );
}

function CI({ checked, onChange, label, sub }) {
  return (
    <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer">
      <div className="w-5 h-5 mt-0 rounded border-2 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: checked ? '#dc2626' : '#fff', borderColor: checked ? '#dc2626' : '#d4d4d4' }}>
        {checked && <span style={{color:'#fff'}}><Icons.Check /></span>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
      <div>
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {sub && <div className="text-xs text-neutral-500">{sub}</div>}
      </div>
    </label>
  );
}

function KC({ l, v, s, c, h }) {
  return (
    <div className="p-3 rounded-xl border" style={{ backgroundColor: h ? '#dc2626' : '#fff', borderColor: h ? '#dc2626' : '#e5e5e5' }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: h ? '#fecaca' : '#737373' }}>{l}</div>
      <div className="text-xl font-black" style={{ color: h ? '#fff' : (c || '#171717') }}>{v}</div>
      {s && <div className="text-xs" style={{ color: h ? '#fecaca' : '#a3a3a3' }}>{s}</div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [view, setView] = useState('inputs');
  const asm = DEFAULT_ASSUMPTIONS;
  const [co, setCo] = useState('');
  const [brands, setBrands] = useState(1);
  const [locs, setLocs] = useState(1);
  const [e2e, setE2e] = useState(false);
  const [vrms, setVrms] = useState(false);
  const [migSc, setMigSc] = useState('none');
  const [intCt, setIntCt] = useState(0);
  const [mEnt, setMEnt] = useState(false);
  const [cwf, setCwf] = useState(false);
  const [comp, setComp] = useState(false);
  const [onD, setOnD] = useState(0);
  const [trvE, setTrvE] = useState(0);
  const [dSc, setDSc] = useState({ core4: true, historical: false, lastPerformed: false, globalServices: false, taxLocations: false });
  const [hRec, setHRec] = useState(3000);
  const [srcSys, setSrcSys] = useState('');
  const [notes, setNotes] = useState('');

  const inp = useMemo(() => ({ e2e, vrms, migrationScope: migSc, integrationCount: intCt, multiEntity: mEnt, customWorkflow: cwf, compressedTimeline: comp, onsiteDays: onD, travelEst: trvE, dataScope: dSc, histRecs: hRec, sourceSystem: srcSys, locations: locs }), [e2e, vrms, migSc, intCt, mEnt, cwf, comp, onD, trvE, dSc, hRec, srcSys, locs]);
  const qT = useMemo(() => { const p = scoreComplexity(inp, asm.weights); return getTier(p, inp, asm); }, [inp]);
  const sugSess = useMemo(() => {
    const b = { ...TIER_DEFAULTS[qT] };
    const aL = Math.max(0, locs - 1); const aB = Math.max(0, brands - 1);
    Object.keys(b).forEach(k => { b[k] = Math.ceil(b[k] + (PER_LOC[k] || 0) * aL + (PER_BRAND[k] || 0) * aB); });
    return b;
  }, [qT, locs, brands]);
  const [sess, setSess] = useState(null);
  const eSess = sess || sugSess;
  const updSess = useCallback((id, d) => {
    setSess(p => { const b = p || { ...sugSess }; return { ...b, [id]: Math.max(0, (b[id] || 0) + d) }; });
  }, [sugSess]);
  const scope = useMemo(() => calcScope(inp, eSess, asm), [inp, eSess]);
  const sys = srcSys ? findSystem(srcSys) : null;

  const reset = () => {
    setView('inputs'); setCo(''); setBrands(1); setLocs(1); setE2e(false); setVrms(false);
    setMigSc('none'); setIntCt(0); setMEnt(false); setCwf(false); setComp(false);
    setOnD(0); setTrvE(0); setDSc({ core4: true, historical: false, lastPerformed: false, globalServices: false, taxLocations: false });
    setHRec(3000); setSrcSys(''); setNotes(''); setSess(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white no-print" style={{position:'sticky',top:0,zIndex:50}}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{background:'#CC0000'}}>
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-bold text-neutral-900 text-sm">Fullbay</span>
            <span className="text-neutral-300 mx-1">|</span>
            <span className="text-sm text-neutral-600">Enterprise Scoping</span>
          </div>
          <div className="flex items-center gap-3">
            {view === 'results' && <>
              <button type="button" onClick={() => setView('inputs')} className="text-xs text-neutral-600 font-medium" style={{background:'none',border:'none',cursor:'pointer'}}>Edit</button>
              <button type="button" onClick={() => window.print()} className="px-3 py-1 bg-neutral-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1" style={{cursor:'pointer'}}>
                <Icons.Printer /> Print
              </button>
            </>}
            <button type="button" onClick={reset} className="text-xs text-neutral-400" style={{background:'none',border:'none',cursor:'pointer',color:'#a3a3a3'}} onMouseEnter={e=>e.target.style.color='#dc2626'} onMouseLeave={e=>e.target.style.color='#a3a3a3'}>
              <Icons.RotateCcw />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {view === 'inputs' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'#CC0000'}}>
                <span style={{color:'#fff'}}><Icons.Calculator /></span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Enterprise Scoping</h1>
                <p className="text-xs text-neutral-500">Fill in details below. Hours and pricing update live.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Customer Profile */}
              <Pnl title="Customer Profile" icon={Icons.Building2}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
                  <div style={{gridColumn:'span 3'}}>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Company Name</label>
                    <input value={co} onChange={e => setCo(e.target.value)} placeholder="e.g., Brady Welding" style={{width:'100%',padding:'8px 12px',border:'2px solid #e5e5e5',borderRadius:'8px',outline:'none',fontSize:'14px'}} />
                  </div>
                  <NI label="Brands / Entities" value={brands} onChange={setBrands} min={1} />
                  <NI label="Shop Locations" value={locs} onChange={setLocs} min={1} />
                  <NI label="Integrations" value={intCt} onChange={setIntCt} min={0} hint={intCt >= 3 ? '+4 pts' : intCt >= 1 ? '+1 pt' : ''} />
                </div>
              </Pnl>

              {/* Complexity Drivers */}
              <Pnl title="Complexity Drivers" icon={Icons.Gauge}>
                <p className="text-xs text-neutral-500 mb-3">Select all that apply. These drive tier and hour uplifts.</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px'}}>
                  <DT active={e2e} onClick={() => setE2e(!e2e)} label="Entity-to-Entity Migration" pts={asm.weights.e2e} desc="Consolidating existing Fullbay accounts" />
                  <DT active={vrms} onClick={() => setVrms(!vrms)} label="VRMS Coding" pts={asm.weights.vrms} desc="VMRS code mapping and cleanup" />
                  <DT active={mEnt} onClick={() => setMEnt(!mEnt)} label="Multi-Entity / Brand" pts={asm.weights.multiEntity} desc="Coordination across brands or entities" />
                  <DT active={cwf} onClick={() => setCwf(!cwf)} label="Custom Workflows" pts={asm.weights.customWorkflow} desc="Advanced pricing, split billing, PO approvals" />
                  <DT active={comp} onClick={() => setComp(!comp)} label="Compressed Timeline" pts={asm.weights.compressedTimeline} desc="Accelerated rollout" />
                </div>
                <div className="mt-4" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1rem'}}>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Migration Scope</label>
                    <select value={migSc} onChange={e => setMigSc(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'2px solid #e5e5e5',borderRadius:'8px',outline:'none',fontSize:'14px',background:'#fff'}}>
                      <option value="none">None / New Implementation</option>
                      <option value="limited">Limited (Core 4 only)</option>
                      <option value="extended">Extended (Core 4 + historical)</option>
                    </select>
                  </div>
                  <NI label="Onsite Days" value={onD} onChange={setOnD} min={0} hint={onD > 0 ? `$${(onD * asm.onsiteRatePerDay).toLocaleString()} + travel` : ''} />
                </div>
                {onD > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Travel Estimate (billed as incurred)</label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-neutral-500">$</span>
                      <input type="number" value={trvE} onChange={e => setTrvE(Math.max(0, parseInt(e.target.value) || 0))} style={{width:'144px',padding:'6px 8px',border:'2px solid #e5e5e5',borderRadius:'8px',outline:'none',fontSize:'14px'}} />
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: TC[qT] + '20', borderLeft: `4px solid ${TC[qT]}` }}>
                  <div>
                    <div className="text-xs font-semibold uppercase" style={{ color: TC[qT] }}>Complexity Tier</div>
                    <div className="text-lg font-black text-neutral-900">{TL[qT]}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500">Score</div>
                    <div className="text-2xl font-black" style={{ color: TC[qT] }}>{scope.pts} pts</div>
                  </div>
                </div>
              </Pnl>

              {/* Data Migration */}
              <Pnl title="Data Migration" icon={Icons.Database}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Current System</label>
                  <select value={srcSys} onChange={e => setSrcSys(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'2px solid #e5e5e5',borderRadius:'8px',outline:'none',fontSize:'14px',background:'#fff'}}>
                    <option value="">Select current software...</option>
                    <option value="paper">Paper / manual</option>
                    <option value="spreadsheets">Spreadsheets</option>
                    <optgroup label="Cloud-based">{MIGRATION_SYSTEMS.cloud.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}</optgroup>
                    <optgroup label="Local / server-based">{MIGRATION_SYSTEMS.local.map(s => <option key={s.value} value={s.value}>{s.name}{s.fee === 'not-available' ? ' (N/A)' : s.fee === 'db-fee' ? ' (DB fee)' : ''}</option>)}</optgroup>
                  </select>
                  {sys?.fee === 'db-fee' && <div className="mt-2 p-2 rounded text-xs font-semibold" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c'}}>Database fee required -- local server access needed</div>}
                  {sys?.fee === 'not-available' && <div className="mt-2 p-2 rounded text-xs font-semibold" style={{background:'#fffbeb',border:'1px solid #fde68a',color:'#78350f'}}>Data import not available from {sys.name}</div>}
                  {sys?.warning && <div className="mt-2 p-2 rounded text-xs" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c'}}>{sys.warning}</div>}
                </div>
                <div className="space-y-2">
                  <CI checked={dSc.core4} onChange={v => setDSc({ ...dSc, core4: v })} label="Core 4 Data Import" sub={`$495/shop x ${locs} = $${(locs * 495).toLocaleString()}`} />
                  <CI checked={dSc.historical} onChange={v => setDSc({ ...dSc, historical: v })} label="Historical Record Import" sub="Priced by record count" />
                  {dSc.historical && (
                    <div style={{marginLeft:'2rem'}}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-neutral-600">Records:</span>
                        <input type="number" value={hRec} onChange={e => setHRec(Math.max(1, parseInt(e.target.value) || 1))} style={{width:'112px',padding:'6px 8px',border:'2px solid #e5e5e5',borderRadius:'6px',outline:'none',fontSize:'14px'}} />
                      </div>
                      <div className="text-xs text-neutral-500 p-2 rounded" style={{background:'#fafafa'}}>
                        {hRec.toLocaleString()} records = {Math.ceil(hRec / 3000)} block{Math.ceil(hRec / 3000) !== 1 ? 's' : ''}: <strong className="text-neutral-900">${(995 + Math.max(0, Math.ceil(hRec / 3000) - 1) * 495).toLocaleString()}</strong>
                        {Math.ceil(hRec / 3000) > 1 && <span className="text-neutral-400"> ($995 + {Math.ceil(hRec / 3000) - 1} x $495)</span>}
                      </div>
                    </div>
                  )}
                  <CI checked={dSc.lastPerformed} onChange={v => setDSc({ ...dSc, lastPerformed: v })} label="Last Performed Import" sub="$495" />
                  <CI checked={dSc.globalServices} onChange={v => setDSc({ ...dSc, globalServices: v })} label="Global Services Import" sub="$180" />
                  <CI checked={dSc.taxLocations} onChange={v => setDSc({ ...dSc, taxLocations: v })} label="Tax Locations Import" sub="$180" />
                </div>
              </Pnl>

              {/* Session Plan */}
              <Pnl title="Session Plan" icon={Icons.Clock}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-neutral-500">Auto-suggested for <strong>{TL[qT]}</strong> tier. Adjust as needed.</p>
                  {sess && <button type="button" onClick={() => setSess(null)} className="text-xs text-red-600 font-semibold" style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626'}}>Reset</button>}
                </div>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'#171717',color:'#fff'}}>
                        <th style={{padding:'8px 12px',textAlign:'left',fontSize:'12px'}}>Topic</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontSize:'12px'}}>Attendees</th>
                        <th style={{padding:'8px 12px',textAlign:'center',fontSize:'12px',width:'100px'}}>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SESSION_TOPICS.map((t, i) => {
                        const c = eSess[t.id] || 0;
                        const custom = sess && sess[t.id] !== undefined && sess[t.id] !== sugSess[t.id];
                        return (
                          <tr key={t.id} style={{borderTop:'1px solid #e5e5e5',background:i%2?'#fafafa':'#fff'}}>
                            <td style={{padding:'8px 12px'}}>
                              <div className="font-medium text-neutral-900">{t.name}</div>
                              <div className="text-xs text-neutral-500">{t.workflows}</div>
                            </td>
                            <td style={{padding:'8px 12px',fontSize:'12px',color:'#525252'}}>{t.attendees}</td>
                            <td style={{padding:'8px 12px'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                                <button type="button" onClick={() => updSess(t.id, -1)} style={{width:'24px',height:'24px',border:'1px solid #e5e5e5',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',cursor:'pointer'}}><Icons.Minus /></button>
                                <span style={{fontSize:'14px',fontWeight:'700',minWidth:'24px',textAlign:'center',color:custom?'#dc2626':'#171717'}}>{c}</span>
                                <button type="button" onClick={() => updSess(t.id, 1)} style={{width:'24px',height:'24px',border:'1px solid #e5e5e5',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',cursor:'pointer'}}><Icons.Plus /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{borderTop:'2px solid #d4d4d4',background:'#f5f5f5',fontWeight:'700'}}>
                        <td style={{padding:'8px 12px'}} colSpan={2}>Total</td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontSize:'18px'}}>{scope.tS}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Pnl>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Scope Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special requirements, context, risks..." style={{width:'100%',padding:'8px 12px',border:'2px solid #e5e5e5',borderRadius:'8px',outline:'none',fontSize:'14px',resize:'vertical'}} />
              </div>

              {/* Sticky footer */}
              <div style={{position:'sticky',bottom:0,background:'#171717',color:'#fff',borderRadius:'12px',padding:'16px',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px',boxShadow:'0 20px 25px -5px rgba(0,0,0,.3)'}}>
                <div style={{display:'flex',gap:'16px',fontSize:'14px',flexWrap:'wrap'}}>
                  <span><span style={{color:'#a3a3a3'}}>Tier: </span><span style={{fontWeight:'700',color:TC[qT]}}>{TL[qT]}</span></span>
                  <span><span style={{color:'#a3a3a3'}}>Hrs: </span><span style={{fontWeight:'700'}}>{scope.tH}</span></span>
                  <span><span style={{color:'#a3a3a3'}}>Total: </span><span style={{fontWeight:'700',fontSize:'18px'}}>${scope.gT.toLocaleString()}</span></span>
                </div>
                <button type="button" onClick={() => setView('results')} style={{padding:'10px 24px',background:'#CC0000',color:'#fff',fontWeight:'600',borderRadius:'8px',fontSize:'14px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
                  Generate Scope <Icons.ArrowRight />
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'results' && (
          <div className="space-y-6">
            <div style={{borderBottom:'2px solid #CC0000',paddingBottom:'16px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',letterSpacing:'0.1em',textTransform:'uppercase',color:'#CC0000',marginBottom:'4px'}}>Enterprise Implementation Scope</div>
              <h1 style={{fontSize:'30px',fontWeight:'700',color:'#171717'}}>{co || 'Customer'}</h1>
              <p style={{fontSize:'14px',color:'#737373',marginTop:'4px'}}>{brands} brand{brands!==1?'s':''} / {locs} location{locs!==1?'s':''} / {intCt} integration{intCt!==1?'s':''} / {TL[qT]}</p>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px'}}>
              <KC l="Complexity" v={`${scope.pts} pts`} s={TL[qT]} c={TC[qT]} />
              <KC l="Sessions" v={scope.tS} />
              <KC l="Hours" v={scope.tH} />
              <KC l="Services" v={`$${scope.bP.toLocaleString()}`} s={`$${asm.billRate}/hr`} />
              <KC l="Grand Total" v={`$${scope.gT.toLocaleString()}`} s="All items" h />
            </div>

            {/* Hours build-up */}
            <div>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#171717',marginBottom:'8px'}}>Hours Build-Up</h2>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f5f5f5'}}>
                    <th style={{padding:'8px 16px',textAlign:'left',fontWeight:'600',color:'#404040'}}>Component</th>
                    <th style={{padding:'8px 16px',textAlign:'right',fontWeight:'600',color:'#404040',width:'96px'}}>Hours</th>
                  </tr></thead>
                  <tbody>
                    <tr style={{borderTop:'1px solid #e5e5e5'}}><td style={{padding:'8px 16px'}}>Core sessions ({scope.tS})</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:'500'}}>{scope.core}</td></tr>
                    <tr style={{borderTop:'1px solid #e5e5e5'}}><td style={{padding:'8px 16px'}}>Integration support ({intCt} x {asm.integrationHrsPerInteg})</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:'500'}}>{scope.intH}</td></tr>
                    {scope.onsH > 0 && <tr style={{borderTop:'1px solid #e5e5e5'}}><td style={{padding:'8px 16px'}}>Onsite ({onD} days x {asm.onsiteHrsPerDay})</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:'500'}}>{scope.onsH}</td></tr>}
                    <tr style={{borderTop:'1px solid #e5e5e5',background:'#fafafa',fontWeight:'600'}}><td style={{padding:'8px 16px'}}>Base</td><td style={{padding:'8px 16px',textAlign:'right'}}>{scope.base}</td></tr>
                    {scope.uD.map((u, i) => <tr key={i} style={{borderTop:'1px solid #e5e5e5'}}>
                      <td style={{padding:'8px 16px',color:'#b91c1c',display:'flex',alignItems:'center',gap:'4px'}}><Icons.Zap /> {u.n}</td>
                      <td style={{padding:'8px 16px',textAlign:'right',color:'#b91c1c',fontWeight:'500'}}>+{u.h}</td>
                    </tr>)}
                    {scope.uT > 0 && <tr style={{borderTop:'1px solid #e5e5e5',background:'#fafafa',fontWeight:'600'}}><td style={{padding:'8px 16px'}}>After uplifts</td><td style={{padding:'8px 16px',textAlign:'right'}}>{scope.sub}</td></tr>}
                    {scope.fA && <tr style={{borderTop:'1px solid #e5e5e5'}}>
                      <td style={{padding:'8px 16px',color:'#b45309',display:'flex',alignItems:'center',gap:'4px'}}><Icons.Shield /> Floor ({scope.fl}hr min)</td>
                      <td style={{padding:'8px 16px',textAlign:'right',color:'#b45309'}}>{scope.af}</td>
                    </tr>}
                    <tr style={{borderTop:'1px solid #e5e5e5'}}><td style={{padding:'8px 16px'}}>Contingency ({Math.round(asm.contingency*100)}%)</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:'500'}}>+{scope.cH}</td></tr>
                    <tr style={{borderTop:'2px solid #171717',background:'#171717',color:'#fff',fontWeight:'700'}}>
                      <td style={{padding:'12px 16px'}}>Total Scoped Hours</td>
                      <td style={{padding:'12px 16px',textAlign:'right',fontSize:'18px'}}>{scope.tH}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Mix */}
            <div>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#171717',marginBottom:'8px'}}>Activity Mix</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
                {scope.alloc.map(a => (
                  <div key={a.activity} style={{padding:'12px',border:'1px solid #e5e5e5',borderRadius:'8px'}}>
                    <div style={{fontSize:'12px',color:'#737373'}}>{AL[a.activity]}</div>
                    <div style={{fontSize:'18px',fontWeight:'700',color:'#171717'}}>{a.hrs} hrs</div>
                    <div style={{fontSize:'12px',color:'#a3a3a3'}}>{Math.round(a.pct*100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Plan */}
            <div>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#171717',marginBottom:'8px'}}>Session Plan</h2>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f5f5f5'}}>
                    <th style={{padding:'8px 16px',textAlign:'left',fontWeight:'600'}}>Topic</th>
                    <th style={{padding:'8px 16px',textAlign:'left',fontWeight:'600'}}>Attendees</th>
                    <th style={{padding:'8px 16px',textAlign:'center',fontWeight:'600',width:'80px'}}>Sessions</th>
                  </tr></thead>
                  <tbody>
                    {SESSION_TOPICS.map((t, i) => (
                      <tr key={t.id} style={{borderTop:'1px solid #e5e5e5',background:i%2?'#fafafa':'#fff'}}>
                        <td style={{padding:'8px 16px',fontWeight:'500'}}>{t.name}</td>
                        <td style={{padding:'8px 16px',fontSize:'12px',color:'#525252'}}>{t.attendees}</td>
                        <td style={{padding:'8px 16px',textAlign:'center',fontWeight:'700'}}>{eSess[t.id]||0}</td>
                      </tr>
                    ))}
                    <tr style={{borderTop:'2px solid #d4d4d4',background:'#f5f5f5',fontWeight:'700'}}>
                      <td style={{padding:'8px 16px'}} colSpan={2}>Total</td>
                      <td style={{padding:'8px 16px',textAlign:'center',fontSize:'18px'}}>{scope.tS}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Services */}
            {scope.dL.length > 0 && (
              <div>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:'#171717',marginBottom:'8px'}}>Data Services</h2>
                {scope.dbFee && <div style={{marginBottom:'8px',padding:'8px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'6px',fontSize:'14px',color:'#b91c1c',fontWeight:'600'}}>DB fee required -- local system</div>}
                {scope.noData && <div style={{marginBottom:'8px',padding:'8px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'6px',fontSize:'14px',color:'#78350f',fontWeight:'600'}}>Data import not available</div>}
                {scope.sysWarn && <div style={{marginBottom:'8px',padding:'8px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'6px',fontSize:'14px',color:'#b91c1c'}}>{scope.sysWarn}</div>}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#f5f5f5'}}>
                      <th style={{padding:'8px 16px',textAlign:'left',fontWeight:'600'}}>Service</th>
                      <th style={{padding:'8px 16px',textAlign:'center',fontWeight:'600',width:'64px'}}>Qty</th>
                      <th style={{padding:'8px 16px',textAlign:'center',fontWeight:'600',width:'80px'}}>Unit</th>
                      <th style={{padding:'8px 16px',textAlign:'right',fontWeight:'600',width:'80px'}}>Total</th>
                    </tr></thead>
                    <tbody>
                      {scope.dL.map((d, i) => (
                        <tr key={i} style={{borderTop:'1px solid #e5e5e5'}}>
                          <td style={{padding:'8px 16px'}}>{d.name}<div style={{fontSize:'12px',color:'#a3a3a3'}}>{d.sku}</div></td>
                          <td style={{padding:'8px 16px',textAlign:'center'}}>{d.qty}</td>
                          <td style={{padding:'8px 16px',textAlign:'center'}}>${d.up.toLocaleString()}</td>
                          <td style={{padding:'8px 16px',textAlign:'right',fontWeight:'500'}}>${d.total.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{borderTop:'2px solid #d4d4d4',background:'#f5f5f5',fontWeight:'700'}}>
                        <td style={{padding:'8px 16px'}} colSpan={3}>Data Subtotal</td>
                        <td style={{padding:'8px 16px',textAlign:'right'}}>${scope.dC.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div style={{padding:'20px',background:'#171717',color:'#fff',borderRadius:'12px'}}>
              <h2 style={{fontSize:'12px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.05em',color:'#a3a3a3',marginBottom:'12px'}}>Pricing</h2>
              <div className="space-y-3">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',color:'#a3a3a3'}}>Professional Services ({scope.tH} hrs x ${asm.billRate})</span>
                  <span style={{fontSize:'20px',fontWeight:'900'}}>${scope.bP.toLocaleString()}</span>
                </div>
                {scope.dC > 0 && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',color:'#a3a3a3'}}>Data Services</span>
                  <span style={{fontSize:'20px',fontWeight:'900'}}>${scope.dC.toLocaleString()}</span>
                </div>}
                {scope.oC > 0 && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',color:'#a3a3a3'}}>Onsite ({onD}d x ${asm.onsiteRatePerDay.toLocaleString()})</span>
                  <span style={{fontSize:'20px',fontWeight:'900'}}>${scope.oC.toLocaleString()}</span>
                </div>}
                {scope.trv > 0 && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',color:'#a3a3a3'}}>Travel (as incurred)</span>
                  <span style={{fontSize:'20px',fontWeight:'900'}}>${scope.trv.toLocaleString()}</span>
                </div>}
                <div style={{paddingTop:'12px',marginTop:'12px',borderTop:'1px solid #404040',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#d4d4d4',fontWeight:'600'}}>Total at Bill Rate</span>
                  <span style={{fontSize:'30px',fontWeight:'900'}}>${scope.gT.toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#525252'}}>At {Math.round(asm.targetMargin*100)}% margin</span>
                  <span style={{fontSize:'14px',fontWeight:'700',color:'#525252'}}>${(scope.mP+scope.dC+scope.oC+scope.trv).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:'#171717',marginBottom:'8px'}}>Notes</h2>
                <div style={{padding:'16px',background:'#fafafa',border:'1px solid #e5e5e5',borderRadius:'12px',fontSize:'14px',whiteSpace:'pre-wrap'}}>{notes}</div>
              </div>
            )}

            {/* Assumptions footer */}
            <div style={{padding:'16px',background:'#fafafa',border:'1px solid #e5e5e5',borderRadius:'12px',fontSize:'12px',color:'#737373'}}>
              <div style={{fontWeight:'700',color:'#404040',fontSize:'14px',marginBottom:'4px'}}>Assumptions</div>
              <p>Effort beyond scoped hours requires Change Order at ${asm.billRate}/hr. {Math.round(asm.contingency*100)}% contingency included. 50/50 fee schedule. Sessions expire 90 days after kickoff.</p>
              <p style={{marginTop:'4px'}}>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
