const root = document.getElementById('root');
const statusEl = document.getElementById('status');
const fillMsg = document.getElementById('fillMsg');
let profile = { files: {} };
let saveTimer;

const VALIDATORS = {
  dob: [/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Use dd/MM/yyyy, e.g. 25/12/1995'],
  mobile: [/^(\d{10})?$/, 'Must be 10 digits'],
  pincode: [/^(\d{6})?$/, 'Must be 6 digits'],
  emergencyPhone: [/^(\d{10})?$/, 'Must be 10 digits'],
  email: [/^([^@\s]+@[^@\s]+\.[^@\s]+)?$/, 'Enter a valid email'],
};

const kb = (n) => (n < 1024 * 1024 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB');

function flash(text) {
  statusEl.textContent = text;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => (statusEl.textContent = ''), 2000);
}

async function save() {
  await chrome.storage.local.set({ profile });
  flash('✓ Saved');
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

function card(title, desc, cls) {
  const c = document.createElement('section');
  c.className = 'card';
  c.innerHTML = `<h2></h2><p></p><div class="grid"></div>`;
  if (cls) c.querySelector('.grid').classList.add(cls);
  c.querySelector('h2').textContent = title;
  c.querySelector('p').textContent = desc;
  root.appendChild(c);
  return c.querySelector('.grid');
}

function wrap(label, control, hint, key) {
  const l = document.createElement('label');
  const s = document.createElement('span');
  s.textContent = label;
  if (REQUIRED_KEYS.includes(key) || key === 'parentSignature') {
    const star = document.createElement('b');
    star.className = 'star';
    star.textContent = ' *';
    star.dataset.for = key;
    star.hidden = key === 'parentSignature';
    s.appendChild(star);
  }
  l.append(s, control);
  if (hint) {
    const h = document.createElement('div');
    h.className = 'hint';
    h.textContent = hint;
    l.appendChild(h);
  }
  return l;
}

function bindValue(el, key) {
  el.dataset.key = key;
  el.addEventListener('input', () => {
    profile[key] = el.value.trim();
    const v = VALIDATORS[key];
    const bad = v && !v[0].test(profile[key]);
    el.classList.toggle('invalid', !!bad);
    const hint = el.parentElement.querySelector('.hint');
    if (v && hint) {
      hint.textContent = bad ? v[1] : hint.dataset.default || '';
      hint.classList.toggle('error', !!bad);
    }
    if (key === 'dob') updateParentStar();
    queueSave();
  });
}

function updateParentStar() {
  const star = document.querySelector('.star[data-for="parentSignature"]');
  if (!star) return;
  const age = ageFromDob(profile.dob);
  star.hidden = !(age !== null && age < 18);
}

function textField(grid, key, label, hint) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = profile[key] || '';
  const l = wrap(label, input, hint, key);
  const h = l.querySelector('.hint');
  if (h) h.dataset.default = hint;
  bindValue(input, key);
  grid.appendChild(l);
}

function selectField(grid, f) {
  const sel = document.createElement('select');
  for (const o of ['', ...f.options]) sel.add(new Option(o || '— select —', o));
  sel.value = profile[f.key] || '';
  bindValue(sel, f.key);
  sel.addEventListener('change', () => { profile[f.key] = sel.value; queueSave(); });
  grid.appendChild(wrap(f.label, sel, undefined, f.key));
}

function fileField(grid, f) {
  const row = document.createElement('div');
  row.className = 'file-row';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jpg,.jpeg,.png,image/jpeg,image/png';
  const name = document.createElement('span');
  name.className = 'name';
  const pick = document.createElement('button');
  pick.type = 'button';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'link';
  remove.textContent = 'Remove';
  row.append(input, name, pick, remove);

  const render = (err) => {
    const saved = profile.files[f.key];
    row.classList.toggle('has', !!saved && !err);
    row.classList.toggle('err', !!err);
    name.textContent = err || (saved ? `✓ ${saved.name} (${kb(saved.size)})` : 'No file saved');
    pick.textContent = saved ? 'Replace' : 'Choose file';
    remove.hidden = !saved;
  };

  pick.addEventListener('click', () => input.click());
  remove.addEventListener('click', () => {
    delete profile.files[f.key];
    input.value = '';
    render();
    save();
  });
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    if (!FILE_RULES.types.includes(file.type)) return render(`${file.name}: only .jpg, .jpeg or .png allowed`);
    if (file.size > FILE_RULES.maxBytes) return render(`${file.name} is ${kb(file.size)} — max is 500 KB`);
    const reader = new FileReader();
    reader.onload = async () => {
      profile.files[f.key] = { name: file.name, size: file.size, data: reader.result };
      await save();
      render();
    };
    reader.readAsDataURL(file);
  });
  render();
  const l = wrap(f.label, row, f.key === 'parentSignature' ? 'Required only if the participant is under 18' : undefined, f.key);
  grid.appendChild(l);
}

(async () => {
  profile = {
    files: {}, course: 'Snow Skiing Courses at Gulmarg', nationality: 'Indian',
    ...((await chrome.storage.local.get('profile')).profile || {}),
  };
  profile.files = profile.files || {};
  const by = (list, key) => list.find((x) => x.key === key);

  let g = card('Course', 'Matched by text against the options on the form. Leave level and schedule blank to pick the first available.');
  textField(g, 'course', 'Course', 'e.g. Snow Skiing Courses at Gulmarg');
  textField(g, 'level', 'Course level', 'Blank = first available');
  textField(g, 'schedule', 'Schedule', 'Part of the date range, blank = first available');

  g = card('Personal', 'Basic details as they appear on your documents.');
  for (const k of ['name', 'fatherName']) textField(g, k, by(TEXT_FIELDS, k).label);
  textField(g, 'dob', 'Date of birth', 'dd/MM/yyyy');
  textField(g, 'nationality', 'Nationality');
  textField(g, 'domicile', 'Domicile');
  textField(g, 'state', 'State', 'Matched by text, e.g. Maharashtra');

  g = card('Contact and address', '');
  for (const k of ['house', 'street', 'city']) textField(g, k, by(TEXT_FIELDS, k).label);
  textField(g, 'pincode', 'PIN code', '6 digits');
  textField(g, 'mobile', 'Mobile', 'Leave blank to keep the number from the link');
  textField(g, 'email', 'Email', 'name@example.com');

  g = card('Health and fitness', '');
  PLAIN_SELECTS.forEach((f) => selectField(g, f));
  for (const k of ['bloodGroup', 'medicalCategory', 'height', 'weight', 'waist', 'shoeSize'])
    textField(g, k, by(TEXT_FIELDS, k).label);

  g = card('Emergency contact', '');
  textField(g, 'emergencyName', 'Name');
  textField(g, 'emergencyPhone', 'Phone', '10 digits');

  g = card('Documents', 'Only .jpg, .jpeg or .png, each under 500 KB. Files are stored in this browser only.', 'files');
  FILE_FIELDS.forEach((f) => fileField(g, f));
  updateParentStar();

  const autoRun = document.getElementById('autoRun');
  autoRun.checked = !!profile.autoRun;
  autoRun.addEventListener('change', () => { profile.autoRun = autoRun.checked; queueSave(); });
})();

function showFillMsg(text, kind) {
  fillMsg.textContent = text;
  fillMsg.className = kind;
  clearTimeout(showFillMsg.t);
  showFillMsg.t = setTimeout(() => { fillMsg.textContent = ''; fillMsg.className = ''; }, 4000);
}

document.getElementById('fill').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.tabs.sendMessage(tab.id, 'autofill');
    showFillMsg('Filling… check the form.', 'ok');
  } catch {
    showFillMsg('Open the admission form in this tab first (reload it if already open).', 'error');
  }
});
