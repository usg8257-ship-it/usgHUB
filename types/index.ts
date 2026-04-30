// ============================================================
// types/index.ts — Shared TypeScript types
// mirrors your Google Sheet column names exactly
// ============================================================

// ── Auth ────────────────────────────────────────────────────
export type Role = 'SUPER_ADMIN' | 'HR_OFFICER' | 'STAFF' | 'EMPLOYEE' | 'NONE';

export interface UserProfile {
  email:      string;
  name:       string;
  role:       Role;
  entities:   string[] | 'ALL';
  active:     boolean;
  mustChange?: boolean;
}

// ── MASTER sheet ────────────────────────────────────────────
export interface Employee {
  ID:             string;
  NAME:           string;
  VISA:           string;
  STATUS:         string;
  ENTITY:         string;
  'LIC AUTH':     string;
  DESIGNATION:    string;
  'DATE OF JOIN': string;
  NATIONALITY:    string;
  'BIRTH DATE':   string;
  'PASSPORT NO':  string;
  'EID NO':       string;
  EMAIL?:         string;
  MOBILE?:        string;
  [key: string]:  string | undefined;
}

// ── Onboarding sheet ────────────────────────────────────────
export interface OnboardingRecord {
  OB_ID:        string;
  NAME:         string;
  PASSPORT_NO:  string;
  LIC_AUTH:     string;
  MOBILE:       string;
  TYPE:         string;
  JOIN_DATE:    string;
  DATE_ADDED:   string;
  STATUS:       string;
  NOTES:        string;
  AIRPORT:      string;
  ASASSIGNED_TO: string;
  ENTITY?:      string;
}

// ── ACTIVE ONBOARDING (20DS Tracker) ────────────────────────
export type StepStatus = 'Pending' | 'In progress' | 'Done' | 'Fit' | 'Unfit' | 'Not Started' | 'Locked' | 'Problem';

export interface StepData {
  status:        StepStatus;
  responsible:   string;
  substeps:      Record<string, string>;
  complete_date: string;
  notes:         string;
  reason:        string;
}

export type StepKey = 'STEP_VISA' | 'STEP_LABOR' | 'STEP_MEDICAL' | 'STEP_INSURANCE' | 'STEP_NSI' | 'STEP_EID' | 'STEP_ASSD';

export interface DSRecord {
  DS_ID:              string;
  EMP_ID:             string;
  EMP_NAME:           string;
  DESIGNATION:        string;
  MOBILE:             string;
  EMAIL:              string;
  EXP_JOIN_DATE:      string;
  PIPELINE_ADDED_DATE: string;
  TRANSFER_DATE:      string;
  TRANSFERRED_BY:     string;
  RESPONSIBLE_HR:     string;
  STEP_VISA:          StepData;
  STEP_LABOR:         StepData;
  STEP_MEDICAL:       StepData;
  STEP_INSURANCE:     StepData;
  STEP_NSI:           StepData;
  STEP_EID:           StepData;
  STEP_ASSD:          StepData;
  CANCELLED:          boolean;
  CANCEL_REASON:      string;
  CANCELLED_BY:       string;
  CANCELLED_ON:       string;
  TOTAL_DAYS_ELAPSED: number;
  OB_COMPLETE:        boolean;
  BLOCKER_REASON?:    string;
}

// ── Steps Config ────────────────────────────────────────────
export interface StepConfig {
  key:       StepKey;
  label:     string;
  short:     string;
  slaHours:  number;
  statuses:  string[];
  substeps:  Record<string, string>;
  order:     number;
  active:    boolean;
}

// ── HR Docs ─────────────────────────────────────────────────
export interface HRDoc {
  REF_NO:      string;
  EMP_ID:      string;
  EMP_NAME:    string;
  LETTER_TYPE: string;
  ISSUE_DATE:  string;
  ISSUED_BY:   string;
  NOTES:       string;
  ENTITY:      string;
}

// ── Users ────────────────────────────────────────────────────
export interface AppUser {
  EMAIL:        string;
  DISPLAY_NAME: string;
  ROLE:         Role;
  ENTITIES:     string;
  ACTIVE:       boolean;
}

// ── Leave ───────────────────────────────────────────────────
export interface LeaveRecord {
  LEAVE_ID:   string;
  EMP_ID:     string;
  EMP_NAME:   string;
  TYPE:       string;
  FROM_DATE:  string;
  TO_DATE:    string;
  DAYS:       number;
  STATUS:     string;
  NOTES:      string;
  ENTITY:     string;
}

// ── Jobs & Applications ─────────────────────────────────────
export interface Job {
  JOB_ID:       string;
  TITLE:        string;
  ENTITY:       string;
  LOCATION:     string;
  JOB_TYPE:     string;
  DESCRIPTION:  string;
  REQUIREMENTS: string;
  STATUS:       string;
  POSTED_DATE:  string;
  POSTED_BY:    string;
  SALARY_RANGE: string;
}

export interface Application {
  APP_ID:           string;
  JOB_ID:           string;
  JOB_TITLE:        string;
  FULL_NAME:        string;
  EMAIL:            string;
  PHONE:            string;
  NATIONALITY:      string;
  PASSPORT_NO:      string;
  EXPERIENCE_YEARS: string;
  CURRENT_COMPANY:  string;
  COVER_NOTE:       string;
  CV_DRIVE_LINK:    string;
  APPLIED_DATE:     string;
  STAGE:            string;
  NOTES:            string;
  REVIEWED_BY:      string;
}

// ── GAS API envelope ────────────────────────────────────────
export interface GasResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  [key: string]: unknown;
}
