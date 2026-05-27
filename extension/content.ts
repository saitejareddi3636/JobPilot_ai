// Content script — injected into every job page.
// Listens for FILL_FORM messages from the popup and fills matched fields.

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  workAuthorization: string;
  yearsExperience: number;
}

// ─── Field matching ───────────────────────────────────────────────────────────

function getFieldValue(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, profile: Profile): string | null {
  const attr = [
    input.name,
    input.id,
    input.getAttribute('autocomplete') ?? '',
    input.getAttribute('placeholder') ?? '',
    input.getAttribute('aria-label') ?? '',
    input.closest('label')?.textContent ?? '',
    input.closest('[class*="field"]')?.querySelector('label')?.textContent ?? '',
  ].join(' ').toLowerCase();

  const firstName = profile.name.split(' ')[0] ?? '';
  const lastName  = profile.name.split(' ').slice(1).join(' ') ?? '';

  // Name variants
  if (/\bfirst[\s_-]?name\b|fname\b|given[\s_-]?name/.test(attr)) return firstName;
  if (/\blast[\s_-]?name\b|lname\b|surname\b|family[\s_-]?name/.test(attr)) return lastName;
  if (/\bfull[\s_-]?name\b|\byour[\s_-]?name\b/.test(attr)) return profile.name;
  if (/\bname\b/.test(attr) && !/company|org|school|university|employer/.test(attr)) return profile.name;

  // Contact
  if (/\bemail\b/.test(attr)) return profile.email;
  if (/\bphone\b|\bmobile\b|\btel\b|\bcell\b/.test(attr)) return profile.phone;

  // Location
  if (/\bcity\b|\blocation\b|\baddress\b/.test(attr) && !/street|line[12]|apt/.test(attr)) return profile.location;

  // Links
  if (/linkedin/.test(attr)) return profile.linkedin;
  if (/github/.test(attr)) return profile.github;
  if (/portfolio|personal\s*site|website|url/.test(attr) && !/linkedin|github|company/.test(attr)) return profile.portfolio;

  // Work auth / visa
  if (/work[\s_-]?auth|authorized|visa|sponsorship/.test(attr)) return profile.workAuthorization;

  // Years of experience
  if (/years?[\s_-]?(of[\s_-]?)?exp/.test(attr)) return String(profile.yearsExperience);

  return null;
}

// ─── Fill a single element ────────────────────────────────────────────────────

function fillElement(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  // React / Vue track value via nativeInputValueSetter
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value',
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  // Dispatch events so framework state updates
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// ─── Main fill function ───────────────────────────────────────────────────────

function fillForm(profile: Profile): { filled: number; skipped: number } {
  const selectors = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select';
  const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selectors));

  let filled = 0;
  let skipped = 0;

  for (const el of fields) {
    if ((el as HTMLInputElement).readOnly || el.disabled) { skipped++; continue; }

    const value = getFieldValue(el, profile);
    if (!value) { skipped++; continue; }

    fillElement(el, value);
    el.style.outline = '2px solid #7c3aed';
    el.style.outlineOffset = '1px';
    filled++;
  }

  return { filled, skipped };
}

// ─── Count detectable fields ─────────────────────────────────────────────────

function detectFields(profile: Profile): number {
  const selectors = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select';
  const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selectors));
  return fields.filter(el => !el.disabled && !(el as HTMLInputElement).readOnly && getFieldValue(el, profile) !== null).length;
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
      if (!jobpilot_profile) { sendResponse({ ok: false, error: 'No profile saved' }); return; }
      const result = fillForm(jobpilot_profile as Profile);
      sendResponse({ ok: true, ...result });
    });
    return true;
  }
});
