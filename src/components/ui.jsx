import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import { PGX, adrMeta, organizer, thShort, thDate, todayIso, daysBetween } from '../lib/data.js';

export function PgxBadge({ value }) {
  const m = PGX[value] || PGX.Unknown;
  return (
    <span className={`badge ${m.tone}`}>
      {value === 'Positive' && <AlertTriangle size={16} aria-hidden />}
      {m.th}
    </span>
  );
}

export function AdrLabel({ value }) {
  const m = adrMeta(value);
  return (
    <span className={`tone-${m.tone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <i className="adr-dot" aria-hidden />
      <span className="adr-text">{m.value}</span>
    </span>
  );
}

export function PhoneLink({ phone, className = 'phone' }) {
  if (!phone) return <span className="muted">-</span>;
  return (
    <a className={className} href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>
      <Phone size={16} aria-hidden /> {phone}
    </a>
  );
}

const STATE_TEXT = {
  done: 'บันทึกแล้ว',
  due: 'ถึงกำหนดโทรวันนี้',
  over: 'เกินกำหนด ยังไม่ได้บันทึก',
  missed: 'ไม่ได้ติดตาม (ปิดเคสแล้ว)',
  later: 'ยังไม่ถึงกำหนด',
  skip: 'ไม่ต้องติดตามสัปดาห์นี้ (ผลยีน Negative)',
  hold: 'รอผลตรวจยีนก่อนเริ่มติดตาม',
};

/**
 * Flat week strip for queues: one small chip per scheduled week, coloured by state.
 * Recorded weeks show the ADR result colour; the chip to call is filled.
 */
export function WeekStrip({ patient, onPick, today = todayIso() }) {
  const cells = organizer(patient, today).filter((c) => c.state !== 'skip');
  return (
    <div className="week-strip" role="group" aria-label={`สัปดาห์ติดตาม ${patient.name}`}>
      {cells.map((c) => {
        const tone = c.state === 'done' ? `tone-${adrMeta(c.data?.adr).tone}` : '';
        const label = `${c.label} ${STATE_TEXT[c.state]} ${c.date ? thDate(c.date) : ''}`;
        const body = (
          <>
            <b>{c.label}</b>
            <span>{c.state === 'done' ? (c.data?.adr === 'No ADR' ? 'ปกติ' : c.data?.adr) : c.date ? thShort(c.date).split(' ').slice(0, 2).join(' ') : ''}</span>
          </>
        );
        return onPick && c.state !== 'hold' ? (
          <button type="button" key={c.id} className={`ws ${c.state} ${tone}`} title={label} aria-label={label} onClick={() => onPick(c.id)}>{body}</button>
        ) : (
          <span key={c.id} className={`ws ${c.state} ${tone}`} title={label}>{body}</span>
        );
      })}
    </div>
  );
}

/** Result pill: a tinted chip coloured by the ADR outcome. */
export function AdrPill({ value }) {
  const m = adrMeta(value);
  return <span className={`adr-pill tone-${m.tone}`}>{m.value}</span>;
}

/**
 * One week of one patient as a table cell: date, result, short note.
 * Recorded weeks show the call date, result pill and note; others show the due date and status.
 */
export function WeekCell({ cell: c, onPick, today = todayIso() }) {
  const w = c.data;
  const late = c.state === 'over' ? daysBetween(c.date, today) : 0;
  let body;
  if (c.state === 'skip') {
    body = <span className="wc-muted">—</span>;
  } else if (c.state === 'hold') {
    body = <><span className="wc-date">{thDate(c.date)}</span><span className="wc-muted">รอผลยีน</span></>;
  } else if (c.state === 'done') {
    body = (
      <>
        <span className="wc-date">{thDate(w.callDate || c.date)}</span>
        <AdrPill value={w.adr} />
        {w.note && <span className="wc-note" title={w.note}>{w.note}</span>}
      </>
    );
  } else {
    const status = { due: 'โทรวันนี้', over: `เกินกำหนด ${late} วัน`, missed: 'ไม่ได้ติดตาม', later: 'รอครบกำหนด' }[c.state];
    body = (
      <>
        <span className="wc-date">{thDate(c.date)}</span>
        <span className={`wc-status ${c.state}`}>{status}</span>
        {c.moved && <span className="wc-muted">เลื่อนจาก {thShort(c.planned)}{w?.tries?.length ? ` · โทรไม่ติด ${w.tries.length}` : ''}</span>}
      </>
    );
  }
  const clickable = onPick && !['skip', 'hold'].includes(c.state);
  return clickable ? (
    <button type="button" className={`week-cell ${c.state}`} onClick={() => onPick(c.id)} aria-label={`${c.label} ${STATE_TEXT[c.state]} — บันทึกผลการโทร`}>
      {body}
    </button>
  ) : (
    <div className={`week-cell ${c.state}`} title={STATE_TEXT[c.state]}>{body}</div>
  );
}

/* ---------- dialog helper: native <dialog> with exit animation ---------- */
export function useDialog(open, onClose, { animatedClose = false } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.classList.remove('closing');
      d.showModal();
    } else if (!open && d.open) {
      if (animatedClose && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        d.classList.add('closing');
        const t = setTimeout(() => { d.classList.remove('closing'); d.close(); }, 190);
        return () => clearTimeout(t);
      }
      d.close();
    }
  }, [open, animatedClose]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    const onClick = (e) => { if (e.target === d) onClose(); };
    d.addEventListener('cancel', onCancel);
    d.addEventListener('mousedown', onClick);
    return () => { d.removeEventListener('cancel', onCancel); d.removeEventListener('mousedown', onClick); };
  }, [onClose]);
  return ref;
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }) {
  const ref = useDialog(open, onCancel);
  return (
    <dialog ref={ref} className="confirm" aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p>{body}</p>
      <div className="acts">
        <button className="btn btn-secondary" onClick={onCancel}>ยกเลิก</button>
        <button className="btn btn-danger" onClick={onConfirm} autoFocus>{confirmLabel}</button>
      </div>
    </dialog>
  );
}

/* ---------- toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, action, pill) => {
    const id = Math.random();
    setItems((s) => [...s.slice(-2), { id, text, action, pill }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), action ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div className="toast" key={t.id}>
            <span>{t.text}</span>
            {t.action && (
              <button onClick={() => { t.action.run(); setItems((s) => s.filter((x) => x.id !== t.id)); }}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <div className="small">{children}</div>}
    </div>
  );
}

export function Field({ label, required, children, error, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{required && <span className="req"> *</span>}</span>
      {children}
      {error && <span className="err">{error}</span>}
    </label>
  );
}
