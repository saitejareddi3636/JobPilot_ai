// TODO: Replace all mock data with real API calls to your backend.
// Each export maps to a REST endpoint or a database query.
// Suggested API shape: GET /api/v1/<resource>

import type {
  Application,
  DetectedField,
  Resume,
  SavedAnswer,
  UserProfile,
  DashboardStats,
  ActivityItem,
} from '../types';

// ─── User Profile ─────────────────────────────────────────────────────────────
// TODO: GET /api/v1/profile
export const mockProfile: UserProfile = {
  id: 'user_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@email.com',
  phone: '+1 (555) 234-7890',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexrivera',
  github: 'github.com/alexrivera',
  portfolio: 'alexrivera.dev',
  workAuthorization: 'US Citizen',
  yearsExperience: 5,
  onboardingDone: true,
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// TODO: GET /api/v1/stats
export const mockStats: DashboardStats = {
  totalApplications: 47,
  applicationsThisWeek: 12,
  timeSavedMinutes: 284,
  interviewRate: 34,
  avgFieldsPerApp: 11,
  successRate: 78,
};

// ─── Activity Feed ────────────────────────────────────────────────────────────
// TODO: GET /api/v1/activity?limit=10
export const mockActivity: ActivityItem[] = [
  { id: 'a1', type: 'interview', text: 'Interview scheduled at Stripe', company: 'Stripe', time: '2 hours ago' },
  { id: 'a2', type: 'filled', text: 'Application filled at Notion', company: 'Notion', time: '5 hours ago' },
  { id: 'a3', type: 'filled', text: 'Application filled at Linear', company: 'Linear', time: '1 day ago' },
  { id: 'a4', type: 'offer', text: 'Offer received from Figma!', company: 'Figma', time: '2 days ago' },
  { id: 'a5', type: 'filled', text: 'Application filled at Vercel', company: 'Vercel', time: '2 days ago' },
  { id: 'a6', type: 'resume_uploaded', text: 'New resume uploaded: Backend_v3.pdf', time: '3 days ago' },
  { id: 'a7', type: 'answer_saved', text: '"Why do you want to work here?" answer saved', time: '3 days ago' },
  { id: 'a8', type: 'filled', text: 'Application filled at Loom', company: 'Loom', time: '4 days ago' },
];

// ─── Applications ─────────────────────────────────────────────────────────────
// TODO: GET /api/v1/applications
export const mockApplications: Application[] = [
  {
    id: 'app_01', company: 'Stripe', role: 'Senior Frontend Engineer',
    date: '2026-05-26', status: 'interview', url: 'stripe.com/jobs',
    logoColor: '#635BFF', fieldsDetected: 14, fieldsFilled: 14, timeSavedSeconds: 420, resumeUsed: 'Frontend_v2.pdf',
  },
  {
    id: 'app_02', company: 'Notion', role: 'Software Engineer, Growth',
    date: '2026-05-26', status: 'submitted', url: 'notion.so/jobs',
    logoColor: '#000000', fieldsDetected: 11, fieldsFilled: 11, timeSavedSeconds: 330, resumeUsed: 'General_v1.pdf',
  },
  {
    id: 'app_03', company: 'Linear', role: 'Full Stack Engineer',
    date: '2026-05-25', status: 'submitted', url: 'linear.app/jobs',
    logoColor: '#5E6AD2', fieldsDetected: 9, fieldsFilled: 9, timeSavedSeconds: 270, resumeUsed: 'Frontend_v2.pdf',
  },
  {
    id: 'app_04', company: 'Figma', role: 'Frontend Engineer, Editor',
    date: '2026-05-24', status: 'offer', url: 'figma.com/jobs',
    logoColor: '#F24E1E', fieldsDetected: 13, fieldsFilled: 13, timeSavedSeconds: 390, resumeUsed: 'Frontend_v2.pdf',
  },
  {
    id: 'app_05', company: 'Vercel', role: 'Developer Experience Engineer',
    date: '2026-05-24', status: 'reviewing', url: 'vercel.com/careers',
    logoColor: '#000000', fieldsDetected: 12, fieldsFilled: 12, timeSavedSeconds: 360, resumeUsed: 'General_v1.pdf',
  },
  {
    id: 'app_06', company: 'Loom', role: 'React Native Engineer',
    date: '2026-05-23', status: 'submitted', url: 'loom.com/jobs',
    logoColor: '#625DF5', fieldsDetected: 10, fieldsFilled: 10, timeSavedSeconds: 300, resumeUsed: 'Mobile_v1.pdf',
  },
  {
    id: 'app_07', company: 'Retool', role: 'Senior Software Engineer',
    date: '2026-05-22', status: 'rejected', url: 'retool.com/careers',
    logoColor: '#3D63DD', fieldsDetected: 11, fieldsFilled: 11, timeSavedSeconds: 330, resumeUsed: 'General_v1.pdf',
  },
  {
    id: 'app_08', company: 'Clerk', role: 'Frontend Platform Engineer',
    date: '2026-05-21', status: 'submitted', url: 'clerk.com/jobs',
    logoColor: '#6C47FF', fieldsDetected: 10, fieldsFilled: 10, timeSavedSeconds: 300, resumeUsed: 'Frontend_v2.pdf',
  },
];

// ─── Detected Fields ──────────────────────────────────────────────────────────
// TODO: POST /api/v1/detect-fields  body: { pageHtml, url }
// This is what the extension sends after scraping the page.
export const mockDetectedFields: DetectedField[] = [
  {
    id: 'f1', label: 'Full Name', type: 'text',
    value: 'Alex Rivera', confidence: 99, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f2', label: 'Email Address', type: 'email',
    value: 'alex.rivera@email.com', confidence: 99, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f3', label: 'Phone Number', type: 'phone',
    value: '+1 (555) 234-7890', confidence: 98, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f4', label: 'Location / City', type: 'text',
    value: 'San Francisco, CA', confidence: 97, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f5', label: 'LinkedIn URL', type: 'url',
    value: 'https://linkedin.com/in/alexrivera', confidence: 99, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f6', label: 'GitHub URL', type: 'url',
    value: 'https://github.com/alexrivera', confidence: 99, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f7', label: 'Portfolio / Website', type: 'url',
    value: 'https://alexrivera.dev', confidence: 94, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f8', label: 'Resume Upload', type: 'file',
    value: 'Frontend_v2.pdf', confidence: 100, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f9', label: 'Work Authorization', type: 'select',
    value: 'US Citizen — No sponsorship required', confidence: 99, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f10', label: 'Years of Experience', type: 'select',
    value: '5 years', confidence: 96, status: 'ready', isCustomQuestion: false,
  },
  {
    id: 'f11', label: 'Why do you want to work at Stripe?', type: 'textarea',
    value: '',
    confidence: 88,
    status: 'needs_review',
    isCustomQuestion: true,
    aiAnswer: `Stripe's focus on developer experience and financial infrastructure deeply resonates with me. I've admired how Stripe has turned payments—a traditionally painful engineering problem—into an elegant, developer-first platform. As a frontend engineer, I'm excited about contributing to tools that millions of developers rely on daily. I'm particularly drawn to Stripe's culture of high craft and long-term thinking, which aligns with how I approach my own work.`,
  },
  {
    id: 'f12', label: 'Describe a challenging technical problem you solved.', type: 'textarea',
    value: '',
    confidence: 85,
    status: 'needs_review',
    isCustomQuestion: true,
    aiAnswer: `At my previous company, we faced severe performance degradation in our React dashboard as data volume grew. The root cause was unnecessary re-renders cascading through a deeply nested component tree. I led a systematic profiling effort using React DevTools and Chrome Performance, identified the hotspots, and implemented a combination of React.memo, useMemo, and state colocation strategies. The result was an 80% reduction in render time and a measurably smoother user experience. The project reinforced my belief that performance work requires measurement first, optimization second.`,
  },
];

// ─── Resumes ──────────────────────────────────────────────────────────────────
// TODO: GET /api/v1/resumes
export const mockResumes: Resume[] = [
  {
    id: 'r1', name: 'Frontend Engineer v2', filename: 'Frontend_v2.pdf',
    isDefault: true, lastUsed: '2026-05-26', applications: 24,
    tags: ['React', 'TypeScript', 'Frontend'], sizeKb: 187, targetRole: 'Frontend Engineer',
  },
  {
    id: 'r2', name: 'General Software Engineer', filename: 'General_v1.pdf',
    isDefault: false, lastUsed: '2026-05-24', applications: 18,
    tags: ['Full Stack', 'Node.js', 'General'], sizeKb: 204, targetRole: 'Software Engineer',
  },
  {
    id: 'r3', name: 'Mobile Engineer', filename: 'Mobile_v1.pdf',
    isDefault: false, lastUsed: '2026-05-23', applications: 5,
    tags: ['React Native', 'iOS', 'Mobile'], sizeKb: 175, targetRole: 'Mobile Engineer',
  },
  {
    id: 'r4', name: 'Backend Engineer v1', filename: 'Backend_v1.pdf',
    isDefault: false, lastUsed: '2026-05-20', applications: 3,
    tags: ['Node.js', 'Go', 'APIs', 'Backend'], sizeKb: 198, targetRole: 'Backend Engineer',
  },
];

// ─── Saved Answers ────────────────────────────────────────────────────────────
// TODO: GET /api/v1/saved-answers
export const mockSavedAnswers: SavedAnswer[] = [
  {
    id: 'sa1',
    question: 'Why do you want to work here?',
    answer: `I'm drawn to companies that are building developer-first products with high craft standards. I look for engineering cultures where long-term thinking is valued over short-term velocity, and where my work has a direct, measurable impact on users.`,
    category: 'Motivation',
    usageCount: 14,
    lastUsed: '2026-05-26',
  },
  {
    id: 'sa2',
    question: 'Tell us about yourself.',
    answer: `I'm a senior frontend engineer with 5 years of experience building scalable, performant web applications. I specialize in React and TypeScript, and I care deeply about developer experience and design systems. I've worked across early-stage startups and growth-stage companies, which has given me a broad perspective on shipping product quickly without sacrificing quality.`,
    category: 'Introduction',
    usageCount: 22,
    lastUsed: '2026-05-26',
  },
  {
    id: 'sa3',
    question: 'What is your greatest strength?',
    answer: `My ability to bridge the gap between design and engineering. I can take a complex design spec and translate it into a clean, accessible, and performant implementation while also pushing back thoughtfully when a design decision would create technical debt. This makes me an effective collaborator with both designers and product managers.`,
    category: 'Personal',
    usageCount: 9,
    lastUsed: '2026-05-24',
  },
  {
    id: 'sa4',
    question: 'Describe a challenging technical problem you solved.',
    answer: `At my previous company, I led a performance overhaul of our React dashboard that was suffering from cascading re-renders. I profiled the app, identified root causes, and implemented memoization, state colocation, and virtualization strategies that reduced render time by 80% and eliminated user-visible jank.`,
    category: 'Technical',
    usageCount: 11,
    lastUsed: '2026-05-25',
  },
  {
    id: 'sa5',
    question: 'What are you looking for in your next role?',
    answer: `A role where I can have meaningful technical ownership, work with a strong team that takes quality seriously, and build products that real users love. I'm looking for an environment that invests in engineering excellence and gives engineers a seat at the table in product decisions.`,
    category: 'Motivation',
    usageCount: 18,
    lastUsed: '2026-05-26',
  },
  {
    id: 'sa6',
    question: 'How do you handle disagreements with teammates?',
    answer: `I try to anchor disagreements to shared goals rather than personal preferences. I listen carefully to understand the reasoning behind a different viewpoint, share my perspective with evidence, and if we're still stuck, propose a small experiment or defer to whoever will be most impacted. I've found that the best technical decisions usually come from respectful debate, not consensus.`,
    category: 'Behavioral',
    usageCount: 7,
    lastUsed: '2026-05-22',
  },
  {
    id: 'sa7',
    question: 'What is your expected salary range?',
    answer: `Based on my experience and the current market, I'm targeting a base salary in the $180,000–$210,000 range, with flexibility depending on the overall compensation package, equity structure, and growth opportunities.`,
    category: 'Compensation',
    usageCount: 12,
    lastUsed: '2026-05-25',
  },
  {
    id: 'sa8',
    question: 'Are you open to relocation?',
    answer: `I'm currently based in San Francisco and open to roles in the Bay Area. I'm also open to fully remote positions or hybrid arrangements with occasional travel.`,
    category: 'Logistics',
    usageCount: 8,
    lastUsed: '2026-05-23',
  },
];
