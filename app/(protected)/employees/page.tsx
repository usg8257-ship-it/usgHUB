'use client';
// app/(protected)/employees/page.tsx
// Full CRUD: list, add, edit, delete employees from MASTER sheet
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/lib/api';
import type { Employee } from '@/types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────

const ENTITY_COLOURS: Record<string, string> = {
  USG: '#1e4799', UG: '#007a8a', 'USG-M': '#4e42b8', UST: '#136e42',
};

function Badge({ text, colour }: { text: string; colour?: string }) {
  const bg = colour ?? '#526278';
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
  );
}

// ── Empty form ───────────────────────────────────────────────
const EMPTY: Partial<Employee> = {
  NAME: '', DESIGNATION: '', ENTITY: 'USG', NATIONALITY: '',
  'PASSPORT NO': '', 'EID NO': '', VISA: '', STATUS: '',
  'LIC AUTH': 'NIL', 'DATE OF JOIN': '', EMAIL: '', MOBILE: '',
};

// ── Main component ───────────────────────────────────────────
export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null);
  const [form, setForm]       = useState<Partial<Employee>>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [formError, setFormError]       = useState('');

  // ── Queries ──────────────────────────────────────────────
  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn:  employeeApi.getAll,
  });

  // ── Mutations ────────────────────────────────────────────
  const addMut = useMutation({
    mutationFn: employeeApi.add,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); },
    onError:   (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: employeeApi.update,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); },
    onError:   (e: Error) => setFormError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
                  employeeApi.delete(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setDeleteTarget(null); },
  });

  // ── Filtered list ────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = employees.filter(e =>
    !q ||
    e.NAME?.toLowerCase().includes(q) ||
    e['PASSPORT NO']?.toLowerCase().includes(q) ||
    e.ID?.toString().includes(q) ||
    e.DESIGNATION?.toLowerCase().includes(q)
  );

  // ── Form helpers ─────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY);
    setFormError('');
    setModal('add');
  }

  function openEdit(emp: Employee) {
    setForm({ ...emp });
    setFormError('');
    setModal('edit');
  }

  function handleSave() {
    if (!form.NAME?.trim())     { setFormError('Name is required');        return; }
    if (!form.DESIGNATION?.trim()) { setFormError('Designation is required'); return; }
    if (!form.ENTITY?.trim())   { setFormError('Entity is required');      return; }
    setFormError('');
    if (modal === 'add') addMut.mutate(form);
    else                 updateMut.mutate(form);
  }

  const saving = addMut.isPending || updateMut.isPending;

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {employees.length} total · {filtered.length} shown
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, passport…"
              style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }}
            />
          </div>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && <p style={{ color: 'var(--muted)' }}>Loading employees…</p>}
      {error    && <p style={{ color: 'var(--red)' }}>Error: {(error as Error).message}</p>}

      {/* Table */}
      {!isLoading && (
        <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['ID','Name','Designation','Entity','Lic Auth','Status','Nationality','Passport No','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.ID ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{emp.ID}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>{emp.NAME}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{emp.DESIGNATION}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge text={emp.ENTITY} colour={ENTITY_COLOURS[emp.ENTITY]} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge text={emp['LIC AUTH'] || 'NIL'} colour={emp['LIC AUTH'] === 'PSBD' ? '#1e4799' : emp['LIC AUTH'] === 'SIRA' ? '#007a8a' : '#526278'} />
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{emp.STATUS}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{emp.NATIONALITY}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{emp['PASSPORT NO']}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(emp)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--navy)' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setDeleteTarget(emp); setDeleteReason(''); }} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Employee' : 'Edit Employee'} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            {[
              { key: 'NAME',        label: 'Full Name',    required: true },
              { key: 'DESIGNATION', label: 'Designation',  required: true },
              { key: 'ENTITY',      label: 'Entity' },
              { key: 'NATIONALITY', label: 'Nationality' },
              { key: 'PASSPORT NO', label: 'Passport No' },
              { key: 'EID NO',      label: 'EID No' },
              { key: 'VISA',        label: 'Visa Status' },
              { key: 'STATUS',      label: 'Status' },
              { key: 'LIC AUTH',    label: 'Lic Authority' },
              { key: 'DATE OF JOIN',label: 'Date of Join' },
              { key: 'EMAIL',       label: 'Email' },
              { key: 'MOBILE',      label: 'Mobile' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  value={(form[key] ?? '') as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          {formError && (
            <div style={{ marginTop: 12, background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 12px', fontSize: 12.5, color: 'var(--red)' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', borderRadius: 7, border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal title="Remove Employee" onClose={() => setDeleteTarget(null)}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            Remove <strong>{deleteTarget.NAME}</strong> (ID: {deleteTarget.ID}) from MASTER?
            They will be moved to EX EMPLOYEE log.
          </p>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Reason *</label>
            <input
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Resignation / Termination / etc."
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 18px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => deleteReason.trim() && deleteMut.mutate({ id: deleteTarget.ID, reason: deleteReason })}
              disabled={!deleteReason.trim() || deleteMut.isPending}
              style={{ padding: '9px 18px', borderRadius: 7, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !deleteReason.trim() ? 0.5 : 1 }}
            >
              {deleteMut.isPending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal wrapper ───────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.25)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--navy)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
