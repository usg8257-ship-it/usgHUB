'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { hrDocsApi } from '@/lib/api';
import type { OfferLetterType, BulkLetterRow } from '@/types';

// ── Design tokens ──────────────────────────────────────────
const NAVY    = '#0d2a5e';
const TEAL    = '#00c9b8';
const SURFACE = '#fff';
const BG      = '#eef1f6';
const BORDER  = '#d6dbe8';
const MUTED   = '#526278';
const TEXT    = '#18243c';
const RED     = '#dc2626';
const GREEN   = '#059669';
const GOLD    = '#b87000';

// ── Parsed row (includes validation error) ─────────────────
interface ParsedRow extends BulkLetterRow {
  _error?: string;
}

// ── Helpers ────────────────────────────────────────────────
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

function todayFormatted() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Template Card ──────────────────────────────────────────
function TemplateCard({
  label, sub, icon, selected, onClick,
}: {
  label: string; sub: string; icon: string; selected: boolean; onClick: () => void;
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
        transition:   'border-color .15s, background .15s',
        userSelect:   'none',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: selected ? NAVY : TEXT }}>{label}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, required, readOnly,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; readOnly?: boolean;
}) {
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 700, color: MUTED,
        textTransform: 'uppercase', letterSpacing: '.06em',
        display: 'flex', gap: 4, marginBottom: 5,
      }}>
        {label}
        {required && <span style={{ color: RED }}>*</span>}
        {readOnly && (
          <span style={{
            background: '#e0e7ff', color: '#3730a3', borderRadius: 4,
            padding: '1px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '.05em',
          }}>AUTO</span>
        )}
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

// ── Alert ──────────────────────────────────────────────────
function Alert({ type, children }: { type: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error:   { bg: '#fef2f2', border: '#fca5a5', color: RED },
    success: { bg: '#f0fdf4', border: '#86efac', color: GREEN },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  }[type];
  return (
    <div style={{
      background: styles.bg, border: `1px solid ${styles.border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
      color: styles.color, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ── LIC badge ─────────────────────────────────────────────
function LicBadge({ lic }: { lic: string }) {
  const isPSBD = lic === 'PSBD';
  return (
    <span style={{
      background:   isPSBD ? '#eff6ff' : '#fef9c3',
      color:        isPSBD ? '#1d4ed8' : '#854d0e',
      border:       `1px solid ${isPSBD ? '#bfdbfe' : '#fde047'}`,
      borderRadius: 5, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
    }}>
      {lic}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
// INDIVIDUAL TAB
// ══════════════════════════════════════════════════════════
function IndividualTab() {
  const [template,    setTemplate]    = useState<OfferLetterType>('PSBD');
  const [name,        setName]        = useState('');
  const [passport,    setPassport]    = useState('');
  const [nationality, setNationality] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [lastFile,    setLastFile]    = useState('');

  function reset() {
    setName(''); setPassport(''); setNationality('');
    setError(''); setLastFile('');
  }

  async function handleGenerate() {
    setError(''); setLastFile('');

    if (!name.trim())        { setError('Candidate full name is required');  return; }
    if (!passport.trim())    { setError('Passport number is required');       return; }
    if (!nationality.trim()) { setError('Nationality is required');           return; }

    setLoading(true);
    try {
      const res = await hrDocsApi.generateOfferLetter({
        name:        name.trim(),
        passport:    passport.trim().toUpperCase(),
        nationality: nationality.trim(),
        type:        template,
      });

      downloadBase64PDF(res.base64, res.fileName);
      setLastFile(res.fileName);
      reset();
      setLastFile(res.fileName); // keep after reset
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate letter';
      if (msg === 'SESSION_EXPIRED') return; // lib/api.ts redirects to /
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
        Generate a single offer letter. Select the template, fill in the candidate details, and download the PDF.
      </p>

      {/* Template picker */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        <TemplateCard
          label="PSBD" sub="All Over UAE" icon="🏛️"
          selected={template === 'PSBD'} onClick={() => setTemplate('PSBD')}
        />
        <TemplateCard
          label="SIRA" sub="Dubai Only" icon="⭐"
          selected={template === 'SIRA'} onClick={() => setTemplate('SIRA')}
        />
      </div>

      {/* Template info strip */}
      <div style={{
        background: '#f8faff', border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: '8px 14px', fontSize: 12, color: MUTED, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{template === 'PSBD' ? '🏛️' : '⭐'}</span>
        {template === 'PSBD'
          ? 'PSBD template — valid for security officer roles across all UAE emirates.'
          : 'SIRA template — valid for security officer roles within Dubai jurisdiction.'}
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginBottom: 20 }}>
        <Field
          label="Candidate Full Name" value={name} onChange={setName}
          placeholder="e.g. Mohammed Al Rashid" required
        />
        <Field
          label="Passport No" value={passport} onChange={v => setPassport(v.toUpperCase())}
          placeholder="e.g. EA0537817" required
        />
        <Field
          label="Nationality" value={nationality} onChange={setNationality}
          placeholder="e.g. Indian" required
        />
        <Field
          label="Letter Date" value={todayFormatted()} readOnly
        />
      </div>

      {/* Feedback */}
      {error && <Alert type="error">{error}</Alert>}
      {lastFile && (
        <Alert type="success">
          Downloaded <strong>{lastFile}</strong> successfully.
        </Alert>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={reset}
          disabled={loading}
          style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1.5px solid ${BORDER}`, background: 'none',
            fontSize: 13, cursor: 'pointer', color: TEXT,
          }}
        >
          Clear
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding:      '10px 24px',
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
          {loading ? '⏳ Generating…' : `⬇ Download ${template} Offer Letter`}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// BULK TAB
// ══════════════════════════════════════════════════════════

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function BulkTab() {
  const fileRef                       = useRef<HTMLInputElement>(null);
  const [rows,      setRows]          = useState<ParsedRow[]>([]);
  const [loading,   setLoading]       = useState(false);
  const [error,     setError]         = useState('');
  const [success,   setSuccess]       = useState('');
  const [dragging,  setDragging]      = useState(false);
  const [confirmed, setConfirmed]     = useState(false);

  function clearAll() {
    setRows([]); setError(''); setSuccess('');
    setConfirmed(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  // ── Excel parser ───────────────────────────────────────
  const parseExcel = useCallback((file: File) => {
    setError(''); setSuccess(''); setConfirmed(false);

    // MIME type check
    if (!EXCEL_MIME_TYPES.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Invalid file type. Please upload an Excel file (.xlsx or .xls).');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const json     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

        if (!json.length) { setError('The Excel file contains no data rows.'); return; }
        if (json.length > 200) { setError('Maximum 200 rows allowed per batch.'); return; }

        const get = (row: Record<string, string>, keys: string[]) => {
          for (const k of keys) {
            const match = Object.keys(row).find(rk => rk.trim().toUpperCase() === k.toUpperCase());
            if (match) return String(row[match] ?? '').trim();
          }
          return '';
        };

        const parsed: ParsedRow[] = json.map(row => {
          const name        = get(row, ['FULL NAME', 'FULLNAME', 'NAME', 'CANDIDATE NAME', 'CANDIDATE FULL NAME']);
          const passport    = get(row, ['PASSPORT NO', 'PASSPORT', 'PASSPORT NUMBER', 'PASSPORT_NO', 'PP NO', 'PP No']).toUpperCase();
          const nationality = get(row, ['NATIONALITY', 'NATION']);
          const licRaw      = get(row, ['LIC', 'LICENSE', 'TEMPLATE', 'TYPE', 'CATEGORY', 'LIC AUTH']).toUpperCase();
          const lic         = licRaw as OfferLetterType;

          let _error = '';
          if (!name)                            _error = 'Missing name';
          else if (!passport)                   _error = 'Missing passport no';
          else if (!nationality)                _error = 'Missing nationality';
          else if (!['PSBD', 'SIRA'].includes(licRaw))
            _error = `Invalid LIC "${licRaw || '(empty)'}" — use PSBD or SIRA`;

          return { name, passport, nationality, lic, _error };
        });

        setRows(parsed);
      } catch {
        setError('Failed to parse the Excel file. Ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

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

  // ── Computed stats ─────────────────────────────────────
  const validRows   = rows.filter(r => !r._error);
  const invalidRows = rows.filter(r =>  r._error);
  const psdbCount   = validRows.filter(r => r.lic === 'PSBD').length;
  const siraCount   = validRows.filter(r => r.lic === 'SIRA').length;

  // ── Generate ───────────────────────────────────────────
  async function handleGenerate() {
    if (!validRows.length) { setError('No valid rows to generate.'); return; }
    setError(''); setSuccess(''); setLoading(true);

    try {
      const res = await hrDocsApi.generateBulkOfferLetters(
        validRows.map(({ name, passport, nationality, lic }) => ({ name, passport, nationality, lic }))
      );

      downloadBase64PDF(res.base64, res.fileName);

      const skipped = res.errors?.length ? ` · ${res.errors.length} row(s) skipped by server` : '';
      setSuccess(`${res.count} offer letter${res.count !== 1 ? 's' : ''} generated and downloaded as ${res.fileName}${skipped}.`);
      clearAll();
      setSuccess(`${res.count} offer letter${res.count !== 1 ? 's' : ''} generated and downloaded as ${res.fileName}${skipped}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk generation failed';
      if (msg === 'SESSION_EXPIRED') return;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Upload zone ────────────────────────────────────────
  if (!rows.length) {
    return (
      <div>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
          Upload an Excel file with one row per candidate. Required columns: <strong>FULL NAME</strong>, <strong>PASSPORT NO</strong>, <strong>NATIONALITY</strong>, <strong>LIC</strong> (PSBD or SIRA).
        </p>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border:       `2px dashed ${dragging ? TEAL : BORDER}`,
            borderRadius: 12,
            padding:      '52px 24px',
            textAlign:    'center',
            cursor:       'pointer',
            background:   dragging ? '#f0fffe' : '#fafbfd',
            transition:   'all .15s',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontWeight: 700, color: TEXT, marginBottom: 6 }}>
            {dragging ? 'Release to upload' : 'Drop Excel file here or click to browse'}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>
            Accepts .xlsx or .xls · Maximum 200 rows per batch
          </div>
          <div style={{
            display: 'inline-block', background: NAVY, color: '#fff',
            borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600,
          }}>
            Choose File
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        {/* Column guide */}
        <div style={{
          marginTop: 16, background: '#f8faff', border: `1px solid ${BORDER}`,
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Expected columns
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 12 }}>
            {[
              ['FULL NAME', 'Candidate full name'],
              ['PASSPORT NO', 'Passport number'],
              ['NATIONALITY', 'Country of nationality'],
              ['LIC', 'PSBD or SIRA'],
            ].map(([col, desc]) => (
              <div key={col} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <code style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {col}
                </code>
                <span style={{ color: MUTED }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Preview + Confirm ──────────────────────────────────
  return (
    <div>
      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 14,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: TEXT }}>{rows.length}</strong>
            <span style={{ color: MUTED }}> rows</span>
          </span>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: GREEN }}>{validRows.length}</strong>
            <span style={{ color: MUTED }}> valid</span>
          </span>
          {invalidRows.length > 0 && (
            <span style={{ fontSize: 13 }}>
              <strong style={{ color: RED }}>{invalidRows.length}</strong>
              <span style={{ color: MUTED }}> errors</span>
            </span>
          )}
          {psdbCount > 0 && (
            <span style={{ fontSize: 12, color: MUTED }}>
              PSBD: <strong style={{ color: '#1d4ed8' }}>{psdbCount}</strong>
            </span>
          )}
          {siraCount > 0 && (
            <span style={{ fontSize: 12, color: MUTED }}>
              SIRA: <strong style={{ color: GOLD }}>{siraCount}</strong>
            </span>
          )}
        </div>
        <button
          onClick={clearAll}
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: '4px 12px',
            fontSize: 12, cursor: 'pointer', color: MUTED,
          }}
        >
          ✕ Clear &amp; re-upload
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f4f6fb', position: 'sticky', top: 0, zIndex: 1 }}>
                {['#', 'Full Name', 'Passport No', 'Nationality', 'Template', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '9px 14px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: MUTED,
                    textTransform: 'uppercase', letterSpacing: '.05em',
                    borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: row._error ? '#fff8f8' : i % 2 === 0 ? SURFACE : '#fafbfd',
                }}>
                  <td style={{ padding: '8px 14px', color: MUTED, fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: TEXT }}>
                    {row.name || <span style={{ color: '#fca5a5' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: MUTED }}>
                    {row.passport || <span style={{ color: '#fca5a5' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 14px', color: MUTED }}>
                    {row.nationality || <span style={{ color: '#fca5a5' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    {['PSBD', 'SIRA'].includes(row.lic)
                      ? <LicBadge lic={row.lic} />
                      : <span style={{ color: '#fca5a5', fontSize: 12 }}>—</span>
                    }
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

      {/* Error rows warning */}
      {invalidRows.length > 0 && (
        <Alert type="info">
          <strong>{invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''}</strong> with errors will be skipped. Only the {validRows.length} valid row{validRows.length !== 1 ? 's' : ''} will be included in the generated PDF.
        </Alert>
      )}

      {/* Confirmation step */}
      {!confirmed && validRows.length > 0 && (
        <div style={{
          background: '#f8faff', border: `1.5px solid ${NAVY}`,
          borderRadius: 10, padding: '16px 20px', marginBottom: 14,
        }}>
          <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6, fontSize: 14 }}>
            Confirm generation
          </div>
          <div style={{ fontSize: 13, color: TEXT, marginBottom: 14 }}>
            This will generate <strong>{validRows.length} offer letter{validRows.length !== 1 ? 's' : ''}</strong>
            {psdbCount > 0 && siraCount > 0
              ? ` (${psdbCount} PSBD + ${siraCount} SIRA)`
              : psdbCount > 0 ? ` (${psdbCount} PSBD)` : ` (${siraCount} SIRA)`
            } and merge them into a single PDF download.
          </div>
          <button
            onClick={() => setConfirmed(true)}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: TEAL, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ✓ Confirm — Generate {validRows.length} Letter{validRows.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Generate button */}
      {confirmed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => setConfirmed(false)}
            disabled={loading}
            style={{
              padding: '10px 18px', borderRadius: 8,
              border: `1.5px solid ${BORDER}`, background: 'none',
              fontSize: 13, cursor: 'pointer', color: TEXT,
            }}
          >
            Back
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding:      '10px 24px',
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
            {loading
              ? `⏳ Generating ${validRows.length} letters…`
              : `⬇ Generate & Download Merged PDF (${validRows.length})`
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function HRDocsClient() {
  const [tab, setTab] = useState<'individual' | 'bulk'>('individual');

  const tabStyle = (active: boolean): React.CSSProperties => ({
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

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>
          Docs Generator
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>
          Generate PSBD &amp; SIRA offer letters — individual or bulk batch.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: SURFACE, borderRadius: 14,
        border: `1px solid ${BORDER}`, maxWidth: 760, overflow: 'hidden',
      }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, padding: '14px 20px',
          borderBottom: `1px solid ${BORDER}`, background: '#f9fafb',
        }}>
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
