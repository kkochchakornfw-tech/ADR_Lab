import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, FlaskConical, Check } from 'lucide-react';
import { PhoneLink, Empty } from '../components/ui.jsx';
import { organizer, categoryOf, toIso, todayIso, thLong, MONTHS_TH, DAYS_TH_SHORT, thShort } from '../lib/data.js';

const firstName = (full = '') => {
  const cleaned = full.trim().replace(/^(นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|คุณ)\s*/, '');
  return 'คุณ' + (cleaned.split(/\s+/)[0] || cleaned);
};

export default function CalendarView({ patients, onPick }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = todayIso();
  const [sel, setSel] = useState(today);

  // date -> { calls: [{p, c}], labs: [p] }
  const index = useMemo(() => {
    const map = {};
    const at = (d) => (map[d] ||= { calls: [], labs: [] });
    patients.forEach((p) => {
      if (categoryOf(p) === 'started') {
        organizer(p, today).forEach((c) => {
          if (c.date && !['skip', 'hold'].includes(c.state)) at(c.date).calls.push({ p, c });
        });
      }
    });
    return map;
  }, [patients, today]);

  const waitingLabs = patients.filter((p) => categoryOf(p) === 'pending' && p.pgxResult === 'Waiting');
  // A Waiting lab shows on every day from the order date up to today.
  const labsOn = (d) => waitingLabs.filter((p) => (p.orderDate || '') <= d && d <= today);

  const first = new Date(ym.y, ym.m, 1).getDay();
  const total = new Date(ym.y, ym.m + 1, 0).getDate();
  const move = (dir) => setYm(({ y, m }) => {
    const d = new Date(y, m + dir, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const goToday = () => { setYm({ y: now.getFullYear(), m: now.getMonth() }); setSel(today); };

  const selCalls = index[sel]?.calls || [];
  const selLabs = labsOn(sel);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>ปฏิทินโทรติดตาม</h1>
          <p>คำนวณวันโทรอัตโนมัติ · Negative: Day 7, 14, 28 · Unknown/Positive: Day 7, 14, 21, 28, 63</p>
        </div>
      </header>

      <div className="cal-layout">
        <section className="panel">
          <div className="panel-head">
            <div className="cal-head">
              <h2>{MONTHS_TH[ym.m]} {ym.y + 543}</h2>
              <button className="icon-btn" onClick={() => move(-1)} aria-label="เดือนก่อน"><ChevronLeft size={16} /></button>
              <button className="icon-btn" onClick={() => move(1)} aria-label="เดือนถัดไป"><ChevronRight size={16} /></button>
              <button className="btn btn-secondary btn-sm" onClick={goToday}>วันนี้</button>
            </div>
            <div className="legend">
              <span className="chip w1"><i />W1</span><span className="chip w2"><i />W2</span><span className="chip w3"><i />W3</span><span className="chip w4"><i />W4</span><span className="chip w9"><i />W9</span><span className="chip lab"><i />รอผลยีน</span>
            </div>
          </div>
          <div className="cal-grid" role="grid" aria-label="ปฏิทินนัดโทร">
            {DAYS_TH_SHORT.map((d, i) => <div key={d} className={`cal-dow${i === 0 ? ' sun' : ''}`} role="columnheader">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={'b' + i} className="cal-day blank" aria-hidden />)}
            {Array.from({ length: total }, (_, i) => {
              const day = i + 1;
              const iso = toIso(new Date(ym.y, ym.m, day));
              const calls = index[iso]?.calls || [];
              const labs = labsOn(iso);
              const chips = calls.slice(0, 3);
              const more = calls.length - chips.length;
              return (
                <button
                  key={iso}
                  className={`cal-day${iso === today ? ' is-today' : ''}${iso < today ? ' past' : ''}`}
                  aria-pressed={sel === iso}
                  aria-label={`${thLong(iso)} · นัดโทร ${calls.length} ราย${labs.length ? ` · รอผลยีน ${labs.length} ราย` : ''}`}
                  onClick={() => setSel(iso)}
                >
                  <span className="dnum"><b>{day}</b></span>
                  {chips.map(({ p, c }) => (
                    <span key={p.id + c.id} className={`chip ${c.id} ${c.state === 'done' ? 'done' : c.state === 'over' ? 'over' : c.state === 'due' ? 'due' : ''}`}>
                      <i aria-hidden />{firstName(p.name)} {c.label}
                    </span>
                  ))}
                  {more > 0 && <span className="chip-more">+{more} ราย</span>}
                  {labs.length > 0 && <span className="chip lab"><i aria-hidden />รอผลยีน {labs.length}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="panel" aria-labelledby="day-title">
          <div className="panel-head"><h2 id="day-title">{thLong(sel)}</h2></div>
          <div className="panel-body">
            {selCalls.length === 0 && selLabs.length === 0 ? (
              <Empty title="ไม่มีคิวในวันนี้" />
            ) : (
              <div className="day-list">
                {selCalls.map(({ p, c }) => (
                  <div className={`day-item ${c.id}`} key={p.id + c.id}>
                    <span className="sw" aria-hidden />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">{p.name} <span className="muted" style={{ fontWeight: 500 }}>· {c.label}</span></div>
                      <PhoneLink phone={p.phone} />
                      <div className="small muted">{p.drug} · {p.pgxResult}{c.state === 'done' ? ` · ${c.data.adr}` : ''}</div>
                    </div>
                    <button className={`btn btn-sm ${c.state === 'done' ? 'btn-quiet' : 'btn-primary'}`} onClick={() => onPick(p, c.id)}>
                      {c.state === 'done' ? 'ดู/แก้' : 'บันทึก'}
                    </button>
                  </div>
                ))}
                {selLabs.map((p) => (
                  <div className="day-item" key={p.id}>
                    <span className="sw lab" aria-hidden />
                    <div>
                      <div className="t">{p.name} <span className="muted" style={{ fontWeight: 500 }}>· รอผลยีน</span></div>
                      <PhoneLink phone={p.phone} />
                      <div className="small muted">{p.drug} · ส่งตรวจ {thShort(p.orderDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
