import { useMemo, useState } from 'react';
import { Pill, Stethoscope, BarChart3 } from 'lucide-react';
import { categoryOf, MONTHS_TH, todayIso, geneOf } from '../lib/data.js';
import { MonthlyStack, PGX_COLORS } from '../components/charts.jsx';

export const DRUG_LIST = ['Allopurinol', 'Carbamazepine'];
export const monthLabel = (v) => { const [y, m] = v.split('-'); return `${MONTHS_TH[+m - 1]} ${+y + 543}`; };

export function MonthPicker({ items, monthOf, value, onChange }) {
  const months = useMemo(() => {
    const s = new Set(items.map(monthOf).filter(Boolean));
    s.add(todayIso().slice(0, 7));
    return [...s].sort().reverse();
  }, [items, monthOf]);
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="filter-label">เดือน</span>
      <select className="select" style={{ width: 180 }} value={value} onChange={(e) => onChange(e.target.value)}>
        {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </select>
    </label>
  );
}

export function KpiTiles({ tiles, cols = 4 }) {
  return (
    <div className="kpi-tiles" style={{ '--cols': cols }}>
      {tiles.map((t) => (
        <div key={t.label} className="kpi-tile">
          <span className="l">{t.color && <i style={{ background: t.color }} aria-hidden />}{t.label}</span>
          <b>{t.n}</b>
          {t.sub && <span className="s">{t.sub}</span>}
        </div>
      ))}
    </div>
  );
}

export function DoctorList({ title, list }) {
  const map = list.reduce((m, p) => { const k = p.orderingDoctor || 'ไม่ระบุแพทย์'; (m[k] ||= []).push(p); return m; }, {});
  const rows = Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  const tags = (l) => {
    const t = {};
    l.forEach((p) => { const k = `${p.drug === 'Allopurinol' ? 'Allo' : 'Carba'} · ${p.pgxResult}`; t[k] = (t[k] || 0) + 1; });
    return Object.entries(t).map(([k, n]) => `${k} ${n}`).join(' · ');
  };
  return (
    <div>
      <div className="sub-h">{title}</div>
      {rows.length === 0 ? <div className="small muted" style={{ padding: '6px 0 12px' }}>ไม่มีข้อมูลในเดือนนี้</div> : (
        <div className="doc-list">
          {rows.map(([doc, l]) => (
            <div className="doc-row" key={doc}>
              <div>
                <div style={{ fontWeight: 600 }}>{doc}</div>
                <div className="doc-tags">{tags(l)}</div>
              </div>
              <div className="tabular" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{l.length} เคส</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Two columns per month on the monthly charts: one per drug. */
export const DRUG_GROUPS = [
  { id: 'Allopurinol', label: 'Allopurinol', short: 'Allo', test: (p) => p.drug === 'Allopurinol' },
  { id: 'Carbamazepine', label: 'Carbamazepine', short: 'Carba', test: (p) => p.drug === 'Carbamazepine' },
];

/** One headline ratio with its parts underneath. */
export function KpiCard({ title, sub, n, d, rows, note }) {
  const pct = d ? Math.round((n / d) * 1000) / 10 : null;
  return (
    <div className="kpi-card">
      <div className="kpi-card-head">
        <b>{title}</b>
        {sub && <span>{sub}</span>}
      </div>
      <div className="kpi-card-val">
        <strong>{pct == null ? '–' : `${pct}%`}</strong>
        <span>{d ? `${n} จาก ${d} เคส` : 'ยังไม่มีเคสในเดือนนี้'}</span>
      </div>
      {d > 0 && (
        <div className="kpi-card-bar" aria-hidden>
          {rows.filter((r) => r.color && r.n > 0).map((r) => <i key={r.label} style={{ flexGrow: r.n, background: r.color }} />)}
        </div>
      )}
      <dl className="kpi-card-rows">
        {rows.map((r) => (
          <div key={r.label}><dt>{r.color && <i style={{ background: r.color }} aria-hidden />}{r.label}</dt><dd>{r.n}</dd></div>
        ))}
      </dl>
      {note && <p className="note-line">{note}</p>}
    </div>
  );
}

const startMonth = (p) => (p.startDate && p.startDate !== '-' ? p.startDate.slice(0, 7) : '');
const KEYS = ['Negative', 'Unknown'];

/**
 * Doctor gene-test ordering: patients who started the drug, Negative (tested first) vs Unknown (not tested).
 * Positive patients never start the drug, so they are not part of this page.
 */
export default function Dashboard({ patients }) {
  const started = useMemo(() => patients.filter((p) => categoryOf(p) === 'started' && KEYS.includes(p.pgxResult)), [patients]);
  const [ym, setYm] = useState(todayIso().slice(0, 7));
  const inMonth = started.filter((p) => startMonth(p) === ym);
  const count = (l, k) => l.filter((p) => p.pgxResult === k).length;
  const drugs = DRUG_LIST.map((d) => {
    const l = inMonth.filter((p) => p.drug === d);
    return { d, all: l.length, neg: count(l, 'Negative'), unk: count(l, 'Unknown') };
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1>การสั่งตรวจยีนส์ของแพทย์</h1>
          <p>ผู้ป่วยที่เริ่มยาแล้ว · ตรวจยีนก่อนเริ่มยา (Negative) เทียบกับไม่ได้ตรวจ (Unknown) · นับตามวันที่เริ่มยา</p>
        </div>
        <MonthPicker items={started} monthOf={startMonth} value={ym} onChange={setYm} />
      </header>

      <div className="dash-grid">
        <section className="span-2">
          <KpiTiles cols={3} tiles={[
            { label: `เริ่มยาทั้งหมด · ${monthLabel(ym)}`, n: inMonth.length },
            { label: 'Negative (ตรวจยีนก่อนเริ่มยา)', n: count(inMonth, 'Negative'), color: PGX_COLORS.Negative },
            { label: 'Unknown (ไม่ได้ตรวจยีน)', n: count(inMonth, 'Unknown'), color: PGX_COLORS.Unknown },
          ]} />
        </section>

        <section className="panel span-2">
          <div className="panel-head"><h2><Pill size={16} aria-hidden /> KPI การสั่งตรวจยีนส์ของแพทย์ · {monthLabel(ym)}</h2></div>
          <div className="panel-body">
            <div className="kpi-cards">
              {drugs.map((r) => (
                <KpiCard
                  key={r.d}
                  title={r.d}
                  sub={geneOf(r.d)}
                  n={r.neg}
                  d={r.all}
                  rows={[
                    { label: 'Negative', n: r.neg, color: PGX_COLORS.Negative },
                    { label: 'Unknown', n: r.unk, color: PGX_COLORS.Unknown },
                    { label: 'เคสทั้งหมด', n: r.all },
                  ]}
                />
              ))}
            </div>
            <p className="note-line" style={{ marginTop: 12 }}>KPI = ผู้ป่วยที่ตรวจยีนแล้วผล Negative ก่อนเริ่มยา ÷ ผู้ป่วยเริ่มยาทั้งหมดของยานั้น</p>
          </div>
        </section>

        <section className="panel span-2">
          <div className="panel-head"><h2><BarChart3 size={16} aria-hidden /> ผลยีนรายเดือน</h2></div>
          <div className="panel-body">
            <MonthlyStack items={started} dateOf={(p) => p.startDate} endYm={ym} keys={KEYS} groups={DRUG_GROUPS} title="ผู้ป่วยเริ่มยาต่อเดือน · แต่ละเดือนมี 2 แท่ง: Allo และ Carba" />
          </div>
        </section>

        <section className="panel span-2">
          <div className="panel-head"><h2><Stethoscope size={16} aria-hidden /> ตามแพทย์ผู้สั่งยา · {monthLabel(ym)}</h2></div>
          <div className="panel-body">
            <DoctorList title="แพทย์ผู้สั่งยา" list={inMonth} />
          </div>
        </section>
      </div>
    </>
  );
}
