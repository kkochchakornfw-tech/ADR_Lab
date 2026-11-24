#!/usr/bin/env node
// Writes public/unslop-monitor.json, which public/monitor.html polls once a second.
// Usage:
//   node tools/monitor.mjs reset "<title>"
//   node tools/monitor.mjs phase "<phase name>" [passIndex] [passTotal]
//   node tools/monitor.mjs log "<message>" [file]
//   node tools/monitor.mjs find <id> "<group>" "<sign>" "<where>"
//   node tools/monitor.mjs status <id> <open|fixing|fixed|kept> ["note"]
//   node tools/monitor.mjs direction "<line>" ...   (replaces the direction lines)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'public', 'unslop-monitor.json');
const blank = { title: '', phase: 'รอเริ่ม', pass: 0, passTotal: 9, direction: [], findings: [], log: [], updated: 0 };

const read = () => { try { return { ...blank, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { return { ...blank }; } };
const write = (s) => {
  s.updated = Date.now();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, file);
};
const now = () => new Date().toLocaleTimeString('th-TH', { hour12: false });

const [cmd, ...a] = process.argv.slice(2);
const s = read();
switch (cmd) {
  case 'reset': write({ ...blank, title: a[0] || '', log: [{ t: now(), msg: 'เริ่มการตรวจ' }] }); break;
  case 'phase':
    s.phase = a[0]; if (a[1]) s.pass = +a[1]; if (a[2]) s.passTotal = +a[2];
    s.log.unshift({ t: now(), msg: `ขั้น: ${a[0]}`, kind: 'phase' }); write(s); break;
  case 'log': s.log.unshift({ t: now(), msg: a[0], file: a[1] }); s.log = s.log.slice(0, 200); write(s); break;
  case 'find': {
    const [id, group, sign, where] = a;
    const i = s.findings.findIndex((f) => f.id === id);
    const f = { id, group, sign, where, status: 'open' };
    if (i >= 0) s.findings[i] = { ...s.findings[i], ...f }; else s.findings.push(f);
    write(s); break;
  }
  case 'status': {
    const f = s.findings.find((x) => x.id === a[0]);
    if (!f) { console.error('no finding ' + a[0]); process.exit(1); }
    f.status = a[1]; if (a[2]) f.note = a[2];
    s.log.unshift({ t: now(), msg: `${f.sign} → ${a[1]}`, kind: a[1] });
    write(s); break;
  }
  case 'direction': s.direction = a; write(s); break;
  default: console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n'));
}
