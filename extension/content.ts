// Content script — injected into every tab.
// Uses the same matchField logic verified by 107 unit tests.
import { matchField } from './fieldMatcher';
import type { Profile, FieldContext } from './fieldMatcher';

// ─── Collect all context signals for an input ─────────────────────────────────

function buildContext(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FieldContext {
  // Walk up to find the nearest label that is NOT an ancestor of this input
  function findLabelText(): string {
    // 1. <label for="id">
    if (el.id) {
      const linked = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (linked?.textContent?.trim()) return linked.textContent.trim();
    }

    // 2. aria-labelledby → referenced element text
    const lbId = el.getAttribute('aria-labelledby');
    if (lbId) {
      const texts = lbId.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
      if (texts.length) return texts.join(' ');
    }

    // 3. Walk up DOM — find first label/legend/heading that is a sibling or parent-container descendant
    let node: Element | null = el.parentElement;
    for (let depth = 0; depth < 8 && node; depth++) {
      const candidates = Array.from(
        node.querySelectorAll('label, legend, [class*="label" i], [class*="Label"]'),
      ).filter(candidate => !candidate.contains(el));

      if (candidates.length > 0) {
        return candidates[candidates.length - 1].textContent?.trim() ?? '';
      }
      node = node.parentElement;
    }

    // 4. Immediately preceding sibling text node or element
    const prev = el.previousElementSibling;
    if (prev?.textContent?.trim()) return prev.textContent.trim();

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

  ['input', 'change', 'keyup', 'blur'].forEach(type =>
    el.dispatchEvent(new Event(type, { bubbles: true })),
  );
}

// ─── Fill / detect ────────────────────────────────────────────────────────────

const SEL = [
  'input:not([type=hidden]):not([type=submit]):not([type=button])',
  'input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=image])',
  'textarea',
  'select',
].join(', ');

// Deduplicate selector — querySelectorAll with comma selectors can return dupes
function getFields(root: Document | Element = document) {
  const seen = new Set<Element>();
  return Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(SEL))
    .filter(el => {
      if (seen.has(el)) return false;
      seen.add(el);
      return !el.disabled && !(el as HTMLInputElement).readOnly;
    });
}

function fillForm(profile: Profile): number {
  let filled = 0;
  for (const el of getFields()) {
    const value = matchField(buildContext(el), profile);
    if (!value) continue;
    fillElement(el, value);
    el.style.outline       = '2px solid #7c3aed';
    el.style.outlineOffset = '2px';
    el.style.borderRadius  = '4px';
    filled++;
  }
  return filled;
}

function detectFields(profile: Profile): number {
  return getFields().filter(el => matchField(buildContext(el), profile) !== null).length;
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
