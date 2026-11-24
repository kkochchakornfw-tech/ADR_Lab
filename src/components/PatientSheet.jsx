import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Dna, User, ClipboardCheck, IdCard, CalendarClock, FileWarning, History } from 'lucide-react';
import { useDialog, Field, PhoneLink } from './ui.jsx';
import { WeekCard, CallHistory } from './WeekForm.jsx';
import {
  blankPatient, emptyWeek, categoryOf, scheduledWeeks, WEEKS, DRUGS, ADR_OUTCOMES, STATUSES, statusLabel,
  todayIso, worstAdr, isRecorded, organizer, thDate,
} from '../lib/data.js';

const val = (v) => (v === '-' || v === 'N/A' ? '' : v || '');

function toDraft(p) {
  const d = { ...blankPatient(), ...p };
  d.patientCategory = categoryOf(p);
  ['startDate', 'labResultDate', 'notifyDate', 'notifyPharm', 'orderDate', 'dob'].forEach((k) => { d[k] = val(d[k]); });
  if (d.regimen === 'N/A' || (d.regimen || '').startsWith('N/A')) d.regimen = '';
  if (!d.notifyStatus || d.notifyStatus === 'N/A') d.notifyStatus = 'ยังไม่ได้แจ้ง';
  if (!d.refusalType || d.refusalType === 'N/A') d.refusalType = 'PhysicianRefusal';
  if (!d.keyOccurrence || d.keyOccurrence === 'N/A') d.keyOccurrence = 'Key Occurrence เรียบร้อยแล้ว';
  if (!d.imedRecorded || d.imedRecorded === 'N/A') d.imedRecorded = 'บันทึกแล้ว';
  if (!d.signedForm || d.signedForm === 'N/A') d.signedForm = 'เซ็นเรียบร้อย';
  WEEKS.forEach((w) => {
    const k = `${w.id}Data`;
    const legacy = p[w.id];
    d[k] = { ...emptyWeek(), ...(p[k] || (legacy ? { note: legacy } : {})) };
    d[k].done = isRecorded(d[k]);
  });
  return d;
}

/** Same stored shape as the original app, so data stays compatible. */
function fromDraft(d) {
  const started = d.patientCategory === 'started';
  const pgx = d.pgxResult;
  const ref = pgx === 'Unknown' ? d.refusalType : 'N/A';
  return {
    ...d,
    regimen: started ? d.regimen : 'N/A',
    startDate: started ? d.startDate : '-',
    orderingDoctor: d.orderingDoctor || 'ไม่ระบุแพทย์',
    orderDate: d.orderDate || todayIso(),
    allergyCardIssued: pgx === 'Positive' ? !!d.allergyCardIssued : false,
    posImedRecorded: pgx === 'Positive' ? !!d.posImedRecorded : false,
    allergyCardDoctor: pgx === 'Positive' ? d.allergyCardDoctor || '' : '',
    allergyCardNote: pgx === 'Positive' ? d.allergyCardNote || '' : '',
    posImedDoctor: pgx === 'Positive' ? d.posImedDoctor || '' : '',
    posImedNote: pgx === 'Positive' ? d.posImedNote || '' : '',
    posImedBy: pgx === 'Positive' && d.posImedRecorded ? d.posImedBy || '' : '',
    posImedAt: pgx === 'Positive' && d.posImedRecorded ? d.posImedAt || '' : '',
    allergyCardBy: pgx === 'Positive' && d.allergyCardIssued ? d.allergyCardBy || '' : '',
    allergyCardAt: pgx === 'Positive' && d.allergyCardIssued ? d.allergyCardAt || '' : '',
    labName: started ? d.labName || '' : d.labName,
    expectedResultDate: pgx === 'Waiting' || !started ? d.expectedResultDate || '' : '',
    labResultDate: started ? '-' : d.labResultDate,
    notifyStatus: started ? 'N/A' : d.notifyStatus,
    notifyPharm: started ? 'N/A' : d.notifyPharm,
    notifyDate: started ? '-' : d.notifyDate,
    refusalType: ref,
    docReason: ref === 'PhysicianRefusal' ? d.docReason : '',
    keyOccurrence: ref === 'PhysicianRefusal' ? d.keyOccurrence : 'N/A',
    patReason: ref === 'PatientRefusal' ? d.patReason : '',
    imedRecorded: ref === 'PatientRefusal' ? d.imedRecorded : 'N/A',
    signedForm: ref === 'PatientRefusal' ? d.signedForm : 'N/A',
  };
}

export default function PatientSheet({ user, open, patient, focusWeek, onClose, onSave }) {
  const ref = useDialog(open, onClose, { animatedClose: true });
  const [d, setD] = useState(() => toDraft(blankPatient()));
  const [tried, setTried] = useState(false);
  const isEdit = !!patient;

  useEffect(() => {
    if (!open) return;
    setD(toDraft(patient || blankPatient()));
    setTried(false);
    if (focusWeek) {
      const t = setTimeout(() => (document.getElementById(`form-${focusWeek}-card`) || followRef.current)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 260);
      return () => clearTimeout(t);
    }
  }, [open, patient, focusWeek]);
  const followRef = useRef(null);

  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const started = d.patientCategory === 'started';
  const gene = DRUGS[d.drug]?.gene;
  const sched = scheduledWeeks(d.pgxResult);
  const showFollow = started && d.pgxResult !== 'Waiting';

  const setCategory = (c) => setD((s) => ({
    ...s,
    patientCategory: c,
    pgxResult: c === 'pending' ? 'Waiting' : (s.pgxResult === 'Waiting' ? 'Negative' : s.pgxResult),
  }));

  const errors = useMemo(() => {
    const e = {};
    if (!d.hn.trim()) e.hn = 'กรอก HN';
    if (!d.name.trim()) e.name = 'กรอกชื่อผู้ป่วย';
    if (!d.phone.trim()) e.phone = 'กรอกเบอร์โทร';
    if (started && !d.regimen.trim()) e.regimen = 'กรอกขนาดและวิธีใช้';
    if (started && !d.startDate) e.startDate = 'เลือกวันที่เริ่มยา';
    return e;
  }, [d, started]);

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) {
      const first = e.currentTarget.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    onSave(fromDraft(d));
  };

  const err = (k) => (tried ? errors[k] : undefined);
  /** Who ticked an action: kept from the saved record when it was already done, otherwise the logged-in account. Not editable. */
  const stampOf = (k, by, at, isOn = Boolean) => (patient && isOn(patient[k]) && val(patient[by])
    ? { [by]: patient[by], [at]: val(patient[at]) || todayIso() }
    : { [by]: user?.name || '', [at]: todayIso() });
  const posActs = started ? [d.posImedRecorded, d.allergyCardIssued] : [d.posImedRecorded, d.notifyStatus === 'โทรแจ้งผลแล้ว', d.allergyCardIssued];
  const posDone = posActs.filter(Boolean).length;
  const worst = worstAdr(d);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title">
      <form onSubmit={submit} noValidate style={{ display: 'contents' }}>
        <div className="sheet-head">
          <h2 id="sheet-title">{isEdit ? `แก้ไขข้อมูล · ${patient.name}` : 'เพิ่มผู้ป่วยใหม่'}</h2>
          <button type="button" className="icon-btn x" onClick={onClose} aria-label="ปิด"><X size={16} /></button>
        </div>

        <div className="sheet-body">
          <div className="choice-cards" role="radiogroup" aria-label="ประเภทเคส">
            <label className="choice">
              <input type="radio" name="cat" checked={started} onChange={() => setCategory('started')} />
              <span><b>เริ่มยาแล้ว</b><small>ติดตาม ADR รายสัปดาห์ตามผลยีน</small></span>
            </label>
            <label className="choice">
              <input type="radio" name="cat" checked={!started} onChange={() => setCategory('pending')} />
              <span><b>ส่งตรวจยีนแล้ว ยังไม่เริ่มยา</b><small>ติดตามผลแล็บและโทรแจ้งผล</small></span>
            </label>
          </div>

          <section className="fs">
            <h3><User size={16} aria-hidden /> ข้อมูลผู้ป่วยและยา</h3>
            <div className="grid-3">
              <Field label="HN" required error={err('hn')}>
                <input className="input tabular" value={d.hn} onChange={(e) => set('hn', e.target.value)} placeholder="67-13-027371" aria-invalid={!!err('hn')} />
              </Field>
              <Field label="ชื่อ-นามสกุล" required error={err('name')}>
                <input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!err('name')} />
              </Field>
              <Field label="วันเดือนปีเกิด">
                <input type="date" className="input" value={d.dob} onChange={(e) => set('dob', e.target.value)} />
              </Field>
              <Field label="เบอร์โทรศัพท์" required error={err('phone')}>
                <input className="input tabular" inputMode="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08x-xxx-xxxx" aria-invalid={!!err('phone')} />
              </Field>
              <Field label="ตัวยา" required>
                <select className="select" value={d.drug} onChange={(e) => set('drug', e.target.value)}>
                  {Object.entries(DRUGS).map(([k, v]) => <option key={k} value={k}>{k} ({v.gene})</option>)}
                </select>
              </Field>
              {started ? (
                <Field label="วันที่เริ่มทานยา" required error={err('startDate')}>
                  <input type="date" className="input" value={d.startDate} onChange={(e) => set('startDate', e.target.value)} aria-invalid={!!err('startDate')} />
                </Field>
              ) : (
                <Field label="วันที่เริ่มทานยา">
                  <input className="input" disabled value="ยังไม่เริ่มยา" />
                </Field>
              )}
              {started && (
                <Field label="ขนาดและวิธีใช้" required error={err('regimen')} className="span-3">
                  <input className="input" value={d.regimen} onChange={(e) => set('regimen', e.target.value)} placeholder="เช่น 100 mg วันละ 1 ครั้ง หลังอาหารเช้า" aria-invalid={!!err('regimen')} />
                </Field>
              )}
            </div>
          </section>

          <section className="fs">
            <h3><Dna size={16} aria-hidden /> การตรวจยีน {gene}</h3>
            <div className="grid-3">
              <Field label={started ? 'แพทย์ผู้สั่งใช้ยา' : 'แพทย์ผู้ส่งตรวจ'}>
                <input className="input" value={d.orderingDoctor === 'ไม่ระบุแพทย์' ? '' : d.orderingDoctor} onChange={(e) => set('orderingDoctor', e.target.value)} placeholder="เช่น นพ.สมชาย รักดี" />
              </Field>
              <Field label={started ? 'วันที่แพทย์สั่งยา' : 'วันที่ส่งตรวจ'}>
                <input type="date" className="input" value={d.orderDate} onChange={(e) => set('orderDate', e.target.value)} />
              </Field>
              <Field label="ผลตรวจยีน" required>
                <select className="select" value={d.pgxResult} onChange={(e) => set('pgxResult', e.target.value)}>
                  <option value="Negative">Negative — ตรวจแล้ว ไม่พบยีนเสี่ยง</option>
                  <option value="Unknown">Unknown — ไม่ได้ตรวจยีน</option>
                  <option value="Waiting">Waiting — รอผลตรวจ</option>
                  <option value="Positive">Positive — พบยีนแพ้ยา</option>
                </select>
              </Field>
            </div>
            {started && (
              <p className="note-line" style={{ marginTop: 12 }}>
                {d.pgxResult === 'Negative' && 'ตารางติดตาม: W1 (Day 7), W2 (Day 14), W4 (Day 28)'}
                {d.pgxResult === 'Unknown' && 'ตารางติดตาม: W1, W2, W3, W4 และ W9 (Day 63)'}
                {d.pgxResult === 'Waiting' && 'ยังไม่เริ่มบันทึกการติดตามจนกว่าผลยีนจะออก'}
                {d.pgxResult === 'Positive' && 'ตารางติดตาม: W1, W2, W3, W4 และ W9 (Day 63)'}
              </p>
            )}

            {!started && (
              <div className="grid-4" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <Field label="วันที่ผลตรวจออก">
                  <input type="date" className="input" value={d.labResultDate} onChange={(e) => set('labResultDate', e.target.value)} />
                </Field>
                <Field label="สถานะโทรแจ้งผล">
                  <select className="select" value={d.notifyStatus} onChange={(e) => {
                    const v = e.target.value;
                    setD((s) => ({
                      ...s,
                      notifyStatus: v,
                      ...(v === 'โทรแจ้งผลแล้ว' ? stampOf('notifyStatus', 'notifyPharm', 'notifyDate', (x) => x === 'โทรแจ้งผลแล้ว') : { notifyPharm: '', notifyDate: '' }),
                    }));
                  }}>
                    <option value="ยังไม่ได้แจ้ง">ยังไม่ได้แจ้ง</option>
                    <option value="โทรแจ้งผลแล้ว">โทรแจ้งผลแล้ว</option>
                  </select>
                </Field>
                <Field label="เภสัชกรผู้แจ้งผล">
                  <input className="input" readOnly value={d.notifyPharm} placeholder="ใส่ชื่ออัตโนมัติเมื่อเลือก “โทรแจ้งผลแล้ว”" title="บันทึกตามบัญชีที่ล็อกอิน แก้ไขไม่ได้" />
                </Field>
                <Field label="วันที่แจ้งผล">
                  <input type="date" className="input" value={d.notifyDate} onChange={(e) => set('notifyDate', e.target.value)} />
                </Field>
              </div>
            )}
          </section>

          {d.pgxResult === 'Positive' && (
            <section className="fs danger">
              <h3 style={{ color: 'var(--over-ink)' }}>
                <IdCard size={16} aria-hidden /> Action กรณี Positive · พบยีนแพ้ยา {gene}
                <span className="pos-act-count">{posDone}/{posActs.length}</span>
              </h3>
              <div className="pos-acts">
                {[
                  { k: 'posImedRecorded', by: 'posImedBy', at: 'posImedAt', note: 'posImedNote', icon: ClipboardCheck, label: 'ลงบันทึกใน IMED', ph: 'เช่น บันทึก HLA-B positive ในประวัติแพ้ยา' },
                  { k: 'allergyCardIssued', by: 'allergyCardBy', at: 'allergyCardAt', note: 'allergyCardNote', icon: IdCard, label: 'ให้บัตรแพ้ยา', ph: 'เช่น ให้บัตรที่ห้องยา OPD' },
                ].map(({ k, by, at, note, icon: Icon, label, ph }) => (
                  <div key={k} className={`pos-act${d[k] ? ' on' : ''}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!d[k]}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setD((s) => ({
                            ...s,
                            [k]: on,
                            ...(on ? stampOf(k, by, at) : { [by]: '', [at]: '' }),
                          }));
                        }}
                      />
                      <Icon size={16} aria-hidden />
                      <span className="pos-act-l">
                        {label}
                        {d[k] && d[at] && <small>{thDate(d[at])}</small>}
                      </span>
                    </label>
                    <input className="input" readOnly aria-label={`ผู้บันทึก · ${label}`} value={d[k] ? d[by] || '' : ''} placeholder="ใส่ชื่ออัตโนมัติเมื่อติ้ก" title="บันทึกตามบัญชีที่ล็อกอิน แก้ไขไม่ได้" />
                    <input className="input" aria-label={`โน้ต · ${label}`} value={d[note] || ''} onChange={(e) => set(note, e.target.value)} placeholder={ph} />
                  </div>
                ))}
              </div>
              {!started && (
                <p className="note-line" style={{ marginTop: 8 }}>
                  {d.notifyStatus === 'โทรแจ้งผลแล้ว' ? 'โทรแจ้งผลผู้ป่วยแล้ว' : 'ยังไม่ได้โทรแจ้งผลผู้ป่วย (ตั้งค่าที่ “สถานะโทรแจ้งผล” ด้านบน)'}
                  {' · '}KPI นับเมื่อโทรแจ้งผลและบันทึก IMED ครบทั้ง 2 อย่าง
                </p>
              )}
            </section>
          )}

          {d.pgxResult === 'Unknown' && (
            <section className="fs">
              <h3><FileWarning size={16} aria-hidden /> สาเหตุที่ไม่ได้ตรวจยีน</h3>
              <div className="radio-row" role="radiogroup" aria-label="สาเหตุที่ไม่ได้ตรวจยีน" style={{ marginBottom: 12 }}>
                <label className="radio-pill"><input type="radio" name="ref" checked={d.refusalType === 'PhysicianRefusal'} onChange={() => set('refusalType', 'PhysicianRefusal')} />แพทย์ปฏิเสธการตรวจยีน</label>
                <label className="radio-pill"><input type="radio" name="ref" checked={d.refusalType === 'PatientRefusal'} onChange={() => set('refusalType', 'PatientRefusal')} />ผู้ป่วยปฏิเสธการตรวจยีน</label>
              </div>
              {d.refusalType === 'PhysicianRefusal' ? (
                <div className="grid-2">
                  <Field label="เหตุผลประกอบของแพทย์">
                    <input className="input" value={d.docReason} onChange={(e) => set('docReason', e.target.value)} placeholder="เช่น จำเป็นต้องเริ่มยาด่วน / เคยใช้ยาแล้ว" />
                  </Field>
                  <Field label="การ Key Occurrence">
                    <select className="select" value={d.keyOccurrence} onChange={(e) => set('keyOccurrence', e.target.value)}>
                      <option>Key Occurrence เรียบร้อยแล้ว</option>
                      <option>ยังไม่ Key Occurrence</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="grid-3">
                  <Field label="เหตุผลของผู้ป่วย">
                    <input className="input" value={d.patReason} onChange={(e) => set('patReason', e.target.value)} placeholder="เช่น ไม่สมัครใจตรวจ / ค่าใช้จ่าย" />
                  </Field>
                  <Field label="การบันทึกระบบ IMED">
                    <select className="select" value={d.imedRecorded} onChange={(e) => set('imedRecorded', e.target.value)}>
                      <option value="บันทึกแล้ว">แพทย์บันทึก IMED “ผู้ป่วยปฏิเสธการตรวจ {gene}” แล้ว</option>
                      <option value="ยังไม่ได้บันทึก">ยังไม่ได้บันทึกในระบบ IMED</option>
                    </select>
                  </Field>
                  <Field label="หนังสือแสดงเจตจำนงไม่รับการรักษา">
                    <select className="select" value={d.signedForm} onChange={(e) => set('signedForm', e.target.value)}>
                      <option value="เซ็นเรียบร้อย">ผู้ป่วยลงชื่อในหนังสือแล้ว</option>
                      <option value="ยังไม่ได้เซ็น">ยังไม่ได้ลงชื่อ</option>
                    </select>
                  </Field>
                </div>
              )}
            </section>
          )}

          {showFollow && (
            <section className="fs">
              <h3><History size={16} aria-hidden /> ประวัติการโทรติดตาม</h3>
              <CallHistory patient={d} cells={d.startDate ? organizer(d).filter((c) => c.state !== 'skip') : []} />
            </section>
          )}

          {showFollow && (
            <section className="fs" ref={followRef} style={{ scrollMarginTop: 8 }}>
              <div className="wk-section-head">
                <h3><CalendarClock size={16} aria-hidden /> บันทึกผลการติดตามรายสัปดาห์</h3>
                <span className="wk-plan">แผนติดตาม {d.pgxResult}: {sched.map((w) => w.toUpperCase()).join(', ')}</span>
                {d.phone && <PhoneLink phone={d.phone} />}
              </div>
              {!d.startDate ? (
                <div className="callout plain">เลือกวันที่เริ่มทานยาก่อน ระบบจะคำนวณวันโทรติดตามให้</div>
              ) : (
                <div className="wk-list">
                  {organizer(d).filter((c) => c.state !== 'skip').map((c) => (
                    <WeekCard
                      key={c.id}
                      wk={c}
                      cell={c}
                      idPrefix={`form-${c.id}`}
                      value={d[`${c.id}Data`]}
                      onChange={(v) => set(`${c.id}Data`, v)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {showFollow && (
            <section className="fs">
              <h3><ClipboardCheck size={16} aria-hidden /> สรุปผลและสถานะเคส</h3>
              <div className="grid-2">
                <Field label="สรุปผลภาพรวม">
                  <select className="select" value={d.adrSummary} onChange={(e) => set('adrSummary', e.target.value)}>
                    {ADR_OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.value} — {o.th}</option>)}
                  </select>
                </Field>
                <Field label="สถานะเคส">
                  <select className="select" value={d.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </Field>
              </div>
              {worst !== d.adrSummary && worst !== 'No ADR' && (
                <p className="note-line" style={{ marginTop: 8 }}>
                  ผลติดตามรายสัปดาห์พบ {worst}{' '}
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => set('adrSummary', worst)}>ใช้เป็นสรุปผล</button>
                </p>
              )}
              <Field label="บันทึกสรุปภาพรวม" className="" >
                <textarea className="textarea" rows={2} value={d.adrSummaryNote} onChange={(e) => set('adrSummaryNote', e.target.value)} placeholder="รายละเอียดเพิ่มเติมสำหรับสรุปผลภาพรวม" />
              </Field>
            </section>
          )}
        </div>

        <div className="sheet-foot">
          {tried && Object.keys(errors).length > 0 && (
            <span className="small" style={{ color: 'var(--over-ink)', marginRight: 'auto', alignSelf: 'center' }}>
              กรอกช่องที่มีเครื่องหมาย * ให้ครบ ({Object.keys(errors).length} ช่อง)
            </span>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary">{isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ป่วย'}</button>
        </div>
      </form>
    </dialog>
  );
}
