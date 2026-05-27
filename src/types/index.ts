// ─── Application ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'filled'
  | 'submitted'
  | 'reviewing'
  | 'interview'
  | 'rejected'
  | 'offer';

export interface Application {
  id: string;
  company: string;
  role: string;
  date: string;
  status: ApplicationStatus;
  url: string;
  logoColor: string; // CSS color for avatar fallback
  fieldsDetected: number;
  fieldsFilled: number;
  timeSavedSeconds: number;
  resumeUsed: string;
}

// ─── Field Detection ──────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'file'
  | 'select'
  | 'checkbox';

export type FieldStatus = 'ready' | 'needs_review' | 'empty' | 'filled';

export interface DetectedField {
  id: string;
  label: string;
  type: FieldType;
  value: string;
  confidence: number; // 0–100
  status: FieldStatus;
  isCustomQuestion: boolean;
  aiAnswer?: string;
}

// ─── Extension Popup State ────────────────────────────────────────────────────

export type ExtensionStep =
  | 'idle'
  | 'analyzing'
  | 'fields_detected'
  | 'autofilling'
  | 'review_required';

export interface ExtensionState {
  step: ExtensionStep;
  company: string;
  role: string;
  fields: DetectedField[];
  fillProgress: number; // 0–100
  currentFillingField: string;
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  name: string;
  filename: string;
  isDefault: boolean;
  lastUsed: string;
  applications: number;
  tags: string[];
  sizeKb: number;
  targetRole: string;
}

// ─── Saved Answers ────────────────────────────────────────────────────────────

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  category: string;
  usageCount: number;
  lastUsed: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  workAuthorization: string;
  yearsExperience: number;
  onboardingDone?: boolean;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalApplications: number;
  applicationsThisWeek: number;
  timeSavedMinutes: number;
  interviewRate: number; // %
  avgFieldsPerApp: number;
  successRate: number; // %
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export type ActivityType = 'filled' | 'interview' | 'offer' | 'resume_uploaded' | 'answer_saved';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  company?: string;
  time: string;
}
