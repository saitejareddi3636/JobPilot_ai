// Content script — injected into every tab.
// Uses the same matchField logic verified by 107 unit tests.
import { matchField } from './fieldMatcher';
import type { Profile, FieldContext } from './fieldMatcher';

const LOG = (...args: unknown[]) => console.log('[JobPilot]', ...args);

// ─── Migrate old profile shape (name/location → firstName/lastName/city/state) ─

function migrateProfile(raw: Record<string, unknown>): Profile {
  // If old shape (had a single "name" field), split it
  const legacyName = typeof raw.name === 'string' ? raw.name : '';
  const legacyLocation = typeof raw.location === 'string' ? raw.location : '';
  const parts = legacyName.trim().split(/\s+/);

  return {
    firstName:         typeof raw.firstName === 'string' ? raw.firstName : parts[0] ?? '',
    lastName:          typeof raw.lastName  === 'string' ? raw.lastName  : parts.slice(1).join(' ') ?? '',
    email:             typeof raw.email     === 'string' ? raw.email     : '',
    phone:             typeof raw.phone     === 'string' ? raw.phone     : '',
    city:              typeof raw.city      === 'string' ? raw.city      : legacyLocation.split(',')[0]?.trim() ?? '',
    state:             typeof raw.state     === 'string' ? raw.state     : legacyLocation.split(',')[1]?.trim() ?? '',
    zipCode:           typeof raw.zipCode   === 'string' ? raw.zipCode   : '',
    country:           typeof raw.country   === 'string' ? raw.country   : 'United States',
    currentTitle:      typeof raw.currentTitle      === 'string' ? raw.currentTitle      : '',
    yearsExperience:   typeof raw.yearsExperience   === 'number' ? raw.yearsExperience   : 0,
    workAuthorization: typeof raw.workAuthorization === 'string' ? raw.workAuthorization : '',
    salaryExpectation: typeof raw.salaryExpectation === 'string' ? raw.salaryExpectation : '',
    noticePeriod:      typeof raw.noticePeriod      === 'string' ? raw.noticePeriod      : '',
    linkedin:          typeof raw.linkedin  === 'string' ? raw.linkedin  : '',
    github:            typeof raw.github    === 'string' ? raw.github    : '',
    portfolio:         typeof raw.portfolio === 'string' ? raw.portfolio : '',
    twitter:           typeof raw.twitter   === 'string' ? raw.twitter   : '',
  };
}

// ─── Collect all context signals for an input ─────────────────────────────────

function buildContext(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FieldContext {
  function findLabelText(): string {
    // 1. <label for="id"> — most explicit signal
    if (el.id) {
      const linked = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (linked?.textContent?.trim()) return linked.textContent.trim();
    }

    // 2. aria-labelledby
    const lbId = el.getAttribute('aria-labelledby');
    if (lbId) {
      const texts = lbId.split(/\s+/)
        .map(id => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean);
      if (texts.length) return texts.join(' ');
    }

    // 3. Walk up the tree. At each level check PREVIOUS SIBLINGS for text content.
    //    This works on ALL ATS (Ashby, Greenhouse, Lever, Workday, iCIMS) regardless
    //    of class names, because the label is always the sibling that precedes the input.
    let node: Element | null = el;
    for (let depth = 0; depth < 6; depth++) {
      // Check previous siblings at this level
      let sib = node.previousElementSibling;
      while (sib) {
        const text = sib.textContent?.trim() ?? '';
        // Must have text, must be short (not another form field's container), must not contain an input
        if (text && text.length < 200 && !sib.querySelector('input, textarea, select')) {
          return text;
        }
        sib = sib.previousElementSibling;
      }
      if (!node.parentElement) break;
      node = node.parentElement;
    }

    // 4. Fallback: look for any <label> element in the nearest common ancestor
    let ancestor: Element | null = el.parentElement;
    for (let depth = 0; depth < 4 && ancestor; depth++) {
      const label = ancestor.querySelector('label');
      if (label && !label.contains(el) && label.textContent?.trim()) {
        return label.textContent.trim();
      }
      ancestor = ancestor.parentElement;
    }

    return '';
  }

  return {
    name:         el.name ?? '',
    id:           el.id ?? '',
    placeholder:  el.getAttribute('placeholder') ?? '',
    autocomplete: el.getAttribute('autocomplete') ?? '',
    ariaLabel:    el.getAttribute('aria-label') ?? '',
    labelText:    findLabelText(),
    type:         (el as HTMLInputElement).type ?? 'text',
  };
}

// ─── Fill a single element (React / Vue / Angular safe) ───────────────────────

function fillElement(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  el.focus();

  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;

  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('blur',  { bubbles: true }));
}

// ─── Selector (deduped) ───────────────────────────────────────────────────────

const SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=image]), textarea, select';

function getFields() {
  const seen = new Set<Element>();
  return Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(SEL),
  ).filter(el => {
    if (seen.has(el)) return false;
    seen.add(el);
    return !el.disabled && !(el as HTMLInputElement).readOnly;
  });
}

// ─── Fill / detect ────────────────────────────────────────────────────────────

function fillForm(profile: Profile): number {
  const fields = getFields();
  LOG(`Found ${fields.length} total input elements on page`);

  let filled = 0;
  for (const el of fields) {
    const ctx = buildContext(el);
    const value = matchField(ctx, profile);

    LOG(`Field: name="${ctx.name}" id="${ctx.id}" label="${ctx.labelText}" aria="${ctx.ariaLabel}" placeholder="${ctx.placeholder}" → ${value ?? 'NO MATCH'}`);

    if (!value) continue;

    fillElement(el, value);
    el.style.outline       = '2px solid #7c3aed';
    el.style.outlineOffset = '2px';
    el.style.borderRadius  = '4px';
    filled++;
  }

  LOG(`Filled ${filled}/${fields.length} fields`);
  return filled;
}

function detectFields(profile: Profile): number {
  return getFields().filter(el => matchField(buildContext(el), profile) !== null).length;
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'DETECT_FIELDS') {
    chrome.storage.local.get('jobpilot_profile', ({ jobpilot_profile }) => {
      if (!jobpilot_profile) {
        LOG('No profile saved in chrome.storage');
        sendResponse({ count: 0 });
        return;
      }
      const profile = migrateProfile(jobpilot_profile as Record<string, unknown>);
      LOG('Profile loaded:', profile);
      sendResponse({ count: detectFields(profile) });
    });
    return true;
  }

  if (msg.type === 'FILL_FORM') {
    chrome.storage.local.get('jobpilot_profile', ({ jobpilot_profile }) => {
      if (!jobpilot_profile) {
        LOG('No profile — cannot fill');
        sendResponse({ ok: false });
        return;
      }
      const profile = migrateProfile(jobpilot_profile as Record<string, unknown>);
      LOG('Filling with profile:', profile);
      const filled = fillForm(profile);
      sendResponse({ ok: true, filled });
    });
    return true;
  }
});
