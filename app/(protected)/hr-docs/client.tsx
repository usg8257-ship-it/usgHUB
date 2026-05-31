'use client';
// app/(protected)/hr-docs/client.tsx
// Offer Letter Generator — Individual + Bulk tabs

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

// ── Design tokens ─────────────────────────────────────────
const NAVY    = '#0d2a5e';
const TEAL    = '#00c9b8';
const SURFACE = '#fff';
const BG      = '#eef1f6';
const BORDER  = '#d6dbe8';
const MUTED   = '#526278';
const TEXT    = '#18243c';
const RED     = '#dc2626';
const GREEN   = '#059669';

// ── Types ─────────────────────────────────────────────────
interface BulkRow {
  name:        string;
  passport:    string;
  nationality: string;
  lic:         string;
  _error?:     string;
}

// ── Helper: trigger browser PDF download from base64 ──────
function downloadBase64PDF(base64: string, fileName: string) {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helper: call /api/run ─────────────────────────────────
async function apiRun(fn: string, args: unknown[]) {
  const res = await fetch('/api/run', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fn, args }),
  });
  return res.json();
}

// ── Template Card ─────────────────────────────────────────
function TemplateCard({
  type, label, sub, icon, selected, onClick
}: {
  type: string; label: string; sub: string; icon: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex:         1,
        border:       `2px solid ${selected ? NAVY : BORDER}`,
        borderRadius: 12,
        padding:      '20px 16px',
        cursor:       'pointer',
        textAlign:    'center',
        background:   selected ? '#f0f4ff' : SURFACE,
        transition:   'all .15s',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: selected ? NAVY : TEXT }}>{label}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, required, readOnly
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; readOnly?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', gap: 4, marginBottom: 5 }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
        {readOnly && <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '.05em' }}>FIXED</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width:        '100%',
          border:       `1.5px solid ${BORDER}`,
          borderRadius: 8,
          padding:      '10px 12px',
          fontSize:     13,
          fontFamily:   'inherit',
          outline:      'none',
          color:        TEXT,
          background:   readOnly ? '#f9fafb' : SURFACE,
          boxSizing:    'border-box',
        }}
      />
    </div>
  );
}

// ── Individual Tab ────────────────────────────────────────
function IndividualTab() {
  const [template,    setTemplate]    = useState<'PSBD' | 'SIRA'>('PSBD');
  const [name,        setName]        = useState('');
  const [passport,    setPassport]    = useState('');
  const [nationality, setNationality] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  async function handleGenerate() {
    if (!name.trim())        { setError('Candidate name is required');  return; }
    if (!passport.trim())    { setError('Passport number is required'); return; }
    if (!nationality.trim()) { setError('Nationality is required');     return; }

    setError('');
    setLoading(true);

    try {
      const res = await apiRun('generateOfferLetter', [{
        name:        name.trim(),
        passport:    passport.trim(),
        nationality: nationality.trim(),
        type:        template,
      }]);

      if (!res.success) {
        setError(res.error ?? 'Failed to generate letter');
        return;
      }

      downloadBase64PDF(res.data.base64, res.data.fileName);

      // Reset form
      setName('');
      setPassport('');
      setNationality('');

    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>

      {/* Step label */}
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
        Generate an offer letter using PSBD or SIRA template. No Employee ID required.
      </p>

      {/* Template selector */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        <TemplateCard type="PSBD" label="PSBD" sub="All Over UAE"     icon="🏛️" selected={template === 'PSBD'} onClick={() => setTemplate('PSBD')} />
        <TemplateCard type="SIRA" label="SIRA" sub="Dubai"            icon="⭐" selected={template === 'SIRA'} onClick={() => setTemplate('SIRA')} />
      </div>

      {/* Form fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginBottom: 20 }}>
        <Field label="Candidate Full Name" value={name}        onChange={setName}        placeholder="Enter Full Name"  required />
        <Field label="Passport No"         value={passport}    onChange={setPassport}    placeholder="e.g. EA0537817"   required />
        <Field label="Nationality"         value={nationality} onChange={setNationality} placeholder="e.g. Indian"      required />
        <Field label="Date"                value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} readOnly />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: `1px solid #fca5a5`, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: RED, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={() => { setName(''); setPassport(''); setNationality(''); setError(''); }}
          style={{ padding: '10px 20px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'none', fontSize: 13, cursor: 'pointer', color: TEXT }}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding:      '10px 22px',
            borderRadius: 8,
            border:       'none',
            background:   loading ? '#93a3c8' : NAVY,
            color:        '#fff',
            fontSize:     13,
            fontWeight:   700,
            cursor:       loading ? 'not-allowed' : 'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          8,
          }}
        >
          {loading ? (
            <>⏳ Generating…</>
          ) : (
            <>⬇ Download {template} Offer Letter</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Bulk Tab ──────────────────────────────────────────────
function BulkTab() {
  const fileRef                           = useRef<HTMLInputElement>(null);
  const [rows,    setRows]                = useState<BulkRow[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error,   setError]               = useState('');
  const [success, setSuccess]             = useState('');
  const [dragging, setDragging]           = useState(false);

  // ── Parse uploaded Excel ─────────────────────────────
  function parseExcel(file: File) {
    setError('');
    setSuccess('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const json     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

        if (!json.length) { setError('Excel file is empty'); return; }

        const parsed: BulkRow[] = json.map((row, i) => {
          // Flexible column name matching (case-insensitive)
          const get = (keys: string[]) => {
            for (const k of keys) {
              const match = Object.keys(row).find(rk => rk.trim().toUpperCase() === k.toUpperCase());
              if (match) return String(row[match] ?? '').trim();
            }
            return '';
          };

          const name        = get(['FULL NAME', 'FULLNAME', 'NAME', 'CANDIDATE NAME', 'CANDIDATE FULL NAME']);
          const passport    = get(['PASSPORT NO', 'PASSPORT', 'PASSPORT NUMBER', 'PASSPORT_NO', 'PP No']);
          const nationality = get(['NATIONALITY', 'NATION']);
          const lic         = get(['LIC', 'LICENSE', 'TEMPLATE', 'TYPE', 'Category']).toUpperCase();

          // Validate
          let _error = '';
          if (!name)        _error = 'Missing name';
          else if (!passport)    _error = 'Missing passport no';
          else if (!nationality) _error = 'Missing nationality';
          else if (!['PSBD', 'SIRA'].includes(lic)) _error = `Invalid LIC: "${lic}" (use PSBD or SIRA)`;

          return { name, passport, nationality, lic, _error };
        });

        setRows(parsed);
      } catch (err) {
        setError('Failed to parse Excel file. Make sure it is a valid .xlsx file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseExcel(file);
  }

  const validRows   = rows.filter(r => !r._error);
  const invalidRows = rows.filter(r => r._error);
  const psdbCount   = validRows.filter(r => r.lic === 'PSBD').length;
  const siraCount   = validRows.filter(r => r.lic === 'SIRA').length;

  async function handleGenerate() {
    if (!validRows.length) { setError('No valid rows to generate'); return; }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiRun('generateBulkOfferLetters', [
        validRows.map(r => ({
          name:        r.name,
          passport:    r.passport,
          nationality: r.nationality,
          lic:         r.lic,
        }))
      ]);

      if (!res.success) {
        setError(res.error ?? 'Bulk generation failed');
        return;
      }

      downloadBase64PDF(res.data.base64, res.data.fileName);

      const errMsg = res.data.errors?.length
        ? ` (${res.data.errors.length} rows skipped)`
        : '';
      setSuccess(`✓ ${res.data.count} letters merged and downloaded${errMsg}`);
      setRows([]);

    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>

      {/* Upload area */}
      {!rows.length && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border:       `2px dashed ${dragging ? TEAL : BORDER}`,
            borderRadius: 12,
            padding:      '48px 24px',
            textAlign:    'center',
            cursor:       'pointer',
            background:   dragging ? '#f0fffe' : '#fafbfd',
            transition:   'all .15s',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
          <div style={{ fontWeight: 700, color: TEXT, marginBottom: 6 }}>
            Drop Excel file here or click to upload
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
            Required columns: <strong>FULL NAME · PASSPORT NO · NATIONALITY · LIC</strong>
          </div>
          <div style={{ display: 'inline-block', background: NAVY, color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600 }}>
            Choose File
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: `1px solid #fca5a5`, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: RED, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{ background: '#f0fdf4', border: `1px solid #86efac`, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: GREEN, marginBottom: 14 }}>
          {success}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: MUTED }}>
              <strong style={{ color: TEXT }}>{rows.length}</strong> rows loaded ·{' '}
              <strong style={{ color: GREEN }}>{validRows.length}</strong> valid ·{' '}
              {invalidRows.length > 0 && <strong style={{ color: RED }}>{invalidRows.length} errors</strong>}
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>
              PSBD: <strong>{psdbCount}</strong> · SIRA: <strong>{siraCount}</strong>
            </div>
            <button
              onClick={() => { setRows([]); setError(''); setSuccess(''); if (fileRef.current) fileRef.current.value = ''; }}
              style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: MUTED }}
            >
              ✕ Clear
            </button>
          </div>

          {/* Table */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f4f6fb', position: 'sticky', top: 0 }}>
                    {['#', 'Full Name', 'Passport No', 'Nationality', 'LIC / Template', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: row._error ? '#fff8f8' : i % 2 === 0 ? SURFACE : '#fafbfd' }}>
                      <td style={{ padding: '8px 14px', color: MUTED, fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: TEXT }}>{row.name || <span style={{ color: '#fca5a5' }}>—</span>}</td>
                      <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: MUTED }}>{row.passport || <span style={{ color: '#fca5a5' }}>—</span>}</td>
                      <td style={{ padding: '8px 14px', color: MUTED }}>{row.nationality || <span style={{ color: '#fca5a5' }}>—</span>}</td>
                      <td style={{ padding: '8px 14px' }}>
                        {row.lic ? (
                          <span style={{
                            background: row.lic === 'PSBD' ? '#eff6ff' : '#fef9c3',
                            color:      row.lic === 'PSBD' ? '#1d4ed8' : '#854d0e',
                            border:     `1px solid ${row.lic === 'PSBD' ? '#bfdbfe' : '#fde047'}`,
                            borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700
                          }}>
                            {row.lic}
                          </span>
                        ) : <span style={{ color: '#fca5a5', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        {row._error
                          ? <span style={{ color: RED, fontSize: 12 }}>⚠ {row._error}</span>
                          : <span style={{ color: GREEN, fontSize: 12 }}>✓ Ready</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generate button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={handleGenerate}
              disabled={loading || !validRows.length}
              style={{
                padding:    '11px 24px',
                borderRadius: 8,
                border:     'none',
                background: loading || !validRows.length ? '#93a3c8' : NAVY,
                color:      '#fff',
                fontSize:   14,
                fontWeight: 700,
                cursor:     loading || !validRows.length ? 'not-allowed' : 'pointer',
                display:    'flex',
                alignItems: 'center',
                gap:        8,
              }}
            >
              {loading
                ? <>⏳ Generating {validRows.length} letters…</>
                : <>⬇ Generate &amp; Download Merged PDF ({validRows.length} letters)</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────
export default function HRDocsClient() {
  const [tab, setTab] = useState<'individual' | 'bulk'>('individual');

  const tabStyle = (active: boolean) => ({
    padding:      '9px 22px',
    borderRadius: 8,
    border:       'none',
    fontSize:     13,
    fontWeight:   active ? 700 : 400,
    color:        active ? '#fff' : MUTED,
    background:   active ? NAVY : 'transparent',
    cursor:       'pointer',
    transition:   'all .15s',
  });

  return (
    <div style={{ padding: 28, background: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Docs Generator</h1>
        <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>Generate offer letters using Google Docs templates</p>
      </div>

      {/* Card */}
      <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, maxWidth: 720, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, background: '#f9fafb' }}>
          <button style={tabStyle(tab === 'individual')} onClick={() => setTab('individual')}>
            📄 Individual
          </button>
          <button style={tabStyle(tab === 'bulk')} onClick={() => setTab('bulk')}>
            📦 Bulk
          </button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px 28px' }}>
          {tab === 'individual' ? <IndividualTab /> : <BulkTab />}
        </div>
      </div>
    </div>
  );
}
