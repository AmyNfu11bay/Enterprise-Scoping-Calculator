import React, { useState, useMemo, useCallback } from 'react';
import { Building2, Users, Database, Settings, ChevronDown, ChevronUp, Printer, RotateCcw, AlertCircle, Check, Plus, Minus, ArrowRight, Calculator, Gauge, Clock, DollarSign, FileText, Layers, Zap, Shield } from 'lucide-react';

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
  const alloc = Object.entries(a.alloc).map(([k, p]) => ({ activity: k, pct: p, hrs: Math.round(core * p * 10) / 10 }));
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

export default function App() {
  const [view, setView] = useState('inputs');
  const [asm, setAsm] = useState({ ...DEFAULT_ASSUMPTIONS });
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
  const qT = useMemo(() => { const p = scoreComplexity(inp, asm.weights); return getTier(p, inp, asm); }, [inp, asm]);
  const sugSess = useMemo(() => { const b = { ...TIER_DEFAULTS[qT] }; const aL = Math.max(0, locs-1); const aB = Math.max(0, brands-1); Object.keys(b).forEach(k => { b[k] = Math.ceil(b[k] + (PER_LOC[k]||0)*aL + (PER_BRAND[k]||0)*aB); }); return b; }, [qT, locs, brands]);
  const [sess, setSess] = useState(null);
  const eSess = sess || sugSess;
  const updSess = useCallback((id, d) => { setSess(p => { const b = p || { ...sugSess }; return { ...b, [id]: Math.max(0, (b[id]||0)+d) }; }); }, [sugSess]);
  const scope = useMemo(() => calcScope(inp, eSess, asm), [inp, eSess, asm]);
  const sys = srcSys ? findSystem(srcSys) : null;

  const reset = () => { setView('inputs'); setCo(''); setBrands(1); setLocs(1); setE2e(false); setVrms(false); setMigSc('none'); setIntCt(0); setMEnt(false); setCwf(false); setComp(false); setOnD(0); setTrvE(0); setDSc({ core4: true, historical: false, lastPerformed: false, globalServices: false, taxLocations: false }); setHRec(3000); setSrcSys(''); setNotes(''); setSess(null); };

  const inputsContent = (
    <div className="space-y-6">
      <Pnl title="Customer Profile" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3"><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Company Name</label><input value={co} onChange={e => setCo(e.target.value)} placeholder="e.g., Brady Welding" className="w-full px-3 py-2 border-2 border-neutral-200 focus:border-red-500 rounded-lg outline-none text-sm" /></div>
          <NI label="Brands / Entities" value={brands} onChange={setBrands} min={1} />
          <NI label="Shop Locations" value={locs} onChange={setLocs} min={1} />
          <NI label="Integrations" value={intCt} onChange={setIntCt} min={0} hint={intCt >= 3 ? '+4 pts' : intCt >= 1 ? '+1 pt' : ''} />
        </div>
      </Pnl>

      <Pnl title="Complexity Drivers" icon={Gauge}>
        <p className="text-xs text-neutral-500 mb-3">Select all that apply. These drive tier and hour uplifts.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DT active={e2e} onClick={() => setE2e(!e2e)} label="Entity-to-Entity Migration" pts={asm.weights.e2e} desc="Consolidating existing Fullbay accounts" />
          <DT active={vrms} onClick={() => setVrms(!vrms)} label="VRMS Coding" pts={asm.weights.vrms} desc="VMRS code mapping and cleanup" />
          <DT active={mEnt} onClick={() => setMEnt(!mEnt)} label="Multi-Entity / Brand" pts={asm.weights.multiEntity} desc="Coordination across brands or entities" />
          <DT active={cwf} onClick={() => setCwf(!cwf)} label="Custom Workflows" pts={asm.weights.customWorkflow} desc="Advanced pricing, split billing, PO approvals" />
          <DT active={comp} onClick={() => setComp(!comp)} label="Compressed Timeline" pts={asm.weights.compressedTimeline} desc="Accelerated rollout" />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Migration Scope</label><select value={migSc} onChange={e => setMigSc(e.target.value)} className="w-full px-3 py-2 border-2 border-neutral-200 focus:border-red-500 rounded-lg outline-none text-sm bg-white"><option value="none">None / New Implementation</option><option value="limited">Limited (Core 4 only)</option><option value="extended">Extended (Core 4 + historical)</option></select></div>
          <NI label="Onsite Days" value={onD} onChange={setOnD} min={0} hint={onD > 0 ? `$${(onD*asm.onsiteRatePerDay).toLocaleString()} + travel` : ''} />
        </div>
        {onD > 0 && <div className="mt-3"><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Travel Estimate (billed as incurred)</label><div className="flex items-center gap-1"><span className="text-sm text-neutral-500">$</span><input type="number" value={trvE} onChange={e => setTrvE(Math.max(0, parseInt(e.target.value)||0))} className="w-36 px-2 py-1.5 border-2 border-neutral-200 focus:border-red-500 rounded-lg outline-none text-sm" /></div></div>}
        <div className="mt-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: TC[qT]+'15', borderLeft: `4px solid ${TC[qT]}` }}>
          <div><div className="text-xs font-semibold uppercase" style={{ color: TC[qT] }}>Complexity Tier</div><div className="text-lg font-black text-neutral-900">{TL[qT]}</div></div>
          <div className="text-right"><div className="text-xs text-neutral-500">Score</div><div className="text-2xl font-black" style={{ color: TC[qT] }}>{scope.pts} pts</div></div>
        </div>
      </Pnl>

      <Pnl title="Data Migration" icon={Database}>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Current System</label>
          <select value={srcSys} onChange={e => setSrcSys(e.target.value)} className="w-full px-3 py-2 border-2 border-neutral-200 focus:border-red-500 rounded-lg outline-none text-sm bg-white">
            <option value="">Select current software...</option>
            <option value="paper">Paper / manual</option>
            <option value="spreadsheets">Spreadsheets</option>
            <optgroup label="Cloud-based">{MIGRATION_SYSTEMS.cloud.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}</optgroup>
            <optgroup label="Local / server-based">{MIGRATION_SYSTEMS.local.map(s => <option key={s.value} value={s.value}>{s.name}{s.fee==='not-available'?' (N/A)':s.fee==='db-fee'?' (DB fee)':''}</option>)}</optgroup>
          </select>
          {sys?.fee === 'db-fee' && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-semibold">Database fee required -- local server access needed</div>}
          {sys?.fee === 'not-available' && <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-semibold">Data import not available from {sys.name}</div>}
          {sys?.warning && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{sys.warning}</div>}
        </div>
        <div className="space-y-2">
          <CI checked={dSc.core4} onChange={v => setDSc({...dSc, core4: v})} label="Core 4 Data Import" sub={`$495/shop x ${locs} = $${(locs*495).toLocaleString()}`} />
          <CI checked={dSc.historical} onChange={v => setDSc({...dSc, historical: v})} label="Historical Record Import" sub="Priced by record count" />
          {dSc.historical && <div className="ml-8 space-y-2">
            <div className="flex items-center gap-2"><span className="text-xs text-neutral-600">Records:</span><input type="number" value={hRec} onChange={e => setHRec(Math.max(1, parseInt(e.target.value)||1))} className="w-28 px-2 py-1.5 border-2 border-neutral-200 focus:border-red-500 rounded outline-none text-sm" /></div>
            <div className="text-xs text-neutral-500 p-2 bg-neutral-50 rounded">{hRec.toLocaleString()} records = {Math.ceil(hRec/3000)} block{Math.ceil(hRec/3000)!==1?'s':''}: <strong className="text-neutral-900">${(995+Math.max(0,Math.ceil(hRec/3000)-1)*495).toLocaleString()}</strong>{Math.ceil(hRec/3000)>1 && <span className="text-neutral-400"> ($995 + {Math.ceil(hRec/3000)-1} x $495)</span>}</div>
          </div>}
          <CI checked={dSc.lastPerformed} onChange={v => setDSc({...dSc, lastPerformed: v})} label="Last Performed Import" sub="$495" />
          <CI checked={dSc.globalServices} onChange={v => setDSc({...dSc, globalServices: v})} label="Global Services Import" sub="$180" />
          <CI checked={dSc.taxLocations} onChange={v => setDSc({...dSc, taxLocations: v})} label="Tax Locations Import" sub="$180" />
        </div>
      </Pnl>

      <Pnl title="Session Plan" icon={Clock}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-neutral-500">Auto-suggested for <strong>{TL[qT]}</strong> tier. Adjust as needed.</p>
          {sess && <button type="button" onClick={() => setSess(null)} className="text-xs text-red-600 font-semibold">Reset</button>}
        </div>
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-neutral-900 text-white"><th className="px-3 py-2 text-left text-xs">Topic</th><th className="px-3 py-2 text-left text-xs hidden md:table-cell">Attendees</th><th className="px-3 py-2 text-center text-xs w-28">Sessions</th></tr></thead>
          <tbody>{SESSION_TOPICS.map((t, i) => { const c = eSess[t.id]||0; const custom = sess && sess[t.id] !== undefined && sess[t.id] !== sugSess[t.id]; return (
            <tr key={t.id} className={`border-t ${i%2?'bg-neutral-50':''}`}><td className="px-3 py-2"><div className="font-medium text-neutral-900">{t.name}</div><div className="text-xs text-neutral-500 hidden sm:block">{t.workflows}</div></td><td className="px-3 py-2 text-xs text-neutral-600 hidden md:table-cell">{t.attendees}</td><td className="px-3 py-2"><div className="flex items-center justify-center gap-1.5"><button type="button" onClick={() => updSess(t.id, -1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-neutral-100"><Minus className="w-3 h-3" /></button><span className={`text-sm font-bold min-w-[24px] text-center ${custom?'text-red-600':'text-neutral-900'}`}>{c}</span><button type="button" onClick={() => updSess(t.id, 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-neutral-100"><Plus className="w-3 h-3" /></button></div></td></tr>); })}
          <tr className="border-t-2 border-neutral-300 bg-neutral-100 font-bold"><td className="px-3 py-2">Total</td><td className="hidden md:table-cell"></td><td className="px-3 py-2 text-center text-lg">{scope.tS}</td></tr></tbody></table>
        </div>
      </Pnl>

      <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Scope Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special requirements, context, risks..." className="w-full px-3 py-2 border-2 border-neutral-200 focus:border-red-500 rounded-lg outline-none text-sm" /></div>

      <div className="sticky bottom-0 bg-neutral-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span><span className="text-neutral-400">Tier: </span><span className="font-bold" style={{ color: TC[qT] }}>{TL[qT]}</span></span>
          <span><span className="text-neutral-400">Hrs: </span><span className="font-bold">{scope.tH}</span></span>
          <span><span className="text-neutral-400">Total: </span><span className="font-bold text-lg">${scope.gT.toLocaleString()}</span></span>
        </div>
        <button type="button" onClick={() => setView('results')} style={{ backgroundColor: '#CC0000' }} className="px-6 py-2.5 text-white font-semibold rounded-lg text-sm flex items-center gap-2 hover:opacity-90">Generate Scope <ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );

  const resultsContent = (
    <div className="space-y-6">
      <div className="border-b-2 border-red-600 pb-4"><div className="text-xs font-bold tracking-widest uppercase text-red-600 mb-1">Enterprise Implementation Scope</div><h1 className="text-3xl font-bold text-neutral-900">{co || 'Customer'}</h1><p className="text-sm text-neutral-500 mt-1">{brands} brand{brands!==1?'s':''} / {locs} location{locs!==1?'s':''} / {intCt} integration{intCt!==1?'s':''} / {TL[qT]}</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KC l="Complexity" v={`${scope.pts} pts`} s={TL[qT]} c={TC[qT]} /><KC l="Sessions" v={scope.tS} /><KC l="Hours" v={scope.tH} /><KC l="Services" v={`$${scope.bP.toLocaleString()}`} s={`$${asm.billRate}/hr`} /><KC l="Grand Total" v={`$${scope.gT.toLocaleString()}`} s="All items" h />
      </div>

      <div><h2 className="text-base font-bold text-neutral-900 mb-2">Hours Build-Up</h2><div className="border border-neutral-200 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-neutral-100"><th className="px-4 py-2 text-left font-semibold text-neutral-700">Component</th><th className="px-4 py-2 text-right font-semibold text-neutral-700 w-24">Hours</th></tr></thead><tbody>
        <tr className="border-t"><td className="px-4 py-2">Core sessions ({scope.tS})</td><td className="px-4 py-2 text-right font-medium">{scope.core}</td></tr>
        <tr className="border-t"><td className="px-4 py-2">Integration support ({intCt} x {asm.integrationHrsPerInteg})</td><td className="px-4 py-2 text-right font-medium">{scope.intH}</td></tr>
        {scope.onsH > 0 && <tr className="border-t"><td className="px-4 py-2">Onsite ({onD} days x {asm.onsiteHrsPerDay})</td><td className="px-4 py-2 text-right font-medium">{scope.onsH}</td></tr>}
        <tr className="border-t bg-neutral-50 font-semibold"><td className="px-4 py-2">Base</td><td className="px-4 py-2 text-right">{scope.base}</td></tr>
        {scope.uD.map((u, i) => <tr key={i} className="border-t"><td className="px-4 py-2 text-red-700 flex items-center gap-1"><Zap className="w-3 h-3" /> {u.n}</td><td className="px-4 py-2 text-right text-red-700 font-medium">+{u.h}</td></tr>)}
        {scope.uT > 0 && <tr className="border-t bg-neutral-50 font-semibold"><td className="px-4 py-2">After uplifts</td><td className="px-4 py-2 text-right">{scope.sub}</td></tr>}
        {scope.fA && <tr className="border-t"><td className="px-4 py-2 text-amber-700 flex items-center gap-1"><Shield className="w-3 h-3" /> Floor ({scope.fl}hr min)</td><td className="px-4 py-2 text-right text-amber-700">{scope.af}</td></tr>}
        <tr className="border-t"><td className="px-4 py-2">Contingency ({Math.round(asm.contingency*100)}%)</td><td className="px-4 py-2 text-right font-medium">+{scope.cH}</td></tr>
        <tr className="border-t-2 border-neutral-900 bg-neutral-900 text-white font-bold"><td className="px-4 py-3">Total Scoped Hours</td><td className="px-4 py-3 text-right text-lg">{scope.tH}</td></tr>
      </tbody></table></div></div>

      <div><h2 className="text-base font-bold text-neutral-900 mb-2">Activity Mix</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{scope.alloc.map(a => <div key={a.activity} className="p-3 border border-neutral-200 rounded-lg"><div className="text-xs text-neutral-500">{AL[a.activity]}</div><div className="text-lg font-bold text-neutral-900">{a.hrs} hrs</div><div className="text-xs text-neutral-400">{Math.round(a.pct*100)}%</div></div>)}</div></div>

      <div><h2 className="text-base font-bold text-neutral-900 mb-2">Session Plan</h2><div className="border border-neutral-200 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-neutral-100"><th className="px-4 py-2 text-left font-semibold">Topic</th><th className="px-4 py-2 text-left font-semibold hidden sm:table-cell">Attendees</th><th className="px-4 py-2 text-center font-semibold w-20">Sessions</th></tr></thead><tbody>{SESSION_TOPICS.map((t, i) => <tr key={t.id} className={`border-t ${i%2?'bg-neutral-50':''}`}><td className="px-4 py-2 font-medium">{t.name}</td><td className="px-4 py-2 text-xs text-neutral-600 hidden sm:table-cell">{t.attendees}</td><td className="px-4 py-2 text-center font-bold">{eSess[t.id]||0}</td></tr>)}<tr className="border-t-2 border-neutral-300 bg-neutral-100 font-bold"><td className="px-4 py-2">Total</td><td className="hidden sm:table-cell"></td><td className="px-4 py-2 text-center text-lg">{scope.tS}</td></tr></tbody></table></div></div>

      {scope.dL.length > 0 && <div><h2 className="text-base font-bold text-neutral-900 mb-2">Data Services</h2>{scope.dbFee && <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-semibold">DB fee required -- local system</div>}{scope.noData && <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900 font-semibold">Data import not available</div>}{scope.sysWarn && <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{scope.sysWarn}</div>}<div className="border border-neutral-200 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-neutral-100"><th className="px-4 py-2 text-left font-semibold">Service</th><th className="px-4 py-2 text-center font-semibold w-16">Qty</th><th className="px-4 py-2 text-center font-semibold w-20">Unit</th><th className="px-4 py-2 text-right font-semibold w-20">Total</th></tr></thead><tbody>{scope.dL.map((d,i) => <tr key={i} className="border-t"><td className="px-4 py-2">{d.name}<div className="text-xs text-neutral-400">{d.sku}</div></td><td className="px-4 py-2 text-center">{d.qty}</td><td className="px-4 py-2 text-center">${d.up.toLocaleString()}</td><td className="px-4 py-2 text-right font-medium">${d.total.toLocaleString()}</td></tr>)}<tr className="border-t-2 border-neutral-300 bg-neutral-100 font-bold"><td className="px-4 py-2" colSpan={3}>Data Subtotal</td><td className="px-4 py-2 text-right">${scope.dC.toLocaleString()}</td></tr></tbody></table></div></div>}

      <div className="p-5 bg-neutral-900 text-white rounded-xl"><h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">Pricing</h2><div className="space-y-3">
        <div className="flex justify-between"><span className="text-sm text-neutral-400">Professional Services ({scope.tH} hrs x ${asm.billRate})</span><span className="text-xl font-black">${scope.bP.toLocaleString()}</span></div>
        {scope.dC > 0 && <div className="flex justify-between"><span className="text-sm text-neutral-400">Data Services</span><span className="text-xl font-black">${scope.dC.toLocaleString()}</span></div>}
        {scope.oC > 0 && <div className="flex justify-between"><span className="text-sm text-neutral-400">Onsite ({onD}d x ${asm.onsiteRatePerDay.toLocaleString()})</span><span className="text-xl font-black">${scope.oC.toLocaleString()}</span></div>}
        {scope.trv > 0 && <div className="flex justify-between"><span className="text-sm text-neutral-400">Travel (as incurred)</span><span className="text-xl font-black">${scope.trv.toLocaleString()}</span></div>}
        <div className="pt-3 mt-3 border-t border-neutral-700 flex justify-between"><span className="text-neutral-300 font-semibold">Total at Bill Rate</span><span className="text-3xl font-black">${scope.gT.toLocaleString()}</span></div>
        <div className="flex justify-between text-neutral-500"><span className="text-xs">At {Math.round(asm.targetMargin*100)}% margin</span><span className="text-sm font-bold">${(scope.mP+scope.dC+scope.oC+scope.trv).toLocaleString()}</span></div>
      </div></div>

      {notes && <div><h2 className="text-base font-bold text-neutral-900 mb-2">Notes</h2><div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm whitespace-pre-wrap">{notes}</div></div>}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500 space-y-1"><div className="font-bold text-neutral-700 text-sm mb-1">Assumptions</div><p>Effort beyond scoped hours requires Change Order at ${asm.billRate}/hr. {Math.round(asm.contingency*100)}% contingency included. 50/50 fee schedule. Sessions expire 90 days after kickoff.</p><p>Generated: {new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`@media print { @page{size:letter;margin:.5in} body{background:white!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} .no-print{display:none!important} .min-h-screen{min-height:0!important;background:white!important} *{box-shadow:none!important} .sticky{position:static!important} }`}</style>
      <div className="border-b border-neutral-200 bg-white no-print"><div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center"><span className="text-white font-black text-xs">F</span></div><span className="font-bold text-neutral-900 text-sm">Fullbay</span><span className="text-neutral-300 mx-1">|</span><span className="text-sm text-neutral-600">Enterprise Scoping</span></div>
        <div className="flex items-center gap-3">
          {view==='results' && <><button type="button" onClick={() => setView('inputs')} className="text-xs text-neutral-600 hover:text-neutral-900 font-medium">Edit</button><button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button></>}
          <button type="button" onClick={reset} className="text-xs text-neutral-400 hover:text-red-600"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>
      </div></div>
      <div className="max-w-5xl mx-auto px-6 py-6">
        {view === 'inputs' && <><div className="flex items-center gap-3 mb-6"><div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center"><Calculator className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-bold text-neutral-900">Enterprise Scoping</h1><p className="text-xs text-neutral-500">Fill in details below. Hours and pricing update live.</p></div></div>{inputsContent}</>}
        {view === 'results' && resultsContent}
      </div>
    </div>
  );
}

function Pnl({ title, icon: Icon, children }) { const [o, setO] = useState(true); return (<div className="border border-neutral-200 rounded-xl bg-white overflow-hidden"><button type="button" onClick={() => setO(!o)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-neutral-600" /></div><span className="font-bold text-neutral-900 text-sm">{title}</span></div>{o ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}</button>{o && <div className="px-4 pb-4">{children}</div>}</div>); }
function NI({ label, value, onChange, min=0, hint }) { return (<div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{label}</label><div className="flex items-center gap-2"><button type="button" onClick={() => onChange(Math.max(min, value-1))} className="w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100"><Minus className="w-3 h-3" /></button><span className="text-lg font-bold text-neutral-900 min-w-[28px] text-center">{value}</span><button type="button" onClick={() => onChange(value+1)} className="w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100"><Plus className="w-3 h-3" /></button></div>{hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}</div>); }
function DT({ active, onClick, label, pts, desc }) { return (<button type="button" onClick={onClick} className={`p-3 border-2 rounded-lg text-left transition-all ${active ? 'border-red-500 bg-red-50' : 'border-neutral-200 hover:border-neutral-300'}`}><div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-neutral-900">{label}</span><div className="flex items-center gap-1.5">{active && <Check className="w-4 h-4 text-red-600" />}<span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">+{pts}</span></div></div><div className="text-xs text-neutral-500">{desc}</div></button>); }
function CI({ checked, onChange, label, sub }) { return (<label className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"><div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked ? 'bg-red-600 border-red-600' : 'border-neutral-300 bg-white'}`}>{checked && <Check className="w-3 h-3 text-white" />}</div><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" /><div><div className="text-sm font-medium text-neutral-900">{label}</div>{sub && <div className="text-xs text-neutral-500">{sub}</div>}</div></label>); }
function KC({ l, v, s, c, h }) { return (<div className={`p-3 rounded-xl border ${h ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-neutral-200'}`}><div className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${h ? 'text-red-200' : 'text-neutral-500'}`}>{l}</div><div className={`text-xl font-black ${h ? 'text-white' : ''}`} style={c ? { color: c } : {}}>{v}</div>{s && <div className={`text-xs ${h ? 'text-red-200' : 'text-neutral-400'}`}>{s}</div>}</div>); }
