/**
 * Staff sign-in.
 *
 * This app has no server, so accounts live here and are checked in the browser.
 * That keeps casual users out of the screen, but anyone who opens the source can
 * read this list: it is not real security. When the hospital connects the app to
 * its own login service, replace `checkLogin` with a call to that service.
 *
 * Add one line per pharmacist. `id` is the employee number, `name` is what gets
 * filled into "เภสัชกรผู้ติดตาม".
 */
export const STAFF = [
  { id: '000001', password: 'demo-pharm-01', name: 'ภก.ทดสอบ ระบบ' },
];

const SESSION_KEY = 'adr_app_session';

export function checkLogin(id, password) {
  const u = STAFF.find((s) => s.id === id.trim() && s.password === password);
  return u ? { id: u.id, name: u.name } : null;
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(user) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* private mode: stay signed in for this tab only */ }
}
