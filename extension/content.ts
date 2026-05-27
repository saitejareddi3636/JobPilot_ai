// Content script — injected into every tab.
// Listens for FILL_FORM / DETECT_FIELDS messages from the popup.

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  currentTitle: string;
  yearsExperience: number;
  workAuthorization: string;
  salaryExpectation: string;
  noticePeriod: string;
  linkedin: string;
  github: string;
  portfolio: string;
  twitter: string;
}

// ─── Field matching ───────────────────────────────────────────────────────────

function getFieldValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, p: Profile): string | null {
  // Walk up the DOM to find the closest label text (handles Ashby, Greenhouse, Lever)
  function nearestLabel(node: Element): string {
    let cur: Element | null = node;
    for (let i = 0; i < 6; i++) {
      if (!cur) break;
      const label = cur.querySelector('label, [class*="label"], [class*="Label"]');
      if (label?.textContent) return label.textContent;
      cur = cur.parentElement;
    }
    // Also check for a <label for="id"> pointing at this element
    if (el.id) {
      const linked = document.querySelector(`label[for="${el.id}"]`);
      if (linked?.textContent) return linked.textContent;
    }
    return '';
  }

  const ctx = [
    el.name,
    el.id,
    el.getAttribute('autocomplete') ?? '',
    el.getAttribute('placeholder') ?? '',
    el.getAttribute('aria-label') ?? '',
    el.getAttribute('aria-labelledby')
      ? document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent ?? ''
      : '',
    nearestLabel(el),
    el.getAttribute('data-field-type') ?? '',
    el.getAttribute('data-qa') ?? '',
    el.getAttribute('data-testid') ?? '',
  ].join(' ').toLowerCase();

  const fullName = `${p.firstName} ${p.lastName}`.trim();

  // ── Name ──
  if (/\bfirst[\s_-]?name\b|fname\b|given[\s_-]?name\b|forename/.test(ctx))   return p.firstName;
  if (/\blast[\s_-]?name\b|lname\b|surname\b|family[\s_-]?name\b/.test(ctx))  return p.lastName;
  if (/\bfull[\s_-]?name\b|\byour[\s_-]?name\b|\bapplicant[\s_-]?name/.test(ctx)) return fullName;
  if (/\bname\b/.test(ctx) && !/company|org|school|university|employer|manager|recruiter/.test(ctx)) return fullName;

  // ── Contact ──
  if (/\bemail\b/.test(ctx)) return p.email;
  if (/\bphone\b|\bmobile\b|\btel\b|\bcell\b/.test(ctx)) return p.phone;

  // ── Location ──
  if (/\bcity\b/.test(ctx))     return p.city;
  if (/\bstate\b|\bprovince\b/.test(ctx)) return p.state;
  if (/\bzip\b|\bpostal\b/.test(ctx))     return p.zipCode;
  if (/\bcountry\b/.test(ctx))  return p.country;
  if (/\blocation\b/.test(ctx) && !/job|work|remote/.test(ctx)) return `${p.city}, ${p.state}`;

  // ── Links ──
  if (/linkedin/.test(ctx))   return p.linkedin;
  if (/github/.test(ctx))     return p.github;
  if (/\btwitter\b|\btwitterurl\b/.test(ctx)) return p.twitter;
  if (/portfolio|personal[\s_-]?site|website|personal[\s_-]?url/.test(ctx) && !/linkedin|github|company/.test(ctx)) return p.portfolio;

  // ── Experience / work ──
  if (/work[\s_-]?auth|authorized[\s_-]?to[\s_-]?work|visa|sponsorship/.test(ctx)) return p.workAuthorization;
  if (/years?[\s_-]?(of[\s_-]?)?exp/.test(ctx)) return String(p.yearsExperience);
  if (/\btitle\b|current[\s_-]?role|current[\s_-]?position/.test(ctx) && !/job[\s_-]?title[\s_-]?(applied|seeking)/.test(ctx)) return p.currentTitle;
  if (/salary|compensation|pay[\s_-]?expect/.test(ctx)) return p.salaryExpectation;
  if (/notice[\s_-]?period|start[\s_-]?date|available[\s_-]?to[\s_-]?start/.test(ctx)) return p.noticePeriod;

  return null;
}

// ─── Fill single element ──────────────────────────────────────────────────────

function fillElement(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;

  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
}

// ─── Fill / detect ────────────────────────────────────────────────────────────

const SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=image]), textarea, select';

function fillForm(p: Profile) {
  let filled = 0;
  for (const el of Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(SEL))) {
    if (el.disabled || (el as HTMLInputElement).readOnly) continue;
    const value = getFieldValue(el, p);
    if (!value) continue;
    fillElement(el, value);
    el.style.outline       = '2px solid #7c3aed';
    el.style.outlineOffset = '2px';
    el.style.borderRadius  = '4px';
    filled++;
  }
  return filled;
}

function detectFields(p: Profile): number {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(SEL))
    .filter(el => !el.disabled && !(el as HTMLInputElement).readOnly && getFieldValue(el, p) !== null)
    .length;
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'DETECT_FIELDS') {
    chrome.storage.local.get('jobpilot_profile', ({ jobpilot_profile }) => {
      if (!jobpilot_profile) { sendResponse({ count: 0 }); return; }
      sendResponse({ count: detectFields(jobpilot_profile as Profile) });
    });
    return true;
  }

  if (msg.type === 'FILL_FORM') {
    chrome.storage.local.get('jobpilot_profile', ({ jobpilot_profile }) => {
      if (!jobpilot_profile) { sendResponse({ ok: false }); return; }
      const filled = fillForm(jobpilot_profile as Profile);
      sendResponse({ ok: true, filled });
    });
    return true;
  }
});
