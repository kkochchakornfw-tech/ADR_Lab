import { useEffect, useState } from 'react';
import { PhoneMissed, CalendarClock, RotateCcw } from 'lucide-react';
import {
  CHANNELS, ADR_OUTCOMES, COMPLIANCE, MONITOR_NORMAL, MONITOR_SYMPTOMS, chipsOf, toggleChip, symptomsOf,
  addDays, thShort, thDate, todayIso, daysBetween, lastPharmacist, channelTh,
} from '../lib/data.js';

function Chip({ on, tone, onClick, children }) {
  return (
    <button type="button" className={`chip-pick${tone ? ` tone-${tone}` : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * One follow-up week as a card, laid out like the original paper-style form:
 * channel · informant · ADR result · pharmacist, then compliance and ADR-monitor chips that
 * write into the note.
 */
export function WeekCard({ wk, cell, value, onChange, idPrefix }) {
  const today = todayIso();
  const recorded = cell.state === 'done';
  const future = !recorded && cell.date > today;
  const [open, setOpen] = useState(!future);
  useEffect(() => { setOpen(!future); }, [future, wk.id]);

  /* Any edit marks the week as recorded and fills today's date and the last pharmacist. */
  const edit = (patch) => onChange({
    ...value,
    ...patch,
    done: true,
    callDate: patch.callDate ?? (value.callDate || today),
    pharm: patch.pharm ?? (value.done ? value.pharm : (value.pharm || lastPharmacist())),
  });
  const picked = chipsOf(value.note);
  const pick = (v) => edit({ note: toggleChip(value.note, v) });
  const symptoms = symptomsOf(value);
  const late = cell.state === 'over' ? daysBetween(cell.date, today) : 0;

  const status = recorded
    ? <span className="wk-status done">บันทึกแล้ว {value.callDate ? thShort(value.callDate) : ''}</span>
    : cell.state === 'due' ? <span className="wk-status due">โทรวันนี้</span>
    : cell.state === 'over' ? <span className="wk-status over">เกินกำหนด {late} วัน</span>
    : cell.state === 'missed' ? <span className="wk-status">ไม่ได้ติดตาม</span>
    : <span className="wk-status">ยังไม่ถึงกำหนด</span>;

  return (
    <article className={`wk-card ${cell.state}`} id={`${idPrefix}-card`}>
      <header className="wk-card-head">
        <h4>{wk.label} <span>(Day {wk.day})</span></h4>
        {status}
        <span className="wk-due">
          กำหนดโทร {thDate(cell.date)}
          {cell.moved && <span className="moved-tag"> · เลื่อนจาก {thShort(cell.planned)}</span>}
        </span>
      </header>

      {!open ? (
        <div className="wk-wait">
          <span>ยังไม่ถึงกำหนดโทรติดตาม (ถึงกำหนดวันที่ {thDate(cell.date)})</span>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(true)}>บันทึกล่วงหน้า</button>
        </div>
      ) : (
        <>
          <div className="wk-grid">
            <fieldset className="wk-col">
              <legend>ช่องทางติดตาม</legend>
              {CHANNELS.map((c) => (
                <label key={c.value} className="opt">
                  <input type="radio" name={`${idPrefix}-ch`} checked={recorded && value.channel === c.value} onChange={() => edit({ channel: c.value })} />
                  {c.value}
                </label>
              ))}
              {value.channel === 'Others' && recorded && (
                <input className="input input-sm" placeholder="ระบุช่องทาง" aria-label="ระบุช่องทางอื่น" value={value.channelOther || ''} onChange={(e) => edit({ channelOther: e.target.value })} />
              )}
            </fieldset>

            <fieldset className="wk-col">
              <legend>ผู้ให้ข้อมูล</legend>
              <label className="opt"><input type="radio" name={`${idPrefix}-resp`} checked={recorded && value.resp !== 'relative'} onChange={() => edit({ resp: 'patient', rel: '' })} />ผู้ป่วย</label>
              <label className="opt"><input type="radio" name={`${idPrefix}-resp`} checked={recorded && value.resp === 'relative'} onChange={() => edit({ resp: 'relative' })} />ญาติ</label>
              {value.resp === 'relative' && recorded && (
                <input className="input input-sm" placeholder="ความสัมพันธ์ เช่น สามี" aria-label="ความสัมพันธ์" value={value.rel || ''} onChange={(e) => edit({ rel: e.target.value })} />
              )}
            </fieldset>

            <fieldset className="wk-col">
              <legend>ผล ADR / อาการ</legend>
              {ADR_OUTCOMES.map((o) => (
                <label key={o.value} className={`opt tone-${o.tone}`}>
                  <input type="radio" name={`${idPrefix}-adr`} checked={recorded && value.adr === o.value} onChange={() => edit({ adr: o.value })} />
                  {o.value}
                </label>
              ))}
            </fieldset>

            <div className="wk-col">
              <label className="wk-field">
                <span>เภสัชกรผู้ติดตาม</span>
                <input className="input input-sm" placeholder="เช่น ภญ.สายธาร" value={value.pharm || ''} onChange={(e) => edit({ pharm: e.target.value })} />
              </label>
              <label className="wk-field">
                <span>วันที่โทร</span>
                <input type="date" className="input input-sm" value={value.callDate || ''} max={today} onChange={(e) => edit({ callDate: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="wk-chips">
            <div className="chip-row">
              <span className="chip-label">Compliance</span>
              {COMPLIANCE.map((c) => (
                <Chip key={c.value} tone={c.tone} on={picked.includes(c.value)} onClick={() => pick(c.value)}>{c.label}</Chip>
              ))}
            </div>
            <div className="chip-row">
              <span className="chip-label">ADR monitor</span>
              <Chip tone="ok" on={picked.includes(MONITOR_NORMAL)} onClick={() => pick(MONITOR_NORMAL)}>{MONITOR_NORMAL}</Chip>
              {MONITOR_SYMPTOMS.map((s) => (
                <Chip key={s} tone="minor" on={picked.includes(s)} onClick={() => pick(s)}>{s}</Chip>
              ))}
            </div>
            <textarea className="textarea" rows={2} placeholder="Note เพิ่มเติม…" aria-label={`บันทึก ${wk.label}`} value={value.note || ''} onChange={(e) => edit({ note: e.target.value })} />
            {symptoms.length > 0 && value.adr === 'No ADR' && (
              <div className="callout over">พบอาการ {symptoms.join(', ')} แต่ผล ADR ยังเป็น No ADR ตรวจสอบอีกครั้ง</div>
            )}
          </div>
        </>
      )}

      {!recorded && cell.state !== 'later' && <Reschedule value={value} onChange={onChange} planned={cell.planned} label={wk.label} />}
      {recorded && (
        <div className="wk-foot">
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => onChange({ ...value, done: false, pharm: '', note: '', callDate: '' })}>ล้างการบันทึก {wk.label}</button>
        </div>
      )}
    </article>
  );
}

/** Every call round of one patient, newest first: recorded results and no-answer attempts. */
export function CallHistory({ patient: p, cells }) {
  const rows = [];
  cells.forEach((c) => {
    const w = p[`${c.id}Data`] || {};
    if (c.state === 'done') rows.push({ key: c.id, wk: c.label, date: w.callDate || c.date, w });
    (w.tries || []).forEach((t, i) => rows.push({ key: `${c.id}-t${i}`, wk: c.label, date: t, miss: true }));
  });
  rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (!rows.length) return <p className="small muted" style={{ margin: 0 }}>ยังไม่มีการโทรติดตาม</p>;
  return (
    <div className="table-wrap">
      <table className="hist">
        <thead>
          <tr><th>รอบ</th><th>วันที่โทร</th><th>ผล</th><th>ช่องทาง / ผู้ให้ข้อมูล</th><th>บันทึก</th><th>เภสัชกร</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.miss ? 'miss' : ''}>
              <td><b>{r.wk}</b></td>
              <td className="tabular">{thDate(r.date)}</td>
              {r.miss ? (
                <td colSpan={4} className="muted">โทรไม่ติด · เลื่อนวันโทร</td>
              ) : (
                <>
                  <td><span className={`adr-pill tone-${(ADR_OUTCOMES.find((o) => o.value === r.w.adr) || ADR_OUTCOMES[0]).tone}`}>{r.w.adr}</span></td>
                  <td className="small">{channelTh(r.w)}<div className="muted">{r.w.resp === 'relative' ? `ญาติ${r.w.rel ? ` (${r.w.rel})` : ''}` : 'ผู้ป่วย'}</div></td>
                  <td className="hist-note">{r.w.note || '-'}</td>
                  <td className="small">{r.w.pharm || '-'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * No answer: move only this week's call date and log the attempt. Changes the draft;
 * it is stored when the sheet is saved.
 */
export function Reschedule({ value, onChange, planned, label }) {
  const today = todayIso();
  const [moving, setMoving] = useState(false);
  const [newDate, setNewDate] = useState(addDays(today, 1));
  useEffect(() => { setMoving(false); setNewDate(addDays(todayIso(), 1)); }, [label]);
  const tries = value.tries || [];
  const moved = !!(value.due && value.due !== planned);
  const apply = (due, noAnswer = true) => {
    onChange({ ...value, due: due === planned ? '' : due, tries: noAnswer ? [...tries, today] : tries });
    setMoving(false);
  };
  return (
    <div className={`reschedule${moving ? ' open' : ''}`}>
      {!moving ? (
        <div className="reschedule-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMoving(true)}>
            <PhoneMissed size={16} aria-hidden /> ไม่รับสาย · เลื่อนวันโทร
          </button>
          {tries.length > 0 && <span className="small muted">โทรไม่ติด {tries.length} ครั้ง ({tries.map(thShort).join(', ')})</span>}
          {moved && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => apply(planned, false)} style={{ marginLeft: 'auto' }}>
              <RotateCcw size={16} aria-hidden /> กลับเป็นวันเดิม {thShort(planned)}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reschedule-row">
            <CalendarClock size={16} aria-hidden className="muted" />
            <b>โทรใหม่วันที่</b>
            <input type="date" className="input" value={newDate} min={today} onChange={(e) => setNewDate(e.target.value)} aria-label={`วันโทรใหม่ของ ${label}`} autoFocus />
            <span className="quick">
              {[1, 2, 3].map((n) => {
                const d = addDays(today, n);
                return (
                  <button type="button" key={n} className={`qd${newDate === d ? ' on' : ''}`} aria-pressed={newDate === d} onClick={() => setNewDate(d)}>
                    {n === 1 ? 'พรุ่งนี้' : `อีก ${n} วัน`}
                  </button>
                );
              })}
            </span>
          </div>
          <div className="small muted">เลื่อนเฉพาะ {label} สัปดาห์อื่นยังโทรตามวันเดิม · กด “บันทึกการแก้ไข” เพื่อเก็บ</div>
          <div className="reschedule-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setMoving(false)}>ยกเลิก</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!newDate} onClick={() => apply(newDate)}>
              เลื่อนเป็น {newDate && thDate(newDate)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
