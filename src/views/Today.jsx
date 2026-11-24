import { useRef } from 'react';
import { Pencil } from 'lucide-react';
import { WeekStrip, PgxBadge, PhoneLink, Empty } from '../components/ui.jsx';
import { organizer, categoryOf, isActive, todayIso, addDays, thShort, thLong, daysBetween, geneOf } from '../lib/data.js';

export function todayQueues(patients, today = todayIso()) {
  const due = [], over = [], soon = [], lab = [], card = [], waiting = [];
  patients.forEach((p) => {
    if (categoryOf(p) === 'started') {
      if (!isActive(p)) return;
      organizer(p, today).forEach((c) => {
        if (c.state === 'due') due.push({ p, c });
        else if (c.state === 'over') over.push({ p, c });
        else if (c.state === 'later' && c.date <= addDays(today, 7)) soon.push({ p, c });
      });
    } else {
      if (p.pgxResult === 'Waiting') waiting.push(p);
      else if (p.notifyStatus !== 'โทรแจ้งผลแล้ว') lab.push(p);
      if (p.pgxResult === 'Positive' && (!p.allergyCardIssued || !p.posImedRecorded)) card.push(p);
    }
  });
  over.sort((a, b) => a.c.date.localeCompare(b.c.date));
  soon.sort((a, b) => a.c.date.localeCompare(b.c.date));
  return { due, over, soon, lab, card, waiting };
}

function PatientCell({ p, gene = true }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="pt-name">{p.name}</div>
      <div className="pt-meta"><span>HN {p.hn}</span></div>
      {gene && (
        <div className="pt-gene">
          <span className="muted">{geneOf(p.drug)}</span>
          <PgxBadge value={p.pgxResult} />
        </div>
      )}
    </div>
  );
}

function CallRow({ p, c, onPick, onEdit, when }) {
  return (
    <div className="q-row">
      <PatientCell p={p} />
      <div style={{ minWidth: 0 }}>
        <PhoneLink phone={p.phone} />
        <div className="q-when muted">{when}</div>
      </div>
      <div className="q-org"><WeekStrip patient={p} onPick={(w) => onPick(p, w)} /></div>
      <div className="row-actions">
        <button className="btn btn-primary btn-sm" onClick={() => onPick(p, c.id)}>บันทึก {c.label}</button>
        <button className="icon-btn" onClick={() => onEdit(p)} aria-label={`แก้ไขข้อมูล ${p.name}`}><Pencil size={16} /></button>
      </div>
    </div>
  );
}

export default function Today({ patients, onPick, onEdit, onGo }) {
  const today = todayIso();
  const q = todayQueues(patients, today);
  const overRef = useRef(null);
  const labRef = useRef(null);
  const jump = (r) => r.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const headline = q.due.length
    ? <>วันนี้ต้องโทรติดตาม <em>{q.due.length} ราย</em></>
    : q.over.length ? <>วันนี้ไม่มีคิวใหม่ แต่ค้างโทร <em style={{ color: 'var(--over)' }}>{q.over.length} ราย</em></>
    : <>วันนี้ไม่มีคิวโทรติดตาม</>;

  return (
    <>
      <header className="today-head">
        <div className="today-title">
          <p className="date">{thLong(today)}</p>
          <h1>{headline}</h1>
          <p className="sub">กดปุ่ม “บันทึก” หรือช่อง W เพื่อเปิดแบบบันทึกของผู้ป่วย</p>
        </div>
        <div className="today-stats">
          {[
            { n: q.over.length, label: 'เกินกำหนด', alert: true, go: () => jump(overRef) },
            { n: q.lab.length, label: 'ผลแล็บออกแล้ว รอโทรแจ้ง', alert: true, go: () => jump(labRef) },
            { n: q.card.length, label: 'Positive ยังไม่ให้บัตร / ไม่บันทึก IMED', alert: true, go: () => jump(labRef) },
            { n: q.waiting.length, label: 'รอผลตรวจยีน', go: () => onGo('lab') },
          ].map((s) => (
            <button key={s.label} type="button" className={`stat${s.n === 0 ? ' zero' : s.alert ? ' alert' : ''}`} onClick={s.go} disabled={s.n === 0}>
              <b>{s.n}</b>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="stack">
        <section aria-labelledby="h-due">
          <div className="section-title">
            <h2 id="h-due">ต้องโทรวันนี้<span className="n">{q.due.length}</span></h2>
          </div>
          {q.due.length === 0 ? (
            <div className="queue"><Empty title="ไม่มีคิวโทรวันนี้">ผู้ป่วยที่ถึงกำหนด W1–W9 วันนี้จะขึ้นที่นี่</Empty></div>
          ) : (
            <div className="queue">
              {q.due.map(({ p, c }) => (
                <CallRow key={p.id + c.id} p={p} c={c} onPick={onPick} onEdit={onEdit} when={`${c.label} ครบ ${c.day} วัน · ${p.drug}`} />
              ))}
            </div>
          )}
        </section>

        {q.over.length > 0 && (
          <section aria-labelledby="h-over" ref={overRef} style={{ scrollMarginTop: 84 }}>
            <div className="section-title over"><h2 id="h-over">เกินกำหนด<span className="n">{q.over.length}</span></h2></div>
            <div className="queue">
              {q.over.map(({ p, c }) => (
                <CallRow key={p.id + c.id} p={p} c={c} onPick={onPick} onEdit={onEdit}
                  when={`${c.label} กำหนด ${thShort(c.date)} · เลยมา ${daysBetween(c.date, today)} วัน`} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="h-lab" ref={labRef} style={{ scrollMarginTop: 84 }}>
          <div className="section-title">
            <h2 id="h-lab">ผลแล็บที่ต้องแจ้ง<span className="n">{q.lab.length + q.card.filter((p) => !q.lab.includes(p)).length}</span></h2>
            <button className="btn btn-quiet btn-sm" onClick={() => onGo('lab')}>ดูแล็บทั้งหมด</button>
          </div>
          {q.lab.length === 0 && q.card.length === 0 ? (
            <div className="queue"><Empty title="แจ้งผลแล็บครบแล้ว">เมื่อผลตรวจยีนออก รายชื่อจะขึ้นที่นี่จนกว่าจะโทรแจ้งผู้ป่วย</Empty></div>
          ) : (
            <div className="queue">
              {[...new Set([...q.lab, ...q.card])].map((p) => (
                <div className="q-row lab-row" key={p.id}>
                  <PatientCell p={p} gene={false} />
                  <PhoneLink phone={p.phone} />
                  <div className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <PgxBadge value={p.pgxResult} /> {p.drug} · {geneOf(p.drug)} · ผลออก {thShort(p.labResultDate)}
                    {p.pgxResult === 'Positive' && !p.allergyCardIssued && <span className="badge over">ยังไม่ได้ให้บัตรแพ้ยา</span>}
                    {p.pgxResult === 'Positive' && !p.posImedRecorded && <span className="badge over">ยังไม่บันทึก IMED</span>}
                  </div>
                  <div className="row-actions"><button className="btn btn-secondary btn-sm" onClick={() => onEdit(p)}>บันทึกการแจ้งผล</button></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {q.soon.length > 0 && (
          <section aria-labelledby="h-soon">
            <div className="section-title">
              <h2 id="h-soon">7 วันข้างหน้า<span className="n">{q.soon.length}</span></h2>
              <button className="btn btn-quiet btn-sm" onClick={() => onGo('calendar')}>เปิดปฏิทิน</button>
            </div>
            <div className="queue">
              {q.soon.map(({ p, c }) => (
                <div className="q-row" key={p.id + c.id}>
                  <PatientCell p={p} />
                  <div><PhoneLink phone={p.phone} /><div className="q-when muted">{c.label} · {thShort(c.date)} · อีก {daysBetween(today, c.date)} วัน</div></div>
                  <div className="q-org"><WeekStrip patient={p} onPick={(w) => onPick(p, w)} /></div>
                  <div />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
