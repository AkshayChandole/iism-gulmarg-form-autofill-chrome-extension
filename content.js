// Fills the IISM admission form. Course, level, schedule, state and date of birth
// trigger ASP.NET postbacks (which can reload the page), so the run is resumable:
// each step is skipped if already set, and a sessionStorage flag restarts the run
// after a reload.
const RUN_FLAG = 'iismAutofillRun';
const MAX_RUNS = 12;

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

async function waitFor(fn, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (fn()) return true;
    await sleep(50);
  }
  return false;
}

function fire(el, type) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

function pickOption(select, wanted) {
  const options = [...select.options].filter((o) => o.value !== '0');
  if (!wanted) return options[0];
  const w = norm(wanted);
  return options.find((o) => norm(o.text) === w) || options.find((o) => norm(o.text).includes(w));
}

// Returns true if the value was changed (a postback may follow).
function setSelect(id, wanted) {
  const el = $(id);
  const opt = el && pickOption(el, wanted);
  if (!opt || el.value === opt.value) return false;
  el.value = opt.value;
  fire(el, 'change');
  return true;
}

function setText(id, value) {
  const el = $(id);
  if (!el || !value || el.value === value) return;
  el.value = value;
  fire(el, 'input');
  fire(el, 'change');
}

function dataUrlToFile(f) {
  const [meta, b64] = f.data.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new File([bytes], f.name, { type: mime });
}

function setFile(id, f) {
  const el = $(id);
  if (!el || !f || (el.files && el.files.length)) return;
  const dt = new DataTransfer();
  dt.items.add(dataUrlToFile(f));
  el.files = dt.files;
  fire(el, 'change');
}

async function runAutofill() {
  const { profile = {} } = await chrome.storage.local.get('profile');
  if (!profile.name) {
    sessionStorage.removeItem(RUN_FLAG);
    return setStatus('Add your details first (extension icon → Edit my details)', 'error');
  }
  const runs = Number(sessionStorage.getItem(RUN_FLAG) || 0) + 1;
  if (runs > MAX_RUNS) {
    sessionStorage.removeItem(RUN_FLAG);
    return setStatus('Stopped after too many reloads — click AutoFill to retry', 'error');
  }
  sessionStorage.setItem(RUN_FLAG, String(runs));
  setStatus('Filling…');

  // Phase 1: dropdowns that rebuild the page.
  for (const step of CHAIN_SELECTS) {
    const changed = setSelect(step.id, profile[step.key]);
    if (changed && step.dependent) {
      // Partial postback: wait for the next dropdown to fill. A full reload ends this run
      // and the flag resumes it on the new page.
      await waitFor(() => $(step.dependent) && $(step.dependent).options.length > 1);
    } else if (changed) {
      await sleep(3000);
    }
  }

  // Date of birth also posts back.
  if (profile.dob && $('txtDateOfBirth').value !== profile.dob) {
    $('txtDateOfBirth').value = profile.dob;
    fire($('txtDateOfBirth'), 'change');
    await sleep(3000);
  }

  // Phase 2: no more postbacks, fill everything else.
  for (const f of TEXT_FIELDS) setText(f.id, profile[f.key]);
  for (const f of PLAIN_SELECTS) setSelect(f.id, profile[f.key]);
  const age = ageFromDob(profile.dob);
  for (const f of FILE_FIELDS) {
    if (f.key === 'parentSignature' && !(age !== null && age < 18)) continue; // only needed under 18
    setFile(f.id, (profile.files || {})[f.key]);
  }
  const agree = $('chkIAgree');
  if (agree && !agree.checked) agree.click();

  sessionStorage.removeItem(RUN_FLAG);
  setStatus('✓ Filled — review, then click Submit', 'ok');
}

let statusEl;
function setStatus(text, kind) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.display = text ? '' : 'none';
  statusEl.style.color = kind === 'ok' ? '#1a8f4c' : kind === 'error' ? '#c62828' : '#1c2430';
}

function addButton() {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:fixed;right:16px;bottom:16px;z-index:999999;font:14px sans-serif;display:flex;gap:8px;align-items:center;';
  const btn = document.createElement('button');
  btn.type = 'button'; // never submit the form
  btn.textContent = 'AutoFill';
  btn.style.cssText =
    'padding:12px 22px;background:#0a6cff;color:#fff;border:0;border-radius:8px;font:600 15px sans-serif;cursor:pointer;box-shadow:0 2px 8px #0004;';
  btn.addEventListener('click', () => {
    sessionStorage.removeItem(RUN_FLAG);
    runAutofill();
  });
  statusEl = document.createElement('span');
  statusEl.style.cssText =
    'background:#fff;padding:8px 12px;border-radius:8px;box-shadow:0 2px 8px #0003;max-width:320px;display:none;';
  wrap.append(statusEl, btn);
  document.body.appendChild(wrap);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'autofill') {
    sessionStorage.removeItem(RUN_FLAG);
    runAutofill();
  }
});

addButton();
(async () => {
  const { profile = {} } = await chrome.storage.local.get('profile');
  // Resume after a postback reload, or start automatically if enabled.
  if (sessionStorage.getItem(RUN_FLAG) || profile.autoRun) runAutofill();
})();
