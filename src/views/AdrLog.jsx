import { useState } from 'react';
import { Search, Pencil, Printer, Trash2 } from 'lucide-react';
import { WeekCell, PgxBadge, AdrLabel, Empty } from '../components/ui.jsx';
import { categoryOf, thDate, statusLabel, geneOf, isActive, organizer, WEEKS, ADR_OUTCOMES } from '../lib/data.js';

export default function AdrLog({ patients, onPick, onEdit, onPrint, onDelete }) {
  const [drug, setDrug] = useState('all');
  const [pgx, setPgx] = useState('all');
  const [status, setStatus] = useState('active');
  const [q, setQ] = useState('');

  const started = patients.filter((p) => categoryOf(p) === 'started');
  const s = q.trim().toLowerCase();
  const rows = started.filter((p) =>
    (drug === 'all' || p.drug === drug) &&
    (pgx === 'all' || p.pgxResult === pgx) &&
    (status === 'all' || (status === 'active' ? isActive(p) : !isActive(p))) &&
    (!s || p.hn.toLowerCase().includes(s) || p.name.toLowerCase().includes(s) || (p.phone || '').includes(s)));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>ติดตาม ADR</h1>
          <p>ผู้ป่วยที่เริ่มยาแล้ว · คลิกช่อง W เพื่อบันทึกผลการโทร</p>
        </div>
      </header>

      <section className="panel">
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="กรองตามตัวยา">
            {[['all', 'ทุกยา'], ['Allopurinol', 'Allopurinol'], ['Carbamazepine', 'Carbamazepine']].map(([v, l]) => (
              <button key={v} aria-pressed={drug === v} onClick={() => setDrug(v)}>{l}</button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="filter-label">ผลยีน</span>
            <select className="select" style={{ width: 130 }} value={pgx} onChange={(e) => setPgx(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="Negative">Negative</option>
              <option value="Unknown">Unknown</option>
              <option value="Positive">Positive</option>
              <option value="Waiting">Waiting</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="filter-label">สถานะ</span>
            <select className="select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">กำลังติดตาม</option>
              <option value="closed">ปิดเคส / หยุดยา</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </label>
          <div className="search">
            <Search size={16} aria-hidden />
            <input className="input" type="search" placeholder="ค้นหา HN, ชื่อ, เบอร์โทร" aria-label="ค้นหาผู้ป่วย" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="adr-sum" role="list" aria-label="ผล ADR ของผู้ป่วยตามตัวกรอง">
          {ADR_OUTCOMES.map((o) => (
            <div key={o.value} role="listitem" className={`adr-sum-item tone-${o.tone}`}>
              <b>{rows.filter((p) => (p.adrSummary || 'No ADR') === o.value).length}</b>
              <span>{o.value}<small>{o.th}</small></span>
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty title={started.length ? 'ไม่พบผู้ป่วยตามตัวกรอง' : 'ยังไม่มีผู้ป่วยที่เริ่มยา'}>
            {started.length ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา' : 'กด “เพิ่มผู้ป่วยใหม่” แล้วเลือกประเภท “เริ่มยาแล้ว”'}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="data adr-table">
              <thead>
                <tr>
                  <th>ผู้ป่วย</th>
                  <th>ยา / ขนาดยา</th>
                  <th>เริ่มยา</th>
                  <th>ผลยีน</th>
                  {WEEKS.map((wk) => <th key={wk.id} className="week-th">{wk.label} <span>(Day {wk.day})</span></th>)}
                  <th>สรุปผล</th>
                  <th className="col-actions"><span className="sr-only">จัดการ</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="pt-name">{p.name}</div>
                      <div className="pt-meta"><span>HN {p.hn}</span><span>{p.phone}</span></div>
                    </td>
                    <td style={{ maxWidth: 170 }}>
                      <div className="drug-name">{p.drug}</div>
                      <div className="drug-gene" title={p.regimen}>{p.regimen}</div>
                      <div className="drug-gene">{p.orderingDoctor}</div>
                    </td>
                    <td className="tabular" style={{ whiteSpace: 'nowrap' }}>{thDate(p.startDate)}</td>
                    <td><PgxBadge value={p.pgxResult} /><div className="drug-gene">{geneOf(p.drug)}</div></td>
                    {organizer(p).map((c) => (
                      <td key={c.id} className="week-td"><WeekCell cell={c} onPick={(w) => onPick(p, w)} /></td>
                    ))}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <AdrLabel value={p.adrSummary} />
                      <div className="small muted">{statusLabel(p.status)}</div>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => onEdit(p)} aria-label={`แก้ไข ${p.name}`} title="แก้ไข"><Pencil size={16} /></button>
                        <button className="icon-btn" onClick={() => onPrint(p)} aria-label={`พิมพ์รายงาน ${p.name}`} title="พิมพ์รายงาน"><Printer size={16} /></button>
                        <button className="icon-btn danger" onClick={() => onDelete(p)} aria-label={`ลบ ${p.name}`} title="ลบ"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
