// Data layer: storage, protocol schedule, Thai date helpers, sample data.
// Storage key is shared with the original ADRedit.html so existing records carry over.

export const STORAGE_KEY = 'adr_app_patients_v5';
const PHARM_KEY = 'adr_app_last_pharmacist';

export const DRUGS = {
  Allopurinol: { gene: 'HLA-B*58:01', short: 'Allo' },
  Carbamazepine: { gene: 'HLA-B*15:02', short: 'Carba' },
};

export const WEEKS = [
  { id: 'w1', label: 'W1', day: 7 },
  { id: 'w2', label: 'W2', day: 14 },
  { id: 'w3', label: 'W3', day: 21 },
  { id: 'w4', label: 'W4', day: 28 },
  { id: 'w9', label: 'W9', day: 63 },
];

export const ADR_OUTCOMES = [
  { value: 'No ADR', th: 'ไม่พบอาการ', report: 'ผู้ป่วยปฏิเสธมีอาการไม่พึงประสงค์จากยา', tone: 'ok' },
  { value: 'Side effects', th: 'อาการข้างเคียง', report: 'เกิดอาการข้างเคียงจากยา', tone: 'side' },
  { value: 'Allergy (minor)', th: 'แพ้ยาไม่รุนแรง', report: 'สงสัยแพ้ยาชนิดไม่รุนแรง', tone: 'minor' },
  { value: 'Allergy (major)', th: 'แพ้ยารุนแรง', report: 'สงสัยแพ้ยาชนิดรุนแรง', tone: 'major' },
];
export const adrMeta = (v) => ADR_OUTCOMES.find((o) => o.value === v) || ADR_OUTCOMES[0];

/**
 * Quick-pick chips asked on every follow-up call (same as the original form).
 * Picking a chip writes its text at the front of the note, so the note stays the single record:
 * "กินยาสม่ำเสมอ, ปกติ, ทานยาต่อเนื่องได้".
 */
export const COMPLIANCE = [
  { value: 'กินยาสม่ำเสมอ', label: 'สม่ำเสมอ', tone: 'ok' },
  { value: 'กินยาไม่สม่ำเสมอ', label: 'ไม่สม่ำเสมอ', tone: 'side' },
  { value: 'หยุดยาเอง', label: 'หยุดยาเอง', tone: 'minor' },
];
export const MONITOR_NORMAL = 'ปกติ';
export const MONITOR_SYMPTOMS = ['ไข้', 'ปวดกล้ามเนื้อ', 'ปวดศีรษะ', 'ไอ', 'น้ำมูกไหล', 'เจ็บคอ', 'ผื่น'];
const CHIP_VALUES = [...COMPLIANCE.map((c) => c.value), MONITOR_NORMAL, ...MONITOR_SYMPTOMS];

const noteParts = (note) => (note || '').split(',').map((s) => s.trim()).filter(Boolean);
/** Chips currently picked in a note. */
export const chipsOf = (note) => noteParts(note).filter((s) => CHIP_VALUES.includes(s));
/** Toggle one chip in the note, keeping the free text. Compliance is single-choice; ปกติ excludes symptoms. */
export function toggleChip(note, value) {
  const parts = noteParts(note);
  const custom = parts.filter((s) => !CHIP_VALUES.includes(s));
  let picked = parts.filter((s) => CHIP_VALUES.includes(s));
  if (picked.includes(value)) picked = picked.filter((s) => s !== value);
  else {
    if (COMPLIANCE.some((c) => c.value === value)) picked = picked.filter((s) => !COMPLIANCE.some((c) => c.value === s));
    if (value === MONITOR_NORMAL) picked = picked.filter((s) => !MONITOR_SYMPTOMS.includes(s));
    if (MONITOR_SYMPTOMS.includes(value)) picked = picked.filter((s) => s !== MONITOR_NORMAL);
    picked.push(value);
  }
  picked.sort((a, b) => CHIP_VALUES.indexOf(a) - CHIP_VALUES.indexOf(b));
  return [...picked, ...custom].join(', ');
}
/** Symptoms picked in a week's note. */
export const symptomsOf = (w) => chipsOf(w && w.note).filter((s) => MONITOR_SYMPTOMS.includes(s));
/** Kept for the printed report: the note already carries the chips, so nothing extra to print. */
export const symptomText = () => '';

export const CHANNELS = [
  { value: 'Telephone', th: 'โทรศัพท์' },
  { value: 'OPD', th: 'ผู้ป่วยนอก (OPD)' },
  { value: 'IPD', th: 'ผู้ป่วยใน (IPD)' },
  { value: 'Others', th: 'อื่น ๆ' },
];
export const channelTh = (w) => {
  if (!w) return '-';
  if (w.channel === 'Others') return `อื่น ๆ (${w.channelOther || '-'})`;
  return (CHANNELS.find((c) => c.value === w.channel) || {}).th || w.channel || '-';
};

export const STATUSES = ['กำลังติดตาม', 'ปิดเคส', 'ปิดเคส ติดตามไม่ได้', 'หยุดยา/เปลี่ยนยา'];
export const statusLabel = (s) => (s === 'ปิดเคส' ? 'ปิดเคสสำเร็จ' : s);

export const PGX = {
  Negative: { th: 'Negative', tone: 'neg' },
  Unknown: { th: 'Unknown', tone: 'unk' },
  Waiting: { th: 'Waiting', tone: 'wait' },
  Positive: { th: 'Positive', tone: 'pos' },
};

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0');
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s) => {
  if (!s || s === '-' || typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
};
export const todayIso = () => toIso(new Date());
export const addDays = (iso, n) => {
  const d = parseIso(iso);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const daysBetween = (aIso, bIso) => {
  const a = parseIso(aIso), b = parseIso(bIso);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
};

export const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const MONTHS_TH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const DAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const DAYS_TH_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/** dd/mm/BBBB (Buddhist era) */
export const thDate = (iso) => {
  const d = parseIso(iso);
  if (!d) return '-';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543}`;
};
/** 5 ธ.ค. 69 */
export const thShort = (iso) => {
  const d = parseIso(iso);
  if (!d) return '-';
  return `${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}`;
};
export const thLong = (iso) => {
  const d = parseIso(iso);
  if (!d) return '-';
  return `วัน${DAYS_TH[d.getDay()]}ที่ ${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
};

// ---------- patient helpers ----------
export const categoryOf = (p) => p.patientCategory || (p.startDate === '-' ? 'pending' : 'started');
export const isActive = (p) => (p.status || 'กำลังติดตาม') === 'กำลังติดตาม';
export const geneOf = (drug) => (DRUGS[drug] || {}).gene || '';

/** Weeks the protocol schedules for this PGx result. Negative skips W3 and W9. */
export const scheduledWeeks = (pgx) => (pgx === 'Negative' ? ['w1', 'w2', 'w4'] : ['w1', 'w2', 'w3', 'w4', 'w9']);

/** A week counts as recorded when it was explicitly saved, or (legacy data) carries a pharmacist or note. */
export const isRecorded = (w) => !!(w && (w.done || (w.pharm && w.pharm.trim()) || (w.note && w.note.trim())));

/**
 * State of each compartment in a patient's organizer.
 * skip   – protocol does not schedule this week (lid closed)
 * hold   – PGx still Waiting, follow-up not started
 * done   – call recorded
 * due    – due today
 * over   – past due, not recorded, case still active
 * missed – past due, not recorded, case closed
 * later  – not due yet
 */
/**
 * Call date for one week. The protocol date comes from the start date; when the patient
 * did not pick up, the pharmacist can move just this week (`due`). Later weeks keep their
 * own protocol dates.
 */
export const plannedDate = (p, wk) => addDays(p.startDate, wk.day);
export const weekDate = (p, wk) => {
  const d = p[`${wk.id}Data`];
  return (d && d.due) || plannedDate(p, wk);
};

export function organizer(p, today = todayIso()) {
  const sched = scheduledWeeks(p.pgxResult);
  return WEEKS.map((wk) => {
    const data = p[`${wk.id}Data`] || null;
    const planned = plannedDate(p, wk);
    const date = weekDate(p, wk);
    const moved = !!(data && data.due && data.due !== planned);
    let state;
    if (!sched.includes(wk.id)) state = 'skip';
    else if (isRecorded(data)) state = 'done';
    else if (p.pgxResult === 'Waiting') state = 'hold';
    else if (!date) state = 'later';
    else if (date === today) state = 'due';
    else if (date < today) state = isActive(p) ? 'over' : 'missed';
    else state = 'later';
    return { ...wk, date, planned, moved, data, state };
  });
}

export const emptyWeek = () => ({ channel: 'Telephone', channelOther: '', resp: 'patient', rel: '', adr: 'No ADR', pharm: '', note: '', callDate: '', done: false });

/** Date the call actually happened; older records without one fall back to the scheduled date. */
export const callDateOf = (p, wk) => {
  const d = p[`${wk.id}Data`];
  return (d && d.callDate) || weekDate(p, wk);
};

export const blankPatient = () => ({
  id: uid(),
  patientCategory: 'started',
  hn: '', name: '', dob: '', phone: '',
  drug: 'Allopurinol', regimen: '', startDate: '',
  orderingDoctor: '', orderDate: '',
  pgxResult: 'Negative', allergyCardIssued: false, posImedRecorded: false, labName: '', expectedResultDate: '',
  allergyCardDoctor: '', allergyCardNote: '', posImedDoctor: '', posImedNote: '',
  allergyCardBy: '', allergyCardAt: '', posImedBy: '', posImedAt: '',
  labResultDate: '', notifyStatus: 'ยังไม่ได้แจ้ง', notifyPharm: '', notifyDate: '',
  refusalType: 'PhysicianRefusal', docReason: '', keyOccurrence: 'Key Occurrence เรียบร้อยแล้ว',
  patReason: '', imedRecorded: 'บันทึกแล้ว', signedForm: 'เซ็นเรียบร้อย',
  w1Data: emptyWeek(), w2Data: emptyWeek(), w3Data: emptyWeek(), w4Data: emptyWeek(), w9Data: emptyWeek(),
  adrSummary: 'No ADR', adrSummaryNote: '', status: 'กำลังติดตาม',
});

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Worst ADR seen across recorded weeks, used to suggest the case summary. */
export function worstAdr(p) {
  const order = ADR_OUTCOMES.map((o) => o.value);
  let worst = 0;
  WEEKS.forEach((wk) => {
    const w = p[`${wk.id}Data`];
    if (isRecorded(w)) worst = Math.max(worst, order.indexOf(w.adr));
  });
  return order[Math.max(0, worst)];
}

// ---------- storage ----------
export function loadPatients() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw)) return raw.map((p) => (p.id ? p : { ...p, id: uid() }));
  } catch { /* fall through */ }
  return null;
}
export function savePatients(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* storage full or blocked */ }
}
export const lastPharmacist = () => { try { return localStorage.getItem(PHARM_KEY) || ''; } catch { return ''; } };
export const rememberPharmacist = (n) => { try { if (n) localStorage.setItem(PHARM_KEY, n); } catch { /* ignore */ } };

// ---------- sample data (synthetic) ----------
export function samplePatients() {
  const t = todayIso();
  const d = (n) => addDays(t, n);
  const wk = (o = {}) => ({ ...emptyWeek(), ...o });
  const base = blankPatient;
  return [
    {
      ...base(), hn: '69-11-004812', name: 'นายสมชาย ใจดี', dob: '1965-04-15', phone: '081-234-5678',
      drug: 'Allopurinol', regimen: '100 mg รับประทานครั้งละ 1 เม็ด วันละ 1 ครั้ง หลังอาหารเช้า',
      startDate: d(-7), orderingDoctor: 'นพ.ประเสริฐ ศรีวิไล', orderDate: d(-7), pgxResult: 'Unknown',
      refusalType: 'PhysicianRefusal', docReason: 'เคยใช้ยา Allopurinol มาก่อนและมีอาการปวดข้อเฉียบพลัน จำเป็นต้องเริ่มยาทันที',
      notifyStatus: 'N/A', notifyPharm: 'N/A', notifyDate: '-', labResultDate: '-',
      adrSummaryNote: 'ผู้ป่วยเข้าใจคำแนะนำในการสังเกตอาการแพ้ยารุนแรง (SCARs) เป็นอย่างดี',
    },
    {
      ...base(), hn: '69-11-005190', name: 'นางสาววิภาดา สุขสันต์', dob: '1980-08-22', phone: '089-876-5432',
      drug: 'Carbamazepine', regimen: '200 mg รับประทานครั้งละ 1 เม็ด วันละ 2 ครั้ง เช้า-เย็น',
      startDate: d(-14), orderingDoctor: 'พญ.กมลวรรณ จิตต์งาม', orderDate: d(-16), pgxResult: 'Negative',
      notifyStatus: 'N/A', notifyPharm: 'N/A', notifyDate: '-', labResultDate: '-',
      w1Data: wk({ adr: 'Side effects', pharm: 'ภญ.สายธาร รักษ์ยา', note: 'กินยาสม่ำเสมอ, ปกติ, ง่วงซึมเล็กน้อยช่วง 3 วันแรก ปัจจุบันดีขึ้น ไม่มีผื่น', done: true }),
      adrSummary: 'Side effects', adrSummaryNote: 'ง่วงซึมช่วงเริ่มยา ไม่พบผื่นแพ้ยา',
    },
    {
      ...base(), hn: '69-10-003377', name: 'นายบุญเลิศ ทองคำ', dob: '1952-11-03', phone: '082-111-2299',
      drug: 'Allopurinol', regimen: '100 mg วันละ 1 ครั้ง หลังอาหารเช้า',
      startDate: d(-23), orderingDoctor: 'นพ.ประเสริฐ ศรีวิไล', orderDate: d(-24), pgxResult: 'Unknown',
      refusalType: 'PatientRefusal', patReason: 'ไม่สะดวกเรื่องค่าใช้จ่าย', imedRecorded: 'บันทึกแล้ว', signedForm: 'เซ็นเรียบร้อย',
      notifyStatus: 'N/A', notifyPharm: 'N/A', notifyDate: '-', labResultDate: '-',
      w1Data: wk({ pharm: 'ภก.ธีรวัฒน์ ใจงาม', note: 'กินยาสม่ำเสมอ, ปกติ, ไม่มีผื่น ไม่มีไข้', done: true }),
      w2Data: wk({ resp: 'relative', rel: 'บุตรสาว', pharm: 'ภก.ธีรวัฒน์ ใจงาม', note: 'กินยาสม่ำเสมอ, ปกติ, ทานยาต่อเนื่องได้', done: true }),
    },
    {
      ...base(), hn: '69-09-001845', name: 'นางมาลี ศรีสุข', dob: '1970-02-14', phone: '090-345-6712',
      drug: 'Carbamazepine', regimen: '200 mg วันละ 2 ครั้ง',
      startDate: d(-63), orderingDoctor: 'พญ.กมลวรรณ จิตต์งาม', orderDate: d(-66), pgxResult: 'Unknown',
      refusalType: 'PhysicianRefusal', docReason: 'ผู้ป่วยชักบ่อย จำเป็นต้องเริ่มยาด่วน', keyOccurrence: 'ยังไม่ Key Occurrence',
      notifyStatus: 'N/A', notifyPharm: 'N/A', notifyDate: '-', labResultDate: '-',
      w1Data: wk({ pharm: 'ภญ.สายธาร รักษ์ยา', note: 'กินยาสม่ำเสมอ, ปกติ', done: true }),
      w2Data: wk({ adr: 'Allergy (minor)', pharm: 'ภญ.สายธาร รักษ์ยา', note: 'กินยาสม่ำเสมอ, ผื่น, ผื่นแดงคันบริเวณแขน ไม่มีแผลในปาก แนะนำพบแพทย์', done: true }),
      w3Data: wk({ channel: 'OPD', pharm: 'ภญ.สายธาร รักษ์ยา', note: 'ผื่นยุบลงหลังได้ยาแก้แพ้', done: true }),
      w4Data: wk({ pharm: 'ภก.ธีรวัฒน์ ใจงาม', note: 'กินยาสม่ำเสมอ, ปกติ, ไม่มีอาการผิดปกติ', done: true }),
      adrSummary: 'Allergy (minor)', adrSummaryNote: 'ผื่นแพ้ยาไม่รุนแรงในสัปดาห์ที่ 2 หายดี',
    },
    {
      ...base(), patientCategory: 'pending', hn: '69-11-006305', name: 'นายวิชัย มั่นคง', dob: '1958-01-10', phone: '086-555-1234',
      drug: 'Allopurinol', regimen: 'N/A', startDate: '-', orderingDoctor: 'นพ.ธนกร วงศ์สุวรรณ', orderDate: d(-2),
      pgxResult: 'Waiting', labResultDate: '', notifyStatus: 'ยังไม่ได้แจ้ง',
    },
    {
      ...base(), patientCategory: 'pending', hn: '69-11-006011', name: 'นางสาวปิยะนุช แสงทอง', dob: '1991-06-30', phone: '087-220-4411',
      drug: 'Carbamazepine', regimen: 'N/A', startDate: '-', orderingDoctor: 'นพ.ธนกร วงศ์สุวรรณ', orderDate: d(-9),
      pgxResult: 'Positive', labResultDate: d(-1), notifyStatus: 'ยังไม่ได้แจ้ง', allergyCardIssued: false,
    },
    {
      ...base(), patientCategory: 'pending', hn: '69-10-005522', name: 'นายอนุชา พรหมมา', dob: '1975-09-09', phone: '085-998-1200',
      drug: 'Allopurinol', regimen: 'N/A', startDate: '-', orderingDoctor: 'พญ.ศิริพร เกษมสุข', orderDate: d(-12),
      pgxResult: 'Negative', labResultDate: d(-4), notifyStatus: 'โทรแจ้งผลแล้ว', notifyPharm: 'ภญ.สายธาร รักษ์ยา', notifyDate: d(-3),
    },
    {
      ...base(), patientCategory: 'pending', hn: '69-11-006420', name: 'นายสุรชัย ศรีงาม', dob: '1969-03-21', phone: '084-771-2093',
      drug: 'Allopurinol', regimen: 'N/A', startDate: '-', orderingDoctor: 'พญ.ศิริพร เกษมสุข', orderDate: d(-8),
      pgxResult: 'Positive', labResultDate: d(-3), notifyStatus: 'โทรแจ้งผลแล้ว', notifyPharm: 'ภญ.สายธาร รักษ์ยา', notifyDate: d(-2),
      allergyCardIssued: true, posImedRecorded: true,
      allergyCardDoctor: 'พญ.ศิริพร เกษมสุข', allergyCardNote: 'ให้บัตรที่ห้องยา OPD',
      posImedDoctor: 'พญ.ศิริพร เกษมสุข', posImedNote: 'บันทึก HLA-B*58:01 positive',
      allergyCardBy: 'ภญ.สายธาร รักษ์ยา', allergyCardAt: d(-2), posImedBy: 'ภญ.สายธาร รักษ์ยา', posImedAt: d(-2),
    },
  ];
}
