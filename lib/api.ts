// ============================================================
// lib/api.ts — Client-side typed API functions
// All calls go to /api/run (never directly to GAS)
// Import these in React components + TanStack Query hooks
// ============================================================
import type {
  Employee, OnboardingRecord, DSRecord, StepConfig,
  HRDoc, AppUser, LeaveRecord, Job, Application, GasResponse
} from '@/types';

// ── Core fetcher ────────────────────────────────────────────

async function run<T = unknown>(fn: string, args: unknown[] = []): Promise<T> {
  const res = await fetch('/api/run', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fn, args }),
  });

  if (res.status === 401) {
    // Session expired — force re-login
    window.location.href = '/';
    throw new Error('SESSION_EXPIRED');
  }

  const json: GasResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? 'Unknown error');
  }

  return json.data as T;
}

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    return res.json();
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  },

  me: async () => {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  },
};

// ── Employees (MASTER sheet) ─────────────────────────────────

export const employeeApi = {
  getAll:  ()               => run<Employee[]>('getMasterData'),
  add:     (data: Partial<Employee>) => run<{ empId: string }>('addEmployee', [data]),
  update:  (data: Partial<Employee>) => run<void>('updateEmployee', [data]),
  delete:  (empId: string, reason: string) => run<void>('deleteEmployee', [empId, reason]),
};

// ── Onboarding pipeline ──────────────────────────────────────

export const onboardingApi = {
  getAll:          ()                               => run<OnboardingRecord[]>('getOnboarding'),
  add:             (data: Partial<OnboardingRecord>) => run<{ obId: string }>('addOnboarding', [data]),
  update:          (data: Partial<OnboardingRecord>) => run<void>('updateOnboarding', [data]),
  delete:          (obId: string)                   => run<void>('deleteOnboarding', [obId]),
  transferToMaster:(obId: string, empData: Partial<Employee>) =>
                                                      run<void>('transferToMaster', [obId, empData]),
};

// ── 20DS Tracker (ACTIVE ONBOARDING sheet) ───────────────────

export const trackerApi = {
  getAll:       ()                                                          => run<DSRecord[]>('get20DSTracker'),
  updateStep:   (dsId: string, stepKey: string, data: object)              => run<void>('update20DSStep', [dsId, stepKey, data]),
  completeStep: (dsId: string, stepKey: string, date: string, notes: string) => run<void>('completeDSStep', [dsId, stepKey, date, notes]),
  recalculate:  ()                                                          => run<void>('recalculate20DSTotals'),
  setResponsible:(dsId: string, hr: string)                                => run<void>('update20DSResponsible', [dsId, hr]),
  cancel:       (dsId: string, reason: string)                             => run<void>('cancel20DSRecord', [dsId, reason]),
  getAuditLog:  ()                                                          => run<object[]>('get20DSAuditLog'),
  getAnalytics: ()                                                          => run<object>('get20DSAnalytics'),
};

// ── Step Config ──────────────────────────────────────────────

export const stepConfigApi = {
  get:   ()                         => run<StepConfig[]>('getStepConfig'),
  save:  (steps: StepConfig[])      => run<void>('saveStepConfig', [steps]),
  merge: (keyA: string, keyB: string, newStep: Partial<StepConfig>) =>
                                       run<{ migratedCount: number }>('mergeSteps', [keyA, keyB, newStep]),
};

// ── HR Docs ──────────────────────────────────────────────────

export const hrDocsApi = {
  getAll:          ()                    => run<HRDoc[]>('getHRDocs'),
  issue:           (data: object)        => run<{ refNo: string }>('issueHRDoc', [data]),
  generateLetter:  (data: object)        => run<{ url: string }>('generateAndIssueLetter', [data]),
  generateExpLetter:(empId: string)      => run<{ url: string }>('generateExperienceLetterForEmp', [empId]),
};

// ── Users (Admin) ────────────────────────────────────────────

export const usersApi = {
  getAll:       ()                                 => run<AppUser[]>('getUsers'),
  save:         (data: Partial<AppUser>)           => run<void>('saveUser', [data]),
  delete:       (email: string)                    => run<void>('deleteUser', [email]),
  toggleActive: (email: string, active: boolean)   => run<void>('toggleUserActive', [email, active]),
  resetPassword:(email: string)                    => run<{ tempPassword: string }>('resetUserPassword', [email]),
  changeMyPassword: (oldPw: string, newPw: string) => run<void>('changeMyPassword', [oldPw, newPw]),
  updateMyProfile:  (data: object)                 => run<void>('updateMyProfile', [data]),
};

// ── Leave ────────────────────────────────────────────────────

export const leaveApi = {
  getAll:        (empId?: string)                          => run<LeaveRecord[]>('getLeave', [empId]),
  add:           (data: Partial<LeaveRecord>)              => run<void>('addLeave', [data]),
  updateStatus:  (leaveId: string, status: string, notes: string) =>
                                                              run<void>('updateLeaveStatus', [leaveId, status, notes]),
};

// ── Recruitment ──────────────────────────────────────────────

export const recruitmentApi = {
  getJobs:          ()                                        => run<Job[]>('getJobs'),
  saveJob:          (data: Partial<Job>)                      => run<{ jobId: string }>('saveJob', [data]),
  closeJob:         (jobId: string)                           => run<void>('closeJob', [jobId]),
  getApplications:  (jobId?: string)                          => run<Application[]>('getApplications', [jobId]),
  updateStage:      (appId: string, stage: string, notes: string) =>
                                                                run<void>('updateApplicationStage', [appId, stage, notes]),
  transferToOnboarding: (appId: string)                       => run<{ obId: string }>('transferAppToOnboarding', [appId]),
};

// ── Config ───────────────────────────────────────────────────

export const configApi = {
  get:          ()              => run<Record<string, string>>('getConfig'),
  save:         (cfg: object)   => run<void>('saveConfig', [cfg]),
  getActivityLog: ()            => run<object[]>('getActivityLog'),
};
