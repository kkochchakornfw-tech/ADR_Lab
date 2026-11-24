import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, ClipboardList, FlaskConical, CalendarDays, BarChart3, UserPlus, Database, LogOut } from 'lucide-react';
import LabDashboard from './views/LabDashboard.jsx';
import { ToastProvider, useToast, ConfirmDialog } from './components/ui.jsx';
import PatientSheet from './components/PatientSheet.jsx';
import ReportDialog from './components/ReportDialog.jsx';
import Today, { todayQueues } from './views/Today.jsx';
import AdrLog from './views/AdrLog.jsx';
import LabLog from './views/LabLog.jsx';
import CalendarView from './views/CalendarView.jsx';
import Dashboard from './views/Dashboard.jsx';
import Login from './views/Login.jsx';
import { loadSession, saveSession } from './lib/auth.js';
import { loadPatients, savePatients, samplePatients, todayIso, rememberPharmacist } from './lib/data.js';

const VIEWS = [
  { id: 'today', label: 'วันนี้', icon: CalendarCheck },
  { id: 'adr', label: 'ติดตาม ADR', icon: ClipboardList },
  { id: 'lab', label: 'Trigger tool', icon: FlaskConical },
  { id: 'calendar', label: 'ปฏิทินโทร', icon: CalendarDays },
  { id: 'dashboard', label: 'การสั่งตรวจยีนส์ของแพทย์', icon: BarChart3 },
  { id: 'labdash', label: 'Action positive gene', icon: BarChart3 },
];

const initialView = () => {
  const h = location.hash.slice(1);
  return VIEWS.some((v) => v.id === h) ? h : 'today';
};

function Shell({ user, onLogout }) {
  const toast = useToast();
  const [patients, setPatients] = useState(() => {
    const stored = loadPatients();
    if (stored && stored.length) return stored;
    const s = samplePatients();
    savePatients(s);
    return s;
  });
  const [view, setView] = useState(initialView);
  const [sheet, setSheet] = useState(null);         // { patient?, focusWeek? }
  const [report, setReport] = useState(null);
  const [del, setDel] = useState(null);

  useEffect(() => { savePatients(patients); }, [patients]);
  /* every record this session is signed with the logged-in pharmacist */
  useEffect(() => { rememberPharmacist(user.name); }, [user.name]);
  useEffect(() => {
    const onHash = () => setView(initialView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (id) => { location.hash = id; setView(id); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); };

  const q = todayQueues(patients, todayIso());

  const pick = useCallback((patient, week) => setSheet({ patient, focusWeek: week }), []);
  const edit = useCallback((patient, override) => setSheet({ patient: override ? { ...patient, ...override } : patient }), []);

  const savePatient = (data) => {
    setPatients((list) => {
      const i = list.findIndex((p) => p.id === data.id);
      if (i === -1) return [...list, data];
      const next = list.slice(); next[i] = data; return next;
    });
    const isNew = !patients.some((p) => p.id === data.id);
    setSheet(null);
    toast(isNew ? `เพิ่ม ${data.name} แล้ว` : `บันทึกข้อมูล ${data.name} แล้ว`);
  };

  const confirmDelete = () => {
    const p = del;
    const idx = patients.findIndex((x) => x.id === p.id);
    setPatients((list) => list.filter((x) => x.id !== p.id));
    setDel(null);
    toast(`ลบ ${p.name} แล้ว`, {
      label: 'เลิกทำ',
      run: () => setPatients((list) => { const n = list.slice(); n.splice(idx, 0, p); return n; }),
    });
  };

  const loadSamples = () => {
    const s = samplePatients();
    const have = new Set(patients.map((p) => p.hn));
    const add = s.filter((p) => !have.has(p.hn));
    setPatients((list) => [...list, ...add]);
    toast(add.length ? `เพิ่มข้อมูลตัวอย่าง ${add.length} ราย` : 'มีข้อมูลตัวอย่างครบแล้ว');
  };

  const badge = (id) => {
    if (id === 'today') {
      if (q.over.length) return <span className="count over" aria-label={`เกินกำหนด ${q.over.length}`}>{q.over.length + q.due.length}</span>;
      if (q.due.length) return <span className="count due" aria-label={`ถึงกำหนด ${q.due.length}`}>{q.due.length}</span>;
    }
    if (id === 'lab' && q.lab.length) return <span className="count">{q.lab.length}</span>;
    return null;
  };

  return (
    <>
      <a className="skip-link" href="#main">ข้ามไปเนื้อหาหลัก</a>
      <div className="shell">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-mark" aria-hidden><ClipboardList size={18} /></span>
              <div>
                <div className="brand-name">ติดตาม ADR · PGx</div>
                <div className="brand-sub">เภสัชกรรม กรุงเทพสิริโรจน์</div>
              </div>
            </div>
            <nav className="nav" aria-label="เมนูหลัก">
              {VIEWS.map((v) => (
                <button key={v.id} className="nav-item" aria-current={view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                  <span>{v.label}</span>
                  {badge(v.id)}
                </button>
              ))}
            </nav>
            <div className="top-actions">
              <button className="btn btn-quiet btn-sm" onClick={loadSamples} title="ข้อมูลตัวอย่าง"><Database size={16} aria-hidden /> ข้อมูลตัวอย่าง</button>
              <button className="btn btn-primary" onClick={() => setSheet({})}><UserPlus size={16} aria-hidden /> เพิ่มผู้ป่วย</button>
              <span className="user-chip">
                <span className="user-name">{user.name}</span>
                <button className="icon-btn" onClick={onLogout} aria-label={`ออกจากระบบ (${user.name})`} title="ออกจากระบบ"><LogOut size={16} /></button>
              </span>
            </div>
          </div>
        </header>

        <main className="main" id="main" tabIndex={-1} style={{ outline: 'none' }}>
          {view === 'today' && <Today patients={patients} onPick={pick} onEdit={edit} onGo={go} />}
          {view === 'adr' && <AdrLog patients={patients} onPick={pick} onEdit={edit} onPrint={setReport} onDelete={setDel} />}
          {view === 'lab' && <LabLog patients={patients} onEdit={edit} onDelete={setDel} onStart={(p) => edit(p, { patientCategory: 'started' })} />}
          {view === 'calendar' && <CalendarView patients={patients} onPick={pick} />}
          {view === 'dashboard' && <Dashboard patients={patients} />}
          {view === 'labdash' && <LabDashboard patients={patients} onEdit={edit} />}
        </main>
      </div>

      <PatientSheet user={user} open={!!sheet} patient={sheet?.patient} focusWeek={sheet?.focusWeek} onClose={() => setSheet(null)} onSave={savePatient} />
      <ReportDialog patient={report} onClose={() => setReport(null)} />
      <ConfirmDialog
        open={!!del}
        title={`ลบข้อมูล ${del?.name || ''}?`}
        body="ข้อมูลการติดตามทั้งหมดของผู้ป่วยรายนี้จะถูกลบ (เลิกทำได้ภายในไม่กี่วินาที)"
        confirmLabel="ลบข้อมูล"
        onConfirm={confirmDelete}
        onCancel={() => setDel(null)}
      />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(loadSession);
  const login = (u) => { saveSession(u); rememberPharmacist(u.name); setUser(u); };
  const logout = () => { saveSession(null); setUser(null); };
  if (!user) return <Login onLogin={login} />;
  return <ToastProvider><Shell user={user} onLogout={logout} /></ToastProvider>;
}
