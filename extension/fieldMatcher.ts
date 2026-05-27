// Pure field-matching logic — no DOM access, fully testable.

export interface Profile {
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

export interface FieldContext {
  name: string;       // input[name]
  id: string;         // input[id]
  placeholder: string;
  autocomplete: string;
  ariaLabel: string;
  labelText: string;  // nearest <label> text content
  type: string;       // input[type]
}

export function matchField(ctx: FieldContext, profile: Profile): string | null {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // Combine all context into one searchable string (lowercase)
  const all = [
    ctx.name,
    ctx.id,
    ctx.placeholder,
    ctx.autocomplete,
    ctx.ariaLabel,
    ctx.labelText,
  ].join(' ').toLowerCase().replace(/[*()[\]]/g, ' ');

  if (!all.trim()) return null;

  // ── Name ─────────────────────────────────────────────────────────────────────
  // Check full-name patterns BEFORE first/last so "Full Name (First name + Last name)" → fullName
  if (/full[\s_\-.]?name|your[\s_\-.]?name|applicant[\s_\-.]?name|legal[\s_\-.]?name/.test(all))
    return fullName;

  if (/\bfirst[\s_\-.]?name|fname\b|given[\s_\-.]?name|forename/.test(all))
    return profile.firstName;

  if (/\blast[\s_\-.]?name|lname\b|surname|family[\s_\-.]?name/.test(all))
    return profile.lastName;

  // Bare "name" field that isn't about a company, org, school, or manager
  if (/\bname\b/.test(all) && !/company|org\b|organi[sz]|school|university|college|employer|manager|recruiter|reference|contact/.test(all))
    return fullName;

  // ── Contact ───────────────────────────────────────────────────────────────────
  if (/\bemail\b/.test(all)) return profile.email;
  if (/\bphone|\bmobile|\btel\b|telephone|\bcell\b/.test(all)) return profile.phone;

  // ── Location ──────────────────────────────────────────────────────────────────
  if (/\bcity\b/.test(all) && !/new york city|city of/.test(all)) return profile.city;
  if (/\bstate\b|\bprovince\b|\bregion\b/.test(all) && !/united states|work state/.test(all)) return profile.state;
  if (/\bzip|postal|postcode/.test(all)) return profile.zipCode;
  if (/\bcountry\b/.test(all)) return profile.country;
  if (/\blocation\b/.test(all) && !/job location|work location|remote|office/.test(all))
    return `${profile.city}, ${profile.state}`.replace(/^,\s*|,\s*$/, '');

  // ── Links ─────────────────────────────────────────────────────────────────────
  if (/linkedin/.test(all)) return profile.linkedin;
  if (/\bgithub\b/.test(all)) return profile.github;
  if (/\btwitter\b|\btwitterurl\b/.test(all)) return profile.twitter;
  if (/portfolio|personal[\s_\-.]?site|personal[\s_\-.]?url|website|web[\s_\-.]?page/.test(all)
    && !/linkedin|github|company|employer/.test(all))
    return profile.portfolio;

  // ── Experience / role ─────────────────────────────────────────────────────────
  if (/work[\s_\-.]?auth|authorized[\s_\-.]?to[\s_\-.]?work|visa[\s_\-.]?status|sponsorship|right[\s_\-.]?to[\s_\-.]?work/.test(all))
    return profile.workAuthorization;

  if (/years?[\s_\-.]?(of[\s_\-.]?)?exp(erience)?/.test(all))
    return String(profile.yearsExperience);

  if (/current[\s_\-.]?(job[\s_\-.]?)?title|current[\s_\-.]?role|current[\s_\-.]?position|job[\s_\-.]?title/.test(all)
    && !/applying|seeking|desired|position[\s_\-.]?applying/.test(all))
    return profile.currentTitle;

  if (/salary|compensation|pay[\s_\-.]?expect|desired[\s_\-.]?pay/.test(all))
    return profile.salaryExpectation;

  if (/notice[\s_\-.]?period|when[\s_\-.]?(can|could)[\s_\-.]?you[\s_\-.]?start|available[\s_\-.]?to[\s_\-.]?start|start[\s_\-.]?date/.test(all))
    return profile.noticePeriod;

  return null;
}
