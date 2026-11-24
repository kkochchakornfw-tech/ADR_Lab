import { useRef, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { checkLogin } from '../lib/auth.js';

/* A still pill box that shows what the app does: two weeks recorded, today's lid open */
const DEMO = [
  { id: 'w1', state: 'done', tone: 'ok' },
  { id: 'w2', state: 'done', tone: 'ok' },
  { id: 'w3', state: 'due' },
  { id: 'w4', state: 'later' },
  { id: 'w9', state: 'later' },
];

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | wrong | opening
  const idRef = useRef(null);
  const pwRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (phase === 'opening') return;
    if (!id.trim()) { setError('กรอกรหัสพนักงาน'); idRef.current?.focus(); return; }
    if (!pw) { setError('กรอกรหัสผ่าน'); pwRef.current?.focus(); return; }
    const user = checkLogin(id, pw);
    if (!user) {
      setError('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง');
      setPhase('idle');
      requestAnimationFrame(() => setPhase('wrong'));
      setPw('');
      pwRef.current?.focus();
      return;
    }
    setError('');
    setPhase('opening');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => onLogin(user), reduce ? 0 : 720);
  };

  return (
    <div className="login">
      <section className="login-art" aria-hidden>
        <div className={`week-strip login-strip ${phase}`}>
          {DEMO.map((c) => (
            <span key={c.id} className={`ws ${c.state}${c.tone ? ` tone-${c.tone}` : ''}`}>
              <b>{c.id.toUpperCase()}</b>
              <span>{c.state === 'done' ? 'ปกติ' : c.state === 'due' ? 'โทรวันนี้' : 'รอกำหนด'}</span>
            </span>
          ))}
        </div>
        <p className="login-caption">ติดตามอาการหลังเริ่มยา Allopurinol และ Carbamazepine ครบทุกสัปดาห์</p>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit} noValidate>
          <div className="login-brand">
            <div className="brand-name">ติดตาม ADR · PGx</div>
            <div className="brand-sub">แผนกเภสัชกรรม โรงพยาบาลกรุงเทพสิริโรจน์</div>
          </div>
          <h1>เข้าสู่ระบบ</h1>

          <label className="field">
            <span>รหัสพนักงาน</span>
            <input
              ref={idRef} className="input" name="username" autoComplete="username" inputMode="text"
              autoFocus value={id} onChange={(e) => { setId(e.target.value); setError(''); }}
              aria-invalid={error && !id.trim() ? 'true' : undefined}
            />
          </label>

          <label className="field">
            <span>รหัสผ่าน</span>
            <span className="pw-wrap">
              <input
                ref={pwRef} className="input" name="password" type={show ? 'text' : 'password'} autoComplete="current-password"
                value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }}
                aria-invalid={error && id.trim() ? 'true' : undefined} aria-describedby={error ? 'login-err' : undefined}
              />
              <button type="button" className="icon-btn pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={show}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <p id="login-err" className="login-err" role="alert">{error}</p>

          <button type="submit" className="btn btn-primary login-submit" disabled={phase === 'opening'}>
            <LogIn size={16} aria-hidden /> {phase === 'opening' ? 'กำลังเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </section>
    </div>
  );
}
