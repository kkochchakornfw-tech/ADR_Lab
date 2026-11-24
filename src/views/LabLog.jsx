import { useState } from 'react';
import { Pencil, Trash2, PhoneCall, IdCard, Play } from 'lucide-react';
import { PgxBadge, Empty } from '../components/ui.jsx';
import { categoryOf, thDate, geneOf, daysBetween, todayIso } from '../lib/data.js';

function NotifyState({ p }) {
  if (p.pgxResult === 'Waiting') {
    const n = daysBetween(p.orderDate, todayIso());
    const late = p.expectedResultDate && p.expectedResultDate < todayIso() ? daysBetween(p.expectedResultDate, todayIso()) : 0;
    return (
      <>
        <span className="badge wait">รอผล{n != null ? ` · ${n} วัน` : ''}</span>
        {late > 0 && <span className="badge over">เลยวันคาดผลออก {late} วัน</span>}
      </>
    );
  }
  return p.notifyStatus === 'โทรแจ้งผลแล้ว'
    ? <span className="badge neg"><PhoneCall size={16} aria-hidden /> โทรแจ้งผลแล้ว</span>
    : <span className="badge over">ยังไม่ได้แจ้ง</span>;
}

export default function LabLog({ patients, onEdit, onDelete, onStart }) {
  const [view, setView] = useState('open');
  const [drug, setDrug] = useState('all');
  const pending = patients.filter((p) => categoryOf(p) === 'pending');
  const isOpen = (p) => p.pgxResult === 'Waiting' || p.notifyStatus !== 'โทรแจ้งผลแล้ว' || (p.pgxResult === 'Positive' && (!p.allergyCardIssued || !p.posImedRecorded));
  const rows = pending.filter((p) => (drug === 'all' || p.drug === drug) && (view === 'all' ? true : view === 'open' ? isOpen(p) : !isOpen(p)));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Trigger tool</h1>
          <p>ส่งตรวจยีนแล้ว แพทย์ยังไม่เริ่มยา · ติดตามจนผลออกและโทรแจ้งผู้ป่วย</p>
        </div>
      </header>

      <section className="panel">
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="กรองตามตัวยา">
            {[['all', 'ทุกยา'], ['Allopurinol', 'Allopurinol'], ['Carbamazepine', 'Carbamazepine']].map(([v, l]) => (
              <button key={v} aria-pressed={drug === v} onClick={() => setDrug(v)}>{l}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="แสดงรายการ">
            {[['open', 'ยังไม่เสร็จ'], ['done', 'แจ้งผลแล้ว'], ['all', 'ทั้งหมด']].map(([v, l]) => (
              <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
          <span className="small muted" style={{ marginLeft: 'auto' }}>{rows.length} รายการ</span>
        </div>
        {rows.length === 0 ? (
          <Empty title={pending.length ? 'ไม่มีรายการในมุมมองนี้' : 'ยังไม่มีรายการส่งตรวจยีน'}>
            {pending.length ? 'เลือกมุมมองอื่นด้านบน' : 'เพิ่มผู้ป่วยแล้วเลือก “ส่งตรวจยีนแล้ว ยังไม่เริ่มยา”'}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ผู้ป่วย</th>
                  <th>ยา / ยีน</th>
                  <th>แพทย์ผู้ส่งตรวจ</th>
                  <th>ส่งตรวจ</th>
                  <th>ผลยีน</th>
                  <th>ผลออก</th>
                  <th>การแจ้งผล</th>
                  <th>ผู้แจ้ง / วันที่</th>
                  <th><span className="sr-only">จัดการ</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="pt-name">{p.name}</div>
                      <div className="pt-meta"><span>HN {p.hn}</span><span>{p.phone}</span></div>
                    </td>
                    <td><div className="drug-name">{p.drug}</div><div className="drug-gene">{geneOf(p.drug)}</div></td>
                    <td className="small">{p.orderingDoctor || '-'}</td>
                    <td className="tabular">{thDate(p.orderDate)}</td>
                    <td><PgxBadge value={p.pgxResult} /></td>
                    <td className="tabular">
                      {thDate(p.labResultDate)}
                      {p.pgxResult === 'Waiting' && p.expectedResultDate && <div className="small muted">คาด {thDate(p.expectedResultDate)}</div>}
                      {p.labName && <div className="small muted">{p.labName}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <NotifyState p={p} />
                        {p.pgxResult === 'Positive' && (p.allergyCardIssued
                          ? <span className="badge plain"><IdCard size={16} aria-hidden /> ให้บัตรแพ้ยาแล้ว</span>
                          : <span className="badge over"><IdCard size={16} aria-hidden /> ยังไม่ได้ให้บัตรแพ้ยา</span>)}
                        {p.pgxResult === 'Positive' && (p.posImedRecorded
                          ? <span className="badge plain">บันทึก IMED แล้ว</span>
                          : <span className="badge over">ยังไม่บันทึก IMED</span>)}
                      </div>
                    </td>
                    <td className="small">
                      {p.notifyPharm && p.notifyPharm !== 'N/A' ? p.notifyPharm : '-'}
                      <div className="muted tabular">{thDate(p.notifyDate)}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        {p.pgxResult !== 'Waiting' && p.pgxResult !== 'Positive' && (
                          <button className="icon-btn" onClick={() => onStart(p)} aria-label={`แพทย์เริ่มยาแล้ว: ย้าย ${p.name} ไปติดตาม ADR`} title="แพทย์เริ่มยาแล้ว → ติดตาม ADR"><Play size={16} /></button>
                        )}
                        <button className="icon-btn" onClick={() => onEdit(p)} aria-label={`แก้ไข ${p.name}`} title="แก้ไข"><Pencil size={16} /></button>
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
