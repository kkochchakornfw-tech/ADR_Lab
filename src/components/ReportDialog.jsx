import { Printer, X } from 'lucide-react';
import { useDialog } from './ui.jsx';
import { organizer, adrMeta, symptomText, channelTh, thDate, geneOf, statusLabel } from '../lib/data.js';

function pgxText(p) {
  if (p.pgxResult !== 'Unknown') return p.pgxResult;
  if (p.refusalType === 'PhysicianRefusal') return `Unknown (แพทย์ปฏิเสธการตรวจยีน${p.docReason ? ' – เหตุผล: ' + p.docReason : ''})`;
  if (p.refusalType === 'PatientRefusal') return `Unknown (ผู้ป่วยปฏิเสธการตรวจยีน${p.patReason ? ' – เหตุผล: ' + p.patReason : ''})`;
  return 'Unknown (ไม่ระบุสาเหตุ)';
}

export default function ReportDialog({ patient: p, onClose }) {
  const ref = useDialog(!!p, onClose);

  const print = () => {
    document.body.classList.add('printing-report');
    const done = () => { document.body.classList.remove('printing-report'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };

  return (
    <dialog ref={ref} className="report" aria-labelledby="report-title">
      {p && (
        <>
          <div className="report-scroll">
            <article className="report-doc">
              <h1 id="report-title">แบบรายงานผลการติดตามและเฝ้าระวังการใช้ยา {p.drug}</h1>
              <div className="org">โรงพยาบาลกรุงเทพสิริโรจน์ · แผนกเภสัชกรรม</div>
              <div className="kv">
                <div><b>HN:</b> {p.hn || '-'}</div>
                <div><b>ตัวยา:</b> {p.drug}</div>
                <div><b>ชื่อ-นามสกุล:</b> {p.name || '-'}</div>
                <div><b>วันที่เริ่มใช้ยา:</b> {thDate(p.startDate)}</div>
                <div><b>วันเดือนปีเกิด:</b> {thDate(p.dob)}</div>
                <div><b>ผลตรวจลักษณะสารพันธุกรรม {geneOf(p.drug)}:</b> {pgxText(p)}</div>
                <div><b>เบอร์โทร:</b> {p.phone || '-'}</div>
                <div><b>แพทย์ผู้สั่งใช้ยา:</b> {p.orderingDoctor || '-'}</div>
              </div>

              <h2>รายละเอียดการติดตามรายสัปดาห์</h2>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 64, textAlign: 'center' }}>สัปดาห์ที่</th>
                    <th>วันที่โทรติดตาม</th>
                    <th>ช่องทางติดตาม</th>
                    <th>ผู้ให้ข้อมูล</th>
                    <th>ผลการติดตาม (อาการไม่พึงประสงค์จากยา)</th>
                    <th>เภสัชกรที่โทรติดตาม</th>
                  </tr>
                </thead>
                <tbody>
                  {organizer(p).filter((c) => c.state !== 'skip').map((c) => {
                    const w = c.data;
                    if (c.state !== 'done') {
                      const text = c.state === 'later' ? `ยังไม่ถึงกำหนดติดตาม (รอโทรวันที่ ${thDate(c.date)})`
                        : c.state === 'hold' ? 'รอผลตรวจยีน' : 'ยังไม่ได้บันทึกผลการติดตาม';
                      return (
                        <tr key={c.id}>
                          <td style={{ textAlign: 'center' }}>{c.label.slice(1)}</td>
                          <td>{thDate(c.date)}</td>
                          <td colSpan={4} style={{ color: '#555' }}>{text}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={c.id}>
                        <td style={{ textAlign: 'center' }}>{c.label.slice(1)}</td>
                        <td>{thDate(w.callDate || c.date)}</td>
                        <td>{channelTh(w)}</td>
                        <td>{w.resp === 'relative' ? `ญาติ (${w.rel || '-'})` : 'ผู้ป่วย'}</td>
                        <td>
                          {adrMeta(w.adr).report}{w.note ? ` : ${w.note}` : ''}
                          {symptomText(w) && <div style={{ fontSize: '0.92em', color: '#444' }}>{symptomText(w)}</div>}
                        </td>
                        <td>{w.pharm || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="summary">
                <div><b>สรุปผลภาพรวม / สถานะ:</b> {adrMeta(p.adrSummary).report} ({statusLabel(p.status)})</div>
                <div><b>บันทึกเพิ่มเติม:</b> {p.adrSummaryNote || '-'}</div>
              </div>
              <div className="sign">
                <div>
                  ลงชื่อ ......................................................<br />
                  (......................................................)<br />
                  เภสัชกรผู้ติดตาม
                </div>
              </div>
            </article>
          </div>
          <div className="report-acts">
            <button className="btn btn-secondary" onClick={onClose}><X size={16} aria-hidden /> ปิด</button>
            <button className="btn btn-primary" onClick={print}><Printer size={16} aria-hidden /> พิมพ์ / บันทึกเป็น PDF</button>
          </div>
        </>
      )}
    </dialog>
  );
}
