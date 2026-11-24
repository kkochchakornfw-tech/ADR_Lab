import { useState } from 'react';
import { thDate, MONTHS_TH_SHORT } from '../lib/data.js';

export const PGX_COLORS = { Negative: 'var(--neg)', Unknown: 'var(--unk)', Waiting: 'var(--wait)', Positive: 'var(--pos)' };

const niceMax = (n) => {
  if (n <= 4) return Math.max(1, n);
  const step = n <= 10 ? 2 : n <= 25 ? 5 : 10;
  return Math.ceil(n / step) * step;
};

/**
 * Stacked columns, one per day of the month, segments coloured by PGx result.
 * `items` are patients; `dateOf` picks the date that places each one on the axis.
 */
export function DailyStack({ items, dateOf, ym, keys, title }) {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const cols = Array.from({ length: days }, (_, i) => {
    const iso = `${ym}-${String(i + 1).padStart(2, '0')}`;
    const list = items.filter((p) => dateOf(p) === iso);
    return { iso, day: i + 1, total: list.length, counts: keys.map((k) => list.filter((p) => p.pgxResult === k).length) };
  });
  const max = niceMax(Math.max(0, ...cols.map((c) => c.total)));
  const ticks = [0, max / 2, max].filter((v, i, a) => Number.isInteger(v) && a.indexOf(v) === i);
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const totals = keys.map((_, i) => cols.reduce((s, c) => s + c.counts[i], 0));

  return (
    <figure className="dstack">
      <figcaption className="dstack-head">
        <span className="dstack-title">{title}</span>
        <span className="dstack-legend">
          {keys.map((k, i) => (
            <span key={k}><i style={{ background: PGX_COLORS[k] }} aria-hidden />{k} <b>{totals[i]}</b></span>
          ))}
        </span>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
        </button>
      </figcaption>

      {table ? (
        <div className="table-wrap">
          <table className="drug-table">
            <thead><tr><th>วันที่</th>{keys.map((k) => <th key={k}>{k}</th>)}<th>รวม</th></tr></thead>
            <tbody>
              {cols.filter((c) => c.total).map((c) => (
                <tr key={c.iso}><td>{thDate(c.iso)}</td>{c.counts.map((n, i) => <td key={keys[i]}>{n}</td>)}<td>{c.total}</td></tr>
              ))}
              {!cols.some((c) => c.total) && <tr><td colSpan={keys.length + 2} className="muted">ไม่มีข้อมูลในเดือนนี้</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dstack-plot" onMouseLeave={() => setHover(null)}>
          <div className="dstack-y" aria-hidden>
            {ticks.slice().reverse().map((t) => <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>{t}</span>)}
          </div>
          <div className="dstack-area">
            {ticks.map((t) => <i key={t} className="dstack-grid" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden />)}
            <div className="dstack-cols" role="list" aria-label={title}>
              {cols.map((c) => (
                <div
                  key={c.iso}
                  role="listitem"
                  className={`dstack-col${hover === c.iso ? ' on' : ''}`}
                  aria-label={`${thDate(c.iso)}: ${keys.map((k, i) => `${k} ${c.counts[i]}`).join(', ')}`}
                  onMouseEnter={() => setHover(c.iso)}
                  tabIndex={c.total ? 0 : -1}
                  onFocus={() => setHover(c.iso)}
                  onBlur={() => setHover(null)}
                >
                  <div className="dstack-bar" style={{ height: `${(c.total / max) * 100}%` }}>
                    {keys.map((k, i) => c.counts[i] > 0 && <span key={k} style={{ flexGrow: c.counts[i], background: PGX_COLORS[k] }} />)}
                  </div>
                  {hover === c.iso && c.total > 0 && (
                    <div className={`dstack-tip${c.day > days - 6 ? ' left' : ''}`} role="tooltip">
                      <b>{c.day} {MONTHS_TH_SHORT[m - 1]} {String(y + 543).slice(2)}</b>
                      {keys.map((k, i) => c.counts[i] > 0 && (
                        <div key={k}><i style={{ background: PGX_COLORS[k] }} aria-hidden />{k}<span>{c.counts[i]}</span></div>
                      ))}
                      <div className="tot">รวม<span>{c.total}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="dstack-x" aria-hidden>
              {cols.map((c) => <span key={c.iso}>{c.day === 1 || c.day % 5 === 0 ? c.day : ''}</span>)}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}

const shiftYm = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const ymShort = (ym) => { const [y, m] = ym.split('-').map(Number); return `${MONTHS_TH_SHORT[m - 1]} ${String(y + 543).slice(2)}`; };

/**
 * Stacked columns per month, segments coloured by PGx result.
 * With `groups`, each month gets one column per group (e.g. Allopurinol / Carbamazepine) side by side.
 */
export function MonthlyStack({ items, dateOf, endYm, count = 12, keys, groups, title }) {
  const gs = groups || [{ id: 'all', label: '', test: () => true }];
  const months = Array.from({ length: count }, (_, i) => shiftYm(endYm, i - count + 1));
  const cols = months.map((ym) => {
    const inM = items.filter((p) => (dateOf(p) || '').slice(0, 7) === ym);
    const bars = gs.map((g) => {
      const l = inM.filter(g.test);
      return { g, total: l.length, counts: keys.map((k) => l.filter((p) => p.pgxResult === k).length) };
    });
    return { ym, bars, total: inM.filter((p) => keys.includes(p.pgxResult)).length };
  });
  const max = niceMax(Math.max(0, ...cols.flatMap((c) => c.bars.map((b) => b.total))));
  const ticks = [0, max / 2, max].filter((v, i, a) => Number.isInteger(v) && a.indexOf(v) === i);
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const totals = keys.map((_, i) => cols.reduce((s, c) => s + c.bars.reduce((t, b) => t + b.counts[i], 0), 0));
  const multi = gs.length > 1;

  return (
    <figure className="dstack">
      <figcaption className="dstack-head">
        <span className="dstack-title">{title}</span>
        <span className="dstack-legend">
          {keys.map((k, i) => (
            <span key={k}><i style={{ background: PGX_COLORS[k] }} aria-hidden />{k} <b>{totals[i]}</b></span>
          ))}
        </span>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
        </button>
      </figcaption>

      {table ? (
        <div className="table-wrap">
          <table className="drug-table">
            <thead>
              <tr>
                <th>เดือน</th>
                {gs.flatMap((g) => keys.map((k) => <th key={g.id + k}>{multi ? `${g.label} · ` : ''}{k}</th>))}
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              {cols.slice().reverse().map((c) => (
                <tr key={c.ym}>
                  <td>{ymShort(c.ym)}</td>
                  {c.bars.flatMap((b) => b.counts.map((n, i) => <td key={b.g.id + keys[i]}>{n}</td>))}
                  <td>{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dstack-plot" onMouseLeave={() => setHover(null)}>
          <div className="dstack-y" aria-hidden>
            {ticks.slice().reverse().map((t) => <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>{t}</span>)}
          </div>
          <div className="dstack-area">
            {ticks.map((t) => <i key={t} className="dstack-grid" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden />)}
            <div className="dstack-cols mstack" role="list" aria-label={title}>
              {cols.map((c, ci) => (
                <div
                  key={c.ym}
                  role="listitem"
                  className={`dstack-col${hover === c.ym ? ' on' : ''}`}
                  aria-label={`${ymShort(c.ym)}: ${c.bars.map((b) => `${multi ? b.g.label + ' ' : ''}${keys.map((k, i) => `${k} ${b.counts[i]}`).join(', ')}`).join('; ')}`}
                  onMouseEnter={() => setHover(c.ym)}
                  tabIndex={c.total ? 0 : -1}
                  onFocus={() => setHover(c.ym)}
                  onBlur={() => setHover(null)}
                >
                  <div className="mstack-bars">
                    {c.bars.map((b) => (
                      <div key={b.g.id} className="dstack-bar" style={{ height: `${(b.total / max) * 100}%` }}>
                        {keys.map((k, i) => b.counts[i] > 0 && <span key={k} style={{ flexGrow: b.counts[i], background: PGX_COLORS[k] }} />)}
                      </div>
                    ))}
                  </div>
                  {hover === c.ym && c.total > 0 && (
                    <div className={`dstack-tip${ci > count - 3 ? ' left' : ''}`} role="tooltip">
                      <b>{ymShort(c.ym)}</b>
                      {c.bars.map((b) => (
                        <div className="grp" key={b.g.id}>
                          {multi && <div className="gl">{b.g.label}<span>{b.total}</span></div>}
                          {keys.map((k, i) => b.counts[i] > 0 && (
                            <div key={k}><i style={{ background: PGX_COLORS[k] }} aria-hidden />{k}<span>{b.counts[i]}</span></div>
                          ))}
                        </div>
                      ))}
                      <div className="tot">รวม<span>{c.total}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="dstack-x mstack-x" aria-hidden>
              {cols.map((c) => (
                <span key={c.ym}>
                  {multi && <em>{gs.map((g) => <small key={g.id}>{g.short || g.label}</small>)}</em>}
                  {ymShort(c.ym)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}

/** Ratio as "x / y" with a percentage; dash when there is nothing to divide by. */
export function Pct({ n, d }) {
  if (!d) return <span className="muted">–</span>;
  return <span className="pct"><b>{Math.round((n / d) * 1000) / 10}%</b><span className="muted"> ({n}/{d})</span></span>;
}
