import { useMemo, useState } from 'react';
import { Stethoscope, BarChart3, ShieldCheck, ListChecks, Pencil } from 'lucide-react';
import { categoryOf, todayIso, thDate, geneOf } from '../lib/data.js';
import { MonthlyStack, PGX_COLORS } from '../components/charts.jsx';
import { MonthPicker, KpiTiles, KpiCard, DoctorList, DRUG_LIST, monthLabel } from './Dashboard.jsx';
import { Empty } from '../components/ui.jsx';

const orderMonth = (p) => (p.orderDate || '').slice(0, 7);
const called = (p) => p.notifyStatus === 'โทรแจ้งผลแล้ว';
/** Positive closed loop: called to notify AND recorded in IMED. Either one missing does not count. */
const closed = (p) => called(p) && !!p.posImedRecorded;
const KEYS = ['Negative', 'Positive', 'Waiting'];

function Done({ on, by, at, extra, text }) {
  if (!on) return <span className="badge over">ยังไม่{text}</span>;
  return (
    <div>
      <span className="badge neg">{text}แล้ว</span>
      {by && <div className="small" style={{ marginTop: 4 }}>โดย {by}{at ? ` · ${thDate(at)}` : ''}</div>}
      {extra && <div className="small muted">{extra}</div>}
    </div>
  );
}

/** Action positive gene: gene-test cases (drug not started), one page per drug. */
export default function LabDashboard({ patients, onEdit }) {
  const [drug, setDrug] = useState(DRUG_LIST[0]);
  const lab = useMemo(() => patients.filter((p) => categoryOf(p) === 'pending' && p.drug === drug), [patients, drug]);
  const [ym, setYm] = useState(todayIso().slice(0, 7));
  const inMonth = lab.filter((p) => orderMonth(p) === ym);
  const by = (k) => inMonth.filter((p) => p.pgxResult === k);
  const pos = by('Positive');

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Action positive gene</h1>
          <p>ผู้ป่วยส่งตรวจยีน ยังไม่เริ่มยา · นับตามวันที่ส่งตรวจ</p>
        </div>
        <MonthPicker items={lab} monthOf={orderMonth} value={ym} onChange={setYm} />
      </header>

      <div className="page-tabs" role="tablist" aria-label="เลือกตัวยา">
        {DRUG_LIST.map((d) => (
          <button key={d} role="tab" aria-selected={drug === d} onClick={() => setDrug(d)}>
            {d} <span>{geneOf(d)}</span>
          </button>
        ))}
      </div>

      <div className="dash-grid">
        <section className="span-2">
          <KpiTiles tiles={[
            { label: `ส่งตรวจทั้งหมด · ${monthLabel(ym)}`, n: inMonth.length },
            { label: 'Negative', n: by('Negative').length, color: PGX_COLORS.Negative },
            { label: 'Positive', n: pos.length, color: PGX_COLORS.Positive },
            { label: 'Waiting (รอผล)', n: by('Waiting').length, color: PGX_COLORS.Waiting },
          ]} />
        </section>

        <section className="panel">
          <div className="panel-head"><h2><ShieldCheck size={16} aria-hidden /> KPI Positive · {drug}</h2></div>
          <div className="panel-body">
            <KpiCard
              title="โทรแจ้งผล + บันทึก IMED"
              sub={monthLabel(ym)}
              n={pos.filter(closed).length}
              d={pos.length}
              rows={[
                { label: 'Positive', n: pos.length },
                { label: 'โทรแจ้งแล้ว', n: pos.filter(called).length },
                { label: 'บันทึก IMED แล้ว', n: pos.filter((p) => p.posImedRecorded).length },
                { label: 'ให้บัตรแพ้ยาแล้ว', n: pos.filter((p) => p.allergyCardIssued).length },
              ]}
              note="KPI = เคส Positive ที่โทรแจ้งผลแล้ว และ บันทึกใน IMED แล้ว ÷ เคส Positive ทั้งหมด (ขาดอย่างใดอย่างหนึ่งไม่นับ)"
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2><Stethoscope size={16} aria-hidden /> ตามแพทย์ผู้ส่งตรวจ</h2></div>
          <div className="panel-body">
            <DoctorList title={`แพทย์ผู้ส่งตรวจ ${geneOf(drug)}`} list={inMonth} />
          </div>
        </section>

        <section className="panel span-2">
          <div className="panel-head"><h2><ListChecks size={16} aria-hidden /> เคส Positive · {monthLabel(ym)}</h2></div>
          {pos.length === 0 ? (
            <Empty title="ไม่มีเคส Positive ในเดือนนี้">ผล Positive ของ {drug} จะแสดงที่นี่พร้อมสถานะการดำเนินการ</Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>ผู้ป่วย</th><th>ผลออก</th><th>โทรแจ้งผล</th><th>บันทึก IMED</th><th>ให้บัตรแพ้ยา</th><th><span className="sr-only">จัดการ</span></th></tr>
                </thead>
                <tbody>
                  {pos.map((p) => (
                    <tr key={p.id}>
                      <td><div className="pt-name">{p.name}</div><div className="pt-meta"><span>HN {p.hn}</span><span>{p.orderingDoctor}</span></div></td>
                      <td className="tabular">{thDate(p.labResultDate)}</td>
                      <td><Done on={called(p)} by={p.notifyPharm !== 'N/A' ? p.notifyPharm : ''} at={p.notifyDate !== '-' ? p.notifyDate : ''} text="โทรแจ้ง" /></td>
                      <td><Done on={p.posImedRecorded} by={p.posImedBy} at={p.posImedAt} extra={p.posImedNote} text="บันทึก IMED " /></td>
                      <td><Done on={p.allergyCardIssued} by={p.allergyCardBy} at={p.allergyCardAt} extra={p.allergyCardNote} text="ให้บัตร" /></td>
                      <td><button className="icon-btn" onClick={() => onEdit(p)} aria-label={`แก้ไข ${p.name}`} title="แก้ไข"><Pencil size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel span-2">
          <div className="panel-head"><h2><BarChart3 size={16} aria-hidden /> ผลยีนรายเดือน · {drug}</h2></div>
          <div className="panel-body">
            <MonthlyStack items={lab} dateOf={(p) => p.orderDate} endYm={ym} keys={KEYS} title="จำนวนส่งตรวจต่อเดือน แยกตามผลยีน" />
          </div>
        </section>
      </div>
    </>
  );
}
