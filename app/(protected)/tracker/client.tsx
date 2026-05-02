'use client';
// app/(protected)/tracker/client.tsx
// ALL UI logic — KPI bar, filter bar, record table, step modal
// Imported by page.tsx (server component)

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackerApi, stepConfigApi } from '@/lib/api';
import type { DSRecord, StepConfig, StepData } from '@/types';

// ── Design tokens ────────────────────────────────────────────
const NAVY    = '#0d2a5e';
const TEAL    = '#00c9b8';
const SURFACE = '#fff';
const BG      = '#eef1f6';
const BORDER  = '#d6dbe8';
const MUTED   = '#526278';
const TEXT    = '#18243c';

// ── Colour helpers ───────────────────────────────────────────
function stepColour(status: string): { bg: string; text: string; border: string } {
  const s = (status ?? '').toLowerCase();
  if (['done', 'complete', 'completed'].includes(s))
    return { bg: '#e6f9f3', text: '#0d6e45', border: '#6ee7b7' };
  if (['scheduled', 'under process', 'in progress'].includes(s))
    return { bg: '#fefce8', text: '#854d0e', border: '#fde047' };
  return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
}

function progressColour(pct: number): string {
  if (pct >= 80) return '#00c9b8';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function isOverdue(rec: DSRecord): boolean {
  return (rec.TOTAL_DAYS_ELAPSED ?? 0) > 20 && !rec.OB_COMPLETE && !rec.CANCELLED;
}

function calcProgress(rec: DSRecord, steps: StepConfig[]): number {
  if (!steps.length) return 0;
  const done = steps.filter(s => {
    const d = rec[s.key as keyof DSRecord] as StepData | undefined;
    return d && ['done', 'complete', 'completed'].includes((d.status ?? '').toLowerCase());
  }).length;
  return Math.round((done / steps.length) * 100);
}

function activeStepLabel(rec: DSRecord, steps: StepConfig[]): string {
  const pending = steps.find(s => {
    const d = rec[s.key as keyof DSRecord] as StepData | undefined;
    if (!d) return true;
    return !['done', 'complete', 'completed'].includes((d.status ?? '').toLowerCase());
  });
  return pending?.label ?? 'Complete';
}

// ─────────────────────────────────────────────────────────────
// KPI Bar
// ─────────────────────────────────────────────────────────────
function KPIBar({ records, steps }: { records: DSRecord[]; steps: StepConfig[] }) {
  const active   = records.filter(r => !r.CANCELLED && !r.OB_COMPLETE);
  const overdue  = active.filter(r => isOverdue(r));
  const complete = records.filter(r => r.OB_COMPLETE);

  const byStepKey = (key: string) => {
    const step = steps.find(s => s.key === key);
    if (!step) return [];
    return active.filter(r => {
      const d = r[step.key as keyof DSRecord] as StepData | undefined;
      return d && !['done', 'complete', 'completed'].includes((d.status ?? '').toLowerCase());
    });
  };

  const underNSI = active.filter(r => {
    const nsi = steps.find(s => s.key === 'STEP_NSI');
    if (!nsi) return false;
    const d = r[nsi.key as keyof DSRecord] as StepData | undefined;
    return d && ['scheduled', 'in progress'].includes((d.status ?? '').toLowerCase());
  });

  const waitEID     = byStepKey('STEP_EID');
  const waitLicense = byStepKey('STEP_LICENSE');

  const avgDays = active.length
    ? Math.round(active.reduce((a, r) => a + (r.TOTAL_DAYS_ELAPSED ?? 0), 0) / active.length)
    : 0;

  const cards = [
    {
      label:  'Active Onboarding',
      value:  active.length,
      sub:    `${overdue.length} overdue`,
      accent: '#1e4799',
      icon:   '👥',
    },
    {
      label:  'Under NSI Training',
      value:  underNSI.length,
      sub:    'In training step',
      accent: '#b45309',
      icon:   '🏫',
    },
    {
      label:  'Waiting for Residency / EID',
      value:  waitEID.length,
      sub:    'EID step pending',
      accent: '#d97706',
      icon:   '📋',
    },
    {
      label:  'Waiting for ASSD / Residency Issued',
      value:  waitLicense.length,
      sub:    'License step pending',
      accent: '#2563eb',
      icon:   '⏱',
    },
    {
      label:  'Exceeds 20 Days Policy',
      value:  overdue.length,
      sub:    'Action required',
      accent: '#dc2626',
      icon:   '⚠',
    },
    {
      label:  'Avg Onboarding Completion',
      value:  avgDays ? `${avgDays}d` : '–',
      sub:    'Days average',
      accent: '#b45309',
      icon:   '⚡',
    },
    {
      label:  'Completed with ASSD (This Month)',
      value:  `${complete.length}`,
      sub:    `of ${records.length} total`,
      accent: '#059669',
      icon:   '✓',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
      {cards.map(c => (
        <div
          key={c.label}
          style={{
            background:  SURFACE,
            border:      `1px solid ${BORDER}`,
            borderRadius: 12,
            borderTop:   `3px solid ${c.accent}`,
            padding:     '14px 16px',
            minWidth:    155,
            flex:        '0 0 155px',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: c.accent, lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, textTransform: 'uppercase', letterSpacing: '.05em', margin: '4px 0 3px', lineHeight: 1.3 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step Modal
// ─────────────────────────────────────────────────────────────
interface StepModalProps {
  step:    StepConfig;
  data:    Partial<StepData>;
  dsId:    string;
  onClose: () => void;
}

function StepModal({ step, data, dsId, onClose }: StepModalProps) {
  const qc = useQueryClient();
  const [status,    setStatus]    = useState(data.status        ?? '');
  const [notes,     setNotes]     = useState(data.notes         ?? '');
  const [startDate, setStartDate] = useState(data.complete_date ?? '');
  const [dueDate,   setDueDate]   = useState('');
  const [compDate,  setCompDate]  = useState('');

  const mut = useMutation({
    mutationFn: () =>
      trackerApi.updateStep(dsId, step.key, {
        status,
        notes,
        complete_date: compDate || startDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker'] });
      onClose();
    },
  });

  const col = stepColour(status);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={onClose}
    >
      <div
        style={{ background: SURFACE, borderRadius: 14, width: 420, padding: '24px 24px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {step.label}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: MUTED, lineHeight: 1 }}>×</button>
        </div>

        {/* Status dropdown — options come from step config */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>
            Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ width: '100%', border: `1.5px solid ${col.border}`, background: col.bg, color: col.text, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, outline: 'none' }}
          >
            <option value="">— Select status —</option>
            {(step.statuses ?? []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Due',       val: dueDate,   set: setDueDate },
            { label: 'Started',   val: startDate, set: setStartDate },
            { label: 'Completed', val: compDate,  set: setCompDate },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>
                {label}
              </label>
              <input
                type="date"
                value={val}
                onChange={e => set(e.target.value)}
                style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 7, padding: '7px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', color: TEXT, boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Notes (optional)"
            rows={3}
            style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: TEXT, boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 10, color: MUTED, textAlign: 'right' }}>{notes.length}/500</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'none', fontSize: 13, cursor: 'pointer', color: TEXT }}
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !status}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: TEAL, color: '#fff', fontSize: 13, fontWeight: 700, cursor: mut.isPending ? 'not-allowed' : 'pointer', opacity: mut.isPending || !status ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {mut.isPending ? 'Saving…' : '✓ Save'}
          </button>
        </div>

        {mut.isError && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '7px 10px' }}>
            {(mut.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Record Row (collapsed + expanded)
// ─────────────────────────────────────────────────────────────
function RecordRow({ rec, steps }: { rec: DSRecord; steps: StepConfig[] }) {
  const [expanded,  setExpanded]  = useState(false);
  const [modalStep, setModalStep] = useState<StepConfig | null>(null);

  const pct        = calcProgress(rec, steps);
  const overdue    = isOverdue(rec);
  const activeStep = activeStepLabel(rec, steps);
  const pColour    = progressColour(pct);

  return (
    <>
      {/* ── Collapsed row ───────────────────────────────── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display:             'grid',
          gridTemplateColumns: '28px 28px 1fr 80px 180px 200px 60px',
          alignItems:          'center',
          gap:                 12,
          padding:             '12px 16px',
          borderBottom:        `1px solid ${BORDER}`,
          background:          expanded ? '#f8faff' : SURFACE,
          cursor:              'pointer',
          transition:          'background .15s',
        }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          onClick={e => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        />

        {/* Chevron */}
        <span style={{
          color: MUTED, fontSize: 14, fontWeight: 700,
          display: 'inline-block',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform .2s',
        }}>
          ›
        </span>

        {/* Name + ID + Designation */}
        <div>
          <span style={{ fontWeight: 700, color: TEXT, fontSize: 13 }}>{rec.EMP_NAME}</span>
          <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{rec.EMP_ID}</span>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{rec.DESIGNATION}</div>
        </div>

        {/* Entity badge */}
        <span style={{
          background: '#1e479914', color: NAVY,
          border: `1px solid #1e479930`, borderRadius: 5,
          padding: '2px 8px', fontSize: 11, fontWeight: 700,
          textAlign: 'center', display: 'inline-block',
        }}>
          USG
        </span>

        {/* Status indicator */}
        <div>
          {rec.CANCELLED
            ? <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>✕ Cancelled</span>
            : rec.OB_COMPLETE
            ? <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Done</span>
            : overdue
            ? <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ Overdue · {activeStep}</span>
            : <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>● {activeStep}</span>
          }
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pColour, borderRadius: 4, transition: 'width .4s' }} />
          </div>
        </div>

        {/* Percentage */}
        <div style={{ fontSize: 13, fontWeight: 700, color: pColour, textAlign: 'right' }}>
          {pct}%
        </div>
      </div>

      {/* ── Expanded content ────────────────────────────── */}
      {expanded && (
        <div style={{
          background:   '#f8faff',
          borderBottom: `1px solid ${BORDER}`,
          padding:      '16px 20px 16px 72px',
        }}>

          {/* Step cards grid — fully dynamic */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
            {steps.map(step => {
              const d      = rec[step.key as keyof DSRecord] as Partial<StepData> | undefined;
              const status = d?.status ?? 'Not started';
              const col    = stepColour(status);
              const isDone = ['done', 'complete', 'completed'].includes(status.toLowerCase());

              return (
                <div
                  key={step.key}
                  onClick={e => { e.stopPropagation(); setModalStep(step); }}
                  style={{
                    background:   col.bg,
                    border:       `1.5px solid ${col.border}`,
                    borderRadius: 10,
                    padding:      '10px 12px',
                    cursor:       'pointer',
                    transition:   'transform .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform  = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow  = '0 4px 12px rgba(0,0,0,.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform  = 'none';
                    (e.currentTarget as HTMLDivElement).style.boxShadow  = 'none';
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: col.text, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: col.text }}>
                    {isDone ? '✓ ' : ''}{status}
                  </div>
                  {d?.complete_date && (
                    <div style={{ fontSize: 10, color: col.text, marginTop: 4, opacity: 0.8 }}>
                      Done {d.complete_date}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Row footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: MUTED }}>
              {rec.BLOCKER_REASON
                ? <span style={{ color: '#dc2626' }}>⚠ {rec.BLOCKER_REASON}</span>
                : 'No notes recorded'
              }
            </div>
            <button
              onClick={e => e.stopPropagation()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2563eb', fontWeight: 600 }}
            >
              ⊞ View details
            </button>
          </div>
        </div>
      )}

      {/* Step modal */}
      {modalStep && (
        <StepModal
          step={modalStep}
          data={(rec[modalStep.key as keyof DSRecord] as Partial<StepData>) ?? {}}
          dsId={rec.DS_ID}
          onClose={() => setModalStep(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter Bar
// ─────────────────────────────────────────────────────────────
interface FilterBarProps {
  search:         string;
  onSearch:       (v: string) => void;
  entityFilter:   string;
  onEntity:       (v: string) => void;
  hrFilter:       string;
  onHR:           (v: string) => void;
  showCancelled:  boolean;
  onCancelled:    (v: boolean) => void;
  entities:       string[];
  hrList:         string[];
}

function FilterBar({ search, onSearch, entityFilter, onEntity, hrFilter, onHR, showCancelled, onCancelled, entities, hrList }: FilterBarProps) {
  const sel = { border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: TEXT, background: SURFACE };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: '1 1 220px' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 13 }}>🔍</span>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search name or ID…"
          style={{ width: '100%', paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: TEXT, boxSizing: 'border-box' }}
        />
      </div>

      <select value={entityFilter} onChange={e => onEntity(e.target.value)} style={sel}>
        {entities.map(e => <option key={e} value={e}>{e === 'ALL' ? 'All Entities' : e}</option>)}
      </select>

      <select value={hrFilter} onChange={e => onHR(e.target.value)} style={sel}>
        {hrList.map(h => <option key={h} value={h}>{h === 'ALL' ? 'All HR' : h}</option>)}
      </select>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={e => onCancelled(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        Show cancelled
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Client Component (exported — used by page.tsx)
// ─────────────────────────────────────────────────────────────
export default function OnboardingHubClient() {
  const [search,        setSearch]        = useState('');
  const [entityFilter,  setEntityFilter]  = useState('ALL');
  const [hrFilter,      setHrFilter]      = useState('ALL');
  const [showCancelled, setShowCancelled] = useState(false);

  // ── Data fetching ──────────────────────────────────────────
  const {
    data:    records = [],
    isLoading: loadingRec,
    error:   recError,
  } = useQuery({
    queryKey: ['tracker'],
    queryFn:  trackerApi.getAll,
  });

  const {
    data:    steps = [],
    isLoading: loadingSteps,
  } = useQuery({
    queryKey: ['stepConfig'],
    queryFn:  stepConfigApi.get,
  });

  // Active steps sorted by order — all derived from sheet
  const activeSteps = useMemo(
    () => [...steps].filter(s => s.active).sort((a, b) => a.order - b.order),
    [steps]
  );

  // ── Dropdown options ───────────────────────────────────────
  const entities = useMemo(() => {
    const s = new Set(records.map(r => r.EMP_ID?.slice(0, 3) ?? ''));
    return ['ALL', ...Array.from(s).filter(Boolean)];
  }, [records]);

  const hrList = useMemo(() => {
    const s = new Set(records.map(r => r.RESPONSIBLE_HR).filter(Boolean));
    return ['ALL', ...Array.from(s)];
  }, [records]);

  // ── Filtered records ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (!showCancelled && r.CANCELLED)                               return false;
      if (entityFilter !== 'ALL' && !r.EMP_ID?.startsWith(entityFilter)) return false;
      if (hrFilter !== 'ALL' && r.RESPONSIBLE_HR !== hrFilter)          return false;
      if (q && !r.EMP_NAME?.toLowerCase().includes(q) && !r.EMP_ID?.includes(q)) return false;
      return true;
    });
  }, [records, search, entityFilter, hrFilter, showCancelled]);

  const loading = loadingRec || loadingSteps;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ padding: 28, background: BG, minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-.3px' }}>
          Onboarding Hub
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>
          {loading ? 'Loading…' : `${filtered.length} records · ${activeSteps.length} steps from config`}
        </p>
      </div>

      {/* KPI bar */}
      {!loading && <KPIBar records={records} steps={activeSteps} />}

      {/* Filter bar */}
      <FilterBar
        search={search}           onSearch={setSearch}
        entityFilter={entityFilter} onEntity={setEntityFilter}
        hrFilter={hrFilter}       onHR={setHrFilter}
        showCancelled={showCancelled} onCancelled={setShowCancelled}
        entities={entities}       hrList={hrList}
      />

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontSize: 14 }}>
          Loading onboarding records…
        </div>
      )}

      {/* Error state */}
      {recError && !loading && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626' }}>
          Error: {(recError as Error).message}
        </div>
      )}

      {/* Table */}
      {!loading && !recError && (
        <div style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: '28px 28px 1fr 80px 180px 200px 60px',
            gap:                 12,
            padding:             '10px 16px',
            background:          '#f4f6fb',
            borderBottom:        `1px solid ${BORDER}`,
          }}>
            {['', '', 'Employee', 'Entity', 'Status', 'Progress', '%'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Record rows */}
          {filtered.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '40px', color: MUTED, fontSize: 13 }}>
                No records found
              </div>
            )
            : filtered.map(r => (
                <RecordRow key={r.DS_ID} rec={r} steps={activeSteps} />
              ))
          }
        </div>
      )}
    </div>
  );
}
