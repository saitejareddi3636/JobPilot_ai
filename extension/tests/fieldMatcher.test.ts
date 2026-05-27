import { describe, it, expect } from 'vitest';
import { matchField } from '../fieldMatcher';
import type { FieldContext, Profile } from '../fieldMatcher';

const profile: Profile = {
  firstName: 'Sai',
  lastName: 'Reddy',
  email: 'sai@email.com',
  phone: '+1 (555) 123-4567',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94105',
  country: 'United States',
  currentTitle: 'Software Engineer',
  yearsExperience: 4,
  workAuthorization: 'H1B',
  salaryExpectation: '$130,000',
  noticePeriod: '2 weeks',
  linkedin: 'https://linkedin.com/in/saireddy',
  github: 'https://github.com/saireddy',
  portfolio: 'https://saireddy.dev',
  twitter: 'https://twitter.com/saireddy',
};

// Helper: build a minimal FieldContext
function ctx(overrides: Partial<FieldContext> = {}): FieldContext {
  return {
    name: '', id: '', placeholder: '', autocomplete: '',
    ariaLabel: '', labelText: '', type: 'text',
    ...overrides,
  };
}

// ─── Name fields ──────────────────────────────────────────────────────────────

describe('First name', () => {
  it('matches name="first_name"',           () => expect(matchField(ctx({ name: 'first_name' }), profile)).toBe('Sai'));
  it('matches name="firstName"',            () => expect(matchField(ctx({ name: 'firstName' }), profile)).toBe('Sai'));
  it('matches name="fname"',                () => expect(matchField(ctx({ name: 'fname' }), profile)).toBe('Sai'));
  it('matches id="given-name"',             () => expect(matchField(ctx({ id: 'given-name' }), profile)).toBe('Sai'));
  it('matches label "First Name"',          () => expect(matchField(ctx({ labelText: 'First Name *' }), profile)).toBe('Sai'));
  it('matches label "First name"',          () => expect(matchField(ctx({ labelText: 'First name' }), profile)).toBe('Sai'));
  it('matches autocomplete="given-name"',   () => expect(matchField(ctx({ autocomplete: 'given-name' }), profile)).toBe('Sai'));
});

describe('Last name', () => {
  it('matches name="last_name"',            () => expect(matchField(ctx({ name: 'last_name' }), profile)).toBe('Reddy'));
  it('matches name="lastName"',             () => expect(matchField(ctx({ name: 'lastName' }), profile)).toBe('Reddy'));
  it('matches name="lname"',                () => expect(matchField(ctx({ name: 'lname' }), profile)).toBe('Reddy'));
  it('matches label "Last Name *"',         () => expect(matchField(ctx({ labelText: 'Last Name *' }), profile)).toBe('Reddy'));
  it('matches id="family-name"',            () => expect(matchField(ctx({ id: 'family-name' }), profile)).toBe('Reddy'));
  it('matches label "Surname"',             () => expect(matchField(ctx({ labelText: 'Surname' }), profile)).toBe('Reddy'));
});

describe('Full name', () => {
  it('matches name="full_name"',            () => expect(matchField(ctx({ name: 'full_name' }), profile)).toBe('Sai Reddy'));
  it('matches label "Full Name"',           () => expect(matchField(ctx({ labelText: 'Full Name' }), profile)).toBe('Sai Reddy'));
  it('matches Ashby combined label',        () => expect(matchField(ctx({ labelText: 'Full Name (First name + Last name) *' }), profile)).toBe('Sai Reddy'));
  it('matches label "Your Name"',           () => expect(matchField(ctx({ labelText: 'Your Name' }), profile)).toBe('Sai Reddy'));
  it('matches label "Applicant Name"',      () => expect(matchField(ctx({ labelText: 'Applicant Name' }), profile)).toBe('Sai Reddy'));
  it('matches bare name not company',       () => expect(matchField(ctx({ name: 'name' }), profile)).toBe('Sai Reddy'));
  it('ignores company name field',          () => expect(matchField(ctx({ name: 'company_name' }), profile)).toBeNull());
  it('ignores employer name field',         () => expect(matchField(ctx({ labelText: 'Employer Name' }), profile)).toBeNull());
  it('ignores school name field',           () => expect(matchField(ctx({ labelText: 'School Name' }), profile)).toBeNull());
});

// ─── Contact fields ───────────────────────────────────────────────────────────

describe('Email', () => {
  it('matches name="email"',                () => expect(matchField(ctx({ name: 'email' }), profile)).toBe('sai@email.com'));
  it('matches id="email"',                  () => expect(matchField(ctx({ id: 'email' }), profile)).toBe('sai@email.com'));
  it('matches label "Email Address"',       () => expect(matchField(ctx({ labelText: 'Email Address' }), profile)).toBe('sai@email.com'));
  it('matches label "Email *"',             () => expect(matchField(ctx({ labelText: 'Email *' }), profile)).toBe('sai@email.com'));
  it('matches autocomplete="email"',        () => expect(matchField(ctx({ autocomplete: 'email' }), profile)).toBe('sai@email.com'));
  it('matches placeholder="Email"',        () => expect(matchField(ctx({ placeholder: 'Email' }), profile)).toBe('sai@email.com'));
});

describe('Phone', () => {
  it('matches name="phone"',                () => expect(matchField(ctx({ name: 'phone' }), profile)).toBe('+1 (555) 123-4567'));
  it('matches name="mobile"',               () => expect(matchField(ctx({ name: 'mobile' }), profile)).toBe('+1 (555) 123-4567'));
  it('matches name="telephone"',            () => expect(matchField(ctx({ name: 'telephone' }), profile)).toBe('+1 (555) 123-4567'));
  it('matches label "Phone Number *"',      () => expect(matchField(ctx({ labelText: 'Phone Number *' }), profile)).toBe('+1 (555) 123-4567'));
  it('matches label "Cell Phone"',          () => expect(matchField(ctx({ labelText: 'Cell Phone' }), profile)).toBe('+1 (555) 123-4567'));
  it('matches autocomplete="tel"',          () => expect(matchField(ctx({ autocomplete: 'tel' }), profile)).toBe('+1 (555) 123-4567'));
});

// ─── Location fields ──────────────────────────────────────────────────────────

describe('Location', () => {
  it('matches name="city"',                 () => expect(matchField(ctx({ name: 'city' }), profile)).toBe('San Francisco'));
  it('matches label "City"',                () => expect(matchField(ctx({ labelText: 'City' }), profile)).toBe('San Francisco'));
  it('matches name="state"',                () => expect(matchField(ctx({ name: 'state' }), profile)).toBe('CA'));
  it('matches label "State/Province"',      () => expect(matchField(ctx({ labelText: 'State/Province' }), profile)).toBe('CA'));
  it('matches name="zip_code"',             () => expect(matchField(ctx({ name: 'zip_code' }), profile)).toBe('94105'));
  it('matches label "ZIP Code"',            () => expect(matchField(ctx({ labelText: 'ZIP Code' }), profile)).toBe('94105'));
  it('matches label "Postal Code"',         () => expect(matchField(ctx({ labelText: 'Postal Code' }), profile)).toBe('94105'));
  it('matches name="country"',              () => expect(matchField(ctx({ name: 'country' }), profile)).toBe('United States'));
  it('matches label "Location"',            () => expect(matchField(ctx({ labelText: 'Location' }), profile)).toBe('San Francisco, CA'));
  it('does NOT match "job location"',       () => expect(matchField(ctx({ labelText: 'Job Location' }), profile)).toBeNull());
  it('does NOT match "remote location"',    () => expect(matchField(ctx({ labelText: 'Remote Location Preference' }), profile)).toBeNull());
});

// ─── Link fields ──────────────────────────────────────────────────────────────

describe('LinkedIn', () => {
  it('matches name="linkedin"',             () => expect(matchField(ctx({ name: 'linkedin' }), profile)).toBe('https://linkedin.com/in/saireddy'));
  it('matches label "LinkedIn Profile"',    () => expect(matchField(ctx({ labelText: 'LinkedIn Profile' }), profile)).toBe('https://linkedin.com/in/saireddy'));
  it('matches label "LinkedIn URL"',        () => expect(matchField(ctx({ labelText: 'LinkedIn URL' }), profile)).toBe('https://linkedin.com/in/saireddy'));
  it('matches id="linkedinUrl"',            () => expect(matchField(ctx({ id: 'linkedinUrl' }), profile)).toBe('https://linkedin.com/in/saireddy'));
  // Greenhouse uses urls[LinkedIn]
  it('matches name="urls[LinkedIn]"',       () => expect(matchField(ctx({ name: 'urls[LinkedIn]' }), profile)).toBe('https://linkedin.com/in/saireddy'));
});

describe('GitHub', () => {
  it('matches name="github"',               () => expect(matchField(ctx({ name: 'github' }), profile)).toBe('https://github.com/saireddy'));
  it('matches label "GitHub Profile"',      () => expect(matchField(ctx({ labelText: 'GitHub Profile' }), profile)).toBe('https://github.com/saireddy'));
  it('matches name="urls[GitHub]"',         () => expect(matchField(ctx({ name: 'urls[GitHub]' }), profile)).toBe('https://github.com/saireddy'));
});

describe('Portfolio', () => {
  it('matches label "Portfolio URL"',       () => expect(matchField(ctx({ labelText: 'Portfolio URL' }), profile)).toBe('https://saireddy.dev'));
  it('matches label "Personal Website"',    () => expect(matchField(ctx({ labelText: 'Personal Website' }), profile)).toBe('https://saireddy.dev'));
  it('matches label "Website"',             () => expect(matchField(ctx({ labelText: 'Website' }), profile)).toBe('https://saireddy.dev'));
  it('does NOT match company website',      () => expect(matchField(ctx({ labelText: 'Company Website' }), profile)).toBeNull());
  it('does NOT match linkedin in website',  () => expect(matchField(ctx({ labelText: 'LinkedIn Website' }), profile)).toBe('https://linkedin.com/in/saireddy'));
});

// ─── Work / experience fields ─────────────────────────────────────────────────

describe('Work authorization', () => {
  it('matches label "Work Authorization"',  () => expect(matchField(ctx({ labelText: 'Work Authorization' }), profile)).toBe('H1B'));
  it('matches label "Are you authorized"',  () => expect(matchField(ctx({ labelText: 'Are you authorized to work in the US?' }), profile)).toBe('H1B'));
  it('matches label "Visa Status"',         () => expect(matchField(ctx({ labelText: 'Visa Status' }), profile)).toBe('H1B'));
  it('matches label "Right to work"',       () => expect(matchField(ctx({ labelText: 'Right to work' }), profile)).toBe('H1B'));
  it('matches label "Require sponsorship"', () => expect(matchField(ctx({ labelText: 'Do you require sponsorship?' }), profile)).toBe('H1B'));
});

describe('Years of experience', () => {
  it('matches label "Years of Experience"', () => expect(matchField(ctx({ labelText: 'Years of Experience' }), profile)).toBe('4'));
  it('matches label "Years experience"',    () => expect(matchField(ctx({ labelText: 'Years experience' }), profile)).toBe('4'));
  it('matches name="years_exp"',            () => expect(matchField(ctx({ name: 'years_exp' }), profile)).toBe('4'));
});

describe('Job title', () => {
  it('matches label "Current Job Title"',   () => expect(matchField(ctx({ labelText: 'Current Job Title' }), profile)).toBe('Software Engineer'));
  it('matches label "Current Role"',        () => expect(matchField(ctx({ labelText: 'Current Role' }), profile)).toBe('Software Engineer'));
  it('matches label "Job Title"',           () => expect(matchField(ctx({ labelText: 'Job Title' }), profile)).toBe('Software Engineer'));
  it('ignores "Position applying for"',     () => expect(matchField(ctx({ labelText: 'Position applying for' }), profile)).toBeNull());
});

describe('Salary', () => {
  it('matches label "Salary Expectation"',  () => expect(matchField(ctx({ labelText: 'Salary Expectation' }), profile)).toBe('$130,000'));
  it('matches label "Desired Compensation"',() => expect(matchField(ctx({ labelText: 'Desired Compensation' }), profile)).toBe('$130,000'));
  it('matches label "Pay Expectation"',     () => expect(matchField(ctx({ labelText: 'Pay Expectation' }), profile)).toBe('$130,000'));
});

describe('Notice period', () => {
  it('matches label "Notice Period"',       () => expect(matchField(ctx({ labelText: 'Notice Period' }), profile)).toBe('2 weeks'));
  it('matches label "When can you start"',  () => expect(matchField(ctx({ labelText: 'When can you start?' }), profile)).toBe('2 weeks'));
  it('matches label "Available to start"',  () => expect(matchField(ctx({ labelText: 'Available to start' }), profile)).toBe('2 weeks'));
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('returns null for empty context',      () => expect(matchField(ctx(), profile)).toBeNull());
  it('returns null for hidden/unrelated',   () => expect(matchField(ctx({ name: 'csrf_token' }), profile)).toBeNull());
  it('returns null for "message" field',    () => expect(matchField(ctx({ labelText: 'Message to hiring manager' }), profile)).toBeNull());
  it('handles asterisk in label text',      () => expect(matchField(ctx({ labelText: 'Email *' }), profile)).toBe('sai@email.com'));
  it('handles parentheses in label',        () => expect(matchField(ctx({ labelText: 'Phone (optional)' }), profile)).toBe('+1 (555) 123-4567'));
  it('ignores label "Reference Name"',      () => expect(matchField(ctx({ labelText: 'Reference Name' }), profile)).toBeNull());
  it('ignores label "Manager Name"',        () => expect(matchField(ctx({ labelText: 'Manager Name' }), profile)).toBeNull());

  it('empty profile firstName still fills last', () => {
    const p = { ...profile, firstName: '' };
    expect(matchField(ctx({ labelText: 'Last Name' }), p)).toBe('Reddy');
  });

  it('location returns city only when state empty', () => {
    const p = { ...profile, state: '' };
    expect(matchField(ctx({ labelText: 'Location' }), p)).toBe('San Francisco');
  });
});

// ─── ATS-specific real-world field patterns ───────────────────────────────────

describe('Ashby ATS', () => {
  it('fills full name from Ashby combined label', () =>
    expect(matchField(ctx({ labelText: 'Full Name (First name + Last name) *' }), profile)).toBe('Sai Reddy'));
  it('fills phone from Ashby label',          () =>
    expect(matchField(ctx({ labelText: 'Phone number *' }), profile)).toBe('+1 (555) 123-4567'));
  it('fills email from Ashby label',          () =>
    expect(matchField(ctx({ labelText: 'Email *' }), profile)).toBe('sai@email.com'));
});

describe('Greenhouse ATS', () => {
  it('fills first_name field',                () => expect(matchField(ctx({ name: 'first_name' }), profile)).toBe('Sai'));
  it('fills last_name field',                 () => expect(matchField(ctx({ name: 'last_name' }), profile)).toBe('Reddy'));
  it('fills email field',                     () => expect(matchField(ctx({ name: 'email' }), profile)).toBe('sai@email.com'));
  it('fills phone field',                     () => expect(matchField(ctx({ name: 'phone' }), profile)).toBe('+1 (555) 123-4567'));
  it('fills linkedin urls[LinkedIn]',         () => expect(matchField(ctx({ name: 'urls[LinkedIn]' }), profile)).toBe('https://linkedin.com/in/saireddy'));
  it('fills github urls[GitHub]',             () => expect(matchField(ctx({ name: 'urls[GitHub]' }), profile)).toBe('https://github.com/saireddy'));
});

describe('Lever ATS', () => {
  it('fills name field',                      () => expect(matchField(ctx({ name: 'name' }), profile)).toBe('Sai Reddy'));
  it('fills email field',                     () => expect(matchField(ctx({ name: 'email' }), profile)).toBe('sai@email.com'));
  it('fills phone field',                     () => expect(matchField(ctx({ name: 'phone' }), profile)).toBe('+1 (555) 123-4567'));
  it('fills urls[LinkedIn]',                  () => expect(matchField(ctx({ name: 'urls[LinkedIn]' }), profile)).toBe('https://linkedin.com/in/saireddy'));
});

describe('Workday ATS', () => {
  it('fills via aria-label "First Name"',     () => expect(matchField(ctx({ ariaLabel: 'First Name' }), profile)).toBe('Sai'));
  it('fills via aria-label "Last Name"',      () => expect(matchField(ctx({ ariaLabel: 'Last Name' }), profile)).toBe('Reddy'));
  it('fills via aria-label "Email Address"',  () => expect(matchField(ctx({ ariaLabel: 'Email Address' }), profile)).toBe('sai@email.com'));
  it('fills via aria-label "Phone Number"',   () => expect(matchField(ctx({ ariaLabel: 'Phone Number' }), profile)).toBe('+1 (555) 123-4567'));
});

describe('LinkedIn Easy Apply', () => {
  it('fills via aria-label "First name"',     () => expect(matchField(ctx({ ariaLabel: 'First name' }), profile)).toBe('Sai'));
  it('fills via aria-label "Last name"',      () => expect(matchField(ctx({ ariaLabel: 'Last name' }), profile)).toBe('Reddy'));
  it('fills via aria-label "Email address"',  () => expect(matchField(ctx({ ariaLabel: 'Email address' }), profile)).toBe('sai@email.com'));
  it('fills via aria-label "Phone number"',   () => expect(matchField(ctx({ ariaLabel: 'Phone number' }), profile)).toBe('+1 (555) 123-4567'));
  it('fills via aria-label "City"',           () => expect(matchField(ctx({ ariaLabel: 'City' }), profile)).toBe('San Francisco'));
});
